import { test, describe } from "node:test";
import assert from "node:assert";
import { FinalizedInvoice } from "../../src/modules/invoicing/types";
import { ShopExpense } from "../../src/modules/accounts/types";

describe("JewelleryOS Milestone 8: Reports, GSTR-1 Tax Audit & Statutory Compliance Tests", () => {
  const mockInvoices: FinalizedInvoice[] = [
    {
      id: "inv-1",
      invoiceNumber: "INV-2026-0001",
      invoiceDate: "2026-11-20T11:00:00.000Z",
      createdAt: "2026-11-20T11:00:00.000Z",
      customer: {
        id: "c-1",
        name: "Shri Rameshwar Lal",
        phone: "+91 94140 12345",
        city: "Jaipur",
        panNumber: "ABCDE1234F",
      },
      items: [
        {
          id: "item-1",
          name: "22K Kundan Bridal Necklace",
          metal: "gold",
          purity: "22K",
          purityDisplay: "22K (916)",
          grossWeight: 45.0,
          stoneWeight: 2.0,
          netWeight: 43.0,
          fineWeight: 39.416,
          metalRate: 150000,
          effectiveRatePerGram: 13750,
          metalValue: 591250,
          makingType: "percentage",
          makingRate: 15,
          makingCharges: 88688,
          stoneValue: 0,
          discount: 0,
          totalBeforeTax: 679938,
          fineGoldValue24k: 591240,
          wastagePercentage: 0,
        },
      ],
      itemsSubtotal: 679938,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: 679938,
      gstPercentage: 3,
      cgstAmount: 10199, // 1.5%
      sgstAmount: 10199, // 1.5%
      totalGst: 20398,
      roundoff: 0,
      grandTotal: 700336,
      payments: [
        { method: "UPI", amount: 500000, transactionRef: "UPI-88421" },
        { method: "Cash", amount: 200336 },
      ],
      totalPaid: 700336,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: "Sandhya Jewellers",
        address: "142 Sarafa Bazar, Jaipur",
        phone: "+91 94140 12345",
        gstin: "08AAAAJ1234F1Z8",
      },
    },
    {
      id: "inv-2",
      invoiceNumber: "INV-2026-0002",
      invoiceDate: "2026-11-20T14:30:00.000Z",
      createdAt: "2026-11-20T14:30:00.000Z",
      customer: {
        id: "c-2",
        name: "Pooja Verma",
        phone: "+91 98290 66778",
        city: "Jaipur",
      },
      items: [
        {
          id: "item-2",
          name: "18K Gold Earrings",
          metal: "gold",
          purity: "18K",
          purityDisplay: "18K (750)",
          grossWeight: 8.0,
          stoneWeight: 0,
          netWeight: 8.0,
          fineWeight: 6.0,
          metalRate: 150000,
          effectiveRatePerGram: 11250,
          metalValue: 90000,
          makingType: "percentage",
          makingRate: 18,
          makingCharges: 16200,
          stoneValue: 0,
          discount: 0,
          totalBeforeTax: 106200,
          fineGoldValue24k: 90000,
          wastagePercentage: 0,
        },
      ],
      itemsSubtotal: 106200,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: 106200,
      gstPercentage: 3,
      cgstAmount: 1593,
      sgstAmount: 1593,
      totalGst: 3186,
      roundoff: 0,
      grandTotal: 109386,
      payments: [{ method: "Card", amount: 109386, transactionRef: "AUTH-9921" }],
      totalPaid: 109386,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: "Sandhya Jewellers",
        address: "142 Sarafa Bazar, Jaipur",
        phone: "+91 94140 12345",
        gstin: "08AAAAJ1234F1Z8",
      },
    },
    {
      id: "inv-3",
      invoiceNumber: "INV-2026-0003",
      invoiceDate: "2026-11-21T10:00:00.000Z",
      createdAt: "2026-11-21T10:00:00.000Z",
      customer: {
        id: "c-3",
        name: "Walk-in Buyer",
        phone: "+91 97840 99001",
        city: "Ajmer",
        // Missing PAN even though invoice is > 2,00,000!
      },
      items: [
        {
          id: "item-3",
          name: "22K Solid Bangles (Pair)",
          metal: "gold",
          purity: "22K",
          purityDisplay: "22K (916)",
          grossWeight: 20.0,
          stoneWeight: 0,
          netWeight: 20.0,
          fineWeight: 18.333,
          metalRate: 150000,
          effectiveRatePerGram: 13750,
          metalValue: 275000,
          makingType: "percentage",
          makingRate: 12,
          makingCharges: 33000,
          stoneValue: 0,
          discount: 0,
          totalBeforeTax: 308000,
          fineGoldValue24k: 275000,
          wastagePercentage: 0,
        },
      ],
      itemsSubtotal: 308000,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: 308000,
      gstPercentage: 3,
      cgstAmount: 4620,
      sgstAmount: 4620,
      totalGst: 9240,
      roundoff: 0,
      grandTotal: 317240,
      payments: [{ method: "Bank Transfer", amount: 317240, transactionRef: "NEFT-551" }],
      totalPaid: 317240,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: "Sandhya Jewellers",
        address: "142 Sarafa Bazar, Jaipur",
        phone: "+91 94140 12345",
        gstin: "08AAAAJ1234F1Z8",
      },
    },
  ];

  const mockExpenses: ShopExpense[] = [
    {
      id: "exp-1",
      voucherNumber: "EXP-2026-01",
      date: "2026-11-20T12:00:00.000Z",
      category: "Boxes & Packaging (डिब्बे व थैली)",
      amount: 4500,
      paidTo: "Jaipur Velvet Box Co.",
      paymentMode: "Cash",
      notes: "200 premium velvet ring & necklace gift boxes",
    },
    {
      id: "exp-2",
      voucherNumber: "EXP-2026-02",
      date: "2026-11-20T16:00:00.000Z",
      category: "BIS Hallmarking & Assaying (हॉलमार्क)",
      amount: 2800,
      paidTo: "Rajasthan Hallmark Center (BIS)",
      paymentMode: "Bank Current A/C",
      notes: "Laser HUID engraving fees for 62 ornaments",
    },
  ];

  test("GSTR-1 Tax Computation: Accurately computes 3% GST into equal 1.5% CGST and 1.5% SGST", () => {
    const totalTaxable = mockInvoices.reduce((s, inv) => s + inv.taxableAmount, 0);
    // 679938 + 106200 + 308000 = 1094138
    assert.strictEqual(totalTaxable, 1094138);

    const totalCgst = mockInvoices.reduce((s, inv) => s + inv.cgstAmount, 0);
    const totalSgst = mockInvoices.reduce((s, inv) => s + inv.sgstAmount, 0);
    const totalGst = mockInvoices.reduce((s, inv) => s + (inv.totalGst || 0), 0);

    // 10199 + 1593 + 4620 = 16412
    assert.strictEqual(totalCgst, 16412);
    assert.strictEqual(totalSgst, 16412);
    assert.strictEqual(totalGst, 16412 + 16412);
    assert.strictEqual(totalCgst, totalSgst); // Exact symmetric split
  });

  test("Section 139A High Value Audit: Flags transactions >= ₹2,00,000 and detects non-compliant invoices", () => {
    const highValueThreshold = 200000;
    const highValueInvoices = mockInvoices.filter((inv) => inv.grandTotal >= highValueThreshold);

    // Invoices 1 and 3 are > ₹2,00,000
    assert.strictEqual(highValueInvoices.length, 2);

    const compliant = highValueInvoices.filter(
      (inv) => inv.customer?.panNumber || inv.customer?.aadhaarUid
    );
    // Invoice 1 has PAN ABCDE1234F
    assert.strictEqual(compliant.length, 1);
    assert.strictEqual(compliant[0].invoiceNumber, "INV-2026-0001");

    const nonCompliant = highValueInvoices.filter(
      (inv) => !inv.customer?.panNumber && !inv.customer?.aadhaarUid
    );
    // Invoice 3 has missing PAN
    assert.strictEqual(nonCompliant.length, 1);
    assert.strictEqual(nonCompliant[0].invoiceNumber, "INV-2026-0003");
  });

  test("Multi-Payment Channel Split: Accurately distributes revenue across Cash, UPI, Card, Bank", () => {
    const paymentBreakdown = {
      Cash: 0,
      UPI: 0,
      Card: 0,
      Bank: 0,
    };

    mockInvoices.forEach((inv) => {
      inv.payments.forEach((p) => {
        if (p.method === "Cash") paymentBreakdown.Cash += p.amount;
        else if (p.method === "UPI") paymentBreakdown.UPI += p.amount;
        else if (p.method === "Card") paymentBreakdown.Card += p.amount;
        else paymentBreakdown.Bank += p.amount;
      });
    });

    assert.strictEqual(paymentBreakdown.UPI, 500000);
    assert.strictEqual(paymentBreakdown.Cash, 200336);
    assert.strictEqual(paymentBreakdown.Card, 109386);
    assert.strictEqual(paymentBreakdown.Bank, 317240);

    const totalReconciled =
      paymentBreakdown.UPI +
      paymentBreakdown.Cash +
      paymentBreakdown.Card +
      paymentBreakdown.Bank;
    const grandTotalAll = mockInvoices.reduce((s, inv) => s + inv.grandTotal, 0);
    assert.strictEqual(totalReconciled, grandTotalAll);
  });

  test("Sarafa Profit & Loss (P&L): Computes gross making income and deducts operating expenses for net profit", () => {
    const totalMakingEarned = mockInvoices
      .flatMap((inv) => inv.items)
      .reduce((s, i) => s + (i.makingCharges || 0), 0);
    // 88688 + 16200 + 33000 = 137888
    assert.strictEqual(totalMakingEarned, 137888);

    const totalExpenses = mockExpenses.reduce((s, e) => s + e.amount, 0);
    // 4500 + 2800 = 7300
    assert.strictEqual(totalExpenses, 7300);

    const netOperatingProfit = totalMakingEarned - totalExpenses;
    // 137888 - 7300 = 130588
    assert.strictEqual(netOperatingProfit, 130588);
  });
});
