import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateGoldPricing,
  calculateSilverPricing,
  calculatePricing,
} from "../../src/modules/pricing/engine";
import { Decimal } from "../../src/lib/decimal";

describe("JewelleryOS Financial Pricing Engine Acceptance Tests", () => {
  it("Test 1: 10g, 18K, ₹1,50,000/10g, 0% making => ₹1,12,500", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "18K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 0,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.metalValue.toNumber(), 112500);
    assert.equal(result.makingCharges.toNumber(), 0);
    assert.equal(result.finalSellingPrice.toNumber(), 112500);
  });

  it("Test 2: 10g, 18K, ₹1,50,000/10g, 18% making => ₹1,32,750", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "18K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 18,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.metalValue.toNumber(), 112500);
    assert.equal(result.makingCharges.toNumber(), 20250);
    assert.equal(result.subtotalBeforeTax.toNumber(), 132750);
    assert.equal(result.finalSellingPrice.toNumber(), 132750);
  });

  it("Test 3: 10g, 18K, ₹1,50,000/10g, ₹500/g making => ₹1,17,500", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "18K",
      rate24kPer10g: 150000,
      makingType: "per_gram",
      makingValue: 500,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.metalValue.toNumber(), 112500);
    assert.equal(result.makingCharges.toNumber(), 5000); // 10g * 500
    assert.equal(result.subtotalBeforeTax.toNumber(), 117500);
    assert.equal(result.finalSellingPrice.toNumber(), 117500);
  });

  it("Test 4: 10g, 22K (150000 / 24 * 22), no making => ₹1,37,500", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "22K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 0,
    });

    assert.equal(result.isValid, true);
    // 10g * (150000/24 * 22 / 10) = 137500
    assert.equal(result.metalValue.toNumber(), 137500);
    assert.equal(result.finalSellingPrice.toNumber(), 137500);
  });

  it("Test 4b (From Harshit's Shop Notebook): 10g 22K with 18% making => ₹1,62,250", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "22K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 18,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.metalValue.toNumber(), 137500); // 13750 * 10 = 137500
    assert.equal(result.makingCharges.toNumber(), 24750); // 137500 * 18% = 24750
    assert.equal(result.subtotalBeforeTax.toNumber(), 162250); // 137500 + 24750 = 162250
    assert.equal(result.finalSellingPrice.toNumber(), 162250);
  });

  it("Test 5: 10g, 23K at 95.8333%, no making => Approximately ₹1,43,750", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "23K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 0,
    });

    assert.equal(result.isValid, true);
    // 10 * (150000 / 10) * (23 / 24) = 143750.00
    assert.equal(result.metalValue.toNumber(), 143750);
    assert.equal(result.finalSellingPrice.toNumber(), 143750);
  });

  it("Test 6: Zero or negative weight validated appropriately", () => {
    const zeroWeight = calculateGoldPricing({
      metal: "gold",
      grossWeight: 0,
      purityKey: "22K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 12,
    });
    assert.equal(zeroWeight.isValid, false);
    assert.ok(zeroWeight.errors.some((e) => e.includes("Gross weight must be greater than zero")));

    const negativeWeight = calculateGoldPricing({
      metal: "gold",
      grossWeight: -5.5,
      purityKey: "22K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 12,
    });
    assert.equal(negativeWeight.isValid, false);
  });

  it("Test 7: Missing rate is marked incomplete or blocked", () => {
    const missingRate = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "22K",
      rate24kPer10g: 0,
      makingType: "percentage",
      makingValue: 12,
    });
    assert.equal(missingRate.isValid, false);
    assert.ok(missingRate.errors.some((e) => e.includes("rate is required")));
  });

  it("Test 8: Stone deduction reduces billable weight correctly", () => {
    // 12.5g gross - 2.5g stone deduction = 10g billable
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 12.5,
      stoneDeduction: 2.5,
      purityKey: "18K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 18,
      stoneValue: 3500, // separate stone price
    });

    assert.equal(result.isValid, true);
    assert.equal(result.billableWeight.toNumber(), 10.0);
    assert.equal(result.metalValue.toNumber(), 112500);
    assert.equal(result.makingCharges.toNumber(), 20250);
    assert.equal(result.stoneValue.toNumber(), 3500);
    // Subtotal = 112500 + 20250 + 3500 = 136250
    assert.equal(result.subtotalBeforeTax.toNumber(), 136250);
  });

  it("Test 9: Cost wastage does NOT silently change customer selling price", () => {
    const baseInput = {
      metal: "gold" as const,
      grossWeight: 10,
      purityKey: "18K" as const,
      rate24kPer10g: 150000,
      makingType: "percentage" as const,
      makingValue: 18,
      costMethod: "material" as const,
    };

    const run1 = calculateGoldPricing({
      ...baseInput,
      productionWastagePercentage: 0,
    });

    const run2 = calculateGoldPricing({
      ...baseInput,
      productionWastagePercentage: 4, // 4% internal workshop loss
    });

    // Customer selling price MUST remain identical: ₹1,32,750
    assert.equal(run1.subtotalBeforeTax.toNumber(), 132750);
    assert.equal(run2.subtotalBeforeTax.toNumber(), 132750);
    assert.equal(run1.finalSellingPrice.toNumber(), 132750);
    assert.equal(run2.finalSellingPrice.toNumber(), 132750);

    // But shop COGS must reflect the 4% loss, reducing gross profit
    assert.ok(run2.cogs.greaterThan(run1.cogs));
    assert.ok(run2.grossProfit.lessThan(run1.grossProfit));
  });

  it("Test 10: Silver calculator with per_kg normalization and 925 purity", () => {
    // Silver rate: ₹95,000 / kg -> ₹95.00 / g
    // Weight: 50g, 925 purity (0.925)
    // Metal value = 50 * 95 * 0.925 = ₹4,393.75
    // Making: ₹15 / g -> 50 * 15 = ₹750
    // Total selling price before tax = 4393.75 + 750 = ₹5,143.75 -> rounded to ₹5,144
    const result = calculateSilverPricing({
      metal: "silver",
      grossWeight: 50,
      purityKey: "925",
      silverRate: 95000,
      rateUnit: "per_kg",
      makingType: "per_gram",
      makingValue: 15,
    });

    assert.equal(result.isValid, true);
    assert.equal(result.metalValue.toNumber(), 4393.75);
    assert.equal(result.makingCharges.toNumber(), 750);
    assert.equal(result.subtotalBeforeTax.toNumber(), 5143.75);
    assert.equal(result.finalSellingPrice.toNumber(), 5144);
  });

  it("Test 11: Gross profit and gross margin arithmetic is exact", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "18K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 18,
      costMethod: "actual",
      actualCost: 110000, // Shop bought item for ₹1,10,000
    });

    // Net revenue = 132,750
    // COGS = 110,000
    // Gross Profit = 132,750 - 110,000 = 22,750
    // Gross Margin % = (22,750 / 132,750) * 100 = 17.137... => 17.14%
    assert.equal(result.grossProfit.toNumber(), 22750);
    assert.equal(result.grossMarginPercentage.toNumber(), 17.14);
  });

  it("Test 12: Harshit's Counter Formula: 10g 18K + 6% wastage => 81% fine (8.1g @ 24K rate = ₹1,21,500), customer price remains ₹1,32,750", () => {
    const result = calculateGoldPricing({
      metal: "gold",
      grossWeight: 10,
      purityKey: "18K",
      rate24kPer10g: 150000,
      makingType: "percentage",
      makingValue: 18,
      productionWastagePercentage: 6, // 6% wastage entered at the bottom
    });

    // 1. Customer counter selling price MUST remain exactly ₹1,32,750 (112500 + 20250)
    assert.equal(result.metalValue.toNumber(), 112500);
    assert.equal(result.makingCharges.toNumber(), 20250);
    assert.equal(result.subtotalBeforeTax.toNumber(), 132750);
    assert.equal(result.finalSellingPrice.toNumber(), 132750);

    // 2. Fine gold calculation at the bottom:
    // Base 18K = 75, Wastage = 6 => Effective Fine Purity = 75 + 6 = 81%
    assert.equal(result.basePurityPercentage.toNumber(), 75);
    assert.equal(result.wastagePercentage.toNumber(), 6);
    assert.equal(result.effectiveFinePurityPercentage.toNumber(), 81);

    // Fine gold weight = 10 * 81 / 100 = 8.100g
    assert.equal(result.fineWeight.toNumber(), 8.1);

    // Rate as per 24ct: ₹1,50,000 / 10g = ₹15,000 / g
    assert.equal(result.fineGoldRate24k.toNumber(), 15000);

    // Fine gold value @ 24ct = 8.1g * ₹15,000 = ₹1,21,500
    assert.equal(result.fineGoldValue24k.toNumber(), 121500);

    // Shop gross profit over 24ct fine gold basis = 132750 - 121500 = ₹11,250
    assert.equal(result.grossProfit.toNumber(), 11250);
  });
});
