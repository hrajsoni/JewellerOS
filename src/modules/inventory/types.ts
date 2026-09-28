import { GoldPurityKey, SilverPurityKey } from "../pricing/types";

export type JewelleryCategory =
  | "Chains"
  | "Bangles & Kadas"
  | "Rings"
  | "Necklaces & Sets"
  | "Earrings & Jhumkas"
  | "Mangalsutras"
  | "Coins & Bullion"
  | "Silver Articles & Payal"
  | "Other";

export type StockStatus = "in_showcase" | "in_vault" | "sold" | "workshop_repair";

export interface StockItem {
  id: string;
  sku: string; // e.g. "CHN-18K-084"
  barcode?: string;
  name: string;
  category: JewelleryCategory;
  metal: "gold" | "silver";
  purity: GoldPurityKey | SilverPurityKey;
  purityDisplay: string;
  grossWeight: number; // in grams
  stoneWeight: number; // in grams
  netWeight: number;   // billable weight in grams
  acquisitionCost: number; // what the shop paid wholesale
  defaultMakingType: "percentage" | "per_gram" | "fixed";
  defaultMakingValue: number;
  trayLocation: string; // e.g. "Tray #4 · Main Counter"
  supplierName?: string;
  status: StockStatus;
  dateAdded: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  city: string;
  gstin?: string;
  metalSupplied: "gold" | "silver" | "both";
  totalPurchasedGrams: number;
  outstandingBalance: number;
}
