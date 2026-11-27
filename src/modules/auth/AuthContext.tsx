"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { UserSession, RoleType, PermissionKey, LoginCredentials, UserProfile } from "./types";
import { neonApi } from "../../lib/neonApi";
import {
  getCurrentSession,
  setCurrentSession,
  switchActiveUser,
  loginWithCredentials,
  logoutUser,
  getTenantUsers,
  changeUserPin,
  adminResetPin as storeAdminResetPin,
  isLoggedOutState,
  setLoggedOutState,
  registerLocalUserProfile,
  DEFAULT_SESSION,
} from "./store";
import { hasPermission as checkPermission } from "./permissions";

export interface SendOtpResponse {
  success: boolean;
  challengeId?: string;
  channel?: "EMAIL" | "PHONE";
  maskedTarget?: string;
  deliveredVia?: "resend_email" | "sms_gateway" | "dev_sandbox";
  devOtpPreview?: string;
  error?: string;
}

export interface RegisterWithOtpInput {
  fullName: string;
  email?: string;
  phone?: string;
  pin: string;
  role?: RoleType;
  businessId?: string;
  businessName?: string;
  challengeId: string;
  otp: string;
}

export interface AuthContextType {
  user: UserSession;
  role: RoleType;
  isAuthenticated: boolean;
  hasPermission: (permission: PermissionKey) => boolean;
  switchUser: (userId: string) => void;
  login: (credentials: LoginCredentials) => { success: boolean; error?: string };
  authenticateWithPin: (emailOrPhone: string, pin: string) => Promise<{ success: boolean; error?: string }>;
  sendOtp: (payload: { email?: string; phone?: string; purpose: "SIGNUP" | "LOGIN" }) => Promise<SendOtpResponse>;
  verifyOtp: (challengeId: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOtp: (payload: {
    email?: string;
    phone?: string;
    emailOrPhone?: string;
    challengeId: string;
    otp: string;
  }) => Promise<{ success: boolean; error?: string }>;
  registerAccount: (input: RegisterWithOtpInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updatePin: (currentPin: string, newPin: string) => { success: boolean; error?: string };
  adminResetPin: (targetUserId: string, newPin: string) => { success: boolean; error?: string };
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  allUsers: (UserProfile & { pin: string })[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(() => {
    if (typeof window !== "undefined") {
      return getCurrentSession();
    }
    return DEFAULT_SESSION;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return !isLoggedOutState();
    }
    return true;
  });

  const [allUsers, setAllUsers] = useState<(UserProfile & { pin: string })[]>(() => {
    if (typeof window !== "undefined") {
      const session = getCurrentSession();
      return getTenantUsers(session.businessId);
    }
    return getTenantUsers(DEFAULT_SESSION.businessId);
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const refreshUsers = useCallback(
    (tenantId?: string) => {
      setAllUsers(getTenantUsers(tenantId || user.businessId));
    },
    [user.businessId]
  );

  const applyAuthenticatedSession = useCallback(
    (session: UserSession, pinForLocalCache?: string) => {
      setLoggedOutState(false);
      setCurrentSession(session);
      if (pinForLocalCache) {
        registerLocalUserProfile(session, pinForLocalCache);
      }
      setUser(session);
      setIsAuthenticated(true);
      refreshUsers(session.businessId);
      setIsLoginModalOpen(false);
    },
    [refreshUsers]
  );

  const switchUser = (userId: string) => {
    const nextSession = switchActiveUser(userId, user.businessId);
    if (nextSession) {
      setLoggedOutState(false);
      setUser(nextSession);
      setIsAuthenticated(true);
      refreshUsers(nextSession.businessId);
    }
  };

  const login = (credentials: LoginCredentials): { success: boolean; error?: string } => {
    const result = loginWithCredentials(credentials, user.businessId);
    if (result.session) {
      applyAuthenticatedSession(result.session);
      void neonApi.login(credentials.emailOrPhone, credentials.pinOrPassword, result.session.businessId);
      return { success: true };
    }
    return { success: false, error: result.error || "Login failed" };
  };

  const authenticateWithPin = async (
    emailOrPhone: string,
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    const apiRes = await neonApi.loginWithPinApi(emailOrPhone, pin);
    if (apiRes.ok && apiRes.data?.session) {
      applyAuthenticatedSession(apiRes.data.session, pin);
      return { success: true };
    }

    // Fall back to local cache only if network/DB unreachable, not on wrong PIN
    if (!apiRes.ok && apiRes.error.toLowerCase().includes("network")) {
      return login({ emailOrPhone, pinOrPassword: pin });
    }

    // If user belongs to a local-only demo cache entry not yet synced, still verify PIN safely
    const localCheck = loginWithCredentials({ emailOrPhone, pinOrPassword: pin }, user.businessId);
    if (localCheck.session) {
      applyAuthenticatedSession(localCheck.session);
      return { success: true };
    }

    return { success: false, error: apiRes.ok ? "Login failed" : apiRes.error };
  };

  const sendOtp = async (payload: {
    email?: string;
    phone?: string;
    purpose: "SIGNUP" | "LOGIN";
  }): Promise<SendOtpResponse> => {
    const res = await neonApi.sendOtp(payload);
    if (!res.ok) {
      return { success: false, error: res.error };
    }
    return {
      success: true,
      challengeId: res.data.challengeId,
      channel: res.data.channel,
      maskedTarget: res.data.maskedTarget,
      deliveredVia: res.data.deliveredVia,
      devOtpPreview: res.data.devOtpPreview,
    };
  };

  const verifyOtp = async (
    challengeId: string,
    otp: string
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await neonApi.verifyOtp(challengeId, otp);
    if (!res.ok) {
      return { success: false, error: res.error };
    }
    return { success: true };
  };

  const loginWithOtp = async (payload: {
    email?: string;
    phone?: string;
    emailOrPhone?: string;
    challengeId: string;
    otp: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const res = await neonApi.loginWithOtpApi(payload);
    if (!res.ok || !res.data?.session) {
      return { success: false, error: res.ok ? "OTP sign-in failed" : res.error };
    }
    applyAuthenticatedSession(res.data.session);
    return { success: true };
  };

  const registerAccount = async (
    input: RegisterWithOtpInput
  ): Promise<{ success: boolean; error?: string }> => {
    const res = await neonApi.registerAccount(input);
    if (!res.ok || !res.data?.session) {
      return { success: false, error: res.ok ? "Registration failed" : res.error };
    }
    applyAuthenticatedSession(res.data.session, input.pin);
    return { success: true };
  };

  const logout = () => {
    logoutUser();
    setIsAuthenticated(false);
    setIsLoginModalOpen(false);
    void neonApi.logoutApi();
  };

  const updatePin = (currentPin: string, newPin: string): { success: boolean; error?: string } => {
    const result = changeUserPin(user.id, currentPin, newPin, user.businessId);
    if (result.success) {
      refreshUsers(user.businessId);
    }
    return result;
  };

  const adminResetPin = (targetUserId: string, newPin: string): { success: boolean; error?: string } => {
    const result = storeAdminResetPin(user.role, targetUserId, newPin, user.businessId);
    if (result.success) {
      refreshUsers(user.businessId);
    }
    return result;
  };

  const hasPermission = (permission: PermissionKey): boolean => {
    return checkPermission(user.role, permission);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user.role,
        isAuthenticated,
        hasPermission,
        switchUser,
        login,
        authenticateWithPin,
        sendOtp,
        verifyOtp,
        loginWithOtp,
        registerAccount,
        logout,
        updatePin,
        adminResetPin,
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
