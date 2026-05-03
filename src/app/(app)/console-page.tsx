'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders } from '@/lib/auth';
import {
  ORDER_STATUS_PENDING,
  ORDER_STATUS_ASSIGNED,
  ORDER_STATUS_PARTIAL_RETURNED,
  ORDER_STATUS_RETURNED,
  ORDER_STATUS_FEEDBACKED,
  ORDER_STATUS_COMPLETED,
  ORDER_STATUS_CANCELLED,
} from '@/lib/order-status';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  ShoppingCart,
  Users,
  Building2,
  Package,
  Warehouse,
  RefreshCw,
  Download,
  BarChart3,
  Clock,
  Truck,
  CheckCircle,
  PieChart,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderMetrics {
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

interface RecentOrder {
  id: string;
  sysOrderNo: string;
  orderNo: string;
  status: string;
  customerName: string;
  createdAt: string;
}

interface TopProduct {
  name: string;
  count: number;
}

export default function ConsolePage() {
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [customersCount, setCustomersCount] = useState(0);
  const [suppliersCount, setSuppliersCount] = useState(0);
  const [stocksCount, setStocksCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90 };
      const days = daysMap[timeRange];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const params = `?createdFrom=${startDate.toISOString().slice(0, 10)}`;

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
      const metrics: OrderMetrics = {
        total: orders.length,
        pending: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_PENDING).length,
        assigned: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_ASSIGNED).length,
        partialReturned: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_PARTIAL_RETURNED).length,
        returned: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_RETURNED).length,
        feedbacked: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_FEEDBACKED).length,
        returnProgress: orders.filter((o: Record<string, unknown>) =>
          [ORDER_STATUS_PARTIAL_RETURNED, ORDER_STATUS_RETURNED, ORDER_STATUS_FEEDBACKED].includes(o.status as typeof ORDER_STATUS_PARTIAL_RETURNED)
        ).length,
        completed: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_COMPLETED).length,
        cancelled: orders.filter((o: Record<string, unknown>) => o.status === ORDER_STATUS_CANCELLED).length,
      };
      setMetrics(metrics);

      // 客户/发货方/库存
      setCustomersCount((customersData.data || []).length);
      setSuppliersCount((suppliersData.data || []).length);
      setStocksCount((stocksData.data || []).length);

      // 最近订单
      setRecentOrders(orders.slice(0, 8).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        sysOrderNo: (o.sysOrderNo as string) || '',
        orderNo: o.orderNo as string,
        status: o.status as string,
        customerName: (o.customerName as string) || '-',
        createdAt: o.createdAt as string,
      })));

      // 热门商品
      const productCount: Record<string, number> = {};
      orders.forEach((o: Record<string, unknown>) => {
        const items = (o.items as Array<Record<string, unknown>>) || [];
        items.forEach((item) => {
          const name = (item.productName as string) || (item.product_name as string) || '未知商品';
          productCount[name] = (productCount[name] || 0) + ((item.quantity as number) || 1);
        });
      });
      setTopProducts(
        Object.entries(productCount)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      );

    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; bg: string; text: string }> = {
      pending: { label: '待派发', bg: 'bg-amber-100', text: 'text-amber-700' },
      assigned: { label: '已派发', bg: 'bg-blue-100', text: 'text-blue-700' },
      partial_returned: { label: '部分回单', bg: 'bg-orange-100', text: 'text-orange-700' },
      returned: { label: '已回单', bg: 'bg-emerald-100', text: 'text-emerald-700' },
      feedbacked: { label: '已反馈', bg: 'bg-teal-100', text: 'text-teal-700' },
      completed: { label: '已导金蝶', bg: 'bg-slate-100', text: 'text-slate-600' },
      cancelled: { label: '已取消', bg: 'bg-red-100', text: 'text-red-700' },
    };
    return configs[status] || { label: status, bg: 'bg-slate-100', text: 'text-slate-600' };
  };

  const statusItems = metrics ? [
    { label: '待派发', count: metrics.pending, color: 'bg-amber-500', width: metrics.total > 0 ? (metrics.pending / metrics.total) * 100 : 0 },
    { label: '已派发', count: metrics.assigned, color: 'bg-blue-500', width: metrics.total > 0 ? (metrics.assigned / metrics.total) * 100 : 0 },
    { label: '回单中', count: metrics.returnProgress, color: 'bg-emerald-500', width: metrics.total > 0 ? (metrics.returnProgress / metrics.total) * 100 : 0 },
    { label: '已完成', count: metrics.completed, color: 'bg-slate-400', width: metrics.total > 0 ? (metrics.completed / metrics.total) * 100 : 0 },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageGuard permission="dashboard:view" title="无权查看首页" description="当前账号没有查看首页数据概览的权限。">
      <div className="min-h-screen bg-slate-50">
        {/* 顶部栏 */}
        <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">数据概览</h1>
                  <p className="text-sm text-slate-500">实时掌握业务运营状况</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-100 rounded-lg p-1">
                  {(['7d', '30d', '90d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                        timeRange === range
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {range === '7d' ? '近7天' : range === '30d' ? '近30天' : '近90天'}
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={loadData}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  刷新
                </Button>
                <Button size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  导出
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* 核心指标条 */}
          {metrics && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Link href="/orders" className="group">
                <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-sm text-slate-500">订单总数</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{metrics.total}</div>
                </div>
              </Link>
              <Link href="/customers" className="group">
                <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Users className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-sm text-slate-500">客户总数</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{customersCount}</div>
                </div>
              </Link>
              <Link href="/suppliers-manage" className="group">
                <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Building2 className="w-4 h-4 text-purple-500" />
                    </div>
                    <span className="text-sm text-slate-500">发货方</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{suppliersCount}</div>
                </div>
              </Link>
              <Link href="/stocks" className="group">
                <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                      <Package className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-sm text-slate-500">商品种类</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stocksCount}</div>
                </div>
              </Link>
              <Link href="/orders?status=pending" className="group">
                <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-red-300 hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <span className="text-sm text-slate-500">待处理</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{metrics.pending}</div>
                </div>
              </Link>
            </div>
          )}

          {/* 快捷操作 + 状态分布 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 快捷操作 - 2×2 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                  </div>
                  快捷操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/order-parse" className="flex flex-col items-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group">
                    <ClipboardList className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-slate-700">AI录单</span>
                  </Link>
                  <Link href="/shipping-export" className="flex flex-col items-center p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                    <Truck className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-slate-700">发货通知</span>
                  </Link>
                  <Link href="/return-receipt" className="flex flex-col items-center p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group">
                    <FileText className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-slate-700">回单导入</span>
                  </Link>
                  <Link href="/stocks" className="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group">
                    <Warehouse className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-slate-700">库存查询</span>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 订单状态分布 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                    <PieChart className="w-4 h-4 text-purple-500" />
                  </div>
                  订单状态分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statusItems.map((item) => (
                    <div key={item.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{item.label}</span>
                        <span className="font-medium text-slate-900">{item.count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${item.width}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 热门商品 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  热门商品 TOP5
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">暂无数据</div>
                ) : (
                  <div className="space-y-3">
                    {topProducts.map((product, index) => {
                      const maxCount = topProducts[0]?.count || 1;
                      const width = (product.count / maxCount) * 100;
                      const colors = [
                        'from-amber-400 to-amber-500',
                        'from-slate-400 to-slate-500',
                        'from-orange-400 to-orange-500',
                        'from-blue-400 to-blue-500',
                        'from-purple-400 to-purple-500',
                      ];
                      return (
                        <div key={product.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold text-white ${
                                index === 0 ? 'bg-amber-500' :
                                index === 1 ? 'bg-slate-500' :
                                index === 2 ? 'bg-orange-500' :
                                index === 3 ? 'bg-blue-500' : 'bg-purple-500'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="text-slate-700 truncate max-w-[120px]" title={product.name}>{product.name}</span>
                            </div>
                            <span className="font-medium text-slate-900">{product.count}</span>
                          </div>
                          <div className="h-2 bg-slate-100 rounded-full overflow-hidden ml-7">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${colors[index]} transition-all duration-500`}
                              style={{ width: `${width}%` }}
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
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  最近订单
                </CardTitle>
                <Link href="/orders">
                  <Button size="sm" variant="ghost" className="text-xs text-slate-500">
                    查看全部 <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="text-center text-slate-400 py-12">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无订单数据</p>
                </div>
              ) : (
                <div className="divide-y">
                  {recentOrders.map((order) => {
                    const config = getStatusConfig(order.status);
                    return (
                      <Link
                        key={order.id}
                        href={`/orders?search=${encodeURIComponent(order.sysOrderNo || order.orderNo)}`}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-900 truncate">
                              {order.sysOrderNo || order.orderNo}
                            </span>
                            <Badge variant="secondary" className={`text-xs ${config.bg} ${config.text}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {order.customerName} · {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageGuard>
  );
}
