import React from "react";
import { ArrowUpRight, Store, ChevronDown } from "lucide-react";
import { GlassButton } from "../glass/GlassButton";

export interface TopRateBarProps {
  gold24kRate: number;
  silverRate: number;
  onOpenQuickInvoice?: () => void;
  onOpenGoldCalc?: () => void;
  onOpenSilverCalc?: () => void;
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
              onClick={onOpenGoldCalc}
              className="hover:text-[var(--text-primary)] transition-colors text-left"
            >
              <span className="text-[var(--text-tertiary)]">24K Gold: </span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                ₹{gold24kRate.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]"> / 10g</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenGoldCalc}
              className="hover:text-[var(--text-primary)] transition-colors text-left"
            >
              <span className="text-[var(--text-tertiary)]">22K (916): </span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                ₹{gold22kRate.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]"> / 10g</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSilverCalc}
              className="hover:text-[var(--text-primary)] transition-colors text-left"
            >
              <span className="text-[var(--text-tertiary)]">Silver: </span>
              <span className="font-mono font-medium text-[var(--text-primary)]">
                ₹{silverRate.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] text-[var(--text-tertiary)]"> / kg</span>
            </button>
          </div>
        </div>

        {/* Right Action */}
        <div className="flex items-center gap-2.5 ml-auto sm:ml-0">
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
