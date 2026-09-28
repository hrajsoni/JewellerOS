import React from "react";
import { cn } from "../../lib/utils";

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefixSymbol?: string | React.ReactNode;
  suffixSymbol?: string | React.ReactNode;
  error?: string;
  helperText?: string;
}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      className,
      label,
      prefixSymbol,
      suffixSymbol,
      error,
      helperText,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-[11px] font-medium text-[var(--text-secondary)] tracking-normal"
            >
              {label}
            </label>
            {helperText && !error && (
              <span className="text-[10px] text-[var(--text-tertiary)]">{helperText}</span>
            )}
          </div>
        )}
        <div className="relative flex items-center w-full">
          {prefixSymbol && (
            <div className="absolute left-3 flex items-center pointer-events-none text-xs font-medium text-[var(--text-tertiary)] select-none">
              {prefixSymbol}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-sm glass-input font-medium placeholder:text-[var(--text-tertiary)]/70 tracking-tight",
              prefixSymbol && "pl-7",
              suffixSymbol && "pr-10",
              error && "border-[var(--accent-coral)]",
              className
            )}
            {...props}
          />
          {suffixSymbol && (
            <div className="absolute right-3 flex items-center pointer-events-none text-[11px] font-medium text-[var(--text-tertiary)] select-none">
              {suffixSymbol}
            </div>
          )}
        </div>
        {error && (
          <p className="text-[11px] text-[var(--accent-coral)] mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = "GlassInput";
