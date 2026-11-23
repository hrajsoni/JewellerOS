"use client";

import React, { useState } from "react";
import { StockItem, JewelleryCategory, StockStatus } from "../../modules/inventory/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import {
  Package,
  Plus,
  Search,
  Calculator,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Tag,
  MapPin,
  Sparkles,
  EyeOff,
  Lock,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";

export interface InventoryManagerProps {
  stockItems: StockItem[];
  onAddStockItem: (item: StockItem) => void;
  onLoadIntoCalculator: (item: StockItem) => void;
  currentGoldRate: number;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  stockItems,
  onAddStockItem,
  onLoadIntoCalculator,
  currentGoldRate,
}) => {
  const { hasPermission } = useAuth();
  const canViewCosts = hasPermission("VIEW_PURCHASE_COSTS");

  const [searchQuery, setSearchQuery] = useState("");
  const [metalFilter, setMetalFilter] = useState<"all" | "gold" | "silver">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New item form state
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<JewelleryCategory>("Chains");
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const [purity, setPurity] = useState("18K");
  const [grossWeight, setGrossWeight] = useState("10.0");
  const [stoneWeight, setStoneWeight] = useState("0");
  const [acquisitionCost, setAcquisitionCost] = useState("112500");
  const [makingVal, setMakingVal] = useState("18");
  const [trayLocation, setTrayLocation] = useState("Tray #2 · Main Counter");

  // Filtered items
  const filtered = stockItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.sku.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.trayLocation.toLowerCase().includes(q);
    const matchesMetal = metalFilter === "all" || item.metal === metalFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    return matchesSearch && matchesMetal && matchesStatus;
  });

  // Calculate aggregate weights
  const totalGoldGrams = stockItems
    .filter((i) => i.metal === "gold" && i.status !== "sold")
    .reduce((acc, i) => acc + i.netWeight, 0);

  const totalSilverGrams = stockItems
    .filter((i) => i.metal === "silver" && i.status !== "sold")
    .reduce((acc, i) => acc + i.netWeight, 0);

  const totalValuation = stockItems
    .filter((i) => i.status !== "sold")
    .reduce((acc, i) => acc + i.acquisitionCost, 0);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const gross = parseFloat(grossWeight) || 0;
    const stone = parseFloat(stoneWeight) || 0;
    const net = Math.max(0, gross - stone);
    const cost = parseFloat(acquisitionCost) || 0;
    const making = parseFloat(makingVal) || 18;

    const newItem: StockItem = {
      id: `stock-${Date.now()}`,
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
      name,
      category,
      metal,
      purity: purity as any,
      purityDisplay: `${purity}`,
      grossWeight: gross,
      stoneWeight: stone,
      netWeight: net,
      acquisitionCost: cost,
      defaultMakingType: "percentage",
      defaultMakingValue: making,
      trayLocation,
      status: "in_showcase",
      dateAdded: new Date().toISOString().split("T")[0],
    };

    onAddStockItem(newItem);
    setIsAddModalOpen(false);
    // Reset form
    setName("");
    setSku("");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Jewellery Stock & Vault Inventory
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Real-time showcase pieces, vault metal holdings, and counter load integration
          </p>
        </div>
        <GlassButton
          variant="primary"
          size="sm"
          onClick={() => setIsAddModalOpen(true)}
          icon={<Plus size={14} />}
        >
          Add New Ornament
        </GlassButton>
      </div>

      {/* Aggregate Vault & Showcase Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Total Gold in Shop
          </span>
          <div className="text-2xl font-semibold text-[#DFC488] num-tabular">
            {formatGrams(totalGoldGrams)}
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Across Showcase Trays & Safe Vaults
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Total Silver in Shop
          </span>
          <div className="text-2xl font-semibold text-[var(--text-primary)] num-tabular">
            {(totalSilverGrams / 1000).toFixed(3)} kg
          </div>
          <span className="text-[11px] text-[var(--text-secondary)] block">
            Payals, utensils, and coins
          </span>
        </div>

        <div className="p-5 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-1">
          <span className="text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
            Wholesale Asset Valuation
          </span>
          {canViewCosts ? (
            <div className="text-2xl font-semibold text-[var(--accent-emerald)] num-tabular">
              {formatINR(totalValuation)}
            </div>
          ) : (
            <div className="text-sm font-medium text-amber-400/90 flex items-center gap-1.5 py-1">
              <EyeOff size={14} />
              <span>Masked (Sales Mode)</span>
            </div>
          )}
          <span className="text-[11px] text-[var(--text-secondary)] block">
            {stockItems.filter((i) => i.status !== "sold").length} Live Active Pieces
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Metal Filter */}
          <div className="inline-flex p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
            {(["all", "gold", "silver"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetalFilter(m)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition-all ${
                  metalFilter === m
                    ? "bg-[#C5A059] text-[#08090C] font-semibold"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg px-3 py-1.5 text-xs bg-black/40 border border-white/[0.08] text-[var(--text-secondary)] font-medium"
          >
            <option value="all">All Locations</option>
            <option value="in_showcase">Showcase Only</option>
            <option value="in_vault">Vault Only</option>
            <option value="sold">Sold Items</option>
          </select>
        </div>

        <div className="w-full sm:w-72">
          <GlassInput
            placeholder="Search SKU, name, or tray..."
            prefixSymbol={<Search size={14} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[var(--surface-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-tertiary)] uppercase tracking-wider text-[11px] bg-black/20">
                <th className="py-3 px-4 font-semibold">SKU / Tag</th>
                <th className="py-3 px-4 font-semibold">Ornament & Category</th>
                <th className="py-3 px-4 font-semibold text-center">Purity</th>
                <th className="py-3 px-4 font-semibold text-right">Net Wt</th>
                <th className="py-3 px-4 font-semibold">Tray / Vault</th>
                <th className="py-3 px-4 font-semibold text-right">
                  {canViewCosts ? "Wholesale Cost" : "Cost"}
                </th>
                <th className="py-3 px-4 font-semibold text-right">Counter Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[var(--text-tertiary)]">
                    No matching jewellery pieces in stock.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-semibold text-[var(--text-primary)]">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)]">
                        {item.category}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-mono px-2 py-0.5 rounded text-[11px] bg-white/[0.04] text-[#DFC488] border border-white/[0.06]">
                        {item.purityDisplay || item.purity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                      {formatGrams(item.netWeight)}
                    </td>
                    <td className="py-3.5 px-4 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-[#DFC488]" />
                        <span>{item.trayLocation}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[var(--text-secondary)]">
                      {canViewCosts ? (
                        formatINR(item.acquisitionCost)
                      ) : (
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono flex items-center justify-end gap-1">
                          <EyeOff size={10} className="text-amber-400/70" /> ••••••
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onLoadIntoCalculator(item)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#C5A059]/10 text-[#DFC488] border border-[#C5A059]/30 hover:bg-[#C5A059] hover:text-[#08090C] transition-all font-medium text-[11px]"
                        title="Calculate Counter Price for Customer"
                      >
                        <Calculator size={13} />
                        <span>Calculate Price</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Ornament Dialog */}
      <GlassDialog
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Jewellery Ornament to Stock"
        description="Record gross weight, Karat purity, wholesale cost and display tray"
        maxWidth="lg"
      >
        <form onSubmit={handleAddItem} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Ornament Name"
              placeholder="e.g. 18K Italian Chain"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <GlassInput
              label="SKU / Barcode"
              placeholder="e.g. CHN-18K-099"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1.5 block">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as JewelleryCategory)}
                className="w-full rounded-lg px-3 py-2 text-xs bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="Chains">Chains</option>
                <option value="Bangles & Kadas">Bangles & Kadas</option>
                <option value="Rings">Rings</option>
                <option value="Necklaces & Sets">Necklaces & Sets</option>
                <option value="Mangalsutras">Mangalsutras</option>
                <option value="Silver Articles & Payal">Silver Articles & Payal</option>
                <option value="Coins & Bullion">Coins & Bullion</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1.5 block">
                Metal
              </label>
              <select
                value={metal}
                onChange={(e) => setMetal(e.target.value as "gold" | "silver")}
                className="w-full rounded-lg px-3 py-2 text-xs bg-black/40 border border-white/[0.08] text-[var(--text-primary)]"
              >
                <option value="gold">Gold</option>
                <option value="silver">Silver</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-1.5 block">
                Purity
              </label>
              <select
                value={purity}
                onChange={(e) => setPurity(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-xs bg-black/40 border border-white/[0.08] text-[var(--text-primary)] font-mono"
              >
                {metal === "gold" ? (
                  <>
                    <option value="18K">18K (75%)</option>
                    <option value="22K">22K (22/24)</option>
                    <option value="24K">24K (100%)</option>
                    <option value="23K">23K (23/24)</option>
                    <option value="14K">14K (14/24)</option>
                  </>
                ) : (
                  <>
                    <option value="925">925 Sterling</option>
                    <option value="999">999 Fine Silver</option>
                    <option value="900">900 Coin Silver</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassInput
              label="Gross Weight (g)"
              type="number"
              step="0.001"
              required
              suffixSymbol="g"
              value={grossWeight}
              onChange={(e) => setGrossWeight(e.target.value)}
            />
            <GlassInput
              label="Stone Deduction (g)"
              type="number"
              step="0.001"
              suffixSymbol="g"
              value={stoneWeight}
              onChange={(e) => setStoneWeight(e.target.value)}
            />
            <GlassInput
              label="Wholesale Cost (₹)"
              type="number"
              prefixSymbol="₹"
              required
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Default Making Charge (%)"
              type="number"
              suffixSymbol="%"
              value={makingVal}
              onChange={(e) => setMakingVal(e.target.value)}
            />
            <GlassInput
              label="Display Location / Tray"
              value={trayLocation}
              onChange={(e) => setTrayLocation(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.06]">
            <GlassButton
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit" variant="primary" size="sm">
              Save Ornament to Stock
            </GlassButton>
          </div>
        </form>
      </GlassDialog>
    </div>
  );
};
