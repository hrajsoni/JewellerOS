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

export interface GirviLoan {
  id: string;
  loanNumber: string; // e.g. GL-2026-0142
  startDate: string;  // ISO string
  dueDate: string;
  customerName: string;
  customerPhone: string;
  customerAadhaar?: string;
  customerAddress: string;
  customerCity: string;
  ornaments: PledgedOrnament[];
  principalAmount: number; // ₹ Loan given
  monthlyInterestRate: number; // e.g. 1.5% per month
  interestType: "simple" | "compound";
  totalInterestPaid: number;
  principalRepaid: number;
  status: "active" | "released" | "overdue" | "auction_notice";
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
