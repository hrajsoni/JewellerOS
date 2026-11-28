import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { signAdminToken } from "@/lib/adminAuth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const admin = await prisma.platformAdmin.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    if (!admin.isActive) {
      return NextResponse.json(
        { error: "This admin account has been deactivated." },
        { status: 403 }
      );
    }

    const passwordMatch = await bcrypt.compare(String(password), admin.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid admin credentials." },
        { status: 401 }
      );
    }

    // Update last login
    await prisma.platformAdmin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = signAdminToken({
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set("jewelbill_admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Admin login failed.", details: String(error) },
      { status: 500 }
    );
  }
}
