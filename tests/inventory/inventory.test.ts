import { test, describe } from "node:test";
import assert from "node:assert";
import {
  generateBarcodeForIndex,
  generateSkuForCategory,
  updateStockItemStatus,
  updateStockItemDetails,
  recordStockMovement,
  INITIAL_STOCK_ITEMS,
  startStockAudit,
  scanBarcodeInAudit,
  reconcileStockAudit,
  getStockItems,
  saveStockItems,
} from "../../src/modules/inventory/store";
import { generateBarcodeSvg } from "../../src/lib/barcode";
import { UserSession } from "../../src/modules/auth/types";

describe("JewelleryOS Inventory, Barcode & Stock Movement Tests", () => {
  const mockClerkSession: UserSession = {
    id: "user-vikram-inv",
    fullName: "Vikram Soni",
    email: "vikram@sandhyajewellers.com",
    phone: "+91 98291 55443",
    role: "INVENTORY_CLERK",
    businessId: "tenant-sandhya-jaipur",
    businessName: "Sandhya Jewellers",
  };

  test("Weight Deduction: Exactly computes Net Weight after stone and lac/enamel deductions", () => {
    const gross = 48.200;
    const stone = 2.100;
    const otherDeductions = 3.000; // Lac / wax / meena
    const net = Number((gross - stone - otherDeductions).toFixed(3));

    assert.strictEqual(net, 43.100);
  });

  test("Fine Weight (Tunch): Accurately computes 22K (22/24) fine metal equivalent", () => {
    const net = 43.100;
    const fine = Number(((net * 22) / 24).toFixed(3));
    
    // (43.1 * 22) / 24 = 39.508g
    assert.strictEqual(fine, 39.508);
  });

  test("SKU & Barcode Generation: Produces standardized Indian jewellery SKUs", () => {
    const chainSku = generateSkuForCategory("Chains", "18K", 84);
    assert.strictEqual(chainSku, "CHN-18K-084");

    const bangleSku = generateSkuForCategory("Bangles & Kadas", "22K", 102);
    assert.strictEqual(bangleSku, "BNG-22K-102");

    const barcode = generateBarcodeForIndex(1);
    assert.strictEqual(barcode, "8900000001");
  });

  test("Barcode Vector SVG: Generates valid Code 128 SVG path for thermal tag printers", () => {
    const barcode = generateBarcodeSvg("CHN-18K-084", { height: 40 });
    assert.ok(barcode.svgPath.length > 50);
    assert.ok(barcode.svgPath.startsWith("M"));
    assert.ok(barcode.width > 50);
    assert.strictEqual(barcode.height, 40);
  });

  test("Stock Movement: Records immutable transition from Showcase to Vault with attribution", () => {
    const movement = recordStockMovement(
      {
        stockItemId: "stock-1",
        sku: "CHN-18K-084",
        productName: "18K Italian Hollow Chain",
        fromStatus: "in_showcase",
        toStatus: "in_vault",
        fromLocation: "Tray #2",
        toLocation: "Vault Safe #A",
        reason: "Evening Safe Deposit",
        performedById: mockClerkSession.id,
        performedByName: mockClerkSession.fullName,
        performedByRole: mockClerkSession.role,
      },
      "tenant-sandhya-jaipur"
    );

    assert.ok(movement.id);
    assert.strictEqual(movement.sku, "CHN-18K-084");
    assert.strictEqual(movement.fromStatus, "in_showcase");
    assert.strictEqual(movement.toStatus, "in_vault");
    assert.strictEqual(movement.performedByName, "Vikram Soni");
    assert.ok(movement.timestamp);
  });

  test("Physical Stock Audit & Tray Reconciliation (DEF-018): Detects scanned pieces, surplus, and flags missing items", () => {
    const tenantId = "tenant-audit-test";
    saveStockItems(INITIAL_STOCK_ITEMS, tenantId);

    // 1. Start audit for Chains tray
    const auditSession = startStockAudit("Tray #2 · Chains Display", "Chains", "Vikram Soni", tenantId);
    assert.ok(auditSession.id);
    assert.strictEqual(auditSession.expectedCount, 1);
    assert.strictEqual(auditSession.scannedCount, 0);
    assert.strictEqual(auditSession.missingCount, 1);

    // 2. Scan expected chain barcode 8901840001
    const scan1 = scanBarcodeInAudit(auditSession, "8901840001");
    assert.strictEqual(scan1.isAlreadyScanned, false);
    assert.strictEqual(scan1.isSurplus, false);
    assert.strictEqual(scan1.matchedItem?.sku, "CHN-18K-084");
    assert.strictEqual(scan1.updatedSession.scannedCount, 1);
    assert.strictEqual(scan1.updatedSession.missingCount, 0);
    assert.strictEqual(scan1.updatedSession.status, "reconciled");

    // 3. Scan same item again -> flagged duplicate
    const scanDup = scanBarcodeInAudit(scan1.updatedSession, "8901840001");
    assert.strictEqual(scanDup.isAlreadyScanned, true);

    // 4. Scan untracked item -> flagged surplus
    const scanSurplus = scanBarcodeInAudit(scan1.updatedSession, "9999999999");
    assert.strictEqual(scanSurplus.isSurplus, true);
    assert.strictEqual(scanSurplus.updatedSession.surplusCount, 1);

    // 5. Test reconciliation with a missing item
    const broadAudit = startStockAudit("ALL", "ALL", "Vikram Soni", tenantId);
    assert.ok(broadAudit.expectedCount >= 3);

    // Scan only 1 item, leaving remaining missing
    const partialScan = scanBarcodeInAudit(broadAudit, "8901840001");
    assert.ok(partialScan.updatedSession.missingCount > 0);

    // Reconcile and flag missing items as damaged/lost
    const reconcileRes = reconcileStockAudit(
      partialScan.updatedSession,
      "flag_missing",
      mockClerkSession,
      tenantId
    );

    assert.strictEqual(reconcileRes.reconciledSession.status, "discrepancy_flagged");
    // Verified that missing items in stock were flagged
    const updatedStock = getStockItems(tenantId);
    const unscannedItem = updatedStock.find((i) => i.barcode === "8902240002");
    assert.strictEqual(unscannedItem?.status, "damaged");
  });

  test("Stock Editing: Recalculates netWeight and fineWeight accurately on detail update", () => {
    const tenantId = "tenant-stock-edit-test";
    saveStockItems(INITIAL_STOCK_ITEMS, tenantId);
    const target = getStockItems(tenantId)[0];

    const res = updateStockItemDetails(
      target.id,
      {
        name: "Edited 22K Wedding Ring",
        purity: "22K",
        grossWeight: 12.5,
        stoneWeight: 0.5,
        otherDeductions: 0,
        huid: "H99K12",
      },
      tenantId
    );

    assert.ok(res);
    assert.strictEqual(res.updatedItem.name, "Edited 22K Wedding Ring");
    assert.strictEqual(res.updatedItem.netWeight, 12.0);
    // 12.0 * (22/24) = 11.000
    assert.strictEqual(res.updatedItem.fineWeight, 11.0);
    assert.strictEqual(res.updatedItem.huid, "H99K12");
  });
});
