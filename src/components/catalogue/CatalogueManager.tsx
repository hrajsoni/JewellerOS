"use client";

import React, { useState } from "react";
import {
  ProductDesignItem,
  ProductVariantItem,
  CreateProductDesignInput,
  CreateProductVariantInput,
} from "../../modules/catalogue/types";
import {
  getSavedProductDesigns,
  addProductDesign,
  addProductVariant,
} from "../../modules/catalogue/store";
import { GlassCard } from "../glass/GlassCard";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Sparkles,
  Plus,
  Search,
  Layers,
  Tag,
  Barcode,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Scale,
  Coins,
  PackageCheck,
} from "lucide-react";
import { formatINR } from "../../lib/formatters";

export interface CatalogueManagerProps {
  onSelectForBarcodePrint?: (code: string) => void;
  shopName?: string;
}

export const CatalogueManager: React.FC<CatalogueManagerProps> = ({
  onSelectForBarcodePrint,
  shopName = "Sandhya Jewellers",
}) => {
  const [designs, setDesigns] = useState<ProductDesignItem[]>(() =>
    getSavedProductDesigns()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMetal, setSelectedMetal] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [expandedDesignId, setExpandedDesignId] = useState<string | null>(
    designs[0]?.id || null
  );

  // New Design Modal
  const [isNewDesignOpen, setIsNewDesignOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Rings");
  const [newSubCategory, setNewSubCategory] = useState("");
  const [newMetal, setNewMetal] = useState<"GOLD" | "SILVER" | "PLATINUM">("GOLD");
  const [newPurity, setNewPurity] = useState("22K");
  const [newMakingType, setNewMakingType] = useState<"PERCENTAGE" | "PER_GRAM" | "FIXED">("PERCENTAGE");
  const [newMakingValue, setNewMakingValue] = useState("12");

  // New Variant Modal
  const [isNewVariantOpen, setIsNewVariantOpen] = useState(false);
  const [targetDesignId, setTargetDesignId] = useState<string | null>(null);
  const [newSku, setNewSku] = useState("");
  const [newVariantName, setNewVariantName] = useState("");
  const [newRefWeight, setNewRefWeight] = useState("4.5");
  const [newMasterBarcode, setNewMasterBarcode] = useState("");
  const [newIsSerialized, setNewIsSerialized] = useState(true);

  // Filtered designs
  const filteredDesigns = designs.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMetal = selectedMetal === "ALL" || d.metal === selectedMetal;
    const matchesCat = selectedCategory === "ALL" || d.category === selectedCategory;
    return matchesSearch && matchesMetal && matchesCat;
  });

  const totalDesigns = designs.length;
  const totalVariants = designs.reduce(
    (acc, d) => acc + (d.variants?.length || 0),
    0
  );
  const totalPiecesInStock = designs.reduce(
    (acc, d) => acc + (d.totalStockCount || 0),
    0
  );

  function handleCreateDesign(e: React.FormEvent) {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const created = addProductDesign({
      productCode: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
      subCategory: newSubCategory.trim() || undefined,
      metal: newMetal,
      defaultPurity: newPurity,
      standardMaking: parseFloat(newMakingValue) || 0,
      makingType: newMakingType,
    });

    setDesigns(getSavedProductDesigns());
    setExpandedDesignId(created.id);
    setIsNewDesignOpen(false);
    setNewCode("");
    setNewName("");
  }

  function handleCreateVariant(e: React.FormEvent) {
    e.preventDefault();
    if (!targetDesignId || !newSku.trim() || !newVariantName.trim()) return;

    addProductVariant({
      productId: targetDesignId,
      sku: newSku.trim(),
      variantName: newVariantName.trim(),
      referenceWeight: parseFloat(newRefWeight) || 0,
      masterBarcode: newMasterBarcode.trim() || undefined,
      isSerialized: newIsSerialized,
    });

    setDesigns(getSavedProductDesigns());
    setIsNewVariantOpen(false);
    setNewSku("");
    setNewVariantName("");
    setNewMasterBarcode("");
  }

  return (
    <div className="space-y-6">
      {/* Header & KPI Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C5A059]" />
            <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-wide">
              5-Tier Product Catalogue & Media Vault
            </h1>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Strict separation between Design Models, Variant SKUs, and Physical Barcoded Stock Pieces.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            onClick={() => setIsNewDesignOpen(true)}
            className="flex items-center gap-2 bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#DFC488] border border-[#C5A059]/40"
          >
            <Plus size={15} />
            <span>New Design Model</span>
          </GlassButton>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-secondary)] uppercase font-semibold">
              Product Designs (Tier 2)
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {totalDesigns}
            </div>
            <div className="text-[10px] text-[#DFC488] mt-0.5">Master 3D CAD & Renders</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center text-[#DFC488]">
            <Sparkles size={20} />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-secondary)] uppercase font-semibold">
              Sellable SKUs (Tier 3)
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {totalVariants}
            </div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Size & Tone Variations</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Layers size={20} />
          </div>
        </GlassCard>

        <GlassCard className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--text-secondary)] uppercase font-semibold">
              Live Stock Pieces (Tier 4 & 5)
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {totalPiecesInStock}
            </div>
            <div className="text-[10px] text-blue-400 mt-0.5">Unique Barcodes & BIS HUIDs</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <PackageCheck size={20} />
          </div>
        </GlassCard>
      </div>

      {/* Filter & Search Bar */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search design by code (e.g. RNG-22K-001), name, or category..."
              className="w-full pl-9 pr-4 py-2 bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]/50"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedMetal}
              onChange={(e) => setSelectedMetal(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:border-[#C5A059]/50"
            >
              <option value="ALL">All Metals</option>
              <option value="GOLD">Gold</option>
              <option value="SILVER">Silver</option>
              <option value="PLATINUM">Platinum</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] px-3 py-2 focus:outline-none focus:border-[#C5A059]/50"
            >
              <option value="ALL">All Categories</option>
              <option value="Rings">Rings</option>
              <option value="Necklaces">Necklaces</option>
              <option value="Chains">Chains</option>
              <option value="Bangles">Bangles</option>
              <option value="Coins & Bullion">Coins & Bullion</option>
            </select>
          </div>
        </div>
      </GlassCard>

      {/* Catalogue List */}
      <div className="space-y-4">
        {filteredDesigns.map((design) => {
          const isExpanded = expandedDesignId === design.id;
          return (
            <GlassCard key={design.id} className="overflow-hidden border border-white/[0.08]">
              {/* Design Header Row */}
              <div
                onClick={() => setExpandedDesignId(isExpanded ? null : design.id)}
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/[0.1] bg-black/30 shrink-0">
                    {design.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={design.imageUrl}
                        alt={design.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--text-tertiary)]">
                        <ImageIcon size={18} />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#DFC488] bg-[#C5A059]/15 px-2 py-0.5 rounded border border-[#C5A059]/30">
                        {design.productCode}
                      </span>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {design.name}
                      </h3>
                      <GlassBadge variant="gold" className="text-[10px]">
                        {design.metal} {design.defaultPurity}
                      </GlassBadge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] mt-1.5">
                      <span>Category: <strong className="text-[var(--text-primary)]">{design.category}</strong></span>
                      <span>HSN: <strong className="text-[var(--text-primary)]">{design.hsnCode}</strong></span>
                      <span>
                        Making:{" "}
                        <strong className="text-[var(--text-primary)]">
                          {design.makingType === "PERCENTAGE"
                            ? `${design.standardMaking}%`
                            : `₹${design.standardMaking}/g`}
                        </strong>
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {design.variants?.length || 0} Variants / SKUs
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTargetDesignId(design.id);
                      setIsNewVariantOpen(true);
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-white/[0.08] transition-colors flex items-center gap-1.5"
                  >
                    <Plus size={13} />
                    <span>Add Variant</span>
                  </button>

                  <div className="text-[var(--text-tertiary)]">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </div>
              </div>

              {/* Expanded Variants Section */}
              {isExpanded && (
                <div className="border-t border-white/[0.06] bg-black/20 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 flex items-center gap-2">
                    <Layers size={14} className="text-[#DFC488]" />
                    <span>Sellable Variants & SKU Definitions (Tier 3)</span>
                  </div>

                  {design.variants && design.variants.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {design.variants.map((v) => (
                        <div
                          key={v.id}
                          className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] font-bold text-emerald-400">
                                {v.sku}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  v.isSerialized
                                    ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                    : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                }`}
                              >
                                {v.isSerialized ? "Serialized" : "Master SKU Barcode"}
                              </span>
                            </div>

                            <div className="text-xs font-semibold text-[var(--text-primary)] mt-1">
                              {v.variantName}
                            </div>

                            <div className="text-[11px] text-[var(--text-secondary)] mt-1 space-y-0.5">
                              {v.referenceWeight && (
                                <div>Ref Wt: <strong className="text-[var(--text-primary)]">{v.referenceWeight}g</strong></div>
                              )}
                              {v.masterBarcode && (
                                <div className="font-mono text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                                  <Barcode size={12} />
                                  <span>{v.masterBarcode}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-white/[0.05] flex items-center justify-between">
                            <span className="text-[11px] text-[var(--text-secondary)]">
                              In Stock: <strong className="text-[var(--text-primary)]">{v.stockCount || 0} pcs</strong>
                            </span>

                            {v.masterBarcode && onSelectForBarcodePrint && (
                              <button
                                onClick={() => onSelectForBarcodePrint(v.masterBarcode!)}
                                className="text-[10px] text-[#DFC488] hover:underline flex items-center gap-1"
                              >
                                <Barcode size={11} />
                                <span>Print Tag</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
                      No variants registered yet. Click &quot;Add Variant&quot; to define size or weight variations.
                    </div>
                  )}
                </div>
              )}
            </GlassCard>
          );
        })}
      </div>

      {/* New Product Design Modal */}
      <GlassDialog
        isOpen={isNewDesignOpen}
        onClose={() => setIsNewDesignOpen(false)}
        title="Register Product Design Model (Tier 1 & 2)"
      >
        <form onSubmit={handleCreateDesign} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Product Code (Design Identity) *
              </label>
              <GlassInput
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="e.g. RNG-22K-001"
                required
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Category *
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] px-3 py-2.5 focus:outline-none focus:border-[#C5A059]/50"
              >
                <option value="Rings">Rings</option>
                <option value="Necklaces">Necklaces</option>
                <option value="Chains">Chains</option>
                <option value="Bangles">Bangles</option>
                <option value="Earrings">Earrings</option>
                <option value="Coins & Bullion">Coins & Bullion</option>
                <option value="Utensils">Utensils</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Design Model Name *
            </label>
            <GlassInput
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Royal Calcutta Floral Filigree Gold Ring"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Precious Metal *
              </label>
              <select
                value={newMetal}
                onChange={(e) => setNewMetal(e.target.value as any)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] px-3 py-2.5 focus:outline-none focus:border-[#C5A059]/50"
              >
                <option value="GOLD">Gold</option>
                <option value="SILVER">Silver</option>
                <option value="PLATINUM">Platinum</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Default Purity *
              </label>
              <select
                value={newPurity}
                onChange={(e) => setNewPurity(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] px-3 py-2.5 focus:outline-none focus:border-[#C5A059]/50"
              >
                <option value="24K">24K (99.9%)</option>
                <option value="22K">22K (91.6%)</option>
                <option value="18K">18K (75.0%)</option>
                <option value="14K">14K (58.3%)</option>
                <option value="925">925 Sterling (Silver)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Standard Making
              </label>
              <div className="flex gap-1.5">
                <GlassInput
                  type="number"
                  step="0.1"
                  value={newMakingValue}
                  onChange={(e) => setNewMakingValue(e.target.value)}
                  placeholder="12"
                />
                <select
                  value={newMakingType}
                  onChange={(e) => setNewMakingType(e.target.value as any)}
                  className="bg-white/[0.03] border border-white/[0.08] rounded-xl text-xs text-[var(--text-primary)] px-2 focus:outline-none"
                >
                  <option value="PERCENTAGE">%</option>
                  <option value="PER_GRAM">₹/g</option>
                  <option value="FIXED">₹</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <GlassButton
              type="button"
              onClick={() => setIsNewDesignOpen(false)}
              className="text-xs text-[var(--text-secondary)]"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              className="text-xs bg-[#C5A059]/20 hover:bg-[#C5A059]/30 text-[#DFC488] border border-[#C5A059]/40"
            >
              Create Design Model
            </GlassButton>
          </div>
        </form>
      </GlassDialog>

      {/* New Variant / SKU Modal */}
      <GlassDialog
        isOpen={isNewVariantOpen}
        onClose={() => setIsNewVariantOpen(false)}
        title="Add Sellable Variant / SKU (Tier 3)"
      >
        <form onSubmit={handleCreateVariant} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                SKU Identifier *
              </label>
              <GlassInput
                value={newSku}
                onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                placeholder="e.g. RNG-22K-001-SZ18"
                required
              />
            </div>

            <div>
              <label className="text-xs text-[var(--text-secondary)] mb-1 block">
                Reference Weight (g)
              </label>
              <GlassInput
                type="number"
                step="0.001"
                value={newRefWeight}
                onChange={(e) => setNewRefWeight(e.target.value)}
                placeholder="4.500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Variant Name / Description *
            </label>
            <GlassInput
              value={newVariantName}
              onChange={(e) => setNewVariantName(e.target.value)}
              placeholder="e.g. Size 18 (Yellow Gold, CZ Accent)"
              required
            />
          </div>

          <div>
            <label className="text-xs text-[var(--text-secondary)] mb-1 block">
              Master Barcode (for Non-Serialized Items, e.g. Coins)
            </label>
            <GlassInput
              value={newMasterBarcode}
              onChange={(e) => setNewMasterBarcode(e.target.value.toUpperCase())}
              placeholder="Leave blank for serialized unique piece tags"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isSerialized"
              checked={newIsSerialized}
              onChange={(e) => setNewIsSerialized(e.target.checked)}
              className="rounded border-white/[0.1] bg-white/[0.05] text-[#C5A059] focus:ring-0"
            />
            <label htmlFor="isSerialized" className="text-xs text-[var(--text-secondary)]">
              Piece-level serialization (each ornament receives unique barcode &amp; HUID)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <GlassButton
              type="button"
              onClick={() => setIsNewVariantOpen(false)}
              className="text-xs text-[var(--text-secondary)]"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40"
            >
              Add Variant SKU
            </GlassButton>
          </div>
        </form>
      </GlassDialog>
    </div>
  );
};
