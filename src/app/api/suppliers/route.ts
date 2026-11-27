import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbSupplier, mapDbSupplierPayment } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";
import { resolveRequestBusinessId } from "@/lib/authSessionHelper";

export async function GET(request: Request) {
  try {
    const tenantId = await resolveRequestBusinessId(request);

    const [suppliers, payments] = await Promise.all([
      prisma.supplier.findMany({ where: { businessId: tenantId }, orderBy: { name: "asc" } }),
      prisma.supplierPayment.findMany({
        where: { businessId: tenantId },
        include: { supplier: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 100,
      }),
    ]);

    return NextResponse.json({
      success: true,
      suppliers: suppliers.map(mapDbSupplier),
      payments: payments.map(mapDbSupplierPayment),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch suppliers.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resolvedBusinessId = await resolveRequestBusinessId(request, body);
    const { action, businessId = resolvedBusinessId, payload = {} } = body;
    await ensureBusinessRecord(businessId);

    if (action === "record_payment") {
      const amount = Number(payload.amount || 0);
      const res = await prisma.$transaction(async (tx) => {
        const supplier = await tx.supplier.update({
          where: { id: payload.supplierId },
          data: { outstandingDue: { decrement: new Prisma.Decimal(amount) } },
        });
        const payment = await tx.supplierPayment.create({
          data: {
            businessId,
            supplierId: supplier.id,
            amount: new Prisma.Decimal(amount),
            method: payload.method || "Cash",
            referenceNo: payload.referenceNo || undefined,
            notes: payload.notes || undefined,
          },
          include: { supplier: { select: { name: true } } },
        });
        const cashAcct = String(payload.method || "Cash").toLowerCase().includes("bank")
          ? "1020"
          : String(payload.method || "Cash").toLowerCase().includes("upi")
          ? "1030"
          : "1010";
        await adjustAccountBalance(tx, businessId, cashAcct, -amount);
        await adjustAccountBalance(tx, businessId, "2010", -amount);
        return { supplier, payment };
      });
      return NextResponse.json({
        success: true,
        supplier: mapDbSupplier(res.supplier),
        payment: mapDbSupplierPayment(res.payment),
      });
    }

    const supplier = await prisma.supplier.create({
      data: {
        businessId,
        name: payload.name,
        contactPerson: payload.contactPerson || undefined,
        phone: payload.phone || "",
        city: payload.city || "Jaipur",
        gstin: payload.gstin || undefined,
        metalSupplied: String(payload.metalSupplied || "gold").toUpperCase() === "SILVER" ? "SILVER" : "GOLD",
      },
    });
    return NextResponse.json({ success: true, supplier: mapDbSupplier(supplier) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save supplier operation.", details: String(error) },
      { status: 500 }
    );
  }
}
