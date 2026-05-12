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
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import {
  ShoppingCart,
  Users,
  Building2,
  Package,
  RefreshCw,
  Download,
  BarChart3,
  Bell,
  ClipboardList,
  Truck,
  Package as PackageIcon,
  Warehouse,
  FileText,
  Settings,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';

interface Order {
  id: string;
  sysOrderNo: string;
  orderNo: string;
  status: string;
  customerName: string;
  createdAt: string;
  items: Array<{ productName: string; quantity: number }>;
}

interface StockAlert {
  productName: string;
  quantity: number;
  type: 'out' | 'low';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = buildUserInfoHeaders();

      const [ordersRes, stocksRes] = await Promise.all([
        fetch('/api/orders?createdFrom=' + new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) + '&pageSize=99999', { headers }),
        fetch('/api/stocks?pageSize=99999', { headers }),
      ]);

      const [ordersData, stocksData] = await Promise.all([
        ordersRes.json(),
        stocksRes.json(),
      ]);

      const ordersList: Order[] = (ordersData.data || []).map((o: Record<string, unknown>) => ({
        id: o.id as string,
        sysOrderNo: (o.sysOrderNo as string) || '',
        orderNo: o.orderNo as string,
        status: o.status as string,
        customerName: (o.customerName as string) || '-',
        createdAt: o.createdAt as string,
        items: (o.items as Array<{ productName: string; quantity: number }>) || [],
      }));

      setOrders(ordersList);

      // 库存预警
      const stocks = stocksData.data || [];
      const alerts: StockAlert[] = [];
      stocks.forEach((s: Record<string, unknown>) => {
        const qty = (s.quantity as number) || 0;
        if (qty === 0) {
          alerts.push({ productName: (s.productName as string) || '未知商品', quantity: 0, type: 'out' });
        } else if (qty <= 2) {
          alerts.push({ productName: (s.productName as string) || '未知商品', quantity: qty, type: 'low' });
        }
      });
      setStockAlerts(alerts.slice(0, 5));

    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
      pending: { label: '待派发', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
      assigned: { label: '已派发', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Truck },
      partial_returned: { label: '部分回单', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: PackageIcon },
      returned: { label: '已回单', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
      feedbacked: { label: '已反馈', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200', icon: CheckCircle },
      completed: { label: '已导金蝶', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: CheckCircle },
      cancelled: { label: '已取消', color: 'text-red-700', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
    };
    return configs[status] || { label: status, color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: Clock };
  };

  // 统计数据
  const pendingOrders = orders.filter(o => o.status === ORDER_STATUS_PENDING);
  const assignedOrders = orders.filter(o => o.status === ORDER_STATUS_ASSIGNED);
  const returnOrders = orders.filter(o =>
    [ORDER_STATUS_PARTIAL_RETURNED, ORDER_STATUS_RETURNED, ORDER_STATUS_FEEDBACKED].includes(o.status as typeof ORDER_STATUS_PARTIAL_RETURNED)
  );

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const selectAllPending = () => {
    if (selectedOrders.size === pendingOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(pendingOrders.map(o => o.id)));
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '上午好';
    if (hour < 18) return '下午好';
    return '晚上好';
  };

  const todayTasks = pendingOrders.length + assignedOrders.length + returnOrders.length + stockAlerts.length;

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
        {/* 工作台头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  {getGreeting()}，{user?.realName || user?.username || '用户'}
                </h1>
                <p className="text-blue-100 mt-1">
                  {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                  <div className="text-2xl font-bold">{todayTasks}</div>
                  <div className="text-xs text-blue-100">待处理任务</div>
                </div>
                <Button variant="secondary" size="sm" onClick={loadData} className="bg-white/20 text-white hover:bg-white/30 border-0">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  刷新
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-6 space-y-6">
          {/* 快捷操作 */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-slate-100/50 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                快捷操作
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                <Link href="/order-parse" className="flex flex-col items-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors group">
                  <ClipboardList className="w-8 h-8 text-blue-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">AI智能录单</span>
                </Link>
                <Link href="/shipping-export" className="flex flex-col items-center p-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group">
                  <Truck className="w-8 h-8 text-emerald-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">发货通知</span>
                </Link>
                <Link href="/return-receipt" className="flex flex-col items-center p-4 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors group">
                  <PackageIcon className="w-8 h-8 text-amber-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">回单导入</span>
                </Link>
                <Link href="/stocks" className="flex flex-col items-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors group">
                  <Warehouse className="w-8 h-8 text-purple-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">库存查询</span>
                </Link>
                <Link href="/reports" className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <FileText className="w-8 h-8 text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">数据报表</span>
                </Link>
                <Link href="/system-configs" className="flex flex-col items-center p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group">
                  <Settings className="w-8 h-8 text-slate-600 mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-slate-700">系统设置</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* 待处理任务 */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-slate-100/50 border-b">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                待处理任务
                <Badge variant="destructive" className="ml-2">{todayTasks}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {/* 待派发订单 */}
                {pendingOrders.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
                          {pendingOrders.length}
                        </div>
                        <span className="font-medium text-slate-900">待派发订单</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedOrders.size === pendingOrders.length}
                          onCheckedChange={selectAllPending}
                        />
                        <Button size="sm" variant="default" className="h-7 text-xs">
                          批量派发
                        </Button>
                        <Link href="/orders?status=pending">
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500">
                            查看全部 <ChevronRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {pendingOrders.slice(0, 5).map(order => (
                        <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/50 hover:bg-amber-50 transition-colors">
                          <Checkbox
                            checked={selectedOrders.has(order.id)}
                            onCheckedChange={() => toggleOrder(order.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{order.sysOrderNo || order.orderNo}</span>
                              <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-700">{order.customerName}</Badge>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {order.items.length} 个商品 · {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                            </div>
                          </div>
                          <Link href={`/orders?search=${encodeURIComponent(order.sysOrderNo || order.orderNo)}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs">派发</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 库存预警 */}
                {stockAlerts.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                          {stockAlerts.length}
                        </div>
                        <span className="font-medium text-slate-900">库存预警</span>
                      </div>
                      <Link href="/stocks">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500">
                          查看全部 <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {stockAlerts.slice(0, 3).map((alert, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 hover:bg-red-50 transition-colors">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm">{alert.productName}</span>
                          </div>
                          <Badge variant="destructive" className="text-xs">
                            {alert.type === 'out' ? '缺货' : `仅剩${alert.quantity}件`}
                          </Badge>
                          <Link href="/stocks">
                            <Button size="sm" variant="outline" className="h-7 text-xs">补货</Button>
                          </Link>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 待确认回单 */}
                {returnOrders.length > 0 && (
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">
                          {returnOrders.length}
                        </div>
                        <span className="font-medium text-slate-900">待确认回单</span>
                      </div>
                      <Link href="/orders?status=returned,feedbacked">
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500">
                          查看全部 <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </div>
                    <div className="space-y-2">
                      {returnOrders.slice(0, 3).map(order => {
                        const config = getStatusConfig(order.status);
                        return (
                          <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm">{order.sysOrderNo || order.orderNo}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">{order.customerName}</Badge>
                            </div>
                            <Badge variant="secondary" className={`text-xs ${config.bg} ${config.color}`}>
                              {config.label}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 无待处理任务 */}
                {todayTasks === 0 && (
                  <div className="p-8 text-center">
                    <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">太棒了！暂无待处理任务</p>
                    <p className="text-slate-400 text-sm mt-1">继续保持高效工作</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 最近订单 */}
          <Card className="border-0 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-slate-100/50 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  最近订单
                </CardTitle>
                <Link href="/orders">
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-slate-500">
                    查看全部 <ChevronRight className="w-3 h-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无订单数据</p>
                </div>
              ) : (
                <div className="divide-y">
                  {orders.slice(0, 8).map(order => {
                    const config = getStatusConfig(order.status);
                    return (
                      <Link
                        key={order.id}
                        href={`/orders?search=${encodeURIComponent(order.sysOrderNo || order.orderNo)}`}
                        className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{order.sysOrderNo || order.orderNo}</span>
                            <Badge variant="secondary" className={`text-xs ${config.bg} ${config.color}`}>
                              {config.label}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                            <span>{order.customerName}</span>
                            <span>·</span>
                            <span>{order.items.length}个商品</span>
                            <span>·</span>
                            <span>{new Date(order.createdAt).toLocaleDateString('zh-CN')}</span>
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
