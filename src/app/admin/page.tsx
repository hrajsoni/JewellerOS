"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  Building2,
  Users,
  ShieldCheck,
  Receipt,
  TicketPercent,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  Clock,
  HardDrive,
  Sparkles,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverview = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/overview");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const m = data?.metrics || {};

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Platform Executive Dashboard
            <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              Live Neon DB
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time SaaS metrics, merchant subscriptions, and cross-system event propagation.
          </p>
        </div>
        <button
          onClick={fetchOverview}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Monthly Recurring Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            ₹{(m.mrr || 0).toLocaleString("en-IN")}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">From active merchant subscriptions</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total Showrooms</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {m.totalBusinesses || 0}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
            <span className="text-emerald-400">{m.activeSubscriptions || 0} Active</span>
            <span>·</span>
            <span className="text-amber-400">{m.trialingSubscriptions || 0} Trials</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Active Staff Seats</span>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {m.totalUsers || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Registered jewellery staff accounts</p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Media Storage (Neon)</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {m.totalStorageMb || 0} <span className="text-sm font-normal text-slate-400">MB</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Jewellery images & barcode tags</p>
        </div>
      </div>

      {/* Two Column Layout: Recent Showrooms & Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Showrooms */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              Recent Merchant Signups
            </h2>
            <Link
              href="/admin/businesses"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View All &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {(data?.recentBusinesses || []).map((biz: any) => {
              const sub = biz.subscriptions?.[0];
              const isTrial = sub?.status === "TRIALING";
              return (
                <div key={biz.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      {biz.name}
                      <span className="text-[10px] text-slate-500 font-mono">{biz.city || "Jaipur"}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {biz.phone} · {biz._count.stockItems} stock items · {biz._count.users} staff
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                        sub?.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : isTrial
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : "bg-red-500/10 text-red-400 border-red-500/20"
                      }`}
                    >
                      {sub?.plan?.name || "No Plan"} ({sub?.status || "PENDING"})
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {new Date(biz.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Subscription Payments */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-400" />
              Recent Subscription Payments
            </h2>
            <Link
              href="/admin/subscriptions"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              View Ledger &rarr;
            </Link>
          </div>

          <div className="divide-y divide-slate-800/80">
            {(data?.recentPayments || []).length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No payment transactions recorded yet.</p>
            ) : (
              (data?.recentPayments || []).map((pay: any) => (
                <div key={pay.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-200">
                      {pay.subscription?.business?.name || "Merchant"}
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5 font-mono">
                      {pay.invoiceNumber} · {pay.paymentMethod}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-emerald-400">
                      ₹{Number(pay.netPaid).toLocaleString("en-IN")}
                    </span>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {pay.paidAt ? new Date(pay.paidAt).toLocaleDateString("en-IN") : "Pending"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cross-System Event Engine Activity Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Cross-System Propagation Event Stream (Outbox)
          </h2>
          <span className="text-[11px] text-slate-500">Milestone 8 Propagation Engine</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2 font-medium">Event Type</th>
                <th className="py-2 font-medium">Target</th>
                <th className="py-2 font-medium">Actor</th>
                <th className="py-2 font-medium">Timestamp</th>
                <th className="py-2 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {(data?.recentEvents || []).map((evt: any) => (
                <tr key={evt.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 text-amber-400 font-semibold">{evt.action}</td>
                  <td className="py-2.5 text-slate-300">
                    {evt.targetType}: {evt.targetId.slice(0, 16)}...
                  </td>
                  <td className="py-2.5 text-slate-400">
                    {evt.admin?.name || "System"}
                  </td>
                  <td className="py-2.5 text-slate-500">
                    {new Date(evt.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2.5 text-right text-slate-400 font-sans">
                    {evt.details?.reason || evt.details?.planName || "Propagated"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
