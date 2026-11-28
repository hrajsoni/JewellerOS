"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Ban,
  ArrowUpRight,
  ShieldAlert,
  Sparkles,
  Calendar,
  Layers,
  X,
} from "lucide-react";

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [selectedBiz, setSelectedBiz] = useState<any>(null);
  const [modalAction, setModalAction] = useState<"EXTEND_TRIAL" | "CHANGE_PLAN" | "SET_OVERRIDE" | "SUSPEND" | null>(null);
  const [actionInput, setActionInput] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const url = `/api/admin/businesses?search=${encodeURIComponent(search)}${statusFilter ? `&status=${statusFilter}` : ""}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBusinesses(data.businesses || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, [search, statusFilter]);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBiz || !modalAction) return;

    setSubmitting(true);
    setMessage("");

    try {
      let body: any = {};
      if (modalAction === "EXTEND_TRIAL") {
        body = { action: "EXTEND_TRIAL", days: actionInput.days || 14, reason: actionInput.reason };
      } else if (modalAction === "CHANGE_PLAN") {
        body = { action: "CHANGE_PLAN", planSlug: actionInput.planSlug, reason: actionInput.reason };
      } else if (modalAction === "SUSPEND") {
        const isCurrentlySuspended = selectedBiz.subscriptions?.[0]?.status === "SUSPENDED";
        body = { action: "TOGGLE_SUSPENSION", suspended: !isCurrentlySuspended, reason: actionInput.reason };
      } else if (modalAction === "SET_OVERRIDE") {
        body = {
          action: "SET_OVERRIDE",
          featureKey: actionInput.featureKey,
          enabled: actionInput.overrideType === "BOOLEAN" ? actionInput.enabled : null,
          limitValue: actionInput.overrideType === "LIMIT" ? Number(actionInput.limitValue) : null,
          reason: actionInput.reason,
          expiresDays: actionInput.expiresDays || 30,
        };
      }

      const res = await fetch(`/api/admin/businesses/${selectedBiz.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Action failed.");
      }

      setMessage("Action executed and propagated across the platform successfully!");
      setTimeout(() => {
        setModalAction(null);
        setSelectedBiz(null);
        setActionInput({});
        setMessage("");
        fetchBusinesses();
      }, 1200);
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Merchant Showrooms Directory
            <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {businesses.length} Showrooms
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Inspect plans, allowances, staff seats, extend trials, grant custom overrides, and manage suspensions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search by showroom name, email, phone, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-44 py-2 px-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-amber-500"
        >
          <option value="">All Subscription Statuses</option>
          <option value="ACTIVE">Active Subscriptions</option>
          <option value="TRIALING">14-Day Free Trials</option>
          <option value="SUSPENDED">Suspended Showrooms</option>
          <option value="EXPIRED">Expired Subscriptions</option>
        </select>
      </div>

      {/* Businesses Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Showroom & City</th>
                <th className="py-3 px-4 font-medium">Active Plan</th>
                <th className="py-3 px-4 font-medium">Usage Allowances</th>
                <th className="py-3 px-4 font-medium">Trial / Renewal</th>
                <th className="py-3 px-4 font-medium text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {businesses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    No merchant showrooms match your criteria.
                  </td>
                </tr>
              ) : (
                businesses.map((biz) => {
                  const sub = biz.subscriptions?.[0];
                  const isSuspended = sub?.status === "SUSPENDED";
                  const isTrial = sub?.status === "TRIALING";

                  return (
                    <tr key={biz.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                          {biz.name}
                          {isSuspended && (
                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded">
                              Suspended
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {biz.city || "Jaipur"} · {biz.phone || "No phone"}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">{biz.id}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium border ${
                            sub?.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : isTrial
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : isSuspended
                              ? "bg-red-500/10 text-red-400 border-red-500/20"
                              : "bg-slate-800 text-slate-400 border-slate-700"
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          {sub?.plan?.name || "No Plan"}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1">
                          ₹{Number(sub?.agreedPrice || 0).toLocaleString("en-IN")} / {sub?.billingInterval || "MONTHLY"}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                        <div>Branches: {biz._count.branches}</div>
                        <div>Staff Seats: {biz._count.users}</div>
                        <div>Stock Items: {biz._count.stockItems}</div>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        {isTrial ? (
                          <div className="text-amber-400 font-medium flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Trial Ends: {sub?.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString("en-IN") : "N/A"}
                          </div>
                        ) : (
                          <div className="text-slate-300">
                            Renews: {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "Ongoing"}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Since {new Date(biz.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedBiz(biz);
                            setModalAction("EXTEND_TRIAL");
                            setActionInput({ days: 14, reason: "Courtesy trial extension" });
                          }}
                          className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] transition-colors"
                        >
                          +14d Trial
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBiz(biz);
                            setModalAction("CHANGE_PLAN");
                            setActionInput({ planSlug: "growth", reason: "Super Admin upgrade" });
                          }}
                          className="px-2 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded text-[11px] transition-colors"
                        >
                          Change Plan
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBiz(biz);
                            setModalAction("SET_OVERRIDE");
                            setActionInput({
                              featureKey: "module.girvi",
                              overrideType: "BOOLEAN",
                              enabled: true,
                              reason: "Pilot partner bonus feature",
                              expiresDays: 30,
                            });
                          }}
                          className="px-2 py-1 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded text-[11px] transition-colors"
                        >
                          Override
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBiz(biz);
                            setModalAction("SUSPEND");
                            setActionInput({ reason: isSuspended ? "Reactivating merchant access" : "Policy violation" });
                          }}
                          className={`px-2 py-1 rounded text-[11px] transition-colors border ${
                            isSuspended
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20"
                          }`}
                        >
                          {isSuspended ? "Reactivate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {modalAction && selectedBiz && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setModalAction(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {modalAction === "EXTEND_TRIAL" && "Extend Merchant Free Trial"}
              {modalAction === "CHANGE_PLAN" && "Modify Merchant Plan Tier"}
              {modalAction === "SET_OVERRIDE" && "Grant Entitlement Override"}
              {modalAction === "SUSPEND" && "Toggle Account Suspension"}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Target: {selectedBiz.name} ({selectedBiz.id})</p>

            {message && (
              <div
                className={`p-3 rounded-lg text-xs mb-4 ${
                  message.startsWith("Error")
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleActionSubmit} className="space-y-4 text-xs">
              {modalAction === "EXTEND_TRIAL" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Extension Days</label>
                  <select
                    value={actionInput.days || 14}
                    onChange={(e) => setActionInput({ ...actionInput, days: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value={7}>+7 Days</option>
                    <option value={14}>+14 Days (Standard)</option>
                    <option value={30}>+30 Days</option>
                    <option value={60}>+60 Days</option>
                  </select>
                </div>
              )}

              {modalAction === "CHANGE_PLAN" && (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Select New Plan</label>
                  <select
                    value={actionInput.planSlug || "growth"}
                    onChange={(e) => setActionInput({ ...actionInput, planSlug: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="trial">Free Trial (14 Days)</option>
                    <option value="starter">Starter Boutique (₹1,999/mo)</option>
                    <option value="growth">Growth Showroom (₹4,999/mo)</option>
                    <option value="enterprise">Enterprise Luxury (₹9,999/mo)</option>
                  </select>
                </div>
              )}

              {modalAction === "SET_OVERRIDE" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Feature / Metric Key</label>
                    <select
                      value={actionInput.featureKey || "module.girvi"}
                      onChange={(e) => {
                        const k = e.target.value;
                        const isLimit = k.startsWith("limit.");
                        setActionInput({
                          ...actionInput,
                          featureKey: k,
                          overrideType: isLimit ? "LIMIT" : "BOOLEAN",
                        });
                      }}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                    >
                      <option value="module.girvi">module.girvi (Girvi Lending Module)</option>
                      <option value="module.karigar">module.karigar (Karigar Manufacturing)</option>
                      <option value="module.consignment">module.consignment (Consignment Wholesale)</option>
                      <option value="module.multi_branch">module.multi_branch (Multi-branch Vaults)</option>
                      <option value="module.advanced_reports">module.advanced_reports (Executive Reports)</option>
                      <option value="limit.staff_seats">limit.staff_seats (Staff Account Limit)</option>
                      <option value="limit.branches">limit.branches (Showroom Branch Limit)</option>
                      <option value="limit.storage_mb">limit.storage_mb (Storage MB Limit)</option>
                    </select>
                  </div>

                  {actionInput.overrideType === "LIMIT" ? (
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Override Limit Value</label>
                      <input
                        type="number"
                        value={actionInput.limitValue || 20}
                        onChange={(e) => setActionInput({ ...actionInput, limitValue: e.target.value })}
                        className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-slate-300 font-medium mb-1">Access Status</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-1.5 text-slate-200">
                          <input
                            type="radio"
                            name="overrideEnabled"
                            checked={actionInput.enabled !== false}
                            onChange={() => setActionInput({ ...actionInput, enabled: true })}
                          />
                          Grant Access (Enabled)
                        </label>
                        <label className="flex items-center gap-1.5 text-slate-200">
                          <input
                            type="radio"
                            name="overrideEnabled"
                            checked={actionInput.enabled === false}
                            onChange={() => setActionInput({ ...actionInput, enabled: false })}
                          />
                          Revoke Access (Disabled)
                        </label>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Override Validity (Days)</label>
                    <input
                      type="number"
                      value={actionInput.expiresDays || 30}
                      onChange={(e) => setActionInput({ ...actionInput, expiresDays: e.target.value })}
                      className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reason / Audit Note</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Authorized by Super Admin for promotional partner"
                  value={actionInput.reason || ""}
                  onChange={(e) => setActionInput({ ...actionInput, reason: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalAction(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Propagating..." : "Execute & Propagate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
