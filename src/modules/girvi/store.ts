import {
  GirviLoan,
  NewGirviInput,
  GirviPaymentRecord,
  InterestAccrualResult,
} from "./types";

const GIRVI_STORAGE_KEY = "jewellery_os_girvi_v2";
const GIRVI_PAYMENTS_KEY = "jewellery_os_girvi_payments_v1";

export const INITIAL_GIRVI_LOANS: GirviLoan[] = [
  {
    id: "girvi-1",
    loanNumber: "GL-2026-0042",
    startDate: "2026-08-15T10:00:00.000Z",
    dueDate: "2027-02-15T10:00:00.000Z",
    customerName: "Mohan Lal Kumawat",
    customerPhone: "+91 94140 77123",
    customerAadhaar: "XXXX-XXXX-4912",
    customerAddress: "Gram Post Sanganer, Jaipur",
    customerCity: "Jaipur",
    ornaments: [
      {
        id: "pledge-1",
        name: "22K Solid Gold Bangle (Pair)",
        metal: "gold",
        purity: "22K",
        grossWeight: 24.5,
        netWeight: 24.5,
        marketValuation: 336875,
        remarks: "Hallmarked, slightly worn, sound joints",
      },
    ],
    principalAmount: 220000,
    monthlyInterestRate: 1.5,
    interestType: "simple",
    totalInterestPaid: 3300,
    principalRepaid: 0,
    status: "active",
    packetNumber: "PKT-101",
    safeLocation: "Tijori #1, Dabba #A",
    witnessName: "Gopal Soni",
    notes: "Pledge voucher signed, original purchase slip verified.",
  },
  {
    id: "girvi-2",
    loanNumber: "GL-2026-0038",
    startDate: "2026-07-10T11:30:00.000Z",
    dueDate: "2027-01-10T11:30:00.000Z",
    customerName: "Radha Devi Sharma",
    customerPhone: "+91 98290 33211",
    customerAadhaar: "XXXX-XXXX-8821",
    customerAddress: "Plot 18, Chomu Pulia, Jaipur",
    customerCity: "Jaipur",
    ornaments: [
      {
        id: "pledge-2",
        name: "18K Gold Necklace with Rubies",
        metal: "gold",
        purity: "18K",
        grossWeight: 18.2,
        netWeight: 16.5,
        marketValuation: 185625,
        remarks: "Ruby weight deducted 1.7g",
      },
    ],
    principalAmount: 110000,
    monthlyInterestRate: 1.75,
    interestType: "simple",
    totalInterestPaid: 0,
    principalRepaid: 0,
    status: "active",
    packetNumber: "PKT-102",
    safeLocation: "Tijori #1, Dabba #B",
    notes: "Agricultural loan for seeds, 6-month term.",
  },
  {
    id: "girvi-3",
    loanNumber: "GL-2026-0021",
    startDate: "2026-04-01T14:00:00.000Z",
    dueDate: "2026-09-01T14:00:00.000Z",
    customerName: "Kailash Chand Jain",
    customerPhone: "+91 97840 55441",
    customerAadhaar: "XXXX-XXXX-1190",
    customerAddress: "Sarafa Bazar, Ajmer",
    customerCity: "Ajmer",
    ornaments: [
      {
        id: "pledge-3",
        name: "925 Pure Silver Plate (Thali)",
        metal: "silver",
        purity: "925",
        grossWeight: 850.0,
        netWeight: 850.0,
        marketValuation: 74690,
      },
    ],
    principalAmount: 45000,
    monthlyInterestRate: 2.0,
    interestType: "simple",
    totalInterestPaid: 4500,
    principalRepaid: 45000,
    status: "released",
    packetNumber: "PKT-098",
    safeLocation: "Tijori #2, Dabba #C",
    notes: "Fully settled and ornaments safely handed back to customer.",
  },
];

export const INITIAL_GIRVI_PAYMENTS: GirviPaymentRecord[] = [
  {
    id: "gpay-1",
    loanId: "girvi-1",
    loanNumber: "GL-2026-0042",
    date: "2026-09-15T11:00:00.000Z",
    type: "interest",
    amount: 3300,
    paymentMethod: "Cash",
    receiptNumber: "GVR-101",
    notes: "Month 1 interest settled in cash.",
  },
];

const inMemoryCache: Record<string, string> = {};

function getItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return inMemoryCache[key] ?? null;
}

function setItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, value);
    } catch {}
  } else {
    inMemoryCache[key] = value;
  }
}

export function getTenantGirviStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_girvi` : GIRVI_STORAGE_KEY;
}

export function getTenantGirviPaymentsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_girvi_payments` : GIRVI_PAYMENTS_KEY;
}

export function getSavedGirviLoans(tenantId?: string): GirviLoan[] {
  try {
    const key = getTenantGirviStorageKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantGirviStorageKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_GIRVI_LOANS.map((l) => ({ ...l }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GIRVI_LOANS;
  }
}

export function saveGirviLoans(loans: GirviLoan[], tenantId?: string): void {
  try {
    const key = getTenantGirviStorageKey(tenantId);
    setItem(key, JSON.stringify(loans));
  } catch (err) {
    console.error("Failed to save girvi loans:", err);
  }
}

export function getSavedGirviPayments(tenantId?: string): GirviPaymentRecord[] {
  try {
    const key = getTenantGirviPaymentsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantGirviPaymentsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_GIRVI_PAYMENTS.map((p) => ({ ...p }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GIRVI_PAYMENTS;
  }
}

export function saveGirviPayments(payments: GirviPaymentRecord[], tenantId?: string): void {
  try {
    const key = getTenantGirviPaymentsKey(tenantId);
    setItem(key, JSON.stringify(payments));
  } catch (err) {
    console.error("Failed to save girvi payments:", err);
  }
}

export function createGirviLoan(input: NewGirviInput, tenantId?: string): GirviLoan {
  const now = new Date();
  const durationMonths = input.durationMonths || 6;
  const dueDate = new Date(now);
  dueDate.setMonth(dueDate.getMonth() + durationMonths);

  const loanNumber = `GL-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newLoan: GirviLoan = {
    id: `girvi-${Date.now()}`,
    loanNumber,
    startDate: now.toISOString(),
    dueDate: dueDate.toISOString(),
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerAadhaar: input.customerAadhaar?.trim() || undefined,
    customerAddress: input.customerAddress.trim(),
    customerCity: input.customerCity?.trim() || "Jaipur",
    ornaments: [
      {
        id: `pledge-${Date.now()}`,
        name: input.ornamentName.trim(),
        metal: input.metal,
        purity: input.purity,
        grossWeight: input.grossWeight,
        netWeight: input.netWeight,
        marketValuation: input.principalAmount * 1.35, // typical ~75% LTV
      },
    ],
    principalAmount: input.principalAmount,
    monthlyInterestRate: input.monthlyInterestRate,
    interestType: input.interestType || "simple",
    totalInterestPaid: 0,
    principalRepaid: 0,
    status: "active",
    packetNumber: input.packetNumber?.trim() || `PKT-${Math.floor(100 + Math.random() * 900)}`,
    safeLocation: input.safeLocation?.trim() || "Tijori #1, Dabba #A",
    notes: input.notes?.trim() || undefined,
  };

  const existing = getSavedGirviLoans(tenantId);
  const updated = [newLoan, ...existing];
  saveGirviLoans(updated, tenantId);
  return newLoan;
}

export function payGirviInterest(
  loanId: string,
  amount: number,
  paymentMethod: "Cash" | "UPI" | "Bank",
  notes?: string,
  tenantId?: string
): GirviPaymentRecord | null {
  const loans = getSavedGirviLoans(tenantId);
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return null;

  const paymentRecord: GirviPaymentRecord = {
    id: `gpay-${Date.now()}`,
    loanId: loan.id,
    loanNumber: loan.loanNumber,
    date: new Date().toISOString(),
    type: "interest",
    amount,
    paymentMethod,
    receiptNumber: `GVR-${Math.floor(100 + Math.random() * 900)}`,
    notes: notes?.trim() || undefined,
  };

  const updatedLoans = loans.map((l) => {
    if (l.id === loanId) {
      return {
        ...l,
        totalInterestPaid: l.totalInterestPaid + amount,
      };
    }
    return l;
  });

  saveGirviLoans(updatedLoans, tenantId);
  const existingPayments = getSavedGirviPayments(tenantId);
  saveGirviPayments([paymentRecord, ...existingPayments], tenantId);
  return paymentRecord;
}

export function payGirviPrincipal(
  loanId: string,
  amount: number,
  paymentMethod: "Cash" | "UPI" | "Bank",
  notes?: string,
  tenantId?: string
): GirviPaymentRecord | null {
  const loans = getSavedGirviLoans(tenantId);
  const loan = loans.find((l) => l.id === loanId);
  if (!loan) return null;

  const paymentRecord: GirviPaymentRecord = {
    id: `gpay-${Date.now()}`,
    loanId: loan.id,
    loanNumber: loan.loanNumber,
    date: new Date().toISOString(),
    type: "principal",
    amount,
    paymentMethod,
    receiptNumber: `GPR-${Math.floor(100 + Math.random() * 900)}`,
    notes: notes?.trim() || undefined,
  };

  const updatedLoans = loans.map((l) => {
    if (l.id === loanId) {
      const newPrincipalRepaid = l.principalRepaid + amount;
      const fullyRepaid = newPrincipalRepaid >= l.principalAmount;
      return {
        ...l,
        principalRepaid: newPrincipalRepaid,
        status: fullyRepaid ? ("released" as const) : l.status,
      };
    }
    return l;
  });

  saveGirviLoans(updatedLoans, tenantId);
  const existingPayments = getSavedGirviPayments(tenantId);
  saveGirviPayments([paymentRecord, ...existingPayments], tenantId);
  return paymentRecord;
}

export function releaseGirviLoan(loanId: string, tenantId?: string): GirviLoan[] {
  const existing = getSavedGirviLoans(tenantId);
  const updated = existing.map((loan) =>
    loan.id === loanId ? { ...loan, status: "released" as const } : loan
  );
  saveGirviLoans(updated, tenantId);
  return updated;
}

export function calculateAccruedInterest(
  loan: GirviLoan,
  asOfDate: Date = new Date()
): InterestAccrualResult {
  const start = new Date(loan.startDate);
  const diffTime = Math.max(0, asOfDate.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const exactMonths = diffDays / 30;
  const billableMonths = Math.max(1, Math.ceil(exactMonths)); // minimum 1 month interest

  const principal = Math.max(0, loan.principalAmount - loan.principalRepaid);
  const monthlyRatePct = loan.monthlyInterestRate;

  let totalInterest = 0;
  if (loan.interestType === "compound") {
    totalInterest = Math.round(
      principal * (Math.pow(1 + monthlyRatePct / 100, billableMonths) - 1)
    );
  } else {
    totalInterest = Math.round((principal * monthlyRatePct * billableMonths) / 100);
  }

  const netPayable = Math.max(0, principal + totalInterest - loan.totalInterestPaid);

  return {
    monthsElapsed: billableMonths,
    daysElapsed: diffDays,
    totalAccruedInterest: totalInterest,
    netPayableToRelease: netPayable,
  };
}
