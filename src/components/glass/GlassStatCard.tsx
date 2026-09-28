import React from "react";
import { cn } from "../../lib/utils";
import { GlassCard } from "./GlassCard";

export interface GlassStatCardProps {
  label: string;
  value: string | React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  change?: {
    value: string;
    isPositive?: boolean;
  };
  variant?: "standard" | "gold" | "emerald";
  className?: string;
}

export const GlassStatCard: React.FC<GlassStatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  change,
  variant = "standard",
  className,
}) => {
  return (
    <GlassCard
      className={cn(
        "flex flex-col justify-between p-5 min-w-[200px]",
        variant === "gold" && "border-[#C6A15B]/30 bg-gradient-to-b from-[#1C1811]/60 to-[#12141A]/70",
        variant === "emerald" && "border-[var(--accent-emerald-border)] bg-gradient-to-b from-[#101D17]/60 to-[#12141A]/70",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
          {label}
        </span>
        {icon && (
          <div className="p-2 rounded-lg bg-white/[0.05] text-[var(--text-secondary)] border border-white/[0.08]">
            {icon}
          </div>
        )}
      </div>

      <div>
        <div className="text-2xl lg:text-3xl font-bold tracking-tight text-[var(--text-primary)] num-tabular">
          {value}
        </div>
        {(subtitle || change) && (
          <div className="flex items-center gap-2 mt-2 text-xs">
            {change && (
              <span
                className={cn(
                  "font-semibold flex items-center gap-0.5",
                  change.isPositive ? "text-[var(--accent-emerald)]" : "text-[var(--accent-coral)]"
                )}
              >
                {change.isPositive ? "↑" : "↓"} {change.value}
              </span>
            )}
            {subtitle && <span className="text-[var(--text-secondary)]">{subtitle}</span>}
          </div>
        )}
      </div>
    </GlassCard>
  );
};
