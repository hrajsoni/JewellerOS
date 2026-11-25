import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const rates = await prisma.metalRate.findMany({
      where: { businessId: tenantId },
      orderBy: { effectiveAt: "desc" },
      take: 20,
    });

    return NextResponse.json({ success: true, rates });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch metal rates from database.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      rates = [],
      updatedById,
      source = "MANUAL",
      notes,
    } = body;

    if (!Array.isArray(rates) || rates.length === 0) {
      return NextResponse.json(
        { error: "Rates array must contain at least one metal rate entry." },
        { status: 400 }
      );
    }

    const createdRates = await prisma.$transaction(async (tx) => {
      const records = [];
      for (const r of rates) {
        const created = await tx.metalRate.create({
          data: {
            businessId,
            metal: r.metal || "GOLD",
            purityKey: r.purityKey || r.purity || "24K",
            purityPercent: new Prisma.Decimal(r.purityPercent || 1.0),
            sellingRate: new Prisma.Decimal(r.sellingRate || r.rate),
            purchaseRate: new Prisma.Decimal(r.purchaseRate || (r.sellingRate || r.rate) * 0.97),
            updatedById: updatedById || undefined,
            source,
            notes: notes || undefined,
          },
        });
        records.push(created);
      }

      // Record audit log
      await tx.auditLog.create({
        data: {
          userId: updatedById || undefined,
          action: "UPDATE_METAL_RATES",
          entityType: "METAL_RATE",
          entityId: businessId,
          newData: { ratesCount: rates.length, source, notes },
        },
      });

      return records;
    });

    return NextResponse.json({ success: true, count: createdRates.length, rates: createdRates }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist metal rates.", details: String(error) },
      { status: 500 }
    );
  }
}
