'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { PERMISSIONS, type Permission } from '@/lib/permissions';

export interface Tenant {
  id: string;
  code: string;
  name: string;
  status?: string;
  role?: string;
  isDefault?: boolean;
}

export interface AuthUser {
  id: string;
  username: string;
  realName: string;
  role: string;
  roleName?: string;
  department?: string;
  dataScope: string;
  permissions: string[];
  isSuperadmin?: boolean;
  authSignature?: string;
  authTimestamp?: number;
  tenants?: Tenant[];
  currentTenant?: Tenant | null;
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

function normalizeStoredUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id : '';
  const username = typeof record.username === 'string' ? record.username : '';
  const realName = typeof record.realName === 'string' ? record.realName : username;
  const role = typeof record.role === 'string' ? record.role : '';

  if (!id || !username || !role) {
    return null;
  }

  let tenants: Tenant[] = [];
  if (Array.isArray(record.tenants)) {
    tenants = record.tenants.filter((t): t is Tenant =>
      t !== null && typeof t === 'object' && typeof t.id === 'string'
    );
  }

  let currentTenant: Tenant | null = null;
  if (record.currentTenant && typeof record.currentTenant === 'object') {
    const ct = record.currentTenant as Record<string, unknown>;
    if (typeof ct.id === 'string') {
      currentTenant = {
        id: ct.id,
        code: typeof ct.code === 'string' ? ct.code : '',
        name: typeof ct.name === 'string' ? ct.name : '',
        status: typeof ct.status === 'string' ? ct.status : 'active',
        role: typeof ct.role === 'string' ? ct.role : undefined,
        isDefault: typeof ct.isDefault === 'boolean' ? ct.isDefault : undefined,
      };
    }
  }

  return {
    id,
    username,
    realName,
    role,
    roleName: typeof record.roleName === 'string' ? record.roleName : undefined,
    department: typeof record.department === 'string' ? record.department : undefined,
    dataScope: typeof record.dataScope === 'string' ? record.dataScope : 'self',
    permissions: Array.isArray(record.permissions)
      ? record.permissions.filter((permission): permission is string => typeof permission === 'string')
      : [],
    isSuperadmin: typeof record.isSuperadmin === 'boolean' ? record.isSuperadmin : false,
    authSignature: typeof record.authSignature === 'string' ? record.authSignature : undefined,
    authTimestamp: typeof record.authTimestamp === 'number' ? record.authTimestamp : undefined,
    tenants,
    currentTenant,
  };
}

function readStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = normalizeStoredUser(JSON.parse(raw));
    if (!parsed) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
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

  const headers: Record<string, string> = {
    'x-user-info': JSON.stringify({
      id: currentUser.id,
      username: currentUser.username,
      role: currentUser.role,
      dataScope: currentUser.dataScope,
      permissions: currentUser.permissions,
    }),
  };

  // 添加签名信息
  if (currentUser.authSignature && currentUser.authTimestamp) {
    headers['x-user-signature'] = currentUser.authSignature;
    headers['x-timestamp'] = String(currentUser.authTimestamp);
  }

  // 添加租户上下文头
  const tenant = currentUser.currentTenant || currentUser.tenants?.[0];
  if (tenant?.id) {
    headers['x-tenant-id'] = tenant.id;
    if (tenant.code) {
      headers['x-tenant-code'] = tenant.code;
    }
  }

  return headers;
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
