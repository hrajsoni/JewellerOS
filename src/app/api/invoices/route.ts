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

import { mapPaymentMethodToDb } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      invoiceNumber,
      type = "RETAIL_GST",
      customerName,
      customerPhone,
      customerCity = "Jaipur",
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

    await ensureBusinessRecord(businessId);

    // Execute atomic multi-table transaction (DEF-010, DEF-015)
    const result = await prisma.$transaction(async (tx) => {
      // Resolve or upsert customer safely by phone if present
      let resolvedCustomerId: string | undefined = undefined;
      if (customerId) {
        const byId = await tx.customer.findUnique({ where: { id: customerId } });
        if (byId) resolvedCustomerId = byId.id;
      }
      if (!resolvedCustomerId && customerPhone && String(customerPhone).trim().length >= 5) {
        const cleanPhone = String(customerPhone).trim();
        const upsertedCustomer = await tx.customer.upsert({
          where: { businessId_phone: { businessId, phone: cleanPhone } },
          update: {
            name: customerName,
            totalPurchased: { increment: new Prisma.Decimal(grandTotal || 0) },
            ...(Number(balanceDue) > 0
              ? { outstandingDue: { increment: new Prisma.Decimal(balanceDue) } }
              : {}),
          },
          create: {
            businessId,
            name: customerName,
            phone: cleanPhone,
            city: customerCity,
            gstin: customerGstin || undefined,
            totalPurchased: new Prisma.Decimal(grandTotal || 0),
            outstandingDue: new Prisma.Decimal(Math.max(0, Number(balanceDue || 0))),
          },
        });
        resolvedCustomerId = upsertedCustomer.id;
      } else if (resolvedCustomerId) {
        await tx.customer.update({
          where: { id: resolvedCustomerId },
          data: {
            totalPurchased: { increment: new Prisma.Decimal(grandTotal || 0) },
            ...(Number(balanceDue) > 0
              ? { outstandingDue: { increment: new Prisma.Decimal(balanceDue) } }
              : {}),
          },
        });
      }

      // Resolve valid stockItemIds before creating InvoiceItems
      const resolvedStockIds = new Map<number, string>();
      for (let i = 0; i < items.length; i++) {
        const it = items[i];
        if (it.stockItemId) {
          const exists = await tx.stockItem.findUnique({
            where: { id: it.stockItemId },
            select: { id: true },
          });
          if (exists) resolvedStockIds.set(i, exists.id);
        } else if (it.barcode) {
          const byBc = await tx.stockItem.findUnique({
            where: { barcode: it.barcode },
            select: { id: true },
          });
          if (byBc) resolvedStockIds.set(i, byBc.id);
        }
      }

      // 1. Create Invoice record
      const invoice = await tx.invoice.create({
        data: {
          businessId,
          invoiceNumber,
          type,
          status: "FINALIZED",
          customerId: resolvedCustomerId,
          customerName,
          customerPhone: customerPhone || "",
          customerCity,
          customerGstin: customerGstin || undefined,
          subtotal: new Prisma.Decimal(subtotal || 0),
          makingTotal: new Prisma.Decimal(makingTotal || 0),
          discountTotal: new Prisma.Decimal(discountTotal || 0),
          taxableAmount: new Prisma.Decimal(taxableAmount || subtotal || 0),
          cgstAmount: new Prisma.Decimal(cgstAmount || 0),
          sgstAmount: new Prisma.Decimal(sgstAmount || 0),
          roundOff: new Prisma.Decimal(roundOff || 0),
          grandTotal: new Prisma.Decimal(grandTotal || 0),
          oldGoldDeduction: new Prisma.Decimal(oldGoldDeduction || 0),
          netPayable: new Prisma.Decimal(netPayable ?? grandTotal ?? 0),
          totalPaid: new Prisma.Decimal(totalPaid || 0),
          balanceDue: new Prisma.Decimal(balanceDue || 0),
          createdById: createdById || undefined,
          items: {
            create: items.map((item: any, idx: number) => ({
              stockItemId: resolvedStockIds.get(idx) || undefined,
              description: item.description || item.name || "Jewellery Ornament",
              metal: String(item.metal || "GOLD").toUpperCase() === "SILVER" ? "SILVER" : "GOLD",
              purityKey: item.purityKey || item.purity || "22K",
              grossWeight: new Prisma.Decimal(item.grossWeight || 0),
              netWeight: new Prisma.Decimal(item.netWeight || 0),
              metalRate: new Prisma.Decimal(item.metalRate || 0),
              metalValue: new Prisma.Decimal(item.metalValue || 0),
              makingCharges: new Prisma.Decimal(item.makingCharges || 0),
              stoneValue: new Prisma.Decimal(item.stoneValue || 0),
              discount: new Prisma.Decimal(item.discount || 0),
              itemSubtotal: new Prisma.Decimal(
                item.itemSubtotal ?? item.totalBeforeTax ?? item.totalPrice ?? 0
              ),
            })),
          },
          payments: {
            create: payments.map((p: any) => ({
              method: mapPaymentMethodToDb(p.method || "CASH"),
              amount: new Prisma.Decimal(p.amount || 0),
              referenceNo: p.referenceNo || p.transactionRef || undefined,
            })),
          },
        },
        include: {
          items: true,
          payments: true,
        },
      });

      // 2. Atomically transition matched physical stock to SOLD and record stock movements
      for (const [, stockId] of resolvedStockIds.entries()) {
        await tx.stockItem.update({
          where: { id: stockId },
          data: { status: "SOLD" },
        });

        await tx.stockMovement.create({
          data: {
            stockItemId: stockId,
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

      // 3. Double-entry Accounts posting
      for (const p of payments) {
        const amt = Number(p.amount || 0);
        if (amt <= 0) continue;
        const dbMethod = mapPaymentMethodToDb(p.method || "CASH");
        if (dbMethod === "CASH") await adjustAccountBalance(tx, businessId, "1010", amt);
        else if (dbMethod === "UPI") await adjustAccountBalance(tx, businessId, "1030", amt);
        else if (dbMethod === "CARD" || dbMethod === "BANK_TRANSFER")
          await adjustAccountBalance(tx, businessId, "1020", amt);
      }
      if (Number(oldGoldDeduction) > 0) {
        await adjustAccountBalance(tx, businessId, "1040", Number(oldGoldDeduction));
      }
      if (Number(balanceDue) > 0) {
        await adjustAccountBalance(tx, businessId, "1050", Number(balanceDue));
      }
      const gstTotal = Number(cgstAmount || 0) + Number(sgstAmount || 0);
      if (gstTotal > 0) await adjustAccountBalance(tx, businessId, "2040", gstTotal);
      if (Number(makingTotal) > 0) await adjustAccountBalance(tx, businessId, "3020", Number(makingTotal));
      const netMetalSales = Math.max(0, Number(taxableAmount || subtotal || 0) - Number(makingTotal || 0));
      if (netMetalSales > 0) await adjustAccountBalance(tx, businessId, "3010", netMetalSales);

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      action,
      creditNoteNumber,
      originalInvoiceNumber,
      returnedItems = [],
      totalRefundAmount = 0,
      refundMethod = "Credit Note",
      customerPhone,
    } = body;

    if (action !== "sales_return" || !originalInvoiceNumber) {
      return NextResponse.json(
        { error: "Valid action='sales_return' and originalInvoiceNumber are required." },
        { status: 400 }
      );
    }

    await ensureBusinessRecord(businessId);

    const summary = await prisma.$transaction(async (tx) => {
      const restockedIds: string[] = [];

      for (const item of returnedItems) {
        let matchedStock = null;
        if (item.stockItemId) {
          matchedStock = await tx.stockItem.findUnique({ where: { id: item.stockItemId } });
        }
        if (!matchedStock && item.barcode) {
          matchedStock = await tx.stockItem.findUnique({ where: { barcode: item.barcode } });
        }

        if (matchedStock) {
          const dest = item.restockDestination || "showcase";
          const toStatus =
            dest === "repair_vault"
              ? "IN_REPAIR"
              : dest === "melting_scrap"
              ? "IN_VAULT"
              : "IN_SHOWCASE";
          const toLocation =
            dest === "repair_vault"
              ? "Repair Workshop Safe"
              : dest === "melting_scrap"
              ? "Vault Safe #Melting Box"
              : matchedStock.trayLocation || "Showcase Tray #1";

          await tx.stockItem.update({
            where: { id: matchedStock.id },
            data: { status: toStatus as any, trayLocation: toLocation },
          });

          await tx.stockMovement.create({
            data: {
              stockItemId: matchedStock.id,
              fromStatus: matchedStock.status,
              toStatus: toStatus as any,
              fromLocation: "CUSTOMER",
              toLocation,
              reason: `Sales Return ${creditNoteNumber || ""} on Invoice ${originalInvoiceNumber}`.trim(),
              referenceType: "SALES_RETURN",
              referenceId: creditNoteNumber || originalInvoiceNumber,
            },
          });

          restockedIds.push(matchedStock.id);
        }
      }

      const refundAmt = Number(totalRefundAmount || 0);
      if (refundAmt > 0) {
        // Reverse revenue on 3010
        await adjustAccountBalance(tx, businessId, "3010", -refundAmt);

        const mode = String(refundMethod).toLowerCase();
        if (mode.includes("cash")) {
          await adjustAccountBalance(tx, businessId, "1010", -refundAmt);
        } else if (mode.includes("upi")) {
          await adjustAccountBalance(tx, businessId, "1030", -refundAmt);
        } else if (mode.includes("bank")) {
          await adjustAccountBalance(tx, businessId, "1020", -refundAmt);
        } else {
          // Credit Note -> grant customer store credit (negative outstandingDue) if matched by phone
          if (customerPhone) {
            const existingCust = await tx.customer.findUnique({
              where: { businessId_phone: { businessId, phone: String(customerPhone).trim() } },
            });
            if (existingCust) {
              await tx.customer.update({
                where: { id: existingCust.id },
                data: { outstandingDue: { decrement: new Prisma.Decimal(refundAmt) } },
              });
            }
          }
          await adjustAccountBalance(tx, businessId, "2030", refundAmt);
        }
      }

      return { restockedIds };
    });

    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist sales return.", details: String(error) },
      { status: 500 }
    );
  }
}
