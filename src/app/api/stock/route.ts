import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";
    const status = searchParams.get("status");
    const metal = searchParams.get("metal");

    const where: any = { businessId: tenantId };
    if (status) where.status = status;
    if (metal) where.metal = metal;

    const items = await prisma.stockItem.findMany({
      where,
      include: {
        product: true,
        movements: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
      },
      orderBy: { dateAcquired: "desc" },
      take: 200,
    });

    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to query stock items from database.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      barcode,
      sku,
      title,
      category = "Rings",
      metal = "GOLD",
      purityKey = "22K",
      grossWeight,
      stoneWeight = 0,
      otherDeductions = 0,
      netWeight,
      fineGoldEq,
      makingType = "PERCENTAGE",
      makingValue = 18,
      acquisitionCost = 0,
      trayLocation = "Showcase Tray #1",
      huid,
      supplierId,
    } = body;

    if (!barcode || !sku || !title || !grossWeight || !netWeight) {
      return NextResponse.json(
        { error: "Barcode, SKU, title, grossWeight, and netWeight are required." },
        { status: 400 }
      );
    }

    const normalizedMetal = String(metal || "GOLD").toUpperCase() === "SILVER" ? "SILVER" : "GOLD";
    const normalizedMaking =
      String(makingType).toLowerCase() === "per_gram"
        ? "PER_GRAM"
        : String(makingType).toLowerCase() === "fixed"
        ? "FIXED"
        : "PERCENTAGE";

    const created = await prisma.$transaction(async (tx) => {
      // Find or create category product
      let product = await tx.product.findFirst({
        where: { businessId, name: title, category },
      });

      if (!product) {
        product = await tx.product.create({
          data: {
            businessId,
            name: title,
            category,
            metal: normalizedMetal as any,
            defaultPurity: purityKey,
            hsnCode: "7113",
            standardMaking: new Prisma.Decimal(makingValue),
            makingType: normalizedMaking as any,
          },
        });
      }

      // Create StockItem
      const stock = await tx.stockItem.upsert({
        where: { barcode },
        update: {
          status: "IN_SHOWCASE",
          trayLocation,
        },
        create: {
          businessId,
          productId: product.id,
          barcode,
          sku,
          title,
          metal: normalizedMetal as any,
          purityKey,
          grossWeight: new Prisma.Decimal(grossWeight),
          stoneWeight: new Prisma.Decimal(stoneWeight),
          otherDeductions: new Prisma.Decimal(otherDeductions),
          netWeight: new Prisma.Decimal(netWeight),
          fineGoldEq: new Prisma.Decimal(fineGoldEq || netWeight),
          makingType: normalizedMaking as any,
          makingValue: new Prisma.Decimal(makingValue),
          acquisitionCost: new Prisma.Decimal(acquisitionCost),
          trayLocation,
          status: "IN_SHOWCASE",
          huid: huid || undefined,
          supplierId: supplierId || undefined,
        },
      });

      // Record Initial Inward Movement
      await tx.stockMovement.create({
        data: {
          stockItemId: stock.id,
          fromStatus: "IN_SHOWCASE",
          toStatus: "IN_SHOWCASE",
          fromLocation: "PURCHASE_INTAKE",
          toLocation: trayLocation || "SHOWCASE",
          reason: `Initial Inwarding ${barcode}`,
          referenceType: "INWARD",
        },
      });

      return stock;
    });

    return NextResponse.json({ success: true, item: created }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to inward stock item.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      stockItemId,
      barcode,
      action,
      status,
      trayLocation,
      reason = "Status updated",
      title,
      purityKey,
      grossWeight,
      stoneWeight,
      otherDeductions,
      netWeight,
      fineGoldEq,
      makingType,
      makingValue,
      acquisitionCost,
      huid,
    } = body;

    if (!stockItemId && !barcode) {
      return NextResponse.json({ error: "stockItemId or barcode required" }, { status: 400 });
    }

    const existing = stockItemId
      ? await prisma.stockItem.findUnique({ where: { id: stockItemId } })
      : await prisma.stockItem.findUnique({ where: { barcode } });

    if (!existing) {
      return NextResponse.json({ error: "Stock item not found" }, { status: 404 });
    }

    if (action === "edit_item") {
      const normalizedMaking = makingType
        ? String(makingType).toLowerCase() === "per_gram"
          ? "PER_GRAM"
          : String(makingType).toLowerCase() === "fixed"
          ? "FIXED"
          : "PERCENTAGE"
        : existing.makingType;

      const updatedItem = await prisma.stockItem.update({
        where: { id: existing.id },
        data: {
          ...(title ? { title: String(title) } : {}),
          ...(purityKey ? { purityKey: String(purityKey) } : {}),
          ...(grossWeight !== undefined ? { grossWeight: new Prisma.Decimal(grossWeight) } : {}),
          ...(stoneWeight !== undefined ? { stoneWeight: new Prisma.Decimal(stoneWeight) } : {}),
          ...(otherDeductions !== undefined
            ? { otherDeductions: new Prisma.Decimal(otherDeductions) }
            : {}),
          ...(netWeight !== undefined ? { netWeight: new Prisma.Decimal(netWeight) } : {}),
          ...(fineGoldEq !== undefined ? { fineGoldEq: new Prisma.Decimal(fineGoldEq) } : {}),
          makingType: normalizedMaking as any,
          ...(makingValue !== undefined ? { makingValue: new Prisma.Decimal(makingValue) } : {}),
          ...(acquisitionCost !== undefined
            ? { acquisitionCost: new Prisma.Decimal(acquisitionCost) }
            : {}),
          ...(trayLocation ? { trayLocation: String(trayLocation) } : {}),
          ...(huid !== undefined ? { huid: huid ? String(huid) : null } : {}),
        },
      });

      return NextResponse.json({ success: true, item: updatedItem });
    }

    const targetStatus = String(status || "IN_SHOWCASE").toUpperCase();

    const updated = await prisma.$transaction(async (tx) => {
      const item = await tx.stockItem.update({
        where: { id: existing.id },
        data: {
          status: targetStatus as any,
          ...(trayLocation ? { trayLocation } : {}),
        },
      });

      await tx.stockMovement.create({
        data: {
          stockItemId: existing.id,
          fromStatus: existing.status,
          toStatus: targetStatus as any,
          fromLocation: existing.trayLocation || "SHOWCASE",
          toLocation: trayLocation || existing.trayLocation || "SHOWCASE",
          reason,
          referenceType: "MANUAL_STATUS_CHANGE",
        },
      });

      return item;
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update stock item.", details: String(error) },
      { status: 500 }
    );
  }
}
