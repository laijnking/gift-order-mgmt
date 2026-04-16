'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Progress } from '@/components/ui/progress';
import {
  FileSpreadsheet, Upload, Search, Loader2, CheckCircle2, 
  XCircle, AlertTriangle, FileText, RefreshCw, Package, Link2
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ReceiptRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  fileName: string;
  totalCount: number;
  matchedCount: number;
  unmatchedCount: number;
  importedAt: string;
  importedBy: string;
}

interface Receipt {
  id: string;
  supplierId?: string;
  supplierName?: string;
  customerOrderNo: string;
  expressCompany: string;
  trackingNo: string;
  shipDate: string | null;
  matchStatus: 'pending' | 'auto_matched' | 'manual_matched';
  orderId: string | null;
  orderNo: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNo: string;
  customerOrderNo: string;
  status: string;
  supplierName: string;
}

export default function ReturnReceiptPage() {

  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [records, setRecords] = useState<ReceiptRecord[]>([]);
  const [currentRecord, setCurrentRecord] = useState<ReceiptRecord | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([]);
  const [showMatchDialog, setShowMatchDialog] = useState(false);
  const [matching, setMatching] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<Receipt | null>(null);
  const [unmatchedOrders, setUnmatchedOrders] = useState<Order[]>([]);

  // 加载供应商列表
  useEffect(() => {
    loadSuppliers();
    loadRecords();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?status=active');
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  const loadRecords = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/return-receipts/history');
      const data = await response.json();
      if (data.success) {
        setRecords(data.data || []);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 文件上传处理
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!selectedSupplier) {
      toast.error('请先选择供应商');
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    try {
      // 解析Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // 验证数据格式
      if (jsonData.length === 0) {
        throw new Error('Excel文件为空');
      }

      // 提取回单数据 - 增强支持更多字段
      const receipts = jsonData.map((row: any) => ({
        customerOrderNo: row['客户订单号'] || row['订单号'] || row.customerOrderNo || row.orderNo || row['单据编号'] || '',
        supplierOrderNo: row['供应商单据号'] || row.supplierOrderNo || '',
        expressCompany: row['快递公司'] || row.expressCompany || '',
        trackingNo: row['快递单号'] || row.trackingNo || row['物流单号'] || '',
        shipDate: row['发货日期'] || row.shipDate || row['日期'] || null,
        quantity: row['数量'] || row.quantity || 1,
        price: row['价格'] || row.price || row['单价'] || null,
        warehouse: row['仓库'] || row.warehouse || '',
        remark: row['备注'] || row.remark || '',
      })).filter(r => r.customerOrderNo || r.trackingNo || r.supplierOrderNo);

      if (receipts.length === 0) {
        throw new Error('未找到有效的回单数据，请检查Excel格式');
      }

      // 提交到服务器
      const supplier = suppliers.find(s => s.id === selectedSupplier);
      const response = await fetch('/api/return-receipts/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplier,
          supplierName: supplier?.name || '',
          receipts,
          fileName: file.name,
          importedBy: 'current_user', // TODO: 获取当前用户
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`成功导入 ${receipts.length} 条回单记录`);
        
        // 刷新记录列表
        loadRecords();
        
        // 询问是否自动匹配
        if (result.data.recordId) {
          setCurrentRecord({ ...result.data, id: result.data.recordId, supplierId: selectedSupplier, supplierName: supplier?.name || '', fileName: file.name, importedAt: new Date().toISOString(), importedBy: 'current_user' } as any);
          setShowMatchDialog(true);
        }
      } else {
      throw new Error(result.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
  }, [selectedSupplier, suppliers, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
  });

  // 自动匹配回单
  const handleAutoMatch = async () => {
    if (!currentRecord) return;

    try {
      setMatching(true);
      
      // 获取未匹配的 回单
      const response = await fetch(`/api/return-receipts/history?recordId=${currentRecord.id}`);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptIds: pendingReceipts.map((r: Receipt) => r.id),
        }),
      });

      const matchResult = await matchResponse.json();
      
      if (matchResult.success) {
        toast.success('匹配完成');
        
        // 刷新记录详情
        await loadRecordDetail(currentRecord.id);
        
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiptIds: selectedReceipts,
          importedBy: 'current_user',
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
      const response = await fetch(`/api/return-receipts/history?recordId=${recordId}`);
      const data = await response.json();
      
      if (data.success) {
        setCurrentRecord(data.data);
        setReceipts(data.data.receipts || []);
      }
    } catch (error) {
      console.error('加载记录详情失败:', error);
    }
  };

  // 打开手动匹配对话框
  const handleManualMatch = async (receipt: Receipt) => {
    setCurrentReceipt(receipt);
    
    try {
      // 加载待匹配订单列表
      const response = await fetch(`/api/orders?status=assigned&supplierId=${receipt.supplierId || ''}`);
      const data = await response.json();
      
      if (data.success) {
        setUnmatchedOrders(data.data.filter((o: Order) => 
          o.status === 'assigned' && !receipts.some(r => r.orderId === o.id)
        ));
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
      const response = await fetch(`/api/return-receipts/${currentReceipt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: currentReceipt.orderId,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(`已将回单与订单 ${data.data.orderNo} 关联`);
        
        // 刷新记录详情
        await loadRecordDetail(currentRecord.id);
        setShowOrderPicker(false);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '未知错误');
    }
  };

  // 过滤记录
  const filteredRecords = records.filter(r => {
    if (selectedSupplier && r.supplierId !== selectedSupplier) return false;
    if (searchTerm && !r.fileName.includes(searchTerm)) return false;
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Package className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">回单导入</h1>
            <p className="text-sm text-muted-foreground">导入供应商回传快递单号，自动匹配订单</p>
          </div>
        </div>
        <Button variant="outline" onClick={loadRecords} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Input
              placeholder="搜索文件名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <div className="text-sm text-muted-foreground">
              共 {filteredRecords.length} 条记录
            </div>
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
              {/* 供应商选择 - 必须先选择 */}
              <div className="mb-4">
                <label className="text-sm font-medium mb-2 block">选择供应商</label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md bg-background text-sm"
                >
                  <option value="">请先选择供应商</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              
              {/* 拖放上传区域 */}
              <div
                {...getRootProps()}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors
                  ${!selectedSupplier ? 'opacity-50 cursor-not-allowed' : ''}
                  ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}
                `}
              >
                {/* 隐藏的input元素需要正确定位 */}
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
                {!selectedSupplier && (
                  <p className="text-xs text-orange-500 mt-2">请先选择供应商</p>
                )}
              </div>

              {/* Excel格式说明 */}
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium mb-2">Excel应包含以下列：</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>客户订单号 / 订单号</li>
                  <li>快递公司</li>
                  <li>快递单号</li>
                  <li>发货日期（可选）</li>
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
                        setShowDetailDialog(true);
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">回单明细</CardTitle>
                  {currentRecord && (
                    <CardDescription>
                      {currentRecord.fileName} - 共 {receipts.length} 条
                    </CardDescription>
                  )}
                </div>
                {selectedReceipts.length > 0 && (
                  <Button onClick={handleBatchConfirm} disabled={confirming}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    批量确认 ({selectedReceipts.length})
                  </Button>
                )}
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
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{receipts.length}</div>
                      <div className="text-sm text-muted-foreground">总数量</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {receipts.filter(r => r.matchStatus !== 'pending').length}
                      </div>
                      <div className="text-sm text-green-600">已匹配</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">
                        {receipts.filter(r => r.matchStatus === 'pending').length}
                      </div>
                      <div className="text-sm text-yellow-600">待匹配</div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          {receipts.some(r => r.matchStatus === 'pending') && (
                            <input
                              type="checkbox"
                              checked={selectedReceipts.length === receipts.filter(r => r.matchStatus !== 'pending').length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReceipts(receipts.filter(r => r.matchStatus !== 'pending').map(r => r.id));
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
                        <TableHead>发货日期</TableHead>
                        <TableHead>匹配状态</TableHead>
                        <TableHead>关联订单</TableHead>
                        <TableHead className="text-center">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipts.map((receipt) => (
                        <TableRow key={receipt.id}>
                          <TableCell>
                            {receipt.matchStatus !== 'pending' && (
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
                          <TableCell>{receipt.expressCompany}</TableCell>
                          <TableCell className="font-mono">{receipt.trackingNo}</TableCell>
                          <TableCell>{receipt.shipDate || '-'}</TableCell>
                          <TableCell>
                            {receipt.matchStatus === 'pending' ? (
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-200">
                                待匹配
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
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              {receipt.matchStatus === 'pending' ? '手动匹配' : '重匹配'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 自动匹配对话框 */}
      <Dialog open={showMatchDialog} onOpenChange={setShowMatchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>自动匹配</DialogTitle>
            <DialogDescription>
              系统将根据客户订单号自动匹配回单与订单
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">即将进行自动匹配</p>
                <p className="text-xs text-muted-foreground">
                  匹配规则：客户订单号精确匹配 &gt; 系统订单号模糊匹配
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMatchDialog(false)}>
              稍后处理
            </Button>
            <Button onClick={handleAutoMatch} disabled={matching}>
              {matching && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              开始匹配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动匹配订单选择对话框 */}
      <Dialog open={showOrderPicker} onOpenChange={setShowOrderPicker}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>选择关联订单</DialogTitle>
            <DialogDescription>
              为回单 "{currentReceipt?.customerOrderNo}" 选择关联的订单
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 回单信息 */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">快递公司：</span>
                  <span className="font-medium">{currentReceipt?.expressCompany}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">快递单号：</span>
                  <span className="font-medium font-mono">{currentReceipt?.trackingNo}</span>
                </div>
              </div>
            </div>

            {/* 订单列表 */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>订单号</TableHead>
                    <TableHead>客户订单号</TableHead>
                    <TableHead>供应商</TableHead>
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

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderPicker(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirmManualMatch}
              disabled={!currentReceipt?.orderId}
            >
              确认匹配
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
