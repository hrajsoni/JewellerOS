export type JobCardStatus =
  | "created"
  | "in_production"
  | "hallmarking"
  | "completed"
  | "delivered"
  | "cancelled";

export interface JobCard {
  id: string;
  jobCardNumber: string; // e.g. "JC-2026-001"
  karigarId: string;
  karigarName: string;
  customerName?: string;
  customerPhone?: string;
  category: string; // "Bangles" | "Necklace" | "Ring" | "Chains" | "Earrings" | "Kundan Meena"
  title: string;
  description: string;
  metal: "gold" | "silver";
  targetGrossWeight: number; // in grams
  targetNetWeight: number; // in grams
  purity: string; // "22K (916)" | "18K (750)" | "24K (999)"
  issuedFineWeightGrams: number;
  expectedDeliveryDate: string; // YYYY-MM-DD
  status: JobCardStatus;
  labourRate: number; // ₹ per gram or fixed ₹
  labourType: "per_gram" | "fixed";
  allowedWastagePercent: number; // e.g. 1.2%
  huid?: string; // Bureau of Indian Standards 6-digit alphanumeric
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateJobCardInput {
  karigarId: string;
  karigarName: string;
  customerName?: string;
  customerPhone?: string;
  category: string;
  title: string;
  description: string;
  metal: "gold" | "silver";
  targetGrossWeight: number;
  targetNetWeight: number;
  purity: string;
  issuedFineWeightGrams: number;
  expectedDeliveryDate: string;
  labourRate: number;
  labourType: "per_gram" | "fixed";
  allowedWastagePercent: number;
  notes?: string;
}

export interface Karigar {
  id: string;
  name: string;
  phone: string;
  workshopCity: string;
  specialty: string; // e.g. "Plain Gold Bangles", "Kundan Meena", "Casting & Chains", "Diamond Setting"
  pureGoldBalanceGrams: number; // positive = karigar owes gold to shop
  pureSilverBalanceGrams: number;
  labourBalanceDue: number; // ₹ shop owes to karigar for labour
  status: "active" | "inactive";
  notes?: string;
}

export interface KarigarTransaction {
  id: string;
  karigarId: string;
  karigarName: string;
  date: string;
  type: "issue_metal" | "receive_ornament" | "labour_payment";
  metal: "gold" | "silver";
  ornamentName?: string;
  jobCardId?: string;
  grossWeight?: number;
  netWeight?: number;
  fineWeightDelta: number; // positive = gold issued to karigar, negative = fine gold received back
  purity?: string;
  labourAmount?: number;
  paymentAmount?: number;
  notes?: string;
}

export interface IssueMetalInput {
  karigarId: string;
  metal: "gold" | "silver";
  grossWeight: number;
  purity: string;
  fineWeight: number;
  ornamentOrderName: string;
  jobCardId?: string;
  notes?: string;
}

export interface ReceiveOrnamentInput {
  karigarId: string;
  metal: "gold" | "silver";
  ornamentName: string;
  grossWeight: number;
  netWeight: number;
  purity: string;
  fineWeightDeducted: number;
  labourCharges: number;
  jobCardId?: string;
  huid?: string;
  notes?: string;
}

export interface PayLabourInput {
  karigarId: string;
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Bank";
  notes?: string;
}

/**
 * Purity touch ratios based on standard Indian Sarafa conventions
 */
export const STANDARD_PURITY_TOUCH: Record<string, number> = {
  "24K": 0.999,
  "22K": 0.9167,
  "18K": 0.75,
  "14K": 0.585,
  "999 Fine Silver": 0.999,
  "925 Sterling Silver": 0.925,
};

/**
 * Generates formatted WhatsApp text statement for Karigar Ledger (कारीगर पर्चा / हिसाब)
 */
export function generateKarigarWhatsAppText(
  karigar: Karigar,
  shopName: string,
  recentTxns: KarigarTransaction[] = []
): string {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const lines = [
    `⚖️ *${shopName.toUpperCase()} — KARIGAR HISAB PARCHA (कारीगर हिसाब पर्चा)*`,
    `📅 Date: ${dateStr}`,
    `👤 Artisan / Karigar: *${karigar.name}*`,
    `📍 Workshop: ${karigar.workshopCity} | 📞 ${karigar.phone}`,
    `----------------------------------------`,
    `🪙 *CURRENT BULLION BALANCES IN HAND (धातु बाकी):*`,
    `• Fine Gold Balance: *${karigar.pureGoldBalanceGrams.toFixed(3)} g* ${karigar.pureGoldBalanceGrams > 0 ? "(उधार / With Karigar)" : "(Nil)"}`,
    `• Fine Silver Balance: *${karigar.pureSilverBalanceGrams.toFixed(3)} g*`,
    ``,
    `💵 *LABOUR CHARGES SUMMARY (मजदूरी हिसाब):*`,
    `• Total Making Charges Due: *₹${karigar.labourBalanceDue.toLocaleString("en-IN")}*`,
    `----------------------------------------`,
  ];

  if (recentTxns.length > 0) {
    lines.push(`📋 *RECENT ENTRIES (हालिया लेन-देन):*`);
    recentTxns.slice(0, 3).forEach((t) => {
      const typeLabel =
        t.type === "issue_metal"
          ? "Metal Issued (+)"
          : t.type === "receive_ornament"
          ? "Ornament Received (-)"
          : "Labour Paid (₹)";
      lines.push(
        `• ${new Date(t.date).toLocaleDateString("en-IN")}: ${t.ornamentName || "Bullion"} | ${typeLabel} ${
          t.fineWeightDelta !== 0
            ? `${t.fineWeightDelta > 0 ? "+" : ""}${t.fineWeightDelta.toFixed(3)}g`
            : `₹${(t.paymentAmount || t.labourAmount || 0).toLocaleString("en-IN")}`
        }`
      );
    });
    lines.push(`----------------------------------------`);
  }

  lines.push(`_Please cross-verify this ledger with your workshop bahi/record. Thank you!_`);
  return lines.join("\n");
}
