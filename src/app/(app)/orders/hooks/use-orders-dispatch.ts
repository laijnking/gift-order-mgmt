'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Supplier } from './use-orders-session';

export interface SupplierMatchResult {
  recommendedSupplier: { id: string; name: string; type?: string; province?: string; provinceMatch?: string } | null;
  alternativeSuppliers: { id: string; name: string }[];
  matchReasons: string[];
  warning?: string;
  receiverProvince?: string | null;
  productName?: string;
  productCode?: string;
  quantity?: number;
  availableSuppliers: Array<{
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
    version?: string;
    score?: number;
    hasStock?: boolean;
  }>;
  hasStockForProduct?: boolean;
  newProductHint?: string;
}

export function useOrdersDispatch({
  authHeaders,
  suppliers,
  fetchOrders,
}: {
  authHeaders: () => Record<string, string>;
  suppliers: Supplier[];
  fetchOrders: () => Promise<void>;
}) {
  // Assign dialog
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedSuppliers, setSelectedSuppliers] = useState<Record<string, string>>({});
  const [matchResults, setMatchResults] = useState<Record<string, SupplierMatchResult>>({});
  const [isMatching, setIsMatching] = useState(false);

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnTrackingNos, setReturnTrackingNos] = useState('');
  const [returnExpressCompany, setReturnExpressCompany] = useState('');

  // Manual select
  const [manualSelectOpen, setManualSelectOpen] = useState(false);
  const [manualSelectOrderId, setManualSelectOrderId] = useState<string | null>(null);

  // Open assign dialog
  const openAssignDialog = useCallback((orderId: string | null) => {
    setAssigningOrderId(orderId);
    setSelectedSupplierId('');
    setMatchResults({});
    setSelectedSuppliers({});
    setAssignDialogOpen(true);
  }, []);

  // Smart match
  const doSmartMatch = useCallback(async (orderIds: string[]) => {
    if (orderIds.length === 0) {
      toast.error('请选择要分配的订单');
      return null;
    }
    setIsMatching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderIds }),
      });
      const data = await res.json();
      if (data.success) {
        const results: Record<string, SupplierMatchResult> = {};
        data.data.forEach((item: Record<string, unknown>) => {
          results[item.orderId as string] = {
            recommendedSupplier: item.recommendedSupplier as SupplierMatchResult['recommendedSupplier'],
            alternativeSuppliers: ((item.allSupplierOptions as Array<Record<string, unknown>>) || []).slice(1, 4).map((s: Record<string, unknown>) => ({
              id: s.supplierId as string, name: s.supplierName as string,
            })),
            matchReasons: (item.matchReasons as string[]) || [],
            warning: item.warning as string | undefined,
            receiverProvince: item.receiverProvince as string | null,
            productName: item.productName as string | undefined,
            productCode: item.productCode as string | undefined,
            quantity: item.quantity as number | undefined,
            availableSuppliers: (item.allSupplierOptions as SupplierMatchResult['availableSuppliers']) || [],
            hasStockForProduct: item.hasStockForProduct as boolean | undefined,
            newProductHint: item.newProductHint as string | undefined,
          };
        });
        setMatchResults(results);
        if (data.data.length === 1 && (data.data[0] as Record<string, unknown>).recommendedSupplier) {
          setSelectedSupplierId(((data.data[0] as Record<string, unknown>).recommendedSupplier as { id: string }).id);
        }
        if (data.data.some((item: Record<string, unknown>) => (item as Record<string, unknown>).newProductHint)) {
          toast.warning('存在新商品（无库存），请手动选择供应商');
        } else if (data.data.some((item: Record<string, unknown>) => (item as Record<string, unknown>).warning)) {
          toast.warning('部分订单存在尾货预警，请注意查看');
        }
        return results;
      } else {
        toast.error(data.error || '匹配失败');
        return null;
      }
    } catch {
      toast.error('匹配请求失败');
      return null;
    } finally {
      setIsMatching(false);
    }
  }, [authHeaders]);

  // Assign single
  const handleAssign = useCallback(async () => {
    if (!assigningOrderId || !selectedSupplierId) {
      toast.error('请选择供应商');
      return;
    }
    const supplier = suppliers.find(s => s.id === selectedSupplierId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          id: assigningOrderId,
          supplierId: selectedSupplierId,
          supplierName: supplier?.name || '',
          status: 'pending',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已分配供应商，订单待派发');
        fetchOrders();
        setAssignDialogOpen(false);
        setAssigningOrderId(null);
        setSelectedSupplierId('');
      } else {
        toast.error(data.error || '分配失败');
      }
    } catch {
      toast.error('分配失败');
    }
  }, [assigningOrderId, selectedSupplierId, suppliers, authHeaders, fetchOrders]);

  // Batch assign from match results
  const handleBatchAssignFromMatch = useCallback(async () => {
    if (Object.keys(selectedSuppliers).length === 0) {
      toast.error('请为订单选择供应商');
      return;
    }
    try {
      const promises = Object.entries(selectedSuppliers).map(([orderId, supplierId]) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return fetch('/api/orders', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            id: orderId,
            supplierId,
            supplierName: supplier?.name || '',
            status: 'pending',
          }),
        });
      });
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map(r => r.json()));
      const successCount = dataArr.filter(d => d.success).length;
      toast.success(`成功分配供应商，共 ${successCount} 条订单待派发`);
      setMatchResults({});
      setSelectedSuppliers({});
      setAssignDialogOpen(false);
      fetchOrders();
    } catch {
      toast.error('批量分配失败');
    }
  }, [selectedSuppliers, suppliers, authHeaders, fetchOrders]);

  // Return tracking
  const handleBatchReturn = useCallback(async (orderIds: string[]) => {
    const lines = returnTrackingNos.trim().split('\n').filter(l => l.trim());
    if (lines.length === 0) {
      toast.error('请输入快递单号');
      return;
    }
    try {
      let matched = 0;
      for (const line of lines) {
        const [trackingNo, expressCompany] = line.split(/[,，\t]/).map(s => s.trim());
        for (const orderId of orderIds) {
          try {
            const res = await fetch('/api/orders', {
              method: 'PATCH',
              headers: authHeaders(),
              body: JSON.stringify({
                id: orderId,
                trackingNo: trackingNo || '',
                expressCompany: expressCompany || returnExpressCompany || '',
                status: 'returned',
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
  }, [returnTrackingNos, returnExpressCompany, authHeaders, fetchOrders]);

  return {
    // Assign dialog
    assignDialogOpen, setAssignDialogOpen,
    assigningOrderId, setAssigningOrderId,
    selectedSupplierId, setSelectedSupplierId,
    selectedSuppliers, setSelectedSuppliers,
    matchResults, setMatchResults,
    isMatching, setIsMatching,
    openAssignDialog,
    doSmartMatch,
    handleAssign,
    handleBatchAssignFromMatch,
    // Return dialog
    returnDialogOpen, setReturnDialogOpen,
    returnTrackingNos, setReturnTrackingNos,
    returnExpressCompany, setReturnExpressCompany,
    handleBatchReturn,
    // Manual select
    manualSelectOpen, setManualSelectOpen,
    manualSelectOrderId, setManualSelectOrderId,
  };
}
