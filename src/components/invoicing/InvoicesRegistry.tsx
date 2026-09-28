"use client";

import React, { useState } from "react";
import { FinalizedInvoice } from "../../modules/invoicing/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  User,
  ArrowUpRight,
  CheckCircle2,
  Coins,
} from "lucide-react";

export interface InvoicesRegistryProps {
  invoices: FinalizedInvoice[];
  onSelectInvoice: (invoice: FinalizedInvoice) => void;
  onCreateNewBill: () => void;
}

export const InvoicesRegistry: React.FC<InvoicesRegistryProps> = ({
  invoices,
  onSelectInvoice,
  onCreateNewBill,
}) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredInvoices = invoices.filter((inv) => {
    const q = searchQuery.toLowerCase();
    return (
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.customer.name.toLowerCase().includes(q) ||
      inv.customer.phone.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Invoice Registry & Counter Bills
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Immutable transaction records with locked gold & silver rate snapshots
          </p>
        </div>
        <GlassButton
          variant="primary"
          size="sm"
          onClick={onCreateNewBill}
          icon={<ArrowUpRight size={14} />}
        >
          New Counter Bill
        </GlassButton>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <GlassInput
          placeholder="Search by Invoice No, Customer, or Phone..."
          prefixSymbol={<Search size={14} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Invoices Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[var(--surface-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-tertiary)] uppercase tracking-wider text-[11px] bg-black/20">
                <th className="py-3 px-4 font-semibold">Bill No.</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Customer</th>
                <th className="py-3 px-4 font-semibold">Items & Net Wt</th>
                <th className="py-3 px-4 font-semibold text-right">Amount (₹)</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)]">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const totalGrams = inv.items.reduce(
                    (acc, item) => acc + item.netWeight,
                    0
                  );
                  return (
                    <tr
                      key={inv.id}
                      className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                      onClick={() => onSelectInvoice(inv)}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-[var(--text-primary)]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                        {inv.invoiceDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[var(--text-primary)]">
                          {inv.customer.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-tertiary)]">
                          {inv.customer.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--text-secondary)]">
                          {inv.items.map((i) => i.name).join(", ")}
                        </div>
                        <div className="text-[11px] text-[#DFC488] font-mono">
                          {formatGrams(totalGrams)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text-primary)] text-sm num-tabular">
                        {formatINR(inv.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/40 text-[var(--accent-emerald)] border border-emerald-500/20 uppercase">
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectInvoice(inv);
                          }}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[#DFC488] hover:bg-white/[0.05] transition-colors"
                          title="Print / View Invoice"
                        >
                          <Printer size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
