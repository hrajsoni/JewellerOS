import { PrismaClient, AccountType, MetalType, RoleType, MakingType, StockStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedSaasPlatform } from "../src/lib/seedPlans";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding JewelleryOS Neon PostgreSQL database...");

  // 1. Seed Tenant Businesses
  const sandhya = await prisma.business.upsert({
    where: { id: "tenant-sandhya-jaipur" },
    update: {
      name: "Sandhya Jewellers",
      gstin: "08AAAAJ1234F1Z8",
      bisLicense: "HM-RJ-2026-8842",
    },
    create: {
      id: "tenant-sandhya-jaipur",
      name: "Sandhya Jewellers",
      legalEntityName: "Sandhya Jewellers Private Limited",
      gstin: "08AAAAJ1234F1Z8",
      bisLicense: "HM-RJ-2026-8842",
      panNumber: "AAAAJ1234F",
      phone: "+91 94140 12345",
      email: "sandhya.jewellers.jpr@gmail.com",
      address: "142 Sarafa Bazar, M.I. Road",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      currency: "INR",
    },
  });

  await prisma.business.upsert({
    where: { id: "tenant-rajputana-diamonds" },
    update: {},
    create: {
      id: "tenant-rajputana-diamonds",
      name: "Rajputana Gems & Jewels",
      legalEntityName: "Rajputana Gems Private Limited",
      gstin: "08AABCR5432B1Z2",
      bisLicense: "HM/C-7744112233",
      phone: "+91 98290 87654",
      email: "contact@rajputanajewels.in",
      address: "54 High Court Road, Sojati Gate",
      city: "Jodhpur",
      state: "Rajasthan",
      pincode: "342001",
      currency: "INR",
    },
  });

  // 2. Seed Main Branch
  const mainBranch = await prisma.branch.upsert({
    where: {
      businessId_code: {
        businessId: sandhya.id,
        code: "MAIN-01",
      },
    },
    update: {},
    create: {
      id: "branch-sandhya-main",
      businessId: sandhya.id,
      name: "Sarafa Bazar Flagship Showroom",
      code: "MAIN-01",
      phone: "+91 94140 12345",
      address: "142 Sarafa Bazar, M.I. Road, Jaipur",
      isMainVault: true,
    },
  });

  // 3. Seed Showroom Master Settings
  await prisma.showroomMasterSettings.upsert({
    where: { businessId: sandhya.id },
    update: {},
    create: {
      businessId: sandhya.id,
      showroomName: "Sandhya Jewellers",
      tagline: "Hallmarked Gold & Polki Heritage Jewellery",
      addressLine1: "142 Sarafa Bazar, M.I. Road",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      stateCode: "08",
      contactPhones: ["+91 94140 12345"],
      email: "sandhya.jewellers.jpr@gmail.com",
      gstin: "08AAAAJ1234F1Z8",
      bisHallmarkLicense: "HM-RJ-2026-8842",
      panNumber: "AAAAJ1234F",
      invoiceFormat: "A4_DETAILED",
      defaultTaxRate: 3.0,
      thermalPrinterWidth: 50,
      barcodeTagFormat: "TAG_50x25_BUTTERFLY",
    },
  });

  // 4. Seed RBAC Staff Users (with distinct salted bcrypt PINs)
  const usersToSeed: Array<{
    id: string;
    fullName: string;
    email: string;
    phone: string;
    role: RoleType;
    pin: string;
    monthlySalary?: number;
    advanceBalance: number;
  }> = [
    {
      id: "user-harshit-owner",
      fullName: "Harshit Raj",
      email: "harshit@sandhyajewellers.com",
      phone: "+91 94140 12345",
      role: RoleType.OWNER,
      pin: "884219",
      advanceBalance: 0,
    },
    {
      id: "user-sunil-mgr",
      fullName: "Sunil Mehta",
      email: "sunil@sandhyajewellers.com",
      phone: "+91 98290 11223",
      role: RoleType.MANAGER,
      pin: "451230",
      monthlySalary: 45000,
      advanceBalance: 0,
    },
    {
      id: "user-ramesh-sales",
      fullName: "Ramesh Verma",
      email: "ramesh@sandhyajewellers.com",
      phone: "+91 94140 98765",
      role: RoleType.SALESPERSON,
      pin: "289910",
      monthlySalary: 28000,
      advanceBalance: 2000,
    },
    {
      id: "user-vikram-inv",
      fullName: "Vikram Soni",
      email: "vikram@sandhyajewellers.com",
      phone: "+91 98291 55443",
      role: RoleType.INVENTORY_CLERK,
      pin: "554432",
      monthlySalary: 32000,
      advanceBalance: 0,
    },
    {
      id: "user-gopal-karigar",
      fullName: "Gopal Sharma",
      email: "gopal@sandhyajewellers.com",
      phone: "+91 94140 33445",
      role: RoleType.KARIGAR_MANAGER,
      pin: "334455",
      monthlySalary: 35000,
      advanceBalance: 5000,
    },
    {
      id: "user-pooja-acct",
      fullName: "Pooja Gupta",
      email: "pooja@sandhyajewellers.com",
      phone: "+91 98290 88776",
      role: RoleType.ACCOUNTANT,
      pin: "887766",
      monthlySalary: 38000,
      advanceBalance: 0,
    },
  ];

  for (const u of usersToSeed) {
    const passwordHash = await bcrypt.hash(u.pin, 8);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        fullName: u.fullName,
        phone: u.phone,
        role: u.role,
        branchId: mainBranch.id,
      },
      create: {
        id: u.id,
        businessId: sandhya.id,
        branchId: mainBranch.id,
        fullName: u.fullName,
        email: u.email,
        phone: u.phone,
        passwordHash,
        role: u.role,
        isActive: true,
        monthlySalary: u.monthlySalary ?? null,
        advanceBalance: u.advanceBalance,
      },
    });
  }

  // 5. Seed Chart of Accounts
  const accountsToSeed: Array<{
    code: string;
    name: string;
    type: AccountType;
    currentBalance: number;
  }> = [
    { code: "1010", name: "Cash in Counter Drawer", type: AccountType.ASSET, currentBalance: 85400 },
    { code: "1020", name: "HDFC Bank Current Account", type: AccountType.ASSET, currentBalance: 425000 },
    { code: "1030", name: "ICICI Merchant UPI / QR", type: AccountType.ASSET, currentBalance: 134200 },
    { code: "1040", name: "Fine Bullion & Old Gold Safe", type: AccountType.ASSET, currentBalance: 3850000 },
    { code: "1050", name: "Customer Credit Receivables", type: AccountType.ASSET, currentBalance: 95000 },
    { code: "1060", name: "Girvi Loan Book (Pawn Receivables)", type: AccountType.ASSET, currentBalance: 375000 },
    { code: "2010", name: "Wholesale Supplier Payables", type: AccountType.LIABILITY, currentBalance: 380000 },
    { code: "2020", name: "Karigar Labour & Making Due", type: AccountType.LIABILITY, currentBalance: 62100 },
    { code: "2030", name: "Customer Booking Advances", type: AccountType.LIABILITY, currentBalance: 110000 },
    { code: "2040", name: "GST Output Payable Pool", type: AccountType.LIABILITY, currentBalance: 24650 },
    { code: "2050", name: "Customer Credit Notes Payable", type: AccountType.LIABILITY, currentBalance: 0 },
    { code: "3010", name: "Retail Jewellery Sales Revenue", type: AccountType.REVENUE, currentBalance: 1420500 },
    { code: "3020", name: "Making Charges Income (Ghadai)", type: AccountType.REVENUE, currentBalance: 168400 },
    { code: "3030", name: "Girvi Loan Interest Income", type: AccountType.REVENUE, currentBalance: 48900 },
    { code: "4010", name: "Showroom Refreshments & Utilities", type: AccountType.EXPENSE, currentBalance: 8400 },
    { code: "4020", name: "BIS Hallmarking & Assaying Charges", type: AccountType.EXPENSE, currentBalance: 14200 },
    { code: "4030", name: "Inventory Asset / Cost of Goods", type: AccountType.ASSET, currentBalance: 2450000 },
  ];

  for (const acc of accountsToSeed) {
    await prisma.account.upsert({
      where: {
        businessId_code: {
          businessId: sandhya.id,
          code: acc.code,
        },
      },
      update: {},
      create: {
        businessId: sandhya.id,
        code: acc.code,
        name: acc.name,
        type: acc.type,
        currentBalance: acc.currentBalance,
      },
    });
  }

  // 6. Seed Default Metal Rates if none exist
  const existingRatesCount = await prisma.metalRate.count({
    where: { businessId: sandhya.id },
  });

  if (existingRatesCount === 0) {
    await prisma.metalRate.createMany({
      data: [
        {
          businessId: sandhya.id,
          metal: MetalType.GOLD,
          purityKey: "24K",
          purityPercent: 1.0,
          sellingRate: 150000,
          purchaseRate: 148500,
          source: "SEED_MASTER",
          notes: "Initial IBJA Jaipur 24K benchmark",
        },
        {
          businessId: sandhya.id,
          metal: MetalType.GOLD,
          purityKey: "22K",
          purityPercent: 0.9167,
          sellingRate: 137500,
          purchaseRate: 135000,
          source: "SEED_MASTER",
          notes: "Derived 22K 916 hallmark rate",
        },
        {
          businessId: sandhya.id,
          metal: MetalType.GOLD,
          purityKey: "18K",
          purityPercent: 0.75,
          sellingRate: 112500,
          purchaseRate: 110500,
          source: "SEED_MASTER",
          notes: "Derived 18K 750 stud/chain rate",
        },
        {
          businessId: sandhya.id,
          metal: MetalType.SILVER,
          purityKey: "999",
          purityPercent: 0.999,
          sellingRate: 95000,
          purchaseRate: 93000,
          source: "SEED_MASTER",
          notes: "Fine Silver 999 per kg rate",
        },
      ],
    });
  }

  // 7. Seed Starter Inventory Items
  const starterProduct = await prisma.product.upsert({
    where: { id: "prod-seed-22k-chain" },
    update: {},
    create: {
      id: "prod-seed-22k-chain",
      businessId: sandhya.id,
      name: "22K Royal Rope Gold Chain",
      category: "Chains",
      metal: MetalType.GOLD,
      defaultPurity: "22K",
      hsnCode: "7113",
      standardMaking: 15,
      makingType: MakingType.PERCENTAGE,
    },
  });

  await prisma.stockItem.upsert({
    where: { barcode: "8909160001" },
    update: {},
    create: {
      businessId: sandhya.id,
      branchId: mainBranch.id,
      productId: starterProduct.id,
      barcode: "8909160001",
      sku: "CHN-22K-001",
      title: "22K Royal Rope Gold Chain",
      metal: MetalType.GOLD,
      purityKey: "22K",
      grossWeight: 18.45,
      stoneWeight: 0,
      otherDeductions: 0,
      netWeight: 18.45,
      fineGoldEq: 16.913,
      makingType: MakingType.PERCENTAGE,
      makingValue: 15,
      acquisitionCost: 245000,
      trayLocation: "Tray #1 · Chains",
      status: StockStatus.IN_SHOWCASE,
      huid: "AB916C",
    },
  });

  await seedSaasPlatform(prisma);

  console.log("Database seed completed successfully!");
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
