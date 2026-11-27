import prisma from "@/lib/prisma";
import { AccountType, MetalType, Prisma } from "@prisma/client";

export async function ensureBusinessRecord(businessId: string, name?: string) {
  const existing = await prisma.business.findUnique({ where: { id: businessId } });
  if (existing) return existing;

  return prisma.business.create({
    data: {
      id: businessId,
      name: name || "Showroom Workspace",
      legalEntityName: name || "Showroom Workspace",
      phone: "+91 94140 12345",
      address: "Sarafa Bazar",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      currency: "INR",
    },
  });
}

export async function seedDefaultAccountsForBusiness(
  tx: Prisma.TransactionClient,
  businessId: string
) {
  const defaults: Array<{ code: string; name: string; type: AccountType; balance: number }> = [
    { code: "1010", name: "Cash in Counter Drawer", type: AccountType.ASSET, balance: 50000 },
    { code: "1020", name: "HDFC Bank Current Account", type: AccountType.ASSET, balance: 250000 },
    { code: "1030", name: "ICICI Merchant UPI / QR", type: AccountType.ASSET, balance: 0 },
    { code: "1040", name: "Fine Bullion & Old Gold Safe", type: AccountType.ASSET, balance: 0 },
    { code: "1050", name: "Customer Credit Receivables", type: AccountType.ASSET, balance: 0 },
    { code: "1060", name: "Girvi Loan Book (Pawn Receivables)", type: AccountType.ASSET, balance: 0 },
    { code: "2010", name: "Wholesale Supplier Payables", type: AccountType.LIABILITY, balance: 0 },
    { code: "2020", name: "Karigar Labour & Making Due", type: AccountType.LIABILITY, balance: 0 },
    { code: "2030", name: "Customer Booking Advances", type: AccountType.LIABILITY, balance: 0 },
    { code: "2040", name: "GST Output Payable Pool", type: AccountType.LIABILITY, balance: 0 },
    { code: "2050", name: "Customer Credit Notes Payable", type: AccountType.LIABILITY, balance: 0 },
    { code: "3010", name: "Retail Jewellery Sales Revenue", type: AccountType.REVENUE, balance: 0 },
    { code: "3020", name: "Making Charges Income (Ghadai)", type: AccountType.REVENUE, balance: 0 },
    { code: "3030", name: "Girvi Loan Interest Income", type: AccountType.REVENUE, balance: 0 },
    { code: "4010", name: "Showroom Refreshments & Utilities", type: AccountType.EXPENSE, balance: 0 },
    { code: "4020", name: "BIS Hallmarking & Assaying Charges", type: AccountType.EXPENSE, balance: 0 },
    { code: "4030", name: "Inventory Asset / Cost of Goods", type: AccountType.ASSET, balance: 0 },
  ];

  for (const acc of defaults) {
    await tx.account.upsert({
      where: { businessId_code: { businessId, code: acc.code } },
      update: {},
      create: {
        businessId,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currentBalance: acc.balance,
      },
    });
  }
}

export async function seedDefaultRatesForBusiness(
  tx: Prisma.TransactionClient,
  businessId: string
) {
  const defaultRates = [
    { metal: MetalType.GOLD, purityKey: "24K", purityPercent: new Prisma.Decimal(1.0), sellingRate: new Prisma.Decimal(150000), purchaseRate: new Prisma.Decimal(145000) },
    { metal: MetalType.GOLD, purityKey: "22K", purityPercent: new Prisma.Decimal(0.9167), sellingRate: new Prisma.Decimal(137500), purchaseRate: new Prisma.Decimal(132500) },
    { metal: MetalType.GOLD, purityKey: "18K", purityPercent: new Prisma.Decimal(0.75), sellingRate: new Prisma.Decimal(112500), purchaseRate: new Prisma.Decimal(108000) },
    { metal: MetalType.GOLD, purityKey: "14K", purityPercent: new Prisma.Decimal(0.5833), sellingRate: new Prisma.Decimal(87500), purchaseRate: new Prisma.Decimal(84000) },
    { metal: MetalType.SILVER, purityKey: "999", purityPercent: new Prisma.Decimal(0.999), sellingRate: new Prisma.Decimal(95000), purchaseRate: new Prisma.Decimal(90000) },
    { metal: MetalType.SILVER, purityKey: "925", purityPercent: new Prisma.Decimal(0.925), sellingRate: new Prisma.Decimal(88000), purchaseRate: new Prisma.Decimal(83000) },
  ];

  for (const rate of defaultRates) {
    await tx.metalRate.create({
      data: {
        businessId,
        metal: rate.metal,
        purityKey: rate.purityKey,
        purityPercent: rate.purityPercent,
        sellingRate: rate.sellingRate,
        purchaseRate: rate.purchaseRate,
        source: "MARKET_DEFAULT",
        notes: "Baseline market rate seed",
      },
    });
  }
}

export async function seedDefaultSettingsForBusiness(
  tx: Prisma.TransactionClient,
  businessId: string,
  businessName?: string,
  phone?: string,
  email?: string
) {
  const name = businessName || "Showroom Workspace";
  await tx.showroomMasterSettings.upsert({
    where: { businessId },
    update: {},
    create: {
      businessId,
      showroomName: name,
      tagline: "Hallmarked Gold & Fine Certified Jewellery",
      addressLine1: "142 Sarafa Market",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      stateCode: "08",
      contactPhones: phone ? [phone] : ["+91 94140 12345"],
      email: email || "info@jewelleryos.com",
      gstin: "08AAAAJ1234F1Z8",
      bisHallmarkLicense: "HM/C-8901234567",
      invoiceFormat: "A4_DETAILED",
      defaultTaxRate: new Prisma.Decimal(3.0),
      thermalPrinterWidth: 50,
      barcodeTagFormat: "TAG_50x25_BUTTERFLY",
    },
  });
}

export async function adjustAccountBalance(
  tx: Prisma.TransactionClient,
  businessId: string,
  code: string,
  delta: number
) {
  if (!delta) return;
  const existing = await tx.account.findUnique({
    where: { businessId_code: { businessId, code } },
  });
  if (!existing) return;
  await tx.account.update({
    where: { id: existing.id },
    data: { currentBalance: { increment: new Prisma.Decimal(delta) } },
  });
}
