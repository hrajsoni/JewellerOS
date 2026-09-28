import Decimal from "decimal.js";

// Configure Decimal for financial precision
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
});

export { Decimal };

export function toDecimal(val: number | string | Decimal | undefined | null): Decimal {
  if (val === undefined || val === null || val === "") {
    return new Decimal(0);
  }
  try {
    return new Decimal(val);
  } catch {
    return new Decimal(0);
  }
}

export function roundPaise(val: Decimal): Decimal {
  return val.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

export function roundRupee(val: Decimal): Decimal {
  return val.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function roundWeight(val: Decimal): Decimal {
  return val.toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}
