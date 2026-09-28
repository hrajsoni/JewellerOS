import React from "react";
import { cn } from "../../lib/utils";

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standard" | "subtle" | "elevated" | "gold";
  sheen?: boolean;
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, variant = "standard", sheen = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative rounded-2xl transition-colors duration-200",
          sheen && "sheen-top",
          variant === "standard" && "glass-panel",
          variant === "subtle" && "glass-subtle",
          variant === "elevated" && "glass-elevated",
          variant === "gold" && "glass-panel border-[#C6A15B]/30 bg-[#1A1813]/70 sheen-gold",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassPanel.displayName = "GlassPanel";
