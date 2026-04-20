'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders } from '@/lib/auth';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Plus,
  Download,
  RefreshCw,
  DollarSign,
  History,
  Package,
  Truck,
  Building2,
  User,
  Calendar as CalendarIcon,
  X,
  Loader2,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface OrderCostRecord {
  id: string;
  orderId: string;
  orderNo: string;
  matchCode: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  warehouseName: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  expressFee: number;
  otherFee: number;
  totalAmount: number;
  orderExpressFee?: number;
  orderOtherFee?: number;
  orderTotalAmount?: number;
  orderGoodsCost?: number;
  orderLineCount?: number;
  expressCompany: string;
  trackingNo: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  customerCode: string;
  customerName: string;
  salesperson: string;
  operatorName: string;
  orderDate: string;
  shippedDate: string;
  returnedDate: string;
  dispatchBatch: string;
  remark: string;
  createdAt: string;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
}

interface CostStats {
  totalQuantity: number;
  totalCost: number;
  totalExpressFee: number;
  totalOtherFee: number;
  totalAmount: number;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export default function OrderCostHistoryPage() {
  const [records, setRecords] = useState<OrderCostRecord[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrderNo, setSearchOrderNo] = useState('');
  const [searchProductCode, setSearchProductCode] = useState('');
  const [searchCustomerCode, setSearchCustomerCode] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [stats, setStats] = useState<CostStats>({
    totalQuantity: 0,
    totalCost: 0,
    totalExpressFee: 0,
    totalOtherFee: 0,
    totalAmount: 0
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 50,
    total: 0,
    totalPages: 0
  });

  // 导入对话框状态
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'orders' | 'dateRange'>('orders');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [importDateRange, setImportDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: ''
  });
  const [importing, setImporting] = useState(false);

  // 更新费用对话框状态
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OrderCostRecord | null>(null);
  const [expressFee, setExpressFee] = useState<number>(0);
  const [otherFee, setOtherFee] = useState<number>(0);
  const [feeRemark, setFeeRemark] = useState<string>('');
  const [updatingFee, setUpdatingFee] = useState(false);

  // 加载数据
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = buildUserInfoHeaders();
      const params = new URLSearchParams();
      if (searchOrderNo) params.set('orderNo', searchOrderNo);
      if (searchProductCode) params.set('productCode', searchProductCode);
      if (searchCustomerCode) params.set('customerCode', searchCustomerCode);
      if (supplierFilter !== 'all') params.set('supplierId', supplierFilter);
      if (dateRange.start) params.set('startDate', dateRange.start);
      if (dateRange.end) params.set('endDate', dateRange.end);
      params.set('page', String(pagination.page));
      params.set('pageSize', String(pagination.pageSize));

      const [recordsRes, suppliersRes] = await Promise.all([
        fetch(`/api/order-cost-history?${params.toString()}`, { headers }),
        fetch('/api/suppliers?active=true', { headers }),
      ]);

      const recordsData = await recordsRes.json();
      const suppliersData = await suppliersRes.json();

      if (recordsData.success) {
        setRecords(recordsData.data || []);
        setStats(recordsData.stats || stats);
        setPagination(recordsData.pagination || pagination);
      } else {
        toast.error(recordsData.error || '加载数据失败');
      }

      if (suppliersData.success) {
        setSuppliers(suppliersData.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  }, [searchOrderNo, searchProductCode, searchCustomerCode, supplierFilter, dateRange, pagination.page, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 导入历史成本
  const handleImport = async () => {
    setImporting(true);
    try {
      const body: Record<string, unknown> = {};

      if (importType === 'orders') {
        if (selectedOrderIds.length === 0) {
          toast.error('请选择要导入的订单');
          setImporting(false);
          return;
        }
        body.orderIds = selectedOrderIds;
      } else {
        if (!importDateRange.start || !importDateRange.end) {
          toast.error('请选择日期范围');
          setImporting(false);
          return;
        }
        body.startDate = importDateRange.start;
        body.endDate = importDateRange.end;
      }

      const res = await fetch('/api/order-cost-history', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || '导入成功');
        setIsImportDialogOpen(false);
        setSelectedOrderIds([]);
        setImportDateRange({ start: '', end: '' });
        loadData();
      } else {
        toast.error(data.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 导出Excel
  const handleExport = () => {
    const exportData = records.map(r => ({
      '内部订单号': r.orderId,
      '客户订单号': r.orderNo,
      '匹配码': r.matchCode,
      '供应商': r.supplierName,
      '仓库': r.warehouseName,
      '商品编码': r.productCode,
      '商品名称': r.productName,
      '数量': r.quantity,
      '单台成本': r.unitCost,
      '成本合计': r.totalCost,
      '运费': r.expressFee,
      '其他费用': r.otherFee,
      '总金额': r.totalAmount,
      '快递公司': r.expressCompany,
      '物流单号': r.trackingNo,
      '收货人': r.receiverName,
      '收货电话': r.receiverPhone,
      '收货地址': r.receiverAddress,
      '客户代码': r.customerCode,
      '客户名称': r.customerName,
      '业务员': r.salesperson,
      '跟单员': r.operatorName,
      '下单日期': r.orderDate,
      '发货日期': r.shippedDate,
      '回单日期': r.returnedDate,
      '派发批次': r.dispatchBatch,
      '备注': r.remark
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '历史成本');

    // 设置列宽
    ws['!cols'] = [
      { wch: 36 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 },
      { wch: 15 }, { wch: 40 }, { wch: 8 }, { wch: 12 }, { wch: 12 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }, { wch: 20 },
      { wch: 10 }, { wch: 15 }, { wch: 50 }, { wch: 12 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 25 }, { wch: 30 }
    ];

    const filename = `历史成本库_${format(new Date(), 'yyyyMMdd_HHmmss')}.xlsx`;
    XLSX.writeFile(wb, filename);
    toast.success('导出成功');
  };

  // 重置筛选
  const handleReset = () => {
    setSearchOrderNo('');
    setSearchProductCode('');
    setSearchCustomerCode('');
    setSupplierFilter('all');
    setDateRange({ start: '', end: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 打开费用编辑对话框
  const handleOpenFeeDialog = (record: OrderCostRecord) => {
    setEditingRecord(record);
    setExpressFee(record.orderExpressFee ?? record.expressFee);
    setOtherFee(record.orderOtherFee ?? record.otherFee);
    setFeeRemark(record.remark || '');
    setIsFeeDialogOpen(true);
  };

  // 更新费用
  const handleUpdateFee = async () => {
    if (!editingRecord) return;
    
    setUpdatingFee(true);
    try {
      const res = await fetch('/api/order-cost-history/fee', {
        method: 'PATCH',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: editingRecord.orderId,
          orderNo: editingRecord.orderNo,
          expressFee,
          otherFee,
          remark: feeRemark
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || '更新成功');
        setIsFeeDialogOpen(false);
        loadData();
      } else {
        toast.error(data.error || '更新失败');
      }
    } catch (error) {
      console.error('更新费用失败:', error);
      toast.error('更新费用失败');
    } finally {
      setUpdatingFee(false);
    }
  };

  return (
    <PageGuard
      permission="orders:view"
      title="无权查看历史成本"
      description="当前账号没有查看历史成本库的权限。"
    >
    <div className="container mx-auto space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <History className="h-6 w-6" />
          <h1 className="text-2xl font-bold">历史成本库</h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            导入成本数据
          </Button>
          <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            导出Excel
          </Button>
          <Button variant="outline" onClick={loadData} className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">总数量</p>
                <p className="text-xl font-bold">{stats.totalQuantity.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">成本合计</p>
                <p className="text-xl font-bold">¥{stats.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">运费合计</p>
                <p className="text-xl font-bold">¥{stats.totalExpressFee.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">其他费用</p>
                <p className="text-xl font-bold">¥{stats.totalOtherFee.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">总金额</p>
                <p className="text-xl font-bold text-green-600">¥{stats.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <div className="space-y-2">
              <Label>订单号</Label>
              <Input
                placeholder="输入订单号"
                value={searchOrderNo}
                onChange={(e) => {
                  setSearchOrderNo(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>商品编码</Label>
              <Input
                placeholder="输入商品编码"
                value={searchProductCode}
                onChange={(e) => {
                  setSearchProductCode(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>客户代码</Label>
              <Input
                placeholder="输入客户代码"
                value={searchCustomerCode}
                onChange={(e) => {
                  setSearchCustomerCode(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>供应商</Label>
              <Select value={supplierFilter} onValueChange={(v) => {
                setSupplierFilter(v);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="全部供应商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部供应商</SelectItem>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>开始日期</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, start: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>结束日期</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => {
                  setDateRange(prev => ({ ...prev, end: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={handleReset} className="w-full sm:w-auto">
              <X className="h-4 w-4 mr-2" />
              重置筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            数据列表 ({pagination.total.toLocaleString()} 条记录)
          </CardTitle>
          <CardDescription>
            第 {pagination.page} / {pagination.totalPages} 页
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">客户订单号</TableHead>
                  <TableHead className="w-[100px]">供应商</TableHead>
                  <TableHead className="w-[80px]">仓库</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead className="w-[60px]">数量</TableHead>
                  <TableHead className="w-[80px] text-right">单台成本</TableHead>
                  <TableHead className="w-[90px] text-right">成本合计</TableHead>
                  <TableHead className="w-[70px] text-right">运费</TableHead>
                  <TableHead className="w-[80px] text-right">总金额</TableHead>
                  <TableHead className="w-[100px]">客户名称</TableHead>
                  <TableHead className="w-[80px]">派发批次</TableHead>
                  <TableHead className="w-[100px]">下单日期</TableHead>
                  <TableHead className="w-[80px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.orderNo}</TableCell>
                      <TableCell>{record.supplierName || '-'}</TableCell>
                      <TableCell>{record.warehouseName || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={record.productName}>
                        {record.productName || '-'}
                      </TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell className="text-right">
                        ¥{record.unitCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{record.totalCost.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ¥{record.expressFee.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ¥{record.totalAmount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate" title={record.customerName}>
                        {record.customerName || '-'}
                      </TableCell>
                      <TableCell>{record.dispatchBatch || '-'}</TableCell>
                      <TableCell>{record.orderDate || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenFeeDialog(record)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-muted-foreground">
                共 {pagination.total} 条记录，每页 {pagination.pageSize} 条
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                >
                  上一页
                </Button>
                <span className="text-sm">
                  第 {pagination.page} / {pagination.totalPages} 页
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 导入对话框 */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>导入历史成本数据</DialogTitle>
            <DialogDescription>
              将订单数据导入到历史成本库中，支持按订单或日期范围导入
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={importType} onValueChange={(v) => setImportType(v as 'orders' | 'dateRange')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="orders">按订单导入</TabsTrigger>
              <TabsTrigger value="dateRange">按日期范围</TabsTrigger>
            </TabsList>
            
            <TabsContent value="orders" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>订单ID列表</Label>
                <p className="text-sm text-muted-foreground">
                  请输入订单ID，每行一个或用逗号分隔
                </p>
                <Textarea
                  placeholder="订单ID列表..."
                  rows={6}
                  value={selectedOrderIds.join('\n')}
                  onChange={(e) => {
                    const ids = e.target.value
                      .split(/[\n,]/)
                      .map(id => id.trim())
                      .filter(id => id.length > 0);
                    setSelectedOrderIds(ids);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  已输入 {selectedOrderIds.length} 个订单ID
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="dateRange" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>开始日期</Label>
                <Input
                  type="date"
                  value={importDateRange.start}
                  onChange={(e) => setImportDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>结束日期</Label>
                <Input
                  type="date"
                  value={importDateRange.end}
                  onChange={(e) => setImportDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button onClick={handleImport} disabled={importing} className="w-full sm:w-auto">
              {importing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更新费用对话框 */}
      <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑费用信息</DialogTitle>
            <DialogDescription>
              更新订单的成本费用信息
            </DialogDescription>
          </DialogHeader>
          {editingRecord && (
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>订单号</Label>
                  <Input value={editingRecord.orderNo} disabled />
                </div>
                <div className="space-y-2">
                  <Label>商品名称</Label>
                  <Input value={editingRecord.productName} disabled />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>数量</Label>
                  <Input value={editingRecord.quantity} disabled />
                </div>
                <div className="space-y-2">
                  <Label>商品成本</Label>
                  <Input value={`¥${(editingRecord.orderGoodsCost ?? editingRecord.totalCost ?? 0).toFixed(2)}`} disabled />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>快递费用</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={expressFee}
                    onChange={(e) => setExpressFee(parseFloat(e.target.value) || 0)}
                    placeholder="输入快递费用"
                  />
                </div>
                <div className="space-y-2">
                  <Label>其他费用</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={otherFee}
                    onChange={(e) => setOtherFee(parseFloat(e.target.value) || 0)}
                    placeholder="输入其他费用"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Input
                  value={feeRemark}
                  onChange={(e) => setFeeRemark(e.target.value)}
                  placeholder="费用备注"
                />
              </div>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span>商品成本:</span>
                  <span>¥{(editingRecord.orderGoodsCost ?? editingRecord.totalCost ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>快递费用:</span>
                  <span>¥{expressFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>其他费用:</span>
                  <span>¥{otherFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>总成本:</span>
                  <span className="text-red-600">
                    ¥{((editingRecord.orderGoodsCost ?? editingRecord.totalCost ?? 0) + expressFee + otherFee).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsFeeDialogOpen(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button onClick={handleUpdateFee} disabled={updatingFee} className="w-full sm:w-auto">
              {updatingFee && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
