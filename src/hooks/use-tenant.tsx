'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth, type Tenant } from '@/lib/auth';

interface TenantContextType {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  initialTenants?: Tenant[];
  initialCurrentTenant?: Tenant | null;
}

export function TenantProvider({ children, initialTenants: _initialTenants, initialCurrentTenant }: TenantProviderProps) {
  const { user, refreshUser } = useAuth();
  const [currentTenant, setCurrentTenantState] = useState<Tenant | null>(initialCurrentTenant ?? null);

  useEffect(() => {
    if (!initialCurrentTenant && user) {
      setCurrentTenantState(user.currentTenant || user.tenants?.[0] || null);
    }
  }, [user, initialCurrentTenant]);

  const setCurrentTenant = useCallback((tenant: Tenant) => {
    if (!user) return;
    const updated = { ...user, currentTenant: tenant };
    const STORAGE_KEY = 'gift_order_user';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setCurrentTenantState(tenant);
    refreshUser();
  }, [user, refreshUser]);

  return (
    <TenantContext.Provider value={{ currentTenant, setCurrentTenant }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
}

export function useCurrentTenantId(): string | undefined {
  const { currentTenant } = useTenant();
  return currentTenant?.id;
}

export type { Tenant };
