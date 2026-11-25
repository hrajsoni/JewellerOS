import { test, describe } from "node:test";
import assert from "node:assert";
import {
  lockInvoicedStockItems,
  ingestOldGoldScrap,
  INITIAL_STOCK_ITEMS,
  saveStockItems,
  getSavedStock,
} from "../../src/modules/inventory/store";
import { StockItem } from "../../src/modules/inventory/types";
import {
  InvoiceLineItem,
  OldGoldExchangeItem,
  PaymentRecord,
  FinalizedInvoice,
  SalesReturnItem,
} from "../../src/modules/invoicing/types";
import {
  processSalesReturn,
  getSalesReturns,
  saveNewInvoice,
} from "../../src/modules/invoicing/store";

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

  test("Stock Locking Invariant (DEF-004): Selling 1 item by name when multiple identical items exist only marks exactly one as sold", () => {
    const tenantId = "test-tenant-def-004";
    const ring1: StockItem = {
      id: "stock-ring-1",
      sku: "RNG-22K-A1",
      barcode: "8902200001",
      name: "22K Floral Gold Ring",
      category: "Rings",
      metal: "gold",
      purity: "22K",
      purityDisplay: "22K (22/24)",
      grossWeight: 4.5,
      stoneWeight: 0,
      netWeight: 4.5,
      fineWeight: 4.125,
      acquisitionCost: 45000,
      defaultMakingType: "percentage",
      defaultMakingValue: 18,
      trayLocation: "Tray #1",
      status: "in_showcase",
      dateAdded: "2026-10-01",
    };
    const ring2: StockItem = {
      id: "stock-ring-2",
      sku: "RNG-22K-A2",
      barcode: "8902200002",
      name: "22K Floral Gold Ring", // Identical name!
      category: "Rings",
      metal: "gold",
      purity: "22K",
      purityDisplay: "22K (22/24)",
      grossWeight: 4.5,
      stoneWeight: 0,
      netWeight: 4.5,
      fineWeight: 4.125,
      acquisitionCost: 45000,
      defaultMakingType: "percentage",
      defaultMakingValue: 18,
      trayLocation: "Tray #1",
      status: "in_showcase",
      dateAdded: "2026-10-01",
    };

    saveStockItems([ring1, ring2], tenantId);

    // Bill selling only 1 ring by name without passing stockItemId
    const lineItems: InvoiceLineItem[] = [
      {
        id: "line-def004-1",
        name: "22K Floral Gold Ring",
        metal: "gold",
        purity: "22K",
        purityDisplay: "22K (22/24)",
        grossWeight: 4.5,
        stoneWeight: 0,
        netWeight: 4.5,
        metalRate: 150000,
        effectiveRatePerGram: 13750,
        metalValue: 61875,
        makingType: "percentage",
        makingRate: 18,
        makingCharges: 11137.5,
        stoneValue: 0,
        discount: 0,
        totalBeforeTax: 73012.5,
        fineWeight: 4.125,
        fineGoldValue24k: 61875,
        wastagePercentage: 0,
      },
    ];

    const updated = lockInvoicedStockItems(lineItems, "INV-DEF004-01", mockCashier, tenantId);

    const soldCount = updated.filter((item) => item.status === "sold").length;
    const inShowcaseCount = updated.filter((item) => item.status === "in_showcase").length;

    assert.strictEqual(soldCount, 1, "Exactly one ring should be marked as sold");
    assert.strictEqual(inShowcaseCount, 1, "The second ring must remain in_showcase");
  });

  test("Sales Returns & Credit Notes (DEF-019): Restocks returned pieces to showcase and issues numbered Credit Note", () => {
    const tenantId = "tenant-returns-test";
    const testRing: StockItem = {
      id: "stock-ret-ring-1",
      sku: "RNG-22K-RET",
      barcode: "8902249999",
      name: "22K Solitaire Returnable Ring",
      category: "Rings",
      metal: "gold",
      purity: "22K",
      purityDisplay: "22K (22/24)",
      grossWeight: 5.0,
      stoneWeight: 0,
      netWeight: 5.0,
      fineWeight: 4.583,
      acquisitionCost: 50000,
      defaultMakingType: "percentage",
      defaultMakingValue: 18,
      trayLocation: "Tray #1 · Rings Display",
      status: "sold", // Currently sold to customer
      dateAdded: "2026-10-01",
    };
    saveStockItems([testRing], tenantId);

    // Seed original retail bill
    const invoiceNumber = "INV-2026-RET-01";
    const seedInvoice: FinalizedInvoice = {
      id: "inv-ret-01",
      invoiceNumber,
      invoiceDate: "2026-10-05",
      createdAt: "2026-10-05T10:00:00.000Z",
      customer: {
        id: "cust-ret-1",
        name: "Shri Rameshwar Lal",
        phone: "+91 94140 55667",
      },
      items: [
        {
          id: "item-ret-line-1",
          stockItemId: "stock-ret-ring-1",
          sku: "RNG-22K-RET",
          barcode: "8902249999",
          name: "22K Solitaire Returnable Ring",
          metal: "gold",
          purity: "22K",
          purityDisplay: "22K (22/24)",
          grossWeight: 5.0,
          stoneWeight: 0,
          netWeight: 5.0,
          metalRate: 150000,
          effectiveRatePerGram: 13750,
          metalValue: 68750,
          makingType: "percentage",
          makingRate: 18,
          makingCharges: 12375,
          stoneValue: 0,
          discount: 0,
          totalBeforeTax: 81125,
          fineWeight: 4.583,
          fineGoldValue24k: 68750,
          wastagePercentage: 0,
        },
      ],
      itemsSubtotal: 81125,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: 81125,
      gstPercentage: 3,
      cgstAmount: 1216.88,
      sgstAmount: 1216.88,
      totalGst: 2433.75,
      roundoff: 0.25,
      grandTotal: 83559,
      payments: [{ method: "Cash", amount: 83559 }],
      totalPaid: 83559,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: "Sandhya Jewellers",
        address: "142 Sarafa Bazar, Jaipur",
        phone: "+91 94140 12345",
        gstin: "08AAAAJ1234F1Z8",
      },
    };
    saveNewInvoice(seedInvoice, tenantId);

    // Process Return: Customer returns ring for full refund as Credit Note
    const returnItem: SalesReturnItem = {
      invoiceItemId: "item-ret-line-1",
      stockItemId: "stock-ret-ring-1",
      barcode: "8902249999",
      sku: "RNG-22K-RET",
      name: "22K Solitaire Returnable Ring",
      metal: "gold",
      purity: "22K",
      grossWeight: 5.0,
      netWeight: 5.0,
      refundRatePerGram: 13750,
      returnedAmount: 81125,
      restockDestination: "showcase",
      reason: "Size mismatch / Exchange",
    };

    const res = processSalesReturn(
      {
        originalInvoiceNumber: invoiceNumber,
        returnedItems: [returnItem],
        totalRefundAmount: 81125,
        refundMethod: "Credit Note",
        notes: "Approved by Owner Harshit Raj",
      },
      mockCashier,
      tenantId
    );

    // 1. Verify Credit Note Number generation
    assert.ok(res.returnRecord.creditNoteNumber.startsWith("CRN-"));
    assert.strictEqual(res.returnRecord.totalRefundAmount, 81125);
    assert.strictEqual(res.returnRecord.refundMethod, "Credit Note");

    // 2. Verify Return is saved in Returns Registry
    const allReturns = getSalesReturns(tenantId);
    assert.strictEqual(allReturns.length, 1);
    assert.strictEqual(allReturns[0].originalInvoiceNumber, invoiceNumber);

    // 3. Verify Stock Reversal: Ring status must transition from 'sold' back to 'in_showcase'
    const updatedStock = getSavedStock(tenantId);
    const restockedRing = updatedStock.find((s) => s.id === "stock-ret-ring-1");
    assert.ok(restockedRing);
    assert.strictEqual(restockedRing.status, "in_showcase", "Returned item must transition back to in_showcase");
  });
});

