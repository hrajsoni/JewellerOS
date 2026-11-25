import { GoldPurityKey, SilverPurityKey, MakingChargeType } from "../pricing/types";

export interface InvoiceLineItem {
  id: string;
  stockItemId?: string; // Links back to serialized physical stock item
  sku?: string;
  barcode?: string;
  name: string;
  metal: "gold" | "silver";
  purity: GoldPurityKey | SilverPurityKey;
  purityDisplay: string;
  grossWeight: number;
  stoneWeight: number;
  netWeight: number;
  metalRate: number; // 24K rate or silver rate at time of sale
  effectiveRatePerGram: number;
  metalValue: number;
  makingType: MakingChargeType;
  makingRate: number;
  makingCharges: number;
  stoneValue: number;
  discount: number;
  totalBeforeTax: number;

  // 24ct Fine Gold snapshot
  fineWeight: number;
  fineGoldValue24k: number;
  wastagePercentage: number;
}

export interface OldGoldExchangeItem {
  id: string;
  description: string;
  metal: "gold" | "silver";
  grossWeight: number;
  stoneDeduction: number;
  netWeight: number;
  assessedPurityPercentage: number; // e.g. 85% or 91.6%
  fineWeight: number;
  currentRate24k: number;
  meltDeductionPercentage: number; // e.g. 2% or 0%
  totalExchangeCredit: number; // Deducted from invoice total
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  address?: string;
  city?: string;
  gstin?: string;
  panNumber?: string;
  aadhaarUid?: string;
}

export type PaymentMethod = "Cash" | "UPI" | "Card" | "Bank Transfer" | "Old Gold" | "Customer Credit";

export interface PaymentRecord {
  method: PaymentMethod;
  amount: number;
  transactionRef?: string;
}

export interface FinalizedInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string; // ISO string
  createdAt: string;
  customer: CustomerProfile;
  items: InvoiceLineItem[];
  oldGoldExchange?: OldGoldExchangeItem[];
  
  // Financial Totals
  itemsSubtotal: number;
  oldGoldTotalCredit: number;
  discountTotal: number;
  taxableAmount: number;
  gstPercentage: number; // e.g. 3
  cgstAmount: number;    // 1.5%
  sgstAmount: number;    // 1.5%
  totalGst: number;      // 3%
  roundoff: number;
  grandTotal: number;

  // Payments & Status
  payments: PaymentRecord[];
  totalPaid: number;
  balanceDue: number;
  status: "paid" | "partial" | "pending";

  // Shop Details Snapshot
  shopSnapshot: {
    name: string;
    address: string;
    phone: string;
    gstin: string;
  };
}

export type RestockDestination = "showcase" | "repair_vault" | "melting_scrap";

export interface SalesReturnItem {
  invoiceItemId: string;
  stockItemId?: string;
  barcode?: string;
  sku?: string;
  name: string;
  metal: "gold" | "silver";
  purity: string;
  grossWeight: number;
  netWeight: number;
  refundRatePerGram: number;
  returnedAmount: number;
  restockDestination: RestockDestination;
  reason: string;
}

export interface SalesReturnRecord {
  id: string;
  creditNoteNumber: string; // e.g. "CRN-2026-001"
  originalInvoiceNumber: string;
  originalInvoiceId?: string;
  date: string;
  customer: CustomerProfile;
  returnedItems: SalesReturnItem[];
  totalRefundAmount: number;
  refundMethod: "Cash" | "UPI" | "Bank Transfer" | "Credit Note";
  creditNoteBalance?: number;
  notes?: string;
  processedBy: string;
}

