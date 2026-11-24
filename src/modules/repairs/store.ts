import {
  RepairJob,
  CreateRepairInput,
  UpdateRepairStatusInput,
  CustomBookingOrder,
  CreateBookingInput,
  BookingStatus,
} from "./types";

const REPAIRS_STORAGE_KEY = "jewellery_os_repairs_v1";
const BOOKINGS_STORAGE_KEY = "jewellery_os_bookings_v1";

export const INITIAL_REPAIRS: RepairJob[] = [
  {
    id: "rep-101",
    repairNumber: "REP-2026-001",
    customerName: "Mrs. Suman Gupta",
    customerPhone: "+91 98290 44551",
    ornamentDescription: "22K Hollow Rope Chain with Safety Clasp",
    metal: "gold",
    intakeGrossWeight: 14.85,
    intakeNetWeight: 14.85,
    conditionNotes: "Chain broken near lock end, link strained, polish dull.",
    repairType: "solder_joint",
    estimatedCharges: 650,
    metalAddedGrams: 0.15,
    metalCost: 200,
    finalCharges: 850,
    deliveredGrossWeight: 15.0,
    assignedKarigarName: "Gopal Babu",
    expectedDeliveryDate: "2026-11-25",
    status: "ready_for_delivery",
    createdAt: "2026-11-22T11:00:00.000Z",
  },
  {
    id: "rep-102",
    repairNumber: "REP-2026-002",
    customerName: "Vivek Agarwal",
    customerPhone: "+91 94142 88123",
    ornamentDescription: "18K Solitaire Diamond Ring (Prong Check)",
    metal: "gold",
    intakeGrossWeight: 4.82,
    intakeNetWeight: 4.82,
    conditionNotes: "Center prong loose, rhodium plating worn off, size needs stretching to size 14.",
    repairType: "resizing",
    estimatedCharges: 1200,
    metalAddedGrams: 0,
    metalCost: 0,
    finalCharges: 1200,
    assignedKarigarName: "Shyamal Da",
    expectedDeliveryDate: "2026-11-26",
    status: "in_repair",
    createdAt: "2026-11-23T14:30:00.000Z",
  },
];

export const INITIAL_BOOKINGS: CustomBookingOrder[] = [
  {
    id: "book-101",
    bookingNumber: "ORD-2026-001",
    customerName: "Mrs. Sunita Sharma",
    customerPhone: "+91 98290 88211",
    title: "22K Traditional Jaipuri Hasli & Earrings Set",
    category: "Necklace",
    targetWeightGrams: 52.0,
    purity: "22K (916)",
    agreedRateMode: "rate_fixed_at_booking",
    fixedGoldRate: 150000,
    estimatedTotal: 395000,
    advanceReceivedAmount: 75000,
    advancePaymentMode: "UPI",
    dueDate: "2026-12-05",
    status: "in_crafting",
    notes: "Wedding date 10th Dec. Red enamel meenakari on rim.",
    createdAt: "2026-11-20T10:00:00.000Z",
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

export function getTenantRepairsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_repairs` : REPAIRS_STORAGE_KEY;
}

export function getTenantBookingsKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_bookings` : BOOKINGS_STORAGE_KEY;
}

export function getSavedRepairs(tenantId?: string): RepairJob[] {
  try {
    const key = getTenantRepairsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantRepairsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_REPAIRS.map((r) => ({ ...r }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_REPAIRS;
  }
}

export function saveRepairs(repairs: RepairJob[], tenantId?: string): void {
  try {
    const key = getTenantRepairsKey(tenantId);
    setItem(key, JSON.stringify(repairs));
  } catch (err) {
    console.error("Failed to save repairs:", err);
  }
}

export function getSavedBookings(tenantId?: string): CustomBookingOrder[] {
  try {
    const key = getTenantBookingsKey(tenantId);
    let raw = getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = getItem(getTenantBookingsKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = INITIAL_BOOKINGS.map((b) => ({ ...b }));
      setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BOOKINGS;
  }
}

export function saveBookings(bookings: CustomBookingOrder[], tenantId?: string): void {
  try {
    const key = getTenantBookingsKey(tenantId);
    setItem(key, JSON.stringify(bookings));
  } catch (err) {
    console.error("Failed to save bookings:", err);
  }
}

export function createRepairJob(input: CreateRepairInput, tenantId?: string): RepairJob {
  const existing = getSavedRepairs(tenantId);
  const nextNum = existing.length + 1;
  const repairNumber = `REP-2026-${String(nextNum).padStart(3, "0")}`;

  const metalCost = input.metalCost || 0;
  const finalCharges = input.estimatedCharges + metalCost;

  const newRepair: RepairJob = {
    id: `rep-${Date.now()}`,
    repairNumber,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    ornamentDescription: input.ornamentDescription.trim(),
    metal: input.metal,
    intakeGrossWeight: input.intakeGrossWeight,
    intakeNetWeight: input.intakeNetWeight,
    conditionNotes: input.conditionNotes.trim(),
    repairType: input.repairType,
    estimatedCharges: input.estimatedCharges,
    metalAddedGrams: input.metalAddedGrams || 0,
    metalCost,
    finalCharges,
    assignedKarigarName: input.assignedKarigarName?.trim() || undefined,
    expectedDeliveryDate: input.expectedDeliveryDate,
    status: "received",
    createdAt: new Date().toISOString(),
  };

  const updated = [newRepair, ...existing];
  saveRepairs(updated, tenantId);
  return newRepair;
}

export function updateRepairStatus(
  input: UpdateRepairStatusInput,
  tenantId?: string
): RepairJob | null {
  const repairs = getSavedRepairs(tenantId);
  let updatedRepair: RepairJob | null = null;
  const nowStr = new Date().toISOString();

  const updated = repairs.map((r) => {
    if (r.id === input.repairId) {
      updatedRepair = {
        ...r,
        status: input.status,
        deliveredGrossWeight: input.deliveredGrossWeight ?? r.deliveredGrossWeight,
        finalCharges: input.finalCharges ?? r.finalCharges,
        deliveryNotes: input.deliveryNotes ?? r.deliveryNotes,
        deliveredAt: input.status === "delivered" ? nowStr : r.deliveredAt,
      };
      return updatedRepair;
    }
    return r;
  });

  if (updatedRepair) {
    saveRepairs(updated, tenantId);
  }
  return updatedRepair;
}

export function createBookingOrder(
  input: CreateBookingInput,
  tenantId?: string
): CustomBookingOrder {
  const existing = getSavedBookings(tenantId);
  const nextNum = existing.length + 1;
  const bookingNumber = `ORD-2026-${String(nextNum).padStart(3, "0")}`;

  const newBooking: CustomBookingOrder = {
    id: `book-${Date.now()}`,
    bookingNumber,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    title: input.title.trim(),
    category: input.category,
    targetWeightGrams: input.targetWeightGrams,
    purity: input.purity,
    agreedRateMode: input.agreedRateMode,
    fixedGoldRate: input.fixedGoldRate,
    estimatedTotal: input.estimatedTotal,
    advanceReceivedAmount: input.advanceReceivedAmount,
    advancePaymentMode: input.advancePaymentMode,
    oldGoldWeightCredit: input.oldGoldWeightCredit,
    dueDate: input.dueDate,
    status: "booked",
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };

  const updated = [newBooking, ...existing];
  saveBookings(updated, tenantId);
  return newBooking;
}

export function updateBookingStatus(
  bookingId: string,
  status: BookingStatus,
  tenantId?: string
): CustomBookingOrder | null {
  const bookings = getSavedBookings(tenantId);
  let updatedBooking: CustomBookingOrder | null = null;
  const nowStr = new Date().toISOString();

  const updated = bookings.map((b) => {
    if (b.id === bookingId) {
      updatedBooking = {
        ...b,
        status,
        completedAt: status === "delivered" || status === "ready" ? nowStr : b.completedAt,
      };
      return updatedBooking;
    }
    return b;
  });

  if (updatedBooking) {
    saveBookings(updated, tenantId);
  }
  return updatedBooking;
}
