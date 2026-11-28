import { NextResponse } from "next/server";
import { resolveRequestBusinessId, extractSessionFromRequest } from "@/lib/authSessionHelper";
import { applyPlanUpgrade } from "@/lib/entitlements/service";
import { BillingInterval } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const session = extractSessionFromRequest(request, body);
    const businessId = await resolveRequestBusinessId(request, body);

    if (!businessId) {
      return NextResponse.json({ error: "Missing business context." }, { status: 400 });
    }

    const {
      targetPlanSlug,
      billingInterval = "MONTHLY",
      promoCode,
      paymentMethod = "UPI",
      referenceNumber,
    } = body;

    if (!targetPlanSlug) {
      return NextResponse.json({ error: "targetPlanSlug is required." }, { status: 400 });
    }

    const result = await applyPlanUpgrade({
      businessId,
      targetPlanSlugOrId: targetPlanSlug,
      billingInterval: billingInterval as BillingInterval,
      promoCode,
      paymentMethod,
      referenceNumber,
      actorType: "MERCHANT",
      actorId: session?.id,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process plan upgrade.", details: String(error) },
      { status: 400 }
    );
  }
}
