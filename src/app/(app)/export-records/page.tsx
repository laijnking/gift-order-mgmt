'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PageGuard } from '@/components/auth/page-guard';
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
  FileSpreadsheet, Download, Search, RefreshCw, Loader2, 
  Package, FileText, Eye, FileDown
} from 'lucide-react';
import { toast } from 'sonner';
import {
  buildExportRecordDownloadPath,
  getDownloadActionLabel,
  getDownloadHint,
  getDownloadStrategy,
  getStorageProviderLabel,
  isPersistedArtifact,
  isPersistedRecordUrl,
} from '@/lib/export-download';
import { buildUserInfoHeaders, useAuth } from '@/lib/auth';

interface ExportRecord {
  id: string;
  export_type: string;
  supplier_id: string | null;
  customer_id: string | null;
  template_id: string | null;
  template_name: string;
  file_url: string;
  file_name: string;
  total_count: number;
  exported_by: string;
  metadata: {
    batch_id?: string;
    customer_ids?: string[];
    details?: ExportDetail[];
    shipped_order_count?: number;
    pending_receipt_count?: number;
    download_mode?: 'regenerate';
    last_regenerated_at?: string;
    last_regenerated_file_name?: string;
    artifact?: {
      provider?: 'local' | 's3';
      relative_path?: string;
      file_name?: string;
    };
    template_source?: 'explicit' | 'default' | 'first' | 'column_mapping';
  } | null;
  created_at: string;
}

interface ExportDetail {
  supplierId?: string;
  supplierName?: string;
  customerId?: string;
  customerName?: string;
  orderCount: number;
  shippedOrderCount?: number;
  pendingReceiptCount?: number;
  fileName: string;
  fileUrl: string;
  status: string;
  templateName?: string;
  templateSource?: 'explicit' | 'default' | 'first' | 'column_mapping';
  artifact?: {
    provider?: 'local' | 's3';
    relative_path?: string;
    file_name?: string;
  };
}

type TemplateSource = 'explicit' | 'default' | 'first' | 'column_mapping' | 'mixed';

function getTemplateSourceSummary(
  record: Pick<ExportRecord, 'metadata'>,
  details: ExportDetail[] = []
): TemplateSource | undefined {
  const detailSources = details
    .map((detail) => detail.templateSource)
    .filter((source): source is Exclude<TemplateSource, 'mixed'> => Boolean(source));

  if (detailSources.length === 0) {
    return record.metadata?.template_source;
  }

  const uniqueSources = Array.from(new Set(detailSources));
  return uniqueSources.length > 1 ? 'mixed' : uniqueSources[0];
}

function getRecordEntityCount(record: ExportRecord, details: ExportDetail[] = []) {
  const entities = details.length > 0 ? details : record.metadata?.details || [];
  return entities.length;
}

function getRecordShippedCount(record: ExportRecord, details: ExportDetail[] = []) {
  if (typeof record.metadata?.shipped_order_count === 'number') {
    return record.metadata.shipped_order_count;
  }

  const entities = details.length > 0 ? details : record.metadata?.details || [];
  return entities.reduce((sum, detail) => sum + (detail.shippedOrderCount || 0), 0);
}

function getRecordPendingReceiptCount(record: ExportRecord, details: ExportDetail[] = []) {
  if (typeof record.metadata?.pending_receipt_count === 'number') {
    return record.metadata.pending_receipt_count;
  }

  const entities = details.length > 0 ? details : record.metadata?.details || [];
  return entities.reduce((sum, detail) => sum + (detail.pendingReceiptCount || 0), 0);
}

export default function ExportRecordsPage() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [exportType, setExportType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);
  const [details, setDetails] = useState<ExportDetail[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [regeneratingRecordId, setRegeneratingRecordId] = useState<string | null>(null);
  const [regeneratingDetailKey, setRegeneratingDetailKey] = useState<string | null>(null);
  const [autoOpenedRecordId, setAutoOpenedRecordId] = useState<string | null>(null);

  const authHeaders = () => buildUserInfoHeaders(user);

  const triggerBrowserDownload = (url: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = url;
    if (filename) {
      link.download = filename;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const syncRecordState = async (recordId: string) => {
    const response = await fetch(`/api/export-records/${recordId}`, {
      headers: authHeaders(),
    });
    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || '刷新导出记录失败');
    }

    const refreshedRecord = data.data as ExportRecord;
    setSelectedRecord(refreshedRecord);
    setDetails(data.data.details || []);
    setRecords((prev) => prev.map((item) => (item.id === recordId ? refreshedRecord : item)));
    return refreshedRecord;
  };

  // 加载导出记录
  useEffect(() => {
    loadRecords();
  }, [page, exportType]);

  useEffect(() => {
    const targetRecordId = searchParams.get('recordId');
    if (!targetRecordId || loading || autoOpenedRecordId === targetRecordId) {
      return;
    }

    const targetRecord = records.find((record) => record.id === targetRecordId);
    if (!targetRecord) {
      return;
    }

    setAutoOpenedRecordId(targetRecordId);
    void handleViewDetail(targetRecord);
  }, [autoOpenedRecordId, loading, records, searchParams]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      let url = `/api/export-records?page=${page}&pageSize=${pageSize}`;
      if (exportType !== 'all') {
        url += `&exportType=${exportType}`;
      }
      
      const response = await fetch(url, { headers: authHeaders() });
      const data = await response.json();
      
      if (data.success) {
        setRecords(data.data || []);
        setTotal(data.total || 0);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 下载导出文件
  const handleDownloadDetail = async (detail: ExportDetail, detailIndex: number) => {
    if (!selectedRecord) {
      toast.error('未找到导出记录');
      return;
    }

    const detailKey = `${selectedRecord.id}:${detail.supplierId || detail.customerId || detail.fileName}`;

    if (detail.artifact?.relative_path) {
      triggerBrowserDownload(buildExportRecordDownloadPath(selectedRecord.id, detailIndex), detail.fileName || undefined);
      toast.success('已开始下载已持久化的明细文件');
      return;
    }

    try {
      setRegeneratingDetailKey(detailKey);
      const response = await fetch(`/api/export-records/${selectedRecord.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          supplierId: detail.supplierId,
          customerId: detail.customerId,
          templateId: detail.templateSource === 'column_mapping' ? null : selectedRecord.template_id,
        }),
      });
      const data = await response.json();

      if (!data.success || !data.data?.zipBase64 || !data.data?.zipFileName) {
        throw new Error(data.error || '重新生成明细文件失败');
      }

      await syncRecordState(selectedRecord.id);

      const regeneratedDetail = data.data?.details?.[0];
      if (regeneratedDetail?.fileUrl?.startsWith('/api/export-records/')) {
        triggerBrowserDownload(regeneratedDetail.fileUrl, regeneratedDetail.fileName || detail.fileName || undefined);
      } else {
        const linkSource = `data:application/zip;base64,${data.data.zipBase64}`;
        triggerBrowserDownload(linkSource, data.data.zipFileName);
      }
      toast.success('已重新生成并下载明细文件');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '下载失败');
    } finally {
      setRegeneratingDetailKey(null);
    }
  };

  const handleRegenerateRecordZip = async (record: ExportRecord | null) => {
    if (!record) {
      toast.error('未找到导出记录');
      return;
    }

    if (record.file_url?.startsWith('/api/export-records/')) {
      triggerBrowserDownload(record.file_url, record.file_name || undefined);
      toast.success('已开始下载已持久化的ZIP文件');
      return;
    }

    try {
      setRegeneratingRecordId(record.id);
      const response = await fetch(`/api/export-records/${record.id}`, {
        method: 'POST',
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!data.success || !data.data?.zipBase64 || !data.data?.zipFileName) {
        throw new Error(data.error || '重新生成ZIP失败');
      }

      const refreshedRecord = await syncRecordState(record.id);

      if (refreshedRecord.file_url?.startsWith('/api/export-records/')) {
        triggerBrowserDownload(refreshedRecord.file_url, refreshedRecord.file_name || undefined);
      } else {
        const linkSource = `data:application/zip;base64,${data.data.zipBase64}`;
        triggerBrowserDownload(linkSource, data.data.zipFileName);
      }
      toast.success('已重新生成并下载ZIP');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '重新生成ZIP失败');
    } finally {
      setRegeneratingRecordId(null);
    }
  };

  const templateSourceLabel = (source?: TemplateSource) => {
    switch (source) {
      case 'explicit':
        return '手动选择';
      case 'column_mapping':
        return '客户导入映射';
      case 'mixed':
        return '混合来源';
      case 'first':
        return '兜底模板';
      case 'default':
      default:
        return '默认模板';
    }
  };

  const downloadModeLabel = (mode?: 'regenerate') => {
    switch (mode) {
      case 'regenerate':
      default:
        return '按需重生成';
    }
  };

  const isPersistedRecord = (record: ExportRecord | null | undefined) =>
    isPersistedRecordUrl(record?.file_url);

  const isRecordBusy = (recordId?: string | null) => regeneratingRecordId === recordId;

  // 查看导出详情
  const handleViewDetail = async (record: ExportRecord) => {
    setSelectedRecord(record);
    setLoadingDetails(true);
    setShowDetailDialog(true);

    try {
      const response = await fetch(`/api/export-records/${record.id}`, {
        headers: authHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setDetails(data.data.details || []);
      }
    } catch (error) {
      toast.error('加载详情失败');
    } finally {
      setLoadingDetails(false);
    }
  };

  // 过滤记录
  const filteredRecords = records.filter(r => 
    !searchTerm || 
    r.file_name.includes(searchTerm) || 
    r.template_name.includes(searchTerm)
  );

  // 获取导出类型标签
  const getExportTypeLabel = (type: string) => {
    switch (type) {
      case 'shipping_notice':
        return { label: '发货通知单', icon: Package, color: 'bg-blue-100 text-blue-700' };
      case 'customer_feedback':
        return { label: '客户反馈', icon: FileText, color: 'bg-green-100 text-green-700' };
      default:
        return { label: '其他', icon: FileSpreadsheet, color: 'bg-gray-100 text-gray-700' };
    }
  };

  return (
    <PageGuard permission="orders:export" title="无法访问导出记录">
    <div className="container mx-auto space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileDown className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">导出记录</h1>
            <p className="text-sm text-muted-foreground">查看历史导出记录及详情</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadRecords} disabled={loading} className="w-full lg:w-auto">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue placeholder="导出类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="shipping_notice">发货通知单</SelectItem>
                <SelectItem value="customer_feedback">客户反馈</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground lg:ml-auto">
              共 {total} 条记录
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导出记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">导出记录列表</CardTitle>
          <CardDescription>
            显示最近 {filteredRecords.length} 条导出记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无导出记录</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>导出类型</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>模板</TableHead>
                  <TableHead className="text-right">导出数量</TableHead>
                  <TableHead>导出人</TableHead>
                  <TableHead>导出时间</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => {
                  const typeInfo = getExportTypeLabel(record.export_type);
                  const TypeIcon = typeInfo.icon;
                  const templateSource = getTemplateSourceSummary(record, record.metadata?.details || []);
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.file_name}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{record.template_name || '-'}</div>
                          <div className="flex flex-wrap gap-1">
                            {templateSource && (
                              <Badge variant="outline" className="text-[10px]">
                                {templateSourceLabel(templateSource)}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {downloadModeLabel(record.metadata?.download_mode)}
                            </Badge>
                            {record.metadata?.artifact?.provider && (
                              <Badge variant="secondary" className="text-[10px]">
                                {getStorageProviderLabel(record.metadata.artifact.provider)}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[10px]">
                              {getDownloadStrategy(
                                record.metadata?.artifact?.provider,
                                isPersistedArtifact(record.metadata?.artifact)
                              )}
                            </Badge>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {getDownloadHint(
                              record.metadata?.artifact?.provider,
                              isPersistedArtifact(record.metadata?.artifact)
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-1 text-right">
                          <div>
                            <span className="font-semibold">{record.total_count}</span>
                            <span className="text-muted-foreground"> 单</span>
                          </div>
                          {record.export_type === 'customer_feedback' && (
                            <div className="flex flex-wrap justify-end gap-1 text-[10px]">
                              <Badge variant="secondary">
                                客户 {getRecordEntityCount(record)}
                              </Badge>
                              <Badge variant="secondary">
                                已发货 {getRecordShippedCount(record)}
                              </Badge>
                              <Badge variant="secondary">
                                待回单 {getRecordPendingReceiptCount(record)}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{record.exported_by || '系统'}</TableCell>
                      <TableCell>
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewDetail(record)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isRecordBusy(record.id)}
                            onClick={() => handleRegenerateRecordZip(record)}
                          >
                            {isRecordBusy(record.id) ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-1" />
                            )}
                            {getDownloadActionLabel(
                              record.metadata?.artifact?.provider,
                              isPersistedArtifact(record.metadata?.artifact)
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
          <Button 
            variant="outline" 
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(p => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            第 {page} / {Math.ceil(total / pageSize)} 页
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page >= Math.ceil(total / pageSize)}
            onClick={() => setPage(p => p + 1)}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 导出详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] overflow-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>导出详情</DialogTitle>
            <DialogDescription>
              {selectedRecord?.file_name}
            </DialogDescription>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {selectedRecord && details.length > 0 && (
                <div className="rounded-lg border bg-muted/20 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">模板来源汇总</span>
                    <Badge variant="secondary">
                      {templateSourceLabel(getTemplateSourceSummary(selectedRecord, details))}
                    </Badge>
                    {getTemplateSourceSummary(selectedRecord, details) === 'mixed' && (
                      <span className="text-xs text-muted-foreground">
                        本批导出明细使用了多种模板来源，请以明细行为准。
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      已落盘的整批 ZIP 和明细文件可直接下载，其余文件仍按需重生成。
                    </span>
                    {selectedRecord?.metadata?.artifact?.provider === 's3' && (
                      <span className="text-xs text-muted-foreground">
                        对象存储文件会通过预签名直链下载，链接有效期受服务端配置控制。
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 汇总信息 */}
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedRecord?.total_count || 0}</div>
                  <div className="text-sm text-muted-foreground">导出订单数</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedRecord ? getRecordEntityCount(selectedRecord, details) : 0}
                  </div>
                  <div className="text-sm text-blue-600">
                    {selectedRecord?.export_type === 'customer_feedback' ? '涉及客户数' : '涉及供应商数'}
                  </div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedRecord ? getRecordShippedCount(selectedRecord, details) : 0}
                  </div>
                  <div className="text-sm text-green-600">已发货订单</div>
                </div>
                {selectedRecord?.export_type === 'customer_feedback' && (
                  <div className="p-4 bg-amber-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {getRecordPendingReceiptCount(selectedRecord, details)}
                    </div>
                    <div className="text-sm text-amber-600">待回单订单</div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">模板：{selectedRecord?.template_name || '-'}</Badge>
                  {selectedRecord && (
                    <Badge variant="outline">
                      来源：{templateSourceLabel(getTemplateSourceSummary(selectedRecord, details))}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    下载方式：{downloadModeLabel(selectedRecord?.metadata?.download_mode)}
                  </Badge>
                  {selectedRecord?.metadata?.artifact?.provider && (
                    <Badge variant="secondary">
                      存储：{getStorageProviderLabel(selectedRecord.metadata.artifact.provider)}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    下载策略：{getDownloadStrategy(
                      selectedRecord?.metadata?.artifact?.provider,
                      isPersistedArtifact(selectedRecord?.metadata?.artifact)
                    )}
                  </Badge>
                  {isPersistedRecord(selectedRecord) && (
                    <Badge variant="secondary">文件已落盘</Badge>
                  )}
                  <Badge variant="outline">文件：{selectedRecord?.file_name || '-'}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {getDownloadHint(
                    selectedRecord?.metadata?.artifact?.provider,
                    isPersistedArtifact(selectedRecord?.metadata?.artifact)
                  )}
                </div>
              </div>

              {/* 明细列表 */}
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>供应商/客户</TableHead>
                      <TableHead className="text-right">订单数</TableHead>
                      <TableHead className="text-right">已发货</TableHead>
                      <TableHead className="text-right">待回单</TableHead>
                      <TableHead>文件名</TableHead>
                      <TableHead className="text-center">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          暂无明细数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      details.map((detail, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {detail.supplierName || detail.customerName || '-'}
                          </TableCell>
                          <TableCell className="text-right">{detail.orderCount || 0}</TableCell>
                          <TableCell className="text-right text-green-600">
                            {detail.shippedOrderCount || 0}
                          </TableCell>
                          <TableCell className="text-right text-yellow-600">
                            {detail.pendingReceiptCount || 0}
                          </TableCell>
                          <TableCell className="text-sm">{detail.fileName || '-'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1">
                              {(detail.templateName || detail.templateSource) && (
                                <span className="text-[10px] text-muted-foreground">
                                  {detail.templateName || selectedRecord?.template_name || '-'}
                                  {' · '}
                                  {templateSourceLabel(detail.templateSource || selectedRecord?.metadata?.template_source)}
                                </span>
                              )}
                              {detail.artifact?.provider && (
                                <span className="text-[10px] text-muted-foreground">
                                  {getStorageProviderLabel(detail.artifact.provider)} · {getDownloadStrategy(detail.artifact.provider, isPersistedArtifact(detail.artifact))}
                                </span>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {getDownloadHint(detail.artifact?.provider, isPersistedArtifact(detail.artifact))}
                              </span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                disabled={regeneratingDetailKey === `${selectedRecord?.id}:${detail.supplierId || detail.customerId || detail.fileName}`}
                                onClick={() => handleDownloadDetail(detail, index)}
                              >
                                {regeneratingDetailKey === `${selectedRecord?.id}:${detail.supplierId || detail.customerId || detail.fileName}` ? (
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4 mr-1" />
                                )}
                                {getDownloadActionLabel(detail.artifact?.provider, isPersistedArtifact(detail.artifact))}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* 元数据信息 */}
              {selectedRecord?.metadata && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">其他信息</p>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>导出人: {selectedRecord.exported_by || '系统'}</div>
                    <div>导出时间: {new Date(selectedRecord.created_at).toLocaleString('zh-CN')}</div>
                    {selectedRecord.metadata.last_regenerated_at && (
                      <div>最近重生成: {new Date(selectedRecord.metadata.last_regenerated_at).toLocaleString('zh-CN')}</div>
                    )}
                    {selectedRecord.metadata.last_regenerated_file_name && (
                      <div>最近生成文件: {selectedRecord.metadata.last_regenerated_file_name}</div>
                    )}
                    {selectedRecord.metadata.batch_id && (
                      <div>批次ID: {selectedRecord.metadata.batch_id}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)} className="w-full sm:w-auto">
              关闭
            </Button>
            {selectedRecord && (
              <Button onClick={() => handleRegenerateRecordZip(selectedRecord)} disabled={isRecordBusy(selectedRecord.id)} className="w-full sm:w-auto">
                {isRecordBusy(selectedRecord.id) ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {getDownloadActionLabel(
                  selectedRecord?.metadata?.artifact?.provider,
                  isPersistedArtifact(selectedRecord?.metadata?.artifact)
                )}
                {' '}全部 (ZIP)
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
