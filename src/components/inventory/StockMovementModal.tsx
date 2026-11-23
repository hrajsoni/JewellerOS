"use client";

import React, { useState } from "react";
import { GlassDialog } from "../glass/GlassDialog";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import { StockItem, StockStatus, StockMovementRecord } from "../../modules/inventory/types";
import { useAuth } from "../../modules/auth/AuthContext";
import {
  ArrowRightLeft,
  ShieldCheck,
  MapPin,
  Clock,
  History,
  CheckCircle2,
  Lock,
} from "lucide-react";

export interface StockMovementModalProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (
    stockItemId: string,
    newStatus: StockStatus,
    reason: string,
    newLocation?: string
  ) => void;
  movementHistory: StockMovementRecord[];
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  item,
  isOpen,
  onClose,
  onUpdateStatus,
  movementHistory,
}) => {
  const { user } = useAuth();
  const [newStatus, setNewStatus] = useState<StockStatus>("in_vault");
  const [newLocation, setNewLocation] = useState<string>("");
  const [reason, setReason] = useState<string>("");

  if (!isOpen || !item) return null;

  const itemMovements = movementHistory.filter((m) => m.stockItemId === item.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStatus(
      item.id,
      newStatus,
      reason.trim() || `Status updated to ${newStatus}`,
      newLocation.trim() || undefined
    );
    onClose();
  };

  const STATUS_OPTIONS: { value: StockStatus; label: string; defaultLoc: string }[] = [
    { value: "in_showcase", label: "Showcase Counter Display", defaultLoc: "Main Counter Showcase" },
    { value: "in_vault", label: "Safe / Vault Deposit", defaultLoc: "Vault Safe #A" },
    { value: "with_karigar", label: "Artisan Workshop / Karigar", defaultLoc: "Gopal Workshop Bench" },
    { value: "in_repair", label: "In Repair / Sizing / Polish", defaultLoc: "Workshop Repair Bench" },
    { value: "reserved", label: "Reserved / Customer Advance", defaultLoc: "Booking Locker" },
    { value: "returned_to_supplier", label: "Returned to Supplier", defaultLoc: "Supplier Return Vault" },
  ];

  return (
    <GlassDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Stock Transfer & Status Log"
      description={`Move ${item.sku} (${item.name}) across Showcase, Safe Vault, or Karigar Workshop with immutable audit logging.`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current State Banner */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
              Current Location
            </div>
            <div className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 mt-0.5">
              <MapPin size={13} className="text-[#DFC488]" />
              <span>{item.trayLocation}</span>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase font-semibold">
              Current Status
            </div>
            <GlassBadge variant={item.status === "in_showcase" ? "emerald" : "gold"}>
              {item.status.replace("_", " ")}
            </GlassBadge>
          </div>
        </div>

        {/* Destination Status Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-medium text-[var(--text-secondary)]">
            Destination & New State
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = newStatus === opt.value;
              return (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setNewStatus(opt.value);
                    if (!newLocation) setNewLocation(opt.defaultLoc);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#C5A059]/15 border-[#C5A059] text-[#DFC488] font-medium"
                      : "bg-white/[0.02] border-white/[0.06] text-[var(--text-secondary)] hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <CheckCircle2 size={13} className="text-[#DFC488]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Target Location Input */}
        <GlassInput
          label="Target Tray / Specific Vault Name"
          type="text"
          placeholder="e.g. Vault Safe #A or Tray #2"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
        />

        {/* Reason Input */}
        <GlassInput
          label="Transfer Reason / Audit Notes"
          type="text"
          placeholder="e.g. Evening Safe Closing Deposit or Customer Booking"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />

        {/* Audit Attribution Note */}
        <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5 pt-1">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span>
            Logged by: <strong className="text-[var(--text-primary)]">{user.fullName}</strong> ({user.role})
          </span>
        </div>

        {/* Movement History for this piece */}
        {itemMovements.length > 0 && (
          <div className="pt-2 border-t border-white/[0.06] space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1">
              <History size={12} /> Movement Timeline ({itemMovements.length})
            </span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {itemMovements.map((m) => (
                <div
                  key={m.id}
                  className="p-2 rounded-lg bg-black/20 border border-white/[0.04] text-[11px] flex items-center justify-between"
                >
                  <div>
                    <span className="text-[var(--text-primary)] font-medium">
                      {m.fromStatus} $\rightarrow$ {m.toStatus}
                    </span>
                    <span className="text-[10px] text-[var(--text-tertiary)] block">
                      {m.reason} · {m.toLocation}
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-[var(--text-tertiary)] font-mono">
                    {new Date(m.timestamp).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/[0.06]">
          <GlassButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </GlassButton>
          <GlassButton variant="primary" size="sm" type="submit" icon={<ArrowRightLeft size={14} />}>
            Execute Movement & Log
          </GlassButton>
        </div>
      </form>
    </GlassDialog>
  );
};
