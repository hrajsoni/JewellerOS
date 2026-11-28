"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TicketPercent,
  Check,
  X,
  CreditCard,
  Building2,
  Users,
  HardDrive,
  Receipt,
  Layers,
  ChevronRight,
} from "lucide-react";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassBadge } from "../glass/GlassBadge";

export interface SubscriptionBillingManagerProps {
  tenantId: string;
}

export const SubscriptionBillingManager: React.FC<SubscriptionBillingManagerProps> = ({ tenantId }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Upgrade Modal State
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanSlug, setSelectedPlanSlug] = useState<string>("growth");
  const [billingInterval, setBillingInterval] = useState<"MONTHLY" | "YEARLY">("YEARLY");
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [promoResult, setPromoResult] = useState<any>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);
  const [promoError, setPromoError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState<any>(null);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/billing/subscription?businessId=${encodeURIComponent(tenantId)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [tenantId]);

  const summary = data?.summary;
  const sub = summary?.subscription;
  const limits = summary?.limits || {};
  const features = summary?.features || {};
  const availablePlans = data?.availablePlans || [];

  // Selected plan calculation
  const targetPlan = availablePlans.find((p: any) => p.slug === selectedPlanSlug) || availablePlans[1];
  const basePrice = targetPlan
    ? billingInterval === "YEARLY"
      ? Number(targetPlan.yearlyPrice || targetPlan.monthlyPrice * 10)
      : Number(targetPlan.monthlyPrice)
    : 4999;

  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim()) return;
    setValidatingPromo(true);
    setPromoError("");
    setPromoResult(null);

    try {
      const res = await fetch("/api/billing/promo-validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode: promoCodeInput.trim(),
          planSlug: selectedPlanSlug,
          basePrice,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.valid) {
        setPromoError(json.error || "Invalid promo code.");
      } else {
        setPromoResult(json);
      }
    } catch (err: any) {
      setPromoError("Failed to validate promo code.");
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleConfirmUpgrade = async () => {
    setUpgrading(true);
    setPromoError("");

    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId: tenantId,
          targetPlanSlug: selectedPlanSlug,
          billingInterval,
          promoCode: promoResult?.valid ? promoResult.code : undefined,
          paymentMethod,
          referenceNumber: `WEB_${Date.now()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Upgrade failed.");
      }

      setUpgradeSuccess(json);
      fetchSubscription();
    } catch (err: any) {
      setPromoError(err?.message || "Failed to complete plan upgrade.");
    } finally {
      setUpgrading(false);
    }
  };

  const netPayable = promoResult?.valid ? promoResult.finalPrice : basePrice;

  return (
    <div className="space-y-6">
      {/* Active Subscription Banner */}
      <GlassPanel className="p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs uppercase tracking-wider font-bold text-[#DFC488] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#DFC488]" />
                Current JewelBill Subscription
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider border ${
                  sub?.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : sub?.isTrial
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}
              >
                {sub?.status || "TRIALING"}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {sub?.planName || "14-Day Free Evaluation"}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-xl">
              {sub?.isTrial ? (
                <span className="text-amber-400 font-medium">
                  {sub.daysRemaining} days remaining in your free trial. All features unlocked for evaluation.
                </span>
              ) : (
                <span>
                  Billed {sub?.billingInterval?.toLowerCase()} · Next renewal date:{" "}
                  {sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN") : "Active"}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <GlassButton
              variant="primary"
              size="md"
              onClick={() => {
                setUpgradeSuccess(null);
                setShowUpgradeModal(true);
              }}
              className="flex items-center gap-2 shadow-lg shadow-amber-500/10"
            >
              <Sparkles className="w-4 h-4" />
              {sub?.isTrial ? "Upgrade to Paid Plan" : "Change or Renew Plan"}
            </GlassButton>
          </div>
        </div>
      </GlassPanel>

      {/* Real-time Usage & Allowance Quotas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            key: "limit.staff_seats",
            label: "Staff Accounts",
            icon: Users,
            data: limits["limit.staff_seats"] || { current: 1, limit: 3, unit: "seats", percentage: 33 },
          },
          {
            key: "limit.branches",
            label: "Showroom Branches",
            icon: Building2,
            data: limits["limit.branches"] || { current: 1, limit: 1, unit: "branches", percentage: 100 },
          },
          {
            key: "limit.stock_items",
            label: "Stock Item Capacity",
            icon: Layers,
            data: limits["limit.stock_items"] || { current: 0, limit: 1000, unit: "items", percentage: 0 },
          },
          {
            key: "limit.storage_mb",
            label: "Cloud Media Storage",
            icon: HardDrive,
            data: limits["limit.storage_mb"] || { current: 10, limit: 1024, unit: "mb", percentage: 1 },
          },
        ].map((item) => {
          const Icon = item.icon;
          const d = item.data;
          const isNearLimit = d.percentage >= 85;

          return (
            <GlassPanel key={item.key} className="p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                <span className="font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-[#DFC488]" />
                  {item.label}
                </span>
                <span className="font-mono text-[11px]">
                  {d.current} / {d.limit} {d.unit}
                </span>
              </div>

              <div className="w-full bg-white/[0.06] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isNearLimit ? "bg-amber-400" : "bg-[#C5A059]"
                  }`}
                  style={{ width: `${Math.min(100, d.percentage)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
                <span>{d.remaining} remaining</span>
                <span className="font-mono">{d.percentage}% used</span>
              </div>
            </GlassPanel>
          );
        })}
      </div>

      {/* Feature Modules Status Grid */}
      <GlassPanel className="p-5">
        <h3 className="text-xs uppercase tracking-wider font-bold text-[#DFC488] mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#DFC488]" />
          Plan Feature Modules Entitlement
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 text-xs">
          {[
            { key: "module.pos", label: "Showroom POS Billing" },
            { key: "module.inventory", label: "Tray & Showcase Inventory" },
            { key: "module.barcode", label: "Thermal Barcode Labels" },
            { key: "module.metal_rates", label: "Live Gold Rate Board" },
            { key: "module.accounts", label: "Accounting & GST" },
            { key: "module.customers", label: "Customer Ledger (Khata)" },
            { key: "module.girvi", label: "Girvi Gold Loans" },
            { key: "module.karigar", label: "Karigar Workshop Orders" },
            { key: "module.consignment", label: "Wholesale & Consignment" },
            { key: "module.advanced_reports", label: "Executive Intelligence" },
            { key: "module.multi_branch", label: "Multi-branch Vaults" },
          ].map((mod) => {
            const isUnlocked = features[mod.key] !== false;
            return (
              <div
                key={mod.key}
                className={`p-2.5 rounded-xl border flex items-center gap-2.5 ${
                  isUnlocked
                    ? "bg-white/[0.02] border-white/[0.08] text-[var(--text-primary)]"
                    : "bg-white/[0.01] border-white/[0.04] text-[var(--text-tertiary)] opacity-60"
                }`}
              >
                {isUnlocked ? (
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-slate-500 shrink-0" />
                )}
                <span className="font-medium truncate">{mod.label}</span>
              </div>
            );
          })}
        </div>
      </GlassPanel>

      {/* Plan Upgrade & Promo Code Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#12161f] border border-white/[0.1] rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
            <button
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            {upgradeSuccess ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Plan Upgraded & Activated Successfully!
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
                  Your showroom is now active on the <strong className="text-[#DFC488]">{upgradeSuccess.planName}</strong> plan.
                  New allowances and modules have been unlocked with immediate cross-system propagation.
                </p>
                <div className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl max-w-sm mx-auto text-xs font-mono text-left">
                  <div className="flex justify-between py-1 border-b border-white/[0.06]">
                    <span className="text-slate-400">Invoice Number:</span>
                    <span className="text-white font-bold">{upgradeSuccess.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Net Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">
                      ₹{Number(upgradeSuccess.netAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
                <GlassButton variant="primary" size="md" onClick={() => setShowUpgradeModal(false)}>
                  Back to Showroom Settings
                </GlassButton>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#DFC488]" />
                    Select Your JewelBill Plan
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    All plans include cloud backups, thermal barcode printing, and GST compliance.
                  </p>
                </div>

                {/* Interval Toggle */}
                <div className="flex items-center justify-center gap-3 p-1.5 bg-white/[0.03] border border-white/[0.08] rounded-xl max-w-xs mx-auto text-xs">
                  <button
                    onClick={() => {
                      setBillingInterval("MONTHLY");
                      setPromoResult(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                      billingInterval === "MONTHLY"
                        ? "bg-[#C5A059] text-black font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Monthly Billing
                  </button>
                  <button
                    onClick={() => {
                      setBillingInterval("YEARLY");
                      setPromoResult(null);
                    }}
                    className={`flex-1 py-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 ${
                      billingInterval === "YEARLY"
                        ? "bg-[#C5A059] text-black font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Annual Billing
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 rounded">
                      2 Mo Free
                    </span>
                  </button>
                </div>

                {/* Plan Selector Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {availablePlans
                    .filter((p: any) => p.slug !== "trial")
                    .map((p: any) => {
                      const isSelected = selectedPlanSlug === p.slug;
                      const price =
                        billingInterval === "YEARLY"
                          ? Number(p.yearlyPrice || p.monthlyPrice * 10)
                          : Number(p.monthlyPrice);

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPlanSlug(p.slug);
                            setPromoResult(null);
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                            isSelected
                              ? "bg-[#C5A059]/10 border-[#C5A059] shadow-lg shadow-amber-500/10"
                              : "bg-white/[0.02] border-white/[0.08] hover:border-white/[0.2]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-sm text-[var(--text-primary)]">{p.name}</h4>
                              {p.badge && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-[#DFC488] font-bold">
                                  {p.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[var(--text-tertiary)] mb-3">{p.description}</p>
                            <div className="font-mono text-xl font-bold text-[#DFC488] mb-2">
                              ₹{price.toLocaleString("en-IN")}
                              <span className="text-xs font-normal text-slate-400">
                                /{billingInterval === "YEARLY" ? "year" : "mo"}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-white/[0.06] text-[11px] space-y-1 text-slate-300">
                            <div>✓ Full POS & Barcodes</div>
                            <div>
                              {p.slug === "growth" || p.slug === "enterprise"
                                ? "✓ Girvi & Karigar Included"
                                : "✕ Girvi / Karigar (Growth only)"}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Promo Code Input Box */}
                <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Promotional / Referral Code
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <TicketPercent className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Try: WELCOME2026 or SARAFABAZAR"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                        className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/[0.1] rounded-lg text-xs text-white uppercase font-mono tracking-wider focus:outline-none focus:border-[#C5A059]"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={validatingPromo || !promoCodeInput.trim()}
                      className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold rounded-lg text-white transition-colors disabled:opacity-50"
                    >
                      {validatingPromo ? "Verifying..." : "Apply"}
                    </button>
                  </div>

                  {promoError && <p className="text-xs text-red-400 mt-1">{promoError}</p>}

                  {promoResult?.valid && (
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Check className="w-4 h-4" />
                        Code <strong className="font-mono">{promoResult.code}</strong> applied! (
                        {promoResult.description || "Discount confirmed"})
                      </span>
                      <span className="font-bold font-mono">
                        -₹{promoResult.discountAmount?.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Net Summary & Checkout Button */}
                <div className="p-4 bg-[#C5A059]/10 border border-[#C5A059]/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-400">Total Net Amount Payable:</div>
                    <div className="text-2xl font-bold font-mono text-[#DFC488]">
                      ₹{netPayable.toLocaleString("en-IN")}{" "}
                      <span className="text-xs font-normal text-slate-400">
                        (+ GST applicable · Instant Activation)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="p-2 bg-black/60 border border-white/[0.1] rounded-lg text-xs text-white"
                    >
                      <option value="UPI">UPI / Instant QR</option>
                      <option value="NETBANKING">Net Banking</option>
                      <option value="CARD">Credit / Debit Card</option>
                    </select>

                    <GlassButton
                      variant="primary"
                      size="md"
                      onClick={handleConfirmUpgrade}
                      disabled={upgrading}
                      className="font-bold flex items-center gap-2"
                    >
                      {upgrading ? (
                        <span>Activating...</span>
                      ) : (
                        <>
                          <span>Pay & Activate Now</span>
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </GlassButton>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
