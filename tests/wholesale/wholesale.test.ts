import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getSavedMemos,
  getSavedB2BPartners,
  createConsignmentMemo,
  returnMemoItems,
  convertMemoToInvoice,
} from "../../src/modules/wholesale/store";
import {
  CreateConsignmentMemoInput,
  generateMemoWhatsAppText,
} from "../../src/modules/wholesale/types";

describe("JewelleryOS Milestone 7: Wholesale & Consignment Memos (कच्चा पर्चा / जांगड़) Tests", () => {
  const tenantId = "test-tenant-wholesale-01";

  test("Memo Issue: Issue consignment goods on approval without tax invoice or GST liability", () => {
    const partners = getSavedB2BPartners(tenantId);
    const partner = partners[0]; // Radha Govind Jewellers
    assert.ok(partner);

    const input: CreateConsignmentMemoInput = {
      jewellerPartnerName: partner.businessName,
      jewellerPhone: partner.phone,
      jewellerCity: partner.city,
      jewellerGstin: partner.gstin,
      validDays: 7,
      notes: "Showroom selection for upcoming wedding exhibition",
      items: [
        {
          name: "22K Antique Temple Choker",
          category: "Necklaces & Sets",
          metal: "gold",
          purity: "22K",
          grossWeight: 45.2,
          netWeight: 44.0,
          fineWeight: 40.333,
          wholesaleRate: 13750,
          totalValue: 605000,
        },
        {
          name: "18K Diamond Solitaire Bangles",
          category: "Bangles & Kadas",
          metal: "gold",
          purity: "18K",
          grossWeight: 28.5,
          netWeight: 27.2,
          fineWeight: 20.4,
          wholesaleRate: 11250,
          totalValue: 306000,
        },
      ],
    };

    const memo = createConsignmentMemo(input, tenantId);

    assert.ok(memo.memoNumber.startsWith("MEMO-2026-"));
    assert.strictEqual(memo.status, "active_issued");
    assert.strictEqual(memo.totalPieces, 2);
    assert.strictEqual(memo.totalGrossWeight, 73.7);
    assert.strictEqual(memo.totalNetWeight, 71.2);
    assert.strictEqual(memo.totalEstimatedValue, 911000);
    assert.strictEqual(memo.items.length, 2);
    assert.strictEqual(memo.items[0].status, "on_memo");
    assert.strictEqual(memo.items[1].status, "on_memo");
  });

  test("Memo Partial Return: Return unsold ornaments to showcase inventory", () => {
    const memos = getSavedMemos(tenantId);
    const activeMemo = memos[0];
    const itemToReturn = activeMemo.items[0];

    const updatedMemo = returnMemoItems(activeMemo.id, [itemToReturn.id], tenantId);

    assert.ok(updatedMemo);
    assert.strictEqual(updatedMemo.status, "partially_settled");
    const returnedItem = updatedMemo.items.find((i) => i.id === itemToReturn.id);
    assert.strictEqual(returnedItem?.status, "returned_to_stock");
    assert.ok(returnedItem?.returnedAt);

    // Remaining item stays on memo
    const remainingItem = updatedMemo.items.find((i) => i.id !== itemToReturn.id);
    assert.strictEqual(remainingItem?.status, "on_memo");
  });

  test("Memo Conversion to Invoice: Convert retained pieces to wholesale tax bill", () => {
    const memos = getSavedMemos(tenantId);
    const activeMemo = memos[0];
    const itemToConvert = activeMemo.items.find((i) => i.status === "on_memo");
    assert.ok(itemToConvert);

    const invoiceNum = "WH-INV-2026-0089";
    const convertedMemo = convertMemoToInvoice(
      activeMemo.id,
      [itemToConvert.id],
      invoiceNum,
      tenantId
    );

    assert.ok(convertedMemo);
    assert.strictEqual(convertedMemo.status, "partially_settled");
    const convertedItem = convertedMemo.items.find((i) => i.id === itemToConvert.id);
    assert.strictEqual(convertedItem?.status, "sold_billed");
    assert.strictEqual(convertedMemo.convertedInvoiceNumber, invoiceNum);
  });

  test("WhatsApp Consignment Memo Formatter: Generates valid Sarafa Trade Dispatch Statement", () => {
    const memos = getSavedMemos(tenantId);
    const memo = memos[0];

    const text = generateMemoWhatsAppText(memo, "Sandhya Jewellers");

    assert.ok(text.includes("CONSIGNMENT MEMO (कच्चा पर्चा / जांगड़)"));
    assert.ok(text.includes(memo.memoNumber));
    assert.ok(text.toUpperCase().includes("SANDHYA JEWELLERS"));
    assert.ok(text.includes(memo.jewellerPartnerName));
    assert.ok(text.includes("Goods remain property of Sandhya Jewellers"));
  });
});
