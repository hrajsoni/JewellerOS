export type OtpChannelType = "EMAIL" | "PHONE";
export type OtpPurposeType = "SIGNUP" | "LOGIN" | "RESET_PIN";

export function normalizeEmail(raw?: string | null): string {
  return String(raw || "").trim().toLowerCase();
}

export function normalizePhoneDigits(raw?: string | null): string {
  const digits = String(raw || "").replace(/[^0-9]/g, "");
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function formatPhoneDisplay(raw?: string | null): string {
  const digits = String(raw || "").replace(/[^0-9]/g, "");
  if (digits.length === 10) return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }
  return String(raw || "").trim();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/[^0-9]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function getPhoneSearchVariations(rawPhone?: string | null): string[] {
  if (!rawPhone) return [];
  const digits = rawPhone.replace(/[^0-9]/g, "");
  if (digits.length < 6) return [rawPhone.trim()];

  const variations = new Set<string>();
  variations.add(digits);

  if (digits.length >= 10) {
    const last10 = digits.slice(-10);
    variations.add(last10);
    const p5_5 = `${last10.slice(0, 5)} ${last10.slice(5)}`;
    variations.add(p5_5);
    variations.add(`+91 ${p5_5}`);
    variations.add(`+91${last10}`);
    variations.add(`91${last10}`);
  }

  const rawTrimmed = rawPhone.trim();
  if (rawTrimmed) variations.add(rawTrimmed);

  return Array.from(variations).filter((v) => v.length > 0);
}

export function maskOtpTarget(channel: OtpChannelType, target: string): string {
  if (channel === "EMAIL") {
    const [local, domain] = target.split("@");
    if (!domain) return target;
    const visible =
      local.length <= 2 ? local.charAt(0) : `${local.slice(0, 2)}***${local.slice(-1)}`;
    return `${visible}@${domain}`;
  }
  const digits = target.replace(/[^0-9]/g, "");
  return `******${digits.slice(-4)}`;
}

/**
 * Resolves the OTP destination according to rule:
 * - Both email and phone provided -> EMAIL OTP
 * - Email only -> EMAIL OTP
 * - Phone only -> PHONE OTP
 */
export function resolveOtpDestination(input: {
  email?: string | null;
  phone?: string | null;
}):
  | {
      ok: true;
      channel: OtpChannelType;
      target: string;
      cleanEmail?: string;
      cleanPhone?: string;
      maskedTarget: string;
    }
  | { ok: false; error: string } {
  const rawEmail = String(input.email || "").trim();
  const rawPhone = String(input.phone || "").trim();

  const hasEmail = rawEmail.length > 0;
  const hasPhone = rawPhone.replace(/[^0-9]/g, "").length > 0;

  if (!hasEmail && !hasPhone) {
    return { ok: false, error: "Please enter either an Email address or Mobile Phone number." };
  }

  if (hasEmail && !isValidEmail(rawEmail)) {
    return { ok: false, error: "Please enter a valid Email address." };
  }

  if (hasPhone && !isValidPhone(rawPhone)) {
    return { ok: false, error: "Please enter a valid 10-digit Mobile Phone number." };
  }

  const cleanEmail = hasEmail ? normalizeEmail(rawEmail) : undefined;
  const cleanPhone = hasPhone ? formatPhoneDisplay(rawPhone) : undefined;

  // Priority: If BOTH email and phone are provided -> send OTP to EMAIL
  if (cleanEmail) {
    return {
      ok: true,
      channel: "EMAIL",
      target: cleanEmail,
      cleanEmail,
      cleanPhone,
      maskedTarget: maskOtpTarget("EMAIL", cleanEmail),
    };
  }

  const phoneKey = normalizePhoneDigits(rawPhone);
  return {
    ok: true,
    channel: "PHONE",
    target: phoneKey,
    cleanPhone,
    maskedTarget: maskOtpTarget("PHONE", phoneKey),
  };
}
