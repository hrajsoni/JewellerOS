"use client";

import React, { useState } from "react";
import {
  StaffMember,
  StaffPaymentRecord,
  StaffRole,
  AddStaffInput,
  IssueAdvanceInput,
  PaySalaryInput,
} from "../../modules/staff/types";
import { formatINR } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Users,
  Plus,
  Search,
  Banknote,
  Receipt,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wallet,
  Clock,
} from "lucide-react";

export interface StaffManagerProps {
  staffList: StaffMember[];
  paymentRecords: StaffPaymentRecord[];
  onAddStaff: (input: AddStaffInput) => void;
  onIssueAdvance: (input: IssueAdvanceInput) => void;
  onPaySalary: (input: PaySalaryInput) => void;
  shopName: string;
}

export const StaffManager: React.FC<StaffManagerProps> = ({
  staffList,
  paymentRecords,
  onAddStaff,
  onIssueAdvance,
  onPaySalary,
  shopName,
}) => {
  const [activeTab, setActiveTab] = useState<"directory" | "payments">("directory");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Add Staff State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [role, setRole] = useState<StaffRole>("Counter Salesman");
  const [salary, setSalary] = useState("25000");
  const [aadhaar, setAadhaar] = useState("");
  const [notes, setNotes] = useState("");

  // Issue Advance State
  const [advAmount, setAdvAmount] = useState("");
  const [advMethod, setAdvMethod] = useState<"Cash" | "UPI" | "Bank Transfer">("Cash");
  const [advNotes, setAdvNotes] = useState("Cash counter advance");

  // Pay Salary State
  const [salaryMonth, setSalaryMonth] = useState("September 2026");
  const [deductAdvance, setDeductAdvance] = useState("0");
  const [salMethod, setSalMethod] = useState<"Cash" | "UPI" | "Bank Transfer">("Bank Transfer");
  const [salNotes, setSalNotes] = useState("");

  // Aggregates
  const totalMonthlyPayroll = staffList
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.monthlySalary, 0);

  const totalOutstandingAdvances = staffList.reduce((sum, s) => sum + s.advanceBalance, 0);

  const filteredStaff = staffList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.role.toLowerCase().includes(q);
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddStaff({
      name,
      phone,
      role,
      monthlySalary: parseFloat(salary) || 0,
      aadhaar: aadhaar || undefined,
      notes: notes || undefined,
    });
    setIsAddModalOpen(false);
    setName("");
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff || !advAmount) return;
    onIssueAdvance({
      staffId: selectedStaff.id,
      amount: parseFloat(advAmount) || 0,
      paymentMethod: advMethod,
      notes: advNotes,
    });
    setIsAdvanceModalOpen(false);
    setAdvAmount("");
  };

  const handleSalarySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    const base = selectedStaff.monthlySalary;
    const advDed = Math.min(selectedStaff.advanceBalance, parseFloat(deductAdvance) || 0);
    const net = Math.max(0, base - advDed);

    onPaySalary({
      staffId: selectedStaff.id,
      salaryMonth,
      baseSalary: base,
      deductAdvance: advDed,
      netPaid: net,
      paymentMethod: salMethod,
      notes: salNotes,
    });
    setIsSalaryModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#DFC488]">
              <Users size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Staff & Payroll (स्टाफ व वेतन खाता)
            </h1>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Showroom sales associates, vault custodians, cash advance (रोखड़ पेशगी) & monthly salary register for {shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Staff (नया कर्मचारी)
          </GlassButton>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Total Staff (कुल कर्मचारी)
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {staffList.filter((s) => s.status === "active").length} Active
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Counter sales & custodians
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Monthly Payroll (मासिक वेतन दायित्व)
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {formatINR(totalMonthlyPayroll)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Base salaries liability
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Active Cash Advances (रोखड़ पेशगी)
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-coral)] num-tabular">
            {formatINR(totalOutstandingAdvances)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            To deduct from upcoming salary
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Vault Keyholders (तिजोरी रक्षक)
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-emerald)] num-tabular">
            {staffList.filter((s) => s.role.includes("Custodian") || s.role.includes("Manager")).length} Assigned
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Custody verified
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06]">
        <div className="inline-flex p-1 rounded-lg bg-black/20 border border-white/[0.04] text-xs">
          <button
            onClick={() => setActiveTab("directory")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "directory"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Staff Directory & Balances ({staffList.length})
          </button>
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "payments"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Advances & Salary Payouts ({paymentRecords.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search employee name, role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>
      </div>

      {/* View: Directory */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                    {s.name}
                  </h3>
                  <div className="text-[11px] text-[#DFC488] font-medium mt-0.5">
                    {s.role}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                    <Phone size={10} /> {s.phone} · Joined {new Date(s.joiningDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </div>
                </div>
                <GlassBadge variant={s.status === "active" ? "emerald" : "neutral"} size="sm">
                  {s.status}
                </GlassBadge>
              </div>

              {/* Financial Status Box */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-black/40 border border-white/[0.04]">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Monthly Salary
                  </span>
                  <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    {formatINR(s.monthlySalary)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Advance Balance (पेशगी)
                  </span>
                  <div className={`text-sm font-bold font-mono ${s.advanceBalance > 0 ? "text-[var(--accent-coral)]" : "text-[var(--text-secondary)]"}`}>
                    {formatINR(s.advanceBalance)}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  className="text-[11px] py-1 font-medium"
                  onClick={() => {
                    setSelectedStaff(s);
                    setAdvAmount("");
                    setIsAdvanceModalOpen(true);
                  }}
                  title="Issue cash advance to employee"
                >
                  + Issue Advance
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  className="text-[11px] py-1 font-medium"
                  onClick={() => {
                    setSelectedStaff(s);
                    setDeductAdvance(s.advanceBalance.toString());
                    setIsSalaryModalOpen(true);
                  }}
                  title="Pay monthly salary with advance deduction"
                >
                  Pay Salary
                </GlassButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View: Payments History */}
      {activeTab === "payments" && (
        <GlassPanel className="p-0 overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                  <th className="py-3 px-4 font-semibold">Date & Voucher</th>
                  <th className="py-3 px-4 font-semibold">Employee</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-center">Method</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {paymentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                      No payroll records recorded yet.
                    </td>
                  </tr>
                ) : (
                  paymentRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div>{new Date(r.date).toLocaleDateString("en-IN")}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{r.id}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        {r.staffName}
                      </td>
                      <td className="py-3 px-4">
                        <GlassBadge
                          variant={r.type === "advance" ? "coral" : "emerald"}
                          size="sm"
                        >
                          {r.type === "advance" ? "Cash Advance (पेशगी)" : "Salary Payout (वेतन)"}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-[var(--text-primary)]">
                        {formatINR(r.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[var(--text-secondary)]">
                          {r.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[var(--text-tertiary)] max-w-xs truncate">
                        {r.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-white/[0.05]">
            {paymentRecords.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                No payroll records recorded yet.
              </div>
            ) : (
              paymentRecords.map((r) => (
                <div key={r.id} className="p-4 space-y-2 hover:bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-primary)]">
                        {r.staffName}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {new Date(r.date).toLocaleDateString("en-IN")} · {r.id}
                      </div>
                    </div>
                    <GlassBadge
                      variant={r.type === "advance" ? "coral" : "emerald"}
                      size="sm"
                    >
                      {r.type === "advance" ? "Advance" : "Salary"}
                    </GlassBadge>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-black/30 border border-white/[0.04]">
                    <span className="text-[11px] text-[var(--text-secondary)]">
                      Method: <span className="font-mono text-white">{r.paymentMethod}</span>
                    </span>
                    <span className="text-sm font-bold font-mono text-[#DFC488]">
                      {formatINR(r.amount)}
                    </span>
                  </div>

                  {r.notes && (
                    <div className="text-[10px] text-[var(--text-tertiary)] italic">
                      Note: {r.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      )}

      {/* Modal 1: Add New Staff */}
      {isAddModalOpen && (
        <GlassDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add Showroom Employee (नया कर्मचारी खाता)"
          description="Register counter salesman, vault custodian, or accounts associate."
          maxWidth="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <GlassInput
              label="Staff Full Name *"
              placeholder="e.g. Ramesh Soni"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                label="Contact Phone *"
                placeholder="+91 94140 12345"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Showroom Role *
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="Counter Salesman">Counter Salesman (काउंटर विक्रेता)</option>
                  <option value="Senior Sales Executive">Senior Sales Executive</option>
                  <option value="Safe & Vault Custodian">Safe & Vault Custodian (तिजोरी रक्षक)</option>
                  <option value="Billing Accountant">Billing Accountant (मुनीम / एकाउंटेंट)</option>
                  <option value="Store Manager">Store Manager (दुकान प्रबंधक)</option>
                  <option value="Karigar Supervisor">Karigar Supervisor</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                label="Monthly Salary (₹) *"
                type="number"
                prefixSymbol="₹"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                required
              />
              <GlassInput
                label="Aadhaar / ID Card"
                placeholder="XXXX-XXXX-1234"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value)}
              />
            </div>
            <GlassInput
              label="Internal Notes"
              placeholder="Emergency contact, guarantor in bazaar..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Save Employee
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 2: Issue Advance */}
      {isAdvanceModalOpen && selectedStaff && (
        <GlassDialog
          isOpen={isAdvanceModalOpen}
          onClose={() => setIsAdvanceModalOpen(false)}
          title={`Issue Cash Advance to ${selectedStaff.name} (रोखड़ पेशगी)`}
          description="Record emergency cash or festival advance against upcoming salary."
          maxWidth="sm"
        >
          <form onSubmit={handleAdvanceSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Current Advance Balance:</span>
              <span className="font-mono font-bold text-[var(--accent-coral)]">
                {formatINR(selectedStaff.advanceBalance)}
              </span>
            </div>

            <GlassInput
              label="Advance Amount (₹) *"
              type="number"
              prefixSymbol="₹"
              placeholder="5000"
              value={advAmount}
              onChange={(e) => setAdvAmount(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Disbursement Mode
              </label>
              <select
                value={advMethod}
                onChange={(e) => setAdvMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="Cash">Cash (तिजोरी से रोकड़)</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>

            <GlassInput
              label="Reason / Notes"
              placeholder="e.g. Festival advance, medical..."
              value={advNotes}
              onChange={(e) => setAdvNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsAdvanceModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Disburse Advance
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 3: Pay Salary */}
      {isSalaryModalOpen && selectedStaff && (
        <GlassDialog
          isOpen={isSalaryModalOpen}
          onClose={() => setIsSalaryModalOpen(false)}
          title={`Pay Monthly Salary for ${selectedStaff.name} (वेतन भुगतान)`}
          description="Settle monthly base salary with automated cash advance deduction."
          maxWidth="sm"
        >
          <form onSubmit={handleSalarySubmit} className="space-y-4 text-xs">
            <div className="space-y-2 p-3 rounded-lg bg-black/40 border border-white/[0.06]">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Base Monthly Salary:</span>
                <span className="font-mono font-bold text-[var(--text-primary)]">
                  {formatINR(selectedStaff.monthlySalary)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Outstanding Advance:</span>
                <span className="font-mono font-bold text-[var(--accent-coral)]">
                  {formatINR(selectedStaff.advanceBalance)}
                </span>
              </div>
            </div>

            <GlassInput
              label="Salary Month *"
              value={salaryMonth}
              onChange={(e) => setSalaryMonth(e.target.value)}
              required
            />

            <GlassInput
              label="Advance to Deduct (₹)"
              type="number"
              prefixSymbol="₹"
              value={deductAdvance}
              onChange={(e) => setDeductAdvance(e.target.value)}
            />

            <div className="p-3 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/20 flex justify-between items-center">
              <span className="text-xs font-semibold text-[#DFC488]">Net Payable to Employee:</span>
              <span className="text-base font-bold font-mono text-[#DFC488]">
                {formatINR(
                  Math.max(
                    0,
                    selectedStaff.monthlySalary - (parseFloat(deductAdvance) || 0)
                  )
                )}
              </span>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Payout Mode
              </label>
              <select
                value={salMethod}
                onChange={(e) => setSalMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="UPI">UPI / GPay</option>
                <option value="Cash">Cash (तिजोरी से रोकड़)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsSalaryModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Record Payout
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}
    </div>
  );
};
