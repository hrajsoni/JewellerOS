"use client";

import React, { useState } from "react";
import {
  ShowroomMasterSettings,
  InvoicePrintConfig,
  BarcodeLabelConfig,
  BranchConfig,
  PaperSize,
  BackupDataSnapshot,
  CloudBackupConfig,
  CloudBackupProvider,
  CloudBackupSchedule,
} from "../../modules/settings/types";
import {
  saveShowroomSettings,
  generateTenantBackupJSON,
  restoreTenantFromJSON,
  triggerCloudBackupSync,
} from "../../modules/settings/store";
import { GlassPanel } from "../glass/GlassPanel";
import { GlassButton } from "../glass/GlassButton";
import { GlassInput } from "../glass/GlassInput";
import { GlassBadge } from "../glass/GlassBadge";
import {
  Settings,
  Store,
  Printer,
  Barcode,
  Building2,
  Database,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  FileText,
  CreditCard,
  QrCode,
  MapPin,
  Phone,
  Mail,
  Plus,
  Trash2,
  Cloud,
  RefreshCw,
  Server,
  Globe,
  Sparkles,
} from "lucide-react";
import { SubscriptionBillingManager } from "./SubscriptionBillingManager";

export type SettingsTab = "profile" | "invoice" | "barcode" | "branches" | "backup" | "subscription";

export interface SettingsManagerProps {
  initialSettings: ShowroomMasterSettings;
  tenantId: string;
  onSettingsUpdated?: (settings: ShowroomMasterSettings) => void;
  onRestoreCompleted?: () => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  initialSettings,
  tenantId,
  onSettingsUpdated,
  onRestoreCompleted,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [settings, setSettings] = useState<ShowroomMasterSettings>(initialSettings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Backup & Restore State
  const [restoreJSON, setRestoreJSON] = useState("");
  const [restoreResult, setRestoreResult] = useState<{
    success: boolean;
    message: string;
    recordCounts?: Record<string, number>;
  } | null>(null);

  // Cloud Disaster Recovery State
  const [syncingCloud, setSyncingCloud] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  const defaultCloudBackup: CloudBackupConfig = {
    enabled: false,
    provider: "aws_s3",
    schedule: "daily",
    endpointUrl: "https://s3.ap-south-1.amazonaws.com/sarafa-backups/jaipur-main",
    apiKey: "",
    targetBucket: "sarafa-backups-jaipur",
    lastSyncStatus: "IDLE",
  };

  const handleSave = () => {
    const saved = saveShowroomSettings(settings, tenantId);
    setSettings(saved);
    setSaveSuccess(true);
    if (onSettingsUpdated) onSettingsUpdated(saved);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const snapshot = generateTenantBackupJSON(tenantId, settings.businessName);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(snapshot, null, 2));
    const downloadAnchor = document.createElement("a");
    const timestamp = new Date().toISOString().split("T")[0];
    const cleanName = settings.businessName.replace(/[^a-zA-Z0-9]/g, "_");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `JewelleryOS_${cleanName}_Backup_${timestamp}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreSubmit = () => {
    try {
      const parsed: BackupDataSnapshot = JSON.parse(restoreJSON);
      const res = restoreTenantFromJSON(parsed, tenantId);
      setRestoreResult(res);
      if (res.success && onRestoreCompleted) {
        onRestoreCompleted();
      }
    } catch (e: any) {
      setRestoreResult({
        success: false,
        message: "Invalid JSON format: " + e.message,
      });
    }
  };

  const handleTriggerCloudSync = async () => {
    setSyncingCloud(true);
    setSyncResult(null);
    try {
      const activeCloudConfig = settings.cloudBackup || defaultCloudBackup;
      const res = await triggerCloudBackupSync(tenantId, activeCloudConfig);
      setSyncResult(res);
      if (res.success) {
        setSettings((prev) => ({
          ...prev,
          cloudBackup: {
            ...activeCloudConfig,
            lastSyncAt: res.timestamp,
            lastSyncStatus: "SUCCESS",
            lastSyncMessage: res.message,
          },
        }));
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err?.message || "Cloud backup sync failed",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setSyncingCloud(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
            Showroom Settings & Business Configuration
          </h1>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            Tenant ID: <span className="font-mono text-[#DFC488]">{tenantId}</span> · Isolated database partition for {settings.businessName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saveSuccess && (
            <span className="text-xs text-[var(--accent-emerald)] font-medium flex items-center gap-1">
              <CheckCircle2 size={14} /> Profile Saved Successfully
            </span>
          )}
          <GlassButton variant="primary" size="sm" onClick={handleSave}>
            Save Showroom Profile
          </GlassButton>
        </div>
      </div>

      {/* Settings Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.06] overflow-x-auto pb-1 text-xs">
        {[
          { key: "profile", label: "Showroom & Legal BIS", icon: Store },
          { key: "invoice", label: "Invoice & Print Layout", icon: Printer },
          { key: "barcode", label: "Barcode Tag Labels", icon: Barcode },
          { key: "branches", label: "Multi-Branch & Vaults", icon: Building2 },
          { key: "backup", label: "Data Vault & Backup", icon: Database },
          { key: "subscription", label: "JewelBill Plan & Billing", icon: Sparkles },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as SettingsTab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-white/[0.06] text-[#DFC488] border-b-2 border-[#C5A059]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.02]"
            }`}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: SHOWROOM IDENTITY & LEGAL METADATA                      */}
      {/* ============================================================== */}
      {activeTab === "profile" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
              <Store size={14} className="text-[#C5A059]" />
              Showroom Identity & Bill Header
            </span>
            <GlassInput
              label="Trade / Showroom Name"
              value={settings.businessName}
              onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
            />
            <GlassInput
              label="Legal Firm Name (for Tax & Banking)"
              value={settings.legalFirmName}
              onChange={(e) => setSettings({ ...settings, legalFirmName: e.target.value })}
            />
            <GlassInput
              label="Brand Tagline"
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
            />
            <GlassInput
              label="Contact Phone"
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
            <GlassInput
              label="WhatsApp Support Number (for 1-Click Receipts)"
              value={settings.whatsappSupport}
              onChange={(e) => setSettings({ ...settings, whatsappSupport: e.target.value })}
            />
            <GlassInput
              label="Official Email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>

          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[var(--accent-emerald)]" />
              Statutory & Tax Compliance
            </span>
            <GlassInput
              label="Shop GSTIN / Tax ID"
              value={settings.gstin}
              onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
            />
            <GlassInput
              label="State & Code"
              value={settings.stateCode}
              onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
            />
            <GlassInput
              label="Registered Showroom Address"
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
            <GlassInput
              label="BIS Hallmark License Number (HUID)"
              value={settings.bisLicenseNumber}
              onChange={(e) => setSettings({ ...settings, bisLicenseNumber: e.target.value })}
            />
            <div className="p-3.5 rounded-xl bg-black/30 border border-white/[0.04] text-xs space-y-1.5">
              <div className="font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Mandatory BIS Hallmarking Standards
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                Under BIS Gold Hallmarking Order, every gold ornament sold must bear the 6-character laser HUID alphanumeric identifier.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: INVOICE & PRINT SETUP                                   */}
      {/* ============================================================== */}
      {activeTab === "invoice" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
              <Printer size={14} className="text-[#C5A059]" />
              Printer Paper & Numbering Format
            </span>
            <div>
              <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                Default Invoice Paper Output
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "A4", label: "A4 Laser Sheet" },
                  { id: "thermal_80mm", label: "3\" 80mm Thermal" },
                  { id: "thermal_58mm", label: "2\" 58mm POS" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        printConfig: {
                          ...settings.printConfig,
                          paperSize: opt.id as PaperSize,
                        },
                      })
                    }
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      settings.printConfig.paperSize === opt.id
                        ? "bg-[#C5A059]/20 border-[#C5A059] text-[#DFC488] font-semibold"
                        : "bg-black/30 border-white/[0.06] text-[var(--text-secondary)] hover:border-white/20"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Invoice Prefix"
                value={settings.printConfig.invoicePrefix}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    printConfig: {
                      ...settings.printConfig,
                      invoicePrefix: e.target.value,
                    },
                  })
                }
              />
              <GlassInput
                label="Starting Bill #"
                type="number"
                value={settings.printConfig.invoiceStartNumber}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    printConfig: {
                      ...settings.printConfig,
                      invoiceStartNumber: parseInt(e.target.value) || 1001,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.04]">
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase block">
                Invoice Toggles
              </span>
              {[
                { key: "showLogo", label: "Include Showroom Logo in Bill Header" },
                { key: "showHuidHallmark", label: "Print 6-digit BIS HUID per ornament" },
                { key: "showOldGoldDeductionBreakdown", label: "Print detailed Old Gold scrap voucher" },
              ].map((toggle) => (
                <label key={toggle.key} className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(settings.printConfig as any)[toggle.key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        printConfig: {
                          ...settings.printConfig,
                          [toggle.key]: e.target.checked,
                        },
                      })
                    }
                    className="accent-[#C5A059] rounded"
                  />
                  <span>{toggle.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
              <CreditCard size={14} className="text-[var(--accent-emerald)]" />
              Bank & UPI Payment Details (For Bill QR)
            </span>
            <GlassInput
              label="Beneficiary Account Name"
              value={settings.printConfig.bankDetails.accountName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  printConfig: {
                    ...settings.printConfig,
                    bankDetails: {
                      ...settings.printConfig.bankDetails,
                      accountName: e.target.value,
                    },
                  },
                })
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Bank Name"
                value={settings.printConfig.bankDetails.bankName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    printConfig: {
                      ...settings.printConfig,
                      bankDetails: {
                        ...settings.printConfig.bankDetails,
                        bankName: e.target.value,
                      },
                    },
                  })
                }
              />
              <GlassInput
                label="IFSC Code"
                value={settings.printConfig.bankDetails.ifscCode}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    printConfig: {
                      ...settings.printConfig,
                      bankDetails: {
                        ...settings.printConfig.bankDetails,
                        ifscCode: e.target.value,
                      },
                    },
                  })
                }
              />
            </div>
            <GlassInput
              label="Bank Account Number"
              value={settings.printConfig.bankDetails.accountNumber}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  printConfig: {
                    ...settings.printConfig,
                    bankDetails: {
                      ...settings.printConfig.bankDetails,
                      accountNumber: e.target.value,
                    },
                  },
                })
              }
            />
            <GlassInput
              label="Showroom UPI VPA (for Dynamic QR Code)"
              value={settings.printConfig.bankDetails.upiVpa}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  printConfig: {
                    ...settings.printConfig,
                    bankDetails: {
                      ...settings.printConfig.bankDetails,
                      upiVpa: e.target.value,
                    },
                  },
                })
              }
            />
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: BARCODE TAG LABELS                                      */}
      {/* ============================================================== */}
      {activeTab === "barcode" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
              <Barcode size={14} className="text-[#C5A059]" />
              Jewellery Tag Label Geometry
            </span>
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                label="Label Width (mm)"
                type="number"
                value={settings.barcodeConfig.labelWidthMm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    barcodeConfig: {
                      ...settings.barcodeConfig,
                      labelWidthMm: parseInt(e.target.value) || 50,
                    },
                  })
                }
              />
              <GlassInput
                label="Label Height (mm)"
                type="number"
                value={settings.barcodeConfig.labelHeightMm}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    barcodeConfig: {
                      ...settings.barcodeConfig,
                      labelHeightMm: parseInt(e.target.value) || 25,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-white/[0.04]">
              <span className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase block">
                Fields Printed on Barcode Tag
              </span>
              {[
                { key: "showGrossWeight", label: "Gross Weight (e.g. 15.420g)" },
                { key: "showNetWeight", label: "Net Metal Weight (e.g. 14.800g)" },
                { key: "showPurity", label: "Karat & Purity Mark (e.g. 22K 916)" },
                { key: "showHuid", label: "BIS Laser HUID Identifier" },
                { key: "showPriceEstimate", label: "Show Selling Price (Uncheck to hide from customers)" },
              ].map((toggle) => (
                <label key={toggle.key} className="flex items-center gap-2.5 text-xs text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(settings.barcodeConfig as any)[toggle.key]}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        barcodeConfig: {
                          ...settings.barcodeConfig,
                          [toggle.key]: e.target.checked,
                        },
                      })
                    }
                    className="accent-[#C5A059] rounded"
                  />
                  <span>{toggle.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block mb-3">
                Live Tag Layout Preview (Thermal 50×25mm)
              </span>
              <div className="p-4 rounded-xl bg-white text-black font-sans shadow-lg max-w-xs mx-auto border border-gray-300">
                <div className="flex justify-between items-start border-b border-gray-400 pb-1">
                  <div className="font-black text-xs tracking-tight">{settings.businessName.toUpperCase()}</div>
                  <div className="text-[9px] font-mono bg-black text-white px-1 rounded font-bold">22K 916</div>
                </div>
                <div className="py-2 text-center">
                  <div className="font-mono text-sm tracking-widest font-black">||| | ||||| || |||</div>
                  <div className="text-[9px] font-mono tracking-wider text-gray-700">8901840001 · RNG-22K-084</div>
                </div>
                <div className="flex justify-between text-[10px] font-semibold border-t border-gray-300 pt-1">
                  <span>Gr: 15.420g</span>
                  <span>Net: 14.800g</span>
                </div>
                <div className="text-[8px] text-gray-600 flex justify-between mt-0.5">
                  <span>HUID: AR8842</span>
                  <span>Jaipur Sarafa</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)] text-center mt-4">
              Compatible with standard TSC, Zebra, and Citizen 203 DPI thermal jewellery tag printers.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: MULTI-BRANCH & VAULTS                                   */}
      {/* ============================================================== */}
      {activeTab === "branches" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">
                Showroom Branches & Isolated Counter Terminals
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Multi-branch inventory allocation and local safe vault separation
              </p>
            </div>
            <GlassBadge variant="gold" size="sm">
              {settings.branches.length} Active Locations
            </GlassBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.branches.map((b, idx) => (
              <div
                key={b.branchCode}
                className="p-5 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#DFC488] bg-[#C5A059]/10 px-2 py-0.5 rounded">
                    {b.branchCode}
                  </span>
                  <GlassBadge variant={b.activeStatus ? "emerald" : "neutral"} size="sm">
                    {b.activeStatus ? "Operating" : "Inactive"}
                  </GlassBadge>
                </div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {b.branchName}
                </h4>
                <div className="text-xs text-[var(--text-secondary)] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={13} className="text-[var(--text-tertiary)]" /> {b.address}, {b.city}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Store size={13} className="text-[var(--text-tertiary)]" /> {b.counterTerminalCount} POS Counter Terminals
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={13} className="text-[var(--text-tertiary)]" /> Vault: {b.safeVaultName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: DATA VAULT & OFFLINE BACKUP (JSON EXPORT / RESTORE)     */}
      {/* ============================================================== */}
      {activeTab === "backup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1-Click JSON Snapshot Export */}
          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
                <Download size={14} className="text-[#C5A059]" />
                1-Click JSON Database Snapshot Export
              </span>
              <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                Download an immutable, complete snapshot of all showroom records: invoices, serialized inventory, customer ledgers, karigar accounts, suppliers, girvi pawn tickets, and double-entry cashbooks.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-black/30 border border-white/[0.04] text-[11px] text-[var(--text-secondary)] space-y-1">
                <div>• Format: UTF-8 Standard JSON Schema (v2.0.0)</div>
                <div>• Encryption: Local browser isolation</div>
                <div>• Compatible for offline disaster recovery</div>
              </div>
            </div>
            <div>
              <GlassButton
                variant="primary"
                size="md"
                className="w-full justify-center"
                onClick={handleDownloadBackup}
                icon={<Download size={16} />}
              >
                Download Full Showroom Backup (.json)
              </GlassButton>
            </div>
          </div>

          {/* Database Restore from JSON */}
          <div className="p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block flex items-center gap-1.5">
              <Upload size={14} className="text-[var(--accent-emerald)]" />
              Restore Database from JSON Snapshot
            </span>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Paste or upload a valid JewelleryOS backup snapshot to restore your showroom database:
            </p>
            <textarea
              rows={5}
              placeholder="Paste JSON snapshot text here..."
              value={restoreJSON}
              onChange={(e) => setRestoreJSON(e.target.value)}
              className="w-full p-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]"
            />
            {restoreResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  restoreResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}
              >
                {restoreResult.success ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="shrink-0 mt-0.5" />}
                <div>
                  <div className="font-semibold">{restoreResult.message}</div>
                  {restoreResult.recordCounts && (
                    <div className="text-[10px] mt-1 text-[var(--text-secondary)]">
                      Invoices: {restoreResult.recordCounts.invoices} · Stock: {restoreResult.recordCounts.stockItems} · Customers: {restoreResult.recordCounts.customers}
                    </div>
                  )}
                </div>
              </div>
            )}
            <GlassButton
              variant="secondary"
              size="sm"
              className="w-full justify-center"
              onClick={handleRestoreSubmit}
              icon={<Upload size={14} />}
            >
              Verify & Restore Database
            </GlassButton>
          </div>

          {/* Automated Cloud Disaster Recovery & Sync Section */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <Cloud size={15} className="text-[#C5A059]" />
                  Automated Cloud Disaster Recovery & Incremental Sync (DEF-023)
                </span>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Continuously replicates encrypted database snapshots to off-site cloud storage (AWS S3, Google Drive/GCS, or private Sarafa Webhook) for zero-loss recovery.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Auto-Sync Status:</span>
                <button
                  type="button"
                  onClick={() => {
                    const current = settings.cloudBackup || defaultCloudBackup;
                    setSettings({
                      ...settings,
                      cloudBackup: { ...current, enabled: !current.enabled },
                    });
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide transition-all ${
                    settings.cloudBackup?.enabled
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                      : "bg-white/[0.05] text-[var(--text-tertiary)] border border-white/[0.1]"
                  }`}
                >
                  {settings.cloudBackup?.enabled ? "● ENABLED" : "○ DISABLED"}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Cloud Storage Provider
                </label>
                <select
                  value={settings.cloudBackup?.provider || "aws_s3"}
                  onChange={(e) => {
                    const current = settings.cloudBackup || defaultCloudBackup;
                    setSettings({
                      ...settings,
                      cloudBackup: { ...current, provider: e.target.value as CloudBackupProvider },
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-sans text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="aws_s3">Amazon S3 Dedicated Bucket (ap-south-1)</option>
                  <option value="google_drive">Google Cloud Storage / Drive Vault</option>
                  <option value="custom_webhook">Sarafa Private Webhook Endpoint</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Automated Backup Schedule
                </label>
                <select
                  value={settings.cloudBackup?.schedule || "daily"}
                  onChange={(e) => {
                    const current = settings.cloudBackup || defaultCloudBackup;
                    setSettings({
                      ...settings,
                      cloudBackup: { ...current, schedule: e.target.value as CloudBackupSchedule },
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-sans text-[var(--text-primary)] focus:outline-none focus:border-[#C5A059]"
                >
                  <option value="daily">Daily at Store Closing (23:59 IST)</option>
                  <option value="hourly">Hourly Continuous Snapshot</option>
                  <option value="weekly">Weekly Full Sarafa Archive</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Target Bucket / Folder Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. sarafa-backups-jaipur"
                  value={settings.cloudBackup?.targetBucket || ""}
                  onChange={(e) => {
                    const current = settings.cloudBackup || defaultCloudBackup;
                    setSettings({
                      ...settings,
                      cloudBackup: { ...current, targetBucket: e.target.value },
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Cloud Destination / Webhook URL
                </label>
                <input
                  type="text"
                  placeholder="https://s3.ap-south-1.amazonaws.com/sarafa-backups or https://api.sarafa-cloud.com/v1/sync"
                  value={settings.cloudBackup?.endpointUrl || ""}
                  onChange={(e) => {
                    const current = settings.cloudBackup || defaultCloudBackup;
                    setSettings({
                      ...settings,
                      cloudBackup: { ...current, endpointUrl: e.target.value },
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--text-secondary)] block mb-1.5">
                  Vault Secret / API Key Token
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••"
                  value={settings.cloudBackup?.apiKey || ""}
                  onChange={(e) => {
                    const current = settings.cloudBackup || defaultCloudBackup;
                    setSettings({
                      ...settings,
                      cloudBackup: { ...current, apiKey: e.target.value },
                    });
                  }}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs font-mono text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[#C5A059]"
                />
              </div>
            </div>

            {/* Cloud Sync Execution & Status Row */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3">
                <GlassBadge
                  variant={
                    settings.cloudBackup?.lastSyncStatus === "SUCCESS"
                      ? "emerald"
                      : settings.cloudBackup?.lastSyncStatus === "FAILED"
                      ? "neutral"
                      : "gold"
                  }
                  size="sm"
                >
                  {settings.cloudBackup?.lastSyncStatus || "IDLE"}
                </GlassBadge>
                <span className="text-[11px] text-[var(--text-tertiary)] font-mono">
                  {settings.cloudBackup?.lastSyncAt
                    ? `Last Sync: ${new Date(settings.cloudBackup.lastSyncAt).toLocaleString("en-IN")}`
                    : "Never synced to cloud"}
                </span>
                {settings.cloudBackup?.lastSyncMessage && (
                  <span className="text-[11px] text-[var(--text-secondary)] hidden lg:inline">
                    · {settings.cloudBackup.lastSyncMessage}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <GlassButton
                  variant="gold-outline"
                  size="sm"
                  onClick={handleTriggerCloudSync}
                  disabled={syncingCloud}
                  icon={<RefreshCw size={14} className={syncingCloud ? "animate-spin" : ""} />}
                >
                  {syncingCloud ? "Syncing to Cloud Vault..." : "Test & Sync Cloud Backup Now"}
                </GlassButton>
              </div>
            </div>

            {syncResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  syncResult.success
                    ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300"
                    : "bg-red-500/10 border border-red-500/20 text-red-300"
                }`}
              >
                {syncResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                <span>{syncResult.message}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscription & Billing Tab */}
      {activeTab === "subscription" && (
        <SubscriptionBillingManager tenantId={tenantId} />
      )}
    </div>
  );
};
