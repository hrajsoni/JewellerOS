import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbStaffMember, mapDbStaffPayment } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const [staff, payments] = await Promise.all([
      prisma.staffMember.findMany({ where: { businessId: tenantId }, orderBy: { name: "asc" } }),
      prisma.staffPayment.findMany({
        where: { businessId: tenantId },
        include: { staff: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 200,
      }),
    ]);

    return NextResponse.json({
      success: true,
      staff: staff.map(mapDbStaffMember),
      payments: payments.map(mapDbStaffPayment),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch staff records.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, businessId = "tenant-sandhya-jaipur", payload = {} } = body;
    await ensureBusinessRecord(businessId);

    if (action === "add_staff") {
      const created = await prisma.staffMember.create({
        data: {
          businessId,
          name: payload.name,
          phone: payload.phone || "",
          role: payload.role || "Counter Salesman",
          monthlySalary: new Prisma.Decimal(payload.monthlySalary || 20000),
          advanceBalance: new Prisma.Decimal(0),
        },
      });
      return NextResponse.json({ success: true, staff: mapDbStaffMember(created) }, { status: 201 });
    }

    if (action === "issue_advance") {
      const amount = Number(payload.amount || 0);
      const res = await prisma.$transaction(async (tx) => {
        const staff = await tx.staffMember.update({
          where: { id: payload.staffId },
          data: { advanceBalance: { increment: new Prisma.Decimal(amount) } },
        });
        const payment = await tx.staffPayment.create({
          data: {
            businessId,
            staffId: staff.id,
            amount: new Prisma.Decimal(amount),
            type: "advance",
            paymentMode: payload.paymentMethod || "Cash",
            notes: payload.notes || undefined,
          },
          include: { staff: { select: { name: true } } },
        });
        const acct = String(payload.paymentMethod || "Cash").toLowerCase().includes("bank")
          ? "1020"
          : String(payload.paymentMethod || "Cash").toLowerCase().includes("upi")
          ? "1030"
          : "1010";
        await adjustAccountBalance(tx, businessId, acct, -amount);
        return { staff, payment };
      });
      return NextResponse.json({
        success: true,
        staff: mapDbStaffMember(res.staff),
        payment: mapDbStaffPayment(res.payment),
      });
    }

    if (action === "pay_salary") {
      const netPaid = Number(payload.netPaid || 0);
      const deductAdvance = Number(payload.deductAdvance || 0);
      const res = await prisma.$transaction(async (tx) => {
        const staff = await tx.staffMember.update({
          where: { id: payload.staffId },
          data: { advanceBalance: { decrement: new Prisma.Decimal(deductAdvance) } },
        });
        const payment = await tx.staffPayment.create({
          data: {
            businessId,
            staffId: staff.id,
            amount: new Prisma.Decimal(netPaid),
            type: "salary",
            paymentMode: payload.paymentMethod || "Cash",
            monthYear: payload.salaryMonth || undefined,
            notes: payload.notes || undefined,
          },
          include: { staff: { select: { name: true } } },
        });
        const acct = String(payload.paymentMethod || "Cash").toLowerCase().includes("bank")
          ? "1020"
          : String(payload.paymentMethod || "Cash").toLowerCase().includes("upi")
          ? "1030"
          : "1010";
        await adjustAccountBalance(tx, businessId, acct, -netPaid);
        return { staff, payment };
      });
      return NextResponse.json({
        success: true,
        staff: mapDbStaffMember(res.staff),
        payment: mapDbStaffPayment(res.payment),
      });
    }

    return NextResponse.json({ error: "Unsupported staff action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist staff action.", details: String(error) },
      { status: 500 }
    );
  }
}
