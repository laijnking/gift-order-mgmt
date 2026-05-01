'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Upload, Loader2, CheckCircle2,
  AlertTriangle, FileText, RefreshCw, Package, Link2
} from 'lucide-react';
import { HelpGuide, HelpSection, HelpSteps, HelpNote, HelpLinks } from '@/components/ui/help-guide';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders, useAuth, usePermission } from '@/lib/auth';

interface ReceiptRecord {
  id: string;
  supplierId?: string;
  supplierName?: string;
  fileName: string;
  totalCount: number;
  matchedCount: number;
  unmatchedCount: number;
  importedAt: string;
  importedBy: string;
  reviewCount?: number;
  conflictCount?: number;
  reviewStatus?: 'clean' | 'needs_review' | 'has_conflict';
  reviewSummary?: {
    matchedCount: number;
    needsReviewCount: number;
    conflictCount: number;
  };
}

interface Receipt {
  id: string;
  supplierId?: string;
  supplierName?: string;
  customerOrderNo: string;
  expressCompany: string;
  trackingNo: string;
  shipDate: string | null;
  freightCost?: number | null;
  matchStatus: 'pending' | 'auto_matched' | 'manual_matched' | 'conflict';
  orderId: string | null;
  orderNo: string | null;
  createdAt: string;
  matchedAt?: string;
  reviewStatus?: 'matched' | 'needs_review' | 'conflict';
  reviewReason?: 'matched' | 'unmatched' | 'conflict';
}

interface MatchResultPayload {
  totalCount: number;
  autoMatchedCount: number;
  conflictCount?: number;
  unmatchedCount: number;
}

interface Order {
  id: string;
  orderNo: string;
  customerOrderNo: string;
  status: string;
  supplierName: string;
}

interface ImportedReceiptRow {
  customerOrderNo?: string;
  orderNo?: string;
  supplierOrderNo?: string;
  expressCompany?: string;
  trackingNo?: string;
  shipDate?: string | null;
  freightCost?: number | string;
  quantity?: number | string;
  price?: number | string | null;
  warehouse?: string;
  remark?: string;
  ['系统订单']?: string;
  ['系统订单号']?: string;
  ['系统订单号（请勿删除和修改）']?: string;
  ['客户订单号']?: string;
  ['订单号']?: string;
  ['单据编号']?: string;
  ['发货方单据号']?: string;
  ['快递公司']?: string;
  ['快递单号']?: string;
  ['物流单号']?: string;
  ['发货日期']?: string | null;
  ['日期']?: string | null;
  ['运费']?: number | string;
  ['运费成本']?: number | string;
  ['快递费']?: number | string;
  ['数量']?: number | string;
  ['价格']?: number | string | null;
  ['单价']?: number | string | null;
  ['仓库']?: string;
  ['备注']?: string;
}

export default function ReturnReceiptPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canEditOrders = hasPermission('orders:edit');

  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<ReceiptRecord | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matching, setMatching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [unmatchedOrders, setUnmatchedOrders] = useState<Order[]>([]);
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'needs_review' | 'conflict' | 'matched'>('all');
  const [manualMatching, setManualMatching] = useState(false);

  // 分页相关状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const actorName = user?.realName || user?.username || 'system';
  const authHeaders = useCallback(() => buildUserInfoHeaders(user), [user]);
  const jsonHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...buildUserInfoHeaders(user),
    }),
    [user]
  );

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('pageSize', String(pageSize));
      const response = await fetch(`/api/return-receipts/history?${params.toString()}`, { headers: authHeaders() });
      const data = await response.json();
      if (data.success) {
        setRecords(data.data || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 0);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, currentPage, pageSize]);

  // 文件上传处理（不再需要选择发货方）
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      // 解析Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<ImportedReceiptRow>(worksheet);

      // 验证数据格式
      if (jsonData.length === 0) {
        throw new Error('Excel文件为空');
      }

      // 提取回单数据
      const receipts = jsonData.map((row) => {
        const rawFreight = row.freightCost || row['运费'] || row['运费成本'] || row['快递费'];
        const freightCost = typeof rawFreight === 'number' 
          ? rawFreight 
          : rawFreight ? Number(rawFreight) : undefined;
        
        return {
          customerOrderNo: row['系统订单'] || row['系统订单号'] || row['系统订单号（请勿删除和修改）'] || row['客户订单号'] || row['订单号'] || row.customerOrderNo || row.orderNo || row['单据编号'] || '',
          supplierOrderNo: row['发货方单据号'] || row.supplierOrderNo || '',
          expressCompany: row['快递公司'] || row.expressCompany || '',
          trackingNo: row['快递单号'] || row.trackingNo || row['物流单号'] || '',
          shipDate: row['发货日期'] || row.shipDate || row['日期'] || null,
          freightCost,
          quantity: row['数量'] || row.quantity || 1,
          price: row['价格'] || row.price || row['单价'] || null,
          warehouse: row['仓库'] || row.warehouse || '',
          remark: row['备注'] || row.remark || '',
        };
      }).filter(r => r.customerOrderNo || r.trackingNo || r.supplierOrderNo);

      if (receipts.length === 0) {
        throw new Error('未找到有效的回单数据，请检查Excel格式');
      }

      // 提交到服务器（不再传递 supplierId）
      const response = await fetch('/api/return-receipts/history', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          receipts,
          fileName: file.name,
          importedBy: actorName,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`成功导入 ${receipts.length} 条回单记录`);
        
        // 刷新记录列表
        loadRecords();
        
        // 询问是否自动匹配
        if (result.data.recordId) {
          setCurrentRecord({
            id: result.data.recordId,
            fileName: file.name,
            totalCount: result.data.totalCount || receipts.length,
            matchedCount: 0,
            unmatchedCount: result.data.totalCount || receipts.length,
            importedAt: new Date().toISOString(),
            importedBy: actorName,
          });
          setShowMatchDialog(true);
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
  }, [actorName, jsonHeaders, loadRecords]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  // 显示文件被拒绝的错误
  useEffect(() => {
    if (fileRejections.length > 0) {
      const rejection = fileRejections[0];
      const errorMessage = rejection.errors[0]?.message || '不支持的文件类型';
      toast.error(`文件上传失败: ${errorMessage}`);
    }
  }, [fileRejections]);

  // 初始加载记录
  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // 自动匹配回单
  const handleAutoMatch = async () => {
    if (!currentRecord) return;

    try {
      setMatching(true);
      
      // 获取未匹配的 回单
      const response = await fetch(`/api/return-receipts/history?recordId=${currentRecord.id}`, { headers: authHeaders() });
      const data = await response.json();
      
      if (!data.success) throw new Error(data.error);
      
      const pendingReceipts = (data.data.receipts || []).filter(
        (r: Receipt) => r.matchStatus === 'pending'
      );

      if (pendingReceipts.length === 0) {
        toast.error('无可匹配的回单');
        return;
      }

      // 执行自动匹配
      const matchResponse = await fetch('/api/return-receipts/match', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          receiptIds: pendingReceipts.map((r: Receipt) => r.id),
        }),
      });

      const matchResult = await matchResponse.json();
      
      if (matchResult.success) {
        const payload = (matchResult.data || {}) as MatchResultPayload;
        const conflictCount = payload.conflictCount || 0;
        const unmatchedCount = payload.unmatchedCount || 0;

        toast.success(
          conflictCount > 0
            ? `匹配完成：自动匹配 ${payload.autoMatchedCount || 0} 条，冲突 ${conflictCount} 条，请进入复核`
            : `匹配完成：自动匹配 ${payload.autoMatchedCount || 0} 条，待复核 ${unmatchedCount} 条`
        );
        
        // 刷新记录详情
        await loadRecordDetail(currentRecord.id);
        if (conflictCount > 0) {
          setReceiptFilter('conflict');
        }
        
        // 关闭对话框
        setShowMatchDialog(false);
      } else {
        throw new Error(matchResult.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setMatching(false);
    }
  };

  // 批量确认回单
  const handleBatchConfirm = async () => {
    if (selectedReceipts.length === 0) {
      toast.error('请选择要确认的回单');
      return;
    }

    try {
      setConfirming(true);
      const response = await fetch('/api/return-receipts/confirm', {
        method: 'POST',
        headers: jsonHeaders(),
        body: JSON.stringify({
          receiptIds: selectedReceipts,
          importedBy: actorName,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || '确认成功');
        
        // 刷新记录详情
        if (currentRecord) {
          await loadRecordDetail(currentRecord.id);
        }
        
        setSelectedReceipts([]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setConfirming(false);
    }
  };

  // 加载记录详情
  const loadRecordDetail = async (recordId: string) => {
    try {
      const response = await fetch(`/api/return-receipts/history?recordId=${recordId}`, { headers: authHeaders() });
      const data = await response.json();
      
      if (data.success) {
        setCurrentRecord(data.data);
        setReceipts(data.data.receipts || []);
        setSelectedReceipts([]);
        setReceiptFilter('all');
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
    }
  };

  // 打开手动匹配对话框
  const handleManualMatch = async (receipt: Receipt) => {
    setCurrentReceipt(receipt);
    
    try {
      // 加载待匹配订单列表（不限定发货方）
      const response = await fetch('/api/orders?status=assigned,notified', { headers: authHeaders() });
      const data = await response.json();
      
      if (data.success) {
        const availableOrders = data.data.filter((o: Order) => 
          (o.status === 'assigned' || o.status === 'notified' || o.status === 'partial_returned') && 
          !receipts.some(r => r.orderId === o.id && r.id !== receipt.id)
        );

        const sortedOrders = [...availableOrders].sort((a: Order, b: Order) => {
          const aOrderNo = String(a.orderNo ?? '');
          const bOrderNo = String(b.orderNo ?? '');
          const aExact = a.customerOrderNo === receipt.customerOrderNo || aOrderNo === receipt.customerOrderNo;
          const bExact = b.customerOrderNo === receipt.customerOrderNo || bOrderNo === receipt.customerOrderNo;
          if (aExact !== bExact) return aExact ? -1 : 1;

          const aIncludes = Boolean(receipt.customerOrderNo) && (
            a.customerOrderNo?.includes(receipt.customerOrderNo) ||
            aOrderNo.includes(receipt.customerOrderNo)
          );
          const bIncludes = Boolean(receipt.customerOrderNo) && (
            b.customerOrderNo?.includes(receipt.customerOrderNo) ||
            bOrderNo.includes(receipt.customerOrderNo)
          );
          if (aIncludes !== bIncludes) return aIncludes ? -1 : 1;

          return aOrderNo.localeCompare(bOrderNo);
        });

        setUnmatchedOrders(sortedOrders);
      }
    } catch (error) {
      console.error('加载订单列表失败:', error);
    }
    
    setShowOrderPicker(true);
  };

  // 确认手动匹配
  const handleConfirmManualMatch = async () => {
    if (!currentReceipt || !currentRecord) return;

    try {
      setManualMatching(true);
      const isResolvingConflict = currentReceipt.reviewStatus === 'conflict';
      const response = await fetch(`/api/return-receipts/${currentReceipt.id}`, {
        method: 'PATCH',
        headers: jsonHeaders(),
        body: JSON.stringify({
          orderId: currentReceipt.orderId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(
          isResolvingConflict
            ? `冲突已处理，回单已关联到订单 ${data.data.orderNo}`
            : `已将回单与订单 ${data.data.orderNo} 关联`
        );
        
        // 刷新记录详情
        await loadRecordDetail(currentRecord.id);
        setShowOrderPicker(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
    finally {
      setManualMatching(false);
    }
  };

  // 过滤记录（不再按发货方过滤）
  const filteredRecords = records.filter(r => {
    if (searchTerm && !r.fileName.includes(searchTerm)) return false;
    return true;
  });

  const filteredReceipts = receipts.filter((receipt) => {
    if (receiptFilter === 'all') return true;
    return receipt.reviewStatus === receiptFilter;
  });

  const matchedReceipts = receipts.filter((receipt) => receipt.reviewStatus === 'matched');
  const reviewReceipts = receipts.filter((receipt) => receipt.reviewStatus === 'needs_review');
  const conflictReceipts = receipts.filter((receipt) => receipt.reviewStatus === 'conflict');

  const reviewFilterOptions = [
    { value: 'all', label: '全部' },
    { value: 'needs_review', label: '待复核' },
    { value: 'conflict', label: '冲突' },
    { value: 'matched', label: '已匹配' },
  ] as const;

  return (
    <PageGuard permission="orders:view" title="无权查看回单" description="当前账号没有查看物流回单的权限。">
    <div className="container mx-auto space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">回单导入</h1>
            <p className="text-sm text-muted-foreground">上传Excel自动匹配订单，无需选择发货方</p>
          </div>
        </div>
        <HelpGuide
          title="回单管理帮助"
          docUrl="/docs/guides/return-receipt"
        >
          <HelpSection title="功能说明">
            接收发货方回传的快递单号，支持直接上传 Excel 自动匹配订单。
          </HelpSection>
          <HelpSection title="匹配优先级">
            <HelpSteps steps={[
              { title: "系统订单号", description: "精确匹配" },
              { title: "客户订单号", description: "精确匹配" },
              { title: "模糊匹配", description: "订单号模糊匹配" },
            ]} />
          </HelpSection>
          <HelpSection title="匹配结果处理">
            <div className="text-xs space-y-1">
              <div>• auto_matched：自动匹配成功，可直接确认</div>
              <div>• conflict：冲突（多个候选），需手动选择</div>
              <div>• pending：未匹配，需手动关联</div>
            </div>
          </HelpSection>
          <HelpNote type="info">
            部分回单：同一订单分批导入时，物流信息用 `;` 隔开追加
          </HelpNote>
          <HelpLinks links={[
            { label: "客户反馈", href: "/feedback-export", description: "导出客户反馈" },
            { label: "核心业务流", href: "/docs/guides/business-flow", description: "模块数据流转" },
          ]} />
        </HelpGuide>
        <Button variant="outline" onClick={loadRecords} disabled={loading} className="w-full sm:w-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              placeholder="搜索文件名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:max-w-xs"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-3 border-t">
            <div className="text-sm text-muted-foreground">
              共 {totalCount} 条
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>首页</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>上一页</Button>
              <span className="px-2 text-sm">{currentPage} / {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages || totalPages === 0}>下一页</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages || totalPages === 0}>末页</Button>
            </div>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[100px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20">20条/页</SelectItem>
                <SelectItem value="50">50条/页</SelectItem>
                <SelectItem value="100">100条/页</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：导入区域和记录列表 */}
        <div className="lg:col-span-1 space-y-6">
          {/* 导入区域 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">导入回单</CardTitle>
              <CardDescription>上传包含快递信息的Excel文件</CardDescription>
            </CardHeader>
            <CardContent>
              {canEditOrders ? (
                <div
                  {...getRootProps()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-colors
                    ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                  `}
                >
                  <input
                    {...getInputProps()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {isDragActive ? '放下文件开始导入' : '拖放Excel文件到这里，或点击选择'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    支持 .xlsx, .xls 格式
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
                  当前账号可以查看回单记录，但没有导入和处理回单的权限。
                </div>
              )}

              {/* Excel格式说明 */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Excel应包含以下列：</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>客户订单号 / 订单号（必填）</li>
                  <li>快递公司</li>
                  <li>快递单号</li>
                  <li>发货日期（可选）</li>
                  <li>运费 / 运费成本 / 快递费（可选）</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 导入记录列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">导入记录</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">暂无导入记录</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredRecords.map((record) => (
                    <div
                      key={record.id}
                      className={`
                        p-3 border rounded-lg cursor-pointer transition-colors
                        ${currentRecord?.id === record.id ? 'border-primary bg-primary/5' : 'hover:border-primary/50'}
                      `}
                      onClick={() => {
                        setCurrentRecord(record);
                        loadRecordDetail(record.id);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium truncate">{record.fileName}</span>
                        <Badge variant="outline" className="text-xs">
                          {record.totalCount} 条
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                          <span>已匹配: {record.matchedCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span>待匹配: {record.unmatchedCount}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-3 w-3 ${(record.conflictCount || 0) > 0 ? 'text-red-500' : 'text-orange-500'}`} />
                          <span>
                            待复核: {record.reviewCount || 0}
                            {(record.conflictCount || 0) > 0 ? `（冲突 ${record.conflictCount}）` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {new Date(record.importedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧：回单明细 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">回单明细</CardTitle>
                  {currentRecord && (
                    <CardDescription>
                      {currentRecord.fileName} - 共 {receipts.length} 条
                    </CardDescription>
                  )}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {currentRecord && (
                    <select
                      value={receiptFilter}
                      onChange={(e) => setReceiptFilter(e.target.value as typeof receiptFilter)}
                      className="h-9 rounded-md border bg-background px-3 text-sm"
                    >
                      {reviewFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedReceipts.length > 0 && (
                    <Button onClick={handleBatchConfirm} disabled={confirming || !canEditOrders} className="w-full sm:w-auto">
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      批量确认 ({selectedReceipts.length})
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!currentRecord ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>选择左侧记录查看回单明细</p>
                </div>
              ) : receipts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无回单数据</p>
                </div>
              ) : (
                <>
                  {/* 统计信息 */}
                  <div className="mb-3 flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      人工复核池：待复核 {reviewReceipts.length}
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      冲突 {conflictReceipts.length}
                    </Badge>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      已匹配 {matchedReceipts.length}
                    </Badge>
                  </div>
                  <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{receipts.length}</div>
                      <div className="text-sm text-muted-foreground">总数量</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {matchedReceipts.length}
                      </div>
                      <div className="text-sm text-green-600">已匹配</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">
                        {reviewReceipts.length}
                      </div>
                      <div className="text-sm text-orange-600">待复核</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {conflictReceipts.length}
                      </div>
                      <div className="text-sm text-red-600">冲突</div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          {filteredReceipts.some(r => r.reviewStatus === 'matched') && (
                            <input
                              type="checkbox"
                              checked={
                                filteredReceipts.filter(r => r.reviewStatus === 'matched').length > 0 &&
                                selectedReceipts.length === filteredReceipts.filter(r => r.reviewStatus === 'matched').length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReceipts(filteredReceipts.filter(r => r.reviewStatus === 'matched').map(r => r.id));
                                } else {
                                  setSelectedReceipts([]);
                                }
                              }}
                            />
                          )}
                        </TableHead>
                        <TableHead>客户订单号</TableHead>
                        <TableHead>快递公司</TableHead>
                        <TableHead>快递单号</TableHead>
                        <TableHead>运费</TableHead>
                        <TableHead>发货日期</TableHead>
                        <TableHead>匹配状态</TableHead>
                        <TableHead>关联订单</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReceipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            {receipt.reviewStatus === 'matched' && (
                              <input
                                type="checkbox"
                                checked={selectedReceipts.includes(receipt.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedReceipts([...selectedReceipts, receipt.id]);
                                  } else {
                                    setSelectedReceipts(selectedReceipts.filter(id => id !== receipt.id));
                                  }
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{receipt.customerOrderNo}</TableCell>
                          <TableCell>{receipt.expressCompany || '-'}</TableCell>
                          <TableCell className="font-mono">{receipt.trackingNo || '-'}</TableCell>
                          <TableCell>{receipt.freightCost !== undefined ? `¥${receipt.freightCost}` : '-'}</TableCell>
                          <TableCell>{receipt.shipDate || '-'}</TableCell>
                          <TableCell>
                            {receipt.reviewStatus === 'conflict' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                                冲突
                              </Badge>
                            ) : receipt.reviewStatus === 'needs_review' ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                待复核
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                                已匹配
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {receipt.orderNo ? (
                              <span className="font-mono text-sm">{receipt.orderNo}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleManualMatch(receipt)}
                              disabled={!canEditOrders}
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              {receipt.reviewStatus === 'matched'
                                ? '重匹配'
                                : receipt.reviewStatus === 'conflict'
                                  ? '处理冲突'
                                  : '进入复核'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 自动匹配对话框 */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-lg">
          <DialogHeader>
            <DialogTitle>自动匹配</DialogTitle>
            <DialogDescription>
              系统将根据订单号自动匹配回单与订单，未命中或冲突的记录会进入人工复核池
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">即将进行自动匹配</p>
                <p className="text-xs text-muted-foreground">
                  匹配规则：系统订单号精确匹配 &gt; 客户订单号精确匹配 &gt; 模糊匹配
                </p>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowMatchDialog(false)} className="w-full sm:w-auto">
              稍后处理
            </Button>
            <Button onClick={handleAutoMatch} disabled={matching || !canEditOrders} className="w-full sm:w-auto">
              {matching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              开始匹配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动匹配订单选择对话框 */}
      <Dialog open={showOrderPicker} onOpenChange={setShowOrderPicker}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>选择关联订单</DialogTitle>
            <DialogDescription>
              为回单 &quot;{currentReceipt?.customerOrderNo}&quot; 选择关联的订单
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 回单信息 */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <span className="text-muted-foreground">快递公司：</span>
                  <span className="font-medium">{currentReceipt?.expressCompany || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">快递单号：</span>
                  <span className="font-medium font-mono">{currentReceipt?.trackingNo || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">运费：</span>
                  <span className="font-medium">{currentReceipt?.freightCost !== undefined ? `¥${currentReceipt.freightCost}` : '-'}</span>
                </div>
              </div>
            </div>

            {currentReceipt?.reviewStatus === 'conflict' && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                这条回单存在多个候选订单，请人工确认正确订单后完成处理。系统会在保存后把这条记录从冲突池移出。
              </div>
            )}

            {/* 订单列表 */}
            <div className="border rounded-lg">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>客户订单号</TableHead>
                    <TableHead>发货方</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unmatchedOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        暂无可匹配的订单
                      </TableCell>
                    </TableRow>
                  ) : (
                    unmatchedOrders.map((order) => (
                      <TableRow 
                        key={order.id}
                        className={currentReceipt?.orderId === order.id ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <input
                            type="radio"
                            name="orderPicker"
                            checked={currentReceipt?.orderId === order.id}
                            onChange={() => setCurrentReceipt({ ...currentReceipt!, orderId: order.id, orderNo: order.orderNo } as Receipt)}
                          />
                        </TableCell>
                        <TableCell className="font-mono">{order.orderNo}</TableCell>
                        <TableCell>{order.customerOrderNo || '-'}</TableCell>
                        <TableCell>{order.supplierName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowOrderPicker(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button 
              onClick={handleConfirmManualMatch}
              disabled={!currentReceipt?.orderId || manualMatching || !canEditOrders}
              className="w-full sm:w-auto"
            >
              {manualMatching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {currentReceipt?.reviewStatus === 'conflict' ? '确认处理冲突' : '确认匹配'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
