export type StaffRole =
  | "Counter Salesman"
  | "Senior Sales Executive"
  | "Safe & Vault Custodian"
  | "Billing Accountant"
  | "Store Manager"
  | "Karigar Supervisor";

export interface StaffMember {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  monthlySalary: number;
  advanceBalance: number; // ₹ cash advance currently owed
  joiningDate: string;
  aadhaar?: string;
  status: "active" | "on_leave" | "resigned";
  notes?: string;
}

export interface StaffPaymentRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  type: "advance" | "salary_payout" | "incentive";
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Bank Transfer";
  notes?: string;
}

export interface AddStaffInput {
  name: string;
  phone: string;
  role: StaffRole;
  monthlySalary: number;
  aadhaar?: string;
  notes?: string;
}

export interface IssueAdvanceInput {
  staffId: string;
  amount: number;
  paymentMethod: "Cash" | "UPI" | "Bank Transfer";
  notes?: string;
}

export interface PaySalaryInput {
  staffId: string;
  salaryMonth: string;
  baseSalary: number;
  deductAdvance: number;
  netPaid: number;
  paymentMethod: "Cash" | "UPI" | "Bank Transfer";
  notes?: string;
}
