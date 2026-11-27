import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  mapDbBusinessToTenant,
  mapDbRatesToRecord,
  mapDbStockItem,
  mapDbInvoice,
  mapDbCustomer,
  mapDbAccount,
  mapDbExpense,
  mapDbClosing,
  mapDbGirviLoan,
  mapDbKarigar,
  mapDbKarigarTxn,
  mapDbJobCard,
  mapDbSupplier,
  mapDbPurchase,
  mapDbSupplierPayment,
  mapDbMemo,
  mapDbB2BPartner,
  mapDbRepair,
  mapDbBooking,
  mapDbStaffMember,
  mapDbStaffPayment,
  mapDbSettings,
} from "@/lib/prismaMappers";
import { resolveRequestBusinessId } from "@/lib/authSessionHelper";

export async function GET(request: Request) {
  try {
    const tenantId = await resolveRequestBusinessId(request);

    const [
      businesses,
      business,
      metalRatesRaw,
      stockRaw,
      invoicesRaw,
      customersRaw,
      accountsRaw,
      expensesRaw,
      closingsRaw,
      girviRaw,
      karigarsRaw,
      karigarTxnsRaw,
      jobCardsRaw,
      suppliersRaw,
      purchasesRaw,
      supplierPaymentsRaw,
      memosRaw,
      b2bPartnersRaw,
      repairsRaw,
      bookingsRaw,
      staffRaw,
      staffPaymentsRaw,
      settingsRaw,
    ] = await Promise.all([
      prisma.business.findMany({ orderBy: { createdAt: "asc" } }),
      prisma.business.findUnique({ where: { id: tenantId } }),
      prisma.metalRate.findMany({
        where: { businessId: tenantId },
        orderBy: { effectiveAt: "desc" },
        take: 20,
      }),
      prisma.stockItem.findMany({
        where: { businessId: tenantId },
        include: { product: true, supplier: true },
        orderBy: { dateAcquired: "desc" },
        take: 500,
      }),
      prisma.invoice.findMany({
        where: { businessId: tenantId },
        include: { items: true, payments: true, customer: true },
        orderBy: { invoiceDate: "desc" },
        take: 200,
      }),
      prisma.customer.findMany({
        where: { businessId: tenantId },
        include: { _count: { select: { invoices: true } } },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.account.findMany({
        where: { businessId: tenantId },
        orderBy: { code: "asc" },
      }),
      prisma.shopExpense.findMany({
        where: { businessId: tenantId },
        orderBy: { date: "desc" },
        take: 200,
      }),
      prisma.dailyCashClosing.findMany({
        where: { businessId: tenantId },
        orderBy: { date: "desc" },
        take: 60,
      }),
      prisma.girviLoan.findMany({
        where: { businessId: tenantId },
        include: { pledgedOrnaments: true },
        orderBy: { startDate: "desc" },
        take: 200,
      }),
      prisma.karigar.findMany({
        where: { businessId: tenantId },
        orderBy: { name: "asc" },
      }),
      prisma.karigarTransaction.findMany({
        where: { karigar: { businessId: tenantId } },
        include: { karigar: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 200,
      }),
      prisma.jobCard.findMany({
        where: { businessId: tenantId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      prisma.supplier.findMany({
        where: { businessId: tenantId },
        orderBy: { name: "asc" },
      }),
      prisma.purchaseInvoice.findMany({
        where: { businessId: tenantId },
        include: { items: true },
        orderBy: { invoiceDate: "desc" },
        take: 100,
      }),
      prisma.supplierPayment.findMany({
        where: { businessId: tenantId },
        include: { supplier: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 100,
      }),
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
      prisma.repairJob.findMany({
        where: { businessId: tenantId },
        orderBy: { intakeDate: "desc" },
        take: 100,
      }),
      prisma.customBookingOrder.findMany({
        where: { businessId: tenantId },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      prisma.staffMember.findMany({
        where: { businessId: tenantId },
        orderBy: { name: "asc" },
      }),
      prisma.staffPayment.findMany({
        where: { businessId: tenantId },
        include: { staff: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 200,
      }),
      prisma.showroomMasterSettings.findUnique({
        where: { businessId: tenantId },
      }),
    ]);

    const rateRecord = mapDbRatesToRecord(metalRatesRaw, tenantId);

    return NextResponse.json({
      success: true,
      tenantId,
      tenants: businesses.map((b) => mapDbBusinessToTenant(b)),
      rates: rateRecord,
      stockItems: stockRaw.map(mapDbStockItem),
      invoices: invoicesRaw.map((inv) => mapDbInvoice(inv, business)),
      customers: customersRaw.map(mapDbCustomer),
      accounts: accountsRaw.map(mapDbAccount),
      expenses: expensesRaw.map(mapDbExpense),
      dailyClosings: closingsRaw.map(mapDbClosing),
      girviLoans: girviRaw.map(mapDbGirviLoan),
      karigars: karigarsRaw.map(mapDbKarigar),
      karigarTxns: karigarTxnsRaw.map(mapDbKarigarTxn),
      jobCards: jobCardsRaw.map(mapDbJobCard),
      suppliers: suppliersRaw.map(mapDbSupplier),
      purchases: purchasesRaw.map(mapDbPurchase),
      supplierPayments: supplierPaymentsRaw.map(mapDbSupplierPayment),
      memos: memosRaw.map(mapDbMemo),
      b2bPartners: b2bPartnersRaw.map(mapDbB2BPartner),
      repairs: repairsRaw.map(mapDbRepair),
      bookings: bookingsRaw.map(mapDbBooking),
      staff: staffRaw.map(mapDbStaffMember),
      staffPayments: staffPaymentsRaw.map(mapDbStaffPayment),
      settings: mapDbSettings(settingsRaw, tenantId),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to bootstrap workspace from Neon PostgreSQL.", details: String(error) },
      { status: 500 }
    );
  }
}
