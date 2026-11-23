import { StockItem, Supplier, StockMovementRecord, StockStatus, JewelleryCategory } from "./types";
import { UserSession } from "../auth/types";
import { InvoiceLineItem, OldGoldExchangeItem } from "../invoicing/types";

const INVENTORY_STORAGE_KEY = "jewellery_os_inventory_v3";
const MOVEMENTS_STORAGE_KEY = "jewellery_os_stock_movements_v1";

export const INITIAL_STOCK_ITEMS: StockItem[] = [
  {
    id: "stock-1",
    sku: "CHN-18K-084",
    barcode: "8901840001",
    name: "18K Italian Hollow Chain",
    category: "Chains",
    metal: "gold",
    purity: "18K",
    purityDisplay: "18K (75%)",
    grossWeight: 10.234,
    stoneWeight: 0,
    otherDeductions: 0,
    netWeight: 10.234,
    fineWeight: 7.675,
    hsnCode: "7113",
    acquisitionCost: 112500,
    defaultMakingType: "percentage",
    defaultMakingValue: 18,
    trayLocation: "Tray #2 · Chains Display",
    supplierName: "Zaveri Bullion Mumbai",
    status: "in_showcase",
    dateAdded: "2026-09-20",
  },
  {
    id: "stock-2",
    sku: "BNG-22K-102",
    barcode: "8902240002",
    name: "22K Solid Hallmark Bangle",
    category: "Bangles & Kadas",
    metal: "gold",
    purity: "22K",
    purityDisplay: "22K (22/24)",
    grossWeight: 18.450,
    stoneWeight: 0,
    otherDeductions: 0,
    netWeight: 18.450,
    fineWeight: 16.912,
    hsnCode: "7113",
    acquisitionCost: 245000,
    defaultMakingType: "percentage",
    defaultMakingValue: 18,
    trayLocation: "Tray #3 · Bangles Display",
    supplierName: "Jaipur Karigar Association",
    status: "in_showcase",
    dateAdded: "2026-09-22",
  },
  {
    id: "stock-3",
    sku: "RNG-18K-045",
    barcode: "8901840003",
    name: "18K Diamond Solitaire Ring",
    category: "Rings",
    metal: "gold",
    purity: "18K",
    purityDisplay: "18K (75%)",
    grossWeight: 4.250,
    stoneWeight: 0.400,
    otherDeductions: 0,
    netWeight: 3.850,
    fineWeight: 2.887,
    diamondCarats: 0.35,
    diamondPieces: 1,
    diamondClarity: "VVS-EF",
    hsnCode: "7113",
    acquisitionCost: 48000,
    defaultMakingType: "percentage",
    defaultMakingValue: 20,
    trayLocation: "Tray #1 · Diamond Rings",
    supplierName: "Surat Diamond Craft",
    status: "in_showcase",
    dateAdded: "2026-09-25",
  },
  {
    id: "stock-4",
    sku: "NCK-22K-029",
    barcode: "8902240004",
    name: "22K Royal Rajputana Bridal Set",
    category: "Necklaces & Sets",
    metal: "gold",
    purity: "22K",
    purityDisplay: "22K (22/24)",
    grossWeight: 48.200,
    stoneWeight: 2.100,
    otherDeductions: 3.000, // Lac & Enamel
    netWeight: 43.100,
    fineWeight: 39.508,
    hsnCode: "7113",
    acquisitionCost: 560000,
    defaultMakingType: "percentage",
    defaultMakingValue: 16,
    trayLocation: "Vault Safe #A",
    supplierName: "Rajasthan Heritage Jewellers",
    status: "in_vault",
    dateAdded: "2026-09-18",
  },
  {
    id: "stock-5",
    sku: "SLV-925-012",
    barcode: "8909250005",
    name: "925 Pure Silver Handcrafted Payal",
    category: "Silver Articles & Payal",
    metal: "silver",
    purity: "925",
    purityDisplay: "925 Sterling",
    grossWeight: 65.500,
    stoneWeight: 0,
    otherDeductions: 0,
    netWeight: 65.500,
    fineWeight: 60.587,
    hsnCode: "7113",
    acquisitionCost: 5500,
    defaultMakingType: "per_gram",
    defaultMakingValue: 25,
    trayLocation: "Silver Counter Tray #1",
    supplierName: "Agra Silver Craft",
    status: "in_showcase",
    dateAdded: "2026-09-24",
  },
  {
    id: "stock-6",
    sku: "COIN-24K-010",
    barcode: "8902440006",
    name: "24K 999 Pure Lakshmi Gold Coin",
    category: "Coins & Bullion",
    metal: "gold",
    purity: "24K",
    purityDisplay: "24K (100%)",
    grossWeight: 10.000,
    stoneWeight: 0,
    otherDeductions: 0,
    netWeight: 10.000,
    fineWeight: 10.000,
    hsnCode: "7113",
    acquisitionCost: 148500,
    defaultMakingType: "percentage",
    defaultMakingValue: 3,
    trayLocation: "Vault Safe #B",
    supplierName: "MMTC-PAMP India",
    status: "in_vault",
    dateAdded: "2026-09-26",
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovementRecord[] = [
  {
    id: "mvt-1",
    stockItemId: "stock-4",
    sku: "NCK-22K-029",
    productName: "22K Royal Rajputana Bridal Set",
    fromStatus: "in_showcase",
    toStatus: "in_vault",
    fromLocation: "Showcase Shelf #1",
    toLocation: "Vault Safe #A",
    reason: "Evening Showroom Vault Deposit",
    timestamp: "2026-11-23T19:00:00.000Z",
    performedById: "user-vikram-inv",
    performedByName: "Vikram Soni",
    performedByRole: "INVENTORY_CLERK",
  },
  {
    id: "mvt-2",
    stockItemId: "stock-6",
    sku: "COIN-24K-010",
    productName: "24K 999 Pure Lakshmi Gold Coin",
    fromStatus: "in_showcase",
    toStatus: "in_vault",
    fromLocation: "Bullion Counter",
    toLocation: "Vault Safe #B",
    reason: "Transferred to High Security Safe",
    timestamp: "2026-11-23T14:30:00.000Z",
    performedById: "user-sunil-mgr",
    performedByName: "Sunil Mehta",
    performedByRole: "MANAGER",
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: "sup-1",
    name: "Zaveri Bullion & Ornaments",
    contactPerson: "Dhirubhai Shah",
    phone: "+91 98200 11223",
    city: "Mumbai",
    gstin: "27AAACZ1234F1Z1",
    metalSupplied: "gold",
    totalPurchasedGrams: 850.5,
    outstandingBalance: 0,
  },
  {
    id: "sup-2",
    name: "Jaipur Karigar Craft Union",
    contactPerson: "Gopal Soni",
    phone: "+91 94140 33445",
    city: "Jaipur",
    gstin: "08AAAJC5678F1Z4",
    metalSupplied: "both",
    totalPurchasedGrams: 420.0,
    outstandingBalance: 125000,
  },
  {
    id: "sup-3",
    name: "Agra Silver Works",
    contactPerson: "Mahesh Agrawal",
    phone: "+91 98370 55667",
    city: "Agra",
    metalSupplied: "silver",
    totalPurchasedGrams: 28000.0,
    outstandingBalance: 34000,
  },
];

export function getTenantInventoryStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_inventory_v3` : INVENTORY_STORAGE_KEY;
}

export function getTenantMovementsStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_movements_v1` : MOVEMENTS_STORAGE_KEY;
}

export function getSavedStock(tenantId?: string): StockItem[] {
  if (typeof window === "undefined") return INITIAL_STOCK_ITEMS;
  try {
    const key = getTenantInventoryStorageKey(tenantId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur")
        ? INITIAL_STOCK_ITEMS
        : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_STOCK_ITEMS;
  } catch {
    return INITIAL_STOCK_ITEMS;
  }
}

export function saveStockItems(items: StockItem[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantInventoryStorageKey(tenantId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    console.error("Failed to save inventory to storage:", err);
  }
}

export function getStockMovements(tenantId?: string): StockMovementRecord[] {
  if (typeof window === "undefined") return INITIAL_STOCK_MOVEMENTS;
  try {
    const key = getTenantMovementsStorageKey(tenantId);
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(INITIAL_STOCK_MOVEMENTS));
      return INITIAL_STOCK_MOVEMENTS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_STOCK_MOVEMENTS;
  } catch {
    return INITIAL_STOCK_MOVEMENTS;
  }
}

export function recordStockMovement(
  movement: Omit<StockMovementRecord, "id" | "timestamp">,
  tenantId?: string
): StockMovementRecord {
  const newRecord: StockMovementRecord = {
    ...movement,
    id: `mvt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      const history = getStockMovements(tenantId);
      const updated = [newRecord, ...history];
      localStorage.setItem(getTenantMovementsStorageKey(tenantId), JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to persist stock movement:", err);
    }
  }

  return newRecord;
}

export function updateStockItemStatus(
  stockItemId: string,
  newStatus: StockStatus,
  reason: string,
  user: UserSession,
  destinationLocation?: string,
  tenantId?: string
): { updatedItems: StockItem[]; movement: StockMovementRecord } | null {
  const items = getSavedStock(tenantId);
  const target = items.find((i) => i.id === stockItemId);
  if (!target) return null;

  const oldStatus = target.status;
  const oldLocation = target.trayLocation;
  const newLocation = destinationLocation || oldLocation;

  const updatedItems = items.map((i) =>
    i.id === stockItemId
      ? { ...i, status: newStatus, trayLocation: newLocation }
      : i
  );

  saveStockItems(updatedItems, tenantId);

  const movement = recordStockMovement(
    {
      stockItemId: target.id,
      sku: target.sku,
      productName: target.name,
      fromStatus: oldStatus,
      toStatus: newStatus,
      fromLocation: oldLocation,
      toLocation: newLocation,
      reason,
      performedById: user.id,
      performedByName: user.fullName,
      performedByRole: user.role,
    },
    tenantId
  );

  return { updatedItems, movement };
}

export function generateBarcodeForIndex(index: number): string {
  const base = 8900000000;
  return (base + index).toString();
}

export function generateSkuForCategory(category: JewelleryCategory, purity: string, sequence: number): string {
  const prefixMap: Record<JewelleryCategory, string> = {
    Chains: "CHN",
    "Bangles & Kadas": "BNG",
    Rings: "RNG",
    "Necklaces & Sets": "NCK",
    "Earrings & Jhumkas": "ERN",
    Mangalsutras: "MNG",
    Pendants: "PND",
    "Coins & Bullion": "COIN",
    "Silver Articles & Payal": "SLV",
    Other: "OTH",
  };
  const code = prefixMap[category] || "JWL";
  const purityClean = purity.replace(/[^0-9K]/gi, "").toUpperCase();
  const seqPadded = sequence.toString().padStart(3, "0");
  return `${code}-${purityClean}-${seqPadded}`;
}

/**
 * Atomic Stock Locking:
 * Marks all invoiced serialized ornaments as "sold", moves location to "Sold / Delivered",
 * and records an immutable stock_movement audit log.
 */
export function lockInvoicedStockItems(
  lineItems: InvoiceLineItem[],
  invoiceNumber: string,
  user?: { id: string; fullName: string; role: string },
  tenantId?: string
): StockItem[] {
  const currentStock = getSavedStock(tenantId);
  const operator = user || {
    id: "system-pos",
    fullName: "Billing Counter Terminal",
    role: "SALESPERSON",
  };

  let hasChanges = false;
  const updatedStock = currentStock.map((stockItem) => {
    // Match by stockItemId, SKU, barcode, or exact item name if not already sold
    const isSoldInThisBill = lineItems.some(
      (item) =>
        (item.stockItemId && item.stockItemId === stockItem.id) ||
        (item.sku && item.sku === stockItem.sku) ||
        (item.barcode && item.barcode === stockItem.barcode) ||
        (item.name.toLowerCase() === stockItem.name.toLowerCase() && stockItem.status !== "sold")
    );

    if (isSoldInThisBill && stockItem.status !== "sold") {
      hasChanges = true;
      const oldStatus = stockItem.status;
      const oldLocation = stockItem.trayLocation;
      const newLocation = `Sold / Delivered (Invoice #${invoiceNumber})`;

      recordStockMovement(
        {
          stockItemId: stockItem.id,
          sku: stockItem.sku,
          productName: stockItem.name,
          fromStatus: oldStatus,
          toStatus: "sold",
          fromLocation: oldLocation,
          toLocation: newLocation,
          reason: `Sold on Tax Invoice #${invoiceNumber}`,
          performedById: operator.id,
          performedByName: operator.fullName,
          performedByRole: operator.role,
        },
        tenantId
      );

      return {
        ...stockItem,
        status: "sold" as StockStatus,
        trayLocation: newLocation,
      };
    }

    return stockItem;
  });

  if (hasChanges) {
    saveStockItems(updatedStock, tenantId);
  }

  return updatedStock;
}

/**
 * Old-Gold Scrap Lot Dual Entry:
 * When customers exchange scrap or old jewellery, generates a serialized unrefined lot
 * in the inventory vault under "Vault Safe #Melting Box" with 24ct fine metal equivalence.
 */
export function ingestOldGoldScrap(
  oldGoldItems: OldGoldExchangeItem[],
  invoiceNumber: string,
  customerName: string,
  user?: { id: string; fullName: string; role: string },
  tenantId?: string
): StockItem[] {
  if (!oldGoldItems || oldGoldItems.length === 0) {
    return getSavedStock(tenantId);
  }

  const currentStock = getSavedStock(tenantId);
  const operator = user || {
    id: "system-pos",
    fullName: "Billing Counter Terminal",
    role: "SALESPERSON",
  };

  const newScrapPieces: StockItem[] = [];

  for (const og of oldGoldItems) {
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const scrapSku = `SCRAP-OG-${randomSuffix}`;
    const scrapBarcode = `89099${Math.floor(10000 + Math.random() * 90000)}`;

    const purityKey =
      og.assessedPurityPercentage >= 90
        ? "22K"
        : og.assessedPurityPercentage >= 75
        ? "18K"
        : "14K";

    const scrapItem: StockItem = {
      id: `scrap-${Date.now()}-${randomSuffix}`,
      sku: scrapSku,
      barcode: scrapBarcode,
      name: `Old Scrap: ${og.description}`,
      category: "Other",
      metal: og.metal,
      purity: purityKey as any,
      purityDisplay: `${og.assessedPurityPercentage}% Touch (Assessed)`,
      grossWeight: og.grossWeight,
      stoneWeight: og.stoneDeduction,
      otherDeductions: 0,
      netWeight: og.netWeight,
      fineWeight: Number(og.fineWeight.toFixed(3)),
      hsnCode: "7113",
      acquisitionCost: og.totalExchangeCredit,
      defaultMakingType: "percentage",
      defaultMakingValue: 0,
      trayLocation: "Vault Safe #Melting Box",
      supplierName: `Customer Exchange (${customerName || "Walk-in"})`,
      status: "in_vault",
      dateAdded: new Date().toISOString().split("T")[0],
      notes: `Exchange Lot from Invoice #${invoiceNumber}. Assessed Touch: ${og.assessedPurityPercentage}%, Melt Deduct: ${og.meltDeductionPercentage}%`,
    };

    recordStockMovement(
      {
        stockItemId: scrapItem.id,
        sku: scrapItem.sku,
        productName: scrapItem.name,
        fromStatus: "in_vault",
        toStatus: "in_vault",
        fromLocation: `Customer Ingestion (${customerName})`,
        toLocation: "Vault Safe #Melting Box",
        reason: `Old Gold Scrap Exchange on Invoice #${invoiceNumber}`,
        performedById: operator.id,
        performedByName: operator.fullName,
        performedByRole: operator.role,
      },
      tenantId
    );

    newScrapPieces.push(scrapItem);
  }

  const updatedStock = [...newScrapPieces, ...currentStock];
  saveStockItems(updatedStock, tenantId);
  return updatedStock;
}
