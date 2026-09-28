import React from "react";
import { cn } from "../../lib/utils";

export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "silver" | "emerald" | "coral" | "neutral";
  size?: "sm" | "md";
}

export const GlassBadge: React.FC<GlassBadgeProps> = ({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold tracking-wider uppercase rounded-full select-none",
        size === "sm" && "px-2 py-0.5 text-[10px]",
        size === "md" && "px-2.5 py-1 text-xs",
        variant === "gold" &&
          "bg-[#C6A15B]/15 text-[#DFC38A] border border-[#C6A15B]/30 shadow-[0_0_10px_rgba(198,161,91,0.1)]",
        variant === "silver" &&
          "bg-white/10 text-[#E0E2EC] border border-white/20",
        variant === "emerald" &&
          "bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] border border-[var(--accent-emerald-border)]",
        variant === "coral" &&
          "bg-[var(--accent-coral-soft)] text-[var(--accent-coral)] border border-[var(--accent-coral-border)]",
        variant === "neutral" &&
          "bg-white/[0.05] text-[var(--text-secondary)] border border-white/[0.08]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
