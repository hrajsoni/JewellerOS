"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserSession, RoleType, PermissionKey, LoginCredentials, UserProfile } from "./types";
import {
  getCurrentSession,
  setCurrentSession,
  switchActiveUser,
  loginWithCredentials,
  logoutUser,
  DEFAULT_USERS,
  DEFAULT_SESSION,
} from "./store";
import { hasPermission as checkPermission, ROLE_PERMISSIONS } from "./permissions";

export interface AuthContextType {
  user: UserSession;
  role: RoleType;
  hasPermission: (permission: PermissionKey) => boolean;
  switchUser: (userId: string) => void;
  login: (credentials: LoginCredentials) => { success: boolean; error?: string };
  logout: () => void;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  allUsers: (UserProfile & { pin: string })[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession>(DEFAULT_SESSION);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const session = getCurrentSession();
    setUser(session);
  }, []);

  const switchUser = (userId: string) => {
    const nextSession = switchActiveUser(userId);
    if (nextSession) {
      setUser(nextSession);
    }
  };

  const login = (credentials: LoginCredentials): { success: boolean; error?: string } => {
    const result = loginWithCredentials(credentials);
    if (result.session) {
      setUser(result.session);
      setIsLoginModalOpen(false);
      return { success: true };
    }
    return { success: false, error: result.error || "Login failed" };
  };

  const logout = () => {
    logoutUser();
    setUser(DEFAULT_SESSION);
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
        isLoginModalOpen,
        openLoginModal: () => setIsLoginModalOpen(true),
        closeLoginModal: () => setIsLoginModalOpen(false),
        allUsers: DEFAULT_USERS,
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
