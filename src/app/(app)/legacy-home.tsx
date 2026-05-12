'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageGuard } from '@/components/auth/page-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildUserInfoHeaders } from '@/lib/auth';
import { getOrderStatusBadgeClass, getOrderStatusLabel, isReturnProgressStatus, ORDER_STATUS_PENDING, ORDER_STATUS_ASSIGNED, ORDER_STATUS_PARTIAL_RETURNED, ORDER_STATUS_RETURNED, ORDER_STATUS_FEEDBACKED, ORDER_STATUS_COMPLETED, ORDER_STATUS_CANCELLED } from '@/lib/order-status';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from 'sonner';
import {
  BarChart3,
  Package,
  Users,
  Building2,
  ShoppingCart,
  TrendingUp,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  RefreshCw,
  Download,
  PieChart,
} from 'lucide-react';

interface OrderStats {
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

interface CustomerStats {
  total: number;
  active: number;
  newThisMonth: number;
}

interface SupplierStats {
  total: number;
  active: number;
  types: Record<string, number>;
}

interface StockStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

interface DashboardData {
  orders: OrderStats;
  customers: CustomerStats;
  suppliers: SupplierStats;
  stocks: StockStats;
  recentOrders: Array<{
    id: string;
    sysOrderNo: string;
    orderNo: string;
    status: string;
    customerName: string;
    createdAt: string;
  }>;
  topProducts: Array<{
    productName: string;
    orderCount: number;
  }>;
}

export default function LegacyHomePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<string>('7');
  const [isToday, setIsToday] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [dateRange, isToday]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 构建日期筛选参数
      let startDate = '';
      if (isToday) {
        // 今日
        startDate = new Date().toISOString().slice(0, 10);
      } else {
        // 近N天
        const days = parseInt(dateRange) || 30;
        const date = new Date();
        date.setDate(date.getDate() - days);
        startDate = date.toISOString().slice(0, 10);
      }
      
      const params = startDate ? `?startDate=${startDate}` : '';
      const ordersParams = params ? `${params}&pageSize=99999` : '?pageSize=99999';
      const headers = buildUserInfoHeaders();
      
      const [ordersRes, customersRes, suppliersRes, stocksRes] = await Promise.all([
        fetch(`/api/orders${ordersParams}`, { headers }),
        fetch('/api/customers?pageSize=99999', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/stocks?pageSize=99999', { headers }),
      ]);

      const [ordersData, customersData, suppliersData, stocksData] = await Promise.all([
        ordersRes.json(),
        customersRes.json(),
        suppliersRes.json(),
        stocksRes.json(),
      ]);

      const orders = ordersData.data || [];
      const orderStats: OrderStats = {
        total: orders.length,
        pending: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_PENDING).length,
        assigned: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_ASSIGNED).length,
        partialReturned: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_PARTIAL_RETURNED).length,
        returned: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_RETURNED).length,
        feedbacked: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_FEEDBACKED).length,
        returnProgress: orders.filter((o: Record<string, unknown>) => isReturnProgressStatus(String(o.status || ''))).length,
        completed: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_COMPLETED).length,
        cancelled: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_CANCELLED).length,
      };

      const customers = customersData.data || [];
      const customerStats: CustomerStats = {
        total: customers.length,
        active: customers.filter((c: Record<string, unknown>) => c.isActive).length,
        newThisMonth: customers.filter((c: Record<string, unknown>) => {
          const createdAt = new Date(c.createdAt as string);
          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
        }).length,
      };

      const suppliers = suppliersData.data || [];
      const supplierTypes: Record<string, number> = {};
      suppliers.forEach((s: Record<string, unknown>) => {
        const type = (s.type as string) || 'other';
        supplierTypes[type] = (supplierTypes[type] || 0) + 1;
      });
      const supplierStats: SupplierStats = {
        total: suppliers.length,
        active: suppliers.filter((s: Record<string, unknown>) => s.isActive !== false && s.is_active !== false).length,
        types: supplierTypes,
      };

      const stocks = stocksData.data || [];
      const stockStats: StockStats = {
        totalProducts: stocks.length,
        lowStock: stocks.filter((s: Record<string, unknown>) => (s.quantity as number) <= 2 && (s.quantity as number) > 0).length,
        outOfStock: stocks.filter((s: Record<string, unknown>) => (s.quantity as number) === 0).length,
        totalValue: stocks.reduce((sum: number, s: Record<string, unknown>) => {
          return sum + ((s.quantity as number) || 0) * (((s.unitPrice as number) || (s.unit_price as number) || (s.price as number)) || 0);
        }, 0),
      };

      const recentOrders = orders.slice(0, 10).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        sysOrderNo: (o.sysOrderNo as string) || '',
        orderNo: o.orderNo as string,
        status: o.status as string,
        customerName: (o.customerName as string) || '-',
        createdAt: o.createdAt as string,
      }));

      const productCount: Record<string, number> = {};
      orders.forEach((o: Record<string, unknown>) => {
        const items = (o.items as Array<Record<string, unknown>>) || [];
        items.forEach((item) => {
          const name = (item.productName as string) || (item.product_name as string) || '未知商品';
          productCount[name] = (productCount[name] || 0) + ((item.quantity as number) || 1);
        });
      });
      const topProducts = Object.entries(productCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([productName, orderCount]) => ({ productName, orderCount }));

      setData({
        orders: orderStats,
        customers: customerStats,
        suppliers: supplierStats,
        stocks: stockStats,
        recentOrders,
        topProducts,
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case ORDER_STATUS_PENDING:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: Clock };
      case ORDER_STATUS_ASSIGNED:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: Truck };
      case ORDER_STATUS_PARTIAL_RETURNED:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: Truck };
      case ORDER_STATUS_RETURNED:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: CheckCircle };
      case ORDER_STATUS_FEEDBACKED:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: CheckCircle };
      case ORDER_STATUS_COMPLETED:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: CheckCircle };
      case ORDER_STATUS_CANCELLED:
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: AlertTriangle };
      default:
        return { label: status, color: 'bg-gray-100', icon: Package };
    }
  };

  const handleExport = () => {
    if (!data) return;

    const csv = [
      ['报表标题', '礼品订单管理系统 - 数据报表'],
      ['生成时间', new Date().toLocaleString('zh-CN')],
      ['时间范围', `近${dateRange}天`],
      [],
      ['订单统计'],
      ['总订单数', data.orders.total],
      ['待派发', data.orders.pending],
      ['已派发', data.orders.assigned],
      ['部分回单', data.orders.partialReturned],
      ['已回单', data.orders.returned],
      ['已反馈', data.orders.feedbacked],
      ['回单阶段合计', data.orders.returnProgress],
      ['已导金蝶', data.orders.completed],
      ['已取消', data.orders.cancelled],
      [],
      ['客户统计'],
      ['总客户数', data.customers.total],
      ['活跃客户', data.customers.active],
      ['本月新增', data.customers.newThisMonth],
      [],
      ['发货方统计'],
      ['总发货方数', data.suppliers.total],
      ['活跃发货方', data.suppliers.active],
      [],
      [],
      ['热门商品 TOP5'],
      ...data.topProducts.map((p, i) => [`${i + 1}. ${p.productName}`, p.orderCount]),
    ]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `数据报表_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('报表导出成功');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">加载数据失败</p>
      </div>
    );
  }

  return (
    <PageGuard permission="dashboard:view" title="无权查看首页" description="当前账号没有查看首页数据概览的权限。">
    <div className="space-y-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            数据报表
          </h1>
          <p className="text-muted-foreground">
            系统运营数据统计与分析
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button 
            variant={isToday ? "default" : "outline"} 
            size="sm"
            onClick={() => {
              setIsToday(true);
            }}
            className="w-full sm:w-auto"
          >
            今日
          </Button>
          <Select value={dateRange} onValueChange={(v) => {
            setDateRange(v);
            setIsToday(false);
          }}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">近7天</SelectItem>
              <SelectItem value="30">近30天</SelectItem>
              <SelectItem value="90">近90天</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadDashboardData} className="w-full sm:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            导出报表
          </Button>
        </div>
      </div>

      {/* 核心指标卡片 - 重新设计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 订单总数 */}
        <Link href="/orders" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/70">订单总数</span>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-3 tabular-nums">{data.orders.total}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-md bg-amber-500/20 text-amber-200 font-medium">
                  {data.orders.pending} 待派发
                </span>
                <span className="px-2 py-1 rounded-md bg-blue-400/20 text-blue-200 font-medium">
                  {data.orders.assigned} 已派发
                </span>
                <span className="px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-200 font-medium">
                  {data.orders.returnProgress} 回单
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* 客户总数 */}
        <Link href="/customers" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/70">客户总数</span>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-3 tabular-nums">{data.customers.total}</div>
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-1 rounded-md bg-emerald-400/20 text-emerald-200 font-medium">
                  {data.customers.active} 活跃
                </span>
                {data.customers.newThisMonth > 0 && (
                  <span className="px-2 py-1 rounded-md bg-blue-400/20 text-blue-200 font-medium">
                    +{data.customers.newThisMonth} 本月
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* 发货方总数 */}
        <Link href="/suppliers-manage" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/70">发货方总数</span>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-3 tabular-nums">{data.suppliers.total}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {Object.entries(data.suppliers.types).slice(0, 3).map(([type, count]) => (
                  <span key={type} className="px-2 py-1 rounded-md bg-white/10 text-white/80 font-medium">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 订单状态分布 - 简洁表格风格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 状态分布表格 - 左侧 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-slate-600" />
                </div>
                <CardTitle className="text-base font-medium">订单状态分布</CardTitle>
              </div>
              <span className="text-lg font-bold text-slate-700">{data.orders.total} 单</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {([
                { key: 'pending', label: '待派发', color: 'bg-amber-500' },
                { key: 'assigned', label: '已派发', color: 'bg-blue-500' },
                { key: 'returnProgress', label: '回单阶段', color: 'bg-emerald-500' },
                { key: 'completed', label: '已导金蝶', color: 'bg-slate-400' },
                { key: 'cancelled', label: '已取消', color: 'bg-red-400' },
              ] as const).map(({ key, label, color }) => {
                const count = data.orders[key];
                const percentage = data.orders.total > 0 ? Math.round((count / data.orders.total) * 100) : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-slate-600">{label}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-sm font-medium text-slate-700">{count}</span>
                      <span className="text-xs text-slate-400 ml-1">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 热门商品 TOP5 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-slate-600" />
                </div>
                <CardTitle className="text-base font-medium">热门商品 TOP5</CardTitle>
              </div>
              <span className="text-xs text-slate-400">按订单量统计</span>
            </div>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {data.topProducts.map((product, index) => {
                  const maxCount = data.topProducts[0]?.orderCount || 1;
                  const percentage = Math.round((product.orderCount / maxCount) * 100);
                  const colors = [
                    'bg-slate-700',
                    'bg-slate-500',
                    'bg-slate-400',
                    'bg-slate-300',
                    'bg-slate-200',
                  ];
                  return (
                    <div key={product.productName} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-white ${colors[index]}`}>
                        {index + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[180px]" title={product.productName}>
                            {product.productName}
                          </span>
                          <span className="text-sm font-semibold text-slate-600 ml-2">{product.orderCount}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[index]} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 最近订单 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Clock className="h-4 w-4 text-slate-600" />
              </div>
              <CardTitle className="text-base font-medium">最近订单</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-slate-500" onClick={() => window.location.href = '/orders'}>
              查看全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无订单</p>
          ) : (
            <div className="space-y-2">
              {data.recentOrders.slice(0, 6).map((order) => {
                const config = getStatusConfig(order.status);
                return (
                  <div key={order.id} className="group flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50 transition-all cursor-pointer">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-700 truncate">
                          {order.sysOrderNo || order.orderNo}
                        </span>
                        <Badge className={`${config.color} text-xs shrink-0`} variant="secondary">
                          {config.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{order.customerName} · {new Date(order.createdAt).toLocaleDateString('zh-CN')}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </PageGuard>
  );
}
