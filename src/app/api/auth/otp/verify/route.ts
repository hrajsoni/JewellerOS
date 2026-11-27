import { NextResponse } from "next/server";
import { verifyAndValidateChallenge } from "@/lib/otpService";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { challengeId, otp } = body;

    if (!challengeId || !otp) {
      return NextResponse.json(
        { error: "challengeId and 6-digit otp are required." },
        { status: 400 }
      );
    }

    const res = await verifyAndValidateChallenge({
      challengeId: String(challengeId),
      otp: String(otp),
      consume: false,
    });

    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.status });
    }

    return NextResponse.json({
      success: true,
      verified: true,
      channel: res.channel,
      challengeId: res.challengeId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to verify OTP.", details: String(error) },
      { status: 500 }
    );
  }
}
