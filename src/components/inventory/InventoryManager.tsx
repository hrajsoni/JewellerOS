"use client";

import React, { useState, useRef, useEffect } from "react";
import { StockItem, JewelleryCategory, StockStatus, StockMovementRecord } from "../../modules/inventory/types";
import { formatINR, formatGrams } from "../../lib/formatters";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassBadge } from "../glass/GlassBadge";
import { JewelleryBarcodeTag } from "./JewelleryBarcodeTag";
import { BulkStockImportModal } from "./BulkStockImportModal";
import { StockMovementModal } from "./StockMovementModal";
import {
  generateBarcodeForIndex,
  generateSkuForCategory,
  getStockMovements,
  updateStockItemStatus,
} from "../../modules/inventory/store";
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
  Barcode,
  FileSpreadsheet,
  ArrowRightLeft,
  Printer,
  History,
  X,
} from "lucide-react";
import { useAuth } from "../../modules/auth/AuthContext";

export interface InventoryManagerProps {
  stockItems: StockItem[];
  onAddStockItem: (item: StockItem) => void;
  onBulkImportStockItems?: (items: StockItem[]) => void;
  onUpdateStockItemStatus?: (
    stockItemId: string,
    newStatus: StockStatus,
    reason: string,
    newLocation?: string
  ) => void;
  onLoadIntoCalculator: (item: StockItem) => void;
  currentGoldRate: number;
  shopName?: string;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  stockItems,
  onAddStockItem,
  onBulkImportStockItems,
  onUpdateStockItemStatus,
  onLoadIntoCalculator,
  currentGoldRate,
  shopName = "Sandhya Jewellers",
}) => {
  const { user, hasPermission } = useAuth();
  const canViewCosts = hasPermission("VIEW_PURCHASE_COSTS");

  const [searchQuery, setSearchQuery] = useState("");
  const [metalFilter, setMetalFilter] = useState<"all" | "gold" | "silver">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Barcode Gun Quick Scan State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [scannedItem, setScannedItem] = useState<StockItem | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [activeTagItem, setActiveTagItem] = useState<StockItem | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [activeMovementItem, setActiveMovementItem] = useState<StockItem | null>(null);
  const [movements, setMovements] = useState<StockMovementRecord[]>([]);

  useEffect(() => {
    setMovements(getStockMovements());
  }, [stockItems]);

  // New item form state
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<JewelleryCategory>("Chains");
  const [metal, setMetal] = useState<"gold" | "silver">("gold");
  const [purity, setPurity] = useState("18K");
  const [grossWeight, setGrossWeight] = useState("10.0");
  const [stoneWeight, setStoneWeight] = useState("0");
  const [otherDeductions, setOtherDeductions] = useState("0");
  const [acquisitionCost, setAcquisitionCost] = useState("112500");
  const [makingVal, setMakingVal] = useState("18");
  const [trayLocation, setTrayLocation] = useState("Tray #2 · Main Counter");

  // Barcode Scanner Handler
  const handleBarcodeScan = (e: React.FormEvent) => {
    e.preventDefault();
    const query = barcodeInput.trim().toLowerCase();
    if (!query) return;

    const found = stockItems.find(
      (item) =>
        item.barcode?.toLowerCase() === query ||
        item.sku.toLowerCase() === query ||
        item.sku.toLowerCase().replace(/[^a-z0-9]/g, "") === query.replace(/[^a-z0-9]/g, "")
    );

    if (found) {
      setScannedItem(found);
      setBarcodeInput("");
    } else {
      setScannedItem(null);
    }
  };

  // Filtered items
  const filtered = stockItems.filter((item) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.sku.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q)) ||
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
    const deductions = parseFloat(otherDeductions) || 0;
    const net = Math.max(0, gross - stone - deductions);
    const cost = parseFloat(acquisitionCost) || 0;
    const making = parseFloat(makingVal) || 18;

    const assignedSku = sku.trim() || generateSkuForCategory(category, purity, stockItems.length + 1);
    const assignedBarcode = generateBarcodeForIndex(stockItems.length + 10);

    const purityFactor = purity.includes("24K") ? 1 : purity.includes("22K") ? 0.9167 : purity.includes("18K") ? 0.75 : purity.includes("14K") ? 0.585 : 0.925;
    const fine = Number((net * purityFactor).toFixed(3));

    const newItem: StockItem = {
      id: `stock-${Date.now()}`,
      sku: assignedSku,
      barcode: assignedBarcode,
      name,
      category,
      metal,
      purity: purity as any,
      purityDisplay: `${purity}`,
      grossWeight: Number(gross.toFixed(3)),
      stoneWeight: Number(stone.toFixed(3)),
      otherDeductions: Number(deductions.toFixed(3)),
      netWeight: Number(net.toFixed(3)),
      fineWeight: fine,
      hsnCode: "7113",
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
    setGrossWeight("10.0");
    setStoneWeight("0");
    setOtherDeductions("0");
  };

  const handleOpenTag = (item: StockItem) => {
    setActiveTagItem(item);
    setIsTagModalOpen(true);
  };

  const handleOpenMovement = (item: StockItem) => {
    setActiveMovementItem(item);
    setIsMovementModalOpen(true);
  };

  const handleUpdateStatus = (
    stockItemId: string,
    newStatus: StockStatus,
    reason: string,
    newLocation?: string
  ) => {
    if (onUpdateStockItemStatus) {
      onUpdateStockItemStatus(stockItemId, newStatus, reason, newLocation);
    } else {
      const res = updateStockItemStatus(stockItemId, newStatus, reason, user, newLocation);
      if (res) {
        setMovements(getStockMovements());
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Jewellery Stock & Vault Inventory
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Physical serialized ornaments, thermal tag barcodes, and real-time vault movements
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => setIsBulkModalOpen(true)}
            icon={<FileSpreadsheet size={14} />}
          >
            Bulk Import (Excel/CSV)
          </GlassButton>

          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => setIsAddModalOpen(true)}
            icon={<Plus size={14} />}
          >
            Add New Ornament
          </GlassButton>
        </div>
      </div>

      {/* Barcode Gun Quick Scan Bar */}
      <div className="p-3.5 rounded-2xl bg-black/40 border border-[#C5A059]/25 backdrop-blur-xl space-y-3">
        <form onSubmit={handleBarcodeScan} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Barcode size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#DFC488]" />
            <input
              ref={scanInputRef}
              type="text"
              placeholder="Point Barcode Scanner Gun here or type SKU (e.g. CHN-18K-084, 8901840001) & press Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.1] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#C5A059] focus:outline-none focus:ring-1 focus:ring-[#C5A059] transition-all"
            />
          </div>
          <GlassButton type="submit" variant="secondary" size="md">
            Scan / Search
          </GlassButton>
        </form>

        {/* Live Scanned Ornament Card */}
        {scannedItem && (
          <div className="p-3 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#C5A059]/20 flex items-center justify-center text-[#DFC488] font-bold text-xs shrink-0">
                <Tag size={18} />
              </div>
              <div>
                <div className="font-semibold text-xs text-[var(--text-primary)] flex items-center gap-2">
                  <span>{scannedItem.name}</span>
                  <span className="font-mono text-[10px] text-[#DFC488] bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.06]">
                    {scannedItem.sku}
                  </span>
                  <GlassBadge variant={scannedItem.status === "in_showcase" ? "emerald" : "gold"} size="sm">
                    {scannedItem.status.replace("_", " ")}
                  </GlassBadge>
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] font-mono mt-0.5">
                  GW: {scannedItem.grossWeight}g · NW: {scannedItem.netWeight}g · Purity: {scannedItem.purityDisplay} · Location: {scannedItem.trayLocation}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => onLoadIntoCalculator(scannedItem)}
                className="px-2.5 py-1.5 rounded-lg bg-[#C5A059] text-black text-xs font-semibold hover:bg-[#DFC488] transition-all flex items-center gap-1.5"
              >
                <Calculator size={13} />
                <span>Load to Counter Bill</span>
              </button>
              <button
                onClick={() => handleOpenTag(scannedItem)}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs font-medium text-[var(--text-primary)] transition-all flex items-center gap-1.5"
              >
                <Printer size={13} />
                <span>Tag</span>
              </button>
              <button
                onClick={() => setScannedItem(null)}
                className="p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-white"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}
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
          <div className="p-1 rounded-lg bg-black/40 border border-white/[0.06] flex items-center gap-1">
            <button
              onClick={() => setMetalFilter("all")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                metalFilter === "all"
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Metals
            </button>
            <button
              onClick={() => setMetalFilter("gold")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                metalFilter === "gold"
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Gold
            </button>
            <button
              onClick={() => setMetalFilter("silver")}
              className={`px-3 py-1 rounded text-xs transition-colors ${
                metalFilter === "silver"
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Silver
            </button>
          </div>

          {/* Status Filter */}
          <div className="p-1 rounded-lg bg-black/40 border border-white/[0.06] flex items-center gap-1">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === "all"
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All ({stockItems.length})
            </button>
            <button
              onClick={() => setStatusFilter("in_showcase")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === "in_showcase"
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Showcase
            </button>
            <button
              onClick={() => setStatusFilter("in_vault")}
              className={`px-2.5 py-1 rounded text-xs transition-colors ${
                statusFilter === "in_vault"
                  ? "bg-[#C5A059]/20 text-[#DFC488] font-semibold"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Vault Safe
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:w-64">
          <GlassInput
            placeholder="Search SKU, barcode, tray..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            prefixSymbol={<Search size={14} className="text-[var(--text-tertiary)]" />}
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="rounded-xl border border-white/[0.06] bg-[var(--surface-primary)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] text-[var(--text-tertiary)] uppercase tracking-wider text-[11px] bg-black/20">
                <th className="py-3 px-4 font-semibold">SKU & Barcode</th>
                <th className="py-3 px-4 font-semibold">Ornament & Category</th>
                <th className="py-3 px-4 font-semibold text-center">Purity</th>
                <th className="py-3 px-4 font-semibold text-right">Gross Wt</th>
                <th className="py-3 px-4 font-semibold text-right">Net Wt</th>
                <th className="py-3 px-4 font-semibold">Tray / Vault</th>
                <th className="py-3 px-4 font-semibold text-right">
                  {canViewCosts ? "Wholesale Cost" : "Cost"}
                </th>
                <th className="py-3 px-4 font-semibold text-right">Counter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[var(--text-tertiary)]">
                    No matching jewellery pieces in stock.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-[var(--text-primary)]">
                        {item.sku}
                      </div>
                      <div className="font-mono text-[10px] text-[#DFC488] flex items-center gap-1">
                        <Barcode size={10} />
                        <span>{item.barcode || item.sku}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[var(--text-primary)]">
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                        <span>{item.category}</span>
                        {item.diamondCarats ? (
                          <span className="text-[10px] text-cyan-400 font-mono">
                            · {item.diamondCarats}ct Dia
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono px-2 py-0.5 rounded text-[11px] bg-white/[0.04] text-[#DFC488] border border-white/[0.06]">
                        {item.purityDisplay || item.purity}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                      {item.grossWeight.toFixed(3)}g
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-[var(--text-primary)]">
                      {formatGrams(item.netWeight)}
                    </td>
                    <td className="py-3 px-4 text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={11} className="text-[#DFC488]" />
                        <span>{item.trayLocation}</span>
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)]">
                        Status: {item.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-[var(--text-secondary)]">
                      {canViewCosts ? (
                        formatINR(item.acquisitionCost)
                      ) : (
                        <span className="text-[10px] text-[var(--text-tertiary)] font-mono flex items-center justify-end gap-1">
                          <EyeOff size={10} className="text-amber-400/70" /> ••••••
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onLoadIntoCalculator(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#C5A059]/10 text-[#DFC488] border border-[#C5A059]/30 hover:bg-[#C5A059] hover:text-[#08090C] transition-all font-medium text-[11px]"
                          title="Calculate Counter Price for Customer"
                        >
                          <Calculator size={12} />
                          <span>Bill</span>
                        </button>

                        <button
                          onClick={() => handleOpenTag(item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white transition-all text-[11px]"
                          title="Print Thermal Barcode Tag"
                        >
                          <Tag size={12} />
                          <span>Tag</span>
                        </button>

                        <button
                          onClick={() => handleOpenMovement(item)}
                          className="inline-flex items-center gap-1 p-1 rounded bg-white/[0.04] text-[var(--text-secondary)] border border-white/[0.08] hover:bg-white/[0.1] hover:text-white transition-all text-[11px]"
                          title="Transfer / Change Location"
                        >
                          <ArrowRightLeft size={12} />
                        </button>
                      </div>
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
              label="Custom SKU (Leave blank to auto-generate)"
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
                <option value="Earrings & Jhumkas">Earrings & Jhumkas</option>
                <option value="Mangalsutras">Mangalsutras</option>
                <option value="Silver Articles & Payal">Silver Articles & Payal</option>
                <option value="Coins & Bullion">Coins & Bullion</option>
                <option value="Other">Other</option>
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
              label="Other (Lac/Enamel/Wax g)"
              type="number"
              step="0.001"
              suffixSymbol="g"
              value={otherDeductions}
              onChange={(e) => setOtherDeductions(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassInput
              label="Wholesale Cost (₹)"
              type="number"
              prefixSymbol="₹"
              required
              value={acquisitionCost}
              onChange={(e) => setAcquisitionCost(e.target.value)}
            />
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

      {/* Jewellery Barcode Tag Printable Modal */}
      <JewelleryBarcodeTag
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        item={activeTagItem}
        shopName={shopName}
      />

      {/* Bulk Stock Import Modal */}
      <BulkStockImportModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onImportItems={(imported) => {
          if (onBulkImportStockItems) {
            onBulkImportStockItems(imported);
          } else {
            imported.forEach((it) => onAddStockItem(it));
          }
        }}
        existingCount={stockItems.length}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        item={activeMovementItem}
        onUpdateStatus={handleUpdateStatus}
        movementHistory={movements}
      />
    </div>
  );
};
