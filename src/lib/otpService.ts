import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import type { OtpChannelType, OtpPurposeType } from "./otpRules";

export * from "./otpRules";

export function generateSixDigitOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function deliverOtp(params: {
  channel: OtpChannelType;
  target: string;
  code: string;
  purpose: OtpPurposeType;
}): Promise<{ deliveredVia: "resend_email" | "sms_gateway" | "dev_sandbox"; devOtpPreview?: string }> {
  const { channel, target, code, purpose } = params;
  const purposeLabel = purpose === "SIGNUP" ? "Account Registration" : "Showroom Sign-In";

  if (channel === "EMAIL" && process.env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "JewelleryOS <onboarding@resend.dev>",
          to: [target],
          subject: `${code} is your JewelleryOS ${purposeLabel} OTP`,
          html: `<div style="font-family:sans-serif;padding:16px"><h2>JewelleryOS Security Verification</h2><p>Your 6-digit OTP for <strong>${purposeLabel}</strong> is:</p><div style="font-size:28px;font-weight:bold;letter-spacing:4px;margin:16px 0">${code}</div><p>This code expires in 10 minutes.</p></div>`,
        }),
      });
      if (res.ok) {
        return { deliveredVia: "resend_email" };
      }
    } catch (err) {
      console.warn("Resend email delivery failed, falling back:", err);
    }
  }

  if (channel === "PHONE" && process.env.FAST2SMS_API_KEY) {
    try {
      const digits10 = target.slice(-10);
      const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
        method: "POST",
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: "otp",
          variables_values: code,
          numbers: digits10,
        }),
      });
      if (res.ok) {
        return { deliveredVia: "sms_gateway" };
      }
    } catch (err) {
      console.warn("SMS gateway delivery failed, falling back:", err);
    }
  }

  // Honest sandbox fallback when external email/SMS API keys are not configured
  console.info(`[JewelleryOS OTP Sandbox] ${channel} -> ${target} (${purpose}): ${code}`);
  return { deliveredVia: "dev_sandbox", devOtpPreview: code };
}

export async function verifyAndValidateChallenge(params: {
  challengeId: string;
  otp?: string;
  expectedTarget?: string;
  consume?: boolean;
}): Promise<{ ok: true; challengeId: string; channel: OtpChannelType; target: string } | { ok: false; error: string; status: number }> {
  const challenge = await prisma.otpChallenge.findUnique({
    where: { id: params.challengeId },
  });

  if (!challenge) {
    return { ok: false, error: "OTP session not found. Request a new OTP.", status: 404 };
  }

  if (params.expectedTarget && challenge.target !== params.expectedTarget) {
    return { ok: false, error: "OTP target mismatch. Request a fresh OTP.", status: 400 };
  }

  if (challenge.expiresAt.getTime() < Date.now()) {
    return { ok: false, error: "OTP has expired. Please request a new code.", status: 410 };
  }

  if (challenge.attempts >= 5) {
    return { ok: false, error: "Too many failed attempts. Request a new OTP.", status: 429 };
  }

  // If already verified in a prior step and still fresh, allow consumption without re-checking hash if otp matches or was already verified
  if (!challenge.verifiedAt) {
    const cleanOtp = String(params.otp || "").trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      return { ok: false, error: "Enter the 6-digit OTP code.", status: 400 };
    }
    const matches = await bcrypt.compare(cleanOtp, challenge.codeHash);
    if (!matches) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      return { ok: false, error: "Invalid OTP code. Please check and try again.", status: 401 };
    }

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { verifiedAt: new Date() },
    });
  }

  if (params.consume) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } }).catch(() => {});
  }

  return {
    ok: true,
    challengeId: challenge.id,
    channel: challenge.channel as OtpChannelType,
    target: challenge.target,
  };
}
