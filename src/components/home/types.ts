'use client';

import {
  Package,
  ClipboardList,
  Truck,
  Boxes,
  FileText,
  Warehouse,
  BarChart3,
  DollarSign,
  Bell,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';

// ============================================================
// 指标卡片类型
// ============================================================

export interface MetricData {
  label: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ComponentType<{ className?: string }>;
  color: 'primary' | 'success' | 'warning' | 'danger';
  href?: string;
}

export interface OrderMetrics {
  total: number;
  pending: number;
  assigned: number;
  partialReturned: number;
  returned: number;
  feedbacked: number;
  returnProgress: number;
  completed: number;
  cancelled: number;
}

export interface CustomerMetrics {
  total: number;
  active: number;
  newThisMonth: number;
}

export interface SupplierMetrics {
  total: number;
  active: number;
  types: Record<string, number>;
}

export interface StockMetrics {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

// ============================================================
// 状态分布类型
// ============================================================

export interface StatusItem {
  key: string;
  label: string;
  count: number;
  color: string;
}

// ============================================================
// 快捷操作类型
// ============================================================

export interface QuickAction {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  color: string;
}

// 默认快捷操作配置
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'order-parse',
    icon: ClipboardList,
    label: 'AI录单',
    href: '/order-parse',
    color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
  },
  {
    id: 'shipping-export',
    icon: Truck,
    label: '发货通知',
    href: '/shipping-export',
    color: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
  },
  {
    id: 'return-receipt',
    icon: Package,
    label: '回单导入',
    href: '/return-receipt',
    color: 'bg-amber-50 text-amber-600 hover:bg-amber-100',
  },
  {
    id: 'stocks',
    icon: Warehouse,
    label: '库存查询',
    href: '/stocks',
    color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
  },
];

// ============================================================
// 订单列表类型
// ============================================================

export interface RecentOrder {
  id: string;
  sysOrderNo: string;
  orderNo: string;
  status: string;
  customerName: string;
  createdAt: string;
}

// ============================================================
// 预警类型
// ============================================================

export interface AlertItem {
  id: string;
  type: 'stock' | 'timeout' | 'pending';
  title: string;
  description: string;
  count?: number;
  actionLabel: string;
  actionHref: string;
}

// ============================================================
// 商品排行类型
// ============================================================

export interface ProductRankingItem {
  rank: number;
  name: string;
  orderCount: number;
  trend: 'up' | 'down' | 'neutral';
}

// ============================================================
// 时间筛选类型
// ============================================================

export type TimeRange = 'today' | '7d' | '30d' | '90d';

export interface TimeRangeOption {
  key: TimeRange;
  label: string;
}

// ============================================================
// 订单状态常量
// ============================================================

export const ORDER_STATUS_CONFIG = {
  pending: { label: '待派发', color: 'bg-amber-500' },
  assigned: { label: '已派发', color: 'bg-blue-500' },
  partialReturned: { label: '部分回单', color: 'bg-orange-500' },
  returned: { label: '已回单', color: 'bg-emerald-500' },
  feedbacked: { label: '已反馈', color: 'bg-teal-500' },
  completed: { label: '已导金蝶', color: 'bg-gray-400' },
  cancelled: { label: '已取消', color: 'bg-red-400' },
} as const;

// ============================================================
// 状态进度条配置
// ============================================================

export const STATUS_PROGRESS_CONFIG: StatusItem[] = [
  { key: 'pending', label: '待派发', count: 0, color: '#F59E0B' },
  { key: 'assigned', label: '已派发', count: 0, color: '#3B82F6' },
  { key: 'returned', label: '已回单', count: 0, color: '#10B981' },
  { key: 'completed', label: '已导金蝶', count: 0, color: '#6B7280' },
];

// ============================================================
// 工具函数
// ============================================================

/**
 * 格式化数字，添加千位分隔符
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('zh-CN');
}

/**
 * 计算百分比
 */
export function calculatePercentage(value: number, total: number): string {
  if (total === 0) return '0';
  return ((value / total) * 100).toFixed(1);
}

/**
 * 格式化金额
 */
export function formatCurrency(amount: number): string {
  return `¥${formatNumber(amount)}`;
}

/**
 * 获取相对时间描述
 */
export function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;
  return date.toLocaleDateString('zh-CN');
}
