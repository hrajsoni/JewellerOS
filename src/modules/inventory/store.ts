import { StockItem, Supplier } from "./types";

const INVENTORY_STORAGE_KEY = "jewellery_os_inventory_v2";

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
    grossWeight: 10.0,
    stoneWeight: 0,
    netWeight: 10.0,
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
    grossWeight: 18.45,
    stoneWeight: 0,
    netWeight: 18.45,
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
    name: "18K Diamond Studded Solitaire Ring",
    category: "Rings",
    metal: "gold",
    purity: "18K",
    purityDisplay: "18K (75%)",
    grossWeight: 4.25,
    stoneWeight: 0.4,
    netWeight: 3.85,
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
    grossWeight: 45.2,
    stoneWeight: 2.1,
    netWeight: 43.1,
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
    grossWeight: 65.5,
    stoneWeight: 0,
    netWeight: 65.5,
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
    grossWeight: 10.0,
    stoneWeight: 0,
    netWeight: 10.0,
    acquisitionCost: 148500,
    defaultMakingType: "percentage",
    defaultMakingValue: 3,
    trayLocation: "Vault Safe #B",
    supplierName: "MMTC-PAMP India",
    status: "in_vault",
    dateAdded: "2026-09-26",
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
  return tenantId ? `jewellery_os_tenant_${tenantId}_inventory` : INVENTORY_STORAGE_KEY;
}

export function getSavedStock(tenantId?: string): StockItem[] {
  if (typeof window === "undefined") return INITIAL_STOCK_ITEMS;
  try {
    const key = getTenantInventoryStorageKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantInventoryStorageKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_STOCK_ITEMS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
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
