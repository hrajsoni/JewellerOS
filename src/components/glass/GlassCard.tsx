import React from "react";
import { cn } from "../../lib/utils";

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  active?: boolean;
  hoverEffect?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, active, hoverEffect = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-xl p-5 transition-all duration-200 sheen-top",
          "glass-panel text-[var(--text-primary)]",
          hoverEffect && "hover:border-[rgba(198,161,91,0.35)] hover:shadow-lg hover:shadow-black/40",
          active && "border-[#C6A15B]/50 bg-[#C6A15B]/10 shadow-[0_0_20px_rgba(198,161,91,0.12)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";
