"use client";

import React, { useState, useEffect } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import { useAuth } from "../../modules/auth/AuthContext";
import { MetalRateRecord } from "../../modules/rates/types";
import {
  getLatestMetalRates,
  getMetalRatesHistory,
  recordNewMetalRates,
  derivePuritiesFrom24k,
  deriveSilver925From999,
} from "../../modules/rates/store";
import { formatINR } from "../../lib/formatters";
import {
  TrendingUp,
  TrendingDown,
  History,
  Clock,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Coins,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

export interface MetalRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRatesUpdated?: (record: MetalRateRecord) => void;
}

export const MetalRatesModal: React.FC<MetalRatesModalProps> = ({
  isOpen,
  onClose,
  onRatesUpdated,
}) => {
  const { user, hasPermission, openLoginModal } = useAuth();
  const canManageRates = hasPermission("MANAGE_METAL_RATES");

  const [activeTab, setActiveTab] = useState<"board" | "history">("board");
  const [history, setHistory] = useState<MetalRateRecord[]>([]);
  const [activeRecord, setActiveRecord] = useState<MetalRateRecord>(getLatestMetalRates);

  // Form Inputs
  const [gold24k, setGold24k] = useState<string>("150000");
  const [autoDerive, setAutoDerive] = useState<boolean>(true);
  const [gold22k, setGold22k] = useState<string>("137500");
  const [gold18k, setGold18k] = useState<string>("112500");
  const [gold14k, setGold14k] = useState<string>("87500");

  const [silver999, setSilver999] = useState<string>("95000");
  const [silver925, setSilver925] = useState<string>("87875");
  const [platinum950, setPlatinum950] = useState<string>("3650");

  // Buyback rates
  const [showBuyback, setShowBuyback] = useState<boolean>(false);
  const [goldPurchase24k, setGoldPurchase24k] = useState<string>("147500");
  const [goldPurchase22k, setGoldPurchase22k] = useState<string>("135000");
  const [silverPurchase, setSilverPurchase] = useState<string>("92000");

  const [notes, setNotes] = useState<string>("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load latest on open
  useEffect(() => {
    if (isOpen) {
      const hist = getMetalRatesHistory();
      setHistory(hist);
      const latest = hist[0] || getLatestMetalRates();
      setActiveRecord(latest);

      setGold24k(latest.gold24k.toString());
      setGold22k(latest.gold22k.toString());
      setGold18k(latest.gold18k.toString());
      setGold14k(latest.gold14k.toString());
      setSilver999(latest.silver999PerKg.toString());
      setSilver925(latest.silver925PerKg.toString());
      setPlatinum950((latest.platinum950PerGram || 3650).toString());

      setGoldPurchase24k(latest.goldPurchase24k.toString());
      setGoldPurchase22k(latest.goldPurchase22k.toString());
      setSilverPurchase(latest.silverPurchasePerKg.toString());
    }
  }, [isOpen]);

  // Real-time derivation when 24K changes
  const handleGold24kChange = (val: string) => {
    setGold24k(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && autoDerive) {
      const derived = derivePuritiesFrom24k(num);
      setGold22k(derived.gold22k.toString());
      setGold18k(derived.gold18k.toString());
      setGold14k(derived.gold14k.toString());

      setGoldPurchase24k(Math.round(num * 0.983).toString());
      setGoldPurchase22k(Math.round(derived.gold22k * 0.982).toString());
    }
  };

  const handleSilver999Change = (val: string) => {
    setSilver999(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0 && autoDerive) {
      const derived925 = deriveSilver925From999(num);
      setSilver925(derived925.toString());
      setSilverPurchase(Math.round(num * 0.97).toString());
    }
  };

  const handleSaveRates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageRates) return;

    const g24 = parseFloat(gold24k);
    const s999 = parseFloat(silver999);

    if (isNaN(g24) || g24 <= 0 || isNaN(s999) || s999 <= 0) {
      setToastMsg("Please enter valid positive values for gold and silver rates.");
      return;
    }

    const res = recordNewMetalRates(
      {
        gold24k: g24,
        gold22k: parseFloat(gold22k) || undefined,
        gold18k: parseFloat(gold18k) || undefined,
        gold14k: parseFloat(gold14k) || undefined,
        goldPurchase24k: parseFloat(goldPurchase24k) || undefined,
        goldPurchase22k: parseFloat(goldPurchase22k) || undefined,
        silver999PerKg: s999,
        silver925PerKg: parseFloat(silver925) || undefined,
        silverPurchasePerKg: parseFloat(silverPurchase) || undefined,
        platinum950PerGram: parseFloat(platinum950) || undefined,
        autoDerivePurities: autoDerive,
        notes: notes.trim() || undefined,
      },
      user
    );

    if (res.record) {
      setActiveRecord(res.record);
      setHistory(getMetalRatesHistory());
      onRatesUpdated?.(res.record);
      setToastMsg("Rates updated & recorded to immutable audit ledger!");
      setTimeout(() => {
        setToastMsg(null);
        onClose();
      }, 900);
    }
  };

  if (!isOpen) return null;

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Sarafa Market Rates & Price Registry"
      description="Live showroom board rates and historical price audit trail. Old transactions snapshot the rate at execution time."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* Top Tab Switcher */}
        <div className="flex border-b border-white/[0.08] gap-4">
          <button
            onClick={() => setActiveTab("board")}
            className={`pb-2.5 text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "board"
                ? "text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Coins size={14} />
            <span>Live Showroom Board (आज का भाव)</span>
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-2.5 text-xs font-semibold transition-all flex items-center gap-2 ${
              activeTab === "history"
                ? "text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            <History size={14} />
            <span>Price Audit History ({history.length})</span>
          </button>
        </div>

        {/* Feedback Alert */}
        {toastMsg && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Read-Only Sales Warning if no permission */}
        {!canManageRates && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock size={15} className="text-amber-400 shrink-0" />
              <span>
                Read-Only Mode: Rate adjustments require Manager or Owner authorization.
              </span>
            </div>
            <button
              onClick={openLoginModal}
              className="text-[11px] underline text-[#DFC488] hover:text-white font-medium shrink-0 ml-2"
            >
              Authorize
            </button>
          </div>
        )}

        {/* TAB 1: Live Board */}
        {activeTab === "board" && (
          <form onSubmit={handleSaveRates} className="space-y-4">
            {/* Auto-Derive Toggle Banner */}
            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                  <Sparkles size={13} className="text-[#DFC488]" />
                  <span>Karat Formula Engine (K/24 Exact Ratio)</span>
                </div>
                <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                  Auto-derives 22K (916), 18K (750), 14K (585) & Silver 925 from 24K benchmark
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoDerive}
                  onChange={(e) => setAutoDerive(e.target.checked)}
                  disabled={!canManageRates}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C5A059]"></div>
              </label>
            </div>

            {/* Gold Selling Rates Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Gold Retail Selling Rates (per 10 grams)
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <GlassInput
                  label="24K Fine Gold"
                  type="number"
                  prefixSymbol="₹"
                  value={gold24k}
                  onChange={(e) => handleGold24kChange(e.target.value)}
                  disabled={!canManageRates}
                  required
                />
                <GlassInput
                  label="22K (916 Hallmarked)"
                  type="number"
                  prefixSymbol="₹"
                  value={gold22k}
                  onChange={(e) => setGold22k(e.target.value)}
                  disabled={!canManageRates || autoDerive}
                  helperText={autoDerive ? "Formula Derived" : undefined}
                  required
                />
                <GlassInput
                  label="18K (750 Diamond)"
                  type="number"
                  prefixSymbol="₹"
                  value={gold18k}
                  onChange={(e) => setGold18k(e.target.value)}
                  disabled={!canManageRates || autoDerive}
                  helperText={autoDerive ? "Formula Derived" : undefined}
                  required
                />
                <GlassInput
                  label="14K (585 Light)"
                  type="number"
                  prefixSymbol="₹"
                  value={gold14k}
                  onChange={(e) => setGold14k(e.target.value)}
                  disabled={!canManageRates || autoDerive}
                  helperText={autoDerive ? "Formula Derived" : undefined}
                  required
                />
              </div>
            </div>

            {/* Silver & Platinum Selling Rates Grid */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                Silver & Platinum Rates
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <GlassInput
                  label="Silver 999 Fine (per 1 kg)"
                  type="number"
                  prefixSymbol="₹"
                  value={silver999}
                  onChange={(e) => handleSilver999Change(e.target.value)}
                  disabled={!canManageRates}
                  required
                />
                <GlassInput
                  label="Silver 925 Sterling (per 1 kg)"
                  type="number"
                  prefixSymbol="₹"
                  value={silver925}
                  onChange={(e) => setSilver925(e.target.value)}
                  disabled={!canManageRates || autoDerive}
                  helperText={autoDerive ? "92.5% Normalized" : undefined}
                  required
                />
                <GlassInput
                  label="Platinum 950 (per 1 gram)"
                  type="number"
                  prefixSymbol="₹"
                  value={platinum950}
                  onChange={(e) => setPlatinum950(e.target.value)}
                  disabled={!canManageRates}
                  required
                />
              </div>
            </div>

            {/* Buyback Rates Collapsible */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowBuyback(!showBuyback)}
                className="text-xs text-[#DFC488] font-medium flex items-center gap-1.5 hover:underline"
              >
                <span>{showBuyback ? "Hide" : "Show"} Old-Gold Exchange / Buyback Rates (पुरानी सोना खरीद भाव)</span>
              </button>

              {showBuyback && (
                <div className="mt-2.5 p-3.5 rounded-xl bg-black/30 border border-white/[0.05] space-y-3 animate-in fade-in">
                  <div className="text-[11px] text-[var(--text-tertiary)]">
                    Used during customer old-gold melting and exchange valuation:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <GlassInput
                      label="Old Gold 24K Buyback"
                      type="number"
                      prefixSymbol="₹"
                      value={goldPurchase24k}
                      onChange={(e) => setGoldPurchase24k(e.target.value)}
                      disabled={!canManageRates}
                    />
                    <GlassInput
                      label="Old Gold 22K Buyback"
                      type="number"
                      prefixSymbol="₹"
                      value={goldPurchase22k}
                      onChange={(e) => setGoldPurchase22k(e.target.value)}
                      disabled={!canManageRates}
                    />
                    <GlassInput
                      label="Old Silver Buyback (per kg)"
                      type="number"
                      prefixSymbol="₹"
                      value={silverPurchase}
                      onChange={(e) => setSilverPurchase(e.target.value)}
                      disabled={!canManageRates}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Audit Notes */}
            <GlassInput
              label="Audit Note / Source Reference"
              type="text"
              placeholder="e.g. Jaipur Sarafa Bazar Morning Opening Rate"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canManageRates}
            />

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
                <Clock size={13} className="text-[#DFC488]" />
                <span>
                  Active: ₹{activeRecord.gold24k.toLocaleString("en-IN")}/10g (Set by {activeRecord.updatedByName})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <GlassButton variant="ghost" size="sm" onClick={onClose}>
                  Cancel
                </GlassButton>
                {canManageRates && (
                  <GlassButton variant="primary" size="sm" type="submit">
                    Save & Broadcast Rates
                  </GlassButton>
                )}
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Historical Ledger */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-secondary)]">
              Every rate change is recorded with timestamp and employee attribution. New rates never rewrite historical invoices or loans.
            </p>

            <div className="rounded-xl border border-white/[0.06] bg-black/30 overflow-hidden max-h-[380px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[var(--text-tertiary)] uppercase tracking-wider text-[10px] bg-white/[0.02]">
                    <th className="py-2.5 px-3">Date & Time</th>
                    <th className="py-2.5 px-3">24K Gold</th>
                    <th className="py-2.5 px-3">22K Gold</th>
                    <th className="py-2.5 px-3">Silver / kg</th>
                    <th className="py-2.5 px-3">Updated By</th>
                    <th className="py-2.5 px-3">Note / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {history.map((rec, idx) => {
                    const prevRec = history[idx + 1];
                    const diff24k = prevRec ? rec.gold24k - prevRec.gold24k : 0;
                    const dateFormatted = new Date(rec.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    });

                    return (
                      <tr key={rec.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[var(--text-primary)]">
                          {dateFormatted}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-[#DFC488]">
                          <div className="flex items-center gap-1.5">
                            <span>₹{rec.gold24k.toLocaleString("en-IN")}</span>
                            {diff24k > 0 && (
                              <span className="text-[10px] text-emerald-400 font-mono flex items-center">
                                <TrendingUp size={10} /> +{diff24k}
                              </span>
                            )}
                            {diff24k < 0 && (
                              <span className="text-[10px] text-red-400 font-mono flex items-center">
                                <TrendingDown size={10} /> {diff24k}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                          ₹{rec.gold22k.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[var(--text-secondary)]">
                          ₹{rec.silver999PerKg.toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[var(--text-primary)] font-medium">
                            {rec.updatedByName}
                          </span>
                          <span className="text-[10px] text-[var(--text-tertiary)] block">
                            {rec.updatedByRole}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-[var(--text-tertiary)] truncate max-w-[140px]">
                          {rec.notes || rec.source}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <GlassButton variant="ghost" size="sm" onClick={onClose}>
                Close
              </GlassButton>
            </div>
          </div>
        )}
      </div>
    </GlassDialog>
  );
};
