import { Decimal, toDecimal } from "./decimal";

/**
 * Format a number/Decimal to Indian Rupee currency format (e.g., ₹1,32,750 or ₹1,50,000.00)
 */
export function formatINR(
  amount: number | string | Decimal,
  options: {
    showSymbol?: boolean;
    decimals?: number;
  } = {}
): string {
  const { showSymbol = true, decimals = 0 } = options;
  const dec = toDecimal(amount);
  const isNegative = dec.isNegative();
  const absDec = dec.abs();

  const rounded = absDec.toFixed(decimals);
  const [integerPart, decimalPart] = rounded.split(".");

  // Format integerPart according to Indian numbering system (3 digits, then 2, 2, 2...)
  let lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInteger =
    otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  const sign = isNegative ? "- " : "";
  const symbol = showSymbol ? "₹" : "";
  const decimalString = decimals > 0 && decimalPart ? `.${decimalPart}` : "";

  return `${sign}${symbol}${formattedInteger}${decimalString}`;
}

/**
 * Format weights in grams with standard 3 decimal places (e.g., 10.450 g)
 */
export function formatGrams(weight: number | string | Decimal, decimals: number = 3): string {
  const dec = toDecimal(weight);
  return `${dec.toFixed(decimals)} g`;
}

/**
 * Format percentage with up to 2 decimal places (e.g., 18% or 91.6%)
 */
export function formatPercentage(val: number | string | Decimal): string {
  const dec = toDecimal(val);
  // remove trailing zeroes if clean
  return `${dec.toNumber().toFixed(2).replace(/\.00$/, "").replace(/(\.[0-9])0$/, "$1")}%`;
}
