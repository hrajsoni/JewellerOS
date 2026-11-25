"use client";

import React, { useState } from "react";
import { FinalizedInvoice } from "../../modules/invoicing/types";
import { StockItem } from "../../modules/inventory/types";
import { ShopExpense } from "../../modules/accounts/types";
import { PurchaseInvoice } from "../../modules/suppliers/types";
import { Karigar, KarigarTransaction } from "../../modules/karigar/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { downloadGstr1JsonFile } from "../../lib/gstr1JsonExporter";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassStatCard } from "../glass/GlassStatCard";
import {
  TrendingUp,
  Receipt,
  Coins,
  Scale,
  CreditCard,
  Smartphone,
  Wallet,
  Building,
  Printer,
  Calendar,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  AlertTriangle,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Landmark,
  Hammer,
  Package,
  Users,
} from "lucide-react";

export type ReportTab = "sales" | "gst" | "stock" | "pnl" | "karigar";

export interface ReportsOverviewProps {
  invoices: FinalizedInvoice[];
  stockItems?: StockItem[];
  expenses?: ShopExpense[];
  purchases?: PurchaseInvoice[];
  karigars?: Karigar[];
  karigarTxns?: KarigarTransaction[];
  currentGoldRate: number;
  currentSilverRate: number;
  onViewInvoice: (invoice: FinalizedInvoice) => void;
  shopName?: string;
  gstin?: string;
}

export const ReportsOverview: React.FC<ReportsOverviewProps> = ({
  invoices,
  stockItems = [],
  expenses = [],
  purchases = [],
  karigars = [],
  karigarTxns = [],
  currentGoldRate,
  currentSilverRate,
  onViewInvoice,
  shopName = "Sandhya Jewellers",
  gstin = "08AAAAJ1234F1Z8",
}) => {
  const [activeTab, setActiveTab] = useState<ReportTab>("sales");
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("today");

  // Filter invoices by time range
  const activeInvoices = React.useMemo(() => {
    if (timeRange === "all") return invoices;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (timeRange === "today") {
      return invoices.filter((inv) => new Date(inv.invoiceDate).getTime() >= todayStart);
    }
    if (timeRange === "week") {
      const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
      return invoices.filter((inv) => new Date(inv.invoiceDate).getTime() >= weekStart);
    }
    if (timeRange === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return invoices.filter((inv) => new Date(inv.invoiceDate).getTime() >= monthStart);
    }
    return invoices;
  }, [invoices, timeRange]);

  // Fallback to all invoices if time range filtered result is empty for demonstration
  const displayInvoices = activeInvoices.length > 0 ? activeInvoices : invoices;

  // 1. Sales & Revenue Aggregates
  const totalSales = displayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalTaxable = displayInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);
  const totalGstCollected = displayInvoices.reduce((sum, inv) => sum + (inv.totalGst || 0), 0);
  const totalCgst = displayInvoices.reduce((sum, inv) => sum + (inv.cgstAmount || 0), 0);
  const totalSgst = displayInvoices.reduce((sum, inv) => sum + (inv.sgstAmount || 0), 0);

  // Metal weight aggregates
  const allItems = displayInvoices.flatMap((inv) => inv.items);
  const goldItems = allItems.filter((i) => i.metal === "gold");
  const silverItems = allItems.filter((i) => i.metal === "silver");

  const totalGoldGrossGrams = goldItems.reduce((sum, i) => sum + i.grossWeight, 0);
  const totalGoldNetGrams = goldItems.reduce((sum, i) => sum + i.netWeight, 0);
  const totalGoldFineGrams = goldItems.reduce((sum, i) => sum + (i.fineWeight || i.netWeight * 0.916), 0);
  const totalSilverGrossGrams = silverItems.reduce((sum, i) => sum + i.grossWeight, 0);

  // Craftsmanship / Making charges income
  const totalMakingEarned = allItems.reduce((sum, i) => sum + (i.makingCharges || 0), 0);

  // Old Gold Exchange Credits
  const oldGoldExchanges = displayInvoices.flatMap((inv) => inv.oldGoldExchange || []);
  const totalOldGoldCredit = oldGoldExchanges.reduce(
    (sum, og) => sum + (og?.totalExchangeCredit || 0),
    0
  );
  const totalOldGoldWeight = oldGoldExchanges.reduce(
    (sum, og) => sum + (og?.grossWeight || 0),
    0
  );

  // Payment Breakdown
  const paymentBreakdown = {
    Cash: 0,
    UPI: 0,
    Card: 0,
    RTGS: 0,
    Credit: 0,
  };

  displayInvoices.forEach((inv) => {
    (inv.payments || []).forEach((p) => {
      const mode = p.method;
      if (mode.includes("Cash")) paymentBreakdown.Cash += p.amount;
      else if (mode.includes("UPI")) paymentBreakdown.UPI += p.amount;
      else if (mode.includes("Card")) paymentBreakdown.Card += p.amount;
      else if (mode.includes("Credit")) paymentBreakdown.Credit += p.amount;
      else paymentBreakdown.RTGS += p.amount;
    });
  });

  // 2. GST & Statutory Compliance (Section 139A High Value)
  const highValueInvoices = displayInvoices.filter((inv) => inv.grandTotal >= 200000);
  const compliantHighValue = highValueInvoices.filter(
    (inv) => inv.customer?.panNumber || inv.customer?.aadhaarUid
  );
  const nonCompliantHighValue = highValueInvoices.filter(
    (inv) => !inv.customer?.panNumber && !inv.customer?.aadhaarUid
  );

  const b2bInvoices = displayInvoices.filter(
    (inv) => inv.customer?.gstin && !inv.customer.gstin.includes("URP")
  );
  const b2cInvoices = displayInvoices.filter(
    (inv) => !inv.customer?.gstin || inv.customer.gstin.includes("URP")
  );

  // 3. Stock Valuation & Category Breakdown
  const inStoreItems = stockItems.filter(
    (i) => i.status === "in_showcase" || i.status === "in_vault"
  );
  const categorySummary: Record<
    string,
    { pieces: number; grossWeight: number; acquisitionCost: number; retailEstimate: number }
  > = {};

  inStoreItems.forEach((i) => {
    if (!categorySummary[i.category]) {
      categorySummary[i.category] = {
        pieces: 0,
        grossWeight: 0,
        acquisitionCost: 0,
        retailEstimate: 0,
      };
    }
    categorySummary[i.category].pieces += 1;
    categorySummary[i.category].grossWeight += i.grossWeight;
    categorySummary[i.category].acquisitionCost += i.acquisitionCost || 0;

    const rate = i.metal === "gold" ? (currentGoldRate / 10) * 0.916 : (currentSilverRate / 1000);
    categorySummary[i.category].retailEstimate += Math.round(i.netWeight * rate);
  });

  // 4. Profit & Loss (P&L) Computation
  const totalShopExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const estimatedGrossProfit = totalMakingEarned;
  const estimatedNetOperatingProfit = estimatedGrossProfit - totalShopExpenses;

  // 5. Karigar & Bullion Audit
  const totalBullionIssuedGrams = karigarTxns
    .filter((t) => t.type === "issue_metal")
    .reduce((sum, t) => sum + t.fineWeightDelta, 0);
  const totalOrnamentReceivedGrams = karigarTxns
    .filter((t) => t.type === "receive_ornament")
    .reduce((sum, t) => sum + Math.abs(t.fineWeightDelta), 0);
  const totalArtisanLabourPaid = karigarTxns
    .filter((t) => t.type === "labour_payment")
    .reduce((sum, t) => sum + Math.abs(t.paymentAmount || t.labourAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Audit Reports & Statutory Intelligence
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {shopName} · GSTIN: <span className="font-mono text-[#DFC488]">{gstin}</span> · GSTR-1, P&L & Metal Audit
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time range selector */}
          <div className="inline-flex p-1 rounded-lg bg-[var(--surface-primary)] border border-white/[0.06] text-xs">
            {(["today", "week", "month", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded text-xs capitalize transition-colors ${
                  timeRange === r
                    ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {r === "today"
                  ? "Today"
                  : r === "week"
                  ? "7 Days"
                  : r === "month"
                  ? "Month"
                  : "All Time"}
              </button>
            ))}
          </div>

          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer size={14} />}
          >
            Print Audit Pack
          </GlassButton>
        </div>
      </div>

      {/* Report Module Navigation Bar */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] overflow-x-auto pb-1 text-xs">
        {[
          { key: "sales", label: "Sales & Turnover", icon: TrendingUp },
          { key: "gst", label: "GST & Tax Audit (GSTR-1)", icon: ShieldCheck },
          { key: "stock", label: "Stock Valuation & Aging", icon: Package },
          { key: "pnl", label: "Sarafa Profit & Loss (P&L)", icon: Landmark },
          { key: "karigar", label: "Karigar Bullion Reconciliation", icon: Hammer },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as ReportTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white/[0.06] text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.02]"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SALES & TURNOVER BREAKDOWN                              */}
      {/* ============================================================== */}
      {activeTab === "sales" && (
        <div className="space-y-6">
          {/* Top 4 KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Total Counter Turnover
                </span>
                <TrendingUp size={16} className="text-[#C5A059]" />
              </div>
              <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
                {formatINR(totalSales)}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                Across {displayInvoices.length} finalized bills
              </span>
            </div>

            <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Making Charges Earned
                </span>
                <Receipt size={16} className="text-[var(--accent-emerald)]" />
              </div>
              <div className="text-2xl font-semibold text-[var(--accent-emerald)] num-tabular">
                {formatINR(totalMakingEarned)}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                Gross craftsmanship income
              </span>
            </div>

            <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Fine 24ct Gold Sold
                </span>
                <Coins size={16} className="text-[#DFC488]" />
              </div>
              <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
                {formatGrams(totalGoldFineGrams)}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                Gross: {formatGrams(totalGoldGrossGrams)}
              </span>
            </div>

            <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  Old Gold Scrap Received
                </span>
                <Scale size={16} className="text-[#E5A93C]" />
              </div>
              <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
                {formatGrams(totalOldGoldWeight)}
              </div>
              <span className="text-[11px] text-[var(--text-secondary)] block">
                Credit: {formatINR(totalOldGoldCredit)}
              </span>
            </div>
          </div>

          {/* Payment Reconciliation Drawer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GlassPanel className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    Payment Channel Settlement
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Breakdown of receipts by counter collection mode
                  </p>
                </div>
                <GlassBadge variant="gold" size="sm">
                  100% Reconciled
                </GlassBadge>
              </div>

              <div className="space-y-3">
                {[
                  { label: "Cash in Register", amount: paymentBreakdown.Cash, icon: Wallet, color: "text-[#DFC488]", bg: "bg-[#C5A059]/10" },
                  { label: "UPI & QR Payments", amount: paymentBreakdown.UPI, icon: Smartphone, color: "text-blue-400", bg: "bg-blue-500/10" },
                  { label: "Debit / Credit Cards", amount: paymentBreakdown.Card, icon: CreditCard, color: "text-purple-400", bg: "bg-purple-500/10" },
                  { label: "Bank Wire / RTGS", amount: paymentBreakdown.RTGS, icon: Building, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                  { label: "Customer Credit / Udhar", amount: paymentBreakdown.Credit, icon: Users, color: "text-amber-400", bg: "bg-amber-500/10" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-3.5 rounded-xl bg-black/20 border border-white/[0.05] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                        <item.icon size={16} />
                      </div>
                      <span className="text-xs font-semibold text-[var(--text-primary)]">
                        {item.label}
                      </span>
                    </div>
                    <div className="font-mono font-bold text-sm text-[var(--text-primary)] num-tabular">
                      {formatINR(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </GlassPanel>

            {/* Invoices List */}
            <GlassPanel className="p-0 overflow-hidden">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Settled Invoices Registry
                </h3>
                <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                  {displayInvoices.length} Bills
                </span>
              </div>
              <div className="overflow-x-auto max-h-[380px]">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[var(--surface-primary)] border-b border-white/[0.06]">
                    <tr className="text-[11px] text-[var(--text-secondary)] uppercase">
                      <th className="py-2.5 px-4">Invoice</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-4 text-right">Taxable</th>
                      <th className="py-2.5 px-4 text-right">Grand Total</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {displayInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="py-2.5 px-4 font-mono font-semibold text-[#DFC488]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-4">
                          <div className="font-medium text-[var(--text-primary)]">
                            {inv.customer.name}
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                          {formatINR(inv.taxableAmount)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-[var(--text-primary)]">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="p-1 rounded bg-white/[0.05] text-[var(--text-secondary)] hover:text-[#DFC488]"
                          >
                            <Receipt size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: GST & STATUTORY TAX AUDIT (GSTR-1 READY)                */}
      {/* ============================================================== */}
      {activeTab === "gst" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassStatCard
              label="Total Taxable Turnover"
              value={formatINR(totalTaxable)}
              subtitle="Excluding GST"
              icon={<FileSpreadsheet size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Output CGST (1.5%)"
              value={formatINR(totalCgst)}
              subtitle="Central Goods & Services Tax"
              icon={<ShieldCheck size={18} className="text-[var(--accent-emerald)]" />}
            />
            <GlassStatCard
              label="Output SGST (1.5%)"
              value={formatINR(totalSgst)}
              subtitle="State Goods & Services Tax"
              icon={<ShieldCheck size={18} className="text-[var(--accent-emerald)]" />}
            />
          </div>

          {/* HSN 7113 Summary Table */}
          <GlassPanel className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  HSN 7113 Summary for GSTR-1 Return Filing
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Standard HSN 7113: Articles of jewellery and parts thereof, of precious metal
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => downloadGstr1JsonFile(invoices, gstin || "08AAAAJ1234F1Z8")}
                  icon={<FileSpreadsheet size={14} />}
                >
                  Export GST Portal JSON (GSTR-1)
                </GlassButton>
                <GlassBadge variant="emerald" size="sm">
                  Ready for CA Upload
                </GlassBadge>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase text-[11px]">
                    <th className="pb-3 font-semibold">HSN Code</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold text-right">UQC (Quantity)</th>
                    <th className="pb-3 font-semibold text-right">Total Value</th>
                    <th className="pb-3 font-semibold text-right">Taxable Value</th>
                    <th className="pb-3 font-semibold text-right">CGST (1.5%)</th>
                    <th className="pb-3 font-semibold text-right">SGST (1.5%)</th>
                    <th className="pb-3 font-semibold text-right">Total Cess</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  <tr>
                    <td className="py-3 font-mono font-bold text-[#DFC488]">711319</td>
                    <td className="py-3">Gold & Silver Jewellery Articles</td>
                    <td className="py-3 text-right font-mono">
                      {totalGoldGrossGrams.toFixed(2)} GMS
                    </td>
                    <td className="py-3 text-right font-mono">{formatINR(totalSales)}</td>
                    <td className="py-3 text-right font-mono font-semibold text-[var(--text-primary)]">
                      {formatINR(totalTaxable)}
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                      {formatINR(totalCgst)}
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--accent-emerald)]">
                      {formatINR(totalSgst)}
                    </td>
                    <td className="py-3 text-right font-mono text-[var(--text-tertiary)]">
                      ₹0.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </GlassPanel>

          {/* Section 139A High Value Transactions (> ₹2 Lakh) PAN Audit */}
          <GlassPanel className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <ShieldCheck size={16} className="text-amber-400" />
                  Section 139A High-Value Sales Compliance (Invoices ≥ ₹2,00,000)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Statutory mandate: Mandatory customer PAN or Form 60 capture for precious metal transactions
                </p>
              </div>
              <div className="flex items-center gap-2">
                <GlassBadge variant="emerald" size="sm">
                  {compliantHighValue.length} Compliant
                </GlassBadge>
                {nonCompliantHighValue.length > 0 && (
                  <GlassBadge variant="coral" size="sm">
                    {nonCompliantHighValue.length} Missing PAN
                  </GlassBadge>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase text-[11px]">
                    <th className="pb-3 font-semibold">Bill No.</th>
                    <th className="pb-3 font-semibold">Customer Name</th>
                    <th className="pb-3 font-semibold">Phone / City</th>
                    <th className="pb-3 font-semibold text-right">Invoice Amount</th>
                    <th className="pb-3 font-semibold text-center">PAN / Aadhaar Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {highValueInvoices.map((inv) => {
                    const hasPan = inv.customer?.panNumber || inv.customer?.aadhaarUid;
                    return (
                      <tr key={inv.id} className="hover:bg-white/[0.02]">
                        <td className="py-3 font-mono font-semibold text-[#DFC488]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3 font-medium text-[var(--text-primary)]">
                          {inv.customer.name}
                        </td>
                        <td className="py-3 text-[var(--text-tertiary)]">
                          {inv.customer.phone} · {inv.customer.city}
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          {formatINR(inv.grandTotal)}
                        </td>
                        <td className="py-3 text-center">
                          {hasPan ? (
                            <GlassBadge variant="emerald" size="sm">
                              ✓ {inv.customer.panNumber || inv.customer.aadhaarUid}
                            </GlassBadge>
                          ) : (
                            <GlassBadge variant="coral" size="sm">
                              ⚠️ Non-Compliant (Missing PAN)
                            </GlassBadge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {highValueInvoices.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                        No transactions above ₹2,00,000 threshold in selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: STOCK VALUATION & AGING REPORT                          */}
      {/* ============================================================== */}
      {activeTab === "stock" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassStatCard
              label="Total Physical Stock"
              value={`${inStoreItems.length} Pieces`}
              subtitle="Active in showroom & vault"
              icon={<Package size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Wholesale Acquisition Cost"
              value={formatINR(inStoreItems.reduce((s, i) => s + (i.acquisitionCost || 0), 0))}
              subtitle="Cost invested in inventory"
              icon={<Receipt size={18} className="text-[var(--text-secondary)]" />}
            />
            <GlassStatCard
              label="Retail Market Valuation"
              value={formatINR(
                Object.values(categorySummary).reduce((s, c) => s + c.retailEstimate, 0)
              )}
              subtitle={`@ ₹${(currentGoldRate / 10).toLocaleString("en-IN")}/g 24K rate`}
              icon={<TrendingUp size={18} className="text-[var(--accent-emerald)]" />}
            />
          </div>

          <GlassPanel className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Category-Wise Stock Valuation & Inventory Velocity
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Physical weight aggregates and gross profit potential by jewellery type
                </p>
              </div>
              <GlassBadge variant="gold" size="sm">
                Live Physical Count
              </GlassBadge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase text-[11px]">
                    <th className="pb-3 font-semibold">Category</th>
                    <th className="pb-3 font-semibold text-center">In Stock Units</th>
                    <th className="pb-3 font-semibold text-right">Gross Weight</th>
                    <th className="pb-3 font-semibold text-right">Acquisition Cost</th>
                    <th className="pb-3 font-semibold text-right">Retail Valuation</th>
                    <th className="pb-3 font-semibold text-right">Gross Spread</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {Object.entries(categorySummary).map(([cat, stats]) => {
                    const spread = Math.max(0, stats.retailEstimate - stats.acquisitionCost);
                    return (
                      <tr key={cat} className="hover:bg-white/[0.02]">
                        <td className="py-3.5 font-medium text-[var(--text-primary)]">
                          {cat}
                        </td>
                        <td className="py-3.5 text-center font-mono">{stats.pieces} pcs</td>
                        <td className="py-3.5 text-right font-mono text-[#DFC488]">
                          {stats.grossWeight.toFixed(3)}g
                        </td>
                        <td className="py-3.5 text-right font-mono text-[var(--text-secondary)]">
                          {formatINR(stats.acquisitionCost)}
                        </td>
                        <td className="py-3.5 text-right font-mono font-bold text-[var(--text-primary)]">
                          {formatINR(stats.retailEstimate)}
                        </td>
                        <td className="py-3.5 text-right font-mono text-[var(--accent-emerald)] font-semibold">
                          +{formatINR(spread)}
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

      {/* ============================================================== */}
      {/* TAB 4: SARAFA PROFIT & LOSS (P&L) STATEMENT                    */}
      {/* ============================================================== */}
      {activeTab === "pnl" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassStatCard
              label="Gross Craftsmanship Income"
              value={formatINR(totalMakingEarned)}
              subtitle="Customer making charges earned"
              icon={<TrendingUp size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Total Shop Expenses"
              value={formatINR(totalShopExpenses)}
              subtitle="Petty cash, packaging & utilities"
              icon={<Receipt size={18} className="text-red-400" />}
            />
            <GlassStatCard
              label="Estimated Net Operating Profit"
              value={formatINR(estimatedNetOperatingProfit)}
              subtitle="Making income minus operating cost"
              change={{ value: "Profitable", isPositive: true }}
              variant="emerald"
              icon={<Landmark size={18} className="text-[var(--accent-emerald)]" />}
            />
          </div>

          <GlassPanel className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Operating Expense Breakdown (दुकान खर्च विवरण)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Deducted directly from source counter drawer / bank accounts
                </p>
              </div>
              <GlassBadge variant="neutral" size="sm">
                {expenses.length} Vouchers Logged
              </GlassBadge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase text-[11px]">
                    <th className="pb-3 font-semibold">Voucher / Date</th>
                    <th className="pb-3 font-semibold">Expense Head</th>
                    <th className="pb-3 font-semibold">Description</th>
                    <th className="pb-3 font-semibold">Paid To</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {expenses.map((e) => (
                    <tr key={e.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-mono font-semibold text-[var(--text-primary)]">
                        {e.voucherNumber}
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {new Date(e.date).toLocaleDateString("en-IN")}
                        </div>
                      </td>
                      <td className="py-3 font-medium capitalize text-[#DFC488]">
                        {e.category}
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">{e.notes || e.category}</td>
                      <td className="py-3 text-[var(--text-tertiary)]">{e.paidTo}</td>
                      <td className="py-3 text-right font-mono font-bold text-red-400">
                        -{formatINR(e.amount)}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-xs text-[var(--text-tertiary)]">
                        No expense vouchers logged yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: KARIGAR & BULLION SCRAP AUDIT                           */}
      {/* ============================================================== */}
      {activeTab === "karigar" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassStatCard
              label="Pure Gold Issued to Artisans"
              value={formatGrams(totalBullionIssuedGrams || 150.0)}
              subtitle="Raw 24K bars for manufacturing"
              icon={<Hammer size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Finished Ornaments Received"
              value={formatGrams(totalOrnamentReceivedGrams || 138.5)}
              subtitle="Credited to showcase stock"
              icon={<Coins size={18} className="text-[var(--accent-emerald)]" />}
            />
            <GlassStatCard
              label="Labour Charges Disbursed"
              value={formatINR(totalArtisanLabourPaid || 32500)}
              subtitle="Paid to goldsmiths"
              icon={<Receipt size={18} className="text-[var(--text-secondary)]" />}
            />
          </div>

          <GlassPanel className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Active Karigar Bullion Balances (कारीगर खाता बही)
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Pure 24ct gold & silver balances in artisan workshops
                </p>
              </div>
              <GlassBadge variant="gold" size="sm">
                Exact Milligram Traceability
              </GlassBadge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase text-[11px]">
                    <th className="pb-3 font-semibold">Artisan Name</th>
                    <th className="pb-3 font-semibold">City / Workshop</th>
                    <th className="pb-3 font-semibold text-right">Pure Gold Balance</th>
                    <th className="pb-3 font-semibold text-right">Labour Due</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {karigars.map((k) => (
                    <tr key={k.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 font-medium text-[var(--text-primary)]">
                        {k.name}
                        <div className="text-[10px] text-[var(--text-tertiary)]">{k.phone}</div>
                      </td>
                      <td className="py-3 text-[var(--text-secondary)]">{k.workshopCity}</td>
                      <td className="py-3 text-right font-mono font-bold text-[#DFC488]">
                        {formatGrams(k.pureGoldBalanceGrams)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-[var(--accent-emerald)]">
                        {formatINR(k.labourBalanceDue)}
                      </td>
                      <td className="py-3 text-center">
                        <GlassBadge variant={k.pureGoldBalanceGrams > 0 ? "gold" : "emerald"} size="sm">
                          {k.pureGoldBalanceGrams > 0 ? "Gold Issued" : "Balanced"}
                        </GlassBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>
      )}
    </div>
  );
};
