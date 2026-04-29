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
  FileSpreadsheet, Clock, History, FileText
} from 'lucide-react';
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
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [exportErrors, setExportErrors] = useState<ExportError[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

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

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === 'export') {
      loadPending();
    }
  }, [activeTab, loadPending, user]);

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

  return (
    <PageGuard permission="orders:export" title="无法访问客户反馈导出">
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

        {/* 历史记录 Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <History className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">查看客户反馈导出历史记录</p>
                <Button variant="outline" onClick={() => router.push('/export-records?type=customer_feedback')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  前往导出记录
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
    </div>
    </PageGuard>
  );
}
