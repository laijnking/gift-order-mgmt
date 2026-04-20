'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageGuard } from '@/components/auth/page-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Label } from '@/components/ui/label';
import {
  Package, FileDown, Search, RefreshCw, CheckCircle2, AlertTriangle, Loader2,
  FileSpreadsheet, Building2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  getDownloadActionLabel,
  getDownloadHint,
  getDownloadStrategy,
  getStorageProviderLabel,
  isPersistedArtifact,
  isPersistedRecordUrl,
} from '@/lib/export-download';
import { buildUserInfoHeaders, useAuth } from '@/lib/auth';

interface Supplier {
  id: string;
  name: string;
  code: string;
  type: string;
  pendingOrderCount: number;
  lastExportTime: string | null;
}

interface PendingOrder {
  id: string;
  orderNo: string;
  customerOrderNo: string;
  supplierId: string;
  supplierName: string;
  itemCount: number;
  totalPrice: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  createdAt: string;
  hasStockWarning: boolean;
}

interface ExportResult {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  fileName: string;
  fileUrl: string;
  status: string;
  templateName?: string;
  templateSource?: 'explicit' | 'default' | 'first';
  artifact?: {
    provider?: 'local' | 's3';
    relative_path?: string;
    file_name?: string;
  };
}

interface TemplateOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

interface ExportSummary {
  recordId?: string | null;
  zipFileName: string;
  zipBase64: string;
  zipFileUrl?: string | null;
  templateId?: string | null;
  templateName?: string;
  templateSource?: 'explicit' | 'default' | 'first';
  dispatchMode?: 'preview' | 'dispatch';
  persistenceMode?: 'none' | 'full';
  executionMode?: 'preview' | 'dispatch_only' | 'dispatch_with_persistence';
  supplierIds?: string[];
  dispatchSummary?: {
    mode: 'preview' | 'dispatch';
    newDispatchCount: number;
    reusedDispatchCount: number;
    assignedOnlyCount: number;
  };
  persistenceSummary?: {
    exportRecordCreated: boolean;
    zipArtifactPersisted: boolean;
    detailArtifactPersistedCount: number;
  };
  artifact?: {
    provider?: 'local' | 's3';
    relative_path?: string;
    file_name?: string;
  } | null;
}

export default function ShippingExportPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'exported'>('all');
  const [exporting, setExporting] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [templateId, setTemplateId] = useState<string>('');
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [exportResults, setExportResults] = useState<ExportResult[]>([]);
  const [exportSummary, setExportSummary] = useState<ExportSummary | null>(null);
  const [downloadingTarget, setDownloadingTarget] = useState<string | null>(null);
  const [downloadingZip, setDownloadingZip] = useState(false);

  const executionModeLabel = (mode?: 'preview' | 'dispatch_only' | 'dispatch_with_persistence') => {
    switch (mode) {
      case 'dispatch_only':
        return '仅派发';
      case 'dispatch_with_persistence':
        return '派发并留痕';
      case 'preview':
      default:
        return '预览';
    }
  };

  const triggerBrowserDownload = (url: string, filename?: string) => {
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    if (filename) {
      downloadLink.download = filename;
    }
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const authHeaders = () => buildUserInfoHeaders(user);

  // 加载供应商待发货统计
  useEffect(() => {
    loadSuppliers();
    loadTemplates();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipping-exports/pending', {
        headers: authHeaders(),
      });
      const data = await response.json();
      
      if (data.success) {
        setSuppliers(data.data || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const [listResponse, defaultResponse] = await Promise.all([
        fetch('/api/templates?type=shipping', { headers: authHeaders() }),
        fetch('/api/templates/default/shipping', { headers: authHeaders() }),
      ]);
      const [listData, defaultData] = await Promise.all([
        listResponse.json(),
        defaultResponse.json(),
      ]);
      if (listData.success) {
        setTemplates(listData.data || []);
      }
      if (defaultData.success && defaultData.data?.id) {
        setTemplateId(defaultData.data.id);
      }
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  // 过滤供应商 - 按待发货+未导出排序
  const filteredSuppliers = suppliers
    .filter(s => 
      s.name.includes(searchTerm) || s.code.includes(searchTerm)
    )
    .filter(s => {
      if (statusFilter === 'all') return true;
      const hasExported = s.lastExportTime !== null && s.lastExportTime !== undefined;
      if (statusFilter === 'pending') return !hasExported;
      if (statusFilter === 'exported') return hasExported;
      return true;
    })
    .sort((a, b) => {
      // 优先显示：未导出 > 已导出，待发货多的在前
      const aHasExported = a.lastExportTime !== null && a.lastExportTime !== undefined;
      const bHasExported = b.lastExportTime !== null && b.lastExportTime !== undefined;
      if (aHasExported !== bHasExported) return aHasExported ? 1 : -1; // 未导出的在前
      if (a.pendingOrderCount !== b.pendingOrderCount) return b.pendingOrderCount - a.pendingOrderCount;
      return a.name.localeCompare(b.name);
    });

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedSuppliers.length === filteredSuppliers.length) {
      setSelectedSuppliers([]);
    } else {
      setSelectedSuppliers(filteredSuppliers.map(s => s.id));
    }
  };

  // 单选/取消单选
  const toggleSelect = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  // 导出发货通知单
  const handleExport = async (
    supplierIdsOverride?: string[],
    mode: 'preview' | 'dispatch' = 'dispatch',
    templateIdOverride?: string | null,
    persistenceModeOverride?: 'none' | 'full'
  ) => {
    const supplierIds = supplierIdsOverride && supplierIdsOverride.length > 0
      ? supplierIdsOverride
      : selectedSuppliers;
    const effectiveTemplateId =
      templateIdOverride !== undefined ? templateIdOverride : (templateId || null);
    const effectivePersistenceMode =
      mode === 'preview' ? 'none' : persistenceModeOverride === 'none' ? 'none' : 'full';

    if (supplierIds.length === 0) {
      toast.error('至少选择一个供应商进行导出');
      return;
    }

    try {
      setExporting(true);
      const response = await fetch('/api/shipping-exports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          supplierIds,
          templateId: effectiveTemplateId,
          dispatchMode: mode,
          persistenceMode: effectivePersistenceMode,
          exportedBy: 'current_user', // TODO: 获取当前用户
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 正式导出时自动触发ZIP文件下载
        if (mode === 'dispatch' && data.data.zipBase64) {
          const linkSource = `data:application/zip;base64,${data.data.zipBase64}`;
          triggerBrowserDownload(linkSource, data.data.zipFileName);
        }
        
        setExportResults(data.data.details || []);
        setExportSummary({
          recordId: data.data.recordId ?? null,
          zipFileName: data.data.zipFileName,
          zipBase64: data.data.zipBase64,
          zipFileUrl: data.data.zipFileUrl,
          templateId: data.data.templateId ?? effectiveTemplateId,
          templateName: data.data.templateName,
          templateSource: data.data.templateSource,
          dispatchMode: data.data.dispatchMode || mode,
          persistenceMode: data.data.persistenceMode || effectivePersistenceMode,
          executionMode: data.data.executionMode,
          supplierIds,
          dispatchSummary: data.data.dispatchSummary,
          persistenceSummary: data.data.persistenceSummary,
          artifact: data.data.artifact,
        });
        setShowExportDialog(true);
        
        toast.success(
          mode === 'preview'
            ? `已生成预览：${data.data.totalSupplierCount} 个供应商，共 ${data.data.totalOrderCount} 个订单`
            : data.data.persistenceMode === 'none'
              ? `已派发 ${data.data.totalSupplierCount} 个供应商，共 ${data.data.totalOrderCount} 个订单，未写入导出记录`
            : `成功导出 ${data.data.totalSupplierCount} 个供应商，共 ${data.data.totalOrderCount} 个订单`
        );
        
        // 刷新数据
        if (mode === 'dispatch') {
          loadSuppliers();
        }
        if (!supplierIdsOverride && mode === 'dispatch') {
          setSelectedSuppliers([]);
        }
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setExporting(false);
    }
  };

  const downloadZipFile = () => {
    setDownloadingZip(true);
    const strategy = getDownloadStrategy(
      exportSummary?.artifact?.provider,
      isPersistedArtifact(exportSummary?.artifact)
    );
    try {
      if (exportSummary?.zipFileUrl?.startsWith('/api/export-records/')) {
        triggerBrowserDownload(exportSummary.zipFileUrl, exportSummary.zipFileName);
        toast.success(strategy === '直链下载' ? '已开始直链下载ZIP文件' : '已开始下载ZIP文件');
        return;
      }

      if (!exportSummary?.zipBase64 || !exportSummary.zipFileName) {
        toast.error('当前没有可下载的ZIP文件');
        return;
      }

      const linkSource = `data:application/zip;base64,${exportSummary.zipBase64}`;
      triggerBrowserDownload(linkSource, exportSummary.zipFileName);
      toast.success('已生成并开始下载ZIP文件');
    } finally {
      setDownloadingZip(false);
    }
  };

  const downloadDetailFile = async (result: ExportResult) => {
    const targetKey = result.supplierId || result.fileName;
    setDownloadingTarget(targetKey);

    try {
      const strategy = getDownloadStrategy(result.artifact?.provider, isPersistedArtifact(result.artifact));
      if (isPersistedRecordUrl(result.fileUrl)) {
        triggerBrowserDownload(result.fileUrl, result.fileName);
        toast.success(strategy === '直链下载' ? '已开始直链下载明细文件' : '已开始下载明细文件');
        return;
      }

      if (exportSummary?.dispatchMode === 'preview') {
        toast.info('预览模式下未持久化明细文件，请先确认导出并派发。');
        return;
      }

      toast.info('当前明细文件未持久化，先下载整批 ZIP。');
      downloadZipFile();
    } finally {
      setDownloadingTarget(null);
    }
  };

  const isDownloadingDetail = (result: ExportResult) =>
    downloadingTarget === (result.supplierId || result.fileName);

  const isPreviewMode = exportSummary?.dispatchMode === 'preview';

  const templateSourceLabel = (source?: 'explicit' | 'default' | 'first') => {
    switch (source) {
      case 'explicit':
        return '手动选择';
      case 'first':
        return '兜底模板';
      case 'default':
      default:
        return '默认模板';
    }
  };

  return (
    <PageGuard permission="orders:export" title="无法访问发货通知导出">
    <div className="container mx-auto space-y-6 px-3 py-4 sm:px-4 sm:py-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold">发货通知单导出</h1>
            <p className="text-sm text-muted-foreground">批量导出供应商待发货订单</p>
          </div>
        </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="outline" onClick={loadSuppliers} disabled={loading} className="w-full sm:w-auto">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void handleExport(undefined, 'preview')}
              disabled={selectedSuppliers.length === 0 || exporting}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              预览选中 ({selectedSuppliers.length})
            </Button>
            <Button 
              className="w-full sm:w-auto"
              onClick={() => void handleExport()} 
              disabled={selectedSuppliers.length === 0 || exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4 mr-2" />
                批量导出 ({selectedSuppliers.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="relative flex-1 xl:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索供应商名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={templateId || 'none'} onValueChange={(value) => setTemplateId(value === 'none' ? '' : value)}>
              <SelectTrigger className="w-full xl:w-[220px]">
                <SelectValue placeholder="选择导出模板" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">使用系统默认模板</SelectItem>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* 状态筛选 */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setStatusFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                className={`flex-1 sm:flex-none ${statusFilter === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                onClick={() => setStatusFilter('pending')}
              >
                待发货+未导出
              </Button>
              <Button
                variant={statusFilter === 'exported' ? 'default' : 'outline'}
                size="sm"
                className="flex-1 sm:flex-none"
                onClick={() => setStatusFilter('exported')}
              >
                已导出
              </Button>
            </div>
            <div className="text-sm text-muted-foreground xl:ml-auto">
              共 {filteredSuppliers.length} 个供应商
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 供应商列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">待发货供应商列表</CardTitle>
          <CardDescription>
            选择需要导出发货通知单的供应商
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>暂无待发货供应商</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox 
                      checked={selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>供应商名称</TableHead>
                  <TableHead>编码</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead className="text-right">待发货订单</TableHead>
                  <TableHead>上次导出</TableHead>
                  <TableHead className="text-center">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={() => toggleSelect(supplier.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {supplier.type === 'jd' ? '京东' : 
                         supplier.type === 'pdd' ? '拼多多' : '自有'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={supplier.pendingOrderCount > 10 ? 'text-red-600 font-semibold' : ''}>
                        {supplier.pendingOrderCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      {supplier.lastExportTime ? (
                        <span className="text-sm text-muted-foreground">
                          {new Date(supplier.lastExportTime).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">未导出</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          void handleExport([supplier.id], 'dispatch');
                        }}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        导出
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          void handleExport([supplier.id], 'preview');
                        }}
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

      {/* 导出结果对话框 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{isPreviewMode ? '预览结果' : '导出结果'}</DialogTitle>
            <DialogDescription>
              {isPreviewMode ? '以下内容为预览，不会派发订单或扣减库存' : '以下文件已成功生成，点击下载'}
            </DialogDescription>
          </DialogHeader>

          {exportSummary && (
            <div className="rounded-lg border bg-muted/30 p-3 text-xs">
              <div className="flex flex-wrap gap-2">
                {exportSummary.templateName && (
                  <Badge variant="outline">模板：{exportSummary.templateName}</Badge>
                )}
                <Badge variant="outline">来源：{templateSourceLabel(exportSummary.templateSource)}</Badge>
                <Badge variant="outline">{isPreviewMode ? '模式：预览' : '模式：派发导出'}</Badge>
                <Badge variant="outline">
                  执行：{executionModeLabel(exportSummary.executionMode)}
                </Badge>
                <Badge variant="outline">
                  持久化：{exportSummary.persistenceMode === 'none' ? '仅派发' : '写记录并落盘'}
                </Badge>
                {exportSummary.dispatchSummary && (
                  <>
                    <Badge variant="outline">新派发：{exportSummary.dispatchSummary.newDispatchCount}</Badge>
                    <Badge variant="outline">复用派发：{exportSummary.dispatchSummary.reusedDispatchCount}</Badge>
                    <Badge variant="outline">仅导出：{exportSummary.dispatchSummary.assignedOnlyCount}</Badge>
                  </>
                )}
                {exportSummary.persistenceSummary && (
                  <>
                    <Badge variant="outline">
                      记录：{exportSummary.persistenceSummary.exportRecordCreated ? '已写入' : '未写入'}
                    </Badge>
                    <Badge variant="outline">
                      ZIP：{exportSummary.persistenceSummary.zipArtifactPersisted ? '已落盘' : '未落盘'}
                    </Badge>
                    <Badge variant="outline">
                      明细落盘：{exportSummary.persistenceSummary.detailArtifactPersistedCount}
                    </Badge>
                  </>
                )}
                {exportSummary.artifact?.provider && (
                  <Badge variant="outline">
                    存储：{getStorageProviderLabel(exportSummary.artifact.provider)}
                  </Badge>
                )}
                <Badge variant="outline">
                  下载策略：{getDownloadStrategy(
                    exportSummary.artifact?.provider,
                    isPersistedArtifact(exportSummary.artifact)
                  )}
                </Badge>
                <Badge variant="outline">打包文件：{exportSummary.zipFileName}</Badge>
              </div>
              <p className="mt-2 text-muted-foreground">
                {isPreviewMode
                  ? '预览模式仅生成内容，不会写入导出记录，也不会触发派发副作用。'
                  : exportSummary.persistenceMode === 'none'
                    ? '当前结果仅执行派发，不写导出记录，也不会落盘 ZIP 或明细文件。'
                  : getDownloadHint(exportSummary.artifact?.provider, isPersistedArtifact(exportSummary.artifact), '当前会优先回退到整批ZIP')}
              </p>
              {exportSummary.dispatchSummary && (
                <p className="mt-1 text-muted-foreground">
                  {isPreviewMode
                    ? `当前预览覆盖 ${exportSummary.dispatchSummary.assignedOnlyCount} 条订单内容。`
                    : exportSummary.executionMode === 'dispatch_only'
                      ? `本次执行仅派发：新派发 ${exportSummary.dispatchSummary.newDispatchCount} 单，复用既有派发 ${exportSummary.dispatchSummary.reusedDispatchCount} 单，未新增派发仅导出 ${exportSummary.dispatchSummary.assignedOnlyCount} 单。`
                      : `本次新派发 ${exportSummary.dispatchSummary.newDispatchCount} 单，复用既有派发 ${exportSummary.dispatchSummary.reusedDispatchCount} 单，仅生成导出文件 ${exportSummary.dispatchSummary.assignedOnlyCount} 单。`}
                </p>
              )}
              {exportSummary.persistenceSummary && (
                <p className="mt-1 text-muted-foreground">
                  {isPreviewMode
                    ? '当前结果仅生成预览内容，不写导出记录，也不会落盘 ZIP 或明细文件。'
                    : exportSummary.persistenceMode === 'none'
                      ? '本次只执行派发，不写导出记录；若后续需要留痕或落盘文件，可重新执行导出并派发。'
                    : `本次已${exportSummary.persistenceSummary.exportRecordCreated ? '' : '未'}写入导出记录，整批 ZIP ${exportSummary.persistenceSummary.zipArtifactPersisted ? '已落盘' : '未落盘'}，明细文件已落盘 ${exportSummary.persistenceSummary.detailArtifactPersistedCount} 份。`}
                </p>
              )}
            </div>
          )}
          
          <div className="space-y-4">
            {exportResults.map((result, index) => (
              <div 
                key={index}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">{result.supplierName}</p>
                    <p className="text-sm text-muted-foreground">
                      共 {result.orderCount} 个订单
                    </p>
                    {result.templateName && (
                      <p className="text-xs text-muted-foreground">
                        {result.templateName} · {templateSourceLabel(result.templateSource)}
                      </p>
                    )}
                    {result.artifact?.provider && (
                      <p className="text-xs text-muted-foreground">
                        {getStorageProviderLabel(result.artifact.provider)} · {getDownloadStrategy(
                          result.artifact.provider,
                          isPersistedArtifact(result.artifact)
                        )}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {isPreviewMode
                        ? '预览模式下仅查看内容，确认导出后才会生成可持久化文件。'
                        : exportSummary?.persistenceMode === 'none'
                          ? '当前仅完成派发，未生成持久化文件；可下载内存中的整批 ZIP。'
                        : getDownloadHint(result.artifact?.provider, isPersistedArtifact(result.artifact), '当前会优先回退到整批ZIP')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Badge variant="outline" className="max-w-full truncate">{result.fileName}</Badge>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    {!isPreviewMode && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void downloadDetailFile(result)}
                        disabled={isDownloadingDetail(result)}
                      >
                        {isDownloadingDetail(result) ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <FileDown className="h-4 w-4 mr-1" />
                        )}
                        {getDownloadActionLabel(result.artifact?.provider, isPersistedArtifact(result.artifact))}明细
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={downloadZipFile} disabled={downloadingZip}>
                      {downloadingZip ? (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-1" />
                      )}
                      {getDownloadActionLabel(exportSummary?.artifact?.provider, isPersistedArtifact(exportSummary?.artifact))}ZIP
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button variant="outline" onClick={() => setShowExportDialog(false)} className="w-full sm:w-auto">
              关闭
            </Button>
            {isPreviewMode ? (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (exportSummary?.supplierIds?.length) {
                      void handleExport(
                        exportSummary.supplierIds,
                        'dispatch',
                        exportSummary.templateId ?? null,
                        'none'
                      );
                    }
                  }}
                  disabled={exporting || !exportSummary?.supplierIds?.length}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Package className="h-4 w-4 mr-2" />
                  )}
                  确认仅派发
                </Button>
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => {
                    if (exportSummary?.supplierIds?.length) {
                      void handleExport(
                        exportSummary.supplierIds,
                        'dispatch',
                        exportSummary.templateId ?? null,
                        'full'
                      );
                    }
                  }}
                  disabled={exporting || !exportSummary?.supplierIds?.length}
                >
                  {exporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  确认导出并派发
                </Button>
              </>
            ) : (
              <>
                {exportSummary?.recordId && exportSummary.persistenceMode === 'full' && (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      router.push(`/export-records?recordId=${exportSummary.recordId}`);
                    }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    查看导出记录
                  </Button>
                )}
                <Button onClick={downloadZipFile} disabled={downloadingZip} className="w-full sm:w-auto">
                  {downloadingZip ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  {getDownloadActionLabel(exportSummary?.artifact?.provider, isPersistedArtifact(exportSummary?.artifact))}全部 (ZIP)
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
