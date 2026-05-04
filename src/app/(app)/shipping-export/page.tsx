'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageGuard } from '@/components/auth/page-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Package, FileDown, Search, RefreshCw, CheckCircle2, Loader2,
  FileSpreadsheet, Clock, History, AlertTriangle, Download
} from 'lucide-react';
import { HelpGuide, HelpSection, HelpSteps, HelpNote, HelpLinks } from '@/components/ui/help-guide';
import { toast } from 'sonner';
import { buildUserInfoHeaders, useAuth } from '@/lib/auth';

interface PendingSupplier {
  id: string;
  name: string;
  code: string;
  type: string;
  pendingOrderCount: number;
  lastExportTime: string | null;
}

interface ExportedSupplier {
  id: string;
  name: string;
  code: string;
  type: string;
  exportCount: number;
  exportedOrderCount: number;
  lastExportAt: string | null;
  lastRecordId: string | null;
}

interface TemplateOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface ExportResult {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  fileName: string;
  templateSource?: string;
}

interface ExportError {
  message: string;
}

interface ExportSummary {
  recordId?: string | null;
  zipFileName: string;
  zipBase64: string;
  templateName?: string;
  mode: 'pending' | 'reexport';
  totalSupplierCount: number;
  totalOrderCount: number;
}

interface ExportRecord {
  id: string;
  export_type: string;
  supplier_id: string | null;
  customer_id: string | null;
  supplier_name: string | null;
  customer_name: string | null;
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

export default function ShippingExportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const actorName = user?.realName || user?.username || 'system';

  const authHeaders = useCallback(() => buildUserInfoHeaders(user), [user]);

  // 状态
  const [activeTab, setActiveTab] = useState<'pending' | 'exported'>('pending');
  const [loading, setLoading] = useState(true);

  // 待导出
  const [pendingSuppliers, setPendingSuppliers] = useState<PendingSupplier[]>([]);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [pendingSearch, setPendingSearch] = useState('');

  // 已导出
  const [exportedSuppliers, setExportedSuppliers] = useState<ExportedSupplier[]>([]);
  const [selectedExported, setSelectedExported] = useState<string[]>([]);
  const [exportedSearch, setExportedSearch] = useState('');

  // 导出记录（历史导出记录表格）
  const [records, setRecords] = useState<ExportRecord[]>([]);
  const [recordTotal, setRecordTotal] = useState(0);
  const [recordPage, setRecordPage] = useState(1);
  const [recordPageSize] = useState(20);
  const [recordSearchTerm, setRecordSearchTerm] = useState('');
  const [recordStartDate, setRecordStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [recordEndDate, setRecordEndDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [recordShipperName, setRecordShipperName] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);
  const [recordDetails, setRecordDetails] = useState<ExportDetail[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [regeneratingRecordId, setRegeneratingRecordId] = useState<string | null>(null);

  // 模板
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  // 导出
  const [exporting, setExporting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [exportErrors, setExportErrors] = useState<ExportError[]>([]);
  const [exportWarnings, setExportWarnings] = useState<string[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // 加载待导出发货方
  const loadPending = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch('/api/shipping-exports/pending', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setPendingSuppliers(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载待导出数据失败');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, user]);

  // 加载已导出发货方
  const loadExported = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch('/api/shipping-exports/exported', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setExportedSuppliers(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载已导出数据失败');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, user]);

  // 加载导出记录（历史导出记录表格）
  const loadRecords = useCallback(async () => {
    if (!user) return;
    try {
      setRecordLoading(true);
      let url = `/api/export-records?page=${recordPage}&pageSize=${recordPageSize}&exportType=shipping_notice`;
      if (recordStartDate) url += `&startDate=${recordStartDate}`;
      if (recordEndDate) url += `&endDate=${recordEndDate}`;
      if (recordShipperName) url += `&supplierName=${encodeURIComponent(recordShipperName)}`;

      const res = await fetch(url, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setRecordTotal(data.total || 0);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载导出记录失败');
    } finally {
      setRecordLoading(false);
    }
  }, [authHeaders, user, recordPage, recordPageSize, recordStartDate, recordEndDate, recordShipperName]);

  // 加载模板
  const loadTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, defaultRes] = await Promise.all([
        fetch('/api/templates?type=shipping', { headers: authHeaders() }),
        fetch('/api/templates/default/shipping', { headers: authHeaders() }),
      ]);
      const [listData, defaultData] = await Promise.all([listRes.json(), defaultRes.json()]);
      if (listData.success) setTemplates(listData.data || []);
      if (defaultData.success && defaultData.data?.id) setTemplateId(defaultData.data.id);
    } catch (err) {
      console.error('加载模板失败:', err);
    }
  }, [authHeaders, user]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'pending') {
      loadPending();
    } else {
      loadRecords();
    }
  }, [activeTab, loadPending, loadRecords, user]);

  // 导出记录加载依赖
  useEffect(() => {
    if (activeTab === 'exported') {
      loadRecords();
    }
  }, [recordPage, recordStartDate, recordEndDate, recordShipperName, loadRecords]);

  // 全选
  const toggleSelectAll = (list: string[], setFn: (v: string[]) => void, filtered: { id: string }[]) => {
    if (list.length === filtered.length) {
      setFn([]);
    } else {
      setFn(filtered.map((s) => s.id));
    }
  };

  const toggleSelect = (id: string, list: string[], setFn: (v: string[]) => void) => {
    setFn(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  // 触发浏览器下载
  const triggerDownload = (dataUrl: string, filename: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 导出记录辅助函数
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

  const isRecordBusy = (recordId?: string | null) => regeneratingRecordId === recordId;

  const isPersistedRecord = (record: ExportRecord | null | undefined) =>
    record?.file_url?.startsWith('/api/export-records/');

  const isPersistedArtifact = (artifact?: { relative_path?: string; provider?: string }): boolean | undefined =>
    artifact?.relative_path && artifact.provider ? true : undefined;

  const getDownloadActionLabel = (provider?: string, isPersisted?: boolean) => {
    if (isPersisted) return '下载';
    return '重新生成';
  };

  const getStorageProviderLabel = (provider?: string) => {
    if (provider === 'local') return '本地';
    if (provider === 's3') return 'S3';
    return '';
  };

  const getDownloadStrategy = (provider?: string, isPersisted?: boolean) => {
    if (isPersisted) return '持久化';
    return '实时';
  };

  const getDownloadHint = (provider?: string, isPersisted?: boolean) => {
    if (isPersisted) return provider === 'local' ? '文件存储在本地' : '文件存储在 S3';
    return '实时生成，不占用存储空间';
  };

  const templateSourceLabel = (source?: string) => {
    switch (source) {
      case 'explicit': return '手动选择';
      case 'column_mapping': return '客户导入映射';
      case 'mixed': return '混合来源';
      case 'first': return '兜底模板';
      case 'default':
      default: return '默认模板';
    }
  };

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
        setRecordDetails(data.data.details || []);
      }
    } catch (error) {
      toast.error('加载详情失败');
    } finally {
      setLoadingDetails(false);
    }
  };

  // 重新生成 ZIP
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

      const refreshedRecord = data.data;

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

  // 执行导出
  const handleExport = async (
    supplierIdsOverride?: string[],
    mode: 'pending' | 'reexport' = 'pending',
    preview = false
  ) => {
    const supplierIds = supplierIdsOverride?.length ? supplierIdsOverride : activeTab === 'pending' ? selectedPending : selectedExported;
    if (supplierIds.length === 0) {
      toast.error('请至少选择一个发货方');
      return;
    }

    try {
      setExporting(true);
      const res = await fetch('/api/shipping-exports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          supplierIds,
          templateId: templateId || null,
          exportedBy: actorName,
          dispatchMode: preview ? 'preview' : 'dispatch',
          persistenceMode: 'full',
          mode,
        }),
      });

      const data = await res.json();

      // 如果 API 返回错误（无有效 data），抛出错误
      if (!data.data) {
        throw new Error(data.error || '导出失败');
      }

      // 即使有部分错误也显示结果对话框
      const hasErrors = data.data?.errors?.length > 0;
      const hasDownload = !preview && data.data?.zipBase64;

      // 触发下载（如果有）
      if (hasDownload) {
        triggerDownload(
          `data:application/zip;base64,${data.data.zipBase64}`,
          data.data.zipFileName
        );
      }

      // 保存结果并显示对话框
      setExportSummary({
        recordId: data.data.recordId,
        zipFileName: data.data.zipFileName,
        zipBase64: data.data.zipBase64,
        templateName: data.data.templateName,
        mode,
        totalSupplierCount: data.data.totalSupplierCount,
        totalOrderCount: data.data.totalOrderCount,
      });
      setExportResults(data.data.details || []);
      setExportErrors((data.data.errors || []).map((e: unknown) => typeof e === 'string' ? { message: e } : e as ExportError));
      setExportWarnings(data.data.warnings || []);
      setShowResultDialog(true);

      const warningCount = data.data.warnings?.length || 0;

      // 根据是否有错误/警告显示不同提示
      if (hasErrors) {
        toast.error(
          preview
            ? `预览失败：${data.data.totalSupplierCount} 个发货方，${data.data.errors?.length} 条错误${warningCount ? `，${warningCount} 条警告` : ''}`
            : `导出失败：${data.data.totalSupplierCount} 个发货方，${data.data.errors?.length} 条错误，${warningCount} 条警告`
        );
      } else if (warningCount > 0) {
        toast.warning(
          preview
            ? `预览完成：${data.data.totalSupplierCount} 个发货方，共 ${data.data.totalOrderCount} 个订单（${warningCount} 条库存警告）`
            : `导出完成：${data.data.totalSupplierCount} 个发货方，共 ${data.data.totalOrderCount} 个订单（${warningCount} 条库存警告）`
        );
      } else {
        toast.success(
          preview
            ? `预览：${data.data.totalSupplierCount} 个发货方，共 ${data.data.totalOrderCount} 个订单`
            : `导出成功：${data.data.totalSupplierCount} 个发货方，共 ${data.data.totalOrderCount} 个订单`
        );
      }

      if (!preview) {
        setSelectedPending([]);
        setSelectedExported([]);
        if (activeTab === 'pending') loadPending();
        else loadExported();
      }
    } catch (err) {
      console.error('[Export Error]', err, { supplierIds, mode, preview });
      toast.error(err instanceof Error ? err.message : '导出失败，请刷新后重试');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadZip = () => {
    setDownloadingZip(true);
    try {
      if (exportSummary?.zipBase64) {
        triggerDownload(`data:application/zip;base64,${exportSummary.zipBase64}`, exportSummary.zipFileName);
        toast.success('ZIP 已下载');
      }
    } finally {
      setDownloadingZip(false);
    }
  };

  // 过滤
  const filteredPending = pendingSuppliers.filter(
    (s) => s.name.includes(pendingSearch) || s.code.includes(pendingSearch)
  );
  const filteredExported = exportedSuppliers.filter(
    (s) => s.name.includes(exportedSearch) || s.code.includes(exportedSearch)
  );

  const getTemplateSourceLabel = (source?: string) => {
    switch (source) {
      case 'explicit': return '手动选择';
      case 'target': return '发货方专属';
      case 'linked': return '关联模板';
      case 'default': return '系统默认';
      case 'first': return '首个活跃';
      default: return source || '';
    }
  };

  const selectedCount = activeTab === 'pending' ? selectedPending.length : selectedExported.length;

  return (
    <PageGuard permission="orders:export" title="无法访问发货通知导出">
    <div className="container mx-auto space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* 标题 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">发货通知单</h1>
            <p className="text-sm text-muted-foreground">按发货方批量导出 / 二次导出发货通知单</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <HelpGuide
            title="发货导出帮助"
            docUrl="/docs/guides/shipping-export"
          >
            <HelpSection title="功能说明">
              按发货方生成派发单，支持自定义模板和三种派发模式。
            </HelpSection>
            <HelpSection title="派发模式">
              <HelpSteps steps={[
                { title: "预览", description: "仅生成预览内容，无副作用" },
                { title: "仅派发", description: "派发订单、扣减库存、写派发记录" },
                { title: "派发并留痕", description: "包含所有副作用+文件持久化" },
              ]} />
            </HelpSection>
            <HelpSection title="模板优先级">
              <div className="text-xs space-y-1">
                <div>1. 发货方专属模板（优先）</div>
                <div>2. 用户选择的模板</div>
                <div>3. 默认模板（fallback）</div>
              </div>
            </HelpSection>
            <HelpNote type="warning">
              注意：派发会扣减库存，请确认后再执行
            </HelpNote>
            <HelpLinks links={[
              { label: "回单导入", href: "/return-receipt", description: "导入回单" },
              { label: "核心业务流", href: "/docs/guides/business-flow", description: "模块数据流转" },
            ]} />
          </HelpGuide>
          <Button variant="outline" onClick={() => activeTab === 'pending' ? loadPending() : loadExported()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Select value={templateId || 'none'} onValueChange={(v) => setTemplateId(v === 'none' ? '' : v)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="选择模板" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">系统默认模板</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'exported')}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-1.5">
            <Clock className="h-4 w-4" />
            待导出
            {pendingSuppliers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pendingSuppliers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="exported" className="gap-1.5">
            <History className="h-4 w-4" />
            已导出
            {exportedSuppliers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {exportedSuppliers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 待导出 Tab */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">待导出发货通知</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索发货方..."
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredPending.length} 个发货方
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPending.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无待导出的发货方</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedPending.length === filteredPending.length && filteredPending.length > 0}
                            onCheckedChange={() => toggleSelectAll(selectedPending, setSelectedPending, filteredPending)}
                          />
                        </TableHead>
                                <TableHead>发货方</TableHead>
                        <TableHead>编码</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead className="text-right">待发货订单</TableHead>
                        <TableHead>上次导出</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPending.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedPending.includes(s.id)}
                              onCheckedChange={() => toggleSelect(s.id, selectedPending, setSelectedPending)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {s.name}
                            {s.id.startsWith('synthetic-') && (
                              <Badge variant="secondary" className="ml-2 text-xs">未注册</Badge>
                            )}
                          </TableCell>
                          <TableCell>{s.code}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{s.type === 'synthetic' ? '未注册' : s.type || '发货方'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={s.pendingOrderCount > 10 ? 'text-red-600 font-semibold' : ''}>
                              {s.pendingOrderCount}
                            </span>
                          </TableCell>
                          <TableCell>
                            {s.lastExportTime ? (
                              <span className="text-sm text-muted-foreground">
                                {new Date(s.lastExportTime).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">未导出过</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleExport([s.id], 'pending')}
                              disabled={exporting}
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              导出
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleExport([s.id], 'pending', true)}
                              disabled={exporting}
                            >
                              <FileSpreadsheet className="h-4 w-4 mr-1" />
                              预览
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 批量操作栏 */}
          {filteredPending.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">
                已选 {selectedPending.length} 个发货方
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleExport(undefined, 'pending', true)}
                  disabled={selectedPending.length === 0 || exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  预览 ({selectedPending.length})
                </Button>
                <Button
                  onClick={() => void handleExport()}
                  disabled={selectedPending.length === 0 || exporting}
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />导出中...</>
                  ) : (
                    <><FileDown className="h-4 w-4 mr-2" />批量导出 ({selectedPending.length})</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 已导出 Tab - 历史导出记录表格 */}
        <TabsContent value="exported" className="space-y-4">
          {/* 筛选栏 */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="date"
                    placeholder="开始日期"
                    value={recordStartDate}
                    onChange={(e) => setRecordStartDate(e.target.value)}
                    className="w-[150px]"
                  />
                  <span className="text-muted-foreground">至</span>
                  <Input
                    type="date"
                    placeholder="结束日期"
                    value={recordEndDate}
                    onChange={(e) => setRecordEndDate(e.target.value)}
                    className="w-[150px]"
                  />
                </div>
                <Input
                  placeholder="搜索发货方..."
                  value={recordShipperName}
                  onChange={(e) => setRecordShipperName(e.target.value)}
                  className="w-[200px]"
                />
                <div className="relative flex-1 lg:max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索文件名..."
                    value={recordSearchTerm}
                    onChange={(e) => setRecordSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="text-sm text-muted-foreground lg:ml-auto">
                  共 {recordTotal} 条记录
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 导出记录列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">导出记录列表</CardTitle>
              <div className="flex justify-end">
                <Button variant="outline" size="sm" onClick={() => loadRecords()} disabled={recordLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${recordLoading ? 'animate-spin' : ''}`} />
                  刷新
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recordLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : records.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无导出记录</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>导出时间</TableHead>
                        <TableHead>发货方</TableHead>
                        <TableHead>文件名</TableHead>
                        <TableHead>模板</TableHead>
                        <TableHead className="text-right">导出数量</TableHead>
                        <TableHead>导出人</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.filter(r => !recordSearchTerm || r.file_name.includes(recordSearchTerm) || r.template_name.includes(recordSearchTerm)).map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>
                            {new Date(record.created_at).toLocaleString('zh-CN')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.supplier_name || '-'}
                          </TableCell>
                          <TableCell className="font-medium">{record.file_name}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div>{record.template_name || '-'}</div>
                              <div className="flex flex-wrap gap-1">
                                {record.metadata?.template_source && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {templateSourceLabel(record.metadata.template_source)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-semibold">{record.total_count}</span>
                            <span className="text-muted-foreground"> 单</span>
                          </TableCell>
                          <TableCell>{record.exported_by || '系统'}</TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center gap-1 sm:flex-row sm:justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetail(record)}
                              >
                                <FileSpreadsheet className="h-4 w-4 mr-1" />
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
                                {getDownloadActionLabel(record.metadata?.artifact?.provider, isPersistedArtifact(record.metadata?.artifact))}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 分页 */}
          {recordTotal > recordPageSize && (
            <div className="flex flex-col items-stretch justify-center gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                disabled={recordPage === 1}
                onClick={() => setRecordPage(p => p - 1)}
              >
                上一页
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {recordPage} / {Math.ceil(recordTotal / recordPageSize)} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={recordPage >= Math.ceil(recordTotal / recordPageSize)}
                onClick={() => setRecordPage(p => p + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 导出结果对话框 */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>导出结果</DialogTitle>
            <DialogDescription>
              {exportSummary?.mode === 'reexport' ? '二次导出' : '首次导出'}：{exportSummary?.totalSupplierCount} 个发货方，{exportSummary?.totalOrderCount} 个订单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {exportResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium">{r.supplierName}</p>
                    <p className="text-sm text-muted-foreground">
                      共 {r.orderCount} 个订单
                      {r.templateSource && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          （模板：{getTemplateSourceLabel(r.templateSource)}）
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 max-w-[200px] truncate">
                  {r.fileName}
                </Badge>
              </div>
            ))}

            {/* 警告列表（库存不足等非阻断提示） */}
            {exportWarnings.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>库存警告（{exportWarnings.length} 条）</span>
                </div>
                {exportWarnings.map((w, i) => (
                  <div key={i} className="text-sm text-amber-600 pl-6">
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* 错误列表 */}
            {exportErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <div className="flex items-center gap-2 text-red-700 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>导出失败（{exportErrors.length} 条）</span>
                </div>
                {exportErrors.map((err, i) => (
                  <div key={i} className="text-sm text-red-600 pl-6">
                    {err.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" onClick={() => setShowResultDialog(false)}>关闭</Button>
            <Button onClick={handleDownloadZip} disabled={downloadingZip || !exportSummary?.zipBase64}>
              {downloadingZip ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileDown className="h-4 w-4 mr-2" />}
              下载 ZIP
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出记录详情对话框 */}
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
          ) : recordDetails.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>暂无详情</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recordDetails.map((detail, index) => (
                <div key={index} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                      <div>
                        <p className="font-medium">{detail.supplierName || detail.customerName || '未知'}</p>
                        <p className="text-sm text-muted-foreground">
                          共 {detail.orderCount} 个订单
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 max-w-[200px] truncate">
                      {detail.fileName}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
