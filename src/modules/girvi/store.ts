import { GirviLoan, NewGirviInput } from "./types";

const GIRVI_STORAGE_KEY = "jewellery_os_girvi_v2";

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

export function getTenantGirviStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_girvi` : GIRVI_STORAGE_KEY;
}

export function getSavedGirviLoans(tenantId?: string): GirviLoan[] {
  if (typeof window === "undefined") return INITIAL_GIRVI_LOANS;
  try {
    const key = getTenantGirviStorageKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantGirviStorageKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_GIRVI_LOANS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_GIRVI_LOANS;
  }
}

export function saveGirviLoans(loans: GirviLoan[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantGirviStorageKey(tenantId);
    localStorage.setItem(key, JSON.stringify(loans));
  } catch (err) {
    console.error("Failed to save girvi loans:", err);
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

export function releaseGirviLoan(loanId: string, tenantId?: string): GirviLoan[] {
  const existing = getSavedGirviLoans(tenantId);
  const updated = existing.map((loan) =>
    loan.id === loanId ? { ...loan, status: "released" as const } : loan
  );
  saveGirviLoans(updated, tenantId);
  return updated;
}

export interface InterestAccrualResult {
  monthsElapsed: number;
  daysElapsed: number;
  totalAccruedInterest: number;
  netPayableToRelease: number;
}

export function calculateAccruedInterest(loan: GirviLoan, asOfDate: Date = new Date()): InterestAccrualResult {
  const start = new Date(loan.startDate);
  const diffTime = Math.max(0, asOfDate.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Traditional Indian jewellery girvi calculation: full month for fractional days > 15 days, or pro-rata
  const exactMonths = diffDays / 30;
  const billableMonths = Math.max(1, Math.ceil(exactMonths)); // minimum 1 month interest

  const principal = loan.principalAmount - loan.principalRepaid;
  const monthlyRatePct = loan.monthlyInterestRate;

  let totalInterest = 0;
  if (loan.interestType === "compound") {
    totalInterest = Math.round(principal * (Math.pow(1 + monthlyRatePct / 100, billableMonths) - 1));
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
