"use client";

import React from "react";
import {
  LayoutDashboard,
  Calculator,
  Receipt,
  Package,
  Users,
  BarChart3,
  Settings,
  Sun,
  Moon,
  Store,
  Landmark,
  Hammer,
  Briefcase,
} from "lucide-react";
import { cn } from "../../lib/utils";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Counter Calculator", href: "/calculator", icon: Calculator },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Billing & Invoices", href: "/invoices", icon: Receipt },
  { name: "Girvi / Gold Loans", href: "/girvi", icon: Landmark },
  { name: "Karigar Ledger", href: "/karigar", icon: Hammer },
  { name: "Staff & Payroll", href: "/staff", icon: Briefcase },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Shop Settings", href: "/settings", icon: Settings },
];

export interface GlassSidebarProps {
  currentTheme?: "dark" | "light";
  onToggleTheme?: () => void;
  shopName?: string;
  ownerName?: string;
  activeTab?: string;
  onSelectTab?: (href: string) => void;
  onOpenShowroomSwitcher?: () => void;
}

export const GlassSidebar: React.FC<GlassSidebarProps> = ({
  currentTheme = "dark",
  onToggleTheme,
  shopName = "Sandhya Jewellers",
  ownerName = "Harshit Raj",
  activeTab = "/calculator",
  onSelectTab,
  onOpenShowroomSwitcher,
}) => {
  return (
    <aside className="w-60 shrink-0 flex flex-col justify-between h-screen sticky top-0 border-r border-white/[0.05] bg-[var(--surface-primary)] p-4 select-none z-30">
      {/* Brand Header */}
      <div>
        <div
          onClick={onOpenShowroomSwitcher}
          className="px-2 py-3 mb-6 border-b border-white/[0.05] rounded-xl hover:bg-white/[0.02] cursor-pointer transition-colors group"
          title="Click to Switch Showroom"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
              <span className="font-semibold tracking-wider text-xs uppercase text-[var(--text-primary)]">
                Jewellery<span className="text-[#C5A059]">OS</span>
              </span>
            </div>
            <Store size={13} className="text-[var(--text-tertiary)] group-hover:text-[#DFC488] transition-colors" />
          </div>
          <div className="text-[11px] text-[#DFC488] mt-1.5 truncate pl-4 font-semibold flex items-center justify-between">
            <span className="truncate">{shopName}</span>
            <span className="text-[9px] text-[var(--text-tertiary)] group-hover:text-[#DFC488] font-normal shrink-0">Switch</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.href;

            return (
              <button
                key={item.href}
                onClick={() => onSelectTab?.(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-100 text-left",
                  isActive
                    ? "bg-[#C5A059]/10 text-[#DFC488] font-semibold border-l-2 border-[#C5A059]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]"
                )}
              >
                <Icon
                  size={15}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-[#DFC488]" : "text-[var(--text-tertiary)]"
                  )}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info, Theme & Creator Credit */}
      <div className="pt-3 border-t border-white/[0.05] flex flex-col gap-3 text-xs">
        <button
          onClick={onToggleTheme}
          className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1.5 rounded hover:bg-white/[0.03] transition-colors"
        >
          <span>Theme</span>
          <span className="flex items-center gap-1.5 text-[10px] text-[var(--text-tertiary)]">
            {currentTheme === "dark" ? (
              <>
                <Sun size={12} className="text-[#DFC488]" /> Light
              </>
            ) : (
              <>
                <Moon size={12} className="text-[#DFC488]" /> Dark
              </>
            )}
          </span>
        </button>

        {/* Harshit Raj Attribution */}
        <div className="px-2 pt-2 border-t border-white/[0.04]">
          <p className="text-[11px] text-[var(--text-tertiary)]">
            Crafted by{" "}
            <span className="font-semibold text-[var(--text-secondary)]">
              Harshit Raj
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
};
