"use client";

import React, { useState, useEffect } from "react";
import { TicketPercent, Plus, Check, X, RefreshCw, Calendar, Tag, ShieldCheck } from "lucide-react";

export default function AdminPromosPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal create
  const [showModal, setShowModal] = useState(false);
  const [newCode, setNewCode] = useState({
    code: "",
    description: "",
    discountType: "PERCENTAGE",
    discountValue: 20,
    maxDiscount: 2000,
    minOrderValue: 2000,
    maxUses: 100,
    validUntil: "2027-12-31",
    applicablePlanIds: [] as string[],
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pRes, plRes] = await Promise.all([
        fetch("/api/admin/promos"),
        fetch("/api/admin/plans"),
      ]);

      if (pRes.ok) {
        const json = await pRes.json();
        setPromos(json.promoCodes || []);
      }
      if (plRes.ok) {
        const json = await plRes.json();
        setPlans(json.plans || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch("/api/admin/promos", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !currentActive }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      const res = await fetch("/api/admin/promos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newCode,
          validUntil: newCode.validUntil ? new Date(newCode.validUntil).toISOString() : null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create promo code.");
      }

      setShowModal(false);
      setNewCode({
        code: "",
        description: "",
        discountType: "PERCENTAGE",
        discountValue: 20,
        maxDiscount: 2000,
        minOrderValue: 2000,
        maxUses: 100,
        validUntil: "2027-12-31",
        applicablePlanIds: [],
      });
      fetchData();
    } catch (err: any) {
      setError(err?.message || "An error occurred.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Promo Codes & Discount Campaigns
            <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {promos.length} Codes
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Generate promotional vouchers, percentage and flat discounts for merchant onboarding and annual renewals.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs rounded-lg transition-all shadow-lg shadow-amber-500/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Promo Code
        </button>
      </div>

      {/* Promos Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Promo Code</th>
                <th className="py-3 px-4 font-medium">Discount Value</th>
                <th className="py-3 px-4 font-medium">Redemptions</th>
                <th className="py-3 px-4 font-medium">Applicability</th>
                <th className="py-3 px-4 font-medium">Expiry</th>
                <th className="py-3 px-4 font-medium text-right">Status / Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {promos.map((p) => {
                const isExpired = p.validUntil && new Date() > new Date(p.validUntil);
                return (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-amber-400 tracking-wider flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {p.code}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{p.description || "No description"}</p>
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {p.discountType === "PERCENTAGE" ? (
                        <span className="font-bold text-emerald-400">
                          {Number(p.discountValue)}% OFF
                          {p.maxDiscount && (
                            <span className="text-slate-400 font-normal text-[11px]">
                              {" "}
                              (Up to ₹{Number(p.maxDiscount).toLocaleString("en-IN")})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-400">
                          ₹{Number(p.discountValue).toLocaleString("en-IN")} FLAT OFF
                        </span>
                      )}
                      {p.minOrderValue && (
                        <div className="text-[10px] text-slate-500">
                          Min. order: ₹{Number(p.minOrderValue).toLocaleString("en-IN")}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <span className="text-slate-200 font-bold">{p.usedCount}</span>
                      <span className="text-slate-500"> / {p.maxUses ? p.maxUses : "Unlimited"}</span>
                    </td>

                    <td className="py-3 px-4 text-[11px] text-slate-300">
                      {p.applicablePlans?.length === 0 ? (
                        <span className="text-slate-500">All Plans</span>
                      ) : (
                        p.applicablePlans.map((ap: any) => ap.plan.name).join(", ")
                      )}
                    </td>

                    <td className="py-3 px-4 text-xs text-slate-400">
                      {p.validUntil ? new Date(p.validUntil).toLocaleDateString("en-IN") : "No expiry"}
                      {isExpired && (
                        <span className="ml-1 text-[10px] text-red-400 bg-red-500/10 px-1 rounded">Expired</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleActive(p.id, p.isActive)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                          p.isActive
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-slate-800 text-slate-500 border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        {p.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Promo Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <TicketPercent className="w-5 h-5 text-amber-400" />
              Generate New Promo Code
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Promo codes automatically calculate discounts during checkout and renew operations.
            </p>

            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCreatePromo} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Promo Code (Uppercase)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DIWALI2026"
                    value={newCode.code}
                    onChange={(e) => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Discount Type</label>
                  <select
                    value={newCode.discountType}
                    onChange={(e) => setNewCode({ ...newCode, discountType: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="PERCENTAGE">Percentage (%) Off</option>
                    <option value="FLAT">Flat Amount (₹) Off</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Campaign Purpose</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Sarafa Association Festival Discount"
                  value={newCode.description}
                  onChange={(e) => setNewCode({ ...newCode, description: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">
                    {newCode.discountType === "PERCENTAGE" ? "Percentage Discount (%)" : "Flat Discount (₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    value={newCode.discountValue}
                    onChange={(e) => setNewCode({ ...newCode, discountValue: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    value={newCode.maxDiscount}
                    onChange={(e) => setNewCode({ ...newCode, maxDiscount: Number(e.target.value) })}
                    placeholder="Leave empty for uncapped"
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    value={newCode.maxUses}
                    onChange={(e) => setNewCode({ ...newCode, maxUses: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={newCode.validUntil}
                    onChange={(e) => setNewCode({ ...newCode, validUntil: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Applicable Plans</label>
                <div className="flex flex-wrap gap-2">
                  {plans.map((pl) => {
                    const isSelected = newCode.applicablePlanIds.includes(pl.id);
                    return (
                      <button
                        type="button"
                        key={pl.id}
                        onClick={() => {
                          const updated = isSelected
                            ? newCode.applicablePlanIds.filter((id) => id !== pl.id)
                            : [...newCode.applicablePlanIds, pl.id];
                          setNewCode({ ...newCode, applicablePlanIds: updated });
                        }}
                        className={`px-2.5 py-1 rounded text-xs border ${
                          isSelected
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                        }`}
                      >
                        {pl.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
