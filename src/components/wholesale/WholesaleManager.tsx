"use client";

import React, { useState } from "react";
import {
  ConsignmentMemo,
  ConsignmentMemoItem,
  CreateConsignmentMemoInput,
  CreateMemoItemInput,
  B2BPartnerProfile,
  generateMemoWhatsAppText,
} from "../../modules/wholesale/types";
import {
  createConsignmentMemo as storeCreateMemo,
  returnMemoItems as storeReturnItems,
  convertMemoToInvoice as storeConvertInvoice,
  saveB2BPartners,
  getSavedB2BPartners,
} from "../../modules/wholesale/store";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  FileSpreadsheet,
  Plus,
  Search,
  Scale,
  Receipt,
  MessageCircle,
  Building2,
  Calendar,
  CheckCircle2,
  Undo2,
  ArrowRight,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

export interface WholesaleManagerProps {
  memos: ConsignmentMemo[];
  partners: B2BPartnerProfile[];
  onIssueMemo?: (input: CreateConsignmentMemoInput) => void;
  onReturnMemoItems?: (memoId: string, itemIds: string[]) => void;
  onConvertMemoToInvoice?: (memoId: string, itemIds: string[], invoiceNum: string) => void;
  onAddPartner?: (partner: Omit<B2BPartnerProfile, "id" | "totalMemoCount" | "activeMemoValue" | "totalPurchasedValue">) => void;
  shopName: string;
  tenantId?: string;
}

export const WholesaleManager: React.FC<WholesaleManagerProps> = ({
  memos: initialMemos,
  partners: initialPartners,
  onIssueMemo,
  onReturnMemoItems,
  onConvertMemoToInvoice,
  onAddPartner,
  shopName,
  tenantId,
}) => {
  const [activeTab, setActiveTab] = useState<"memos" | "partners">("memos");
  const [searchQuery, setSearchQuery] = useState("");

  const [memos, setMemos] = useState<ConsignmentMemo[]>(initialMemos);
  const [partners, setPartners] = useState<B2BPartnerProfile[]>(initialPartners);

  React.useEffect(() => {
    setMemos(initialMemos);
  }, [initialMemos]);
  React.useEffect(() => {
    setPartners(initialPartners);
  }, [initialPartners]);

  // Modals
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isAddPartnerModalOpen, setIsAddPartnerModalOpen] = useState(false);
  const [selectedMemoForAction, setSelectedMemoForAction] = useState<ConsignmentMemo | null>(null);

  // New Memo Form State
  const [partnerName, setPartnerName] = useState(partners[0]?.businessName || "");
  const [partnerPhone, setPartnerPhone] = useState(partners[0]?.phone || "+91 ");
  const [partnerCity, setPartnerCity] = useState(partners[0]?.city || "Alwar");
  const [partnerGstin, setPartnerGstin] = useState(partners[0]?.gstin || "");
  const [validDays, setValidDays] = useState("7");
  const [memoNotes, setMemoNotes] = useState("");

  // Memo Line Item Entry
  const [itemName, setItemName] = useState("22K Solid Rajputana Bangles (Pair)");
  const [itemCategory, setItemCategory] = useState("Bangles & Kadas");
  const [itemMetal, setItemMetal] = useState<"gold" | "silver">("gold");
  const [itemPurity, setItemPurity] = useState("22K (916)");
  const [itemGross, setItemGross] = useState("32.5");
  const [itemNet, setItemNet] = useState("32.5");
  const [itemRate, setItemRate] = useState("11250"); // ₹/g
  const [stagedItems, setStagedItems] = useState<CreateMemoItemInput[]>([]);

  // Add Partner Form State
  const [newBizName, setNewBizName] = useState("");
  const [newContact, setNewContact] = useState("");
  const [newPhone, setNewPhone] = useState("+91 ");
  const [newCity, setNewCity] = useState("Jaipur");
  const [newAddress, setNewAddress] = useState("");
  const [newGstin, setNewGstin] = useState("");

  // Aggregates
  const activeMemos = memos.filter((m) => m.status === "active_issued" || m.status === "partially_settled");
  const totalArticlesOnMemo = activeMemos.reduce(
    (sum, m) => sum + m.items.filter((i) => i.status === "on_memo").length,
    0
  );
  const totalValueOnMemo = activeMemos.reduce(
    (sum, m) =>
      sum +
      m.items
        .filter((i) => i.status === "on_memo")
        .reduce((itemSum, i) => itemSum + i.totalValue, 0),
    0
  );

  // Staged Item Add
  const handleAddStagedItem = () => {
    const grossNum = parseFloat(itemGross) || 0;
    const netNum = parseFloat(itemNet) || 0;
    const rateNum = parseFloat(itemRate) || 0;
    if (!itemName.trim() || netNum <= 0) return;

    const fineWeight = Math.round(netNum * (22 / 24) * 1000) / 1000;
    const totalValue = Math.round(netNum * rateNum);

    setStagedItems((prev) => [
      ...prev,
      {
        name: itemName.trim(),
        category: itemCategory,
        metal: itemMetal,
        purity: itemPurity,
        grossWeight: grossNum,
        netWeight: netNum,
        fineWeight,
        wholesaleRate: rateNum,
        totalValue,
      },
    ]);

    setItemName("");
    setItemGross("");
    setItemNet("");
  };

  const handleIssueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stagedItems.length === 0 || !partnerName.trim()) return;

    const input: CreateConsignmentMemoInput = {
      jewellerPartnerName: partnerName.trim(),
      jewellerPhone: partnerPhone.trim(),
      jewellerCity: partnerCity.trim(),
      jewellerGstin: partnerGstin.trim() || undefined,
      validDays: parseInt(validDays) || 7,
      items: stagedItems,
      notes: memoNotes.trim() || undefined,
    };

    if (onIssueMemo) {
      onIssueMemo(input);
    } else {
      const created = storeCreateMemo(input, tenantId);
      setMemos((prev) => [created, ...prev]);
    }

    setIsIssueModalOpen(false);
    setStagedItems([]);
    setMemoNotes("");
  };

  const handleReturnAll = (memo: ConsignmentMemo) => {
    const activeItemIds = memo.items.filter((i) => i.status === "on_memo").map((i) => i.id);
    if (activeItemIds.length === 0) return;

    if (onReturnMemoItems) {
      onReturnMemoItems(memo.id, activeItemIds);
    } else {
      const updated = storeReturnItems(memo.id, activeItemIds, tenantId);
      if (updated) {
        setMemos((prev) => prev.map((m) => (m.id === memo.id ? updated : m)));
      }
    }
  };

  const handleConvertToInvoice = (memo: ConsignmentMemo) => {
    const activeItemIds = memo.items.filter((i) => i.status === "on_memo").map((i) => i.id);
    if (activeItemIds.length === 0) return;

    const invoiceNum = `WH-INV-${Date.now().toString().slice(-4)}`;
    if (onConvertMemoToInvoice) {
      onConvertMemoToInvoice(memo.id, activeItemIds, invoiceNum);
    } else {
      const updated = storeConvertInvoice(memo.id, activeItemIds, invoiceNum, tenantId);
      if (updated) {
        setMemos((prev) => prev.map((m) => (m.id === memo.id ? updated : m)));
      }
    }
  };

  const handleAddPartnerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    const partnerData = {
      businessName: newBizName.trim(),
      contactPerson: newContact.trim(),
      phone: newPhone.trim(),
      city: newCity.trim(),
      address: newAddress.trim(),
      gstin: newGstin.trim() || undefined,
    };

    if (onAddPartner) {
      onAddPartner(partnerData);
    } else {
      const newPartner: B2BPartnerProfile = {
        ...partnerData,
        id: `b2b-${Date.now()}`,
        totalMemoCount: 0,
        activeMemoValue: 0,
        totalPurchasedValue: 0,
      };
      const updated = [newPartner, ...partners];
      setPartners(updated);
      saveB2BPartners(updated, tenantId);
    }

    setIsAddPartnerModalOpen(false);
    setNewBizName("");
    setNewContact("");
  };

  const dispatchWhatsAppMemo = (memo: ConsignmentMemo) => {
    const text = generateMemoWhatsAppText(memo, shopName);
    const cleanPhone = memo.jewellerPhone.replace(/[^0-9]/g, "");
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
              <FileSpreadsheet size={18} />
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
              Wholesale & Consignment Memo (थोक सराफा व कच्चा पर्चा)
            </h1>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Consignment approval memos (जांगड़ / कच्चा पर्चा), B2B partner ledger & wholesale billing for {shopName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            icon={<Building2 size={14} />}
            onClick={() => setIsAddPartnerModalOpen(true)}
          >
            + Add B2B Retailer
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setIsIssueModalOpen(true)}
          >
            + Issue Consignment Memo (कच्चा पर्चा)
          </GlassButton>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Active Consignment Memos (सक्रिय जांगड़)
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {activeMemos.length} Memos
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Goods currently on retailer approval
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Articles on Approval (जांगड़ में आभूषण)
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {totalArticlesOnMemo} Pieces
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Total physical ornaments out of vault
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Value on Consignment (अनुमानित मूल्य)
          </span>
          <div className="text-2xl font-semibold text-[var(--accent-coral)] num-tabular">
            {formatINR(totalValueOnMemo)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Estimated wholesale valuation
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            B2B Partner Network (थोक व्यापारी)
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {partners.length} Jewellers
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Verified regional jewellers & agents
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06]">
        <div className="inline-flex p-1 rounded-lg bg-black/20 border border-white/[0.04] text-xs">
          <button
            onClick={() => setActiveTab("memos")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "memos"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Consignment Memos / जांगड़ ({memos.length})
          </button>
          <button
            onClick={() => setActiveTab("partners")}
            className={`px-3 py-1 rounded text-xs transition-colors ${
              activeTab === "partners"
                ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            B2B Jeweller Partners ({partners.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search memo #, partner, ornament..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-black/30 border border-white/[0.08] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/60"
          />
        </div>
      </div>

      {/* Tab 1: Consignment Memos List */}
      {activeTab === "memos" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {memos.length === 0 ? (
              <div className="py-12 text-center text-xs text-[var(--text-tertiary)] bg-[var(--surface-primary)] rounded-xl border border-white/[0.06]">
                No consignment memos found. Click &quot;+ Issue Consignment Memo&quot; to give goods on approval.
              </div>
            ) : (
              memos
                .filter((m) => {
                  const q = searchQuery.toLowerCase();
                  return (
                    m.memoNumber.toLowerCase().includes(q) ||
                    m.jewellerPartnerName.toLowerCase().includes(q) ||
                    m.jewellerCity.toLowerCase().includes(q)
                  );
                })
                .map((m) => {
                  const statusVariant: "gold" | "emerald" | "coral" | "neutral" =
                    m.status === "fully_converted_invoice"
                      ? "emerald"
                      : m.status === "active_issued"
                      ? "gold"
                      : m.status === "partially_settled"
                      ? "coral"
                      : "neutral";

                  const activeItems = m.items.filter((i) => i.status === "on_memo");

                  return (
                    <div
                      key={m.id}
                      className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.04]">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-[#DFC488]">
                              {m.memoNumber}
                            </span>
                            <GlassBadge variant={statusVariant} size="sm">
                              {m.status.replace(/_/g, " ").toUpperCase()}
                            </GlassBadge>
                          </div>
                          <div className="text-xs text-[var(--text-primary)] font-medium mt-1">
                            Issued to: <strong>{m.jewellerPartnerName}</strong> ({m.jewellerCity}) · 📞 {m.jewellerPhone}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            icon={<MessageCircle size={14} className="text-[#25D366]" />}
                            className="text-[11px] text-[#25D366] hover:bg-[#25D366]/10"
                            onClick={() => dispatchWhatsAppMemo(m)}
                          >
                            WhatsApp Memo
                          </GlassButton>

                          {activeItems.length > 0 && (
                            <>
                              <GlassButton
                                variant="secondary"
                                size="sm"
                                icon={<Undo2 size={13} />}
                                className="text-[11px]"
                                onClick={() => handleReturnAll(m)}
                                title="Re-inward all remaining articles back to stock safe"
                              >
                                Return All (माल वापसी)
                              </GlassButton>
                              <GlassButton
                                variant="primary"
                                size="sm"
                                icon={<Receipt size={13} />}
                                className="text-[11px]"
                                onClick={() => handleConvertToInvoice(m)}
                                title="Convert sold articles into final wholesale invoice"
                              >
                                Bill to Invoice (पक्का बिल)
                              </GlassButton>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Items Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {m.items.map((item) => (
                          <div
                            key={item.id}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                              item.status === "on_memo"
                                ? "bg-black/30 border-white/[0.06]"
                                : item.status === "sold_billed"
                                ? "bg-[var(--accent-emerald)]/5 border-[var(--accent-emerald)]/20 text-[var(--accent-emerald)]"
                                : "bg-white/[0.02] border-white/[0.04] opacity-60"
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-[var(--text-primary)] truncate">
                                {item.name}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04]">
                                {item.purity}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
                              <div>
                                <span className="text-[9px] text-[var(--text-tertiary)] block">
                                  Gross / Net Wt
                                </span>
                                <span>{item.grossWeight.toFixed(3)}g / {item.netWeight.toFixed(3)}g</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[9px] text-[var(--text-tertiary)] block">
                                  Estimated Value
                                </span>
                                <span className="text-[#DFC488] font-bold">
                                  {formatINR(item.totalValue)}
                                </span>
                              </div>
                            </div>

                            <div className="pt-1 border-t border-white/[0.04] flex justify-between items-center text-[10px]">
                              <span className="text-[var(--text-tertiary)]">Item Status:</span>
                              <span className="font-semibold uppercase tracking-wider">
                                {item.status.replace(/_/g, " ")}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Summary */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.04] text-[11px] text-[var(--text-tertiary)]">
                        <div className="flex items-center gap-4">
                          <span>
                            Total Gross: <strong className="text-[var(--text-secondary)]">{m.totalGrossWeight.toFixed(3)} g</strong>
                          </span>
                          <span>
                            Total Net: <strong className="text-[var(--text-secondary)]">{m.totalNetWeight.toFixed(3)} g</strong>
                          </span>
                          <span>
                            Estimated Total: <strong className="text-[#DFC488]">{formatINR(m.totalEstimatedValue)}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={11} />
                          <span>
                            Valid: {new Date(m.issueDate).toLocaleDateString("en-IN")} to {new Date(m.validUntilDate).toLocaleDateString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      )}

      {/* Tab 2: B2B Jeweller Partners */}
      {activeTab === "partners" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] hover:border-[#C5A059]/30 transition-all space-y-3 text-xs"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                    {p.businessName}
                  </h3>
                  <div className="text-[11px] text-[#DFC488] font-medium mt-0.5">
                    Contact: {p.contactPerson}
                  </div>
                  <div className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1 mt-1">
                    <MapPin size={10} /> {p.city} · <Phone size={10} /> {p.phone}
                  </div>
                </div>
                {p.gstin && (
                  <GlassBadge variant="emerald" size="sm">
                    GSTIN Verified
                  </GlassBadge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-black/40 border border-white/[0.04]">
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Active on Memo
                  </span>
                  <div className="text-sm font-bold font-mono text-[#DFC488]">
                    {formatINR(p.activeMemoValue)}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--text-tertiary)] block">
                    Lifetime Purchases
                  </span>
                  <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    {formatINR(p.totalPurchasedValue)}
                  </div>
                </div>
              </div>

              {p.notes && (
                <div className="text-[10px] text-[var(--text-tertiary)] italic">
                  {p.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal 1: Issue Consignment Memo */}
      {isIssueModalOpen && (
        <GlassDialog
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title="Issue Consignment Memo / Jangad (कच्चा पर्चा)"
          description="Hand over fine jewellery ornaments on approval or inspection to a B2B partner jeweller."
          maxWidth="lg"
        >
          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Jeweller Partner Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Radha Govind Jewellers"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <GlassInput
                  label="Partner Phone *"
                  placeholder="+91 94140..."
                  value={partnerPhone}
                  onChange={(e) => setPartnerPhone(e.target.value)}
                  required
                />
                <GlassInput
                  label="City"
                  placeholder="Alwar / Kota"
                  value={partnerCity}
                  onChange={(e) => setPartnerCity(e.target.value)}
                />
              </div>
            </div>

            {/* Line Item Entry Box */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
              <span className="text-xs font-semibold text-[#DFC488] uppercase tracking-wider block">
                Add Article to Consignment Memo
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <GlassInput
                    label="Ornament Description"
                    placeholder="e.g. 22K Solid Rajputana Bangles (Pair)"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                    Purity
                  </label>
                  <select
                    value={itemPurity}
                    onChange={(e) => setItemPurity(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
                  >
                    <option value="22K (916)">22K (916)</option>
                    <option value="18K (750)">18K (750)</option>
                    <option value="24K (999)">24K (999)</option>
                    <option value="925 Silver">925 Silver</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <GlassInput
                  label="Gross Weight (g)"
                  type="number"
                  step="0.001"
                  value={itemGross}
                  onChange={(e) => {
                    setItemGross(e.target.value);
                    setItemNet(e.target.value);
                  }}
                />
                <GlassInput
                  label="Net Weight (g)"
                  type="number"
                  step="0.001"
                  value={itemNet}
                  onChange={(e) => setItemNet(e.target.value)}
                />
                <GlassInput
                  label="Wholesale Rate (₹/g)"
                  type="number"
                  value={itemRate}
                  onChange={(e) => setItemRate(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  type="button"
                  onClick={handleAddStagedItem}
                  disabled={!itemName.trim()}
                >
                  + Add to Memo List
                </GlassButton>
              </div>
            </div>

            {/* Staged Items List */}
            {stagedItems.length > 0 && (
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] block">
                  Staged Articles ({stagedItems.length})
                </span>
                <div className="divide-y divide-white/[0.04] text-[11px]">
                  {stagedItems.map((item, i) => (
                    <div key={i} className="py-1.5 flex justify-between items-center">
                      <div>
                        <strong>{item.name}</strong> ({item.purity}) · {item.netWeight.toFixed(3)}g
                      </div>
                      <div className="font-mono text-[#DFC488]">{formatINR(item.totalValue)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Validity Term (Days)"
                type="number"
                value={validDays}
                onChange={(e) => setValidDays(e.target.value)}
              />
              <GlassInput
                label="Partner GSTIN (Optional)"
                placeholder="08AABCR1234F1Z3"
                value={partnerGstin}
                onChange={(e) => setPartnerGstin(e.target.value)}
              />
            </div>

            <GlassInput
              label="Remarks / Approval Terms"
              placeholder="e.g. For client inspection in Alwar showroom..."
              value={memoNotes}
              onChange={(e) => setMemoNotes(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsIssueModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit" disabled={stagedItems.length === 0}>
                Issue & Dispatch Consignment Memo
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}

      {/* Modal 2: Add B2B Partner */}
      {isAddPartnerModalOpen && (
        <GlassDialog
          isOpen={isAddPartnerModalOpen}
          onClose={() => setIsAddPartnerModalOpen(false)}
          title="Add B2B Jeweller Partner (थोक व्यापारी खाता)"
          description="Register retail jeweller or agent for consignment approvals and wholesale orders."
          maxWidth="md"
        >
          <form onSubmit={handleAddPartnerSubmit} className="space-y-4 text-xs">
            <GlassInput
              label="Jewellery Business / Firm Name *"
              placeholder="e.g. Radha Govind Jewellers"
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Contact Person Name"
                placeholder="e.g. Ghanshyam Soni"
                value={newContact}
                onChange={(e) => setNewContact(e.target.value)}
              />
              <GlassInput
                label="Mobile Phone *"
                placeholder="+91 94140..."
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="City / Sarafa Bazar"
                placeholder="Alwar / Kota / Jaipur"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
              <GlassInput
                label="GSTIN Number"
                placeholder="08AABCR1234F1Z3"
                value={newGstin}
                onChange={(e) => setNewGstin(e.target.value)}
              />
            </div>
            <GlassInput
              label="Showroom Address"
              placeholder="Shop #14, Sarafa Bazar..."
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
            <div className="flex justify-end gap-2 pt-2">
              <GlassButton variant="ghost" type="button" onClick={() => setIsAddPartnerModalOpen(false)}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" type="submit">
                Save B2B Partner
              </GlassButton>
            </div>
          </form>
        </GlassDialog>
      )}
    </div>
  );
};
