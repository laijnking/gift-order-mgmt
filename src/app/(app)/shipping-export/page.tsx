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
  FileSpreadsheet, Clock, History
} from 'lucide-react';
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

  // 模板
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  // 导出
  const [exporting, setExporting] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [downloadingZip, setDownloadingZip] = useState(false);

  // 加载待导出供应商
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

  // 加载已导出供应商
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
      loadExported();
    }
  }, [activeTab, loadPending, loadExported, user]);

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
  const handleExport = async (
    supplierIdsOverride?: string[],
    mode: 'pending' | 'reexport' = 'pending',
    preview = false
  ) => {
    const supplierIds = supplierIdsOverride?.length ? supplierIdsOverride : activeTab === 'pending' ? selectedPending : selectedExported;
    if (supplierIds.length === 0) {
      toast.error('请至少选择一个供应商');
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
      if (!data.success) throw new Error(data.error);

      if (!preview && data.data.zipBase64) {
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
        mode,
        totalSupplierCount: data.data.totalSupplierCount,
        totalOrderCount: data.data.totalOrderCount,
      });
      setExportResults(data.data.details || []);
      setShowResultDialog(true);

      toast.success(
        preview
          ? `预览：${data.data.totalSupplierCount} 个供应商，共 ${data.data.totalOrderCount} 个订单`
          : `导出成功：${data.data.totalSupplierCount} 个供应商，共 ${data.data.totalOrderCount} 个订单`
      );

      if (!preview) {
        setSelectedPending([]);
        setSelectedExported([]);
        if (activeTab === 'pending') loadPending();
        else loadExported();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '导出失败');
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
            <p className="text-sm text-muted-foreground">按供应商批量导出 / 二次导出发货通知单</p>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
                      placeholder="搜索供应商..."
                      value={pendingSearch}
                      onChange={(e) => setPendingSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredPending.length} 个供应商
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
                  <p>暂无待导出的供应商</p>
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
                        <TableHead>供应商</TableHead>
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
                            <Badge variant="outline">{s.type === 'synthetic' ? '未注册' : s.type || '供应商'}</Badge>
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
                已选 {selectedPending.length} 个供应商
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

        {/* 已导出 Tab */}
        <TabsContent value="exported" className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <CardTitle className="text-base">已导出发货通知</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索供应商..."
                      value={exportedSearch}
                      onChange={(e) => setExportedSearch(e.target.value)}
                      className="pl-9 w-[200px]"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {filteredExported.length} 个供应商
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredExported.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>暂无已导出的供应商</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedExported.length === filteredExported.length && filteredExported.length > 0}
                            onCheckedChange={() => toggleSelectAll(selectedExported, setSelectedExported, filteredExported)}
                          />
                        </TableHead>
                        <TableHead>供应商</TableHead>
                        <TableHead>编码</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead className="text-right">已导出次数</TableHead>
                        <TableHead className="text-right">已导出订单</TableHead>
                        <TableHead>最近导出</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExported.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedExported.includes(s.id)}
                              onCheckedChange={() => toggleSelect(s.id, selectedExported, setSelectedExported)}
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
                            <Badge variant="outline">{s.type === 'synthetic' ? '未注册' : s.type || '供应商'}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{s.exportCount}</TableCell>
                          <TableCell className="text-right">{s.exportedOrderCount}</TableCell>
                          <TableCell>
                            {s.lastExportAt ? (
                              <span className="text-sm text-muted-foreground">
                                {new Date(s.lastExportAt).toLocaleDateString()}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleExport([s.id], 'reexport')}
                              disabled={exporting}
                            >
                              <FileDown className="h-4 w-4 mr-1" />
                              二次导出
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => void handleExport([s.id], 'reexport', true)}
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
          {filteredExported.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">
                已选 {selectedExported.length} 个供应商
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => void handleExport(undefined, 'reexport', true)}
                  disabled={selectedExported.length === 0 || exporting}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  预览 ({selectedExported.length})
                </Button>
                <Button
                  onClick={() => void handleExport()}
                  disabled={selectedExported.length === 0 || exporting}
                >
                  {exporting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />导出中...</>
                  ) : (
                    <><FileDown className="h-4 w-4 mr-2" />二次导出 ({selectedExported.length})</>
                  )}
                </Button>
              </div>
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
              {exportSummary?.mode === 'reexport' ? '二次导出' : '首次导出'}：{exportSummary?.totalSupplierCount} 个供应商，{exportSummary?.totalOrderCount} 个订单
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {exportResults.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <div>
                    <p className="font-medium">{r.supplierName}</p>
                    <p className="text-sm text-muted-foreground">共 {r.orderCount} 个订单</p>
                  </div>
                </div>
                <Badge variant="outline" className="shrink-0 max-w-[200px] truncate">
                  {r.fileName}
                </Badge>
              </div>
            ))}
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
