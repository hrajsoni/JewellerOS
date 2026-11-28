import { PrismaClient, Prisma, SubscriptionStatus, BillingInterval, DiscountType } from "@prisma/client";
import bcrypt from "bcryptjs";

export interface DefaultPlanDef {
  name: string;
  slug: string;
  description: string;
  badge?: string;
  monthlyPrice: number;
  quarterlyPrice?: number;
  yearlyPrice: number;
  trialDays: number;
  sortOrder: number;
  isPublished: boolean;
  entitlements: {
    featureKey: string;
    enabled: boolean;
    limitValue?: number | null;
    unit?: string;
  }[];
}

export const DEFAULT_PLANS: DefaultPlanDef[] = [
  {
    name: "Free Trial (14 Days)",
    slug: "trial",
    description: "Full-feature 14-day evaluation for jewellers exploring JewelleryOS capabilities.",
    badge: "14-Day Free Trial",
    monthlyPrice: 0,
    yearlyPrice: 0,
    trialDays: 14,
    sortOrder: 0,
    isPublished: true,
    entitlements: [
      // Core Modules
      { featureKey: "module.pos", enabled: true },
      { featureKey: "module.inventory", enabled: true },
      { featureKey: "module.barcode", enabled: true },
      { featureKey: "module.metal_rates", enabled: true },
      { featureKey: "module.accounts", enabled: true },
      { featureKey: "module.customers", enabled: true },
      // Specialized Modules (unlocked during trial)
      { featureKey: "module.girvi", enabled: true },
      { featureKey: "module.karigar", enabled: true },
      { featureKey: "module.consignment", enabled: true },
      { featureKey: "module.wholesale", enabled: true },
      { featureKey: "module.advanced_reports", enabled: true },
      { featureKey: "module.multi_branch", enabled: true },
      { featureKey: "module.custom_domain", enabled: false },
      { featureKey: "module.api_access", enabled: false },
      // Trial Resource Limits
      { featureKey: "limit.staff_seats", enabled: true, limitValue: 3, unit: "seats" },
      { featureKey: "limit.branches", enabled: true, limitValue: 2, unit: "branches" },
      { featureKey: "limit.stock_items", enabled: true, limitValue: 500, unit: "items" },
      { featureKey: "limit.storage_mb", enabled: true, limitValue: 500, unit: "mb" },
      { featureKey: "limit.monthly_invoices", enabled: true, limitValue: 150, unit: "invoices" },
      { featureKey: "limit.sms_monthly", enabled: true, limitValue: 50, unit: "sms" },
    ],
  },
  {
    name: "Starter Boutique",
    slug: "starter",
    description: "Designed for independent boutique jewellers. Fast POS, barcode billing, and full GST accounting.",
    badge: "Single Showroom",
    monthlyPrice: 1999,
    quarterlyPrice: 5499,
    yearlyPrice: 19990, // ~2 months free
    trialDays: 0,
    sortOrder: 1,
    isPublished: true,
    entitlements: [
      // Core Modules
      { featureKey: "module.pos", enabled: true },
      { featureKey: "module.inventory", enabled: true },
      { featureKey: "module.barcode", enabled: true },
      { featureKey: "module.metal_rates", enabled: true },
      { featureKey: "module.accounts", enabled: true },
      { featureKey: "module.customers", enabled: true },
      // Specialized Modules (available as upgrade in Growth)
      { featureKey: "module.girvi", enabled: false },
      { featureKey: "module.karigar", enabled: false },
      { featureKey: "module.consignment", enabled: false },
      { featureKey: "module.wholesale", enabled: false },
      { featureKey: "module.advanced_reports", enabled: false },
      { featureKey: "module.multi_branch", enabled: false },
      { featureKey: "module.custom_domain", enabled: false },
      { featureKey: "module.api_access", enabled: false },
      // Starter Resource Limits
      { featureKey: "limit.staff_seats", enabled: true, limitValue: 3, unit: "seats" },
      { featureKey: "limit.branches", enabled: true, limitValue: 1, unit: "branches" },
      { featureKey: "limit.stock_items", enabled: true, limitValue: 2000, unit: "items" },
      { featureKey: "limit.storage_mb", enabled: true, limitValue: 1024, unit: "mb" },
      { featureKey: "limit.monthly_invoices", enabled: true, limitValue: 600, unit: "invoices" },
      { featureKey: "limit.sms_monthly", enabled: true, limitValue: 200, unit: "sms" },
    ],
  },
  {
    name: "Growth Showroom",
    slug: "growth",
    description: "Comprehensive jewellery ERP for multi-counter retailers with Girvi lending, Karigar workshops, and multi-branch vaults.",
    badge: "Most Popular",
    monthlyPrice: 4999,
    quarterlyPrice: 13999,
    yearlyPrice: 49990, // ~2 months free
    trialDays: 0,
    sortOrder: 2,
    isPublished: true,
    entitlements: [
      // Core & Specialized Modules
      { featureKey: "module.pos", enabled: true },
      { featureKey: "module.inventory", enabled: true },
      { featureKey: "module.barcode", enabled: true },
      { featureKey: "module.metal_rates", enabled: true },
      { featureKey: "module.accounts", enabled: true },
      { featureKey: "module.customers", enabled: true },
      { featureKey: "module.girvi", enabled: true },
      { featureKey: "module.karigar", enabled: true },
      { featureKey: "module.consignment", enabled: true },
      { featureKey: "module.wholesale", enabled: true },
      { featureKey: "module.advanced_reports", enabled: true },
      { featureKey: "module.multi_branch", enabled: true },
      { featureKey: "module.custom_domain", enabled: false },
      { featureKey: "module.api_access", enabled: false },
      // Growth Resource Limits
      { featureKey: "limit.staff_seats", enabled: true, limitValue: 10, unit: "seats" },
      { featureKey: "limit.branches", enabled: true, limitValue: 3, unit: "branches" },
      { featureKey: "limit.stock_items", enabled: true, limitValue: 15000, unit: "items" },
      { featureKey: "limit.storage_mb", enabled: true, limitValue: 5120, unit: "mb" },
      { featureKey: "limit.monthly_invoices", enabled: true, limitValue: 5000, unit: "invoices" },
      { featureKey: "limit.sms_monthly", enabled: true, limitValue: 1000, unit: "sms" },
    ],
  },
  {
    name: "Enterprise Luxury",
    slug: "enterprise",
    description: "Flagship retail chains and wholesale houses needing high-concurrency billing, unlimited staff seats, and custom integrations.",
    badge: "Omni-Channel",
    monthlyPrice: 9999,
    quarterlyPrice: 27999,
    yearlyPrice: 99990,
    trialDays: 0,
    sortOrder: 3,
    isPublished: true,
    entitlements: [
      // Everything Unlocked
      { featureKey: "module.pos", enabled: true },
      { featureKey: "module.inventory", enabled: true },
      { featureKey: "module.barcode", enabled: true },
      { featureKey: "module.metal_rates", enabled: true },
      { featureKey: "module.accounts", enabled: true },
      { featureKey: "module.customers", enabled: true },
      { featureKey: "module.girvi", enabled: true },
      { featureKey: "module.karigar", enabled: true },
      { featureKey: "module.consignment", enabled: true },
      { featureKey: "module.wholesale", enabled: true },
      { featureKey: "module.advanced_reports", enabled: true },
      { featureKey: "module.multi_branch", enabled: true },
      { featureKey: "module.custom_domain", enabled: true },
      { featureKey: "module.api_access", enabled: true },
      // High-Scale Resource Limits
      { featureKey: "limit.staff_seats", enabled: true, limitValue: 50, unit: "seats" },
      { featureKey: "limit.branches", enabled: true, limitValue: 15, unit: "branches" },
      { featureKey: "limit.stock_items", enabled: true, limitValue: 100000, unit: "items" },
      { featureKey: "limit.storage_mb", enabled: true, limitValue: 25600, unit: "mb" },
      { featureKey: "limit.monthly_invoices", enabled: true, limitValue: 50000, unit: "invoices" },
      { featureKey: "limit.sms_monthly", enabled: true, limitValue: 10000, unit: "sms" },
    ],
  },
];

/**
 * Seeds or updates SaaS plans, entitlements, default Super Admin, and promo codes.
 */
export async function seedSaasPlatform(prisma: PrismaClient) {
  console.log("-> Seeding SaaS Plans and Entitlements...");

  const planIdMap = new Map<string, string>();

  for (const planDef of DEFAULT_PLANS) {
    const plan = await prisma.plan.upsert({
      where: { slug: planDef.slug },
      update: {
        name: planDef.name,
        description: planDef.description,
        badge: planDef.badge,
        monthlyPrice: new Prisma.Decimal(planDef.monthlyPrice),
        quarterlyPrice: planDef.quarterlyPrice ? new Prisma.Decimal(planDef.quarterlyPrice) : null,
        yearlyPrice: new Prisma.Decimal(planDef.yearlyPrice),
        trialDays: planDef.trialDays,
        sortOrder: planDef.sortOrder,
        isPublished: planDef.isPublished,
      },
      create: {
        name: planDef.name,
        slug: planDef.slug,
        description: planDef.description,
        badge: planDef.badge,
        monthlyPrice: new Prisma.Decimal(planDef.monthlyPrice),
        quarterlyPrice: planDef.quarterlyPrice ? new Prisma.Decimal(planDef.quarterlyPrice) : null,
        yearlyPrice: new Prisma.Decimal(planDef.yearlyPrice),
        trialDays: planDef.trialDays,
        sortOrder: planDef.sortOrder,
        isPublished: planDef.isPublished,
      },
    });

    planIdMap.set(planDef.slug, plan.id);

    // Upsert each entitlement
    for (const ent of planDef.entitlements) {
      await prisma.planEntitlement.upsert({
        where: {
          planId_featureKey: {
            planId: plan.id,
            featureKey: ent.featureKey,
          },
        },
        update: {
          enabled: ent.enabled,
          limitValue: ent.limitValue ?? null,
          unit: ent.unit || null,
        },
        create: {
          planId: plan.id,
          featureKey: ent.featureKey,
          enabled: ent.enabled,
          limitValue: ent.limitValue ?? null,
          unit: ent.unit || null,
        },
      });
    }
  }

  // 2. Seed Default Platform Super Admin
  console.log("-> Seeding Platform Super Admin...");
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@jewelbill.com";
  const rawAdminPass = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026!";
  const adminPasswordHash = await bcrypt.hash(rawAdminPass, 10);

  await prisma.platformAdmin.upsert({
    where: { email: adminEmail },
    update: {
      name: "JewelBill Super Admin",
      role: "SUPER_ADMIN",
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: "JewelBill Super Admin",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  // 3. Seed Promotional Codes
  console.log("-> Seeding Default Promo Codes...");
  const defaultPromos = [
    {
      code: "WELCOME2026",
      description: "Welcome Offer: 20% discount on Starter and Growth plans",
      discountType: DiscountType.PERCENTAGE,
      discountValue: new Prisma.Decimal(20),
      maxDiscount: new Prisma.Decimal(2000),
      minOrderValue: new Prisma.Decimal(1999),
      maxUses: 500,
      validUntil: new Date("2027-12-31T23:59:59Z"),
      applicableSlugs: ["starter", "growth"],
    },
    {
      code: "SARAFABAZAR",
      description: "Sarafa Jewellers Association: Flat ₹1500 off",
      discountType: DiscountType.FLAT,
      discountValue: new Prisma.Decimal(1500),
      minOrderValue: new Prisma.Decimal(3500),
      maxUses: 1000,
      validUntil: new Date("2027-12-31T23:59:59Z"),
      applicableSlugs: ["starter", "growth", "enterprise"],
    },
    {
      code: "LAUNCH100",
      description: "VIP Jeweller Pilot: 100% off first month",
      discountType: DiscountType.PERCENTAGE,
      discountValue: new Prisma.Decimal(100),
      maxDiscount: new Prisma.Decimal(10000),
      minOrderValue: new Prisma.Decimal(0),
      maxUses: 25,
      validUntil: new Date("2027-06-30T23:59:59Z"),
      applicableSlugs: ["starter", "growth", "enterprise"],
    },
  ];

  for (const promoData of defaultPromos) {
    const promo = await prisma.promoCode.upsert({
      where: { code: promoData.code },
      update: {
        description: promoData.description,
        discountType: promoData.discountType,
        discountValue: promoData.discountValue,
        maxDiscount: promoData.maxDiscount || null,
        minOrderValue: promoData.minOrderValue || null,
        maxUses: promoData.maxUses,
        validUntil: promoData.validUntil,
        isActive: true,
      },
      create: {
        code: promoData.code,
        description: promoData.description,
        discountType: promoData.discountType,
        discountValue: promoData.discountValue,
        maxDiscount: promoData.maxDiscount || null,
        minOrderValue: promoData.minOrderValue || null,
        maxUses: promoData.maxUses,
        validUntil: promoData.validUntil,
        isActive: true,
      },
    });

    // Link applicable plans
    for (const slug of promoData.applicableSlugs) {
      const pId = planIdMap.get(slug);
      if (pId) {
        await prisma.promoCodePlan.upsert({
          where: {
            promoCodeId_planId: {
              promoCodeId: promo.id,
              planId: pId,
            },
          },
          update: {},
          create: {
            promoCodeId: promo.id,
            planId: pId,
          },
        });
      }
    }
  }

  // 4. Backfill any existing businesses without subscription
  console.log("-> Checking existing businesses for SaaS subscriptions...");
  const businesses = await prisma.business.findMany({
    include: {
      subscriptions: true,
    },
  });

  const growthPlanId = planIdMap.get("growth") || planIdMap.get("starter");

  for (const b of businesses) {
    if (b.subscriptions.length === 0 && growthPlanId) {
      const now = new Date();
      const oneYearLater = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

      await prisma.businessSubscription.create({
        data: {
          businessId: b.id,
          planId: growthPlanId,
          status: SubscriptionStatus.ACTIVE,
          billingInterval: BillingInterval.YEARLY,
          agreedPrice: new Prisma.Decimal(49990),
          startedAt: now,
          currentPeriodStart: now,
          currentPeriodEnd: oneYearLater,
          notes: "Auto-provisioned growth plan for existing merchant showroom.",
          events: {
            create: {
              eventType: "CREATED",
              newPlanId: growthPlanId,
              actorType: "SYSTEM_MIGRATION",
              details: { reason: "Initial SaaS subscription backfill" },
            },
          },
        },
      });
      console.log(`   * Provisioned Growth subscription for business: ${b.name} (${b.id})`);
    }
  }

  console.log("-> SaaS platform seeding completed successfully.");
}
