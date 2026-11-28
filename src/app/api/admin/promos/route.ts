import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { DiscountType, Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const promoCodes = await prisma.promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        applicablePlans: { include: { plan: true } },
        _count: { select: { payments: true } },
      },
    });

    return NextResponse.json({ promoCodes });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch promo codes.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const {
      code,
      description,
      discountType = "PERCENTAGE",
      discountValue,
      maxDiscount,
      minOrderValue,
      maxUses,
      validUntil,
      applicablePlanIds,
    } = body;

    const cleanCode = String(code || "").trim().toUpperCase();
    if (!cleanCode || discountValue === undefined) {
      return NextResponse.json(
        { error: "Promo code and discount value are required." },
        { status: 400 }
      );
    }

    const existing = await prisma.promoCode.findUnique({ where: { code: cleanCode } });
    if (existing) {
      return NextResponse.json(
        { error: "A promo code with this code already exists." },
        { status: 409 }
      );
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: cleanCode,
        description: description ? String(description).trim() : null,
        discountType: discountType === "FLAT" ? DiscountType.FLAT : DiscountType.PERCENTAGE,
        discountValue: new Prisma.Decimal(discountValue),
        maxDiscount: maxDiscount ? new Prisma.Decimal(maxDiscount) : null,
        minOrderValue: minOrderValue ? new Prisma.Decimal(minOrderValue) : null,
        maxUses: maxUses ? Number(maxUses) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        createdById: auth.session.id,
        applicablePlans: applicablePlanIds && Array.isArray(applicablePlanIds)
          ? {
              create: applicablePlanIds.map((planId: string) => ({ planId })),
            }
          : undefined,
      },
      include: { applicablePlans: { include: { plan: true } } },
    });

    return NextResponse.json({ success: true, promoCode: promo });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create promo code.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { id, isActive } = body;

    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "ID and isActive boolean are required." }, { status: 400 });
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: { isActive },
    });

    return NextResponse.json({ success: true, promoCode: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to toggle promo code.", details: String(error) },
      { status: 500 }
    );
  }
}
