import {
  ConsignmentMemo,
  ConsignmentMemoItem,
  CreateConsignmentMemoInput,
  B2BPartnerProfile,
  MemoStatus,
} from "./types";
import { getSavedStock, saveStockItems, recordStockMovement } from "../inventory/store";
import { InvoiceLineItem, FinalizedInvoice } from "../invoicing/types";
import { saveNewInvoice } from "../invoicing/store";
import { postInvoiceToAccounts } from "../accounts/store";

const MEMOS_STORAGE_KEY = "jewellery_os_memos_v1";
const PARTNERS_STORAGE_KEY = "jewellery_os_b2b_partners_v1";

export const INITIAL_B2B_PARTNERS: B2BPartnerProfile[] = [
  {
    id: "b2b-1",
    businessName: "Radha Govind Jewellers",
    contactPerson: "Ghanshyam Soni",
    phone: "+91 94140 88221",
    city: "Alwar",
    address: "Sarafa Bazar, Alwar",
    gstin: "08AABCR1234F1Z3",
    totalMemoCount: 4,
    activeMemoValue: 485000,
    totalPurchasedValue: 2450000,
    notes: "Trusted B2B retail partner for lightweight machine bangles and casting chains.",
  },
  {
    id: "b2b-2",
    businessName: "Shree Ram Jewellers",
    contactPerson: "Rameshwar Dayal",
    phone: "+91 98290 66334",
    city: "Kota",
    address: "Rampura Bazar, Kota",
    gstin: "08AABCS9876G1Z8",
    totalMemoCount: 2,
    activeMemoValue: 0,
    totalPurchasedValue: 1850000,
    notes: "Regular wholesale buyer for 925 sterling silver utensils and gift articles.",
  },
  {
    id: "b2b-3",
    businessName: "Mahalaxmi Ornaments",
    contactPerson: "Dileep Soni",
    phone: "+91 97841 22990",
    city: "Bikaner",
    address: "Kote Gate, Bikaner",
    gstin: "08AABCM5432H1Z5",
    totalMemoCount: 3,
    activeMemoValue: 320000,
    totalPurchasedValue: 3100000,
    notes: "Specializes in antique finish temple jewellery and Jadau sets.",
  },
];

export const INITIAL_MEMOS: ConsignmentMemo[] = [
  {
    id: "memo-101",
    memoNumber: "MEMO-2026-001",
    jewellerPartnerName: "Radha Govind Jewellers",
    jewellerPhone: "+91 94140 88221",
    jewellerCity: "Alwar",
    jewellerGstin: "08AABCR1234F1Z3",
    issueDate: "2026-11-22",
    validUntilDate: "2026-11-29",
    items: [
      {
        id: "mitem-1",
        stockItemId: "stock-4",
        sku: "NCK-22K-029",
        name: "22K Royal Rajputana Bridal Choker Set",
        category: "Necklace",
        metal: "gold",
        purity: "22K (916)",
        grossWeight: 42.5,
        netWeight: 42.5,
        fineWeight: 38.96,
        wholesaleRate: 11300,
        totalValue: 480250,
        status: "on_memo",
      },
      {
        id: "mitem-2",
        name: "22K Handcrafted Solid Bangle Set (2 pcs)",
        category: "Bangles & Kadas",
        metal: "gold",
        purity: "22K (916)",
        grossWeight: 26.2,
        netWeight: 26.2,
        fineWeight: 24.02,
        wholesaleRate: 11250,
        totalValue: 294750,
        status: "on_memo",
      },
    ],
    totalPieces: 2,
    totalGrossWeight: 68.7,
    totalNetWeight: 68.7,
    totalFineWeight: 62.98,
    totalEstimatedValue: 775000,
    status: "active_issued",
    notes: "Customer wedding inspection in Alwar showroom. 7-day memo term.",
    createdAt: "2026-11-22T10:00:00.000Z",
    updatedAt: "2026-11-22T10:00:00.000Z",
  },
];

const inMemoryCache: Record<string, string> = {};

function getItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return inMemoryCache[key] ?? null;
}

function setItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch {}
  } else {
    inMemoryCache[key] = value;
  }
}

export function getTenantMemosKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_memos` : MEMOS_STORAGE_KEY;
}

export function getTenantPartnersKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_b2b_partners` : PARTNERS_STORAGE_KEY;
}

export function getSavedMemos(tenantId?: string): ConsignmentMemo[] {
  try {
    const key = getTenantMemosKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantMemosKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_MEMOS.map((m) => ({ ...m }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MEMOS;
  }
}

export function saveMemos(memos: ConsignmentMemo[], tenantId?: string): void {
  try {
    const key = getTenantMemosKey(tenantId);
    setItem(key, JSON.stringify(memos));
  } catch (err) {
    console.error("Failed to save memos:", err);
  }
}

export function getSavedB2BPartners(tenantId?: string): B2BPartnerProfile[] {
  try {
    const key = getTenantPartnersKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantPartnersKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_B2B_PARTNERS.map((p) => ({ ...p }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_B2B_PARTNERS;
  }
}

export function saveB2BPartners(partners: B2BPartnerProfile[], tenantId?: string): void {
  try {
    const key = getTenantPartnersKey(tenantId);
    setItem(key, JSON.stringify(partners));
  } catch (err) {
    console.error("Failed to save B2B partners:", err);
  }
}

export function createConsignmentMemo(
  input: CreateConsignmentMemoInput,
  tenantId?: string
): ConsignmentMemo {
  const existing = getSavedMemos(tenantId);
  const nextNum = existing.length + 1;
  const memoNumber = `MEMO-2026-${String(nextNum).padStart(3, "0")}`;

  const now = new Date();
  const validDays = input.validDays || 7;
  const validUntil = new Date(now.getTime() + validDays * 86400000);

  const memoItems: ConsignmentMemoItem[] = input.items.map((item, idx) => ({
    id: `mitem-${Date.now()}-${idx}`,
    stockItemId: item.stockItemId,
    sku: item.sku,
    barcode: item.barcode,
    name: item.name,
    category: item.category,
    metal: item.metal,
    purity: item.purity,
    grossWeight: item.grossWeight,
    netWeight: item.netWeight,
    fineWeight: item.fineWeight,
    wholesaleRate: item.wholesaleRate,
    totalValue: item.totalValue,
    status: "on_memo",
  }));

  const totalGrossWeight = memoItems.reduce((sum, i) => sum + i.grossWeight, 0);
  const totalNetWeight = memoItems.reduce((sum, i) => sum + i.netWeight, 0);
  const totalFineWeight = memoItems.reduce((sum, i) => sum + i.fineWeight, 0);
  const totalEstimatedValue = memoItems.reduce((sum, i) => sum + i.totalValue, 0);

  const newMemo: ConsignmentMemo = {
    id: `memo-${Date.now()}`,
    memoNumber,
    jewellerPartnerName: input.jewellerPartnerName.trim(),
    jewellerPhone: input.jewellerPhone.trim(),
    jewellerCity: input.jewellerCity?.trim() || "Jaipur",
    jewellerGstin: input.jewellerGstin?.trim() || undefined,
    issueDate: now.toISOString().split("T")[0],
    validUntilDate: validUntil.toISOString().split("T")[0],
    items: memoItems,
    totalPieces: memoItems.length,
    totalGrossWeight: Math.round(totalGrossWeight * 1000) / 1000,
    totalNetWeight: Math.round(totalNetWeight * 1000) / 1000,
    totalFineWeight: Math.round(totalFineWeight * 1000) / 1000,
    totalEstimatedValue,
    status: "active_issued",
    notes: input.notes?.trim() || undefined,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const updatedMemos = [newMemo, ...existing];
  saveMemos(updatedMemos, tenantId);

  // If items came from stock, transition their inventory location to on_memo
  const stockItems = getSavedStock(tenantId);
  let stockUpdated = false;
  const updatedStock = stockItems.map((item) => {
    const matched = memoItems.find((mi) => mi.stockItemId === item.id || (mi.sku && mi.sku === item.sku));
    if (matched) {
      stockUpdated = true;
      recordStockMovement(
        {
          stockItemId: item.id,
          sku: item.sku,
          productName: item.name,
          fromStatus: item.status,
          toStatus: "in_vault",
          fromLocation: item.trayLocation,
          toLocation: `On Approval Memo: ${newMemo.jewellerPartnerName} (${newMemo.memoNumber})`,
          reason: `Dispatched on consignment memo ${newMemo.memoNumber} (Expected return: ${newMemo.validUntilDate})`,
          performedById: "system-wholesale",
          performedByName: "Wholesale Despatch Desk",
          performedByRole: "Wholesale Manager",
        },
        tenantId
      );
      return {
        ...item,
        trayLocation: `On Approval Memo: ${newMemo.jewellerPartnerName} (${newMemo.memoNumber})`,
      };
    }
    return item;
  });

  if (stockUpdated) {
    saveStockItems(updatedStock, tenantId);
  }

  return newMemo;
}

export function returnMemoItems(
  memoId: string,
  itemIds: string[],
  tenantId?: string
): ConsignmentMemo | null {
  const memos = getSavedMemos(tenantId);
  let updatedMemo: ConsignmentMemo | null = null;

  const nowStr = new Date().toISOString();
  const updatedMemos = memos.map((m) => {
    if (m.id === memoId) {
      const updatedItems = m.items.map((i) => {
        if (itemIds.includes(i.id)) {
          return {
            ...i,
            status: "returned_to_stock" as const,
            returnedAt: nowStr,
          };
        }
        return i;
      });

      const allReturned = updatedItems.every((i) => i.status === "returned_to_stock");
      const someReturned = updatedItems.some((i) => i.status === "returned_to_stock");
      const someSold = updatedItems.some((i) => i.status === "sold_billed");

      let status: MemoStatus = m.status;
      if (allReturned) {
        status = "fully_returned";
      } else if (someReturned || someSold) {
        status = "partially_settled";
      }

      updatedMemo = {
        ...m,
        items: updatedItems,
        status,
        updatedAt: nowStr,
      };
      return updatedMemo;
    }
    return m;
  });

  if (updatedMemo) {
    saveMemos(updatedMemos, tenantId);

    // Re-inward physical items back into stock showcase
    const memo = updatedMemo as ConsignmentMemo;
    const stockItems = getSavedStock(tenantId);
    let stockChanged = false;
    const restoredStock = stockItems.map((item) => {
      const matched = memo.items.find(
        (mi) => itemIds.includes(mi.id) && (mi.stockItemId === item.id || mi.sku === item.sku)
      );
      if (matched) {
        stockChanged = true;
        recordStockMovement(
          {
            stockItemId: item.id,
            sku: item.sku,
            productName: item.name,
            fromStatus: item.status,
            toStatus: "in_showcase",
            fromLocation: item.trayLocation,
            toLocation: "Showcase Shelf #1 (Returned from Memo)",
            reason: `Returned from memo ${memo.memoNumber} - Inspected and restored to showcase`,
            performedById: "system-wholesale",
            performedByName: "Wholesale Inward Desk",
            performedByRole: "Wholesale Manager",
          },
          tenantId
        );
        return {
          ...item,
          status: "in_showcase" as const,
          trayLocation: "Showcase Shelf #1",
        };
      }
      return item;
    });

    if (stockChanged) {
      saveStockItems(restoredStock, tenantId);
    }
  }

  return updatedMemo;
}

export function convertMemoToInvoice(
  memoId: string,
  soldItemIds: string[],
  invoiceNumber: string,
  tenantId?: string
): ConsignmentMemo | null {
  const memos = getSavedMemos(tenantId);
  let updatedMemo: ConsignmentMemo | null = null;
  const nowStr = new Date().toISOString();

  const updatedMemos = memos.map((m) => {
    if (m.id === memoId) {
      const updatedItems = m.items.map((i) => {
        if (soldItemIds.includes(i.id)) {
          return {
            ...i,
            status: "sold_billed" as const,
          };
        }
        return i;
      });

      const allSold = updatedItems.every((i) => i.status === "sold_billed");
      const someSold = updatedItems.some((i) => i.status === "sold_billed");

      let status: MemoStatus = m.status;
      if (allSold) {
        status = "fully_converted_invoice";
      } else if (someSold) {
        status = "partially_settled";
      }

      updatedMemo = {
        ...m,
        items: updatedItems,
        status,
        convertedInvoiceNumber: invoiceNumber,
        updatedAt: nowStr,
      };
      return updatedMemo;
    }
    return m;
  });

  if (updatedMemo) {
    saveMemos(updatedMemos, tenantId);

    // Transition sold items in inventory to "sold"
    const memo = updatedMemo as ConsignmentMemo;
    const stockItems = getSavedStock(tenantId);
    let stockChanged = false;
    const updatedStock = stockItems.map((item) => {
      const matched = memo.items.find(
        (mi) => soldItemIds.includes(mi.id) && (mi.stockItemId === item.id || mi.sku === item.sku)
      );
      if (matched) {
        stockChanged = true;
        return {
          ...item,
          status: "sold" as const,
          trayLocation: `Wholesale Billed / Delivered (${invoiceNumber})`,
        };
      }
      return item;
    });

    if (stockChanged) {
      saveStockItems(updatedStock, tenantId);
    }

    // Converge with Sales Invoices & Double-Entry Accounting
    const soldMemoItems = memo.items.filter((i) => soldItemIds.includes(i.id));
    const lineItems: InvoiceLineItem[] = soldMemoItems.map((mi) => ({
      id: `line-${mi.id}`,
      stockItemId: mi.stockItemId,
      sku: mi.sku,
      barcode: mi.barcode,
      name: mi.name,
      metal: mi.metal,
      purity: mi.purity.includes("18K") ? "18K" : "22K",
      purityDisplay: mi.purity,
      grossWeight: mi.grossWeight,
      stoneWeight: 0,
      netWeight: mi.netWeight,
      metalRate: mi.wholesaleRate,
      effectiveRatePerGram: Math.round(mi.wholesaleRate / 10),
      metalValue: mi.totalValue,
      makingType: "fixed",
      makingRate: 0,
      makingCharges: 0,
      stoneValue: 0,
      discount: 0,
      totalBeforeTax: mi.totalValue,
      fineWeight: mi.fineWeight,
      fineGoldValue24k: mi.totalValue,
      wastagePercentage: 0,
    }));

    const itemsSubtotal = lineItems.reduce((sum, item) => sum + item.totalBeforeTax, 0);
    const gstPercentage = memo.jewellerGstin ? 3 : 0;
    const totalGst = Math.round(itemsSubtotal * (gstPercentage / 100));
    const cgstAmount = Math.round(totalGst / 2);
    const sgstAmount = totalGst - cgstAmount;
    const grandTotal = itemsSubtotal + totalGst;

    const finalizedInvoice: FinalizedInvoice = {
      id: `inv-wh-${Date.now()}`,
      invoiceNumber,
      invoiceDate: new Date().toISOString().split("T")[0],
      createdAt: nowStr,
      customer: {
        id: `b2b-${memo.jewellerPartnerName.toLowerCase().replace(/\s+/g, "-")}`,
        name: memo.jewellerPartnerName,
        phone: memo.jewellerPhone,
        city: memo.jewellerCity,
        gstin: memo.jewellerGstin || "URP (Wholesale B2B Partner)",
      },
      items: lineItems,
      itemsSubtotal,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: itemsSubtotal,
      gstPercentage,
      cgstAmount,
      sgstAmount,
      totalGst,
      roundoff: 0,
      grandTotal,
      payments: [
        {
          method: "Customer Credit",
          amount: grandTotal,
          transactionRef: `Wholesale Memo ${memo.memoNumber}`,
        },
      ],
      totalPaid: grandTotal,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: "Sandhya Jewellers",
        address: "142 Sarafa Bazar, M.I. Road, Jaipur, RJ 302001",
        phone: "+91 94140 12345",
        gstin: "08AAAAJ1234F1Z8",
      },
    };

    saveNewInvoice(finalizedInvoice, tenantId);
    postInvoiceToAccounts(finalizedInvoice, tenantId);
  }

  return updatedMemo;
}
