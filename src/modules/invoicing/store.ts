import {
  InvoiceLineItem,
  OldGoldExchangeItem,
  CustomerProfile,
  FinalizedInvoice,
  PaymentRecord,
} from "./types";

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

export function getTenantInvoiceStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_invoices` : STORAGE_KEY;
}

export function getSavedInvoices(tenantId?: string): FinalizedInvoice[] {
  if (typeof window === "undefined") return SEED_INVOICES;
  try {
    const key = getTenantInvoiceStorageKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantInvoiceStorageKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      // Default tenant gets seed invoices; new tenants start with clean ledger
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? SEED_INVOICES : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return SEED_INVOICES;
  }
}

export function saveNewInvoice(invoice: FinalizedInvoice, tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantInvoiceStorageKey(tenantId);
    const list = getSavedInvoices(tenantId);
    const updated = [invoice, ...list];
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save invoice to storage:", err);
  }
}
