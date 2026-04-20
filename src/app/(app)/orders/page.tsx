'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { getOrderStatusBadgeClass, getOrderStatusLabel, isReturnProgressStatus, ORDER_STATUS_OPTIONS } from '@/lib/order-status';
import { toast } from 'sonner';
import {
  Package,
  Search,
  Upload,
  Download,
  RefreshCw,
  Eye,
  CheckCircle,
  Truck,
  MoreHorizontal,
  Plus,
  Send,
  Archive,
  MessageSquare,
  FileInput,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Store,
  X,
  AlertTriangle,
  Bell,
  BellOff,
  Trash2,
  Edit,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
  Sparkles,
  Loader2,
  Circle,
  Check,
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders, getCurrentUser, getUserDataScope } from '@/lib/auth';

interface Order {
  id: string;
  sysOrderNo?: string;
  orderNo: string;
  billNo?: string;
  billDate?: string;
  supplierOrderNo?: string;
  status: string;
  items: Array<{
    // 系统商品档案信息
    productId?: string | null;
    productName: string;
    productSpec?: string;
    productCode?: string;
    unitPrice?: number | null;
    // 客户原始商品信息
    cuProductName?: string;
    cuProductCode?: string;
    cuProductSpec?: string;
    // 订单商品信息
    quantity: number;
    price?: number;
    amount?: number;
    discount?: number;
    tax_rate?: number;
    warehouse?: string;
    remark?: string;
    // 匹配信息
    matchType?: string;
    matchHint?: string;
    // 兼容旧字段
    product_name?: string;
    product_spec?: string;
    product_code?: string;
  }>;
  receiver: {
    name: string;
    phone: string;
    address: string;
    province?: string;
    city?: string;
    district?: string;
  };
  customerCode?: string;
  customerName?: string;
  salesperson?: string;
  salespersonName?: string;
  operatorName?: string;
  supplierId?: string;
  supplierName?: string;
  importBatch?: string;
  assignedBatch?: string;
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
  extFields?: Record<string, string | null>;
  createdAt: string;
  updatedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  province?: string;
}

interface Customer {
  code: string;
  name: string;
}

// 预警记录接口
interface AlertRecord {
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

// 预警级别配置
const ALERT_LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  info: { label: '提示', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  warning: { label: '警告', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  error: { label: '错误', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  critical: { label: '严重', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
};

// 可用筛选字段
const FILTERABLE_FIELDS = [
  { key: 'orderNo', label: '订单号', placeholder: '输入订单号' },
  { key: 'productName', label: '商品名称/型号', placeholder: '输入商品名称或型号' },
  { key: 'customerInfo', label: '客户信息', placeholder: '输入客户名称或编码' },
  { key: 'phone', label: '电话号码', placeholder: '输入电话号码' },
  { key: 'supplierName', label: '供应商', placeholder: '输入供应商名称' },
  { key: 'salesperson', label: '业务员', placeholder: '输入业务员姓名' },
  { key: 'operator', label: '跟单员', placeholder: '输入跟单员姓名' },
  { key: 'receiverName', label: '收货人', placeholder: '输入收货人姓名' },
  { key: 'address', label: '收货地址', placeholder: '输入收货地址关键词' },
  { key: 'trackingNo', label: '快递单号', placeholder: '输入快递单号' },
  { key: 'expressCompany', label: '快递公司', placeholder: '输入快递公司名称' },
  { key: 'importBatch', label: '导入批次', placeholder: '输入导入批次号' },
];

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // 预警相关状态
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [alertPanelOpen, setAlertPanelOpen] = useState(true);
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  // Common filter state
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [customerFilter, setCustomerFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [searchFields, setSearchFields] = useState<Record<string, string>>({
    orderNo: '',
    productName: '',
    customerInfo: '',
    phone: '',
  });

  // Advanced filter state
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [advancedFields, setAdvancedFields] = useState<Record<string, string>>({});

  // 滚动相关状态
  const [isStickyTop, setIsStickyTop] = useState(false);
  const [isTableHeaderSticky, setIsTableHeaderSticky] = useState(false);
  const [filterHeight, setFilterHeight] = useState(0);

  // 获取筛选区域高度
  useEffect(() => {
    const updateFilterHeight = () => {
      const filterCard = document.getElementById('filter-card');
      if (filterCard) {
        const rect = filterCard.getBoundingClientRect();
        setFilterHeight(rect.height + 16); // 加上 margin
      }
    };

    // 初始和窗口大小变化时更新
    updateFilterHeight();
    window.addEventListener('resize', updateFilterHeight);
    
    // 监听筛选展开/收起
    const observer = new MutationObserver(updateFilterHeight);
    const filterCard = document.getElementById('filter-card');
    if (filterCard) {
      observer.observe(filterCard, { attributes: true, childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('resize', updateFilterHeight);
      observer.disconnect();
    };
  }, [showAdvancedFilter, statusFilter, customerFilter, supplierFilter]);

  // 滚动监听处理
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      // 常用操作区域置顶（页面头部约100px后开始）
      setIsStickyTop(scrollY > 100);
      // 表头置顶（筛选区高度 + 常用操作高度 + 间距）
      // 常用操作约 60px，筛选区约 80px（收起）/ 160px（展开）
      const threshold = filterHeight + 80;
      setIsTableHeaderSticky(scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [filterHeight]);
  const [selectedOrders, setSelectedOrders] = useState<Set<Order>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null);
  // 按行选择供应商（单个派发）
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  // 批量派发时每个订单选择的供应商
  const [selectedSuppliers, setSelectedSuppliers] = useState<Record<string, string>>({});
  // 供应商筛选搜索
  const [supplierSearch, setSupplierSearch] = useState('');
  
  // 智能匹配相关状态
  const [matchResults, setMatchResults] = useState<Record<string, {
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
  }>>({});
  const [isMatching, setIsMatching] = useState(false);
  const [showMatchDetails, setShowMatchDetails] = useState(false);

  // 手动选择供应商对话框
  const [manualSelectOpen, setManualSelectOpen] = useState(false);
  const [manualSelectOrderId, setManualSelectOrderId] = useState<string | null>(null);
  const [manualSelectSupplierId, setManualSelectSupplierId] = useState<string>('');
  const [manualSelectSupplierName, setManualSelectSupplierName] = useState('');

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnTrackingNos, setReturnTrackingNos] = useState('');
  const [returnExpressCompany, setReturnExpressCompany] = useState('');

  // 新增订单对话框
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    orderNo: '',
    customerCode: '',
    productName: '',
    quantity: 1,
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverProvince: '',
    expressRequirement: '',
    remark: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // 编辑订单对话框
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    id: '',
    orderNo: '',
    customerCode: '',
    productName: '',
    quantity: 1,
    receiverName: '',
    receiverPhone: '',
    receiverAddress: '',
    receiverProvince: '',
    expressRequirement: '',
    remark: '',
    status: '',
  });
  const [editLoading, setEditLoading] = useState(false);

  // 删除确认对话框
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrderIds, setDeleteOrderIds] = useState<string[]>([]);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...buildUserInfoHeaders(),
    }),
    []
  );

  useEffect(() => {
    const importBatch = searchParams.get('importBatch')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    if (importBatch) {
      setAdvancedFields((prev) => {
        if (prev.importBatch === importBatch) {
          return prev;
        }
        return {
          ...prev,
          importBatch,
        };
      });

      setShowAdvancedFilter(true);
    }

    if (status && ORDER_STATUS_OPTIONS.some((option) => option.value === status)) {
      setStatusFilter((prev) => (prev === status ? prev : status));
      setSelectedStatuses((prev) => (prev.length === 0 ? prev : []));
    } else if (status === 'all') {
      setStatusFilter('');
      setSelectedStatuses([]);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      // 获取当前用户信息用于数据权限过滤
      const currentUser = getCurrentUser();
      const userInfo = {
        username: currentUser?.username || '',
        role: currentUser?.role || '',
        dataScope: getUserDataScope(currentUser),
      };

      const params = new URLSearchParams();
      const importBatch = searchParams.get('importBatch')?.trim();
      const status = searchParams.get('status')?.trim();
      if (importBatch) {
        params.set('importBatch', importBatch);
      }
      if (status && status !== 'all') {
        params.set('status', status);
      }

      const res = await fetch(`/api/orders${params.toString() ? `?${params.toString()}` : ''}`, {
        headers: {
          'x-user-info': JSON.stringify(userInfo),
        },
      });
      const data = await res.json();
      if (data.success) {
        setOrders(data.data || []);
      } else {
        toast.error(data.error || '获取订单失败');
      }
    } catch (error) {
      console.error('获取订单失败:', error);
      toast.error('获取订单失败');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  // 获取预警记录
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alert-records?isResolved=false&limit=50', {
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
        setUnreadAlertCount((data.data || []).filter((a: AlertRecord) => !a.isRead).length);
      }
    } catch (error) {
      console.error('获取预警记录失败');
    }
  }, []);

  // 标记预警为已读
  const markAlertAsRead = useCallback(async (alertId: string) => {
    try {
      await fetch('/api/alert-records', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ ids: [alertId], isRead: true }),
      });
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
      setUnreadAlertCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记已读失败');
    }
  }, [authHeaders]);

  // 标记所有预警为已读
  const markAllAlertsAsRead = useCallback(async () => {
    const unreadIds = alerts.filter(a => !a.isRead).map(a => a.id);
    try {
      await Promise.all(unreadIds.map(id =>
        fetch('/api/alert-records', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ ids: [id], isRead: true }),
        })
      ));
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
      setUnreadAlertCount(0);
      toast.success('已全部标记为已读');
    } catch (error) {
      console.error('批量标记已读失败');
    }
  }, [alerts, authHeaders]);

// 预警类型定义
interface OrderAlertSummary {
  type: 'pending_to_assign' | 'assigned_to_returned' | 'overdue_24h';
  label: string;
  description: string;
  count: number;
  orders: Order[];
}

// 计算预警统计
const calculateOrderAlerts = useMemo(() => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today16 = new Date(today.getTime() + 16 * 60 * 60 * 1000); // 当天16:00
  const tomorrow10 = new Date(today.getTime() + 34 * 60 * 60 * 1000); // 次日10:00
  
  const alerts: OrderAlertSummary[] = [];
  
  // a. 待发货 -> 通知发货：当天16:00未派发
  const pendingToAssign = orders.filter(o => {
    if (o.status !== 'pending') return false;
    const createdAt = new Date(o.createdAt);
    return createdAt < today16 && now >= today16;
  });
  alerts.push({
    type: 'pending_to_assign',
    label: '待发货超时',
    description: '当天16:00前未通知供应商发货',
    count: pendingToAssign.length,
    orders: pendingToAssign,
  });
  
  // b. 通知发货 -> 导入回单：次日10点未回单
  const assignedToReturned = orders.filter(o => {
    if (o.status !== 'assigned') return false;
    const createdAt = new Date(o.createdAt);
    return createdAt < tomorrow10 && now >= tomorrow10;
  });
  alerts.push({
    type: 'assigned_to_returned',
    label: '回单超时',
    description: '通知发货后次日10:00前未导入回单',
    count: assignedToReturned.length,
    orders: assignedToReturned,
  });
  
  // c. 待发货 -> 反馈给客户：超过24小时
  const overdue24h = orders.filter(o => {
    const createdAt = new Date(o.createdAt);
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const isOver24h = hoursDiff > 24;
    const isNotCompleted = o.status !== 'completed' && o.status !== 'cancelled';
    return isOver24h && isNotCompleted;
  });
  alerts.push({
    type: 'overdue_24h',
    label: '时效超时',
    description: '从录入到反馈超过24小时',
    count: overdue24h.length,
    orders: overdue24h,
  });
  
  return alerts;
}, [orders]);

// 滚动监听处理
useEffect(() => {
  const handleScroll = () => {
    const scrollY = window.scrollY;
    
    // 常用操作区域置顶
    setIsStickyTop(scrollY > 100);
    
    // 表头置顶：当滚动超过常用操作+筛选区域后
    setIsTableHeaderSticky(scrollY > 180);
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
  return () => window.removeEventListener('scroll', handleScroll);
}, []);

  // 搜索索引 - 用于快速定位筛选项
  const searchIndex = useMemo(() => {
    const index: Record<string, Set<string>> = {};
    
    orders.forEach(order => {
      // 订单号索引
      if (order.orderNo) {
        if (!index.orderNo) index.orderNo = new Set();
        index.orderNo.add(order.orderNo.toLowerCase());
      }
      if (order.sysOrderNo) {
        if (!index.orderNo) index.orderNo = new Set();
        index.orderNo.add(order.sysOrderNo.toLowerCase());
      }
      
      // 商品名称索引（包括客户原始商品名称和系统商品名称）
      order.items.forEach(item => {
        // 索引客户原始商品名称
        const cuName = (item as Record<string, unknown>).cuProductName as string || (item as Record<string, unknown>).product_name as string;
        if (cuName) {
          if (!index.productName) index.productName = new Set();
          index.productName.add(cuName.toLowerCase());
        }
        // 索引系统商品名称（如果不同）
        const sysName = (item as Record<string, unknown>).productName as string;
        if (sysName && sysName !== cuName) {
          if (!index.productName) index.productName = new Set();
          index.productName.add(sysName.toLowerCase());
        }
      });
      
      // 客户信息索引
      if (order.customerName) {
        if (!index.customerInfo) index.customerInfo = new Set();
        index.customerInfo.add(order.customerName.toLowerCase());
      }
      if (order.customerCode) {
        if (!index.customerInfo) index.customerInfo = new Set();
        index.customerInfo.add(order.customerCode.toLowerCase());
      }
      
      // 电话索引
      if (order.receiver.phone) {
        if (!index.phone) index.phone = new Set();
        index.phone.add(order.receiver.phone);
      }
    });
    
    return index;
  }, [orders]);

  // 新增订单
  const handleCreateOrder = async () => {
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
      const orderData = {
        orderNo: createForm.orderNo,
        customerCode: createForm.customerCode || 'UNKNOWN',
        items: [{
          product_name: createForm.productName || '未指定商品',
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
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(orderData),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('订单创建成功');
        setCreateDialogOpen(false);
        setCreateForm({
          orderNo: '',
          customerCode: '',
          productName: '',
          quantity: 1,
          receiverName: '',
          receiverPhone: '',
          receiverAddress: '',
          receiverProvince: '',
          expressRequirement: '',
          remark: '',
        });
        fetchOrders();
      } else {
        toast.error(data.error || '创建订单失败');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败');
    } finally {
      setCreateLoading(false);
    }
  };

  // 编辑订单
  const handleEditOrder = (order: Order) => {
    const firstItem = order.items?.[0] || {};
    setEditForm({
      id: order.id,
      orderNo: order.orderNo,
      customerCode: order.customerCode || '',
      productName: (firstItem as Record<string, unknown>).cuProductName as string || (firstItem as Record<string, unknown>).product_name as string || '',
      quantity: firstItem.quantity || 1,
      receiverName: order.receiver.name,
      receiverPhone: order.receiver.phone,
      receiverAddress: order.receiver.address,
      receiverProvince: order.receiver.province || '',
      expressRequirement: (order as unknown as Record<string, string>).expressRequirement || '',
      remark: (order as unknown as Record<string, string>).remark || '',
      status: order.status,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!editForm.id) return;
    
    if (!editForm.receiverName || !editForm.receiverPhone || !editForm.receiverAddress) {
      toast.error('请填写必填字段');
      return;
    }
    
    setEditLoading(true);
    try {
      const res = await fetch(`/api/orders?id=${editForm.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          customerCode: editForm.customerCode || 'UNKNOWN',
          items: [{
            product_name: editForm.productName || '未指定商品',
            quantity: editForm.quantity || 1,
          }],
          receiver: {
            name: editForm.receiverName,
            phone: editForm.receiverPhone,
            address: editForm.receiverAddress,
            province: editForm.receiverProvince || '',
          },
          expressRequirement: editForm.expressRequirement || '',
          remark: editForm.remark || '',
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('订单更新成功');
        setEditDialogOpen(false);
        fetchOrders();
      } else {
        toast.error(data.error || '更新订单失败');
      }
    } catch (error) {
      console.error('更新订单失败:', error);
      toast.error('更新订单失败');
    } finally {
      setEditLoading(false);
    }
  };

  // 删除订单
  const handleDeleteOrder = async () => {
    if (deleteOrderIds.length === 0) return;
    
    setDeleteLoading(true);
    try {
      const idsParam = deleteOrderIds.join(',');
      const res = await fetch(`/api/orders?ids=${idsParam}`, {
        method: 'DELETE',
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message || '删除成功');
        setDeleteDialogOpen(false);
        setDeleteOrderIds([]);
        setSelectedOrders(new Set());
        fetchOrders();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除订单失败:', error);
      toast.error('删除订单失败');
    } finally {
      setDeleteLoading(false);
    }
  };

  const openDeleteConfirm = (order?: Order) => {
    if (order) {
      setDeleteOrderIds([order.id]);
    } else if (selectedOrders.size > 0) {
      setDeleteOrderIds(Array.from(selectedOrders).map(o => o.id));
    }
    setDeleteDialogOpen(true);
  };

  // 获取订单不可删除的原因
  const getDeleteDisabledReason = (order: Order): string | null => {
    if (order.status === 'assigned') return '订单已派发供应商，无法删除';
    if (order.status === 'partial_returned') return '订单正在回单处理中，无法删除';
    if (order.status === 'returned') return '订单已回单，需先完成客户反馈/财务处理，无法删除';
    if (order.status === 'feedbacked') return '订单已反馈客户，等待导出金蝶，无法删除';
    if (order.status === 'completed') return '订单已导出金蝶归档，无法删除';
    return null;
  };

  // 获取订单不可编辑的原因
  const getEditDisabledReason = (order: Order): string | null => {
    if (order.status === 'completed') return '订单已导出金蝶归档，无法编辑';
    if (order.status === 'feedbacked') return '订单已反馈客户，建议仅做财务归档处理';
    if (order.status === 'partial_returned') return '订单正在回单处理中，编辑功能受限';
    return null;
  };

  // 获取当前订单可编辑的字段提示
  const getEditableFieldsHint = (order: Order): string => {
    if (order.status === 'pending') return '可编辑所有信息';
    if (order.status === 'assigned') return '仅可编辑收货人、电话、地址、备注';
    if (order.status === 'returned') return '可修正快递信息、收货信息、备注';
    if (order.status === 'feedbacked') return '已反馈客户，建议不再修改业务信息';
    if (order.status === 'partial_returned') return '仅可编辑收货人、电话、地址、备注';
    if (order.status === 'cancelled') return '可编辑所有信息';
    return '';
  };

  // 检查订单是否可以删除（进入业务闭环后的订单不能直接删除）
  const canDeleteOrder = (order: Order): boolean => {
    return !['assigned', 'partial_returned', 'returned', 'feedbacked', 'completed'].includes(order.status);
  };

  // 检查订单是否可以编辑（已导出金蝶归档后不能编辑）
  const canEditOrder = (order: Order): boolean => {
    return order.status !== 'completed';
  };

  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success) {
        setSuppliers((data.data || []).filter((s: Supplier) => s.id && s.name));
      }
    } catch (error) {
      console.error('获取供应商失败');
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers((data.data || []).filter((c: Customer) => c.code && c.name));
      }
    } catch (error) {
      console.error('获取客户失败');
    }
  }, []);

  // 初始化加载数据
  useEffect(() => {
    fetchOrders();
    fetchSuppliers();
    fetchCustomers();
    fetchAlerts();
  }, [fetchOrders, fetchSuppliers, fetchCustomers, fetchAlerts]);

  // 模糊搜索匹配函数
  const fuzzyMatch = (text: string | undefined, query: string): boolean => {
    if (!query) return true;
    if (!text) return false;
    const textLower = text.toLowerCase();
    const queryLower = query.toLowerCase();
    // 支持前缀匹配和包含匹配
    return textLower.startsWith(queryLower) || textLower.includes(queryLower);
  };

  // 模糊搜索建议（基于索引）
  const getSuggestions = (field: string, query: string): string[] => {
    if (!query || !searchIndex[field]) return [];
    const suggestions: Set<string> = new Set();
    const queryLower = query.toLowerCase();
    searchIndex[field].forEach(value => {
      if (value.includes(queryLower)) {
        suggestions.add(value);
      }
    });
    return Array.from(suggestions).slice(0, 10);
  };

  // Combined filter logic - 默认排除已归档状态
  const filteredOrders = orders.filter((order) => {
    // 默认筛选：排除已归档状态（completed, cancelled）
    const archiveStatuses = ['completed', 'cancelled'];
    const isArchived = archiveStatuses.includes(order.status);
    const hasExplicitStatusFilter = statusFilter !== '' || selectedStatuses.length > 0;
    if (!hasExplicitStatusFilter && isArchived) return false;

    // Status filter - 支持单选或多选
    const hasSingleStatusFilter = statusFilter !== '';
    const hasMultiStatusFilter = selectedStatuses.length > 0;
    if (hasSingleStatusFilter && order.status !== statusFilter) return false;
    if (hasMultiStatusFilter && !selectedStatuses.includes(order.status)) return false;

    // Customer filter
    if (customerFilter && order.customerCode !== customerFilter) return false;

    // Supplier filter
    if (supplierFilter && order.supplierId !== supplierFilter) return false;

    // Search fields - 使用模糊匹配
    const allSearchFields = { ...searchFields, ...advancedFields };
    for (const [key, value] of Object.entries(allSearchFields)) {
      if (!value.trim()) continue;
      const q = value.trim().toLowerCase();
      let matched = false;
      switch (key) {
        case 'orderNo':
          matched = fuzzyMatch(order.orderNo, q) || fuzzyMatch(order.sysOrderNo, q);
          break;
        case 'productName':
          matched = order.items.some(
            (item) =>
              fuzzyMatch(item.product_name, q) || fuzzyMatch(item.product_spec, q)
          );
          break;
        case 'customerInfo':
          matched = fuzzyMatch(order.customerName, q) || fuzzyMatch(order.customerCode, q);
          break;
        case 'phone':
          matched = order.receiver.phone?.includes(q);
          break;
        case 'supplierName':
          matched = fuzzyMatch(order.supplierName, q);
          break;
        case 'salesperson':
          matched = fuzzyMatch(order.salespersonName, q);
          break;
        case 'operator':
          matched = fuzzyMatch(order.operatorName, q);
          break;
        case 'receiverName':
          matched = fuzzyMatch(order.receiver.name, q);
          break;
        case 'address':
          matched = fuzzyMatch(order.receiver.address, q);
          break;
        case 'trackingNo':
          matched = fuzzyMatch(order.trackingNo, q);
          break;
        case 'expressCompany':
          matched = fuzzyMatch(order.expressCompany, q);
          break;
        case 'importBatch':
          matched = fuzzyMatch(order.assignedBatch, q) || fuzzyMatch((order as Order & { importBatch?: string }).importBatch, q);
          break;
      }
      if (!matched) return false;
    }

    return true;
  });

  const handleSelectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders));
    }
  };

  const handleSelectOrder = (order: Order) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(order)) {
      newSelected.delete(order);
    } else {
      newSelected.add(order);
    }
    setSelectedOrders(newSelected);
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  // --- Assign supplier ---
  const handleAssign = async () => {
    if (!assigningOrderId || !selectedSupplierId) {
      toast.error('请选择供应商');
      return;
    }

    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      // 选定供应商后进入"待派发"状态（pending）
      // 导出发货通知单后才进入"已派发"状态（assigned）
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          id: assigningOrderId,
          supplierId: selectedSupplierId,
          supplierName: supplier?.name || '',
          status: 'pending', // 改为待派发状态
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
    } catch (error) {
      toast.error('分配失败');
    }
  };

  const handleBatchAssign = async () => {
    if (selectedOrders.size === 0 || !selectedSupplierId) {
      toast.error('请选择订单和供应商');
      return;
    }

    try {
      const supplier = suppliers.find((s) => s.id === selectedSupplierId);
      const orderIds = Array.from(selectedOrders).map(o => o.id);
      const promises = orderIds.map((orderId) =>
        fetch('/api/orders', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            id: orderId,
            supplierId: selectedSupplierId,
            supplierName: supplier?.name || '',
            status: 'pending', // 改为待派发状态
          }),
        })
      );
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map((r) => r.json()));
      const successCount = dataArr.filter((d) => d.success).length;
      toast.success(`成功分配供应商，共 ${successCount} 条订单待派发`);
      setSelectedOrders(new Set());
      setAssignDialogOpen(false);
      setSelectedSupplierId('');
      setSelectedSuppliers({});
      fetchOrders();
    } catch (error) {
      toast.error('批量分配失败');
    }
  };

  // 从匹配结果按行选择供应商进行派发
  const handleBatchAssignFromMatch = async () => {
    if (Object.keys(selectedSuppliers).length === 0) {
      toast.error('请为订单选择供应商');
      return;
    }

    try {
      const promises = Object.entries(selectedSuppliers).map(([orderId, supplierId]) => {
        const supplier = suppliers.find((s) => s.id === supplierId);
        return fetch('/api/orders', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({
            id: orderId,
            supplierId: supplierId,
            supplierName: supplier?.name || '',
            status: 'pending',
          }),
        });
      });
      
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map((r) => r.json()));
      const successCount = dataArr.filter((d) => d.success).length;
      
      toast.success(`成功分配供应商，共 ${successCount} 条订单待派发`);
      setSelectedOrders(new Set());
      setAssignDialogOpen(false);
      setSelectedSuppliers({});
      setMatchResults({});
      fetchOrders();
    } catch (error) {
      toast.error('批量分配失败');
    }
  };

  // 智能匹配供应商
  const handleSmartMatch = async () => {
    const targetOrderIds = assigningOrderId 
      ? [assigningOrderId]
      : Array.from(selectedOrders).map(order => order.id);
    
    if (targetOrderIds.length === 0) {
      toast.error('请选择要分配的订单');
      return;
    }

    setIsMatching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderIds: targetOrderIds }),
      });
      const data = await res.json();
      
      if (data.success) {
        const results: typeof matchResults = {};
        data.data.forEach((item: {
          orderId: string;
          recommendedSupplier: { id: string; name: string; type?: string; province?: string; provinceMatch?: string } | null;
          matchReasons: string[];
          warning?: string;
          receiverProvince?: string | null;
          productName?: string;
          productCode?: string;
          quantity?: number;
          allSupplierOptions: Array<{
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
        }) => {
          results[item.orderId] = {
            recommendedSupplier: item.recommendedSupplier,
            alternativeSuppliers: item.allSupplierOptions.slice(1, 4).map((s: { supplierId: string; supplierName: string }) => ({ id: s.supplierId, name: s.supplierName })),
            matchReasons: item.matchReasons || [],
            warning: item.warning,
            receiverProvince: item.receiverProvince,
            productName: item.productName,
            productCode: item.productCode,
            quantity: item.quantity,
            availableSuppliers: item.allSupplierOptions,
            hasStockForProduct: item.hasStockForProduct,
            newProductHint: item.newProductHint,
          };
        });
        setMatchResults(results);
        
        // 如果有推荐供应商，自动选中
        if (data.data.length === 1 && data.data[0].recommendedSupplier) {
          setSelectedSupplierId(data.data[0].recommendedSupplier.id);
        }
        
        // 显示警告信息
        if (data.data.some((item: { newProductHint?: string }) => item.newProductHint)) {
          toast.warning('存在新商品（无库存），请手动选择供应商');
        } else if (data.data.some((item: { warning?: string }) => item.warning)) {
          toast.warning('部分订单存在尾货预警，请注意查看');
        }
      } else {
        toast.error(data.error || '匹配失败');
      }
    } catch (error) {
      toast.error('匹配请求失败');
      console.error(error);
    } finally {
      setIsMatching(false);
    }
  };

  const openAssignDialog = (orderId: string | null) => {
    setAssigningOrderId(orderId);
    setSelectedSupplierId('');
    setMatchResults({});
    setShowMatchDetails(false);
    setAssignDialogOpen(true);
    
    // 如果是单个订单，自动触发智能匹配
    if (orderId) {
      setTimeout(() => {
        handleSmartMatchForSingle(orderId);
      }, 100);
    }
  };
  
  // 为单个订单快速匹配
  const handleSmartMatchForSingle = async (orderId: string) => {
    setIsMatching(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ orderIds: [orderId] }),
      });
      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        const item = data.data[0];
        setMatchResults({
          [orderId]: {
            recommendedSupplier: item.recommendedSupplier,
            alternativeSuppliers: item.allSupplierOptions?.slice(1, 4).map((s: { supplierId: string; supplierName: string }) => ({ id: s.supplierId, name: s.supplierName })) || [],
            matchReasons: item.matchReasons || [],
            warning: item.warning,
            receiverProvince: item.receiverProvince,
            productName: item.productName,
            productCode: item.productCode,
            quantity: item.quantity,
            availableSuppliers: item.allSupplierOptions || [],
            hasStockForProduct: item.hasStockForProduct,
            newProductHint: item.newProductHint,
          }
        });
        
        // 自动选中推荐供应商
        if (item.recommendedSupplier) {
          setSelectedSupplierId(item.recommendedSupplier.id);
        }
        
        if (item.warning) {
          toast.warning(item.warning);
        }
        if (item.newProductHint) {
          toast.info(item.newProductHint);
        }
      }
    } catch (error) {
      console.error('快速匹配失败:', error);
    } finally {
      setIsMatching(false);
    }
  };

  // --- Return tracking (物流回单) ---
  const handleBatchReturn = async () => {
    if (!returnTrackingNos.trim()) {
      toast.error('请输入快递单号');
      return;
    }
    const lines = returnTrackingNos.trim().split('\n').filter((l) => l.trim());
    if (lines.length === 0) {
      toast.error('请输入快递单号');
      return;
    }

    // For selected orders, try to match tracking numbers
    try {
      let matched = 0;
      for (const line of lines) {
        const [trackingNo, expressCompany] = line.split(/[,，\t]/).map((s) => s.trim());
        // Find order by various criteria, or just apply to selected orders
        const targetOrders = selectedOrders.size > 0
          ? selectedOrders
          : orders
              .filter((o) => o.status === 'assigned' || o.status === 'partial_returned')
              .map((o) => o.id);

        // Apply to each selected order if tracking provided
        for (const orderId of targetOrders) {
          const order = orders.find((o) => o.id === orderId);
          if (order && (order.status === 'assigned' || order.status === 'partial_returned')) {
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
            } catch {
              // skip
            }
          }
        }
      }
      toast.success(`成功回单 ${matched} 条订单`);
      setReturnDialogOpen(false);
      setReturnTrackingNos('');
      setReturnExpressCompany('');
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      toast.error('回单失败');
    }
  };

  // --- Ship orders (供应商发货) ---
  const handleBatchShip = async () => {
    const targetIds: string[] = selectedOrders.size > 0
      ? Array.from(selectedOrders).map(o => o.id)
      : filteredOrders.filter((o) => o.status === 'assigned').map((o) => o.id);

    if (targetIds.length === 0) {
      toast.error('没有可发货的订单');
      return;
    }
    // Ship means marking assigned orders as having tracking info
    toast.info('请通过"物流回单"功能录入快递单号完成发货');
  };

  // --- Export to Kingdee and archive (导出金蝶并归档) ---
  const handleExportKingdee = async () => {
    const targetIds: string[] = selectedOrders.size > 0
      ? Array.from(selectedOrders).map(o => o.id)
      : filteredOrders.filter((o) => o.status === 'feedbacked').map((o) => o.id);

    if (targetIds.length === 0) {
      toast.error('没有可导出金蝶的订单（需已反馈状态）');
      return;
    }

    try {
      const targetOrders = orders.filter((o) => targetIds.includes(o.id) && o.status === 'feedbacked');
      const header = '系统单号\t客户单号\t客户\t收货人\t电话\t地址\t商品\t数量\t供应商\t快递公司\t快递单号\t业务员\t跟单员\t派发批次';
      const rows = targetOrders.map((o) => [
        o.sysOrderNo || '',
        o.orderNo || '',
        o.customerName || '',
        o.receiver.name || '',
        o.receiver.phone || '',
        o.receiver.address || '',
        o.items.map((i) => i.productName || i.cuProductName || '').join('; '),
        o.items.reduce((sum, item) => sum + (item.quantity || 0), 0),
        o.supplierName || '',
        o.expressCompany || '',
        o.trackingNo || '',
        o.salespersonName || o.salesperson || '',
        o.operatorName || '',
        o.assignedBatch || '',
      ].join('\t'));

      const blob = new Blob(['﻿' + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `金蝶导出_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      const promises = targetIds.map((id) =>
        fetch('/api/orders', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ id, status: 'completed' }),
        })
      );
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map((r) => r.json()));
      const successCount = dataArr.filter((d) => d.success).length;
      toast.success(`已导出金蝶并归档 ${successCount} 条订单`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      toast.error('导出金蝶失败');
    }
  };

  // --- Ship notice (发货通知) ---
  const handleShipNotice = async () => {
    const hasAssignedOrders = selectedOrders.size > 0
      ? Array.from(selectedOrders).some((o) => o.status === 'assigned')
      : filteredOrders.some((o) => o.status === 'assigned');

    if (!hasAssignedOrders) {
      toast.error('请先选择已派发给供应商的订单');
      return;
    }

    toast.info('发货通知单请在“发货通知单”页面按供应商批量导出');
    window.location.href = '/shipping-export';
  };

  // --- Feedback to customer (反馈给客户) ---
  const handleFeedback = async () => {
    const targetIds: string[] = selectedOrders.size > 0
      ? Array.from(selectedOrders).map(o => o.id)
      : filteredOrders.filter((o) => o.status === 'returned').map((o) => o.id);

    if (targetIds.length === 0) {
      toast.error('没有可反馈的订单（需已回单状态）');
      return;
    }

    const targetOrders = orders.filter((o) => targetIds.includes(o.id) && o.status === 'returned');
    const lines = targetOrders.map(
      (o) =>
        `${o.sysOrderNo || o.orderNo}\t${o.receiver.name}\t${o.receiver.phone}\t${o.receiver.address}\t${o.supplierName || '-'}\t${o.trackingNo || '-'}\t${o.expressCompany || '-'}`
    );
    const text = `系统单号\t收货人\t电话\t地址\t供应商\t快递单号\t快递公司\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text);

    try {
      const promises = targetOrders.map((order) =>
        fetch('/api/orders', {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ id: order.id, status: 'feedbacked' }),
        })
      );
      const results = await Promise.all(promises);
      const dataArr = await Promise.all(results.map((r) => r.json()));
      const successCount = dataArr.filter((d) => d.success).length;
      toast.success(`已复制 ${targetOrders.length} 条订单信息，并标记 ${successCount} 条为已反馈`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      toast.warning('已复制反馈内容，但状态标记失败，请稍后重试');
    }
  };

  // --- Export ---
  const handleExport = () => {
    const orderIds = selectedOrders.size > 0
      ? Array.from(selectedOrders).map(o => o.id)
      : [];
    const targetOrders = orderIds.length > 0
      ? filteredOrders.filter((o) => orderIds.includes(o.id))
      : filteredOrders;

    if (targetOrders.length === 0) {
      toast.error('没有可导出的订单');
      return;
    }

    const header = '系统单号\t客户单号\t客户\t收货人\t电话\t地址\t商品\t数量\t单价\t业务员\t跟单员\t状态\t供应商\t快递公司\t快递单号\t创建时间';
    const rows = targetOrders.map((o) =>
      [
        o.sysOrderNo || '',
        o.orderNo,
        o.customerName || '',
        o.receiver.name,
        o.receiver.phone,
        o.receiver.address,
        o.items.map((i) => i.product_name).join('; '),
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.items.reduce((s, i) => s + (i.price || 0), 0).toFixed(2),
        o.salespersonName || '',
        o.operatorName || '',
        getOrderStatusLabel(o.status),
        o.supplierName || '',
        o.expressCompany || '',
        o.trackingNo || '',
        new Date(o.createdAt).toLocaleString('zh-CN'),
      ].join('\t')
    );
    const text = header + '\n' + rows.join('\n');
    const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `订单导出_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`已导出 ${targetOrders.length} 条订单`);
  };

  // Update search field
  const updateSearchField = (key: string, value: string) => {
    setSearchFields((prev) => ({ ...prev, [key]: value }));
  };

  const updateAdvancedField = (key: string, value: string) => {
    setAdvancedFields((prev) => ({ ...prev, [key]: value }));
  };

  // Add a field to advanced filter
  const addAdvancedField = (key: string) => {
    if (!advancedFields.hasOwnProperty(key)) {
      setAdvancedFields((prev) => ({ ...prev, [key]: '' }));
    }
  };

  const removeAdvancedField = (key: string) => {
    setAdvancedFields((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter('');
    setCustomerFilter('');
    setSupplierFilter('');
    setSearchFields({ orderNo: '', productName: '', customerInfo: '', phone: '' });
    setAdvancedFields({});
  };

  const hasActiveFilters =
    statusFilter ||
    customerFilter ||
    supplierFilter ||
    Object.values(searchFields).some((v) => v.trim()) ||
    Object.values(advancedFields).some((v) => v.trim());

  // Count orders for action bar hints
  const selectedPendingCount = Array.from(selectedOrders).filter(
    (o) => o.status === 'pending'
  ).length;
  const selectedAssignedCount = Array.from(selectedOrders).filter(
    (o) => o.status === 'assigned'
  ).length;
  const selectedReturnableCount = Array.from(selectedOrders).filter(
    (o) => o.status === 'returned'
  ).length;
  const selectedFeedbackedCount = Array.from(selectedOrders).filter(
    (o) => o.status === 'feedbacked'
  ).length;

  // 统计未归档订单数
  const unarchivedCount = orders.filter(o => !['completed', 'cancelled'].includes(o.status)).length;
  const activeImportBatch = advancedFields.importBatch?.trim() || '';
  const activeImportBatchSummary = useMemo(() => {
    if (!activeImportBatch) {
      return null;
    }

    const batchOrders = orders.filter((order) => order.importBatch === activeImportBatch);
    const statusCounts = ORDER_STATUS_OPTIONS.map((option) => ({
      value: option.value,
      label: option.label,
      count: batchOrders.filter((order) => order.status === option.value).length,
    })).filter((item) => item.count > 0);

    return {
      total: batchOrders.length,
      pending: batchOrders.filter((order) => order.status === 'pending').length,
      assigned: batchOrders.filter((order) => order.status === 'assigned').length,
      returned: batchOrders.filter((order) => isReturnProgressStatus(order.status)).length,
      completed: batchOrders.filter((order) =>
        order.status === 'completed' || order.status === 'cancelled'
      ).length,
      statusCounts,
    };
  }, [activeImportBatch, orders]);

  const applyBatchStatusFilter = (statuses: string[]) => {
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
  };

  if (loading) {
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
          <p className="text-sm text-muted-foreground">
            共 {orders.length} 条订单，其中 {unarchivedCount} 条未归档，{orders.filter((o) => o.status === 'pending').length} 条待派发
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchOrders} className="w-full sm:w-auto">
            <RefreshCw className="w-4 h-4 mr-1" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
          <Button variant="outline" size="sm" className="w-full sm:w-auto" onClick={() => {
            // 打开对话框时自动生成订单号
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            const autoOrderNo = `SYS-${dateStr}-${randomNum}`;
            setCreateForm(prev => ({ ...prev, orderNo: autoOrderNo }));
            setCreateDialogOpen(true);
          }}>
            <Plus className="w-4 h-4 mr-1" />
            新增订单
          </Button>
          {selectedOrders.size > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={() => openDeleteConfirm()}
              disabled={Array.from(selectedOrders).some(order => !canDeleteOrder(order))}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              删除 ({selectedOrders.size})
            </Button>
          )}
        </div>
      </div>

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

      {activeImportBatch && activeImportBatchSummary && (
        <Card className="border-primary/20">
          <CardContent className="pt-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">本批次复盘摘要</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <button
                  type="button"
                  className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-muted"
                  onClick={() => applyBatchStatusFilter([])}
                >
                  <div className="text-muted-foreground">总订单</div>
                  <div className="font-medium">{activeImportBatchSummary.total}</div>
                </button>
                <button
                  type="button"
                  className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-amber-50"
                  onClick={() => applyBatchStatusFilter(['pending'])}
                >
                  <div className="text-muted-foreground">待派发</div>
                  <div className="font-medium text-amber-700">{activeImportBatchSummary.pending}</div>
                </button>
                <button
                  type="button"
                  className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-blue-50"
                  onClick={() => applyBatchStatusFilter(['partial_returned', 'returned', 'feedbacked'])}
                >
                  <div className="text-muted-foreground">回单阶段</div>
                  <div className="font-medium text-blue-700">{activeImportBatchSummary.returned}</div>
                </button>
                <button
                  type="button"
                  className="rounded border bg-muted/30 px-3 py-2 text-left transition-colors hover:bg-green-50"
                  onClick={() => applyBatchStatusFilter(['completed', 'cancelled'])}
                >
                  <div className="text-muted-foreground">已归档</div>
                  <div className="font-medium text-green-700">{activeImportBatchSummary.completed}</div>
                </button>
              </div>
              {activeImportBatchSummary.statusCounts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeImportBatchSummary.statusCounts.map((item) => (
                    <Badge
                      key={item.value}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => applyBatchStatusFilter([item.value])}
                    >
                      {item.label} {item.count}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 预警面板切换按钮 - 始终显示 */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed right-0 top-1/2 z-50 hidden h-24 w-6 -translate-y-1/2 rounded-l-lg rounded-r-none border-l-0 bg-card shadow-lg lg:flex"
        onClick={() => setAlertPanelOpen(!alertPanelOpen)}
      >
        {alertPanelOpen ? (
          <PanelRightClose className="w-4 h-4" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <PanelRightOpen className="w-4 h-4" />
            {unreadAlertCount > 0 && (
              <Badge variant="destructive" className="text-[10px] px-1 py-0.5 min-w-[16px] h-4">
                {unreadAlertCount > 99 ? '99+' : unreadAlertCount}
              </Badge>
            )}
          </div>
        )}
      </Button>

      {/* 右侧预警面板 */}
      <div className={`fixed right-0 top-0 z-40 h-full w-full transform border-l bg-background shadow-lg transition-transform duration-300 ease-in-out sm:w-[380px] lg:w-80 ${alertPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* 预警面板头部 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">订单预警</h2>
              {unreadAlertCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {unreadAlertCount} 未读
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              {unreadAlertCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAlertsAsRead} title="全部已读">
                  <BellOff className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => setAlertPanelOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 预警统计卡片 */}
          <div className="p-3 border-b space-y-2">
            {calculateOrderAlerts.map((alert) => (
              <div
                key={alert.type}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  alert.count > 0 
                    ? 'bg-orange-50 border-orange-200' 
                    : 'bg-muted/50 border-muted'
                }`}
                onClick={() => {
                  // 筛选显示对应的订单
                  setStatusFilter(alert.type === 'pending_to_assign' ? 'pending' : 
                                 alert.type === 'assigned_to_returned' ? 'assigned' : '');
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${alert.count > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                    <span className="text-sm font-medium">{alert.label}</span>
                  </div>
                  <Badge variant={alert.count > 0 ? 'destructive' : 'secondary'} className="text-xs">
                    {alert.count}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
                {alert.count > 0 && (
                  <p className="text-xs text-orange-600 mt-1 font-medium">
                    点击查看{alert.count}条超时订单
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* 预警列表 */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无预警信息</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    ALERT_LEVEL_CONFIG[alert.alertLevel]?.bgColor || 'bg-muted'
                  } ${!alert.isRead ? 'ring-2 ring-primary/20' : ''}`}
                  onClick={() => {
                    if (!alert.isRead) markAlertAsRead(alert.id);
                    if (alert.orderId) {
                      const order = orders.find(o => o.id === alert.orderId);
                      if (order) {
                        setSelectedOrder(order);
                        setDetailsOpen(true);
                      }
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 ${ALERT_LEVEL_CONFIG[alert.alertLevel]?.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${ALERT_LEVEL_CONFIG[alert.alertLevel]?.color}`}>
                          {ALERT_LEVEL_CONFIG[alert.alertLevel]?.label}
                        </span>
                        {alert.orderNo && (
                          <span className="text-xs font-mono text-muted-foreground">{alert.orderNo}</span>
                        )}
                      </div>
                      <p className="text-sm font-medium mt-1 line-clamp-2">{alert.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.createdAt).toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 预警面板底部 */}
          <div className="p-3 border-t bg-muted/30">
            <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/alerts'}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              查看全部预警
            </Button>
          </div>
        </div>
      </div>

      {/* Common Operation Buttons - 置顶效果 */}
      <div
        id="common-operations"
        className={`transition-all duration-200 ${
          isStickyTop ? 'sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-md -mx-1 px-1 py-2 rounded-lg' : ''
        }`}
      >
        <Card className={isStickyTop ? 'shadow-none border-primary/20' : ''}>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground mr-1">常用操作：</span>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => (window.location.href = '/order-parse')}
              >
                <FileInput className="w-4 h-4 mr-1.5" />
                订单导入
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => openAssignDialog(null)}
                disabled={selectedOrders.size === 0 || selectedPendingCount === 0}
              >
                <Send className="w-4 h-4 mr-1.5" />
                分派供应商
                {selectedPendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                    {selectedPendingCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="default"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleShipNotice}
                disabled={selectedOrders.size === 0 || selectedAssignedCount === 0}
              >
                <Bell className="w-4 h-4 mr-1.5" />
                发货通知
                {selectedAssignedCount > 0 && (
                  <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                    {selectedAssignedCount}
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={() => setReturnDialogOpen(true)}
                disabled={selectedOrders.size === 0 || selectedAssignedCount === 0}
              >
                <Truck className="w-4 h-4 mr-1.5" />
                物流回单
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleFeedback}
                disabled={selectedOrders.size > 0 && selectedReturnableCount === 0}
              >
                <MessageSquare className="w-4 h-4 mr-1.5" />
                反馈给客户
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
                onClick={handleExportKingdee}
                disabled={selectedOrders.size > 0 && selectedFeedbackedCount === 0}
              >
                <Archive className="w-4 h-4 mr-1.5" />
                导出金蝶
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Area */}
      <Card id="filter-card">
        <CardContent className="pt-4 pb-3">
          {/* Row 1: Common search fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">订单号</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="系统单号/客户单号"
                  value={searchFields.orderNo}
                  onChange={(e) => updateSearchField('orderNo', e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">商品名称/型号</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="输入商品名称或型号"
                  value={searchFields.productName}
                  onChange={(e) => updateSearchField('productName', e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">客户信息</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="客户名称或编码"
                  value={searchFields.customerInfo}
                  onChange={(e) => updateSearchField('customerInfo', e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">电话号码</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="输入电话号码"
                  value={searchFields.phone}
                  onChange={(e) => updateSearchField('phone', e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Status + Customer + Supplier dropdowns + More button */}
          <div className="mt-3 flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">订单状态</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 w-full justify-between font-normal sm:min-w-[140px] sm:w-auto">
                    {selectedStatuses.length > 0 ? (
                      <span className="truncate">
                        已选 {selectedStatuses.length} 个状态
                      </span>
                    ) : statusFilter ? (
                      <span className="truncate">{getOrderStatusLabel(statusFilter)}</span>
                    ) : (
                      <span className="text-muted-foreground truncate">全部状态</span>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <div className="p-2 border-b bg-muted/30">
                    <div className="text-xs font-medium text-muted-foreground">选择状态（可多选）</div>
                  </div>
                  <div className="p-1 max-h-64 overflow-y-auto">
                    {/* 单选模式：全部 */}
                    <div className="px-2 py-1.5">
                      <button
                        onClick={() => {
                          setStatusFilter('');
                          setSelectedStatuses([]);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer flex items-center gap-2 ${
                          !statusFilter && selectedStatuses.length === 0 ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        <div className={`h-4 w-4 border rounded ${
                          !statusFilter && selectedStatuses.length === 0 ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {!statusFilter && selectedStatuses.length === 0 && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        全部状态
                      </button>
                    </div>
                    {/* 单选模式：单个状态 */}
                    <div className="px-2 py-1.5">
                      <div className="text-xs text-muted-foreground mb-1">单选</div>
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(option.value);
                            setSelectedStatuses([]);
                          }}
                          className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer flex items-center gap-2 ${
                            statusFilter === option.value && selectedStatuses.length === 0 ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          <div className={`h-4 w-4 border rounded ${
                            statusFilter === option.value && selectedStatuses.length === 0 ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {statusFilter === option.value && selectedStatuses.length === 0 && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          {option.label}
                        </button>
                      ))}
                    </div>
                    {/* 多选模式 */}
                    <div className="px-2 py-1.5 border-t">
                      <div className="text-xs text-muted-foreground mb-1">多选</div>
                      {ORDER_STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setStatusFilter(''); // 清空单选
                            setSelectedStatuses(prev => 
                              prev.includes(option.value) 
                                ? prev.filter(k => k !== option.value)
                                : [...prev, option.value]
                            );
                          }}
                          className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer flex items-center gap-2 ${
                            selectedStatuses.includes(option.value) ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                            selectedStatuses.includes(option.value) ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedStatuses.includes(option.value) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">客户</Label>
              <Select
                value={customerFilter || 'all'}
                onValueChange={(v) => setCustomerFilter(v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 w-full text-sm sm:w-[160px]">
                  <SelectValue placeholder="全部客户" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部客户</SelectItem>
                  {customers.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">供应商</Label>
              <Input
                placeholder="搜索供应商..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="h-8 w-full text-sm sm:w-[160px]"
              />
              <Select
                value={supplierFilter || 'all'}
                onValueChange={(v) => setSupplierFilter(v === 'all' ? '' : v)}
              >
                <SelectTrigger className="h-8 w-full text-sm sm:w-[160px]">
                  <SelectValue placeholder="全部供应商" />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  <SelectItem value="all">全部供应商</SelectItem>
                  {suppliers
                    .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                    .map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
              更多
              {showAdvancedFilter ? (
                <ChevronUp className="w-3.5 h-3.5 ml-1" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 ml-1" />
              )}
            </Button>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={clearAllFilters}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                清除筛选
              </Button>
            )}

            <div className="hidden flex-1 xl:block" />

            {selectedOrders.size > 0 && (
              <Badge variant="secondary" className="text-sm">
                已选 {selectedOrders.size} 条
              </Badge>
            )}

            <span className="text-sm text-muted-foreground">
              筛选结果：{filteredOrders.length} / {orders.length}
            </span>
          </div>

          {/* Advanced filter panel */}
          {showAdvancedFilter && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Label className="text-sm font-medium">高级筛选</Label>
                <span className="text-xs text-muted-foreground">添加更多筛选字段</span>
              </div>

              {/* Existing advanced fields */}
              {Object.entries(advancedFields).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(advancedFields).map(([key, value]) => {
                    const fieldDef = FILTERABLE_FIELDS.find((f) => f.key === key);
                    return (
                      <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs text-muted-foreground">{fieldDef?.label || key}</Label>
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              placeholder={fieldDef?.placeholder || ''}
                              value={value}
                              onChange={(e) => updateAdvancedField(key, e.target.value)}
                              className="pl-8 h-8 text-sm"
                            />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 mt-5"
                          onClick={() => removeAdvancedField(key)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add field selector */}
              <div className="flex items-center gap-2">
                <Select
                  value=""
                  onValueChange={(v) => {
                    if (v) addAdvancedField(v);
                  }}
                >
                  <SelectTrigger className="w-[180px] h-8 text-sm">
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    <SelectValue placeholder="添加筛选字段" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTERABLE_FIELDS.filter(
                      (f) =>
                        !advancedFields.hasOwnProperty(f.key) &&
                        !searchFields.hasOwnProperty(f.key)
                    ).map((f) => (
                      <SelectItem key={f.key} value={f.key}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Table - 表头置顶 */}
      <div className="border rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader 
              className={`${isTableHeaderSticky ? 'sticky z-20 bg-muted/95 backdrop-blur shadow-md' : 'bg-muted'} transition-all duration-200`}
              style={{ top: isTableHeaderSticky ? '85px' : '0px' }}
            >
              <TableRow>
                <TableHead className="w-[50px]">
                  <input
                    type="checkbox"
                    checked={
                      selectedOrders.size === filteredOrders.length &&
                      filteredOrders.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>系统单号</TableHead>
                <TableHead>客户单号</TableHead>
                <TableHead>客户</TableHead>
                <TableHead>收货人</TableHead>
                <TableHead>商品</TableHead>
                <TableHead className="text-center">数量</TableHead>
                <TableHead>型号</TableHead>
                <TableHead>业务员</TableHead>
                <TableHead>跟单员</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                    {orders.length === 0 ? '暂无订单数据' : '未找到匹配的订单'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={selectedOrders.has(order) ? 'bg-primary/5' : ''}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order)}
                        onChange={() => handleSelectOrder(order)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground max-w-[80px] truncate" title={order.sysOrderNo || '-'}>
                      <div>{order.sysOrderNo ? order.sysOrderNo.split('-').slice(-1)[0] : '-'}</div>
                      {order.importBatch && (
                        <div className="mt-1 text-[10px] text-muted-foreground/80" title={order.importBatch}>
                          批次 {order.importBatch.slice(-8)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground max-w-[120px] truncate">
                      {order.orderNo}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{order.customerName || '-'}</div>
                        {order.customerCode && order.customerCode !== 'UNKNOWN' && (
                          <div className="text-muted-foreground text-xs">{order.customerCode}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{order.receiver.name}</div>
                        <div className="text-muted-foreground text-xs">
                          {order.receiver.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items.slice(0, 2).map((item, i) => (
                          <div key={i} className="truncate max-w-[150px]">
                            {item.product_name}
                          </div>
                        ))}
                        {order.items.length > 2 && (
                          <div className="text-muted-foreground text-xs">
                            +{order.items.length - 2} 更多
                          </div>
                        )}
                      </div>
                    </TableCell>
                    {/* 数量列 */}
                    <TableCell className="text-center">
                      <div className="text-sm font-semibold">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                      {order.items.length > 1 && (
                        <div className="text-muted-foreground text-xs">
                          ({order.items.length}种)
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[120px] truncate">
                      {order.items.slice(0, 2).map((item, i) => (
                        <div key={i} className="truncate">
                          {item.product_spec || '-'}
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <div className="text-muted-foreground text-xs">
                          ...
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.salespersonName || '-'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.operatorName || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getOrderStatusBadgeClass(order.status)}>
                        {getOrderStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.supplierName || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(order)}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {canEditOrder(order) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditOrder(order)}
                            title="编辑订单"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        {canDeleteOrder(order) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteConfirm(order)}
                            title="删除订单"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAssignDialog(order.id)}
                            title="派发供应商"
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
            <DialogDescription>系统单号：{selectedOrder?.sysOrderNo}</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">系统单号</h4>
                  <p className="font-mono font-medium text-primary">{selectedOrder.sysOrderNo || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">客户单号</h4>
                  <p className="font-mono">{selectedOrder.orderNo}</p>
                </div>
                {selectedOrder.billNo && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">单据编号</h4>
                    <p className="font-mono">{selectedOrder.billNo}</p>
                  </div>
                )}
                {selectedOrder.billDate && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">单据日期</h4>
                    <p>{selectedOrder.billDate}</p>
                  </div>
                )}
                {selectedOrder.supplierOrderNo && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">供应商单据号</h4>
                    <p className="font-mono">{selectedOrder.supplierOrderNo}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">状态</h4>
                  <Badge className={getOrderStatusBadgeClass(selectedOrder.status)}>
                    {getOrderStatusLabel(selectedOrder.status)}
                  </Badge>
                  {/* 操作约束提示 */}
                  <div className="mt-2 text-xs text-muted-foreground space-y-1">
                    {!canEditOrder(selectedOrder) && (
                      <p className="text-orange-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getEditDisabledReason(selectedOrder)}
                      </p>
                    )}
                    {!canDeleteOrder(selectedOrder) && (
                      <p className="text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {getDeleteDisabledReason(selectedOrder)}
                      </p>
                    )}
                    {canEditOrder(selectedOrder) && (
                      <p className="text-green-600 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        {getEditableFieldsHint(selectedOrder)}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">客户</h4>
                  <p>{selectedOrder.customerName || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">导入批次</h4>
                  <p className="font-mono break-all text-xs">{selectedOrder.importBatch || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">业务员</h4>
                  <p>{selectedOrder.salespersonName || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">跟单员</h4>
                  <p>{selectedOrder.operatorName || '-'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">收货人</h4>
                  <p>{selectedOrder.receiver.name}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">联系电话</h4>
                  <p>{selectedOrder.receiver.phone}</p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">收货地址</h4>
                  <p>{selectedOrder.receiver.address}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">供应商</h4>
                  <p>{selectedOrder.supplierName || '-'}</p>
                </div>
                {(selectedOrder.warehouse || selectedOrder.items?.[0]?.warehouse) && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">仓库</h4>
                    <p>{selectedOrder.warehouse || selectedOrder.items?.[0]?.warehouse}</p>
                  </div>
                )}
                {selectedOrder.expressCompany && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">快递公司</h4>
                    <p>{selectedOrder.expressCompany}</p>
                  </div>
                )}
                {selectedOrder.trackingNo && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">快递单号</h4>
                    <p className="font-mono">{selectedOrder.trackingNo}</p>
                  </div>
                )}
              </div>

              {/* 发票与金额信息 */}
              {(selectedOrder.amount || selectedOrder.invoiceRequired || selectedOrder.incomeName) && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">发票与金额信息</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {selectedOrder.amount && (
                      <div>
                        <p className="text-xs text-muted-foreground">价税合计</p>
                        <p className="font-medium">¥{selectedOrder.amount.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedOrder.discount && (
                      <div>
                        <p className="text-xs text-muted-foreground">单台折让</p>
                        <p className="font-medium">¥{selectedOrder.discount.toFixed(2)}</p>
                      </div>
                    )}
                    {selectedOrder.taxRate && (
                      <div>
                        <p className="text-xs text-muted-foreground">税率</p>
                        <p className="font-medium">{selectedOrder.taxRate}%</p>
                      </div>
                    )}
                    {selectedOrder.invoiceRequired !== undefined && (
                      <div>
                        <p className="text-xs text-muted-foreground">需要开票</p>
                        <p className="font-medium">{selectedOrder.invoiceRequired ? '是' : '否'}</p>
                      </div>
                    )}
                    {selectedOrder.incomeName && (
                      <div>
                        <p className="text-xs text-muted-foreground">收入名称</p>
                        <p className="font-medium">{selectedOrder.incomeName}</p>
                      </div>
                    )}
                    {selectedOrder.incomeAmount && (
                      <div>
                        <p className="text-xs text-muted-foreground">应收金额</p>
                        <p className="font-medium">¥{selectedOrder.incomeAmount.toFixed(2)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 备注信息 */}
              {selectedOrder.remark && (
                <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">订单备注</h4>
                  <p className="text-sm text-yellow-700">{selectedOrder.remark}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">商品明细</h4>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品名称</TableHead>
                        <TableHead>规格型号</TableHead>
                        <TableHead className="text-right">数量</TableHead>
                        <TableHead className="text-right">单价</TableHead>
                        <TableHead className="text-right">小计</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="space-y-1">
                              {/* 系统商品信息 */}
                              {item.productName && item.productName !== item.cuProductName && (
                                <div className="text-sm">
                                  <span className="text-green-600 font-medium">系统：</span>
                                  {item.productName}
                                </div>
                              )}
                              {/* 客户原始商品信息 */}
                              <div className="text-sm">
                                <span className={item.productName && item.productName !== item.cuProductName ? "text-orange-600" : "text-gray-900"}>
                                  {item.cuProductName || item.productName}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {/* 系统商品规格 */}
                              {item.productSpec && item.productSpec !== item.cuProductSpec && (
                                <div className="text-xs">
                                  <span className="text-green-600">系统：</span>
                                  <span className="text-muted-foreground">{item.productSpec || '-'}</span>
                                </div>
                              )}
                              {/* 客户原始规格 */}
                              <div className="text-xs">
                                <span className="text-muted-foreground">{item.cuProductSpec || item.productSpec || '-'}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            {item.price ? `¥${item.price.toFixed(2)}` : (item.unitPrice ? `¥${item.unitPrice.toFixed(2)}` : '-')}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.price ? `¥${(item.price * item.quantity).toFixed(2)}` : (item.unitPrice ? `¥${(item.unitPrice * item.quantity).toFixed(2)}` : '-')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* 匹配说明 */}
                {selectedOrder.items[0]?.matchType && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">匹配方式：</span>
                    {selectedOrder.items[0].matchType === 'spec' && '按规格型号精确匹配'}
                    {selectedOrder.items[0].matchType === 'name' && '按商品名称模糊匹配'}
                    {selectedOrder.items[0].matchType === 'mapping' && '按SKU映射匹配'}
                    {selectedOrder.items[0].matchType === 'none' && '未匹配到商品档案'}
                  </div>
                )}
              </div>

              {/* Ext fields */}
              {selectedOrder.extFields && Object.keys(selectedOrder.extFields).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">附加信息</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>字段</TableHead>
                          <TableHead>值</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(selectedOrder.extFields).map(([key, val]) => {
                          const idx = parseInt(key.replace('ext_field_', ''));
                          return (
                            <TableRow key={key}>
                              <TableCell className="text-muted-foreground">备用字段{idx}</TableCell>
                              <TableCell>{val}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-sm text-muted-foreground">
                <span>创建时间：{new Date(selectedOrder.createdAt).toLocaleString('zh-CN')}</span>
                <span>更新时间：{new Date(selectedOrder.updatedAt).toLocaleString('zh-CN')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assign Supplier Dialog (single & batch) */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            setAssigningOrderId(null);
            setMatchResults({});
            setShowMatchDetails(false);
          }
        }}
      >
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {assigningOrderId ? '派发订单' : '批量派发订单'}
            </DialogTitle>
            <DialogDescription>
              {assigningOrderId
                ? '选择有库存的供应商，显示商品、库存和历史成本'
                : `将 ${selectedOrders.size} 条订单派发给供应商`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            {/* 智能匹配按钮 */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSmartMatch}
                disabled={isMatching}
                className="flex-1"
              >
                {isMatching ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    匹配中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    智能匹配供应商
                  </>
                )}
              </Button>
            </div>

            {/* 匹配结果展示 - 详细列表 */}
            {Object.keys(matchResults).length > 0 && (
              <div className="flex-1 overflow-auto space-y-4">
                {Object.entries(matchResults).map(([orderId, result]) => {
                  const order = orders.find(o => o.id === orderId);
                  
                  return (
                    <div key={orderId} className="border rounded-lg overflow-hidden">
                      {/* 订单信息头 */}
                      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {order?.sysOrderNo || order?.orderNo || '未知订单'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {result.receiverProvince && (
                              <span>收货省份：{result.receiverProvince}</span>
                            )}
                            {result.productName && (
                              <span>商品：{result.productName}</span>
                            )}
                            {result.quantity && (
                              <span>数量：{result.quantity}</span>
                            )}
                          </div>
                        </div>
                        {result.warning && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {result.warning}
                          </Badge>
                        )}
                      </div>
                      
                      {/* 供应商-商品-库存-历史成本表格 */}
                      {result.availableSuppliers && result.availableSuppliers.length > 0 ? (
                        <div className="overflow-x-auto">
                          {/* 新商品提示 + 手动选择按钮 */}
                          {(result.newProductHint || result.availableSuppliers.length === 0) && (
                            <div className="p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium">无库存或新商品：</span>
                                  <span>{result.newProductHint || '当前商品在所有供应商均无库存'}</span>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 bg-white"
                                  onClick={() => {
                                    setManualSelectOrderId(orderId);
                                    setManualSelectSupplierId(selectedSuppliers[orderId] || '');
                                    setManualSelectSupplierName('');
                                    setManualSelectOpen(true);
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  手动选择供应商
                                </Button>
                              </div>
                            </div>
                          )}
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="w-12">选择</TableHead>
                                <TableHead>供应商</TableHead>
                                <TableHead>省份匹配</TableHead>
                                <TableHead>商品编码</TableHead>
                                <TableHead>商品名称</TableHead>
                                <TableHead className="text-right">库存</TableHead>
                                <TableHead className="text-right">当前单价</TableHead>
                                <TableHead className="text-right">历史成本</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.availableSuppliers.map((supplier: {
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
                              }, idx: number) => (
                                <TableRow 
                                  key={`${supplier.supplierId}-${supplier.productCode}`}
                                  className={`cursor-pointer hover:bg-muted/50 ${selectedSuppliers[orderId] === supplier.supplierId ? 'bg-primary/5' : ''} ${supplier.hasStock === false ? 'opacity-60' : ''}`}
                                  onClick={() => setSelectedSuppliers(prev => ({ ...prev, [orderId]: supplier.supplierId }))}
                                >
                                  <TableCell>
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                      selectedSuppliers[orderId] === supplier.supplierId ? 'border-primary bg-primary shadow-md' : 'border-muted-foreground hover:border-primary/50'
                                    }`}>
                                      {selectedSuppliers[orderId] === supplier.supplierId && (
                                        <div className="h-3 w-3 rounded-full bg-white" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {supplier.hasStock === false && (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">无库存</Badge>
                                      )}
                                      {idx === 0 && supplier.hasStock !== false && (
                                        <Badge variant="default" className="bg-emerald-500 text-xs">推荐</Badge>
                                      )}
                                      <span className="font-medium">{supplier.supplierName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        supplier.provinceMatch === '同省' ? 'border-green-500 text-green-600 bg-green-50' :
                                        supplier.provinceMatch === '邻近' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                        supplier.provinceMatch === '较远' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                                        'border-gray-300'
                                      }
                                    >
                                      {supplier.provinceMatch || '未知'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{supplier.productCode || '-'}</TableCell>
                                  <TableCell className="max-w-[200px] truncate" title={supplier.productName}>
                                    {supplier.productName || '-'}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${supplier.quantity <= 2 ? 'text-orange-600' : ''} ${supplier.quantity === 0 ? 'text-gray-400' : ''}`}>
                                    {supplier.quantity === 0 ? '-' : supplier.quantity}
                                    {supplier.quantity > 0 && supplier.quantity <= 2 && <AlertTriangle className="inline w-3 h-3 ml-1 text-orange-500" />}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {supplier.quantity > 0 && typeof supplier.price === 'number' && supplier.price > 0 ? `¥${supplier.price.toFixed(2)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {supplier.historyCost ? (
                                      <span>¥{typeof supplier.historyCost === 'number' ? supplier.historyCost.toFixed(2) : supplier.historyCost}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">无记录</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <Package className="h-12 w-12 mx-auto mb-2 opacity-50 text-muted-foreground" />
                          <p className="text-muted-foreground mb-4">加载供应商列表失败或无可用供应商</p>
                          <Button 
                            variant="outline"
                            onClick={() => {
                              setManualSelectOrderId(orderId);
                              setManualSelectSupplierId(selectedSuppliers[orderId] || '');
                              setManualSelectSupplierName('');
                              setManualSelectOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            手动选择供应商
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 确认派发按钮 */}
            {Object.keys(matchResults).length > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <div className="flex-1 text-sm text-muted-foreground">
                  {assigningOrderId ? (
                    <>已选择供应商：{suppliers.find(s => s.id === selectedSupplierId)?.name || '未选择'}</>
                  ) : (
                    <>已为 {Object.keys(selectedSuppliers).length} 条订单选择供应商</>
                  )}
                </div>
                <Button
                  onClick={assigningOrderId ? handleAssign : handleBatchAssignFromMatch}
                  disabled={assigningOrderId ? !selectedSupplierId : Object.keys(selectedSuppliers).length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  确认派发
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 手动选择供应商对话框 */}
      <Dialog open={manualSelectOpen} onOpenChange={setManualSelectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>手动选择供应商</DialogTitle>
            <DialogDescription>
              从所有供应商中选择，或直接输入供应商名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-select">选择供应商</Label>
              <Select 
                value={manualSelectSupplierId} 
                onValueChange={(val) => {
                  setManualSelectSupplierId(val);
                  const supplier = suppliers.find(s => s.id === val);
                  setManualSelectSupplierName(supplier?.name || '');
                }}
              >
                <SelectTrigger id="supplier-select">
                  <SelectValue placeholder="请选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      <div className="flex items-center gap-2">
                        <span>{supplier.name}</span>
                        {'type' in supplier && (supplier as { type?: string }).type && (
                          <Badge variant="outline" className="text-xs">{(supplier as { type?: string }).type}</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-name">输入供应商名称</Label>
              <Input 
                id="supplier-name"
                placeholder="输入供应商名称"
                value={manualSelectSupplierName}
                onChange={(e) => setManualSelectSupplierName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                直接输入供应商名称（如果供应商不在下拉列表中）
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualSelectOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={() => {
                if (manualSelectOrderId && (manualSelectSupplierId || manualSelectSupplierName)) {
                  // 查找供应商信息
                  let supplierId = manualSelectSupplierId;
                  let supplierName = manualSelectSupplierName;
                  
                  if (manualSelectSupplierId && !manualSelectSupplierName) {
                    const supplier = suppliers.find(s => s.id === manualSelectSupplierId);
                    supplierName = supplier?.name || '';
                  } else if (manualSelectSupplierName && !manualSelectSupplierId) {
                    // 查找同名供应商
                    const supplier = suppliers.find(s => s.name === manualSelectSupplierName);
                    supplierId = supplier?.id || 'manual_' + Date.now();
                  }
                  
                  setSelectedSuppliers(prev => ({ 
                    ...prev, 
                    [manualSelectOrderId]: supplierId 
                  }));
                  toast.success(`已选择供应商：${supplierName}`);
                  setManualSelectOpen(false);
                  setManualSelectOrderId(null);
                  setManualSelectSupplierId('');
                  setManualSelectSupplierName('');
                } else {
                  toast.error('请选择或输入供应商');
                }
              }}
              disabled={!manualSelectSupplierId && !manualSelectSupplierName}
            >
              确认选择
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Tracking Dialog */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>物流回单</DialogTitle>
            <DialogDescription>
              导入快递单号，匹配订单完成回单
              {selectedOrders.size > 0 && `（当前已选 ${selectedOrders.size} 条订单）`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>快递公司（可选，统一设置）</Label>
              <Input
                placeholder="如：顺丰、中通等"
                value={returnExpressCompany}
                onChange={(e) => setReturnExpressCompany(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>快递单号</Label>
              <Textarea
                placeholder={`每行一个快递单号，或"单号,快递公司"格式\n例如：\nSF1234567890\nYT9876543210,圆通`}
                value={returnTrackingNos}
                onChange={(e) => setReturnTrackingNos(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {selectedOrders.size > 0
                  ? `将按顺序匹配已选的 ${selectedOrders.size} 条订单`
                  : '未选择订单时，将自动匹配已派发状态的订单'}
              </p>
            </div>
            <Button className="w-full" onClick={handleBatchReturn}>
              <CheckCircle className="w-4 h-4 mr-2" />
              确认回单
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 新增订单对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增订单</DialogTitle>
            <DialogDescription>手动创建新订单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>订单号 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="系统自动生成或手动输入"
                  value={createForm.orderNo}
                  onChange={(e) => setCreateForm({ ...createForm, orderNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>客户代码</Label>
                <Input
                  placeholder="客户编码"
                  value={createForm.customerCode}
                  onChange={(e) => setCreateForm({ ...createForm, customerCode: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>商品名称 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="商品名称"
                value={createForm.productName}
                onChange={(e) => setCreateForm({ ...createForm, productName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>数量</Label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.quantity}
                  onChange={(e) => setCreateForm({ ...createForm, quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>收货人 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="收货人姓名"
                  value={createForm.receiverName}
                  onChange={(e) => setCreateForm({ ...createForm, receiverName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>联系电话 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="手机号码"
                value={createForm.receiverPhone}
                onChange={(e) => setCreateForm({ ...createForm, receiverPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>收货省份</Label>
              <Input
                placeholder="如：福建、北京"
                value={createForm.receiverProvince}
                onChange={(e) => setCreateForm({ ...createForm, receiverProvince: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>收货地址 <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="详细收货地址"
                rows={2}
                value={createForm.receiverAddress}
                onChange={(e) => setCreateForm({ ...createForm, receiverAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>快递要求</Label>
              <Input
                placeholder="如：顺丰优先"
                value={createForm.expressRequirement}
                onChange={(e) => setCreateForm({ ...createForm, expressRequirement: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                placeholder="订单备注"
                rows={2}
                value={createForm.remark}
                onChange={(e) => setCreateForm({ ...createForm, remark: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button onClick={handleCreateOrder} disabled={createLoading}>
              {createLoading ? '创建中...' : '创建订单'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑订单对话框 */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑订单</DialogTitle>
            <DialogDescription>
              {editForm.status && (
                <div className="mt-1 flex items-center gap-2">
                  <Badge className={getOrderStatusBadgeClass(editForm.status)}>
                    {getOrderStatusLabel(editForm.status)}
                  </Badge>
                  {editForm.status === 'assigned' || editForm.status === 'partial_returned' ? (
                    <span className="text-xs text-muted-foreground">
                      已派发订单仅可编辑收货信息
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      可编辑所有信息
                    </span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>订单号</Label>
                <Input value={editForm.orderNo} disabled />
              </div>
              <div className="space-y-2">
                <Label>客户代码</Label>
                <Input
                  value={editForm.customerCode}
                  onChange={(e) => setEditForm({ ...editForm, customerCode: e.target.value })}
                  disabled={editForm.status === 'assigned' || editForm.status === 'partial_returned'}
                  className={editForm.status === 'assigned' || editForm.status === 'partial_returned' ? 'bg-muted' : ''}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={((editForm.status === 'assigned' || editForm.status === 'partial_returned') ? 'text-muted-foreground' : '')}>
                商品名称 {editForm.status === 'assigned' || editForm.status === 'partial_returned' && <span className="text-xs">(已派发订单不可修改)</span>}
              </Label>
              <Input
                value={editForm.productName}
                onChange={(e) => setEditForm({ ...editForm, productName: e.target.value })}
                disabled={editForm.status === 'assigned' || editForm.status === 'partial_returned'}
                className={editForm.status === 'assigned' || editForm.status === 'partial_returned' ? 'bg-muted' : ''}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={((editForm.status === 'assigned' || editForm.status === 'partial_returned') ? 'text-muted-foreground' : '')}>
                  数量 {editForm.status === 'assigned' || editForm.status === 'partial_returned' && <span className="text-xs">(已派发订单不可修改)</span>}
                </Label>
                <Input
                  type="number"
                  min="1"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                  disabled={editForm.status === 'assigned' || editForm.status === 'partial_returned'}
                  className={editForm.status === 'assigned' || editForm.status === 'partial_returned' ? 'bg-muted' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label>收货人 <span className="text-destructive">*</span></Label>
                <Input
                  value={editForm.receiverName}
                  onChange={(e) => setEditForm({ ...editForm, receiverName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>联系电话 <span className="text-destructive">*</span></Label>
              <Input
                value={editForm.receiverPhone}
                onChange={(e) => setEditForm({ ...editForm, receiverPhone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>收货省份</Label>
              <Input
                value={editForm.receiverProvince}
                onChange={(e) => setEditForm({ ...editForm, receiverProvince: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>收货地址 <span className="text-destructive">*</span></Label>
              <Textarea
                rows={2}
                value={editForm.receiverAddress}
                onChange={(e) => setEditForm({ ...editForm, receiverAddress: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>快递要求</Label>
              <Input
                value={editForm.expressRequirement}
                onChange={(e) => setEditForm({ ...editForm, expressRequirement: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                rows={2}
                value={editForm.remark}
                onChange={(e) => setEditForm({ ...editForm, remark: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpdateOrder} disabled={editLoading}>
              {editLoading ? '保存中...' : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除选中的 {deleteOrderIds.length} 条订单吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>删除约束</AlertTitle>
            <AlertDescription>
              已派发、已完成、部分回单的订单不允许删除，需要先取消订单状态。
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDeleteOrder} disabled={deleteLoading}>
              {deleteLoading ? '删除中...' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
