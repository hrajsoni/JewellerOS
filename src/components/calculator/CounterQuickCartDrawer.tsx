"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { InvoiceLineItem, OldGoldExchangeItem, CustomerProfile } from "../../modules/invoicing/types";
import { Customer } from "../../modules/customers/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import {
  ShoppingBag,
  X,
  Trash2,
  Plus,
  Receipt,
  User,
  Zap,
  Coins,
  ChevronRight,
  ShieldCheck,
  Scale,
  Sparkles,
  ArrowRight,
  MessageCircle,
} from "lucide-react";

export interface CounterQuickCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: InvoiceLineItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onQuickCashBill: (applyGst: boolean) => void;
  onBillWithCustomer: (
    customer: CustomerProfile,
    applyGst: boolean,
    oldGoldItems?: OldGoldExchangeItem[]
  ) => void;
  onAddMoreItems: () => void;
  customers?: Customer[];
  gold24kRate: number;
  shopName?: string;
}

export const CounterQuickCartDrawer: React.FC<CounterQuickCartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onRemoveItem,
  onClearCart,
  onQuickCashBill,
  onBillWithCustomer,
  onAddMoreItems,
  customers = [],
  gold24kRate,
  shopName = "Sandhya Jewellers",
}) => {
  const [applyGst, setApplyGst] = useState<boolean>(false);
  const [checkoutMode, setCheckoutMode] = useState<"summary" | "customer">("summary");

  // Customer Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("+91 ");
  const [custCity, setCustCity] = useState("Jaipur");
  const [custAddress, setCustAddress] = useState("");
  const [custGstin, setCustGstin] = useState("URP (Retail Consumer)");
  const [searchCustQuery, setSearchCustQuery] = useState("");

  // Old Gold Exchange State inside Cart
  const [includeOldGold, setIncludeOldGold] = useState(false);
  const [oldGoldItems, setOldGoldItems] = useState<OldGoldExchangeItem[]>([]);
  const [ogDesc, setOgDesc] = useState("Old Gold Scrap / Broken Chain");
  const [ogWeight, setOgWeight] = useState("5.0");
  const [ogStone, setOgStone] = useState("0");
  const [ogPurity, setOgPurity] = useState("85"); // 85% tunch

  // Aggregates
  const totalGrossWeight = items.reduce((sum, i) => sum + i.grossWeight, 0);
  const totalNetWeight = items.reduce((sum, i) => sum + i.netWeight, 0);
  const totalFineWeight = items.reduce((sum, i) => sum + i.fineWeight, 0);
  const totalMaking = items.reduce((sum, i) => sum + i.makingCharges, 0);
  const subtotalBeforeTax = items.reduce((sum, i) => sum + i.totalBeforeTax, 0);

  // Old Gold total credit
  const oldGoldCredit = oldGoldItems.reduce(
    (sum, og) => sum + og.totalExchangeCredit,
    0
  );

  const taxableAmount = Math.max(0, subtotalBeforeTax - oldGoldCredit);
  const gstAmount = applyGst ? Math.round(taxableAmount * 0.03) : 0;
  const grandTotal = taxableAmount + gstAmount;

  // Split Payment State
  const [splitCash, setSplitCash] = useState<string>("");
  const [splitUpi, setSplitUpi] = useState<string>("");
  const [splitCard, setSplitCard] = useState<string>("");

  const cashVal = parseFloat(splitCash) || 0;
  const upiVal = parseFloat(splitUpi) || 0;
  const cardVal = parseFloat(splitCard) || 0;
  const totalPaidCalc = cashVal + upiVal + cardVal;
  const balanceRemaining = Math.max(0, grandTotal - totalPaidCalc);

  const handleShareWhatsAppCart = () => {
    const cleanPhone = custPhone.replace(/[^0-9]/g, "");
    const itemsList = items
      .map(
        (i, idx) =>
          `${idx + 1}. ${i.name} (${i.grossWeight}g ${i.purity}) - ${formatINR(i.totalBeforeTax)}`
      )
      .join("\n");
    const msg = `*Jewellery Estimate · ${shopName}*\n${itemsList}\n*Total Payable: ${formatINR(grandTotal)}*\n_Valid for today._`;
    const target = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone || "";
    const url = target
      ? `https://wa.me/${target}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  const handleAddOldGoldItem = () => {
    const gross = parseFloat(ogWeight) || 0;
    const stone = parseFloat(ogStone) || 0;
    const net = Math.max(0, gross - stone);
    const purity = parseFloat(ogPurity) || 0;
    const fine = (net * purity) / 100;
    const ratePerGram24k = gold24kRate / 10;
    const credit = Math.round(fine * ratePerGram24k);

    const newItem: OldGoldExchangeItem = {
      id: `og-${Date.now()}`,
      description: ogDesc,
      metal: "gold",
      grossWeight: gross,
      stoneDeduction: stone,
      netWeight: net,
      assessedPurityPercentage: purity,
      fineWeight: fine,
      currentRate24k: gold24kRate,
      meltDeductionPercentage: 0,
      totalExchangeCredit: credit,
    };

    setOldGoldItems([...oldGoldItems, newItem]);
    setOgWeight("");
  };

  const handleSelectExistingCustomer = (c: Customer) => {
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustCity(c.city);
    setCustAddress(c.address || "");
    setCustGstin(c.gstin || "URP (Retail Consumer)");
    setSearchCustQuery("");
  };

  const handleFinalizeCustomerBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    onBillWithCustomer(
      {
        id: `cust-${Date.now()}`,
        name: custName.trim(),
        phone: custPhone.trim(),
        city: custCity.trim(),
        address: custAddress.trim() || undefined,
        gstin: custGstin.trim() || undefined,
      },
      applyGst,
      oldGoldItems.length > 0 ? oldGoldItems : undefined
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Liquid Glass Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-xl h-full bg-[var(--surface-primary)] border-l border-white/[0.08] shadow-2xl flex flex-col z-10 overflow-hidden text-[var(--text-primary)]"
          >
            {/* Header */}
            <div className="p-5 border-b border-white/[0.06] flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#C5A059]/15 text-[#DFC488] border border-[#C5A059]/30">
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-base tracking-tight text-[var(--text-primary)]">
                    Active Counter Cart
                  </h3>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    {items.length} {items.length === 1 ? "Ornament" : "Ornaments"} · {formatGrams(totalGrossWeight)} Gross
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={onClearCart}
                    className="px-2.5 py-1 text-[11px] text-[var(--text-tertiary)] hover:text-red-400 hover:bg-white/[0.04] rounded transition-colors"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.06] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {items.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
                    <ShoppingBag size={20} />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-[var(--text-primary)]">
                      Counter Cart is Empty
                    </h4>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 max-w-xs mx-auto">
                      Use the Counter Terminal to calculate an ornament price, then click &quot;Add to Cart&quot; to queue multiple items.
                    </p>
                  </div>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={onAddMoreItems}
                    icon={<Plus size={14} />}
                  >
                    Weigh & Calculate Next Item
                  </GlassButton>
                </div>
              ) : (
                <>
                  {/* Ornaments List */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold">
                      <span>Items in Counter Session</span>
                      <button
                        onClick={onAddMoreItems}
                        className="text-[#DFC488] hover:underline flex items-center gap-1 normal-case"
                      >
                        <Plus size={12} /> Add More Ornaments
                      </button>
                    </div>

                    <div className="space-y-2">
                      {items.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-3.5 rounded-xl bg-black/25 border border-white/[0.06] flex items-start justify-between gap-3 hover:border-white/[0.12] transition-colors"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-white/[0.05] text-[10px] font-mono text-[var(--text-tertiary)] flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="font-semibold text-[var(--text-primary)]">
                                {item.name}
                              </span>
                              <GlassBadge variant="gold" size="sm">
                                {item.purity}
                              </GlassBadge>
                            </div>

                            <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 pl-7 font-mono">
                              <span>Gross: {formatGrams(item.grossWeight)}</span>
                              <span>·</span>
                              <span>Net: {formatGrams(item.netWeight)}</span>
                              <span>·</span>
                              <span>Making: {formatINR(item.makingCharges)}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="font-bold font-mono text-[var(--text-primary)] text-sm">
                                {formatINR(item.totalBeforeTax)}
                              </div>
                              <div className="text-[10px] text-[#DFC488] font-mono">
                                24K Eq: {formatGrams(item.fineWeight)}
                              </div>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="p-1.5 rounded text-[var(--text-tertiary)] hover:text-red-400 hover:bg-white/[0.04] transition-colors"
                              title="Remove item"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mode Selector: Quick Bill vs With Customer Profile */}
                  <div className="p-1 rounded-xl bg-black/30 border border-white/[0.06] grid grid-cols-2 gap-1 text-center">
                    <button
                      onClick={() => setCheckoutMode("summary")}
                      className={`py-2 px-3 rounded-lg font-medium transition-all ${
                        checkoutMode === "summary"
                          ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold border border-[#C5A059]/30"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <Zap size={13} className="inline mr-1.5" />
                      1-Click Walk-in Cash Bill
                    </button>
                    <button
                      onClick={() => setCheckoutMode("customer")}
                      className={`py-2 px-3 rounded-lg font-medium transition-all ${
                        checkoutMode === "customer"
                          ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold border border-[#C5A059]/30"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <User size={13} className="inline mr-1.5" />
                      Tax Bill with Customer
                    </button>
                  </div>

                  {/* Mode: Customer Details & Old Gold Deductions */}
                  {checkoutMode === "customer" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-black/25 border border-white/[0.06] space-y-4"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                        <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                          <User size={14} className="text-[#DFC488]" />
                          Customer Information
                        </span>
                        <span className="text-[10px] text-[var(--text-tertiary)]">
                          Recorded to Ledger
                        </span>
                      </div>

                      {/* Quick Search Existing Customers */}
                      {customers.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] text-[var(--text-secondary)]">
                            Select Existing Customer (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Search registered clients by name or phone..."
                            value={searchCustQuery}
                            onChange={(e) => setSearchCustQuery(e.target.value)}
                            className="w-full px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                          />
                          {searchCustQuery.trim() && (
                            <div className="p-1 rounded-lg bg-black/60 border border-white/[0.08] max-h-32 overflow-y-auto space-y-1">
                              {customers
                                .filter(
                                  (c) =>
                                    c.name.toLowerCase().includes(searchCustQuery.toLowerCase()) ||
                                    c.phone.includes(searchCustQuery)
                                )
                                .slice(0, 4)
                                .map((c) => (
                                  <div
                                    key={c.id}
                                    onClick={() => handleSelectExistingCustomer(c)}
                                    className="p-2 rounded hover:bg-white/[0.05] cursor-pointer flex justify-between items-center"
                                  >
                                    <div>
                                      <div className="font-medium text-[var(--text-primary)]">
                                        {c.name}
                                      </div>
                                      <div className="text-[10px] text-[var(--text-tertiary)]">
                                        {c.phone} · {c.city}
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-[#DFC488]">Select</span>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <GlassInput
                          label="Customer Name *"
                          placeholder="e.g. Rameshwar Sharma"
                          value={custName}
                          onChange={(e) => setCustName(e.target.value)}
                          required
                        />
                        <GlassInput
                          label="Contact Phone"
                          placeholder="+91 98290 12345"
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <GlassInput
                          label="City / Town"
                          placeholder="Jaipur"
                          value={custCity}
                          onChange={(e) => setCustCity(e.target.value)}
                        />
                        <GlassInput
                          label="GSTIN (Optional)"
                          placeholder="URP (Retail Consumer)"
                          value={custGstin}
                          onChange={(e) => setCustGstin(e.target.value)}
                        />
                      </div>

                      {/* Optional Old Gold Exchange Accordion */}
                      <div className="pt-2 border-t border-white/[0.04]">
                        <button
                          type="button"
                          onClick={() => setIncludeOldGold(!includeOldGold)}
                          className="text-[#DFC488] flex items-center justify-between w-full font-medium"
                        >
                          <span className="flex items-center gap-1.5">
                            <Scale size={14} />
                            Old Gold Exchange Deduction ({oldGoldItems.length} scrap items)
                          </span>
                          <span>{includeOldGold ? "− Hide" : "+ Add Scrap Trade-in"}</span>
                        </button>

                        {includeOldGold && (
                          <div className="mt-3 p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <GlassInput
                                label="Scrap Gross (g)"
                                type="number"
                                placeholder="5.0"
                                value={ogWeight}
                                onChange={(e) => setOgWeight(e.target.value)}
                              />
                              <GlassInput
                                label="Touch / Purity (%)"
                                type="number"
                                placeholder="85"
                                value={ogPurity}
                                onChange={(e) => setOgPurity(e.target.value)}
                              />
                              <div className="flex items-end">
                                <GlassButton
                                  variant="secondary"
                                  size="sm"
                                  type="button"
                                  onClick={handleAddOldGoldItem}
                                  className="w-full"
                                >
                                  + Add Scrap
                                </GlassButton>
                              </div>
                            </div>

                            {oldGoldItems.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
                                {oldGoldItems.map((og) => (
                                  <div
                                    key={og.id}
                                    className="flex justify-between items-center text-[11px] p-2 rounded bg-white/[0.02]"
                                  >
                                    <div>
                                      <span>{og.grossWeight}g @ {og.assessedPurityPercentage}% touch</span>
                                      <span className="text-[10px] text-[var(--text-tertiary)] block">
                                        Fine: {formatGrams(og.fineWeight)}
                                      </span>
                                    </div>
                                    <span className="font-mono text-[var(--accent-emerald)] font-bold">
                                      -{formatINR(og.totalExchangeCredit)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Split Payment Mode Breakdown */}
                      <div className="pt-2 border-t border-white/[0.04] space-y-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DFC488] block">
                          Payment Mode Breakdown (भुगतान विवरण)
                        </span>
                        <div className="grid grid-cols-3 gap-2">
                          <GlassInput
                            label="Cash (रोकड़)"
                            type="number"
                            prefixSymbol="₹"
                            placeholder="0"
                            value={splitCash}
                            onChange={(e) => setSplitCash(e.target.value)}
                          />
                          <GlassInput
                            label="UPI / QR (ऑनलाइन)"
                            type="number"
                            prefixSymbol="₹"
                            placeholder="0"
                            value={splitUpi}
                            onChange={(e) => setSplitUpi(e.target.value)}
                          />
                          <GlassInput
                            label="Card / Bank"
                            type="number"
                            prefixSymbol="₹"
                            placeholder="0"
                            value={splitCard}
                            onChange={(e) => setSplitCard(e.target.value)}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[11px] pt-1">
                          <span className="text-[var(--text-secondary)]">Total Paid: {formatINR(totalPaidCalc)}</span>
                          <span
                            className={
                              balanceRemaining === 0 && totalPaidCalc > 0
                                ? "text-[var(--accent-emerald)] font-semibold"
                                : totalPaidCalc > 0
                                ? "text-[var(--accent-coral)] font-semibold"
                                : "text-[var(--text-tertiary)]"
                            }
                          >
                            {balanceRemaining === 0 && totalPaidCalc > 0
                              ? "✓ Full Settlement (पूर्ण भुगतान)"
                              : totalPaidCalc > 0
                              ? `Due: ${formatINR(balanceRemaining)}`
                              : `Payable: ${formatINR(grandTotal)}`}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Pricing Calculation Summary Box */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-2.5">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Total Ornaments Subtotal:</span>
                      <span className="font-mono font-medium text-[var(--text-primary)]">
                        {formatINR(subtotalBeforeTax)}
                      </span>
                    </div>

                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Total Making Charges:</span>
                      <span className="font-mono font-medium text-[#DFC488]">
                        +{formatINR(totalMaking)}
                      </span>
                    </div>

                    {oldGoldCredit > 0 && (
                      <div className="flex justify-between text-[var(--accent-emerald)]">
                        <span>Old Gold Scrap Credit:</span>
                        <span className="font-mono font-medium">
                          -{formatINR(oldGoldCredit)}
                        </span>
                      </div>
                    )}

                    {/* GST Toggle Switch */}
                    <div className="flex items-center justify-between py-1.5 border-t border-white/[0.04]">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="cartApplyGst"
                          checked={applyGst}
                          onChange={(e) => setApplyGst(e.target.checked)}
                          className="rounded border-white/20 bg-black/40 text-[#C5A059] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
                        />
                        <label htmlFor="cartApplyGst" className="cursor-pointer text-[var(--text-secondary)]">
                          Apply Official GST (3%)
                        </label>
                      </div>
                      <span className="font-mono text-[var(--text-primary)]">
                        {applyGst ? `+${formatINR(gstAmount)}` : "₹0"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/[0.06] text-sm">
                      <span className="font-semibold text-[var(--text-primary)]">
                        Final Counter Payable:
                      </span>
                      <span className="font-mono text-xl font-bold text-[#DFC488] num-tabular">
                        {formatINR(grandTotal)}
                      </span>
                    </div>

                    <div className="text-[10px] text-[var(--text-tertiary)] flex justify-between items-center pt-1 font-mono">
                      <span>Total 24K Fine Equivalent: {formatGrams(totalFineWeight)}</span>
                      <span>{items.length} Ornaments</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Sticky Action Bar */}
            {items.length > 0 && (
              <div className="p-4 border-t border-white/[0.06] bg-black/30 space-y-2">
                {checkoutMode === "summary" ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <GlassButton
                        variant="primary"
                        size="md"
                        onClick={() => onQuickCashBill(applyGst)}
                        icon={<Zap size={15} />}
                        className="font-semibold text-xs"
                      >
                        Instant Cash Bill (No Customer)
                      </GlassButton>

                      <GlassButton
                        variant="gold-outline"
                        size="md"
                        onClick={() => setCheckoutMode("customer")}
                        icon={<User size={15} />}
                        className="font-semibold text-xs"
                      >
                        Enter Customer & GST Bill
                      </GlassButton>
                    </div>

                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={handleShareWhatsAppCart}
                      icon={<MessageCircle size={14} className="text-[#25D366]" />}
                      className="w-full text-xs text-[#25D366] hover:bg-[#25D366]/10 font-medium"
                    >
                      Share Cart Estimate on WhatsApp
                    </GlassButton>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <GlassButton
                      variant="ghost"
                      size="md"
                      onClick={() => setCheckoutMode("summary")}
                    >
                      Back to Summary
                    </GlassButton>

                    <GlassButton
                      variant="primary"
                      size="md"
                      onClick={handleFinalizeCustomerBill}
                      icon={<Receipt size={15} />}
                      className="font-semibold text-xs"
                    >
                      Generate Tax Invoice
                    </GlassButton>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
