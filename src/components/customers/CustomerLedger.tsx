"use client";

import React, { useState } from "react";
import { Customer, CustomerType, NewCustomerInput } from "../../modules/customers/types";
import { FinalizedInvoice } from "../../modules/invoicing/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MapPin,
  Receipt,
  Coins,
  ArrowUpRight,
  Sparkles,
  Calendar,
  FileText,
  CreditCard,
  Crown,
  Building2,
  User,
  History,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

export interface CustomerLedgerProps {
  customers: Customer[];
  invoices: FinalizedInvoice[];
  onAddCustomer: (input: NewCustomerInput) => void;
  onStartBillForCustomer: (customer: Customer) => void;
  onViewInvoice: (invoice: FinalizedInvoice) => void;
}

export const CustomerLedger: React.FC<CustomerLedgerProps> = ({
  customers,
  invoices,
  onAddCustomer,
  onStartBillForCustomer,
  onViewInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<"all" | CustomerType>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("+91 ");
  const [newEmail, setNewEmail] = useState("");
  const [newCity, setNewCity] = useState("Jaipur");
  const [newAddress, setNewAddress] = useState("");
  const [newGstin, setNewGstin] = useState("URP (Retail Consumer)");
  const [newPan, setNewPan] = useState("");
  const [newAadhaar, setNewAadhaar] = useState("");
  const [newTier, setNewTier] = useState<CustomerType>("retail");
  const [newNotes, setNewNotes] = useState("");

  const handleShareCustomerStatement = (c: Customer) => {
    const cleanPhone = c.phone.replace(/[^0-9]/g, "");
    const msg =
      `*CUSTOMER ACCOUNT STATEMENT · SANDHYA JEWELLERS*\n` +
      `Customer: *${c.name}* (${c.phone})\n` +
      `City: ${c.city}\n` +
      `--------------------------------\n` +
      `Total Purchases: ${formatINR(c.totalPurchases)} (${c.totalInvoicesCount} Invoices)\n` +
      `Gold Jewellery Purchased: ${formatGrams(c.totalGoldWeightGrams)}\n` +
      (c.outstandingCredit > 0
        ? `*Store Credit / Advance: ${formatINR(c.outstandingCredit)}*\n`
        : c.outstandingCredit < 0
        ? `*Pending Due (उधार): ${formatINR(Math.abs(c.outstandingCredit))}*\n`
        : `*Balance: Nil (All settled)*\n`) +
      `--------------------------------\n` +
      `Thank you for trusting Sandhya Jewellers!`;

    const target = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone || "";
    const url = target
      ? `https://wa.me/${target}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  // Filtered customer list
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      (c.gstin && c.gstin.toLowerCase().includes(q)) ||
      (c.panNumber && c.panNumber.toLowerCase().includes(q));
    const matchesTier = tierFilter === "all" || c.customerType === tierFilter;
    return matchesSearch && matchesTier;
  });

  // Calculate aggregates
  const totalSpendAll = customers.reduce((sum, c) => sum + c.totalPurchases, 0);
  const totalGoldAll = customers.reduce((sum, c) => sum + c.totalGoldWeightGrams, 0);
  const totalStoreCredit = customers.reduce((sum, c) => sum + Math.max(0, c.outstandingCredit), 0);

  // Invoices for currently selected customer in modal
  const customerInvoices = selectedCustomer
    ? invoices.filter(
        (inv) =>
          inv.customer.phone === selectedCustomer.phone ||
          inv.customer.name.toLowerCase() === selectedCustomer.name.toLowerCase()
      )
    : [];

  const handleCreateCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    onAddCustomer({
      name: newName,
      phone: newPhone,
      email: newEmail || undefined,
      city: newCity,
      address: newAddress || undefined,
      gstin: newGstin || undefined,
      panNumber: newPan.toUpperCase().trim() || undefined,
      aadhaarNumber: newAadhaar.trim() || undefined,
      customerType: newTier,
      notes: newNotes || undefined,
    });

    // Reset & close
    setNewName("");
    setNewPhone("+91 ");
    setNewEmail("");
    setNewAddress("");
    setNewPan("");
    setNewAadhaar("");
    setNewNotes("");
    setIsAddModalOpen(false);
  };

  const getTierBadge = (type: CustomerType) => {
    switch (type) {
      case "vip":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-[#C5A059]/15 text-[#DFC488] border border-[#C5A059]/30">
            <Crown size={11} /> VIP Client
          </span>
        );
      case "wholesale":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Building2 size={11} /> Wholesale / B2B
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.06]">
            <User size={11} /> Retail Walk-in
          </span>
        );
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header with Title and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Customer Directory & Purchase Ledger
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Counter walk-in profiles, tax invoices, purchase history, and store credits
          </p>
        </div>

        <GlassButton
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          icon={<UserPlus size={15} />}
        >
          Add Customer Profile
        </GlassButton>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Total Registered Clients
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {customers.length}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Across {new Set(customers.map((c) => c.city)).size} Cities
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Lifetime Sales Value
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {formatINR(totalSpendAll)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Recorded counter bills
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Total Gold Delivered
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {formatGrams(totalGoldAll)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Fine gold & ornaments
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Store Advance / Credits
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-emerald)] num-tabular">
            {formatINR(totalStoreCredit)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Deposit ledger balance
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06]">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by customer name, phone, city, or GSTIN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>

        {/* Tier filter tabs */}
        <div className="inline-flex p-1 rounded-lg bg-black/20 border border-white/[0.04] text-xs">
          {[
            { label: "All Clients", value: "all" },
            { label: "VIP Only", value: "vip" },
            { label: "Retail", value: "retail" },
            { label: "Wholesale / B2B", value: "wholesale" },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setTierFilter(tab.value as any)}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                tierFilter === tab.value
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Directory Table */}
      <GlassPanel className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                <th className="py-3 px-4 font-semibold">Client Identity</th>
                <th className="py-3 px-4 font-semibold">Contact & City</th>
                <th className="py-3 px-4 font-semibold">Account Tier</th>
                <th className="py-3 px-4 font-semibold text-right">Gold Purchased</th>
                <th className="py-3 px-4 font-semibold text-right">Lifetime Spend</th>
                <th className="py-3 px-4 font-semibold text-center">Bills</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[var(--text-tertiary)]">
                    No customers found matching &quot;{searchQuery}&quot;
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Identity with Initials Avatar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-xs font-bold text-[#DFC488] shrink-0">
                          {getInitials(c.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-[var(--text-primary)]">
                            {c.name}
                          </div>
                          {c.gstin && c.gstin !== "URP (Retail Consumer)" ? (
                            <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                              GST: {c.gstin}
                            </div>
                          ) : (
                            <div className="text-[10px] text-[var(--text-tertiary)]">
                              Retail Walk-in
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contact & City */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[var(--text-primary)] font-mono">
                        {c.phone}
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-1">
                        <MapPin size={11} className="text-[var(--text-tertiary)]" />
                        {c.city}
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-4">{getTierBadge(c.customerType)}</td>

                    {/* Gold weight */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono text-[#DFC488] font-semibold">
                        {c.totalGoldWeightGrams > 0 ? formatGrams(c.totalGoldWeightGrams) : "—"}
                      </div>
                      {c.totalSilverWeightGrams > 0 && (
                        <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                          +{formatGrams(c.totalSilverWeightGrams)} Silver
                        </div>
                      )}
                    </td>

                    {/* Lifetime Spend */}
                    <td className="py-3.5 px-4 text-right font-bold text-[var(--text-primary)] font-mono text-sm">
                      {formatINR(c.totalPurchases)}
                    </td>

                    {/* Bills count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded bg-white/[0.04] text-[var(--text-secondary)] font-mono font-medium">
                        {c.totalInvoicesCount}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-white/[0.04] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.08] transition-colors"
                        >
                          View Ledger
                        </button>
                        <button
                          onClick={() => onStartBillForCustomer(c)}
                          title="Generate bill for this customer"
                          className="px-2.5 py-1 text-xs font-medium rounded bg-[#C5A059]/15 text-[#DFC488] hover:bg-[#C5A059]/25 transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt size={12} />
                          Bill Now
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassPanel>

      {/* Customer Ledger & History Modal */}
      {selectedCustomer && (
        <GlassDialog
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer Ledger · ${selectedCustomer.name}`}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Top Customer Profile Details */}
            <div className="p-4 rounded-xl bg-black/30 border border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                  Contact Phone
                </span>
                <span className="font-semibold text-[var(--text-primary)] font-mono">
                  {selectedCustomer.phone}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                  Location
                </span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {selectedCustomer.city}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                  Account Tier
                </span>
                <span className="capitalize text-[#DFC488] font-semibold">
                  {selectedCustomer.customerType}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                  Store Credit
                </span>
                <span className="font-semibold text-[var(--accent-emerald)] font-mono">
                  {formatINR(selectedCustomer.outstandingCredit)}
                </span>
              </div>

              {selectedCustomer.panNumber && (
                <div className="col-span-2 sm:col-span-2 pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                    PAN (Sec 139A Compliant)
                  </span>
                  <span className="font-mono font-semibold text-[#DFC488]">
                    {selectedCustomer.panNumber}
                  </span>
                </div>
              )}

              {selectedCustomer.address && (
                <div className="col-span-2 sm:col-span-4 pt-2 border-t border-white/[0.04]">
                  <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                    Registered Billing Address
                  </span>
                  <span className="text-[var(--text-secondary)]">
                    {selectedCustomer.address}
                  </span>
                </div>
              )}

              {selectedCustomer.notes && (
                <div className="col-span-2 sm:col-span-4 pt-1">
                  <span className="text-[10px] uppercase text-[var(--text-tertiary)] block">
                    Customer Preferences & Notes
                  </span>
                  <span className="text-[var(--text-secondary)] italic">
                    &quot;{selectedCustomer.notes}&quot;
                  </span>
                </div>
              )}
            </div>

            {/* Invoices List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
                  <History size={14} className="text-[#C5A059]" />
                  Past Finalized Invoices ({customerInvoices.length})
                </h4>
                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareCustomerStatement(selectedCustomer)}
                    icon={<MessageCircle size={13} className="text-[#25D366]" />}
                    className="text-[#25D366] hover:bg-[#25D366]/10"
                  >
                    Share Statement
                  </GlassButton>
                  <GlassButton
                    variant="gold-outline"
                    size="sm"
                    onClick={() => {
                      const c = selectedCustomer;
                      setSelectedCustomer(null);
                      onStartBillForCustomer(c);
                    }}
                    icon={<Receipt size={13} />}
                  >
                    Create New Bill
                  </GlassButton>
                </div>
              </div>

              {customerInvoices.length === 0 ? (
                <div className="p-6 rounded-xl bg-white/[0.01] border border-white/[0.04] text-center text-xs text-[var(--text-tertiary)]">
                  No previous bills found in system memory for this client.
                </div>
              ) : (
                <div className="space-y-2">
                  {customerInvoices.map((inv) => {
                    const dateStr = inv.invoiceDate
                      ? new Date(inv.invoiceDate).toLocaleDateString("en-IN")
                      : "28/09/2026";
                    const payMethod = inv.payments?.[0]?.method || "UPI";

                    return (
                      <div
                        key={inv.id}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.1] transition-all flex items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-[var(--text-primary)]">
                              {inv.invoiceNumber}
                            </span>
                            <span className="text-[10px] text-[var(--text-tertiary)]">
                              {dateStr}
                            </span>
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                            {inv.items.length} items (
                            {inv.items.map((i) => i.name).slice(0, 2).join(", ")}
                            {inv.items.length > 2 ? "..." : ""})
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold font-mono text-[var(--text-primary)]">
                              {formatINR(inv.grandTotal)}
                            </div>
                            <div className="text-[10px] text-[var(--accent-emerald)] font-medium">
                              {payMethod}
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedCustomer(null);
                              onViewInvoice(inv);
                            }}
                            className="p-1.5 rounded-lg bg-white/[0.04] text-[var(--text-secondary)] hover:text-[#DFC488] hover:bg-white/[0.08] transition-colors"
                            title="View / Print Tax Invoice"
                          >
                            <FileText size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </GlassDialog>
      )}

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <GlassDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Register New Customer Profile"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateCustomerSubmit} className="space-y-4 text-xs">
            <GlassInput
              label="Customer Full Name *"
              placeholder="e.g. Rameshwar Sharma"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="Mobile Phone *"
                placeholder="+91 98290 12345"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
              <GlassInput
                label="Email (Optional)"
                placeholder="customer@domain.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="City / District"
                placeholder="Jaipur"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[var(--text-secondary)] block">
                  Customer Tier
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as CustomerType)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="retail">Retail Consumer</option>
                  <option value="vip">VIP Client</option>
                  <option value="wholesale">Wholesale / B2B</option>
                </select>
              </div>
            </div>

            <GlassInput
              label="GSTIN / Tax ID"
              placeholder="URP (Retail Consumer) or 08AAAAJ1234F1Z8"
              value={newGstin}
              onChange={(e) => setNewGstin(e.target.value)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <GlassInput
                label="PAN Number (Sec 139A Compliance)"
                placeholder="ABCDE1234F"
                value={newPan}
                onChange={(e) => setNewPan(e.target.value.toUpperCase())}
              />
              <GlassInput
                label="Aadhaar Number (Optional UID)"
                placeholder="12-digit UID"
                value={newAadhaar}
                onChange={(e) => setNewAadhaar(e.target.value)}
              />
            </div>

            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
              <ShieldCheck size={14} className="shrink-0" />
              <span>
                Income Tax Sec 139A: Transactions exceeding ₹2,00,000 require statutory customer PAN capture.
              </span>
            </div>

            <GlassInput
              label="Complete Billing Address"
              placeholder="House/Plot No, Street, Landmark, Area"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />

            <GlassInput
              label="Customer Notes & Design Preferences"
              placeholder="e.g. Likes 22K bangles, family wedding in Dec"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
              <GlassButton
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="sm" type="submit">
                Save Customer Profile
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}
    </div>
  );
};
