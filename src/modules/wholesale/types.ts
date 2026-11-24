export type MemoItemStatus = "on_memo" | "sold_billed" | "returned_to_stock";
export type MemoStatus =
  | "active_issued"
  | "partially_settled"
  | "fully_returned"
  | "fully_converted_invoice";

export interface ConsignmentMemoItem {
  id: string;
  stockItemId?: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  metal: "gold" | "silver";
  purity: string;
  grossWeight: number; // in grams
  netWeight: number;
  fineWeight: number;
  wholesaleRate: number; // rate per gram or piece rate
  totalValue: number;
  status: MemoItemStatus;
  returnedAt?: string;
}

export interface ConsignmentMemo {
  id: string;
  memoNumber: string; // e.g. "MEMO-2026-001" (कच्चा पर्चा / जांगड़)
  jewellerPartnerName: string;
  jewellerPhone: string;
  jewellerCity: string;
  jewellerGstin?: string;
  issueDate: string; // YYYY-MM-DD
  validUntilDate: string; // YYYY-MM-DD
  items: ConsignmentMemoItem[];
  totalPieces: number;
  totalGrossWeight: number;
  totalNetWeight: number;
  totalFineWeight: number;
  totalEstimatedValue: number;
  status: MemoStatus;
  notes?: string;
  convertedInvoiceNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMemoItemInput {
  stockItemId?: string;
  sku?: string;
  barcode?: string;
  name: string;
  category: string;
  metal: "gold" | "silver";
  purity: string;
  grossWeight: number;
  netWeight: number;
  fineWeight: number;
  wholesaleRate: number;
  totalValue: number;
}

export interface CreateConsignmentMemoInput {
  jewellerPartnerName: string;
  jewellerPhone: string;
  jewellerCity?: string;
  jewellerGstin?: string;
  validDays?: number;
  items: CreateMemoItemInput[];
  notes?: string;
}

export interface B2BPartnerProfile {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  city: string;
  address: string;
  gstin?: string;
  pan?: string;
  totalMemoCount: number;
  activeMemoValue: number;
  totalPurchasedValue: number;
  notes?: string;
}

/**
 * Generate formatted WhatsApp message for Consignment Memo / Jangad (कच्चा पर्चा / जांगड़)
 */
export function generateMemoWhatsAppText(memo: ConsignmentMemo, shopName: string): string {
  const dateStr = new Date(memo.issueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const validStr = new Date(memo.validUntilDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lines = [
    `📄 *${shopName.toUpperCase()} — CONSIGNMENT MEMO (कच्चा पर्चा / जांगड़)*`,
    `🔢 Memo #: *${memo.memoNumber}*`,
    `📅 Date of Issue: ${dateStr} (Valid until: ${validStr})`,
    `🤝 Issued To: *${memo.jewellerPartnerName}*`,
    `📍 City: ${memo.jewellerCity} | 📞 ${memo.jewellerPhone}`,
    `----------------------------------------`,
    `📦 *ARTICLES ON APPROVAL / MEMO (${memo.items.length} items):*`,
  ];

  memo.items.forEach((item, idx) => {
    lines.push(
      `${idx + 1}. *${item.name}* [${item.purity}]` +
        `\n   • Gross: ${item.grossWeight.toFixed(3)}g | Net: ${item.netWeight.toFixed(3)}g` +
        `\n   • Status: ${item.status.toUpperCase()}`
    );
  });

  lines.push(
    `----------------------------------------`,
    `⚖️ Total Gross Wt: *${memo.totalGrossWeight.toFixed(3)} g*`,
    `✨ Total Net Wt: *${memo.totalNetWeight.toFixed(3)} g*`,
    `💰 Estimated Value: *₹${memo.totalEstimatedValue.toLocaleString("en-IN")}*`,
    `----------------------------------------`,
    `_Note: Goods remain property of ${shopName} until billed or returned. Please inspect and confirm receipt._`
  );

  return lines.join("\n");
}
