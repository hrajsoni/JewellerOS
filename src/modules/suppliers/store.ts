import {
  SupplierProfile,
  PurchaseInvoice,
  PurchaseItemInput,
  SupplierPaymentRecord,
  SupplierBullionSettlementRecord,
  NewSupplierInput,
} from "./types";
import { StockItem, StockStatus } from "../inventory/types";
import {
  getSavedStock,
  saveStockItems,
  recordStockMovement,
  generateSkuForCategory,
  generateBarcodeForIndex,
} from "../inventory/store";
import {
  postPurchaseToAccounts,
  postSupplierPaymentToAccounts,
} from "../accounts/store";

const SUPPLIERS_STORAGE_KEY = "jewellery_os_suppliers_v1";
const PURCHASES_STORAGE_KEY = "jewellery_os_purchases_v1";
const SUPPLIER_PAYMENTS_KEY = "jewellery_os_supplier_payments_v1";

export const INITIAL_SUPPLIER_PROFILES: SupplierProfile[] = [
  {
    id: "sup-zaveri",
    name: "Zaveri Bullion & Ornaments",
    contactPerson: "Dhirubhai Shah",
    phone: "+91 98200 11223",
    city: "Mumbai",
    address: "128 Kalbadevi Road, Zaveri Bazar",
    gstin: "27AAACZ1234F1Z1",
    metalSupplied: "gold",
    outstandingBalanceINR: 125000,
    fineGoldBalanceGrams: 50.0,
    fineSilverBalanceGrams: 0,
    totalPurchasedINR: 2450000,
    totalPurchasedGrams: 850.5,
    lastPurchaseDate: "2026-09-22",
    notes: "Primary supplier for 18K Italian hollow chains and 24K 999.9 PAMP bullion bars.",
  },
  {
    id: "sup-jaipur",
    name: "Jaipur Karigar Association",
    contactPerson: "Gopal Soni",
    phone: "+91 94140 33445",
    city: "Jaipur",
    address: "45 Johari Bazar",
    gstin: "08AAACJ5566G1Z9",
    metalSupplied: "gold",
    outstandingBalanceINR: 85000,
    fineGoldBalanceGrams: 24.2,
    fineSilverBalanceGrams: 0,
    totalPurchasedINR: 1890000,
    totalPurchasedGrams: 420.0,
    lastPurchaseDate: "2026-09-20",
    notes: "Specializes in traditional Kundan Meena, Jadau Rajputana necklaces, and handmade 22K solid bangles.",
  },
  {
    id: "sup-surat",
    name: "Surat Diamond Craft",
    contactPerson: "Nitin Patel",
    phone: "+91 99241 77889",
    city: "Surat",
    address: "Varachha Road, Mini Bazar",
    gstin: "24AABCS9988H1ZV",
    metalSupplied: "gold",
    outstandingBalanceINR: 0,
    fineGoldBalanceGrams: 0,
    fineSilverBalanceGrams: 0,
    totalPurchasedINR: 980000,
    totalPurchasedGrams: 115.0,
    lastPurchaseDate: "2026-09-15",
    notes: "Certified VVS-EF and VS-GH natural diamond studs, solitaire rings, and cocktail jewellery.",
  },
  {
    id: "sup-agra",
    name: "Royal Silver Guild",
    contactPerson: "Mahendra Jain",
    phone: "+91 98370 44556",
    city: "Agra",
    address: "Sarafa Bazar, Agra",
    gstin: "09AAACR3322K1Z4",
    metalSupplied: "silver",
    outstandingBalanceINR: 42000,
    fineGoldBalanceGrams: 0,
    fineSilverBalanceGrams: 1500.0,
    totalPurchasedINR: 650000,
    totalPurchasedGrams: 8500.0,
    lastPurchaseDate: "2026-09-10",
    notes: "925 hallmarked sterling silver utensils, dinner sets, antique payals, and Diwali pooja coins.",
  },
];

const inMemorySuppliersCache: Record<string, string> = {};

function getSuppliersStorageItem(key: string): string | null {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      return localStorage.getItem(key);
    } catch {
      return inMemorySuppliersCache[key] ?? null;
    }
  }
  return inMemorySuppliersCache[key] ?? null;
}

function setSuppliersStorageItem(key: string, value: string): void {
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  }
  inMemorySuppliersCache[key] = value;
}

function getTenantKey(base: string, tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_${base}` : base;
}

export function getSavedSuppliers(tenantId?: string): SupplierProfile[] {
  try {
    const key = getTenantKey(SUPPLIERS_STORAGE_KEY, tenantId);
    const raw = getSuppliersStorageItem(key);
    if (!raw) {
      setSuppliersStorageItem(key, JSON.stringify(INITIAL_SUPPLIER_PROFILES));
      return INITIAL_SUPPLIER_PROFILES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SUPPLIER_PROFILES;
  } catch {
    return INITIAL_SUPPLIER_PROFILES;
  }
}

export function saveSuppliers(suppliers: SupplierProfile[], tenantId?: string): void {
  try {
    const key = getTenantKey(SUPPLIERS_STORAGE_KEY, tenantId);
    setSuppliersStorageItem(key, JSON.stringify(suppliers));
  } catch (err) {
    console.error("Failed to save suppliers to storage:", err);
  }
}

export function addSupplier(input: NewSupplierInput, tenantId?: string): SupplierProfile {
  const current = getSavedSuppliers(tenantId);
  const newSupplier: SupplierProfile = {
    id: `sup-${Date.now()}`,
    name: input.name.trim(),
    contactPerson: input.contactPerson.trim(),
    phone: input.phone.trim(),
    city: input.city.trim(),
    address: input.address?.trim(),
    gstin: input.gstin?.trim(),
    panNumber: input.panNumber?.trim(),
    metalSupplied: input.metalSupplied,
    outstandingBalanceINR: input.openingBalanceINR || 0,
    fineGoldBalanceGrams: input.openingFineGoldGrams || 0,
    fineSilverBalanceGrams: 0,
    totalPurchasedINR: 0,
    totalPurchasedGrams: 0,
    notes: input.notes?.trim(),
  };

  const updated = [newSupplier, ...current];
  saveSuppliers(updated, tenantId);
  return newSupplier;
}

export function getSavedPurchases(tenantId?: string): PurchaseInvoice[] {
  try {
    const key = getTenantKey(PURCHASES_STORAGE_KEY, tenantId);
    const raw = getSuppliersStorageItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePurchases(purchases: PurchaseInvoice[], tenantId?: string): void {
  try {
    const key = getTenantKey(PURCHASES_STORAGE_KEY, tenantId);
    setSuppliersStorageItem(key, JSON.stringify(purchases));
  } catch (err) {
    console.error("Failed to save purchase invoices to storage:", err);
  }
}

export function getSavedSupplierPayments(tenantId?: string): SupplierPaymentRecord[] {
  try {
    const key = getTenantKey(SUPPLIER_PAYMENTS_KEY, tenantId);
    const raw = getSuppliersStorageItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSupplierPayments(payments: SupplierPaymentRecord[], tenantId?: string): void {
  try {
    const key = getTenantKey(SUPPLIER_PAYMENTS_KEY, tenantId);
    setSuppliersStorageItem(key, JSON.stringify(payments));
  } catch (err) {
    console.error("Failed to save supplier payments to storage:", err);
  }
}

/**
 * Atomic Purchase Inwarding:
 * 1. Creates a serialized physical StockItem for every line item in the purchase invoice
 * 2. Saves newly added stock to inventory with tray locations
 * 3. Records stock movements (Inwarded from Supplier)
 * 4. Logs the Purchase Invoice
 * 5. Updates Supplier ledger balance and purchased gram totals
 */
export function recordPurchaseInvoice(
  invoice: Omit<PurchaseInvoice, "id" | "createdAt">,
  user?: { id: string; fullName: string; role: string },
  tenantId?: string
): { invoice: PurchaseInvoice; updatedStock: StockItem[]; updatedSuppliers: SupplierProfile[] } {
  const purchaseId = `pur-${Date.now()}`;
  const now = new Date().toISOString();

  const fullInvoice: PurchaseInvoice = {
    ...invoice,
    id: purchaseId,
    createdAt: now,
  };

  // 1. Inward physical stock items
  const currentStock = getSavedStock(tenantId);
  const operator = user || {
    id: "system-purchase",
    fullName: "Purchase Receiving Desk",
    role: "MANAGER",
  };

  const newStockItems: StockItem[] = [];
  const currentCount = currentStock.length;

  invoice.items.forEach((item, index) => {
    const seq = currentCount + index + 1;
    const sku = generateSkuForCategory(item.category, item.purity, seq);
    const barcode = generateBarcodeForIndex(seq);
    const status: StockStatus = item.trayLocation.toLowerCase().includes("showcase")
      ? "in_showcase"
      : "in_vault";

    const stockItem: StockItem = {
      id: `stock-${Date.now()}-${index}`,
      sku,
      barcode,
      name: item.description,
      category: item.category,
      metal: item.metal,
      purity: item.purity,
      purityDisplay: item.purityDisplay || `${item.purity}`,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      otherDeductions: 0,
      netWeight: item.netWeight,
      fineWeight: Number(item.fineWeight.toFixed(3)),
      hsnCode: "7113",
      acquisitionCost: item.subtotal,
      defaultMakingType: item.makingType === "percentage" ? "percentage" : "per_gram",
      defaultMakingValue: item.makingRate,
      trayLocation: item.trayLocation,
      supplierName: invoice.supplierName,
      status,
      dateAdded: invoice.invoiceDate,
      notes: `Inwarded from ${invoice.supplierName} via Bill #${invoice.invoiceNumber}`,
    };

    recordStockMovement(
      {
        stockItemId: stockItem.id,
        sku: stockItem.sku,
        productName: stockItem.name,
        fromStatus: "in_vault",
        toStatus: status,
        fromLocation: `Supplier Inward (${invoice.supplierName})`,
        toLocation: item.trayLocation,
        reason: `Purchase Inward Bill #${invoice.invoiceNumber}`,
        performedById: operator.id,
        performedByName: operator.fullName,
        performedByRole: operator.role,
      },
      tenantId
    );

    newStockItems.push(stockItem);
  });

  const updatedStock = [...newStockItems, ...currentStock];
  saveStockItems(updatedStock, tenantId);

  // 2. Save Purchase Invoice
  const purchases = getSavedPurchases(tenantId);
  const updatedPurchases = [fullInvoice, ...purchases];
  savePurchases(updatedPurchases, tenantId);

  // 3. Update Supplier Ledger & Outstanding Dues
  const suppliers = getSavedSuppliers(tenantId);
  const totalGramsPurchased = invoice.items.reduce((sum, i) => sum + i.grossWeight, 0);

  const updatedSuppliers = suppliers.map((sup) => {
    if (sup.id === invoice.supplierId) {
      return {
        ...sup,
        outstandingBalanceINR: sup.outstandingBalanceINR + invoice.balanceDue,
        totalPurchasedINR: sup.totalPurchasedINR + invoice.grandTotal,
        totalPurchasedGrams: Number((sup.totalPurchasedGrams + totalGramsPurchased).toFixed(3)),
        lastPurchaseDate: invoice.invoiceDate,
      };
    }
    return sup;
  });

  saveSuppliers(updatedSuppliers, tenantId);

  // 4. Converge with Double-Entry Accounts Ledger
  postPurchaseToAccounts(
    {
      invoiceTotal: fullInvoice.grandTotal,
      paidAmount: fullInvoice.amountPaid,
      paymentMethod: fullInvoice.paymentMethod,
      invoiceNumber: fullInvoice.invoiceNumber,
      supplierName: fullInvoice.supplierName,
    },
    tenantId
  );

  return {
    invoice: fullInvoice,
    updatedStock,
    updatedSuppliers,
  };
}

/**
 * Record payment to a supplier
 */
export function recordSupplierPayment(
  payment: Omit<SupplierPaymentRecord, "id" | "date">,
  tenantId?: string
): { paymentRecord: SupplierPaymentRecord; updatedSuppliers: SupplierProfile[] } {
  const newPayment: SupplierPaymentRecord = {
    ...payment,
    id: `sup-pay-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
  };

  // 1. Save payment record
  const currentPayments = getSavedSupplierPayments(tenantId);
  saveSupplierPayments([newPayment, ...currentPayments], tenantId);

  // 2. Reduce supplier balance
  const suppliers = getSavedSuppliers(tenantId);
  let supplierName = "Wholesale Supplier";
  const updatedSuppliers = suppliers.map((sup) => {
    if (sup.id === payment.supplierId) {
      supplierName = sup.name;
      return {
        ...sup,
        outstandingBalanceINR: Math.max(0, sup.outstandingBalanceINR - payment.amount),
      };
    }
    return sup;
  });

  saveSuppliers(updatedSuppliers, tenantId);

  // 3. Converge with Double-Entry Accounts Ledger
  postSupplierPaymentToAccounts(
    {
      amount: newPayment.amount,
      paymentMethod: newPayment.method,
      supplierName,
      receiptNumber: newPayment.referenceNo,
    },
    tenantId
  );

  return {
    paymentRecord: newPayment,
    updatedSuppliers,
  };
}
