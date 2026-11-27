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
  Lock,
  Truck,
  BookOpen,
  Wrench,
  FileSpreadsheet,
  Tag,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../modules/auth/AuthContext";
import { PermissionKey } from "../../modules/auth/types";
import { getRoleBadgeColor } from "../../modules/auth/permissions";
import { GlassBadge } from "./GlassBadge";

export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  requiredPermission?: PermissionKey;
}

export const NAV_ITEMS: NavItem[] = [
  { name: "Counter Calculator", href: "/calculator", icon: Calculator },
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Billing & Invoices", href: "/invoices", icon: Receipt },
  { name: "Girvi / Gold Loans", href: "/girvi", icon: Landmark, requiredPermission: "MANAGE_GIRVI" },
  { name: "Karigar Ledger", href: "/karigar", icon: Hammer, requiredPermission: "MANAGE_KARIGAR" },
  { name: "Staff & Payroll", href: "/staff", icon: Briefcase, requiredPermission: "MANAGE_EMPLOYEES" },
  { name: "Product Catalogue", href: "/catalogue", icon: Tag },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "Purchases & Suppliers", href: "/purchases", icon: Truck, requiredPermission: "VIEW_PURCHASE_COSTS" },
  { name: "Wholesale & Memos", href: "/wholesale", icon: FileSpreadsheet, requiredPermission: "VIEW_PURCHASE_COSTS" },
  { name: "Repairs & Bookings", href: "/repairs", icon: Wrench },
  { name: "Accounts & Cashbook", href: "/accounts", icon: BookOpen, requiredPermission: "VIEW_OWNER_REPORTS" },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Reports", href: "/reports", icon: BarChart3, requiredPermission: "VIEW_OWNER_REPORTS" },
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
  const { user, role, hasPermission, openLoginModal } = useAuth();
  const roleBadgeColor = getRoleBadgeColor(role);

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
            const isRestricted = item.requiredPermission
              ? !hasPermission(item.requiredPermission)
              : false;

            return (
              <button
                key={item.href}
                onClick={() => {
                  if (isRestricted) {
                    openLoginModal();
                    return;
                  }
                  onSelectTab?.(item.href);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors duration-100 text-left relative group",
                  isActive
                    ? "bg-[#C5A059]/10 text-[#DFC488] font-semibold border-l-2 border-[#C5A059]"
                    : isRestricted
                    ? "text-[var(--text-tertiary)] opacity-60 hover:opacity-100 hover:bg-white/[0.02]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03]"
                )}
                title={
                  isRestricted
                    ? `Restricted to authorized roles. Click to switch staff profile.`
                    : item.name
                }
              >
                <Icon
                  size={15}
                  className={cn(
                    "shrink-0",
                    isActive ? "text-[#DFC488]" : "text-[var(--text-tertiary)]"
                  )}
                />
                <span className="truncate">{item.name}</span>
                {isRestricted && (
                  <Lock
                    size={11}
                    className="text-amber-400/80 shrink-0 ml-auto group-hover:scale-110 transition-transform"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info, Active Staff Card, Theme & Creator Credit */}
      <div className="pt-3 border-t border-white/[0.05] flex flex-col gap-2.5 text-xs">
        {/* Active Staff Mini Card */}
        <button
          onClick={openLoginModal}
          className="p-2 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] text-left transition-colors flex items-center justify-between"
          title="Click to Switch Active Staff Profile"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-5 h-5 rounded-full bg-[#C5A059]/20 text-[#DFC488] font-bold text-[10px] flex items-center justify-center shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <div className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                {user.fullName}
              </div>
              <div className="text-[9px] text-[var(--text-tertiary)] truncate">
                {role.replace("_", " ")}
              </div>
            </div>
          </div>
          <GlassBadge variant={roleBadgeColor} size="sm">
            {role === "OWNER" ? "Owner" : "Staff"}
          </GlassBadge>
        </button>

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
        <div className="px-2 pt-1 border-t border-white/[0.04]">
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
