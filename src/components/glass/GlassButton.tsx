import React from "react";
import { cn } from "../../lib/utils";

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "gold-outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      icon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium tracking-normal transition-all duration-150 rounded-lg select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059]/40 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed",
          // Sizes
          size === "sm" && "text-xs px-3 py-1.5",
          size === "md" && "text-xs sm:text-sm px-4 py-2.5",
          size === "lg" && "text-sm px-5 py-3 font-semibold",

          // Luxury Understated Variants
          variant === "primary" &&
            "bg-[#C5A059] text-[#08090C] font-semibold hover:bg-[#D4AF67] active:bg-[#B5914B] shadow-sm shadow-black/40",

          variant === "secondary" &&
            "bg-white/[0.04] text-[var(--text-primary)] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/15 active:bg-white/[0.03]",

          variant === "gold-outline" &&
            "border border-[#C5A059]/35 text-[#DFC488] bg-[#C5A059]/[0.04] hover:bg-[#C5A059]/[0.1] active:bg-[#C5A059]/[0.06]",

          variant === "ghost" &&
            "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]",

          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children}
      </button>
    );
  }
);

GlassButton.displayName = "GlassButton";
