import prisma from "@/lib/prisma";
import { AccountType, Prisma } from "@prisma/client";

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
