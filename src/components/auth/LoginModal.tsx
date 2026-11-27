"use client";

import React, { useState } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import { useAuth, SendOtpResponse } from "../../modules/auth/AuthContext";
import { RoleType, PermissionKey } from "../../modules/auth/types";
import { getRoleBadgeColor, ROLE_PERMISSIONS } from "../../modules/auth/permissions";
import {
  ShieldCheck,
  User,
  KeyRound,
  CheckCircle2,
  XCircle,
  Sparkles,
  Mail,
  Phone,
  UserPlus,
  Send,
  Crown,
} from "lucide-react";

type AuthTab = "quick_switch" | "pin_login" | "otp_login" | "signup";

const PERMISSION_CHECKLIST: { key: PermissionKey; label: string }[] = [
  { key: "VIEW_PURCHASE_COSTS", label: "View Purchase Cost" },
  { key: "VIEW_PROFIT_MARGINS", label: "View Profit Margins" },
  { key: "VIEW_OWNER_REPORTS", label: "Owner Financial Reports" },
  { key: "MANAGE_GIRVI", label: "Girvi / Loan Vault" },
  { key: "MANAGE_KARIGAR", label: "Karigar Metal Ledger" },
  { key: "MANAGE_EMPLOYEES", label: "Staff & Salary Control" },
];

const AuthPanels: React.FC<{ isGateMode?: boolean }> = ({ isGateMode = false }) => {
  const {
    user,
    allUsers,
    isAuthenticated,
    closeLoginModal,
    switchUser,
    authenticateWithPin,
    sendOtp,
    loginWithOtp,
    registerAccount,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<AuthTab>(
    isGateMode || !isAuthenticated ? "pin_login" : "quick_switch"
  );

  // Shared Feedback
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // PIN Login State
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [pin, setPin] = useState("");

  // OTP Login State
  const [otpLoginEmail, setOtpLoginEmail] = useState("");
  const [otpLoginPhone, setOtpLoginPhone] = useState("");
  const [otpLoginChallenge, setOtpLoginChallenge] = useState<SendOtpResponse | null>(null);
  const [otpLoginCode, setOtpLoginCode] = useState("");

  // Signup State
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPin, setSignupPin] = useState("");
  const [signupRole, setSignupRole] = useState<RoleType>("OWNER");
  const [signupBusinessName, setSignupBusinessName] = useState("Sandhya Jewellers");
  const [signupChallenge, setSignupChallenge] = useState<SendOtpResponse | null>(null);
  const [signupOtpCode, setSignupOtpCode] = useState("");

  const resetMessages = () => {
    setErrorMsg(null);
    setSuccessToast(null);
  };

  const resolveChannelHint = (emailStr: string, phoneStr: string) => {
    const hasE = emailStr.trim().length > 0;
    const hasP = phoneStr.replace(/[^0-9]/g, "").length >= 6;
    if (hasE && hasP) {
      return `Both provided → OTP will be sent to your Email (${emailStr.trim().toLowerCase()})`;
    }
    if (hasE) {
      return `OTP will be sent to your Email (${emailStr.trim().toLowerCase()})`;
    }
    if (hasP) {
      return `OTP will be sent to your Mobile Phone (${phoneStr.trim()})`;
    }
    return "Provide Email, Mobile Phone, or both (Email OTP used when both are entered).";
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!emailOrPhone.trim() || !pin.trim()) {
      setErrorMsg("Please enter both email/phone and your PIN.");
      return;
    }

    setBusy(true);
    const res = await authenticateWithPin(emailOrPhone.trim(), pin.trim());
    setBusy(false);

    if (res.success) {
      setSuccessToast("Signed in successfully!");
      if (!isGateMode) {
        setTimeout(() => {
          setSuccessToast(null);
          closeLoginModal();
        }, 500);
      }
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
    }, 500);
  };

  const handleSendLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setBusy(true);
    const res = await sendOtp({
      email: otpLoginEmail.trim() || undefined,
      phone: otpLoginPhone.trim() || undefined,
      purpose: "LOGIN",
    });
    setBusy(false);

    if (!res.success) {
      setErrorMsg(res.error || "Could not send login OTP.");
      return;
    }
    setOtpLoginChallenge(res);
    setOtpLoginCode("");
    setSuccessToast(`6-digit OTP dispatched to ${res.channel} (${res.maskedTarget})`);
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!otpLoginChallenge?.challengeId || !otpLoginCode.trim()) {
      setErrorMsg("Enter the 6-digit OTP code.");
      return;
    }
    setBusy(true);
    const res = await loginWithOtp({
      email: otpLoginEmail.trim() || undefined,
      phone: otpLoginPhone.trim() || undefined,
      challengeId: otpLoginChallenge.challengeId,
      otp: otpLoginCode.trim(),
    });
    setBusy(false);

    if (res.success) {
      setSuccessToast("OTP verified! Signing in...");
      setOtpLoginChallenge(null);
      if (!isGateMode) {
        setTimeout(() => {
          setSuccessToast(null);
          closeLoginModal();
        }, 500);
      }
    } else {
      setErrorMsg(res.error || "OTP verification failed.");
    }
  };

  const handleSendSignupOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!signupName.trim()) {
      setErrorMsg("Please enter your Full Name.");
      return;
    }
    if (signupPin.trim().length < 4) {
      setErrorMsg("Please choose a 4 to 6-digit Security PIN.");
      return;
    }

    setBusy(true);
    const res = await sendOtp({
      email: signupEmail.trim() || undefined,
      phone: signupPhone.trim() || undefined,
      purpose: "SIGNUP",
    });
    setBusy(false);

    if (!res.success) {
      setErrorMsg(res.error || "Failed to send verification OTP.");
      return;
    }

    setSignupChallenge(res);
    setSignupOtpCode("");
    setSuccessToast(`Verification OTP sent via ${res.channel} (${res.maskedTarget})`);
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!signupChallenge?.challengeId || !signupOtpCode.trim()) {
      setErrorMsg("Enter the 6-digit OTP to verify your account.");
      return;
    }

    setBusy(true);
    const res = await registerAccount({
      fullName: signupName.trim(),
      email: signupEmail.trim() || undefined,
      phone: signupPhone.trim() || undefined,
      pin: signupPin.trim(),
      role: signupRole,
      businessId: user?.businessId || "tenant-sandhya-jaipur",
      businessName: signupBusinessName.trim() || "Sandhya Jewellers",
      challengeId: signupChallenge.challengeId,
      otp: signupOtpCode.trim(),
    });
    setBusy(false);

    if (res.success) {
      setSuccessToast("Account verified & created in Neon PostgreSQL!");
      setSignupChallenge(null);
      if (!isGateMode) {
        setTimeout(() => {
          setSuccessToast(null);
          closeLoginModal();
        }, 600);
      }
    } else {
      setErrorMsg(res.error || "Registration failed.");
    }
  };

  return (
    <div className="space-y-5">
      {/* Tab Selector */}
      <div className="flex flex-wrap border-b border-white/[0.08] gap-4">
        {!isGateMode && isAuthenticated && (
          <button
            type="button"
            onClick={() => {
              setActiveTab("quick_switch");
              resetMessages();
            }}
            className={`pb-2.5 text-xs font-semibold transition-all ${
              activeTab === "quick_switch"
                ? "text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Fast Role Switcher
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setActiveTab("pin_login");
            resetMessages();
          }}
          className={`pb-2.5 text-xs font-semibold transition-all ${
            activeTab === "pin_login"
              ? "text-[#DFC488] border-b-2 border-[#C5A059]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          }`}
        >
          PIN Login
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("otp_login");
            resetMessages();
          }}
          className={`pb-2.5 text-xs font-semibold transition-all ${
            activeTab === "otp_login"
              ? "text-[#DFC488] border-b-2 border-[#C5A059]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          }`}
        >
          OTP Login
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("signup");
            resetMessages();
          }}
          className={`pb-2.5 text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === "signup"
              ? "text-[#DFC488] border-b-2 border-[#C5A059]"
              : "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          }`}
        >
          <UserPlus size={13} />
          Create Account
        </button>
      </div>

      {/* Success Alert */}
      {successToast && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
          <XCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: Fast Role Switcher (only when already authenticated inside modal) */}
      {activeTab === "quick_switch" && !isGateMode && isAuthenticated && (
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-secondary)]">
            Select any staff profile below to switch showroom permissions immediately.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
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
                          {u.phone || u.email}
                        </div>
                      </div>
                    </div>
                    <GlassBadge variant={badgeColor}>{u.role.replace("_", " ")}</GlassBadge>
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
            label="Mobile Number or Registered Email"
            type="text"
            placeholder="+91 94140 12345 or harshit@sandhyajewellers.com"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            prefixSymbol={<User size={14} className="text-[var(--text-tertiary)]" />}
            required
          />

          <GlassInput
            label="Security PIN (4–6 Digits)"
            type="password"
            placeholder="••••••"
            maxLength={12}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            prefixSymbol={<KeyRound size={14} className="text-[var(--text-tertiary)]" />}
            required
          />

          <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-[11px] text-[var(--text-tertiary)] flex items-start gap-2">
            <Sparkles size={14} className="text-[#DFC488] shrink-0 mt-0.5" />
            <span>
              Seeded Owner PIN (<code className="text-[#DFC488] font-mono">884219</code> for{" "}
              <code className="text-[var(--text-secondary)]">harshit@sandhyajewellers.com</code>) or sign in with OTP / Create a new account.
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {!isGateMode && (
              <GlassButton variant="ghost" size="md" type="button" onClick={closeLoginModal}>
                Cancel
              </GlassButton>
            )}
            <GlassButton variant="primary" size="md" type="submit" disabled={busy}>
              {busy ? "Verifying..." : "Verify PIN & Sign In"}
            </GlassButton>
          </div>
        </form>
      )}

      {/* TAB 3: OTP Login (Email prioritized over Phone when both entered) */}
      {activeTab === "otp_login" && (
        <div className="space-y-4">
          {!otpLoginChallenge ? (
            <form onSubmit={handleSendLoginOtp} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Registered Email"
                  type="email"
                  placeholder="name@domain.com"
                  value={otpLoginEmail}
                  onChange={(e) => setOtpLoginEmail(e.target.value)}
                  prefixSymbol={<Mail size={14} className="text-[var(--text-tertiary)]" />}
                />
                <GlassInput
                  label="Registered Mobile Phone"
                  type="tel"
                  placeholder="9829012345"
                  value={otpLoginPhone}
                  onChange={(e) => setOtpLoginPhone(e.target.value)}
                  prefixSymbol={<Phone size={14} className="text-[var(--text-tertiary)]" />}
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/25 text-[11px] text-[#DFC488]">
                {resolveChannelHint(otpLoginEmail, otpLoginPhone)}
              </div>

              <div className="flex justify-end gap-3 pt-1">
                {!isGateMode && (
                  <GlassButton variant="ghost" size="md" type="button" onClick={closeLoginModal}>
                    Cancel
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={<Send size={13} />}
                  disabled={busy}
                >
                  {busy ? "Sending OTP..." : "Send Login OTP"}
                </GlassButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyLoginOtp} className="space-y-4">
              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] text-xs space-y-1">
                <div className="text-[var(--text-secondary)]">
                  OTP sent via{" "}
                  <span className="font-semibold text-[#DFC488]">{otpLoginChallenge.channel}</span> to{" "}
                  <span className="font-mono text-[var(--text-primary)]">
                    {otpLoginChallenge.maskedTarget}
                  </span>
                </div>
                {otpLoginChallenge.devOtpPreview && (
                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-amber-300">
                    <span>
                      Sandbox OTP Preview (no mail/SMS gateway configured):{" "}
                      <strong className="font-mono text-sm tracking-widest">
                        {otpLoginChallenge.devOtpPreview}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setOtpLoginCode(otpLoginChallenge.devOtpPreview || "")}
                      className="underline text-[#DFC488] font-medium"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>

              <GlassInput
                label="Enter 6-Digit Verification OTP"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={otpLoginCode}
                onChange={(e) => setOtpLoginCode(e.target.value.replace(/[^0-9]/g, ""))}
                prefixSymbol={<KeyRound size={14} className="text-[var(--text-tertiary)]" />}
                required
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setOtpLoginChallenge(null)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline"
                >
                  Change Email / Phone
                </button>
                <GlassButton variant="primary" size="md" type="submit" disabled={busy}>
                  {busy ? "Signing In..." : "Verify OTP & Sign In"}
                </GlassButton>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 4: Create Account with OTP Verification */}
      {activeTab === "signup" && (
        <div className="space-y-4">
          {!signupChallenge ? (
            <form onSubmit={handleSendSignupOtp} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Full Name *"
                  placeholder="e.g. Ananya Soni"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  prefixSymbol={<User size={14} className="text-[var(--text-tertiary)]" />}
                  required
                />
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--text-secondary)] block">
                    Staff / Owner Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as RoleType)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/40 border border-white/[0.08] text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                  >
                    <option value="OWNER">Owner (Full Control)</option>
                    <option value="MANAGER">Manager</option>
                    <option value="SALESPERSON">Salesperson</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="INVENTORY_CLERK">Inventory Clerk</option>
                    <option value="KARIGAR_MANAGER">Karigar Manager</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Email Address (Optional if Phone given)"
                  type="email"
                  placeholder="ananya@jewels.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  prefixSymbol={<Mail size={14} className="text-[var(--text-tertiary)]" />}
                />
                <GlassInput
                  label="Mobile Number (Optional if Email given)"
                  type="tel"
                  placeholder="9829012345"
                  value={signupPhone}
                  onChange={(e) => setSignupPhone(e.target.value)}
                  prefixSymbol={<Phone size={14} className="text-[var(--text-tertiary)]" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <GlassInput
                  label="Set 4–6 Digit Security PIN *"
                  type="password"
                  placeholder="••••••"
                  maxLength={6}
                  value={signupPin}
                  onChange={(e) => setSignupPin(e.target.value)}
                  prefixSymbol={<KeyRound size={14} className="text-[var(--text-tertiary)]" />}
                  required
                />
                <GlassInput
                  label="Showroom Business Name"
                  placeholder="Sandhya Jewellers"
                  value={signupBusinessName}
                  onChange={(e) => setSignupBusinessName(e.target.value)}
                />
              </div>

              <div className="p-2.5 rounded-lg bg-[#C5A059]/10 border border-[#C5A059]/25 text-[11px] text-[#DFC488]">
                {resolveChannelHint(signupEmail, signupPhone)}
              </div>

              <div className="flex justify-end gap-3 pt-1">
                {!isGateMode && (
                  <GlassButton variant="ghost" size="md" type="button" onClick={closeLoginModal}>
                    Cancel
                  </GlassButton>
                )}
                <GlassButton
                  variant="primary"
                  size="md"
                  type="submit"
                  icon={<Send size={13} />}
                  disabled={busy}
                >
                  {busy ? "Sending OTP..." : "Send Verification OTP"}
                </GlassButton>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCompleteSignup} className="space-y-4">
              <div className="p-3 rounded-lg bg-black/40 border border-white/[0.08] text-xs space-y-1">
                <div className="text-[var(--text-secondary)]">
                  Confirming account for <strong className="text-white">{signupName}</strong> via{" "}
                  <span className="font-semibold text-[#DFC488]">{signupChallenge.channel}</span> OTP
                  sent to{" "}
                  <span className="font-mono text-[var(--text-primary)]">
                    {signupChallenge.maskedTarget}
                  </span>
                </div>
                {signupChallenge.devOtpPreview && (
                  <div className="pt-1.5 flex items-center justify-between text-[11px] text-amber-300">
                    <span>
                      Sandbox OTP Preview (no mail/SMS gateway configured):{" "}
                      <strong className="font-mono text-sm tracking-widest">
                        {signupChallenge.devOtpPreview}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setSignupOtpCode(signupChallenge.devOtpPreview || "")}
                      className="underline text-[#DFC488] font-medium"
                    >
                      Auto-fill
                    </button>
                  </div>
                )}
              </div>

              <GlassInput
                label="Enter 6-Digit Verification OTP *"
                type="text"
                maxLength={6}
                placeholder="123456"
                value={signupOtpCode}
                onChange={(e) => setSignupOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                prefixSymbol={<KeyRound size={14} className="text-[var(--text-tertiary)]" />}
                required
              />

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setSignupChallenge(null)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline"
                >
                  Edit Registration Details
                </button>
                <GlassButton variant="primary" size="md" type="submit" disabled={busy}>
                  {busy ? "Creating Account..." : "Verify OTP & Create Account"}
                </GlassButton>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export const AuthGateScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#08090C] text-[var(--text-primary)] flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface-primary)] border border-white/[0.08] shadow-2xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-white/[0.06] pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8E6D2F] flex items-center justify-center text-[#08090C] shadow-lg shadow-[#C5A059]/20">
            <Crown size={20} />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              JewelleryOS · Showroom Sign In
            </h1>
            <p className="text-xs text-[var(--text-tertiary)]">
              Sign in with PIN or OTP, or create a new OTP-verified account on Neon PostgreSQL.
            </p>
          </div>
        </div>

        <AuthPanels isGateMode />
      </div>
    </div>
  );
};

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal } = useAuth();

  if (!isLoginModalOpen) return null;

  return (
    <GlassDialog
      isOpen={isLoginModalOpen}
      onClose={closeLoginModal}
      title="Staff Identity, Account Signup & OTP Auth"
      description="Switch showroom roles, sign in via PIN or OTP, or register a new OTP-verified user."
      maxWidth="lg"
    >
      <AuthPanels />
    </GlassDialog>
  );
};
