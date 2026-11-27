import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  resolveOtpDestination,
  generateSixDigitOtp,
  deliverOtp,
  normalizePhoneDigits,
  getPhoneSearchVariations,
  OtpPurposeType,
} from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      phone,
      purpose = "SIGNUP",
      tenantId,
    }: {
      email?: string;
      phone?: string;
      purpose?: OtpPurposeType;
      tenantId?: string;
    } = body;

    const resolved = resolveOtpDestination({ email, phone });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    const phoneDigits = resolved.cleanPhone ? normalizePhoneDigits(resolved.cleanPhone) : "";
    const phoneVars = getPhoneSearchVariations(resolved.cleanPhone || phone);

    // Enforce account existence check for SIGNUP vs LOGIN
    const orClauses: any[] = [];
    if (resolved.cleanEmail) {
      orClauses.push({ email: resolved.cleanEmail });
    }
    for (const v of phoneVars) {
      orClauses.push({ phone: { contains: v } });
    }

    const existingUser = orClauses.length
      ? await prisma.user.findFirst({
          where: {
            ...(tenantId && purpose === "LOGIN" ? { businessId: tenantId } : {}),
            OR: orClauses,
          },
        })
      : null;

    if (purpose === "SIGNUP" && existingUser) {
      return NextResponse.json(
        { error: "An account already exists with this email or mobile number. Please sign in instead." },
        { status: 409 }
      );
    }

    if (purpose === "LOGIN" && !existingUser) {
      return NextResponse.json(
        { error: "No account found matching these details. Create a new account first." },
        { status: 404 }
      );
    }

    const code = generateSixDigitOtp();
    const codeHash = await bcrypt.hash(code, 8);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry

    const challenge = await prisma.otpChallenge.create({
      data: {
        channel: resolved.channel,
        target: resolved.target,
        purpose,
        codeHash,
        expiresAt,
      },
    });

    const delivery = await deliverOtp({
      channel: resolved.channel,
      target: resolved.target,
      code,
      purpose,
    });

    return NextResponse.json({
      success: true,
      challengeId: challenge.id,
      channel: resolved.channel,
      maskedTarget: resolved.maskedTarget,
      deliveredVia: delivery.deliveredVia,
      ...(delivery.devOtpPreview ? { devOtpPreview: delivery.devOtpPreview } : {}),
      expiresInSeconds: 600,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate and send OTP.", details: String(error) },
      { status: 500 }
    );
  }
}
