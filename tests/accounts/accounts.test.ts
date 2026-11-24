import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getSavedAccounts,
  getSavedExpenses,
  getSavedDailyClosings,
  recordExpense,
  recordDailyCashClosing,
  calculateDenominationTotal,
  INITIAL_ACCOUNTS,
} from "../../src/modules/accounts/store";
import {
  CashDenominationBreakdown,
  RecordExpenseInput,
  RecordCashClosingInput,
} from "../../src/modules/accounts/types";
import { ROLE_PERMISSIONS } from "../../src/modules/auth/permissions";

describe("JewelleryOS Milestone 6: Indian Chart of Accounts & Daily Cash Closing Tests", () => {
  const tenantId = "test-tenant-accounts-01";

  test("Chart of Accounts: Initializes default assets, liabilities, revenue & expense accounts", () => {
    const accounts = getSavedAccounts(tenantId);
    assert.ok(accounts.length >= 10);

    const cashAccount = accounts.find((a) => a.code === "1010");
    assert.ok(cashAccount, "Cash account 1010 must exist");
    assert.strictEqual(cashAccount?.type, "asset");

    const bankAccount = accounts.find((a) => a.code === "1020");
    assert.ok(bankAccount, "Bank account 1020 must exist");
    assert.strictEqual(bankAccount?.type, "asset");

    const supplierPayables = accounts.find((a) => a.code === "2010");
    assert.ok(supplierPayables, "Wholesale payables 2010 must exist");
    assert.strictEqual(supplierPayables?.type, "liability");

    const karigarDue = accounts.find((a) => a.code === "2020");
    assert.ok(karigarDue, "Karigar dues 2020 must exist");
    assert.strictEqual(karigarDue?.type, "liability");
  });

  test("Shop Expense Logging: Inwards expense voucher and automatically updates source payment account", () => {
    const initialAccounts = getSavedAccounts(tenantId);
    const initialCash = initialAccounts.find((a) => a.code === "1010")?.balance || 0;

    const input: RecordExpenseInput = {
      category: "Customer Refreshments (चाय-पानी)",
      amount: 650,
      paymentMode: "Cash",
      paidTo: "Gulab Ji Chai & Snacks",
      voucherNumber: "V-TEST-001",
      notes: "Tea and hospitality for bridal party",
      recordedBy: "Harshit Raj",
    };

    const recorded = recordExpense(input, tenantId);
    assert.strictEqual(recorded.amount, 650);
    assert.strictEqual(recorded.paymentMode, "Cash");

    // Verify expense is in store
    const expenses = getSavedExpenses(tenantId);
    assert.ok(expenses.some((e) => e.id === recorded.id));

    // Verify cash balance was reduced by ₹650
    const updatedAccounts = getSavedAccounts(tenantId);
    const updatedCash = updatedAccounts.find((a) => a.code === "1010")?.balance;
    assert.strictEqual(updatedCash, initialCash - 650);
  });

  test("Denomination Breakdown Math: Correctly computes total physical cash from currency notes", () => {
    const denominations: CashDenominationBreakdown = {
      count500: 100, // 50,000
      count200: 50, // 10,000
      count100: 30, // 3,000
      count50: 20, // 1,000
      count20: 10, // 200
      count10: 5, // 50
      coinsTotal: 25, // 25
    };

    const total = calculateDenominationTotal(denominations);
    assert.strictEqual(total, 64275);
  });

  test("Daily Cash Closing (रोकड़ मिलान): Exact Tally Reconciliation", () => {
    const closingInput: RecordCashClosingInput = {
      date: "2026-11-24",
      openingCash: 50000,
      cashSales: 45000,
      cashAdvances: 10000,
      supplierCashPaid: 20000,
      karigarCashPaid: 5000,
      cashExpenses: 1200,
      physicalCash: 78800, // 50k + 45k + 10k - 20k - 5k - 1.2k = 78,800
      denominations: {
        count500: 150, // 75,000
        count200: 15, // 3,000
        count100: 8, // 800
        count50: 0,
        count20: 0,
        count10: 0,
        coinsTotal: 0,
      },
      notes: "Evening closing - drawer tallies with cashbook.",
      closedBy: "Harshit Raj (Owner)",
    };

    const closing = recordDailyCashClosing(closingInput, tenantId);
    assert.strictEqual(closing.expectedCash, 78800);
    assert.strictEqual(closing.physicalCash, 78800);
    assert.strictEqual(closing.discrepancy, 0);
    assert.strictEqual(closing.status, "tallied");

    // Cash in Hand Account (1010) must now be synchronized to 78,800
    const accounts = getSavedAccounts(tenantId);
    const cashAcc = accounts.find((a) => a.code === "1010");
    assert.strictEqual(cashAcc?.balance, 78800);
  });

  test("Daily Cash Closing: Discrepancy Detection (Cash Shortage)", () => {
    const closingInput: RecordCashClosingInput = {
      date: "2026-11-25",
      openingCash: 78800,
      cashSales: 20000,
      cashAdvances: 0,
      supplierCashPaid: 10000,
      karigarCashPaid: 0,
      cashExpenses: 800,
      physicalCash: 87500, // Expected = 78800 + 20000 - 10000 - 800 = 88000 -> Short by ₹500
      denominations: {
        count500: 175, // 87,500
        count200: 0,
        count100: 0,
        count50: 0,
        count20: 0,
        count10: 0,
        coinsTotal: 0,
      },
      notes: "₹500 cash shortage detected in physical drawer count.",
      closedBy: "Harshit Raj (Owner)",
    };

    const closing = recordDailyCashClosing(closingInput, tenantId);
    assert.strictEqual(closing.expectedCash, 88000);
    assert.strictEqual(closing.physicalCash, 87500);
    assert.strictEqual(closing.discrepancy, -500);
    assert.strictEqual(closing.status, "shortage");
  });

  test("RBAC Security: Strict isolation of financial cashbook and reports", () => {
    // Owner, Admin, Accountant MUST have access to owner reports and accounts
    assert.strictEqual(ROLE_PERMISSIONS.OWNER.VIEW_OWNER_REPORTS, true);
    assert.strictEqual(ROLE_PERMISSIONS.ADMIN.VIEW_OWNER_REPORTS, true);
    assert.strictEqual(ROLE_PERMISSIONS.ACCOUNTANT.VIEW_OWNER_REPORTS, true);

    // Salespersons, Inventory Clerks, and Karigar Managers must NEVER access cashbook/reports
    assert.strictEqual(ROLE_PERMISSIONS.SALESPERSON.VIEW_OWNER_REPORTS, false);
    assert.strictEqual(ROLE_PERMISSIONS.INVENTORY_CLERK.VIEW_OWNER_REPORTS, false);
    assert.strictEqual(ROLE_PERMISSIONS.KARIGAR_MANAGER.VIEW_OWNER_REPORTS, false);
  });
});
