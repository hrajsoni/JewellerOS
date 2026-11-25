"use client";

import React, { useState, useEffect, useRef } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import {
  StockAuditSession,
  StockItem,
  JewelleryCategory,
} from "../../modules/inventory/types";
import {
  getUniqueTrayLocations,
  startStockAudit,
  scanBarcodeInAudit,
  reconcileStockAudit,
} from "../../modules/inventory/store";
import { useAuth } from "../../modules/auth/AuthContext";
import {
  Barcode,
  Search,
  CheckCircle2,
  AlertTriangle,
  Layers,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  XCircle,
  HelpCircle,
  Clock,
  Printer,
} from "lucide-react";

interface StockAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated: (newStock: StockItem[]) => void;
}

export const StockAuditModal: React.FC<StockAuditModalProps> = ({
  isOpen,
  onClose,
  onStockUpdated,
}) => {
  const { user } = useAuth();
  const [trays, setTrays] = useState<string[]>([]);
  const [selectedTray, setSelectedTray] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [session, setSession] = useState<StockAuditSession | null>(null);
  const [scanInput, setScanInput] = useState<string>("");
  const [lastScannedFeedback, setLastScannedFeedback] = useState<{
    message: string;
    type: "success" | "warning" | "error";
  } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const availableTrays = getUniqueTrayLocations(user?.businessId);
      setTrays(availableTrays);
      setSession(null);
      setLastScannedFeedback(null);
    }
  }, [isOpen, user?.businessId]);

  useEffect(() => {
    if (session && session.status === "in_progress") {
      barcodeInputRef.current?.focus();
    }
  }, [session]);

  if (!isOpen) return null;

  const handleStartAudit = () => {
    const newSession = startStockAudit(
      selectedTray,
      selectedCategory,
      user?.fullName || "Showroom Operator",
      user?.businessId
    );
    setSession(newSession);
    setLastScannedFeedback({
      message: `Audit session initiated for ${selectedTray === "ALL" ? "All Trays" : selectedTray} (${newSession.expectedCount} items expected).`,
      type: "success",
    });
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !scanInput.trim()) return;

    const res = scanBarcodeInAudit(session, scanInput.trim());
    setSession(res.updatedSession);
    setScanInput("");

    if (res.isAlreadyScanned) {
      setLastScannedFeedback({
        message: `⚠️ Item ${res.matchedItem?.sku} (${res.matchedItem?.barcode}) was already scanned!`,
        type: "warning",
      });
    } else if (res.isSurplus) {
      setLastScannedFeedback({
        message: `⚡ Surplus / Untracked item detected: Barcode ${scanInput.trim()} does not belong to this tray.`,
        type: "warning",
      });
    } else {
      setLastScannedFeedback({
        message: `✅ Verified: ${res.matchedItem?.name} · ${res.matchedItem?.grossWeight.toFixed(3)}g`,
        type: "success",
      });
    }
  };

  const handleReconcile = (missingAction: "flag_missing" | "keep_unchanged") => {
    if (!session) return;
    const operator = {
      id: user?.id || "operator",
      fullName: user?.fullName || "Staff",
      role: user?.role || "OWNER",
    };

    const res = reconcileStockAudit(session, missingAction, operator, user?.businessId);
    setSession(res.reconciledSession);
    onStockUpdated(res.updatedStock);
    setLastScannedFeedback({
      message:
        missingAction === "flag_missing"
          ? `Audit finalized: ${session.missingCount} missing items flagged in Discrepancy Ledger.`
          : `Audit completed: All records preserved unchanged.`,
      type: "success",
    });
  };

  const CATEGORIES: JewelleryCategory[] = [
    "Chains",
    "Bangles & Kadas",
    "Rings",
    "Necklaces & Sets",
    "Earrings & Jhumkas",
    "Mangalsutras",
    "Pendants",
    "Coins & Bullion",
    "Silver Articles & Payal",
    "Other",
  ];

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Stock Audit & Tray Reconciliation (DEF-018)"
      description="Scan showcase trays, detect physical inventory discrepancies, and reconcile missing or surplus jewellery pieces."
      maxWidth="xl"
    >
      <div className="space-y-5">
        {/* Step 1: Configuration Screen */}
        {!session && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Select Tray / Display Showcase
                </label>
                <select
                  value={selectedTray}
                  onChange={(e) => setSelectedTray(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="ALL">Showroom All Trays & Vaults</option>
                  {trays.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
                  Category Filter
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3.5 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="ALL">All Categories</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-xs text-[var(--text-secondary)]">
                <ShieldCheck size={16} className="text-[#DFC488]" />
                <span>
                  Audit Mode: <strong className="text-[var(--text-primary)]">Blind Count Scan</strong>.
                  Auditor: {user?.fullName} ({user?.role})
                </span>
              </div>
              <GlassButton variant="primary" size="md" onClick={handleStartAudit}>
                Start Tray Audit
              </GlassButton>
            </div>
          </div>
        )}

        {/* Step 2: Live Scanning Screen */}
        {session && (
          <div className="space-y-4">
            {/* Stat Counters */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-center">
                <div className="text-[10px] uppercase font-semibold text-[var(--text-tertiary)]">
                  Expected Pieces
                </div>
                <div className="text-xl font-bold font-mono text-[var(--text-primary)] mt-0.5">
                  {session.expectedCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="text-[10px] uppercase font-semibold text-emerald-400">
                  Scanned & Found
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                  {session.scannedCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="text-[10px] uppercase font-semibold text-amber-400">
                  Unscanned / Missing
                </div>
                <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                  {session.missingCount}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center">
                <div className="text-[10px] uppercase font-semibold text-purple-400">
                  Surplus / Untracked
                </div>
                <div className="text-xl font-bold font-mono text-purple-400 mt-0.5">
                  {session.surplusCount}
                </div>
              </div>
            </div>

            {/* Barcode Scan Input */}
            {session.status === "in_progress" && (
              <form onSubmit={handleScanSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Scan barcode tag or type SKU (e.g. 8901840001 or CHN-18K-084)..."
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    className="w-full bg-black/60 border-2 border-[#C5A059] rounded-xl px-4 py-3 text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[#C5A059]/40 shadow-inner"
                    autoFocus
                  />
                  <Barcode
                    size={18}
                    className="absolute right-3.5 top-3.5 text-[#DFC488] opacity-80"
                  />
                </div>
                <GlassButton variant="primary" size="md" type="submit">
                  Verify Item
                </GlassButton>
              </form>
            )}

            {/* Live Scan Feedback Toast */}
            {lastScannedFeedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 border ${
                  lastScannedFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : lastScannedFeedback.type === "warning"
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {lastScannedFeedback.type === "success" ? (
                  <CheckCircle2 size={15} className="shrink-0" />
                ) : (
                  <AlertTriangle size={15} className="shrink-0" />
                )}
                <span>{lastScannedFeedback.message}</span>
              </div>
            )}

            {/* Item List Matrix */}
            <div className="border border-white/[0.08] rounded-xl overflow-hidden max-h-[260px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/[0.04] text-[var(--text-secondary)] border-b border-white/[0.08] sticky top-0">
                  <tr>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Barcode / SKU</th>
                    <th className="p-2.5">Ornament Name</th>
                    <th className="p-2.5 text-right">Gross Wt</th>
                    <th className="p-2.5">Tray Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {session.items.map((item) => (
                    <tr
                      key={item.stockItemId}
                      className={
                        item.isFound
                          ? "bg-emerald-500/[0.04]"
                          : "hover:bg-white/[0.02]"
                      }
                    >
                      <td className="p-2.5">
                        {item.isFound ? (
                          <GlassBadge variant="emerald">
                            <CheckCircle2 size={11} className="mr-1 inline" /> Verified
                          </GlassBadge>
                        ) : (
                          <GlassBadge variant="coral">
                            <Clock size={11} className="mr-1 inline" /> Pending
                          </GlassBadge>
                        )}
                      </td>
                      <td className="p-2.5 font-mono text-[var(--text-primary)]">
                        <div>{item.barcode}</div>
                        <div className="text-[10px] text-[var(--text-tertiary)]">{item.sku}</div>
                      </td>
                      <td className="p-2.5 text-[var(--text-secondary)] font-medium">
                        {item.name}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[var(--text-primary)]">
                        {item.grossWeight.toFixed(3)}g
                      </td>
                      <td className="p-2.5 text-[var(--text-tertiary)] text-[11px]">
                        {item.trayLocation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/[0.08]">
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setSession(null)}
                className="text-[var(--text-secondary)]"
              >
                <RotateCcw size={14} className="mr-1.5" /> Start New Tray
              </GlassButton>

              {session.status === "in_progress" && (
                <div className="flex items-center gap-2">
                  {session.missingCount > 0 ? (
                    <>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={() => handleReconcile("keep_unchanged")}
                      >
                        Keep Records (Unchanged)
                      </GlassButton>
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        className="text-red-400 border-red-500/30 hover:bg-red-500/10"
                        onClick={() => handleReconcile("flag_missing")}
                      >
                        Flag {session.missingCount} Missing as Lost/Damaged
                      </GlassButton>
                    </>
                  ) : (
                    <GlassButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleReconcile("keep_unchanged")}
                    >
                      <CheckCircle2 size={14} className="mr-1.5" /> Reconcile 100% Match
                    </GlassButton>
                  )}
                </div>
              )}

              {session.status !== "in_progress" && (
                <GlassButton variant="primary" size="sm" onClick={onClose}>
                  Done & Close Audit
                </GlassButton>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassDialog>
  );
};
