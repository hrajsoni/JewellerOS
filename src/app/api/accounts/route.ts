import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId") || "tenant-sandhya-jaipur";

    const accounts = await prisma.account.findMany({
      where: { businessId: tenantId },
      include: {
        journalLines: {
          orderBy: { journalEntry: { date: "desc" } },
          take: 10,
          include: {
            journalEntry: true,
          },
        },
      },
      orderBy: { code: "asc" },
    });

    const recentVouchers = await prisma.journalEntry.findMany({
      where: { businessId: tenantId },
      include: {
        lines: {
          include: {
            account: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    return NextResponse.json({ success: true, accounts, recentVouchers });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch accounts ledger from database.", details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      businessId = "tenant-sandhya-jaipur",
      voucherNumber,
      description,
      lines = [],
    } = body;

    if (!voucherNumber || !description || !Array.isArray(lines) || lines.length < 2) {
      return NextResponse.json(
        { error: "A valid journal voucher requires voucherNumber, description, and at least 2 balanced lines." },
        { status: 400 }
      );
    }

    // Verify double-entry balance: sum(debits) === sum(credits)
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      totalDebit += Number(line.debitAmount || 0);
      totalCredit += Number(line.creditAmount || 0);
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        {
          error: `Unbalanced journal entry: Total Debits (₹${totalDebit.toFixed(2)}) must equal Total Credits (₹${totalCredit.toFixed(2)}).`,
        },
        { status: 422 }
      );
    }

    const entry = await prisma.$transaction(async (tx) => {
      const createdEntry = await tx.journalEntry.create({
        data: {
          businessId,
          voucherNumber,
          description,
          lines: {
            create: lines.map((l: any) => ({
              accountId: l.accountId,
              debitAmount: new Prisma.Decimal(l.debitAmount || 0),
              creditAmount: new Prisma.Decimal(l.creditAmount || 0),
            })),
          },
        },
        include: {
          lines: true,
        },
      });

      return createdEntry;
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to record journal voucher.", details: String(error) },
      { status: 500 }
    );
  }
}
