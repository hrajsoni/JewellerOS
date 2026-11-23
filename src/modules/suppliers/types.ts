import { JewelleryCategory } from "../inventory/types";
import { GoldPurityKey, SilverPurityKey, MakingChargeType } from "../pricing/types";

export interface SupplierProfile {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  city: string;
  address?: string;
  gstin?: string;
  panNumber?: string;
  metalSupplied: "gold" | "silver" | "both";

  // Outstanding balances
  outstandingBalanceINR: number; // Positive = we owe supplier money, Negative = advance paid
  fineGoldBalanceGrams: number; // Bullion account ledger (grams of 24ct fine gold)
  fineSilverBalanceGrams: number; // Silver bullion ledger (grams of 999 fine silver)

  totalPurchasedINR: number;
  totalPurchasedGrams: number;
  lastPurchaseDate?: string;
  notes?: string;
}

export interface PurchaseItemInput {
  id?: string;
  description: string;
  category: JewelleryCategory;
  metal: "gold" | "silver";
  purity: GoldPurityKey | SilverPurityKey;
  purityDisplay: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  fineWeight: number; // Fine metal equivalent in 24ct / 999

  // Rate & Making
  metalRate: number; // e.g. ₹1,48,000 / 10g for gold, ₹92,000 / kg for silver
  metalValue: number;
  makingType: MakingChargeType;
  makingRate: number;
  makingCharges: number;
  stoneValue: number;
  subtotal: number;

  // Inventory destination
  trayLocation: string; // e.g. "Vault Safe #A", "Tray #2 · Chains Display"
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string; // Supplier Bill # e.g. "PUR-ZAV-8891"
  supplierId: string;
  supplierName: string;
  invoiceDate: string; // YYYY-MM-DD
  createdAt: string;

  items: PurchaseItemInput[];

  // Financial Totals
  itemsSubtotal: number;
  totalMaking: number;
  totalGst: number;
  grandTotal: number;

  // Settlement
  amountPaid: number;
  balanceDue: number; // Added to supplier's outstanding ledger
  paymentMethod: "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Bullion Settlement" | "Credit";
  paymentRef?: string;
  status: "paid" | "partial" | "pending";
  notes?: string;
}

export interface SupplierPaymentRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  method: "Cash" | "Bank Transfer" | "UPI" | "Cheque";
  referenceNo?: string; // UTR, Cheque No
  notes?: string;
}

export interface SupplierBullionSettlementRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  metal: "gold" | "silver";
  weightGrams: number;
  finePurityPercent: number; // e.g. 99.9%
  fineWeightGrams: number;
  referenceNo?: string; // Melting bar stamp or refinery receipt
  notes?: string;
}

export interface NewSupplierInput {
  name: string;
  contactPerson: string;
  phone: string;
  city: string;
  address?: string;
  gstin?: string;
  panNumber?: string;
  metalSupplied: "gold" | "silver" | "both";
  openingBalanceINR?: number;
  openingFineGoldGrams?: number;
  notes?: string;
}
