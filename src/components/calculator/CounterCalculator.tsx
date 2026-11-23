"use client";

import React, { useState, useMemo } from "react";
import {
  calculatePricing,
  GOLD_BASE_PURITY_PERCENTAGES,
} from "../../modules/pricing/engine";
import {
  MetalType,
  GoldPurityKey,
  SilverPurityKey,
  MakingChargeType,
  SilverRateUnit,
} from "../../modules/pricing/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Coins,
  Sparkles,
  Receipt,
  Copy,
  Check,
  RotateCcw,
  Scale,
  ShoppingBag,
  Zap,
  CheckCircle2,
  ArrowRight,
  Plus,
  Eye,
  EyeOff,
  MessageCircle,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";
import {
  InvoiceLineItem,
  OldGoldExchangeItem,
  CustomerProfile,
} from "../../modules/invoicing/types";
import { Customer } from "../../modules/customers/types";
import { CounterQuickCartDrawer } from "./CounterQuickCartDrawer";

export interface PreloadedCalcData {
  productName?: string;
  metal?: MetalType;
  grossWeight?: number | string;
  stoneDeduction?: number | string;
  goldPurity?: GoldPurityKey;
  silverPurity?: SilverPurityKey;
  makingValue?: number | string;
  makingType?: MakingChargeType;
}

export interface CounterCalculatorProps {
  initialGoldRate?: number;
  initialSilverRate?: number;
  onSendToInvoice?: (calcResult: any) => void;
  preloadedItem?: PreloadedCalcData | null;
  cartItems?: InvoiceLineItem[];
  onAddToCart?: (item: InvoiceLineItem) => void;
  onRemoveCartItem?: (id: string) => void;
  onClearCart?: () => void;
  onQuickCashBill?: (applyGst: boolean) => void;
  onBillWithCustomer?: (
    customer: CustomerProfile,
    applyGst: boolean,
    oldGoldItems?: OldGoldExchangeItem[]
  ) => void;
  customers?: Customer[];
  shopName?: string;
}

export const CounterCalculator: React.FC<CounterCalculatorProps> = ({
  initialGoldRate = 150000,
  initialSilverRate = 95000,
  onSendToInvoice,
  preloadedItem,
  cartItems = [],
  onAddToCart,
  onRemoveCartItem = () => {},
  onClearCart = () => {},
  onQuickCashBill = () => {},
  onBillWithCustomer = () => {},
  customers = [],
  shopName = "Sandhya Jewellers",
}) => {
  // Mode: Gold or Silver
  const [metal, setMetal] = useState<MetalType>("gold");
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Sync preloaded item when selected from inventory
  React.useEffect(() => {
    if (preloadedItem) {
      if (preloadedItem.metal) setMetal(preloadedItem.metal);
      if (preloadedItem.productName) setProductName(preloadedItem.productName);
      if (preloadedItem.grossWeight !== undefined) setGrossWeight(preloadedItem.grossWeight.toString());
      if (preloadedItem.stoneDeduction !== undefined) setStoneDeduction(preloadedItem.stoneDeduction.toString());
      if (preloadedItem.goldPurity) setGoldPurity(preloadedItem.goldPurity);
      if (preloadedItem.silverPurity) setSilverPurity(preloadedItem.silverPurity);
      if (preloadedItem.makingValue !== undefined) setMakingValue(preloadedItem.makingValue.toString());
      if (preloadedItem.makingType) setMakingType(preloadedItem.makingType);
    }
  }, [preloadedItem]);

  // Basic inputs
  const [productName, setProductName] = useState("18K Gold Chain");
  const [grossWeight, setGrossWeight] = useState<string>("10");
  const [stoneDeduction, setStoneDeduction] = useState<string>("0");

  // Metal Rates
  const [goldRate, setGoldRate] = useState<string>(initialGoldRate.toString());
  const [silverRate, setSilverRate] = useState<string>(initialSilverRate.toString());
  const [silverUnit, setSilverUnit] = useState<SilverRateUnit>("per_kg");

  // Karat / Fineness
  const [goldPurity, setGoldPurity] = useState<GoldPurityKey>("18K");
  const [silverPurity, setSilverPurity] = useState<SilverPurityKey>("925");

  // Making charges
  const [makingType, setMakingType] = useState<MakingChargeType>("percentage");
  const [makingValue, setMakingValue] = useState<string>("18");

  // Stones & Discount
  const [stoneValue, setStoneValue] = useState<string>("0");
  const [discount, setDiscount] = useState<string>("0");

  // Tax
  const [applyGst, setApplyGst] = useState<boolean>(false);
  const gstRate = 3;

  // 24ct Fine Gold (Tunch) & Wastage Accounting (Harshit's Formula)
  const [prodWastage, setProdWastage] = useState<string>("6"); // 6% default
  const [labourCost, setLabourCost] = useState<string>("0");

  const { hasPermission, openLoginModal } = useAuth();
  const canViewPurchaseCost = hasPermission("VIEW_PURCHASE_COSTS");

  const [copied, setCopied] = useState<boolean>(false);
  const [isCustomerDisplayMode, setIsCustomerDisplayMode] = useState<boolean>(true); // Default: Hide internal cost from customers
  const effectiveCustomerMode = !canViewPurchaseCost || isCustomerDisplayMode;
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [whatsAppPhone, setWhatsAppPhone] = useState<string>("+91 ");

  // Compute live result through pricing engine
  const calculationResult = useMemo(() => {
    if (metal === "gold") {
      return calculatePricing({
        metal: "gold",
        productName,
        grossWeight: grossWeight ? parseFloat(grossWeight) : 0,
        stoneDeduction: stoneDeduction ? parseFloat(stoneDeduction) : 0,
        purityKey: goldPurity,
        rate24kPer10g: goldRate ? parseFloat(goldRate) : 0,
        makingType,
        makingValue: makingValue ? parseFloat(makingValue) : 0,
        productionWastagePercentage: prodWastage ? parseFloat(prodWastage) : 0,
        stoneValue: stoneValue ? parseFloat(stoneValue) : 0,
        discount: discount ? parseFloat(discount) : 0,
        gstPercentage: applyGst ? gstRate : 0,
        costMethod: "material",
        artisanLabourCost: labourCost ? parseFloat(labourCost) : 0,
      });
    } else {
      return calculatePricing({
        metal: "silver",
        productName,
        grossWeight: grossWeight ? parseFloat(grossWeight) : 0,
        stoneDeduction: stoneDeduction ? parseFloat(stoneDeduction) : 0,
        purityKey: silverPurity,
        silverRate: silverRate ? parseFloat(silverRate) : 0,
        rateUnit: silverUnit,
        makingType,
        makingValue: makingValue ? parseFloat(makingValue) : 0,
        productionWastagePercentage: prodWastage ? parseFloat(prodWastage) : 0,
        stoneValue: stoneValue ? parseFloat(stoneValue) : 0,
        discount: discount ? parseFloat(discount) : 0,
        gstPercentage: applyGst ? gstRate : 0,
        costMethod: "material",
        artisanLabourCost: labourCost ? parseFloat(labourCost) : 0,
      });
    }
  }, [
    metal,
    productName,
    grossWeight,
    stoneDeduction,
    goldPurity,
    silverPurity,
    goldRate,
    silverRate,
    silverUnit,
    makingType,
    makingValue,
    prodWastage,
    stoneValue,
    discount,
    applyGst,
    labourCost,
  ]);

  const handleReset = () => {
    setGrossWeight("10");
    setStoneDeduction("0");
    setMakingValue("18");
    setProdWastage("6");
    setStoneValue("0");
    setDiscount("0");
    setLabourCost("0");
  };

  const handleCopySummary = () => {
    const summary = `JewelleryOS Estimate
Item: ${productName || "Jewellery"}
Weight: ${grossWeight}g (Net: ${calculationResult.billableWeight.toFixed(3)}g)
Purity: ${metal === "gold" ? goldPurity : silverPurity}
Metal Value: ${formatINR(calculationResult.metalValue)}
Making: ${formatINR(calculationResult.makingCharges)}
Selling Price: ${formatINR(calculationResult.finalSellingPrice)}
Fine Gold Eq (24ct): ${formatGrams(calculationResult.fineWeight)} = ${formatINR(calculationResult.fineGoldValue24k)}`;

    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToCartClick = () => {
    const currentPurityKey = metal === "gold" ? goldPurity : silverPurity;
    const currentPurityDisplay =
      metal === "gold"
        ? `${goldPurity} (${calculationResult.basePurityPercentage.toNumber()}%)`
        : `${silverPurity} Fineness`;

    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      name: productName || "Jewellery Ornament",
      metal: metal,
      purity: currentPurityKey,
      purityDisplay: currentPurityDisplay,
      grossWeight: calculationResult.grossWeight.toNumber(),
      stoneWeight: calculationResult.stoneDeduction.toNumber(),
      netWeight: calculationResult.billableWeight.toNumber(),
      metalRate: metal === "gold" ? parseFloat(goldRate) || 150000 : parseFloat(silverRate) || 95000,
      effectiveRatePerGram: calculationResult.effectiveRatePerGram.toNumber(),
      metalValue: calculationResult.metalValue.toNumber(),
      makingType: makingType,
      makingRate: parseFloat(makingValue) || 18,
      makingCharges: calculationResult.makingCharges.toNumber(),
      stoneValue: calculationResult.stoneValue.toNumber(),
      discount: calculationResult.discountValue.toNumber(),
      totalBeforeTax: calculationResult.subtotalBeforeTax.toNumber(),
      fineWeight: calculationResult.fineWeight.toNumber(),
      fineGoldValue24k: calculationResult.fineGoldValue24k.toNumber(),
      wastagePercentage: calculationResult.wastagePercentage.toNumber(),
    };

    onAddToCart?.(newItem);
    setAddedToast(`Added ${newItem.name} (${formatGrams(newItem.grossWeight)}) to Counter Cart!`);
    setTimeout(() => setAddedToast(null), 4000);
  };

  const handleNextOrnament = () => {
    setProductName(`Ornament #${cartItems.length + 2}`);
    setGrossWeight("");
    setStoneDeduction("0");
    setStoneValue("0");
    setDiscount("0");
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header: Clean Segmented Switcher & Quick Example */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-white/[0.06]">
        {/* Metal Toggle */}
        <div className="inline-flex p-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
          <button
            onClick={() => {
              setMetal("gold");
              setProductName("18K Gold Chain");
              setGoldPurity("18K");
              setMakingType("percentage");
              setMakingValue("18");
              setProdWastage("6");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              metal === "gold"
                ? "bg-[#C5A059] text-[#08090C] font-semibold shadow-sm"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Coins size={14} />
            <span>Gold Calculator</span>
          </button>
          <button
            onClick={() => {
              setMetal("silver");
              setProductName("925 Silver Payal");
              setSilverPurity("925");
              setMakingType("per_gram");
              setMakingValue("25");
              setProdWastage("5");
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              metal === "silver"
                ? "bg-white/15 text-[var(--text-primary)] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Sparkles size={14} />
            <span>Silver Calculator</span>
          </button>
        </div>

        {/* Quiet Quick Presets */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[var(--text-tertiary)]">Presets from Harshit&apos;s Notebook:</span>
          <button
            onClick={() => {
              setMetal("gold");
              setGoldPurity("18K");
              setGrossWeight("10");
              setStoneDeduction("0");
              setGoldRate("150000");
              setMakingType("percentage");
              setMakingValue("18");
              setProdWastage("6");
            }}
            className="text-[11px] text-[#DFC488] hover:underline"
          >
            10g 18K (18% Making) → ₹1,32,750
          </button>
          <span className="text-white/20">·</span>
          <button
            onClick={() => {
              setMetal("gold");
              setGoldPurity("22K");
              setGrossWeight("10");
              setStoneDeduction("0");
              setGoldRate("150000");
              setMakingType("percentage");
              setMakingValue("18");
              setProdWastage("6");
            }}
            className="text-[11px] text-[#DFC488] hover:underline"
          >
            10g 22K (18% Making) → ₹1,62,250
          </button>
        </div>

        {/* Privacy Screen Mode Toggle (Customer vs Sethji Owner Mode) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustomerDisplayMode(!isCustomerDisplayMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              isCustomerDisplayMode
                ? "bg-black/40 border-white/[0.08] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                : "bg-[#C5A059]/20 border-[#C5A059]/50 text-[#DFC488] font-semibold"
            }`}
            title="Toggle between Customer-Facing Display and Sethji Owner Mode"
          >
            {isCustomerDisplayMode ? (
              <>
                <EyeOff size={13} className="text-[#DFC488]" />
                <span>Customer Facing (Cost Hidden)</span>
              </>
            ) : (
              <>
                <Eye size={13} className="text-[#DFC488]" />
                <span>Sethji Owner Mode (Costs Visible)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Layout: Precision Input Console (Left) + Minimalist Luxury Result (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form: Pure Minimalist Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Ornament & Weight */}
          <div className="rounded-xl p-5 sm:p-6 bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Specification (गहने का विवरण)
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {metal === "gold" ? "24K Basis ₹" + goldRate + "/10g" : "Silver Basis"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Ornament Name (जेवर का नाम)"
                placeholder="e.g. 18K Chain"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
              <GlassInput
                label={metal === "gold" ? "24K Gold Rate (24K भाव)" : "Silver Rate (चांदी भाव)"}
                prefixSymbol="₹"
                suffixSymbol={metal === "gold" ? "/ 10g" : silverUnit === "per_kg" ? "/ kg" : "/ g"}
                value={metal === "gold" ? goldRate : silverRate}
                onChange={(e) =>
                  metal === "gold" ? setGoldRate(e.target.value) : setSilverRate(e.target.value)
                }
              />
            </div>

            {/* Weights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <GlassInput
                label="Gross Weight (कुल वज़न)"
                type="number"
                step="0.001"
                suffixSymbol="g"
                value={grossWeight}
                onChange={(e) => setGrossWeight(e.target.value)}
              />
              <GlassInput
                label="Stone / Less (नग काट)"
                type="number"
                step="0.001"
                suffixSymbol="g"
                value={stoneDeduction}
                onChange={(e) => setStoneDeduction(e.target.value)}
              />
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-medium text-[var(--text-secondary)]">
                  Net Metal Weight (शुद्ध वज़न)
                </span>
                <div className="h-[38px] px-3 flex items-center rounded-lg bg-black/40 border border-white/[0.06] text-sm font-semibold text-[#DFC488] num-tabular">
                  {formatGrams(calculationResult.billableWeight)}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Karat Purity & Making Charges */}
          <div className="rounded-xl p-5 sm:p-6 bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Purity & Making
              </span>
              <span className="text-[11px] text-[var(--text-secondary)]">
                {metal === "gold" ? "BIS Hallmarked Karat" : "Fine Fineness"}
              </span>
            </div>

            {/* Karat Selector - Clean Horizontal Segment */}
            <div>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] mb-2 block">
                Metal Purity
              </span>
              {metal === "gold" ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {(["24K", "23K", "22K", "18K", "14K"] as GoldPurityKey[]).map((p) => {
                    const isSelected = goldPurity === p;
                    const purityMap: Record<string, string> = {
                      "24K": "24/24",
                      "23K": "23/24",
                      "22K": "22/24",
                      "18K": "18/24 (75%)",
                      "14K": "14/24",
                    };
                    return (
                      <button
                        key={p}
                        onClick={() => setGoldPurity(p)}
                        className={`py-2 px-1 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "bg-[#C5A059]/15 border-[#C5A059]/60 text-[#DFC488] font-semibold"
                            : "bg-white/[0.02] border-white/[0.06] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-white/15"
                        }`}
                      >
                        <div className="text-xs font-bold">{p}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {purityMap[p]}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {(["999", "925", "900", "800"] as SilverPurityKey[]).map((p) => {
                    const isSelected = silverPurity === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setSilverPurity(p)}
                        className={`py-2 px-1 rounded-lg border text-center transition-all ${
                          isSelected
                            ? "bg-white/15 border-white/40 text-[var(--text-primary)] font-semibold"
                            : "bg-white/[0.02] border-white/[0.06] text-[var(--text-secondary)] hover:border-white/15"
                        }`}
                      >
                        <div className="text-xs font-bold">{p}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
                          {p === "925" ? "Sterling" : "Fine"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Making Charge Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-[11px] font-medium text-[var(--text-secondary)] mb-2 block">
                  Making Type
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-black/30 border border-white/[0.06]">
                  <button
                    onClick={() => setMakingType("percentage")}
                    className={`py-1 rounded text-xs transition-all ${
                      makingType === "percentage"
                        ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    % Gold
                  </button>
                  <button
                    onClick={() => setMakingType("per_gram")}
                    className={`py-1 rounded text-xs transition-all ${
                      makingType === "per_gram"
                        ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    ₹ / g
                  </button>
                  <button
                    onClick={() => setMakingType("fixed")}
                    className={`py-1 rounded text-xs transition-all ${
                      makingType === "fixed"
                        ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Fixed ₹
                  </button>
                </div>
              </div>

              <GlassInput
                label={
                  makingType === "percentage"
                    ? "Making Rate (%)"
                    : makingType === "per_gram"
                    ? "Making (₹ per gram)"
                    : "Fixed Making Amount (₹)"
                }
                type="number"
                step="0.01"
                prefixSymbol={makingType !== "percentage" ? "₹" : undefined}
                suffixSymbol={makingType === "percentage" ? "%" : undefined}
                value={makingValue}
                onChange={(e) => setMakingValue(e.target.value)}
              />
            </div>

            {/* Optional Stones, Discount & GST */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-white/[0.04]">
              <GlassInput
                label="Stone Value (₹)"
                type="number"
                prefixSymbol="₹"
                placeholder="0"
                value={stoneValue}
                onChange={(e) => setStoneValue(e.target.value)}
              />
              <GlassInput
                label="Discount (₹)"
                type="number"
                prefixSymbol="₹"
                placeholder="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
              <div className="flex flex-col justify-end pb-1.5">
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={applyGst}
                    onChange={(e) => setApplyGst(e.target.checked)}
                    className="rounded border-white/20 text-[#C5A059] focus:ring-0 w-3.5 h-3.5 accent-[#C5A059]"
                  />
                  <span>Apply 3% GST</span>
                </label>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* Card 3: 24ct Fine Gold (Tunch) & Wastage Settlement (Harshit's Formula)   */}
          {/* ========================================================================= */}
          <div className="rounded-xl p-5 sm:p-6 bg-[var(--surface-primary)] border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.05]">
              <div className="flex items-center gap-2">
                <Scale size={16} className="text-[#DFC488]" />
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]">
                  Fine Gold Settlement (24ct Basis)
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)]">
                Karigar & Workshop Ledger
              </span>
            </div>

            {/* Wastage Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Wastage Allowance (%)"
                type="number"
                step="0.1"
                suffixSymbol="%"
                value={prodWastage}
                onChange={(e) => setProdWastage(e.target.value)}
                helperText="Added to base karat purity"
              />
              <GlassInput
                label="Karigar Labour / Majoori (₹)"
                type="number"
                prefixSymbol="₹"
                placeholder="0"
                value={labourCost}
                onChange={(e) => setLabourCost(e.target.value)}
                helperText="Artisan wage paid by shop"
              />
            </div>

            {/* Watchmaker-Style Tabular Settlement Breakdown or Privacy Shield */}
            {effectiveCustomerMode ? (
              <div className="rounded-xl p-5 bg-black/30 border border-white/[0.05] text-center space-y-2">
                <div className="inline-flex p-2 rounded-full bg-[#C5A059]/10 text-[#DFC488] mb-1">
                  <ShieldCheck size={18} />
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)]">
                  Customer Facing Mode Active (ग्राहक दर्शन मोड)
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] max-w-sm mx-auto">
                  Internal 24ct fine gold valuation and shop margin are hidden for counter privacy.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (!canViewPurchaseCost) {
                      openLoginModal();
                    } else {
                      setIsCustomerDisplayMode(false);
                    }
                  }}
                  className="text-xs text-[#DFC488] font-medium underline hover:text-white pt-1 inline-flex items-center gap-1.5 mx-auto"
                >
                  {!canViewPurchaseCost && <Lock size={12} className="text-amber-400" />}
                  <span>
                    {!canViewPurchaseCost
                      ? "Requires Manager PIN to View Costs"
                      : "Unlock Sethji Owner Mode (लागत व मुनाफा देखें)"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="rounded-lg p-4 bg-black/40 border border-white/[0.05] space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-[var(--text-secondary)]">Base Metal Purity:</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {calculationResult.basePurityPercentage.toNumber()}% ({metal === "gold" ? goldPurity : silverPurity})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-[var(--text-secondary)]">Wastage Added:</span>
                  <span className="font-mono text-[#DFC488]">
                    +{calculationResult.wastagePercentage.toNumber()}%
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-[var(--text-secondary)]">Effective Fine (Tunch):</span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    {calculationResult.effectiveFinePurityPercentage.toNumber()}% ({calculationResult.basePurityPercentage.toNumber()} + {calculationResult.wastagePercentage.toNumber()})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-[var(--text-secondary)]">Pure Fine Gold Weight:</span>
                  <span className="font-mono font-bold text-[#DFC488]">
                    {formatGrams(calculationResult.fineWeight)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                  <span className="text-[var(--text-secondary)]">24ct Fine Rate:</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    {formatINR(calculationResult.fineGoldRate24k)} / g
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 text-sm font-semibold">
                  <span className="text-[var(--text-primary)]">24ct Fine Gold Value:</span>
                  <span className="font-mono text-base font-bold text-[#DFC488] num-tabular">
                    {formatINR(calculationResult.fineGoldValue24k)}
                  </span>
                </div>

                <div className="pt-2 text-[10px] text-[var(--text-tertiary)] italic">
                  * Calculated as per 24ct rate for fine metal accounting. Shown strictly here and not added to the customer selling price.
                </div>

                {/* Shop Margin Comparison */}
                <div className="mt-3 pt-3 border-t border-white/[0.06] flex justify-between items-center text-xs">
                  <span className="text-[var(--text-secondary)]">Shop Gross Profit over Fine Gold:</span>
                  <div className="font-mono font-semibold text-[var(--accent-emerald)] num-tabular text-sm">
                    +{formatINR(calculationResult.grossProfit)}{" "}
                    <span className="text-[11px] opacity-80">
                      ({calculationResult.grossMarginPercentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => setIsCustomerDisplayMode(true)}
                    className="text-[11px] text-[var(--text-tertiary)] hover:text-[#DFC488] transition-colors inline-flex items-center gap-1"
                  >
                    <EyeOff size={11} /> Hide and Return to Customer Mode
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Minimalist Luxury Counter Selling Price (5 cols) */}
        <div className="lg:col-span-5 sticky top-20">
          <div className="rounded-xl p-6 sm:p-7 bg-[var(--surface-primary)] border border-[#C5A059]/30 shadow-2xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#DFC488]">
                  Counter Summary
                </span>
                <div className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
                  {productName}
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.08] font-mono">
                {metal === "gold" ? goldPurity : silverPurity}
              </span>
            </div>

            {/* Hero Price */}
            <div className="py-4 text-center border-b border-white/[0.06] space-y-1">
              <span className="text-[11px] font-medium tracking-wide uppercase text-[var(--text-secondary)]">
                Selling Price
              </span>
              <div className="text-4xl sm:text-5xl font-semibold tracking-tight text-[var(--text-primary)] num-tabular">
                {formatINR(calculationResult.finalSellingPrice)}
              </div>
              <span className="text-[11px] text-[var(--text-tertiary)] block">
                {applyGst ? "Inclusive of 3% GST" : "Before GST / Counter Billed Value"}
              </span>

              {/* Quick Round-Off Chips for Sethji */}
              {(() => {
                const currentPrice = calculationResult.finalSellingPrice.toNumber();
                const options: number[] = [];
                if (currentPrice > 1000) {
                  const round1000 = Math.floor(currentPrice / 1000) * 1000;
                  if (round1000 < currentPrice) options.push(round1000);
                  const round500 = Math.floor(currentPrice / 500) * 500;
                  if (round500 < currentPrice && round500 !== round1000) options.push(round500);
                  const round100 = Math.floor(currentPrice / 100) * 100;
                  if (round100 < currentPrice && round100 !== round500 && round100 !== round1000) options.push(round100);
                }

                if (options.length === 0) return null;

                return (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                    <span className="text-[10px] text-[var(--text-tertiary)]">Round-off (छूट):</span>
                    {options.slice(0, 3).map((target) => {
                      const diff = currentPrice - target;
                      return (
                        <button
                          key={target}
                          type="button"
                          onClick={() => {
                            const currentDisc = parseFloat(discount) || 0;
                            setDiscount((currentDisc + diff).toString());
                          }}
                          className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-[#C5A059]/20 border border-white/[0.06] hover:border-[#C5A059]/40 text-[10px] font-mono text-[#DFC488] transition-colors"
                        >
                          ₹{target.toLocaleString("en-IN")} (−₹{diff})
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Breakdown List */}
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Net Weight:</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {formatGrams(calculationResult.billableWeight)}
                </span>
              </div>

              <div className="flex justify-between text-[var(--text-secondary)]">
                <span>Effective Metal Rate:</span>
                <span className="font-mono text-[var(--text-primary)]">
                  {formatINR(calculationResult.effectiveRatePerGram, { decimals: 2 })} / g
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Metal Value:</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {formatINR(calculationResult.metalValue)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">
                  Making Charges ({makingType === "percentage" ? `${makingValue}%` : `₹${makingValue}/g`}):
                </span>
                <span className="font-mono font-medium text-[#DFC488]">
                  +{formatINR(calculationResult.makingCharges)}
                </span>
              </div>

              {calculationResult.stoneValue.greaterThan(0) && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Stone Value:</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    +{formatINR(calculationResult.stoneValue)}
                  </span>
                </div>
              )}

              {calculationResult.discountValue.greaterThan(0) && (
                <div className="flex justify-between text-[var(--accent-emerald)]">
                  <span>Concession / Discount:</span>
                  <span className="font-mono font-medium">
                    -{formatINR(calculationResult.discountValue)}
                  </span>
                </div>
              )}

              {applyGst && (
                <div className="flex justify-between text-[var(--text-secondary)] pt-2 border-t border-white/[0.04]">
                  <span>GST (3%):</span>
                  <span className="font-mono text-[var(--text-primary)]">
                    +{formatINR(calculationResult.gstValue)}
                  </span>
                </div>
              )}
            </div>

            {/* 24ct Settlement Line (Hidden in Customer Facing Mode) */}
            {!isCustomerDisplayMode ? (
              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.05] text-xs flex justify-between items-center">
                <span className="text-[var(--text-tertiary)]">24ct Fine Gold Eq (टंच):</span>
                <div className="font-mono text-right">
                  <span className="font-semibold text-[#DFC488]">
                    {formatGrams(calculationResult.fineWeight)}
                  </span>{" "}
                  <span className="text-[10px] text-[var(--text-tertiary)]">
                    ({formatINR(calculationResult.fineGoldValue24k)})
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-black/20 border border-white/[0.03] text-[11px] flex justify-between items-center text-[var(--text-tertiary)]">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[var(--accent-emerald)]" />
                  Official BIS Hallmark Guaranteed
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomerDisplayMode(false)}
                  className="text-[10px] text-[#DFC488] hover:underline"
                >
                  Owner View
                </button>
              </div>
            )}

            {/* Added to Cart Micro-Toast Notification */}
            <AnimatePresence>
              {addedToast && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-3 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 text-xs text-[#DFC488] flex items-center justify-between shadow-lg"
                >
                  <span className="flex items-center gap-1.5 font-medium truncate">
                    <CheckCircle2 size={15} className="text-[#DFC488] shrink-0" />
                    {addedToast}
                  </span>
                  <button
                    onClick={() => setIsCartDrawerOpen(true)}
                    className="underline font-bold text-[11px] shrink-0 ml-2 hover:text-white transition-colors"
                  >
                    View Cart
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              {/* Primary: Add to Active Cart */}
              <GlassButton
                variant="primary"
                size="lg"
                className="w-full text-xs sm:text-sm font-semibold shadow-lg"
                icon={<Plus size={16} />}
                onClick={handleAddToCartClick}
              >
                + Add to Active Cart & Weigh More
              </GlassButton>

              {/* Secondary Row: Quick Cash Bill & Open Cart */}
              <div className="grid grid-cols-2 gap-2">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  icon={<Zap size={14} className="text-[#DFC488]" />}
                  onClick={() => {
                    // If cart has items, bill all cart items; otherwise bill this current single item
                    if (cartItems.length > 0) {
                      onQuickCashBill(applyGst);
                    } else {
                      handleAddToCartClick();
                      onQuickCashBill(applyGst);
                    }
                  }}
                  className="font-medium"
                >
                  Quick Cash Bill
                </GlassButton>

                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  icon={<ShoppingBag size={14} />}
                  onClick={() => setIsCartDrawerOpen(true)}
                  className="font-medium"
                >
                  Cart ({cartItems.length}) · Details
                </GlassButton>
              </div>

              {/* Utility Row: Next Ornament, WhatsApp Quote, Copy */}
              <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/[0.04]">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  onClick={handleNextOrnament}
                  title="Reset weight for next ornament while keeping gold board rate"
                  className="text-[11px] px-1"
                >
                  Next Ornament
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={<MessageCircle size={13} className="text-[#25D366]" />}
                  onClick={() => setIsWhatsAppModalOpen(true)}
                  title="Send quotation to customer WhatsApp"
                  className="text-[11px] px-1 text-[#25D366] hover:bg-[#25D366]/10"
                >
                  WhatsApp
                </GlassButton>

                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={copied ? <Check size={13} /> : <Copy size={13} />}
                  onClick={handleCopySummary}
                  className="text-[11px] px-1"
                >
                  {copied ? "Copied" : "Copy"}
                </GlassButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Counter Quick Cart Bar (Appears when cart has items) */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[92%] sm:w-auto"
          >
            <div className="p-3 sm:px-5 sm:py-3.5 rounded-2xl bg-[var(--surface-primary)]/95 backdrop-blur-xl border border-[#C5A059]/40 shadow-[0_16px_50px_rgba(0,0,0,0.85)] flex items-center justify-between gap-4 sm:gap-6">
              <div
                className="flex items-center gap-3 cursor-pointer select-none"
                onClick={() => setIsCartDrawerOpen(true)}
              >
                <div className="relative p-2.5 rounded-xl bg-[#C5A059]/20 text-[#DFC488] border border-[#C5A059]/30">
                  <ShoppingBag size={18} />
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#C5A059] text-[#08090C] text-[10px] font-bold flex items-center justify-center shadow-md">
                    {cartItems.length}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-xs text-[var(--text-primary)]">
                    Counter Cart ({formatGrams(cartItems.reduce((s, i) => s + i.grossWeight, 0))})
                  </div>
                  <div className="text-sm font-bold font-mono text-[#DFC488]">
                    {formatINR(cartItems.reduce((s, i) => s + i.totalBeforeTax, 0))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => onQuickCashBill(applyGst)}
                  icon={<Zap size={13} className="text-[#DFC488]" />}
                  className="text-xs font-semibold"
                >
                  Quick Cash Bill
                </GlassButton>

                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => setIsCartDrawerOpen(true)}
                  icon={<ArrowRight size={13} />}
                  className="text-xs font-semibold"
                >
                  View Details
                </GlassButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Quick Cart Drawer */}
      <CounterQuickCartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        onRemoveItem={onRemoveCartItem}
        onClearCart={onClearCart}
        onQuickCashBill={(gst) => {
          setIsCartDrawerOpen(false);
          onQuickCashBill(gst);
        }}
        onBillWithCustomer={(cust, gst, og) => {
          setIsCartDrawerOpen(false);
          onBillWithCustomer(cust, gst, og);
        }}
        onAddMoreItems={() => {
          setIsCartDrawerOpen(false);
          handleNextOrnament();
        }}
        customers={customers}
        gold24kRate={parseFloat(goldRate) || 150000}
        shopName={shopName}
      />

      {/* WhatsApp Quote Modal */}
      {isWhatsAppModalOpen && (
        <GlassDialog
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
          title="Send WhatsApp Quote to Customer"
          description="Send formal estimate directly to customer's mobile with shop branding."
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <GlassInput
              label="Customer Mobile Number *"
              placeholder="+91 98290 12345"
              value={whatsAppPhone}
              onChange={(e) => setWhatsAppPhone(e.target.value)}
              required
            />

            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-1 font-mono text-[11px] text-[var(--text-secondary)]">
              <div className="font-bold text-[#DFC488]">Jewellery Quotation · {shopName}</div>
              <div>Item: {productName}</div>
              <div>Weight: {grossWeight}g (Net: {calculationResult.billableWeight.toFixed(3)}g)</div>
              <div>Purity: {metal === "gold" ? goldPurity : silverPurity}</div>
              <div>Rate: ₹{metal === "gold" ? goldRate : silverRate}</div>
              <div>Making: ₹{calculationResult.makingCharges.toFixed(0)}</div>
              <div className="font-bold text-white pt-1">
                Final Estimated Price: {formatINR(calculationResult.finalSellingPrice)}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" onClick={() => setIsWhatsAppModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                onClick={() => {
                  const cleanPhone = whatsAppPhone.replace(/[^0-9]/g, "");
                  const msg = `*Jewellery Estimate · ${shopName}*\nItem: ${productName}\nWeight: ${grossWeight}g (Net: ${calculationResult.billableWeight.toFixed(3)}g)\nPurity: ${metal === "gold" ? goldPurity : silverPurity}\nMetal Rate: ₹${metal === "gold" ? goldRate : silverRate}\nMaking Charges: ₹${calculationResult.makingCharges.toFixed(0)}\n*Total Estimate: ${formatINR(calculationResult.finalSellingPrice)}*\n_Valid for today._`;
                  const url = `https://wa.me/${cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone}?text=${encodeURIComponent(msg)}`;
                  window.open(url, "_blank");
                  setIsWhatsAppModalOpen(false);
                }}
                icon={<MessageCircle size={14} className="text-[#25D366]" />}
              >
                Send via WhatsApp
              </GlassButton>
            </div>
          </div>
        </GlassDialog>
      )}
    </div>
  );
};
