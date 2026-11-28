import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const plans = await prisma.plan.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        entitlements: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    return NextResponse.json({ plans });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch plans.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { name, slug, description, badge, monthlyPrice, yearlyPrice, entitlements, isPublished } = body;

    if (!name || !slug || monthlyPrice === undefined) {
      return NextResponse.json(
        { error: "Name, slug, and monthly price are required." },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.create({
      data: {
        name: String(name).trim(),
        slug: String(slug).trim().toLowerCase(),
        description: description ? String(description).trim() : null,
        badge: badge ? String(badge).trim() : null,
        monthlyPrice: new Prisma.Decimal(monthlyPrice),
        yearlyPrice: yearlyPrice ? new Prisma.Decimal(yearlyPrice) : null,
        isPublished: Boolean(isPublished),
        entitlements: entitlements && Array.isArray(entitlements)
          ? {
              create: entitlements.map((e: any) => ({
                featureKey: e.featureKey,
                enabled: Boolean(e.enabled),
                limitValue: e.limitValue !== undefined ? Number(e.limitValue) : null,
                unit: e.unit || null,
              })),
            }
          : undefined,
      },
      include: { entitlements: true },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create plan.", details: String(error) },
      { status: 500 }
    );
  }
}
