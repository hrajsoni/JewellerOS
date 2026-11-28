"use client";

import React, { useState, useEffect } from "react";
import { Receipt, Plus, RefreshCw, CreditCard, CheckCircle2, ShieldCheck, X } from "lucide-react";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Manual payment modal
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [payInput, setPayInput] = useState({
    amount: 4999,
    paymentMethod: "UPI",
    referenceNumber: "",
    extendMonths: 1,
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      if (res.ok) {
        const json = await res.json();
        setSubscriptions(json.subscriptions || []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;
    setSubmitting(true);
    setMsg("");

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSub.id,
          ...payInput,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to record payment.");
      }

      setMsg("Payment recorded and subscription renewed with cross-system propagation!");
      setTimeout(() => {
        setSelectedSub(null);
        setMsg("");
        fetchSubscriptions();
      }, 1200);
    } catch (err: any) {
      setMsg(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Subscriptions & Payment Ledger
            <span className="text-xs font-mono font-normal bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
              {subscriptions.length} Subscriptions
            </span>
          </h1>
          <p className="text-xs text-slate-400">
            Track all active contracts, payment receipts, manual UPI/Bank confirmations, and renewal dates.
          </p>
        </div>

        <button
          onClick={fetchSubscriptions}
          className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-lg transition-colors border border-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Refresh Ledger
        </button>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-medium">Merchant Showroom</th>
                <th className="py-3 px-4 font-medium">Plan & Rate</th>
                <th className="py-3 px-4 font-medium">Billing Period</th>
                <th className="py-3 px-4 font-medium">Last Payment</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {subscriptions.map((sub) => {
                const lastPayment = sub.payments?.[0];
                return (
                  <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-100">{sub.business?.name || "Merchant"}</div>
                      <div className="text-[11px] text-slate-400">
                        {sub.business?.city || "Jaipur"} · {sub.business?.phone}
                      </div>
                      <div className="text-[10px] font-mono text-slate-600">{sub.id}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-200">{sub.plan?.name}</span>
                      <div className="text-[11px] font-mono text-amber-400 mt-0.5">
                        ₹{Number(sub.agreedPrice).toLocaleString("en-IN")} / {sub.billingInterval}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-[11px]">
                      {sub.status === "TRIALING" ? (
                        <div className="text-amber-400 font-medium">
                          Trial ends: {sub.trialEndsAt ? new Date(sub.trialEndsAt).toLocaleDateString("en-IN") : "N/A"}
                        </div>
                      ) : (
                        <div className="text-slate-300">
                          Expires: {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "Active"}
                        </div>
                      )}
                      <div className="text-slate-500 text-[10px]">
                        Started: {new Date(sub.startedAt).toLocaleDateString("en-IN")}
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      {lastPayment ? (
                        <div>
                          <div className="text-emerald-400 font-bold">
                            ₹{Number(lastPayment.netPaid).toLocaleString("en-IN")} ({lastPayment.paymentMethod})
                          </div>
                          <div className="text-slate-500 text-[10px]">{lastPayment.invoiceNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-500">No payment yet</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedSub(sub);
                          setPayInput({
                            amount: Number(sub.agreedPrice) || 4999,
                            paymentMethod: "UPI",
                            referenceNumber: `UPI_${Date.now()}`,
                            extendMonths: 1,
                            notes: `Manual UPI confirmation for ${sub.business?.name}`,
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-medium transition-colors"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Payment Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              Record Manual Payment
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Merchant: {selectedSub.business?.name} ({selectedSub.plan?.name})
            </p>

            {msg && (
              <div
                className={`p-3 rounded-lg text-xs mb-4 ${
                  msg.startsWith("Error")
                    ? "bg-red-500/10 text-red-400 border border-red-500/30"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {msg}
              </div>
            )}

            <form onSubmit={handleManualPayment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Amount Paid (₹)</label>
                <input
                  type="number"
                  required
                  value={payInput.amount}
                  onChange={(e) => setPayInput({ ...payInput, amount: Number(e.target.value) })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Payment Method</label>
                  <select
                    value={payInput.paymentMethod}
                    onChange={(e) => setPayInput({ ...payInput, paymentMethod: e.target.value })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                  >
                    <option value="UPI">UPI / QR Code</option>
                    <option value="BANK_TRANSFER">NEFT / RTGS</option>
                    <option value="CHEQUE">Cheque / Demand Draft</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Extend Access (Months)</label>
                  <input
                    type="number"
                    min={1}
                    value={payInput.extendMonths}
                    onChange={(e) => setPayInput({ ...payInput, extendMonths: Number(e.target.value) })}
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. UTR1234567890"
                  value={payInput.referenceNumber}
                  onChange={(e) => setPayInput({ ...payInput, referenceNumber: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Internal Note</label>
                <input
                  type="text"
                  placeholder="e.g. Verified via ICICI Current Account"
                  value={payInput.notes}
                  onChange={(e) => setPayInput({ ...payInput, notes: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-semibold rounded-lg disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm & Propagate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
