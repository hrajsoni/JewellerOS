"use client";

import React, { useState } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { formatINR, formatGrams } from "../../lib/formatters";
import { Printer, MapPin, Phone, MessageCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { FinalizedInvoice } from "../../modules/invoicing/types";

export interface TaxInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData?: FinalizedInvoice;
}

export const TaxInvoiceModal: React.FC<TaxInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
}) => {
  const [printLayout, setPrintLayout] = useState<"a4" | "thermal">("a4");

  if (!invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const shop = invoiceData.shopSnapshot || {
    name: "Sandhya Jewellers",
    address: "142 Sarafa Bazar, M.I. Road, Jaipur, RJ 302001",
    phone: "+91 94140 12345",
    gstin: "08AAAAJ1234F1Z8",
  };

  const handleShareWhatsApp = () => {
    const cleanPhone = invoiceData.customer.phone.replace(/[^0-9]/g, "");
    const itemsText = invoiceData.items
      .map(
        (item, idx) =>
          `${idx + 1}. *${item.name}*\n   Weight: ${formatGrams(item.grossWeight)} (${item.purityDisplay || item.purity})\n   Making: +${formatINR(item.makingCharges)} | Subtotal: ${formatINR(item.totalBeforeTax)}`
      )
      .join("\n\n");

    const ogText =
      invoiceData.oldGoldExchange && invoiceData.oldGoldExchange.length > 0
        ? `\n\n*OLD GOLD EXCHANGE:* \n` +
          invoiceData.oldGoldExchange
            .map(
              (og) =>
                `• ${og.description} (${formatGrams(og.netWeight)} @ ${og.assessedPurityPercentage}% touch): -${formatINR(og.totalExchangeCredit)}`
            )
            .join("\n") +
          `\nTotal Exchange Credit: -${formatINR(invoiceData.oldGoldTotalCredit)}`
        : "";

    const paymentsText = invoiceData.payments
      .map(
        (p) =>
          `• ${p.method}${p.transactionRef ? ` (${p.transactionRef})` : ""}: ${formatINR(p.amount)}`
      )
      .join("\n");

    const message =
      `*TAX INVOICE · ${shop.name.toUpperCase()}*\n` +
      `Invoice: *${invoiceData.invoiceNumber}* | Date: ${invoiceData.invoiceDate}\n` +
      `Customer: *${invoiceData.customer.name}* (${invoiceData.customer.phone})\n` +
      `--------------------------------\n` +
      `*PURCHASED ORNAMENTS:*\n` +
      `${itemsText}` +
      `${ogText}\n` +
      `--------------------------------\n` +
      `Items Subtotal: ${formatINR(invoiceData.itemsSubtotal)}\n` +
      (invoiceData.discountTotal > 0 ? `Concession: -${formatINR(invoiceData.discountTotal)}\n` : "") +
      (invoiceData.gstPercentage > 0 ? `GST (3%): +${formatINR(invoiceData.totalGst)}\n` : "") +
      `*GRAND TOTAL: ${formatINR(invoiceData.grandTotal)}*\n` +
      `--------------------------------\n` +
      `*PAYMENT DETAILS:*\n` +
      `${paymentsText}\n` +
      `Total Paid: ${formatINR(invoiceData.totalPaid)}\n` +
      (invoiceData.balanceDue > 0
        ? `*Balance Due: ${formatINR(invoiceData.balanceDue)}*\n`
        : `*Status: FULLY PAID (चुक्ता)*\n`) +
      `--------------------------------\n` +
      `*${shop.name}*\n` +
      `${shop.address}\n` +
      `Phone: ${shop.phone} · GSTIN: ${shop.gstin}\n` +
      `_Govt Approved BIS Hallmarked Jewellery_`;

    const target = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone || "";
    const url = target
      ? `https://wa.me/${target}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Official GST Tax Invoice Preview"
      description="Immutable transaction snapshot · Ready for A4 or thermal receipt print"
      maxWidth="xl"
    >
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.08] no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-secondary)]">Layout:</span>
          <button
            onClick={() => setPrintLayout("a4")}
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              printLayout === "a4"
                ? "bg-[#C5A059] text-[#08090C]"
                : "bg-white/[0.04] text-[var(--text-secondary)]"
            }`}
          >
            A4 Standard
          </button>
          <button
            onClick={() => setPrintLayout("thermal")}
            className={`px-3 py-1 rounded-md text-xs font-semibold ${
              printLayout === "thermal"
                ? "bg-[#C5A059] text-[#08090C]"
                : "bg-white/[0.04] text-[var(--text-secondary)]"
            }`}
          >
            Thermal Slip (3-inch)
          </button>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={handleShareWhatsApp}
            icon={<MessageCircle size={15} className="text-[#25D366]" />}
            className="text-[#25D366] hover:bg-[#25D366]/10 font-semibold text-xs"
          >
            Share on WhatsApp
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handlePrint}
            icon={<Printer size={15} />}
          >
            Print Invoice
          </GlassButton>
        </div>
      </div>

      {/* Invoice Document Body - Crisp Clean Print Format */}
      <div
        id="printable-invoice"
        className={`bg-white text-[#1C1B18] p-6 sm:p-8 rounded-xl shadow-lg font-sans border border-[#E5E0D5] print:p-0 print:border-none print:shadow-none ${
          printLayout === "thermal" ? "max-w-[360px] mx-auto text-xs" : "w-full"
        }`}
      >
        {/* Shop Header */}
        <div className="flex justify-between items-start border-b-2 border-[#1C1B18] pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[#1C1B18] uppercase">
              {shop.name}
            </h1>
            <p className="text-xs font-semibold text-[#8C6A22] mt-0.5">
              Govt. Approved BIS Hallmarked Jewellery & Bullion
            </p>
            <div className="text-[11px] text-[#555] mt-1 space-y-0.5">
              <div className="flex items-center gap-1">
                <MapPin size={11} /> {shop.address}
              </div>
              <div className="flex items-center gap-1">
                <Phone size={11} /> Phone: {shop.phone} · GSTIN: {shop.gstin}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-block px-2.5 py-1 bg-[#1C1B18] text-[#FAF7F2] font-black text-xs uppercase tracking-wider rounded">
              TAX INVOICE
            </span>
            <div className="text-xs font-mono font-bold text-[#1C1B18] mt-2">
              {invoiceData.invoiceNumber}
            </div>
            <div className="text-[11px] text-[#666] mt-0.5">
              Date: {invoiceData.invoiceDate}
            </div>
          </div>
        </div>

        {/* Customer & Bill Details */}
        <div className="grid grid-cols-2 gap-4 text-xs mb-5 bg-[#F9F8F6] p-3 rounded-lg border border-[#EDE8DE]">
          <div>
            <span className="font-bold text-[#8C6A22] uppercase tracking-wider text-[10px]">
              Billed To:
            </span>
            <div className="font-bold text-[#1C1B18] text-sm mt-0.5">
              {invoiceData.customer.name}
            </div>
            <div className="text-[#666]">{invoiceData.customer.phone}</div>
            <div className="text-[10px] text-[#888]">
              {invoiceData.customer.city} · {invoiceData.customer.gstin}
            </div>
          </div>
          <div className="text-right">
            <span className="font-bold text-[#8C6A22] uppercase tracking-wider text-[10px]">
              Payment Status:
            </span>
            <div className="font-bold text-emerald-800 text-sm mt-0.5 uppercase">
              {invoiceData.status === "paid" ? "PAID FULL" : "PARTIAL / PENDING"}
            </div>
            <div className="text-[#666]">
              {invoiceData.payments.map((p) => `${p.method}: ${formatINR(p.amount)}`).join(", ")}
            </div>
            <div className="text-[10px] text-[#888]">Rate Locked at Billing Counter</div>
          </div>
        </div>

        {/* Items Table */}
        <table className="w-full text-left text-xs mb-5 border-collapse">
          <thead>
            <tr className="border-b-2 border-[#1C1B18] text-[11px] uppercase tracking-wider font-bold text-[#1C1B18]">
              <th className="py-2">Item Description</th>
              <th className="py-2 text-center">Purity</th>
              <th className="py-2 text-right">Net Wt</th>
              <th className="py-2 text-right">Metal Rate</th>
              <th className="py-2 text-right">Making</th>
              <th className="py-2 text-right">Amount (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE8DE]">
            {invoiceData.items.map((item) => (
              <tr key={item.id} className="py-2">
                <td className="py-2.5 font-medium">
                  <div>{item.name}</div>
                  <div className="text-[10px] text-[#777]">
                    Gross: {formatGrams(item.grossWeight)} · HSN: 7113
                  </div>
                </td>
                <td className="py-2.5 text-center font-bold text-[#8C6A22]">
                  {item.purityDisplay || item.purity}
                </td>
                <td className="py-2.5 text-right font-mono font-semibold">
                  {formatGrams(item.netWeight)}
                </td>
                <td className="py-2.5 text-right font-mono">
                  {formatINR(item.effectiveRatePerGram)}/g
                </td>
                <td className="py-2.5 text-right font-mono">
                  +{formatINR(item.makingCharges)}
                </td>
                <td className="py-2.5 text-right font-mono font-bold text-[#1C1B18]">
                  {formatINR(item.totalBeforeTax)}
                </td>
              </tr>
            ))}

            {/* Old Gold Deductions */}
            {invoiceData.oldGoldExchange && invoiceData.oldGoldExchange.map((og) => (
              <tr key={og.id} className="py-2 text-emerald-800 bg-emerald-50/40">
                <td className="py-2 font-medium">
                  <div>Old Gold Exchange: {og.description}</div>
                  <div className="text-[10px] text-emerald-600">
                    Gross: {formatGrams(og.grossWeight)} · Touch: {og.assessedPurityPercentage}%
                  </div>
                </td>
                <td className="py-2 text-center font-semibold text-emerald-700">Exchange</td>
                <td className="py-2 text-right font-mono">{formatGrams(og.netWeight)}</td>
                <td className="py-2 text-right font-mono">24ct Basis</td>
                <td className="py-2 text-right font-mono">—</td>
                <td className="py-2 text-right font-mono font-bold">
                  −{formatINR(og.totalExchangeCredit)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Dedicated Old Gold Exchange Voucher (if applicable) */}
        {invoiceData.oldGoldExchange && invoiceData.oldGoldExchange.length > 0 && (
          <div className="mb-5 p-3.5 rounded-lg bg-[#F3F8F5] border border-[#CDE3D5] text-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-[#CDE3D5]">
              <span className="font-bold text-[#1E5631] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck size={14} /> Old Gold Exchange Voucher (पुराने आभूषण विनिमय वाउचर)
              </span>
              <span className="text-[10px] text-[#2D6A4F] font-medium">
                Adjusted against Invoice #{invoiceData.invoiceNumber}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="text-[#2D6A4F] border-b border-[#D8EADB]">
                    <th className="py-1">Scrap Description</th>
                    <th className="py-1 text-right">Gross Wt</th>
                    <th className="py-1 text-right">Deduction</th>
                    <th className="py-1 text-right">Net Wt</th>
                    <th className="py-1 text-center">Touch %</th>
                    <th className="py-1 text-right">Fine (24ct)</th>
                    <th className="py-1 text-right">Credit Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EFE5]">
                  {invoiceData.oldGoldExchange.map((og) => (
                    <tr key={og.id}>
                      <td className="py-1.5 font-medium text-[#1E5631]">{og.description}</td>
                      <td className="py-1.5 text-right font-mono">{formatGrams(og.grossWeight)}</td>
                      <td className="py-1.5 text-right font-mono text-[#888]">−{formatGrams(og.stoneDeduction)}</td>
                      <td className="py-1.5 text-right font-mono font-medium">{formatGrams(og.netWeight)}</td>
                      <td className="py-1.5 text-center font-bold text-[#2D6A4F]">{og.assessedPurityPercentage}%</td>
                      <td className="py-1.5 text-right font-mono font-semibold">{formatGrams(og.fineWeight)}</td>
                      <td className="py-1.5 text-right font-mono font-bold text-[#1E5631]">−{formatINR(og.totalExchangeCredit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-right pt-1 font-bold text-xs text-[#1E5631]">
              Total Exchange Credit Allowed: −{formatINR(invoiceData.oldGoldTotalCredit)}
            </div>
          </div>
        )}

        {/* Totals & Payments Dual Columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t-2 border-[#1C1B18]">
          {/* Left: Payments Received Breakdown */}
          <div className="p-3 rounded-lg bg-[#F9F8F6] border border-[#EDE8DE] text-xs space-y-2">
            <span className="font-bold text-[#8C6A22] uppercase tracking-wider text-[10px] block">
              Settlement & Payment Details:
            </span>
            <div className="space-y-1.5 text-xs">
              {invoiceData.payments && invoiceData.payments.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-[#444]">
                  <span>
                    <span className="font-semibold text-[#1C1B18]">{p.method}</span>
                    {p.transactionRef && (
                      <span className="text-[10px] text-[#777] ml-1">({p.transactionRef})</span>
                    )}
                  </span>
                  <span className="font-mono font-medium text-[#1C1B18]">
                    {formatINR(p.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#DDD] space-y-1">
              <div className="flex justify-between text-xs font-semibold text-[#1C1B18]">
                <span>Total Received:</span>
                <span className="font-mono">{formatINR(invoiceData.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold">
                <span>Balance Remaining:</span>
                <span className={`font-mono ${invoiceData.balanceDue > 0 ? "text-amber-800" : "text-emerald-800"}`}>
                  {invoiceData.balanceDue > 0 ? formatINR(invoiceData.balanceDue) : "₹0 (Fully Paid)"}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Financial Totals Summary */}
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-[#555]">
              <span>Items Total:</span>
              <span>{formatINR(invoiceData.itemsSubtotal)}</span>
            </div>

            {invoiceData.oldGoldTotalCredit > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Old Gold Credit:</span>
                <span>−{formatINR(invoiceData.oldGoldTotalCredit)}</span>
              </div>
            )}

            {invoiceData.discountTotal > 0 && (
              <div className="flex justify-between text-emerald-800">
                <span>Concession:</span>
                <span>−{formatINR(invoiceData.discountTotal)}</span>
              </div>
            )}

            {invoiceData.gstPercentage > 0 && (
              <>
                <div className="flex justify-between text-[#555]">
                  <span>CGST (1.5%):</span>
                  <span>{formatINR(invoiceData.cgstAmount, { decimals: 2 })}</span>
                </div>
                <div className="flex justify-between text-[#555]">
                  <span>SGST (1.5%):</span>
                  <span>{formatINR(invoiceData.sgstAmount, { decimals: 2 })}</span>
                </div>
              </>
            )}

            <div className="flex justify-between text-base font-black text-[#1C1B18] pt-2 border-t border-[#1C1B18]">
              <span>Grand Total:</span>
              <span>{formatINR(invoiceData.grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Declarations & Terms */}
        <div className="mt-8 pt-4 border-t border-[#DDD] text-[10px] text-[#666] space-y-1">
          <p className="font-semibold text-[#1C1B18]">Terms & Declaration:</p>
          <p>
            1. All gold jewellery items are sold with official BIS Hallmark certification
            guaranteeing standard purity.
          </p>
          <p>
            2. Customer has inspected ornaments, weights, stones, and purity at
            the electronic scale before payment.
          </p>
          <div className="flex justify-between items-end pt-6">
            <div>
              <p className="font-bold text-[#1C1B18]">Thank you for your patronage!</p>
              <p className="text-[9px] text-[#777]">
                JewelleryOS v2.0 Verified Digital System · Built by Harshit Raj
              </p>
            </div>
            <div className="text-right">
              <div className="h-8 border-b border-[#888] w-36 mb-1" />
              <p className="font-bold text-[#1C1B18]">Authorized Signatory</p>
            </div>
          </div>
        </div>
      </div>
    </GlassDialog>
  );
};
