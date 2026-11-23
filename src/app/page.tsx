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
import { getSavedStock, saveStockItems, updateStockItemStatus } from "../modules/inventory/store";
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
} from "../modules/karigar/types";
import {
  getSavedKarigars,
  getSavedKarigarTxns,
  addKarigar,
  issueMetalToKarigar,
  receiveOrnamentFromKarigar,
  payLabourToKarigar,
} from "../modules/karigar/store";

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

  // Staff State
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffPayments, setStaffPayments] = useState<StaffPaymentRecord[]>([]);

  // Preloaded Data for Calculator
  const [preloadedCalcData, setPreloadedCalcData] = useState<PreloadedCalcData | null>(null);

  // Preselected Customer for Billing
  const [selectedBillingCustomer, setSelectedBillingCustomer] = useState<CustomerProfile | null>(null);

  // Synchronize Active Tenant Data and Isolated Database
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
    setStaffList(getSavedStaff(tenant.id));
    setStaffPayments(getSavedStaffPayments(tenant.id));
    setDraftItems([]);
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
    loadTenantData(created);
  };

  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  const handleSaveShowroomSettings = () => {
    const updated = updateTenantProfile(activeTenant.id, {
      businessName: shopName,
      gstin,
      phone,
      address,
      defaultGoldRate: goldRate,
      defaultSilverRate: silverRate,
    });
    if (updated) {
      setActiveTenant(updated);
      setAllTenants(getAllTenants());
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 3000);
    }
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
    saveNewInvoice(finalized, activeTenant.id);
    setInvoices([finalized, ...invoices]);
    setCurrentInvoiceData(finalized);
    setIsInvoiceModalOpen(true);
    // Record invoice to customer directory
    const updatedCustomers = recordInvoiceToCustomer(finalized, activeTenant.id);
    setCustomers(updatedCustomers);
    // Reset draft cart for next customer
    setDraftItems([]);
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
    const newInvoice: FinalizedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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

    saveNewInvoice(newInvoice, activeTenant.id);
    setInvoices([newInvoice, ...invoices]);
    setCurrentInvoiceData(newInvoice);
    setIsInvoiceModalOpen(true);
    const updatedCustomers = recordInvoiceToCustomer(newInvoice, activeTenant.id);
    setCustomers(updatedCustomers);
    setDraftItems([]);
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
    const newInvoice: FinalizedInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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

    saveNewInvoice(newInvoice, activeTenant.id);
    setInvoices([newInvoice, ...invoices]);
    setCurrentInvoiceData(newInvoice);
    setIsInvoiceModalOpen(true);
    const updatedCustomers = recordInvoiceToCustomer(newInvoice, activeTenant.id);
    setCustomers(updatedCustomers);
    setDraftItems([]);
  };

  const handleAddStockItem = (newItem: StockItem) => {
    const updated = [newItem, ...stockItems];
    setStockItems(updated);
    saveStockItems(updated, activeTenant.id);
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
    });
    setActiveTab("/calculator");
  };

  const handleAddCustomer = (input: NewCustomerInput) => {
    addCustomer(input, activeTenant.id);
    setCustomers(getSavedCustomers(activeTenant.id));
  };

  const handleAddGirviLoan = (input: NewGirviInput) => {
    createGirviLoan(input, activeTenant.id);
    setGirviLoans(getSavedGirviLoans(activeTenant.id));
  };

  const handleReleaseGirviLoan = (loanId: string) => {
    const updated = releaseGirviLoan(loanId, activeTenant.id);
    setGirviLoans(updated);
  };

  // Karigar Actions
  const handleAddKarigar = (input: {
    name: string;
    phone: string;
    workshopCity: string;
    specialty: string;
    notes?: string;
  }) => {
    addKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
  };

  const handleIssueMetalToKarigar = (input: IssueMetalInput) => {
    issueMetalToKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
  };

  const handleReceiveOrnamentFromKarigar = (input: ReceiveOrnamentInput) => {
    receiveOrnamentFromKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
  };

  const handlePayLabourToKarigar = (input: PayLabourInput) => {
    payLabourToKarigar(input, activeTenant.id);
    setKarigars(getSavedKarigars(activeTenant.id));
    setKarigarTxns(getSavedKarigarTxns(activeTenant.id));
  };

  // Staff Actions
  const handleAddStaffMember = (input: AddStaffInput) => {
    addStaffMember(input, activeTenant.id);
    setStaffList(getSavedStaff(activeTenant.id));
  };

  const handleIssueStaffAdvance = (input: IssueAdvanceInput) => {
    issueStaffAdvance(input, activeTenant.id);
    setStaffList(getSavedStaff(activeTenant.id));
    setStaffPayments(getSavedStaffPayments(activeTenant.id));
  };

  const handlePayStaffSalary = (input: PaySalaryInput) => {
    payStaffSalary(input, activeTenant.id);
    setStaffList(getSavedStaff(activeTenant.id));
    setStaffPayments(getSavedStaffPayments(activeTenant.id));
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
              { name: "Billing & Invoices", href: "/invoices" },
              { name: "Girvi / Gold Loans", href: "/girvi" },
              { name: "Karigar Ledger", href: "/karigar" },
              { name: "Staff & Payroll", href: "/staff" },
              { name: "Dashboard", href: "/" },
              { name: "Inventory", href: "/inventory" },
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
                invoices={invoices}
                onViewInvoice={handleViewInvoice}
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
              }}
              onUpdateStockItemStatus={(stockItemId, newStatus, reason, newLocation) => {
                const res = updateStockItemStatus(stockItemId, newStatus, reason, user, newLocation, activeTenant.id);
                if (res) {
                  setStockItems(res.updatedItems);
                }
              }}
              onLoadIntoCalculator={handleLoadStockIntoCalculator}
              currentGoldRate={goldRate}
              shopName={activeTenant.businessName}
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
                onAddKarigar={handleAddKarigar}
                onIssueMetal={handleIssueMetalToKarigar}
                onReceiveOrnament={handleReceiveOrnamentFromKarigar}
                onPayLabour={handlePayLabourToKarigar}
                shopName={activeTenant.businessName}
              />
            ) : (
              <RestrictedModuleGuard
                moduleName="Karigar & Artisan Ledger"
                allowedRoles="Owner, Admin, Manager, Karigar Manager"
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
                currentGoldRate={goldRate}
                currentSilverRate={silverRate}
                onViewInvoice={handleViewInvoice}
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
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-3 pb-2 border-b border-white/[0.05]">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
                    Showroom Profile & Metal Rules
                  </h1>
                  <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                    Tenant ID: <span className="font-mono text-[#DFC488]">{activeTenant.id}</span> · Isolated database partition for {activeTenant.businessName}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {settingsSaved && (
                    <span className="text-xs text-[var(--accent-emerald)] font-medium">
                      ✓ Showroom Profile Saved
                    </span>
                  )}
                  <GlassButton
                    variant="primary"
                    size="sm"
                    onClick={handleSaveShowroomSettings}
                  >
                    Save Showroom Profile
                  </GlassButton>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                    Shop Identity & Bill Header
                  </span>
                  <GlassInput
                    label="Shop / Business Name"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                  />
                  <GlassInput
                    label="Shop GSTIN / Tax ID"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                  <GlassInput
                    label="Contact Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <GlassInput
                    label="Registered Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="p-6 rounded-xl bg-[var(--surface-primary)] border border-white/[0.06] space-y-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] block">
                    Default Metal Board Rates
                  </span>
                  <GlassInput
                    label="24K Gold Rate (per 10g)"
                    type="number"
                    prefixSymbol="₹"
                    value={goldRate}
                    onChange={(e) => setGoldRate(parseFloat(e.target.value) || 0)}
                  />
                  <GlassInput
                    label="Fine Silver Rate (per kg)"
                    type="number"
                    prefixSymbol="₹"
                    value={silverRate}
                    onChange={(e) => setSilverRate(parseFloat(e.target.value) || 0)}
                  />
                  <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] text-xs text-[var(--text-secondary)]">
                    <span className="text-[var(--accent-emerald)] font-medium">
                      ✓ Formula Engine:
                    </span>{" "}
                    Exact fractional Karat ratio (K/24). 22ct rate derives to ₹1,37,500 / 10g with 0 paise rounding drift.
                  </div>
                </div>
              </div>
            </div>
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

            <div className="flex items-center gap-1.5">
              <span>Engineered by</span>
              <span className="font-semibold text-[var(--text-secondary)]">
                Harshit Raj
              </span>
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
