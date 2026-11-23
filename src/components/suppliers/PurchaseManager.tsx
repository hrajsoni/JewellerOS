"use client";

import React, { useState } from "react";
import {
  SupplierProfile,
  PurchaseInvoice,
  PurchaseItemInput,
  SupplierPaymentRecord,
  NewSupplierInput,
} from "../../modules/suppliers/types";
import { JewelleryCategory, StockItem } from "../../modules/inventory/types";
import { GoldPurityKey, SilverPurityKey, MakingChargeType } from "../../modules/pricing/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Truck,
  Plus,
  Search,
  Receipt,
  UserPlus,
  Coins,
  CreditCard,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Trash2,
  MessageCircle,
  Eye,
  ArrowRight,
  ShieldCheck,
  Scale,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";

export interface PurchaseManagerProps {
  suppliers: SupplierProfile[];
  purchases: PurchaseInvoice[];
  payments: SupplierPaymentRecord[];
  onRecordPurchase: (
    invoice: Omit<PurchaseInvoice, "id" | "createdAt">
  ) => void;
  onAddSupplier: (input: NewSupplierInput) => void;
  onPaySupplier: (
    payment: Omit<SupplierPaymentRecord, "id" | "date">
  ) => void;
  gold24kRate: number;
}

export const PurchaseManager: React.FC<PurchaseManagerProps> = ({
  suppliers,
  purchases,
  payments,
  onRecordPurchase,
  onAddSupplier,
  onPaySupplier,
  gold24kRate,
}) => {
  const { hasPermission } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"suppliers" | "invoices" | "payments">("suppliers");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals State
  const [isNewPurchaseModalOpen, setIsNewPurchaseModalOpen] = useState(false);
  const [isAddSupplierModalOpen, setIsAddSupplierModalOpen] = useState(false);
  const [isPaySupplierModalOpen, setIsPaySupplierModalOpen] = useState(false);
  const [selectedSupplierForPay, setSelectedSupplierForPay] = useState<SupplierProfile | null>(null);
  const [selectedSupplierStatement, setSelectedSupplierStatement] = useState<SupplierProfile | null>(null);

  // New Supplier Form State
  const [supName, setSupName] = useState("");
  const [supContact, setSupContact] = useState("");
  const [supPhone, setSupPhone] = useState("+91 ");
  const [supCity, setSupCity] = useState("Mumbai");
  const [supGstin, setSupGstin] = useState("");
  const [supPan, setSupPan] = useState("");
  const [supMetal, setSupMetal] = useState<"gold" | "silver" | "both">("gold");
  const [supOpeningBalance, setSupOpeningBalance] = useState("0");

  // New Purchase Invoice Form State
  const [purSupplierId, setPurSupplierId] = useState("");
  const [purInvoiceNumber, setPurInvoiceNumber] = useState(
    () => `PUR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [purDate, setPurDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [purApplyGst, setPurApplyGst] = useState(true);
  const [purPaymentMode, setPurPaymentMode] = useState<
    "Cash" | "Bank Transfer" | "UPI" | "Cheque" | "Credit"
  >("Credit");
  const [purAmountPaid, setPurAmountPaid] = useState("0");
  const [purPaymentRef, setPurPaymentRef] = useState("");

  // Purchase Items State
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemInput[]>([
    {
      description: "22K Solid Rajputana Bangles",
      category: "Bangles & Kadas",
      metal: "gold",
      purity: "22K",
      purityDisplay: "22K (916)",
      grossWeight: 25.0,
      stoneWeight: 0,
      netWeight: 25.0,
      fineWeight: 22.917,
      metalRate: gold24kRate,
      metalValue: 343750,
      makingType: "percentage",
      makingRate: 10,
      makingCharges: 34375,
      stoneValue: 0,
      subtotal: 378125,
      trayLocation: "Vault Safe #A",
    },
  ]);

  // Payment Modal State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"Cash" | "Bank Transfer" | "UPI" | "Cheque">("Bank Transfer");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.contactPerson.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      (s.gstin && s.gstin.toLowerCase().includes(q))
    );
  });

  // Aggregates
  const totalOutstandingLiability = suppliers.reduce((sum, s) => sum + s.outstandingBalanceINR, 0);
  const totalFineGoldDue = suppliers.reduce((sum, s) => sum + s.fineGoldBalanceGrams, 0);
  const totalSpendPurchases = purchases.reduce((sum, p) => sum + p.grandTotal, 0);

  // Purchase form item management
  const handleItemWeightChange = (index: number, grossStr: string, stoneStr: string) => {
    const gross = parseFloat(grossStr) || 0;
    const stone = parseFloat(stoneStr) || 0;
    const net = Math.max(0, gross - stone);

    setPurchaseItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const purityPct = item.purity === "22K" ? 0.9167 : item.purity === "18K" ? 0.75 : 0.585;
        const fine = net * purityPct;
        const ratePerGram = (item.metalRate / 10);
        const metalVal = Math.round(fine * (item.metalRate / 10));
        const making =
          item.makingType === "percentage"
            ? Math.round((metalVal * item.makingRate) / 100)
            : Math.round(net * item.makingRate);
        const subtotal = metalVal + making + item.stoneValue;

        return {
          ...item,
          grossWeight: gross,
          stoneWeight: stone,
          netWeight: net,
          fineWeight: fine,
          metalValue: metalVal,
          makingCharges: making,
          subtotal,
        };
      })
    );
  };

  const handleAddNewPurchaseItem = () => {
    setPurchaseItems((prev) => [
      ...prev,
      {
        description: `Gold Ornament #${prev.length + 1}`,
        category: "Chains",
        metal: "gold",
        purity: "22K",
        purityDisplay: "22K (916)",
        grossWeight: 10.0,
        stoneWeight: 0,
        netWeight: 10.0,
        fineWeight: 9.167,
        metalRate: gold24kRate,
        metalValue: Math.round(9.167 * (gold24kRate / 10)),
        makingType: "percentage",
        makingRate: 10,
        makingCharges: Math.round(9.167 * (gold24kRate / 10) * 0.1),
        stoneValue: 0,
        subtotal: Math.round(9.167 * (gold24kRate / 10) * 1.1),
        trayLocation: "Vault Safe #A",
      },
    ]);
  };

  const handleRemovePurchaseItem = (index: number) => {
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Compute purchase invoice totals
  const purchaseSubtotal = purchaseItems.reduce((sum, i) => sum + i.subtotal, 0);
  const purchaseTotalMaking = purchaseItems.reduce((sum, i) => sum + i.makingCharges, 0);
  const purchaseGst = purApplyGst ? Math.round(purchaseSubtotal * 0.03) : 0;
  const purchaseGrandTotal = purchaseSubtotal + purchaseGst;
  const purchasePaid = parseFloat(purAmountPaid) || 0;
  const purchaseBalanceDue = Math.max(0, purchaseGrandTotal - purchasePaid);

  const handleSubmitPurchaseInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplierId) {
      alert("Please select a registered supplier.");
      return;
    }
    const sup = suppliers.find((s) => s.id === purSupplierId);
    if (!sup) return;

    onRecordPurchase({
      invoiceNumber: purInvoiceNumber.trim(),
      supplierId: sup.id,
      supplierName: sup.name,
      invoiceDate: purDate,
      items: purchaseItems,
      itemsSubtotal: purchaseSubtotal,
      totalMaking: purchaseTotalMaking,
      totalGst: purchaseGst,
      grandTotal: purchaseGrandTotal,
      amountPaid: purchasePaid,
      balanceDue: purchaseBalanceDue,
      paymentMethod: purPaymentMode,
      paymentRef: purPaymentRef || undefined,
      status: purchaseBalanceDue === 0 ? "paid" : purchasePaid > 0 ? "partial" : "pending",
    });

    setIsNewPurchaseModalOpen(false);
    setPurchaseItems([]);
  };

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    onAddSupplier({
      name: supName.trim(),
      contactPerson: supContact.trim(),
      phone: supPhone.trim(),
      city: supCity.trim(),
      gstin: supGstin.trim() || undefined,
      panNumber: supPan.trim() || undefined,
      metalSupplied: supMetal,
      openingBalanceINR: parseFloat(supOpeningBalance) || 0,
    });

    setIsAddSupplierModalOpen(false);
    setSupName("");
    setSupContact("");
    setSupPhone("+91 ");
  };

  const handleExecutePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierForPay) return;
    const amt = parseFloat(payAmount) || 0;
    if (amt <= 0) return;

    onPaySupplier({
      supplierId: selectedSupplierForPay.id,
      supplierName: selectedSupplierForPay.name,
      amount: amt,
      method: payMethod,
      referenceNo: payRef.trim() || undefined,
      notes: payNotes.trim() || undefined,
    });

    setIsPaySupplierModalOpen(false);
    setSelectedSupplierForPay(null);
    setPayAmount("");
    setPayRef("");
    setPayNotes("");
  };

  const handleShareStatement = (sup: SupplierProfile) => {
    const cleanPhone = sup.phone.replace(/[^0-9]/g, "");
    const msg =
      `*SUPPLIER STATEMENT · SANDHYA JEWELLERS*\n` +
      `Supplier: *${sup.name}* (${sup.contactPerson})\n` +
      `City: ${sup.city} · GSTIN: ${sup.gstin || "N/A"}\n` +
      `--------------------------------\n` +
      `Total Purchased: ${formatINR(sup.totalPurchasedINR)} (${formatGrams(sup.totalPurchasedGrams)})\n` +
      `Bullion Balance: ${formatGrams(sup.fineGoldBalanceGrams)} 24K Fine\n` +
      `*Current Outstanding Payable: ${formatINR(sup.outstandingBalanceINR)}*\n` +
      `--------------------------------\n` +
      `_Official Account Ledger Snapshot_`;

    const target = cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone || "";
    const url = target
      ? `https://wa.me/${target}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-4 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Purchases & Supplier Management (खरीद एवं सप्लायर खाता)
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Purchase bills, bullion ledger liabilities, and automated inventory stock inwarding
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={() => setIsAddSupplierModalOpen(true)}
            icon={<UserPlus size={14} />}
          >
            New Supplier
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => {
              if (suppliers.length > 0) setPurSupplierId(suppliers[0].id);
              setIsNewPurchaseModalOpen(true);
            }}
            icon={<Plus size={14} />}
          >
            Record Purchase Bill
          </GlassButton>
        </div>
      </div>

      {/* Financial Overview KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
            Total Supplier Liabilities (कुल देनदारी)
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--accent-coral)]">
            {formatINR(totalOutstandingLiability)}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] block">
            Across {suppliers.length} wholesale bullion suppliers
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
            Pure Gold Bullion Balance (कच्चा टंच)
          </span>
          <div className="text-2xl font-bold font-mono text-[#DFC488]">
            {formatGrams(totalFineGoldDue)}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] block">
            24ct fine bullion weight owed to refiners
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
            Total Purchase Invoices Logged
          </span>
          <div className="text-2xl font-bold font-mono text-[var(--text-primary)]">
            {purchases.length} Bills
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] block">
            {formatINR(totalSpendPurchases)} total inward
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)]">
            Active Supplier Network
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {suppliers.length} Houses
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] block">
            Mumbai, Jaipur, Surat & Agra Bullion markets
          </span>
        </div>
      </div>

      {/* Main Sub-Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-white/[0.05] pb-2">
        <div className="inline-flex p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
          <button
            onClick={() => setActiveSubTab("suppliers")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === "suppliers"
                ? "bg-[#C5A059] text-[#08090C] font-semibold shadow-sm"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Suppliers Directory ({suppliers.length})
          </button>
          <button
            onClick={() => setActiveSubTab("invoices")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === "invoices"
                ? "bg-[#C5A059] text-[#08090C] font-semibold shadow-sm"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Purchase Invoices ({purchases.length})
          </button>
          <button
            onClick={() => setActiveSubTab("payments")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              activeSubTab === "payments"
                ? "bg-[#C5A059] text-[#08090C] font-semibold shadow-sm"
                : "text-[var(--text-secondary)] hover:text-white"
            }`}
          >
            Payment Vouchers ({payments.length})
          </button>
        </div>

        {activeSubTab === "suppliers" && (
          <div className="w-64">
            <GlassInput
              placeholder="Search supplier, city, GSTIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              prefixSymbol={<Search size={14} className="text-[var(--text-tertiary)]" />}
            />
          </div>
        )}
      </div>

      {/* TAB 1: SUPPLIERS DIRECTORY */}
      {activeSubTab === "suppliers" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuppliers.map((sup) => (
            <div
              key={sup.id}
              className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-4 shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-base text-[var(--text-primary)]">
                    {sup.name}
                  </h3>
                  <div className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5 mt-0.5">
                    <span>{sup.contactPerson}</span>
                    <span>·</span>
                    <span>{sup.city}</span>
                    {sup.gstin && (
                      <>
                        <span>·</span>
                        <span className="font-mono">{sup.gstin}</span>
                      </>
                    )}
                  </div>
                </div>

                <GlassBadge variant={sup.outstandingBalanceINR > 0 ? "coral" : "emerald"}>
                  {sup.metalSupplied.toUpperCase()} SUPPLIER
                </GlassBadge>
              </div>

              {/* Financial & Bullion Stats */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-black/30 border border-white/[0.04] text-xs">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Outstanding Payable (बकाया राशि)
                  </span>
                  <span
                    className={`font-mono text-base font-bold ${
                      sup.outstandingBalanceINR > 0 ? "text-[var(--accent-coral)]" : "text-emerald-400"
                    }`}
                  >
                    {formatINR(sup.outstandingBalanceINR)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Fine Bullion Owed (शुद्ध सोना)
                  </span>
                  <span className="font-mono text-base font-bold text-[#DFC488]">
                    {formatGrams(sup.fineGoldBalanceGrams)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[11px] text-[var(--text-tertiary)]">
                  Total Purchases: {formatINR(sup.totalPurchasedINR)}
                </span>

                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShareStatement(sup)}
                    icon={<MessageCircle size={13} className="text-[#25D366]" />}
                    className="text-[#25D366] hover:bg-[#25D366]/10"
                  >
                    WhatsApp
                  </GlassButton>

                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedSupplierForPay(sup);
                      setPayAmount(sup.outstandingBalanceINR.toString());
                      setIsPaySupplierModalOpen(true);
                    }}
                    icon={<CreditCard size={13} />}
                  >
                    Make Payment
                  </GlassButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: PURCHASE INVOICES REGISTRY */}
      {activeSubTab === "invoices" && (
        <div className="rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] overflow-hidden">
          {purchases.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-tertiary)]">
              No purchase invoices recorded yet. Click &quot;Record Purchase Bill&quot; to inward new ornaments into the vault.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] bg-black/20">
                    <th className="p-3">Bill # & Date</th>
                    <th className="p-3">Supplier</th>
                    <th className="p-3 text-right">Items & Weight</th>
                    <th className="p-3 text-right">Subtotal</th>
                    <th className="p-3 text-right">GST (3%)</th>
                    <th className="p-3 text-right">Grand Total</th>
                    <th className="p-3 text-right">Paid / Balance</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {purchases.map((pur) => {
                    const grossTotal = pur.items.reduce((sum, i) => sum + i.grossWeight, 0);
                    return (
                      <tr key={pur.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono">
                          <div className="font-semibold text-[var(--text-primary)]">
                            {pur.invoiceNumber}
                          </div>
                          <div className="text-[10px] text-[var(--text-tertiary)]">
                            {pur.invoiceDate}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-[var(--text-primary)]">
                            {pur.supplierName}
                          </div>
                          <div className="text-[10px] text-[var(--text-tertiary)]">
                            {pur.items.map((i) => i.category).join(", ")}
                          </div>
                        </td>
                        <td className="p-3 text-right font-mono">
                          <div>{pur.items.length} ornaments</div>
                          <div className="text-[10px] text-[#DFC488]">{formatGrams(grossTotal)}</div>
                        </td>
                        <td className="p-3 text-right font-mono">{formatINR(pur.itemsSubtotal)}</td>
                        <td className="p-3 text-right font-mono">+{formatINR(pur.totalGst)}</td>
                        <td className="p-3 text-right font-mono font-bold text-[var(--text-primary)]">
                          {formatINR(pur.grandTotal)}
                        </td>
                        <td className="p-3 text-right font-mono">
                          <div className="text-emerald-400">Paid: {formatINR(pur.amountPaid)}</div>
                          {pur.balanceDue > 0 && (
                            <div className="text-[var(--accent-coral)]">
                              Due: {formatINR(pur.balanceDue)}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <GlassBadge
                            variant={
                              pur.status === "paid"
                                ? "emerald"
                                : pur.status === "partial"
                                ? "gold"
                                : "coral"
                            }
                          >
                            {pur.status.toUpperCase()}
                          </GlassBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENT VOUCHERS */}
      {activeSubTab === "payments" && (
        <div className="rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] overflow-hidden">
          {payments.length === 0 ? (
            <div className="p-12 text-center text-xs text-[var(--text-tertiary)]">
              No supplier payments recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase font-bold tracking-wider text-[var(--text-tertiary)] bg-black/20">
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Supplier Name</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3">Reference / UTR</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono">{p.date}</td>
                      <td className="p-3 font-semibold text-[var(--text-primary)]">{p.supplierName}</td>
                      <td className="p-3">{p.method}</td>
                      <td className="p-3 font-mono text-[11px] text-[var(--text-tertiary)]">
                        {p.referenceNo || "—"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                        {formatINR(p.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: RECORD PURCHASE INVOICE */}
      <GlassDialog
        isOpen={isNewPurchaseModalOpen}
        onClose={() => setIsNewPurchaseModalOpen(false)}
        title="Record Wholesale Purchase Invoice (माल खरीद वाउचर)"
        description="Dual entry: Inward physical ornaments into inventory while booking supplier liabilities"
        maxWidth="xl"
      >
        <form onSubmit={handleSubmitPurchaseInvoice} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-white/[0.06]">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Supplier Profile
              </label>
              <select
                value={purSupplierId}
                onChange={(e) => setPurSupplierId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                required
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-[#121418]">
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
            </div>

            <GlassInput
              label="Supplier Bill # / Memo"
              value={purInvoiceNumber}
              onChange={(e) => setPurInvoiceNumber(e.target.value)}
              required
            />

            <GlassInput
              label="Invoice Date"
              type="date"
              value={purDate}
              onChange={(e) => setPurDate(e.target.value)}
              required
            />
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#DFC488]">
                Inward Ornaments ({purchaseItems.length})
              </span>
              <button
                type="button"
                onClick={handleAddNewPurchaseItem}
                className="text-xs text-[#DFC488] hover:underline flex items-center gap-1"
              >
                <Plus size={13} /> Add Another Ornament
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {purchaseItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-black/30 border border-white/[0.06] grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end text-xs"
                >
                  <div className="sm:col-span-4">
                    <label className="text-[10px] text-[var(--text-tertiary)] block">Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPurchaseItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, description: val } : it))
                        );
                      }}
                      className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)]"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-[var(--text-tertiary)] block">Purity</label>
                    <select
                      value={item.purity}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setPurchaseItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, purity: val, purityDisplay: `${val} Touch` } : it))
                        );
                      }}
                      className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)]"
                    >
                      <option value="22K">22K (916)</option>
                      <option value="18K">18K (750)</option>
                      <option value="14K">14K (585)</option>
                      <option value="24K">24K Bullion</option>
                      <option value="925">925 Silver</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-[var(--text-tertiary)] block">Gross Wt (g)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={item.grossWeight || ""}
                      onChange={(e) => handleItemWeightChange(idx, e.target.value, item.stoneWeight.toString())}
                      className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-[var(--text-tertiary)] block">Tray Destination</label>
                    <select
                      value={item.trayLocation}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPurchaseItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, trayLocation: val } : it))
                        );
                      }}
                      className="w-full px-2 py-1.5 rounded bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)]"
                    >
                      <option value="Vault Safe #A">Vault Safe #A</option>
                      <option value="Vault Safe #B">Vault Safe #B</option>
                      <option value="Tray #1 · Diamond Rings">Tray #1 · Diamond Rings</option>
                      <option value="Tray #2 · Chains Display">Tray #2 · Chains Display</option>
                      <option value="Tray #3 · Bangles Display">Tray #3 · Bangles Display</option>
                    </select>
                  </div>

                  <div className="sm:col-span-1 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemovePurchaseItem(idx)}
                      disabled={purchaseItems.length === 1}
                      className="p-1.5 text-zinc-500 hover:text-red-400 disabled:opacity-30"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals & Settlement */}
          <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] space-y-2 text-xs">
            <div className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>Items Total:</span>
              <span className="font-mono text-[var(--text-primary)]">{formatINR(purchaseSubtotal)}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-t border-white/[0.04]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="purApplyGst"
                  checked={purApplyGst}
                  onChange={(e) => setPurApplyGst(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#C5A059]"
                />
                <label htmlFor="purApplyGst" className="cursor-pointer text-[var(--text-secondary)]">
                  Add 3% GST Input Tax Credit (ITC)
                </label>
              </div>
              <span className="font-mono">{purApplyGst ? `+${formatINR(purchaseGst)}` : "₹0"}</span>
            </div>

            <div className="flex justify-between items-center text-sm font-bold border-t border-white/[0.06] pt-1">
              <span>Grand Purchase Total:</span>
              <span className="font-mono text-[#DFC488] text-base">{formatINR(purchaseGrandTotal)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
              <GlassInput
                label="Amount Paid at Inward (₹)"
                type="number"
                prefixSymbol="₹"
                value={purAmountPaid}
                onChange={(e) => setPurAmountPaid(e.target.value)}
              />
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                  Payment Mode
                </label>
                <select
                  value={purPaymentMode}
                  onChange={(e) => setPurPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)]"
                >
                  <option value="Credit">Credit / Udhar (Pay Later)</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                  <option value="Cash">Cash at Counter</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>
            </div>

            {purchaseBalanceDue > 0 && (
              <div className="text-[11px] text-[var(--accent-coral)] text-right font-medium">
                ⚠️ Balance ₹{formatINR(purchaseBalanceDue)} will be added to supplier liability ledger.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GlassButton variant="ghost" size="sm" onClick={() => setIsNewPurchaseModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="sm" type="submit">
              Inward Stock & Post Purchase
            </GlassButton>
          </div>
        </form>
      </GlassDialog>

      {/* MODAL 2: REGISTER NEW SUPPLIER */}
      <GlassDialog
        isOpen={isAddSupplierModalOpen}
        onClose={() => setIsAddSupplierModalOpen(false)}
        title="Register Bullion / Jewellery Supplier"
        description="Add a new wholesale partner or manufacturer to your trade network"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-3">
          <GlassInput
            label="Supplier / Business Name"
            placeholder="e.g. Zaveri Bullion Mumbai"
            value={supName}
            onChange={(e) => setSupName(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <GlassInput
              label="Contact Person"
              placeholder="e.g. Dhirubhai Shah"
              value={supContact}
              onChange={(e) => setSupContact(e.target.value)}
              required
            />
            <GlassInput
              label="Phone Number"
              placeholder="+91 ..."
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <GlassInput
              label="City / Market"
              placeholder="e.g. Mumbai, Jaipur"
              value={supCity}
              onChange={(e) => setSupCity(e.target.value)}
              required
            />
            <GlassInput
              label="GSTIN (Optional)"
              placeholder="27AAAC..."
              value={supGstin}
              onChange={(e) => setSupGstin(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Metal Supplied
              </label>
              <select
                value={supMetal}
                onChange={(e) => setSupMetal(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)]"
              >
                <option value="gold">Gold & Bullion</option>
                <option value="silver">Silver & Utensils</option>
                <option value="both">Both Gold & Silver</option>
              </select>
            </div>
            <GlassInput
              label="Opening Due Balance (₹)"
              type="number"
              prefixSymbol="₹"
              value={supOpeningBalance}
              onChange={(e) => setSupOpeningBalance(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton variant="ghost" size="sm" onClick={() => setIsAddSupplierModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="sm" type="submit">
              Register Supplier
            </GlassButton>
          </div>
        </form>
      </GlassDialog>

      {/* MODAL 3: PAY SUPPLIER */}
      <GlassDialog
        isOpen={isPaySupplierModalOpen}
        onClose={() => setIsPaySupplierModalOpen(false)}
        title={`Make Payment to ${selectedSupplierForPay?.name || "Supplier"}`}
        description={`Current Outstanding Balance: ${formatINR(selectedSupplierForPay?.outstandingBalanceINR || 0)}`}
        maxWidth="md"
      >
        <form onSubmit={handleExecutePayment} className="space-y-3">
          <GlassInput
            label="Payment Amount (₹)"
            type="number"
            prefixSymbol="₹"
            value={payAmount}
            onChange={(e) => setPayAmount(e.target.value)}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Payment Channel
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-[var(--text-primary)]"
              >
                <option value="Bank Transfer">Bank Transfer / NEFT / RTGS</option>
                <option value="Cash">Cash Voucher</option>
                <option value="UPI">UPI / QR</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>
            <GlassInput
              label="UTR / Cheque No"
              placeholder="e.g. UTR-98218902"
              value={payRef}
              onChange={(e) => setPayRef(e.target.value)}
            />
          </div>
          <GlassInput
            label="Internal Notes"
            placeholder="e.g. Cleared 18K hollow chain invoice"
            value={payNotes}
            onChange={(e) => setPayNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <GlassButton variant="ghost" size="sm" onClick={() => setIsPaySupplierModalOpen(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="sm" type="submit">
              Record Payment
            </GlassButton>
          </div>
        </form>
      </GlassDialog>
    </div>
  );
};
