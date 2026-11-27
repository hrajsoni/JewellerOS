import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbKarigar, mapDbKarigarTxn, mapDbJobCard } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";
import { resolveRequestBusinessId } from "@/lib/authSessionHelper";

export async function GET(request: Request) {
  try {
    const tenantId = await resolveRequestBusinessId(request);

    const [karigars, transactions, jobCards] = await Promise.all([
      prisma.karigar.findMany({ where: { businessId: tenantId }, orderBy: { name: "asc" } }),
      prisma.karigarTransaction.findMany({
        where: { karigar: { businessId: tenantId } },
        include: { karigar: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 200,
      }),
      prisma.jobCard.findMany({ where: { businessId: tenantId }, orderBy: { createdAt: "desc" }, take: 200 }),
    ]);

    return NextResponse.json({
      success: true,
      karigars: karigars.map(mapDbKarigar),
      transactions: transactions.map(mapDbKarigarTxn),
      jobCards: jobCards.map(mapDbJobCard),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Karigar records.", details: String(error) },
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

    if (action === "add_karigar") {
      const created = await prisma.karigar.create({
        data: {
          businessId,
          name: payload.name,
          phone: payload.phone || "",
          workshopCity: payload.workshopCity || "Jaipur",
          specialty: payload.specialty || "General Jewellery",
        },
      });
      return NextResponse.json({ success: true, karigar: mapDbKarigar(created) }, { status: 201 });
    }

    if (action === "issue_metal") {
      const metalType = String(payload.metal || "gold").toUpperCase() === "SILVER" ? "SILVER" : "GOLD";
      const fine = Number(payload.fineWeight || 0);

      const res = await prisma.$transaction(async (tx) => {
        const karigar = await tx.karigar.update({
          where: { id: payload.karigarId },
          data:
            metalType === "SILVER"
              ? { pureSilverBalance: { increment: new Prisma.Decimal(fine) } }
              : { pureGoldBalanceGrams: { increment: new Prisma.Decimal(fine) } },
        });

        const txn = await tx.karigarTransaction.create({
          data: {
            karigarId: karigar.id,
            type: "ISSUE_METAL",
            metal: metalType,
            grossWeight: new Prisma.Decimal(payload.grossWeight || fine),
            netWeight: new Prisma.Decimal(fine),
            fineWeightDelta: new Prisma.Decimal(fine),
            ornamentName: payload.ornamentOrderName || undefined,
            notes: payload.notes || undefined,
          },
          include: { karigar: { select: { name: true } } },
        });

        return { karigar, txn };
      });

      return NextResponse.json({
        success: true,
        karigar: mapDbKarigar(res.karigar),
        transaction: mapDbKarigarTxn(res.txn),
      });
    }

    if (action === "receive_ornament") {
      const metalType = String(payload.metal || "gold").toUpperCase() === "SILVER" ? "SILVER" : "GOLD";
      const fineReturned = Number(payload.fineReturned || payload.netWeight || 0);
      const labourDue = Number(payload.labourCharges || 0);

      const res = await prisma.$transaction(async (tx) => {
        const karigar = await tx.karigar.update({
          where: { id: payload.karigarId },
          data: {
            ...(metalType === "SILVER"
              ? { pureSilverBalance: { decrement: new Prisma.Decimal(fineReturned) } }
              : { pureGoldBalanceGrams: { decrement: new Prisma.Decimal(fineReturned) } }),
            labourBalanceDue: { increment: new Prisma.Decimal(labourDue) },
          },
        });

        const txn = await tx.karigarTransaction.create({
          data: {
            karigarId: karigar.id,
            type: "RECEIVE_ORNAMENT",
            metal: metalType,
            grossWeight: new Prisma.Decimal(payload.grossWeight || fineReturned),
            netWeight: new Prisma.Decimal(payload.netWeight || fineReturned),
            fineWeightDelta: new Prisma.Decimal(-fineReturned),
            ornamentName: payload.ornamentName || "Finished Ornament",
            labourAmount: new Prisma.Decimal(labourDue),
            notes: payload.notes || undefined,
          },
          include: { karigar: { select: { name: true } } },
        });

        // Inward finished ornament into central showcase StockItem if inward flag or name provided
        if (payload.inwardToStock !== false) {
          let product = await tx.product.findFirst({
            where: { businessId, name: payload.ornamentName || "Karigar Finished Ornament" },
          });
          if (!product) {
            product = await tx.product.create({
              data: {
                businessId,
                name: payload.ornamentName || "Karigar Finished Ornament",
                category: payload.category || "Rings",
                metal: metalType,
                defaultPurity: payload.purity || "22K",
                hsnCode: "7113",
              },
            });
          }

          const barcode = payload.barcode || `KAR-${Date.now()}-${Math.floor(Math.random() * 900)}`;
          await tx.stockItem.create({
            data: {
              businessId,
              productId: product.id,
              barcode,
              sku: payload.sku || barcode,
              title: payload.ornamentName || "Karigar Finished Ornament",
              metal: metalType,
              purityKey: payload.purity || "22K",
              grossWeight: new Prisma.Decimal(payload.grossWeight || fineReturned),
              stoneWeight: new Prisma.Decimal(0),
              otherDeductions: new Prisma.Decimal(0),
              netWeight: new Prisma.Decimal(payload.netWeight || fineReturned),
              fineGoldEq: new Prisma.Decimal(fineReturned),
              makingValue: new Prisma.Decimal(15),
              acquisitionCost: new Prisma.Decimal(labourDue),
              trayLocation: "Showcase Tray #1",
              status: "IN_SHOWCASE",
              huid: payload.huid || undefined,
            },
          });
        }

        if (labourDue > 0) {
          await adjustAccountBalance(tx, businessId, "2020", labourDue);
        }

        return { karigar, txn };
      });

      return NextResponse.json({
        success: true,
        karigar: mapDbKarigar(res.karigar),
        transaction: mapDbKarigarTxn(res.txn),
      });
    }

    if (action === "pay_labour") {
      const amount = Number(payload.amount || 0);
      const res = await prisma.$transaction(async (tx) => {
        const karigar = await tx.karigar.update({
          where: { id: payload.karigarId },
          data: { labourBalanceDue: { decrement: new Prisma.Decimal(amount) } },
        });
        const txn = await tx.karigarTransaction.create({
          data: {
            karigarId: karigar.id,
            type: "PAY_LABOUR",
            metal: "GOLD",
            fineWeightDelta: new Prisma.Decimal(0),
            paymentAmount: new Prisma.Decimal(amount),
            notes: payload.notes || undefined,
          },
          include: { karigar: { select: { name: true } } },
        });

        const cashAcct = String(payload.paymentMode || "Cash").toLowerCase().includes("bank")
          ? "1020"
          : String(payload.paymentMode || "Cash").toLowerCase().includes("upi")
          ? "1030"
          : "1010";
        await adjustAccountBalance(tx, businessId, cashAcct, -amount);
        await adjustAccountBalance(tx, businessId, "2020", -amount);

        return { karigar, txn };
      });

      return NextResponse.json({
        success: true,
        karigar: mapDbKarigar(res.karigar),
        transaction: mapDbKarigarTxn(res.txn),
      });
    }

    if (action === "create_job_card") {
      const jcNum = payload.jobCardNumber || `JC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const created = await prisma.jobCard.create({
        data: {
          businessId,
          karigarId: payload.karigarId,
          jobCardNumber: jcNum,
          karigarName: payload.karigarName || "Artisan",
          customerName: payload.customerName || undefined,
          customerPhone: payload.customerPhone || undefined,
          category: payload.category || "Rings",
          title: payload.title || "Custom Karigar Piece",
          description: payload.description || "",
          metal: String(payload.metal || "gold").toUpperCase() === "SILVER" ? "SILVER" : "GOLD",
          targetGrossWeight: new Prisma.Decimal(payload.targetGrossWeight || 0),
          targetNetWeight: new Prisma.Decimal(payload.targetNetWeight || 0),
          purity: payload.purity || "22K (916)",
          issuedFineWeightGrams: new Prisma.Decimal(payload.issuedFineWeightGrams || 0),
          expectedDeliveryDate: new Date(payload.expectedDeliveryDate || Date.now() + 7 * 86400000),
          labourRate: new Prisma.Decimal(payload.labourRate || 450),
          labourType: payload.labourType || "per_gram",
          allowedWastagePercent: new Prisma.Decimal(payload.allowedWastagePercent || 1.2),
        },
      });
      return NextResponse.json({ success: true, jobCard: mapDbJobCard(created) }, { status: 201 });
    }

    return NextResponse.json({ error: "Unsupported Karigar action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to persist Karigar action.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { jobCardId, status, huid } = body;
    if (!jobCardId || !status) {
      return NextResponse.json({ error: "jobCardId and status required" }, { status: 400 });
    }
    const updated = await prisma.jobCard.update({
      where: { id: jobCardId },
      data: {
        status,
        ...(huid ? { huid } : {}),
        ...(status === "completed" || status === "delivered" ? { completedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ success: true, jobCard: mapDbJobCard(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update Job Card status.", details: String(error) },
      { status: 500 }
    );
  }
}
