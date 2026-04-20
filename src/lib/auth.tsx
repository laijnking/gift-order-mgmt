'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  username: string;
  realName: string;
  role: string;
  roleName?: string;
  department?: string;
  dataScope: string;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = 'gift_order_user';

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;

  if (!user) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export async function validateLogin(username: string, password: string): Promise<AuthUser | null> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    return null;
  }

  return data.data as AuthUser;
}

export function getCurrentUser(): AuthUser | null {
  return readStoredUser();
}

export function buildUserInfoHeaders(user?: AuthUser | null): Record<string, string> {
  const currentUser = user ?? getCurrentUser();
  if (!currentUser) {
    return {};
  }

  return {
    'x-user-info': JSON.stringify({
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      dataScope: currentUser.dataScope,
      permissions: currentUser.permissions,
    }),
  };
}

export function getUserDataScope(user: AuthUser | null): string {
  return user?.dataScope || 'self';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setUser(readStoredUser());
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const nextUser = await validateLogin(username, password);
    if (!nextUser) return false;

    setUser(nextUser);
    writeStoredUser(nextUser);
    return true;
  };

  const logout = () => {
    setUser(null);
    writeStoredUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    setUser(readStoredUser());
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type Permission =
  | 'dashboard:view'
  | 'orders:view' | 'orders:create' | 'orders:edit' | 'orders:delete' | 'orders:export'
  | 'customers:view' | 'customers:create' | 'customers:edit' | 'customers:delete'
  | 'suppliers:view' | 'suppliers:create' | 'suppliers:edit' | 'suppliers:delete'
  | 'products:view' | 'products:create' | 'products:edit' | 'products:delete'
  | 'stocks:view' | 'stocks:edit'
  | 'users:view' | 'users:create' | 'users:edit' | 'users:delete'
  | 'agent_configs:view' | 'agent_configs:edit'
  | 'ai_logs:view'
  | 'settings:view';

export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(hasPermission);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(hasPermission);
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
