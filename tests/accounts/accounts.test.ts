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
  postInvoiceToAccounts,
  postPurchaseToAccounts,
  postSupplierPaymentToAccounts,
  postGirviLoanDisbursementToAccounts,
  postGirviInterestReceiptToAccounts,
  postKarigarLabourPaymentToAccounts,
  getSavedJournalEntries,
} from "../../src/modules/accounts/store";
import {
  CashDenominationBreakdown,
  RecordExpenseInput,
  RecordCashClosingInput,
} from "../../src/modules/accounts/types";
import { ROLE_PERMISSIONS } from "../../src/modules/auth/permissions";
import { FinalizedInvoice } from "../../src/modules/invoicing/types";
import { createConsignmentMemo, convertMemoToInvoice } from "../../src/modules/wholesale/store";
import { getSavedInvoices } from "../../src/modules/invoicing/store";
import { issueMetalToKarigar, receiveOrnamentFromKarigar } from "../../src/modules/karigar/store";
import { getSavedStock } from "../../src/modules/inventory/store";

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

  test("Convergence DEF-003: Finalizing POS bill writes balanced double-entry journal and updates cash & turnover", () => {
    const testTenant = "test-tenant-def003";
    const initialAccounts = getSavedAccounts(testTenant);
    const initCash = initialAccounts.find((a) => a.code === "1010")?.balance || 0;
    const initSales = initialAccounts.find((a) => a.code === "3010")?.balance || 0;
    const initMaking = initialAccounts.find((a) => a.code === "3020")?.balance || 0;
    const initGst = initialAccounts.find((a) => a.code === "2040")?.balance || 0;

    const mockInvoice: FinalizedInvoice = {
      id: "inv-pos-test-01",
      invoiceNumber: "INV-2026-T01",
      invoiceDate: "2026-11-24",
      createdAt: new Date().toISOString(),
      customer: {
        id: "cust-1",
        name: "Shri Rameshwar Lal",
        phone: "+91 94140 11223",
      },
      items: [
        {
          id: "item-1",
          name: "22K Solid Gold Bangle",
          metal: "gold",
          purity: "22K",
          purityDisplay: "22K (22/24)",
          grossWeight: 10.0,
          stoneWeight: 0,
          netWeight: 10.0,
          metalRate: 150000,
          effectiveRatePerGram: 13750,
          metalValue: 137500,
          makingType: "fixed",
          makingRate: 12500,
          makingCharges: 12500,
          stoneValue: 0,
          discount: 0,
          totalBeforeTax: 150000,
          fineWeight: 9.167,
          fineGoldValue24k: 137500,
          wastagePercentage: 0,
        },
      ],
      itemsSubtotal: 150000,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: 150000,
      gstPercentage: 3,
      cgstAmount: 2250,
      sgstAmount: 2250,
      totalGst: 4500,
      roundoff: 0,
      grandTotal: 154500,
      payments: [{ method: "Cash", amount: 154500 }],
      totalPaid: 154500,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: "QA Jewellers",
        address: "Sarafa Bazar, Jaipur",
        phone: "+91 94140 12345",
        gstin: "08AAAAJ1234F1Z8",
      },
    };

    const result = postInvoiceToAccounts(mockInvoice, testTenant);
    assert.strictEqual(result.success, true);
    assert.ok(result.entry);
    assert.strictEqual(result.entry.totalDebit, 154500);
    assert.strictEqual(result.entry.totalCredit, 154500);

    const updatedAccounts = getSavedAccounts(testTenant);
    const updatedCash = updatedAccounts.find((a) => a.code === "1010")?.balance || 0;
    const updatedSales = updatedAccounts.find((a) => a.code === "3010")?.balance || 0;
    const updatedMaking = updatedAccounts.find((a) => a.code === "3020")?.balance || 0;
    const updatedGst = updatedAccounts.find((a) => a.code === "2040")?.balance || 0;

    assert.strictEqual(updatedCash, initCash + 154500, "Cash drawer should increase by ₹1,54,500");
    assert.strictEqual(updatedSales, initSales + 137500, "Metal sales turnover should increase by ₹1,37,500");
    assert.strictEqual(updatedMaking, initMaking + 12500, "Making charges revenue should increase by ₹12,500");
    assert.strictEqual(updatedGst, initGst + 4500, "GST liability pool should increase by ₹4,500");
  });

  test("Convergence DEF-005: Purchase recording and supplier payment balance with accounts", () => {
    const testTenant = "test-tenant-def005";
    const initialAccounts = getSavedAccounts(testTenant);
    const initStock = initialAccounts.find((a) => a.code === "1040")?.balance || 0;
    const initPayables = initialAccounts.find((a) => a.code === "2010")?.balance || 0;
    const initCash = initialAccounts.find((a) => a.code === "1010")?.balance || 0;

    // Purchase ₹2,00,000 goods, pay ₹50,000 cash advance, balance ₹1,50,000 on credit
    const purchaseResult = postPurchaseToAccounts(
      {
        invoiceTotal: 200000,
        paidAmount: 50000,
        paymentMethod: "Cash",
        invoiceNumber: "PUR-2026-001",
        supplierName: "Zaveri Bullion Mumbai",
      },
      testTenant
    );

    assert.strictEqual(purchaseResult.success, true);

    const postPurAccounts = getSavedAccounts(testTenant);
    const postPurStock = postPurAccounts.find((a) => a.code === "1040")?.balance || 0;
    const postPurPayables = postPurAccounts.find((a) => a.code === "2010")?.balance || 0;
    const postPurCash = postPurAccounts.find((a) => a.code === "1010")?.balance || 0;

    assert.strictEqual(postPurStock, initStock + 200000, "Inventory asset should increase by ₹2,00,000");
    assert.strictEqual(postPurCash, initCash - 50000, "Cash drawer should decrease by ₹50,000");
    assert.strictEqual(postPurPayables, initPayables + 150000, "Payables should increase by ₹1,50,000");

    // Settle ₹1,00,000 of the payable via Cash
    const payResult = postSupplierPaymentToAccounts(
      {
        amount: 100000,
        paymentMethod: "Cash",
        supplierName: "Zaveri Bullion Mumbai",
      },
      testTenant
    );

    assert.strictEqual(payResult.success, true);

    const postPayAccounts = getSavedAccounts(testTenant);
    const postPayPayables = postPayAccounts.find((a) => a.code === "2010")?.balance || 0;
    const postPayCash = postPayAccounts.find((a) => a.code === "1010")?.balance || 0;

    assert.strictEqual(postPayPayables, postPurPayables - 100000, "Payables should decrease by ₹1,00,000");
    assert.strictEqual(postPayCash, postPurCash - 100000, "Cash drawer should decrease by ₹1,00,000");
  });

  test("Convergence DEF-006: Wholesale memo conversion saves tax invoice and registers ledger entry", () => {
    const testTenant = "test-tenant-def006";

    // Create memo
    const memo = createConsignmentMemo(
      {
        jewellerPartnerName: "Royal Heritage Jewellers",
        jewellerPhone: "+91 98200 44556",
        jewellerCity: "Jodhpur",
        jewellerGstin: "08AAACR9988K1Z2",
        items: [
          {
            name: "22K Royal Rajputana Necklace",
            category: "Necklaces & Sets",
            metal: "gold",
            purity: "22K",
            grossWeight: 50.0,
            netWeight: 50.0,
            fineWeight: 45.833,
            wholesaleRate: 140000,
            totalValue: 700000,
          },
        ],
      },
      testTenant
    );

    assert.strictEqual(memo.items.length, 1);
    const itemId = memo.items[0].id;

    // Convert memo item to invoice
    const invoiceNum = "WH-INV-2026-901";
    const converted = convertMemoToInvoice(memo.id, [itemId], invoiceNum, testTenant);

    assert.ok(converted);
    assert.strictEqual(converted.status, "fully_converted_invoice");

    // Verify invoice was saved in invoices store
    const invoices = getSavedInvoices(testTenant);
    const savedInvoice = invoices.find((inv) => inv.invoiceNumber === invoiceNum);
    assert.ok(savedInvoice, "Finalized invoice must be saved in invoice store");
    assert.strictEqual(savedInvoice.customer.name, "Royal Heritage Jewellers");
    assert.strictEqual(savedInvoice.grandTotal, 721000); // 700000 + 3% GST (21,000)

    // Verify double-entry accounts journal
    const journals = getSavedJournalEntries(testTenant);
    const memoJournal = journals.find((j) => j.referenceId === invoiceNum);
    assert.ok(memoJournal, "Journal entry must be posted for converted wholesale invoice");
    assert.strictEqual(memoJournal.totalDebit, 721000);
    assert.strictEqual(memoJournal.totalCredit, 721000);
  });

  test("Convergence DEF-009: Girvi loan disbursal and interest receipt correctly move cash drawer", () => {
    const testTenant = "test-tenant-def009";
    const initialAccounts = getSavedAccounts(testTenant);
    const initCash = initialAccounts.find((a) => a.code === "1010")?.balance || 0;
    const initGirviBook = initialAccounts.find((a) => a.code === "1060")?.balance || 0;
    const initInterestIncome = initialAccounts.find((a) => a.code === "3030")?.balance || 0;

    // Disburse loan of ₹50,000
    postGirviLoanDisbursementToAccounts(
      {
        principalAmount: 50000,
        loanNumber: "GL-TEST-101",
        customerName: "Kishan Lal Soni",
      },
      testTenant
    );

    const postDisburseAccounts = getSavedAccounts(testTenant);
    const postDisburseCash = postDisburseAccounts.find((a) => a.code === "1010")?.balance || 0;
    const postDisburseGirviBook = postDisburseAccounts.find((a) => a.code === "1060")?.balance || 0;

    assert.strictEqual(postDisburseCash, initCash - 50000, "Cash in counter drawer should decrease by ₹50,000");
    assert.strictEqual(postDisburseGirviBook, initGirviBook + 50000, "Girvi loan book receivables should increase by ₹50,000");

    // Receive ₹1,500 monthly interest in Cash
    postGirviInterestReceiptToAccounts(
      {
        amount: 1500,
        paymentMethod: "Cash",
        loanNumber: "GL-TEST-101",
        customerName: "Kishan Lal Soni",
      },
      testTenant
    );

    const postInterestAccounts = getSavedAccounts(testTenant);
    const postInterestCash = postInterestAccounts.find((a) => a.code === "1010")?.balance || 0;
    const postInterestIncome = postInterestAccounts.find((a) => a.code === "3030")?.balance || 0;

    assert.strictEqual(postInterestCash, postDisburseCash + 1500, "Cash drawer should increase by ₹1,500");
    assert.strictEqual(postInterestIncome, initInterestIncome + 1500, "Interest income should increase by ₹1,500");
  });

  test("Convergence DEF-007 & DEF-008: Karigar metal issue and finished ornament inwarding sync with stock", () => {
    const testTenant = "test-tenant-def007";

    // Issue metal to karigar
    const issueTxn = issueMetalToKarigar(
      {
        karigarId: "karigar-1",
        metal: "gold",
        grossWeight: 50.0,
        purity: "24K Fine Bar (99.9%)",
        fineWeight: 50.0,
        ornamentOrderName: "22K Traditional Bridal Choker",
        notes: "Fine casting bullion issued",
      },
      testTenant
    );

    assert.ok(issueTxn);
    assert.strictEqual(issueTxn.fineWeightDelta, 50.0);

    // Receive finished ornament
    const receiveTxn = receiveOrnamentFromKarigar(
      {
        karigarId: "karigar-1",
        metal: "gold",
        ornamentName: "22K Traditional Bridal Choker",
        grossWeight: 52.0,
        netWeight: 48.0,
        fineWeightDeducted: 44.0,
        purity: "22K",
        labourCharges: 14400,
        huid: "HA916TEST",
      },
      testTenant
    );

    assert.ok(receiveTxn);
    assert.strictEqual(receiveTxn.labourAmount, 14400);

    // Verify finished ornament is inwarded in central stock
    const stock = getSavedStock(testTenant);
    const inwardedOrnament = stock.find((s) => s.huid === "HA916TEST");
    assert.ok(inwardedOrnament, "Finished ornament should be inwarded into stock items");
    assert.strictEqual(inwardedOrnament.status, "in_showcase");
    assert.strictEqual(inwardedOrnament.netWeight, 48.0);
  });
});

