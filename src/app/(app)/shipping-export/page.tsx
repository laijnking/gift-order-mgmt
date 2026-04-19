'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
}

interface TemplateOption {
  id: string;
  name: string;
  isDefault?: boolean;
}

export default function ShippingExportPage() {
  const router = useRouter();

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

  // 加载供应商待发货统计
  useEffect(() => {
    loadSuppliers();
    loadTemplates();
  }, []);

  const loadSuppliers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/shipping-exports/pending');
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
        fetch('/api/templates?type=shipping'),
        fetch('/api/templates/default/shipping'),
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
  const handleExport = async () => {
    if (selectedSuppliers.length === 0) {
      toast.error('至少选择一个供应商进行导出');
      return;
    }

    try {
      setExporting(true);
      const response = await fetch('/api/shipping-exports/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierIds: selectedSuppliers,
          templateId: templateId || null,
          exportedBy: 'current_user', // TODO: 获取当前用户
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // 自动触发ZIP文件下载
        if (data.data.zipBase64) {
          const linkSource = `data:application/zip;base64,${data.data.zipBase64}`;
          const downloadLink = document.createElement('a');
          downloadLink.href = linkSource;
          downloadLink.download = data.data.zipFileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        
        setExportResults(data.data.details || []);
        setShowExportDialog(true);
        
        toast.success(`成功导出 ${data.data.totalSupplierCount} 个供应商，共 ${data.data.totalOrderCount} 个订单`);
        
        // 刷新数据
        loadSuppliers();
        setSelectedSuppliers([]);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setExporting(false);
    }
  };

  // 重新导出
  const handleReExport = async (batchId: string) => {
    try {
      const response = await fetch(`/api/shipping-exports/batch/${batchId}`, {
        method: 'POST',
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('文件已重新生成');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">发货通知单导出</h1>
            <p className="text-sm text-muted-foreground">批量导出供应商待发货订单</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadSuppliers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button 
            onClick={handleExport} 
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
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索供应商名称或编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={templateId || 'none'} onValueChange={(value) => setTemplateId(value === 'none' ? '' : value)}>
              <SelectTrigger className="w-[220px]">
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
            <div className="flex items-center gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                全部
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
                className={statusFilter === 'pending' ? 'bg-orange-500 hover:bg-orange-600' : ''}
              >
                待发货+未导出
              </Button>
              <Button
                variant={statusFilter === 'exported' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('exported')}
              >
                已导出
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
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
                          setSelectedSuppliers([supplier.id]);
                          handleExport();
                        }}
                      >
                        <FileDown className="h-4 w-4 mr-1" />
                        导出
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 导出结果对话框 */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>导出结果</DialogTitle>
            <DialogDescription>
              以下文件已成功生成，点击下载
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {exportResults.map((result, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-4 border rounded-lg"
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
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{result.fileName}</Badge>
                  <Button variant="outline" size="sm">
                    <FileDown className="h-4 w-4 mr-1" />
                    下载
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExportDialog(false)}>
              关闭
            </Button>
            <Button>
              <FileDown className="h-4 w-4 mr-2" />
              下载全部 (ZIP)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
