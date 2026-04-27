'use client';

import { useState, useCallback, useMemo } from 'react';
import type { Order } from './use-orders-session';
import { ORDER_STATUS_PENDING, ORDER_STATUS_ASSIGNED, ORDER_STATUS_RETURNED, ORDER_STATUS_FEEDBACKED, ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED } from '@/lib/order-status';

export interface VisibleColumns {
  sysOrderNo: boolean;
  customerCode: boolean;
  customer: boolean;
  receiver: boolean;
  product: boolean;
  quantity: boolean;
  productSpec: boolean;
  productCode: boolean;
  salesperson: boolean;
  operator: boolean;
  supplier: boolean;
  createdAt: boolean;
}

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  sysOrderNo: true,
  customerCode: false,
  customer: true,
  receiver: true,
  product: true,
  quantity: true,
  productSpec: true,
  productCode: true,
  salesperson: true,
  operator: true,
  supplier: true,
  createdAt: true,
};

export function useOrdersTable() {
  const [visibleColumns, setVisibleColumns] = useState<VisibleColumns>(() => {
    try {
      const saved = localStorage.getItem('orders_visible_columns');
      if (saved) return JSON.parse(saved) as VisibleColumns;
    } catch {}
    return DEFAULT_VISIBLE_COLUMNS;
  });
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);

  const toggleColumn = useCallback((col: keyof VisibleColumns) => {
    setVisibleColumns(prev => {
      const next = { ...prev, [col]: !prev[col] };
      try { localStorage.setItem('orders_visible_columns', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const resetColumns = useCallback(() => {
    setVisibleColumns(DEFAULT_VISIBLE_COLUMNS);
    try { localStorage.removeItem('orders_visible_columns'); } catch {}
    setColumnPickerOpen(false);
  }, []);

  return {
    visibleColumns, setVisibleColumns,
    columnPickerOpen, setColumnPickerOpen,
    toggleColumn,
    resetColumns,
  };
}

// Filter logic (no external dependencies — pure computation)
export function filterOrders(
  orders: Order[],
  options: {
    statusFilter: string;
    selectedStatuses: string[];
    customerFilter: string;
    supplierFilter: string;
    quantityOp: 'gt' | 'lt' | 'eq';
    quantityFilter: string;
    searchFields: Record<string, string>;
    advancedFields: Record<string, string>;
  }
): Order[] {
  const { statusFilter, selectedStatuses, customerFilter, supplierFilter, quantityOp, quantityFilter, searchFields, advancedFields } = options;
  const fuzzyMatch = (text: string | undefined, query: string): boolean => {
    if (!query) return true;
    if (!text) return false;
    const t = text.toLowerCase();
    const q = query.toLowerCase();
    return t.startsWith(q) || t.includes(q);
  };

  return orders.filter(order => {
    // Default: exclude archived
    const archiveStatuses = ['completed', 'cancelled'];
    const isArchived = archiveStatuses.includes(order.status);
    const hasExplicitFilter = statusFilter !== '' || selectedStatuses.length > 0;
    if (!hasExplicitFilter && isArchived) return false;

    // Status filter
    if (statusFilter !== '' && order.status !== statusFilter) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status)) return false;

    // Customer
    if (customerFilter && order.customerCode !== customerFilter) return false;

    // Supplier
    if (supplierFilter && order.supplierId !== supplierFilter) return false;

    // Quantity
    if (quantityFilter !== '') {
      const qty = order.items.reduce((s, i) => s + (i.quantity || 0), 0);
      const target = parseInt(quantityFilter);
      if (isNaN(target)) return false;
      if (quantityOp === 'gt' && !(qty > target)) return false;
      if (quantityOp === 'lt' && !(qty < target)) return false;
      if (quantityOp === 'eq' && qty !== target) return false;
    }

    // Search fields
    const allSearchFields = { ...searchFields, ...advancedFields };
    for (const [key, value] of Object.entries(allSearchFields)) {
      if (!value.trim()) continue;
      if (key === 'customerInfo') continue;
      const q = value.trim().toLowerCase();
      let matched = false;
      switch (key) {
        case 'orderNo':
          matched = fuzzyMatch(order.orderNo, q) || fuzzyMatch(order.sysOrderNo, q); break;
        case 'productName':
          matched = order.items.some(i => fuzzyMatch(i.product_name, q) || fuzzyMatch(i.product_spec, q)); break;
        case 'phone':
          matched = order.receiver.phone?.includes(q); break;
        case 'supplierName':
          matched = fuzzyMatch(order.supplierName, q); break;
        case 'salesperson':
          matched = fuzzyMatch(order.salespersonName, q); break;
        case 'operator':
          matched = fuzzyMatch(order.operatorName, q); break;
        case 'receiverName':
          matched = fuzzyMatch(order.receiver.name, q); break;
        case 'address':
          matched = fuzzyMatch(order.receiver.address, q); break;
        case 'trackingNo':
          matched = fuzzyMatch(order.trackingNo, q); break;
        case 'expressCompany':
          matched = fuzzyMatch(order.expressCompany, q); break;
        case 'importBatch':
          matched = fuzzyMatch((order as Order & { importBatch?: string }).importBatch, q); break;
      }
      if (!matched) return false;
    }

    return true;
  });
}

// Order counts by status
export function useOrderCounts(orders: Order[]) {
  return useMemo(() => {
    const unarchived = orders.filter(o => o.status !== ORDER_STATUS_COMPLETED && o.status !== ORDER_STATUS_CANCELLED);
    const pending = orders.filter(o => o.status === ORDER_STATUS_PENDING);
    return { total: orders.length, unarchived: unarchived.length, pending: pending.length };
  }, [orders]);
}

// Selected order counts by status
export function useSelectedCounts(selectedOrders: Set<Order>) {
  return useMemo(() => ({
    pending: Array.from(selectedOrders).filter(o => o.status === ORDER_STATUS_PENDING).length,
    assigned: Array.from(selectedOrders).filter(o => o.status === ORDER_STATUS_ASSIGNED).length,
    returnable: Array.from(selectedOrders).filter(o => o.status === ORDER_STATUS_RETURNED).length,
    feedbacked: Array.from(selectedOrders).filter(o => o.status === ORDER_STATUS_FEEDBACKED).length,
    total: selectedOrders.size,
  }), [selectedOrders]);
}
