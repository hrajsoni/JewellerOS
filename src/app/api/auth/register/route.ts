import { NextResponse } from "next/server";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  seedDefaultAccountsForBusiness,
  seedDefaultRatesForBusiness,
  seedDefaultSettingsForBusiness,
  ensureBusinessRecord,
} from "@/lib/prismaBusinessHelper";
import {
  resolveOtpDestination,
  verifyAndValidateChallenge,
  getPhoneSearchVariations,
} from "@/lib/otpService";
import { executeAndPropagateEvent } from "@/lib/events/propagationEngine";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      pin,
      role = "OWNER",
      businessId,
      businessName,
      challengeId,
      otp,
      planSlug = "trial",
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
        { error: "Account already exists for this email or phone number. Please sign in." },
        { status: 409 }
      );
    }

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
    const safeRole = validRoles.includes(role) ? role : "OWNER";

    // Dynamic Showroom Workspace Creation vs Joining Existing
    const targetBusinessId = businessId ? String(businessId).trim() : "";
    const targetBusinessName = businessName ? String(businessName).trim() : "";

    const userRecord = await prisma.$transaction(async (tx) => {
      let bizRecord = null;
      if (targetBusinessId) {
        bizRecord = await tx.business.findUnique({ where: { id: targetBusinessId } });
      }

      if (!bizRecord) {
        // Generate clean dynamic business ID
        const generatedId = `biz_${Date.now().toString(36)}_${crypto.randomBytes(3).toString("hex")}`;
        const finalName = targetBusinessName || `${String(fullName).trim()}'s Jewellers`;

        bizRecord = await tx.business.create({
          data: {
            id: generatedId,
            name: finalName,
            legalEntityName: finalName,
            phone: resolved.cleanPhone || "+91 94140 12345",
            email: resolved.cleanEmail || null,
            address: "Sarafa Market",
            city: "Jaipur",
            state: "Rajasthan",
            pincode: "302001",
            currency: "INR",
          },
        });

        // Create main showroom branch
        await tx.branch.create({
          data: {
            businessId: bizRecord.id,
            name: "Main Showroom",
            code: "BR-MAIN",
            phone: bizRecord.phone,
            address: bizRecord.address,
            isMainVault: true,
          },
        });

        // Seed default chart of accounts, baseline rates, and master settings
        await seedDefaultAccountsForBusiness(tx, bizRecord.id);
        await seedDefaultRatesForBusiness(tx, bizRecord.id);
        await seedDefaultSettingsForBusiness(
          tx,
          bizRecord.id,
          finalName,
          bizRecord.phone,
          bizRecord.email || undefined
        );

        // Assign initial SaaS subscription (Free Trial by default or selected tier)
        const selectedPlan = await tx.plan.findFirst({
          where: { slug: String(planSlug).trim().toLowerCase() },
        }) || await tx.plan.findFirst({ where: { slug: "trial" } });

        if (selectedPlan) {
          const now = new Date();
          const trialEnds = new Date(now.getTime() + (selectedPlan.trialDays || 14) * 24 * 60 * 60 * 1000);

          const subscription = await tx.businessSubscription.create({
            data: {
              businessId: bizRecord.id,
              planId: selectedPlan.id,
              status: selectedPlan.slug === "trial" ? "TRIALING" : "ACTIVE",
              billingInterval: "MONTHLY",
              agreedPrice: selectedPlan.monthlyPrice,
              startedAt: now,
              trialEndsAt: selectedPlan.slug === "trial" ? trialEnds : null,
              notes: `Initial registration subscription: ${selectedPlan.name}`,
            },
          });

          await executeAndPropagateEvent(
            {
              eventType: "REGISTRATION_COMPLETED",
              businessId: bizRecord.id,
              aggregateType: "Business",
              aggregateId: bizRecord.id,
              idempotencyKey: `reg_${bizRecord.id}_${now.getTime()}`,
              payload: {
                businessName: finalName,
                ownerName: fullName,
                planId: selectedPlan.id,
                planName: selectedPlan.name,
                subscriptionId: subscription.id,
                trialEndsAt: trialEnds.toISOString(),
              },
            },
            tx
          );
        }
      }

      const createdUser = await tx.user.create({
        data: {
          businessId: bizRecord.id,
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

      return { user: createdUser, business: bizRecord };
    });

    const session = {
      id: userRecord.user.id,
      fullName: userRecord.user.fullName,
      email: userRecord.user.email || "",
      phone: userRecord.user.phone || "",
      role: userRecord.user.role,
      businessId: userRecord.business.id,
      businessName: userRecord.business.name,
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
