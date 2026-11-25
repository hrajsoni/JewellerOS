import { StockItem } from "../inventory/types";
import { FinalizedInvoice } from "../invoicing/types";
import { Customer } from "../customers/types";
import { Karigar, KarigarTransaction, JobCard } from "../karigar/types";
import { SupplierProfile, PurchaseInvoice, SupplierPaymentRecord } from "../suppliers/types";
import { GirviLoan, GirviPaymentRecord } from "../girvi/types";
import { ConsignmentMemo, B2BPartnerProfile } from "../wholesale/types";
import { RepairJob, CustomBookingOrder } from "../repairs/types";
import { Account, ShopExpense, DailyCashClosing } from "../accounts/types";
import { StaffMember, StaffPaymentRecord } from "../staff/types";

export type PaperSize = "A4" | "thermal_80mm" | "thermal_58mm";

export interface BankPaymentDetails {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiVpa: string;
  branchName?: string;
}

export interface InvoicePrintConfig {
  paperSize: PaperSize;
  invoicePrefix: string;
  invoiceStartNumber: number;
  showLogo: boolean;
  showHuidHallmark: boolean;
  showOldGoldDeductionBreakdown: boolean;
  defaultPaymentTermsDays: number;
  termsAndConditions: string[];
  bankDetails: BankPaymentDetails;
}

export interface BarcodeLabelConfig {
  labelWidthMm: number;
  labelHeightMm: number;
  showGrossWeight: boolean;
  showNetWeight: boolean;
  showPurity: boolean;
  showHuid: boolean;
  showPriceEstimate: boolean;
}

export interface BranchConfig {
  branchCode: string; // e.g. "MAIN-01", "CITY-02"
  branchName: string; // e.g. "Sarafa Bazar Flagship Showroom"
  city: string;
  address: string;
  counterTerminalCount: number;
  safeVaultName: string;
  activeStatus: boolean;
}

export type CloudBackupProvider = "aws_s3" | "google_drive" | "custom_webhook";
export type CloudBackupSchedule = "hourly" | "daily" | "weekly";

export interface CloudBackupConfig {
  enabled: boolean;
  provider: CloudBackupProvider;
  schedule: CloudBackupSchedule;
  endpointUrl: string;
  apiKey?: string;
  targetBucket?: string;
  lastSyncAt?: string;
  lastSyncStatus?: "IDLE" | "SUCCESS" | "FAILED" | "SYNCING";
  lastSyncMessage?: string;
}

export interface ShowroomMasterSettings {
  tenantId: string;
  businessName: string;
  legalFirmName: string;
  tagline: string;
  phone: string;
  whatsappSupport: string;
  email: string;
  city: string;
  stateCode: string; // e.g. "08" (Rajasthan)
  address: string;
  gstin: string;
  bisLicenseNumber: string;
  defaultGoldRate24k: number;
  defaultSilverRateKg: number;
  defaultMakingPercentage: number;
  printConfig: InvoicePrintConfig;
  barcodeConfig: BarcodeLabelConfig;
  branches: BranchConfig[];
  cloudBackup?: CloudBackupConfig;
  updatedAt: string;
}

export interface BackupDataSnapshot {
  version: string;
  exportedAt: string;
  tenantId: string;
  shopName: string;
  data: {
    settings?: ShowroomMasterSettings;
    invoices: FinalizedInvoice[];
    stockItems: StockItem[];
    customers: Customer[];
    karigars: Karigar[];
    karigarTxns: KarigarTransaction[];
    jobCards: JobCard[];
    suppliers: SupplierProfile[];
    purchases: PurchaseInvoice[];
    supplierPayments: SupplierPaymentRecord[];
    girviLoans: GirviLoan[];
    girviPayments: GirviPaymentRecord[];
    memos: ConsignmentMemo[];
    b2bPartners: B2BPartnerProfile[];
    repairs: RepairJob[];
    bookings: CustomBookingOrder[];
    accounts: Account[];
    expenses: ShopExpense[];
    dailyClosings: DailyCashClosing[];
    staff: StaffMember[];
    staffPayments: StaffPaymentRecord[];
  };
}
