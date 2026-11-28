import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { SubscriptionStatus } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const totalBusinesses = await prisma.business.count();
    const activeSubscriptions = await prisma.businessSubscription.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });
    const trialingSubscriptions = await prisma.businessSubscription.count({
      where: { status: SubscriptionStatus.TRIALING },
    });
    const suspendedSubscriptions = await prisma.businessSubscription.count({
      where: { status: SubscriptionStatus.SUSPENDED },
    });
    const expiredSubscriptions = await prisma.businessSubscription.count({
      where: { status: { in: [SubscriptionStatus.EXPIRED, SubscriptionStatus.CANCELLED] } },
    });

    // Calculate MRR from active subscriptions
    const activeSubs = await prisma.businessSubscription.findMany({
      where: { status: SubscriptionStatus.ACTIVE },
      select: { agreedPrice: true, billingInterval: true },
    });

    let mrr = 0;
    for (const sub of activeSubs) {
      const price = Number(sub.agreedPrice || 0);
      if (sub.billingInterval === "YEARLY") {
        mrr += price / 12;
      } else if (sub.billingInterval === "QUARTERLY") {
        mrr += price / 3;
      } else {
        mrr += price;
      }
    }
    mrr = Math.round(mrr);

    // Platform aggregate counts
    const totalStockItems = await prisma.stockItem.count();
    const totalInvoices = await prisma.invoice.count();
    const totalUsers = await prisma.user.count();

    const mediaAgg = await prisma.mediaAsset.aggregate({
      _sum: { fileSize: true },
    });
    const totalStorageMb = Math.round(Number(mediaAgg._sum.fileSize || 0) / (1024 * 1024));

    // Recent businesses
    const recentBusinesses = await prisma.business.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        subscriptions: {
          include: { plan: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        _count: {
          select: { users: true, branches: true, stockItems: true },
        },
      },
    });

    // Recent subscription payments
    const recentPayments = await prisma.subscriptionPayment.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: {
        subscription: {
          include: { business: true, plan: true },
        },
        promoCode: true,
      },
    });

    // Recent platform events
    const recentEvents = await prisma.platformAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { admin: { select: { name: true, email: true } } },
    });

    return NextResponse.json({
      metrics: {
        totalBusinesses,
        activeSubscriptions,
        trialingSubscriptions,
        suspendedSubscriptions,
        expiredSubscriptions,
        mrr,
        totalStockItems,
        totalInvoices,
        totalUsers,
        totalStorageMb,
      },
      recentBusinesses,
      recentPayments,
      recentEvents,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch platform overview metrics.", details: String(error) },
      { status: 500 }
    );
  }
}
