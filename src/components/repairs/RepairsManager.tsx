"use client";

import React, { useState } from "react";
import {
  RepairJob,
  RepairStatus,
  RepairType,
  CreateRepairInput,
  UpdateRepairStatusInput,
  CustomBookingOrder,
  CreateBookingInput,
  BookingStatus,
  generateRepairReadyWhatsAppNotification,
  generateBookingWhatsAppReceipt,
} from "../../modules/repairs/types";
import {
  createRepairJob as storeCreateRepair,
  updateRepairStatus as storeUpdateRepair,
  createBookingOrder as storeCreateBooking,
  updateBookingStatus as storeUpdateBooking,
} from "../../modules/repairs/store";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Wrench,
  Plus,
  Search,
  Scale,
  Receipt,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Phone,
  Sparkles,
  Lock,
  Clock,
  Gem,
  AlertCircle,
} from "lucide-react";

export interface RepairsManagerProps {
  repairs: RepairJob[];
  bookings: CustomBookingOrder[];
  onCreateRepair?: (input: CreateRepairInput) => void;
  onUpdateRepairStatus?: (input: UpdateRepairStatusInput) => void;
  onCreateBooking?: (input: CreateBookingInput) => void;
  onUpdateBookingStatus?: (bookingId: string, status: BookingStatus) => void;
  shopName: string;
  tenantId?: string;
}

export const RepairsManager: React.FC<RepairsManagerProps> = ({
  repairs: initialRepairs,
  bookings: initialBookings,
  onCreateRepair,
  onUpdateRepairStatus,
  onCreateBooking,
  onUpdateBookingStatus,
  shopName,
  tenantId,
}) => {
  const [activeTab, setActiveTab] = useState<"repairs" | "bookings">("repairs");
  const [searchQuery, setSearchQuery] = useState("");

  const [repairs, setRepairs] = useState<RepairJob[]>(initialRepairs);
  const [bookings, setBookings] = useState<CustomBookingOrder[]>(initialBookings);

  React.useEffect(() => {
    setRepairs(initialRepairs);
  }, [initialRepairs]);
  React.useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  // Modals
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // New Repair Form State
  const [repCustomerName, setRepCustomerName] = useState("");
  const [repCustomerPhone, setRepCustomerPhone] = useState("+91 ");
  const [repDesc, setRepDesc] = useState("");
  const [repMetal, setRepMetal] = useState<"gold" | "silver">("gold");
  const [repIntakeGross, setRepIntakeGross] = useState("10.0");
  const [repIntakeNet, setRepIntakeNet] = useState("10.0");
  const [repCondition, setRepCondition] = useState("Broken clasp / hook joint");
  const [repType, setRepType] = useState<RepairType>("solder_joint");
  const [repCharges, setRepCharges] = useState("500");
  const [repDeliveryDate, setRepDeliveryDate] = useState(
    new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0]
  );
  const [repKarigar, setRepKarigar] = useState("Gopal Babu");

  // New Booking Form State
  const [bookCustomerName, setBookCustomerName] = useState("");
  const [bookCustomerPhone, setBookCustomerPhone] = useState("+91 ");
  const [bookTitle, setBookTitle] = useState("");
  const [bookCategory, setBookCategory] = useState("Necklace");
  const [bookTargetWeight, setBookTargetWeight] = useState("45.0");
  const [bookPurity, setBookPurity] = useState("22K (916)");
  const [bookRateMode, setBookRateMode] = useState<"rate_fixed_at_booking" | "market_rate_on_delivery">(
    "rate_fixed_at_booking"
  );
  const [bookFixedRate, setBookFixedRate] = useState("150000");
  const [bookEstTotal, setBookEstTotal] = useState("350000");
  const [bookAdvance, setBookAdvance] = useState("50000");
  const [bookAdvanceMode, setBookAdvanceMode] = useState<"Cash" | "UPI" | "Bank" | "OldGold">("UPI");
  const [bookDueDate, setBookDueDate] = useState(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [bookNotes, setBookNotes] = useState("");

  // Aggregates
  const activeRepairsCount = repairs.filter(
    (r) => r.status === "received" || r.status === "in_repair"
  ).length;
  const readyRepairsCount = repairs.filter((r) => r.status === "ready_for_delivery").length;
  const activeBookingsCount = bookings.filter(
    (b) => b.status === "booked" || b.status === "in_crafting"
  ).length;
  const totalAdvancesCollected = bookings.reduce((sum, b) => sum + b.advanceReceivedAmount, 0);

  // Actions
  const handleRepairSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repCustomerName.trim() || !repDesc.trim()) return;

    const input: CreateRepairInput = {
      customerName: repCustomerName.trim(),
      customerPhone: repCustomerPhone.trim(),
      ornamentDescription: repDesc.trim(),
      metal: repMetal,
      intakeGrossWeight: parseFloat(repIntakeGross) || 0,
      intakeNetWeight: parseFloat(repIntakeNet) || 0,
      conditionNotes: repCondition.trim(),
      repairType: repType,
      estimatedCharges: parseFloat(repCharges) || 0,
      assignedKarigarName: repKarigar.trim(),
      expectedDeliveryDate: repDeliveryDate,
    };

    if (onCreateRepair) {
      onCreateRepair(input);
    } else {
      const created = storeCreateRepair(input, tenantId);
      setRepairs((prev) => [created, ...prev]);
    }

    setIsRepairModalOpen(false);
    setRepCustomerName("");
    setRepDesc("");
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookCustomerName.trim() || !bookTitle.trim()) return;

    const input: CreateBookingInput = {
      customerName: bookCustomerName.trim(),
      customerPhone: bookCustomerPhone.trim(),
      title: bookTitle.trim(),
      category: bookCategory,
      targetWeightGrams: parseFloat(bookTargetWeight) || 0,
      purity: bookPurity,
      agreedRateMode: bookRateMode,
      fixedGoldRate: bookRateMode === "rate_fixed_at_booking" ? parseFloat(bookFixedRate) || 0 : undefined,
      estimatedTotal: parseFloat(bookEstTotal) || 0,
      advanceReceivedAmount: parseFloat(bookAdvance) || 0,
      advancePaymentMode: bookAdvanceMode,
      dueDate: bookDueDate,
      notes: bookNotes.trim() || undefined,
    };

    if (onCreateBooking) {
      onCreateBooking(input);
    } else {
      const created = storeCreateBooking(input, tenantId);
      setBookings((prev) => [created, ...prev]);
    }

    setIsBookingModalOpen(false);
    setBookCustomerName("");
    setBookTitle("");
  };

  const handleAdvanceRepairStatus = (repair: RepairJob, nextStatus: RepairStatus) => {
    let deliveredGrossWeight = repair.deliveredGrossWeight;
    if (nextStatus === "ready_for_delivery" && !deliveredGrossWeight) {
      deliveredGrossWeight = repair.intakeGrossWeight;
    }

    const updateData: UpdateRepairStatusInput = {
      repairId: repair.id,
      status: nextStatus,
      deliveredGrossWeight,
      finalCharges: repair.finalCharges,
    };

    if (onUpdateRepairStatus) {
      onUpdateRepairStatus(updateData);
    } else {
      const updated = storeUpdateRepair(updateData, tenantId);
      if (updated) {
        setRepairs((prev) => prev.map((r) => (r.id === repair.id ? updated : r)));
      }
    }
  };

  const dispatchRepairNotification = (repair: RepairJob) => {
    const text = generateRepairReadyWhatsAppNotification(repair, shopName);
    const cleanPhone = repair.customerPhone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  const dispatchBookingReceipt = (booking: CustomBookingOrder) => {
    const text = generateBookingWhatsAppReceipt(booking, shopName);
    const cleanPhone = booking.customerPhone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#DFC488]">
              <Wrench size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Repairs & Custom Bookings (मरम्मत व ग्राहक बुकिंग)
            </h1>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Customer jewellery repair slips, intake weights, bridal custom bookings & WhatsApp notifications for {shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<Gem size={14} />}
            onClick={() => setIsBookingModalOpen(true)}
          >
            + New Custom Booking (ऑर्डर बुकिंग)
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsRepairModalOpen(true)}
          >
            + Intake Repair (मरम्मत पर्ची)
          </GlassButton>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            In Workshop (मरम्मत चल रही है)
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {activeRepairsCount} Articles
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Currently with bench goldsmiths
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Ready for Pickup (गहना तैयार है)
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-emerald)] num-tabular">
            {readyRepairsCount} Repaired
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Polished & sealed in counter vault
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Active Custom Bookings (कस्टम ऑर्डर)
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {activeBookingsCount} Orders
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Bridal & special handcrafted sets
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Advances Collected (अग्रिम बयाना जमा)
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-coral)] num-tabular">
            {formatINR(totalAdvancesCollected)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Deposit cash/UPI held for bookings
          </span>
        </div>
      </div>

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06]">
        <div className="inline-flex p-1 rounded-lg bg-black/20 border border-white/[0.04] text-xs">
          <button
            onClick={() => setActiveTab("repairs")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "repairs"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Repair Slips / मरम्मत पर्ची ({repairs.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "bookings"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Custom Ornament Bookings / ग्राहक बुकिंग ({bookings.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search customer, slip #, ornament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>
      </div>

      {/* Tab 1: Repair Slips */}
      {activeTab === "repairs" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repairs.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[var(--text-tertiary)] bg-[var(--surface-primary)] rounded-xl border border-white/[0.06]">
                No repair slips found. Click &quot;+ Intake Repair&quot; to issue a repair voucher.
              </div>
            ) : (
              repairs
                .filter((r) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    r.repairNumber.toLowerCase().includes(q) ||
                    r.customerName.toLowerCase().includes(q) ||
                    r.ornamentDescription.toLowerCase().includes(q) ||
                    r.customerPhone.includes(q)
                  );
                })
                .map((r) => {
                  const statusVariant: "gold" | "emerald" | "coral" | "neutral" =
                    r.status === "delivered"
                      ? "emerald"
                      : r.status === "ready_for_delivery"
                      ? "emerald"
                      : r.status === "in_repair"
                      ? "gold"
                      : "neutral";

                  return (
                    <div
                      key={r.id}
                      className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-3 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#DFC488]">
                              {r.repairNumber}
                            </span>
                            <span className="text-[10px] uppercase font-mono text-[var(--text-tertiary)]">
                              {r.repairType.replace(/_/g, " ")}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">
                            {r.ornamentDescription}
                          </h4>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            Customer: <strong>{r.customerName}</strong> · 📞 {r.customerPhone}
                          </div>
                        </div>

                        <GlassBadge variant={statusVariant} size="sm">
                          {r.status.replace(/_/g, " ").toUpperCase()}
                        </GlassBadge>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Intake Weight:</span>
                          <span className="font-mono font-bold text-[#DFC488]">
                            {formatGrams(r.intakeGrossWeight)}
                          </span>
                        </div>
                        {r.deliveredGrossWeight && (
                          <div className="flex justify-between">
                            <span className="text-[var(--text-tertiary)]">Delivered Weight:</span>
                            <span className="font-mono font-bold text-[var(--text-primary)]">
                              {formatGrams(r.deliveredGrossWeight)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Labour Charges:</span>
                          <span className="font-mono font-bold text-[var(--accent-coral)]">
                            {formatINR(r.finalCharges)}
                          </span>
                        </div>
                        {r.assignedKarigarName && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-[var(--text-tertiary)]">Assigned To:</span>
                            <span className="text-[var(--text-secondary)]">{r.assignedKarigarName}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-[var(--text-tertiary)] italic">
                        Condition: {r.conditionNotes}
                      </div>

                      {/* Action Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                        {r.status === "ready_for_delivery" && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            icon={<MessageCircle size={13} className="text-[#25D366]" />}
                            className="text-[10px] text-[#25D366] hover:bg-[#25D366]/10 py-0.5 px-2"
                            onClick={() => dispatchRepairNotification(r)}
                          >
                            Notify: गहना तैयार है
                          </GlassButton>
                        )}

                        <div className="flex items-center gap-1.5 ml-auto">
                          {r.status === "received" && (
                            <button
                              onClick={() => handleAdvanceRepairStatus(r, "in_repair")}
                              className="px-2 py-1 rounded text-[10px] font-medium bg-[#C5A059]/20 text-[#DFC488] hover:bg-[#C5A059]/30"
                            >
                              Start Repair →
                            </button>
                          )}
                          {r.status === "in_repair" && (
                            <button
                              onClick={() => handleAdvanceRepairStatus(r, "ready_for_delivery")}
                              className="px-2 py-1 rounded text-[10px] font-medium bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/30"
                            >
                              Mark Ready (तैयार है) ✓
                            </button>
                          )}
                          {r.status === "ready_for_delivery" && (
                            <button
                              onClick={() => handleAdvanceRepairStatus(r, "delivered")}
                              className="px-2 py-1 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                            >
                              Handover to Customer
                            </button>
                          )}
                          {r.status === "delivered" && (
                            <span className="text-[10px] text-[var(--accent-emerald)] font-semibold flex items-center gap-1">
                              <CheckCircle2 size={11} /> Delivered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Custom Ornament Bookings */}
      {activeTab === "bookings" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookings.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[var(--text-tertiary)] bg-[var(--surface-primary)] rounded-xl border border-white/[0.06]">
                No custom ornament bookings found. Click &quot;+ New Custom Booking&quot; above.
              </div>
            ) : (
              bookings
                .filter((b) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    b.bookingNumber.toLowerCase().includes(q) ||
                    b.customerName.toLowerCase().includes(q) ||
                    b.title.toLowerCase().includes(q) ||
                    b.customerPhone.includes(q)
                  );
                })
                .map((b) => {
                  const balanceDue = Math.max(0, b.estimatedTotal - b.advanceReceivedAmount);

                  return (
                    <div
                      key={b.id}
                      className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-3 text-xs"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#DFC488]">
                              {b.bookingNumber}
                            </span>
                            <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                              {b.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-[var(--text-primary)] mt-0.5">
                            {b.title}
                          </h4>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            Customer: <strong>{b.customerName}</strong> · 📞 {b.customerPhone}
                          </div>
                        </div>

                        <GlassBadge
                          variant={
                            b.status === "delivered"
                              ? "emerald"
                              : b.status === "ready"
                              ? "emerald"
                              : "gold"
                          }
                          size="sm"
                        >
                          {b.status.toUpperCase()}
                        </GlassBadge>
                      </div>

                      <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.04] space-y-1.5 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Target Weight (Purity):</span>
                          <span className="font-mono font-bold text-[#DFC488]">
                            {b.targetWeightGrams.toFixed(3)}g ({b.purity})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[var(--text-tertiary)]">Estimated Amount:</span>
                          <span className="font-mono font-medium text-[var(--text-primary)]">
                            {formatINR(b.estimatedTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[var(--accent-emerald)]">
                          <span>Advance Received:</span>
                          <span className="font-mono font-bold">
                            {formatINR(b.advanceReceivedAmount)} ({b.advancePaymentMode})
                          </span>
                        </div>
                        <div className="flex justify-between text-[var(--accent-coral)] pt-1 border-t border-white/[0.04]">
                          <span>Balance on Delivery:</span>
                          <span className="font-mono font-bold">{formatINR(balanceDue)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)]">
                        <span>
                          {b.agreedRateMode === "rate_fixed_at_booking"
                            ? `🔒 Locked @ ₹${b.fixedGoldRate?.toLocaleString("en-IN")}/10g`
                            : "📊 Market Rate on Delivery"}
                        </span>
                        <span>Due: {new Date(b.dueDate).toLocaleDateString("en-IN")}</span>
                      </div>

                      <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between">
                        <GlassButton
                          variant="ghost"
                          size="sm"
                          icon={<MessageCircle size={13} className="text-[#25D366]" />}
                          className="text-[10px] text-[#25D366] hover:bg-[#25D366]/10 py-0.5 px-2"
                          onClick={() => dispatchBookingReceipt(b)}
                        >
                          WhatsApp Receipt
                        </GlassButton>

                        <div className="flex items-center gap-1.5">
                          {b.status === "booked" && (
                            <button
                              onClick={() => {
                                if (onUpdateBookingStatus) onUpdateBookingStatus(b.id, "in_crafting");
                                else {
                                  storeUpdateBooking(b.id, "in_crafting", tenantId);
                                  setBookings((prev) =>
                                    prev.map((item) =>
                                      item.id === b.id ? { ...item, status: "in_crafting" } : item
                                    )
                                  );
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#C5A059]/20 text-[#DFC488] hover:bg-[#C5A059]/30"
                            >
                              Send to Karigar →
                            </button>
                          )}
                          {b.status === "in_crafting" && (
                            <button
                              onClick={() => {
                                if (onUpdateBookingStatus) onUpdateBookingStatus(b.id, "ready");
                                else {
                                  storeUpdateBooking(b.id, "ready", tenantId);
                                  setBookings((prev) =>
                                    prev.map((item) =>
                                      item.id === b.id ? { ...item, status: "ready" } : item
                                    )
                                  );
                                }
                              }}
                              className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/30"
                            >
                              Ready for Delivery ✓
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Modal 1: Intake Repair Slip */}
      {isRepairModalOpen && (
        <GlassDialog
          isOpen={isRepairModalOpen}
          onClose={() => setIsRepairModalOpen(false)}
          title="Intake Ornament Repair Slip (मरम्मत पर्ची)"
          description="Weigh customer's damaged ornament, document flaws, and issue repair job receipt."
          maxWidth="md"
        >
          <form onSubmit={handleRepairSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Customer Name *"
                placeholder="e.g. Mrs. Suman Gupta"
                value={repCustomerName}
                onChange={(e) => setRepCustomerName(e.target.value)}
                required
              />
              <GlassInput
                label="Mobile Phone *"
                placeholder="+91 98290..."
                value={repCustomerPhone}
                onChange={(e) => setRepCustomerPhone(e.target.value)}
                required
              />
            </div>

            <GlassInput
              label="Ornament Description *"
              placeholder="e.g. 22K Solid Gold Bangle (cracked hinge)"
              value={repDesc}
              onChange={(e) => setRepDesc(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Metal
                </label>
                <select
                  value={repMetal}
                  onChange={(e) => setRepMetal(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="gold">Gold (सोना)</option>
                  <option value="silver">Silver (चांदी)</option>
                </select>
              </div>
              <GlassInput
                label="Intake Gross Wt (g) *"
                type="number"
                step="0.001"
                value={repIntakeGross}
                onChange={(e) => {
                  setRepIntakeGross(e.target.value);
                  setRepIntakeNet(e.target.value);
                }}
                required
              />
              <GlassInput
                label="Intake Net Wt (g) *"
                type="number"
                step="0.001"
                value={repIntakeNet}
                onChange={(e) => setRepIntakeNet(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Repair Type *
                </label>
                <select
                  value={repType}
                  onChange={(e) => setRepType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="solder_joint">Solder Joint / Broken Link (टांका)</option>
                  <option value="rhodium_polish">Rhodium & Gold Polish (पॉलिश)</option>
                  <option value="stone_setting">Stone / Diamond Re-setting (नगीना जड़ाई)</option>
                  <option value="resizing">Ring Resizing / Bangle Size (साइज)</option>
                  <option value="stringing_pearls">Pearl / Bead Stringing (मोती पिरोना)</option>
                  <option value="general_repair">General Repair & Dent Removal</option>
                </select>
              </div>
              <GlassInput
                label="Estimated Labour Charges (₹) *"
                type="number"
                prefixSymbol="₹"
                value={repCharges}
                onChange={(e) => setRepCharges(e.target.value)}
                required
              />
            </div>

            <GlassInput
              label="Defect & Condition Notes *"
              placeholder="e.g. Hook snapped, 2 stones missing, scratch on front..."
              value={repCondition}
              onChange={(e) => setRepCondition(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Assign Goldsmith / Karigar"
                placeholder="Gopal Babu"
                value={repKarigar}
                onChange={(e) => setRepKarigar(e.target.value)}
              />
              <GlassInput
                label="Promised Delivery Date *"
                type="date"
                value={repDeliveryDate}
                onChange={(e) => setRepDeliveryDate(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsRepairModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Create Repair Slip & Weighed Intake
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 2: New Custom Booking */}
      {isBookingModalOpen && (
        <GlassDialog
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          title="New Custom Ornament Booking (कस्टम गहना बुकिंग)"
          description="Book a made-to-order ornament with rate-lock protection and advance deposit."
          maxWidth="lg"
        >
          <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Customer Full Name *"
                placeholder="e.g. Mrs. Sunita Sharma"
                value={bookCustomerName}
                onChange={(e) => setBookCustomerName(e.target.value)}
                required
              />
              <GlassInput
                label="Mobile Phone *"
                placeholder="+91 98290..."
                value={bookCustomerPhone}
                onChange={(e) => setBookCustomerPhone(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Ornament Design Title *"
                placeholder="e.g. 22K Traditional Kundan Hasli"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Category
                </label>
                <select
                  value={bookCategory}
                  onChange={(e) => setBookCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="Necklace">Necklace / Choker (हार)</option>
                  <option value="Bangles">Bangles & Kadas (कंगन)</option>
                  <option value="Rings">Ring (अंगूठी)</option>
                  <option value="Earrings">Earrings / Jhumka (झुमकी)</option>
                  <option value="Chains">Chains / Mangalsutra (मंगलसूत्र)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <GlassInput
                label="Target Weight (g) *"
                type="number"
                step="0.001"
                value={bookTargetWeight}
                onChange={(e) => setBookTargetWeight(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Purity
                </label>
                <select
                  value={bookPurity}
                  onChange={(e) => setBookPurity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="22K (916)">22K (916 BIS Hallmark)</option>
                  <option value="18K (750)">18K (750 Diamond Setting)</option>
                  <option value="24K (999)">24K (999 Pure Bullion)</option>
                </select>
              </div>
              <GlassInput
                label="Estimated Total Amount (₹) *"
                type="number"
                prefixSymbol="₹"
                value={bookEstTotal}
                onChange={(e) => setBookEstTotal(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-black/40 border border-white/[0.06]">
              <div>
                <label className="text-xs font-medium text-[#DFC488] block mb-1.5">
                  Rate Policy (भाव तय नियम)
                </label>
                <select
                  value={bookRateMode}
                  onChange={(e) => setBookRateMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/50 border border-white/[0.1] text-[var(--text-primary)]"
                >
                  <option value="rate_fixed_at_booking">🔒 Lock Today&apos;s Rate (भाव पक्का)</option>
                  <option value="market_rate_on_delivery">📊 Delivery Date Sarafa Rate (तारीख का भाव)</option>
                </select>
              </div>
              {bookRateMode === "rate_fixed_at_booking" && (
                <GlassInput
                  label="Locked Gold Rate (₹/10g) *"
                  type="number"
                  value={bookFixedRate}
                  onChange={(e) => setBookFixedRate(e.target.value)}
                />
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <GlassInput
                label="Advance Deposit (₹) *"
                type="number"
                prefixSymbol="₹"
                value={bookAdvance}
                onChange={(e) => setBookAdvance(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Advance Mode
                </label>
                <select
                  value={bookAdvanceMode}
                  onChange={(e) => setBookAdvanceMode(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="Cash">Cash in Drawer (रोकड़)</option>
                  <option value="Bank">Bank NEFT / IMPS</option>
                  <option value="OldGold">Old Gold Scrap Exchange</option>
                </select>
              </div>
              <GlassInput
                label="Delivery Due Date *"
                type="date"
                value={bookDueDate}
                onChange={(e) => setBookDueDate(e.target.value)}
                required
              />
            </div>

            <GlassInput
              label="Design Instructions & Notes"
              placeholder="e.g. Red enamel meena on rear, safety chain lock, syndicate uncut stones..."
              value={bookNotes}
              onChange={(e) => setBookNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsBookingModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Book Order & Collect Advance
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}
    </div>
  );
};
