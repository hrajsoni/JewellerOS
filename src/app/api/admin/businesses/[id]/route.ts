import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { SubscriptionStatus, Prisma } from "@prisma/client";
import { executeAndPropagateEvent } from "@/lib/events/propagationEngine";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  const { id: businessId } = await params;

  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscriptions: {
          include: { plan: { include: { entitlements: true } }, payments: true, addons: true },
          orderBy: { createdAt: "desc" },
        },
        entitlementOverrides: {
          orderBy: { createdAt: "desc" },
        },
        users: {
          select: { id: true, fullName: true, email: true, phone: true, role: true, isActive: true },
        },
        branches: true,
        _count: {
          select: { stockItems: true, invoices: true, mediaAssets: true },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found." }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch business details.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  const { id: businessId } = await params;

  try {
    const body = await request.json();
    const { action } = body;

    const sub = await prisma.businessSubscription.findFirst({
      where: { businessId },
      orderBy: { createdAt: "desc" },
    });

    if (!sub && action !== "ASSIGN_PLAN") {
      return NextResponse.json({ error: "No subscription found for this business." }, { status: 404 });
    }

    // 1. EXTEND_TRIAL
    if (action === "EXTEND_TRIAL") {
      const days = Number(body.days || 14);
      const currentExpiry = sub?.trialEndsAt ? new Date(sub.trialEndsAt) : new Date();
      const newTrialEnds = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

      const updated = await prisma.businessSubscription.update({
        where: { id: sub!.id },
        data: {
          trialEndsAt: newTrialEnds,
          status: SubscriptionStatus.TRIALING,
        },
      });

      await executeAndPropagateEvent({
        eventType: "TRIAL_EXTENDED",
        businessId,
        aggregateType: "Subscription",
        aggregateId: sub!.id,
        idempotencyKey: `trial_ext_${sub!.id}_${Date.now()}`,
        payload: {
          adminId: auth.session.id,
          extensionDays: days,
          newTrialEndsAt: newTrialEnds.toISOString(),
          reason: body.reason || "Trial extended by Super Admin",
        },
      });

      return NextResponse.json({ success: true, subscription: updated });
    }

    // 2. TOGGLE_SUSPENSION
    if (action === "TOGGLE_SUSPENSION") {
      const shouldSuspend = Boolean(body.suspended);
      const newStatus = shouldSuspend ? SubscriptionStatus.SUSPENDED : SubscriptionStatus.ACTIVE;

      const updated = await prisma.businessSubscription.update({
        where: { id: sub!.id },
        data: { status: newStatus },
      });

      await executeAndPropagateEvent({
        eventType: shouldSuspend ? "SUBSCRIPTION_SUSPENDED" : "SUBSCRIPTION_REACTIVATED",
        businessId,
        aggregateType: "Subscription",
        aggregateId: sub!.id,
        idempotencyKey: `suspend_${sub!.id}_${Date.now()}`,
        payload: {
          adminId: auth.session.id,
          reason: body.reason || "Status modified by platform administrator",
        },
      });

      return NextResponse.json({ success: true, subscription: updated });
    }

    // 3. SET_OVERRIDE
    if (action === "SET_OVERRIDE") {
      const { featureKey, enabled, limitValue, reason, expiresDays } = body;
      const expiresAt = expiresDays
        ? new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000)
        : null;

      const override = await prisma.entitlementOverride.create({
        data: {
          businessId,
          featureKey,
          enabled: typeof enabled === "boolean" ? enabled : null,
          limitValue: limitValue !== undefined ? Number(limitValue) : null,
          reason: reason || "Administrative allowance override",
          grantedById: auth.session.id,
          expiresAt,
        },
      });

      await executeAndPropagateEvent({
        eventType: "ADMIN_OVERRIDE_GRANTED",
        businessId,
        aggregateType: "Entitlement",
        aggregateId: override.id,
        idempotencyKey: `override_${override.id}_${Date.now()}`,
        payload: {
          adminId: auth.session.id,
          featureKey,
          enabled,
          limitValue,
          reason,
          expiresAt: expiresAt?.toISOString() || null,
        },
      });

      return NextResponse.json({ success: true, override });
    }

    // 4. CHANGE_PLAN
    if (action === "CHANGE_PLAN") {
      const { planSlug } = body;
      const plan = await prisma.plan.findUnique({ where: { slug: planSlug } });
      if (!plan) return NextResponse.json({ error: "Invalid plan slug." }, { status: 400 });

      const updated = await prisma.businessSubscription.update({
        where: { id: sub!.id },
        data: {
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          agreedPrice: plan.monthlyPrice,
        },
      });

      await executeAndPropagateEvent({
        eventType: "PLAN_UPGRADED",
        businessId,
        aggregateType: "Subscription",
        aggregateId: sub!.id,
        idempotencyKey: `admin_plan_change_${sub!.id}_${Date.now()}`,
        payload: {
          adminId: auth.session.id,
          previousPlanId: sub!.planId,
          newPlanId: plan.id,
          newPlanName: plan.name,
          reason: body.reason || "Plan modified by Super Admin",
        },
      });

      return NextResponse.json({ success: true, subscription: updated });
    }

    return NextResponse.json({ error: "Unrecognized admin action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update business.", details: String(error) },
      { status: 500 }
    );
  }
}
