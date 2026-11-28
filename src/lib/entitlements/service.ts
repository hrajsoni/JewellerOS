import { Prisma, PrismaClient, SubscriptionStatus, BillingInterval } from "@prisma/client";
import prisma from "@/lib/prisma";
import { FeatureAccessResult, ResourceLimitResult, BusinessEntitlementSummary } from "./types";
import { validatePromoCode, redeemPromoCode } from "@/lib/promo/service";
import { executeAndPropagateEvent } from "@/lib/events/propagationEngine";

/**
 * Retrieves the current active or trialing subscription for a business.
 */
export async function getBusinessSubscription(
  businessId: string,
  dbClient: Prisma.TransactionClient | PrismaClient = prisma
) {
  const sub = await dbClient.businessSubscription.findFirst({
    where: { businessId },
    include: {
      plan: {
        include: { entitlements: true },
      },
      addons: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!sub) return null;

  // Auto-evaluate trial expiration
  const now = new Date();
  if (sub.status === SubscriptionStatus.TRIALING && sub.trialEndsAt && now > sub.trialEndsAt) {
    return {
      ...sub,
      status: SubscriptionStatus.EXPIRED,
      isExpiredTrial: true,
    };
  }

  return sub;
}

/**
 * Checks whether a business is entitled to use a specific feature module.
 */
export async function checkFeatureAccess(
  businessId: string,
  featureKey: string,
  dbClient: Prisma.TransactionClient | PrismaClient = prisma
): Promise<FeatureAccessResult> {
  // 1. Check direct merchant override (highest precedence)
  const now = new Date();
  const override = await dbClient.entitlementOverride.findFirst({
    where: {
      businessId,
      featureKey,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  if (override && override.enabled !== null) {
    if (!override.enabled) {
      return {
        allowed: false,
        featureKey,
        reason: `Feature access restricted by platform administration: ${override.reason}`,
      };
    }
    return { allowed: true, featureKey };
  }

  // 2. Fetch Subscription and Plan
  const sub = await getBusinessSubscription(businessId, dbClient);

  if (!sub) {
    return {
      allowed: false,
      featureKey,
      reason: "No active subscription found for this business. Please choose a plan.",
    };
  }

  if (sub.status === SubscriptionStatus.SUSPENDED) {
    return {
      allowed: false,
      featureKey,
      reason: "Showroom account is currently suspended. Please contact JewelBill Support.",
      subscriptionStatus: sub.status,
    };
  }

  if (sub.status === SubscriptionStatus.EXPIRED || sub.status === SubscriptionStatus.CANCELLED) {
    return {
      allowed: false,
      featureKey,
      reason: "Subscription has expired. Historical records remain accessible in read-only mode.",
      subscriptionStatus: sub.status,
    };
  }

  // 3. Check Plan Entitlement
  const ent = sub.plan.entitlements.find((e) => e.featureKey === featureKey);

  if (!ent || !ent.enabled) {
    return {
      allowed: false,
      featureKey,
      reason: `Feature '${featureKey}' is not included in the ${sub.plan.name} plan. Upgrade to unlock.`,
      requiredPlan: "Growth",
      subscriptionStatus: sub.status,
    };
  }

  return { allowed: true, featureKey, subscriptionStatus: sub.status };
}

/**
 * Checks whether a business can consume an additional unit of a metered resource.
 */
export async function checkUsageLimit(
  businessId: string,
  metricKey: string,
  requestedDelta = 1,
  dbClient: Prisma.TransactionClient | PrismaClient = prisma
): Promise<ResourceLimitResult> {
  const now = new Date();

  // 1. Check override limit
  const override = await dbClient.entitlementOverride.findFirst({
    where: {
      businessId,
      featureKey: metricKey,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const sub = await getBusinessSubscription(businessId, dbClient);
  const planEnt = sub?.plan.entitlements.find((e) => e.featureKey === metricKey);

  let limit = override?.limitValue ?? planEnt?.limitValue ?? 0;
  const unit = planEnt?.unit || "units";

  // Add applicable add-ons (e.g. EXTRA_STAFF, EXTRA_BRANCH)
  if (sub?.addons) {
    for (const addon of sub.addons) {
      if (metricKey === "limit.staff_seats" && addon.addonType === "EXTRA_STAFF") {
        limit += addon.quantity;
      } else if (metricKey === "limit.branches" && addon.addonType === "EXTRA_BRANCH") {
        limit += addon.quantity;
      } else if (metricKey === "limit.storage_mb" && addon.addonType === "EXTRA_STORAGE") {
        limit += addon.quantity * 1024; // GB to MB
      }
    }
  }

  // 2. Query Current Real-time Consumption from Database
  let current = 0;
  switch (metricKey) {
    case "limit.staff_seats":
      current = await dbClient.user.count({
        where: { businessId, isActive: true },
      });
      break;

    case "limit.branches":
      current = await dbClient.branch.count({
        where: { businessId },
      });
      break;

    case "limit.stock_items":
      current = await dbClient.stockItem.count({
        where: { businessId, status: { not: "SOLD" } },
      });
      break;

    case "limit.storage_mb": {
      const agg = await dbClient.mediaAsset.aggregate({
        where: { businessId },
        _sum: { fileSize: true },
      });
      current = Math.ceil(Number(agg._sum.fileSize || 0) / (1024 * 1024));
      break;
    }

    case "limit.monthly_invoices": {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      current = await dbClient.invoice.count({
        where: { businessId, createdAt: { gte: startOfMonth } },
      });
      break;
    }

    default:
      current = 0;
  }

  const remaining = Math.max(0, limit - current);
  const allowed = current + requestedDelta <= limit;

  return {
    allowed,
    metricKey,
    current,
    limit,
    remaining,
    unit,
    reason: allowed
      ? undefined
      : `Allowance limit reached (${current}/${limit} ${unit}). Please upgrade your plan or purchase an add-on.`,
  };
}

/**
 * Returns a comprehensive entitlement summary snapshot for merchant UI and admin dashboards.
 */
export async function getBusinessEntitlementSummary(
  businessId: string,
  dbClient: Prisma.TransactionClient | PrismaClient = prisma
): Promise<BusinessEntitlementSummary> {
  const biz = await dbClient.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });

  const sub = await getBusinessSubscription(businessId, dbClient);

  const now = new Date();
  let daysRemaining = 0;
  if (sub?.status === SubscriptionStatus.TRIALING && sub.trialEndsAt) {
    daysRemaining = Math.max(
      0,
      Math.ceil((new Date(sub.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  } else if (sub?.currentPeriodEnd) {
    daysRemaining = Math.max(
      0,
      Math.ceil((new Date(sub.currentPeriodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );
  }

  // Evaluate common features
  const commonFeatures = [
    "module.pos",
    "module.inventory",
    "module.barcode",
    "module.metal_rates",
    "module.accounts",
    "module.customers",
    "module.girvi",
    "module.karigar",
    "module.consignment",
    "module.wholesale",
    "module.advanced_reports",
    "module.multi_branch",
  ];

  const features: Record<string, boolean> = {};
  for (const f of commonFeatures) {
    const res = await checkFeatureAccess(businessId, f, dbClient);
    features[f] = res.allowed;
  }

  // Evaluate common limits
  const commonLimits = [
    "limit.staff_seats",
    "limit.branches",
    "limit.stock_items",
    "limit.storage_mb",
    "limit.monthly_invoices",
  ];

  const limits: BusinessEntitlementSummary["limits"] = {};
  for (const m of commonLimits) {
    const res = await checkUsageLimit(businessId, m, 0, dbClient);
    const percentage = res.limit > 0 ? Math.min(100, Math.round((res.current / res.limit) * 100)) : 0;
    limits[m] = {
      current: res.current,
      limit: res.limit,
      remaining: res.remaining,
      unit: res.unit,
      percentage,
    };
  }

  const overridesCount = await dbClient.entitlementOverride.count({
    where: {
      businessId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  return {
    businessId,
    businessName: biz?.name || "Jewellery Showroom",
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          billingInterval: sub.billingInterval,
          planName: sub.plan.name,
          planSlug: sub.plan.slug,
          trialEndsAt: sub.trialEndsAt?.toISOString() || null,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || null,
          isTrial: sub.status === SubscriptionStatus.TRIALING,
          daysRemaining,
        }
      : null,
    features,
    limits,
    overridesCount,
  };
}

/**
 * Atomically upgrades a business subscription with promo code validation,
 * payment recording, and cross-system propagation.
 */
export async function applyPlanUpgrade(params: {
  businessId: string;
  targetPlanSlugOrId: string;
  billingInterval?: BillingInterval;
  promoCode?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  actorType?: "MERCHANT" | "PLATFORM_ADMIN" | "WEBHOOK";
  actorId?: string;
}) {
  const {
    businessId,
    targetPlanSlugOrId,
    billingInterval = BillingInterval.MONTHLY,
    promoCode,
    paymentMethod = "UPI",
    referenceNumber,
    actorType = "MERCHANT",
    actorId,
  } = params;

  return await prisma.$transaction(async (tx) => {
    // 1. Fetch target Plan
    const plan = await tx.plan.findFirst({
      where: {
        OR: [{ id: targetPlanSlugOrId }, { slug: targetPlanSlugOrId }],
      },
    });

    if (!plan) {
      throw new Error("Target plan does not exist.");
    }

    // 2. Determine Base Price
    let basePrice = Number(plan.monthlyPrice);
    if (billingInterval === BillingInterval.YEARLY && plan.yearlyPrice) {
      basePrice = Number(plan.yearlyPrice);
    } else if (billingInterval === BillingInterval.QUARTERLY && plan.quarterlyPrice) {
      basePrice = Number(plan.quarterlyPrice);
    }

    // 3. Validate Promo Code if provided
    let discountAmount = 0;
    let promoRecordId: string | undefined = undefined;

    if (promoCode && promoCode.trim()) {
      const validation = await validatePromoCode(promoCode, plan.slug, basePrice, tx);
      if (!validation.valid) {
        throw new Error(validation.error || "Invalid promo code.");
      }
      discountAmount = validation.discountAmount || 0;
      promoRecordId = validation.promoCodeId;
      if (promoRecordId) {
        await redeemPromoCode(promoRecordId, tx);
      }
    }

    const netAmount = Math.max(0, basePrice - discountAmount);

    // 4. Find or Create Business Subscription
    let currentSub = await tx.businessSubscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const periodEnd = new Date(now);
    if (billingInterval === BillingInterval.YEARLY) {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else if (billingInterval === BillingInterval.QUARTERLY) {
      periodEnd.setMonth(periodEnd.getMonth() + 3);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const previousPlanId = currentSub?.planId || null;

    if (currentSub) {
      currentSub = await tx.businessSubscription.update({
        where: { id: currentSub.id },
        data: {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          billingInterval,
          agreedPrice: new Prisma.Decimal(netAmount),
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
          notes: `Upgraded to ${plan.name} (${billingInterval})${promoCode ? ` with promo ${promoCode}` : ""}`,
        },
      });
    } else {
      currentSub = await tx.businessSubscription.create({
        data: {
          businessId,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          billingInterval,
          agreedPrice: new Prisma.Decimal(netAmount),
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          notes: `Initial subscription to ${plan.name}`,
        },
      });
    }

    // 5. Generate Formal Subscription Invoice / Payment Receipt
    const invoiceNumber = `JB-INV-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const payment = await tx.subscriptionPayment.create({
      data: {
        subscriptionId: currentSub.id,
        invoiceNumber,
        amount: new Prisma.Decimal(basePrice),
        discountAmount: new Prisma.Decimal(discountAmount),
        netPaid: new Prisma.Decimal(netAmount),
        currency: "INR",
        paymentMethod,
        gatewayPaymentId: referenceNumber || `TXN_${Date.now()}`,
        status: "COMPLETED",
        paidAt: now,
        promoCodeId: promoRecordId || null,
        notes: `Plan: ${plan.name} · Interval: ${billingInterval}`,
      },
    });

    // 6. Cross-System Propagation via Event Engine
    await executeAndPropagateEvent(
      {
        eventType: "PLAN_UPGRADED",
        businessId,
        aggregateType: "Subscription",
        aggregateId: currentSub.id,
        idempotencyKey: `upgrade_${currentSub.id}_${now.getTime()}`,
        payload: {
          previousPlanId,
          newPlanId: plan.id,
          newPlanName: plan.name,
          paymentId: payment.id,
          invoiceNumber: payment.invoiceNumber,
          amount: netAmount,
          currency: "INR",
          actorType,
          actorId,
          billingInterval,
        },
      },
      tx
    );

    return {
      success: true,
      subscription: currentSub,
      payment,
      netAmount,
      invoiceNumber,
      planName: plan.name,
    };
  }, { maxWait: 15000, timeout: 30000 });
}
