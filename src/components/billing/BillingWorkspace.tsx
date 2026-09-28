"use client";

import React, { useState } from "react";
import {
  InvoiceLineItem,
  OldGoldExchangeItem,
  CustomerProfile,
  FinalizedInvoice,
  PaymentMethod,
  PaymentRecord,
} from "../../modules/invoicing/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import {
  Receipt,
  Plus,
  Trash2,
  Printer,
  Coins,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  CreditCard,
  Banknote,
  Smartphone,
  Building,
} from "lucide-react";

export interface BillingWorkspaceProps {
  draftItems: InvoiceLineItem[];
  onRemoveItem: (id: string) => void;
  onNavigateToCalculator: () => void;
  onFinalizeInvoice: (invoice: FinalizedInvoice) => void;
  gold24kRate: number;
  shopDetails: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
  };
  selectedCustomer?: CustomerProfile | null;
}

export const BillingWorkspace: React.FC<BillingWorkspaceProps> = ({
  draftItems,
  onRemoveItem,
  onNavigateToCalculator,
  onFinalizeInvoice,
  gold24kRate,
  shopDetails,
  selectedCustomer,
}) => {
  // Customer details
  const [customerName, setCustomerName] = useState("Rameshwar Sharma");
  const [customerPhone, setCustomerPhone] = useState("+91 98290 12345");
  const [customerCity, setCustomerCity] = useState("Jaipur");
  const [customerGstin, setCustomerGstin] = useState("URP (Retail Consumer)");

  // Sync selected customer from directory
  React.useEffect(() => {
    if (selectedCustomer) {
      if (selectedCustomer.name) setCustomerName(selectedCustomer.name);
      if (selectedCustomer.phone) setCustomerPhone(selectedCustomer.phone);
      if (selectedCustomer.city) setCustomerCity(selectedCustomer.city);
      if (selectedCustomer.gstin) setCustomerGstin(selectedCustomer.gstin);
    }
  }, [selectedCustomer]);

  // Old gold exchange state
  const [showOldGold, setShowOldGold] = useState(false);
  const [oldGoldItems, setOldGoldItems] = useState<OldGoldExchangeItem[]>([]);
  const [ogDescription, setOgDescription] = useState("Old Gold Broken Ring");
  const [ogWeight, setOgWeight] = useState("5.0");
  const [ogDeduction, setOgDeduction] = useState("0.2");
  const [ogPurity, setOgPurity] = useState("85"); // 85% touch/tunch
  const [ogMeltDeduction, setOgMeltDeduction] = useState("2"); // 2% melting loss

  // Concession & Tax
  const [discountTotal, setDiscountTotal] = useState("0");
  const [applyGst, setApplyGst] = useState(false);

  // Payment Recording
  const [primaryPaymentMode, setPrimaryPaymentMode] = useState<PaymentMethod>("UPI");
  const [paymentRef, setPaymentRef] = useState("UPI/GPay 489218");

  // Sum of jewellery items
  const itemsSubtotal = draftItems.reduce((acc, item) => acc + item.totalBeforeTax, 0);

  // Sum of old gold exchange credits
  const oldGoldTotalCredit = oldGoldItems.reduce(
    (acc, og) => acc + og.totalExchangeCredit,
    0
  );

  const discountAmount = parseFloat(discountTotal) || 0;
  const taxableAmount = Math.max(0, itemsSubtotal - oldGoldTotalCredit - discountAmount);

  // 3% GST
  const gstRate = 3;
  const gstAmount = applyGst ? Math.round(taxableAmount * 0.03) : 0;
  const grandTotal = taxableAmount + gstAmount;

  const handleAddOldGold = () => {
    const gross = parseFloat(ogWeight) || 0;
    const stone = parseFloat(ogDeduction) || 0;
    const net = Math.max(0, gross - stone);
    const purityPct = parseFloat(ogPurity) || 0;
    const meltLossPct = parseFloat(ogMeltDeduction) || 0;

    // Net fine weight = net * (purity - meltLoss) / 100
    const effectivePurity = Math.max(0, purityPct - meltLossPct);
    const fineWeight = (net * effectivePurity) / 100;
    const ratePerGram24k = gold24kRate / 10;
    const totalCredit = Math.round(fineWeight * ratePerGram24k);

    const newItem: OldGoldExchangeItem = {
      id: `og-${Date.now()}`,
      description: ogDescription,
      metal: "gold",
      grossWeight: gross,
      stoneDeduction: stone,
      netWeight: net,
      assessedPurityPercentage: purityPct,
      meltDeductionPercentage: meltLossPct,
      fineWeight,
      currentRate24k: gold24kRate,
      totalExchangeCredit: totalCredit,
    };

    setOldGoldItems([...oldGoldItems, newItem]);
    setOgWeight("");
    setOgDeduction("0");
  };

  const handleRemoveOldGold = (id: string) => {
    setOldGoldItems(oldGoldItems.filter((i) => i.id !== id));
  };

  const handleFinalize = () => {
    const invoiceNumber = `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoiceDate = new Date().toISOString().split("T")[0];

    const finalized: FinalizedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceDate,
      createdAt: new Date().toISOString(),
      customer: {
        id: `cust-${Date.now()}`,
        name: customerName,
        phone: customerPhone,
        city: customerCity,
        gstin: customerGstin,
      },
      items: draftItems,
      oldGoldExchange: oldGoldItems,
      itemsSubtotal,
      oldGoldTotalCredit,
      discountTotal: discountAmount,
      taxableAmount,
      gstPercentage: applyGst ? gstRate : 0,
      cgstAmount: gstAmount / 2,
      sgstAmount: gstAmount / 2,
      totalGst: gstAmount,
      roundoff: 0,
      grandTotal,
      payments: [
        {
          method: primaryPaymentMode,
          amount: grandTotal,
          transactionRef: paymentRef,
        },
      ],
      totalPaid: grandTotal,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: shopDetails,
    };

    onFinalizeInvoice(finalized);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Counter Invoice & Billing Workspace
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Multi-item billing, old-gold exchange credits, and print-ready GST invoices
          </p>
        </div>
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={onNavigateToCalculator}
          icon={<Plus size={14} />}
        >
          Add Item from Calculator
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Customer + Cart Items + Old Gold (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Customer Profile */}
          <div className="rounded-xl p-5 sm:p-6 bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block pb-2 border-b border-white/[0.05]">
              Customer Details
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Customer Full Name"
                placeholder="Name or Walk-in"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
              <GlassInput
                label="Mobile Number"
                placeholder="+91..."
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
              <GlassInput
                label="City / Address"
                placeholder="City"
                value={customerCity}
                onChange={(e) => setCustomerCity(e.target.value)}
              />
              <GlassInput
                label="GSTIN / Status"
                placeholder="URP or GSTIN"
                value={customerGstin}
                onChange={(e) => setCustomerGstin(e.target.value)}
              />
            </div>
          </div>

          {/* Card 2: Multi-Item Cart */}
          <div className="rounded-xl p-5 sm:p-6 bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Jewellery Items ({draftItems.length})
              </span>
              <button
                onClick={onNavigateToCalculator}
                className="text-xs text-[#DFC488] hover:underline flex items-center gap-1 font-medium"
              >
                <Plus size={13} /> Add More Items
              </button>
            </div>

            {draftItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-tertiary)] space-y-2">
                <p>No jewellery items currently on this bill.</p>
                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  onClick={onNavigateToCalculator}
                >
                  Calculate & Add Item
                </GlassButton>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] space-y-2">
                {draftItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className="pt-3 first:pt-0 flex items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-[var(--text-primary)] flex items-center gap-2">
                        <span>{item.name}</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.04] text-[#DFC488] border border-white/[0.08] font-mono">
                          {item.purityDisplay}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        Net: {formatGrams(item.netWeight)} · Metal: {formatINR(item.metalValue)} · Making: +{formatINR(item.makingCharges)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-mono font-semibold text-[var(--text-primary)] text-sm num-tabular">
                        {formatINR(item.totalBeforeTax)}
                      </span>
                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--accent-coral)] transition-colors p-1"
                        title="Remove Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 3: Old Gold Exchange Module */}
          <div className="rounded-xl p-5 sm:p-6 bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Coins size={15} className="text-[#DFC488]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  Old Gold Exchange Adjustment
                </span>
              </div>
              <button
                onClick={() => setShowOldGold(!showOldGold)}
                className="text-xs text-[#DFC488] hover:underline"
              >
                {showOldGold ? "Close" : "+ Add Old Gold Credit"}
              </button>
            </div>

            {showOldGold && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <GlassInput
                    label="Description"
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                  />
                  <GlassInput
                    label="Gross Weight (g)"
                    type="number"
                    step="0.001"
                    suffixSymbol="g"
                    value={ogWeight}
                    onChange={(e) => setOgWeight(e.target.value)}
                  />
                  <GlassInput
                    label="Deduction (Stones/Dirt)"
                    type="number"
                    step="0.001"
                    suffixSymbol="g"
                    value={ogDeduction}
                    onChange={(e) => setOgDeduction(e.target.value)}
                  />
                  <GlassInput
                    label="Assessed Purity (Tunch %)"
                    type="number"
                    step="0.1"
                    suffixSymbol="%"
                    value={ogPurity}
                    onChange={(e) => setOgPurity(e.target.value)}
                    helperText="e.g. 85% or 91.6%"
                  />
                </div>

                <div className="flex justify-end">
                  <GlassButton
                    variant="gold-outline"
                    size="sm"
                    onClick={handleAddOldGold}
                  >
                    Apply Exchange Credit
                  </GlassButton>
                </div>
              </div>
            )}

            {/* List of Applied Old Gold Credits */}
            {oldGoldItems.length > 0 && (
              <div className="divide-y divide-white/[0.04] pt-2 space-y-2">
                {oldGoldItems.map((og) => (
                  <div
                    key={og.id}
                    className="pt-2 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-[var(--text-primary)]">
                        {og.description}
                      </span>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        {formatGrams(og.netWeight)} @ {og.assessedPurityPercentage}% touch
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-semibold text-[var(--accent-emerald)] text-sm num-tabular">
                        −{formatINR(og.totalExchangeCredit)}
                      </span>
                      <button
                        onClick={() => handleRemoveOldGold(og.id)}
                        className="text-[var(--text-tertiary)] hover:text-[var(--accent-coral)]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Bill Summary & Finalization (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="rounded-xl p-6 sm:p-7 bg-[var(--surface-primary)] border border-[#C5A059]/30 shadow-2xl space-y-6">
            <div className="pb-3 border-b border-white/[0.06]">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#DFC488]">
                Settlement Summary
              </span>
              <div className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
                {customerName}
              </div>
            </div>

            {/* Final Grand Total Amount */}
            <div className="py-4 text-center border-b border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-secondary)]">
                Net Payable Amount
              </span>
              <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)] num-tabular">
                {formatINR(grandTotal)}
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] block">
                {applyGst ? "Inclusive of 3% GST" : "Before GST / Counter Bill"}
              </span>
            </div>

            {/* Financial Details Table */}
            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Items Subtotal:</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {formatINR(itemsSubtotal)}
                </span>
              </div>

              {oldGoldTotalCredit > 0 && (
                <div className="flex justify-between text-[var(--accent-emerald)]">
                  <span>Old-Gold Exchange Credit:</span>
                  <span className="font-mono font-medium">
                    −{formatINR(oldGoldTotalCredit)}
                  </span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-[var(--accent-emerald)]">
                  <span>Concession:</span>
                  <span className="font-mono font-medium">
                    −{formatINR(discountAmount)}
                  </span>
                </div>
              )}

              {applyGst && (
                <div className="flex justify-between text-[var(--text-secondary)] pt-2 border-t border-white/[0.04]">
                  <span>GST (3%):</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    +{formatINR(gstAmount)}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <span className="text-[11px] font-medium text-[var(--text-secondary)] block">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-black/30 border border-white/[0.06]">
                {(["UPI", "Cash", "Card"] as PaymentMethod[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPrimaryPaymentMode(mode)}
                    className={`py-1.5 rounded text-xs font-medium transition-all ${
                      primaryPaymentMode === mode
                        ? "bg-[#C5A059] text-[#08090C] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <GlassButton
                variant="primary"
                size="lg"
                className="w-full text-xs sm:text-sm font-semibold"
                icon={<Receipt size={16} />}
                onClick={handleFinalize}
                disabled={draftItems.length === 0}
              >
                Finalize & Generate Tax Bill
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
