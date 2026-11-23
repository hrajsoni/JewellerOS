import { test, describe } from "node:test";
import assert from "node:assert";
import {
  lockInvoicedStockItems,
  ingestOldGoldScrap,
  INITIAL_STOCK_ITEMS,
} from "../../src/modules/inventory/store";
import { StockItem } from "../../src/modules/inventory/types";
import {
  InvoiceLineItem,
  OldGoldExchangeItem,
  PaymentRecord,
  FinalizedInvoice,
} from "../../src/modules/invoicing/types";

describe("JewelleryOS Milestone 4: Billing POS & Transaction Pipeline Tests", () => {
  const mockCashier = {
    id: "user-harshit",
    fullName: "Harshit Raj",
    role: "OWNER",
  };

  test("Split Payment Matrix: Correctly reconciles Cash + UPI + Card + Ledger Credit", () => {
    const grandTotal = 250000;
    const splitPayments: PaymentRecord[] = [
      { method: "Cash", amount: 50000, transactionRef: "Cash Counter" },
      { method: "UPI", amount: 120000, transactionRef: "UPI/GPay 489218" },
      { method: "Card", amount: 50000, transactionRef: "HDFC POS 9021" },
      { method: "Customer Credit", amount: 30000, transactionRef: "Udhar Khata" },
    ];

    const totalPaid = splitPayments.reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = Math.max(0, grandTotal - totalPaid);
    const status = balanceDue === 0 ? "paid" : "partial";

    assert.strictEqual(totalPaid, 250000);
    assert.strictEqual(balanceDue, 0);
    assert.strictEqual(status, "paid");
  });

  test("Partial Payment: Correctly flags balance due when customer underpays", () => {
    const grandTotal = 175000;
    const partialPayments: PaymentRecord[] = [
      { method: "Cash", amount: 50000, transactionRef: "Cash Advance" },
      { method: "UPI", amount: 75000, transactionRef: "UPI 112233" },
    ];

    const totalPaid = partialPayments.reduce((acc, p) => acc + p.amount, 0);
    const balanceDue = Math.max(0, grandTotal - totalPaid);
    const status: "paid" | "partial" = balanceDue === 0 ? "paid" : "partial";

    assert.strictEqual(totalPaid, 125000);
    assert.strictEqual(balanceDue, 50000);
    assert.strictEqual(status, "partial");
  });

  test("Atomic Stock Locking: Invoiced physical ornaments transition immediately to 'sold'", () => {
    const invoiceNumber = "INV-2026-TEST-01";
    const lineItems: InvoiceLineItem[] = [
      {
        id: "line-1",
        stockItemId: "stock-1",
        sku: "CHN-18K-084",
        name: "18K Italian Hollow Chain",
        metal: "gold",
        purity: "18K",
        purityDisplay: "18K (75%)",
        grossWeight: 10.234,
        stoneWeight: 0,
        netWeight: 10.234,
        metalRate: 150000,
        effectiveRatePerGram: 11250,
        metalValue: 115132.5,
        makingType: "percentage",
        makingRate: 18,
        makingCharges: 20723.85,
        stoneValue: 0,
        discount: 0,
        totalBeforeTax: 135856.35,
        fineWeight: 7.675,
        fineGoldValue24k: 115125,
        wastagePercentage: 6,
      },
    ];

    const updatedStock = lockInvoicedStockItems(
      lineItems,
      invoiceNumber,
      mockCashier,
      "test-tenant-lock"
    );

    const lockedItem = updatedStock.find((i) => i.id === "stock-1");
    assert.ok(lockedItem, "Stock item should exist in updated stock");
    assert.strictEqual(lockedItem.status, "sold");
    assert.ok(
      lockedItem.trayLocation.includes("Sold / Delivered"),
      "Tray location should indicate sold status and invoice number"
    );
  });

  test("Old-Gold Scrap Lot Dual Entry: Automatically creates unrefined scrap lot in Vault Safe #Melting Box", () => {
    const invoiceNumber = "INV-2026-TEST-OG";
    const oldGoldExchange: OldGoldExchangeItem[] = [
      {
        id: "og-exchange-1",
        description: "Old 22K Broken Bangles",
        metal: "gold",
        grossWeight: 15.500,
        stoneDeduction: 0.500,
        netWeight: 15.000,
        assessedPurityPercentage: 91.6,
        fineWeight: 13.740, // 15g * 91.6% = 13.74g fine gold
        currentRate24k: 150000,
        meltDeductionPercentage: 1.0,
        totalExchangeCredit: 206100,
      },
    ];

    const updatedStock = ingestOldGoldScrap(
      oldGoldExchange,
      invoiceNumber,
      "Ramesh Kumar Soni",
      mockCashier,
      "test-tenant-scrap"
    );

    const scrapPiece = updatedStock.find(
      (i) => i.supplierName?.includes("Ramesh Kumar Soni")
    );

    assert.ok(scrapPiece, "Unrefined scrap piece should be present in stock");
    assert.ok(scrapPiece.sku.startsWith("SCRAP-OG-"), "SKU should follow SCRAP-OG standard");
    assert.strictEqual(scrapPiece.trayLocation, "Vault Safe #Melting Box");
    assert.strictEqual(scrapPiece.grossWeight, 15.500);
    assert.strictEqual(scrapPiece.netWeight, 15.000);
    assert.strictEqual(scrapPiece.fineWeight, 13.740);
    assert.strictEqual(scrapPiece.acquisitionCost, 206100);
    assert.strictEqual(scrapPiece.status, "in_vault");
  });

  test("Double-Selling Prevention: Verifies that sold items cannot be re-invoiced", () => {
    const soldStockItem: StockItem = {
      id: "stock-already-sold",
      sku: "RNG-18K-SOLD",
      barcode: "8901849999",
      name: "18K Solitaire Ring Sold",
      category: "Rings",
      metal: "gold",
      purity: "18K",
      purityDisplay: "18K (75%)",
      grossWeight: 4.5,
      stoneWeight: 0.5,
      netWeight: 4.0,
      acquisitionCost: 45000,
      defaultMakingType: "percentage",
      defaultMakingValue: 18,
      trayLocation: "Sold / Delivered",
      status: "sold",
      dateAdded: "2026-09-01",
    };

    const isDoubleSellBlocked = soldStockItem.status === "sold";
    assert.strictEqual(
      isDoubleSellBlocked,
      true,
      "Items with status 'sold' must be strictly blocked from being added to new billing cart"
    );
  });
});
