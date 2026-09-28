"use client";

import React, { useState } from "react";
import { JewellerTenant, RegisterJewellerInput } from "../../modules/tenants/types";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import {
  Building2,
  CheckCircle2,
  Plus,
  ShieldCheck,
  MapPin,
  Phone,
  Coins,
  Sparkles,
  Lock,
  ArrowRight,
  Store,
} from "lucide-react";
import { formatINR } from "../../lib/formatters";

export interface JewellerSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTenant: JewellerTenant;
  allTenants: JewellerTenant[];
  onSelectTenant: (tenantId: string) => void;
  onRegisterTenant: (input: RegisterJewellerInput) => void;
}

export const JewellerSwitcherModal: React.FC<JewellerSwitcherModalProps> = ({
  isOpen,
  onClose,
  activeTenant,
  allTenants,
  onSelectTenant,
  onRegisterTenant,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "register">("list");

  // Registration Form State
  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [tagline, setTagline] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("Jaipur");
  const [address, setAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [bisLicense, setBisLicense] = useState("");
  const [goldRate, setGoldRate] = useState("150000");
  const [silverRate, setSilverRate] = useState("95000");
  const [makingPct, setMakingPct] = useState("18");

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !ownerName.trim()) return;

    onRegisterTenant({
      businessName,
      ownerName,
      tagline: tagline || undefined,
      phone,
      email: email || undefined,
      city,
      address,
      gstin: gstin || "URP (Unregistered Person)",
      bisLicense: bisLicense || undefined,
      defaultGoldRate: parseFloat(goldRate) || 150000,
      defaultSilverRate: parseFloat(silverRate) || 95000,
      defaultMakingPercentage: parseFloat(makingPct) || 18,
    });

    // Reset & return to list
    setBusinessName("");
    setOwnerName("");
    setTagline("");
    setAddress("");
    setGstin("");
    setBisLicense("");
    setViewMode("list");
    onClose();
  };

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        viewMode === "list"
          ? "Jewellery Showroom Accounts"
          : "Register New Jewellery Showroom"
      }
      description={
        viewMode === "list"
          ? "Switch between active showrooms or register a new store with dedicated, isolated data storage."
          : "Each showroom receives its own isolated database for invoices, inventory, rates, and customer records."
      }
      maxWidth={viewMode === "list" ? "lg" : "xl"}
    >
      {viewMode === "list" ? (
        <div className="space-y-5 text-xs">
          {/* Security & Partition Banner */}
          <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.06] flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#C5A059]/15 text-[#DFC488] shrink-0">
              <Lock size={16} />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-[var(--text-primary)]">
                Multi-Tenant Vault Isolation
              </div>
              <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Each jeweller&apos;s transactions, inventory weights, Karat rates, and client lists are strictly partitioned and encrypted locally.
              </div>
            </div>
            <GlassButton
              variant="primary"
              size="sm"
              onClick={() => setViewMode("register")}
              icon={<Plus size={14} />}
            >
              Add Showroom
            </GlassButton>
          </div>

          {/* Tenants List */}
          <div className="space-y-3">
            {allTenants.map((t) => {
              const isActive = t.id === activeTenant.id;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (!isActive) {
                      onSelectTenant(t.id);
                      onClose();
                    }
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                    isActive
                      ? "bg-[#C5A059]/10 border-[#C5A059]/40 shadow-[0_0_20px_rgba(197,160,89,0.1)]"
                      : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.12]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-[var(--text-primary)]">
                          {t.businessName}
                        </span>
                        {isActive && (
                          <GlassBadge variant="gold" size="sm">
                            Active Showroom
                          </GlassBadge>
                        )}
                        {t.isDefault && (
                          <span className="text-[10px] text-[var(--text-tertiary)] font-mono">
                            Primary
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
                        <span>Proprietor: <strong className="text-[var(--text-primary)]">{t.ownerName}</strong></span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <MapPin size={11} className="text-[var(--text-tertiary)]" />
                          {t.city}
                        </span>
                      </div>

                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        GSTIN: {t.gstin} {t.bisLicense ? `· BIS: ${t.bisLicense}` : ""}
                      </div>
                    </div>

                    <div className="text-right space-y-1 shrink-0">
                      <div className="text-[11px] font-mono text-[#DFC488] font-medium">
                        Gold: {formatINR(t.defaultGoldRate)}/10g
                      </div>
                      <div className="text-[10px] text-[var(--text-tertiary)] font-mono">
                        Silver: {formatINR(t.defaultSilverRate)}/kg
                      </div>
                    </div>
                  </div>

                  {!isActive && (
                    <div className="mt-3 pt-2.5 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span>Click to switch workspace & database</span>
                      <span className="text-[#DFC488] flex items-center gap-1 font-medium">
                        Open Store <ArrowRight size={12} />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Register Showroom Form */
        <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20 text-[11px] text-[#DFC488]">
            Enter your jewellery business details. A separate private database will be provisioned immediately for all counter pricing, bills, and stock records.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="Jewellery Business / Brand Name *"
              placeholder="e.g. Kalyan Heritage Jewellers"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
            />
            <GlassInput
              label="Proprietor / Owner Name *"
              placeholder="e.g. Harshit Raj"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassInput
              label="Contact Phone *"
              placeholder="+91 94140 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <GlassInput
              label="Official Email"
              placeholder="contact@jeweller.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <GlassInput
              label="City / District *"
              placeholder="Jaipur"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <GlassInput
            label="Showroom Registered Address"
            placeholder="Shop No., Market / Sarafa Bazar, Street, City, State"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <GlassInput
              label="GSTIN / Tax ID"
              placeholder="08AAAAJ1234F1Z8"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
            />
            <GlassInput
              label="BIS Hallmark License No. (Optional)"
              placeholder="HM/C-8901234567"
              value={bisLicense}
              onChange={(e) => setBisLicense(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <GlassInput
              label="Default 24K Gold Rate (per 10g)"
              type="number"
              prefixSymbol="₹"
              value={goldRate}
              onChange={(e) => setGoldRate(e.target.value)}
            />
            <GlassInput
              label="Default Fine Silver Rate (per kg)"
              type="number"
              prefixSymbol="₹"
              value={silverRate}
              onChange={(e) => setSilverRate(e.target.value)}
            />
            <GlassInput
              label="Default Making % (e.g. 18%)"
              type="number"
              suffixSymbol="%"
              value={makingPct}
              onChange={(e) => setMakingPct(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <GlassButton
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => setViewMode("list")}
            >
              Back to Showrooms
            </GlassButton>
            <div className="flex items-center gap-2">
              <GlassButton
                variant="ghost"
                size="sm"
                type="button"
                onClick={onClose}
              >
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="sm" type="submit">
                Provision Store & Open Workspace
              </GlassButton>
            </div>
          </div>
        </form>
      )}
    </GlassDialog>
  );
};
