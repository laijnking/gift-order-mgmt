'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ParsedOrderBundleDraft, ParsedOrderDraft } from '@/types/order-parse';
import { flattenBundleDraftsToFlatOrders } from '@/lib/order-parse-bundles';

const SESSION_KEY = 'order_parse_session_v2';

export interface SupplierMatchResultItem {
  supplierId: string;
  supplierName: string;
  supplierType?: string;
  province?: string;
  provinceMatch?: string;
  productCode: string;
  productName: string;
  quantity: number;
  price: number;
  historyCost?: number | null;
  hasStock?: boolean;
  warehouseName?: string;
}

export interface SupplierMatchResult {
  availableSuppliers: SupplierMatchResultItem[];
  hasStockForProduct?: boolean;
  newProductHint?: string;
  recommendedSupplierId?: string;
}

export interface ParseStats {
  totalItems: number;
  matchedItems: number;
  unmatchedItems: number;
  ordersWithSupplier: number;
  ordersWithoutSupplier: number;
  totalHeaderCount?: number;
  nonEmptyHeaderCount?: number;
  mappedColumnCount?: number;
  ignoredColumnCount?: number;
  extensionColumnCount?: number;
  recognizedFieldCount?: number;
  coverageRate?: number;
  conflictFields?: string[];
  unrecognizedHeaders?: string[];
}

export interface ParseResult {
  duration: number;
  rawOutput?: string;
}

export interface SessionState {
  selectedCustomer: string;
  salespersonId: string;
  operatorId: string;
  salespersonName: string;
  operatorName: string;
  inputMode: 'text' | 'excel';
  inputText: string;
  headerRow: number;
  columnMapping: Record<string, string>;
  parsedOrders: ParsedOrder[];
  parseStats: ParseStats | null;
  parseResult: ParseResult | null;
  excelSheetNames: string[];
  selectedSheet: string;
  excelRows: string[][];
  excelPreview: string[][];
  excelFileName: string;
  excelFileSize: number;
  mappingAutoLoaded: boolean;
  mappingAutoLoadedId: string | null;
  supplierMatchResults: Record<string, SupplierMatchResult>;
  savedAt: number;
}

export type ParsedOrder = ParsedOrderDraft & {
  id: string;
  selected?: boolean;
  expanded?: boolean;
};

interface StoredSession {
  selectedCustomer: string;
  salespersonId: string;
  operatorId: string;
  salespersonName: string;
  operatorName: string;
  inputMode: 'text' | 'excel';
  inputText: string;
  headerRow: number;
  columnMapping: Record<string, string>;
  parsedOrders: ParsedOrder[];
  parseStats: ParseStats | null;
  parseResult: ParseResult | null;
  excelSheetNames: string[];
  selectedSheet: string;
  excelRows: string[][];
  excelPreview: string[][];
  excelFileName: string;
  excelFileSize: number;
  mappingAutoLoaded: boolean;
  mappingAutoLoadedId: string | null;
  supplierMatchResults: Record<string, SupplierMatchResult>;
  savedAt: number;
}

function saveSession(state: Partial<SessionState>) {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    const prev: StoredSession | null = existing ? JSON.parse(existing) : null;
    const next: StoredSession = {
      selectedCustomer: state.selectedCustomer ?? prev?.selectedCustomer ?? '',
      salespersonId: state.salespersonId ?? prev?.salespersonId ?? '',
      operatorId: state.operatorId ?? prev?.operatorId ?? '',
      salespersonName: state.salespersonName ?? prev?.salespersonName ?? '',
      operatorName: state.operatorName ?? prev?.operatorName ?? '',
      inputMode: state.inputMode ?? prev?.inputMode ?? 'excel',
      inputText: state.inputText ?? prev?.inputText ?? '',
      headerRow: state.headerRow ?? prev?.headerRow ?? 0,
      columnMapping: state.columnMapping ?? prev?.columnMapping ?? {},
      parsedOrders: state.parsedOrders ?? prev?.parsedOrders ?? [],
      parseStats: state.parseStats ?? prev?.parseStats ?? null,
      parseResult: state.parseResult ?? prev?.parseResult ?? null,
      excelSheetNames: state.excelSheetNames ?? prev?.excelSheetNames ?? [],
      selectedSheet: state.selectedSheet ?? prev?.selectedSheet ?? '',
      excelRows: state.excelRows ?? prev?.excelRows ?? [],
      excelPreview: state.excelPreview ?? prev?.excelPreview ?? [],
      excelFileName: state.excelFileName ?? prev?.excelFileName ?? '',
      excelFileSize: state.excelFileSize ?? prev?.excelFileSize ?? 0,
      mappingAutoLoaded: state.mappingAutoLoaded ?? prev?.mappingAutoLoaded ?? false,
      mappingAutoLoadedId: state.mappingAutoLoadedId ?? prev?.mappingAutoLoadedId ?? null,
      supplierMatchResults: state.supplierMatchResults ?? prev?.supplierMatchResults ?? {},
      savedAt: Date.now(),
    };
    if (Date.now() - next.savedAt < 2 * 60 * 60 * 1000) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    }
  } catch {
    // silently ignore serialization errors
  }
}

function loadStoredSession(): Partial<SessionState> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredSession;
    if (Date.now() - data.savedAt > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export interface SubmitValidationSummary {
  invalidOrderIds: string[];
  missingProductNameCount: number;
  missingReceiverCount: number;
  missingPhoneCount: number;
  missingAddressCount: number;
  missingSupplierCount: number;
}

export function getSubmitValidationSummary(orders: ParsedOrder[]): SubmitValidationSummary {
  const selectedOrders = orders.filter((order) => order.selected);

  return selectedOrders.reduce<SubmitValidationSummary>(
    (summary, order) => {
      const missingProductName = !order.product_name?.trim();
      const missingReceiver = !order.receiver_name?.trim();
      const missingPhone = !order.receiver_phone?.trim();
      const missingAddress = !order.receiver_address?.trim();
      const missingSupplier = !order.supplierId?.trim();

      if (
        missingProductName ||
        missingReceiver ||
        missingPhone ||
        missingAddress
      ) {
        summary.invalidOrderIds.push(order.id);
      }

      if (missingProductName) summary.missingProductNameCount += 1;
      if (missingReceiver) summary.missingReceiverCount += 1;
      if (missingPhone) summary.missingPhoneCount += 1;
      if (missingAddress) summary.missingAddressCount += 1;
      if (missingSupplier) summary.missingSupplierCount += 1;

      return summary;
    },
    {
      invalidOrderIds: [],
      missingProductNameCount: 0,
      missingReceiverCount: 0,
      missingPhoneCount: 0,
      missingAddressCount: 0,
      missingSupplierCount: 0,
    }
  );
}

export function normalizeBundleDraftsForPage(
  bundles: Array<Record<string, unknown>>
): ParsedOrder[] {
  return bundles.map((bundle, index) => ({
    ...(bundle as unknown as ParsedOrder),
    id: String(bundle.id || `parsed_${Date.now()}_${index}`),
    orderNo: String(bundle.orderNo || ''),
    customerOrderNo: String(bundle.customerOrderNo || ''),
    billDate: String(bundle.billDate || ''),
    receiverName: String(bundle.receiverName || ''),
    receiverPhone: String(bundle.receiverPhone || ''),
    receiverAddress: String(bundle.receiverAddress || ''),
    province: String(bundle.province || ''),
    city: String(bundle.city || ''),
    district: String(bundle.district || ''),
    expressCompany: String(bundle.expressCompany || ''),
    trackingNo: String(bundle.trackingNo || ''),
    remark: String(bundle.remark || ''),
    items: Array.isArray(bundle.items) ? bundle.items : [],
    selected: true,
    expanded: true,
  } as ParsedOrder));
}

export function buildFlatOrdersForPage(
  bundles: ParsedOrderBundleDraft[],
  customerCode: string,
  idPrefix: string
): ParsedOrder[] {
  return flattenBundleDraftsToFlatOrders(bundles, customerCode).map((order, index) => ({
    ...order,
    id: order.id || `${idPrefix}_${Date.now()}_${index}`,
    selected: true,
    expanded: true,
  }));
}

export function useOrderParseSession() {
  const _restored = loadStoredSession();

  const [selectedCustomer, setSelectedCustomerState] = useState<string>(_restored?.selectedCustomer ?? '');
  const [salespersonId, setSalespersonIdState] = useState<string>(_restored?.salespersonId ?? '');
  const [operatorId, setOperatorIdState] = useState<string>(_restored?.operatorId ?? '');
  const [salespersonName, setSalespersonNameState] = useState<string>(_restored?.salespersonName ?? '');
  const [operatorName, setOperatorNameState] = useState<string>(_restored?.operatorName ?? '');
  const [inputMode, setInputModeState] = useState<'text' | 'excel'>(_restored?.inputMode ?? 'excel');
  const [inputText, setInputTextState] = useState<string>(_restored?.inputText ?? '');
  const [excelFile, setExcelFileState] = useState<File | null>(null);
  const [excelRows, setExcelRowsState] = useState<string[][]>(_restored?.excelRows ?? []);
  const [excelPreview, setExcelPreviewState] = useState<string[][]>(_restored?.excelPreview ?? []);
  const [excelFileName, setExcelFileNameState] = useState<string>(_restored?.excelFileName ?? '');
  const [excelFileSize, setExcelFileSizeState] = useState<number>(_restored?.excelFileSize ?? 0);
  const [excelSheetNames, setExcelSheetNamesState] = useState<string[]>(_restored?.excelSheetNames ?? []);
  const [selectedSheet, setSelectedSheetState] = useState<string>(_restored?.selectedSheet ?? '');
  const [headerRow, setHeaderRowState] = useState<number>(_restored?.headerRow ?? 0);
  const [columnMapping, setColumnMappingState] = useState<Record<string, string>>(_restored?.columnMapping ?? {});
  const [parsedOrders, setParsedOrdersState] = useState<ParsedOrder[]>(_restored?.parsedOrders ?? []);
  const [parseStats, setParseStatsState] = useState<ParseStats | null>(_restored?.parseStats ?? null);
  const [parseResult, setParseResultState] = useState<ParseResult | null>(_restored?.parseResult ?? null);
  const [mappingAutoLoaded, setMappingAutoLoadedState] = useState(_restored?.mappingAutoLoaded ?? false);
  const [mappingAutoLoadedId, setMappingAutoLoadedIdState] = useState<string | null>(_restored?.mappingAutoLoadedId ?? null);
  const [supplierMatchResults, setSupplierMatchResultsState] = useState<Record<string, SupplierMatchResult>>(
    _restored?.supplierMatchResults ?? {}
  );

  // Batch save to sessionStorage whenever key state changes
  useEffect(() => {
    saveSession({
      selectedCustomer,
      salespersonId,
      operatorId,
      salespersonName,
      operatorName,
      inputMode,
      inputText,
      headerRow,
      columnMapping,
      parsedOrders,
      parseStats,
      parseResult,
      excelSheetNames,
      selectedSheet,
      excelRows,
      excelPreview,
      excelFileName,
      excelFileSize,
      mappingAutoLoaded,
      mappingAutoLoadedId,
      supplierMatchResults,
    });
  }, [
    selectedCustomer,
    salespersonId,
    operatorId,
    salespersonName,
    operatorName,
    inputMode,
    inputText,
    headerRow,
    columnMapping,
    parsedOrders,
    parseStats,
    parseResult,
    excelSheetNames,
    selectedSheet,
    excelRows,
    excelPreview,
    excelFileName,
    excelFileSize,
    mappingAutoLoaded,
    mappingAutoLoadedId,
    supplierMatchResults,
  ]);

  // Derived validation
  const submitValidation = useMemo(() => getSubmitValidationSummary(parsedOrders), [parsedOrders]);
  const selectedValidOrderCount = useMemo(
    () => parsedOrders.filter((order) => order.selected).length - submitValidation.invalidOrderIds.length,
    [parsedOrders, submitValidation]
  );

  // Typed setters that auto-save
  const setSelectedCustomer = useCallback((v: string) => {
    setSelectedCustomerState(v);
    if (!v) {
      setColumnMappingState({});
      setMappingAutoLoadedState(false);
      setMappingAutoLoadedIdState(null);
    }
  }, []);

  const setSalespersonId = useCallback((v: string) => setSalespersonIdState(v), []);
  const setOperatorId = useCallback((v: string) => setOperatorIdState(v), []);
  const setSalespersonName = useCallback((v: string) => setSalespersonNameState(v), []);
  const setOperatorName = useCallback((v: string) => setOperatorNameState(v), []);
  const setInputMode = useCallback((v: 'text' | 'excel') => setInputModeState(v), []);
  const setInputText = useCallback((v: string) => setInputTextState(v), []);
  const setHeaderRow = useCallback((v: number) => setHeaderRowState(v), []);
  const setColumnMapping = useCallback((v: Record<string, string>) => setColumnMappingState(v), []);
  const setParseStats = useCallback((v: ParseStats | null) => setParseStatsState(v), []);
  const setParseResult = useCallback((v: ParseResult | null) => setParseResultState(v), []);
  const setMappingAutoLoaded = useCallback((v: boolean) => setMappingAutoLoadedState(v), []);
  const setMappingAutoLoadedId = useCallback((v: string | null) => setMappingAutoLoadedIdState(v), []);

  // File setters
  const setExcelFile = useCallback((v: File | null) => {
    setExcelFileState(v);
    if (!v) {
      setExcelRowsState([]);
      setExcelPreviewState([]);
      setExcelSheetNamesState([]);
      setSelectedSheetState('');
      setColumnMappingState({});
    }
  }, []);

  const setExcelRows = useCallback((v: string[][]) => setExcelRowsState(v), []);
  const setExcelPreview = useCallback((v: string[][]) => setExcelPreviewState(v), []);
  const setExcelFileName = useCallback((v: string) => setExcelFileNameState(v), []);
  const setExcelFileSize = useCallback((v: number) => setExcelFileSizeState(v), []);
  const setExcelSheetNames = useCallback((v: string[]) => setExcelSheetNamesState(v), []);
  const setSelectedSheet = useCallback((v: string) => setSelectedSheetState(v), []);

  // Order actions
  const setParsedOrders = useCallback((updater: Parameters<typeof setParsedOrdersState>[0]) => {
    setParsedOrdersState(updater);
  }, []);

  const setSupplierMatchResults = useCallback((v: Record<string, SupplierMatchResult>) => {
    setSupplierMatchResultsState(v);
  }, []);

  // Order mutations
  const updateOrder = useCallback((id: string, field: string, value: unknown) => {
    setParsedOrdersState((orders) =>
      orders.map((o) => (o.id === id ? { ...o, [field]: value } : o))
    );
  }, []);

  const removeOrder = useCallback((id: string) => {
    setParsedOrdersState((orders) => orders.filter((o) => o.id !== id));
  }, []);

  const toggleOrder = useCallback((id: string) => {
    setParsedOrdersState((orders) =>
      orders.map((o) => (o.id === id ? { ...o, selected: !o.selected } : o))
    );
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setParsedOrdersState((orders) =>
      orders.map((o) => (o.id === id ? { ...o, expanded: !o.expanded } : o))
    );
  }, []);

  const duplicateOrder = useCallback((id: string) => {
    setParsedOrdersState((orders) => {
      const idx = orders.findIndex((o) => o.id === id);
      if (idx === -1) return orders;
      const original = orders[idx];
      const copy: ParsedOrder = {
        ...original,
        id: `copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        selected: true,
        expanded: true,
      };
      const newOrders = [...orders];
      newOrders.splice(idx + 1, 0, copy);
      return newOrders;
    });
  }, []);

  const addOrder = useCallback((customerCode: string, spName: string, spId: string, opName: string, opId: string) => {
    setParsedOrdersState((orders) => [
      ...orders,
      {
        id: `manual_${Date.now()}`,
        customer_code: customerCode,
        product_name: '',
        quantity: 1,
        salesperson: spName || undefined,
        salespersonId: spId || undefined,
        operator: opName || undefined,
        operatorId: opId || undefined,
        selected: true,
        expanded: true,
      } as ParsedOrder,
    ]);
  }, []);

  const selectAllOrders = useCallback((selected: boolean) => {
    setParsedOrdersState((orders) => orders.map((o) => ({ ...o, selected })));
  }, []);

  // Sync salesperson/operator to all orders that match criteria
  const syncGlobalAssigneeToOrders = useCallback((
    kind: 'salesperson' | 'operator',
    nextId: string,
    nextName: string,
    previousName?: string
  ) => {
    setParsedOrdersState((orders) =>
      orders.map((order) => {
        const currentName = kind === 'salesperson' ? order.salesperson : order.operator;
        const currentId = kind === 'salesperson' ? order.salespersonId : order.operatorId;
        const shouldSync =
          !currentId || !currentName || (previousName ? currentName === previousName : false);
        if (!shouldSync) return order;
        return {
          ...order,
          [kind]: nextName,
          [kind === 'salesperson' ? 'salespersonId' : 'operatorId']: nextId,
        };
      })
    );
  }, []);

  const clearAll = useCallback(() => {
    setInputTextState('');
    setExcelFileState(null);
    setExcelFileNameState('');
    setExcelFileSizeState(0);
    setExcelRowsState([]);
    setExcelPreviewState([]);
    setExcelSheetNamesState([]);
    setSelectedSheetState('');
    setParsedOrdersState([]);
    setParseStatsState(null);
    setParseResultState(null);
    setSupplierMatchResultsState({});
    setMappingAutoLoadedState(false);
    setMappingAutoLoadedIdState(null);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  return {
    // State
    _restored,
    selectedCustomer,
    salespersonId,
    operatorId,
    salespersonName,
    operatorName,
    inputMode,
    inputText,
    headerRow,
    columnMapping,
    parsedOrders,
    parseStats,
    parseResult,
    excelSheetNames,
    selectedSheet,
    excelRows,
    excelPreview,
    excelFileName,
    excelFileSize,
    excelFile,
    mappingAutoLoaded,
    mappingAutoLoadedId,
    supplierMatchResults,
    // Derived
    submitValidation,
    selectedValidOrderCount,
    // Setters
    setSelectedCustomer,
    setSalespersonId,
    setOperatorId,
    setSalespersonName,
    setOperatorName,
    setInputMode,
    setInputText,
    setHeaderRow,
    setColumnMapping,
    setParseStats,
    setParseResult,
    setMappingAutoLoaded,
    setMappingAutoLoadedId,
    setExcelFile,
    setExcelRows,
    setExcelPreview,
    setExcelFileName,
    setExcelFileSize,
    setExcelSheetNames,
    setSelectedSheet,
    setParsedOrders,
    setSupplierMatchResults,
    // Order mutations
    updateOrder,
    removeOrder,
    toggleOrder,
    toggleExpand,
    duplicateOrder,
    addOrder,
    selectAllOrders,
    syncGlobalAssigneeToOrders,
    clearAll,
  };
}
