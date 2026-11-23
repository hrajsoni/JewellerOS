"use client";

import React, { useState } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import { useAuth } from "../../modules/auth/AuthContext";
import { RoleType, PermissionKey } from "../../modules/auth/types";
import { getRoleBadgeColor, ROLE_PERMISSIONS } from "../../modules/auth/permissions";
import {
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Briefcase,
  Lock,
  Sparkles,
} from "lucide-react";

export const LoginModal: React.FC = () => {
  const {
    user,
    allUsers,
    isLoginModalOpen,
    closeLoginModal,
    switchUser,
    login,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"quick_switch" | "pin_login">("quick_switch");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [pin, setPin] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!emailOrPhone.trim() || !pin.trim()) {
      setErrorMsg("Please enter both email/phone and your PIN.");
      return;
    }

    const res = login({ emailOrPhone, pinOrPassword: pin });
    if (res.success) {
      setSuccessToast(`Signed in successfully!`);
      setTimeout(() => {
        setSuccessToast(null);
        closeLoginModal();
      }, 700);
    } else {
      setErrorMsg(res.error || "Authentication failed");
    }
  };

  const handleSelectUser = (userId: string) => {
    switchUser(userId);
    setSuccessToast("Staff profile switched!");
    setTimeout(() => {
      setSuccessToast(null);
      closeLoginModal();
    }, 600);
  };

  const PERMISSION_CHECKLIST: { key: PermissionKey; label: string }[] = [
    { key: "VIEW_PURCHASE_COSTS", label: "View Purchase Cost" },
    { key: "VIEW_PROFIT_MARGINS", label: "View Profit Margins" },
    { key: "VIEW_OWNER_REPORTS", label: "Owner Financial Reports" },
    { key: "MANAGE_GIRVI", label: "Girvi / Loan Vault" },
    { key: "MANAGE_KARIGAR", label: "Karigar Metal Ledger" },
    { key: "MANAGE_EMPLOYEES", label: "Staff & Salary Control" },
  ];

  return (
    <GlassDialog
      isOpen={isLoginModalOpen}
      onClose={closeLoginModal}
      title="Staff Identity & Permissions Control"
      description="Jewellery OS strict Role-Based Access Control (RBAC). Restricts purchase costs, profit margins, and confidential shop ledgers."
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.08] gap-4">
          <button
            onClick={() => {
              setActiveTab("quick_switch");
              setErrorMsg(null);
            }}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeTab === "quick_switch"
                ? "text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Showroom Fast Role Switcher
          </button>
          <button
            onClick={() => {
              setActiveTab("pin_login");
              setErrorMsg(null);
            }}
            className={`pb-2.5 text-xs font-semibold transition-all relative ${
              activeTab === "pin_login"
                ? "text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Security PIN Login
          </button>
        </div>

        {/* Success Alert */}
        {successToast && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successToast}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
            <XCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: Fast Role Switcher */}
        {activeTab === "quick_switch" && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--text-secondary)]">
              Select any staff profile below to simulate showroom operations under their exact security permissions.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {allUsers.map((u) => {
                const isSelected = u.id === user.id;
                const badgeColor = getRoleBadgeColor(u.role);

                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? "bg-[#C5A059]/15 border-[#C5A059] shadow-md shadow-[#C5A059]/10"
                        : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.12]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                            isSelected
                              ? "bg-[#C5A059] text-black"
                              : "bg-white/10 text-[var(--text-secondary)]"
                          }`}
                        >
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-xs text-[var(--text-primary)]">
                            {u.fullName}
                          </div>
                          <div className="text-[10px] text-[var(--text-tertiary)]">
                            {u.phone}
                          </div>
                        </div>
                      </div>
                      <GlassBadge variant={badgeColor}>
                        {u.role.replace("_", " ")}
                      </GlassBadge>
                    </div>

                    <div className="text-[10px] text-[var(--text-tertiary)] flex items-center justify-between pt-1 border-t border-white/[0.04]">
                      <span>PIN: {u.pin}</span>
                      {isSelected && (
                        <span className="text-[#DFC488] font-medium flex items-center gap-1">
                          <CheckCircle2 size={11} /> Active Now
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Active Role Permissions Card */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#DFC488]" />
                  Active Permissions: {user.fullName} ({user.role})
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  Tenant: {user.businessName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {PERMISSION_CHECKLIST.map((item) => {
                  const allowed = ROLE_PERMISSIONS[user.role]?.[item.key];
                  return (
                    <div
                      key={item.key}
                      className={`px-2 py-1.5 rounded-lg border text-[11px] flex items-center gap-1.5 ${
                        allowed
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-red-500/5 border-red-500/15 text-red-400/80"
                      }`}
                    >
                      {allowed ? (
                        <CheckCircle2 size={12} className="shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle size={12} className="shrink-0 text-red-400" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PIN Login */}
        {activeTab === "pin_login" && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <GlassInput
              label="Mobile Number or Employee Email"
              type="text"
              placeholder="+91 94140 12345 or harshit@sandhyajewellers.com"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              prefixSymbol={<User size={14} className="text-[var(--text-tertiary)]" />}
              required
            />

            <GlassInput
              label="6-Digit Security PIN"
              type="password"
              placeholder="••••••"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              prefixSymbol={<KeyRound size={14} className="text-[var(--text-tertiary)]" />}
              required
            />

            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-[var(--text-tertiary)] flex items-start gap-2">
              <Sparkles size={14} className="text-[#DFC488] shrink-0 mt-0.5" />
              <span>
                Default demo PIN for all seed staff accounts is{" "}
                <code className="text-[#DFC488] font-mono font-semibold">123456</code>.
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <GlassButton variant="ghost" size="md" onClick={closeLoginModal}>
                Cancel
              </GlassButton>
              <GlassButton variant="primary" size="md" type="submit">
                Verify & Sign In
              </GlassButton>
            </div>
          </form>
        )}
      </div>
    </GlassDialog>
  );
};
