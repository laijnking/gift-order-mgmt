'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCurrentTenantId } from '@/hooks/use-tenant';
import { buildUserInfoHeaders } from '@/lib/auth';

export interface TenantConfig {
  name: string;
  financialSystem: string;
  statusLabels: Record<string, string>;
  actionLabels: Record<string, string>;
  exportPrefixes: Record<string, string>;
}

const DEFAULT_CONFIG: TenantConfig = {
  name: '',
  financialSystem: '',
  statusLabels: {},
  actionLabels: {},
  exportPrefixes: {},
};

export function useTenantConfig() {
  const tenantId = useCurrentTenantId();
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    if (!tenantId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tenant-configs?tenantId=${tenantId}`, {
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConfig({
          name: data.data.name || '',
          financialSystem: data.data.financialSystem || '',
          statusLabels: data.data.statusLabels || {},
          actionLabels: data.data.actionLabels || {},
          exportPrefixes: data.data.exportPrefixes || {},
        });
      }
    } catch {
      // 保持默认配置
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, refresh: fetchConfig };
}
