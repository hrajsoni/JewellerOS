"use client";

import React, { useState } from "react";
import { GlassStatCard } from "../glass/GlassStatCard";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import {
  TrendingUp,
  Receipt,
  Coins,
  Scale,
  Printer,
  Eye,
  ArrowUpRight,
  AlertTriangle,
  Building2,
  Landmark,
  Hammer,
  Truck,
  Users,
  Wrench,
  Sparkles,
  Lock,
  Search,
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from "lucide-react";
import { FinalizedInvoice } from "../../modules/invoicing/types";
import { StockItem } from "../../modules/inventory/types";
import { Customer } from "../../modules/customers/types";
import { Karigar } from "../../modules/karigar/types";
import { SupplierProfile } from "../../modules/suppliers/types";
import { GirviLoan } from "../../modules/girvi/types";
import { RepairJob, CustomBookingOrder } from "../../modules/repairs/types";
import { ConsignmentMemo } from "../../modules/wholesale/types";
import { Account } from "../../modules/accounts/types";
import { useAuth } from "../../modules/auth/AuthContext";
import { formatINR, formatGrams } from "../../lib/formatters";

export interface FinancialOverviewProps {
  onSelectCalculator?: () => void;
  onOpenInvoice?: () => void;
  onNavigateTab?: (href: string) => void;
  invoices?: FinalizedInvoice[];
  stockItems?: StockItem[];
  customers?: Customer[];
  karigars?: Karigar[];
  suppliers?: SupplierProfile[];
  girviLoans?: GirviLoan[];
  repairs?: RepairJob[];
  bookings?: CustomBookingOrder[];
  memos?: ConsignmentMemo[];
  accounts?: Account[];
  gold24kRate?: number;
  silverRate?: number;
  onViewInvoice?: (invoice: FinalizedInvoice) => void;
  shopName?: string;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  onSelectCalculator,
  onOpenInvoice,
  onNavigateTab,
  invoices = [],
  stockItems = [],
  customers = [],
  karigars = [],
  suppliers = [],
  girviLoans = [],
  repairs = [],
  bookings = [],
  memos = [],
  accounts = [],
  gold24kRate = 150000,
  silverRate = 95000,
  onViewInvoice,
  shopName = "Sandhya Jewellers",
}) => {
  const { user, role, hasPermission } = useAuth();
  const isOwnerOrManager = hasPermission("VIEW_OWNER_REPORTS");

  // Counter quick search state (for sales staff)
  const [stockSearchQuery, setStockSearchQuery] = useState("");

  // 1. Sales & Revenue Aggregates
  const totalSalesVolume = invoices.reduce((s, inv) => s + inv.grandTotal, 0);
  const totalTaxable = invoices.reduce((s, inv) => s + inv.taxableAmount, 0);
  const totalMakingEarned = invoices
    .flatMap((inv) => inv.items)
    .reduce((s, i) => s + (i.makingCharges || 0), 0);
  const goldDispatchedGrams = invoices
    .flatMap((inv) => inv.items.filter((i) => i.metal === "gold"))
    .reduce((s, i) => s + i.grossWeight, 0);
  const invoiceCount = invoices.length;

  // 2. Physical Inventory & Valuation
  const inShowcaseItems = stockItems.filter(
    (i) => i.status === "in_showcase" || i.status === "in_vault"
  );
  const totalStockPieces = inShowcaseItems.length;

  const goldStockItems = inShowcaseItems.filter((i) => i.metal === "gold");
  const silverStockItems = inShowcaseItems.filter((i) => i.metal === "silver");

  const totalGoldGrossGrams = goldStockItems.reduce((s, i) => s + i.grossWeight, 0);
  const totalGoldFineGrams = goldStockItems.reduce(
    (s, i) => s + (i.fineWeight || i.netWeight * 0.916),
    0
  );
  const totalSilverGrossGrams = silverStockItems.reduce((s, i) => s + i.grossWeight, 0);

  const totalAcquisitionCost = inShowcaseItems.reduce(
    (s, i) => s + (i.acquisitionCost || 0),
    0
  );
  const goldRetailVal = totalGoldFineGrams * (gold24kRate / 10);
  const silverRetailVal = (totalSilverGrossGrams / 1000) * silverRate;
  const totalEstimatedStockValuation = Math.round(goldRetailVal + silverRetailVal);
  const unrealizedGrossMargin = Math.max(
    0,
    totalEstimatedStockValuation - totalAcquisitionCost
  );

  // 3. Sarafa Working Capital & Balances
  const drawerCash = accounts.find((a) => a.code === "1010")?.balance || 0;
  const bankCurrent = accounts.find((a) => a.code === "1020")?.balance || 0;
  const upiSettled = accounts.find((a) => a.code === "1030")?.balance || 0;
  const liquidCashBank = drawerCash + bankCurrent + upiSettled;

  const customerReceivables = customers.reduce(
    (s, c) => s + (c.outstandingCredit < 0 ? Math.abs(c.outstandingCredit) : 0),
    0
  );
  const supplierPayables = suppliers.reduce(
    (s, sup) => s + (sup.outstandingBalanceINR || 0),
    0
  );

  const karigarPureGoldGrams = karigars.reduce(
    (s, k) => s + Math.max(0, k.pureGoldBalanceGrams || 0),
    0
  );
  const karigarLabourDue = karigars.reduce((s, k) => s + (k.labourBalanceDue || 0), 0);

  const activeGirviLoans = girviLoans.filter((g) => g.status === "active");
  const girviCapitalDeployed = activeGirviLoans.reduce(
    (s, g) => s + (g.principalAmount - g.principalRepaid),
    0
  );

  const activeConsignmentMemos = memos.filter(
    (m) => m.status === "active_issued" || m.status === "partially_settled"
  );
  const memoGoodsValuation = activeConsignmentMemos.reduce((s, m) => {
    const onMemoItems = m.items.filter((i) => i.status === "on_memo");
    return s + onMemoItems.reduce((isum, it) => isum + it.totalValue, 0);
  }, 0);

  // 4. Operational Attention & Deliveries Radar
  const pendingBookings = bookings.filter(
    (b) => b.status === "booked" || b.status === "in_crafting"
  );
  const readyBookings = bookings.filter((b) => b.status === "ready");

  const pendingRepairs = repairs.filter(
    (r) => r.status === "received" || r.status === "in_repair"
  );
  const readyRepairs = repairs.filter((r) => r.status === "ready_for_delivery");

  // Low Stock Categories (< 3 units)
  const categoryCounts: Record<string, number> = {};
  inShowcaseItems.forEach((i) => {
    categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
  });
  const lowStockCategories = Object.entries(categoryCounts).filter(
    ([, count]) => count < 3
  );

  // Filtered Stock Search for Front Counter
  const searchedStock = stockSearchQuery.trim()
    ? stockItems.filter(
        (i) =>
          i.name.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
          i.sku.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
          i.barcode.includes(stockSearchQuery) ||
          i.category.toLowerCase().includes(stockSearchQuery.toLowerCase())
      )
    : inShowcaseItems.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      {/* ============================================================== */}
      {/* EXECUTIVE / OWNER COMMAND CENTER DASHBOARD                     */}
      {/* ============================================================== */}
      {isOwnerOrManager ? (
        <>
          {/* Top 4 Executive Financial & Bullion KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <GlassStatCard
              label="Today's Sales Turnover"
              value={formatINR(totalSalesVolume)}
              subtitle={`${invoiceCount} counter invoices settled`}
              change={invoiceCount > 0 ? { value: `${invoiceCount} bills`, isPositive: true } : undefined}
              variant="gold"
              icon={<TrendingUp size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Stock Retail Valuation"
              value={formatINR(totalEstimatedStockValuation)}
              subtitle={`Acquisition cost: ${formatINR(totalAcquisitionCost)}`}
              change={{
                value: `+${formatINR(unrealizedGrossMargin)} margin`,
                isPositive: unrealizedGrossMargin > 0,
              }}
              variant="emerald"
              icon={<Receipt size={18} className="text-[var(--accent-emerald)]" />}
            />
            <GlassStatCard
              label="Physical Gold in Safe"
              value={formatGrams(totalGoldGrossGrams)}
              subtitle={`Fine 24K Equiv: ${formatGrams(totalGoldFineGrams)}`}
              icon={<Coins size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Liquid Cash & Bank"
              value={formatINR(liquidCashBank)}
              subtitle={`Drawer: ${formatINR(drawerCash)} · Current: ${formatINR(bankCurrent)}`}
              icon={<Landmark size={18} className="text-[var(--accent-emerald)]" />}
            />
          </div>

          {/* Sarafa Working Capital Ledger Balances (6 Cards) */}
          <div className="p-5 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  Sarafa Working Capital & Bullion Balances (रोकड़ व धातु स्थिति)
                </h3>
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                Real-time Ledger Sync
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* Customer Udhar */}
              <div
                onClick={() => onNavigateTab && onNavigateTab("/customers")}
                className="p-3 rounded-xl bg-black/30 border border-white/[0.04] hover:border-amber-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>Customer Udhar</span>
                  <Users size={13} className="text-amber-400/70" />
                </div>
                <div className="text-sm sm:text-base font-bold text-[var(--text-primary)] mt-1.5 num-tabular">
                  {formatINR(customerReceivables)}
                </div>
                <div className="text-[10px] text-amber-400 mt-1 flex items-center gap-1">
                  <span>Ledger Due</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Supplier Payables */}
              <div
                onClick={() => onNavigateTab && onNavigateTab("/purchases")}
                className="p-3 rounded-xl bg-black/30 border border-white/[0.04] hover:border-red-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>Supplier Dues</span>
                  <Truck size={13} className="text-red-400/70" />
                </div>
                <div className="text-sm sm:text-base font-bold text-red-400 mt-1.5 num-tabular">
                  {formatINR(supplierPayables)}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                  <span>Payables</span>
                  <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Karigar Pure Gold */}
              <div
                onClick={() => onNavigateTab && onNavigateTab("/karigar")}
                className="p-3 rounded-xl bg-black/30 border border-white/[0.04] hover:border-yellow-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>Karigar Gold</span>
                  <Hammer size={13} className="text-yellow-400/70" />
                </div>
                <div className="text-sm sm:text-base font-bold text-[#DFC488] mt-1.5 num-tabular">
                  {formatGrams(karigarPureGoldGrams)}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                  <span>Labour: {formatINR(karigarLabourDue)}</span>
                </div>
              </div>

              {/* Girvi Deployed */}
              <div
                onClick={() => onNavigateTab && onNavigateTab("/girvi")}
                className="p-3 rounded-xl bg-black/30 border border-white/[0.04] hover:border-emerald-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>Girvi Deployed</span>
                  <Landmark size={13} className="text-emerald-400/70" />
                </div>
                <div className="text-sm sm:text-base font-bold text-[var(--accent-emerald)] mt-1.5 num-tabular">
                  {formatINR(girviCapitalDeployed)}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                  <span>{activeGirviLoans.length} active pledges</span>
                </div>
              </div>

              {/* Consignment Memos */}
              <div
                onClick={() => onNavigateTab && onNavigateTab("/wholesale")}
                className="p-3 rounded-xl bg-black/30 border border-white/[0.04] hover:border-cyan-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>Goods on Memo</span>
                  <FileSpreadsheet size={13} className="text-cyan-400/70" />
                </div>
                <div className="text-sm sm:text-base font-bold text-cyan-300 mt-1.5 num-tabular">
                  {formatINR(memoGoodsValuation)}
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1 flex items-center gap-1">
                  <span>{activeConsignmentMemos.length} B2B memos</span>
                </div>
              </div>

              {/* Physical Silver Stock */}
              <div
                onClick={() => onNavigateTab && onNavigateTab("/inventory")}
                className="p-3 rounded-xl bg-black/30 border border-white/[0.04] hover:border-gray-300/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                  <span>Silver Stock</span>
                  <Scale size={13} className="text-gray-300/70" />
                </div>
                <div className="text-sm sm:text-base font-bold text-gray-200 mt-1.5 num-tabular">
                  {(totalSilverGrossGrams / 1000).toFixed(2)} kg
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  <span>Val: {formatINR(silverRetailVal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Sarafa Operational Action Rail */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            <GlassButton
              variant="gold-outline"
              size="sm"
              className="w-full justify-center"
              onClick={onSelectCalculator}
              icon={<Coins size={14} />}
            >
              Counter Calc
            </GlassButton>
            <GlassButton
              variant="primary"
              size="sm"
              className="w-full justify-center"
              onClick={onOpenInvoice}
              icon={<Receipt size={14} />}
            >
              New Tax Bill
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => onNavigateTab && onNavigateTab("/girvi")}
              icon={<Landmark size={14} />}
            >
              New Girvi
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => onNavigateTab && onNavigateTab("/karigar")}
              icon={<Hammer size={14} />}
            >
              Issue Bullion
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => onNavigateTab && onNavigateTab("/wholesale")}
              icon={<FileSpreadsheet size={14} />}
            >
              Issue Memo
            </GlassButton>
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={() => onNavigateTab && onNavigateTab("/accounts")}
              icon={<Building2 size={14} />}
            >
              Cash Closing
            </GlassButton>
          </div>
        </>
      ) : (
        /* ============================================================== */
        /* FRONT-COUNTER SALESPERSON TERMINAL (COSTS & MARGINS MASKED)    */
        /* ============================================================== */
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-amber-500/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-[#DFC488] uppercase tracking-wider block">
                  Front-Counter Billing Terminal
                </span>
                <h2 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                  Welcome, {user.fullName} ({role.replace("_", " ")})
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Today&apos;s Daily Sarafa Board: 24K @ {formatINR(gold24kRate)}/10g · 22K (916) @{" "}
                  {formatINR(Math.round((gold24kRate / 24) * 22))}/10g · Silver @ {formatINR(silverRate)}/kg
                </p>
              </div>
              <div className="flex items-center gap-2">
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={onSelectCalculator}
                  icon={<Coins size={14} />}
                >
                  Quick Pricing Calc
                </GlassButton>
                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  onClick={onOpenInvoice}
                  icon={<Receipt size={14} />}
                >
                  Create Bill
                </GlassButton>
              </div>
            </div>

            {/* Quick Barcode / SKU Showcase Item Search for Counter Staff */}
            <div className="pt-2">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
                />
                <input
                  type="text"
                  placeholder="Scan barcode gun or search ornament SKU, name, tray..."
                  value={stockSearchQuery}
                  onChange={(e) => setStockSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              {stockSearchQuery.trim() && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {searchedStock.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-lg bg-black/30 border border-white/[0.04] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[var(--text-primary)]">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                          {item.sku} · {item.purityDisplay} · {item.trayLocation}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[#DFC488] num-tabular">
                          {item.grossWeight.toFixed(3)}g
                        </div>
                        <GlassBadge
                          variant={item.status === "in_showcase" ? "emerald" : "neutral"}
                          size="sm"
                        >
                          {item.status.replace("_", " ")}
                        </GlassBadge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Salesperson Counter Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassStatCard
              label="Today's Bills Settled"
              value={`${invoiceCount} Invoices`}
              subtitle="100% payments reconciled"
              icon={<Receipt size={18} className="text-[var(--accent-emerald)]" />}
            />
            <GlassStatCard
              label="Gold Weight Dispatched"
              value={formatGrams(goldDispatchedGrams)}
              subtitle="Handed over to retail customers"
              icon={<Coins size={18} className="text-[#DFC38A]" />}
            />
            <GlassStatCard
              label="Ready for Delivery"
              value={`${readyBookings.length + readyRepairs.length} Orders`}
              subtitle="Awaiting customer pickup"
              icon={<Sparkles size={18} className="text-cyan-300" />}
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* LOWER SECTION: RECENT INVOICES & OPERATIONAL RADAR             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Invoices Table (8 cols) */}
        <div className="lg:col-span-8">
          <GlassPanel className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Recent Counter Invoices & Settlements
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Immutable tax snapshots with locked metal rates & GST
                </p>
              </div>
              <GlassButton
                variant="gold-outline"
                size="sm"
                onClick={onOpenInvoice}
                icon={<ArrowUpRight size={14} />}
              >
                New Invoice
              </GlassButton>
            </div>

            {/* Invoices List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px]">
                    <th className="pb-3 font-semibold">Bill No.</th>
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Item & Weight</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoices.slice(0, 6).map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 font-mono text-[var(--text-primary)] font-semibold">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5">
                        <div className="font-medium text-[var(--text-primary)]">
                          {inv.customer.name}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {new Date(inv.invoiceDate).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {inv.payments?.[0]?.method || "UPI"}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="text-[var(--text-primary)]">
                          {inv.items[0]?.name || "Gold Ornament"}
                        </div>
                        <div className="text-[10px] text-[#DFC38A] num-tabular">
                          {inv.items
                            .reduce((s, i) => s + i.grossWeight, 0)
                            .toFixed(3)}
                          g ({inv.items[0]?.purity || "22K"})
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-bold text-[var(--text-primary)] num-tabular text-sm">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 text-center">
                        <GlassBadge variant="emerald" size="sm">
                          {inv.status}
                        </GlassBadge>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            if (onViewInvoice) {
                              onViewInvoice(inv);
                            }
                          }}
                          title="View / Print Tax Invoice"
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[#DFC38A] hover:bg-white/[0.05] transition-colors"
                        >
                          <Printer size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-xs text-[var(--text-tertiary)]">
                        No invoices generated yet for this showroom. Click &quot;New Invoice&quot; to begin billing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>

        {/* Operational Attention Radar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Pending Bridal Orders & Deliveries */}
          <GlassPanel className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-400" />
                Custom Orders & Delivery Radar
              </span>
              <span className="text-[10px] text-[var(--accent-emerald)] font-medium">
                {readyBookings.length} Ready
              </span>
            </div>

            <div className="space-y-2">
              {readyBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-emerald-300">{b.title}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">
                      {b.customerName} · {b.customerPhone}
                    </div>
                  </div>
                  <GlassBadge variant="emerald" size="sm">
                    Ready
                  </GlassBadge>
                </div>
              ))}

              {pendingBookings.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{b.title}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mt-0.5">
                      <Clock size={10} /> Due {new Date(b.dueDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#DFC488]">
                    {b.targetWeightGrams}g
                  </span>
                </div>
              ))}

              {pendingBookings.length === 0 && readyBookings.length === 0 && (
                <div className="py-4 text-center text-xs text-[var(--text-tertiary)]">
                  All custom orders are up to date!
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Pending Repairs Queue */}
          <GlassPanel className="p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                <Wrench size={14} className="text-cyan-400" />
                Repairs Queue & Workshop
              </span>
              <span className="text-[10px] text-cyan-300 font-medium">
                {readyRepairs.length} Ready
              </span>
            </div>

            <div className="space-y-2">
              {readyRepairs.map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold text-cyan-300">
                      {r.ornamentDescription}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">
                      {r.customerName} · ₹{r.finalCharges}
                    </div>
                  </div>
                  <GlassBadge variant="emerald" size="sm">
                    Ready
                  </GlassBadge>
                </div>
              ))}

              {pendingRepairs.slice(0, 3).map((r) => (
                <div
                  key={r.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04] text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">
                      {r.ornamentDescription}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">
                      {r.customerName} · {r.repairType.replace("_", " ")}
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                    {r.intakeGrossWeight}g
                  </span>
                </div>
              ))}

              {pendingRepairs.length === 0 && readyRepairs.length === 0 && (
                <div className="py-4 text-center text-xs text-[var(--text-tertiary)]">
                  No active repair slips pending.
                </div>
              )}
            </div>
          </GlassPanel>

          {/* Low Stock Warnings */}
          {lowStockCategories.length > 0 && isOwnerOrManager && (
            <GlassPanel className="p-4 flex flex-col gap-2 border-amber-500/20 bg-amber-500/5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <AlertTriangle size={14} />
                <span>Showroom Low Stock Alert</span>
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Categories needing replenishment:{" "}
                {lowStockCategories.map(([cat, count]) => (
                  <span key={cat} className="font-semibold text-[var(--text-primary)]">
                    {cat} ({count} pcs) ·{" "}
                  </span>
                ))}
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
};
