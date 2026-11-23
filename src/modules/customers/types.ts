export type CustomerType = "retail" | "vip" | "wholesale";

export interface CustomerDepositRecord {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  amount: number;
  method: "Cash" | "UPI" | "Bank Transfer" | "Cheque";
  referenceNo?: string;
  type: "advance" | "udhar_repayment";
  notes?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city: string;
  address?: string;
  gstin?: string;
  panNumber?: string; // Statutory compliance for bills > ₹2,00,000 (Sec 139A)
  aadhaarNumber?: string;
  customerType: CustomerType;
  totalPurchases: number;
  totalGoldWeightGrams: number;
  totalSilverWeightGrams: number;
  totalInvoicesCount: number;
  outstandingCredit: number; // Positive = advance credit, Negative = amount due
  creditLimit?: number;
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
  panNumber?: string;
  aadhaarNumber?: string;
  customerType?: CustomerType;
  creditLimit?: number;
  notes?: string;
}
