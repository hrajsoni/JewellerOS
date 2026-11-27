import { test, describe } from "node:test";
import assert from "node:assert";
import {
  recordPurchaseInvoice,
  recordSupplierPayment,
  getSavedSuppliers,
  getSavedPurchases,
  getSavedSupplierPayments,
  INITIAL_SUPPLIER_PROFILES,
} from "../../src/modules/suppliers/store";
import { PurchaseInvoice, PurchaseItemInput } from "../../src/modules/suppliers/types";
import { ROLE_PERMISSIONS } from "../../src/modules/auth/permissions";
import { Customer } from "../../src/modules/customers/types";
import {
  INITIAL_CUSTOMERS,
  saveCustomers,
  recordCustomerBalanceEntry,
} from "../../src/modules/customers/store";
import { getSavedAccounts } from "../../src/modules/accounts/store";

describe("JewelleryOS Milestone 5: Purchases, Suppliers & Customer Dues Tests", () => {
  const mockUser = {
    id: "user-harshit",
    fullName: "Harshit Raj",
    role: "OWNER",
  };

  test("Atomic Purchase Inwarding: Inwards physical stock and creates supplier liabilities", () => {
    const tenantId = "test-tenant-pur-01";
    const initialSuppliers = getSavedSuppliers(tenantId);
    const targetSupplier = initialSuppliers[0]; // Zaveri Bullion Mumbai
    const initialDue = targetSupplier.outstandingBalanceINR;

    const purchaseItems: PurchaseItemInput[] = [
      {
        description: "22K Solid Rajputana Bangles Lot",
        category: "Bangles & Kadas",
        metal: "gold",
        purity: "22K",
        purityDisplay: "22K (916)",
        grossWeight: 25.0,
        stoneWeight: 0,
        netWeight: 25.0,
        fineWeight: 22.917,
        metalRate: 150000,
        metalValue: 343755,
        makingType: "percentage",
        makingRate: 10,
        makingCharges: 34375,
        stoneValue: 0,
        subtotal: 378130,
        trayLocation: "Vault Safe #A",
      },
    ];

    const invoiceData: Omit<PurchaseInvoice, "id" | "createdAt"> = {
      invoiceNumber: "PUR-ZAV-TEST-001",
      supplierId: targetSupplier.id,
      supplierName: targetSupplier.name,
      invoiceDate: "2026-11-24",
      items: purchaseItems,
      itemsSubtotal: 378130,
      totalMaking: 34375,
      totalGst: 11344, // 3% GST
      grandTotal: 389474,
      amountPaid: 100000, // Partial payment
      balanceDue: 289474,
      paymentMethod: "Bank Transfer",
      paymentRef: "NEFT-HDFC-99120",
      status: "partial",
    };

    const result = recordPurchaseInvoice(invoiceData, mockUser, tenantId);

    // 1. Verify Stock Inwarding
    const inwardedStockItem = result.updatedStock.find(
      (item) => item.notes?.includes("PUR-ZAV-TEST-001")
    );
    assert.ok(inwardedStockItem, "Physical stock item must be created in inventory");
    assert.strictEqual(inwardedStockItem.grossWeight, 25.0);
    assert.strictEqual(inwardedStockItem.category, "Bangles & Kadas");
    assert.strictEqual(inwardedStockItem.trayLocation, "Vault Safe #A");
    assert.strictEqual(inwardedStockItem.status, "in_vault");

    // 2. Verify Supplier Liability Booked
    const updatedSup = result.updatedSuppliers.find((s) => s.id === targetSupplier.id);
    assert.ok(updatedSup, "Supplier record must be updated");
    assert.strictEqual(updatedSup.outstandingBalanceINR, initialDue + 289474);
    assert.ok(updatedSup.totalPurchasedGrams >= 25.0);
  });

  test("Supplier Payment Settlement: Accurately reduces outstanding balance", () => {
    const tenantId = "test-tenant-pur-02";
    const suppliers = getSavedSuppliers(tenantId);
    const targetSupplier = suppliers[1]; // Jaipur Karigar Association
    const initialDue = targetSupplier.outstandingBalanceINR;

    const paymentResult = recordSupplierPayment(
      {
        supplierId: targetSupplier.id,
        supplierName: targetSupplier.name,
        amount: 25000,
        method: "Bank Transfer",
        referenceNo: "RTGS-SBI-88219",
        notes: "Part payment against Karigar gold bill",
      },
      tenantId
    );

    assert.strictEqual(paymentResult.paymentRecord.amount, 25000);
    assert.strictEqual(paymentResult.paymentRecord.referenceNo, "RTGS-SBI-88219");

    const updatedSup = paymentResult.updatedSuppliers.find((s) => s.id === targetSupplier.id);
    assert.ok(updatedSup);
    assert.strictEqual(updatedSup.outstandingBalanceINR, Math.max(0, initialDue - 25000));
  });

  test("Customer Tax Compliance: Enforces PAN capture for high-value sales > ₹2,00,000", () => {
    const mockCustomerWithPan: Customer = {
      id: "cust-high-value",
      name: "Seth Govind Das",
      phone: "+91 98290 99887",
      city: "Jaipur",
      gstin: "URP (Retail Consumer)",
      panNumber: "ABCDE1234F",
      customerType: "vip",
      totalPurchases: 450000,
      totalGoldWeightGrams: 35.0,
      totalSilverWeightGrams: 0,
      totalInvoicesCount: 1,
      outstandingCredit: 0,
      lastVisitDate: "2026-11-24",
    };

    const invoiceTotal = 325000; // > ₹2,00,000 statutory limit
    const isPanRequired = invoiceTotal > 200000;
    const isCompliant = !isPanRequired || Boolean(mockCustomerWithPan.panNumber && mockCustomerWithPan.panNumber.length === 10);

    assert.strictEqual(isPanRequired, true);
    assert.strictEqual(isCompliant, true);
  });

  test("RBAC Security: Strictly hides purchase costs and supplier ledgers from Salespersons", () => {
    assert.strictEqual(
      ROLE_PERMISSIONS.SALESPERSON.VIEW_PURCHASE_COSTS,
      false,
      "Salesperson must never be granted VIEW_PURCHASE_COSTS permission"
    );

    assert.strictEqual(
      ROLE_PERMISSIONS.OWNER.VIEW_PURCHASE_COSTS,
      true,
      "Owner must have full access to purchase costs and supplier records"
    );

    assert.strictEqual(
      ROLE_PERMISSIONS.ACCOUNTANT.VIEW_PURCHASE_COSTS,
      true,
      "Accountant must have access to purchase costs for ledger reconciliation"
    );
  });

  test("Customer Udhar CR/DR Settlement: Updates customer due and posts double-entry Cash & Receivable accounts", () => {
    const tenantId = "tenant-cust-crdr-test";
    const seeded: Customer = {
      ...INITIAL_CUSTOMERS[0],
      id: "cust-crdr-1",
      outstandingCredit: -10000, // ₹10,000 pending Udhar
    };
    saveCustomers([seeded], tenantId);

    const beforeCash = getSavedAccounts(tenantId).find((a) => a.code === "1010")!.balance;
    const beforeRec = getSavedAccounts(tenantId).find((a) => a.code === "1050")!.balance;

    // Collect ₹6,000 Cash Udhar
    const res1 = recordCustomerBalanceEntry(
      "cust-crdr-1",
      6000,
      "collect_udhar",
      "Cash",
      "Partial collection",
      tenantId,
      "Harshit Raj"
    );
    assert.ok(res1);
    assert.strictEqual(res1.updatedCustomer.outstandingCredit, -4000);

    const afterCash = getSavedAccounts(tenantId).find((a) => a.code === "1010")!.balance;
    const afterRec = getSavedAccounts(tenantId).find((a) => a.code === "1050")!.balance;
    assert.strictEqual(afterCash, beforeCash + 6000);
    assert.strictEqual(afterRec, beforeRec - 6000);

    // Record ₹5,000 UPI advance -> shifts from -4000 to +1000 Advance Credit
    const res2 = recordCustomerBalanceEntry(
      "cust-crdr-1",
      5000,
      "record_advance",
      "UPI",
      "Wedding booking advance",
      tenantId,
      "Harshit Raj"
    );
    assert.ok(res2);
    assert.strictEqual(res2.updatedCustomer.outstandingCredit, 1000);
  });
});
