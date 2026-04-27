'use client';

import { useCallback, useState } from 'react';
import { buildUserInfoHeaders } from '@/lib/auth';
import { getColumnMappingDiagnostics } from '@/lib/column-mapping-diagnostics';
import type { ColumnMappingDiagnostics } from '@/lib/column-mapping-diagnostics';
import {
  autoDetectColumnMapping,
  normalizeHeadersForCompare,
  computeHeaderFingerprint,
  COLUMN_OPTIONS,
  GROUPED_OPTIONS,
  COMMON_FIELDS,
} from '@/lib/column-mapping-rules';

export {
  COLUMN_OPTIONS,
  GROUPED_OPTIONS,
  COMMON_FIELDS,
  autoDetectColumnMapping,
  normalizeHeadersForCompare,
  computeHeaderFingerprint,
};

export interface MappingHistory {
  id: string;
  version: number;
  header_row: number;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  remark?: string;
  header_fingerprint?: string;
  template_signature?: string;
  source_headers?: string[];
  mapping_config?: Record<string, string>;
  feedback_export_headers?: Record<string, string>;
}

export function getMappingDiagnostics(
  headers: string[],
  mapping: Record<string, string>
): ColumnMappingDiagnostics {
  return getColumnMappingDiagnostics(headers, mapping);
}

export function useColumnMapping() {
  const [mappingHistory, setMappingHistory] = useState<MappingHistory[]>([]);
  const [activeMappingMeta, setActiveMappingMeta] = useState<MappingHistory | null>(null);

  const loadMappingHistory = useCallback(async (customerCode: string) => {
    try {
      const res = await fetch(
        `/api/column-mappings/history?customerCode=${encodeURIComponent(customerCode)}`,
        { headers: buildUserInfoHeaders() }
      );
      const data = await res.json();
      if (data.success) {
        setMappingHistory(data.data || []);
      }
    } catch (error) {
      console.error('加载映射历史失败:', error);
    }
  }, []);

  const autoLoadMappingByFingerprint = useCallback(
    async (
      customerCode: string,
      currentHeaders: string[],
      onLoaded: (mapping: Record<string, string>, meta: MappingHistory) => void,
      onCleared: () => void
    ) => {
      const normalized = normalizeHeadersForCompare(currentHeaders);
      if (normalized.length === 0) { onCleared(); return; }

      const fingerprint = computeHeaderFingerprint(currentHeaders);

      try {
        const res = await fetch(
          `/api/column-mappings/history?customerCode=${encodeURIComponent(customerCode)}&fingerprint=${encodeURIComponent(fingerprint)}`,
          { headers: buildUserInfoHeaders() }
        );
        const data = await res.json();
        if (data.success && data.data && data.data.length > 0) {
          const savedMapping = data.data[0];
          const savedHeaders = normalizeHeadersForCompare(savedMapping.source_headers || []);
          if (JSON.stringify(normalized) === JSON.stringify(savedHeaders)) {
            onLoaded(savedMapping.mapping_config || {}, savedMapping);
            return;
          }
        }
        onCleared();
      } catch (error) {
        console.error('自动加载历史映射失败:', error);
        onCleared();
      }
    },
    []
  );

  const saveMapping = useCallback(
    async (
      customerCode: string,
      mappingConfig: Record<string, string>,
      headerRow: number,
      sourceHeaders: string[]
    ): Promise<boolean> => {
      try {
        const res = await fetch('/api/column-mappings', {
          method: 'POST',
          headers: {
            ...buildUserInfoHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerCode,
            mappingConfig,
            headerRow,
            sourceHeaders,
            feedbackExportHeaderOverrides: {},
          }),
        });
        const data = await res.json();
        if (data.success) {
          await loadMappingHistory(customerCode);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [loadMappingHistory]
  );

  const restoreMapping = useCallback(
    async (
      mappingId: string,
      onRestored: (mapping: Record<string, string>, headerRow: number) => void
    ): Promise<boolean> => {
      try {
        const res = await fetch(`/api/column-mappings/${mappingId}`, {
          method: 'PATCH',
          headers: buildUserInfoHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          onRestored(data.data.mapping_config || {}, data.data.header_row || 0);
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    []
  );

  const isCurrentHeaderAlignedWithActiveMapping = useCallback(
    (
      currentHeaders: string[],
      activeMeta: MappingHistory | null,
      currentHeaderRow: number
    ): boolean => {
      if (!activeMeta) return false;
      const currentNorm = normalizeHeadersForCompare(currentHeaders);
      const activeNorm = normalizeHeadersForCompare(activeMeta.source_headers || []);
      return (
        currentNorm.length > 0 &&
        activeNorm.length > 0 &&
        currentHeaderRow === (activeMeta.header_row ?? currentHeaderRow) &&
        JSON.stringify(currentNorm) === JSON.stringify(activeNorm)
      );
    },
    []
  );

  const getHistoryCompatibility = useCallback(
    (history: MappingHistory, currentHeaders: string[], currentHeaderRow: number) => {
      const currentNorm = normalizeHeadersForCompare(currentHeaders);
      const historyNorm = normalizeHeadersForCompare(history.source_headers || []);
      if (currentNorm.length === 0 || historyNorm.length === 0) return null;

      const isAligned =
        currentHeaderRow === history.header_row &&
        JSON.stringify(currentNorm) === JSON.stringify(historyNorm);

      return {
        isAligned,
        label: isAligned ? '匹配当前文件' : '与当前文件有差异',
      };
    },
    []
  );

  return {
    mappingHistory,
    setMappingHistory,
    activeMappingMeta,
    setActiveMappingMeta,
    loadMappingHistory,
    autoLoadMappingByFingerprint,
    saveMapping,
    restoreMapping,
    isCurrentHeaderAlignedWithActiveMapping,
    getHistoryCompatibility,
    normalizeHeaders: normalizeHeadersForCompare,
    autoDetectColumnMapping,
    getMappingDiagnostics,
  };
}
