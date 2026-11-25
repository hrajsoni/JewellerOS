import bcrypt from "bcryptjs";
import { RoleType, UserProfile, UserSession, LoginCredentials } from "./types";

const AUTH_SESSION_KEY = "jewellery_os_active_session_v1";

export const INITIAL_USER_PINS: Record<string, string> = {
  "user-harshit-owner": "884219",
  "user-sunil-mgr": "451230",
  "user-ramesh-sales": "289910",
  "user-vikram-inv": "554432",
  "user-gopal-karigar": "334455",
  "user-pooja-acct": "887766",
};

export const DEFAULT_USERS: (UserProfile & { pin: string; pinHash: string })[] = [
  {
    id: "user-harshit-owner",
    fullName: "Harshit Raj",
    email: "harshit@sandhyajewellers.com",
    phone: "+91 94140 12345",
    role: "OWNER",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    advanceBalance: 0,
    pin: "884219",
    pinHash: "$2b$08$UcKdezb/U7kQ2eBFtQjnyOekLHnhX26oxdOJ.ohvUePeTJjE2qNtW",
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "user-sunil-mgr",
    fullName: "Sunil Mehta",
    email: "sunil@sandhyajewellers.com",
    phone: "+91 98290 11223",
    role: "MANAGER",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    monthlySalary: 45000,
    advanceBalance: 0,
    pin: "451230",
    pinHash: "$2b$08$RQWLfCVSYNsa06oIBxQx9Op8tWzn6fFcVAox95wqZLjtkvQDvPVLW",
    createdAt: "2026-09-10T00:00:00.000Z",
  },
  {
    id: "user-ramesh-sales",
    fullName: "Ramesh Verma",
    email: "ramesh@sandhyajewellers.com",
    phone: "+91 94140 98765",
    role: "SALESPERSON",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    monthlySalary: 28000,
    advanceBalance: 2000,
    pin: "289910",
    pinHash: "$2b$08$bdVaEIaO0qxSZOe0rpL01O18B0LJ0n3BTMwXPtx5FFf0Iv2NPkiEu",
    createdAt: "2026-09-12T00:00:00.000Z",
  },
  {
    id: "user-vikram-inv",
    fullName: "Vikram Soni",
    email: "vikram@sandhyajewellers.com",
    phone: "+91 98291 55443",
    role: "INVENTORY_CLERK",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    monthlySalary: 32000,
    advanceBalance: 0,
    pin: "554432",
    pinHash: "$2b$08$VAiWzAxWhnhmLZ.jhpFT3eyyYMeYETPhjKObNgPDXJ9P9Hg/qfUSa",
    createdAt: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "user-gopal-karigar",
    fullName: "Gopal Sharma",
    email: "gopal@sandhyajewellers.com",
    phone: "+91 94140 33445",
    role: "KARIGAR_MANAGER",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    monthlySalary: 35000,
    advanceBalance: 5000,
    pin: "334455",
    pinHash: "$2b$08$eQF8wLL66sM5YzRUW7vaQ.m7CO5JRXesIBC8C2.SN615gWTyttlEe",
    createdAt: "2026-09-15T00:00:00.000Z",
  },
  {
    id: "user-pooja-acct",
    fullName: "Pooja Gupta",
    email: "pooja@sandhyajewellers.com",
    phone: "+91 98290 88776",
    role: "ACCOUNTANT",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    monthlySalary: 38000,
    advanceBalance: 0,
    pin: "887766",
    pinHash: "$2b$08$I3nZtr6EfhYccTqodK39DOhOWcGk9GsytER.ROAAMig6DvszxUOiq",
    createdAt: "2026-09-18T00:00:00.000Z",
  },
];

export const DEFAULT_SESSION: UserSession = {
  id: DEFAULT_USERS[0].id,
  fullName: DEFAULT_USERS[0].fullName,
  email: DEFAULT_USERS[0].email,
  phone: DEFAULT_USERS[0].phone,
  role: DEFAULT_USERS[0].role,
  businessId: "tenant-sandhya-jaipur",
  businessName: "Sandhya Jewellers",
  branchName: "Sarafa Bazar Main Showroom",
};

export const inMemoryUsersCache: Record<string, string> = {};

export function getUsersStorageKey(tenantId?: string): string {
  return `jewellery_os_tenant_${tenantId || "tenant-sandhya-jaipur"}_staff_users_v1`;
}

export function hashPin(pin: string): string {
  return bcrypt.hashSync(pin.trim(), 8);
}

export function verifyPin(rawPin: string, user: UserProfile & { pin?: string; pinHash?: string }): boolean {
  const clean = rawPin.trim();
  if (user.pinHash) {
    try {
      if (bcrypt.compareSync(clean, user.pinHash)) {
        return true;
      }
    } catch {
      // Fall through to plain check if hash comparison fails
    }
  }
  if (user.pin) {
    return user.pin === clean;
  }
  return false;
}

export function getTenantUsers(tenantId?: string): (UserProfile & { pin: string; pinHash?: string })[] {
  const key = getUsersStorageKey(tenantId);
  try {
    let raw: string | null = null;
    if (typeof window !== "undefined") {
      raw = localStorage.getItem(key);
    } else {
      raw = inMemoryUsersCache[key] || null;
    }
    if (!raw) {
      saveTenantUsers(DEFAULT_USERS, tenantId);
      return DEFAULT_USERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveTenantUsers(
  users: (UserProfile & { pin: string; pinHash?: string })[],
  tenantId?: string
): void {
  const key = getUsersStorageKey(tenantId);
  const serialized = JSON.stringify(users);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(key, serialized);
    } catch (e) {
      console.error("Failed to save tenant users to localStorage:", e);
    }
  } else {
    inMemoryUsersCache[key] = serialized;
  }
}

export function getCurrentSession(): UserSession {
  if (typeof window === "undefined") return DEFAULT_SESSION;
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(DEFAULT_SESSION));
      return DEFAULT_SESSION;
    }
    const parsed = JSON.parse(raw);
    return parsed?.id ? parsed : DEFAULT_SESSION;
  } catch {
    return DEFAULT_SESSION;
  }
}

export function setCurrentSession(session: UserSession): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error("Failed to persist auth session:", err);
  }
}

export function switchActiveUser(userId: string, tenantId?: string): UserSession | null {
  const users = getTenantUsers(tenantId);
  const found = users.find((u) => u.id === userId);
  if (!found) return null;

  const newSession: UserSession = {
    id: found.id,
    fullName: found.fullName,
    email: found.email,
    phone: found.phone,
    role: found.role,
    businessId: found.businessId || tenantId || "tenant-sandhya-jaipur",
    businessName: "Sandhya Jewellers",
    branchName: "Sarafa Bazar Main Showroom",
  };

  setCurrentSession(newSession);
  return newSession;
}

export function loginWithCredentials(
  credentials: LoginCredentials,
  tenantId?: string
): {
  session: UserSession | null;
  error?: string;
} {
  const cleanInput = credentials.emailOrPhone.trim().toLowerCase();
  const digits = cleanInput.replace(/[^0-9]/g, "");
  const users = getTenantUsers(tenantId);
  const user = users.find((u) => {
    if (u.email.toLowerCase() === cleanInput) return true;
    if (digits.length >= 6 && u.phone.replace(/[^0-9]/g, "").includes(digits)) return true;
    return false;
  });

  if (!user) {
    return { session: null, error: "No employee account found with these credentials." };
  }

  if (!user.isActive) {
    return { session: null, error: "This staff account is deactivated. Contact store owner." };
  }

  if (!verifyPin(credentials.pinOrPassword, user)) {
    return { session: null, error: "Incorrect security PIN / password." };
  }

  const session: UserSession = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    businessId: user.businessId || tenantId || "tenant-sandhya-jaipur",
    businessName: "Sandhya Jewellers",
    branchName: "Sarafa Bazar Main Showroom",
  };

  setCurrentSession(session);
  return { session, error: undefined };
}

export function changeUserPin(
  userId: string,
  currentPin: string,
  newPin: string,
  tenantId?: string
): { success: boolean; error?: string } {
  if (newPin.trim().length < 4) {
    return { success: false, error: "New PIN must be at least 4 digits." };
  }
  const users = getTenantUsers(tenantId);
  const target = users.find((u) => u.id === userId);
  if (!target) {
    return { success: false, error: "Staff account not found." };
  }
  if (!verifyPin(currentPin, target)) {
    return { success: false, error: "Current PIN is incorrect." };
  }

  const updatedHash = hashPin(newPin);
  const updatedUsers = users.map((u) =>
    u.id === userId ? { ...u, pin: newPin.trim(), pinHash: updatedHash } : u
  );
  saveTenantUsers(updatedUsers, tenantId);
  return { success: true };
}

export function adminResetPin(
  adminRole: RoleType,
  targetUserId: string,
  newPin: string,
  tenantId?: string
): { success: boolean; error?: string } {
  if (adminRole !== "OWNER" && adminRole !== "ADMIN") {
    return { success: false, error: "Unauthorized: Only Owner or Admin can reset staff PINs." };
  }
  if (newPin.trim().length < 4) {
    return { success: false, error: "New PIN must be at least 4 digits." };
  }
  const users = getTenantUsers(tenantId);
  const target = users.find((u) => u.id === targetUserId);
  if (!target) {
    return { success: false, error: "Target employee account not found." };
  }

  const updatedHash = hashPin(newPin);
  const updatedUsers = users.map((u) =>
    u.id === targetUserId ? { ...u, pin: newPin.trim(), pinHash: updatedHash } : u
  );
  saveTenantUsers(updatedUsers, tenantId);
  return { success: true };
}

export function logoutUser(): void {
  // Reset to owner default for seamless showroom continuity
  setCurrentSession(DEFAULT_SESSION);
}
