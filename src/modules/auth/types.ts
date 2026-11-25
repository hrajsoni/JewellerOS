export type RoleType =
  | "OWNER"
  | "ADMIN"
  | "MANAGER"
  | "ACCOUNTANT"
  | "SALESPERSON"
  | "INVENTORY_CLERK"
  | "KARIGAR_MANAGER";

export type PermissionKey =
  | "VIEW_PURCHASE_COSTS"
  | "VIEW_PROFIT_MARGINS"
  | "VIEW_OWNER_REPORTS"
  | "OVERRIDE_MAKING_CHARGES"
  | "APPLY_MANUAL_DISCOUNT"
  | "MANAGE_EMPLOYEES"
  | "MANAGE_METAL_RATES"
  | "MANAGE_KARIGAR"
  | "MANAGE_GIRVI"
  | "FINALIZE_RETAIL_BILL"
  | "DELETE_RECORDS";

export interface UserSession {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleType;
  businessId: string;
  businessName: string;
  branchId?: string;
  branchName?: string;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: RoleType;
  businessId: string;
  isActive: boolean;
  monthlySalary?: number;
  advanceBalance: number;
  createdAt: string;
  lastLoginAt?: string;
  pin?: string;
  pinHash?: string;
}

export interface LoginCredentials {
  emailOrPhone: string;
  pinOrPassword: string;
}
