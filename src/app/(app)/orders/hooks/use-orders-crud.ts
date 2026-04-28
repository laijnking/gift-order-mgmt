'use client';

import { useState, useCallback } from 'react';
import { buildUserInfoHeaders } from '@/lib/auth';
import { toast } from 'sonner';
import type { Order } from './use-orders-session';

export function useOrdersCrud({
  authHeaders,
  fetchOrders,
}: {
  authHeaders: () => Record<string, string>;
  fetchOrders: () => Promise<void>;
}) {
  // Create form
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    orderNo: '',
    customerCode: '',
    productName: '',
    productCode: '',
    productSpec: '',
    productBrand: '',
    quantity: 1,
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverProvince: '',
    expressRequirement: '',
    remark: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Edit form
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    orderNo: '',
    customerCode: '',
    productName: '',
    productCode: '',
    productSpec: '',
    productBrand: '',
    quantity: 1,
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverProvince: '',
    expressRequirement: '',
    remark: '',
    status: '',
    supplierId: '',
    supplierName: '',
    expressCompany: '',
    trackingNo: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // Product pickers
  const [createProductPickerOpen, setCreateProductPickerOpen] = useState(false);
  const [editProductPickerOpen, setEditProductPickerOpen] = useState(false);

  // Delete
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrderIds, setDeleteOrderIds] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Create
  const handleCreateOrder = useCallback(async () => {
    if (!createForm.orderNo || !createForm.receiverName || !createForm.receiverPhone) {
      toast.error('请填写必填字段：订单号、收货人、联系电话');
      return;
    }
    if (!createForm.receiverAddress) {
      toast.error('请填写收货地址');
      return;
    }
    setCreateLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          orderNo: createForm.orderNo,
          customerCode: createForm.customerCode || 'UNKNOWN',
          items: [{
            product_name: createForm.productName || '未指定商品',
            product_code: createForm.productCode || '',
            product_spec: createForm.productSpec || '',
            product_brand: createForm.productBrand || '',
            quantity: createForm.quantity || 1,
          }],
          receiver: {
            name: createForm.receiverName,
            phone: createForm.receiverPhone,
            address: createForm.receiverAddress,
            province: createForm.receiverProvince || '',
          },
          expressRequirement: createForm.expressRequirement || '',
          remark: createForm.remark || '',
          source: 'manual',
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('订单创建成功');
        setCreateDialogOpen(false);
        setCreateForm({
          orderNo: '', customerCode: '', productName: '', productCode: '',
          productSpec: '', productBrand: '', quantity: 1,
          receiverName: '', receiverPhone: '', receiverAddress: '',
          receiverProvince: '', expressRequirement: '', remark: '',
        });
        fetchOrders();
      } else {
        toast.error(data.error || '创建订单失败');
      }
    } catch {
      toast.error('创建订单失败');
    } finally {
      setCreateLoading(false);
    }
  }, [createForm, authHeaders, fetchOrders]);

  // Edit
  const openEditDialog = useCallback((order: Order) => {
    const firstItem = order.items?.[0] || {};
    setEditForm({
      id: order.id,
      orderNo: order.orderNo,
      customerCode: order.customerCode || '',
      productName: (firstItem as Record<string, unknown>).cuProductName as string
        || (firstItem as Record<string, unknown>).product_name as string || '',
      productCode: (firstItem as Record<string, unknown>).productCode as string || '',
      productSpec: (firstItem as Record<string, unknown>).productSpec as string
        || (firstItem as Record<string, unknown>).product_spec as string || '',
      productBrand: (firstItem as Record<string, unknown>).productBrand as string || '',
      quantity: firstItem.quantity || 1,
      receiverName: order.receiver.name,
      receiverPhone: order.receiver.phone,
      receiverAddress: order.receiver.address,
      receiverProvince: order.receiver.province || '',
      expressRequirement: (order as unknown as Record<string, string>).expressRequirement || '',
      remark: (order as unknown as Record<string, string>).remark || '',
      status: order.status,
      supplierId: order.supplierId || '',
      supplierName: order.supplierName || '',
      expressCompany: order.expressCompany || '',
      trackingNo: order.trackingNo || '',
    });
    setEditDialogOpen(true);
  }, []);

  const handleUpdateOrder = useCallback(async () => {
    if (!editForm.id) return;
    if (!editForm.receiverName || !editForm.receiverPhone || !editForm.receiverAddress) {
      toast.error('请填写必填字段');
      return;
    }
    setEditLoading(true);
    try {
      const LOCKED_STATUSES = ['returned', 'feedbacked', 'completed', 'cancelled'];
      const updateData: Record<string, unknown> = {
        customer_code: editForm.customerCode || 'UNKNOWN',
        items: [{
          product_name: editForm.productName || '未指定商品',
          product_code: editForm.productCode || '',
          product_spec: editForm.productSpec || '',
          product_brand: editForm.productBrand || '',
          quantity: editForm.quantity || 1,
        }],
        receiver_name: editForm.receiverName,
        receiver_phone: editForm.receiverPhone,
        receiver_address: editForm.receiverAddress,
        province: editForm.receiverProvince || '',
        express_requirement: editForm.expressRequirement || '',
        remark: editForm.remark || '',
      };
      if (!LOCKED_STATUSES.includes(editForm.status)) {
        if (editForm.supplierId) { updateData.supplier_id = editForm.supplierId; updateData.supplier_name = editForm.supplierName; }
        if (editForm.status) updateData.status = editForm.status;
        if (editForm.expressCompany) updateData.express_company = editForm.expressCompany;
        if (editForm.trackingNo) updateData.tracking_no = editForm.trackingNo;
      }
      const res = await fetch(`/api/orders?id=${editForm.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('订单更新成功');
        setEditDialogOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || '更新订单失败');
      }
    } catch {
      toast.error('更新订单失败');
    } finally {
      setEditLoading(false);
    }
  }, [editForm, authHeaders, fetchOrders]);

  // Delete
  const openDeleteConfirm = useCallback((orderIds: string[]) => {
    setDeleteOrderIds(orderIds);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteOrder = useCallback(async () => {
    if (!deleteOrderIds.length) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/orders?ids=${deleteOrderIds.join(',')}`, {
        method: 'DELETE',
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || '删除成功');
        setDeleteDialogOpen(false);
        setDeleteOrderIds([]);
        fetchOrders();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch {
      toast.error('删除失败');
    } finally {
      setDeleteLoading(false);
    }
  }, [deleteOrderIds, fetchOrders]);

  // Status helpers
  const getDeleteDisabledReason = (order: Order): string | null => {
    const s = order.status;
    if (s === 'assigned') return '订单已派发发货方，无法删除';
    if (s === 'partial_returned') return '订单正在回单处理中，无法删除';
    if (s === 'returned') return '订单已回单，需先完成客户反馈/财务处理，无法删除';
    if (s === 'feedbacked') return '订单已反馈客户，等待导出金蝶，无法删除';
    if (s === 'completed') return '订单已导出金蝶归档，无法删除';
    return null;
  };

  const canDeleteOrder = (order: Order): boolean =>
    !['assigned', 'partial_returned', 'returned', 'feedbacked', 'completed'].includes(order.status);

  const canEditOrder = (order: Order): boolean =>
    order.status !== 'completed';

  return {
    // Create
    createDialogOpen, setCreateDialogOpen,
    createForm, setCreateForm,
    createLoading,
    handleCreateOrder,
    createProductPickerOpen, setCreateProductPickerOpen,
    openCreateDialog: (autoOrderNo?: string) => {
      setCreateForm(prev => ({ ...prev, orderNo: autoOrderNo || prev.orderNo }));
      setCreateDialogOpen(true);
    },
    // Edit
    editDialogOpen, setEditDialogOpen,
    editForm, setEditForm,
    editLoading,
    openEditDialog,
    handleUpdateOrder,
    editProductPickerOpen, setEditProductPickerOpen,
    // Delete
    deleteDialogOpen, setDeleteDialogOpen,
    deleteOrderIds, setDeleteOrderIds,
    deleteLoading,
    openDeleteConfirm,
    handleDeleteOrder,
    // Helpers
    getDeleteDisabledReason,
    canDeleteOrder,
    canEditOrder,
  };
}
