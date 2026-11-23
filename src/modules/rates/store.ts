import { MetalRateRecord, UpdateMetalRatesInput } from "./types";
import { UserSession } from "../auth/types";

const RATES_STORAGE_KEY = "jewellery_os_active_metal_rates_v1";
const RATES_HISTORY_STORAGE_KEY = "jewellery_os_metal_rates_history_v1";

export function derivePuritiesFrom24k(gold24k: number): {
  gold22k: number;
  gold18k: number;
  gold14k: number;
} {
  return {
    gold22k: Math.round((gold24k / 24) * 22),
    gold18k: Math.round((gold24k / 24) * 18),
    gold14k: Math.round((gold24k / 24) * 14),
  };
}

export function deriveSilver925From999(silver999: number): number {
  return Math.round(silver999 * 0.925);
}

export const INITIAL_RATE_HISTORY: MetalRateRecord[] = [
  {
    id: "rate-jaipur-2026-11-23-eve",
    businessId: "tenant-sandhya-jaipur",
    timestamp: "2026-11-23T18:30:00.000Z",
    gold24k: 150000,
    gold22k: 137500,
    gold18k: 112500,
    gold14k: 87500,
    goldPurchase24k: 147500,
    goldPurchase22k: 135000,
    goldPurchase18k: 110000,
    silver999PerKg: 95000,
    silver925PerKg: 87875,
    silverPurchasePerKg: 92000,
    platinum950PerGram: 3650,
    updatedById: "user-harshit-owner",
    updatedByName: "Harshit Raj",
    updatedByRole: "OWNER",
    source: "SARAFA_BOARD",
    notes: "Jaipur Sarafa Bazar Evening Settlement",
  },
  {
    id: "rate-jaipur-2026-11-23-morn",
    businessId: "tenant-sandhya-jaipur",
    timestamp: "2026-11-23T10:15:00.000Z",
    gold24k: 149500,
    gold22k: 137042,
    gold18k: 112125,
    gold14k: 87208,
    goldPurchase24k: 147000,
    goldPurchase22k: 134500,
    goldPurchase18k: 109500,
    silver999PerKg: 94500,
    silver925PerKg: 87413,
    silverPurchasePerKg: 91500,
    platinum950PerGram: 3620,
    updatedById: "user-sunil-mgr",
    updatedByName: "Sunil Mehta",
    updatedByRole: "MANAGER",
    source: "SARAFA_BOARD",
    notes: "Opening Morning Board Rate",
  },
  {
    id: "rate-jaipur-2026-11-22",
    businessId: "tenant-sandhya-jaipur",
    timestamp: "2026-11-22T11:00:00.000Z",
    gold24k: 148800,
    gold22k: 136400,
    gold18k: 111600,
    gold14k: 86800,
    goldPurchase24k: 146500,
    goldPurchase22k: 134000,
    goldPurchase18k: 109000,
    silver999PerKg: 94000,
    silver925PerKg: 86950,
    silverPurchasePerKg: 91000,
    platinum950PerGram: 3600,
    updatedById: "user-harshit-owner",
    updatedByName: "Harshit Raj",
    updatedByRole: "OWNER",
    source: "MANUAL",
    notes: "Sunday Wedding Season Fixation",
  },
  {
    id: "rate-jaipur-2026-11-21",
    businessId: "tenant-sandhya-jaipur",
    timestamp: "2026-11-21T10:30:00.000Z",
    gold24k: 149200,
    gold22k: 136767,
    gold18k: 111900,
    gold14k: 87033,
    goldPurchase24k: 146800,
    goldPurchase22k: 134200,
    goldPurchase18k: 109200,
    silver999PerKg: 93800,
    silver925PerKg: 86765,
    silverPurchasePerKg: 90800,
    platinum950PerGram: 3590,
    updatedById: "user-sunil-mgr",
    updatedByName: "Sunil Mehta",
    updatedByRole: "MANAGER",
    source: "SARAFA_BOARD",
    notes: "Weekend Market Rate",
  },
];

export function getMetalRatesHistory(): MetalRateRecord[] {
  if (typeof window === "undefined") return INITIAL_RATE_HISTORY;
  try {
    const raw = localStorage.getItem(RATES_HISTORY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(RATES_HISTORY_STORAGE_KEY, JSON.stringify(INITIAL_RATE_HISTORY));
      return INITIAL_RATE_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_RATE_HISTORY;
  } catch {
    return INITIAL_RATE_HISTORY;
  }
}

export function getLatestMetalRates(): MetalRateRecord {
  const history = getMetalRatesHistory();
  return history[0] || INITIAL_RATE_HISTORY[0];
}

export function recordNewMetalRates(
  input: UpdateMetalRatesInput,
  session: UserSession
): { record: MetalRateRecord; error?: string } {
  if (input.gold24k <= 0 || input.silver999PerKg <= 0) {
    return {
      record: getLatestMetalRates(),
      error: "Metal rates must be positive numbers greater than 0.",
    };
  }

  // Derive purities if autoDerive is true or purities omitted
  const derived = derivePuritiesFrom24k(input.gold24k);
  const derivedSilver925 = deriveSilver925From999(input.silver999PerKg);

  const gold22k = input.gold22k && !input.autoDerivePurities ? input.gold22k : derived.gold22k;
  const gold18k = input.gold18k && !input.autoDerivePurities ? input.gold18k : derived.gold18k;
  const gold14k = input.gold14k && !input.autoDerivePurities ? input.gold14k : derived.gold14k;
  const silver925 = input.silver925PerKg && !input.autoDerivePurities ? input.silver925PerKg : derivedSilver925;

  // Defaults for purchase / buyback rates (standard ~1.5% margin below retail)
  const goldPurchase24k = input.goldPurchase24k || Math.round(input.gold24k * 0.983);
  const goldPurchase22k = input.goldPurchase22k || Math.round(gold22k * 0.982);
  const goldPurchase18k = input.goldPurchase18k || Math.round(gold18k * 0.98);
  const silverPurchasePerKg = input.silverPurchasePerKg || Math.round(input.silver999PerKg * 0.97);

  const newRecord: MetalRateRecord = {
    id: `rate-${Date.now()}`,
    businessId: session.businessId || "tenant-sandhya-jaipur",
    timestamp: new Date().toISOString(),
    gold24k: input.gold24k,
    gold22k,
    gold18k,
    gold14k,
    goldPurchase24k,
    goldPurchase22k,
    goldPurchase18k,
    silver999PerKg: input.silver999PerKg,
    silver925PerKg: silver925,
    silverPurchasePerKg,
    platinum950PerGram: input.platinum950PerGram || 3650,
    updatedById: session.id,
    updatedByName: session.fullName,
    updatedByRole: session.role,
    source: "MANUAL",
    notes: input.notes || "Live Showroom Board Adjustment",
  };

  if (typeof window !== "undefined") {
    try {
      const history = getMetalRatesHistory();
      const updatedHistory = [newRecord, ...history];
      localStorage.setItem(RATES_HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
      localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(newRecord));
    } catch (err) {
      console.error("Failed to persist updated metal rates:", err);
    }
  }

  return { record: newRecord };
}
