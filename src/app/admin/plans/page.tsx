"use client";

import React, { useState, useEffect } from "react";
import { CreditCard, Check, X, Sparkles, Plus, RefreshCw, Shield, Layers } from "lucide-react";

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans");
      if (res.ok) {
        const json = await res.json();
        setPlans(json.plans || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const featureLabels: Record<string, string> = {
    "module.pos": "Showroom POS & Fast Invoicing",
    "module.inventory": "Inventory & Physical Tray Tracking",
    "module.barcode": "Thermal Barcode Printing & Scanning",
    "module.metal_rates": "Live Gold/Silver Rate Board",
    "module.accounts": "Double-entry Accounting & GST Reports",
    "module.customers": "Customer Khata & Credit Ledger",
    "module.girvi": "Girvi Lending & Gold Loan Accounting",
    "module.karigar": "Karigar & Workshop Order Tracking",
    "module.consignment": "Wholesale & Consignment Approval",
    "module.advanced_reports": "Executive Intelligence & GSTR Exporters",
    "module.multi_branch": "Multi-branch Vaults & Stock Transfers",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Plans & Pricing Studio
            <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              4 Active Tiers
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Configure commercial plan tiers, module entitlements, and allowance thresholds.
          </p>
        </div>
        <button
          onClick={fetchPlans}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Refresh Plans
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((p) => {
          const staffLimit = p.entitlements?.find((e: any) => e.featureKey === "limit.staff_seats")?.limitValue;
          const branchLimit = p.entitlements?.find((e: any) => e.featureKey === "limit.branches")?.limitValue;
          const stockLimit = p.entitlements?.find((e: any) => e.featureKey === "limit.stock_items")?.limitValue;

          return (
            <div
              key={p.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between ${
                p.slug === "growth"
                  ? "bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-xl shadow-amber-500/5 relative"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              {p.badge && (
                <span className="absolute -top-2.5 right-4 text-[10px] uppercase font-bold tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">
                  {p.badge}
                </span>
              )}

              <div>
                <h3 className="font-bold text-slate-100 text-base">{p.name}</h3>
                <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description}</p>

                <div className="mt-4 mb-4 pb-4 border-b border-slate-800">
                  <div className="text-2xl font-bold font-mono text-slate-100">
                    ₹{Number(p.monthlyPrice).toLocaleString("en-IN")}
                    <span className="text-xs text-slate-400 font-normal"> / mo</span>
                  </div>
                  {p.yearlyPrice && (
                    <div className="text-[11px] text-amber-400 mt-0.5">
                      ₹{Number(p.yearlyPrice).toLocaleString("en-IN")} / year (billed annually)
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-2">
                    Included Allowances
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Staff Accounts:</span>
                    <span className="font-mono font-semibold">{staffLimit || "Custom"} seats</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Showroom Branches:</span>
                    <span className="font-mono font-semibold">{branchLimit || "Custom"}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Stock Capacity:</span>
                    <span className="font-mono font-semibold">{stockLimit?.toLocaleString("en-IN") || "Unlimited"}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="font-semibold text-slate-400 text-[11px] uppercase tracking-wider mb-2">
                    Specialized Modules
                  </div>
                  {["module.girvi", "module.karigar", "module.consignment", "module.multi_branch"].map((fk) => {
                    const ent = p.entitlements?.find((e: any) => e.featureKey === fk);
                    const enabled = ent?.enabled;
                    return (
                      <div key={fk} className="flex items-center gap-2">
                        {enabled ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                        )}
                        <span className={enabled ? "text-slate-200" : "text-slate-500 line-through"}>
                          {featureLabels[fk] || fk}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>{p._count?.subscriptions || 0} active merchants</span>
                <span className="font-mono text-emerald-400 font-medium">Published</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
