import {
  StockItem,
  StockStatus,
  JewelleryCategory,
} from "../modules/inventory/types";
import {
  FinalizedInvoice,
  InvoiceLineItem,
  PaymentRecord,
} from "../modules/invoicing/types";
import { Customer } from "../modules/customers/types";
import { GirviLoan, GirviStatus } from "../modules/girvi/types";
import {
  Karigar,
  KarigarTransaction,
  JobCard,
  JobCardStatus,
} from "../modules/karigar/types";
import {
  Account,
  AccountType,
  ShopExpense,
  DailyCashClosing,
} from "../modules/accounts/types";
import {
  StaffMember,
  StaffPaymentRecord,
  StaffRole,
} from "../modules/staff/types";
import {
  SupplierProfile,
  PurchaseInvoice,
  SupplierPaymentRecord,
} from "../modules/suppliers/types";
import {
  ConsignmentMemo,
  B2BPartnerProfile,
  MemoStatus,
  MemoItemStatus,
} from "../modules/wholesale/types";
import {
  RepairJob,
  RepairStatus,
  CustomBookingOrder,
  BookingStatus,
} from "../modules/repairs/types";
import { ShowroomMasterSettings } from "../modules/settings/types";
import { getDefaultShowroomSettings } from "../modules/settings/store";
import { JewellerTenant } from "../modules/tenants/types";
import { GoldPurityKey, SilverPurityKey, MakingChargeType } from "../modules/pricing/types";
import { MetalRateRecord } from "../modules/rates/types";

const num = (val: unknown, fallback = 0): number => {
  if (val === null || val === undefined) return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

export function mapStockStatusFromDb(status: string): StockStatus {
  const normalized = status.toLowerCase();
  const valid: StockStatus[] = [
    "in_showcase",
    "in_vault",
    "with_karigar",
    "in_repair",
    "reserved",
    "sold",
    "damaged",
    "returned_to_supplier",
  ];
  if (valid.includes(normalized as StockStatus)) {
    return normalized as StockStatus;
  }
  return "in_showcase";
}

export function mapStockStatusToDb(status: string): any {
  const s = status.toUpperCase();
  if (
    [
      "IN_SHOWCASE",
      "IN_VAULT",
      "RESERVED",
      "SOLD",
      "WITH_KARIGAR",
      "IN_REPAIR",
      "ON_MEMO",
      "DAMAGED",
      "RETURNED_TO_SUPPLIER",
    ].includes(s)
  ) {
    return s;
  }
  return "IN_SHOWCASE";
}

export function mapPaymentMethodFromDb(method: string): PaymentRecord["method"] {
  switch (method) {
    case "UPI":
      return "UPI";
    case "CARD":
      return "Card";
    case "BANK_TRANSFER":
      return "Bank Transfer";
    case "OLD_GOLD":
      return "Old Gold";
    case "CREDIT":
      return "Customer Credit";
    default:
      return "Cash";
  }
}

export function mapPaymentMethodToDb(method: string): any {
  const m = method.toLowerCase();
  if (m.includes("upi") || m.includes("gpay") || m.includes("phonepe")) return "UPI";
  if (m.includes("card")) return "CARD";
  if (m.includes("bank") || m.includes("rtgs") || m.includes("neft")) return "BANK_TRANSFER";
  if (m.includes("old")) return "OLD_GOLD";
  if (m.includes("credit") || m.includes("udhar")) return "CREDIT";
  return "CASH";
}

export function mapDbBusinessToTenant(b: any, goldRate = 150000, silverRate = 95000): JewellerTenant {
  return {
    id: b.id,
    businessName: b.name,
    ownerName: b.legalEntityName || "Showroom Owner",
    tagline: "Hallmarked Gold & Fine Jewellery",
    phone: b.phone || "",
    email: b.email || "",
    city: b.city || "Jaipur",
    address: b.address || "",
    gstin: b.gstin || "",
    bisLicense: b.bisLicense || "",
    defaultGoldRate: goldRate,
    defaultSilverRate: silverRate,
    defaultMakingPercentage: 18,
    currency: b.currency || "INR",
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
    isDefault: b.id === "tenant-sandhya-jaipur",
  };
}

export function mapDbRatesToRecord(rates: any[], tenantId: string): MetalRateRecord | null {
  if (!rates || rates.length === 0) return null;
  const g24 = rates.find((r) => r.metal === "GOLD" && r.purityKey === "24K");
  const g22 = rates.find((r) => r.metal === "GOLD" && r.purityKey === "22K");
  const g18 = rates.find((r) => r.metal === "GOLD" && r.purityKey === "18K");
  const g14 = rates.find((r) => r.metal === "GOLD" && r.purityKey === "14K");
  const s999 = rates.find((r) => r.metal === "SILVER" && r.purityKey === "999");
  const s925 = rates.find((r) => r.metal === "SILVER" && r.purityKey === "925");

  const base24 = num(g24?.sellingRate, 150000);
  const baseSilver = num(s999?.sellingRate, 95000);

  return {
    id: g24?.id || rates[0].id,
    businessId: tenantId,
    timestamp: (g24?.effectiveAt || rates[0].effectiveAt || new Date()).toISOString(),
    gold24k: base24,
    gold22k: num(g22?.sellingRate, Math.round((base24 / 24) * 22)),
    gold18k: num(g18?.sellingRate, Math.round((base24 / 24) * 18)),
    gold14k: num(g14?.sellingRate, Math.round((base24 / 24) * 14)),
    goldPurchase24k: num(g24?.purchaseRate, Math.round(base24 * 0.985)),
    goldPurchase22k: num(g22?.purchaseRate, Math.round((base24 / 24) * 22 * 0.97)),
    goldPurchase18k: num(g18?.purchaseRate, Math.round((base24 / 24) * 18 * 0.97)),
    silver999PerKg: baseSilver,
    silver925PerKg: num(s925?.sellingRate, Math.round(baseSilver * 0.925)),
    silverPurchasePerKg: num(s999?.purchaseRate, Math.round(baseSilver * 0.95)),
    platinum950PerGram: 3200,
    updatedById: g24?.updatedById || "system",
    updatedByName: "Showroom Rate Board",
    updatedByRole: "OWNER",
    source:
      g24?.source === "SARAFA_BOARD" || g24?.source === "API_FEED"
        ? g24.source
        : "MANUAL",
    notes: g24?.notes || undefined,
  };
}

export function mapDbStockItem(row: any): StockItem {
  const metal = row.metal === "SILVER" ? "silver" : "gold";
  const purityKey = row.purityKey as GoldPurityKey | SilverPurityKey;
  const makingType =
    row.makingType === "PER_GRAM"
      ? "per_gram"
      : row.makingType === "FIXED"
      ? "fixed"
      : "percentage";

  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode,
    name: row.title,
    category: (row.product?.category || "Rings") as JewelleryCategory,
    metal,
    purity: purityKey,
    purityDisplay: purityKey,
    grossWeight: num(row.grossWeight),
    stoneWeight: num(row.stoneWeight),
    otherDeductions: num(row.otherDeductions),
    netWeight: num(row.netWeight),
    fineWeight: num(row.fineGoldEq),
    hsnCode: row.product?.hsnCode || "7113",
    acquisitionCost: num(row.acquisitionCost),
    defaultMakingType: makingType as MakingChargeType,
    defaultMakingValue: num(row.makingValue),
    trayLocation: row.trayLocation || "Showcase Tray #1",
    supplierName: row.supplier?.name,
    status: mapStockStatusFromDb(row.status),
    dateAdded: row.dateAcquired ? new Date(row.dateAcquired).toISOString() : new Date().toISOString(),
    huid: row.huid || undefined,
  };
}

export function mapDbInvoice(row: any, business?: any): FinalizedInvoice {
  const items: InvoiceLineItem[] = (row.items || []).map((it: any) => ({
    id: it.id,
    stockItemId: it.stockItemId || undefined,
    name: it.description,
    metal: it.metal === "SILVER" ? "silver" : "gold",
    purity: it.purityKey as GoldPurityKey | SilverPurityKey,
    purityDisplay: it.purityKey,
    grossWeight: num(it.grossWeight),
    stoneWeight: Math.max(0, num(it.grossWeight) - num(it.netWeight)),
    netWeight: num(it.netWeight),
    metalRate: num(it.metalRate),
    effectiveRatePerGram: num(it.netWeight) > 0 ? num(it.metalValue) / num(it.netWeight) : 0,
    metalValue: num(it.metalValue),
    makingType: "percentage",
    makingRate: 0,
    makingCharges: num(it.makingCharges),
    stoneValue: num(it.stoneValue),
    discount: num(it.discount),
    totalBeforeTax: num(it.itemSubtotal),
    fineWeight: num(it.netWeight),
    fineGoldValue24k: num(it.metalValue),
    wastagePercentage: 0,
  }));

  const payments: PaymentRecord[] = (row.payments || []).map((p: any) => ({
    method: mapPaymentMethodFromDb(p.method),
    amount: num(p.amount),
    transactionRef: p.referenceNo || undefined,
  }));

  const totalGst = num(row.cgstAmount) + num(row.sgstAmount) + num(row.igstAmount);
  const balanceDue = num(row.balanceDue);

  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    invoiceDate: row.invoiceDate ? new Date(row.invoiceDate).toISOString() : new Date().toISOString(),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    customer: {
      id: row.customerId || `cust-${row.id}`,
      name: row.customerName,
      phone: row.customerPhone || "",
      city: row.customerCity || row.customer?.city || "Jaipur",
      address: row.customer?.address || "",
      gstin: row.customerGstin || row.customer?.gstin || "URP",
      panNumber: row.customer?.panNumber || undefined,
    },
    items,
    oldGoldExchange: [],
    itemsSubtotal: num(row.subtotal),
    oldGoldTotalCredit: num(row.oldGoldDeduction),
    discountTotal: num(row.discountTotal),
    taxableAmount: num(row.taxableAmount),
    gstPercentage: totalGst > 0 ? 3 : 0,
    cgstAmount: num(row.cgstAmount),
    sgstAmount: num(row.sgstAmount),
    totalGst,
    roundoff: num(row.roundOff),
    grandTotal: num(row.grandTotal),
    payments,
    totalPaid: num(row.totalPaid),
    balanceDue,
    status: balanceDue <= 0 ? "paid" : num(row.totalPaid) > 0 ? "partial" : "pending",
    shopSnapshot: {
      name: business?.name || "Sandhya Jewellers",
      address: business?.address || "142 Sarafa Bazar, M.I. Road, Jaipur",
      phone: business?.phone || "+91 94140 12345",
      gstin: business?.gstin || "08AAAAJ1234F1Z8",
    },
  };
}

export function mapDbCustomer(c: any): Customer {
  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email || undefined,
    city: c.city || "Jaipur",
    address: c.address || undefined,
    gstin: c.gstin || undefined,
    panNumber: c.panNumber || undefined,
    customerType: c.gstin ? "wholesale" : num(c.totalPurchased) >= 500000 ? "vip" : "retail",
    totalPurchases: num(c.totalPurchased),
    totalGoldWeightGrams: 0,
    totalSilverWeightGrams: 0,
    totalInvoicesCount: c._count?.invoices ?? 0,
    outstandingCredit: -num(c.outstandingDue), // UI: negative = amount customer owes
    lastVisitDate: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function mapDbAccount(a: any): Account {
  const typeMap: Record<string, AccountType> = {
    ASSET: "asset",
    LIABILITY: "liability",
    EQUITY: "equity",
    REVENUE: "revenue",
    EXPENSE: "expense",
  };
  return {
    id: a.id,
    code: a.code,
    name: a.name,
    nameHindi: a.name,
    type: typeMap[a.type] || "asset",
    balance: num(a.currentBalance),
    isSystem: true,
  };
}

export function mapDbExpense(e: any): ShopExpense {
  return {
    id: e.id,
    date: e.date ? new Date(e.date).toISOString() : new Date().toISOString(),
    category: e.category,
    amount: num(e.amount),
    paymentMode: (e.paymentMode as ShopExpense["paymentMode"]) || "Cash",
    paidTo: e.paidTo,
    voucherNumber: e.voucherNumber || undefined,
    notes: e.notes || undefined,
    recordedBy: e.recordedBy || "Staff",
  };
}

export function mapDbClosing(c: any): DailyCashClosing {
  return {
    id: c.id,
    date: c.date,
    openingCash: num(c.openingCash),
    cashSales: num(c.cashSales),
    cashAdvances: num(c.cashAdvances),
    supplierCashPaid: num(c.supplierCashPaid),
    karigarCashPaid: num(c.karigarCashPaid),
    cashExpenses: num(c.cashExpenses),
    expectedCash: num(c.expectedCash),
    physicalCash: num(c.physicalCash),
    discrepancy: num(c.discrepancy),
    status: c.status as DailyCashClosing["status"],
    denominations: c.denominations || {
      count500: 0,
      count200: 0,
      count100: 0,
      count50: 0,
      count20: 0,
      count10: 0,
      coins: 0,
    },
    closedBy: c.closedBy,
    closedAt: c.closedAt ? new Date(c.closedAt).toISOString() : new Date().toISOString(),
    notes: c.notes || undefined,
  };
}

export function mapDbGirviLoan(g: any): GirviLoan {
  const statusMap: Record<string, GirviStatus> = {
    ACTIVE: "active",
    RELEASED: "released",
    AUCTIONED: "auction_notice",
  };
  return {
    id: g.id,
    loanNumber: g.loanNumber,
    startDate: g.startDate ? new Date(g.startDate).toISOString() : new Date().toISOString(),
    dueDate: g.dueDate ? new Date(g.dueDate).toISOString() : new Date().toISOString(),
    customerName: g.customerName,
    customerPhone: g.customerPhone,
    customerAddress: g.customerAddress || "",
    customerCity: g.customerCity || "Jaipur",
    ornaments: (g.pledgedOrnaments || []).map((o: any) => ({
      id: o.id,
      name: o.name,
      metal: o.metal === "SILVER" ? "silver" : "gold",
      purity: o.purity,
      grossWeight: num(o.grossWeight),
      netWeight: num(o.netWeight),
      marketValuation: Math.round(num(o.netWeight) * 14000),
    })),
    principalAmount: num(g.principalAmount),
    monthlyInterestRate: num(g.monthlyInterestRate),
    interestType: "simple",
    totalInterestPaid: num(g.totalInterestPaid),
    principalRepaid: num(g.principalRepaid),
    status: statusMap[g.status] || "active",
    packetNumber: g.packetNumber,
    safeLocation: g.safeLocation,
    notes: g.notes || undefined,
  };
}

export function mapDbKarigar(k: any): Karigar {
  return {
    id: k.id,
    name: k.name,
    phone: k.phone,
    workshopCity: k.workshopCity,
    specialty: k.specialty,
    pureGoldBalanceGrams: num(k.pureGoldBalanceGrams),
    pureSilverBalanceGrams: num(k.pureSilverBalance),
    labourBalanceDue: num(k.labourBalanceDue),
    status: k.status === "inactive" ? "inactive" : "active",
  };
}

export function mapDbKarigarTxn(t: any): KarigarTransaction {
  const typeMap: Record<string, KarigarTransaction["type"]> = {
    ISSUE_METAL: "issue_metal",
    RECEIVE_ORNAMENT: "receive_ornament",
    PAY_LABOUR: "labour_payment",
  };
  return {
    id: t.id,
    karigarId: t.karigarId,
    karigarName: t.karigar?.name || "Karigar",
    date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
    type: typeMap[t.type] || "issue_metal",
    metal: t.metal === "SILVER" ? "silver" : "gold",
    ornamentName: t.ornamentName || undefined,
    grossWeight: t.grossWeight !== null ? num(t.grossWeight) : undefined,
    netWeight: t.netWeight !== null ? num(t.netWeight) : undefined,
    fineWeightDelta: num(t.fineWeightDelta),
    labourAmount: t.labourAmount !== null ? num(t.labourAmount) : undefined,
    paymentAmount: t.paymentAmount !== null ? num(t.paymentAmount) : undefined,
    notes: t.notes || undefined,
  };
}

export function mapDbJobCard(j: any): JobCard {
  return {
    id: j.id,
    jobCardNumber: j.jobCardNumber,
    karigarId: j.karigarId,
    karigarName: j.karigarName,
    customerName: j.customerName || undefined,
    customerPhone: j.customerPhone || undefined,
    category: j.category,
    title: j.title,
    description: j.description,
    metal: j.metal === "SILVER" ? "silver" : "gold",
    targetGrossWeight: num(j.targetGrossWeight),
    targetNetWeight: num(j.targetNetWeight),
    purity: j.purity,
    issuedFineWeightGrams: num(j.issuedFineWeightGrams),
    expectedDeliveryDate: j.expectedDeliveryDate
      ? new Date(j.expectedDeliveryDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: (j.status as JobCardStatus) || "created",
    labourRate: num(j.labourRate),
    labourType: j.labourType === "fixed" ? "fixed" : "per_gram",
    allowedWastagePercent: num(j.allowedWastagePercent, 1.0),
    huid: j.huid || undefined,
    createdAt: j.createdAt ? new Date(j.createdAt).toISOString() : new Date().toISOString(),
    completedAt: j.completedAt ? new Date(j.completedAt).toISOString() : undefined,
  };
}

export function mapDbSupplier(s: any): SupplierProfile {
  return {
    id: s.id,
    name: s.name,
    contactPerson: s.contactPerson || s.name,
    phone: s.phone,
    city: s.city,
    gstin: s.gstin || undefined,
    metalSupplied: s.metalSupplied === "SILVER" ? "silver" : "gold",
    outstandingBalanceINR: num(s.outstandingDue),
    fineGoldBalanceGrams: num(s.fineGoldBalance),
    fineSilverBalanceGrams: num(s.fineSilverBalance),
    totalPurchasedINR: 0,
    totalPurchasedGrams: 0,
  };
}

export function mapDbPurchase(p: any): PurchaseInvoice {
  return {
    id: p.id,
    invoiceNumber: p.invoiceNumber,
    supplierId: p.supplierId,
    supplierName: p.supplierName,
    invoiceDate: p.invoiceDate
      ? new Date(p.invoiceDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    items: (p.items || []).map((it: any) => ({
      id: it.id,
      description: it.description,
      category: it.category as JewelleryCategory,
      metal: it.metal === "SILVER" ? "silver" : "gold",
      purity: it.purity as GoldPurityKey | SilverPurityKey,
      purityDisplay: it.purity,
      grossWeight: num(it.grossWeight),
      stoneWeight: num(it.stoneWeight),
      netWeight: num(it.netWeight),
      fineWeight: num(it.fineWeight),
      metalRate: num(it.metalRate),
      metalValue: num(it.subtotal),
      makingType: "per_gram",
      makingRate: num(it.makingRate),
      makingCharges: 0,
      stoneValue: 0,
      subtotal: num(it.subtotal),
      trayLocation: it.trayLocation,
    })),
    itemsSubtotal: num(p.itemsSubtotal),
    totalMaking: num(p.totalMaking),
    totalGst: num(p.totalGst),
    grandTotal: num(p.grandTotal),
    amountPaid: num(p.amountPaid),
    balanceDue: num(p.balanceDue),
    paymentMethod: (p.paymentMethod as PurchaseInvoice["paymentMethod"]) || "Cash",
    status: p.status === "paid" ? "paid" : num(p.amountPaid) > 0 ? "partial" : "pending",
  };
}

export function mapDbSupplierPayment(sp: any): SupplierPaymentRecord {
  return {
    id: sp.id,
    supplierId: sp.supplierId,
    supplierName: sp.supplier?.name || "Supplier",
    date: sp.date ? new Date(sp.date).toISOString() : new Date().toISOString(),
    amount: num(sp.amount),
    method: (sp.method as SupplierPaymentRecord["method"]) || "Cash",
    referenceNo: sp.referenceNo || undefined,
    notes: sp.notes || undefined,
  };
}

export function mapDbMemo(m: any): ConsignmentMemo {
  return {
    id: m.id,
    memoNumber: m.memoNumber,
    jewellerPartnerName: m.partnerName,
    jewellerPhone: m.partnerPhone,
    jewellerCity: m.partnerCity || "Jaipur",
    jewellerGstin: m.partnerGstin || undefined,
    issueDate: m.issueDate ? new Date(m.issueDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    validUntilDate: m.validUntilDate
      ? new Date(m.validUntilDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    items: (m.items || []).map((it: any) => ({
      id: it.id,
      stockItemId: it.stockItemId || undefined,
      sku: it.sku || undefined,
      barcode: it.barcode || undefined,
      name: it.name,
      category: it.category,
      metal: it.metal === "SILVER" ? "silver" : "gold",
      purity: it.purity,
      grossWeight: num(it.grossWeight),
      netWeight: num(it.netWeight),
      fineWeight: num(it.fineWeight),
      wholesaleRate: num(it.wholesaleRate),
      totalValue: num(it.totalValue),
      status: (it.status as MemoItemStatus) || "on_memo",
    })),
    totalPieces: m.totalPieces,
    totalGrossWeight: num(m.totalGrossWeight),
    totalNetWeight: num(m.totalNetWeight),
    totalFineWeight: num(m.totalFineWeight),
    totalEstimatedValue: num(m.totalEstimatedValue),
    status: (m.status as MemoStatus) || "active_issued",
    convertedInvoiceNumber: m.convertedInvoiceNumber || undefined,
    notes: m.notes || undefined,
    createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: m.updatedAt ? new Date(m.updatedAt).toISOString() : new Date().toISOString(),
  };
}

export function mapDbB2BPartner(bp: any): B2BPartnerProfile {
  return {
    id: bp.id,
    businessName: bp.businessName,
    contactPerson: bp.contactPerson,
    phone: bp.phone,
    city: bp.city,
    address: bp.address || "",
    gstin: bp.gstin || undefined,
    totalMemoCount: bp._count?.memos ?? 0,
    activeMemoValue: 0,
    totalPurchasedValue: num(bp.totalPurchased),
  };
}

export function mapDbRepair(r: any): RepairJob {
  return {
    id: r.id,
    repairNumber: r.repairNumber,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    ornamentDescription: r.ornamentName,
    metal: "gold",
    intakeGrossWeight: num(r.intakeGrossWeight),
    intakeNetWeight: num(r.intakeGrossWeight),
    conditionNotes: r.problemDescription,
    repairType: "general_repair",
    estimatedCharges: num(r.estimatedCost),
    metalAddedGrams: 0,
    metalCost: 0,
    finalCharges: num(r.estimatedCost),
    expectedDeliveryDate: r.deliveryPromiseDate
      ? new Date(r.deliveryPromiseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: (r.status as RepairStatus) || "received",
    createdAt: r.intakeDate ? new Date(r.intakeDate).toISOString() : new Date().toISOString(),
    deliveredAt: r.deliveredAt ? new Date(r.deliveredAt).toISOString() : undefined,
  };
}

export function mapDbBooking(b: any): CustomBookingOrder {
  const statusMap: Record<string, BookingStatus> = {
    placed: "booked",
    booked: "booked",
    in_crafting: "in_crafting",
    ready: "ready",
    delivered: "delivered",
    cancelled: "cancelled",
  };
  return {
    id: b.id,
    bookingNumber: b.orderNumber,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    title: b.ornamentType,
    category: "Custom Order",
    targetWeightGrams: num(b.targetGrossWeight),
    purity: b.purity,
    agreedRateMode: b.lockedGoldRatePer10g ? "rate_fixed_at_booking" : "market_rate_on_delivery",
    fixedGoldRate: b.lockedGoldRatePer10g ? num(b.lockedGoldRatePer10g) : undefined,
    estimatedTotal: num(b.estimatedTotalAmount),
    advanceReceivedAmount: num(b.advanceAmountPaid),
    advancePaymentMode: "UPI",
    dueDate: b.deliveryPromiseDate
      ? new Date(b.deliveryPromiseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    status: statusMap[b.status] || "booked",
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
  };
}

export function mapDbStaffMember(s: any): StaffMember {
  return {
    id: s.id,
    name: s.name,
    phone: s.phone,
    role: s.role as StaffRole,
    monthlySalary: num(s.monthlySalary),
    advanceBalance: num(s.advanceBalance),
    joiningDate: s.joiningDate ? new Date(s.joiningDate).toISOString().split("T")[0] : "2026-01-01",
    status: (s.status as StaffMember["status"]) || "active",
  };
}

export function mapDbStaffPayment(sp: any): StaffPaymentRecord {
  return {
    id: sp.id,
    staffId: sp.staffId,
    staffName: sp.staff?.name || "Staff",
    date: sp.date ? new Date(sp.date).toISOString() : new Date().toISOString(),
    type: sp.type === "advance" ? "advance" : "salary_payout",
    amount: num(sp.amount),
    paymentMethod: (sp.paymentMode as StaffPaymentRecord["paymentMethod"]) || "Cash",
    notes: sp.notes || undefined,
  };
}

export function mapDbSettings(s: any, tenantId: string): ShowroomMasterSettings {
  const def = getDefaultShowroomSettings(tenantId);
  if (!s) return def;
  return {
    ...def,
    tenantId,
    businessName: s.showroomName || def.businessName,
    legalFirmName: s.showroomName || def.legalFirmName,
    tagline: s.tagline || def.tagline,
    phone: s.contactPhones?.[0] || def.phone,
    email: s.email || def.email,
    city: s.city || def.city,
    stateCode: s.stateCode || def.stateCode,
    address: s.addressLine1 || def.address,
    gstin: s.gstin || def.gstin,
    bisLicenseNumber: s.bisHallmarkLicense || def.bisLicenseNumber,
    updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : def.updatedAt,
  };
}
