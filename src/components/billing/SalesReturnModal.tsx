"use client";

import React, { useState, useEffect } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import {
  FinalizedInvoice,
  SalesReturnItem,
  SalesReturnRecord,
  RestockDestination,
} from "../../modules/invoicing/types";
import {
  getSavedInvoices,
  processSalesReturn,
} from "../../modules/invoicing/store";
import { useAuth } from "../../modules/auth/AuthContext";
import { formatINR } from "../../lib/formatters";
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Printer,
  Sparkles,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReturnProcessed?: (record: SalesReturnRecord) => void;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  onReturnProcessed,
}) => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<FinalizedInvoice[]>([]);
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<FinalizedInvoice | null>(null);

  // Return item selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Record<string, boolean>>({});
  const [itemDestinations, setItemDestinations] = useState<Record<string, RestockDestination>>({});
  const [itemReasons, setItemReasons] = useState<Record<string, string>>({});
  const [refundMethod, setRefundMethod] = useState<"Cash" | "UPI" | "Bank Transfer" | "Credit Note">("Credit Note");
  const [returnNotes, setReturnNotes] = useState("");

  const [createdReturnRecord, setCreatedReturnRecord] = useState<SalesReturnRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const list = getSavedInvoices(user?.businessId);
      setInvoices(list);
      setSelectedInvoice(null);
      setSelectedItemIds({});
      setItemDestinations({});
      setItemReasons({});
      setCreatedReturnRecord(null);
      setErrorMsg(null);
    }
  }, [isOpen, user?.businessId]);

  if (!isOpen) return null;

  const handleSearchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const query = searchInvoiceNumber.trim().toUpperCase();
    if (!query) return;

    const found = invoices.find(
      (inv) => inv.invoiceNumber.toUpperCase() === query || inv.id === query
    );

    if (found) {
      setSelectedInvoice(found);
      // Reset items selection
      const initialSelected: Record<string, boolean> = {};
      const initialDest: Record<string, RestockDestination> = {};
      const initialReasons: Record<string, string> = {};
      found.items.forEach((item) => {
        initialSelected[item.id] = false;
        initialDest[item.id] = "showcase";
        initialReasons[item.id] = "Customer return";
      });
      setSelectedItemIds(initialSelected);
      setItemDestinations(initialDest);
      setItemReasons(initialReasons);
    } else {
      setErrorMsg(`No finalized tax invoice found matching "${query}".`);
    }
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItemIds((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleDestinationChange = (itemId: string, dest: RestockDestination) => {
    setItemDestinations((prev) => ({
      ...prev,
      [itemId]: dest,
    }));
  };

  const handleReasonChange = (itemId: string, reason: string) => {
    setItemReasons((prev) => ({
      ...prev,
      [itemId]: reason,
    }));
  };

  // Compute total refund amount
  const selectedItems = selectedInvoice
    ? selectedInvoice.items.filter((item) => selectedItemIds[item.id])
    : [];

  const totalRefundAmount = selectedItems.reduce(
    (sum, item) => sum + (item.totalBeforeTax || item.metalValue + item.makingCharges),
    0
  );

  const handleSubmitReturn = () => {
    if (!selectedInvoice || selectedItems.length === 0) {
      setErrorMsg("Please select at least one item from the invoice to return.");
      return;
    }

    const returnItems: SalesReturnItem[] = selectedItems.map((item) => ({
      invoiceItemId: item.id,
      stockItemId: item.stockItemId,
      barcode: item.barcode,
      sku: item.sku,
      name: item.name,
      metal: item.metal,
      purity: String(item.purity),
      grossWeight: item.grossWeight,
      netWeight: item.netWeight,
      refundRatePerGram: item.effectiveRatePerGram,
      returnedAmount: item.totalBeforeTax || item.metalValue + item.makingCharges,
      restockDestination: itemDestinations[item.id] || "showcase",
      reason: itemReasons[item.id] || "Customer return",
    }));

    const operator = {
      id: user?.id || "operator",
      fullName: user?.fullName || "Cashier",
      role: user?.role || "SALESPERSON",
    };

    const res = processSalesReturn(
      {
        originalInvoiceNumber: selectedInvoice.invoiceNumber,
        returnedItems: returnItems,
        totalRefundAmount,
        refundMethod,
        notes: returnNotes,
      },
      operator,
      user?.businessId
    );

    setCreatedReturnRecord(res.returnRecord);
    if (onReturnProcessed) {
      onReturnProcessed(res.returnRecord);
    }
  };

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Sales Return & Credit Note Generation (DEF-019)"
      description="Look up past retail bills, process item returns, select restock destination (Showcase vs Repair vs Scrap), and issue Credit Notes."
      maxWidth="xl"
    >
      <div className="space-y-4">
        {/* Step 1: Invoice Lookup */}
        {!createdReturnRecord && (
          <>
            <form onSubmit={handleSearchInvoice} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Enter Tax Invoice Number (e.g. INV-2026-001)..."
                  value={searchInvoiceNumber}
                  onChange={(e) => setSearchInvoiceNumber(e.target.value)}
                  className="w-full bg-black/60 border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]"
                />
                <Search size={15} className="absolute right-3.5 top-3 text-[var(--text-tertiary)]" />
              </div>
              <GlassButton variant="primary" size="md" type="submit">
                Find Bill
              </GlassButton>
            </form>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Invoice Selector Chips */}
            {!selectedInvoice && invoices.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] text-[var(--text-tertiary)] font-medium">
                  Recent Invoices Available for Return:
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {invoices.slice(0, 8).map((inv) => (
                    <button
                      key={inv.id}
                      type="button"
                      onClick={() => {
                        setSearchInvoiceNumber(inv.invoiceNumber);
                        setSelectedInvoice(inv);
                        const initialSelected: Record<string, boolean> = {};
                        const initialDest: Record<string, RestockDestination> = {};
                        const initialReasons: Record<string, string> = {};
                        inv.items.forEach((item) => {
                          initialSelected[item.id] = false;
                          initialDest[item.id] = "showcase";
                          initialReasons[item.id] = "Customer return";
                        });
                        setSelectedItemIds(initialSelected);
                        setItemDestinations(initialDest);
                        setItemReasons(initialReasons);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono text-[var(--text-secondary)] hover:border-[#C5A059] hover:text-[#DFC488] transition-all"
                    >
                      {inv.invoiceNumber} ({inv.customer.name})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Invoice Details & Item Selection */}
            {selectedInvoice && (
              <div className="space-y-4 pt-2 border-t border-white/[0.08]">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      Invoice #{selectedInvoice.invoiceNumber}
                    </div>
                    <div className="text-[11px] text-[var(--text-tertiary)]">
                      Customer: {selectedInvoice.customer.name} · {selectedInvoice.customer.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-[#DFC488]">
                      {formatINR(selectedInvoice.grandTotal)}
                    </div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">
                      Date: {new Date(selectedInvoice.createdAt || selectedInvoice.invoiceDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Items to Return List */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-[var(--text-secondary)]">
                    Select Pieces Being Returned:
                  </div>

                  <div className="border border-white/[0.08] rounded-xl overflow-hidden divide-y divide-white/[0.04]">
                    {selectedInvoice.items.map((item) => {
                      const isSelected = selectedItemIds[item.id] || false;
                      const itemVal = item.totalBeforeTax || item.metalValue + item.makingCharges;

                      return (
                        <div
                          key={item.id}
                          className={`p-3 space-y-2 transition-all ${
                            isSelected ? "bg-[#C5A059]/10" : "hover:bg-white/[0.02]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleItemSelection(item.id)}
                                className="w-4 h-4 rounded border-white/20 text-[#C5A059] focus:ring-[#C5A059]"
                              />
                              <div>
                                <div className="text-xs font-semibold text-[var(--text-primary)]">
                                  {item.name}
                                </div>
                                <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
                                  {item.purityDisplay || item.purity} · Gross: {item.grossWeight.toFixed(3)}g · Net: {item.netWeight.toFixed(3)}g
                                </div>
                              </div>
                            </label>

                            <div className="text-right font-mono text-xs font-bold text-[var(--text-primary)]">
                              {formatINR(itemVal)}
                            </div>
                          </div>

                          {isSelected && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-white/[0.06] pl-6">
                              <div>
                                <label className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] block mb-1">
                                  Restock Destination
                                </label>
                                <select
                                  value={itemDestinations[item.id] || "showcase"}
                                  onChange={(e) =>
                                    handleDestinationChange(item.id, e.target.value as RestockDestination)
                                  }
                                  className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                                >
                                  <option value="showcase">Showcase Tray (Resellable)</option>
                                  <option value="repair_vault">Repair Workshop Safe (Needs Fix/Polish)</option>
                                  <option value="melting_scrap">Vault Scrap Box (Melt & Refine)</option>
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)] block mb-1">
                                  Return Reason
                                </label>
                                <input
                                  type="text"
                                  value={itemReasons[item.id] || ""}
                                  onChange={(e) => handleReasonChange(item.id, e.target.value)}
                                  placeholder="e.g. Size mismatch / Defective clasp"
                                  className="w-full bg-black/60 border border-white/[0.1] rounded-lg px-2.5 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Refund Method & Payout Summary */}
                {selectedItems.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[var(--text-secondary)]">
                        Total Refundable Value ({selectedItems.length} items):
                      </span>
                      <span className="text-sm font-bold font-mono text-[#DFC488]">
                        {formatINR(totalRefundAmount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
                      <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                          Refund Payout Method
                        </label>
                        <select
                          value={refundMethod}
                          onChange={(e) =>
                            setRefundMethod(e.target.value as "Cash" | "UPI" | "Bank Transfer" | "Credit Note")
                          }
                          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                        >
                          <option value="Credit Note">Sarafa Credit Note (Store Credit Voucher)</option>
                          <option value="Cash">Cash Drawer Payout (रोकड़ वापसी)</option>
                          <option value="UPI">UPI Digital Refund</option>
                          <option value="Bank Transfer">Bank RTGS/NEFT Transfer</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                          Voucher Remarks / Notes
                        </label>
                        <input
                          type="text"
                          value={returnNotes}
                          onChange={(e) => setReturnNotes(e.target.value)}
                          placeholder="e.g. Approved by Owner Harshit Raj"
                          className="w-full bg-white/[0.04] border border-white/[0.1] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <GlassButton variant="secondary" size="sm" onClick={() => setSelectedInvoice(null)}>
                        Cancel
                      </GlassButton>
                      <GlassButton variant="primary" size="sm" onClick={handleSubmitReturn}>
                        Issue Credit Note & Restock
                      </GlassButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 3: Success Voucher & Print Slip */}
        {createdReturnRecord && (
          <div className="space-y-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center animate-in fade-in">
            <CheckCircle2 size={36} className="text-emerald-400 mx-auto" />
            <div>
              <h3 className="text-base font-semibold text-emerald-400">
                Credit Note Issued Successfully!
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Voucher <strong className="font-mono text-[#DFC488]">{createdReturnRecord.creditNoteNumber}</strong> generated against Invoice #{createdReturnRecord.originalInvoiceNumber}.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-black/60 border border-white/[0.08] text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                <span className="text-[var(--text-tertiary)]">Credit Note #:</span>
                <span className="text-[#DFC488] font-bold">{createdReturnRecord.creditNoteNumber}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                <span className="text-[var(--text-tertiary)]">Customer:</span>
                <span className="text-[var(--text-primary)]">{createdReturnRecord.customer.name}</span>
              </div>
              <div className="flex justify-between border-b border-white/[0.06] pb-1.5">
                <span className="text-[var(--text-tertiary)]">Refund Method:</span>
                <span className="text-[var(--text-primary)]">{createdReturnRecord.refundMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-tertiary)]">Total Refund Amount:</span>
                <span className="text-emerald-400 font-bold">{formatINR(createdReturnRecord.totalRefundAmount)}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-2">
              <GlassButton variant="secondary" size="sm" onClick={() => window.print()}>
                <Printer size={14} className="mr-1.5" /> Print Credit Note
              </GlassButton>
              <GlassButton variant="primary" size="sm" onClick={onClose}>
                Done & Return to POS
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    </GlassDialog>
  );
};
