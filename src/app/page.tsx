"use client";

import React, { useState, useEffect } from "react";
import { GlassSidebar } from "../components/glass/GlassSidebar";
import { TopRateBar } from "../components/layout/TopRateBar";
import { CounterCalculator } from "../components/calculator/CounterCalculator";
import { FinancialOverview } from "../components/dashboard/FinancialOverview";
import { TaxInvoiceModal } from "../components/invoicing/TaxInvoiceModal";
import { BillingWorkspace } from "../components/billing/BillingWorkspace";
import { InvoicesRegistry } from "../components/invoicing/InvoicesRegistry";
import { GlassPanel } from "../components/glass/GlassPanel";
import { GlassBadge } from "../components/glass/GlassBadge";
import { GlassButton } from "../components/glass/GlassButton";
import { GlassInput } from "../components/glass/GlassInput";
import {
  Menu,
  X,
  Plus,
  Scale,
  Receipt,
  RotateCcw,
  Lock,
  Database,
} from "lucide-react";
import { AuthProvider, useAuth } from "../modules/auth/AuthContext";
import { LoginModal } from "../components/auth/LoginModal";
import { MetalRatesModal } from "../components/rates/MetalRatesModal";
import { getLatestMetalRates } from "../modules/rates/store";
import {
  InvoiceLineItem,
  FinalizedInvoice,
  CustomerProfile,
  OldGoldExchangeItem,
} from "../modules/invoicing/types";
import {
  getSavedInvoices,
  saveNewInvoice,
  INITIAL_DRAFT,
} from "../modules/invoicing/store";
import { formatINR } from "../lib/formatters";
import { InventoryManager } from "../components/inventory/InventoryManager";
import { StockItem } from "../modules/inventory/types";
import {
  getSavedStock,
  saveStockItems,
  updateStockItemStatus,
  lockInvoicedStockItems,
  ingestOldGoldScrap,
} from "../modules/inventory/store";
import { CustomerLedger } from "../components/customers/CustomerLedger";
import { Customer, NewCustomerInput } from "../modules/customers/types";
import {
  getSavedCustomers,
  saveCustomers,
  addCustomer,
  recordInvoiceToCustomer,
} from "../modules/customers/store";
import { ReportsOverview } from "../components/reports/ReportsOverview";
import { PreloadedCalcData } from "../components/calculator/CounterCalculator";
import { JewellerTenant, RegisterJewellerInput } from "../modules/tenants/types";
import {
  getAllTenants,
  getActiveTenant,
  setActiveTenantId,
  registerNewTenant,
  updateTenantProfile,
} from "../modules/tenants/store";
import { JewellerSwitcherModal } from "../components/tenants/JewellerSwitcherModal";
import { GirviManager } from "../components/girvi/GirviManager";
import { GirviLoan, NewGirviInput } from "../modules/girvi/types";
import {
  getSavedGirviLoans,
  createGirviLoan,
  releaseGirviLoan,
} from "../modules/girvi/store";

import { KarigarManager } from "../components/karigar/KarigarManager";
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
  getSavedKarigars,
  getSavedKarigarTxns,
  getSavedJobCards,
  addKarigar,
  issueMetalToKarigar,
  receiveOrnamentFromKarigar,
  payLabourToKarigar,
  createJobCard,
  updateJobCardStatus,
} from "../modules/karigar/store";

import { AccountsManager } from "../components/accounts/AccountsManager";
import {
  Account,
  ShopExpense,
  DailyCashClosing,
  RecordExpenseInput,
  RecordCashClosingInput,
} from "../modules/accounts/types";
import {
  getSavedAccounts,
  getSavedExpenses,
  getSavedDailyClosings,
  recordExpense,
  recordDailyCashClosing,
  postInvoiceToAccounts,
} from "../modules/accounts/store";

import { StaffManager } from "../components/staff/StaffManager";
import {
  StaffMember,
  StaffPaymentRecord,
  AddStaffInput,
  IssueAdvanceInput,
  PaySalaryInput,
} from "../modules/staff/types";
import {
  getSavedStaff,
  getSavedStaffPayments,
  addStaffMember,
  issueStaffAdvance,
  payStaffSalary,
} from "../modules/staff/store";

import { PurchaseManager } from "../components/suppliers/PurchaseManager";
import {
  SupplierProfile,
  PurchaseInvoice,
  SupplierPaymentRecord,
  NewSupplierInput,
} from "../modules/suppliers/types";
import {
  getSavedSuppliers,
  getSavedPurchases,
  getSavedSupplierPayments,
  recordPurchaseInvoice,
  recordSupplierPayment,
  addSupplier,
} from "../modules/suppliers/store";

import { WholesaleManager } from "../components/wholesale/WholesaleManager";
import {
  ConsignmentMemo,
  B2BPartnerProfile,
  CreateConsignmentMemoInput,
} from "../modules/wholesale/types";
import {
  getSavedMemos,
  getSavedB2BPartners,
  createConsignmentMemo,
  returnMemoItems,
  convertMemoToInvoice,
  saveB2BPartners,
} from "../modules/wholesale/store";

import { RepairsManager } from "../components/repairs/RepairsManager";
import {
  RepairJob,
  CustomBookingOrder,
  CreateRepairInput,
  UpdateRepairStatusInput,
  CreateBookingInput,
  BookingStatus,
} from "../modules/repairs/types";
import {
  getSavedRepairs,
  getSavedBookings,
  createRepairJob,
  updateRepairStatus,
  createBookingOrder,
  updateBookingStatus,
} from "../modules/repairs/store";

import { SettingsManager } from "../components/settings/SettingsManager";
import { getSavedSettings } from "../modules/settings/store";
import { ShowroomMasterSettings } from "../modules/settings/types";
import { neonApi } from "../lib/neonApi";

const RestrictedModuleGuard: React.FC<{
  moduleName: string;
  allowedRoles: string;
}> = ({ moduleName, allowedRoles }) => {
  const { user, role, openLoginModal } = useAuth();
  return (
    <div className="py-16 px-4">
      <div className="max-w-md mx-auto p-6 sm:p-8 rounded-2xl bg-[var(--surface-primary)] border border-amber-500/20 backdrop-blur-xl text-center space-y-4 shadow-2xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <Lock size={22} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Access Restricted: {moduleName}
          </h2>
          <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
            Your current employee profile (
            <span className="font-semibold text-[var(--text-primary)]">{user.fullName}</span> ·{" "}
            <span className="text-[#DFC488] font-mono">{role.replace("_", " ")}</span>) does not have permission to view or manage these records.
          </p>
          <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/[0.04] text-[11px] text-[var(--text-secondary)]">
            Authorized roles: <span className="font-semibold text-emerald-400">{allowedRoles}</span>
          </div>
        </div>
        <div className="pt-2">
          <GlassButton variant="primary" size="sm" onClick={openLoginModal}>
            Switch to Authorized Profile
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

function WorkspaceMain() {
  const { user, role, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("/calculator");
  const [invoicingSubTab, setInvoicingSubTab] = useState<"active" | "history">("active");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);
  const [currentInvoiceData, setCurrentInvoiceData] = useState<FinalizedInvoice | undefined>(undefined);

  // Multi-Jeweller Tenant State
  const [allTenants, setAllTenants] = useState<JewellerTenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<JewellerTenant>(() => getActiveTenant());
  const [isTenantModalOpen, setIsTenantModalOpen] = useState<boolean>(false);
  const [isRatesModalOpen, setIsRatesModalOpen] = useState<boolean>(false);

  // Shop Rates & Profile State (Scoped to Active Showroom & Daily Sarafa Board)
  const [goldRate, setGoldRate] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return getLatestMetalRates().gold24k;
    }
    return activeTenant.defaultGoldRate || 150000;
  });
  const [silverRate, setSilverRate] = useState<number>(() => {
    if (typeof window !== "undefined") {
      return getLatestMetalRates().silver999PerKg;
    }
    return activeTenant.defaultSilverRate || 95000;
  });
  const [shopName, setShopName] = useState<string>(activeTenant.businessName || "Sandhya Jewellers");
  const [gstin, setGstin] = useState<string>(activeTenant.gstin || "08AAAAJ1234F1Z8");
  const [phone, setPhone] = useState<string>(activeTenant.phone || "+91 94140 12345");
  const [address, setAddress] = useState<string>(activeTenant.address || "142 Sarafa Bazar, M.I. Road, Jaipur");

  // Invoicing & Draft State
  const [invoices, setInvoices] = useState<FinalizedInvoice[]>([]);
  const [draftItems, setDraftItems] = useState<InvoiceLineItem[]>(INITIAL_DRAFT.items);

  // Inventory & Stock State
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Customer Directory State
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Girvi / Gold Loan State
  const [girviLoans, setGirviLoans] = useState<GirviLoan[]>([]);

  // Karigar State
  const [karigars, setKarigars] = useState<Karigar[]>([]);
  const [karigarTxns, setKarigarTxns] = useState<KarigarTransaction[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);

  // Accounts & Daily Cash Closing State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyCashClosing[]>([]);

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffPayments, setStaffPayments] = useState<StaffPaymentRecord[]>([]);

  // Suppliers & Purchase Invoices State
  const [suppliers, setSuppliers] = useState<SupplierProfile[]>([]);
  const [purchases, setPurchases] = useState<PurchaseInvoice[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentRecord[]>([]);

  // Wholesale Consignment Memos & B2B Partners State
  const [memos, setMemos] = useState<ConsignmentMemo[]>([]);
  const [b2bPartners, setB2BPartners] = useState<B2BPartnerProfile[]>([]);

  // Customer Repairs & Custom Orders State
  const [repairs, setRepairs] = useState<RepairJob[]>([]);
  const [bookings, setBookings] = useState<CustomBookingOrder[]>([]);

  // Preloaded Data for Calculator
  const [preloadedCalcData, setPreloadedCalcData] = useState<PreloadedCalcData | null>(null);

  // Preselected Customer for Billing
  const [selectedBillingCustomer, setSelectedBillingCustomer] = useState<CustomerProfile | null>(null);

  // Showroom Master Settings & System Config State
  const [showroomSettings, setShowroomSettings] = useState<ShowroomMasterSettings>(() =>
    getSavedSettings(activeTenant.id)
  );

  const [dbSyncStatus, setDbSyncStatus] = useState<"connecting" | "connected" | "syncing" | "offline">(
    "connecting"
  );

  const runDbSync = (operation: Promise<unknown>) => {
    setDbSyncStatus("syncing");
    void operation
      .then((res) => {
        setDbSyncStatus(res ? "connected" : "offline");
      })
      .catch(() => {
        setDbSyncStatus("offline");
      });
  };

  // Synchronize Active Tenant Data and Isolated Database (Cache + Neon PostgreSQL)
  const loadTenantData = (tenant: JewellerTenant) => {
    setActiveTenant(tenant);
    setShopName(tenant.businessName);
    setGstin(tenant.gstin);
    setPhone(tenant.phone);
    setAddress(tenant.address);
    setGoldRate(tenant.defaultGoldRate);
    setSilverRate(tenant.defaultSilverRate);
    setInvoices(getSavedInvoices(tenant.id));
    setStockItems(getSavedStock(tenant.id));
    setCustomers(getSavedCustomers(tenant.id));
    setGirviLoans(getSavedGirviLoans(tenant.id));
    setKarigars(getSavedKarigars(tenant.id));
    setKarigarTxns(getSavedKarigarTxns(tenant.id));
    setJobCards(getSavedJobCards(tenant.id));
    setAccounts(getSavedAccounts(tenant.id));
    setExpenses(getSavedExpenses(tenant.id));
    setDailyClosings(getSavedDailyClosings(tenant.id));
    setStaffList(getSavedStaff(tenant.id));
    setStaffPayments(getSavedStaffPayments(tenant.id));
    setSuppliers(getSavedSuppliers(tenant.id));
    setPurchases(getSavedPurchases(tenant.id));
    setSupplierPayments(getSavedSupplierPayments(tenant.id));
    setMemos(getSavedMemos(tenant.id));
    setB2BPartners(getSavedB2BPartners(tenant.id));
    setRepairs(getSavedRepairs(tenant.id));
    setBookings(getSavedBookings(tenant.id));
    setShowroomSettings(getSavedSettings(tenant.id));
    setDraftItems([]);

    // Live Neon PostgreSQL Hydration
    setDbSyncStatus("connecting");
    void neonApi.bootstrap(tenant.id).then((data) => {
      if (!data || !data.success) {
        setDbSyncStatus("offline");
        return;
      }
      setDbSyncStatus("connected");
      if (data.tenants?.length) setAllTenants(data.tenants);
      if (data.rates) {
        setGoldRate(data.rates.gold24k);
        setSilverRate(data.rates.silver999PerKg);
      }
      if (data.accounts?.length) setAccounts(data.accounts);
      if (data.settings) {
        setShowroomSettings(data.settings);
        setShopName(data.settings.businessName);
        setAddress(data.settings.address);
        setPhone(data.settings.phone);
        setGstin(data.settings.gstin);
      }
      if (data.stockItems?.length) setStockItems(data.stockItems);
      if (data.invoices?.length) setInvoices(data.invoices);
      if (data.customers?.length) setCustomers(data.customers);
      if (data.expenses?.length) setExpenses(data.expenses);
      if (data.dailyClosings?.length) setDailyClosings(data.dailyClosings);
      if (data.girviLoans?.length) setGirviLoans(data.girviLoans);
      if (data.karigars?.length) setKarigars(data.karigars);
      if (data.karigarTxns?.length) setKarigarTxns(data.karigarTxns);
      if (data.jobCards?.length) setJobCards(data.jobCards);
      if (data.suppliers?.length) setSuppliers(data.suppliers);
      if (data.purchases?.length) setPurchases(data.purchases);
      if (data.supplierPayments?.length) setSupplierPayments(data.supplierPayments);
      if (data.memos?.length) setMemos(data.memos);
      if (data.b2bPartners?.length) setB2BPartners(data.b2bPartners);
      if (data.repairs?.length) setRepairs(data.repairs);
      if (data.bookings?.length) setBookings(data.bookings);
      if (data.staff?.length) setStaffList(data.staff);
      if (data.staffPayments?.length) setStaffPayments(data.staffPayments);
    });
  };

  // Load saved tenants and active database on mount
  useEffect(() => {
    const tenants = getAllTenants();
    setAllTenants(tenants);
    const curr = getActiveTenant();
    loadTenantData(curr);
  }, []);

  const handleSelectTenant = (tenantId: string) => {
    setActiveTenantId(tenantId);
    const tenants = getAllTenants();
    setAllTenants(tenants);
    const selected = tenants.find((t) => t.id === tenantId) || tenants[0];
    loadTenantData(selected);
  };

  const handleRegisterTenant = (input: RegisterJewellerInput) => {
    const created = registerNewTenant(input);
    const tenants = getAllTenants();
    setAllTenants(tenants);
    runDbSync(neonApi.registerTenant({ ...input, id: created.id }));
    loadTenantData(created);
  };

  // Sync theme attribute to <html> tag
  useEffect(() => {
    if (theme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.classList.add("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleSendToInvoice = (calcResult: any) => {
    // Convert calculator result to a cart line item
    const newItem: InvoiceLineItem = {
      id: `item-${Date.now()}`,
      name: calcResult.productName || "Jewellery Ornament",
      metal: calcResult.metal || "gold",
      purity: calcResult.purityKey || "18K",
      purityDisplay: `${calcResult.purityKey || "18K"} (${calcResult.basePurityPercentage?.toNumber?.() || 75}%)`,
      grossWeight: calcResult.grossWeight.toNumber(),
      stoneWeight: calcResult.stoneDeduction.toNumber(),
      netWeight: calcResult.billableWeight.toNumber(),
      metalRate: goldRate,
      effectiveRatePerGram: calcResult.effectiveRatePerGram.toNumber(),
      metalValue: calcResult.metalValue.toNumber(),
      makingType: calcResult.makingType || "percentage",
      makingRate: calcResult.makingValue || 18,
      makingCharges: calcResult.makingCharges.toNumber(),
      stoneValue: calcResult.stoneValue.toNumber(),
      discount: calcResult.discountValue.toNumber(),
      totalBeforeTax: calcResult.subtotalBeforeTax.toNumber(),
      fineWeight: calcResult.fineWeight.toNumber(),
      fineGoldValue24k: calcResult.fineGoldValue24k.toNumber(),
      wastagePercentage: calcResult.wastagePercentage.toNumber(),
    };

    setDraftItems([...draftItems, newItem]);
    setActiveTab("/invoices");
    setInvoicingSubTab("active");
  };

  const handleRemoveDraftItem = (id: string) => {
    setDraftItems(draftItems.filter((i) => i.id !== id));
  };

  const handleFinalizeBill = (finalized: FinalizedInvoice) => {
    // 1. Lock invoiced stock items atomically
    const lockedStock = lockInvoicedStockItems(
      finalized.items,
      finalized.invoiceNumber,
      user,
      activeTenant.id
    );

    // 2. Ingest Old Gold scrap lots if present
    let finalStock = lockedStock;
    if (finalized.oldGoldExchange && finalized.oldGoldExchange.length > 0) {
      finalStock = ingestOldGoldScrap(
        finalized.oldGoldExchange,
        finalized.invoiceNumber,
        finalized.customer.name,
        user,
        activeTenant.id
      );
    }
    setStockItems(finalStock);

    saveNewInvoice(finalized, activeTenant.id);
    postInvoiceToAccounts(finalized, activeTenant.id);
    setAccounts(getSavedAccounts(activeTenant.id));
    setInvoices([finalized, ...invoices]);
    setCurrentInvoiceData(finalized);
    setIsInvoiceModalOpen(true);
    // Record invoice to customer directory
    const updatedCustomers = recordInvoiceToCustomer(finalized, activeTenant.id);
    setCustomers(updatedCustomers);
    // Reset draft cart for next customer
    setDraftItems([]);
    runDbSync(neonApi.persistInvoice(activeTenant.id, finalized, user.id));
  };

  const handleQuickCashBill = (applyGst: boolean) => {
    if (draftItems.length === 0) return;

    const subtotal = draftItems.reduce((acc, item) => acc + item.totalBeforeTax, 0);
    const gstRate = 3;
    const gstAmount = applyGst ? Math.round(subtotal * 0.03) : 0;
    const cgstAmount = applyGst ? Math.round(gstAmount / 2) : 0;
    const sgstAmount = applyGst ? gstAmount - cgstAmount : 0;
    const grandTotal = subtotal + gstAmount;

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: FinalizedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceDate: now.toISOString(),
      createdAt: now.toISOString(),
      customer: {
        id: `walkin-${Date.now()}`,
        name: "Walk-in Retail Consumer",
        phone: "+91 Counter Cash Sale",
        city: activeTenant.city || "Local",
        gstin: "URP (Unregistered Person)",
      },
      items: [...draftItems],
      oldGoldExchange: [],
      itemsSubtotal: subtotal,
      oldGoldTotalCredit: 0,
      discountTotal: 0,
      taxableAmount: subtotal,
      gstPercentage: applyGst ? gstRate : 0,
      cgstAmount,
      sgstAmount,
      totalGst: gstAmount,
      roundoff: 0,
      grandTotal,
      payments: [
        {
          method: "Cash",
          amount: grandTotal,
          transactionRef: "Cash Counter Sale",
        },
      ],
      totalPaid: grandTotal,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: shopName,
        address,
        phone,
        gstin,
      },
    };

    // Lock invoiced stock items atomically
    const lockedStock = lockInvoicedStockItems(
      newInvoice.items,
      newInvoice.invoiceNumber,
      user,
      activeTenant.id
    );
    setStockItems(lockedStock);

    saveNewInvoice(newInvoice, activeTenant.id);
    postInvoiceToAccounts(newInvoice, activeTenant.id);
    setAccounts(getSavedAccounts(activeTenant.id));
    setInvoices([newInvoice, ...invoices]);
    setCurrentInvoiceData(newInvoice);
    setIsInvoiceModalOpen(true);
    const updatedCustomers = recordInvoiceToCustomer(newInvoice, activeTenant.id);
    setCustomers(updatedCustomers);
    setDraftItems([]);
    runDbSync(neonApi.persistInvoice(activeTenant.id, newInvoice, user.id));
  };

  const handleBillWithCustomerFromCounter = (
    cust: CustomerProfile,
    applyGst: boolean,
    oldGold?: OldGoldExchangeItem[]
  ) => {
    if (draftItems.length === 0) return;

    const itemsSubtotal = draftItems.reduce((acc, item) => acc + item.totalBeforeTax, 0);
    const ogItems = oldGold || [];
    const ogTotalCredit = ogItems.reduce((acc, og) => acc + og.totalExchangeCredit, 0);
    const taxableAmount = Math.max(0, itemsSubtotal - ogTotalCredit);

    const gstRate = 3;
    const gstAmount = applyGst ? Math.round(taxableAmount * 0.03) : 0;
    const cgstAmount = applyGst ? Math.round(gstAmount / 2) : 0;
    const sgstAmount = applyGst ? gstAmount - cgstAmount : 0;
    const grandTotal = taxableAmount + gstAmount;

    const now = new Date();
    const invoiceNumber = `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newInvoice: FinalizedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber,
      invoiceDate: now.toISOString(),
      createdAt: now.toISOString(),
      customer: cust,
      items: [...draftItems],
      oldGoldExchange: ogItems,
      itemsSubtotal,
      oldGoldTotalCredit: ogTotalCredit,
      discountTotal: 0,
      taxableAmount,
      gstPercentage: applyGst ? gstRate : 0,
      cgstAmount,
      sgstAmount,
      totalGst: gstAmount,
      roundoff: 0,
      grandTotal,
      payments: [
        {
          method: "UPI",
          amount: grandTotal,
          transactionRef: "Counter POS Settlement",
        },
      ],
      totalPaid: grandTotal,
      balanceDue: 0,
      status: "paid",
      shopSnapshot: {
        name: shopName,
        address,
        phone,
        gstin,
      },
    };

    // 1. Lock invoiced stock items atomically
    const lockedStock = lockInvoicedStockItems(
      newInvoice.items,
      newInvoice.invoiceNumber,
      user,
      activeTenant.id
    );

    // 2. Ingest Old Gold scrap lots if present
    let finalStock = lockedStock;
    if (ogItems.length > 0) {
      finalStock = ingestOldGoldScrap(
        ogItems,
        newInvoice.invoiceNumber,
        newInvoice.customer.name,
        user,
        activeTenant.id
      );
    }
    setStockItems(finalStock);

    saveNewInvoice(newInvoice, activeTenant.id);
    postInvoiceToAccounts(newInvoice, activeTenant.id);
    setAccounts(getSavedAccounts(activeTenant.id));
    setInvoices([newInvoice, ...invoices]);
    setCurrentInvoiceData(newInvoice);
    setIsInvoiceModalOpen(true);
    const updatedCustomers = recordInvoiceToCustomer(newInvoice, activeTenant.id);
    setCustomers(updatedCustomers);
    setDraftItems([]);
    runDbSync(neonApi.persistInvoice(activeTenant.id, newInvoice, user.id));
  };

  const handleAddStockItem = (newItem: StockItem) => {
    const updated = [newItem, ...stockItems];
    setStockItems(updated);
    saveStockItems(updated, activeTenant.id);
    runDbSync(neonApi.addStockItem(activeTenant.id, newItem));
  };

  const handleLoadStockIntoCalculator = (item: StockItem) => {
    setPreloadedCalcData({
      productName: item.name,
      metal: item.metal,
      grossWeight: item.grossWeight,
      stoneDeduction: item.stoneWeight,
      goldPurity: item.metal === "gold" ? (item.purity as any) : undefined,
      silverPurity: item.metal === "silver" ? (item.purity as any) : undefined,
      makingValue: item.defaultMakingValue,
      makingType: item.defaultMakingType,
      stockItemId: item.id,
      sku: item.sku,
      barcode: item.barcode,
      status: item.status,
    });
    setActiveTab("/calculator");
  };

  const handleAddCustomer = (input: NewCustomerInput) => {
    const created = addCustomer(input, activeTenant.id);
    setCustomers(getSavedCustomers(activeTenant.id));
    runDbSync(
      neonApi.addCustomer(activeTenant.id, input).then((res) => {
        if (res?.customer) {
          setCustomers((prev) => [res.customer, ...prev.filter((c) => c.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleAddGirviLoan = (input: NewGirviInput) => {
    const created = createGirviLoan(input, activeTenant.id);
    setGirviLoans(getSavedGirviLoans(activeTenant.id));
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(
      neonApi.createGirviLoan(activeTenant.id, input).then((res) => {
        if (res?.loan) {
          setGirviLoans((prev) => [res.loan, ...prev.filter((l) => l.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleReleaseGirviLoan = (loanId: string) => {
    const target = girviLoans.find((l) => l.id === loanId);
    const updated = releaseGirviLoan(loanId, activeTenant.id);
    setGirviLoans(updated);
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.releaseGirviLoan(activeTenant.id, loanId, target?.loanNumber));
  };

  // Karigar Actions
  const handleAddKarigar = (input: {
    name: string;
    phone: string;
    workshopCity: string;
    specialty: string;
    notes?: string;
  }) => {
    const created = addKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    runDbSync(
      neonApi.karigarAction(activeTenant.id, "add_karigar", input).then((res) => {
        if (res?.karigar) {
          setKarigars((prev) => [res.karigar, ...prev.filter((k) => k.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleIssueMetalToKarigar = (input: IssueMetalInput) => {
    issueMetalToKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
    setStockItems(getSavedStock(activeTenant.id));
    runDbSync(neonApi.karigarAction(activeTenant.id, "issue_metal", input));
  };

  const handleReceiveOrnamentFromKarigar = (input: ReceiveOrnamentInput) => {
    receiveOrnamentFromKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
    setStockItems(getSavedStock(activeTenant.id));
    runDbSync(neonApi.karigarAction(activeTenant.id, "receive_ornament", input));
  };

  const handlePayLabourToKarigar = (input: PayLabourInput) => {
    payLabourToKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.karigarAction(activeTenant.id, "pay_labour", input));
  };

  const handleCreateJobCard = (input: CreateJobCardInput) => {
    const created = createJobCard(input, activeTenant.id);
    setJobCards(getSavedJobCards(activeTenant.id));
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
    setStockItems(getSavedStock(activeTenant.id));
    runDbSync(
      neonApi.karigarAction(activeTenant.id, "create_job_card", input).then((res) => {
        if (res?.jobCard) {
          setJobCards((prev) => [res.jobCard, ...prev.filter((j) => j.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleUpdateJobCardStatus = (jobCardId: string, status: JobCardStatus, huid?: string) => {
    updateJobCardStatus(jobCardId, status, huid, activeTenant.id);
    setJobCards(getSavedJobCards(activeTenant.id));
    runDbSync(neonApi.updateJobCardStatus(jobCardId, status, huid));
  };

  // Accounts Actions
  const handleRecordExpense = (input: RecordExpenseInput) => {
    recordExpense(input, activeTenant.id);
    setExpenses(getSavedExpenses(activeTenant.id));
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.recordExpense(activeTenant.id, input));
  };

  const handleRecordClosing = (input: RecordCashClosingInput) => {
    recordDailyCashClosing(input, activeTenant.id);
    setDailyClosings(getSavedDailyClosings(activeTenant.id));
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.recordClosing(activeTenant.id, input));
  };

  // Staff Actions
  const handleAddStaffMember = (input: AddStaffInput) => {
    const created = addStaffMember(input, activeTenant.id);
    setStaffList(getSavedStaff(activeTenant.id));
    runDbSync(
      neonApi.staffAction(activeTenant.id, "add_staff", input).then((res) => {
        if (res?.staff) {
          setStaffList((prev) => [res.staff, ...prev.filter((s) => s.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleIssueStaffAdvance = (input: IssueAdvanceInput) => {
    issueStaffAdvance(input, activeTenant.id);
    setStaffList(getSavedStaff(activeTenant.id));
    setStaffPayments(getSavedStaffPayments(activeTenant.id));
    runDbSync(neonApi.staffAction(activeTenant.id, "issue_advance", input));
  };

  const handlePayStaffSalary = (input: PaySalaryInput) => {
    payStaffSalary(input, activeTenant.id);
    setStaffList(getSavedStaff(activeTenant.id));
    setStaffPayments(getSavedStaffPayments(activeTenant.id));
    runDbSync(neonApi.staffAction(activeTenant.id, "pay_salary", input));
  };

  // Supplier & Purchase Actions
  const handleRecordPurchase = (invoiceInput: Omit<PurchaseInvoice, "id" | "createdAt">) => {
    const result = recordPurchaseInvoice(invoiceInput, user, activeTenant.id);
    setPurchases([result.invoice, ...purchases]);
    setStockItems(result.updatedStock);
    setSuppliers(result.updatedSuppliers);
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.recordPurchase(activeTenant.id, invoiceInput));
  };

  const handleAddSupplier = (input: NewSupplierInput) => {
    const created = addSupplier(input, activeTenant.id);
    setSuppliers(getSavedSuppliers(activeTenant.id));
    runDbSync(
      neonApi.addSupplier(activeTenant.id, input).then((res) => {
        if (res?.supplier) {
          setSuppliers((prev) => [res.supplier, ...prev.filter((s) => s.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handlePaySupplier = (payment: Omit<SupplierPaymentRecord, "id" | "date">) => {
    const result = recordSupplierPayment(payment, activeTenant.id);
    setSupplierPayments([result.paymentRecord, ...supplierPayments]);
    setSuppliers(result.updatedSuppliers);
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.recordSupplierPayment(activeTenant.id, payment));
  };

  // Wholesale Consignment Memo Actions (जांगड़ / कच्चा पर्चा)
  const handleIssueMemo = (input: CreateConsignmentMemoInput) => {
    const created = createConsignmentMemo(input, activeTenant.id);
    setMemos(getSavedMemos(activeTenant.id));
    setStockItems(getSavedStock(activeTenant.id));
    runDbSync(
      neonApi.wholesaleAction(activeTenant.id, "issue_memo", input).then((res) => {
        if (res?.memo) {
          setMemos((prev) => [res.memo, ...prev.filter((m) => m.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleReturnMemoItems = (memoId: string, itemIds: string[]) => {
    returnMemoItems(memoId, itemIds, activeTenant.id);
    setMemos(getSavedMemos(activeTenant.id));
    setStockItems(getSavedStock(activeTenant.id));
    runDbSync(neonApi.updateMemoStatus("return", memoId, itemIds));
  };

  const handleConvertMemoToInvoice = (memoId: string, itemIds: string[], invoiceNum: string) => {
    convertMemoToInvoice(memoId, itemIds, invoiceNum, activeTenant.id);
    setMemos(getSavedMemos(activeTenant.id));
    setStockItems(getSavedStock(activeTenant.id));
    setInvoices(getSavedInvoices(activeTenant.id));
    setAccounts(getSavedAccounts(activeTenant.id));
    runDbSync(neonApi.updateMemoStatus("convert", memoId, itemIds, invoiceNum));
  };

  const handleAddB2BPartner = (partner: Omit<B2BPartnerProfile, "id" | "totalMemoCount" | "activeMemoValue" | "totalPurchasedValue">) => {
    const newPartner: B2BPartnerProfile = {
      ...partner,
      id: `bp-${Date.now()}`,
      totalMemoCount: 0,
      activeMemoValue: 0,
      totalPurchasedValue: 0,
    };
    const updated = [newPartner, ...b2bPartners];
    saveB2BPartners(updated, activeTenant.id);
    setB2BPartners(updated);
    runDbSync(neonApi.wholesaleAction(activeTenant.id, "add_partner", partner));
  };

  // Customer Repairs & Custom Orders Actions
  const handleCreateRepair = (input: CreateRepairInput) => {
    const created = createRepairJob(input, activeTenant.id);
    setRepairs(getSavedRepairs(activeTenant.id));
    runDbSync(
      neonApi.createRepair(activeTenant.id, input).then((res) => {
        if (res?.repair) {
          setRepairs((prev) => [res.repair, ...prev.filter((r) => r.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleUpdateRepairStatus = (input: UpdateRepairStatusInput) => {
    updateRepairStatus(input, activeTenant.id);
    setRepairs(getSavedRepairs(activeTenant.id));
    runDbSync(neonApi.updateRepairStatus(input));
  };

  const handleCreateBooking = (input: CreateBookingInput) => {
    const created = createBookingOrder(input, activeTenant.id);
    setBookings(getSavedBookings(activeTenant.id));
    runDbSync(
      neonApi.createBooking(activeTenant.id, input).then((res) => {
        if (res?.booking) {
          setBookings((prev) => [res.booking, ...prev.filter((b) => b.id !== created.id)]);
        }
        return res;
      })
    );
  };

  const handleUpdateBookingStatus = (bookingId: string, status: BookingStatus) => {
    updateBookingStatus(bookingId, status, activeTenant.id);
    setBookings(getSavedBookings(activeTenant.id));
    runDbSync(neonApi.updateBookingStatus(bookingId, status));
  };

  const handleStartBillForCustomer = (cust: Customer) => {
    setSelectedBillingCustomer({
      id: cust.id,
      name: cust.name,
      phone: cust.phone,
      city: cust.city,
      address: cust.address || "",
      gstin: cust.gstin || "URP (Retail Consumer)",
    });
    setActiveTab("/invoices");
    setInvoicingSubTab("active");
  };

  const handleViewInvoice = (inv: FinalizedInvoice) => {
    setCurrentInvoiceData(inv);
    setIsInvoiceModalOpen(true);
  };

  const shopDetails = {
    name: shopName,
    address,
    phone,
    gstin,
  };

  return (
    <div className="flex min-h-screen bg-[var(--canvas-bg)] text-[var(--text-primary)]">
      {/* Desktop Persistent Glass Sidebar Rail */}
      <div className="hidden lg:block">
        <GlassSidebar
          currentTheme={theme}
          onToggleTheme={toggleTheme}
          shopName={activeTenant.businessName}
          ownerName={activeTenant.ownerName}
          activeTab={activeTab}
          onSelectTab={(href) => setActiveTab(href)}
          onOpenShowroomSwitcher={() => setIsTenantModalOpen(true)}
        />
      </div>

      {/* Main Workspace Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Ticker Header */}
        <TopRateBar
          gold24kRate={goldRate}
          silverRate={silverRate}
          onOpenQuickInvoice={() => {
            setActiveTab("/invoices");
            setInvoicingSubTab("active");
          }}
          onOpenGoldCalc={() => setActiveTab("/calculator")}
          onOpenSilverCalc={() => setActiveTab("/calculator")}
          onOpenRatesModal={() => setIsRatesModalOpen(true)}
          activeTenantName={activeTenant.businessName}
          activeTenantCity={activeTenant.city}
          onOpenShowroomSwitcher={() => setIsTenantModalOpen(true)}
        />

        {/* Mobile Navigation Bar */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-white/[0.05] bg-[var(--surface-primary)]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#C5A059]" />
            <span className="font-semibold text-xs uppercase tracking-wider text-[var(--text-primary)]">
              Jewellery<span className="text-[#C5A059]">OS</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTenantModalOpen(true)}
              className="px-2 py-1 text-xs rounded bg-[#C5A059]/15 text-[#DFC488] font-medium"
            >
              {activeTenant.businessName.split(" ")[0]}
            </button>
            <button
              onClick={toggleTheme}
              className="px-2 py-1 text-xs rounded bg-white/[0.04] text-[var(--text-secondary)]"
            >
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded bg-white/[0.04] text-[var(--text-secondary)]"
            >
              {isMobileMenuOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden p-4 border-b border-white/[0.05] bg-[var(--surface-primary)] flex flex-col gap-1 z-40">
            {[
              { name: "Counter Calculator", href: "/calculator" },
              { name: "Dashboard", href: "/" },
              { name: "Billing & Invoices", href: "/invoices" },
              { name: "Girvi / Gold Loans", href: "/girvi" },
              { name: "Karigar Ledger", href: "/karigar" },
              { name: "Staff & Payroll", href: "/staff" },
              { name: "Inventory", href: "/inventory" },
              { name: "Purchases & Suppliers", href: "/purchases" },
              { name: "Wholesale & Memos", href: "/wholesale" },
              { name: "Repairs & Bookings", href: "/repairs" },
              { name: "Accounts & Cashbook", href: "/accounts" },
              { name: "Customers", href: "/customers" },
              { name: "Reports & Analytics", href: "/reports" },
              { name: "Shop Settings", href: "/settings" },
            ].map((tab) => (
              <button
                key={tab.href}
                onClick={() => {
                  setActiveTab(tab.href);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium ${
                  activeTab === tab.href
                    ? "bg-[#C5A059]/15 text-[#DFC488] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-white/[0.03]"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        )}

        {/* Workspace Canvas Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {/* View: Calculator */}
          {activeTab === "/calculator" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-2">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Counter Pricing Terminal
                  </h1>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    10g 18K @ 18% = ₹1,32,750 · 10g 22K @ 18% = ₹1,62,250 · 24ct Fine Gold Settlement
                  </p>
                </div>
              </div>

              <CounterCalculator
                initialGoldRate={goldRate}
                initialSilverRate={silverRate}
                onSendToInvoice={handleSendToInvoice}
                preloadedItem={preloadedCalcData}
                cartItems={draftItems}
                onAddToCart={(item) => setDraftItems((prev) => [...prev, item])}
                onRemoveCartItem={(id) => setDraftItems((prev) => prev.filter((i) => i.id !== id))}
                onClearCart={() => setDraftItems([])}
                onQuickCashBill={handleQuickCashBill}
                onBillWithCustomer={handleBillWithCustomerFromCounter}
                customers={customers}
                shopName={shopName}
              />
            </div>
          )}

          {/* View: Billing & Invoices (Multi-item + Registry) */}
          {activeTab === "/invoices" && (
            <div className="space-y-6">
              {/* Invoicing Tabs */}
              <div className="inline-flex p-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs">
                <button
                  onClick={() => setInvoicingSubTab("active")}
                  className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                    invoicingSubTab === "active"
                      ? "bg-[#C5A059] text-[#08090C] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Active Counter Bill ({draftItems.length})
                </button>
                <button
                  onClick={() => setInvoicingSubTab("history")}
                  className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                    invoicingSubTab === "history"
                      ? "bg-[#C5A059] text-[#08090C] font-semibold"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Past Invoices Registry ({invoices.length})
                </button>
              </div>

              {invoicingSubTab === "active" ? (
                <BillingWorkspace
                  draftItems={draftItems}
                  onRemoveItem={handleRemoveDraftItem}
                  onNavigateToCalculator={() => setActiveTab("/calculator")}
                  onFinalizeInvoice={handleFinalizeBill}
                  gold24kRate={goldRate}
                  shopDetails={shopDetails}
                  selectedCustomer={selectedBillingCustomer}
                />
              ) : (
                <InvoicesRegistry
                  invoices={invoices}
                  onSelectInvoice={handleViewInvoice}
                  onCreateNewBill={() => setInvoicingSubTab("active")}
                />
              )}
            </div>
          )}

          {/* View: Financial Dashboard */}
          {activeTab === "/" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-2 border-b border-white/[0.05]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Counter Sales & Studio Overview
                  </h1>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Live settlement metrics and finalized counter transactions
                  </p>
                </div>
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={() => setActiveTab("/calculator")}
                >
                  Open Counter Terminal
                </GlassButton>
              </div>

              <FinancialOverview
                onSelectCalculator={() => setActiveTab("/calculator")}
                onOpenInvoice={() => {
                  setActiveTab("/invoices");
                  setInvoicingSubTab("active");
                }}
                onNavigateTab={(href) => setActiveTab(href)}
                invoices={invoices}
                stockItems={stockItems}
                customers={customers}
                karigars={karigars}
                suppliers={suppliers}
                girviLoans={girviLoans}
                repairs={repairs}
                bookings={bookings}
                memos={memos}
                accounts={accounts}
                gold24kRate={goldRate}
                silverRate={silverRate}
                onViewInvoice={handleViewInvoice}
                shopName={activeTenant.businessName}
              />
            </div>
          )}

          {/* View: Inventory Stock & Vault */}
          {activeTab === "/inventory" && (
            <InventoryManager
              stockItems={stockItems}
              onAddStockItem={handleAddStockItem}
              onBulkImportStockItems={(newItems) => {
                const updated = [...newItems, ...stockItems];
                setStockItems(updated);
                saveStockItems(updated, activeTenant.id);
                newItems.forEach((it) => runDbSync(neonApi.addStockItem(activeTenant.id, it)));
              }}
              onUpdateStockItemStatus={(stockItemId, newStatus, reason, newLocation) => {
                const matched = stockItems.find((s) => s.id === stockItemId);
                const res = updateStockItemStatus(stockItemId, newStatus, reason, user, newLocation, activeTenant.id);
                if (res) {
                  setStockItems(res.updatedItems);
                  runDbSync(
                    neonApi.updateStockStatus(
                      stockItemId,
                      matched?.barcode || "",
                      newStatus,
                      newLocation,
                      reason
                    )
                  );
                }
              }}
              onLoadIntoCalculator={handleLoadStockIntoCalculator}
              currentGoldRate={goldRate}
              shopName={activeTenant.businessName}
            />
          )}

          {/* View: Purchases & Supplier Wholesale Costs */}
          {activeTab === "/purchases" && (
            hasPermission("VIEW_PURCHASE_COSTS") ? (
              <PurchaseManager
                suppliers={suppliers}
                purchases={purchases}
                payments={supplierPayments}
                onRecordPurchase={handleRecordPurchase}
                onAddSupplier={handleAddSupplier}
                onPaySupplier={handlePaySupplier}
                gold24kRate={goldRate}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Purchases & Supplier Wholesale Costs"
                allowedRoles="Owner, Admin, Manager, Accountant"
              />
            )
          )}

          {/* View: Wholesale & Consignment Memos (कच्चा पर्चा / जांगड़) */}
          {activeTab === "/wholesale" && (
            hasPermission("VIEW_PURCHASE_COSTS") ? (
              <WholesaleManager
                memos={memos}
                partners={b2bPartners}
                onIssueMemo={handleIssueMemo}
                onReturnMemoItems={handleReturnMemoItems}
                onConvertMemoToInvoice={handleConvertMemoToInvoice}
                onAddPartner={handleAddB2BPartner}
                shopName={activeTenant.businessName}
                tenantId={activeTenant.id}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Wholesale & Consignment Memos (कच्चा पर्चा / जांगड़)"
                allowedRoles="Owner, Admin, Manager, Accountant"
              />
            )
          )}

          {/* View: Repairs & Custom Customer Bookings */}
          {activeTab === "/repairs" && (
            <RepairsManager
              repairs={repairs}
              bookings={bookings}
              onCreateRepair={handleCreateRepair}
              onUpdateRepairStatus={handleUpdateRepairStatus}
              onCreateBooking={handleCreateBooking}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              shopName={activeTenant.businessName}
              tenantId={activeTenant.id}
            />
          )}

          {/* View: Customers & Ledger */}
          {activeTab === "/customers" && (
            <CustomerLedger
              customers={customers}
              invoices={invoices}
              onAddCustomer={handleAddCustomer}
              onStartBillForCustomer={handleStartBillForCustomer}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {/* View: Girvi / Gold Loan Pawn Brokering (Omunim Standard) */}
          {activeTab === "/girvi" && (
            hasPermission("MANAGE_GIRVI") ? (
              <GirviManager
                loans={girviLoans}
                onAddLoan={handleAddGirviLoan}
                onReleaseLoan={handleReleaseGirviLoan}
                shopName={activeTenant.businessName}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Girvi / Gold Loan Vault"
                allowedRoles="Owner, Admin, Manager"
              />
            )
          )}

          {/* View: Karigar & Artisan Bullion Ledger */}
          {activeTab === "/karigar" && (
            hasPermission("MANAGE_KARIGAR") ? (
              <KarigarManager
                karigars={karigars}
                transactions={karigarTxns}
                jobCards={jobCards}
                onAddKarigar={handleAddKarigar}
                onIssueMetal={handleIssueMetalToKarigar}
                onReceiveOrnament={handleReceiveOrnamentFromKarigar}
                onPayLabour={handlePayLabourToKarigar}
                onCreateJobCard={handleCreateJobCard}
                onUpdateJobCardStatus={handleUpdateJobCardStatus}
                shopName={activeTenant.businessName}
                tenantId={activeTenant.id}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Karigar & Artisan Ledger"
                allowedRoles="Owner, Admin, Manager, Karigar Manager"
              />
            )
          )}

          {/* View: Accounts & Cash Closing (रोकड़ बही) */}
          {activeTab === "/accounts" && (
            hasPermission("VIEW_OWNER_REPORTS") ? (
              <AccountsManager
                accounts={accounts}
                expenses={expenses}
                dailyClosings={dailyClosings}
                onRecordExpense={handleRecordExpense}
                onRecordClosing={handleRecordClosing}
                shopName={activeTenant.businessName}
                tenantId={activeTenant.id}
                currentUser={user ? `${user.fullName} (${user.role})` : "Harshit Raj (Owner)"}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Accounts & Cashbook"
                allowedRoles="Owner, Admin, Accountant"
              />
            )
          )}

          {/* View: Staff Roster & Salary Payroll */}
          {activeTab === "/staff" && (
            hasPermission("MANAGE_EMPLOYEES") ? (
              <StaffManager
                staffList={staffList}
                paymentRecords={staffPayments}
                onAddStaff={handleAddStaffMember}
                onIssueAdvance={handleIssueStaffAdvance}
                onPaySalary={handlePayStaffSalary}
                shopName={activeTenant.businessName}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Staff Payroll & Advance Master"
                allowedRoles="Owner, Admin"
              />
            )
          )}

          {/* View: Sales Analytics & Margin Reports */}
          {activeTab === "/reports" && (
            hasPermission("VIEW_OWNER_REPORTS") ? (
              <ReportsOverview
                invoices={invoices}
                stockItems={stockItems}
                expenses={expenses}
                purchases={purchases}
                karigars={karigars}
                karigarTxns={karigarTxns}
                currentGoldRate={goldRate}
                currentSilverRate={silverRate}
                onViewInvoice={handleViewInvoice}
                shopName={activeTenant.businessName}
                gstin={activeTenant.gstin}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Financial & Profit Reports"
                allowedRoles="Owner, Admin, Accountant"
              />
            )
          )}

          {/* View: Shop Settings */}
          {activeTab === "/settings" && (
            hasPermission("MANAGE_EMPLOYEES") ? (
              <SettingsManager
                initialSettings={showroomSettings}
                tenantId={activeTenant.id}
                onSettingsUpdated={(updated) => {
                  setShowroomSettings(updated);
                  setShopName(updated.businessName);
                  setAddress(updated.address);
                  setPhone(updated.phone);
                  setGstin(updated.gstin);
                  setGoldRate(updated.defaultGoldRate24k);
                  setSilverRate(updated.defaultSilverRateKg);
                  updateTenantProfile(activeTenant.id, {
                    businessName: updated.businessName,
                    address: updated.address,
                    phone: updated.phone,
                    gstin: updated.gstin,
                    defaultGoldRate: updated.defaultGoldRate24k,
                    defaultSilverRate: updated.defaultSilverRateKg,
                  });
                  setAllTenants(getAllTenants());
                  runDbSync(neonApi.updateSettings(updated));
                  runDbSync(
                    neonApi.updateTenant({
                      id: activeTenant.id,
                      businessName: updated.businessName,
                      address: updated.address,
                      phone: updated.phone,
                      gstin: updated.gstin,
                      defaultGoldRate: updated.defaultGoldRate24k,
                      defaultSilverRate: updated.defaultSilverRateKg,
                    })
                  );
                }}
                onRestoreCompleted={() => loadTenantData(activeTenant)}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Showroom Configuration & Data Vault"
                allowedRoles="Owner, Admin"
              />
            )
          )}
        </main>

        {/* Global Workspace Footer */}
        <footer className="mt-auto border-t border-white/[0.04] py-5 px-4 sm:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[var(--text-tertiary)]">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-secondary)] tracking-tight">
                JewelleryOS
              </span>
              <span>·</span>
              <span>Bespoke Indian Fine Jewellery Retail OS</span>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                  dbSyncStatus === "connected"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    : dbSyncStatus === "syncing" || dbSyncStatus === "connecting"
                    ? "bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20"
                    : "bg-white/[0.04] text-[var(--text-tertiary)] border-white/[0.08]"
                }`}
              >
                <Database className="w-3 h-3" />
                {dbSyncStatus === "connected"
                  ? "Neon PostgreSQL Live"
                  : dbSyncStatus === "syncing"
                  ? "Syncing to Neon..."
                  : dbSyncStatus === "connecting"
                  ? "Connecting Neon..."
                  : "Local Cache Mode"}
              </span>
              <div className="flex items-center gap-1.5">
                <span>Engineered by</span>
                <span className="font-semibold text-[var(--text-secondary)]">
                  Harshit Raj
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Tax Invoice Modal for Print and PDF Generation */}
      <TaxInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoiceData={currentInvoiceData}
      />

      {/* Jeweller Multi-Tenant Showroom Switcher Modal */}
      <JewellerSwitcherModal
        isOpen={isTenantModalOpen}
        onClose={() => setIsTenantModalOpen(false)}
        activeTenant={activeTenant}
        allTenants={allTenants}
        onSelectTenant={handleSelectTenant}
        onRegisterTenant={handleRegisterTenant}
      />

      {/* Staff Identity, Role Switcher & Security PIN Modal */}
      <LoginModal />

      {/* Sarafa Market Metal Rates Board & Price Audit Ledger */}
      <MetalRatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
        onRatesUpdated={(record) => {
          setGoldRate(record.gold24k);
          setSilverRate(record.silver999PerKg);
          runDbSync(neonApi.persistRates(activeTenant.id, record, user?.id));
        }}
      />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <AuthProvider>
      <WorkspaceMain />
    </AuthProvider>
  );
}
