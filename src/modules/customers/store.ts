import { Customer, NewCustomerInput } from "./types";
import { FinalizedInvoice } from "../invoicing/types";

const CUSTOMERS_STORAGE_KEY = "jewellery_os_customers_v2";

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: "cust-1",
    name: "Rameshwar Sharma",
    phone: "+91 98290 12345",
    email: "rameshwar.sharma@example.com",
    city: "Jaipur",
    address: "24 Civil Lines, Near Raj Mandir",
    gstin: "URP (Retail Consumer)",
    customerType: "vip",
    totalPurchases: 387550,
    totalGoldWeightGrams: 28.45,
    totalSilverWeightGrams: 0,
    totalInvoicesCount: 3,
    outstandingCredit: 5000,
    lastVisitDate: "2026-09-28",
    notes: "Family jeweller customer for 15+ years. Prefers 22K hallmarked jewellery and 18K Italian designs.",
  },
  {
    id: "cust-2",
    name: "Pooja Verma",
    phone: "+91 94140 88776",
    email: "pooja.v@example.com",
    city: "Jaipur",
    address: "B-12 Malviya Nagar",
    gstin: "URP (Retail Consumer)",
    customerType: "retail",
    totalPurchases: 254800,
    totalGoldWeightGrams: 18.45,
    totalSilverWeightGrams: 0,
    totalInvoicesCount: 1,
    outstandingCredit: 0,
    lastVisitDate: "2026-09-28",
    notes: "Wedding bridal jewellery purchase. Requested matching necklace.",
  },
  {
    id: "cust-3",
    name: "Sunita Agarwal",
    phone: "+91 98280 44332",
    email: "agarwal.sunita@gmail.com",
    city: "Ajmer",
    address: "Kutchery Road, Ajmer",
    gstin: "URP (Retail Consumer)",
    customerType: "vip",
    totalPurchases: 540000,
    totalGoldWeightGrams: 42.1,
    totalSilverWeightGrams: 500.0,
    totalInvoicesCount: 4,
    outstandingCredit: 12000,
    lastVisitDate: "2026-09-25",
    notes: "Prefers pure silver utensils and antique kundan ornaments.",
  },
  {
    id: "cust-4",
    name: "Vikramaditya Singhania",
    phone: "+91 99281 99887",
    city: "Jaipur",
    address: "C-Scheme, Ashok Nagar",
    gstin: "08AABCS9988P1ZZ",
    customerType: "wholesale",
    totalPurchases: 1850000,
    totalGoldWeightGrams: 145.0,
    totalSilverWeightGrams: 2500.0,
    totalInvoicesCount: 6,
    outstandingCredit: 0,
    lastVisitDate: "2026-09-20",
    notes: "B2B client. Orders bulk silver coins and 24K bullion bars for corporate gifting.",
  },
  {
    id: "cust-5",
    name: "Meenakshi Sundaram",
    phone: "+91 97840 22119",
    city: "Kota",
    address: "Station Road, Kota",
    gstin: "URP (Retail Consumer)",
    customerType: "retail",
    totalPurchases: 89000,
    totalGoldWeightGrams: 6.5,
    totalSilverWeightGrams: 85.0,
    totalInvoicesCount: 2,
    outstandingCredit: 0,
    lastVisitDate: "2026-09-18",
    notes: "Regular festive buyer for Dhanteras and Akshaya Tritiya.",
  },
];

export function getTenantCustomerStorageKey(tenantId?: string): string {
  return tenantId ? `jewellery_os_tenant_${tenantId}_customers` : CUSTOMERS_STORAGE_KEY;
}

export function getSavedCustomers(tenantId?: string): Customer[] {
  if (typeof window === "undefined") return INITIAL_CUSTOMERS;
  try {
    const key = getTenantCustomerStorageKey(tenantId);
    let raw = localStorage.getItem(key);
    if (!raw && tenantId === "tenant-sandhya-jaipur") {
      raw = localStorage.getItem(getTenantCustomerStorageKey("tenant-soni-jaipur"));
    }
    if (!raw) {
      const initial = (!tenantId || tenantId === "tenant-sandhya-jaipur" || tenantId === "tenant-soni-jaipur") ? INITIAL_CUSTOMERS : [];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CUSTOMERS;
  }
}

export function saveCustomers(customers: Customer[], tenantId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const key = getTenantCustomerStorageKey(tenantId);
    localStorage.setItem(key, JSON.stringify(customers));
  } catch (err) {
    console.error("Failed to save customers to storage:", err);
  }
}

export function addCustomer(input: NewCustomerInput, tenantId?: string): Customer {
  const newCust: Customer = {
    id: `cust-${Date.now()}`,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    city: input.city?.trim() || "Jaipur",
    address: input.address?.trim() || undefined,
    gstin: input.gstin?.trim() || "URP (Retail Consumer)",
    customerType: input.customerType || "retail",
    totalPurchases: 0,
    totalGoldWeightGrams: 0,
    totalSilverWeightGrams: 0,
    totalInvoicesCount: 0,
    outstandingCredit: 0,
    lastVisitDate: new Date().toISOString().split("T")[0],
    notes: input.notes?.trim() || undefined,
  };

  const existing = getSavedCustomers(tenantId);
  const updated = [newCust, ...existing];
  saveCustomers(updated, tenantId);
  return newCust;
}

export function recordInvoiceToCustomer(invoice: FinalizedInvoice, tenantId?: string): Customer[] {
  const customers = getSavedCustomers(tenantId);
  const phone = invoice.customer.phone.trim();
  const name = invoice.customer.name.trim();

  // Find by phone or exact name
  const index = customers.findIndex(
    (c) => (phone && c.phone === phone) || c.name.toLowerCase() === name.toLowerCase()
  );

  const goldGrams = invoice.items
    .filter((i) => i.metal === "gold")
    .reduce((sum, i) => sum + i.grossWeight, 0);

  const silverGrams = invoice.items
    .filter((i) => i.metal === "silver")
    .reduce((sum, i) => sum + i.grossWeight, 0);

  let updatedList: Customer[];

  if (index >= 0) {
    const existing = customers[index];
    const updated: Customer = {
      ...existing,
      totalPurchases: existing.totalPurchases + invoice.grandTotal,
      totalGoldWeightGrams: existing.totalGoldWeightGrams + goldGrams,
      totalSilverWeightGrams: existing.totalSilverWeightGrams + silverGrams,
      totalInvoicesCount: existing.totalInvoicesCount + 1,
      lastVisitDate: new Date().toISOString().split("T")[0],
    };
    updatedList = [...customers];
    updatedList[index] = updated;
  } else {
    // Register new walk-in customer automatically
    const newCust: Customer = {
      id: `cust-${Date.now()}`,
      name: invoice.customer.name,
      phone: invoice.customer.phone,
      city: invoice.customer.city || "Jaipur",
      address: invoice.customer.address,
      gstin: invoice.customer.gstin,
      customerType: "retail",
      totalPurchases: invoice.grandTotal,
      totalGoldWeightGrams: goldGrams,
      totalSilverWeightGrams: silverGrams,
      totalInvoicesCount: 1,
      outstandingCredit: 0,
      lastVisitDate: new Date().toISOString().split("T")[0],
      notes: `Registered via bill ${invoice.invoiceNumber}`,
    };
    updatedList = [newCust, ...customers];
  }

  saveCustomers(updatedList, tenantId);
  return updatedList;
}
