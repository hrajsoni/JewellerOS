import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getDefaultShowroomSettings,
  getSavedSettings,
  saveShowroomSettings,
  generateTenantBackupJSON,
  restoreTenantFromJSON,
} from "../../src/modules/settings/store";
import { BackupDataSnapshot } from "../../src/modules/settings/types";
import { saveStockItems, getSavedStock } from "../../src/modules/inventory/store";
import { saveCustomers, getSavedCustomers } from "../../src/modules/customers/store";
import { saveKarigars, getSavedKarigars } from "../../src/modules/karigar/store";

describe("JewelleryOS Milestone 9: Showroom Master Settings & Data Vault Tests", () => {
  const TEST_TENANT = "tenant-settings-test-01";

  test("Showroom Defaults: Returns BIS-compliant Indian showroom configuration", () => {
    const defaultSettings = getDefaultShowroomSettings(TEST_TENANT);

    assert.strictEqual(defaultSettings.tenantId, TEST_TENANT);
    assert.strictEqual(defaultSettings.businessName, "Sandhya Jewellers");
    assert.strictEqual(defaultSettings.bisLicenseNumber, "HM-RJ-2026-8842");
    assert.strictEqual(defaultSettings.gstin, "08AAAAJ1234F1Z8");
    assert.strictEqual(defaultSettings.printConfig.paperSize, "A4");
    assert.ok(defaultSettings.printConfig.termsAndConditions.length >= 3);
    assert.strictEqual(defaultSettings.printConfig.bankDetails.ifscCode, "HDFC0000142");
    assert.strictEqual(defaultSettings.barcodeConfig.labelWidthMm, 50);
    assert.strictEqual(defaultSettings.barcodeConfig.labelHeightMm, 25);
    assert.strictEqual(defaultSettings.branches.length, 2);
    assert.strictEqual(defaultSettings.branches[0].branchCode, "MAIN-01");
  });

  test("Settings Persistence: Persists and retrieves customized showroom settings", () => {
    const initial = getSavedSettings(TEST_TENANT);
    assert.strictEqual(initial.businessName, "Sandhya Jewellers");

    const updated = saveShowroomSettings(
      {
        ...initial,
        businessName: "Sandhya Heritage Diamonds & Jewels",
        bisLicenseNumber: "HM-RJ-2026-9999",
        defaultMakingPercentage: 18,
        barcodeConfig: {
          ...initial.barcodeConfig,
          labelWidthMm: 60,
          labelHeightMm: 30,
        },
      },
      TEST_TENANT
    );

    assert.strictEqual(updated.businessName, "Sandhya Heritage Diamonds & Jewels");
    assert.strictEqual(updated.bisLicenseNumber, "HM-RJ-2026-9999");
    assert.strictEqual(updated.defaultMakingPercentage, 18);

    const retrieved = getSavedSettings(TEST_TENANT);
    assert.strictEqual(retrieved.businessName, "Sandhya Heritage Diamonds & Jewels");
    assert.strictEqual(retrieved.barcodeConfig.labelWidthMm, 60);
  });

  test("Backup Generation: Generates complete 1-click JSON snapshot across all 14 modules", () => {
    // Seed some inventory and customer records
    saveStockItems(
      [
        {
          id: "STK-SETT-001",
          sku: "GOLD-RNG-001",
          barcode: "890001001",
          name: "22K Traditional Kundan Ring",
          category: "Rings",
          metal: "gold",
          purity: "22K",
          purityDisplay: "22K (916)",
          grossWeight: 5.5,
          stoneWeight: 0.3,
          netWeight: 5.2,
          fineWeight: 4.7668,
          acquisitionCost: 35000,
          defaultMakingType: "percentage",
          defaultMakingValue: 12,
          trayLocation: "Counter 1",
          status: "in_showcase",
          dateAdded: "2026-11-24",
        },
      ],
      TEST_TENANT
    );

    saveCustomers(
      [
        {
          id: "CUST-SETT-001",
          name: "Ramesh Sharma",
          phone: "9829012345",
          city: "Jaipur",
          address: "Bapu Nagar, Jaipur",
          customerType: "retail",
          totalPurchases: 42000,
          totalGoldWeightGrams: 5.2,
          totalSilverWeightGrams: 0,
          totalInvoicesCount: 1,
          outstandingCredit: 0,
          lastVisitDate: "2026-11-24",
          notes: "Regular customer",
        },
      ],
      TEST_TENANT
    );

    const snapshot = generateTenantBackupJSON(TEST_TENANT, "Sandhya Jewellers");

    assert.strictEqual(snapshot.version, "2.0.0");
    assert.strictEqual(snapshot.tenantId, TEST_TENANT);
    assert.ok(snapshot.data.stockItems.some((s) => s.id === "STK-SETT-001"));
    assert.ok(snapshot.data.customers.some((c) => c.id === "CUST-SETT-001"));
    assert.ok(snapshot.data.settings !== undefined);
    assert.ok(Array.isArray(snapshot.data.invoices));
    assert.ok(Array.isArray(snapshot.data.karigars));
    assert.ok(Array.isArray(snapshot.data.suppliers));
    assert.ok(Array.isArray(snapshot.data.memos));
    assert.ok(Array.isArray(snapshot.data.repairs));
    assert.ok(Array.isArray(snapshot.data.accounts));
  });

  test("Database Restoration: Accurately restores data from JSON snapshot into partition", () => {
    const targetTenant = "tenant-restore-target-99";

    const mockSnapshot: BackupDataSnapshot = {
      version: "2.0.0",
      exportedAt: new Date().toISOString(),
      tenantId: targetTenant,
      shopName: "Restored Jewels Jaipur",
      data: {
        settings: {
          ...getDefaultShowroomSettings(targetTenant),
          businessName: "Restored Jewels Jaipur",
        },
        invoices: [],
        stockItems: [
          {
            id: "STK-RESTORE-1",
            sku: "SLV-ANK-001",
            barcode: "890009999",
            name: "925 Sterling Silver Payal",
            category: "Silver Articles & Payal",
            metal: "silver",
            purity: "925",
            purityDisplay: "925 Sterling",
            grossWeight: 50.0,
            stoneWeight: 0,
            netWeight: 50.0,
            fineWeight: 46.25,
            acquisitionCost: 4000,
            defaultMakingType: "fixed",
            defaultMakingValue: 500,
            trayLocation: "Counter 2",
            status: "in_showcase",
            dateAdded: "2026-11-24",
          },
        ],
        customers: [
          {
            id: "CUST-RESTORE-1",
            name: "Sunita Verma",
            phone: "9414055555",
            city: "Jaipur",
            address: "Malviya Nagar, Jaipur",
            customerType: "retail",
            totalPurchases: 0,
            totalGoldWeightGrams: 0,
            totalSilverWeightGrams: 0,
            totalInvoicesCount: 0,
            outstandingCredit: 0,
            lastVisitDate: "2026-11-24",
            notes: "Walk-in",
          },
        ],
        karigars: [
          {
            id: "KAR-RESTORE-1",
            name: "Babulal Soni",
            phone: "9829033333",
            workshopCity: "Jaipur",
            specialty: "Kundan Jadau",
            pureGoldBalanceGrams: 10.5,
            pureSilverBalanceGrams: 0,
            labourBalanceDue: 5000,
            status: "active",
            notes: "Master artisan",
          },
        ],
        karigarTxns: [],
        jobCards: [],
        suppliers: [],
        purchases: [],
        supplierPayments: [],
        girviLoans: [],
        girviPayments: [],
        memos: [],
        b2bPartners: [],
        repairs: [],
        bookings: [],
        accounts: [],
        expenses: [],
        dailyClosings: [],
        staff: [],
        staffPayments: [],
      },
    };

    const result = restoreTenantFromJSON(mockSnapshot, targetTenant);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.recordCounts.stockItems, 1);
    assert.strictEqual(result.recordCounts.customers, 1);
    assert.strictEqual(result.recordCounts.karigars, 1);

    // Verify restored records in storage
    const restoredStock = getSavedStock(targetTenant);
    assert.ok(restoredStock.some((s) => s.id === "STK-RESTORE-1"));

    const restoredCustomers = getSavedCustomers(targetTenant);
    assert.ok(restoredCustomers.some((c) => c.id === "CUST-RESTORE-1"));

    const restoredKarigars = getSavedKarigars(targetTenant);
    assert.ok(restoredKarigars.some((k) => k.id === "KAR-RESTORE-1"));

    const restoredSettings = getSavedSettings(targetTenant);
    assert.strictEqual(restoredSettings.businessName, "Restored Jewels Jaipur");
  });

  test("Error Handling: Handles corrupted snapshot without uncaught exception", () => {
    const corruptedSnapshot = {} as any;
    const result = restoreTenantFromJSON(corruptedSnapshot, "corrupted-tenant");
    assert.strictEqual(result.success, false);
    assert.ok(result.message.includes("Failed to restore"));
  });
});
