'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { HelpGuide, HelpSection, HelpSteps, HelpNote, HelpLinks } from '@/components/ui/help-guide';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageGuard } from '@/components/auth/page-guard';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Package,
  Download,
  SlidersHorizontal,
  Plus,
  Trash2,
  Edit,
  Eye,
  FileDown,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import {
  getOrderStatusBadgeClass,
  getOrderStatusLabel,
  ORDER_STATUS_OPTIONS,
  ORDER_STATUS_PENDING,
  ORDER_STATUS_ASSIGNED,
  ORDER_STATUS_RETURNED,
  ORDER_STATUS_FEEDBACKED,
  ORDER_STATUS_COMPLETED,
  ORDER_STATUS_CANCELLED,
} from '@/lib/order-status';

import { buildUserInfoHeaders } from '@/lib/auth';
import { useOrdersSession, type Order } from './hooks/use-orders-session';
import { useOrdersFilters } from './hooks/use-orders-filters';
import { useOrdersTable, filterOrders, useSelectedCounts } from './hooks/use-orders-table';
import { useOrdersCrud } from './hooks/use-orders-crud';
import { useOrdersDispatch } from './hooks/use-orders-dispatch';

import { OrderFilterPanel } from './components/order-filter-panel';
import { BulkActionBar } from './components/bulk-action-bar';
import { OrderDetailsDialog } from './components/order-details-dialog';
import { OrderCreateDialog } from './components/order-create-dialog';
import { OrderEditDialog } from './components/order-edit-dialog';
import { OrderDeleteDialog } from './components/order-delete-dialog';
import { OrderReturnDialog } from './components/order-return-dialog';
import { OrderAssignDialog } from './components/order-assign-dialog';
import { OrderWarningsPanel, AlertPanelToggle } from './components/order-warnings-panel';

export default function OrdersPage() {
  // --- Core session hook ---
  const session = useOrdersSession();
  const {
    orders, suppliers, customers,
    alerts, alertPanelOpen, setAlertPanelOpen, unreadAlertCount,
    selectedOrderIds, setSelectedOrderIds,
    fetchOrders, markAlertAsRead, markAllAlertsAsRead,
    _restored,
    loading,
    currentPage, setCurrentPage,
    totalPages, setTotalPages,
    totalCount, setTotalCount,
    pageSize, setPageSize,
    statusCounts, fetchStatusCounts,
    selectAllOrders, toggleOrder, clearSelection,
  } = session;

  // 从 selectedOrderIds 派生（确保分页/刷新后勾选稳定）
  const selectedOrderSet = useMemo(() => new Set(selectedOrderIds), [selectedOrderIds]);

  // --- Users data (for salesperson/operator selection) ---
  const [users, setUsers] = useState<Array<{ id: string; username: string; realName?: string; name?: string; role: string }>>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/users', { headers: buildUserInfoHeaders() });
        const data = await res.json();
        if (data.success) setUsers(data.data || []);
      } catch { /* silent */ }
    };
    loadUsers();
  }, []);

  // --- Filter hook ---
  const filters = useOrdersFilters(_restored);
  const {
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
    createdFrom, setCreatedFrom,
    createdTo, setCreatedTo,
    addAdvancedField, removeAdvancedField,
    clearAllFilters, hasActiveFilters, applyBatchStatusFilter,
  } = filters;

  // --- Table hook ---
  const table = useOrdersTable();
  const { visibleColumns, toggleColumn, resetColumns, columnPickerOpen, setColumnPickerOpen } = table;

  // --- Filtered orders ---
  const filteredOrders = filterOrders(orders, {
    statusFilter, selectedStatuses,
    customerFilter, supplierFilter,
    quantityOp, quantityFilter,
    searchFields, advancedFields,
  });

  // Date range for API calls
  const dateRange = { createdFrom, createdTo };

  // Reset to page 1 whenever filter state changes (search, status, customer, supplier, date range, etc.)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filterDeps = [statusFilter, selectedStatuses, customerFilter, supplierFilter, quantityOp, quantityFilter, JSON.stringify(searchFields), JSON.stringify(advancedFields), createdFrom, createdTo];
  useEffect(() => { fetchOrders(1, dateRange); }, filterDeps); // eslint-disable-line

  // Re-fetch status counts when filters change
  useEffect(() => { fetchStatusCounts(dateRange); }, filterDeps); // eslint-disable-line

  // --- Selected counts ---
  const selectedCounts = useSelectedCounts(selectedOrderIds, orders);

  // --- CRUD hook ---
  const crud = useOrdersCrud({
    authHeaders: session.authHeaders,
    fetchOrders,
  });
  const {
    createDialogOpen, setCreateDialogOpen,
    createForm, setCreateForm, createLoading,
    handleCreateOrder, createProductPickerOpen, setCreateProductPickerOpen,
    editDialogOpen, setEditDialogOpen,
    editForm, setEditForm, editLoading,
    openEditDialog, handleUpdateOrder, editProductPickerOpen, setEditProductPickerOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    deleteOrderIds, deleteLoading,
    openDeleteConfirm, handleDeleteOrder,
    getDeleteDisabledReason, canDeleteOrder, canEditOrder,
  } = crud;

  const handleDeleteWithClear = useCallback(async () => {
    await handleDeleteOrder();
    setSelectedOrderIds([]);
  }, [handleDeleteOrder, setSelectedOrderIds]);

  // --- Dispatch hook ---
  const dispatch = useOrdersDispatch({
    authHeaders: session.authHeaders,
    suppliers,
    fetchOrders,
  });
  const {
    assignDialogOpen, setAssignDialogOpen,
    assigningOrderId,
    selectedSupplierId, setSelectedSupplierId,
    selectedSuppliers, setSelectedSuppliers,
    matchResults, setMatchResults,
    isMatching, setIsMatching,
    openAssignDialog,
    handleAssign,
    returnDialogOpen, setReturnDialogOpen,
    returnTrackingNos, setReturnTrackingNos,
    returnExpressCompany, setReturnExpressCompany,
  } = dispatch;

  // --- Sticky state ---
  const [isStickyTop, setIsStickyTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsStickyTop(scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // --- Details dialog ---
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // --- Feedback confirm dialog ---
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackGroups, setFeedbackGroups] = useState<Array<{ customerId: string; customerName: string; orderCount: number }>>([]);

  // --- Selection actions (使用 session 函数确保勾选稳定) ---
  const handleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      clearSelection();
    } else {
      selectAllOrders(filteredOrders);
    }
  };

  const handleSelectOrder = (order: Order) => {
    toggleOrder(order);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  // --- Smart match ---
  const doSmartMatch = useCallback(async () => {
    const targetIds = assigningOrderId
      ? [assigningOrderId]
      : selectedOrderIds.filter(id => {
          const order = orders.find(o => o.id === id);
          return order && order.status === 'pending';
        });
    if (targetIds.length === 0) {
      toast.error('请选择要分配的订单');
      return;
    }
    setIsMatching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: session.authHeaders(),
        body: JSON.stringify({ orderIds: targetIds }),
      });
      const data = await res.json();
      if (data.success) {
        const results: Record<string, import('./hooks/use-orders-dispatch').SupplierMatchResult> = {};
        data.data.forEach((item: Record<string, unknown>) => {
          results[item.orderId as string] = {
            recommendedSupplier: item.recommendedSupplier as import('./hooks/use-orders-dispatch').SupplierMatchResult['recommendedSupplier'],
            alternativeSuppliers: ((item.allSupplierOptions as Array<Record<string, unknown>>) || []).slice(1, 4).map((s: Record<string, unknown>) => ({
              id: s.supplierId as string, name: s.supplierName as string,
            })),
            matchReasons: (item.matchReasons as string[]) || [],
            warning: item.warning as string | undefined,
            receiverProvince: item.receiverProvince as string | null,
            productName: item.productName as string | undefined,
            productCode: item.productCode as string | undefined,
            quantity: item.quantity as number | undefined,
            availableSuppliers: (item.allSupplierOptions as import('./hooks/use-orders-dispatch').SupplierMatchResult['availableSuppliers']) || [],
            hasStockForProduct: item.hasStockForProduct as boolean | undefined,
            newProductHint: item.newProductHint as string | undefined,
          };
        });
        setMatchResults(results);
        if (data.data.length === 1 && (data.data[0] as Record<string, unknown>).recommendedSupplier) {
          setSelectedSupplierId(((data.data[0] as Record<string, unknown>).recommendedSupplier as { id: string }).id);
        }
        if (data.data.some((item: Record<string, unknown>) => (item as Record<string, unknown>).newProductHint)) {
          toast.warning('存在新商品（无库存），请手动选择发货方');
        } else if (data.data.some((item: Record<string, unknown>) => (item as Record<string, unknown>).warning)) {
          toast.warning('部分订单存在尾货预警，请注意查看');
        }
      } else {
        toast.error(data.error || '匹配失败');
      }
    } catch {
      toast.error('匹配请求失败');
    } finally {
      setIsMatching(false);
    }
  }, [assigningOrderId, selectedOrderIds, session.authHeaders, setMatchResults, setSelectedSupplierId, setIsMatching]);

  // --- Batch assign ---
  const handleBatchAssignFromMatch_ = useCallback(async () => {
    if (Object.keys(selectedSuppliers).length === 0) {
      toast.error('请为订单选择发货方');
      return;
    }
    try {
      const promises = Object.entries(selectedSuppliers).map(([orderId, supplierId]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return fetch('/api/orders', {
          method: 'PATCH',
          headers: session.authHeaders(),
          body: JSON.stringify({ id: orderId, supplierId, supplier_name: supplier?.name || '', status: 'assigned' }),
        });
      });
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map(r => r.json()));
      const successCount = dataArr.filter(d => d.success).length;
      toast.success(`成功分配发货方，共 ${successCount} 条订单已派发`);
      setMatchResults({});
      setSelectedSuppliers({});
      setAssignDialogOpen(false);
      fetchOrders();
    } catch {
      toast.error('批量分配失败');
    }
  }, [selectedSuppliers, suppliers, session.authHeaders, fetchOrders, setMatchResults, setSelectedSuppliers, setAssignDialogOpen]);

  // --- Batch return ---
  const handleBatchReturn_ = useCallback(async () => {
    const lines = returnTrackingNos.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) { toast.error('请输入快递单号'); return; }
    const targetIds = selectedOrderIds.length > 0
      ? selectedOrderIds
      : orders.filter(o => o.status === ORDER_STATUS_ASSIGNED || o.status === 'partial_returned').map(o => o.id);
    try {
      let matched = 0;
      for (const line of lines) {
        const [trackingNo, expressCompany] = line.split(/[,，\t]/).map(s => s.trim());
        for (const orderId of targetIds) {
          try {
            const res = await fetch('/api/orders', {
              method: 'PATCH',
              headers: session.authHeaders(),
                body: JSON.stringify({
                  id: orderId,
                  tracking_no: trackingNo || '',
                  express_company: expressCompany || returnExpressCompany || '',
                  status: ORDER_STATUS_RETURNED,
                }),
            });
            const data = await res.json();
            if (data.success) matched++;
          } catch {}
        }
      }
      toast.success(`成功回单 ${matched} 条订单`);
      setReturnDialogOpen(false);
      setReturnTrackingNos('');
      setReturnExpressCompany('');
      fetchOrders();
    } catch {
      toast.error('回单失败');
    }
  }, [returnTrackingNos, returnExpressCompany, selectedOrderIds, orders, session.authHeaders, fetchOrders, setReturnDialogOpen, setReturnTrackingNos, setReturnExpressCompany]);

  // --- Ship notice ---
  const handleShipNotice = () => {
    const hasAssigned = selectedOrderIds.length > 0
      ? orders.filter(o => selectedOrderSet.has(o.id)).some(o => o.status === ORDER_STATUS_ASSIGNED)
      : filteredOrders.some(o => o.status === ORDER_STATUS_ASSIGNED);
    if (!hasAssigned) { toast.error('请先选择已派发给发货方的订单'); return; }
    toast.info('正在打开发货通知单页面...');
    window.open('/shipping-export', '_blank');
  };

  // --- Feedback ---
  const openFeedbackConfirm = useCallback(() => {
    const targetIds = selectedOrderIds.length > 0
      ? selectedOrderIds
      : filteredOrders.filter(o => o.status === ORDER_STATUS_RETURNED).map(o => o.id);
    if (targetIds.length === 0) { toast.error('没有可反馈的订单（需已回单状态）'); return; }
    const targetOrders = orders.filter(o => targetIds.includes(o.id) && o.status === ORDER_STATUS_RETURNED);
    if (targetOrders.length === 0) { toast.error('所选订单中没有已回单状态的记录'); return; }
    // 按客户分组统计
    const groupMap = new Map<string, { customerId: string; customerName: string; orderCount: number }>();
    for (const o of targetOrders) {
      const cid = o.customerId || 'unknown';
      if (!groupMap.has(cid)) {
        groupMap.set(cid, { customerId: cid, customerName: o.customerName || '未知客户', orderCount: 0 });
      }
      groupMap.get(cid)!.orderCount++;
    }
    setFeedbackGroups(Array.from(groupMap.values()));
    setFeedbackDialogOpen(true);
  }, [selectedOrderIds, filteredOrders, orders]);

  const handleFeedbackConfirm = useCallback(async () => {
    setFeedbackLoading(true);
    try {
      const customerIds = feedbackGroups.map(g => g.customerId);
      const res = await fetch('/api/export-feedback/returned-batch', {
        method: 'POST',
        headers: { ...session.authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerIds, persistenceMode: 'none' }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || '导出失败');
        return;
      }
      // 下载 ZIP 文件
      const zipBase64 = data.data?.zipBase64;
      if (zipBase64) {
        const byteChars = atob(zipBase64);
        const byteNums = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
        const byteArr = new Uint8Array(byteNums);
        const blob = new Blob([byteArr], { type: 'application/zip' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.data.zipFileName || '客户反馈批量导出.zip';
        a.click();
        URL.revokeObjectURL(url);
      }
      const feedbackedCount = data.data?.feedbackedCount || 0;
      toast.success(`已导出 ${data.data?.totalOrderCount || 0} 条订单，并标记 ${feedbackedCount} 条为已反馈`);
      clearSelection();
      fetchOrders();
    } catch (error) {
      console.error('反馈导出失败:', error);
      toast.error('反馈导出失败，请稍后重试');
    } finally {
      setFeedbackLoading(false);
      setFeedbackDialogOpen(false);
    }
  }, [feedbackGroups, session.authHeaders, fetchOrders, clearSelection]);

  // --- Export Kingdee ---
  const handleExportKingdee = useCallback(async () => {
    const targetIds: string[] = selectedOrderIds.length > 0
      ? selectedOrderIds
      : filteredOrders.filter(o => o.status === ORDER_STATUS_FEEDBACKED).map(o => o.id);
    if (targetIds.length === 0) { toast.error('没有可导出金蝶的订单（需已反馈状态）'); return; }

    try {
      const res = await fetch('/api/export-kingdee/batch', {
        method: 'POST',
        headers: { ...session.authHeaders() },
        body: JSON.stringify({ orderIds: targetIds }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: '导出失败' }));
        toast.error(errorData.error || '导出金蝶失败');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `金蝶导出_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);

      // 更新订单状态为 completed
      const promises = targetIds.map(id =>
        fetch('/api/orders', {
          method: 'PATCH',
          headers: session.authHeaders(),
          body: JSON.stringify({ id, status: ORDER_STATUS_COMPLETED }),
        })
      );
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map(r => r.json()));
      const successCount = dataArr.filter(d => d.success).length;
      toast.success(`已导出金蝶并归档 ${successCount} 条订单`);
      clearSelection();
      fetchOrders();
    } catch (error) {
      console.error('导出金蝶失败:', error);
      toast.error('导出金蝶失败，请稍后重试');
    }
  }, [selectedOrderIds, filteredOrders, orders, session.authHeaders, fetchOrders, setSelectedOrderIds]);

  // --- Export ---
  const handleExport = () => {
    const orderIds = selectedOrderIds.length > 0 ? selectedOrderIds : [];
    const targetOrders = orderIds.length > 0 ? filteredOrders.filter(o => orderIds.includes(o.id)) : filteredOrders;
    if (targetOrders.length === 0) { toast.error('没有可导出的订单'); return; }
    const header = '系统单号\t客户单号\t客户\t收货人\t电话\t地址\t商品\t数量\t单价\t业务员\t跟单员\t状态\t发货方\t快递公司\t快递单号\t创建时间';
    const rows = targetOrders.map(o => [
      o.sysOrderNo || '', o.orderNo, o.customerName || '', o.receiver.name,
      o.receiver.phone, o.receiver.address,
      o.items.map(i => i.product_name).join('; '),
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.items.reduce((s, i) => s + (i.price || 0), 0).toFixed(2),
      o.salespersonName || '', o.operatorName || '', getOrderStatusLabel(o.status),
      o.supplierName || '', o.expressCompany || '', o.trackingNo || '',
      new Date(o.createdAt).toLocaleString('zh-CN'),
    ].join('\t'));
    const blob = new Blob(['\ufeff' + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `订单导出_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${targetOrders.length} 条订单`);
  };

  // 从 order-workflow-config EDITABLE_FIELDS_BY_STATUS 驱动
  const getEditDisabledReason = (order: Order): string | null => {
    if (order.status === ORDER_STATUS_COMPLETED) return '订单已导出金蝶归档，无法编辑';
    if (order.status === ORDER_STATUS_FEEDBACKED) return '订单已反馈客户，无法编辑';
    if (order.status === 'partial_returned') return '订单正在回单处理中，无法编辑';
    if (order.status === ORDER_STATUS_RETURNED) return '订单已回单，无法编辑';
    if (order.status === ORDER_STATUS_CANCELLED) return '订单已取消，无法编辑';
    return null;
  };

  const getEditableFieldsHint = (order: Order): string => {
    if (order.status === ORDER_STATUS_PENDING) return '可编辑所有信息';
    if (order.status === ORDER_STATUS_ASSIGNED) return '仅可编辑备注';
    if (order.status === 'notified') return '仅可编辑备注';
    return '';
  };

  // --- Batch import summary ---
  const activeImportBatch = advancedFields.importBatch?.trim() || '';
  const activeImportBatchSummary = (() => {
    if (!activeImportBatch) return null;
    const batchOrders = orders.filter(o => o.importBatch === activeImportBatch);
    const statusCounts = ORDER_STATUS_OPTIONS.map((option: { value: string; label: string }) => ({
      value: option.value,
      label: option.label,
      count: batchOrders.filter((o: Order) => o.status === option.value).length,
    })).filter((item: { count: number }) => item.count > 0);
    return {
      total: batchOrders.length,
      pending: batchOrders.filter((o: Order) => o.status === ORDER_STATUS_PENDING).length,
      assigned: batchOrders.filter((o: Order) => o.status === ORDER_STATUS_ASSIGNED).length,
      returned: batchOrders.filter((o: Order) => ['partial_returned', 'returned', 'feedbacked'].includes(o.status)).length,
      completed: batchOrders.filter((o: Order) => [ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED].includes(o.status as 'completed' | 'cancelled')).length,
      statusCounts,
    };
  })();

  const autoOrderNo = useMemo(() => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SYS-${dateStr}-${randomNum}`;
  }, []);

  if (session.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <PageGuard permission="orders:view" title="无权查看订单" description="当前账号没有查看订单中心的权限。">
      <div className={`space-y-4 px-3 pb-4 transition-all duration-300 sm:px-4 ${alertPanelOpen ? 'lg:pr-80' : ''}`}>
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <Package className="h-6 w-6 text-primary" />
              订单管理
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="outline" size="sm" onClick={() => fetchOrders(currentPage, dateRange)} className="w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-1" />
              刷新
            </Button>
            <Popover open={columnPickerOpen} onOpenChange={setColumnPickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  列表设置
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="end">
                <div className="px-3 py-2 border-b bg-muted/50">
                  <p className="text-sm font-medium">选择列表显示字段</p>
                  <p className="text-xs text-muted-foreground">勾选要显示的列</p>
                </div>
                <div className="p-2 space-y-1">
                  {([
                    ['sysOrderNo', '系统单号'],
                    ['customerCode', '客户编码'],
                    ['customer', '客户'],
                    ['receiver', '收货人'],
                    ['product', '商品名称'],
                    ['quantity', '数量'],
                    ['productSpec', '型号'],
                    ['productCode', '商品编码'],
                    ['salesperson', '业务员'],
                    ['operator', '跟单员'],
                    ['supplier', '发货方'],
                    ['createdAt', '创建时间'],
                  ] as [keyof typeof visibleColumns, string][]).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/60 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={visibleColumns[key]}
                        onChange={() => toggleColumn(key)}
                        className="rounded"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <div className="px-3 py-2 border-t bg-muted/30 flex justify-between">
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    onClick={() => { resetColumns(); setColumnPickerOpen(false); }}
                  >
                    恢复默认
                  </button>
                  <button className="text-xs text-primary hover:underline font-medium" onClick={() => setColumnPickerOpen(false)}>
                    完成
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-1" />
              导出
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                setCreateForm(prev => ({ ...prev, orderNo: autoOrderNo }));
                setCreateDialogOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              新增订单
            </Button>
            <HelpGuide
              title="订单管理帮助"
              docUrl="/docs/guides/orders"
            >
              <HelpSection title="功能说明">
                订单中心是系统的核心模块，负责管理所有订单的生命周期，支持订单导入、状态流转、筛选搜索、批量派发和详情查看。
              </HelpSection>
              <HelpSection title="快速操作">
                <HelpSteps steps={[
                  { title: "筛选订单", description: "使用状态筛选和高级筛选" },
                  { title: "查看详情", description: "点击订单行的眼睛图标" },
                  { title: "批量派发", description: "勾选订单后点击派发" },
                  { title: "回单确认", description: "勾选订单后点击回单" },
                ]} />
              </HelpSection>
              <HelpSection title="订单状态">
                <div className="text-xs space-y-1">
                  <div>• pending（待派发）→ assigned（已派发）→ notified（通知发货）</div>
                  <div>• notified → partial_returned（部分回单）/ returned（已回单）</div>
                  <div>• returned → feedbacked（已反馈客户）/ completed（已完成）</div>
                  <div>• partial_returned → returned / feedbacked / completed</div>
                  <div>• feedbacked → completed</div>
                </div>
              </HelpSection>
              <HelpNote type="tip">
                提示：同一订单重复派发会复用既有记录，不会重复扣减库存
              </HelpNote>
              <HelpLinks links={[
                { label: "订单解析", href: "/order-parse", description: "导入新订单" },
                { label: "发货导出", href: "/shipping-export", description: "生成发货通知" },
                { label: "核心业务流", href: "/docs/guides/business-flow", description: "模块数据流转" },
              ]} />
            </HelpGuide>
            {selectedOrderIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => openDeleteConfirm(selectedOrderIds)}
                disabled={orders.filter(o => selectedOrderSet.has(o.id)).some(o => !canDeleteOrder(o))}
              >
                <Trash2 className="w-4 h-4 mr-1" />
                删除 ({selectedOrderIds.length})
              </Button>
            )}
          </div>
        </div>

        {/* Import batch alert */}
        {activeImportBatch && (
          <Alert className="border-primary/30 bg-primary/5">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>当前正在回看导入批次</AlertTitle>
            <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="break-all font-mono text-xs">{activeImportBatch}</span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 self-start sm:self-auto"
                onClick={() => removeAdvancedField('importBatch')}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                清除此批次筛选
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Import batch summary */}
        {activeImportBatch && activeImportBatchSummary && (
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">本批次复盘摘要</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                  <button type="button" className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted" onClick={() => applyBatchStatusFilter([])}>
                    <div className="text-muted-foreground">总订单</div>
                    <div className="font-medium">{activeImportBatchSummary.total}</div>
                  </button>
                  <button type="button" className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-amber-50" onClick={() => applyBatchStatusFilter(['pending'])}>
                    <div className="text-muted-foreground">待派发</div>
                    <div className="font-medium text-amber-700">{activeImportBatchSummary.pending}</div>
                  </button>
                  <button type="button" className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-blue-50" onClick={() => applyBatchStatusFilter(['partial_returned', 'returned', 'feedbacked'])}>
                    <div className="text-muted-foreground">回单阶段</div>
                    <div className="font-medium text-blue-700">{activeImportBatchSummary.returned}</div>
                  </button>
                  <button type="button" className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-green-50" onClick={() => applyBatchStatusFilter(['completed', 'cancelled'])}>
                    <div className="text-muted-foreground">已归档</div>
                    <div className="font-medium text-green-700">{activeImportBatchSummary.completed}</div>
                  </button>
                </div>
                {activeImportBatchSummary.statusCounts.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {activeImportBatchSummary.statusCounts.map((item: { value: string; label: string; count: number }) => (
                      <Badge key={item.value} variant="outline" className="cursor-pointer" onClick={() => applyBatchStatusFilter([item.value])}>
                        {item.label} {item.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alert panel toggle */}
        <AlertPanelToggle
          open={alertPanelOpen}
          onToggle={() => setAlertPanelOpen(!alertPanelOpen)}
          unreadCount={unreadAlertCount}
        />

        {/* Alert panel */}
        <OrderWarningsPanel
          open={alertPanelOpen}
          onOpenChange={setAlertPanelOpen}
          alerts={alerts}
          unreadCount={unreadAlertCount}
          orders={orders}
          onMarkRead={markAlertAsRead}
          onMarkAllRead={markAllAlertsAsRead}
          onViewOrder={(orderId) => {
            const order = orders.find(o => o.id === orderId);
            if (order) { setSelectedOrder(order); setDetailsOpen(true); }
          }}
          onStatusFilter={(status) => {
            if (status) setStatusFilter(status);
            else { setStatusFilter(''); setSelectedStatuses([]); }
          }}
        />

        {/* Bulk action bar */}
        <div className={`transition-all duration-200 ${isStickyTop ? 'sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md -mx-1 px-1 py-2 rounded-lg' : ''}`}>
          <BulkActionBar
            selectedOrderIds={selectedOrderIds}
            orders={orders}
            onAssign={() => openAssignDialog(null)}
            onShipNotice={handleShipNotice}
            onReturn={() => setReturnDialogOpen(true)}
            onFeedback={openFeedbackConfirm}
            onExportKingdee={handleExportKingdee}
            onDelete={() => openDeleteConfirm(selectedOrderIds)}
          />
        </div>

        {/* Filter panel */}
        <OrderFilterPanel
          orders={orders}
          selectedOrderIds={selectedOrderIds}
          filteredCount={filteredOrders.length}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          selectedStatuses={selectedStatuses}
          setSelectedStatuses={setSelectedStatuses}
          customerFilter={customerFilter}
          setCustomerFilter={setCustomerFilter}
          customerSearch={customerSearch}
          setCustomerSearch={setCustomerSearch}
          supplierFilter={supplierFilter}
          setSupplierFilter={setSupplierFilter}
          supplierSearch={supplierSearch}
          setSupplierSearch={setSupplierSearch}
          quantityOp={quantityOp}
          setQuantityOp={setQuantityOp}
          quantityFilter={quantityFilter}
          setQuantityFilter={setQuantityFilter}
          searchFields={searchFields}
          setSearchFields={setSearchFields}
          showAdvancedFilter={showAdvancedFilter}
          setShowAdvancedFilter={setShowAdvancedFilter}
          advancedFields={advancedFields}
          setAdvancedFields={setAdvancedFields}
          createdFrom={createdFrom}
          setCreatedFrom={setCreatedFrom}
          createdTo={createdTo}
          setCreatedTo={setCreatedTo}
          customers={customers}
          suppliers={suppliers}
          statusCounts={statusCounts}
          totalCount={totalCount}
          addAdvancedField={addAdvancedField}
          removeAdvancedField={removeAdvancedField}
          clearAllFilters={clearAllFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Order Table */}
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input type="checkbox" checked={selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0} onChange={handleSelectAll} className="rounded" />
                  </TableHead>
                  {visibleColumns.sysOrderNo && <TableHead>系统单号</TableHead>}
                  {visibleColumns.customerCode && <TableHead>客户单号</TableHead>}
                  {visibleColumns.customer && <TableHead>客户</TableHead>}
                  {visibleColumns.receiver && <TableHead>收货人</TableHead>}
                  {visibleColumns.product && <TableHead>商品</TableHead>}
                  {visibleColumns.quantity && <TableHead className="text-center">数量</TableHead>}
                  {visibleColumns.productSpec && <TableHead>型号</TableHead>}
                  {visibleColumns.productCode && <TableHead>商品编码</TableHead>}
                  {visibleColumns.salesperson && <TableHead>业务员</TableHead>}
                  {visibleColumns.operator && <TableHead>跟单员</TableHead>}
                  <TableHead>状态</TableHead>
                  {visibleColumns.supplier && <TableHead>发货方</TableHead>}
                  {visibleColumns.createdAt && <TableHead>创建时间</TableHead>}
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={15} className="text-center py-8 text-muted-foreground">
                      {orders.length === 0 ? '暂无订单数据' : '未找到匹配的订单'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id} className={selectedOrderSet.has(order.id) ? 'bg-primary/5' : ''}>
                      <TableCell>
                        <input type="checkbox" checked={selectedOrderSet.has(order.id)} onChange={() => handleSelectOrder(order)} className="rounded" />
                      </TableCell>
                      {visibleColumns.sysOrderNo && (
                        <TableCell className="font-mono text-xs text-muted-foreground max-w-[80px] truncate" title={order.sysOrderNo || '-'}>
                          <div>{order.sysOrderNo ? order.sysOrderNo.split('-').slice(-1)[0] : '-'}</div>
                          {order.importBatch && (
                            <div className="mt-1 text-[10px] text-muted-foreground/80" title={order.importBatch}>
                              批次 {order.importBatch.slice(-8)}
                            </div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.customerCode && (
                        <TableCell className="font-mono text-sm text-muted-foreground max-w-[120px] truncate">
                          {order.orderNo}
                        </TableCell>
                      )}
                      {visibleColumns.customer && (
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{order.customerName || '-'}</div>
                            {order.customerCode && order.customerCode !== 'UNKNOWN' && (
                              <div className="text-muted-foreground text-xs">{order.customerCode}</div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.receiver && (
                        <TableCell>
                          <div className="text-sm">
                            <div>{order.receiver.name}</div>
                            <div className="text-muted-foreground text-xs">{order.receiver.phone}</div>
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.product && (
                        <TableCell>
                          <div className="text-sm">
                            {order.items.slice(0, 2).map((item, i) => (
                              <div key={item.productCode || item.product_code || `item-${i}`} className="truncate max-w-[150px]">
                                {item.productName || item.product_name}
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-muted-foreground text-xs">+{order.items.length - 2} 更多</div>
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.quantity && (
                        <TableCell className="text-center">
                          <div className="text-sm font-semibold">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</div>
                          {order.items.length > 1 && (
                            <div className="text-muted-foreground text-xs">({order.items.length}种)</div>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.productSpec && (
                        <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                          {order.items.slice(0, 2).map((item, i) => (
                            <div key={item.productCode || item.product_code || `item-${i}`} className="truncate">
                              {item.productSpec || item.product_spec || '-'}
                            </div>
                          ))}
                        </TableCell>
                      )}
                      {visibleColumns.productCode && (
                        <TableCell className="text-sm text-muted-foreground max-w-[100px] truncate font-mono">
                          {order.items.slice(0, 2).map((item, i) => (
                            <div key={item.productCode || item.product_code || `item-${i}`} className="truncate" title={item.productCode || item.product_code || '-'}>
                              {item.productCode || item.product_code || '-'}
                            </div>
                          ))}
                        </TableCell>
                      )}
                      {visibleColumns.salesperson && (
                        <TableCell className="text-sm">{order.salespersonName || '-'}</TableCell>
                      )}
                      {visibleColumns.operator && (
                        <TableCell className="text-sm">{order.operatorName || '-'}</TableCell>
                      )}
                      <TableCell>
                        <Badge className={getOrderStatusBadgeClass(order.status)}>
                          {getOrderStatusLabel(order.status)}
                        </Badge>
                      </TableCell>
                      {visibleColumns.supplier && (
                        <TableCell className="text-sm">{order.supplierName || '-'}</TableCell>
                      )}
                      {visibleColumns.createdAt && (
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)} title="查看详情">
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canEditOrder(order) && (
                            <Button variant="ghost" size="sm" onClick={() => openEditDialog(order)} title="编辑订单">
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {canDeleteOrder(order) && (
                            <Button variant="ghost" size="sm" onClick={() => openDeleteConfirm([order.id])} title="删除订单" className="text-destructive hover:text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                          {order.status === ORDER_STATUS_ASSIGNED && order.supplierId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => { toast.info('已在新页签打开发货通知单页面'); window.open('/shipping-export', '_blank'); }}
                              title="导出发货通知单"
                            >
                              <FileDown className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            {/* Pagination Bar */}
            {!loading && totalCount > 0 && (
              <div className="flex flex-col gap-3 border-t px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="text-sm text-muted-foreground">
                  共 <span className="font-medium text-foreground">{totalCount}</span> 条，第{' '}
                  <span className="font-medium text-foreground">{(currentPage - 1) * pageSize + 1}</span>-{' '}
                  <span className="font-medium text-foreground">{Math.min(currentPage * pageSize, totalCount)}</span> 条
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); fetchOrders(1); }}>
                    <SelectTrigger className="w-full sm:w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20条/页</SelectItem>
                      <SelectItem value="50">50条/页</SelectItem>
                      <SelectItem value="100">100条/页</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(1)}
                      disabled={currentPage === 1}
                    >
                      首页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="px-3 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                    >
                      下一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchOrders(totalPages)}
                      disabled={currentPage >= totalPages}
                    >
                      末页
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dialogs */}
        <OrderDetailsDialog
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          order={selectedOrder}
          canEdit={selectedOrder ? canEditOrder(selectedOrder) : false}
          canDelete={selectedOrder ? canDeleteOrder(selectedOrder) : false}
          getEditDisabledReason={getEditDisabledReason}
          getDeleteDisabledReason={getDeleteDisabledReason}
          getEditableFieldsHint={getEditableFieldsHint}
        />

        <OrderCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          form={createForm}
          setForm={setCreateForm}
          onSubmit={handleCreateOrder}
          loading={createLoading}
          productPickerOpen={createProductPickerOpen}
          setProductPickerOpen={setCreateProductPickerOpen}
          autoOrderNo={autoOrderNo}
          customers={customers}
          users={users}
          suppliers={suppliers}
        />

        <OrderEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          form={editForm}
          setForm={setEditForm}
          suppliers={suppliers}
          onSubmit={handleUpdateOrder}
          loading={editLoading}
          editProductPickerOpen={editProductPickerOpen}
          setEditProductPickerOpen={setEditProductPickerOpen}
          onEditProductSelect={(product) => {
            if (product) {
              setEditForm(prev => ({
                ...prev,
                productId: product.id,
                productName: product.name,
                productCode: product.code,
                productSpec: product.spec || '',
                productBrand: product.brand || '',
              }));
            }
          }}
          canEdit={true}
          getEditDisabledReason={() => null}
        />

        <OrderDeleteDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          orderIds={deleteOrderIds}
          onConfirm={handleDeleteWithClear}
          loading={deleteLoading}
        />

        <OrderReturnDialog
          open={returnDialogOpen}
          onOpenChange={setReturnDialogOpen}
          trackingNos={returnTrackingNos}
          setTrackingNos={setReturnTrackingNos}
          expressCompany={returnExpressCompany}
          setExpressCompany={setReturnExpressCompany}
          onSubmit={handleBatchReturn_}
          selectedCount={selectedOrderIds.length}
        />

        <OrderAssignDialog
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          assigningOrderId={assigningOrderId}
          orders={orders}
          suppliers={suppliers}
          selectedOrderIds={selectedOrderIds}
          matchResults={matchResults}
          setMatchResults={setMatchResults}
          selectedSupplierId={selectedSupplierId}
          setSelectedSupplierId={setSelectedSupplierId}
          selectedSuppliers={selectedSuppliers}
          setSelectedSuppliers={setSelectedSuppliers}
          isMatching={isMatching}
          onSmartMatch={doSmartMatch}
          onSingleAssign={handleAssign}
          onBatchAssign={handleBatchAssignFromMatch_}
        />

        {/* Feedback confirm dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认反馈给客户</DialogTitle>
              <DialogDescription>
                将按客户导入时的 Excel 模板格式生成反馈文件并导出，导出后订单状态将变更为&ldquo;已反馈&rdquo;。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>客户</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feedbackGroups.map(g => (
                    <TableRow key={g.customerId}>
                      <TableCell>{g.customerName}</TableCell>
                      <TableCell className="text-right">{g.orderCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-sm font-medium text-right">
                合计：{feedbackGroups.reduce((s, g) => s + g.orderCount, 0)} 条订单
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)} disabled={feedbackLoading}>
                取消
              </Button>
              <Button onClick={handleFeedbackConfirm} disabled={feedbackLoading}>
                {feedbackLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                确认导出并反馈
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
