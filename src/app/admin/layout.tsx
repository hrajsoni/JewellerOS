"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ShieldAlert,
  LayoutDashboard,
  Building2,
  CreditCard,
  TicketPercent,
  Receipt,
  History,
  LogOut,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Skip layout wrap on login page
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setLoading(false);
      return;
    }

    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.admin) {
          setAdmin(data.admin);
        }
      })
      .finally(() => setLoading(false));
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Merchants & Showrooms", href: "/admin/businesses", icon: Building2 },
    { label: "Plans & Pricing Studio", href: "/admin/plans", icon: CreditCard },
    { label: "Promo Codes & Discounts", href: "/admin/promos", icon: TicketPercent },
    { label: "Subscriptions & Ledger", href: "/admin/subscriptions", icon: Receipt },
    { label: "Platform Audit Log", href: "/admin/audit-logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900/90 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="font-bold text-amber-400 tracking-wide flex items-center gap-1.5 text-sm uppercase">
                JewelBill
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-mono font-normal">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400">Platform Control Center</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 text-amber-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{admin?.name || "Super Admin"}</p>
              <p className="text-[11px] text-slate-500 truncate">{admin?.email || "admin@jewelbill.com"}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        <header className="h-14 border-b border-slate-800/80 px-6 flex items-center justify-between shrink-0 bg-slate-900/40">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>JewelBill SaaS Platform</span>
            <span>/</span>
            <span className="text-slate-200 capitalize font-medium">
              {pathname.replace("/admin", "").replace("/", "") || "Overview"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Event Engine Live
            </span>
            <Link
              href="/"
              className="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Return to Merchant App &rarr;
            </Link>
          </div>
        </header>

        <div className="p-6 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
