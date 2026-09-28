import { JewellerTenant, RegisterJewellerInput } from "./types";

const TENANTS_REGISTRY_KEY = "jewellery_os_tenants_registry_v2";
const ACTIVE_TENANT_KEY = "jewellery_os_active_tenant_id_v2";

export const DEFAULT_TENANTS: JewellerTenant[] = [
  {
    id: "tenant-sandhya-jaipur",
    businessName: "Sandhya Jewellers",
    ownerName: "Harshit Raj",
    tagline: "Hallmarked Gold & Polki Heritage Jewellery",
    phone: "+91 94140 12345",
    email: "sandhya.jewellers.jpr@gmail.com",
    city: "Jaipur",
    address: "142 Sarafa Bazar, M.I. Road, Jaipur, Rajasthan 302001",
    gstin: "08AAAAJ1234F1Z8",
    bisLicense: "HM/C-8901234567",
    defaultGoldRate: 150000,
    defaultSilverRate: 95000,
    defaultMakingPercentage: 18,
    currency: "INR",
    createdAt: "2026-09-01T00:00:00.000Z",
    isDefault: true,
  },
  {
    id: "tenant-rajputana-diamonds",
    businessName: "Rajputana Gems & Jewels",
    ownerName: "Vikramaditya Rathore",
    tagline: "Certified Solitaire & Kundan Meena Jewellery",
    phone: "+91 98290 87654",
    email: "contact@rajputanajewels.in",
    city: "Jodhpur",
    address: "54 High Court Road, Sojati Gate, Jodhpur, Rajasthan 342001",
    gstin: "08AABCR5432B1Z2",
    bisLicense: "HM/C-7744112233",
    defaultGoldRate: 150200,
    defaultSilverRate: 95500,
    defaultMakingPercentage: 16,
    currency: "INR",
    createdAt: "2026-09-10T00:00:00.000Z",
    isDefault: false,
  },
];

export function getTenantStorageKey(tenantId: string, subKey: string): string {
  return `jewellery_os_tenant_${tenantId}_${subKey}`;
}

export function getAllTenants(): JewellerTenant[] {
  if (typeof window === "undefined") return DEFAULT_TENANTS;
  try {
    const raw = localStorage.getItem(TENANTS_REGISTRY_KEY);
    if (!raw) {
      localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(DEFAULT_TENANTS));
      return DEFAULT_TENANTS;
    }
    let parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      let modified = false;
      parsed = parsed.map((t: JewellerTenant) => {
        if (t.id === "tenant-soni-jaipur" || t.businessName === "Soni Jewellers") {
          modified = true;
          return {
            ...t,
            id: "tenant-sandhya-jaipur",
            businessName: "Sandhya Jewellers",
            email: "sandhya.jewellers.jpr@gmail.com",
          };
        }
        return t;
      });
      if (modified) {
        localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(parsed));
      }
      return parsed;
    }
    return DEFAULT_TENANTS;
  } catch {
    return DEFAULT_TENANTS;
  }
}

export function saveAllTenants(tenants: JewellerTenant[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TENANTS_REGISTRY_KEY, JSON.stringify(tenants));
  } catch (err) {
    console.error("Failed to save tenants registry:", err);
  }
}

export function getActiveTenantId(): string {
  if (typeof window === "undefined") return DEFAULT_TENANTS[0].id;
  try {
    let id = localStorage.getItem(ACTIVE_TENANT_KEY);
    if (id === "tenant-soni-jaipur") {
      id = "tenant-sandhya-jaipur";
      localStorage.setItem(ACTIVE_TENANT_KEY, id);
    }
    if (id) {
      const all = getAllTenants();
      if (all.some((t) => t.id === id)) return id;
    }
    const fallback = DEFAULT_TENANTS[0].id;
    localStorage.setItem(ACTIVE_TENANT_KEY, fallback);
    return fallback;
  } catch {
    return DEFAULT_TENANTS[0].id;
  }
}

export function setActiveTenantId(tenantId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ACTIVE_TENANT_KEY, tenantId);
  } catch (err) {
    console.error("Failed to set active tenant:", err);
  }
}

export function getActiveTenant(): JewellerTenant {
  const all = getAllTenants();
  const activeId = getActiveTenantId();
  const found = all.find((t) => t.id === activeId);
  return found || all[0] || DEFAULT_TENANTS[0];
}

export function registerNewTenant(input: RegisterJewellerInput): JewellerTenant {
  const slug = input.businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);

  const newTenant: JewellerTenant = {
    id: `tenant-${slug}-${Date.now().toString().slice(-4)}`,
    businessName: input.businessName.trim(),
    ownerName: input.ownerName.trim(),
    tagline: input.tagline?.trim() || "Fine Certified Jewellery",
    phone: input.phone.trim(),
    email: input.email?.trim() || undefined,
    city: input.city.trim(),
    address: input.address.trim(),
    gstin: input.gstin.trim(),
    bisLicense: input.bisLicense?.trim() || undefined,
    defaultGoldRate: input.defaultGoldRate || 150000,
    defaultSilverRate: input.defaultSilverRate || 95000,
    defaultMakingPercentage: input.defaultMakingPercentage || 18,
    currency: "INR",
    createdAt: new Date().toISOString(),
    isDefault: false,
  };

  const all = getAllTenants();
  const updated = [...all, newTenant];
  saveAllTenants(updated);
  setActiveTenantId(newTenant.id);
  return newTenant;
}

export function updateTenantProfile(tenantId: string, updates: Partial<JewellerTenant>): JewellerTenant | null {
  const all = getAllTenants();
  const index = all.findIndex((t) => t.id === tenantId);
  if (index === -1) return null;

  const updatedTenant = { ...all[index], ...updates };
  all[index] = updatedTenant;
  saveAllTenants(all);
  return updatedTenant;
}
