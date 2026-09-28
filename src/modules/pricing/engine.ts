import { Decimal, toDecimal, roundPaise, roundRupee, roundWeight } from "../../lib/decimal";
import {
  GoldCalculationInput,
  SilverCalculationInput,
  PricingCalculationInput,
  PricingCalculationResult,
  GoldPurityKey,
  SilverPurityKey,
} from "./types";

/**
 * Standard Indian jewellery gold purity conversion factors
 */
export const GOLD_PURITY_FACTORS: Record<GoldPurityKey, Decimal> = {
  "24K": new Decimal(1.0),
  "23K": new Decimal(23).dividedBy(24),
  "22K": new Decimal(22).dividedBy(24), // Exact Karat ratio: 22/24 => (150000/24)*22 = 1,37,500/10g
  "18K": new Decimal(18).dividedBy(24), // 18/24 = 0.75 => (150000/24)*18 = 1,12,500/10g
  "14K": new Decimal(14).dividedBy(24), // 14/24 => (150000/24)*14 = 87,500/10g
  "custom": new Decimal(1.0),
};

/**
 * Base purity percentages (tunch) for Indian hallmarked gold
 */
export const GOLD_BASE_PURITY_PERCENTAGES: Record<GoldPurityKey, Decimal> = {
  "24K": new Decimal("100"),
  "23K": new Decimal(23).dividedBy(24).times(100),
  "22K": new Decimal(22).dividedBy(24).times(100), // (22/24)*100 = 91.6666...%
  "18K": new Decimal("75"),                        // (18/24)*100 = 75%
  "14K": new Decimal(14).dividedBy(24).times(100),
  "custom": new Decimal("100"),
};

/**
 * Standard Indian silver purity factors
 */
export const SILVER_PURITY_FACTORS: Record<SilverPurityKey, Decimal> = {
  "999": new Decimal("0.999"),
  "925": new Decimal("0.925"), // Sterling silver
  "900": new Decimal("0.900"),
  "800": new Decimal("0.800"),
  "custom": new Decimal(1.0),
};

export const SILVER_BASE_PURITY_PERCENTAGES: Record<SilverPurityKey, Decimal> = {
  "999": new Decimal("99.9"),
  "925": new Decimal("92.5"),
  "900": new Decimal("90.0"),
  "800": new Decimal("80.0"),
  "custom": new Decimal("100"),
};

/**
 * Calculate pricing for a Gold jewellery item
 * 
 * Rules:
 * 1. Customer Selling Price: Gold Value + Making Charges + Stone Value - Discount (Wastage is NOT added to selling price)
 * 2. 24ct Fine Gold (Tunch) & Wastage Accounting:
 *    If 18ct (75%) and wastage is 6%:
 *    Effective Fine Purity = 75 + 6 = 81%
 *    Fine Gold Weight = 10g * 81 / 100 = 8.100g
 *    Valuation @ 24ct rate = 8.1g * (Rate24 / 10) = e.g. 8.1 * 15,000 = ₹1,21,500
 *    Shown strictly in the workshop/accounting section, NOT on the selling price panel!
 */
export function calculateGoldPricing(input: GoldCalculationInput): PricingCalculationResult {
  const errors: string[] = [];

  const grossWeight = roundWeight(toDecimal(input.grossWeight));
  const stoneDeduction = roundWeight(toDecimal(input.stoneDeduction));
  const billableWeight = grossWeight.minus(stoneDeduction);

  if (grossWeight.lessThanOrEqualTo(0)) {
    errors.push("Gross weight must be greater than zero");
  }
  if (billableWeight.lessThanOrEqualTo(0)) {
    errors.push("Billable weight must be greater than zero after stone deductions");
  }

  const rate24kPer10g = toDecimal(input.rate24kPer10g);
  if (rate24kPer10g.lessThanOrEqualTo(0)) {
    errors.push("24K gold rate is required and must be greater than zero");
  }

  // Determine purity factor & base purity percentage (tunch)
  let purityFactor = GOLD_PURITY_FACTORS[input.purityKey] || new Decimal(1.0);
  let basePurityPercentage = GOLD_BASE_PURITY_PERCENTAGES[input.purityKey] || new Decimal(100);

  if (input.purityKey === "custom" && input.customPurityPercentage !== undefined) {
    basePurityPercentage = toDecimal(input.customPurityPercentage);
    purityFactor = basePurityPercentage.dividedBy(100);
  }

  const fineGoldRate24k = rate24kPer10g.dividedBy(10); // 24ct rate per gram
  const effectiveRatePerGram = fineGoldRate24k.times(purityFactor);
  const baseRatePerUnitDisplay = `₹${rate24kPer10g.toString()} / 10g (24K)`;

  // If there are input validation errors, return incomplete result
  if (errors.length > 0) {
    return createEmptyResult({
      isValid: false,
      errors,
      grossWeight,
      stoneDeduction,
      billableWeight,
      purityFactor,
      effectiveRatePerGram,
      baseRatePerUnitDisplay,
      costMethod: input.costMethod || "material",
    });
  }

  // 1. Customer Metal Value = Billable Weight * (Rate24 / 10) * PurityFactor
  const metalValue = roundPaise(billableWeight.times(effectiveRatePerGram));

  // 2. Making Charges
  const makingType = input.makingType || "percentage";
  const makingVal = toDecimal(input.makingValue);
  let makingCharges = new Decimal(0);

  if (makingType === "percentage") {
    // Making = Metal Value * (m / 100)
    makingCharges = roundPaise(metalValue.times(makingVal.dividedBy(100)));
  } else if (makingType === "per_gram") {
    // Making = Billable Weight * m
    makingCharges = roundPaise(billableWeight.times(makingVal));
  } else if (makingType === "fixed") {
    makingCharges = roundPaise(makingVal);
  }

  // 3. Customer Wastage is NOT added to customer selling price!
  const customerWastageValue = new Decimal(0);

  // 4. Stone Value
  const stoneValue = roundPaise(toDecimal(input.stoneValue));

  // 5. Discount
  const discountInput = toDecimal(input.discount);
  let discountValue = new Decimal(0);
  if (input.discountType === "percentage") {
    const rawSubtotal = metalValue.plus(makingCharges).plus(stoneValue);
    discountValue = roundPaise(rawSubtotal.times(discountInput.dividedBy(100)));
  } else {
    discountValue = roundPaise(discountInput);
  }

  // 6. Subtotal before tax (Customer Counter Selling Price: Metal Value + Making Charges + Stones - Discount)
  // For 10g 18K @ 18% making with ₹150000 rate: ₹1,12,500 + ₹20,250 = ₹1,32,750!
  const subtotalBeforeTax = metalValue
    .plus(makingCharges)
    .plus(stoneValue)
    .minus(discountValue);

  // 7. GST / Tax
  const gstPct = toDecimal(input.gstPercentage);
  const gstValue = gstPct.greaterThan(0)
    ? roundPaise(subtotalBeforeTax.times(gstPct.dividedBy(100)))
    : new Decimal(0);

  const finalSellingPrice = roundRupee(subtotalBeforeTax.plus(gstValue));

  // =========================================================================
  // 8. Indian Jeweller 24ct Fine Gold & Wastage Accounting (Workshop Calculation)
  // =========================================================================
  // If user inputs wastage (e.g. 6%):
  // Effective Fine Purity = 75 + 6 = 81%
  // Fine Gold Weight = 10g * 81 / 100 = 8.100g pure gold
  // Fine Gold Value @ 24ct rate = 8.100g * (Rate24 / 10) = 8.1 * 15,000 = ₹1,21,500
  const wastagePercentage = toDecimal(
    input.productionWastagePercentage !== undefined && input.productionWastagePercentage !== null && input.productionWastagePercentage !== ""
      ? input.productionWastagePercentage
      : input.customerWastagePercentage
  );

  const effectiveFinePurityPercentage = basePurityPercentage.plus(wastagePercentage);
  const fineWeight = roundWeight(
    billableWeight.times(effectiveFinePurityPercentage).dividedBy(100)
  );
  const fineGoldValue24k = roundPaise(fineWeight.times(fineGoldRate24k));

  // 9. Cost & Profit Calculation
  const costMethod = input.costMethod || "material";
  let cogs = new Decimal(0);
  let isEstimatedCost = false;

  if (costMethod === "actual") {
    cogs = roundPaise(toDecimal(input.actualCost));
  } else if (costMethod === "material") {
    const labour = toDecimal(input.artisanLabourCost);
    const stoneCost = toDecimal(input.stoneCost);
    // COGS = 24ct Fine Gold Value + Artisan Labour + Stone Cost
    cogs = roundPaise(fineGoldValue24k.plus(labour).plus(stoneCost));
  } else if (costMethod === "estimate") {
    isEstimatedCost = true;
    const estRate = toDecimal(input.estimatedCostRate);
    if (estRate.greaterThan(0)) {
      cogs = roundPaise(billableWeight.times(estRate));
    } else {
      cogs = fineGoldValue24k;
    }
  }

  // Gross profit = Net sale revenue - COGS
  const grossProfit = roundPaise(subtotalBeforeTax.minus(cogs));
  const grossMarginPercentage = subtotalBeforeTax.greaterThan(0)
    ? roundPaise(grossProfit.dividedBy(subtotalBeforeTax).times(100))
    : new Decimal(0);

  return {
    isValid: true,
    errors: [],
    grossWeight,
    stoneDeduction,
    billableWeight,
    purityFactor,
    effectiveRatePerGram,
    baseRatePerUnitDisplay,
    metalValue,
    makingCharges,
    customerWastageValue,
    stoneValue,
    discountValue,
    subtotalBeforeTax,
    gstValue,
    finalSellingPrice,

    // 24ct Fine Gold Accounting
    basePurityPercentage,
    wastagePercentage,
    effectiveFinePurityPercentage,
    fineWeight,
    fineGoldRate24k,
    fineGoldValue24k,

    cogs,
    grossProfit,
    grossMarginPercentage,
    costMethod,
    isEstimatedCost,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate pricing for a Silver jewellery item
 */
export function calculateSilverPricing(input: SilverCalculationInput): PricingCalculationResult {
  const errors: string[] = [];

  const grossWeight = roundWeight(toDecimal(input.grossWeight));
  const stoneDeduction = roundWeight(toDecimal(input.stoneDeduction));
  const billableWeight = grossWeight.minus(stoneDeduction);

  if (grossWeight.lessThanOrEqualTo(0)) {
    errors.push("Gross weight must be greater than zero");
  }
  if (billableWeight.lessThanOrEqualTo(0)) {
    errors.push("Billable weight must be greater than zero after stone deductions");
  }

  const rawSilverRate = toDecimal(input.silverRate);
  if (rawSilverRate.lessThanOrEqualTo(0)) {
    errors.push("Silver rate is required and must be greater than zero");
  }

  // Normalize rate to per gram
  let ratePerGram = new Decimal(0);
  let baseRatePerUnitDisplay = "";
  if (input.rateUnit === "per_g") {
    ratePerGram = rawSilverRate;
    baseRatePerUnitDisplay = `₹${rawSilverRate.toString()} / g`;
  } else if (input.rateUnit === "per_10g") {
    ratePerGram = rawSilverRate.dividedBy(10);
    baseRatePerUnitDisplay = `₹${rawSilverRate.toString()} / 10g`;
  } else if (input.rateUnit === "per_kg") {
    ratePerGram = rawSilverRate.dividedBy(1000);
    baseRatePerUnitDisplay = `₹${rawSilverRate.toString()} / kg`;
  }

  // Purity factor & base purity percentage
  let purityFactor = SILVER_PURITY_FACTORS[input.purityKey] || new Decimal(1.0);
  let basePurityPercentage = SILVER_BASE_PURITY_PERCENTAGES[input.purityKey] || new Decimal(100);

  if (input.purityKey === "custom" && input.customPurityPercentage !== undefined) {
    basePurityPercentage = toDecimal(input.customPurityPercentage);
    purityFactor = basePurityPercentage.dividedBy(100);
  }

  const effectiveRatePerGram = ratePerGram.times(purityFactor);

  if (errors.length > 0) {
    return createEmptyResult({
      isValid: false,
      errors,
      grossWeight,
      stoneDeduction,
      billableWeight,
      purityFactor,
      effectiveRatePerGram,
      baseRatePerUnitDisplay,
      costMethod: input.costMethod || "material",
    });
  }

  // 1. Metal Value = Billable Weight * RatePerGram * PurityFactor
  const metalValue = roundPaise(billableWeight.times(effectiveRatePerGram));

  // 2. Making Charges
  const makingType = input.makingType || "per_gram";
  const makingVal = toDecimal(input.makingValue);
  let makingCharges = new Decimal(0);

  if (makingType === "percentage") {
    makingCharges = roundPaise(metalValue.times(makingVal.dividedBy(100)));
  } else if (makingType === "per_gram") {
    makingCharges = roundPaise(billableWeight.times(makingVal));
  } else if (makingType === "fixed") {
    makingCharges = roundPaise(makingVal);
  }

  const customerWastageValue = new Decimal(0);

  // 4. Stone Value
  const stoneValue = roundPaise(toDecimal(input.stoneValue));

  // 5. Discount
  const discountInput = toDecimal(input.discount);
  let discountValue = new Decimal(0);
  if (input.discountType === "percentage") {
    const rawSubtotal = metalValue.plus(makingCharges).plus(stoneValue);
    discountValue = roundPaise(rawSubtotal.times(discountInput.dividedBy(100)));
  } else {
    discountValue = roundPaise(discountInput);
  }

  // 6. Subtotal before tax
  const subtotalBeforeTax = metalValue
    .plus(makingCharges)
    .plus(stoneValue)
    .minus(discountValue);

  // 7. GST
  const gstPct = toDecimal(input.gstPercentage);
  const gstValue = gstPct.greaterThan(0)
    ? roundPaise(subtotalBeforeTax.times(gstPct.dividedBy(100)))
    : new Decimal(0);

  const finalSellingPrice = roundRupee(subtotalBeforeTax.plus(gstValue));

  // 8. 999 Fine Silver Accounting
  const wastagePercentage = toDecimal(
    input.productionWastagePercentage !== undefined && input.productionWastagePercentage !== null && input.productionWastagePercentage !== ""
      ? input.productionWastagePercentage
      : input.customerWastagePercentage
  );

  const effectiveFinePurityPercentage = basePurityPercentage.plus(wastagePercentage);
  const fineWeight = roundWeight(
    billableWeight.times(effectiveFinePurityPercentage).dividedBy(100)
  );
  const fineGoldRate24k = ratePerGram; // Fine silver 999 rate per gram
  const fineGoldValue24k = roundPaise(fineWeight.times(fineGoldRate24k));

  // Cost & Profit
  const costMethod = input.costMethod || "material";
  let cogs = new Decimal(0);
  let isEstimatedCost = false;

  if (costMethod === "actual") {
    cogs = roundPaise(toDecimal(input.actualCost));
  } else if (costMethod === "material") {
    const labour = toDecimal(input.artisanLabourCost);
    const stoneCost = toDecimal(input.stoneCost);
    cogs = roundPaise(fineGoldValue24k.plus(labour).plus(stoneCost));
  } else if (costMethod === "estimate") {
    isEstimatedCost = true;
    const estRate = toDecimal(input.estimatedCostRate);
    cogs = estRate.greaterThan(0)
      ? roundPaise(billableWeight.times(estRate))
      : fineGoldValue24k;
  }

  const grossProfit = roundPaise(subtotalBeforeTax.minus(cogs));
  const grossMarginPercentage = subtotalBeforeTax.greaterThan(0)
    ? roundPaise(grossProfit.dividedBy(subtotalBeforeTax).times(100))
    : new Decimal(0);

  return {
    isValid: true,
    errors: [],
    grossWeight,
    stoneDeduction,
    billableWeight,
    purityFactor,
    effectiveRatePerGram,
    baseRatePerUnitDisplay,
    metalValue,
    makingCharges,
    customerWastageValue,
    stoneValue,
    discountValue,
    subtotalBeforeTax,
    gstValue,
    finalSellingPrice,

    basePurityPercentage,
    wastagePercentage,
    effectiveFinePurityPercentage,
    fineWeight,
    fineGoldRate24k,
    fineGoldValue24k,

    cogs,
    grossProfit,
    grossMarginPercentage,
    costMethod,
    isEstimatedCost,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Unified calculator entrypoint
 */
export function calculatePricing(input: PricingCalculationInput): PricingCalculationResult {
  if (input.metal === "gold") {
    return calculateGoldPricing(input);
  }
  return calculateSilverPricing(input);
}

function createEmptyResult(params: {
  isValid: boolean;
  errors: string[];
  grossWeight: Decimal;
  stoneDeduction: Decimal;
  billableWeight: Decimal;
  purityFactor: Decimal;
  effectiveRatePerGram: Decimal;
  baseRatePerUnitDisplay: string;
  costMethod: any;
}): PricingCalculationResult {
  return {
    isValid: params.isValid,
    errors: params.errors,
    grossWeight: params.grossWeight,
    stoneDeduction: params.stoneDeduction,
    billableWeight: params.billableWeight,
    purityFactor: params.purityFactor,
    effectiveRatePerGram: params.effectiveRatePerGram,
    baseRatePerUnitDisplay: params.baseRatePerUnitDisplay,
    metalValue: new Decimal(0),
    makingCharges: new Decimal(0),
    customerWastageValue: new Decimal(0),
    stoneValue: new Decimal(0),
    discountValue: new Decimal(0),
    subtotalBeforeTax: new Decimal(0),
    gstValue: new Decimal(0),
    finalSellingPrice: new Decimal(0),

    basePurityPercentage: new Decimal(0),
    wastagePercentage: new Decimal(0),
    effectiveFinePurityPercentage: new Decimal(0),
    fineWeight: new Decimal(0),
    fineGoldRate24k: new Decimal(0),
    fineGoldValue24k: new Decimal(0),

    cogs: new Decimal(0),
    grossProfit: new Decimal(0),
    grossMarginPercentage: new Decimal(0),
    costMethod: params.costMethod,
    isEstimatedCost: false,
    calculatedAt: new Date().toISOString(),
  };
}
