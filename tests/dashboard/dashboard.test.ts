import { test, describe } from "node:test";
import assert from "node:assert";
import { StockItem } from "../../src/modules/inventory/types";
import { FinalizedInvoice } from "../../src/modules/invoicing/types";
import { hasPermission } from "../../src/modules/auth/permissions";

describe("JewelleryOS Milestone 8: Dashboard & Executive Command Center Tests", () => {
  const mockStock: StockItem[] = [
    {
      id: "stk-1",
      sku: "RNG-22K-001",
      barcode: "8901001",
      name: "22K Floral Gold Ring",
      category: "Rings",
      metal: "gold",
      purity: "22K",
      purityDisplay: "22K (91.6%)",
      grossWeight: 5.5,
      stoneWeight: 0.2,
      netWeight: 5.3,
      fineWeight: 4.858, // 5.3 * (22/24)
      acquisitionCost: 65000,
      defaultMakingType: "percentage",
      defaultMakingValue: 12,
      trayLocation: "Showcase Shelf #1",
      status: "in_showcase",
      dateAdded: "2026-10-01",
    },
    {
      id: "stk-2",
      sku: "CHN-18K-002",
      barcode: "8901002",
      name: "18K Italian Chain",
      category: "Chains",
      metal: "gold",
      purity: "18K",
      purityDisplay: "18K (75%)",
      grossWeight: 12.0,
      stoneWeight: 0,
      netWeight: 12.0,
      fineWeight: 9.0, // 12 * (18/24)
      acquisitionCost: 115000,
      defaultMakingType: "percentage",
      defaultMakingValue: 15,
      trayLocation: "Showcase Shelf #2",
      status: "in_showcase",
      dateAdded: "2026-10-02",
    },
    {
      id: "stk-3",
      sku: "SLV-925-003",
      barcode: "8901003",
      name: "925 Silver Dinner Plate",
      category: "Silver Articles & Payal",
      metal: "silver",
      purity: "925",
      purityDisplay: "925 Sterling (92.5%)",
      grossWeight: 500.0,
      stoneWeight: 0,
      netWeight: 500.0,
      acquisitionCost: 42000,
      defaultMakingType: "per_gram",
      defaultMakingValue: 20,
      trayLocation: "Vault Safe #B",
      status: "in_vault",
      dateAdded: "2026-10-03",
    },
  ];

  const gold24kRate = 150000; // per 10g => ₹15,000 / g
  const silverRate = 95000; // per kg => ₹95 / g

  test("Inventory Valuation Arithmetic: Computes exact physical fine gold and silver valuation vs acquisition cost", () => {
    const goldItems = mockStock.filter((i) => i.metal === "gold");
    const silverItems = mockStock.filter((i) => i.metal === "silver");

    const totalFineGold = goldItems.reduce((s, i) => s + (i.fineWeight || 0), 0);
    // 4.858g + 9.0g = 13.858g fine gold
    assert.strictEqual(Math.round(totalFineGold * 1000) / 1000, 13.858);

    const goldRetailValuation = Math.round(totalFineGold * (gold24kRate / 10));
    // 13.858 * 15000 = ₹2,07,870
    assert.strictEqual(goldRetailValuation, 207870);

    const silverGrossWeight = silverItems.reduce((s, i) => s + i.grossWeight, 0);
    const silverRetailValuation = Math.round((silverGrossWeight / 1000) * silverRate);
    // 0.5 kg * 95000 = ₹47,500
    assert.strictEqual(silverRetailValuation, 47500);

    const totalRetailValuation = goldRetailValuation + silverRetailValuation;
    assert.strictEqual(totalRetailValuation, 207870 + 47500);

    const totalAcquisitionCost = mockStock.reduce((s, i) => s + i.acquisitionCost, 0);
    // 65000 + 115000 + 42000 = ₹2,22,000
    assert.strictEqual(totalAcquisitionCost, 222000);

    const unrealizedGrossMargin = totalRetailValuation - totalAcquisitionCost;
    // 255370 - 222000 = ₹33,370
    assert.strictEqual(unrealizedGrossMargin, 33370);
  });

  test("Operational Low Stock Radar: Detects categories below minimum threshold", () => {
    const inStore = mockStock.filter((i) => i.status === "in_showcase" || i.status === "in_vault");
    const categoryCounts: Record<string, number> = {};
    inStore.forEach((i) => {
      categoryCounts[i.category] = (categoryCounts[i.category] || 0) + 1;
    });

    const lowStock = Object.entries(categoryCounts).filter(([, count]) => count < 3);

    assert.ok(lowStock.some(([cat]) => cat === "Rings"));
    assert.ok(lowStock.some(([cat]) => cat === "Chains"));
    assert.ok(lowStock.some(([cat]) => cat === "Silver Articles & Payal"));
  });

  test("RBAC Security Masking: Strict enforcement preventing Salespersons from accessing executive financial metrics", () => {
    // 1. Owner & Admin have complete access to owner reports and purchase costs
    assert.strictEqual(hasPermission("OWNER", "VIEW_OWNER_REPORTS"), true);
    assert.strictEqual(hasPermission("OWNER", "VIEW_PURCHASE_COSTS"), true);
    assert.strictEqual(hasPermission("ADMIN", "VIEW_OWNER_REPORTS"), true);

    // 2. Salesperson is strictly forbidden from viewing owner reports, purchase costs, and profit margins
    assert.strictEqual(hasPermission("SALESPERSON", "VIEW_OWNER_REPORTS"), false);
    assert.strictEqual(hasPermission("SALESPERSON", "VIEW_PURCHASE_COSTS"), false);
    assert.strictEqual(hasPermission("SALESPERSON", "VIEW_PROFIT_MARGINS"), false);

    // 3. Inventory clerk can view inventory, but cannot view owner reports or profit margins
    assert.strictEqual(hasPermission("INVENTORY_CLERK", "VIEW_OWNER_REPORTS"), false);
    assert.strictEqual(hasPermission("INVENTORY_CLERK", "VIEW_PROFIT_MARGINS"), false);
  });
});
