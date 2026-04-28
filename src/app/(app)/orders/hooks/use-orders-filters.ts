'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ORDER_STATUS_OPTIONS } from '@/lib/order-status';
import { saveOrdersSession } from './use-orders-session';

export const FILTERABLE_FIELDS = [
  { key: 'orderNo', label: '订单号', placeholder: '输入订单号' },
  { key: 'productName', label: '商品名称/型号', placeholder: '输入商品名称或型号' },
  { key: 'customerInfo', label: '客户信息', placeholder: '输入客户名称或编码' },
  { key: 'phone', label: '电话号码', placeholder: '输入电话号码' },
  { key: 'supplierName', label: '发货方', placeholder: '输入发货方名称' },
  { key: 'salesperson', label: '业务员', placeholder: '输入业务员姓名' },
  { key: 'operator', label: '跟单员', placeholder: '输入跟单员姓名' },
  { key: 'receiverName', label: '收货人', placeholder: '输入收货人姓名' },
  { key: 'address', label: '收货地址', placeholder: '输入收货地址关键词' },
  { key: 'trackingNo', label: '快递单号', placeholder: '输入快递单号' },
  { key: 'expressCompany', label: '快递公司', placeholder: '输入快递公司名称' },
  { key: 'importBatch', label: '导入批次', placeholder: '输入导入批次号' },
];

export function fuzzyMatch(text: string | undefined, query: string): boolean {
  if (!query) return true;
  if (!text) return false;
  const textLower = text.toLowerCase();
  const queryLower = query.toLowerCase();
  return textLower.startsWith(queryLower) || textLower.includes(queryLower);
}

export function useOrdersFilters(_restored: Record<string, unknown> | null) {
  const searchParams = useSearchParams();

  const [statusFilter, setStatusFilter] = useState<string>((_restored?.statusFilter as string) ?? '');
  const [selectedStatuses, setSelectedStatusesBase] = useState<string[]>((_restored?.selectedStatuses as string[]) ?? []);
  const setSelectedStatuses: typeof setSelectedStatusesBase = (v) => {
    setSelectedStatusesBase(v as string[]);
  };
  const [customerFilter, setCustomerFilter] = useState<string>((_restored?.customerFilter as string) ?? '');
  const [customerSearch, setCustomerSearch] = useState<string>((_restored?.customerSearch as string) ?? '');
  const [supplierFilter, setSupplierFilter] = useState<string>((_restored?.supplierFilter as string) ?? '');
  const [supplierSearch, setSupplierSearch] = useState<string>((_restored?.supplierSearch as string) ?? '');
  const [quantityOp, setQuantityOp] = useState<'gt' | 'lt' | 'eq'>(((_restored?.quantityOp as string) as 'gt' | 'lt' | 'eq') ?? 'eq');
  const [quantityFilter, setQuantityFilter] = useState<string>((_restored?.quantityFilter as string) ?? '');
  const [searchFields, setSearchFieldsBase] = useState<Record<string, string>>(
    (_restored?.searchFields as Record<string, string>) ?? { orderNo: '', productName: '', phone: '' }
  );
  const [showAdvancedFilter, setShowAdvancedFilter] = useState<boolean>((_restored?.showAdvancedFilter as boolean) ?? false);
  const [advancedFields, setAdvancedFieldsBase] = useState<Record<string, string>>((_restored?.advancedFields as Record<string, string>) ?? {});

  const setSearchFields: typeof setSearchFieldsBase = (v) => {
    setSearchFieldsBase(v as Record<string, string>);
  };
  const setAdvancedFields: typeof setAdvancedFieldsBase = (v) => {
    setAdvancedFieldsBase(v as Record<string, string>);
  };

  // Sync from URL params on mount
  useEffect(() => {
    const importBatch = searchParams.get('importBatch')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    if (importBatch) {
      setAdvancedFields(prev => ({ ...prev, importBatch }));
      setShowAdvancedFilter(true);
    }

    if (status && ORDER_STATUS_OPTIONS.some(o => o.value === status)) {
      setStatusFilter(status);
      setSelectedStatuses([]);
    } else if (status === 'all') {
      setStatusFilter('');
      setSelectedStatuses([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to sessionStorage on change
  useEffect(() => {
    saveOrdersSession({
      statusFilter,
      selectedStatuses,
      customerFilter,
      customerSearch,
      supplierFilter,
      supplierSearch,
      quantityOp,
      quantityFilter,
      searchFields,
      showAdvancedFilter,
      advancedFields,
    });
  }, [
    statusFilter, selectedStatuses, customerFilter, customerSearch,
    supplierFilter, supplierSearch, quantityOp, quantityFilter,
    searchFields, showAdvancedFilter, advancedFields,
  ]);

  const updateSearchField = useCallback((key: string, value: string) => {
    setSearchFields(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateAdvancedField = useCallback((key: string, value: string) => {
    setAdvancedFields(prev => ({ ...prev, [key]: value }));
  }, []);

  const addAdvancedField = useCallback((key: string) => {
    setAdvancedFields(prev => prev.hasOwnProperty(key) ? prev : { ...prev, [key]: '' });
  }, []);

  const removeAdvancedField = useCallback((key: string) => {
    setAdvancedFields(prev => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('');
    setSelectedStatuses([]);
    setCustomerFilter('');
    setCustomerSearch('');
    setSupplierFilter('');
    setSupplierSearch('');
    setQuantityOp('eq');
    setQuantityFilter('');
    setSearchFields({ orderNo: '', productName: '', phone: '' });
    setAdvancedFields({});
  }, []);

  const hasActiveFilters: boolean = Boolean(
    statusFilter ||
    customerFilter ||
    supplierFilter ||
    quantityFilter !== '' ||
    Object.values(searchFields).some(v => v.trim()) ||
    Object.values(advancedFields).some(v => v.trim())
  );

  const applyBatchStatusFilter = useCallback((statuses: string[]) => {
    if (statuses.length === 0) {
      setStatusFilter('');
      setSelectedStatuses([]);
      return;
    }
    if (statuses.length === 1) {
      setStatusFilter(statuses[0]);
      setSelectedStatuses([]);
      return;
    }
    setStatusFilter('');
    setSelectedStatuses(statuses);
  }, []);

  return {
    // State
    statusFilter, setStatusFilter,
    selectedStatuses, setSelectedStatuses,
    customerFilter, setCustomerFilter,
    customerSearch, setCustomerSearch,
    supplierFilter, setSupplierFilter,
    supplierSearch, setSupplierSearch,
    quantityOp, setQuantityOp,
    quantityFilter, setQuantityFilter,
    searchFields, setSearchFields,
    showAdvancedFilter, setShowAdvancedFilter,
    advancedFields, setAdvancedFields,
    // Actions
    updateSearchField,
    updateAdvancedField,
    addAdvancedField,
    removeAdvancedField,
    clearAllFilters,
    applyBatchStatusFilter,
    hasActiveFilters,
    // Constants
    FILTERABLE_FIELDS,
    fuzzyMatch,
  };
}
