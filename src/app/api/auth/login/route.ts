import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emailOrPhone, pin, tenantId } = body;

    if (!emailOrPhone || !pin) {
      return NextResponse.json(
        { error: "Email/Phone and security PIN are required." },
        { status: 400 }
      );
    }

    const cleanInput = String(emailOrPhone).trim().toLowerCase();
    const digits = cleanInput.replace(/[^0-9]/g, "");

    // Find user in Prisma database or return error
    try {
      const user = await prisma.user.findFirst({
        where: {
          businessId: tenantId || "tenant-sandhya-jaipur",
          OR: [
            { email: cleanInput },
            ...(digits.length >= 6 ? [{ phone: { contains: digits } }] : []),
          ],
        },
      });

      if (user) {
        if (!user.isActive) {
          return NextResponse.json(
            { error: "This staff account is deactivated. Contact store owner." },
            { status: 403 }
          );
        }

        const validPin = await bcrypt.compare(String(pin).trim(), user.passwordHash);
        if (!validPin) {
          return NextResponse.json(
            { error: "Incorrect security PIN / password." },
            { status: 401 }
          );
        }

        const session = {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || "",
          role: user.role,
          businessId: user.businessId,
          businessName: "Sandhya Jewellers",
          branchName: "Sarafa Bazar Main Showroom",
        };

        const response = NextResponse.json({ success: true, session });
        response.cookies.set("jewellery_os_session", JSON.stringify(session), {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 60 * 60 * 12, // 12 hours shift duration
        });

        return response;
      }
    } catch {
      // If DB is offline/unreachable in demo mode, return structured fallback
    }

    return NextResponse.json(
      { error: "User not found or database unavailable." },
      { status: 404 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Authentication internal error.", details: String(error) },
      { status: 500 }
    );
  }
}
