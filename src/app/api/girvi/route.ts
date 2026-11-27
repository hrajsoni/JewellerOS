import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { mapDbGirviLoan } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const loans = await prisma.girviLoan.findMany({
      where: { businessId: tenantId },
      include: { pledgedOrnaments: true },
      orderBy: { startDate: "desc" },
      take: 200,
    });

    return NextResponse.json({
      success: true,
      loans: loans.map(mapDbGirviLoan),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch Girvi loans.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      loanNumber,
      packetNumber,
      safeLocation = "Vault Tijori #1",
      customerName,
      customerPhone,
      customerCity = "Jaipur",
      customerAddress = "",
      ornamentName,
      metal = "gold",
      purity = "22K",
      grossWeight,
      netWeight,
      principalAmount,
      monthlyInterestRate = 1.5,
      durationMonths = 6,
      notes,
    } = body;

    if (!customerName || !customerPhone || !ornamentName || !principalAmount) {
      return NextResponse.json(
        { error: "customerName, customerPhone, ornamentName, and principalAmount are required." },
        { status: 400 }
      );
    }

    await ensureBusinessRecord(businessId);

    const startDate = new Date();
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + Number(durationMonths || 6));

    const generatedLoanNo = loanNumber || `GL-${startDate.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const generatedPacketNo = packetNumber || `PKT-${Math.floor(100 + Math.random() * 900)}`;

    const created = await prisma.$transaction(async (tx) => {
      const loan = await tx.girviLoan.create({
        data: {
          businessId,
          loanNumber: generatedLoanNo,
          packetNumber: generatedPacketNo,
          safeLocation,
          customerName,
          customerPhone,
          customerCity,
          customerAddress,
          startDate,
          dueDate,
          principalAmount: new Prisma.Decimal(principalAmount),
          monthlyInterestRate: new Prisma.Decimal(monthlyInterestRate),
          durationMonths: Number(durationMonths || 6),
          status: "ACTIVE",
          notes: notes || undefined,
          pledgedOrnaments: {
            create: [
              {
                name: ornamentName,
                metal: String(metal).toUpperCase() === "SILVER" ? "SILVER" : "GOLD",
                purity,
                grossWeight: new Prisma.Decimal(grossWeight || 0),
                netWeight: new Prisma.Decimal(netWeight || grossWeight || 0),
              },
            ],
          },
        },
        include: { pledgedOrnaments: true },
      });

      // Double-entry: Cash Drawer (1010) decreases, Girvi Loan Book (1060) increases
      await adjustAccountBalance(tx, businessId, "1010", -Number(principalAmount));
      await adjustAccountBalance(tx, businessId, "1060", Number(principalAmount));

      return loan;
    });

    return NextResponse.json({ success: true, loan: mapDbGirviLoan(created) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create Girvi loan.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      loanId,
      loanNumber,
      action = "release",
      interestPaid = 0,
      principalPaid = 0,
    } = body;

    if (!loanId && !loanNumber) {
      return NextResponse.json({ error: "loanId or loanNumber is required." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = loanId
        ? await tx.girviLoan.findUnique({ where: { id: loanId } })
        : await tx.girviLoan.findFirst({ where: { businessId, loanNumber } });

      if (!existing) {
        throw new Error("Girvi loan not found");
      }

      if (action === "release") {
        const remainingPrincipal =
          Number(existing.principalAmount) - Number(existing.principalRepaid);
        const loan = await tx.girviLoan.update({
          where: { id: existing.id },
          data: {
            status: "RELEASED",
            settledDate: new Date(),
            principalRepaid: existing.principalAmount,
            totalInterestPaid: { increment: new Prisma.Decimal(interestPaid || 0) },
          },
          include: { pledgedOrnaments: true },
        });

        await adjustAccountBalance(tx, businessId, "1010", remainingPrincipal + Number(interestPaid || 0));
        await adjustAccountBalance(tx, businessId, "1060", -remainingPrincipal);
        if (Number(interestPaid) > 0) {
          await adjustAccountBalance(tx, businessId, "3030", Number(interestPaid));
        }

        return loan;
      }

      const loan = await tx.girviLoan.update({
        where: { id: existing.id },
        data: {
          principalRepaid: { increment: new Prisma.Decimal(principalPaid || 0) },
          totalInterestPaid: { increment: new Prisma.Decimal(interestPaid || 0) },
        },
        include: { pledgedOrnaments: true },
      });

      const totalCollected = Number(principalPaid || 0) + Number(interestPaid || 0);
      await adjustAccountBalance(tx, businessId, "1010", totalCollected);
      if (Number(principalPaid) > 0) {
        await adjustAccountBalance(tx, businessId, "1060", -Number(principalPaid));
      }
      if (Number(interestPaid) > 0) {
        await adjustAccountBalance(tx, businessId, "3030", Number(interestPaid));
      }

      return loan;
    });

    return NextResponse.json({ success: true, loan: mapDbGirviLoan(updated) });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update Girvi loan.", details: String(error) },
      { status: 500 }
    );
  }
}
