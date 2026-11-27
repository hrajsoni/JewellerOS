import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { verifyAndValidateChallenge, getPhoneSearchVariations } from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      emailOrPhone,
      email,
      phone,
      pin,
      method = "pin",
      challengeId,
      otp,
      tenantId,
    } = body;

    const lookupContact = String(emailOrPhone || email || phone || "").trim();

    if (method === "otp") {
      if (!challengeId || (!otp && !lookupContact)) {
        return NextResponse.json(
          { error: "challengeId and 6-digit OTP are required." },
          { status: 400 }
        );
      }

      const verified = await verifyAndValidateChallenge({
        challengeId: String(challengeId),
        otp: otp ? String(otp) : undefined,
        consume: true,
      });

      if (!verified.ok) {
        return NextResponse.json({ error: verified.error }, { status: verified.status });
      }

      const phoneVars = getPhoneSearchVariations(verified.target);

      const user = await prisma.user.findFirst({
        where: {
          ...(verified.channel === "EMAIL"
            ? { email: verified.target }
            : { OR: phoneVars.map((v) => ({ phone: { contains: v } })) }),
        },
        include: { business: true },
      });

      if (!user) {
        return NextResponse.json(
          { error: "No user account registered with this contact." },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: "This staff account is deactivated. Contact store owner." },
          { status: 403 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
          ...(verified.channel === "EMAIL" ? { emailVerified: true } : { phoneVerified: true }),
        },
      });

      const session = {
        id: user.id,
        fullName: user.fullName,
        email: user.email || "",
        phone: user.phone || "",
        role: user.role,
        businessId: user.businessId,
        businessName: user.business?.name || "Sandhya Jewellers",
        branchName: "Main Showroom",
      };

      const response = NextResponse.json({ success: true, session });
      response.cookies.set("jewellery_os_session", JSON.stringify(session), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });
      return response;
    }

    // Standard PIN / Password authentication
    if (!lookupContact || !pin) {
      return NextResponse.json(
        { error: "Email/Phone and security PIN are required." },
        { status: 400 }
      );
    }

    const cleanInput = lookupContact.toLowerCase();
    const phoneVars = getPhoneSearchVariations(cleanInput);

    const user = await prisma.user.findFirst({
      where: {
        ...(tenantId ? { businessId: tenantId } : {}),
        OR: [
          { email: cleanInput },
          ...phoneVars.map((v) => ({ phone: { contains: v } })),
        ],
      },
      include: { business: true },
    });

    // Fallback search across all businesses if tenant filter didn't match
    const resolvedUser =
      user ||
      (tenantId
        ? await prisma.user.findFirst({
            where: {
              OR: [
                { email: cleanInput },
                ...phoneVars.map((v) => ({ phone: { contains: v } })),
              ],
            },
            include: { business: true },
          })
        : null);

    if (!resolvedUser) {
      return NextResponse.json(
        { error: "No account found with this email or mobile number." },
        { status: 404 }
      );
    }

    if (!resolvedUser.isActive) {
      return NextResponse.json(
        { error: "This staff account is deactivated. Contact store owner." },
        { status: 403 }
      );
    }

    const validPin = await bcrypt.compare(String(pin).trim(), resolvedUser.passwordHash);
    if (!validPin) {
      return NextResponse.json(
        { error: "Incorrect security PIN / password." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: resolvedUser.id },
      data: { lastLoginAt: new Date() },
    });

    const session = {
      id: resolvedUser.id,
      fullName: resolvedUser.fullName,
      email: resolvedUser.email || "",
      phone: resolvedUser.phone || "",
      role: resolvedUser.role,
      businessId: resolvedUser.businessId,
      businessName: resolvedUser.business?.name || "Sandhya Jewellers",
      branchName: "Main Showroom",
    };

    const response = NextResponse.json({ success: true, session });
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
      { error: "Authentication internal error.", details: String(error) },
      { status: 500 }
    );
  }
}
