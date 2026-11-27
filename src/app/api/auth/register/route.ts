import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { ensureBusinessRecord } from "@/lib/prismaBusinessHelper";
import {
  resolveOtpDestination,
  verifyAndValidateChallenge,
  normalizePhoneDigits,
  getPhoneSearchVariations,
} from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      pin,
      role = "OWNER",
      businessId = "tenant-sandhya-jaipur",
      businessName,
      challengeId,
      otp,
    } = body;

    if (!fullName || !String(fullName).trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    const cleanPin = String(pin || "").trim();
    if (cleanPin.length < 4 || cleanPin.length > 12) {
      return NextResponse.json(
        { error: "Please set a 4 to 6-digit Security PIN." },
        { status: 400 }
      );
    }

    const resolved = resolveOtpDestination({ email, phone });
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    if (!challengeId) {
      return NextResponse.json(
        { error: "OTP verification is required before creating an account." },
        { status: 400 }
      );
    }

    const verified = await verifyAndValidateChallenge({
      challengeId: String(challengeId),
      otp: otp ? String(otp) : undefined,
      expectedTarget: resolved.target,
      consume: true,
    });

    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: verified.status });
    }

    // Check duplicate email/phone before creating user
    const phoneVars = getPhoneSearchVariations(resolved.cleanPhone || phone);

    const orClauses: any[] = [];
    if (resolved.cleanEmail) orClauses.push({ email: resolved.cleanEmail });
    for (const v of phoneVars) {
      orClauses.push({ phone: { contains: v } });
    }

    const duplicate = orClauses.length
      ? await prisma.user.findFirst({ where: { OR: orClauses } })
      : null;

    if (duplicate) {
      return NextResponse.json(
        { error: "Account already exists for this email or phone number." },
        { status: 409 }
      );
    }

    const business = await ensureBusinessRecord(businessId, businessName || "Sandhya Jewellers");
    const passwordHash = await bcrypt.hash(cleanPin, 8);

    const validRoles = [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "ACCOUNTANT",
      "SALESPERSON",
      "INVENTORY_CLERK",
      "KARIGAR_MANAGER",
    ];
    const safeRole = validRoles.includes(role) ? role : "SALESPERSON";

    const created = await prisma.user.create({
      data: {
        businessId: business.id,
        fullName: String(fullName).trim(),
        email: resolved.cleanEmail || null,
        phone: resolved.cleanPhone || null,
        emailVerified: resolved.channel === "EMAIL",
        phoneVerified: resolved.channel === "PHONE",
        passwordHash,
        role: safeRole as any,
        isActive: true,
        lastLoginAt: new Date(),
      },
    });

    const session = {
      id: created.id,
      fullName: created.fullName,
      email: created.email || "",
      phone: created.phone || "",
      role: created.role,
      businessId: created.businessId,
      businessName: business.name,
      branchName: "Main Showroom",
    };

    const response = NextResponse.json({
      success: true,
      verifiedChannel: resolved.channel,
      session,
    });

    response.cookies.set("jewellery_os_session", JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to register account.", details: String(error) },
      { status: 500 }
    );
  }
}
