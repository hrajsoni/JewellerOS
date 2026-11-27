import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { resolveRequestBusinessId } from "@/lib/authSessionHelper";

export async function GET(request: Request) {
  try {
    const tenantId = await resolveRequestBusinessId(request);

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

import { mapDbExpense, mapDbClosing } from "@/lib/prismaMappers";
import { ensureBusinessRecord, adjustAccountBalance } from "@/lib/prismaBusinessHelper";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const resolvedBusinessId = await resolveRequestBusinessId(request, body);
    const {
      action,
      businessId = resolvedBusinessId,
      voucherNumber,
      description,
      lines = [],
      payload = {},
    } = body;

    await ensureBusinessRecord(businessId);

    if (action === "record_expense") {
      const amount = Number(payload.amount || 0);
      const expense = await prisma.$transaction(async (tx) => {
        const created = await tx.shopExpense.create({
          data: {
            businessId,
            category: payload.category || "Misc",
            amount: new Prisma.Decimal(amount),
            paymentMode: payload.paymentMode || "Cash",
            paidTo: payload.paidTo || "Vendor",
            voucherNumber: payload.voucherNumber || `EXP-${Date.now()}`,
            notes: payload.notes || undefined,
            recordedBy: payload.recordedBy || "Staff",
          },
        });
        const acct = String(payload.paymentMode || "Cash").toLowerCase().includes("bank")
          ? "1020"
          : String(payload.paymentMode || "Cash").toLowerCase().includes("upi")
          ? "1030"
          : "1010";
        await adjustAccountBalance(tx, businessId, acct, -amount);
        await adjustAccountBalance(tx, businessId, "4010", amount);
        return created;
      });
      return NextResponse.json({ success: true, expense: mapDbExpense(expense) }, { status: 201 });
    }

    if (action === "record_closing") {
      const closing = await prisma.$transaction(async (tx) => {
        const upserted = await tx.dailyCashClosing.upsert({
          where: { businessId_date: { businessId, date: payload.date } },
          update: {
            openingCash: new Prisma.Decimal(payload.openingCash || 0),
            cashSales: new Prisma.Decimal(payload.cashSales || 0),
            cashAdvances: new Prisma.Decimal(payload.cashAdvances || 0),
            supplierCashPaid: new Prisma.Decimal(payload.supplierCashPaid || 0),
            karigarCashPaid: new Prisma.Decimal(payload.karigarCashPaid || 0),
            cashExpenses: new Prisma.Decimal(payload.cashExpenses || 0),
            expectedCash: new Prisma.Decimal(payload.expectedCash || 0),
            physicalCash: new Prisma.Decimal(payload.physicalCash || 0),
            discrepancy: new Prisma.Decimal(payload.discrepancy || 0),
            status: payload.status || "tallied",
            denominations: payload.denominations || {},
            closedBy: payload.closedBy || "Owner",
            notes: payload.notes || undefined,
          },
          create: {
            businessId,
            date: payload.date,
            openingCash: new Prisma.Decimal(payload.openingCash || 0),
            cashSales: new Prisma.Decimal(payload.cashSales || 0),
            cashAdvances: new Prisma.Decimal(payload.cashAdvances || 0),
            supplierCashPaid: new Prisma.Decimal(payload.supplierCashPaid || 0),
            karigarCashPaid: new Prisma.Decimal(payload.karigarCashPaid || 0),
            cashExpenses: new Prisma.Decimal(payload.cashExpenses || 0),
            expectedCash: new Prisma.Decimal(payload.expectedCash || 0),
            physicalCash: new Prisma.Decimal(payload.physicalCash || 0),
            discrepancy: new Prisma.Decimal(payload.discrepancy || 0),
            status: payload.status || "tallied",
            denominations: payload.denominations || {},
            closedBy: payload.closedBy || "Owner",
            notes: payload.notes || undefined,
          },
        });
        await tx.account.updateMany({
          where: { businessId, code: "1010" },
          data: { currentBalance: new Prisma.Decimal(payload.physicalCash || 0) },
        });
        return upserted;
      });
      return NextResponse.json({ success: true, closing: mapDbClosing(closing) }, { status: 201 });
    }

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
