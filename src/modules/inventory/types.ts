import { GoldPurityKey, SilverPurityKey } from "../pricing/types";

export type JewelleryCategory =
  | "Chains"
  | "Bangles & Kadas"
  | "Rings"
  | "Necklaces & Sets"
  | "Earrings & Jhumkas"
  | "Mangalsutras"
  | "Pendants"
  | "Coins & Bullion"
  | "Silver Articles & Payal"
  | "Other";

export type StockStatus =
  | "in_showcase"
  | "in_vault"
  | "with_karigar"
  | "in_repair"
  | "reserved"
  | "sold"
  | "damaged"
  | "returned_to_supplier";

export interface StockItem {
  id: string;
  sku: string; // e.g. "CHN-18K-084"
  barcode: string; // Printable Code 128 barcode number, e.g. "8901840001"
  name: string;
  category: JewelleryCategory;
  metal: "gold" | "silver";
  purity: GoldPurityKey | SilverPurityKey;
  purityDisplay: string;
  
  // Exact Milligram Weight Accounting
  grossWeight: number; // in grams (e.g. 10.234)
  stoneWeight: number; // in grams (e.g. 0.400)
  otherDeductions?: number; // wax, enamel, dori/thread in grams
  netWeight: number;   // gross - stone - other deductions in grams
  fineWeight?: number; // Tunch equivalent fine weight in grams
  
  // Diamond & Gemstone Specifics
  diamondCarats?: number;
  diamondPieces?: number;
  diamondClarity?: string; // e.g. "VVS-EF", "VS-GH"
  
  // Commercial & Tray
  hsnCode?: string; // Standard "7113" for articles of jewellery
  acquisitionCost: number; // Wholesale purchase cost (strictly hidden from sales staff)
  defaultMakingType: "percentage" | "per_gram" | "fixed";
  defaultMakingValue: number;
  trayLocation: string; // e.g. "Tray #2 · Chains Display", "Safe Vault #1"
  supplierName?: string;
  status: StockStatus;
  dateAdded: string;
  huid?: string; // 6-digit alphanumeric BIS Hallmark Unique Identification code
  notes?: string;
}

export interface StockMovementRecord {
  id: string;
  stockItemId: string;
  sku: string;
  productName: string;
  fromStatus: StockStatus;
  toStatus: StockStatus;
  fromLocation?: string;
  toLocation?: string;
  reason: string;
  timestamp: string;
  performedById: string;
  performedByName: string;
  performedByRole: string;
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
