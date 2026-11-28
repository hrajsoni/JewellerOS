import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { executeAndPropagateEvent } from "@/lib/events/propagationEngine";

export async function GET(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const subscriptions = await prisma.businessSubscription.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        business: { select: { id: true, name: true, phone: true, city: true } },
        plan: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch subscriptions.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireAdminSession(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { subscriptionId, amount, paymentMethod = "OFFLINE_TRANSFER", referenceNumber, extendMonths = 1, notes } = body;

    if (!subscriptionId || amount === undefined) {
      return NextResponse.json(
        { error: "subscriptionId and amount are required." },
        { status: 400 }
      );
    }

    const sub = await prisma.businessSubscription.findUnique({
      where: { id: subscriptionId },
      include: { plan: true },
    });

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
    }

    const now = new Date();
    const currentEnd = sub.currentPeriodEnd && sub.currentPeriodEnd > now ? sub.currentPeriodEnd : now;
    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + Number(extendMonths));

    const invoiceNumber = `JB-MANUAL-${now.getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = await prisma.$transaction(async (tx) => {
      const p = await tx.subscriptionPayment.create({
        data: {
          subscriptionId: sub.id,
          invoiceNumber,
          amount: new Prisma.Decimal(amount),
          netPaid: new Prisma.Decimal(amount),
          paymentMethod,
          gatewayPaymentId: referenceNumber || `MANUAL_${Date.now()}`,
          status: "COMPLETED",
          verifiedByAdminId: auth.session.id,
          paidAt: now,
          notes: notes || `Manual payment recorded by ${auth.session.name}`,
        },
      });

      await tx.businessSubscription.update({
        where: { id: sub.id },
        data: {
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: newEnd,
        },
      });

      return p;
    });

    await executeAndPropagateEvent({
      eventType: "SUBSCRIPTION_PAYMENT_CONFIRMED",
      businessId: sub.businessId,
      aggregateType: "Payment",
      aggregateId: payment.id,
      idempotencyKey: `manual_pay_${payment.id}`,
      payload: {
        adminId: auth.session.id,
        subscriptionId: sub.id,
        invoiceNumber,
        amount: Number(amount),
        planName: sub.plan.name,
        newPeriodEnd: newEnd.toISOString(),
      },
    });

    return NextResponse.json({ success: true, payment, newPeriodEnd: newEnd });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record manual payment.", details: String(error) },
      { status: 500 }
    );
  }
}
