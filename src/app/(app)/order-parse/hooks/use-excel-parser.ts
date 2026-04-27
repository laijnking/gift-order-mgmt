'use client';

import { useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { buildExcelPreviewRows, normalizeExcelSheetRows } from '@/lib/order-parse-excel';

export function useExcelParser({
  autoDetectMapping,
  onExcelLoad,
  onSheetChange,
}: {
  autoDetectMapping: (headers: string[]) => Record<string, string>;
  onExcelLoad: (rows: string[][], preview: string[][], sheetNames: string[], selectedSheet: string, detectedMapping: Record<string, string>) => void;
  onSheetChange: (rows: string[][], preview: string[][], detectedMapping: Record<string, string>) => void;
}) {
  const fileRef = useRef<File | null>(null);

  const handleExcelUpload = useCallback(
    (file: File) => {
      fileRef.current = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const firstSheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<Array<string | number | boolean | null | undefined>>(firstSheet, {
            header: 1,
          });
          const normalizedRows = normalizeExcelSheetRows(jsonData);
          const preview = buildExcelPreviewRows(normalizedRows);
          const detected = autoDetectMapping(preview[0] || []);
          onExcelLoad(normalizedRows, preview, workbook.SheetNames, firstSheetName, detected);
        } catch (error) {
          console.error('[useExcelParser] Excel解析失败:', error);
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [autoDetectMapping, onExcelLoad]
  );

  const handleSheetChange = useCallback(
    (sheetName: string) => {
      const file = fileRef.current;
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<Array<string | number | boolean | null | undefined>>(sheet, {
            header: 1,
          });
          const normalizedRows = normalizeExcelSheetRows(jsonData);
          const preview = buildExcelPreviewRows(normalizedRows);
          const detected = autoDetectMapping(preview[0] || []);
          onSheetChange(normalizedRows, preview, detected);
        } catch {
          // silently fail
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [autoDetectMapping, onSheetChange]
  );

  return { handleExcelUpload, handleSheetChange, fileRef };
}
