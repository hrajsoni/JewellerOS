import {
  InvoiceLineItem,
  OldGoldExchangeItem,
  CustomerProfile,
  FinalizedInvoice,
  PaymentRecord,
  RestockDestination,
  SalesReturnItem,
  SalesReturnRecord,
} from "./types";
import { getSavedStock, saveStockItems, recordStockMovement } from "../inventory/store";
import { recordJournalPosting } from "../accounts/store";

const STORAGE_KEY = "jewellery_os_invoices_v2";

export interface InvoiceDraft {
  customer: CustomerProfile;
  items: InvoiceLineItem[];
  oldGoldExchange: OldGoldExchangeItem[];
  discountTotal: number;
  applyGst: boolean;
  gstPercentage: number;
  payments: PaymentRecord[];
}

export const INITIAL_DRAFT: InvoiceDraft = {
  customer: {
    id: "walkin",
    name: "Walk-in Counter Customer",
    phone: "+91 98290 12345",
    city: "Jaipur",
    gstin: "URP (Retail Consumer)",
  },
  items: [
    {
      id: "item-init-1",
      name: "18K Gold Chain",
      metal: "gold",
      purity: "18K",
      purityDisplay: "18K (75%)",
      grossWeight: 10.0,
      stoneWeight: 0,
      netWeight: 10.0,
      metalRate: 150000,
      effectiveRatePerGram: 11250,
      metalValue: 112500,
      makingType: "percentage",
      makingRate: 18,
      makingCharges: 20250,
      stoneValue: 0,
      discount: 0,
      totalBeforeTax: 132750,
      fineWeight: 8.1,
      fineGoldValue24k: 121500,
      wastagePercentage: 6,
    },
  ],
  oldGoldExchange: [],
  discountTotal: 0,
  applyGst: false,
  gstPercentage: 3,
  payments: [
    {
      method: "Cash",
      amount: 132750,
    },
  ],
};

const SEED_INVOICES: FinalizedInvoice[] = [
  {
    id: "inv-2026-0842",
    invoiceNumber: "INV-2026-0842",
    invoiceDate: "2026-09-28",
    createdAt: new Date().toISOString(),
    customer: {
      id: "cust-1",
      name: "Rameshwar Sharma",
      phone: "+91 98290 12345",
      city: "Jaipur, Rajasthan",
      gstin: "URP (Unregistered Person)",
    },
    items: [
      {
        id: "item-1",
        name: "18K Gold Chain",
        metal: "gold",
        purity: "18K",
        purityDisplay: "18K (75%)",
        grossWeight: 10.0,
        stoneWeight: 0,
        netWeight: 10.0,
        metalRate: 150000,
        effectiveRatePerGram: 11250,
        metalValue: 112500,
        makingType: "percentage",
        makingRate: 18,
        makingCharges: 20250,
        stoneValue: 0,
        discount: 0,
        totalBeforeTax: 132750,
        fineWeight: 8.1,
        fineGoldValue24k: 121500,
        wastagePercentage: 6,
      },
    ],
    itemsSubtotal: 132750,
    oldGoldTotalCredit: 0,
    discountTotal: 0,
    taxableAmount: 132750,
    gstPercentage: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalGst: 0,
    roundoff: 0,
    grandTotal: 132750,
    payments: [
      { method: "UPI", amount: 100000, transactionRef: "UPI/389102489" },
      { method: "Cash", amount: 32750 },
    ],
    totalPaid: 132750,
    balanceDue: 0,
    status: "paid",
    shopSnapshot: {
      name: "Sandhya Jewellers",
      address: "142 Sarafa Bazar, M.I. Road, Jaipur, RJ 302001",
      phone: "+91 94140 12345",
      gstin: "08AAAAJ1234F1Z8",
    },
  },
  {
    id: "inv-2026-0841",
    invoiceNumber: "INV-2026-0841",
    invoiceDate: "2026-09-28",
    createdAt: new Date().toISOString(),
    customer: {
      id: "cust-2",
      name: "Smt. Pooja Verma",
      phone: "+91 94140 98765",
      city: "Ajmer",
      gstin: "URP",
    },
    items: [
      {
        id: "item-2",
        name: "22K Solid Gold Bangle",
        metal: "gold",
        purity: "22K",
        purityDisplay: "22K (22/24)",
        grossWeight: 10.0,
        stoneWeight: 0,
        netWeight: 10.0,
        metalRate: 150000,
        effectiveRatePerGram: 13750,
        metalValue: 137500,
        makingType: "percentage",
        makingRate: 18,
        makingCharges: 24750,
        stoneValue: 0,
        discount: 0,
        totalBeforeTax: 162250,
        fineWeight: 9.767,
        fineGoldValue24k: 146500,
        wastagePercentage: 6,
      },
    ],
    itemsSubtotal: 162250,
    oldGoldTotalCredit: 0,
    discountTotal: 0,
    taxableAmount: 162250,
    gstPercentage: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    totalGst: 0,
    roundoff: 0,
    grandTotal: 162250,
    payments: [{ method: "Card", amount: 162250, transactionRef: "TXN-8849" }],
    totalPaid: 162250,
    balanceDue: 0,
    status: "paid",
    shopSnapshot: {
      name: "Sandhya Jewellers",
      address: "142 Sarafa Bazar, M.I. Road, Jaipur, RJ 302001",
      phone: "+91 94140 12345",
      gstin: "08AAAAJ1234F1Z8",
    },
  },
];

const inMemoryInvoicesCache: Record<string, string> = {};

function getInvoicesStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      return inMemoryInvoicesCache[key] ?? null;
    }
  }
  return inMemoryInvoicesCache[key] ?? null;
}

function setInvoicesStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
  inMemoryInvoicesCache[key] = value;
}

export function getTenantInvoiceStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_invoices` : STORAGE_KEY;
}

export function getSavedInvoices(tenantId?: string): FinalizedInvoice[] {
  try {
    const key = getTenantInvoiceStorageKey(tenantId);
    let raw = getInvoicesStorageItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getInvoicesStorageItem(getTenantInvoiceStorageKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      // Default tenant gets seed invoices; new tenants start with clean ledger
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? SEED_INVOICES : [];
      setInvoicesStorageItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_INVOICES;
  }
}

export function saveNewInvoice(invoice: FinalizedInvoice, tenantId?: string): void {
  try {
    const key = getTenantInvoiceStorageKey(tenantId);
    const list = getSavedInvoices(tenantId);
    const updated = [invoice, ...list];
    setInvoicesStorageItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save invoice to storage:", err);
  }
}

export function saveInvoicesDirect(invoices: FinalizedInvoice[], tenantId?: string): void {
  try {
    const key = getTenantInvoiceStorageKey(tenantId);
    setInvoicesStorageItem(key, JSON.stringify(invoices));
  } catch (err) {
    console.error("Failed to save invoices directly to storage:", err);
  }
}

export const inMemoryReturnsCache: Record<string, string> = {};

export function getTenantReturnsStorageKey(tenantId?: string): string {
  return `jewellery_os_tenant_${tenantId || "default"}_sales_returns_v1`;
}

export function getSalesReturns(tenantId?: string): SalesReturnRecord[] {
  const key = getTenantReturnsStorageKey(tenantId);
  try {
    let raw: string | null = null;
    if (typeof window !== "undefined") {
      raw = localStorage.getItem(key);
    } else {
      raw = inMemoryReturnsCache[key] || null;
    }
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSalesReturns(returns: SalesReturnRecord[], tenantId?: string): void {
  const key = getTenantReturnsStorageKey(tenantId);
  const serialized = JSON.stringify(returns);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.error("Failed to save sales returns to localStorage:", e);
    }
  } else {
    inMemoryReturnsCache[key] = serialized;
  }
}

export function generateCreditNoteNumber(tenantId?: string): string {
  const existing = getSalesReturns(tenantId);
  const count = existing.length + 1;
  const year = new Date().getFullYear();
  return `CRN-${year}-${String(count).padStart(3, "0")}`;
}

export function processSalesReturn(
  returnReq: {
    originalInvoiceNumber: string;
    returnedItems: SalesReturnItem[];
    totalRefundAmount: number;
    refundMethod: "Cash" | "UPI" | "Bank Transfer" | "Credit Note";
    notes?: string;
  },
  operator: { id: string; fullName: string; role: any },
  tenantId?: string
): { returnRecord: SalesReturnRecord; updatedInvoice?: FinalizedInvoice } {
  const invoices = getSavedInvoices(tenantId);
  const origInvoice = invoices.find((inv) => inv.invoiceNumber === returnReq.originalInvoiceNumber);

  const creditNoteNumber = generateCreditNoteNumber(tenantId);
  const returnRecord: SalesReturnRecord = {
    id: `return-${Date.now()}`,
    creditNoteNumber,
    originalInvoiceNumber: returnReq.originalInvoiceNumber,
    originalInvoiceId: origInvoice?.id,
    date: new Date().toISOString(),
    customer: origInvoice?.customer || {
      id: "walkin",
      name: "Retail Customer",
      phone: "+91 98290 00000",
    },
    returnedItems: returnReq.returnedItems,
    totalRefundAmount: returnReq.totalRefundAmount,
    refundMethod: returnReq.refundMethod,
    creditNoteBalance: returnReq.refundMethod === "Credit Note" ? returnReq.totalRefundAmount : 0,
    notes: returnReq.notes,
    processedBy: operator.fullName,
  };

  // 1. Save Return Record
  const existingReturns = getSalesReturns(tenantId);
  saveSalesReturns([returnRecord, ...existingReturns], tenantId);

  // 2. Restock items into inventory
  let stock = getSavedStock(tenantId);
  for (const retItem of returnReq.returnedItems) {
    if (retItem.stockItemId) {
      const targetStockItem = stock.find((s) => s.id === retItem.stockItemId);
      if (targetStockItem) {
        let nextStatus: any = "in_showcase";
        let nextLocation = targetStockItem.trayLocation || "Showcase Tray #1";

        if (retItem.restockDestination === "repair_vault") {
          nextStatus = "in_repair";
          nextLocation = "Repair Workshop Safe";
        } else if (retItem.restockDestination === "melting_scrap") {
          nextStatus = "in_vault";
          nextLocation = "Vault Safe #Melting Box";
        }

        stock = stock.map((s) =>
          s.id === retItem.stockItemId
            ? { ...s, status: nextStatus, trayLocation: nextLocation }
            : s
        );

        recordStockMovement(
          {
            stockItemId: targetStockItem.id,
            sku: targetStockItem.sku,
            productName: targetStockItem.name,
            fromStatus: targetStockItem.status,
            toStatus: nextStatus,
            fromLocation: "Customer Sales Return",
            toLocation: nextLocation,
            reason: `Sales Return on Invoice #${returnReq.originalInvoiceNumber} (Credit Note ${creditNoteNumber})`,
            performedById: operator.id,
            performedByName: operator.fullName,
            performedByRole: operator.role,
          },
          tenantId
        );
      }
    }
  }
  saveStockItems(stock, tenantId);

  // 3. Post double-entry reversal to Accounts
  try {
    const refundMode = returnReq.refundMethod;
    const isCreditNote = refundMode === "Credit Note";
    const creditAccount = isCreditNote
      ? { code: "2050", name: "Customer Credit Notes Payable" }
      : refundMode === "Bank Transfer"
      ? { code: "1020", name: "Current Bank Account (HDFC/SBI)" }
      : refundMode === "UPI"
      ? { code: "1030", name: "UPI Digital Settlement Float" }
      : { code: "1010", name: "Cash Drawer / Rokad (रोकड़)" };

    recordJournalPosting(
      {
        referenceType: "POS_SALE",
        referenceId: creditNoteNumber,
        narration: `Sales Return & Refund for Invoice #${returnReq.originalInvoiceNumber} · Credit Note ${creditNoteNumber}`,
        performedBy: operator.fullName,
        lines: [
          {
            accountCode: "3010",
            accountName: "Retail Sales Turnover",
            debit: returnReq.totalRefundAmount,
            credit: 0,
          },
          {
            accountCode: creditAccount.code,
            accountName: creditAccount.name,
            debit: 0,
            credit: returnReq.totalRefundAmount,
          },
        ],
      },
      tenantId
    );
  } catch (e) {
    console.warn("Could not post sales return journal voucher to accounts:", e);
  }

  return { returnRecord, updatedInvoice: origInvoice };
}



