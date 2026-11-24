import {
  Karigar,
  KarigarTransaction,
  IssueMetalInput,
  ReceiveOrnamentInput,
  PayLabourInput,
  JobCard,
  CreateJobCardInput,
  JobCardStatus,
} from "./types";

const KARIGARS_STORAGE_KEY = "jewellery_os_karigars_v2";
const KARIGAR_TXNS_STORAGE_KEY = "jewellery_os_karigar_txns_v2";
const JOB_CARDS_STORAGE_KEY = "jewellery_os_job_cards_v2";

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

export const INITIAL_JOB_CARDS: JobCard[] = [
  {
    id: "jc-101",
    jobCardNumber: "JC-2026-001",
    karigarId: "karigar-1",
    karigarName: "Gopal Babu (Bengali Master)",
    customerName: "Mrs. Sunita Sharma",
    customerPhone: "+91 98290 88211",
    category: "Bangles",
    title: "22K Traditional Die-Cut Bangles (4 pcs)",
    description: "4-piece handcrafted floral motif gold bangles, size 2-6, safety clasp lock.",
    metal: "gold",
    targetGrossWeight: 48.0,
    targetNetWeight: 46.5,
    purity: "22K (916)",
    issuedFineWeightGrams: 45.0,
    expectedDeliveryDate: "2026-11-28",
    status: "in_production",
    labourRate: 480,
    labourType: "per_gram",
    allowedWastagePercent: 1.2,
    notes: "Customer requires by upcoming wedding on 1st Dec.",
    createdAt: "2026-11-20T10:30:00.000Z",
  },
  {
    id: "jc-102",
    jobCardNumber: "JC-2026-002",
    karigarId: "karigar-2",
    karigarName: "Bhanwar Lal Soni",
    customerName: "Radha Govind Jewellers (Wholesale)",
    category: "Necklace",
    title: "Heritage Kundan Meena Choker Set",
    description: "Jaipuri red & green minakari on reverse, syndicate uncut polki stones.",
    metal: "gold",
    targetGrossWeight: 72.5,
    targetNetWeight: 58.2,
    purity: "22K (916)",
    issuedFineWeightGrams: 55.0,
    expectedDeliveryDate: "2026-12-05",
    status: "in_production",
    labourRate: 32000,
    labourType: "fixed",
    allowedWastagePercent: 2.0,
    notes: "24K pure gold foil ghatai included.",
    createdAt: "2026-11-21T14:15:00.000Z",
  },
  {
    id: "jc-103",
    jobCardNumber: "JC-2026-003",
    karigarId: "karigar-3",
    karigarName: "Shyamal Da",
    customerName: "Vikram Singhania",
    customerPhone: "+91 98291 77334",
    category: "Chains",
    title: "Handmade 22K Indo-Italian Hollow Chain",
    description: "22-inch length, 3.5mm thickness, high mirror polish finish.",
    metal: "gold",
    targetGrossWeight: 24.15,
    targetNetWeight: 24.15,
    purity: "22K (916)",
    issuedFineWeightGrams: 23.5,
    expectedDeliveryDate: "2026-11-24",
    status: "completed",
    labourRate: 420,
    labourType: "per_gram",
    allowedWastagePercent: 1.0,
    huid: "HA916Z",
    notes: "Passed BIS Hallmarking with HUID registered.",
    createdAt: "2026-11-18T11:00:00.000Z",
    completedAt: "2026-11-23T16:30:00.000Z",
  },
];

export const INITIAL_KARIGAR_TXNS: KarigarTransaction[] = [
  {
    id: "ktx-1",
    karigarId: "karigar-1",
    karigarName: "Gopal Babu (Bengali Master)",
    date: "2026-11-20T10:30:00.000Z",
    type: "issue_metal",
    metal: "gold",
    ornamentName: "Job Card #JC-2026-001 (4 Bangle Sets)",
    jobCardId: "jc-101",
    grossWeight: 45.0,
    fineWeightDelta: 45.0,
    purity: "24K Fine Bar (99.9%)",
    notes: "Issued 45g pure 24K bar for 22K die bangles.",
  },
  {
    id: "ktx-2",
    karigarId: "karigar-3",
    karigarName: "Shyamal Da",
    date: "2026-11-23T16:30:00.000Z",
    type: "receive_ornament",
    metal: "gold",
    ornamentName: "Handmade 22K Indo-Italian Chain",
    jobCardId: "jc-103",
    grossWeight: 24.15,
    netWeight: 24.15,
    fineWeightDelta: -22.138, // 24.15 * (22/24)
    purity: "22K (916)",
    labourAmount: 10143, // 24.15 * 420
    notes: "BIS HUID: HA916Z. Completed and credited to stock safe.",
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

export function getTenantKarigarKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_karigars` : KARIGARS_STORAGE_KEY;
}

export function getTenantKarigarTxnsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_karigar_txns` : KARIGAR_TXNS_STORAGE_KEY;
}

export function getTenantJobCardsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_job_cards` : JOB_CARDS_STORAGE_KEY;
}

export function getSavedKarigars(tenantId?: string): Karigar[] {
  try {
    const key = getTenantKarigarKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantKarigarKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_KARIGARS.map((k) => ({ ...k }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KARIGARS;
  }
}

export function saveKarigars(karigars: Karigar[], tenantId?: string): void {
  try {
    const key = getTenantKarigarKey(tenantId);
    setItem(key, JSON.stringify(karigars));
  } catch (err) {
    console.error("Failed to save karigars:", err);
  }
}

export function getSavedKarigarTxns(tenantId?: string): KarigarTransaction[] {
  try {
    const key = getTenantKarigarTxnsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantKarigarTxnsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_KARIGAR_TXNS.map((t) => ({ ...t }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_KARIGAR_TXNS;
  }
}

export function saveKarigarTxns(txns: KarigarTransaction[], tenantId?: string): void {
  try {
    const key = getTenantKarigarTxnsKey(tenantId);
    setItem(key, JSON.stringify(txns));
  } catch (err) {
    console.error("Failed to save karigar txns:", err);
  }
}

export function getSavedJobCards(tenantId?: string): JobCard[] {
  try {
    const key = getTenantJobCardsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantJobCardsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_JOB_CARDS.map((jc) => ({ ...jc }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_JOB_CARDS;
  }
}

export function saveJobCards(jobCards: JobCard[], tenantId?: string): void {
  try {
    const key = getTenantJobCardsKey(tenantId);
    setItem(key, JSON.stringify(jobCards));
  } catch (err) {
    console.error("Failed to save job cards:", err);
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

export function createJobCard(input: CreateJobCardInput, tenantId?: string): JobCard {
  const existing = getSavedJobCards(tenantId);
  const nextNum = existing.length + 1;
  const numFormatted = String(nextNum).padStart(3, "0");
  const jobCardNumber = `JC-2026-${numFormatted}`;

  const newJobCard: JobCard = {
    id: `jc-${Date.now()}`,
    jobCardNumber,
    karigarId: input.karigarId,
    karigarName: input.karigarName,
    customerName: input.customerName?.trim() || undefined,
    customerPhone: input.customerPhone?.trim() || undefined,
    category: input.category,
    title: input.title.trim(),
    description: input.description.trim(),
    metal: input.metal,
    targetGrossWeight: input.targetGrossWeight,
    targetNetWeight: input.targetNetWeight,
    purity: input.purity,
    issuedFineWeightGrams: input.issuedFineWeightGrams,
    expectedDeliveryDate: input.expectedDeliveryDate,
    status: "created",
    labourRate: input.labourRate,
    labourType: input.labourType,
    allowedWastagePercent: input.allowedWastagePercent,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const updated = [newJobCard, ...existing];
  saveJobCards(updated, tenantId);

  // If initial metal was issued with this job card, record it in ledger
  if (input.issuedFineWeightGrams > 0) {
    issueMetalToKarigar(
      {
        karigarId: input.karigarId,
        metal: input.metal,
        grossWeight: input.issuedFineWeightGrams,
        purity: "24K Fine Bar (99.9%)",
        fineWeight: input.issuedFineWeightGrams,
        ornamentOrderName: `Job Card #${jobCardNumber} (${input.title})`,
        jobCardId: newJobCard.id,
        notes: `Initial fine bullion issued for Job Card ${jobCardNumber}`,
      },
      tenantId
    );
  }

  return newJobCard;
}

export function updateJobCardStatus(
  jobCardId: string,
  status: JobCardStatus,
  huid?: string,
  tenantId?: string
): JobCard | null {
  const jobCards = getSavedJobCards(tenantId);
  let updatedCard: JobCard | null = null;

  const updated = jobCards.map((jc) => {
    if (jc.id === jobCardId) {
      updatedCard = {
        ...jc,
        status,
        huid: huid || jc.huid,
        completedAt:
          status === "completed" || status === "delivered"
            ? jc.completedAt || new Date().toISOString()
            : jc.completedAt,
      };
      return updatedCard;
    }
    return jc;
  });

  if (updatedCard) {
    saveJobCards(updated, tenantId);
  }
  return updatedCard;
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
    jobCardId: input.jobCardId,
    grossWeight: input.grossWeight,
    fineWeightDelta: input.fineWeight,
    purity: input.purity,
    notes: input.notes,
  };

  // Update karigar metal balance
  const updatedKarigars = karigars.map((k) => {
    if (k.id === input.karigarId) {
      if (input.metal === "gold") {
        return {
          ...k,
          pureGoldBalanceGrams: Math.round((k.pureGoldBalanceGrams + input.fineWeight) * 1000) / 1000,
        };
      } else {
        return {
          ...k,
          pureSilverBalanceGrams:
            Math.round((k.pureSilverBalanceGrams + input.fineWeight) * 1000) / 1000,
        };
      }
    }
    return k;
  });

  saveKarigars(updatedKarigars, tenantId);
  const txns = [txn, ...getSavedKarigarTxns(tenantId)];
  saveKarigarTxns(txns, tenantId);
  return txn;
}

export function receiveOrnamentFromKarigar(
  input: ReceiveOrnamentInput,
  tenantId?: string
): KarigarTransaction {
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
    jobCardId: input.jobCardId,
    grossWeight: input.grossWeight,
    netWeight: input.netWeight,
    fineWeightDelta: -input.fineWeightDeducted,
    purity: input.purity,
    labourAmount: input.labourCharges,
    notes: input.notes ? `${input.notes}${input.huid ? ` (HUID: ${input.huid})` : ""}` : input.huid ? `HUID: ${input.huid}` : undefined,
  };

  const updatedKarigars = karigars.map((k) => {
    if (k.id === input.karigarId) {
      const newGold =
        input.metal === "gold"
          ? Math.round(Math.max(0, k.pureGoldBalanceGrams - input.fineWeightDeducted) * 1000) / 1000
          : k.pureGoldBalanceGrams;
      const newSilver =
        input.metal === "silver"
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

  // If linked to a job card, update the job card status
  if (input.jobCardId) {
    updateJobCardStatus(input.jobCardId, "completed", input.huid, tenantId);
  }

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
