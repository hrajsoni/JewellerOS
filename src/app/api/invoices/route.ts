import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const invoices = await prisma.invoice.findMany({
      where: { businessId: tenantId },
      include: {
        items: true,
        payments: true,
        customer: true,
      },
      orderBy: { invoiceDate: "desc" },
      take: 100,
    });

    return NextResponse.json({ success: true, invoices });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch invoices from database.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      invoiceNumber,
      type = "RETAIL_GST",
      customerName,
      customerPhone,
      customerId,
      customerGstin,
      subtotal,
      makingTotal,
      discountTotal = 0,
      taxableAmount,
      cgstAmount = 0,
      sgstAmount = 0,
      roundOff = 0,
      grandTotal,
      oldGoldDeduction = 0,
      netPayable,
      totalPaid,
      balanceDue = 0,
      createdById,
      items = [],
      payments = [],
    } = body;

    if (!invoiceNumber || !customerName || !items.length) {
      return NextResponse.json(
        { error: "Invalid invoice payload: invoiceNumber, customerName and items are required." },
        { status: 400 }
      );
    }

    // Execute atomic multi-table transaction (DEF-010, DEF-015)
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Invoice record
      const invoice = await tx.invoice.create({
        data: {
          businessId,
          invoiceNumber,
          type,
          status: "FINALIZED",
          customerId: customerId || undefined,
          customerName,
          customerPhone: customerPhone || "",
          customerGstin: customerGstin || undefined,
          subtotal: new Prisma.Decimal(subtotal),
          makingTotal: new Prisma.Decimal(makingTotal),
          discountTotal: new Prisma.Decimal(discountTotal),
          taxableAmount: new Prisma.Decimal(taxableAmount),
          cgstAmount: new Prisma.Decimal(cgstAmount),
          sgstAmount: new Prisma.Decimal(sgstAmount),
          roundOff: new Prisma.Decimal(roundOff),
          grandTotal: new Prisma.Decimal(grandTotal),
          oldGoldDeduction: new Prisma.Decimal(oldGoldDeduction),
          netPayable: new Prisma.Decimal(netPayable),
          totalPaid: new Prisma.Decimal(totalPaid),
          balanceDue: new Prisma.Decimal(balanceDue),
          createdById: createdById || undefined,
          items: {
            create: items.map((item: any) => ({
              stockItemId: item.stockItemId || undefined,
              description: item.description || item.name,
              metal: item.metal || "GOLD",
              purityKey: item.purityKey || item.purity || "22K",
              grossWeight: new Prisma.Decimal(item.grossWeight),
              netWeight: new Prisma.Decimal(item.netWeight),
              metalRate: new Prisma.Decimal(item.metalRate),
              metalValue: new Prisma.Decimal(item.metalValue),
              makingCharges: new Prisma.Decimal(item.makingCharges),
              stoneValue: new Prisma.Decimal(item.stoneValue || 0),
              discount: new Prisma.Decimal(item.discount || 0),
              itemSubtotal: new Prisma.Decimal(item.itemSubtotal || item.totalPrice),
            })),
          },
          payments: {
            create: payments.map((p: any) => ({
              method: p.method || "CASH",
              amount: new Prisma.Decimal(p.amount),
              referenceNo: p.referenceNo || undefined,
            })),
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 2. Atomically transition physical stock to SOLD and record stock movements
      for (const item of items) {
        if (item.stockItemId) {
          await tx.stockItem.update({
            where: { id: item.stockItemId },
            data: { status: "SOLD" },
          });

          await tx.stockMovement.create({
            data: {
              stockItemId: item.stockItemId,
              fromStatus: "IN_SHOWCASE",
              toStatus: "SOLD",
              fromLocation: "SHOWCASE",
              toLocation: "CUSTOMER",
              reason: `Retail Invoice ${invoiceNumber}`,
              referenceType: "RETAIL_INVOICE",
              referenceId: invoice.id,
            },
          });
        }
      }

      // 3. Update customer outstanding balance if balanceDue > 0
      if (customerId && Number(balanceDue) > 0) {
        await tx.customer.update({
          where: { id: customerId },
          data: {
            outstandingDue: { increment: new Prisma.Decimal(balanceDue) },
          },
        });
      }

      return invoice;
    });

    return NextResponse.json({ success: true, invoice: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist invoice transaction.", details: String(error) },
      { status: 500 }
    );
  }
}
