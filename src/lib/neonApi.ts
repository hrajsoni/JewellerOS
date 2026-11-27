import { FinalizedInvoice, SalesReturnRecord } from "../modules/invoicing/types";
import { StockItem } from "../modules/inventory/types";
import { Customer, NewCustomerInput } from "../modules/customers/types";
import { GirviLoan, NewGirviInput } from "../modules/girvi/types";
import {
  Karigar,
  KarigarTransaction,
  IssueMetalInput,
  ReceiveOrnamentInput,
  PayLabourInput,
  JobCard,
  CreateJobCardInput,
  JobCardStatus,
} from "../modules/karigar/types";
import {
  Account,
  ShopExpense,
  DailyCashClosing,
  RecordExpenseInput,
  RecordCashClosingInput,
} from "../modules/accounts/types";
import {
  StaffMember,
  StaffPaymentRecord,
  AddStaffInput,
  IssueAdvanceInput,
  PaySalaryInput,
} from "../modules/staff/types";
import {
  SupplierProfile,
  PurchaseInvoice,
  SupplierPaymentRecord,
  NewSupplierInput,
} from "../modules/suppliers/types";
import {
  ConsignmentMemo,
  B2BPartnerProfile,
  CreateConsignmentMemoInput,
} from "../modules/wholesale/types";
import {
  RepairJob,
  CreateRepairInput,
  UpdateRepairStatusInput,
  CustomBookingOrder,
  CreateBookingInput,
  BookingStatus,
} from "../modules/repairs/types";
import { ShowroomMasterSettings } from "../modules/settings/types";
import { JewellerTenant, RegisterJewellerInput } from "../modules/tenants/types";
import { MetalRateRecord } from "../modules/rates/types";

export interface BootstrapPayload {
  success: boolean;
  tenantId: string;
  tenants: JewellerTenant[];
  rates: MetalRateRecord | null;
  stockItems: StockItem[];
  invoices: FinalizedInvoice[];
  customers: Customer[];
  accounts: Account[];
  expenses: ShopExpense[];
  dailyClosings: DailyCashClosing[];
  girviLoans: GirviLoan[];
  karigars: Karigar[];
  karigarTxns: KarigarTransaction[];
  jobCards: JobCard[];
  suppliers: SupplierProfile[];
  purchases: PurchaseInvoice[];
  supplierPayments: SupplierPaymentRecord[];
  memos: ConsignmentMemo[];
  b2bPartners: B2BPartnerProfile[];
  repairs: RepairJob[];
  bookings: CustomBookingOrder[];
  staff: StaffMember[];
  staffPayments: StaffPaymentRecord[];
  settings: ShowroomMasterSettings;
}

async function apiRequest<T = any>(
  url: string,
  method: "GET" | "POST" | "PATCH" = "GET",
  body?: unknown
): Promise<T | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.warn(`Neon API [${method} ${url}] status ${res.status}:`, errText);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`Neon API [${method} ${url}] network error:`, err);
    return null;
  }
}

async function apiAuthRequest<T = any>(
  url: string,
  body?: unknown
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Window unavailable" };
  }
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json?.error || `Request failed (${res.status})` };
    }
    return { ok: true, data: json as T };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Network error" };
  }
}

export const neonApi = {
  bootstrap(tenantId: string) {
    return apiRequest<BootstrapPayload>(
      `/api/bootstrap?tenantId=${encodeURIComponent(tenantId)}`,
      "GET"
    );
  },

  login(emailOrPhone: string, pin: string, tenantId: string) {
    return apiRequest("/api/auth/login", "POST", { emailOrPhone, pin, tenantId });
  },

  loginWithPinApi(emailOrPhone: string, pin: string, tenantId?: string) {
    return apiAuthRequest("/api/auth/login", { method: "pin", emailOrPhone, pin, tenantId });
  },

  loginWithOtpApi(payload: {
    email?: string;
    phone?: string;
    emailOrPhone?: string;
    challengeId: string;
    otp: string;
  }) {
    return apiAuthRequest("/api/auth/login", { method: "otp", ...payload });
  },

  sendOtp(payload: {
    email?: string;
    phone?: string;
    purpose: "SIGNUP" | "LOGIN" | "RESET_PIN";
    tenantId?: string;
  }) {
    return apiAuthRequest("/api/auth/otp/send", payload);
  },

  verifyOtp(challengeId: string, otp: string) {
    return apiAuthRequest("/api/auth/otp/verify", { challengeId, otp });
  },

  registerAccount(payload: {
    fullName: string;
    email?: string;
    phone?: string;
    pin: string;
    role?: string;
    businessId?: string;
    businessName?: string;
    challengeId: string;
    otp: string;
  }) {
    return apiAuthRequest("/api/auth/register", payload);
  },

  logoutApi() {
    return apiAuthRequest("/api/auth/logout", {});
  },

  registerTenant(input: RegisterJewellerInput & { id?: string }) {
    return apiRequest("/api/tenants", "POST", input);
  },

  updateTenant(tenant: Partial<JewellerTenant> & { id: string }) {
    return apiRequest("/api/tenants", "PATCH", tenant);
  },

  persistRates(
    businessId: string,
    rates: MetalRateRecord,
    updatedById?: string
  ) {
    return apiRequest("/api/rates", "POST", {
      businessId,
      updatedById,
      source: rates.source || "MANUAL",
      notes: rates.notes,
      rates: [
        { metal: "GOLD", purityKey: "24K", purityPercent: 1.0, sellingRate: rates.gold24k, purchaseRate: rates.goldPurchase24k },
        { metal: "GOLD", purityKey: "22K", purityPercent: 0.9167, sellingRate: rates.gold22k, purchaseRate: rates.goldPurchase22k },
        { metal: "GOLD", purityKey: "18K", purityPercent: 0.75, sellingRate: rates.gold18k, purchaseRate: rates.goldPurchase18k },
        { metal: "GOLD", purityKey: "14K", purityPercent: 0.5833, sellingRate: rates.gold14k },
        { metal: "SILVER", purityKey: "999", purityPercent: 0.999, sellingRate: rates.silver999PerKg, purchaseRate: rates.silverPurchasePerKg },
        { metal: "SILVER", purityKey: "925", purityPercent: 0.925, sellingRate: rates.silver925PerKg },
      ],
    });
  },

  addStockItem(businessId: string, item: StockItem) {
    return apiRequest("/api/stock", "POST", {
      businessId,
      barcode: item.barcode,
      sku: item.sku,
      title: item.name,
      category: item.category,
      metal: item.metal,
      purityKey: item.purity,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      otherDeductions: item.otherDeductions || 0,
      netWeight: item.netWeight,
      fineGoldEq: item.fineWeight || item.netWeight,
      makingType: item.defaultMakingType,
      makingValue: item.defaultMakingValue,
      acquisitionCost: item.acquisitionCost,
      trayLocation: item.trayLocation,
      huid: item.huid,
    });
  },

  updateStockStatus(stockItemId: string, barcode: string, status: string, trayLocation?: string, reason?: string) {
    return apiRequest("/api/stock", "PATCH", {
      stockItemId,
      barcode,
      status,
      trayLocation,
      reason,
    });
  },

  updateStockItem(item: StockItem) {
    return apiRequest("/api/stock", "PATCH", {
      action: "edit_item",
      stockItemId: item.id,
      barcode: item.barcode,
      title: item.name,
      purityKey: item.purity,
      grossWeight: item.grossWeight,
      stoneWeight: item.stoneWeight,
      otherDeductions: item.otherDeductions || 0,
      netWeight: item.netWeight,
      fineGoldEq: item.fineWeight || item.netWeight,
      makingType: item.defaultMakingType,
      makingValue: item.defaultMakingValue,
      acquisitionCost: item.acquisitionCost,
      trayLocation: item.trayLocation,
      huid: item.huid,
    });
  },

  persistInvoice(businessId: string, inv: FinalizedInvoice, createdById?: string) {
    const makingTotal = inv.items.reduce((s, it) => s + (it.makingCharges || 0), 0);
    return apiRequest("/api/invoices", "POST", {
      businessId,
      invoiceNumber: inv.invoiceNumber,
      type: inv.gstPercentage > 0 ? "RETAIL_GST" : "CASH_MEMO",
      customerId: inv.customer.id,
      customerName: inv.customer.name,
      customerPhone: inv.customer.phone,
      customerCity: inv.customer.city,
      customerGstin: inv.customer.gstin,
      subtotal: inv.itemsSubtotal,
      makingTotal,
      discountTotal: inv.discountTotal,
      taxableAmount: inv.taxableAmount,
      cgstAmount: inv.cgstAmount,
      sgstAmount: inv.sgstAmount,
      roundOff: inv.roundoff,
      grandTotal: inv.grandTotal,
      oldGoldDeduction: inv.oldGoldTotalCredit,
      netPayable: inv.grandTotal,
      totalPaid: inv.totalPaid,
      balanceDue: inv.balanceDue,
      createdById,
      items: inv.items,
      payments: inv.payments,
    });
  },

  processSalesReturn(businessId: string, record: SalesReturnRecord) {
    return apiRequest("/api/invoices", "PATCH", {
      businessId,
      action: "sales_return",
      creditNoteNumber: record.creditNoteNumber,
      originalInvoiceNumber: record.originalInvoiceNumber,
      returnedItems: record.returnedItems,
      totalRefundAmount: record.totalRefundAmount,
      refundMethod: record.refundMethod,
      customerPhone: record.customer?.phone,
    });
  },

  addCustomer(businessId: string, input: NewCustomerInput) {
    return apiRequest("/api/customers", "POST", { businessId, ...input });
  },

  settleCustomerBalance(
    businessId: string,
    payload: {
      customerId: string;
      customerPhone?: string;
      customerName?: string;
      paymentAmount: number;
      entryType: "collect_udhar" | "record_advance" | "add_udhar";
      method: string;
    }
  ) {
    return apiRequest("/api/customers", "PATCH", { businessId, ...payload });
  },

  createGirviLoan(businessId: string, input: NewGirviInput) {
    return apiRequest("/api/girvi", "POST", { businessId, ...input });
  },

  releaseGirviLoan(businessId: string, loanId: string, loanNumber?: string) {
    return apiRequest("/api/girvi", "PATCH", {
      businessId,
      loanId,
      loanNumber,
      action: "release",
    });
  },

  karigarAction(
    businessId: string,
    action: "add_karigar" | "issue_metal" | "receive_ornament" | "pay_labour" | "create_job_card",
    payload:
      | { name: string; phone: string; workshopCity: string; specialty: string; notes?: string }
      | IssueMetalInput
      | ReceiveOrnamentInput
      | PayLabourInput
      | CreateJobCardInput
  ) {
    return apiRequest("/api/karigar", "POST", { businessId, action, payload });
  },

  updateJobCardStatus(jobCardId: string, status: JobCardStatus, huid?: string) {
    return apiRequest("/api/karigar", "PATCH", { jobCardId, status, huid });
  },

  recordExpense(businessId: string, payload: RecordExpenseInput) {
    return apiRequest("/api/accounts", "POST", {
      businessId,
      action: "record_expense",
      payload,
    });
  },

  recordClosing(businessId: string, payload: RecordCashClosingInput) {
    return apiRequest("/api/accounts", "POST", {
      businessId,
      action: "record_closing",
      payload,
    });
  },

  staffAction(
    businessId: string,
    action: "add_staff" | "issue_advance" | "pay_salary",
    payload: AddStaffInput | IssueAdvanceInput | PaySalaryInput
  ) {
    return apiRequest("/api/staff", "POST", { businessId, action, payload });
  },

  addSupplier(businessId: string, payload: NewSupplierInput) {
    return apiRequest("/api/suppliers", "POST", { businessId, action: "add_supplier", payload });
  },

  recordSupplierPayment(businessId: string, payload: Omit<SupplierPaymentRecord, "id" | "date">) {
    return apiRequest("/api/suppliers", "POST", { businessId, action: "record_payment", payload });
  },

  recordPurchase(businessId: string, invoice: Omit<PurchaseInvoice, "id" | "createdAt">) {
    return apiRequest("/api/purchases", "POST", { businessId, ...invoice });
  },

  wholesaleAction(
    businessId: string,
    action: "add_partner" | "issue_memo",
    payload: any | CreateConsignmentMemoInput
  ) {
    return apiRequest("/api/wholesale", "POST", { businessId, action, payload });
  },

  updateMemoStatus(action: "return" | "convert", memoId: string, itemIds: string[], invoiceNumber?: string) {
    return apiRequest("/api/wholesale", "PATCH", { action, memoId, itemIds, invoiceNumber });
  },

  createRepair(businessId: string, payload: CreateRepairInput) {
    return apiRequest("/api/repairs", "POST", { businessId, action: "create_repair", payload });
  },

  updateRepairStatus(input: UpdateRepairStatusInput) {
    return apiRequest("/api/repairs", "PATCH", {
      action: "update_repair",
      id: input.repairId,
      status: input.status,
      finalCharges: input.finalCharges,
    });
  },

  createBooking(businessId: string, payload: CreateBookingInput) {
    return apiRequest("/api/repairs", "POST", { businessId, action: "create_booking", payload });
  },

  updateBookingStatus(id: string, status: BookingStatus) {
    return apiRequest("/api/repairs", "PATCH", { action: "update_booking", id, status });
  },

  updateSettings(settings: ShowroomMasterSettings) {
    return apiRequest("/api/settings", "PATCH", settings);
  },
};
