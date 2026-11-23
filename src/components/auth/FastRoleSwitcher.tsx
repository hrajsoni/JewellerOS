"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../modules/auth/AuthContext";
import { getRoleBadgeColor } from "../../modules/auth/permissions";
import { GlassBadge } from "../glass/GlassBadge";
import {
  User,
  ChevronDown,
  ShieldCheck,
  EyeOff,
  LogOut,
  Users,
  KeyRound,
} from "lucide-react";

export const FastRoleSwitcher: React.FC = () => {
  const { user, role, allUsers, switchUser, openLoginModal, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const badgeColor = getRoleBadgeColor(role);
  const isCostHidden = role === "SALESPERSON" || role === "KARIGAR_MANAGER";

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-xs group"
        title="Active Staff & Security Privileges"
      >
        <div className="w-5 h-5 rounded-full bg-[#C5A059]/20 text-[#DFC488] font-bold text-[10px] flex items-center justify-center">
          {user.fullName.charAt(0)}
        </div>
        <div className="text-left">
          <div className="flex items-center gap-1.5 leading-tight">
            <span className="font-semibold text-[var(--text-primary)] text-[11px] truncate max-w-[100px] sm:max-w-[130px]">
              {user.fullName}
            </span>
            <GlassBadge variant={badgeColor}>
              {role.replace("_", " ")}
            </GlassBadge>
            <ChevronDown
              size={12}
              className={`text-[var(--text-tertiary)] transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </div>
          {isCostHidden && (
            <div className="text-[9px] text-amber-400/90 font-mono flex items-center gap-1">
              <EyeOff size={9} /> Purchase Costs Masked
            </div>
          )}
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[var(--surface-primary)] border border-white/[0.1] shadow-2xl backdrop-blur-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-2 py-1.5 border-b border-white/[0.06] mb-1">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">
              Current Session
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              {user.fullName}
            </div>
            <div className="text-[10px] text-[var(--text-secondary)] font-mono">
              {user.email}
            </div>
          </div>

          <div className="py-1">
            <div className="text-[10px] text-[var(--text-tertiary)] px-2 py-1 uppercase tracking-wider font-semibold">
              Switch Showroom Staff
            </div>
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {allUsers.map((u) => {
                const isSelected = u.id === user.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left ${
                      isSelected
                        ? "bg-[#C5A059]/15 text-[#DFC488] font-medium"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="truncate">{u.fullName}</span>
                    <span className="text-[9px] text-[var(--text-tertiary)] uppercase">
                      {u.role.replace("_", " ")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1.5 mt-1 border-t border-white/[0.06] flex flex-col gap-1">
            <button
              onClick={() => {
                setIsOpen(false);
                openLoginModal();
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04] transition-colors"
            >
              <KeyRound size={13} className="text-[#DFC488]" />
              <span>Full RBAC & PIN Manager</span>
            </button>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut size={13} />
              <span>Reset to Owner Default</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
