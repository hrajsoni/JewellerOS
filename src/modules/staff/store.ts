import {
  StaffMember,
  StaffPaymentRecord,
  AddStaffInput,
  IssueAdvanceInput,
  PaySalaryInput,
} from "./types";

const STAFF_STORAGE_KEY = "jewellery_os_staff_v2";
const STAFF_PAYMENTS_KEY = "jewellery_os_staff_payments_v2";

export const INITIAL_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Suresh Sharma",
    phone: "+91 94140 22334",
    role: "Senior Sales Executive",
    monthlySalary: 32000,
    advanceBalance: 5000,
    joiningDate: "2023-04-01T00:00:00.000Z",
    aadhaar: "XXXX-XXXX-9021",
    status: "active",
    notes: "Expert in bridal polki & 22k jewellery sales.",
  },
  {
    id: "staff-2",
    name: "Dinesh Verma",
    phone: "+91 98291 66778",
    role: "Safe & Vault Custodian",
    monthlySalary: 28000,
    advanceBalance: 0,
    joiningDate: "2022-08-15T00:00:00.000Z",
    aadhaar: "XXXX-XXXX-4412",
    status: "active",
    notes: "Joint keyholder for main basement vault and daily tally.",
  },
  {
    id: "staff-3",
    name: "Pooja Soni",
    phone: "+91 97842 55110",
    role: "Billing Accountant",
    monthlySalary: 25000,
    advanceBalance: 2000,
    joiningDate: "2024-01-10T00:00:00.000Z",
    aadhaar: "XXXX-XXXX-8876",
    status: "active",
    notes: "Manages GST e-way bills and customer KYC entries.",
  },
];

export const INITIAL_STAFF_PAYMENTS: StaffPaymentRecord[] = [
  {
    id: "spay-1",
    staffId: "staff-1",
    staffName: "Suresh Sharma",
    date: "2026-09-10T12:00:00.000Z",
    type: "advance",
    amount: 5000,
    paymentMethod: "Cash",
    notes: "Festive family advance, to deduct in September salary.",
  },
  {
    id: "spay-2",
    staffId: "staff-3",
    staffName: "Pooja Soni",
    date: "2026-09-15T15:00:00.000Z",
    type: "advance",
    amount: 2000,
    paymentMethod: "UPI",
    notes: "Medical prescription advance.",
  },
];

export function getTenantStaffKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_staff` : STAFF_STORAGE_KEY;
}

export function getTenantStaffPaymentsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_staff_payments` : STAFF_PAYMENTS_KEY;
}

export function getSavedStaff(tenantId?: string): StaffMember[] {
  if (typeof window === "undefined") return INITIAL_STAFF;
  try {
    const key = getTenantStaffKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantStaffKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_STAFF : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STAFF;
  }
}

export function saveStaff(staff: StaffMember[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantStaffKey(tenantId);
    localStorage.setItem(key, JSON.stringify(staff));
  } catch (err) {
    console.error("Failed to save staff:", err);
  }
}

export function getSavedStaffPayments(tenantId?: string): StaffPaymentRecord[] {
  if (typeof window === "undefined") return INITIAL_STAFF_PAYMENTS;
  try {
    const key = getTenantStaffPaymentsKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantStaffPaymentsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_STAFF_PAYMENTS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STAFF_PAYMENTS;
  }
}

export function saveStaffPayments(payments: StaffPaymentRecord[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantStaffPaymentsKey(tenantId);
    localStorage.setItem(key, JSON.stringify(payments));
  } catch (err) {
    console.error("Failed to save staff payments:", err);
  }
}

export function addStaffMember(input: AddStaffInput, tenantId?: string): StaffMember {
  const newStaff: StaffMember = {
    id: `staff-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    role: input.role,
    monthlySalary: input.monthlySalary,
    advanceBalance: 0,
    joiningDate: new Date().toISOString(),
    aadhaar: input.aadhaar?.trim() || undefined,
    status: "active",
    notes: input.notes?.trim() || undefined,
  };

  const existing = getSavedStaff(tenantId);
  const updated = [...existing, newStaff];
  saveStaff(updated, tenantId);
  return newStaff;
}

export function issueStaffAdvance(input: IssueAdvanceInput, tenantId?: string): StaffPaymentRecord {
  const staffList = getSavedStaff(tenantId);
  const member = staffList.find((s) => s.id === input.staffId);
  const name = member ? member.name : "Staff Member";

  const record: StaffPaymentRecord = {
    id: `spay-${Date.now()}`,
    staffId: input.staffId,
    staffName: name,
    date: new Date().toISOString(),
    type: "advance",
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    notes: input.notes || "Cash advance issued",
  };

  const updatedStaff = staffList.map((s) => {
    if (s.id === input.staffId) {
      return { ...s, advanceBalance: s.advanceBalance + input.amount };
    }
    return s;
  });

  saveStaff(updatedStaff, tenantId);
  const records = [record, ...getSavedStaffPayments(tenantId)];
  saveStaffPayments(records, tenantId);
  return record;
}

export function payStaffSalary(input: PaySalaryInput, tenantId?: string): StaffPaymentRecord {
  const staffList = getSavedStaff(tenantId);
  const member = staffList.find((s) => s.id === input.staffId);
  const name = member ? member.name : "Staff Member";

  const record: StaffPaymentRecord = {
    id: `spay-${Date.now()}`,
    staffId: input.staffId,
    staffName: name,
    date: new Date().toISOString(),
    type: "salary_payout",
    amount: input.netPaid,
    paymentMethod: input.paymentMethod,
    notes: `Salary for ${input.salaryMonth}. Base: ₹${input.baseSalary}, Advance Deducted: ₹${input.deductAdvance}. Net: ₹${input.netPaid}. ${input.notes || ""}`,
  };

  const updatedStaff = staffList.map((s) => {
    if (s.id === input.staffId) {
      return {
        ...s,
        advanceBalance: Math.max(0, s.advanceBalance - input.deductAdvance),
      };
    }
    return s;
  });

  saveStaff(updatedStaff, tenantId);
  const records = [record, ...getSavedStaffPayments(tenantId)];
  saveStaffPayments(records, tenantId);
  return record;
}
