import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbMemo, mapDbB2BPartner } from "@/lib/prismaMappers";
import { ensureBusinessRecord } from "@/lib/prismaBusinessHelper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const [memos, partners] = await Promise.all([
      prisma.consignmentMemo.findMany({
        where: { businessId: tenantId },
        include: { items: true },
        orderBy: { issueDate: "desc" },
        take: 100,
      }),
      prisma.b2BPartner.findMany({
        where: { businessId: tenantId },
        include: { _count: { select: { memos: true } } },
        orderBy: { businessName: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      memos: memos.map(mapDbMemo),
      partners: partners.map(mapDbB2BPartner),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch wholesale memos.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, businessId = "tenant-sandhya-jaipur", payload = {} } = body;
    await ensureBusinessRecord(businessId);

    if (action === "add_partner") {
      const partner = await prisma.b2BPartner.create({
        data: {
          businessId,
          businessName: payload.businessName,
          contactPerson: payload.contactPerson || payload.businessName,
          phone: payload.phone || "",
          city: payload.city || "Jaipur",
          address: payload.address || undefined,
          gstin: payload.gstin || undefined,
        },
      });
      return NextResponse.json({ success: true, partner: mapDbB2BPartner(partner) }, { status: 201 });
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    const issueDate = new Date();
    const validUntil = new Date(issueDate);
    validUntil.setDate(validUntil.getDate() + Number(payload.validDays || 15));

    const totalPieces = items.length;
    const totalGrossWeight = items.reduce((s: number, it: any) => s + Number(it.grossWeight || 0), 0);
    const totalNetWeight = items.reduce((s: number, it: any) => s + Number(it.netWeight || 0), 0);
    const totalFineWeight = items.reduce((s: number, it: any) => s + Number(it.fineWeight || 0), 0);
    const totalEstimatedValue = items.reduce((s: number, it: any) => s + Number(it.totalValue || 0), 0);

    const memoNumber =
      payload.memoNumber || `MEMO-${issueDate.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const memo = await prisma.$transaction(async (tx) => {
      const created = await tx.consignmentMemo.create({
        data: {
          businessId,
          memoNumber,
          partnerName: payload.jewellerPartnerName,
          partnerPhone: payload.jewellerPhone || "",
          partnerCity: payload.jewellerCity || "Jaipur",
          partnerGstin: payload.jewellerGstin || undefined,
          issueDate,
          validUntilDate: validUntil,
          totalPieces,
          totalGrossWeight: new Prisma.Decimal(totalGrossWeight),
          totalNetWeight: new Prisma.Decimal(totalNetWeight),
          totalFineWeight: new Prisma.Decimal(totalFineWeight),
          totalEstimatedValue: new Prisma.Decimal(totalEstimatedValue),
          status: "active_issued",
          notes: payload.notes || undefined,
          items: {
            create: items.map((it: any) => ({
              stockItemId: it.stockItemId || undefined,
              sku: it.sku || undefined,
              barcode: it.barcode || undefined,
              name: it.name,
              category: it.category || "Chains",
              metal: String(it.metal || "gold").toUpperCase() === "SILVER" ? "SILVER" : "GOLD",
              purity: it.purity || "22K",
              grossWeight: new Prisma.Decimal(it.grossWeight || 0),
              netWeight: new Prisma.Decimal(it.netWeight || 0),
              fineWeight: new Prisma.Decimal(it.fineWeight || 0),
              wholesaleRate: new Prisma.Decimal(it.wholesaleRate || 0),
              totalValue: new Prisma.Decimal(it.totalValue || 0),
              status: "on_memo",
            })),
          },
        },
        include: { items: true },
      });

      // Mark referenced stock items as ON_MEMO
      for (const it of items) {
        if (it.stockItemId) {
          await tx.stockItem
            .update({
              where: { id: it.stockItemId },
              data: { status: "ON_MEMO" },
            })
            .catch(() => {});
        }
      }

      return created;
    });

    return NextResponse.json({ success: true, memo: mapDbMemo(memo) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create wholesale memo.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { action, memoId, itemIds = [], invoiceNumber } = body;

    if (!memoId) {
      return NextResponse.json({ error: "memoId is required." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const targetStatus = action === "convert" ? "sold_billed" : "returned_to_stock";
      const stockStatus = action === "convert" ? "SOLD" : "IN_SHOWCASE";

      if (itemIds.length > 0) {
        await tx.consignmentMemoItem.updateMany({
          where: { memoId, id: { in: itemIds } },
          data: { status: targetStatus },
        });

        const affectedItems = await tx.consignmentMemoItem.findMany({
          where: { memoId, id: { in: itemIds } },
        });

        for (const it of affectedItems) {
          if (it.stockItemId) {
            await tx.stockItem
              .update({ where: { id: it.stockItemId }, data: { status: stockStatus } })
              .catch(() => {});
          }
        }
      }

      const allItems = await tx.consignmentMemoItem.findMany({ where: { memoId } });
      const remaining = allItems.filter((i) => i.status === "on_memo").length;
      const anySold = allItems.some((i) => i.status === "sold_billed");

      const memoStatus =
        remaining === 0
          ? anySold
            ? "fully_converted_invoice"
            : "fully_returned"
          : "partially_settled";

      return tx.consignmentMemo.update({
        where: { id: memoId },
        data: {
          status: memoStatus,
          ...(invoiceNumber ? { convertedInvoiceNumber: invoiceNumber } : {}),
        },
        include: { items: true },
      });
    });

    return NextResponse.json({ success: true, memo: mapDbMemo(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update wholesale memo.", details: String(error) },
      { status: 500 }
    );
  }
}
