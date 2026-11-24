"use client";

import React, { useState, useEffect } from "react";
import {
  Karigar,
  KarigarTransaction,
  IssueMetalInput,
  ReceiveOrnamentInput,
  PayLabourInput,
  JobCard,
  CreateJobCardInput,
  JobCardStatus,
  generateKarigarWhatsAppText,
} from "../../modules/karigar/types";
import {
  getSavedJobCards,
  createJobCard as storeCreateJobCard,
  updateJobCardStatus as storeUpdateJobCardStatus,
} from "../../modules/karigar/store";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Hammer,
  Plus,
  Search,
  Scale,
  Receipt,
  Phone,
  MapPin,
  CheckCircle2,
  Calendar,
  MessageCircle,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  Send,
} from "lucide-react";

export interface KarigarManagerProps {
  karigars: Karigar[];
  transactions: KarigarTransaction[];
  jobCards?: JobCard[];
  onAddKarigar: (input: {
    name: string;
    phone: string;
    workshopCity: string;
    specialty: string;
    notes?: string;
  }) => void;
  onIssueMetal: (input: IssueMetalInput) => void;
  onReceiveOrnament: (input: ReceiveOrnamentInput) => void;
  onPayLabour: (input: PayLabourInput) => void;
  onCreateJobCard?: (input: CreateJobCardInput) => void;
  onUpdateJobCardStatus?: (jobCardId: string, status: JobCardStatus, huid?: string) => void;
  shopName: string;
  tenantId?: string;
}

export const KarigarManager: React.FC<KarigarManagerProps> = ({
  karigars,
  transactions,
  jobCards: initialJobCards,
  onAddKarigar,
  onIssueMetal,
  onReceiveOrnament,
  onPayLabour,
  onCreateJobCard,
  onUpdateJobCardStatus,
  shopName,
  tenantId,
}) => {
  const [activeTab, setActiveTab] = useState<"directory" | "jobcards" | "transactions">("directory");
  const [searchQuery, setSearchQuery] = useState("");

  // Job Cards internal state (synchronized with prop or local store)
  const [jobCards, setJobCards] = useState<JobCard[]>(() => {
    return initialJobCards || getSavedJobCards(tenantId);
  });

  useEffect(() => {
    if (initialJobCards) {
      setJobCards(initialJobCards);
    } else {
      setJobCards(getSavedJobCards(tenantId));
    }
  }, [initialJobCards, tenantId]);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isPayLabourModalOpen, setIsPayLabourModalOpen] = useState(false);
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [selectedKarigar, setSelectedKarigar] = useState<Karigar | null>(null);

  // Add Karigar State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("+91 ");
  const [newCity, setNewCity] = useState("Jaipur");
  const [newSpecialty, setNewSpecialty] = useState("Plain Gold Bangles & Chains");
  const [newNotes, setNewNotes] = useState("");

  // Issue Metal State
  const [issueMetalType, setIssueMetalType] = useState<"gold" | "silver">("gold");
  const [issueGrossWeight, setIssueGrossWeight] = useState("50.0");
  const [issuePurity, setIssuePurity] = useState("24K Fine Bar (99.9%)");
  const [issueFineWeight, setIssueFineWeight] = useState("50.0");
  const [issueOrderName, setIssueOrderName] = useState("22K Bangle Set Order");
  const [issueJobCardId, setIssueJobCardId] = useState("");
  const [issueNotes, setIssueNotes] = useState("");

  // Receive Goods State
  const [rcvMetalType, setRcvMetalType] = useState<"gold" | "silver">("gold");
  const [rcvOrnamentName, setRcvOrnamentName] = useState("22K Finished Bangles");
  const [rcvGrossWeight, setRcvGrossWeight] = useState("48.5");
  const [rcvNetWeight, setRcvNetWeight] = useState("48.5");
  const [rcvPurity, setRcvPurity] = useState("22K (91.6%)");
  const [rcvFineDeduction, setRcvFineDeduction] = useState("44.45"); // net * 0.9167
  const [rcvLabourCharges, setRcvLabourCharges] = useState("8500");
  const [rcvJobCardId, setRcvJobCardId] = useState("");
  const [rcvHuid, setRcvHuid] = useState("");
  const [rcvNotes, setRcvNotes] = useState("");

  // Pay Labour State
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI" | "Bank">("Cash");
  const [payNotes, setPayNotes] = useState("");

  // New Job Card State
  const [jcKarigarId, setJcKarigarId] = useState(karigars[0]?.id || "");
  const [jcCustomerName, setJcCustomerName] = useState("");
  const [jcCustomerPhone, setJcCustomerPhone] = useState("");
  const [jcCategory, setJcCategory] = useState("Bangles");
  const [jcTitle, setJcTitle] = useState("");
  const [jcDescription, setJcDescription] = useState("");
  const [jcMetal, setJcMetal] = useState<"gold" | "silver">("gold");
  const [jcTargetGross, setJcTargetGross] = useState("45.0");
  const [jcTargetNet, setJcTargetNet] = useState("44.0");
  const [jcPurity, setJcPurity] = useState("22K (916)");
  const [jcIssuedFine, setJcIssuedFine] = useState("45.0");
  const [jcDeliveryDate, setJcDeliveryDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0]
  );
  const [jcLabourRate, setJcLabourRate] = useState("450");
  const [jcLabourType, setJcLabourType] = useState<"per_gram" | "fixed">("per_gram");
  const [jcAllowedWastage, setJcAllowedWastage] = useState("1.2");
  const [jcNotes, setJcNotes] = useState("");

  // Aggregates
  const totalGoldWithKarigars = karigars.reduce((sum, k) => sum + k.pureGoldBalanceGrams, 0);
  const totalSilverWithKarigars = karigars.reduce((sum, k) => sum + k.pureSilverBalanceGrams, 0);
  const totalLabourDue = karigars.reduce((sum, k) => sum + k.labourBalanceDue, 0);

  // Filtered lists
  const filteredKarigars = karigars.filter((k) => {
    const q = searchQuery.toLowerCase();
    return (
      k.name.toLowerCase().includes(q) ||
      k.phone.includes(q) ||
      k.specialty.toLowerCase().includes(q) ||
      k.workshopCity.toLowerCase().includes(q)
    );
  });

  const filteredJobCards = jobCards.filter((jc) => {
    const q = searchQuery.toLowerCase();
    return (
      jc.title.toLowerCase().includes(q) ||
      jc.jobCardNumber.toLowerCase().includes(q) ||
      jc.karigarName.toLowerCase().includes(q) ||
      (jc.customerName && jc.customerName.toLowerCase().includes(q)) ||
      jc.category.toLowerCase().includes(q)
    );
  });

  // Action handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddKarigar({
      name: newName,
      phone: newPhone,
      workshopCity: newCity,
      specialty: newSpecialty,
      notes: newNotes,
    });
    setIsAddModalOpen(false);
    setNewName("");
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKarigar) return;
    onIssueMetal({
      karigarId: selectedKarigar.id,
      metal: issueMetalType,
      grossWeight: parseFloat(issueGrossWeight) || 0,
      purity: issuePurity,
      fineWeight: parseFloat(issueFineWeight) || 0,
      ornamentOrderName: issueOrderName,
      jobCardId: issueJobCardId || undefined,
      notes: issueNotes,
    });
    setIsIssueModalOpen(false);
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKarigar) return;
    onReceiveOrnament({
      karigarId: selectedKarigar.id,
      metal: rcvMetalType,
      ornamentName: rcvOrnamentName,
      grossWeight: parseFloat(rcvGrossWeight) || 0,
      netWeight: parseFloat(rcvNetWeight) || 0,
      purity: rcvPurity,
      fineWeightDeducted: parseFloat(rcvFineDeduction) || 0,
      labourCharges: parseFloat(rcvLabourCharges) || 0,
      jobCardId: rcvJobCardId || undefined,
      huid: rcvHuid.trim() || undefined,
      notes: rcvNotes,
    });
    if (rcvJobCardId) {
      handleStatusChange(rcvJobCardId, "completed", rcvHuid.trim());
    }
    setIsReceiveModalOpen(false);
  };

  const handlePayLabourSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKarigar || !payAmount) return;
    onPayLabour({
      karigarId: selectedKarigar.id,
      amount: parseFloat(payAmount) || 0,
      paymentMethod: payMethod,
      notes: payNotes,
    });
    setIsPayLabourModalOpen(false);
    setPayAmount("");
  };

  const handleCreateJobCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const assigned = karigars.find((k) => k.id === jcKarigarId);
    const karigarName = assigned ? assigned.name : "Assigned Karigar";

    const input: CreateJobCardInput = {
      karigarId: jcKarigarId,
      karigarName,
      customerName: jcCustomerName.trim() || undefined,
      customerPhone: jcCustomerPhone.trim() || undefined,
      category: jcCategory,
      title: jcTitle.trim(),
      description: jcDescription.trim(),
      metal: jcMetal,
      targetGrossWeight: parseFloat(jcTargetGross) || 0,
      targetNetWeight: parseFloat(jcTargetNet) || 0,
      purity: jcPurity,
      issuedFineWeightGrams: parseFloat(jcIssuedFine) || 0,
      expectedDeliveryDate: jcDeliveryDate,
      labourRate: parseFloat(jcLabourRate) || 0,
      labourType: jcLabourType,
      allowedWastagePercent: parseFloat(jcAllowedWastage) || 0,
      notes: jcNotes.trim() || undefined,
    };

    if (onCreateJobCard) {
      onCreateJobCard(input);
    } else {
      const created = storeCreateJobCard(input, tenantId);
      setJobCards((prev) => [created, ...prev]);
    }

    setIsJobCardModalOpen(false);
    setJcTitle("");
    setJcDescription("");
  };

  const handleStatusChange = (jobCardId: string, status: JobCardStatus, huid?: string) => {
    if (onUpdateJobCardStatus) {
      onUpdateJobCardStatus(jobCardId, status, huid);
    } else {
      storeUpdateJobCardStatus(jobCardId, status, huid, tenantId);
      setJobCards((prev) =>
        prev.map((jc) => (jc.id === jobCardId ? { ...jc, status, huid: huid || jc.huid } : jc))
      );
    }
  };

  const dispatchWhatsAppStatement = (karigar: Karigar) => {
    const karigarTxns = transactions.filter((t) => t.karigarId === karigar.id);
    const message = generateKarigarWhatsAppText(karigar, shopName, karigarTxns);
    const cleanPhone = karigar.phone.replace(/[^0-9]/g, "");
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, "_blank");
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C5A059]/15 text-[#DFC488]">
              <Hammer size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Karigar & Manufacturing (कारीगर व निर्माण खाता)
            </h1>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Pure bullion accounting, job cards, ghat/wastage (घाटा), HUID tracking & artisan labour for {shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="gold-outline"
            size="sm"
            icon={<FileText size={15} />}
            onClick={() => setIsJobCardModalOpen(true)}
          >
            + New Job Card (नया जॉब कार्ड)
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus size={15} />}
            onClick={() => setIsAddModalOpen(true)}
          >
            + Add Karigar (कारीगर)
          </GlassButton>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Pure Gold with Karigars (कारीगर के पास शुद्ध सोना)
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {formatGrams(totalGoldWithKarigars)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Across {karigars.length} active artisan workshops
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Active Job Cards (सक्रिय निर्माण आदेश)
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {jobCards.filter((jc) => jc.status !== "delivered" && jc.status !== "cancelled").length}{" "}
            Orders
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            {jobCards.filter((jc) => jc.status === "in_production").length} currently in casting & setting
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Labour Balance Due (बकाया मज़दूरी)
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-coral)] num-tabular">
            {formatINR(totalLabourDue)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Unsettled making charges owed
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Pure Silver Balance (कारीगर के पास चांदी)
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {formatGrams(totalSilverWithKarigars)}
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] block">
            Silversmith fine balance
          </span>
        </div>
      </div>

      {/* Tabs and Search */}
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
            Artisans & Balances ({karigars.length})
          </button>
          <button
            onClick={() => setActiveTab("jobcards")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "jobcards"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Job Cards / Manufacturing ({jobCards.length})
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "transactions"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Bullion Ledger History ({transactions.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search karigar, job card, ornament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>
      </div>

      {/* View 1: Karigar Directory */}
      {activeTab === "directory" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredKarigars.map((k) => (
            <div
              key={k.id}
              className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                    {k.name}
                  </h3>
                  <div className="text-[11px] text-[#DFC488] font-medium mt-0.5">
                    {k.specialty}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {k.workshopCity} · <Phone size={10} /> {k.phone}
                  </div>
                </div>
                <GlassBadge variant={k.status === "active" ? "emerald" : "neutral"} size="sm">
                  {k.status}
                </GlassBadge>
              </div>

              {/* Balances Highlight */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-black/40 border border-white/[0.04]">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Gold with Karigar
                  </span>
                  <div className="text-sm font-bold font-mono text-[#DFC488]">
                    {formatGrams(k.pureGoldBalanceGrams)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Labour Owed
                  </span>
                  <div className="text-sm font-bold font-mono text-[var(--accent-coral)]">
                    {formatINR(k.labourBalanceDue)}
                  </div>
                </div>
              </div>

              {/* Action Buttons for this Karigar */}
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  className="text-[11px] py-1 px-1.5 font-medium"
                  onClick={() => {
                    setSelectedKarigar(k);
                    setIsIssueModalOpen(true);
                  }}
                  title="Issue raw gold bar or alloy to karigar"
                >
                  + Issue Gold
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  className="text-[11px] py-1 px-1.5 font-medium"
                  onClick={() => {
                    setSelectedKarigar(k);
                    setIsReceiveModalOpen(true);
                  }}
                  title="Receive completed ornaments from karigar"
                >
                  + Receive
                </GlassButton>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <GlassButton
                  variant="ghost"
                  size="sm"
                  className="text-[11px] py-1 px-1.5 font-medium text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/10"
                  onClick={() => {
                    setSelectedKarigar(k);
                    setPayAmount(k.labourBalanceDue.toString());
                    setIsPayLabourModalOpen(true);
                  }}
                  title="Pay making charges to karigar"
                >
                  Pay Labour
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  icon={<MessageCircle size={13} className="text-[#25D366]" />}
                  className="text-[11px] py-1 px-1.5 font-medium text-[#25D366] hover:bg-[#25D366]/10"
                  onClick={() => dispatchWhatsAppStatement(k)}
                  title="Send Karigar hisab statement on WhatsApp"
                >
                  WhatsApp
                </GlassButton>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Manufacturing Job Cards */}
      {activeTab === "jobcards" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobCards.length === 0 ? (
              <div className="col-span-full py-12 text-center text-xs text-[var(--text-tertiary)] bg-[var(--surface-primary)] rounded-xl border border-white/[0.06]">
                No job cards found. Click &quot;+ New Job Card&quot; to issue custom ornament orders.
              </div>
            ) : (
              filteredJobCards.map((jc) => {
                const statusVariant: "emerald" | "gold" | "coral" | "neutral" =
                  jc.status === "completed" || jc.status === "delivered"
                    ? "emerald"
                    : jc.status === "in_production"
                    ? "gold"
                    : jc.status === "cancelled"
                    ? "coral"
                    : "neutral";

                return (
                  <div
                    key={jc.id}
                    className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/40 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[#DFC488]">
                            {jc.jobCardNumber}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                            {jc.category}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                          {jc.title}
                        </h4>
                      </div>
                      <GlassBadge variant={statusVariant} size="sm">
                        {jc.status.replace("_", " ")}
                      </GlassBadge>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {jc.description}
                    </p>

                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-[11px]">
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          Assigned Artisan
                        </span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {jc.karigarName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          Target Net Wt (Purity)
                        </span>
                        <span className="font-mono font-bold text-[#DFC488]">
                          {jc.targetNetWeight.toFixed(3)}g ({jc.purity})
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          Issued Fine Bullion
                        </span>
                        <span className="font-mono text-[var(--text-primary)]">
                          {jc.issuedFineWeightGrams.toFixed(3)}g Pure
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[var(--text-tertiary)] block">
                          Due Date
                        </span>
                        <span className="font-mono text-[var(--text-primary)] flex items-center gap-1">
                          <Calendar size={10} /> {new Date(jc.expectedDeliveryDate).toLocaleDateString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {jc.customerName && (
                      <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                        <span>For Client:</span>
                        <strong className="text-[var(--text-secondary)]">{jc.customerName}</strong>
                        {jc.customerPhone && <span>({jc.customerPhone})</span>}
                      </div>
                    )}

                    {jc.huid && (
                      <div className="flex items-center gap-1 text-[11px] text-[var(--accent-emerald)] font-mono">
                        <ShieldCheck size={12} /> BIS HUID: {jc.huid}
                      </div>
                    )}

                    {/* Status Advance Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-xs">
                      <span className="text-[10px] text-[var(--text-tertiary)]">Status:</span>
                      <div className="flex items-center gap-1">
                        {jc.status === "created" && (
                          <button
                            onClick={() => handleStatusChange(jc.id, "in_production")}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#C5A059]/20 text-[#DFC488] hover:bg-[#C5A059]/30"
                          >
                            Start Production →
                          </button>
                        )}
                        {jc.status === "in_production" && (
                          <button
                            onClick={() => handleStatusChange(jc.id, "hallmarking")}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                          >
                            Send for BIS Hallmarking →
                          </button>
                        )}
                        {jc.status === "hallmarking" && (
                          <button
                            onClick={() => {
                              const huidPrompt = prompt("Enter BIS Hallmarking HUID (6-digit alphanumeric):");
                              handleStatusChange(jc.id, "completed", huidPrompt || "HM916-OK");
                            }}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-emerald)]/20 text-[var(--accent-emerald)] hover:bg-[var(--accent-emerald)]/30"
                          >
                            Complete & Verify HUID ✓
                          </button>
                        )}
                        {jc.status === "completed" && (
                          <button
                            onClick={() => handleStatusChange(jc.id, "delivered")}
                            className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                          >
                            Mark Delivered
                          </button>
                        )}
                        {jc.status === "delivered" && (
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

      {/* View 3: Transactions History */}
      {activeTab === "transactions" && (
        <GlassPanel className="p-0 overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] text-[var(--text-secondary)] uppercase tracking-wider text-[11px] bg-white/[0.01]">
                  <th className="py-3 px-4 font-semibold">Date & Txn</th>
                  <th className="py-3 px-4 font-semibold">Karigar</th>
                  <th className="py-3 px-4 font-semibold">Type</th>
                  <th className="py-3 px-4 font-semibold">Item / Job Card</th>
                  <th className="py-3 px-4 font-semibold text-right">Fine Metal Impact</th>
                  <th className="py-3 px-4 font-semibold text-right">Labour / Payment</th>
                  <th className="py-3 px-4 font-semibold">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                      No karigar transactions recorded yet.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono">
                        <div>{new Date(t.date).toLocaleDateString("en-IN")}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{t.id}</div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                        {t.karigarName}
                      </td>
                      <td className="py-3 px-4">
                        <GlassBadge
                          variant={
                            t.type === "issue_metal"
                              ? "gold"
                              : t.type === "receive_ornament"
                              ? "emerald"
                              : "neutral"
                          }
                          size="sm"
                        >
                          {t.type === "issue_metal"
                            ? "Metal Issued (निकासी)"
                            : t.type === "receive_ornament"
                            ? "Goods Received (जमा)"
                            : "Labour Paid (भुगतान)"}
                        </GlassBadge>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-primary)]">
                        {t.ornamentName || "Fine Bullion"}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {t.fineWeightDelta > 0 ? (
                          <span className="text-[#DFC488]">+{formatGrams(t.fineWeightDelta)}</span>
                        ) : t.fineWeightDelta < 0 ? (
                          <span className="text-[var(--accent-emerald)]">
                            {formatGrams(t.fineWeightDelta)}
                          </span>
                        ) : (
                          <span className="text-[var(--text-tertiary)]">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">
                        {t.labourAmount ? (
                          <span className="text-[var(--accent-coral)] font-semibold">
                            +{formatINR(t.labourAmount)}
                          </span>
                        ) : t.paymentAmount ? (
                          <span className="text-[var(--accent-emerald)] font-semibold">
                            -{formatINR(t.paymentAmount)}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4 text-[11px] text-[var(--text-tertiary)] max-w-xs truncate">
                        {t.notes || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden divide-y divide-white/[0.05]">
            {transactions.length === 0 ? (
              <div className="py-10 text-center text-xs text-[var(--text-tertiary)]">
                No karigar transactions recorded yet.
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="p-4 space-y-2.5 hover:bg-white/[0.01]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-xs text-[var(--text-primary)]">
                        {t.karigarName}
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        {new Date(t.date).toLocaleDateString("en-IN")} · {t.id}
                      </div>
                    </div>
                    <GlassBadge
                      variant={
                        t.type === "issue_metal"
                          ? "gold"
                          : t.type === "receive_ornament"
                          ? "emerald"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {t.type === "issue_metal"
                        ? "Metal Issued"
                        : t.type === "receive_ornament"
                        ? "Ornament Rcvd"
                        : "Labour Paid"}
                    </GlassBadge>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] flex items-center justify-between text-[11px]">
                    <span className="text-[var(--text-secondary)]">{t.ornamentName || "Fine Metal"}</span>
                    <div className="font-mono text-right">
                      {t.fineWeightDelta !== 0 && (
                        <span
                          className={
                            t.fineWeightDelta > 0
                              ? "text-[#DFC488] font-bold"
                              : "text-[var(--accent-emerald)] font-bold"
                          }
                        >
                          {t.fineWeightDelta > 0
                            ? `+${formatGrams(t.fineWeightDelta)}`
                            : formatGrams(t.fineWeightDelta)}
                        </span>
                      )}
                      {t.labourAmount ? (
                        <span className="text-[var(--accent-coral)] font-bold ml-2">
                          +{formatINR(t.labourAmount)}
                        </span>
                      ) : t.paymentAmount ? (
                        <span className="text-[var(--accent-emerald)] font-bold ml-2">
                          -{formatINR(t.paymentAmount)}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {t.notes && (
                    <div className="text-[10px] text-[var(--text-tertiary)] italic">
                      {t.notes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassPanel>
      )}

      {/* Modal 1: Add Karigar */}
      {isAddModalOpen && (
        <GlassDialog
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New Karigar (नया कारीगर खाता)"
          description="Register artisan profile, specialization, and workshop contact."
          maxWidth="md"
        >
          <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
            <GlassInput
              label="Karigar Full Name *"
              placeholder="e.g. Gopal Babu (Bengali Master)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                label="Mobile Phone *"
                placeholder="+91 98290 12345"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
              <GlassInput
                label="Workshop City / Mohalla"
                placeholder="Jaipur (Johari Bazar)"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
            </div>
            <GlassInput
              label="Manufacturing Specialty"
              placeholder="e.g. Plain Gold Bangles, Kundan Meena, Casting Chains"
              value={newSpecialty}
              onChange={(e) => setNewSpecialty(e.target.value)}
            />
            <GlassInput
              label="Internal Notes"
              placeholder="Allowed wastage %, billing terms..."
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Save Karigar
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 2: Create Job Card */}
      {isJobCardModalOpen && (
        <GlassDialog
          isOpen={isJobCardModalOpen}
          onClose={() => setIsJobCardModalOpen(false)}
          title="Create Manufacturing Job Card (नया निर्माण आदेश)"
          description="Issue custom ornament design order to an artisan with target weights & allowed wastage."
          maxWidth="lg"
        >
          <form onSubmit={handleCreateJobCardSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Assign to Karigar *
                </label>
                <select
                  value={jcKarigarId}
                  onChange={(e) => setJcKarigarId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                  required
                >
                  {karigars.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.specialty})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Ornament Category *
                </label>
                <select
                  value={jcCategory}
                  onChange={(e) => setJcCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="Bangles">Bangles (कंगन / चूड़ियां)</option>
                  <option value="Necklace">Necklace / Choker (हार)</option>
                  <option value="Ring">Rings / Angoothi (अंगूठी)</option>
                  <option value="Chains">Chains / Mangalsutra (चेन)</option>
                  <option value="Earrings">Earrings / Jhumki (झुमकी)</option>
                  <option value="Kundan Meena">Kundan Meena Jadau (जड़ाऊ)</option>
                  <option value="Silver Utensils">Silver Utensils / Idols (बर्तन/मूर्ति)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <GlassInput
                label="Job Card Title *"
                placeholder="e.g. 22K Traditional Die Bangles (4 pcs)"
                value={jcTitle}
                onChange={(e) => setJcTitle(e.target.value)}
                required
              />
              <GlassInput
                label="Customer Reference (Optional)"
                placeholder="e.g. Mrs. Sunita Sharma (+91 98290...)"
                value={jcCustomerName}
                onChange={(e) => setJcCustomerName(e.target.value)}
              />
            </div>

            <GlassInput
              label="Design Specifications & Details *"
              placeholder="e.g. Floral motif, 2-6 size, heavy safety clasp, syndicate uncut polki..."
              value={jcDescription}
              onChange={(e) => setJcDescription(e.target.value)}
              required
            />

            <div className="grid grid-cols-3 gap-3">
              <GlassInput
                label="Target Gross Wt (g) *"
                type="number"
                step="0.001"
                value={jcTargetGross}
                onChange={(e) => setJcTargetGross(e.target.value)}
                required
              />
              <GlassInput
                label="Target Net Wt (g) *"
                type="number"
                step="0.001"
                value={jcTargetNet}
                onChange={(e) => setJcTargetNet(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Target Purity *
                </label>
                <select
                  value={jcPurity}
                  onChange={(e) => setJcPurity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="22K (916)">22K (916 BIS Hallmark)</option>
                  <option value="18K (750)">18K (750 Diamond Setting)</option>
                  <option value="24K (999)">24K (999 Fine Bullion)</option>
                  <option value="14K (585)">14K (585 Daily Wear)</option>
                  <option value="925 Sterling">925 Sterling Silver</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <GlassInput
                label="Initial Fine Gold Issued (g)"
                type="number"
                step="0.001"
                value={jcIssuedFine}
                onChange={(e) => setJcIssuedFine(e.target.value)}
              />
              <GlassInput
                label="Agreed Labour (₹) *"
                type="number"
                value={jcLabourRate}
                onChange={(e) => setJcLabourRate(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Labour Type
                </label>
                <select
                  value={jcLabourType}
                  onChange={(e) => setJcLabourType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="per_gram">₹ Per Gram (प्रति ग्राम)</option>
                  <option value="fixed">Fixed Lump Sum (एकमुश्त)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Allowed Wastage Ghat (%)"
                type="number"
                step="0.1"
                value={jcAllowedWastage}
                onChange={(e) => setJcAllowedWastage(e.target.value)}
              />
              <GlassInput
                label="Expected Delivery Date *"
                type="date"
                value={jcDeliveryDate}
                onChange={(e) => setJcDeliveryDate(e.target.value)}
                required
              />
            </div>

            <GlassInput
              label="Special Instructions / Sample Ref"
              placeholder="Reference sketch photo in ledger, urgent wedding order..."
              value={jcNotes}
              onChange={(e) => setJcNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsJobCardModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Create & Issue Job Card
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 3: Issue Metal to Karigar */}
      {isIssueModalOpen && selectedKarigar && (
        <GlassDialog
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title={`Issue Metal to ${selectedKarigar.name} (सोना/चांदी निकासी)`}
          description="Weigh and issue bullion bar or alloy for manufacturing orders."
          maxWidth="md"
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Current Karigar Balance:</span>
              <span className="font-mono font-bold text-[#DFC488]">
                {formatGrams(selectedKarigar.pureGoldBalanceGrams)} Gold
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Metal
                </label>
                <select
                  value={issueMetalType}
                  onChange={(e) => setIssueMetalType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                >
                  <option value="gold">Gold (सोना)</option>
                  <option value="silver">Silver (चांदी)</option>
                </select>
              </div>

              <GlassInput
                label="Purity / Form"
                placeholder="24K Fine Bar (99.9%)"
                value={issuePurity}
                onChange={(e) => setIssuePurity(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Gross Metal Weight (g) *"
                type="number"
                step="0.001"
                value={issueGrossWeight}
                onChange={(e) => {
                  setIssueGrossWeight(e.target.value);
                  setIssueFineWeight(e.target.value);
                }}
                required
              />
              <GlassInput
                label="Pure Fine Weight Issued (g) *"
                type="number"
                step="0.001"
                value={issueFineWeight}
                onChange={(e) => setIssueFineWeight(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Link to Job Card (Optional)
              </label>
              <select
                value={issueJobCardId}
                onChange={(e) => {
                  setIssueJobCardId(e.target.value);
                  const matched = jobCards.find((jc) => jc.id === e.target.value);
                  if (matched) {
                    setIssueOrderName(`Job Card #${matched.jobCardNumber} (${matched.title})`);
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="">-- No specific Job Card --</option>
                {jobCards
                  .filter((jc) => jc.karigarId === selectedKarigar.id)
                  .map((jc) => (
                    <option key={jc.id} value={jc.id}>
                      {jc.jobCardNumber}: {jc.title}
                    </option>
                  ))}
              </select>
            </div>

            <GlassInput
              label="Order Description / Job Slip"
              placeholder="e.g. Order #412 - 4 Pair 22K Bangles"
              value={issueOrderName}
              onChange={(e) => setIssueOrderName(e.target.value)}
              required
            />

            <GlassInput
              label="Delivery Deadline / Remarks"
              placeholder="Expected back by 2nd October..."
              value={issueNotes}
              onChange={(e) => setIssueNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsIssueModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Confirm Metal Issue
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 4: Receive Goods from Karigar */}
      {isReceiveModalOpen && selectedKarigar && (
        <GlassDialog
          isOpen={isReceiveModalOpen}
          onClose={() => setIsReceiveModalOpen(false)}
          title={`Receive Finished Ornaments from ${selectedKarigar.name} (माल जमा)`}
          description="Weigh finished goods, adjust Ghat (घाटा), and deduct fine gold from karigar's balance."
          maxWidth="md"
        >
          <form onSubmit={handleReceiveSubmit} className="space-y-4 text-xs">
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Link to Job Card (Optional)
              </label>
              <select
                value={rcvJobCardId}
                onChange={(e) => {
                  setRcvJobCardId(e.target.value);
                  const matched = jobCards.find((jc) => jc.id === e.target.value);
                  if (matched) {
                    setRcvOrnamentName(matched.title);
                    setRcvGrossWeight(matched.targetGrossWeight.toString());
                    setRcvNetWeight(matched.targetNetWeight.toString());
                    const net = matched.targetNetWeight;
                    setRcvFineDeduction((net * (22 / 24)).toFixed(3));
                    const labour =
                      matched.labourType === "per_gram"
                        ? Math.round(net * matched.labourRate)
                        : matched.labourRate;
                    setRcvLabourCharges(labour.toString());
                  }
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="">-- No specific Job Card --</option>
                {jobCards
                  .filter((jc) => jc.karigarId === selectedKarigar.id && jc.status !== "delivered")
                  .map((jc) => (
                    <option key={jc.id} value={jc.id}>
                      {jc.jobCardNumber}: {jc.title} ({jc.status})
                    </option>
                  ))}
              </select>
            </div>

            <GlassInput
              label="Ornament Name / Order Ref *"
              placeholder="e.g. 22K Solid Bangles (Pair)"
              value={rcvOrnamentName}
              onChange={(e) => setRcvOrnamentName(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Gross Weight (g) *"
                type="number"
                step="0.001"
                value={rcvGrossWeight}
                onChange={(e) => setRcvGrossWeight(e.target.value)}
                required
              />
              <GlassInput
                label="Net Metal Weight (g) *"
                type="number"
                step="0.001"
                value={rcvNetWeight}
                onChange={(e) => {
                  setRcvNetWeight(e.target.value);
                  const net = parseFloat(e.target.value) || 0;
                  setRcvFineDeduction((net * (22 / 24)).toFixed(3));
                }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Pure Fine Gold Returned / Credited (g) *"
                type="number"
                step="0.001"
                value={rcvFineDeduction}
                onChange={(e) => setRcvFineDeduction(e.target.value)}
                required
              />
              <GlassInput
                label="Labour Making Charges (₹) *"
                type="number"
                prefixSymbol="₹"
                value={rcvLabourCharges}
                onChange={(e) => setRcvLabourCharges(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="BIS Hallmarking HUID (6-digit)"
                placeholder="e.g. HA916Z"
                value={rcvHuid}
                onChange={(e) => setRcvHuid(e.target.value)}
              />
              <GlassInput
                label="Remarks / Ghat (घाटा)"
                placeholder="Passed hallmark, 0.2g scrap returned..."
                value={rcvNotes}
                onChange={(e) => setRcvNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsReceiveModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Receive & Update Balances
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 5: Pay Labour to Karigar */}
      {isPayLabourModalOpen && selectedKarigar && (
        <GlassDialog
          isOpen={isPayLabourModalOpen}
          onClose={() => setIsPayLabourModalOpen(false)}
          title={`Pay Labour to ${selectedKarigar.name} (मज़दूरी भुगतान)`}
          description="Settle manufacturing making charges owed to artisan."
          maxWidth="sm"
        >
          <form onSubmit={handlePayLabourSubmit} className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.06] flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Labour Balance Due:</span>
              <span className="font-mono font-bold text-[var(--accent-coral)]">
                {formatINR(selectedKarigar.labourBalanceDue)}
              </span>
            </div>

            <GlassInput
              label="Payment Amount (₹) *"
              type="number"
              prefixSymbol="₹"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              required
            />

            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Payment Method
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="Cash">Cash (रोकड़)</option>
                <option value="UPI">UPI / PhonePe / GPay</option>
                <option value="Bank">Bank NEFT / RTGS</option>
              </select>
            </div>

            <GlassInput
              label="Payment Ref / Notes"
              placeholder="Voucher #, transaction ref..."
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsPayLabourModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Record Payment
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}
    </div>
  );
};
