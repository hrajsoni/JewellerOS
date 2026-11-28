import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const logs = await prisma.platformAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        admin: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch audit logs.", details: String(error) },
      { status: 500 }
    );
  }
}
