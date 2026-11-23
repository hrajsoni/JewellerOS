import { RoleType, UserProfile, UserSession, LoginCredentials } from "./types";

const AUTH_SESSION_KEY = "jewellery_os_active_session_v1";

export const DEFAULT_USERS: (UserProfile & { pin: string })[] = [
  {
    id: "user-harshit-owner",
    fullName: "Harshit Raj",
    email: "harshit@sandhyajewellers.com",
    phone: "+91 94140 12345",
    role: "OWNER",
    businessId: "tenant-sandhya-jaipur",
    isActive: true,
    advanceBalance: 0,
    pin: "123456",
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
    pin: "123456",
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
    pin: "123456",
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
    pin: "123456",
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
    pin: "123456",
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
    pin: "123456",
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

export function switchActiveUser(userId: string): UserSession | null {
  const found = DEFAULT_USERS.find((u) => u.id === userId);
  if (!found) return null;

  const newSession: UserSession = {
    id: found.id,
    fullName: found.fullName,
    email: found.email,
    phone: found.phone,
    role: found.role,
    businessId: found.businessId,
    businessName: "Sandhya Jewellers",
    branchName: "Sarafa Bazar Main Showroom",
  };

  setCurrentSession(newSession);
  return newSession;
}

export function loginWithCredentials(credentials: LoginCredentials): {
  session: UserSession | null;
  error?: string;
} {
  const cleanInput = credentials.emailOrPhone.trim().toLowerCase();
  const user = DEFAULT_USERS.find(
    (u) =>
      u.email.toLowerCase() === cleanInput ||
      u.phone.replace(/[^0-9]/g, "").includes(cleanInput.replace(/[^0-9]/g, ""))
  );

  if (!user) {
    return { session: null, error: "No employee account found with these credentials." };
  }

  if (user.pin !== credentials.pinOrPassword.trim()) {
    return { session: null, error: "Incorrect security PIN / password." };
  }

  const session: UserSession = {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    businessId: user.businessId,
    businessName: "Sandhya Jewellers",
    branchName: "Sarafa Bazar Main Showroom",
  };

  setCurrentSession(session);
  return { session, error: undefined };
}

export function logoutUser(): void {
  // Reset to owner default for seamless showroom continuity
  setCurrentSession(DEFAULT_SESSION);
}
