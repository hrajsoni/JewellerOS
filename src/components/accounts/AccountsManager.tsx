"use client";

import React, { useState } from "react";
import {
  Account,
  ShopExpense,
  RecordExpenseInput,
  DailyCashClosing,
  RecordCashClosingInput,
  CashDenominationBreakdown,
  ExpenseCategory,
} from "../../modules/accounts/types";
import {
  calculateDenominationTotal,
  recordExpense as storeRecordExpense,
  recordDailyCashClosing as storeRecordClosing,
} from "../../modules/accounts/store";
import { formatINR } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  BookOpen,
  Plus,
  Search,
  Receipt,
  Scale,
  Coins,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Calendar,
  Lock,
  Wallet,
  Coffee,
  Package,
  Zap,
  Users,
} from "lucide-react";

export interface AccountsManagerProps {
  accounts: Account[];
  expenses: ShopExpense[];
  dailyClosings: DailyCashClosing[];
  onRecordExpense?: (input: RecordExpenseInput) => void;
  onRecordClosing?: (input: RecordCashClosingInput) => void;
  shopName: string;
  tenantId?: string;
  currentUser?: string;
}

export const AccountsManager: React.FC<AccountsManagerProps> = ({
  accounts: initialAccounts,
  expenses: initialExpenses,
  dailyClosings: initialClosings,
  onRecordExpense,
  onRecordClosing,
  shopName,
  tenantId,
  currentUser = "Harshit Raj (Owner)",
}) => {
  const [activeTab, setActiveTab] = useState<"closing" | "expenses" | "chart">("closing");
  const [searchQuery, setSearchQuery] = useState("");

  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [expenses, setExpenses] = useState<ShopExpense[]>(initialExpenses);
  const [dailyClosings, setDailyClosings] = useState<DailyCashClosing[]>(initialClosings);

  // Synchronize with incoming props
  React.useEffect(() => {
    setAccounts(initialAccounts);
  }, [initialAccounts]);
  React.useEffect(() => {
    setExpenses(initialExpenses);
  }, [initialExpenses]);
  React.useEffect(() => {
    setDailyClosings(initialClosings);
  }, [initialClosings]);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // New Expense Form State
  const [expCategory, setExpCategory] = useState<ExpenseCategory>(
    "Customer Refreshments (चाय-पानी)"
  );
  const [expAmount, setExpAmount] = useState("");
  const [expMode, setExpMode] = useState<"Cash" | "Bank Current A/C" | "UPI Business">("Cash");
  const [expPaidTo, setExpPaidTo] = useState("");
  const [expVoucher, setExpVoucher] = useState("");
  const [expNotes, setExpNotes] = useState("");

  // Daily Cash Closing Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [closingDate, setClosingDate] = useState(todayStr);
  const [openingCash, setOpeningCash] = useState("50000");
  const [cashSales, setCashSales] = useState("45800");
  const [cashAdvances, setCashAdvances] = useState("10000");
  const [supplierCash, setSupplierCash] = useState("15000");
  const [karigarCash, setKarigarCash] = useState("8500");
  const [cashExpensesVal, setCashExpensesVal] = useState("1200");
  const [closingNotes, setClosingNotes] = useState("");

  // Physical Denomination Counters
  const [denominations, setDenominations] = useState<CashDenominationBreakdown>({
    count500: 140, // 70,000
    count200: 40, // 8,000
    count100: 25, // 2,500
    count50: 10, // 500
    count20: 5, // 100
    count10: 0,
    coinsTotal: 0,
  });

  const updateCount = (key: keyof CashDenominationBreakdown, val: number) => {
    setDenominations((prev) => ({
      ...prev,
      [key]: Math.max(0, val),
    }));
  };

  // Arithmetic for Closing
  const numOpening = parseFloat(openingCash) || 0;
  const numSales = parseFloat(cashSales) || 0;
  const numAdvances = parseFloat(cashAdvances) || 0;
  const numSupplier = parseFloat(supplierCash) || 0;
  const numKarigar = parseFloat(karigarCash) || 0;
  const numExp = parseFloat(cashExpensesVal) || 0;

  const expectedCash = numOpening + numSales + numAdvances - numSupplier - numKarigar - numExp;
  const physicalCash = calculateDenominationTotal(denominations);
  const discrepancy = physicalCash - expectedCash;

  // Key Aggregates
  const cashInDrawerAccount = accounts.find((a) => a.code === "1010");
  const cashInDrawer = cashInDrawerAccount ? cashInDrawerAccount.balance : physicalCash;

  const bankAccount = accounts.find((a) => a.code === "1020");
  const upiAccount = accounts.find((a) => a.code === "1030");
  const totalDigitalBank = (bankAccount?.balance || 0) + (upiAccount?.balance || 0);

  const todayExpensesTotal = expenses
    .filter((e) => e.date.startsWith(todayStr))
    .reduce((sum, e) => sum + e.amount, 0);

  const lastClosing = dailyClosings[0];

  // Action Handlers
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(expAmount);
    if (!amountNum || isNaN(amountNum) || !expPaidTo.trim()) return;

    const input: RecordExpenseInput = {
      category: expCategory,
      amount: amountNum,
      paymentMode: expMode,
      paidTo: expPaidTo.trim(),
      voucherNumber: expVoucher.trim() || undefined,
      notes: expNotes.trim() || undefined,
      recordedBy: currentUser,
    };

    if (onRecordExpense) {
      onRecordExpense(input);
    } else {
      const created = storeRecordExpense(input, tenantId);
      setExpenses((prev) => [created, ...prev]);
    }

    setIsExpenseModalOpen(false);
    setExpAmount("");
    setExpPaidTo("");
    setExpNotes("");
  };

  const handleClosingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const input: RecordCashClosingInput = {
      date: closingDate,
      openingCash: numOpening,
      cashSales: numSales,
      cashAdvances: numAdvances,
      supplierCashPaid: numSupplier,
      karigarCashPaid: numKarigar,
      cashExpenses: numExp,
      physicalCash,
      denominations,
      notes: closingNotes.trim() || undefined,
      closedBy: currentUser,
    };

    if (onRecordClosing) {
      onRecordClosing(input);
    } else {
      const recorded = storeRecordClosing(input, tenantId);
      setDailyClosings((prev) => {
        const filtered = prev.filter((c) => c.date !== recorded.date);
        return [recorded, ...filtered];
      });
      // also update local cash in hand
      setAccounts((prev) =>
        prev.map((acc) => (acc.code === "1010" ? { ...acc, balance: physicalCash } : acc))
      );
    }

    setIsClosingModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#DFC488]">
              <BookOpen size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Accounts & Cash Closing (रोकड़ बही व दैनिक मिलान)
            </h1>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Indian Sarafa daily cash drawer reconciliation (रोकड़ मिलान), double-entry ledgers & petty shop expenses for {shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsExpenseModalOpen(true)}
          >
            + Log Expense (दुकान खर्च)
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Lock size={14} />}
            onClick={() => setIsClosingModalOpen(true)}
          >
            Perform Cash Closing (रोकड़ मिलान)
          </GlassButton>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center justify-between">
            <span>Counter Cash Drawer (गल्ला रोकड़)</span>
            <Wallet size={13} className="text-[#DFC488]" />
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {formatINR(cashInDrawer)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Physical cash in counter vault (A/C 1010)
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center justify-between">
            <span>Bank & UPI Balance (बैंक खाते)</span>
            <Landmark size={13} className="text-[var(--text-secondary)]" />
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {formatINR(totalDigitalBank)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            HDFC Current + ICICI Merchant UPI
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center justify-between">
            <span>Today&apos;s Expenses (आज का खर्च)</span>
            <Receipt size={13} className="text-[var(--accent-coral)]" />
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-coral)] num-tabular">
            {formatINR(todayExpensesTotal)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Hospitality, hallmarking & packaging
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider flex items-center justify-between">
            <span>Last Cash Closing (पिछला मिलान)</span>
            <CheckCircle2 size={13} className="text-[var(--accent-emerald)]" />
          </span>
          <div className="text-sm font-semibold text-[var(--text-primary)] mt-1 flex items-center gap-1.5">
            <GlassBadge
              variant={
                lastClosing?.status === "tallied"
                  ? "emerald"
                  : lastClosing?.status === "shortage"
                  ? "coral"
                  : "gold"
              }
              size="sm"
            >
              {lastClosing?.status === "tallied"
                ? "रोकड़ पूर्ण मिलान (Tallied)"
                : lastClosing?.status === "shortage"
                ? `कमी / Short (-₹${Math.abs(lastClosing.discrepancy)})`
                : lastClosing
                ? `फाजिल / Excess (+₹${lastClosing.discrepancy})`
                : "No closing"}
            </GlassBadge>
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] block">
            {lastClosing ? `${lastClosing.date} by ${lastClosing.closedBy}` : "Pending first daily closing"}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06]">
        <div className="inline-flex p-1 rounded-lg bg-black/20 border border-white/[0.04] text-xs">
          <button
            onClick={() => setActiveTab("closing")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "closing"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Daily Cash Closing / रोकड़ मिलान
          </button>
          <button
            onClick={() => setActiveTab("expenses")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "expenses"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Shop Expense Book (दुकान खर्च बही - {expenses.length})
          </button>
          <button
            onClick={() => setActiveTab("chart")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "chart"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Chart of Accounts (खाता बही सूची - {accounts.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search accounts, expenses, vouchers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>
      </div>

      {/* Tab 1: Daily Cash Closing / रोकड़ मिलान */}
      {activeTab === "closing" && (
        <div className="space-y-6">
          {/* Quick Cash Reconciliation Interactive Console */}
          <GlassPanel className="p-5 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.05]">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2">
                  <Coins size={18} className="text-[#DFC488]" />
                  Today&apos;s Cash Drawer Tally & Reconciliation (दैनिक रोकड़ मिलान)
                </h3>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  Reconcile opening cash + inflows - outflows against physical counter note count.
                </p>
              </div>
              <GlassButton
                variant="primary"
                size="sm"
                icon={<Lock size={14} />}
                onClick={() => setIsClosingModalOpen(true)}
              >
                Open Full Tally Form
              </GlassButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Cash Flow Statement */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  System Cash Flow Calculation (रोकड़ बही प्रवाह)
                </h4>
                <div className="p-4 rounded-xl bg-black/30 border border-white/[0.05] space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--text-secondary)]">Opening Cash (सुबह का गल्ला):</span>
                    <span className="font-mono font-medium text-[var(--text-primary)]">
                      {formatINR(numOpening)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[var(--accent-emerald)]">
                    <span>(+) Counter Cash Billing (नकद आभूषण बिक्री):</span>
                    <span className="font-mono font-medium">+{formatINR(numSales)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[var(--accent-emerald)]">
                    <span>(+) Customer Cash Advances (अग्रिम बयाना):</span>
                    <span className="font-mono font-medium">+{formatINR(numAdvances)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[var(--accent-coral)]">
                    <span>(-) Wholesale Supplier Cash (थोक सराफा भुगतान):</span>
                    <span className="font-mono font-medium">-{formatINR(numSupplier)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[var(--accent-coral)]">
                    <span>(-) Karigar Cash Labour (कारीगर मजदूरी भुगतान):</span>
                    <span className="font-mono font-medium">-{formatINR(numKarigar)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 text-[var(--accent-coral)]">
                    <span>(-) Shop Petty Expenses (दुकान खर्च):</span>
                    <span className="font-mono font-medium">-{formatINR(numExp)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.08] flex justify-between items-center text-sm font-semibold">
                    <span className="text-[var(--text-primary)]">
                      Expected System Cash (बही शेष):
                    </span>
                    <span className="font-mono text-[#DFC488]">{formatINR(expectedCash)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Physical Denominations Counter */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Physical Drawer Count (नोटों की गिनती)
                  </h4>
                  <span className="text-xs font-mono font-bold text-[#DFC488]">
                    Counted: {formatINR(physicalCash)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-black/30 border border-white/[0.05] text-xs">
                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">₹500 Notes</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={denominations.count500}
                        onChange={(e) => updateCount("count500", parseInt(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs text-[var(--text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        = ₹{((denominations.count500 || 0) * 500).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">₹200 Notes</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={denominations.count200}
                        onChange={(e) => updateCount("count200", parseInt(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs text-[var(--text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        = ₹{((denominations.count200 || 0) * 200).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">₹100 Notes</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={denominations.count100}
                        onChange={(e) => updateCount("count100", parseInt(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs text-[var(--text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        = ₹{((denominations.count100 || 0) * 100).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">₹50 Notes</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={denominations.count50}
                        onChange={(e) => updateCount("count50", parseInt(e.target.value) || 0)}
                        className="w-16 px-1.5 py-0.5 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs text-[var(--text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        = ₹{((denominations.count50 || 0) * 50).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">₹20 & ₹10 Notes</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={denominations.count20}
                        onChange={(e) => updateCount("count20", parseInt(e.target.value) || 0)}
                        className="w-14 px-1.5 py-0.5 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs text-[var(--text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        = ₹{((denominations.count20 || 0) * 20).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <span className="text-[10px] text-[var(--text-tertiary)] block">Loose Coins (सिक्के)</span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        value={denominations.coinsTotal}
                        onChange={(e) => updateCount("coinsTotal", parseInt(e.target.value) || 0)}
                        className="w-20 px-1.5 py-0.5 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs text-[var(--text-primary)]"
                      />
                      <span className="text-[10px] text-[var(--text-tertiary)]">₹</span>
                    </div>
                  </div>
                </div>

                {/* Status Tally Badge & Discrepancy Alert */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                    discrepancy === 0
                      ? "bg-[var(--accent-emerald)]/10 border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]"
                      : discrepancy < 0
                      ? "bg-[var(--accent-coral)]/10 border-[var(--accent-coral)]/30 text-[var(--accent-coral)]"
                      : "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#DFC488]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {discrepancy === 0 ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    <span>
                      {discrepancy === 0
                        ? "रोकड़ पूर्ण मिलान (Perfect Tally - Difference ₹0)"
                        : discrepancy < 0
                        ? `रोकड़ में कमी (Shortage: -₹${Math.abs(discrepancy).toLocaleString("en-IN")})`
                        : `रोकड़ में फाजिल (Surplus: +₹${discrepancy.toLocaleString("en-IN")})`}
                    </span>
                  </div>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    className="text-[11px] py-1 px-2"
                    onClick={() => setIsClosingModalOpen(true)}
                  >
                    Lock & Close Day
                  </GlassButton>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Historical Cash Closings Log */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Daily Cash Closing Audit Log (दैनिक रोकड़ मिलान इतिहास)
            </h3>
            <GlassPanel className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                      <th className="py-3 px-4 font-semibold">Closing Date</th>
                      <th className="py-3 px-4 font-semibold text-right">Opening Cash</th>
                      <th className="py-3 px-4 font-semibold text-right">Cash Sales</th>
                      <th className="py-3 px-4 font-semibold text-right">Outflows</th>
                      <th className="py-3 px-4 font-semibold text-right">Physical Count</th>
                      <th className="py-3 px-4 font-semibold">Tally Status</th>
                      <th className="py-3 px-4 font-semibold">Verified By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {dailyClosings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                          No daily closings recorded yet.
                        </td>
                      </tr>
                    ) : (
                      dailyClosings.map((c) => {
                        const outflows = c.supplierCashPaid + c.karigarCashPaid + c.cashExpenses;
                        return (
                          <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 px-4 font-mono font-medium text-[var(--text-primary)]">
                              {new Date(c.date).toLocaleDateString("en-IN", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              {formatINR(c.openingCash)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[var(--accent-emerald)] font-semibold">
                              +{formatINR(c.cashSales)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[var(--accent-coral)]">
                              -{formatINR(outflows)}
                            </td>
                            <td className="py-3 px-4 text-right font-mono font-bold text-[#DFC488]">
                              {formatINR(c.physicalCash)}
                            </td>
                            <td className="py-3 px-4">
                              <GlassBadge
                                variant={
                                  c.status === "tallied"
                                    ? "emerald"
                                    : c.status === "shortage"
                                    ? "coral"
                                    : "gold"
                                }
                                size="sm"
                              >
                                {c.status === "tallied"
                                  ? "रोकड़ मिलान सही"
                                  : c.status === "shortage"
                                  ? `कमी: -₹${Math.abs(c.discrepancy)}`
                                  : `अधिक: +₹${c.discrepancy}`}
                              </GlassBadge>
                            </td>
                            <td className="py-3 px-4 text-[var(--text-secondary)]">
                              <div>{c.closedBy}</div>
                              {c.notes && (
                                <div className="text-[10px] text-[var(--text-tertiary)] italic">
                                  {c.notes}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* Tab 2: Shop Expense Book (दुकान खर्च बही) */}
      {activeTab === "expenses" && (
        <div className="space-y-4">
          <GlassPanel className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                    <th className="py-3 px-4 font-semibold">Date & Voucher</th>
                    <th className="py-3 px-4 font-semibold">Expense Category</th>
                    <th className="py-3 px-4 font-semibold">Paid To (व्यक्ति / फर्म)</th>
                    <th className="py-3 px-4 font-semibold">Payment Mode</th>
                    <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                    <th className="py-3 px-4 font-semibold">Remarks & Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                        No expenses logged yet. Click &quot;+ Log Expense&quot; above.
                      </td>
                    </tr>
                  ) : (
                    expenses
                      .filter((exp) => {
                        const q = searchQuery.toLowerCase();
                        return (
                          exp.category.toLowerCase().includes(q) ||
                          exp.paidTo.toLowerCase().includes(q) ||
                          (exp.voucherNumber && exp.voucherNumber.toLowerCase().includes(q)) ||
                          (exp.notes && exp.notes.toLowerCase().includes(q))
                        );
                      })
                      .map((exp) => (
                        <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono">
                            <div>{new Date(exp.date).toLocaleDateString("en-IN")}</div>
                            <div className="text-[10px] text-[#DFC488] font-semibold">
                              {exp.voucherNumber}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                            {exp.category}
                          </td>
                          <td className="py-3 px-4 text-[var(--text-primary)] font-semibold">
                            {exp.paidTo}
                          </td>
                          <td className="py-3 px-4">
                            <GlassBadge
                              variant={
                                exp.paymentMode === "Cash"
                                  ? "gold"
                                  : exp.paymentMode === "UPI Business"
                                  ? "emerald"
                                  : "neutral"
                              }
                              size="sm"
                            >
                              {exp.paymentMode}
                            </GlassBadge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--accent-coral)]">
                            {formatINR(exp.amount)}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[var(--text-secondary)]">
                            <div>{exp.notes || "—"}</div>
                            <div className="text-[10px] text-[var(--text-tertiary)]">
                              By {exp.recordedBy || "Staff"}
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Tab 3: Chart of Accounts (खाता बही सूची) */}
      {activeTab === "chart" && (
        <div className="space-y-4">
          <GlassPanel className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                    <th className="py-3 px-4 font-semibold">Code</th>
                    <th className="py-3 px-4 font-semibold">Account Head (खाता नाम)</th>
                    <th className="py-3 px-4 font-semibold">Category Type</th>
                    <th className="py-3 px-4 font-semibold text-right">Balance</th>
                    <th className="py-3 px-4 font-semibold">Description / Purpose</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {accounts
                    .filter((acc) => {
                      const q = searchQuery.toLowerCase();
                      return (
                        acc.code.includes(q) ||
                        acc.name.toLowerCase().includes(q) ||
                        acc.nameHindi.includes(q) ||
                        acc.type.includes(q)
                      );
                    })
                    .map((acc) => {
                      const typeVariant: "gold" | "emerald" | "coral" | "neutral" =
                        acc.type === "asset"
                          ? "emerald"
                          : acc.type === "liability"
                          ? "coral"
                          : acc.type === "revenue"
                          ? "gold"
                          : "neutral";

                      return (
                        <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#DFC488]">
                            {acc.code}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                            <div>{acc.name}</div>
                            <div className="text-[11px] text-[var(--text-tertiary)] font-normal">
                              {acc.nameHindi}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <GlassBadge variant={typeVariant} size="sm">
                              {acc.type.toUpperCase()}
                            </GlassBadge>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                            {formatINR(acc.balance)}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-[var(--text-secondary)] max-w-sm">
                            {acc.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* Modal 1: Log Shop Expense */}
      {isExpenseModalOpen && (
        <GlassDialog
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          title="Log Shop Expense (दुकान खर्च दर्ज करें)"
          description="Record daily petty expenses for refreshments, hallmarking, boxes, or utilities."
          maxWidth="md"
        >
          <form onSubmit={handleExpenseSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Expense Category (खर्च श्रेणी) *
              </label>
              <select
                value={expCategory}
                onChange={(e) => setExpCategory(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                required
              >
                <option value="Customer Refreshments (चाय-पानी)">
                  Customer Refreshments (चाय-पानी व नाश्ता)
                </option>
                <option value="BIS Hallmarking & Assaying (हॉलमार्क)">
                  BIS Hallmarking & Assaying (हॉलमार्क जांच)
                </option>
                <option value="Boxes & Packaging (डिब्बे व थैली)">
                  Boxes & Packaging (डिब्बे, थैली व पाउच)
                </option>
                <option value="Shop Electricity & Utility (बिजली)">
                  Shop Electricity & Utility (बिजली व मेंटेनेंस)
                </option>
                <option value="Showroom Rent (किराया)">
                  Showroom Rent (दुकान किराया)
                </option>
                <option value="Staff Salary & Advance (वेतन)">
                  Staff Salary & Advance (स्टाफ वेतन व अग्रिम)
                </option>
                <option value="Tools & Consumables (जार-तार/तेजाब)">
                  Tools & Consumables (जार-तार, कंडे, तेजाब)
                </option>
                <option value="Security & Guard (गार्ड)">
                  Security & Guard (सुरक्षा गार्ड)
                </option>
                <option value="Miscellaneous (अन्य खर्च)">
                  Miscellaneous (अन्य विविध खर्च)
                </option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Amount (₹) *"
                type="number"
                prefixSymbol="₹"
                value={expAmount}
                onChange={(e) => setExpAmount(e.target.value)}
                placeholder="450"
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Paid From (भुगतान माध्यम)
                </label>
                <select
                  value={expMode}
                  onChange={(e) => setExpMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="Cash">Cash in Drawer (काउंटर गल्ला)</option>
                  <option value="UPI Business">UPI Business (PhonePe/GPay)</option>
                  <option value="Bank Current A/C">Bank Current A/C (HDFC)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Paid To (दुकानदार / व्यक्ति) *"
                placeholder="e.g. Gulab Ji Chai / Hallmark Centre"
                value={expPaidTo}
                onChange={(e) => setExpPaidTo(e.target.value)}
                required
              />
              <GlassInput
                label="Voucher / Bill # (Optional)"
                placeholder="e.g. V-805"
                value={expVoucher}
                onChange={(e) => setExpVoucher(e.target.value)}
              />
            </div>

            <GlassInput
              label="Remarks / Description"
              placeholder="e.g. Tea & snacks for wedding ring buyers..."
              value={expNotes}
              onChange={(e) => setExpNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsExpenseModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Record Expense
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 2: Perform Daily Cash Closing */}
      {isClosingModalOpen && (
        <GlassDialog
          isOpen={isClosingModalOpen}
          onClose={() => setIsClosingModalOpen(false)}
          title="Daily Cash Closing & Drawer Tally (दैनिक रोकड़ मिलान)"
          description="Reconcile daily cash counter inflows and outflows before locking the cashbook for the night."
          maxWidth="lg"
        >
          <form onSubmit={handleClosingSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                label="Closing Date *"
                type="date"
                value={closingDate}
                onChange={(e) => setClosingDate(e.target.value)}
                required
              />
              <GlassInput
                label="Opening Cash Balance (सुबह का गल्ला) *"
                type="number"
                prefixSymbol="₹"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Counter Cash Billing (+)"
                type="number"
                prefixSymbol="₹"
                value={cashSales}
                onChange={(e) => setCashSales(e.target.value)}
              />
              <GlassInput
                label="Customer Cash Advances (+)"
                type="number"
                prefixSymbol="₹"
                value={cashAdvances}
                onChange={(e) => setCashAdvances(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <GlassInput
                label="Supplier Cash Paid (-)"
                type="number"
                prefixSymbol="₹"
                value={supplierCash}
                onChange={(e) => setSupplierCash(e.target.value)}
              />
              <GlassInput
                label="Karigar Labour Paid (-)"
                type="number"
                prefixSymbol="₹"
                value={karigarCash}
                onChange={(e) => setKarigarCash(e.target.value)}
              />
              <GlassInput
                label="Shop Cash Expenses (-)"
                type="number"
                prefixSymbol="₹"
                value={cashExpensesVal}
                onChange={(e) => setCashExpensesVal(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between font-semibold">
              <span className="text-[var(--text-secondary)]">Calculated Expected Cash (बही शेष):</span>
              <span className="font-mono text-base text-[#DFC488]">{formatINR(expectedCash)}</span>
            </div>

            {/* Note Denomination Counter in Dialog */}
            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] block">
                Physical Cash Denominations (नोट गिनती)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block">₹500</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations.count500}
                    onChange={(e) => updateCount("count500", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block">₹200</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations.count200}
                    onChange={(e) => updateCount("count200", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block">₹100</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations.count100}
                    onChange={(e) => updateCount("count100", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block">₹50</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations.count50}
                    onChange={(e) => updateCount("count50", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block">₹20/₹10</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations.count20}
                    onChange={(e) => updateCount("count20", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[var(--text-tertiary)] block">Coins (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={denominations.coinsTotal}
                    onChange={(e) => updateCount("coinsTotal", parseInt(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-black/50 border border-white/[0.1] font-mono text-center text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Reconciliation Live Status Box */}
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs font-semibold ${
                discrepancy === 0
                  ? "bg-[var(--accent-emerald)]/10 border-[var(--accent-emerald)]/30 text-[var(--accent-emerald)]"
                  : discrepancy < 0
                  ? "bg-[var(--accent-coral)]/10 border-[var(--accent-coral)]/30 text-[var(--accent-coral)]"
                  : "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#DFC488]"
              }`}
            >
              <span>Physical Count: {formatINR(physicalCash)}</span>
              <span>
                {discrepancy === 0
                  ? "Tally: ₹0 (रोकड़ सही)"
                  : discrepancy < 0
                  ? `Shortage: -₹${Math.abs(discrepancy).toLocaleString("en-IN")}`
                  : `Surplus: +₹${discrepancy.toLocaleString("en-IN")}`}
              </span>
            </div>

            <GlassInput
              label="Closing Remarks / Discrepancy Explanation"
              placeholder="e.g. Perfectly tallied with counter drawer, closed at 8:45 PM..."
              value={closingNotes}
              onChange={(e) => setClosingNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsClosingModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Lock & Settle Daily Cashbook
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}
    </div>
  );
};
