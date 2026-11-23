import { RoleType, PermissionKey } from "./types";

/**
 * Strict Role-Based Access Control (RBAC) Permission Matrix
 * 
 * Non-negotiable Rule: Salespersons, Inventory Clerks, and Karigar Managers
 * must never see purchase costs, shop profit margins, or owner accounts.
 */
export const ROLE_PERMISSIONS: Record<RoleType, Record<PermissionKey, boolean>> = {
  OWNER: {
    VIEW_PURCHASE_COSTS: true,
    VIEW_PROFIT_MARGINS: true,
    VIEW_OWNER_REPORTS: true,
    OVERRIDE_MAKING_CHARGES: true,
    APPLY_MANUAL_DISCOUNT: true,
    MANAGE_EMPLOYEES: true,
    MANAGE_METAL_RATES: true,
    MANAGE_KARIGAR: true,
    MANAGE_GIRVI: true,
    FINALIZE_RETAIL_BILL: true,
    DELETE_RECORDS: true,
  },
  ADMIN: {
    VIEW_PURCHASE_COSTS: true,
    VIEW_PROFIT_MARGINS: true,
    VIEW_OWNER_REPORTS: true,
    OVERRIDE_MAKING_CHARGES: true,
    APPLY_MANUAL_DISCOUNT: true,
    MANAGE_EMPLOYEES: true,
    MANAGE_METAL_RATES: true,
    MANAGE_KARIGAR: true,
    MANAGE_GIRVI: true,
    FINALIZE_RETAIL_BILL: true,
    DELETE_RECORDS: false, // Owners only
  },
  MANAGER: {
    VIEW_PURCHASE_COSTS: true,
    VIEW_PROFIT_MARGINS: false, // Hidden from store managers
    VIEW_OWNER_REPORTS: false,
    OVERRIDE_MAKING_CHARGES: true,
    APPLY_MANUAL_DISCOUNT: true,
    MANAGE_EMPLOYEES: false,
    MANAGE_METAL_RATES: true,
    MANAGE_KARIGAR: true,
    MANAGE_GIRVI: true,
    FINALIZE_RETAIL_BILL: true,
    DELETE_RECORDS: false,
  },
  ACCOUNTANT: {
    VIEW_PURCHASE_COSTS: true,
    VIEW_PROFIT_MARGINS: true,
    VIEW_OWNER_REPORTS: true,
    OVERRIDE_MAKING_CHARGES: false,
    APPLY_MANUAL_DISCOUNT: false,
    MANAGE_EMPLOYEES: false,
    MANAGE_METAL_RATES: false,
    MANAGE_KARIGAR: false,
    MANAGE_GIRVI: false,
    FINALIZE_RETAIL_BILL: false,
    DELETE_RECORDS: false,
  },
  SALESPERSON: {
    VIEW_PURCHASE_COSTS: false, // Strictly prohibited
    VIEW_PROFIT_MARGINS: false, // Strictly prohibited
    VIEW_OWNER_REPORTS: false,  // Strictly prohibited
    OVERRIDE_MAKING_CHARGES: false,
    APPLY_MANUAL_DISCOUNT: true, // Up to system threshold
    MANAGE_EMPLOYEES: false,
    MANAGE_METAL_RATES: false,
    MANAGE_KARIGAR: false,
    MANAGE_GIRVI: false,
    FINALIZE_RETAIL_BILL: true,
    DELETE_RECORDS: false,
  },
  INVENTORY_CLERK: {
    VIEW_PURCHASE_COSTS: true,  // Required for stock entry verification
    VIEW_PROFIT_MARGINS: false,
    VIEW_OWNER_REPORTS: false,
    OVERRIDE_MAKING_CHARGES: false,
    APPLY_MANUAL_DISCOUNT: false,
    MANAGE_EMPLOYEES: false,
    MANAGE_METAL_RATES: false,
    MANAGE_KARIGAR: false,
    MANAGE_GIRVI: false,
    FINALIZE_RETAIL_BILL: false,
    DELETE_RECORDS: false,
  },
  KARIGAR_MANAGER: {
    VIEW_PURCHASE_COSTS: false,
    VIEW_PROFIT_MARGINS: false,
    VIEW_OWNER_REPORTS: false,
    OVERRIDE_MAKING_CHARGES: false,
    APPLY_MANUAL_DISCOUNT: false,
    MANAGE_EMPLOYEES: false,
    MANAGE_METAL_RATES: false,
    MANAGE_KARIGAR: true,
    MANAGE_GIRVI: false,
    FINALIZE_RETAIL_BILL: false,
    DELETE_RECORDS: false,
  },
};

export function hasPermission(role: RoleType, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

export function getRoleBadgeColor(role: RoleType): "gold" | "emerald" | "coral" | "neutral" {
  switch (role) {
    case "OWNER":
      return "gold";
    case "ADMIN":
    case "MANAGER":
      return "emerald";
    case "ACCOUNTANT":
      return "coral";
    default:
      return "neutral";
  }
}
