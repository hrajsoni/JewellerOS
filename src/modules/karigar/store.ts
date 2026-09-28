import {
  Karigar,
  KarigarTransaction,
  IssueMetalInput,
  ReceiveOrnamentInput,
  PayLabourInput,
} from "./types";

const KARIGARS_STORAGE_KEY = "jewellery_os_karigars_v2";
const KARIGAR_TXNS_STORAGE_KEY = "jewellery_os_karigar_txns_v2";

export const INITIAL_KARIGARS: Karigar[] = [
  {
    id: "karigar-1",
    name: "Gopal Babu (Bengali Master)",
    phone: "+91 98280 11223",
    workshopCity: "Jaipur (Johari Bazar)",
    specialty: "Lightweight Cast Chains & Bangles",
    pureGoldBalanceGrams: 34.5,
    pureSilverBalanceGrams: 0,
    labourBalanceDue: 18500,
    status: "active",
    notes: "Specialist in machine-cut hollow bangles, 1.2% allowed loss.",
  },
  {
    id: "karigar-2",
    name: "Bhanwar Lal Soni",
    phone: "+91 94142 88771",
    workshopCity: "Jaipur (Gopalji ka Rasta)",
    specialty: "Traditional Kundan Meena & Jadau",
    pureGoldBalanceGrams: 52.8,
    pureSilverBalanceGrams: 120.0,
    labourBalanceDue: 34200,
    status: "active",
    notes: "Heritage enamel work and 24k foil setting.",
  },
  {
    id: "karigar-3",
    name: "Shyamal Da",
    phone: "+91 97831 44556",
    workshopCity: "Jaipur (Sarafa Chowk)",
    specialty: "Filigree & Handcrafted Polki Chokers",
    pureGoldBalanceGrams: 18.2,
    pureSilverBalanceGrams: 0,
    labourBalanceDue: 9400,
    status: "active",
    notes: "Prompt delivery, works on per-gram labour basis.",
  },
];

export const INITIAL_KARIGAR_TXNS: KarigarTransaction[] = [
  {
    id: "ktx-1",
    karigarId: "karigar-1",
    karigarName: "Gopal Babu (Bengali Master)",
    date: "2026-09-20T10:00:00.000Z",
    type: "issue_metal",
    metal: "gold",
    ornamentName: "Order #412 - 4 Bangle Sets (22K)",
    grossWeight: 50.0,
    fineWeightDelta: 50.0,
    purity: "24K Fine Bar",
    notes: "Issued 50g 24K bar for 22K die bangles.",
  },
  {
    id: "ktx-2",
    karigarId: "karigar-1",
    karigarName: "Gopal Babu (Bengali Master)",
    date: "2026-09-25T14:30:00.000Z",
    type: "receive_ornament",
    metal: "gold",
    ornamentName: "22K Finished Bangles (2 sets)",
    grossWeight: 16.9,
    netWeight: 16.9,
    fineWeightDelta: -15.5,
    purity: "22K",
    labourAmount: 8500,
    notes: "Passed BIS hallmarking test. Ghat adjusted.",
  },
];

export function getTenantKarigarKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_karigars` : KARIGARS_STORAGE_KEY;
}

export function getTenantKarigarTxnsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_karigar_txns` : KARIGAR_TXNS_STORAGE_KEY;
}

export function getSavedKarigars(tenantId?: string): Karigar[] {
  if (typeof window === "undefined") return INITIAL_KARIGARS;
  try {
    const key = getTenantKarigarKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantKarigarKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_KARIGARS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KARIGARS;
  }
}

export function saveKarigars(karigars: Karigar[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantKarigarKey(tenantId);
    localStorage.setItem(key, JSON.stringify(karigars));
  } catch (err) {
    console.error("Failed to save karigars:", err);
  }
}

export function getSavedKarigarTxns(tenantId?: string): KarigarTransaction[] {
  if (typeof window === "undefined") return INITIAL_KARIGAR_TXNS;
  try {
    const key = getTenantKarigarTxnsKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantKarigarTxnsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_KARIGAR_TXNS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KARIGAR_TXNS;
  }
}

export function saveKarigarTxns(txns: KarigarTransaction[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantKarigarTxnsKey(tenantId);
    localStorage.setItem(key, JSON.stringify(txns));
  } catch (err) {
    console.error("Failed to save karigar txns:", err);
  }
}

export function addKarigar(
  input: {
    name: string;
    phone: string;
    workshopCity: string;
    specialty: string;
    notes?: string;
  },
  tenantId?: string
): Karigar {
  const newKarigar: Karigar = {
    id: `karigar-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    workshopCity: input.workshopCity.trim(),
    specialty: input.specialty.trim(),
    pureGoldBalanceGrams: 0,
    pureSilverBalanceGrams: 0,
    labourBalanceDue: 0,
    status: "active",
    notes: input.notes?.trim() || undefined,
  };

  const existing = getSavedKarigars(tenantId);
  const updated = [...existing, newKarigar];
  saveKarigars(updated, tenantId);
  return newKarigar;
}

export function issueMetalToKarigar(input: IssueMetalInput, tenantId?: string): KarigarTransaction {
  const karigars = getSavedKarigars(tenantId);
  const karigar = karigars.find((k) => k.id === input.karigarId);
  const name = karigar ? karigar.name : "Unknown Karigar";

  const txn: KarigarTransaction = {
    id: `ktx-${Date.now()}`,
    karigarId: input.karigarId,
    karigarName: name,
    date: new Date().toISOString(),
    type: "issue_metal",
    metal: input.metal,
    ornamentName: input.ornamentOrderName,
    grossWeight: input.grossWeight,
    fineWeightDelta: input.fineWeight,
    purity: input.purity,
    notes: input.notes,
  };

  // Update karigar metal balance
  const updatedKarigars = karigars.map((k) => {
    if (k.id === input.karigarId) {
      if (input.metal === "gold") {
        return { ...k, pureGoldBalanceGrams: Math.round((k.pureGoldBalanceGrams + input.fineWeight) * 1000) / 1000 };
      } else {
        return { ...k, pureSilverBalanceGrams: Math.round((k.pureSilverBalanceGrams + input.fineWeight) * 1000) / 1000 };
      }
    }
    return k;
  });

  saveKarigars(updatedKarigars, tenantId);
  const txns = [txn, ...getSavedKarigarTxns(tenantId)];
  saveKarigarTxns(txns, tenantId);
  return txn;
}

export function receiveOrnamentFromKarigar(input: ReceiveOrnamentInput, tenantId?: string): KarigarTransaction {
  const karigars = getSavedKarigars(tenantId);
  const karigar = karigars.find((k) => k.id === input.karigarId);
  const name = karigar ? karigar.name : "Unknown Karigar";

  const txn: KarigarTransaction = {
    id: `ktx-${Date.now()}`,
    karigarId: input.karigarId,
    karigarName: name,
    date: new Date().toISOString(),
    type: "receive_ornament",
    metal: input.metal,
    ornamentName: input.ornamentName,
    grossWeight: input.grossWeight,
    netWeight: input.netWeight,
    fineWeightDelta: -input.fineWeightDeducted,
    purity: input.purity,
    labourAmount: input.labourCharges,
    notes: input.notes,
  };

  const updatedKarigars = karigars.map((k) => {
    if (k.id === input.karigarId) {
      const newGold = input.metal === "gold"
        ? Math.round(Math.max(0, k.pureGoldBalanceGrams - input.fineWeightDeducted) * 1000) / 1000
        : k.pureGoldBalanceGrams;
      const newSilver = input.metal === "silver"
        ? Math.round(Math.max(0, k.pureSilverBalanceGrams - input.fineWeightDeducted) * 1000) / 1000
        : k.pureSilverBalanceGrams;
      const newLabour = k.labourBalanceDue + (input.labourCharges || 0);

      return {
        ...k,
        pureGoldBalanceGrams: newGold,
        pureSilverBalanceGrams: newSilver,
        labourBalanceDue: newLabour,
      };
    }
    return k;
  });

  saveKarigars(updatedKarigars, tenantId);
  const txns = [txn, ...getSavedKarigarTxns(tenantId)];
  saveKarigarTxns(txns, tenantId);
  return txn;
}

export function payLabourToKarigar(input: PayLabourInput, tenantId?: string): KarigarTransaction {
  const karigars = getSavedKarigars(tenantId);
  const karigar = karigars.find((k) => k.id === input.karigarId);
  const name = karigar ? karigar.name : "Unknown Karigar";

  const txn: KarigarTransaction = {
    id: `ktx-${Date.now()}`,
    karigarId: input.karigarId,
    karigarName: name,
    date: new Date().toISOString(),
    type: "labour_payment",
    metal: "gold",
    fineWeightDelta: 0,
    paymentAmount: input.amount,
    notes: `Paid ₹${input.amount} via ${input.paymentMethod}. ${input.notes || ""}`,
  };

  const updatedKarigars = karigars.map((k) => {
    if (k.id === input.karigarId) {
      return {
        ...k,
        labourBalanceDue: Math.max(0, k.labourBalanceDue - input.amount),
      };
    }
    return k;
  });

  saveKarigars(updatedKarigars, tenantId);
  const txns = [txn, ...getSavedKarigarTxns(tenantId)];
  saveKarigarTxns(txns, tenantId);
  return txn;
}
