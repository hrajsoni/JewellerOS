import { NextResponse } from "next/server";
import { validatePromoCode } from "@/lib/promo/service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promoCode, planSlug, basePrice } = body;

    if (!promoCode || !planSlug || basePrice === undefined) {
      return NextResponse.json(
        { error: "promoCode, planSlug, and basePrice are required." },
        { status: 400 }
      );
    }

    const result = await validatePromoCode(promoCode, planSlug, Number(basePrice));
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to validate promo code.", details: String(error) },
      { status: 500 }
    );
  }
}
