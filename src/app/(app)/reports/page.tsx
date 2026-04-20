'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getOrderStatusBadgeClass, getOrderStatusLabel } from '@/lib/order-status';
import { toast } from 'sonner';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders } from '@/lib/auth';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Building2,
  Truck,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  PieChart,
  BarChart,
  ArrowUpDown,
  Calendar,
  ShoppingCart,
} from 'lucide-react';

interface OrderStatusStats {
  total: number;
  pending: number;
  assigned: number;
  partial_returned: number;
  returned: number;
  feedbacked: number;
  completed: number;
  cancelled: number;
}

interface ReportSummary {
  orderStatus: OrderStatusStats;
  orderTrend: Array<{ date: string; count: number }>;
  customer: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  supplier: {
    total: number;
    active: number;
    byType: Record<string, number>;
  };
  stock: {
    totalProducts: number;
    totalQuantity: number;
    lowStock: number;
    outOfStock: number;
    totalValue: number;
  };
  topProducts: Array<{ name: string; quantity: number; amount: number }>;
  topCustomers: Array<{ customerName: string; orderCount: number }>;
  topExpress: Array<{ expressCompany: string; count: number }>;
  summary: {
    totalOrders: number;
    totalCustomers: number;
    totalSuppliers: number;
    totalProducts: number;
    avgOrdersPerDay: number;
  };
}

interface SalesPerformance {
  bySalesperson: Array<{
    name: string;
    orderCount: number;
    pendingCount: number;
    assignedCount: number;
    returnedCount: number;
    completedCount: number;
    cancelledCount: number;
    totalQuantity: number;
    completionRate: number;
  }>;
  byOperator: Array<{
    name: string;
    orderCount: number;
    pendingCount: number;
    assignedCount: number;
    returnedCount: number;
    completedCount: number;
    cancelledCount: number;
    totalQuantity: number;
    completionRate: number;
  }>;
  summary: {
    totalOrders: number;
    totalSalesperson: number;
    totalOperator: number;
    avgOrdersPerSalesperson: number;
    avgOrdersPerOperator: number;
  };
}

interface SupplierAnalysis {
  bySupplier: Array<{
    id: string;
    name: string;
    code: string;
    type: string;
    orderCount: number;
    totalQuantity: number;
    statusBreakdown: {
      pending: number;
      assigned: number;
      returned: number;
      completed: number;
      cancelled: number;
    };
    completionRate: number;
    activeRate: number;
    lastOrderDate: string | null;
  }>;
  byType: Array<{
    type: string;
    supplierCount: number;
    orderCount: number;
    totalQuantity: number;
  }>;
  topSuppliers: Array<{
    id: string;
    name: string;
    type: string;
    orderCount: number;
    totalQuantity: number;
    completionRate: number;
  }>;
  summary: {
    totalSuppliers: number;
    totalOrders: number;
    avgOrdersPerSupplier: number;
    totalQuantity: number;
    unmatchedOrders: number;
  };
}

interface ReturnTimeline {
  summary: {
    totalOrders: number;
    ordersWithDispatch: number;
    ordersWithReturn: number;
    avgDispatchDays: string;
    avgReturnDays: string;
    avgTotalDays: string;
    medianDispatchDays: string;
    medianReturnDays: string;
    medianTotalDays: string;
    dispatchOnTimeRate: number;
    returnOnTimeRate: number;
  };
  dispatchDistribution: Array<{ range: string; count: number }>;
  returnDistribution: Array<{ range: string; count: number }>;
  byExpress: Array<{ company: string; orderCount: number; avgReturnDays: string }>;
  bySupplier: Array<{ name: string; orderCount: number; avgReturnDays: string }>;
  timingList: Array<{
    orderId: string;
    sysOrderNo: string;
    createdAt: string;
    returnedAt: string | null;
    totalDays: number | null;
    expressCompany: string;
    supplierName: string;
  }>;
}

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<string>('30');
  const [startDate, setStartDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [salesData, setSalesData] = useState<SalesPerformance | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierAnalysis | null>(null);
  const [timelineData, setTimelineData] = useState<ReturnTimeline | null>(null);

  useEffect(() => {
    loadAllData();
  }, [dateRange, startDate]);

  const getDateRange = () => {
    const endDate = new Date().toISOString().slice(0, 10);
    if (startDate) {
      return `&startDate=${startDate}&endDate=${endDate}`;
    }
    const days = parseInt(dateRange) || 30;
    const start = new Date();
    start.setDate(start.getDate() - days);
    return `&startDate=${start.toISOString().slice(0, 10)}&endDate=${endDate}`;
  };

  const loadAllData = async () => {
    setLoading(true);
    const dateParams = getDateRange();

    try {
      const headers = buildUserInfoHeaders();
      const [reportRes, salesRes, supplierRes, timelineRes] = await Promise.all([
        fetch(`/api/reports/stats?${dateParams}`, { headers }),
        fetch(`/api/reports/sales-performance?${dateParams}`, { headers }),
        fetch(`/api/reports/supplier-analysis?${dateParams}`, { headers }),
        fetch(`/api/reports/return-timeline?${dateParams}`, { headers }),
      ]);

      const [reportJson, salesJson, supplierJson, timelineJson] = await Promise.all([
        reportRes.json(),
        salesRes.json(),
        supplierRes.json(),
        timelineRes.json(),
      ]);

      if (reportJson.success) setReportData(reportJson.data);
      if (salesJson.success) setSalesData(salesJson.data);
      if (supplierJson.success) setSupplierData(supplierJson.data);
      if (timelineJson.success) setTimelineData(timelineJson.data);
    } catch (error) {
      console.error('加载报表数据失败:', error);
      toast.error('加载报表数据失败');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: string) => {
    let csv = '';
    let filename = '';

    if (type === 'orders' && reportData) {
      filename = '订单统计报表';
      csv = [
        ['报表类型', '订单统计'],
        ['生成时间', new Date().toLocaleString('zh-CN')],
        ['时间范围', `近${dateRange}天`],
        [],
        ['订单状态', '数量'],
        ['总订单', reportData.orderStatus.total],
        ['待派发', reportData.orderStatus.pending],
        ['已派发', reportData.orderStatus.assigned],
        ['部分回单', reportData.orderStatus.partial_returned],
        ['已回单', reportData.orderStatus.returned],
        ['已反馈', reportData.orderStatus.feedbacked],
        ['已导金蝶', reportData.orderStatus.completed],
        ['已取消', reportData.orderStatus.cancelled],
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } else if (type === 'sales' && salesData) {
      filename = '销售业绩报表';
      csv = [
        ['报表类型', '销售业绩'],
        ['生成时间', new Date().toLocaleString('zh-CN')],
        [],
        ['业务员业绩排行'],
        ['姓名', '订单数', '待派发', '已派发', '已回传', '已完成', '完成率'],
        ...salesData.bySalesperson.map(s => [
          s.name, s.orderCount, s.pendingCount, s.assignedCount,
          s.returnedCount, s.completedCount, `${s.completionRate}%`,
        ]),
        [],
        ['跟单员业绩排行'],
        ['姓名', '订单数', '待派发', '已派发', '已回传', '已完成', '完成率'],
        ...salesData.byOperator.map(o => [
          o.name, o.orderCount, o.pendingCount, o.assignedCount,
          o.returnedCount, o.completedCount, `${o.completionRate}%`,
        ]),
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } else if (type === 'supplier' && supplierData) {
      filename = '供应商分析报表';
      csv = [
        ['报表类型', '供应商分析'],
        ['生成时间', new Date().toLocaleString('zh-CN')],
        [],
        ['供应商订单排行'],
        ['供应商名称', '订单数', '商品数量', '完成率'],
        ...supplierData.topSuppliers.map(s => [
          s.name, s.orderCount, s.totalQuantity, `${s.completionRate}%`,
        ]),
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    } else if (type === 'timeline' && timelineData) {
      filename = '回单时效报表';
      csv = [
        ['报表类型', '回单时效分析'],
        ['生成时间', new Date().toLocaleString('zh-CN')],
        [],
        ['时效汇总'],
        ['平均派发天数', timelineData.summary.avgDispatchDays],
        ['平均回传天数', timelineData.summary.avgReturnDays],
        ['按时回传率', `${timelineData.summary.returnOnTimeRate}%`],
        [],
        ['快递时效排行'],
        ['快递公司', '订单数', '平均回传天数'],
        ...timelineData.byExpress.map(e => [e.company, e.orderCount, e.avgReturnDays]),
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    }

    if (csv) {
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('报表导出成功');
    }
  };

  const getStatusBadge = (status: string, count: number) => {
    return (
      <Badge className={status === 'total' ? 'bg-gray-100 text-gray-800' : getOrderStatusBadgeClass(status)}>
        {(status === 'total' ? '总计' : getOrderStatusLabel(status)) || status}: {count}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageGuard permission="dashboard:view" title="无权查看报表" description="当前账号没有查看数据报表的权限。">
    <div className="space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <BarChart3 className="h-8 w-8" />
            数据报表
          </h1>
          <p className="text-muted-foreground">
            系统运营数据统计与分析
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="选择时间范围" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">近7天</SelectItem>
              <SelectItem value="30">近30天</SelectItem>
              <SelectItem value="90">近90天</SelectItem>
              <SelectItem value="365">近一年</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => loadAllData()} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:w-fit sm:grid-cols-4">
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="sales">销售业绩</TabsTrigger>
          <TabsTrigger value="supplier">供应商</TabsTrigger>
          <TabsTrigger value="timeline">回单时效</TabsTrigger>
        </TabsList>

        {/* 总览 */}
        <TabsContent value="overview" className="space-y-4">
          {/* 汇总卡片 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.summary.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground">
                  日均 {reportData?.summary.avgOrdersPerDay?.toFixed(1) || 0} 单
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">客户总数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.customer.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  本月新增 {reportData?.customer.newThisMonth || 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">供应商总数</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.supplier.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  活跃 {reportData?.supplier.active || 0} 家
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">商品总数</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{reportData?.stock.totalProducts || 0}</div>
                <p className="text-xs text-muted-foreground">
                  低库存 {reportData?.stock.lowStock || 0}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 订单状态分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                订单状态分布
              </CardTitle>
              <CardDescription>当前时间范围内的订单状态统计</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {reportData?.orderStatus && (
                  <>
                    {getStatusBadge('total', reportData.orderStatus.total)}
                    {getStatusBadge('pending', reportData.orderStatus.pending)}
                    {getStatusBadge('assigned', reportData.orderStatus.assigned)}
                    {getStatusBadge('partial_returned', reportData.orderStatus.partial_returned)}
                    {getStatusBadge('returned', reportData.orderStatus.returned)}
                    {getStatusBadge('feedbacked', reportData.orderStatus.feedbacked)}
                    {getStatusBadge('completed', reportData.orderStatus.completed)}
                    {getStatusBadge('cancelled', reportData.orderStatus.cancelled)}
                  </>
                )}
              </div>

              {/* 订单状态比例条 */}
              {reportData?.orderStatus && reportData.orderStatus.total > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex h-4 rounded-full overflow-hidden bg-gray-100">
                    {reportData.orderStatus.pending > 0 && (
                      <div
                        className="bg-yellow-400"
                        style={{ width: `${(reportData.orderStatus.pending / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                    {reportData.orderStatus.assigned > 0 && (
                      <div
                        className="bg-blue-400"
                        style={{ width: `${(reportData.orderStatus.assigned / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                    {reportData.orderStatus.partial_returned > 0 && (
                      <div
                        className="bg-orange-400"
                        style={{ width: `${(reportData.orderStatus.partial_returned / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                    {reportData.orderStatus.returned > 0 && (
                      <div
                        className="bg-green-400"
                        style={{ width: `${(reportData.orderStatus.returned / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                    {reportData.orderStatus.feedbacked > 0 && (
                      <div
                        className="bg-teal-400"
                        style={{ width: `${(reportData.orderStatus.feedbacked / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                    {reportData.orderStatus.completed > 0 && (
                      <div
                        className="bg-gray-400"
                        style={{ width: `${(reportData.orderStatus.completed / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                    {reportData.orderStatus.cancelled > 0 && (
                      <div
                        className="bg-red-400"
                        style={{ width: `${(reportData.orderStatus.cancelled / reportData.orderStatus.total) * 100}%` }}
                      />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-yellow-400"></span> 待派发
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-blue-400"></span> 已派发
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-orange-400"></span> 部分回单
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-green-400"></span> 已回传
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-gray-400"></span> 已完成
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded bg-red-400"></span> 已取消
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 热销商品和客户 */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  热销商品 TOP10
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => exportReport('orders')}
                  className="w-full sm:w-auto"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>商品名称</TableHead>
                      <TableHead className="text-right">销售数量</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.topProducts?.slice(0, 10).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{product.name}</TableCell>
                        <TableCell className="text-right font-medium">
                          {product.quantity}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData?.topProducts || reportData.topProducts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  订单客户 TOP10
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>客户名称</TableHead>
                      <TableHead className="text-right">订单数</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData?.topCustomers?.slice(0, 10).map((customer, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{customer.customerName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {customer.orderCount}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!reportData?.topCustomers || reportData.topCustomers.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 快递使用统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                快递使用统计
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                {reportData?.topExpress?.map((express, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Badge variant="outline">{express.expressCompany}</Badge>
                    <span className="text-sm font-medium">{express.count} 单</span>
                  </div>
                ))}
                {(!reportData?.topExpress || reportData.topExpress.length === 0) && (
                  <span className="text-muted-foreground">暂无数据</span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 库存预警 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                库存预警
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">缺货商品</p>
                    <p className="text-2xl font-bold text-red-600">{reportData?.stock.outOfStock || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <Clock className="h-8 w-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">低库存商品</p>
                    <p className="text-2xl font-bold text-orange-600">{reportData?.stock.lowStock || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Package className="h-8 w-8 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">库存总量</p>
                    <p className="text-2xl font-bold text-blue-600">{reportData?.stock.totalQuantity || 0}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 销售业绩 */}
        <TabsContent value="sales" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.summary.totalOrders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">业务员数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.summary.totalSalesperson || 0}</div>
                <p className="text-xs text-muted-foreground">
                  人均 {salesData?.summary.avgOrdersPerSalesperson || 0} 单
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">跟单员数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.summary.totalOperator || 0}</div>
                <p className="text-xs text-muted-foreground">
                  人均 {salesData?.summary.avgOrdersPerOperator || 0} 单
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">平均完成率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData?.bySalesperson.length
                    ? Math.round(
                        salesData.bySalesperson.reduce((sum, s) => sum + s.completionRate, 0) /
                          salesData.bySalesperson.length
                      )
                    : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  业务员业绩排行
                </span>
                <Button variant="ghost" size="sm" onClick={() => exportReport('sales')} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>业务员</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                    <TableHead className="text-right">商品数量</TableHead>
                    <TableHead className="text-center">待派发</TableHead>
                    <TableHead className="text-center">已派发</TableHead>
                    <TableHead className="text-center">已回传</TableHead>
                    <TableHead className="text-center">已完成</TableHead>
                    <TableHead className="text-right">完成率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData?.bySalesperson.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right font-medium">{item.orderCount}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-center">
                        {item.pendingCount > 0 && (
                          <Badge variant="outline">{item.pendingCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.assignedCount > 0 && (
                          <Badge variant="outline" className="bg-blue-50">{item.assignedCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.returnedCount > 0 && (
                          <Badge variant="outline" className="bg-green-50">{item.returnedCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.completedCount > 0 && (
                          <Badge className="bg-green-100">{item.completedCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.completionRate >= 50 ? 'text-green-600' : 'text-orange-600'}>
                          {item.completionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!salesData?.bySalesperson || salesData.bySalesperson.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                跟单员业绩排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>跟单员</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                    <TableHead className="text-right">商品数量</TableHead>
                    <TableHead className="text-center">待派发</TableHead>
                    <TableHead className="text-center">已派发</TableHead>
                    <TableHead className="text-center">已回传</TableHead>
                    <TableHead className="text-center">已完成</TableHead>
                    <TableHead className="text-right">完成率</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData?.byOperator.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right font-medium">{item.orderCount}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-center">
                        {item.pendingCount > 0 && (
                          <Badge variant="outline">{item.pendingCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.assignedCount > 0 && (
                          <Badge variant="outline" className="bg-blue-50">{item.assignedCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.returnedCount > 0 && (
                          <Badge variant="outline" className="bg-green-50">{item.returnedCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.completedCount > 0 && (
                          <Badge className="bg-green-100">{item.completedCount}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.completionRate >= 50 ? 'text-green-600' : 'text-orange-600'}>
                          {item.completionRate}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!salesData?.byOperator || salesData.byOperator.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 供应商分析 */}
        <TabsContent value="supplier" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">供应商总数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supplierData?.summary.totalSuppliers || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supplierData?.summary.totalOrders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">供应商平均订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{supplierData?.summary.avgOrdersPerSupplier || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">未分配订单</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {supplierData?.summary.unmatchedOrders || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  供应商订单排行 TOP10
                </span>
                <Button variant="ghost" size="sm" onClick={() => exportReport('supplier')} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>供应商名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                    <TableHead className="text-right">商品数量</TableHead>
                    <TableHead className="text-center">已回传</TableHead>
                    <TableHead className="text-center">已完成</TableHead>
                    <TableHead className="text-right">完成率</TableHead>
                    <TableHead className="text-right">最近订单</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplierData?.topSuppliers.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.type === 'supplier' ? '供应商' : item.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.orderCount}</TableCell>
                      <TableCell className="text-right">{item.totalQuantity}</TableCell>
                      <TableCell className="text-center">
                        {supplierData.bySupplier.find(s => s.id === item.id)?.statusBreakdown.returned || 0}
                      </TableCell>
                      <TableCell className="text-center">
                        {supplierData.bySupplier.find(s => s.id === item.id)?.statusBreakdown.completed || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={item.completionRate >= 50 ? 'text-green-600' : 'text-orange-600'}>
                          {item.completionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {supplierData.bySupplier.find(s => s.id === item.id)?.lastOrderDate?.slice(0, 10) || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!supplierData?.topSuppliers || supplierData.topSuppliers.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* 按类型汇总 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                按类型汇总
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {supplierData?.byType.map((item, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {item.type === 'supplier' ? '供应商' : item.type}
                      </span>
                      <Badge>{item.supplierCount} 家</Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">订单数</span>
                        <span className="font-medium">{item.orderCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">商品数量</span>
                        <span className="font-medium">{item.totalQuantity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 回单时效 */}
        <TabsContent value="timeline" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">总订单数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{timelineData?.summary.totalOrders || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">平均派发天数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timelineData?.summary.avgDispatchDays || 0}
                  <span className="text-sm font-normal ml-1">天</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">平均回传天数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {timelineData?.summary.avgReturnDays || 0}
                  <span className="text-sm font-normal ml-1">天</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">按时回传率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(timelineData?.summary.returnOnTimeRate || 0) >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                  {timelineData?.summary.returnOnTimeRate || 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  快递时效排行
                </span>
                <Button variant="ghost" size="sm" onClick={() => exportReport('timeline')} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>快递公司</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                    <TableHead className="text-right">平均回传天数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timelineData?.byExpress.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.company}</TableCell>
                      <TableCell className="text-right">{item.orderCount}</TableCell>
                      <TableCell className="text-right">
                        <span className={parseFloat(item.avgReturnDays) <= 3 ? 'text-green-600' : 'text-orange-600'}>
                          {item.avgReturnDays} 天
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!timelineData?.byExpress || timelineData.byExpress.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                供应商时效排行
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>排名</TableHead>
                    <TableHead>供应商名称</TableHead>
                    <TableHead className="text-right">订单数</TableHead>
                    <TableHead className="text-right">平均回传天数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timelineData?.bySupplier.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.orderCount}</TableCell>
                      <TableCell className="text-right">
                        <span className={parseFloat(item.avgReturnDays) <= 5 ? 'text-green-600' : 'text-orange-600'}>
                          {item.avgReturnDays} 天
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!timelineData?.bySupplier || timelineData.bySupplier.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* 回单时效分布 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                回单时效分布
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>派发时效分布</span>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
                    {timelineData?.dispatchDistribution.map((item, index) => (
                      <div
                        key={index}
                        className={[
                          'flex items-center justify-center text-xs font-medium text-white',
                          index === 0 ? 'bg-green-500' : '',
                          index === 1 ? 'bg-blue-500' : '',
                          index === 2 ? 'bg-yellow-500' : '',
                          index === 3 ? 'bg-orange-500' : '',
                          index === 4 ? 'bg-red-500' : '',
                        ].join(' ')}
                        style={{
                          width: `${timelineData?.summary.ordersWithDispatch
                            ? (item.count / timelineData.summary.ordersWithDispatch) * 100
                            : 0}%`,
                        }}
                        title={`${item.range}: ${item.count}`}
                      >
                        {item.count > 0 && item.count}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    {timelineData?.dispatchDistribution.map((item, index) => (
                      <span key={index}>{item.range}</span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>回传时效分布</span>
                  </div>
                  <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100">
                    {timelineData?.returnDistribution.map((item, index) => (
                      <div
                        key={index}
                        className={[
                          'flex items-center justify-center text-xs font-medium text-white',
                          index === 0 ? 'bg-green-500' : '',
                          index === 1 ? 'bg-blue-500' : '',
                          index === 2 ? 'bg-yellow-500' : '',
                          index === 3 ? 'bg-orange-500' : '',
                          index === 4 ? 'bg-red-500' : '',
                        ].join(' ')}
                        style={{
                          width: `${timelineData?.summary.ordersWithReturn
                            ? (item.count / timelineData.summary.ordersWithReturn) * 100
                            : 0}%`,
                        }}
                        title={`${item.range}: ${item.count}`}
                      >
                        {item.count > 0 && item.count}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    {timelineData?.returnDistribution.map((item, index) => (
                      <span key={index}>{item.range}</span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PageGuard>
  );
}
