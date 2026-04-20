'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageGuard } from '@/components/auth/page-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildUserInfoHeaders } from '@/lib/auth';
import { getOrderStatusBadgeClass, getOrderStatusLabel, isReturnProgressStatus } from '@/lib/order-status';
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

export default function HomePage() {
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
      const headers = buildUserInfoHeaders();
      
      const [ordersRes, customersRes, suppliersRes, stocksRes] = await Promise.all([
        fetch(`/api/orders${params}`, { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/suppliers', { headers }),
        fetch('/api/stocks', { headers }),
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
        pending: orders.filter((o: Record<string, unknown>) => o.status === 'pending').length,
        assigned: orders.filter((o: Record<string, unknown>) => o.status === 'assigned').length,
        partialReturned: orders.filter((o: Record<string, unknown>) => o.status === 'partial_returned').length,
        returned: orders.filter((o: Record<string, unknown>) => o.status === 'returned').length,
        feedbacked: orders.filter((o: Record<string, unknown>) => o.status === 'feedbacked').length,
        returnProgress: orders.filter((o: Record<string, unknown>) => isReturnProgressStatus(String(o.status || ''))).length,
        completed: orders.filter((o: Record<string, unknown>) => o.status === 'completed').length,
        cancelled: orders.filter((o: Record<string, unknown>) => o.status === 'cancelled').length,
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
      case 'pending':
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: Clock };
      case 'assigned':
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: Truck };
      case 'partial_returned':
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: Truck };
      case 'returned':
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: CheckCircle };
      case 'feedbacked':
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: CheckCircle };
      case 'completed':
        return { label: getOrderStatusLabel(status), color: getOrderStatusBadgeClass(status), icon: CheckCircle };
      case 'cancelled':
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
      ['供应商统计'],
      ['总供应商数', data.suppliers.total],
      ['活跃供应商', data.suppliers.active],
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/80">订单总数</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <ShoppingCart className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-3 tabular-nums">{data.orders.total}</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold shadow-sm">
                  <Clock className="h-3 w-3" />
                  {data.orders.pending} 待派发
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400 text-cyan-900 text-xs font-bold shadow-sm">
                  <Truck className="h-3 w-3" />
                  {data.orders.assigned} 已派发
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-400 text-green-900 text-xs font-bold shadow-sm">
                  <CheckCircle className="h-3 w-3" />
                  {data.orders.returnProgress} 回单阶段
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* 客户总数 */}
        <Link href="/customers" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-400 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/80">客户总数</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-3 tabular-nums">{data.customers.total}</div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm">
                  <CheckCircle className="h-3 w-3" />
                  {data.customers.active} 活跃
                </div>
                {data.customers.newThisMonth > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs text-white/70">
                    <TrendingUp className="h-3 w-3" />
                    本月 +{data.customers.newThisMonth}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Link>

        {/* 供应商总数 */}
        <Link href="/suppliers-manage" className="group block">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-violet-500 to-violet-400 p-6 text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white/80">供应商总数</span>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="h-5 w-5" />
                </div>
              </div>
              <div className="text-4xl font-bold mb-3 tabular-nums">{data.suppliers.total}</div>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(data.suppliers.types).slice(0, 3).map(([type, count]) => (
                  <div key={type} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm">
                    {type}: {count}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* 订单状态分布 - 环形图风格 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 环形进度图 - 左侧 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">订单状态分布</CardTitle>
              </div>
              <span className="text-2xl font-bold text-primary">{data.orders.total}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              {/* 环形进度图 */}
              <div className="relative w-32 h-32 flex-shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* 背景圆环 */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-muted"
                  />
                  {/* 待派发 - 黄色 */}
                  {data.orders.pending > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${(data.orders.pending / data.orders.total) * 251.2} 251.2`}
                      strokeDashoffset="0"
                      className="text-yellow-400 drop-shadow-sm"
                    />
                  )}
                  {/* 已派发 - 蓝色 */}
                  {data.orders.assigned > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${(data.orders.assigned / data.orders.total) * 251.2} 251.2`}
                      strokeDashoffset={`${-(data.orders.pending / data.orders.total) * 251.2}`}
                      className="text-blue-500"
                    />
                  )}
                  {/* 回单阶段 - 绿色 */}
                  {data.orders.returnProgress > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="12"
                      strokeDasharray={`${(data.orders.returnProgress / data.orders.total) * 251.2} 251.2`}
                      strokeDashoffset={`${-((data.orders.pending + data.orders.assigned) / data.orders.total) * 251.2}`}
                      className="text-emerald-500"
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs text-muted-foreground">总计</span>
                  <span className="text-xl font-bold">{data.orders.total}</span>
                </div>
              </div>

              {/* 图例 */}
              <div className="flex-1 space-y-3">
                {([
                  { key: 'pending', label: '待派发', color: 'bg-yellow-400' },
                  { key: 'assigned', label: '已派发', color: 'bg-blue-500' },
                  { key: 'returnProgress', label: '回单阶段', color: 'bg-emerald-500' },
                  { key: 'completed', label: '已导金蝶', color: 'bg-gray-400' },
                  { key: 'cancelled', label: '已取消', color: 'bg-red-400' },
                ] as const).map(({ key, label, color }) => {
                  const count = data.orders[key];
                  const percentage = data.orders.total > 0 ? ((count / data.orders.total) * 100).toFixed(1) : '0';
                  return (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${color}`} />
                        <span className="text-sm">{label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-16 text-right tabular-nums">{count}</span>
                        <span className="text-xs text-muted-foreground w-12">{percentage}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 热门商品 TOP5 - 进度条风格 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">热门商品 TOP5</CardTitle>
              </div>
              <span className="text-xs text-muted-foreground">按订单量统计</span>
            </div>
          </CardHeader>
          <CardContent>
            {data.topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {data.topProducts.map((product, index) => {
                  const maxCount = data.topProducts[0]?.orderCount || 1;
                  const percentage = (product.orderCount / maxCount) * 100;
                  const colors = [
                    'bg-gradient-to-r from-amber-400 to-amber-500',
                    'bg-gradient-to-r from-slate-400 to-slate-500',
                    'bg-gradient-to-r from-orange-400 to-orange-500',
                    'bg-gradient-to-r from-blue-400 to-blue-500',
                    'bg-gradient-to-r from-purple-400 to-purple-500',
                  ];
                  return (
                    <div key={product.productName} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white ${
                            index === 0 ? 'bg-amber-500' :
                            index === 1 ? 'bg-slate-500' :
                            index === 2 ? 'bg-orange-500' :
                            index === 3 ? 'bg-blue-500' :
                            'bg-purple-500'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium truncate max-w-[160px]" title={product.productName}>
                            {product.productName}
                          </span>
                        </div>
                        <span className="text-sm font-bold tabular-nums">{product.orderCount}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[index]} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        />
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
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">最近订单</CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => window.location.href = '/orders'}>
              查看全部
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {data.recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无订单</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.recentOrders.slice(0, 6).map((order) => {
                const config = getStatusConfig(order.status);
                return (
                  <div key={order.id} className="group p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate" title={order.sysOrderNo || order.orderNo}>
                          {order.sysOrderNo || order.orderNo}
                        </p>
                        {order.customerName && order.customerName !== '未知' && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">{order.customerName}</p>
                        )}
                      </div>
                      <Badge className={`${config.color} text-xs shrink-0`} variant="secondary">
                        {config.label}
                      </Badge>
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
