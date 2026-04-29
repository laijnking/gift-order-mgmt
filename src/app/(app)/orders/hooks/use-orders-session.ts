'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { buildUserInfoHeaders } from '@/lib/auth';

const SESSION_KEY = 'orders_session_v1';

export interface OrdersSessionState {
  statusFilter: string;
  selectedStatuses: string[];
  customerFilter: string;
  customerSearch: string;
  supplierFilter: string;
  supplierSearch: string;
  quantityOp: 'gt' | 'lt' | 'eq';
  quantityFilter: string;
  searchFields: Record<string, string>;
  showAdvancedFilter: boolean;
  advancedFields: Record<string, string>;
  selectedOrderIds: string[];
  alertPanelOpen: boolean;
  savedAt: number;
}

let sessionSaveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveOrdersSession(state: Partial<OrdersSessionState>) {
  if (sessionSaveTimer) clearTimeout(sessionSaveTimer);
  sessionSaveTimer = setTimeout(() => {
    try {
      const existing = sessionStorage.getItem(SESSION_KEY);
      const prev: OrdersSessionState | null = existing ? JSON.parse(existing) : null;
      const next: OrdersSessionState = {
        statusFilter: state.statusFilter ?? prev?.statusFilter ?? '',
        selectedStatuses: state.selectedStatuses ?? prev?.selectedStatuses ?? [],
        customerFilter: state.customerFilter ?? prev?.customerFilter ?? '',
        customerSearch: state.customerSearch ?? prev?.customerSearch ?? '',
        supplierFilter: state.supplierFilter ?? prev?.supplierFilter ?? '',
        supplierSearch: state.supplierSearch ?? prev?.supplierSearch ?? '',
        quantityOp: state.quantityOp ?? prev?.quantityOp ?? 'eq',
        quantityFilter: state.quantityFilter ?? prev?.quantityFilter ?? '',
        searchFields: state.searchFields ?? prev?.searchFields ?? { orderNo: '', productName: '', phone: '' },
        showAdvancedFilter: state.showAdvancedFilter ?? prev?.showAdvancedFilter ?? false,
        advancedFields: state.advancedFields ?? prev?.advancedFields ?? {},
        selectedOrderIds: state.selectedOrderIds ?? prev?.selectedOrderIds ?? [],
        alertPanelOpen: state.alertPanelOpen ?? prev?.alertPanelOpen ?? true,
        savedAt: Date.now(),
      };
      if (Date.now() - next.savedAt < 24 * 60 * 60 * 1000) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      }
    } catch {
      // silently ignore
    }
  }, 500);
}

export function loadOrdersSession(): Partial<OrdersSessionState> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as OrdersSessionState;
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export interface Order {
  id: string;
  sysOrderNo?: string;
  orderNo: string;
  billNo?: string;
  billDate?: string;
  supplierOrderNo?: string;
  status: string;
  items: Array<{
    productId?: string | null;
    productName: string;
    productSpec?: string;
    productCode?: string;
    unitPrice?: number | null;
    cuProductName?: string;
    cuProductCode?: string;
    cuProductSpec?: string;
    quantity: number;
    price?: number;
    amount?: number;
    discount?: number;
    tax_rate?: number;
    warehouse?: string;
    remark?: string;
    matchType?: string;
    matchHint?: string;
    product_name?: string;
    product_spec?: string;
    product_code?: string;
  }>;
  receiver: { name: string; phone: string; address: string; province?: string; city?: string; district?: string };
  customerCode?: string;
  customerName?: string;
  salesperson?: string;
  salespersonName?: string;
  operatorName?: string;
  supplierId?: string;
  supplierName?: string;
  importBatch?: string;
  assignedBatch?: string;
  assignedAt?: string;
  expressCompany?: string;
  trackingNo?: string;
  warehouse?: string;
  amount?: number;
  discount?: number;
  taxRate?: number;
  incomeName?: string;
  incomeAmount?: number;
  invoiceRequired?: boolean;
  remark?: string;
  expressRequirement?: string;
  extFields?: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  province?: string;
}

export interface Customer {
  code: string;
  name: string;
  salesUserId?: string;
  salesUserName?: string;
  operatorUserId?: string;
  operatorUserName?: string;
}

export interface AlertRecord {
  id: string;
  ruleId?: string;
  ruleCode?: string;
  orderId?: string;
  orderNo?: string;
  alertType: string;
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  content: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
}

export function useOrdersSession() {
  const searchParams = useSearchParams();
  const _restored = loadOrdersSession();
  const _applyingUrlParams = useRef(false);

  // Alert state
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [alertPanelOpen, setAlertPanelOpen] = useState(_restored?.alertPanelOpen ?? true);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  // Orders
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Reference data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Selection
  const [selectedOrders, setSelectedOrders] = useState<Set<Order>>(new Set());
  const [selectedOrderIds, setSelectedOrderIdsState] = useState<string[]>(_restored?.selectedOrderIds ?? []);

  const authHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    ...buildUserInfoHeaders(),
  }), []);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      const importBatch = searchParams.get('importBatch')?.trim();
      const status = searchParams.get('status')?.trim();
      if (importBatch) params.set('importBatch', importBatch);
      if (status && status !== 'all') params.set('status', status);
      const res = await fetch(`/api/orders${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch {
      console.error('获取订单失败');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch('/api/suppliers', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setSuppliers((data.data || []).filter((s: Supplier) => s.id && s.name));
    } catch {
      console.error('获取发货方失败');
    }
  }, [authHeaders]);

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers?isActive=false', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCustomers((data.data || []).filter((c: Customer) => !!(String(c.code ?? '').trim() && String(c.name ?? '').trim())));
    } catch {
      console.error('获取客户失败');
    }
  }, [authHeaders]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alert-records?isResolved=false&limit=50', { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
        setUnreadAlertCount((data.data || []).filter((a: AlertRecord) => !a.isRead).length);
      }
    } catch {
      console.error('获取预警记录失败');
    }
  }, []);

  // Mark alert as read
  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/alert-records', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [alertId], is_read: true }),
      });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
      setUnreadAlertCount(prev => Math.max(0, prev - 1));
    } catch {
      console.error('标记已读失败');
    }
  }, [authHeaders]);

  // Mark all alerts as read
  const markAllAlertsAsRead = useCallback(async () => {
    const unreadIds = alerts.filter(a => !a.isRead).map(a => a.id);
    try {
      await Promise.all(unreadIds.map(id =>
        fetch('/api/alert-records', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ ids: [id], is_read: true }),
        })
      ));
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadAlertCount(0);
    } catch {
      console.error('批量标记已读失败');
    }
  }, [alerts, authHeaders]);

  // Init load
  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchCustomers();
    fetchAlerts();
  }, [fetchOrders, fetchSuppliers, fetchCustomers, fetchAlerts]);

  // URL param → session (only on first render)
  useEffect(() => {
    _applyingUrlParams.current = true;
    requestAnimationFrame(() => {
      _applyingUrlParams.current = false;
    });
  }, []);

  // Restore selected orders when orders load
  useEffect(() => {
    const ids = _restored?.selectedOrderIds;
    if (!ids?.length) return;
    setSelectedOrders(prev => {
      const next = new Set(prev);
      orders.forEach(order => {
        if (ids.includes(order.id)) next.add(order);
      });
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  // Selection mutations
  const selectAllOrders = useCallback((ordersToSelect: Order[]) => {
    setSelectedOrders(new Set(ordersToSelect));
    setSelectedOrderIdsState(ordersToSelect.map(o => o.id));
  }, []);

  const toggleOrder = useCallback((order: Order) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(order)) next.delete(order);
      else next.add(order);
      return next;
    });
    setSelectedOrderIdsState(prev => {
      if (prev.includes(order.id)) return prev.filter(id => id !== order.id);
      return [...prev, order.id];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOrders(new Set());
    setSelectedOrderIdsState([]);
  }, []);

  // Selection → sessionStorage (debounced via saveOrdersSession)
  useEffect(() => {
    if (_applyingUrlParams.current) return;
    saveOrdersSession({ selectedOrderIds });
  }, [selectedOrderIds]);

  return {
    _restored,
    _applyingUrlParams,
    orders, setOrders,
    loading, setLoading,
    suppliers, setSuppliers,
    customers, setCustomers,
    alerts, setAlerts,
    alertPanelOpen, setAlertPanelOpen,
    unreadAlertCount, setUnreadAlertCount,
    selectedOrders, setSelectedOrders,
    selectedOrderIds, setSelectedOrderIdsState,
    authHeaders,
    fetchOrders,
    fetchSuppliers,
    fetchCustomers,
    fetchAlerts,
    markAlertAsRead,
    markAllAlertsAsRead,
    selectAllOrders,
    toggleOrder,
    clearSelection,
  };
}
