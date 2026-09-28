import { Decimal } from "../../lib/decimal";

export type MetalType = "gold" | "silver";

export type GoldPurityKey = "24K" | "23K" | "22K" | "18K" | "14K" | "custom";
export type SilverPurityKey = "999" | "925" | "900" | "800" | "custom";

export type MakingChargeType = "percentage" | "per_gram" | "fixed";
export type SilverRateUnit = "per_g" | "per_10g" | "per_kg";

export type CostMethod = "actual" | "material" | "estimate";

export interface GoldCalculationInput {
  metal: "gold";
  productName?: string;
  grossWeight: number | string | Decimal;
  stoneDeduction?: number | string | Decimal; // weight in grams
  purityKey: GoldPurityKey;
  customPurityPercentage?: number | string | Decimal; // e.g. 75 for 75%
  rate24kPer10g: number | string | Decimal; // e.g. 150000

  // Making charges
  makingType: MakingChargeType;
  makingValue: number | string | Decimal; // percentage (e.g. 18), ₹ per gram (e.g. 500), or fixed ₹

  // Customer wastage (independent of production cost wastage)
  customerWastagePercentage?: number | string | Decimal;

  // Stones and other charges
  stoneValue?: number | string | Decimal; // ₹ value of studded stones
  discount?: number | string | Decimal; // Flat ₹ or discount amount
  discountType?: "fixed" | "percentage";

  // Optional GST
  gstPercentage?: number | string | Decimal; // default 0 or 3%

  // Cost basis for profit calculation
  costMethod?: CostMethod;
  actualCost?: number | string | Decimal; // for 'actual'
  productionPurchaseRatePer10g?: number | string | Decimal; // raw metal purchase rate
  productionWastagePercentage?: number | string | Decimal; // artisan loss
  artisanLabourCost?: number | string | Decimal; // paid to karigar
  stoneCost?: number | string | Decimal; // cost of stones to shop
  estimatedCostRate?: number | string | Decimal; // for 'estimate'
}

export interface SilverCalculationInput {
  metal: "silver";
  productName?: string;
  grossWeight: number | string | Decimal;
  stoneDeduction?: number | string | Decimal;
  purityKey: SilverPurityKey;
  customPurityPercentage?: number | string | Decimal;
  silverRate: number | string | Decimal;
  rateUnit: SilverRateUnit; // per_g, per_10g, per_kg

  makingType: MakingChargeType;
  makingValue: number | string | Decimal;
  customerWastagePercentage?: number | string | Decimal;
  stoneValue?: number | string | Decimal;
  discount?: number | string | Decimal;
  discountType?: "fixed" | "percentage";
  gstPercentage?: number | string | Decimal;

  costMethod?: CostMethod;
  actualCost?: number | string | Decimal;
  productionPurchaseRatePerGram?: number | string | Decimal;
  productionWastagePercentage?: number | string | Decimal;
  artisanLabourCost?: number | string | Decimal;
  stoneCost?: number | string | Decimal;
  estimatedCostRate?: number | string | Decimal;
}

export type PricingCalculationInput = GoldCalculationInput | SilverCalculationInput;

export interface PricingCalculationResult {
  isValid: boolean;
  errors: string[];
  
  // Weights
  grossWeight: Decimal;
  stoneDeduction: Decimal;
  billableWeight: Decimal;

  // Normalized Metal Rates & Purity
  purityFactor: Decimal;
  effectiveRatePerGram: Decimal;
  baseRatePerUnitDisplay: string;

  // Breakdown amounts (all Decimal for exact precision)
  metalValue: Decimal;
  makingCharges: Decimal;
  customerWastageValue: Decimal;
  stoneValue: Decimal;
  discountValue: Decimal;

  // Subtotals and Final Customer Price (Wastage is NOT added to selling price)
  subtotalBeforeTax: Decimal; // Metal + Making + Stone - Discount
  gstValue: Decimal;
  finalSellingPrice: Decimal; // Subtotal + GST

  // 24ct Fine Gold (Tunch) & Wastage Accounting (Calculated at bottom for workshop/accounting)
  basePurityPercentage: Decimal;          // e.g. 75 for 18K
  wastagePercentage: Decimal;             // e.g. 6 for 6%
  effectiveFinePurityPercentage: Decimal; // e.g. 75 + 6 = 81%
  fineWeight: Decimal;                    // e.g. (10 * 81) / 100 = 8.100g
  fineGoldRate24k: Decimal;               // e.g. ₹15,000 / g (from 24ct rate ₹1,50,000 / 10g)
  fineGoldValue24k: Decimal;              // e.g. 8.100g * ₹15,000 = ₹1,21,500

  // Cost and Profit Breakdown
  cogs: Decimal; // Cost of Goods Sold (Fine Gold Value 24ct + labour + stone cost)
  grossProfit: Decimal; // Subtotal - COGS
  grossMarginPercentage: Decimal; // (Gross Profit / Subtotal) * 100
  costMethod: CostMethod;
  isEstimatedCost: boolean;

  // Timestamp and Snapshot metadata
  calculatedAt: string;
}
