export interface PledgedOrnament {
  id: string;
  name: string;
  metal: "gold" | "silver";
  purity: string;
  grossWeight: number;
  netWeight: number;
  marketValuation: number;
  remarks?: string;
}

export type GirviStatus = "active" | "released" | "overdue" | "auction_notice";

export interface GirviLoan {
  id: string;
  loanNumber: string; // e.g. GL-2026-0142
  startDate: string; // ISO string
  dueDate: string;
  customerName: string;
  customerPhone: string;
  customerAadhaar?: string;
  customerAddress: string;
  customerCity: string;
  ornaments: PledgedOrnament[];
  principalAmount: number; // ₹ Loan given
  monthlyInterestRate: number; // e.g. 1.5% per month (सैंकड़ा)
  interestType: "simple" | "compound";
  totalInterestPaid: number;
  principalRepaid: number;
  status: GirviStatus;
  packetNumber?: string; // e.g. PKT-104
  safeLocation?: string; // e.g. Tijori 1, Dabba A
  witnessName?: string;
  notes?: string;
}

export interface NewGirviInput {
  customerName: string;
  customerPhone: string;
  customerAadhaar?: string;
  customerAddress: string;
  customerCity?: string;
  ornamentName: string;
  metal: "gold" | "silver";
  purity: string;
  grossWeight: number;
  netWeight: number;
  principalAmount: number;
  monthlyInterestRate: number;
  interestType?: "simple" | "compound";
  durationMonths?: number;
  packetNumber?: string;
  safeLocation?: string;
  notes?: string;
}

export interface GirviPaymentRecord {
  id: string;
  loanId: string;
  loanNumber: string;
  date: string;
  type: "interest" | "principal";
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Bank";
  receiptNumber: string;
  notes?: string;
}

export interface InterestAccrualResult {
  monthsElapsed: number;
  daysElapsed: number;
  totalAccruedInterest: number;
  netPayableToRelease: number;
}

/**
 * Generate 1-Click WhatsApp Girvi Form 7 Pledge Ticket / Receipt (गिरवी पर्चा)
 */
export function generateGirviWhatsAppTicket(
  loan: GirviLoan,
  shopName: string,
  accrual: InterestAccrualResult
): string {
  const startStr = new Date(loan.startDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dueStr = new Date(loan.dueDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const remainingPrincipal = loan.principalAmount - loan.principalRepaid;
  const ornamentsSummary = loan.ornaments
    .map((o) => `• ${o.name} (${o.purity}): Gross ${o.grossWeight.toFixed(3)}g, Net ${o.netWeight.toFixed(3)}g`)
    .join("\n");

  const lines = [
    `🏦 *${shopName.toUpperCase()} — GIRVI PAWN TICKET (गिरवी पर्चा / रसीद)*`,
    `🔢 Loan Account #: *${loan.loanNumber}*`,
    `📅 Pledge Date: ${startStr} (Due: ${dueStr})`,
    `👤 Borrower: *${loan.customerName}* | 📞 ${loan.customerPhone}`,
    loan.customerAadhaar ? `🪪 Aadhaar: ${loan.customerAadhaar}` : ``,
    `📦 Safe Vault Box: *${loan.safeLocation || "Tijori Safe"}* | Packet: *${loan.packetNumber || "PKT"}*`,
    `----------------------------------------`,
    `💍 *PLEDGED ARTICLES (बंधक गहने):*`,
    ornamentsSummary,
    `----------------------------------------`,
    `💵 *FINANCIAL ACCOUNTING (खाता स्थिति):*`,
    `• Principal Loan (मूलधन): *₹${loan.principalAmount.toLocaleString("en-IN")}*`,
    loan.principalRepaid > 0
      ? `• Principal Repaid: ₹${loan.principalRepaid.toLocaleString("en-IN")} (Net Balance: *₹${remainingPrincipal.toLocaleString("en-IN")}*)`
      : ``,
    `• Interest Rate: *${loan.monthlyInterestRate}% / month (${loan.interestType})*`,
    `• Accrued Interest (${accrual.monthsElapsed} mos): *₹${accrual.totalAccruedInterest.toLocaleString("en-IN")}*`,
    `• Total Interest Paid so far: *₹${loan.totalInterestPaid.toLocaleString("en-IN")}*`,
    `• Net Payable to Release Today: *₹${accrual.netPayableToRelease.toLocaleString("en-IN")}*`,
    `----------------------------------------`,
    `_Pledged ornaments are safely sealed in tamper-evident packets in our vault. Standard Sarafa pawn brokering rules apply._`,
  ].filter(Boolean);

  return lines.join("\n");
}
