import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const purchases = await prisma.purchaseInvoice.findMany({
      where: { businessId: tenantId },
      include: {
        items: true,
        supplier: true,
      },
      orderBy: { invoiceDate: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, purchases });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch purchases from database.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      supplierId,
      invoiceNumber,
      supplierName,
      itemsSubtotal,
      totalMaking = 0,
      totalGst = 0,
      grandTotal,
      amountPaid = 0,
      balanceDue = 0,
      paymentMethod = "Cash",
      items = [],
    } = body;

    if (!supplierId || !invoiceNumber || !supplierName || !items.length) {
      return NextResponse.json(
        { error: "Supplier ID, invoiceNumber, supplierName, and items are required." },
        { status: 400 }
      );
    }

    const purchase = await prisma.$transaction(async (tx) => {
      // 1. Create PurchaseInvoice with Items
      const createdInvoice = await tx.purchaseInvoice.create({
        data: {
          businessId,
          supplierId,
          invoiceNumber,
          supplierName,
          itemsSubtotal: new Prisma.Decimal(itemsSubtotal),
          totalMaking: new Prisma.Decimal(totalMaking),
          totalGst: new Prisma.Decimal(totalGst),
          grandTotal: new Prisma.Decimal(grandTotal),
          amountPaid: new Prisma.Decimal(amountPaid),
          balanceDue: new Prisma.Decimal(balanceDue),
          paymentMethod,
          status: Number(balanceDue) <= 0 ? "paid" : "credit",
          items: {
            create: items.map((item: any) => ({
              description: item.description || item.title || item.name,
              category: item.category || "Bullion",
              metal: item.metal || "GOLD",
              purity: item.purity || "24K",
              grossWeight: new Prisma.Decimal(item.grossWeight),
              stoneWeight: new Prisma.Decimal(item.stoneWeight || 0),
              netWeight: new Prisma.Decimal(item.netWeight),
              fineWeight: new Prisma.Decimal(item.fineWeight || item.netWeight),
              metalRate: new Prisma.Decimal(item.metalRate),
              makingRate: new Prisma.Decimal(item.makingRate || 0),
              subtotal: new Prisma.Decimal(item.subtotal || item.totalPrice),
              trayLocation: item.trayLocation || "Safe Vault #1",
            })),
          },
        },
        include: {
          items: true,
        },
      });

      // 2. Inward items into inventory stock
      for (const item of items) {
        let product = await tx.product.findFirst({
          where: { businessId, name: item.description || item.title || item.name },
        });

        if (!product) {
          product = await tx.product.create({
            data: {
              businessId,
              name: item.description || item.title || item.name,
              category: item.category || "Bullion",
              metal: item.metal || "GOLD",
              defaultPurity: item.purity || "24K",
              hsnCode: "7113",
              standardMaking: new Prisma.Decimal(item.makingRate || 0),
            },
          });
        }

        const barcode = item.barcode || `PUR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const sku = item.sku || `SKU-${Date.now()}`;

        const stock = await tx.stockItem.create({
          data: {
            businessId,
            productId: product.id,
            barcode,
            sku,
            title: item.description || item.title || item.name,
            metal: item.metal || "GOLD",
            purityKey: item.purity || "24K",
            grossWeight: new Prisma.Decimal(item.grossWeight),
            stoneWeight: new Prisma.Decimal(item.stoneWeight || 0),
            otherDeductions: new Prisma.Decimal(0),
            netWeight: new Prisma.Decimal(item.netWeight),
            fineGoldEq: new Prisma.Decimal(item.fineWeight || item.netWeight),
            makingValue: new Prisma.Decimal(item.makingRate || 0),
            acquisitionCost: new Prisma.Decimal(item.subtotal || item.totalPrice),
            trayLocation: item.trayLocation || "Safe Vault #1",
            status: "IN_SHOWCASE",
            supplierId,
          },
        });

        await tx.stockMovement.create({
          data: {
            stockItemId: stock.id,
            fromStatus: "IN_SHOWCASE",
            toStatus: "IN_SHOWCASE",
            fromLocation: `SUPPLIER: ${supplierName}`,
            toLocation: item.trayLocation || "Safe Vault #1",
            reason: `Purchase Invoice ${invoiceNumber}`,
            referenceType: "PURCHASE_INVOICE",
            referenceId: createdInvoice.id,
          },
        });
      }

      // 3. Update supplier balance if balanceDue > 0
      if (Number(balanceDue) > 0) {
        await tx.supplier.update({
          where: { id: supplierId },
          data: {
            outstandingDue: { increment: new Prisma.Decimal(balanceDue) },
          },
        });
      }

      return createdInvoice;
    });

    return NextResponse.json({ success: true, purchase }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to inward wholesale purchase.", details: String(error) },
      { status: 500 }
    );
  }
}
