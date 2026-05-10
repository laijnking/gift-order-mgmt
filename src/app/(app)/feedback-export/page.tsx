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
  FileDown, Search, RefreshCw, CheckCircle2, Loader2,
  FileSpreadsheet, Clock, History, FileText, Download
} from 'lucide-react';
import { HelpGuide, HelpSection, HelpSteps, HelpNote, HelpLinks } from '@/components/ui/help-guide';
import { toast } from 'sonner';
import { buildUserInfoHeaders, useAuth } from '@/lib/auth';

interface PendingCustomer {
  id: string;
  name: string;
  code: string;
  returnedOrderCount: number;
}

interface TemplateOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface ExportResult {
  customerId: string;
  customerName: string;
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
  totalCustomerCount: number;
  totalOrderCount: number;
  /** 导出来源信息 */
  sourceInfo?: {
    templateSource: string;
    templateSourceLabel: string;
  };
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

export default function FeedbackExportPage() {
  const router = useRouter();
  const { user } = useAuth();
  const actorName = user?.realName || user?.username || 'system';

  const authHeaders = useCallback(() => buildUserInfoHeaders(user), [user]);

  // 状态
  const [activeTab, setActiveTab] = useState<'export' | 'history'>('export');
  const [loading, setLoading] = useState(true);

  // 待导出客户
  const [pendingCustomers, setPendingCustomers] = useState<PendingCustomer[]>([]);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [pendingSearch, setPendingSearch] = useState('');

  // 模板
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  // 导出
  const [exporting, setExporting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [exportPreview, setExportPreview] = useState<{
    customerCount: number;
    orderCount: number;
    templateSource: string;
  } | null>(null);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [exportErrors, setExportErrors] = useState<ExportError[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

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
  const [recordCustomerName, setRecordCustomerName] = useState('');
  const [recordLoading, setRecordLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ExportRecord | null>(null);
  const [recordDetails, setRecordDetails] = useState<ExportDetail[]>([]);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [regeneratingRecordId, setRegeneratingRecordId] = useState<string | null>(null);

  // 加载待导出客户
  const loadPending = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await fetch('/api/customers/feedback-pending', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setPendingCustomers(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载待导出数据失败');
    } finally {
      setLoading(false);
    }
  }, [authHeaders, user]);

  // 加载模板
  const loadTemplates = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, defaultRes] = await Promise.all([
        fetch('/api/templates?type=customer_feedback', { headers: authHeaders() }),
        fetch('/api/templates/default/customer_feedback', { headers: authHeaders() }),
      ]);
      const [listData, defaultData] = await Promise.all([listRes.json(), defaultRes.json()]);
      if (listData.success) setTemplates(listData.data || []);
      if (defaultData.success && defaultData.data?.id) setTemplateId(defaultData.data.id);
    } catch (err) {
      console.error('加载模板失败:', err);
    }
  }, [authHeaders, user]);

  // 加载导出记录（历史导出记录表格）
  const loadRecords = useCallback(async () => {
    if (!user) return;
    try {
      setRecordLoading(true);
      let url = `/api/export-records?page=${recordPage}&pageSize=${recordPageSize}&exportType=customer_feedback`;
      if (recordStartDate) url += `&startDate=${recordStartDate}`;
      if (recordEndDate) url += `&endDate=${recordEndDate}`;
      if (recordCustomerName) url += `&customerName=${encodeURIComponent(recordCustomerName)}`;

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
  }, [authHeaders, user, recordPage, recordPageSize, recordStartDate, recordEndDate, recordCustomerName]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'export') {
      loadPending();
    } else if (activeTab === 'history') {
      loadRecords();
    }
  }, [activeTab, loadPending, loadRecords, user]);

  // 导出记录加载依赖
  useEffect(() => {
    if (activeTab === 'history') {
      loadRecords();
    }
  }, [recordPage, recordStartDate, recordEndDate, recordCustomerName, loadRecords]);

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
  const handleExport = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('请至少选择一个客户');
      return;
    }

    try {
      setExporting(true);
      const res = await fetch('/api/export-feedback/returned-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          customerIds: selectedCustomers,
          templateId: templateId || null,
          exportedBy: actorName,
          persistenceMode: 'full',
        }),
      });

      const data = await res.json();

      if (!data.success || !data.data) {
        throw new Error(data.error || '导出失败');
      }

      const hasDownload = data.data?.zipBase64;

      if (hasDownload) {
        triggerDownload(
          `data:application/zip;base64,${data.data.zipBase64}`,
          data.data.zipFileName
        );
      }

      setExportSummary({
        recordId: data.data.recordId,
        zipFileName: data.data.zipFileName,
        zipBase64: data.data.zipBase64,
        templateName: data.data.templateName,
        totalCustomerCount: data.data.totalCustomerCount,
        totalOrderCount: data.data.totalOrderCount,
      });
      setExportResults(data.data.details || []);
      setExportErrors(data.data.errors || []);
      setShowResultDialog(true);
      toast.success(
        `导出成功：${data.data.totalCustomerCount} 个客户，共 ${data.data.totalOrderCount} 个订单`
      );

      setSelectedCustomers([]);
      if (activeTab === 'export') loadPending();
    } catch (err) {
      console.error('[Export Error]', err);
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
  const filteredCustomers = pendingCustomers.filter(
    (c) => c.name.includes(pendingSearch) || c.code.includes(pendingSearch)
  );

  const getTemplateSourceLabel = (source?: string) => {
    switch (source) {
      case 'explicit': return '手动选择';
      case 'column_mapping': return '客户导入映射';
      case 'first': return '兜底模板';
      case 'default': return '默认模板';
      default: return source || '';
    }
  };

  // 导出预览
  const handlePreview = async () => {
    if (selectedCustomers.length === 0) {
      toast.error('请至少选择一个客户');
      return;
    }

    try {
      const res = await fetch('/api/export-feedback/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          customerIds: selectedCustomers,
          templateId: templateId || null,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || '预览失败');
      }

      setExportPreview({
        customerCount: data.data.customerCount,
        orderCount: data.data.orderCount,
        templateSource: data.data.templateSource,
      });
      setShowPreviewDialog(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '预览失败');
    }
  };

  return (
    <PageGuard permission={['feedback_export:view', 'orders:export']} title="无法访问客户反馈导出">
    <div className="container mx-auto space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* 标题 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">客户反馈导出</h1>
            <p className="text-sm text-muted-foreground">导出已回单订单给客户（仅已回单状态）</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <HelpGuide
            title="反馈导出帮助"
            docUrl="/docs/guides/feedback-export"
          >
            <HelpSection title="功能说明">
              导出已回单订单给客户，使用客户导入时的原始列名。
            </HelpSection>
            <HelpSection title="核心原则">
              <HelpNote type="info">
                客户用什么列名导入，系统就用什么列名导出。物流信息（快递公司、运单号）由系统追加。
              </HelpNote>
            </HelpSection>
            <HelpSection title="数据还原流程">
              <HelpSteps steps={[
                { title: "客户上传Excel" },
                { title: "识别客户编码" },
                { title: "计算表头指纹" },
                { title: "命中历史映射" },
                { title: "按原始列名导出" },
              ]} />
            </HelpSection>
            <HelpLinks links={[
              { label: "订单解析", href: "/order-parse", description: "订单录入" },
              { label: "回单导入", href: "/return-receipt", description: "回单确认" },
              { label: "核心业务流", href: "/docs/guides/business-flow", description: "模块数据流转" },
            ]} />
          </HelpGuide>
          <Button variant="outline" onClick={loadPending} disabled={loading}>
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
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'history')}>
        <TabsList>
          <TabsTrigger value="export" className="gap-1.5">
            <Clock className="h-4 w-4" />
            导出
            {pendingCustomers.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pendingCustomers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <History className="h-4 w-4" />
            历史记录
          </TabsTrigger>
        </TabsList>

        {/* 导出 Tab */}
        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">待导出客户</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索客户..."
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredCustomers.length} 个客户
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无待导出的客户</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                            onCheckedChange={() => toggleSelectAll(selectedCustomers, setSelectedCustomers, filteredCustomers)}
                          />
                        </TableHead>
                        <TableHead>客户名称</TableHead>
                        <TableHead>客户编码</TableHead>
                        <TableHead className="text-right">已回单订单数</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCustomers.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCustomers.includes(c.id)}
                              onCheckedChange={() => toggleSelect(c.id, selectedCustomers, setSelectedCustomers)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.code}</TableCell>
                          <TableCell className="text-right">
                            <span className={c.returnedOrderCount > 10 ? 'text-red-600 font-semibold' : ''}>
                              {c.returnedOrderCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCustomers([c.id]);
                                void handleExport();
                              }}
                              disabled={exporting}
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              导出
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
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">
                已选 {selectedCustomers.length} 个客户
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handlePreview()}
                  disabled={selectedCustomers.length === 0 || exporting}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  预览导出
                </Button>
                <Button
                  onClick={() => void handleExport()}
                  disabled={selectedCustomers.length === 0 || exporting}
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />导出中...</>
                  ) : (
                    <><FileDown className="h-4 w-4 mr-2" />批量导出 ({selectedCustomers.length})</>
                  )}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        {/* 历史记录 Tab - 历史导出记录表格 */}
        <TabsContent value="history" className="space-y-4">
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
                  placeholder="搜索客户..."
                  value={recordCustomerName}
                  onChange={(e) => setRecordCustomerName(e.target.value)}
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
                        <TableHead>客户</TableHead>
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
                            {record.customer_name || '-'}
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

      {/* 导出预览对话框 */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>导出预览</DialogTitle>
            <DialogDescription>
              确认以下导出信息后点击"确认导出"
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">客户数量</span>
                <span className="font-semibold">{exportPreview?.customerCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">订单数量</span>
                <span className="font-semibold">{exportPreview?.orderCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">列来源</span>
                <Badge variant="outline">{getTemplateSourceLabel(exportPreview?.templateSource)}</Badge>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              本次将使用 <strong>{getTemplateSourceLabel(exportPreview?.templateSource)}</strong> 导出
              <strong>{exportPreview?.orderCount}</strong> 个已回单订单。
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
              取消
            </Button>
            <Button onClick={() => {
              setShowPreviewDialog(false);
              void handleExport();
            }}>
              <FileDown className="h-4 w-4 mr-2" />
              确认导出
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导出结果对话框 */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>导出结果</DialogTitle>
            <DialogDescription>
              已导出：{exportSummary?.totalCustomerCount} 个客户，{exportSummary?.totalOrderCount} 个订单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {exportResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium">{r.customerName}</p>
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

            {exportErrors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                {exportErrors.map((err, i) => (
                  <div key={i} className="text-sm text-red-600">
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
                        <p className="font-medium">{detail.customerName || detail.supplierName || '未知'}</p>
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
