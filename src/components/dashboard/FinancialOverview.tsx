"use client";

import React from "react";
import { GlassStatCard } from "../glass/GlassStatCard";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassButton } from "../glass/GlassButton";
import {
  TrendingUp,
  Receipt,
  Coins,
  Scale,
  Printer,
  Eye,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import { FinalizedInvoice } from "../../modules/invoicing/types";
import { formatINR, formatGrams } from "../../lib/formatters";

export interface InvoiceSummary {
  id: string;
  invoiceNumber: string;
  customerName: string;
  metal: string;
  weightGrams: number;
  totalAmount: number;
  paymentMethod: string;
  status: "finalized" | "draft" | "partial";
  time: string;
  rawInvoice?: FinalizedInvoice;
}

const SAMPLE_INVOICES: InvoiceSummary[] = [
  {
    id: "inv-1",
    invoiceNumber: "INV-2026-0842",
    customerName: "Rameshwar Sharma",
    metal: "18K Gold Chain",
    weightGrams: 10.0,
    totalAmount: 132750,
    paymentMethod: "UPI + Cash",
    status: "finalized",
    time: "14:25 PM",
  },
  {
    id: "inv-2",
    invoiceNumber: "INV-2026-0841",
    customerName: "Pooja Verma",
    metal: "22K Gold Bangle",
    weightGrams: 18.45,
    totalAmount: 254800,
    paymentMethod: "Card",
    status: "finalized",
    time: "12:10 PM",
  },
  {
    id: "inv-3",
    invoiceNumber: "INV-2026-0840",
    customerName: "Walk-in Customer",
    metal: "925 Silver Anklet",
    weightGrams: 45.2,
    totalAmount: 4850,
    paymentMethod: "Cash",
    status: "finalized",
    time: "11:05 AM",
  },
];

export interface FinancialOverviewProps {
  onSelectCalculator?: () => void;
  onOpenInvoice?: () => void;
  invoices?: FinalizedInvoice[];
  onViewInvoice?: (invoice: FinalizedInvoice) => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  onSelectCalculator,
  onOpenInvoice,
  invoices,
  onViewInvoice,
}) => {
  const displayInvoices: InvoiceSummary[] = React.useMemo(() => {
    if (invoices && invoices.length > 0) {
      return invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer.name,
        metal: `${inv.items[0]?.purity || "18K"} ${inv.items[0]?.name || "Ornament"}`,
        weightGrams: inv.items.reduce((s, i) => s + i.grossWeight, 0),
        totalAmount: inv.grandTotal,
        paymentMethod: inv.payments?.[0]?.method || "UPI",
        status: "finalized",
        time: inv.invoiceDate
          ? new Date(inv.invoiceDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : "12:00 PM",
        rawInvoice: inv,
      }));
    }
    return SAMPLE_INVOICES;
  }, [invoices]);

  const totalSales = invoices && invoices.length > 0
    ? invoices.reduce((s, inv) => s + inv.grandTotal, 0)
    : 392400;

  const grossProfit = invoices && invoices.length > 0
    ? invoices.flatMap((inv) => inv.items).reduce((s, i) => s + i.makingCharges, 0)
    : 58650;

  const goldDispatched = invoices && invoices.length > 0
    ? invoices.flatMap((inv) => inv.items.filter((i) => i.metal === "gold")).reduce((s, i) => s + i.grossWeight, 0)
    : 28.45;

  const billsCount = invoices && invoices.length > 0 ? invoices.length : 3;

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Top Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassStatCard
          label="Today's Total Sales"
          value={formatINR(totalSales)}
          subtitle="Real counter turnover"
          change={{ value: "26.5%", isPositive: true }}
          variant="gold"
          icon={<TrendingUp size={18} className="text-[#DFC38A]" />}
        />
        <GlassStatCard
          label="Gross Making Profit"
          value={formatINR(grossProfit)}
          subtitle="Craftsmanship income"
          change={{ value: "12.4%", isPositive: true }}
          variant="emerald"
          icon={<Receipt size={18} className="text-[var(--accent-emerald)]" />}
        />
        <GlassStatCard
          label="Gold Dispatched"
          value={formatGrams(goldDispatched)}
          subtitle="Net metal sold today"
          icon={<Coins size={18} className="text-[#DFC38A]" />}
        />
        <GlassStatCard
          label="Bills Finalized"
          value={`${billsCount} Invoices`}
          subtitle="100% payments settled"
          icon={<Scale size={18} />}
        />
      </div>

      {/* Two columns: Recent Invoices & Counter Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Invoices Table (8 cols) */}
        <div className="lg:col-span-8">
          <GlassPanel className="p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Today&apos;s Finalized Counter Invoices
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Immutable tax snapshots with locked metal rates
                </p>
              </div>
              <GlassButton
                variant="gold-outline"
                size="sm"
                onClick={onOpenInvoice}
                icon={<ArrowUpRight size={14} />}
              >
                Create Bill
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
                  {displayInvoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3.5 font-mono text-[var(--text-primary)] font-semibold">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5">
                        <div className="font-medium text-[var(--text-primary)]">
                          {inv.customerName}
                        </div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">
                          {inv.time} · {inv.paymentMethod}
                        </div>
                      </td>
                      <td className="py-3.5">
                        <div className="text-[var(--text-primary)]">{inv.metal}</div>
                        <div className="text-[10px] text-[#DFC38A] num-tabular">
                          {inv.weightGrams.toFixed(3)}g
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-bold text-[var(--text-primary)] num-tabular text-sm">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="py-3.5 text-center">
                        <GlassBadge variant="emerald" size="sm">
                          {inv.status}
                        </GlassBadge>
                      </td>
                      <td className="py-3.5 text-right">
                        <button
                          onClick={() => {
                            if (inv.rawInvoice && onViewInvoice) {
                              onViewInvoice(inv.rawInvoice);
                            } else {
                              window.print();
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
                </tbody>
              </table>
            </div>
          </GlassPanel>
        </div>

        {/* Counter Alerts & Quick Launch (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Counter Action Card */}
          <GlassPanel
            variant="gold"
            className="p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#DFC38A] mb-2">
                <Coins size={16} /> Instant Counter Mode
              </div>
              <h4 className="text-base font-bold text-[var(--text-primary)]">
                ₹1,50,000 / 10g Gold Board
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                Counter pricing formula locked: 10g 18K with 18% making results in exactly{" "}
                <span className="text-[#DFC38A] font-semibold">₹1,32,750</span>.
              </p>
            </div>
            <div className="mt-5">
              <GlassButton
                variant="primary"
                size="md"
                className="w-full"
                onClick={onSelectCalculator}
              >
                Launch Counter Calculator
              </GlassButton>
            </div>
          </GlassPanel>

          {/* Shop Notifications / Inventory Attention */}
          <GlassPanel className="p-5 flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]">
              Workshop & Vault Alerts
            </span>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
              <AlertTriangle size={16} className="text-[#C6A15B] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  22K Hallmarked Bangles Low
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Only 2 units remaining in Main Display Tray #3.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
              <Coins size={16} className="text-[var(--accent-emerald)] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  Old Gold Scrap Received
                </div>
                <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  14.200g old ornament melt test pending for workshop delivery.
                </div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
};
