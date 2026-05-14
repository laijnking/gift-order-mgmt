'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
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
import { Loader2, Plus, Sparkles, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import type { Order } from '../hooks/use-orders-session';
import type { Supplier } from '../hooks/use-orders-session';
import type { SupplierMatchResult } from '../hooks/use-orders-dispatch';

interface OrderAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assigningOrderId: string | null;
  orders: Order[];
  suppliers: Supplier[];
  selectedOrderIds: string[];
  matchResults: Record<string, SupplierMatchResult>;
  setMatchResults: React.Dispatch<React.SetStateAction<Record<string, SupplierMatchResult>>>;
  selectedSupplierId: string;
  setSelectedSupplierId: (id: string) => void;
  selectedSuppliers: Record<string, string>;
  setSelectedSuppliers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  isMatching: boolean;
  onSmartMatch: () => void;
  onSingleAssign: () => void;
  onBatchAssign: () => void;
}

export function OrderAssignDialog({
  open,
  onOpenChange,
  assigningOrderId,
  orders,
  suppliers,
  selectedOrderIds,
  matchResults,
  setMatchResults,
  selectedSupplierId,
  setSelectedSupplierId,
  selectedSuppliers,
  setSelectedSuppliers,
  isMatching,
  onSmartMatch,
  onSingleAssign,
  onBatchAssign,
}: OrderAssignDialogProps) {
  const [manualSelectOpen, setManualSelectOpen] = useState(false);
  const [manualSelectOrderId, setManualSelectOrderId] = useState<string | null>(null);
  const [manualSelectSupplierId, setManualSelectSupplierId] = useState('');
  const [manualSelectSupplierName, setManualSelectSupplierName] = useState('');

  // 批量派发模式打开对话框时自动触发智能匹配
  useEffect(() => {
    if (open && !assigningOrderId && Object.keys(matchResults).length === 0) {
      onSmartMatch();
    }
  }, [open, assigningOrderId, matchResults, onSmartMatch]);

  const openManualSelect = (orderId: string) => {
    setManualSelectOrderId(orderId);
    setManualSelectSupplierId(selectedSuppliers[orderId] || '');
    setManualSelectSupplierName('');
    setManualSelectOpen(true);
  };

  const confirmManualSelect = () => {
    if (manualSelectOrderId && (manualSelectSupplierId || manualSelectSupplierName)) {
      let supplierId = manualSelectSupplierId;
      if (manualSelectSupplierId && !manualSelectSupplierName) {
        const supplier = suppliers.find(s => s.id === manualSelectSupplierId);
        setSelectedSuppliers(prev => ({ ...prev, [manualSelectOrderId]: supplierId }));
        toast.success(`已选择发货方：${supplier?.name || manualSelectSupplierId}`);
      } else if (manualSelectSupplierName && !manualSelectSupplierId) {
        const supplier = suppliers.find(s => s.name === manualSelectSupplierName);
        supplierId = supplier?.id || 'manual_' + Date.now();
        setSelectedSuppliers(prev => ({ ...prev, [manualSelectOrderId]: supplierId }));
        toast.success(`已选择发货方：${manualSelectSupplierName}`);
      }
      setManualSelectOpen(false);
      setManualSelectOrderId(null);
      setManualSelectSupplierId('');
      setManualSelectSupplierName('');
    } else {
      toast.error('请选择或输入发货方');
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          onOpenChange(o);
          if (!o) setMatchResults({});
        }}
      >
        <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[95vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {assigningOrderId ? '派发订单' : '批量派发订单'}
            </DialogTitle>
            <DialogDescription>
              {assigningOrderId
                ? '选择有库存的发货方，显示商品、库存和历史成本'
                : `将 ${selectedOrderIds.length} 条订单派发给发货方`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden flex flex-col gap-4 py-4">
            {/* Smart match button */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onSmartMatch}
                disabled={isMatching}
                className="flex-1"
              >
                {isMatching ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />匹配中...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" />智能匹配发货方</>
                )}
              </Button>
            </div>

            {/* Match results */}
            {Object.keys(matchResults).length > 0 && (
              <div className="flex-1 overflow-auto space-y-4">
                {Object.entries(matchResults).map(([orderId, result]) => {
                  const order = orders.find(o => o.id === orderId);
                  return (
                    <div key={orderId} className="border rounded-lg overflow-hidden">
                      {/* Header */}
                      <div className="bg-muted/50 px-4 py-3 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{order?.customerName || order?.sysOrderNo || order?.orderNo || '未知订单'}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            {result.receiverProvince && <span>收货省份：{result.receiverProvince}</span>}
                            {result.productName && <span>商品：{result.productName}</span>}
                            {result.quantity && <span>数量：{result.quantity}</span>}
                          </div>
                        </div>
                        {result.warning && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {result.warning}
                          </Badge>
                        )}
                      </div>

                      {/* Supplier table */}
                      {result.availableSuppliers && result.availableSuppliers.length > 0 ? (
                        <div className="overflow-x-auto">
                          {(result.newProductHint || result.availableSuppliers.length === 0) && (
                            <div className="p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="font-medium">无库存或新商品：</span>
                                  <span>{result.newProductHint || '当前商品在所有发货方均无库存'}</span>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-yellow-400 text-yellow-700 hover:bg-yellow-100 bg-white"
                                  onClick={() => openManualSelect(orderId)}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  手动选择发货方
                                </Button>
                              </div>
                            </div>
                          )}
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="w-12">选择</TableHead>
                                <TableHead>发货方</TableHead>
                                <TableHead>省份匹配</TableHead>
                                <TableHead>商品编码</TableHead>
                                <TableHead>商品名称</TableHead>
                                <TableHead className="text-right">库存</TableHead>
                                <TableHead className="text-right">当前单价</TableHead>
                                <TableHead className="text-right">历史成本</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {result.availableSuppliers.map((supplier, idx) => (
                                <TableRow
                                  key={`${supplier.supplierId}-${supplier.productCode}`}
                                  className={`cursor-pointer hover:bg-muted/50 ${selectedSuppliers[orderId] === supplier.supplierId ? 'bg-primary/5' : ''} ${supplier.hasStock === false ? 'opacity-60' : ''}`}
                                  onClick={() => setSelectedSuppliers(prev => ({ ...prev, [orderId]: supplier.supplierId }))}
                                >
                                  <TableCell>
                                    <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all ${
                                      selectedSuppliers[orderId] === supplier.supplierId ? 'border-primary bg-primary shadow-md' : 'border-muted-foreground hover:border-primary/50'
                                    }`}>
                                      {selectedSuppliers[orderId] === supplier.supplierId && (
                                        <div className="h-3 w-3 rounded-full bg-white" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {supplier.hasStock === false && (
                                        <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-xs">无库存</Badge>
                                      )}
                                      {idx === 0 && supplier.hasStock !== false && (
                                        <Badge variant="default" className="bg-emerald-500 text-xs">推荐</Badge>
                                      )}
                                      <span className="font-medium">{supplier.supplierName}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={
                                        supplier.provinceMatch === '同省' ? 'border-green-500 text-green-600 bg-green-50' :
                                        supplier.provinceMatch === '邻近' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                        supplier.provinceMatch === '较远' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                                        'border-gray-300'
                                      }
                                    >
                                      {supplier.provinceMatch || '未知'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">{supplier.productCode || '-'}</TableCell>
                                  <TableCell className="max-w-[200px] truncate" title={supplier.productName}>
                                    {supplier.productName || '-'}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${supplier.quantity <= 2 ? 'text-orange-600' : ''} ${supplier.quantity === 0 ? 'text-gray-400' : ''}`}>
                                    {supplier.quantity === 0 ? '-' : supplier.quantity}
                                    {supplier.quantity > 0 && supplier.quantity <= 2 && <AlertTriangle className="inline w-3 h-3 ml-1 text-orange-500" />}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {supplier.quantity > 0 && typeof supplier.price === 'number' && supplier.price > 0 ? `¥${supplier.price.toFixed(2)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground">
                                    {supplier.historyCost ? (
                                      <span>¥{typeof supplier.historyCost === 'number' ? supplier.historyCost.toFixed(2) : supplier.historyCost}</span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">无记录</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-muted-foreground mb-4">加载发货方列表失败或无可用发货方</p>
                          <Button variant="outline" onClick={() => openManualSelect(orderId)}>
                            <Plus className="w-4 h-4 mr-2" />
                            手动选择发货方
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Confirm button */}
            {Object.keys(matchResults).length > 0 && (
              <div className="flex gap-2 pt-2 border-t">
                <div className="flex-1 text-sm text-muted-foreground">
                  {assigningOrderId ? (
                    <>已选择发货方：{suppliers.find(s => s.id === selectedSupplierId)?.name || '未选择'}</>
                  ) : (
                    <>已为 {Object.keys(selectedSuppliers).length} 条订单选择发货方</>
                  )}
                </div>
                <Button
                  onClick={assigningOrderId ? onSingleAssign : onBatchAssign}
                  disabled={assigningOrderId ? !selectedSupplierId : Object.keys(selectedSuppliers).length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  确认派发
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Manual select dialog */}
      <Dialog open={manualSelectOpen} onOpenChange={setManualSelectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>手动选择发货方</DialogTitle>
            <DialogDescription>从所有发货方中选择，或直接输入发货方名称</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="supplier-select">选择发货方</Label>
              <select
                id="supplier-select"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                value={manualSelectSupplierId}
                onChange={(e) => {
                  setManualSelectSupplierId(e.target.value);
                  const supplier = suppliers.find(s => s.id === e.target.value);
                  setManualSelectSupplierName(supplier?.name || '');
                }}
              >
                <option value="">请选择发货方</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">或</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-name">输入发货方名称</Label>
              <Input
                id="supplier-name"
                placeholder="输入发货方名称"
                value={manualSelectSupplierName}
                onChange={(e) => setManualSelectSupplierName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">直接输入发货方名称（如果发货方不在下拉列表中）</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualSelectOpen(false)}>取消</Button>
            <Button onClick={confirmManualSelect} disabled={!manualSelectSupplierId && !manualSelectSupplierName}>
              确认选择
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
