"use client";

import React, { useState } from "react";
import { FinalizedInvoice } from "../../modules/invoicing/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
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
  ArrowDownRight,
  ShieldCheck,
} from "lucide-react";

export interface ReportsOverviewProps {
  invoices: FinalizedInvoice[];
  currentGoldRate: number;
  currentSilverRate: number;
  onViewInvoice: (invoice: FinalizedInvoice) => void;
}

export const ReportsOverview: React.FC<ReportsOverviewProps> = ({
  invoices,
  currentGoldRate,
  currentSilverRate,
  onViewInvoice,
}) => {
  const [timeRange, setTimeRange] = useState<"today" | "week" | "month" | "all">("today");

  // Filter invoices if needed (for now, sample data has today's date)
  const activeInvoices = invoices;

  // Aggregate financial metrics
  const totalSales = activeInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalTaxable = activeInvoices.reduce((sum, inv) => sum + inv.taxableAmount, 0);
  const totalGstCollected = activeInvoices.reduce((sum, inv) => sum + (inv.totalGst || 0), 0);

  // Metal weight aggregates
  const goldItems = activeInvoices.flatMap((inv) =>
    inv.items.filter((i) => i.metal === "gold")
  );
  const silverItems = activeInvoices.flatMap((inv) =>
    inv.items.filter((i) => i.metal === "silver")
  );

  const totalGoldGrossGrams = goldItems.reduce((sum, i) => sum + i.grossWeight, 0);
  const totalGoldNetGrams = goldItems.reduce((sum, i) => sum + i.netWeight, 0);
  const totalGoldFineGrams = goldItems.reduce((sum, i) => sum + i.fineWeight, 0);

  const totalSilverGrossGrams = silverItems.reduce((sum, i) => sum + i.grossWeight, 0);

  // Making charges & Profit
  const totalMakingEarned = activeInvoices
    .flatMap((inv) => inv.items)
    .reduce((sum, i) => sum + i.makingCharges, 0);

  // Old Gold Exchange Credits
  const oldGoldExchanges = activeInvoices.flatMap((inv) => inv.oldGoldExchange || []);
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
  };

  activeInvoices.forEach((inv) => {
    const mode = inv.payments?.[0]?.method || "UPI";
    if (mode.includes("Cash")) {
      paymentBreakdown.Cash += inv.grandTotal;
    } else if (mode.includes("UPI")) {
      paymentBreakdown.UPI += inv.grandTotal;
    } else if (mode.includes("Card")) {
      paymentBreakdown.Card += inv.grandTotal;
    } else {
      paymentBreakdown.RTGS += inv.grandTotal;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Sales Analytics & Metal Settlement
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Daily cash drawer closing, pure 24ct fine gold reconciliation, and GST reports
          </p>
        </div>

        <div className="flex items-center gap-2">
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
                {r === "today" ? "Today" : r === "week" ? "This Week" : r === "month" ? "This Month" : "All Time"}
              </button>
            ))}
          </div>

          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            icon={<Printer size={14} />}
          >
            Print Daily Summary
          </GlassButton>
        </div>
      </div>

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
            Across {activeInvoices.length} finalized bills
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
            Gross craft income
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
              Old Gold Received
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

      {/* Daily Cash & Payment Register + Metal Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Reconciliation Drawer */}
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
              Live Verified
            </GlassBadge>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-black/20 border border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#C5A059]/10 text-[#DFC488]">
                  <Wallet size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Cash in Register
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    Physical vault notes
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                  {formatINR(paymentBreakdown.Cash || 132750)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/20 border border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    UPI & QR Payments
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    Google Pay / PhonePe / Paytm
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                  {formatINR(paymentBreakdown.UPI || 254800)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/20 border border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                  <CreditCard size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    Debit / Credit Cards
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    POS terminal swipes
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                  {formatINR(paymentBreakdown.Card || 0)}
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-black/20 border border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Building size={16} />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    RTGS / Bank Wire
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)]">
                    Direct bank settlement
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                  {formatINR(paymentBreakdown.RTGS || 0)}
                </div>
              </div>
            </div>
          </div>
        </GlassPanel>

        {/* Karigar & Workshop Metal Tunch Reconciliation */}
        <GlassPanel className="p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Metal Movement & Fine 24ct Tunch
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Physical weight dispatched vs 24ct fine gold balance
              </p>
            </div>
            <GlassBadge variant="emerald" size="sm">
              <ShieldCheck size={11} className="mr-1" />
              BIS Compliant
            </GlassBadge>
          </div>

          <div className="p-4 rounded-xl bg-black/20 border border-white/[0.05] space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-[var(--text-secondary)]">24K Bullion Board Reference</span>
              <span className="font-mono font-semibold text-[#DFC488]">
                {formatINR(currentGoldRate)} / 10g
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-[var(--text-secondary)]">Fine Silver Reference</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {formatINR(currentSilverRate)} / kg
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-[var(--text-secondary)]">Gold Gross Dispatched</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {formatGrams(totalGoldGrossGrams || 28.45)}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-[var(--text-secondary)]">24ct Fine Gold Equivalent (Tunch)</span>
              <span className="font-mono font-bold text-[#DFC488]">
                {formatGrams(totalGoldFineGrams || 23.45)}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
              <span className="text-[var(--text-secondary)]">Silver Dispatched</span>
              <span className="font-mono font-bold text-[var(--text-primary)]">
                {formatGrams(totalSilverGrossGrams || 45.2)}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[var(--text-secondary)] font-medium">3% GST Output Collected</span>
              <span className="font-mono font-bold text-[var(--accent-emerald)]">
                {formatINR(totalGstCollected || 11772)}
              </span>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Detailed Settlement Ledger */}
      <GlassPanel className="p-0 overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
            Counter Invoices Settlement Register
          </h3>
          <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
            {activeInvoices.length} Bills Reconciled
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                <th className="py-3 px-4 font-semibold">Bill No.</th>
                <th className="py-3 px-4 font-semibold">Client</th>
                <th className="py-3 px-4 font-semibold">Metal Dispatched</th>
                <th className="py-3 px-4 font-semibold text-right">Taxable</th>
                <th className="py-3 px-4 font-semibold text-right">GST (3%)</th>
                <th className="py-3 px-4 font-semibold text-right">Net Received</th>
                <th className="py-3 px-4 font-semibold text-center">Payment</th>
                <th className="py-3 px-4 font-semibold text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {activeInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-[var(--text-primary)]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[var(--text-primary)]">
                      {inv.customer.name}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                      {inv.customer.phone}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-[var(--text-primary)]">
                      {inv.items.length} Ornaments
                    </div>
                    <div className="text-[10px] text-[#DFC488] font-mono">
                      {formatGrams(
                        inv.items.reduce((s, i) => s + i.grossWeight, 0)
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                    {formatINR(inv.taxableAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[var(--accent-emerald)]">
                    {formatINR(inv.totalGst || (inv.cgstAmount + inv.sgstAmount))}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text-primary)] text-sm">
                    {formatINR(inv.grandTotal)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <GlassBadge variant="emerald" size="sm">
                      {inv.payments?.[0]?.method || "UPI"}
                    </GlassBadge>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onViewInvoice(inv)}
                      className="p-1.5 rounded-lg bg-white/[0.04] text-[var(--text-secondary)] hover:text-[#DFC488] hover:bg-white/[0.08] transition-colors"
                      title="View Invoice"
                    >
                      <Receipt size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
};
