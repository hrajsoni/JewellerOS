import { test, describe } from "node:test";
import assert from "node:assert";
import {
  getSavedRepairs,
  getSavedBookings,
  createRepairJob,
  updateRepairStatus,
  createBookingOrder,
  updateBookingStatus,
} from "../../src/modules/repairs/store";
import {
  CreateRepairInput,
  UpdateRepairStatusInput,
  CreateBookingInput,
  generateRepairReadyWhatsAppNotification,
  generateBookingWhatsAppReceipt,
} from "../../src/modules/repairs/types";

describe("JewelleryOS Milestone 7: Repairs & Custom Customer Bookings Tests", () => {
  const tenantId = "test-tenant-repairs-01";

  test("Repair Intake: Inward damaged customer ornament with exact intake scale weight and remarks", () => {
    const input: CreateRepairInput = {
      customerName: "Smt. Sunita Agarwal",
      customerPhone: "+91 98290 44321",
      ornamentDescription: "22K Kundan Choker Necklace",
      metal: "gold",
      intakeGrossWeight: 38.45,
      intakeNetWeight: 36.2,
      conditionNotes: "Back hook snap broken, right kundan stone loose, minor re-polishing required",
      repairType: "solder_joint",
      estimatedCharges: 1800,
      metalAddedGrams: 0.25,
      metalCost: 3500,
      assignedKarigarName: "Gopal Babu (Artisan)",
      expectedDeliveryDate: "2026-11-28",
    };

    const repair = createRepairJob(input, tenantId);

    assert.ok(repair.repairNumber.startsWith("REP-2026-"));
    assert.strictEqual(repair.status, "received");
    assert.strictEqual(repair.customerName, "Smt. Sunita Agarwal");
    assert.strictEqual(repair.intakeGrossWeight, 38.45);
    assert.strictEqual(repair.finalCharges, 1800 + 3500);

    const saved = getSavedRepairs(tenantId);
    const found = saved.find((r) => r.id === repair.id);
    assert.ok(found);
    assert.strictEqual(found?.repairNumber, repair.repairNumber);
  });

  test("Repair Lifecycle: Advance repair status from received to ready_for_delivery and delivered", () => {
    const saved = getSavedRepairs(tenantId);
    const repair = saved[0];

    // 1. Advance to in_repair
    const inRepairUpdate: UpdateRepairStatusInput = {
      repairId: repair.id,
      status: "in_repair",
      deliveryNotes: "Sent to Gopal Babu workshop for micro-soldering",
    };
    const inRepairJob = updateRepairStatus(inRepairUpdate, tenantId);
    assert.ok(inRepairJob);
    assert.strictEqual(inRepairJob.status, "in_repair");

    // 2. Advance to ready_for_delivery
    const readyUpdate: UpdateRepairStatusInput = {
      repairId: repair.id,
      status: "ready_for_delivery",
      deliveredGrossWeight: 38.7, // 38.45g + 0.25g solder wire
      finalCharges: 5300,
    };
    const readyJob = updateRepairStatus(readyUpdate, tenantId);
    assert.ok(readyJob);
    assert.strictEqual(readyJob.status, "ready_for_delivery");
    assert.strictEqual(readyJob.deliveredGrossWeight, 38.7);

    // 3. Mark as delivered to customer
    const deliveredUpdate: UpdateRepairStatusInput = {
      repairId: repair.id,
      status: "delivered",
      deliveryNotes: "Customer verified on scale in showroom, payment received via UPI",
    };
    const deliveredJob = updateRepairStatus(deliveredUpdate, tenantId);
    assert.ok(deliveredJob);
    assert.strictEqual(deliveredJob.status, "delivered");
    assert.ok(deliveredJob.deliveredAt);
  });

  test("Custom Booking Order: Customer places custom order with advance deposit and gold rate lock", () => {
    const input: CreateBookingInput = {
      customerName: "Vikram Rathore",
      customerPhone: "+91 94140 88291",
      title: "Royal Rajputana Gokhru Bangles (Pair)",
      category: "Bangles & Kadas",
      targetWeightGrams: 55.0,
      purity: "22K (916)",
      agreedRateMode: "rate_fixed_at_booking",
      fixedGoldRate: 150000,
      estimatedTotal: 840000,
      advanceReceivedAmount: 200000,
      advancePaymentMode: "UPI",
      dueDate: "2026-12-15",
      notes: "Traditional Rajasthani filigree carving on perimeter. Wedding delivery.",
    };

    const booking = createBookingOrder(input, tenantId);

    assert.ok(booking.bookingNumber.startsWith("ORD-2026-"));
    assert.strictEqual(booking.status, "booked");
    assert.strictEqual(booking.agreedRateMode, "rate_fixed_at_booking");
    assert.strictEqual(booking.fixedGoldRate, 150000);
    assert.strictEqual(booking.advanceReceivedAmount, 200000);

    const savedBookings = getSavedBookings(tenantId);
    const foundBooking = savedBookings.find((b) => b.id === booking.id);
    assert.ok(foundBooking);
  });

  test("Custom Booking Lifecycle: Advance order status to in_crafting and ready", () => {
    const saved = getSavedBookings(tenantId);
    const booking = saved[0];

    const updated = updateBookingStatus(booking.id, "in_crafting", tenantId);
    assert.ok(updated);
    assert.strictEqual(updated.status, "in_crafting");

    const ready = updateBookingStatus(booking.id, "ready", tenantId);
    assert.ok(ready);
    assert.strictEqual(ready.status, "ready");
    assert.ok(ready.completedAt);
  });

  test("WhatsApp Notifications: Validates repair completion alert and booking advance receipt templates", () => {
    const savedRepairs = getSavedRepairs(tenantId);
    const repair = savedRepairs[0];
    const repairMsg = generateRepairReadyWhatsAppNotification(repair, "Sandhya Jewellers");

    assert.ok(repairMsg.toUpperCase().includes("SANDHYA JEWELLERS"));
    assert.ok(repairMsg.includes(repair.customerName));
    assert.ok(repairMsg.includes(repair.repairNumber));
    assert.ok(repairMsg.includes("REPAIR READY FOR PICKUP"));

    const savedBookings = getSavedBookings(tenantId);
    const booking = savedBookings[0];
    const bookingMsg = generateBookingWhatsAppReceipt(booking, "Sandhya Jewellers");

    assert.ok(bookingMsg.toUpperCase().includes("SANDHYA JEWELLERS"));
    assert.ok(bookingMsg.includes(booking.customerName));
    assert.ok(bookingMsg.includes(booking.bookingNumber));
    assert.ok(bookingMsg.includes("CUSTOM ORDER BOOKING RECEIPT"));
    assert.ok(bookingMsg.includes("Gold Rate Locked"));
  });
});
