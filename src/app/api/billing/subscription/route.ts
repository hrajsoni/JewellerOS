import { NextResponse } from "next/server";
import { resolveRequestBusinessId } from "@/lib/authSessionHelper";
import { getBusinessEntitlementSummary } from "@/lib/entitlements/service";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const businessId = await resolveRequestBusinessId(request);
    if (!businessId) {
      return NextResponse.json({ error: "Missing business context." }, { status: 400 });
    }

    const summary = await getBusinessEntitlementSummary(businessId);
    const availablePlans = await prisma.plan.findMany({
      where: { isPublished: true, isArchived: false },
      orderBy: { sortOrder: "asc" },
      include: { entitlements: true },
    });

    return NextResponse.json({
      summary,
      availablePlans,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscription status.", details: String(error) },
      { status: 500 }
    );
  }
}
