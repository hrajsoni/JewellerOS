export type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export interface Account {
  id: string;
  code: string; // e.g. "1010", "1020", "4010"
  name: string;
  nameHindi: string;
  type: AccountType;
  balance: number; // positive = normal balance according to type
  isSystem: boolean;
  notes?: string;
}

export type ExpenseCategory =
  | "Customer Refreshments (चाय-पानी)"
  | "BIS Hallmarking & Assaying (हॉलमार्क)"
  | "Boxes & Packaging (डिब्बे व थैली)"
  | "Shop Electricity & Utility (बिजली)"
  | "Showroom Rent (किराया)"
  | "Staff Salary & Advance (वेतन)"
  | "Tools & Consumables (जार-तार/तेजाब)"
  | "Security & Guard (गार्ड)"
  | "Miscellaneous (अन्य खर्च)";

export interface ShopExpense {
  id: string;
  date: string; // ISO string
  category: ExpenseCategory;
  amount: number;
  paymentMode: "Cash" | "Bank Current A/C" | "UPI Business";
  paidTo: string;
  voucherNumber?: string;
  notes?: string;
  recordedBy?: string;
}

export interface RecordExpenseInput {
  category: ExpenseCategory;
  amount: number;
  paymentMode: "Cash" | "Bank Current A/C" | "UPI Business";
  paidTo: string;
  voucherNumber?: string;
  notes?: string;
  recordedBy?: string;
}

export interface CashDenominationBreakdown {
  count500: number;
  count200: number;
  count100: number;
  count50: number;
  count20: number;
  count10: number;
  coinsTotal: number;
}

export type CashClosingStatus = "draft" | "tallied" | "shortage" | "excess" | "closed";

export interface DailyCashClosing {
  id: string;
  date: string; // YYYY-MM-DD
  openingCash: number; // Opening cash in hand at morning
  cashSales: number; // Inward counter cash sales
  cashAdvances: number; // Customer advance receipts in cash
  supplierCashPaid: number; // Wholesale supplier payments in cash
  karigarCashPaid: number; // Labour payments to karigars in cash
  cashExpenses: number; // Petty shop expenses in cash
  expectedCash: number; // Calculated: opening + sales + advances - supplier - karigar - expenses
  physicalCash: number; // Physical count from cash drawer
  denominations: CashDenominationBreakdown;
  discrepancy: number; // physicalCash - expectedCash (0 = match, -ve = short, +ve = excess)
  status: CashClosingStatus;
  closedBy: string;
  closedAt: string;
  notes?: string;
}

export interface RecordCashClosingInput {
  date: string;
  openingCash: number;
  cashSales: number;
  cashAdvances: number;
  supplierCashPaid: number;
  karigarCashPaid: number;
  cashExpenses: number;
  physicalCash: number;
  denominations: CashDenominationBreakdown;
  notes?: string;
  closedBy: string;
}
