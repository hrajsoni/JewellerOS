import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    const businesses = await prisma.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { users: true, branches: true, stockItems: true, invoices: true },
        },
      },
    });

    const filtered = status
      ? businesses.filter((b) => b.subscriptions[0]?.status === status)
      : businesses;

    return NextResponse.json({ businesses: filtered });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch businesses.", details: String(error) },
      { status: 500 }
    );
  }
}
