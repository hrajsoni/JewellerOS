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
  notes?: string;
}

export interface PayLabourInput {
  karigarId: string;
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Bank";
  notes?: string;
}
