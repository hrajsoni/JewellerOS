"use client";

import React, { useState } from "react";
import { GirviLoan, NewGirviInput } from "../../modules/girvi/types";
import { calculateAccruedInterest } from "../../modules/girvi/store";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Coins,
  Plus,
  Search,
  Scale,
  Calendar,
  Phone,
  MapPin,
  Printer,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Zap,
  Lock,
  ArrowUpDown,
  SlidersHorizontal,
  X,
  Filter,
} from "lucide-react";

export interface GirviManagerProps {
  loans: GirviLoan[];
  onAddLoan: (input: NewGirviInput) => void;
  onReleaseLoan: (loanId: string) => void;
  shopName: string;
}

export const GirviManager: React.FC<GirviManagerProps> = ({
  loans,
  onAddLoan,
  onReleaseLoan,
  shopName,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "released">("all");
  const [sortBy, setSortBy] = useState<
    "date_desc" | "date_asc" | "principal_desc" | "principal_asc" | "interest_desc" | "total_desc"
  >("date_desc");
  const [dateFilter, setDateFilter] = useState<"all" | "30days" | "90days" | "180days">("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isExpressMode, setIsExpressMode] = useState(true);
  const [selectedReceiptLoan, setSelectedReceiptLoan] = useState<GirviLoan | null>(null);

  // Form State
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("+91 ");
  const [custAadhaar, setCustAadhaar] = useState("");
  const [custAddress, setCustAddress] = useState("");
  const [custCity, setCustCity] = useState("Jaipur");
  const [ornamentName, setOrnamentName] = useState("22K Gold Bangle");
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const [purity, setPurity] = useState("22K");
  const [grossWeight, setGrossWeight] = useState("15.0");
  const [netWeight, setNetWeight] = useState("15.0");
  const [principal, setPrincipal] = useState("100000");
  const [interestRate, setInterestRate] = useState("1.5");
  const [interestType, setInterestType] = useState<"simple" | "compound">("simple");
  const [durationMonths, setDurationMonths] = useState("6");
  const [packetNumber, setPacketNumber] = useState(`PKT-${Math.floor(100 + Math.random() * 900)}`);
  const [safeLocation, setSafeLocation] = useState("Tijori #1, Dabba #A");
  const [notes, setNotes] = useState("");

  const filtered = loans
    .filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.loanNumber.toLowerCase().includes(q) ||
        l.customerName.toLowerCase().includes(q) ||
        l.customerPhone.includes(q) ||
        (l.customerCity && l.customerCity.toLowerCase().includes(q)) ||
        (l.packetNumber && l.packetNumber.toLowerCase().includes(q)) ||
        (l.customerAadhaar && l.customerAadhaar.toLowerCase().includes(q));

      const matchesStatus = statusFilter === "all" || l.status === statusFilter;

      let matchesDate = true;
      if (dateFilter !== "all") {
        const loanDate = new Date(l.startDate).getTime();
        const now = Date.now();
        const daysDiff = (now - loanDate) / (1000 * 60 * 60 * 24);
        if (dateFilter === "30days") matchesDate = daysDiff <= 30;
        else if (dateFilter === "90days") matchesDate = daysDiff <= 90;
        else if (dateFilter === "180days") matchesDate = daysDiff <= 180;
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      const aAccrual = calculateAccruedInterest(a);
      const bAccrual = calculateAccruedInterest(b);
      const aTotal = a.principalAmount + aAccrual.totalAccruedInterest;
      const bTotal = b.principalAmount + bAccrual.totalAccruedInterest;

      if (sortBy === "date_desc") {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      if (sortBy === "date_asc") {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      if (sortBy === "principal_desc") {
        return b.principalAmount - a.principalAmount;
      }
      if (sortBy === "principal_asc") {
        return a.principalAmount - b.principalAmount;
      }
      if (sortBy === "interest_desc") {
        return bAccrual.totalAccruedInterest - aAccrual.totalAccruedInterest;
      }
      if (sortBy === "total_desc") {
        return bTotal - aTotal;
      }
      return 0;
    });

  // Aggregates
  const totalActivePrincipal = loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + (l.principalAmount - l.principalRepaid), 0);

  const totalReleasedPrincipal = loans
    .filter((l) => l.status === "released")
    .reduce((sum, l) => sum + l.principalAmount, 0);

  const totalPledgedGold = loans
    .filter((l) => l.status === "active")
    .flatMap((l) => l.ornaments.filter((o) => o.metal === "gold"))
    .reduce((sum, o) => sum + o.netWeight, 0);

  const totalAccruedReceivable = loans
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + calculateAccruedInterest(l).totalAccruedInterest, 0);

  // Total Loan Price = Principal + Accrued Interest
  const totalLoanPriceBook = totalActivePrincipal + totalAccruedReceivable;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !principal) return;

    onAddLoan({
      customerName: custName,
      customerPhone: custPhone,
      customerAadhaar: custAadhaar || undefined,
      customerAddress: custAddress || "Local Sarafa Bazaar",
      customerCity: custCity,
      ornamentName,
      metal,
      purity,
      grossWeight: parseFloat(grossWeight) || 0,
      netWeight: parseFloat(netWeight) || 0,
      principalAmount: parseFloat(principal) || 0,
      monthlyInterestRate: parseFloat(interestRate) || 1.5,
      interestType,
      durationMonths: parseInt(durationMonths) || 6,
      packetNumber,
      safeLocation,
      notes: notes || undefined,
    });

    setIsAddModalOpen(false);
    // Reset form
    setCustName("");
    setCustPhone("+91 ");
    setPrincipal("100000");
    setPacketNumber(`PKT-${Math.floor(100 + Math.random() * 900)}`);
  };

  const currentPrincipalNum = parseFloat(principal) || 0;
  const currentRateNum = parseFloat(interestRate) || 1.5;
  const currentMonthlyInterestRupees = Math.round((currentPrincipalNum * currentRateNum) / 100);

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#DFC488]">
              <Coins size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Girvi & Gold Loan Book (गिरवी / रेहन खाता)
            </h1>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Pawn brokering registry, monthly saikda interest calculation & Form 7 pledge vouchers for {shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            + New Girvi Loan (नई गिरवी रसीद)
          </GlassButton>
        </div>
      </div>

      {/* Aggregate Metric Cards: Showing Money Lent, Price, Interest, Total Price explicitly */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Money Lent / Price */}
        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-[#C5A059]/30 space-y-1 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-[#DFC488] uppercase tracking-wider block">
              1. Money Lent (कुल दिया कर्ज)
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#C5A059]/15 text-[#DFC488] font-mono">
              Principal
            </span>
          </div>
          <div className="text-xl font-bold text-[#DFC488] num-tabular">
            {formatINR(totalActivePrincipal)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            {loans.filter((l) => l.status === "active").length} Active · Total: {formatINR(totalActivePrincipal + totalReleasedPrincipal)}
          </span>
        </div>

        {/* 2. Accrued Interest */}
        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block">
            2. Accrued Interest (अर्जित ब्याज)
          </span>
          <div className="text-xl font-bold text-[var(--accent-emerald)] num-tabular">
            +{formatINR(totalAccruedReceivable)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Live uncollected interest
          </span>
        </div>

        {/* 3. Total Price */}
        <div className="p-4 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/40 shadow-lg space-y-1">
          <span className="text-[10px] font-bold text-[#DFC488] uppercase tracking-wider block">
            3. Total Price / Settlement (कुल मूल्य)
          </span>
          <div className="text-xl font-black text-[#DFC488] num-tabular">
            {formatINR(totalLoanPriceBook)}
          </div>
          <span className="text-[10px] text-[#DFC488]/80 block font-medium">
            Principal + Accrued Interest
          </span>
        </div>

        {/* 4. Vault Security */}
        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block">
            4. Pledged Gold (तिजोरी में सोना)
          </span>
          <div className="text-xl font-bold text-[var(--text-primary)] num-tabular">
            {formatGrams(totalPledgedGold)}
          </div>
          <span className="text-[10px] text-[var(--text-secondary)] block">
            Sealed packet backing
          </span>
        </div>

        {/* 5. Released */}
        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider block">
            5. Settled / Released (निपटारे)
          </span>
          <div className="text-xl font-bold text-[var(--text-secondary)] num-tabular">
            {loans.filter((l) => l.status === "released").length} Loans
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] block">
            Safe release vouchers
          </span>
        </div>
      </div>

      {/* Filter, Search & Sort Control Bar */}
      <div className="p-3.5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-3">
        {/* Top Row: Search Input + Status Filter */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
            />
            <input
              type="text"
              placeholder="Search by borrower name, city, phone, packet # (PKT-101), loan #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="inline-flex p-1 rounded-lg bg-black/20 border border-white/[0.04] text-xs self-start md:self-auto shrink-0">
            {[
              { label: "All Loans", value: "all", count: loans.length },
              { label: "Active", value: "active", count: loans.filter((l) => l.status === "active").length },
              { label: "Released", value: "released", count: loans.filter((l) => l.status === "released").length },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value as any)}
                className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
                  statusFilter === tab.value
                    ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1 rounded-full bg-white/[0.06]">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Date Filter Chips + Sort Dropdown + Count Indicator */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.04] text-xs">
          {/* Date Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1 mr-1">
              <Calendar size={12} />
              <span>Date:</span>
            </span>
            {[
              { label: "All Time", value: "all" },
              { label: "Last 30 Days", value: "30days" },
              { label: "Last 3 Months", value: "90days" },
              { label: "Last 6 Months", value: "180days" },
            ].map((d) => (
              <button
                key={d.value}
                onClick={() => setDateFilter(d.value as any)}
                className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                  dateFilter === d.value
                    ? "bg-[#C5A059]/25 text-[#DFC488] font-semibold border border-[#C5A059]/40"
                    : "bg-white/[0.03] text-[var(--text-secondary)] hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown & Match Counter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <ArrowUpDown size={12} className="text-[#DFC488]" />
              <span className="text-[11px] text-[var(--text-tertiary)]">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-1 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]/60"
              >
                <option value="date_desc">Date: Newest First</option>
                <option value="date_asc">Date: Oldest First</option>
                <option value="principal_desc">Money Lent: High to Low</option>
                <option value="principal_asc">Money Lent: Low to High</option>
                <option value="interest_desc">Interest: High to Low</option>
                <option value="total_desc">Total Price: High to Low</option>
              </select>
            </div>

            <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
              Showing {filtered.length} of {loans.length}
            </span>
          </div>
        </div>
      </div>

      {/* Girvi Table & Mobile Cards */}
      <GlassPanel className="p-0 overflow-hidden">
        {/* Desktop View: Full Data Grid */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[10px] bg-white/[0.01]">
                <th className="py-3 px-3.5 font-semibold">Pledge & Packet</th>
                <th className="py-3 px-3.5 font-semibold">Borrower</th>
                <th className="py-3 px-3.5 font-semibold">Pledged Ornament</th>
                <th className="py-3 px-3.5 font-semibold text-right text-[#DFC488]">Money Lent / Price (मूलधन)</th>
                <th className="py-3 px-3.5 font-semibold text-center">Monthly Rate</th>
                <th className="py-3 px-3.5 font-semibold text-right text-[var(--accent-emerald)]">Accrued Interest</th>
                <th className="py-3 px-3.5 font-semibold text-right text-[#DFC488]">Total Price (कुल मूल्य)</th>
                <th className="py-3 px-3.5 font-semibold text-center">Status</th>
                <th className="py-3 px-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                    No gold loan records found matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((l) => {
                  const accrual = calculateAccruedInterest(l);
                  const monthlyRupees = Math.round((l.principalAmount * l.monthlyInterestRate) / 100);

                  return (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* 1. Pledge & Packet */}
                      <td className="py-3 px-3.5 font-mono">
                        <div className="font-semibold text-[var(--text-primary)]">{l.loanNumber}</div>
                        <div className="inline-flex items-center gap-1 text-[10px] text-[#DFC488] mt-0.5">
                          <Lock size={10} />
                          <span>{l.packetNumber || "PKT-100"}</span>
                        </div>
                        <div className="text-[9px] text-[var(--text-tertiary)]">
                          {new Date(l.startDate).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      {/* 2. Borrower */}
                      <td className="py-3 px-3.5">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {l.customerName}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] font-mono">
                          {l.customerPhone}
                        </div>
                        <div className="text-[9px] text-[var(--text-tertiary)] truncate max-w-[140px]">
                          {l.customerCity ? `${l.customerCity} · ` : ""}{l.customerAddress}
                        </div>
                      </td>

                      {/* 3. Pledged Ornament & Safe Location */}
                      <td className="py-3 px-3.5">
                        <div className="text-[var(--text-primary)] font-medium">
                          {l.ornaments[0]?.name || "Gold Ornament"}
                        </div>
                        <div className="text-[10px] text-[#DFC488] font-mono">
                          {formatGrams(l.ornaments[0]?.netWeight || 0)} ({l.ornaments[0]?.purity})
                        </div>
                        <div className="text-[9px] text-[var(--text-tertiary)]">
                          Loc: {l.safeLocation || "Tijori #1"}
                        </div>
                      </td>

                      {/* 4. Money Lent / Price */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-sm text-[var(--text-primary)]">
                        {formatINR(l.principalAmount)}
                      </td>

                      {/* 5. Monthly Rate in % & Rupees */}
                      <td className="py-3 px-3.5 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[#DFC488] font-medium text-[11px] block">
                          ₹{monthlyRupees}/mo
                        </span>
                        <span className="text-[9px] text-[var(--text-tertiary)]">
                          {l.monthlyInterestRate}% (₹{l.monthlyInterestRate} saikda)
                        </span>
                      </td>

                      {/* 6. Accrued Interest */}
                      <td className="py-3 px-3.5 text-right font-mono">
                        <div className="text-[var(--accent-emerald)] font-semibold text-sm">
                          +{formatINR(accrual.totalAccruedInterest)}
                        </div>
                        <div className="text-[9px] text-[var(--text-tertiary)]">
                          {accrual.monthsElapsed} mos ({accrual.daysElapsed} days)
                        </div>
                      </td>

                      {/* 7. TOTAL PRICE */}
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-sm text-[#DFC488]">
                        <div className="p-1 rounded bg-[#C5A059]/10 border border-[#C5A059]/20 inline-block text-right">
                          {formatINR(accrual.netPayableToRelease)}
                        </div>
                      </td>

                      {/* 8. Status */}
                      <td className="py-3 px-3.5 text-center">
                        <GlassBadge
                          variant={l.status === "active" ? "emerald" : "neutral"}
                          size="sm"
                        >
                          {l.status === "active" ? "Active (चालू)" : "Released (चुक्ता)"}
                        </GlassBadge>
                      </td>

                      {/* 9. Actions */}
                      <td className="py-3 px-3.5 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedReceiptLoan(l)}
                            className="p-1.5 rounded bg-white/[0.04] text-[var(--text-secondary)] hover:text-[#DFC488] hover:bg-white/[0.08] transition-colors"
                            title="Print Form 7 Girvi Parchi"
                          >
                            <Printer size={14} />
                          </button>

                          {l.status === "active" && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Release loan ${l.loanNumber} for ${l.customerName}?\nPrincipal: ${formatINR(l.principalAmount)}\nInterest: +${formatINR(accrual.totalAccruedInterest)}\nTotal Settlement Price: ${formatINR(accrual.netPayableToRelease)}`
                                  )
                                ) {
                                  onReleaseLoan(l.id);
                                }
                              }}
                              className="px-2 py-1 rounded text-[10px] font-semibold bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/25 transition-colors"
                              title="Settle full payment and return gold ornaments"
                            >
                              Release
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View: High-Utility Liquid Glass Loan Cards */}
        <div className="block md:hidden divide-y divide-white/[0.05]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-tertiary)]">
              No gold loan records found matching criteria.
            </div>
          ) : (
            filtered.map((l) => {
              const accrual = calculateAccruedInterest(l);
              const monthlyRupees = Math.round((l.principalAmount * l.monthlyInterestRate) / 100);

              return (
                <div key={l.id} className="p-4 space-y-3 hover:bg-white/[0.01] transition-colors">
                  {/* Top Bar: Pledge #, Packet, Date & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-[var(--text-primary)]">
                        {l.loanNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#C5A059]/20 text-[#DFC488] font-mono">
                        <Lock size={9} />
                        {l.packetNumber || "PKT-100"}
                      </span>
                    </div>
                    <GlassBadge
                      variant={l.status === "active" ? "emerald" : "neutral"}
                      size="sm"
                    >
                      {l.status === "active" ? "Active" : "Released"}
                    </GlassBadge>
                  </div>

                  {/* Borrower & Location */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-primary)]">
                        {l.customerName}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${l.customerPhone}`}
                          className="text-[#DFC488] hover:underline flex items-center gap-1 font-mono"
                        >
                          <Phone size={10} />
                          {l.customerPhone}
                        </a>
                        <span className="text-[var(--text-tertiary)]">·</span>
                        <span className="text-[var(--text-tertiary)] flex items-center gap-0.5">
                          <MapPin size={10} />
                          {l.customerCity || "Jaipur"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-[var(--text-tertiary)] font-mono">
                      {new Date(l.startDate).toLocaleDateString("en-IN")}
                    </div>
                  </div>

                  {/* Ornament Details */}
                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] flex items-center justify-between text-[11px]">
                    <div className="space-y-0.5">
                      <div className="font-medium text-[var(--text-primary)]">
                        {l.ornaments[0]?.name || "Gold Ornament"}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)]">
                        Vault: {l.safeLocation || "Tijori #1"}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-[#DFC488] font-semibold">
                        {formatGrams(l.ornaments[0]?.netWeight || 0)}
                      </span>
                      <span className="text-[10px] text-[var(--text-secondary)] ml-1">
                        ({l.ornaments[0]?.purity})
                      </span>
                    </div>
                  </div>

                  {/* 3-Pill Liquid Glass Metric Grid: Price, Interest, Total Price */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    {/* 1. Money Lent / Price */}
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] block">
                        Money Lent
                      </span>
                      <span className="text-xs font-bold font-mono text-[var(--text-primary)] block mt-0.5">
                        {formatINR(l.principalAmount)}
                      </span>
                      <span className="text-[8px] text-[var(--text-tertiary)] block">
                        ₹{monthlyRupees}/mo
                      </span>
                    </div>

                    {/* 2. Accrued Interest */}
                    <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                      <span className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] block">
                        Interest
                      </span>
                      <span className="text-xs font-bold font-mono text-[var(--accent-emerald)] block mt-0.5">
                        +{formatINR(accrual.totalAccruedInterest)}
                      </span>
                      <span className="text-[8px] text-[var(--text-tertiary)] block">
                        {accrual.monthsElapsed} mos
                      </span>
                    </div>

                    {/* 3. Total Price */}
                    <div className="p-2 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30">
                      <span className="text-[9px] uppercase tracking-wider text-[#DFC488] font-semibold block">
                        Total Price
                      </span>
                      <span className="text-xs font-black font-mono text-[#DFC488] block mt-0.5">
                        {formatINR(accrual.netPayableToRelease)}
                      </span>
                      <span className="text-[8px] text-[#DFC488]/80 block font-medium">
                        Due Today
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedReceiptLoan(l)}
                      icon={<Printer size={13} />}
                      className="text-xs"
                    >
                      Form 7 Parchi
                    </GlassButton>

                    {l.status === "active" && (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(
                              `Release loan ${l.loanNumber} for ${l.customerName}?\nPrincipal: ${formatINR(l.principalAmount)}\nInterest: +${formatINR(accrual.totalAccruedInterest)}\nTotal Settlement Price: ${formatINR(accrual.netPayableToRelease)}`
                            )
                          ) {
                            onReleaseLoan(l.id);
                          }
                        }}
                        icon={<CheckCircle2 size={13} />}
                        className="text-xs bg-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/90 text-black font-semibold"
                      >
                        Release Loan
                      </GlassButton>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassPanel>

      {/* New Girvi Loan Modal */}
      {isAddModalOpen && (
        <GlassDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create New Girvi Loan (नई गिरवी पर्ची)"
          description="Register borrower KYC and generate an official Form 7 pledge voucher."
          maxWidth="xl"
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {/* Express Entry Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#C5A059]/15 border border-[#C5A059]/30">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[#DFC488]">
                <Zap size={14} />
                15-Second Express Entry for Counter (फास्ट काउंटर मोड)
              </span>
              <button
                type="button"
                onClick={() => setIsExpressMode(!isExpressMode)}
                className="text-[11px] font-bold underline text-[#DFC488]"
              >
                {isExpressMode ? "Switch to Full Form (विस्तृत फॉर्म)" : "Switch to Express Mode (फास्ट मोड)"}
              </button>
            </div>

            {/* Section 1: Borrower */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                1. Borrower Details (कर्जदार विवरण)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Borrower Name (नाम) *"
                  placeholder="e.g. Rameshwar Sharma"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  required
                />
                <GlassInput
                  label="Mobile Contact (फ़ोन) *"
                  placeholder="+91 94140 12345"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  required
                />
              </div>

              {!isExpressMode && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <GlassInput
                    label="Aadhaar ID"
                    placeholder="XXXX-XXXX-1234"
                    value={custAadhaar}
                    onChange={(e) => setCustAadhaar(e.target.value)}
                  />
                  <GlassInput
                    label="City / Town"
                    placeholder="Jaipur"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                  />
                  <GlassInput
                    label="Full Address"
                    placeholder="Village / Street"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Section 2: Ornament & Packet Location */}
            <div className="p-3 rounded-xl bg-black/30 border border-white/[0.06] space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                2. Pledged Ornament & Vault Packet (जेवर व तिजोरी पैकेट)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <GlassInput
                  label="Ornament Name (जेवर का विवरण) *"
                  placeholder="e.g. 22K Gold Mangalsutra"
                  value={ornamentName}
                  onChange={(e) => setOrnamentName(e.target.value)}
                  required
                />
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                    Metal & Purity
                  </label>
                  <select
                    value={purity}
                    onChange={(e) => setPurity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                  >
                    <option value="22K">22K Gold (916)</option>
                    <option value="18K">18K Gold (750)</option>
                    <option value="24K">24K Bullion</option>
                    <option value="925">925 Pure Silver</option>
                  </select>
                </div>
                <GlassInput
                  label="Gross Weight (g)"
                  type="number"
                  step="0.001"
                  value={grossWeight}
                  onChange={(e) => {
                    setGrossWeight(e.target.value);
                    if (isExpressMode) setNetWeight(e.target.value);
                  }}
                />
                <GlassInput
                  label="Net Metal Wt (g) *"
                  type="number"
                  step="0.001"
                  value={netWeight}
                  onChange={(e) => setNetWeight(e.target.value)}
                  required
                />
              </div>

              {/* Packet & Locker Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <GlassInput
                  label="Vault Packet Number (पैकेट नं)"
                  placeholder="PKT-104"
                  value={packetNumber}
                  onChange={(e) => setPacketNumber(e.target.value)}
                  required
                />
                <GlassInput
                  label="Safe Box / Locker Location (तिजोरी का डिब्बा)"
                  placeholder="Tijori #1, Dabba #A"
                  value={safeLocation}
                  onChange={(e) => setSafeLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Section 3: Loan Price & Interest Terms */}
            <div className="p-3.5 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#DFC488] block">
                3. Loan Amount Price & Monthly Saikda (मूलधन व ब्याज)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <GlassInput
                  label="Loan Price / Principal (ऋण मूलधन ₹) *"
                  type="number"
                  prefixSymbol="₹"
                  placeholder="50000"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                  required
                />
                <GlassInput
                  label="Monthly Rate % (ब्याज सैकड़ा) *"
                  type="number"
                  step="0.1"
                  suffixSymbol="% / mo"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  required
                />
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] flex flex-col justify-center">
                  <span className="text-[10px] text-[var(--text-tertiary)]">Monthly Rupee Interest:</span>
                  <div className="text-sm font-bold font-mono text-[#DFC488]">
                    ₹{currentMonthlyInterestRupees} / month
                  </div>
                  <span className="text-[9px] text-[var(--text-secondary)]">
                    (₹{currentRateNum} saikda)
                  </span>
                </div>
              </div>

              {/* Settlement Preview */}
              <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.05] flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">
                  Est. 6-Month Settlement Total:
                </span>
                <span className="font-mono font-bold text-[#DFC488]">
                  {formatINR(currentPrincipalNum + currentMonthlyInterestRupees * 6)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Create Girvi Loan & Generate Parchi
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Girvi Parchi (Form 7 Voucher) Print Preview Modal */}
      {selectedReceiptLoan && (
        <GlassDialog
          isOpen={!!selectedReceiptLoan}
          onClose={() => setSelectedReceiptLoan(null)}
          title={`Girvi Pledge Voucher · ${selectedReceiptLoan.loanNumber}`}
          maxWidth="lg"
        >
          <div className="p-6 rounded-xl bg-white text-black text-xs space-y-4 font-serif">
            {/* Header */}
            <div className="text-center pb-3 border-b-2 border-black space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-wider">{shopName}</h2>
              <p className="text-[10px] text-gray-600">
                Govt. Licensed Pawn Broker & Fine Jewellery Showroom · Sarafa Bazaar
              </p>
              <div className="text-[12px] font-sans font-bold pt-1 uppercase tracking-wide">
                Form No. 7 · Pledge Receipt / गिरवी रसीद पर्ची
              </div>
            </div>

            {/* Loan, Packet, Safe Box & Borrower Details */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-sans border-b border-black pb-3">
              <div>
                <strong>Pledge No (रसीद नं):</strong> {selectedReceiptLoan.loanNumber}
              </div>
              <div className="text-right">
                <strong>Date (दिनांक):</strong>{" "}
                {new Date(selectedReceiptLoan.startDate).toLocaleDateString("en-IN")}
              </div>
              <div>
                <strong>Vault Packet No (पैकेट नं):</strong>{" "}
                <span className="font-bold underline">{selectedReceiptLoan.packetNumber || "PKT-101"}</span>
              </div>
              <div className="text-right">
                <strong>Safe Box (तिजोरी बॉक्स):</strong>{" "}
                <span>{selectedReceiptLoan.safeLocation || "Tijori #1, Dabba #A"}</span>
              </div>
              <div>
                <strong>Borrower (कर्जदार):</strong> {selectedReceiptLoan.customerName}
              </div>
              <div className="text-right">
                <strong>Phone (फ़ोन):</strong> {selectedReceiptLoan.customerPhone}
              </div>
              <div className="col-span-2">
                <strong>Address (पता):</strong> {selectedReceiptLoan.customerAddress},{" "}
                {selectedReceiptLoan.customerCity}
              </div>
            </div>

            {/* Pledged Items Table with Explicit Price, Interest & Total Price */}
            <table className="w-full text-left border border-black text-[11px] font-sans">
              <thead className="bg-gray-100 border-b border-black">
                <tr>
                  <th className="p-1.5 border-r border-black">Article Description</th>
                  <th className="p-1.5 border-r border-black">Purity</th>
                  <th className="p-1.5 border-r border-black text-right">Gross Wt</th>
                  <th className="p-1.5 border-r border-black text-right">Net Wt</th>
                  <th className="p-1.5 text-right">Loan Price (मूलधन)</th>
                </tr>
              </thead>
              <tbody>
                {selectedReceiptLoan.ornaments.map((o) => (
                  <tr key={o.id} className="border-b border-black">
                    <td className="p-1.5 border-r border-black font-medium">{o.name}</td>
                    <td className="p-1.5 border-r border-black">{o.purity}</td>
                    <td className="p-1.5 border-r border-black text-right font-mono">
                      {formatGrams(o.grossWeight)}
                    </td>
                    <td className="p-1.5 border-r border-black text-right font-mono">
                      {formatGrams(o.netWeight)}
                    </td>
                    <td className="p-1.5 text-right font-mono font-bold">
                      {formatINR(selectedReceiptLoan.principalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Interest & Total Price Box */}
            {(() => {
              const accrual = calculateAccruedInterest(selectedReceiptLoan);
              const monthlyRs = Math.round(
                (selectedReceiptLoan.principalAmount * selectedReceiptLoan.monthlyInterestRate) / 100
              );

              return (
                <div className="p-3 bg-gray-50 border border-black text-[11px] font-sans space-y-1.5">
                  <div className="flex justify-between">
                    <span>1. Loan Price / Principal (मूलधन):</span>
                    <span className="font-mono font-bold">{formatINR(selectedReceiptLoan.principalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      2. Monthly Agreed Rate: {selectedReceiptLoan.monthlyInterestRate}% / mo (₹{selectedReceiptLoan.monthlyInterestRate} saikda):
                    </span>
                    <span className="font-mono font-semibold">₹{monthlyRs} per month</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>3. Accrued Interest till today ({accrual.monthsElapsed} months elapsed):</span>
                    <span className="font-mono font-bold">+{formatINR(accrual.totalAccruedInterest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-black pt-1 text-sm font-bold">
                    <span>TOTAL PRICE TO REDEEM TODAY (कुल चुकता मूल्य):</span>
                    <span className="font-mono">{formatINR(accrual.netPayableToRelease)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Terms & Notice */}
            <div className="text-[9px] text-gray-600 font-sans space-y-0.5">
              <p>
                <strong>Terms:</strong> 1. Pledged ornament is sealed in tamper-proof packet under vault custody. 
                2. Borrower must present this original parchi along with valid photo ID at the time of redemption. 
                3. Maximum redemption term is 12 months, after which statutory notice will be dispatched.
              </p>
            </div>

            {/* Signature Block */}
            <div className="grid grid-cols-2 pt-6 text-[11px] font-sans">
              <div className="text-center">
                <div className="border-t border-black pt-1 w-36 mx-auto">
                  Borrower Signature (कर्जदार हस्ताक्षर)
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-black pt-1 w-36 mx-auto">
                  For {shopName} (अधिकृत हस्ताक्षर)
                </div>
              </div>
            </div>

            {/* Print Action */}
            <div className="pt-4 border-t border-gray-200 flex justify-end gap-2 no-print">
              <GlassButton
                variant="primary"
                size="sm"
                onClick={() => window.print()}
                icon={<Printer size={14} />}
              >
                Print Form 7 Girvi Parchi
              </GlassButton>
            </div>
          </div>
        </GlassDialog>
      )}
    </div>
  );
};
