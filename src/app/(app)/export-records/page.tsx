'use client';

import { useState, useEffect } from 'react';
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
  metadata: any;
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
}

export default function ExportRecordsPage() {
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

  // 加载导出记录
  useEffect(() => {
    loadRecords();
  }, [page, exportType]);

  const loadRecords = async () => {
    try {
      setLoading(true);
      let url = `/api/export-records?page=${page}&pageSize=${pageSize}`;
      if (exportType !== 'all') {
        url += `&exportType=${exportType}`;
      }
      
      const response = await fetch(url);
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
  const handleDownloadDetail = async (detail: ExportDetail) => {
    try {
      // 如果有直接的下载URL，使用它
      if (detail.fileUrl && detail.fileUrl.startsWith('/')) {
        window.open(detail.fileUrl, '_blank');
        return;
      }
      
      // 否则尝试从API获取文件
      toast.error('下载功能暂不可用，请重新导出发货通知单');
    } catch (error) {
      toast.error('下载失败');
    }
  };

  // 查看导出详情
  const handleViewDetail = async (record: ExportRecord) => {
    setSelectedRecord(record);
    setLoadingDetails(true);
    setShowDetailDialog(true);

    try {
      const response = await fetch(`/api/export-records/${record.id}`);
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
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileDown className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">导出记录</h1>
            <p className="text-sm text-muted-foreground">查看历史导出记录及详情</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadRecords} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="导出类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="shipping_notice">发货通知单</SelectItem>
                <SelectItem value="customer_feedback">客户反馈</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索文件名..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-muted-foreground">
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
                  return (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge className={typeInfo.color}>
                          <TypeIcon className="h-3 w-3 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{record.file_name}</TableCell>
                      <TableCell>{record.template_name || '-'}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">{record.total_count}</span>
                        <span className="text-muted-foreground"> 单</span>
                      </TableCell>
                      <TableCell>{record.exported_by || '系统'}</TableCell>
                      <TableCell>
                        {new Date(record.created_at).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetail(record)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 分页 */}
      {total > pageSize && (
        <div className="flex items-center justify-center gap-2">
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
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-auto">
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
              {/* 汇总信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold">{selectedRecord?.total_count || 0}</div>
                  <div className="text-sm text-muted-foreground">导出订单数</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {details.reduce((sum, d) => sum + (d.orderCount || 0), 0)}
                  </div>
                  <div className="text-sm text-blue-600">涉及供应商/客户</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {details.reduce((sum, d) => sum + (d.shippedOrderCount || 0), 0)}
                  </div>
                  <div className="text-sm text-green-600">已发货订单</div>
                </div>
              </div>

              {/* 明细列表 */}
              <div className="border rounded-lg">
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownloadDetail(detail)}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              下载
                            </Button>
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
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>导出人: {selectedRecord.exported_by || '系统'}</div>
                    <div>导出时间: {new Date(selectedRecord.created_at).toLocaleString('zh-CN')}</div>
                    {selectedRecord.metadata.batch_id && (
                      <div>批次ID: {selectedRecord.metadata.batch_id}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
            </Button>
            {selectedRecord && (
              <Button>
                <Download className="h-4 w-4 mr-2" />
                下载全部 (ZIP)
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
