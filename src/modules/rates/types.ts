export type RateSource = "MANUAL" | "SARAFA_BOARD" | "API_FEED";

export interface MetalRateRecord {
  id: string;
  businessId: string;
  timestamp: string; // ISO 8601
  
  // Gold Retail Selling Rates (per 10 grams)
  gold24k: number;
  gold22k: number;
  gold18k: number;
  gold14k: number;

  // Gold Old-Metal Exchange / Buyback Rates (per 10 grams)
  goldPurchase24k: number;
  goldPurchase22k: number;
  goldPurchase18k: number;

  // Silver Rates (per 1 kg)
  silver999PerKg: number;
  silver925PerKg: number;
  silverPurchasePerKg: number;

  // Platinum (per gram)
  platinum950PerGram: number;

  // Audit attribution
  updatedById: string;
  updatedByName: string;
  updatedByRole: string;
  source: RateSource;
  notes?: string;
}

export interface UpdateMetalRatesInput {
  gold24k: number;
  gold22k?: number;
  gold18k?: number;
  gold14k?: number;

  goldPurchase24k?: number;
  goldPurchase22k?: number;
  goldPurchase18k?: number;

  silver999PerKg: number;
  silver925PerKg?: number;
  silverPurchasePerKg?: number;

  platinum950PerGram?: number;

  autoDerivePurities?: boolean;
  notes?: string;
}
