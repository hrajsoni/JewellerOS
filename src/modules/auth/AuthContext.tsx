"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { UserSession, RoleType, PermissionKey, LoginCredentials, UserProfile } from "./types";
import {
  getCurrentSession,
  switchActiveUser,
  loginWithCredentials,
  logoutUser,
  getTenantUsers,
  changeUserPin,
  adminResetPin as storeAdminResetPin,
  DEFAULT_SESSION,
} from "./store";
import { hasPermission as checkPermission } from "./permissions";

export interface AuthContextType {
  user: UserSession;
  role: RoleType;
  hasPermission: (permission: PermissionKey) => boolean;
  switchUser: (userId: string) => void;
  login: (credentials: LoginCredentials) => { success: boolean; error?: string };
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

  const [allUsers, setAllUsers] = useState<(UserProfile & { pin: string })[]>(() => {
    if (typeof window !== "undefined") {
      const session = getCurrentSession();
      return getTenantUsers(session.businessId);
    }
    return getTenantUsers(DEFAULT_SESSION.businessId);
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  const refreshUsers = useCallback((tenantId?: string) => {
    setAllUsers(getTenantUsers(tenantId || user.businessId));
  }, [user.businessId]);

  const switchUser = (userId: string) => {
    const nextSession = switchActiveUser(userId, user.businessId);
    if (nextSession) {
      setUser(nextSession);
      refreshUsers(nextSession.businessId);
    }
  };

  const login = (credentials: LoginCredentials): { success: boolean; error?: string } => {
    const result = loginWithCredentials(credentials, user.businessId);
    if (result.session) {
      setUser(result.session);
      refreshUsers(result.session.businessId);
      setIsLoginModalOpen(false);
      return { success: true };
    }
    return { success: false, error: result.error || "Login failed" };
  };

  const logout = () => {
    logoutUser();
    setUser(DEFAULT_SESSION);
    refreshUsers(DEFAULT_SESSION.businessId);
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
        hasPermission,
        switchUser,
        login,
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
