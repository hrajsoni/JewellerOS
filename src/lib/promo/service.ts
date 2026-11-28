import { Prisma, PrismaClient, DiscountType } from "@prisma/client";
import prisma from "@/lib/prisma";

export interface PromoValidationResult {
  valid: boolean;
  promoCodeId?: string;
  code?: string;
  discountType?: DiscountType;
  discountValue?: number;
  discountAmount?: number;
  finalPrice?: number;
  description?: string;
  error?: string;
}

/**
 * Validates a promo code against a proposed plan purchase.
 */
export async function validatePromoCode(
  rawCode: string,
  targetPlanSlugOrId: string,
  basePrice: number,
  dbClient: Prisma.TransactionClient | PrismaClient = prisma
): Promise<PromoValidationResult> {
  const code = (rawCode || "").trim().toUpperCase();

  if (!code) {
    return { valid: false, error: "Please enter a valid promotional code." };
  }

  const promo = await dbClient.promoCode.findUnique({
    where: { code },
    include: {
      applicablePlans: {
        include: { plan: true },
      },
    },
  });

  if (!promo) {
    return { valid: false, error: "Promo code does not exist." };
  }

  if (!promo.isActive) {
    return { valid: false, error: "This promo code is no longer active." };
  }

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) {
    return { valid: false, error: "This promo code is not yet valid." };
  }

  if (promo.validUntil && now > promo.validUntil) {
    return { valid: false, error: "This promo code has expired." };
  }

  if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
    return { valid: false, error: "This promo code has reached its maximum redemptions." };
  }

  const minOrder = promo.minOrderValue ? Number(promo.minOrderValue) : 0;
  if (basePrice < minOrder) {
    return {
      valid: false,
      error: `Minimum order value of ₹${minOrder.toLocaleString("en-IN")} required for this promo code.`,
    };
  }

  // Check plan applicability
  if (promo.applicablePlans.length > 0) {
    const isPlanApplicable = promo.applicablePlans.some(
      (ap) =>
        ap.planId === targetPlanSlugOrId ||
        ap.plan.slug.toLowerCase() === targetPlanSlugOrId.toLowerCase()
    );

    if (!isPlanApplicable) {
      const planNames = promo.applicablePlans.map((ap) => ap.plan.name).join(", ");
      return {
        valid: false,
        error: `This promo code is only applicable to: ${planNames}.`,
      };
    }
  }

  // Calculate discount
  const discountVal = Number(promo.discountValue);
  let discountAmount = 0;

  if (promo.discountType === DiscountType.PERCENTAGE) {
    discountAmount = (basePrice * discountVal) / 100;
    if (promo.maxDiscount) {
      discountAmount = Math.min(discountAmount, Number(promo.maxDiscount));
    }
  } else {
    // FLAT
    discountAmount = Math.min(basePrice, discountVal);
  }

  discountAmount = Math.round(discountAmount * 100) / 100;
  const finalPrice = Math.max(0, Math.round((basePrice - discountAmount) * 100) / 100);

  return {
    valid: true,
    promoCodeId: promo.id,
    code: promo.code,
    discountType: promo.discountType,
    discountValue: discountVal,
    discountAmount,
    finalPrice,
    description: promo.description || undefined,
  };
}

/**
 * Atomically increments the redemption count for a promo code.
 */
export async function redeemPromoCode(
  promoCodeId: string,
  tx: Prisma.TransactionClient
): Promise<void> {
  await tx.promoCode.update({
    where: { id: promoCodeId },
    data: {
      usedCount: { increment: 1 },
    },
  });
}
