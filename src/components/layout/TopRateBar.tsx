import React from "react";
import { ArrowUpRight, Store, ChevronDown, TrendingUp, Search } from "lucide-react";
import { GlassButton } from "../glass/GlassButton";
import { FastRoleSwitcher } from "../auth/FastRoleSwitcher";

export interface TopRateBarProps {
  gold24kRate: number;
  silverRate: number;
  onOpenQuickInvoice?: () => void;
  onOpenGoldCalc?: () => void;
  onOpenSilverCalc?: () => void;
  onOpenRatesModal?: () => void;
  onOpenCommandPalette?: () => void;
  activeTenantName?: string;
  activeTenantCity?: string;
  onOpenShowroomSwitcher?: () => void;
}

export const TopRateBar: React.FC<TopRateBarProps> = ({
  gold24kRate = 150000,
  silverRate = 95000,
  onOpenQuickInvoice,
  onOpenGoldCalc,
  onOpenSilverCalc,
  onOpenRatesModal,
  onOpenCommandPalette,
  activeTenantName,
  activeTenantCity,
  onOpenShowroomSwitcher,
}) => {
  const gold22kRate = Math.round((gold24kRate / 24) * 22);

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/[0.05] bg-[var(--surface-primary)]/90 backdrop-blur-md px-4 lg:px-8 py-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Showroom Identity Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenShowroomSwitcher}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/25 transition-all text-xs group text-left"
            title="Switch Showroom or Register New Store"
          >
            <div className="p-1 rounded bg-[#C5A059]/20 text-[#DFC488]">
              <Store size={13} />
            </div>
            <div>
              <div className="font-semibold text-[var(--text-primary)] leading-tight text-[11px] flex items-center gap-1">
                {activeTenantName || "Sandhya Jewellers"}
                <ChevronDown size={11} className="text-[#DFC488] group-hover:translate-y-0.5 transition-transform" />
              </div>
              <div className="text-[9px] text-[var(--text-tertiary)] font-mono">
                {activeTenantCity || "Jaipur"} · Private Vault
              </div>
            </div>
          </button>
        </div>
        {/* Metal Rates Strip - Clean Editorial Ticker */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059]" />
            <button
              onClick={onOpenRatesModal || onOpenGoldCalc}
              className="hover:text-[var(--text-primary)] transition-colors text-left group"
              title="Click to View or Update Market Rates"
            >
              <span className="text-[var(--text-tertiary)]">24K Gold: </span>
              <span className="font-mono font-semibold text-[var(--text-primary)] group-hover:text-[#DFC488]">
                ₹{gold24kRate.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]"> / 10g</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRatesModal || onOpenGoldCalc}
              className="hover:text-[var(--text-primary)] transition-colors text-left group"
              title="Click to View or Update Market Rates"
            >
              <span className="text-[var(--text-tertiary)]">22K (916): </span>
              <span className="font-mono font-medium text-[var(--text-primary)] group-hover:text-[#DFC488]">
                ₹{gold22kRate.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]"> / 10g</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRatesModal || onOpenSilverCalc}
              className="hover:text-[var(--text-primary)] transition-colors text-left group"
              title="Click to View or Update Market Rates"
            >
              <span className="text-[var(--text-tertiary)]">Silver: </span>
              <span className="font-mono font-medium text-[var(--text-primary)] group-hover:text-[#DFC488]">
                ₹{silverRate.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]"> / kg</span>
            </button>
          </div>

          <button
            onClick={onOpenRatesModal}
            className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#C5A059]/10 hover:bg-[#C5A059]/20 border border-[#C5A059]/20 text-[#DFC488] text-[11px] font-medium transition-all"
            title="Open Sarafa Market Rate Board & Audit Ledger"
          >
            <TrendingUp size={12} />
            <span>Daily Board</span>
          </button>
        </div>

        {/* Right Actions: RBAC Fast Role Switcher & New Invoice */}
        <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
          <button
            onClick={() => {
              if (onOpenCommandPalette) {
                onOpenCommandPalette();
              } else {
                window.dispatchEvent(new CustomEvent("open-command-palette"));
              }
            }}
            className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs text-zinc-300 transition-colors"
            title="Open Command Palette (Ctrl+K / Cmd+K)"
          >
            <Search size={13} className="text-[#DFC488]" />
            <span className="text-[11px] text-zinc-400">Search...</span>
            <kbd className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/[0.06] text-zinc-400 border border-white/[0.06]">
              Ctrl K
            </kbd>
          </button>
          <FastRoleSwitcher />
          <GlassButton
            variant="primary"
            size="sm"
            onClick={onOpenQuickInvoice}
            icon={<ArrowUpRight size={14} />}
          >
            New Invoice
          </GlassButton>
        </div>
      </div>
    </header>
  );
};
