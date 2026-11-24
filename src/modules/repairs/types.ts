export type RepairStatus =
  | "received"
  | "in_repair"
  | "ready_for_delivery"
  | "delivered"
  | "cancelled";

export type RepairType =
  | "solder_joint"
  | "rhodium_polish"
  | "stone_setting"
  | "resizing"
  | "stringing_pearls"
  | "general_repair";

export interface RepairJob {
  id: string;
  repairNumber: string; // e.g. "REP-2026-001"
  customerName: string;
  customerPhone: string;
  ornamentDescription: string;
  metal: "gold" | "silver";
  intakeGrossWeight: number; // in grams
  intakeNetWeight: number;
  conditionNotes: string; // e.g. "Hook broken, 1 diamond missing, polish worn"
  repairType: RepairType;
  estimatedCharges: number; // ₹ Labour
  metalAddedGrams: number; // pure metal or solder added in repair
  metalCost: number; // ₹ cost of added metal
  finalCharges: number; // estimatedCharges + metalCost
  deliveredGrossWeight?: number;
  assignedKarigarName?: string;
  expectedDeliveryDate: string; // YYYY-MM-DD
  status: RepairStatus;
  deliveryNotes?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface CreateRepairInput {
  customerName: string;
  customerPhone: string;
  ornamentDescription: string;
  metal: "gold" | "silver";
  intakeGrossWeight: number;
  intakeNetWeight: number;
  conditionNotes: string;
  repairType: RepairType;
  estimatedCharges: number;
  metalAddedGrams?: number;
  metalCost?: number;
  assignedKarigarName?: string;
  expectedDeliveryDate: string;
}

export interface UpdateRepairStatusInput {
  repairId: string;
  status: RepairStatus;
  deliveredGrossWeight?: number;
  finalCharges?: number;
  deliveryNotes?: string;
}

export type BookingRateMode = "rate_fixed_at_booking" | "market_rate_on_delivery";
export type BookingStatus = "booked" | "in_crafting" | "ready" | "delivered" | "cancelled";

export interface CustomBookingOrder {
  id: string;
  bookingNumber: string; // e.g. "ORD-2026-001"
  customerName: string;
  customerPhone: string;
  title: string;
  category: string;
  targetWeightGrams: number;
  purity: string;
  agreedRateMode: BookingRateMode;
  fixedGoldRate?: number; // Rate per 10g locked at time of booking
  estimatedTotal: number;
  advanceReceivedAmount: number;
  advancePaymentMode: "Cash" | "UPI" | "Bank" | "OldGold";
  oldGoldWeightCredit?: number; // grams of old gold accepted as advance
  dueDate: string;
  status: BookingStatus;
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface CreateBookingInput {
  customerName: string;
  customerPhone: string;
  title: string;
  category: string;
  targetWeightGrams: number;
  purity: string;
  agreedRateMode: BookingRateMode;
  fixedGoldRate?: number;
  estimatedTotal: number;
  advanceReceivedAmount: number;
  advancePaymentMode: "Cash" | "UPI" | "Bank" | "OldGold";
  oldGoldWeightCredit?: number;
  dueDate: string;
  notes?: string;
}

/**
 * Generate 1-Click WhatsApp Ready for Pickup Notification (गहना तैयार है)
 */
export function generateRepairReadyWhatsAppNotification(
  repair: RepairJob,
  shopName: string
): string {
  const lines = [
    `✨ *${shopName.toUpperCase()} — REPAIR READY FOR PICKUP (गहना तैयार है)*`,
    `🔢 Repair Slip #: *${repair.repairNumber}*`,
    `👤 Customer: *${repair.customerName}*`,
    `💎 Article: *${repair.ornamentDescription}*`,
    `----------------------------------------`,
    `⚖️ Intake Weight: *${repair.intakeGrossWeight.toFixed(3)} g*`,
    repair.deliveredGrossWeight
      ? `⚖️ Delivered Weight: *${repair.deliveredGrossWeight.toFixed(3)} g*`
      : `🛠️ Status: *Repaired, Polished & Cleaned*`,
    `💵 Repair & Labour Charges: *₹${repair.finalCharges.toLocaleString("en-IN")}*`,
    `----------------------------------------`,
    `_Your ornament is safely kept in our counter vault and ready for pickup during showroom hours. Please present this slip at the counter. Thank you!_`,
  ];
  return lines.join("\n");
}

/**
 * Generate 1-Click WhatsApp Booking Order Receipt (कस्टम आभूषण बुकिंग रसीद)
 */
export function generateBookingWhatsAppReceipt(
  booking: CustomBookingOrder,
  shopName: string
): string {
  const balanceDue = Math.max(0, booking.estimatedTotal - booking.advanceReceivedAmount);
  const lines = [
    `💍 *${shopName.toUpperCase()} — CUSTOM ORDER BOOKING RECEIPT (आभूषण बुकिंग रसीद)*`,
    `🔢 Order #: *${booking.bookingNumber}*`,
    `👤 Customer: *${booking.customerName}*`,
    `💎 Ornament: *${booking.title}* [${booking.purity}]`,
    `⚖️ Target Weight: *${booking.targetWeightGrams.toFixed(3)} g*`,
    `📅 Due Date: *${new Date(booking.dueDate).toLocaleDateString("en-IN")}*`,
    `----------------------------------------`,
    `💰 Estimated Amount: *₹${booking.estimatedTotal.toLocaleString("en-IN")}*`,
    `💵 Advance Received: *₹${booking.advanceReceivedAmount.toLocaleString("en-IN")}* (${booking.advancePaymentMode})`,
    booking.oldGoldWeightCredit
      ? `🪙 Old Gold Advance Credit: *${booking.oldGoldWeightCredit.toFixed(3)} g*`
      : ``,
    `⚖️ Balance Payable on Delivery: *₹${balanceDue.toLocaleString("en-IN")}*`,
    booking.agreedRateMode === "rate_fixed_at_booking"
      ? `🔒 *Gold Rate Locked:* ₹${booking.fixedGoldRate?.toLocaleString("en-IN")}/10g (No price fluctuation risk)`
      : `📊 *Rate Term:* Sarafa market rate prevailing on delivery date`,
    `----------------------------------------`,
    `_We have dispatched the master work order to our goldsmiths. Thank you for placing your order with us!_`,
  ].filter(Boolean);
  return lines.join("\n");
}
