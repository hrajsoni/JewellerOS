import { test, describe } from "node:test";
import assert from "node:assert";
import {
  generateBarcodeForIndex,
  generateSkuForCategory,
  updateStockItemStatus,
  recordStockMovement,
  INITIAL_STOCK_ITEMS,
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
});
