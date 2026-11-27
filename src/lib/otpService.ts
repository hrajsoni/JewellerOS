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

  // 1. Resend Email Delivery
  const resendKey =
    process.env.RESEND_API_KEY ||
    (process.env.EMAIL_API_KEY?.startsWith("re_") ? process.env.EMAIL_API_KEY : undefined);
  if (channel === "EMAIL" && resendKey) {
    try {
      const fromEmail = process.env.RESEND_FROM_EMAIL || "JewelleryOS <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [target],
          subject: `${code} is your JewelleryOS ${purposeLabel} OTP`,
          html: `<div style="font-family:sans-serif;padding:24px;background:#0d0e12;color:#f3f4f6;border-radius:12px;max-width:480px;margin:auto;border:1px solid rgba(197,160,89,0.3)">
            <h2 style="color:#DFC488;margin-bottom:6px">JewelleryOS Security Verification</h2>
            <p style="font-size:13px;color:#9ca3af;margin-top:0">Showroom Identity & Access Control</p>
            <p style="font-size:14px">Your 6-digit verification OTP for <strong>${purposeLabel}</strong> is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:6px;margin:20px 0;padding:12px 20px;background:rgba(197,160,89,0.15);color:#DFC488;border-radius:8px;display:inline-block;border:1px solid rgba(197,160,89,0.4)">
              ${code}
            </div>
            <p style="font-size:12px;color:#6b7280;margin-top:20px">This security code expires in 10 minutes. If you did not request this OTP, please contact your showroom administrator.</p>
          </div>`,
        }),
      });
      if (res.ok) {
        return { deliveredVia: "resend_email" };
      }
      const errText = await res.text().catch(() => "");
      console.warn("Resend email delivery failed, status:", res.status, errText);
    } catch (err) {
      console.warn("Resend email delivery failed, falling back:", err);
    }
  }

  // 2. TextBee SMS Gateway (supports txb_* API keys)
  const textbeeKey =
    process.env.TEXTBEE_API_KEY ||
    (process.env.SMS_API_KEY?.startsWith("txb_") ? process.env.SMS_API_KEY : undefined);
  if (channel === "PHONE" && textbeeKey) {
    try {
      const cleanDigits = target.replace(/[^0-9]/g, "");
      const recipientE164 = target.startsWith("+")
        ? target
        : cleanDigits.length === 10
        ? `+91${cleanDigits}`
        : cleanDigits.length === 12 && cleanDigits.startsWith("91")
        ? `+${cleanDigits}`
        : `+${cleanDigits}`;

      const res = await fetch("https://api.textbee.dev/api/v1/gateway/send-sms", {
        method: "POST",
        headers: {
          "x-api-key": textbeeKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipients: [recipientE164],
          message: `Your JewelleryOS ${purposeLabel} OTP is: ${code}. Valid for 10 minutes.`,
        }),
      });
      if (res.ok) {
        return { deliveredVia: "sms_gateway" };
      }
      const errText = await res.text().catch(() => "");
      console.warn("TextBee SMS gateway responded with error:", res.status, errText);
    } catch (err) {
      console.warn("TextBee SMS gateway delivery failed, falling back:", err);
    }
  }

  // 3. Fast2SMS Secondary Gateway
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

  // Honest sandbox fallback when external email/SMS API keys are not configured or external delivery fails
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
