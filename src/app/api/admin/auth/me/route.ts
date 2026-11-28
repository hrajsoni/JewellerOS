import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  const admin = await prisma.platformAdmin.findUnique({
    where: { id: auth.session.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ admin });
}
