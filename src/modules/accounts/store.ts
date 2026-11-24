import {
  Account,
  ShopExpense,
  RecordExpenseInput,
  DailyCashClosing,
  RecordCashClosingInput,
  CashDenominationBreakdown,
  CashClosingStatus,
} from "./types";

const ACCOUNTS_STORAGE_KEY = "jewellery_os_accounts_v1";
const EXPENSES_STORAGE_KEY = "jewellery_os_expenses_v1";
const CLOSINGS_STORAGE_KEY = "jewellery_os_daily_closings_v1";

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: "acc-1010",
    code: "1010",
    name: "Cash in Counter Drawer",
    nameHindi: "रोकड़ / काउंटर गल्ला",
    type: "asset",
    balance: 85400,
    isSystem: true,
    notes: "Counter cash drawer balance for daily retail transactions.",
  },
  {
    id: "acc-1020",
    code: "1020",
    name: "HDFC Bank Current Account",
    nameHindi: "एचडीएफसी बैंक चालू खाता",
    type: "asset",
    balance: 425000,
    isSystem: true,
    notes: "Primary business operating bank account.",
  },
  {
    id: "acc-1030",
    code: "1030",
    name: "ICICI Merchant UPI / QR",
    nameHindi: "आईसीआईसीआई यूपीआई खाता",
    type: "asset",
    balance: 134200,
    isSystem: true,
    notes: "Daily PhonePe / GPay QR dynamic settlement pool.",
  },
  {
    id: "acc-1040",
    code: "1040",
    name: "Fine Bullion Stock Safe",
    nameHindi: "शुद्ध सोना-चांदी स्टॉक",
    type: "asset",
    balance: 3850000,
    isSystem: true,
    notes: "24K bullion bars and 999 silver casting grains in vault.",
  },
  {
    id: "acc-1050",
    code: "1050",
    name: "Customer Credit Receivables",
    nameHindi: "उधार ग्राहक बही (Receivables)",
    type: "asset",
    balance: 95000,
    isSystem: true,
    notes: "Total ledger debt owed by credit customers.",
  },
  {
    id: "acc-2010",
    code: "2010",
    name: "Wholesale Supplier Payables",
    nameHindi: "थोक सराफा देनदारी (Payables)",
    type: "liability",
    balance: 380000,
    isSystem: true,
    notes: "Total wholesale bullion & ornament balances due to vendors.",
  },
  {
    id: "acc-2020",
    code: "2020",
    name: "Karigar Labour & Making Due",
    nameHindi: "कारीगर मजदूरी देनदारी",
    type: "liability",
    balance: 62100,
    isSystem: true,
    notes: "Unpaid making charges due to Bengali masters & goldsmiths.",
  },
  {
    id: "acc-2030",
    code: "2030",
    name: "Customer Booking Advances",
    nameHindi: "ग्राहक अग्रिम बयाना (Advances)",
    type: "liability",
    balance: 110000,
    isSystem: true,
    notes: "Advance cash/UPI deposits collected for future delivery orders.",
  },
  {
    id: "acc-2040",
    code: "2040",
    name: "GST Payable (3% Composite Pool)",
    nameHindi: "जीएसटी देनदारी (CGST/SGST/IGST)",
    type: "liability",
    balance: 24650,
    isSystem: true,
    notes: "Net output GST payable to government after ITC adjustments.",
  },
  {
    id: "acc-3010",
    code: "3010",
    name: "Retail Jewellery Sales Revenue",
    nameHindi: "आभूषण खुदरा बिक्री आय",
    type: "revenue",
    balance: 1420500,
    isSystem: true,
    notes: "Cumulative gold, silver and diamond sales.",
  },
  {
    id: "acc-3020",
    code: "3020",
    name: "Making Charges Income (Ghadai)",
    nameHindi: "घड़ाई व मेकिंग चार्ज आय",
    type: "revenue",
    balance: 168400,
    isSystem: true,
    notes: "Gross making charges collected from retail customers.",
  },
  {
    id: "acc-4010",
    code: "4010",
    name: "Customer Refreshments & Hospitality",
    nameHindi: "चाय-पानी व नाश्ता खर्च",
    type: "expense",
    balance: 8400,
    isSystem: true,
    notes: "Tea, biscuits and water for showroom visitors and staff.",
  },
  {
    id: "acc-4020",
    code: "4020",
    name: "BIS Hallmarking & Assaying Charges",
    nameHindi: "हॉलमार्किंग व जांच खर्च",
    type: "expense",
    balance: 14200,
    isSystem: true,
    notes: "HUID laser marking fees paid to BIS authorized centres.",
  },
  {
    id: "acc-4030",
    code: "4030",
    name: "Presentation Boxes & Velvet Pouches",
    nameHindi: "डिब्बे, थैली व पैकेजिंग",
    type: "expense",
    balance: 18500,
    isSystem: true,
    notes: "Velvet presentation cases, certificate folders, paper carry bags.",
  },
  {
    id: "acc-4040",
    code: "4040",
    name: "Showroom Electricity & Utilities",
    nameHindi: "दुकान बिजली व मेंटेनेंस",
    type: "expense",
    balance: 22000,
    isSystem: true,
    notes: "Showroom spotlight illumination, AC and security backup.",
  },
];

export const INITIAL_EXPENSES: ShopExpense[] = [
  {
    id: "exp-1",
    date: "2026-11-23T11:00:00.000Z",
    category: "Customer Refreshments (चाय-पानी)",
    amount: 450,
    paymentMode: "Cash",
    paidTo: "Gulab Ji Chaiwale",
    voucherNumber: "V-801",
    notes: "Special masala chai and samosa for wedding set consultation.",
    recordedBy: "Harshit Raj",
  },
  {
    id: "exp-2",
    date: "2026-11-23T15:30:00.000Z",
    category: "BIS Hallmarking & Assaying (हॉलमार्क)",
    amount: 675,
    paymentMode: "UPI Business",
    paidTo: "Jaipur Hallmark Centre (Johari Bazar)",
    voucherNumber: "V-802",
    notes: "15 articles laser hallmarked @ ₹45/pc with HUID certificates.",
    recordedBy: "Harshit Raj",
  },
  {
    id: "exp-3",
    date: "2026-11-22T17:00:00.000Z",
    category: "Boxes & Packaging (डिब्बे व थैली)",
    amount: 3200,
    paymentMode: "Bank Current A/C",
    paidTo: "Royal Velvet Box Mfg",
    voucherNumber: "V-798",
    notes: "50 premium bridal necklace velvet boxes with gold embossed logo.",
    recordedBy: "Harshit Raj",
  },
  {
    id: "exp-4",
    date: "2026-11-21T12:00:00.000Z",
    category: "Tools & Consumables (जार-तार/तेजाब)",
    amount: 850,
    paymentMode: "Cash",
    paidTo: "Rajasthan Sarafa Tools Depot",
    voucherNumber: "V-792",
    notes: "Kasauti touchstone testing acid kit and brass solder wire.",
    recordedBy: "Harshit Raj",
  },
];

export const INITIAL_DAILY_CLOSINGS: DailyCashClosing[] = [
  {
    id: "close-2026-11-23",
    date: "2026-11-23",
    openingCash: 50000,
    cashSales: 78500,
    cashAdvances: 15000,
    supplierCashPaid: 35000,
    karigarCashPaid: 8500,
    cashExpenses: 1300,
    expectedCash: 98700,
    physicalCash: 98700,
    denominations: {
      count500: 170, // 85,000
      count200: 45, // 9,000
      count100: 40, // 4,000
      count50: 10, // 500
      count20: 8, // 160
      count10: 4, // 40
      coinsTotal: 0,
    },
    discrepancy: 0,
    status: "tallied",
    closedBy: "Harshit Raj (Owner)",
    closedAt: "2026-11-23T20:45:00.000Z",
    notes: "रोकड़ पूर्ण मिलान। Perfect cash drawer match.",
  },
];

const inMemoryCache: Record<string, string> = {};

function getItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return inMemoryCache[key] ?? null;
}

function setItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch {}
  } else {
    inMemoryCache[key] = value;
  }
}

export function getTenantAccountsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_accounts` : ACCOUNTS_STORAGE_KEY;
}

export function getTenantExpensesKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_expenses` : EXPENSES_STORAGE_KEY;
}

export function getTenantClosingsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_daily_closings` : CLOSINGS_STORAGE_KEY;
}

export function getSavedAccounts(tenantId?: string): Account[] {
  try {
    const key = getTenantAccountsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantAccountsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_ACCOUNTS.map((a) => ({ ...a }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ACCOUNTS;
  }
}

export function saveAccounts(accounts: Account[], tenantId?: string): void {
  try {
    const key = getTenantAccountsKey(tenantId);
    setItem(key, JSON.stringify(accounts));
  } catch (err) {
    console.error("Failed to save accounts:", err);
  }
}

export function getSavedExpenses(tenantId?: string): ShopExpense[] {
  try {
    const key = getTenantExpensesKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantExpensesKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_EXPENSES.map((e) => ({ ...e }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EXPENSES;
  }
}

export function saveExpenses(expenses: ShopExpense[], tenantId?: string): void {
  try {
    const key = getTenantExpensesKey(tenantId);
    setItem(key, JSON.stringify(expenses));
  } catch (err) {
    console.error("Failed to save expenses:", err);
  }
}

export function recordExpense(input: RecordExpenseInput, tenantId?: string): ShopExpense {
  const newExpense: ShopExpense = {
    id: `exp-${Date.now()}`,
    date: new Date().toISOString(),
    category: input.category,
    amount: input.amount,
    paymentMode: input.paymentMode,
    paidTo: input.paidTo.trim(),
    voucherNumber: input.voucherNumber?.trim() || `V-${Math.floor(100 + Math.random() * 900)}`,
    notes: input.notes?.trim() || undefined,
    recordedBy: input.recordedBy?.trim() || "Owner",
  };

  const existingExpenses = getSavedExpenses(tenantId);
  const updatedExpenses = [newExpense, ...existingExpenses];
  saveExpenses(updatedExpenses, tenantId);

  // Reflect in chart of accounts: deduct from payment source account
  const accounts = getSavedAccounts(tenantId);
  const sourceCode =
    input.paymentMode === "Cash"
      ? "1010"
      : input.paymentMode === "Bank Current A/C"
      ? "1020"
      : "1030";

  const updatedAccounts = accounts.map((acc) => {
    if (acc.code === sourceCode) {
      return { ...acc, balance: Math.max(0, acc.balance - input.amount) };
    }
    return acc;
  });
  saveAccounts(updatedAccounts, tenantId);

  return newExpense;
}

export function getSavedDailyClosings(tenantId?: string): DailyCashClosing[] {
  try {
    const key = getTenantClosingsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantClosingsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_DAILY_CLOSINGS.map((c) => ({ ...c }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DAILY_CLOSINGS;
  }
}

export function saveDailyClosings(closings: DailyCashClosing[], tenantId?: string): void {
  try {
    const key = getTenantClosingsKey(tenantId);
    setItem(key, JSON.stringify(closings));
  } catch (err) {
    console.error("Failed to save daily closings:", err);
  }
}

export function calculateDenominationTotal(d: CashDenominationBreakdown): number {
  return (
    (d.count500 || 0) * 500 +
    (d.count200 || 0) * 200 +
    (d.count100 || 0) * 100 +
    (d.count50 || 0) * 50 +
    (d.count20 || 0) * 20 +
    (d.count10 || 0) * 10 +
    (d.coinsTotal || 0)
  );
}

export function recordDailyCashClosing(
  input: RecordCashClosingInput,
  tenantId?: string
): DailyCashClosing {
  const expectedCash =
    input.openingCash +
    input.cashSales +
    input.cashAdvances -
    input.supplierCashPaid -
    input.karigarCashPaid -
    input.cashExpenses;

  const discrepancy = input.physicalCash - expectedCash;
  let status: CashClosingStatus = "tallied";
  if (discrepancy < 0) {
    status = "shortage";
  } else if (discrepancy > 0) {
    status = "excess";
  }

  const closing: DailyCashClosing = {
    id: `close-${input.date}`,
    date: input.date,
    openingCash: input.openingCash,
    cashSales: input.cashSales,
    cashAdvances: input.cashAdvances,
    supplierCashPaid: input.supplierCashPaid,
    karigarCashPaid: input.karigarCashPaid,
    cashExpenses: input.cashExpenses,
    expectedCash,
    physicalCash: input.physicalCash,
    denominations: input.denominations,
    discrepancy,
    status,
    closedBy: input.closedBy,
    closedAt: new Date().toISOString(),
    notes: input.notes?.trim() || undefined,
  };

  const existing = getSavedDailyClosings(tenantId);
  // Replace if exists for same date, otherwise prepend
  const filtered = existing.filter((c) => c.date !== input.date);
  const updated = [closing, ...filtered];
  saveDailyClosings(updated, tenantId);

  // Update 1010 Cash in Counter balance to match physical cash
  const accounts = getSavedAccounts(tenantId);
  const updatedAccounts = accounts.map((acc) => {
    if (acc.code === "1010") {
      return { ...acc, balance: input.physicalCash };
    }
    return acc;
  });
  saveAccounts(updatedAccounts, tenantId);

  return closing;
}
