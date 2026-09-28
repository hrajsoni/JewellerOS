export type CustomerType = "retail" | "vip" | "wholesale";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  gstin?: string;
  customerType: CustomerType;
  totalPurchases: number;
  totalGoldWeightGrams: number;
  totalSilverWeightGrams: number;
  totalInvoicesCount: number;
  outstandingCredit: number; // Positive = advance credit, Negative = amount due
  lastVisitDate: string;
  notes?: string;
}

export interface NewCustomerInput {
  name: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  gstin?: string;
  customerType?: CustomerType;
  notes?: string;
}
