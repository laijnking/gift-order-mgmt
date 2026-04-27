'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  User,
  Phone,
  MapPin,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Star,
  AlertTriangle,
  Check,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { ProductPickerDialog } from '@/components/product/product-picker-dialog';
import type { ProductPickerItem } from '@/components/product/product-picker-dialog';
import type { ParsedOrder } from '../hooks/use-order-parse-session';
import type { SupplierMatchResult } from '../hooks/use-order-parse-session';

interface SupplierInfo {
  id: string;
  name: string;
  type?: string;
  province?: string;
}

interface OrderCardProps {
  order: ParsedOrder;
  index: number;
  selectedCustomerName?: string;
  salespersonName: string;
  operatorName: string;
  supplierMatchResults: SupplierMatchResult;
  suppliers: SupplierInfo[];
  isMatchingSupplier: boolean;
  matchingSupplierOrderId: string | null;
  onToggle: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onMatchSupplier: (id: string) => void;
  onSupplierChange: (orderId: string, supplierId: string) => void;
  onProductSelect: (orderId: string, product: ProductPickerItem | null) => void;
}

export function OrderCard({
  order,
  index,
  selectedCustomerName,
  salespersonName,
  operatorName,
  supplierMatchResults,
  suppliers,
  isMatchingSupplier,
  matchingSupplierOrderId,
  onToggle,
  onToggleExpand,
  onDuplicate,
  onRemove,
  onUpdate,
  onMatchSupplier,
  onSupplierChange,
  onProductSelect,
}: OrderCardProps) {
  const [productPickerOpen, setProductPickerOpen] = useState(false);

  const availableSuppliers = supplierMatchResults.availableSuppliers || [];

  return (
    <>
      <Card className={order.selected ? '' : 'opacity-60'}>
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            {/* Checkbox */}
            <div className="pt-1">
              <Switch
                checked={order.selected}
                onCheckedChange={() => onToggle(order.id)}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">#{index + 1}</span>
                  {order.orderNo && (
                    <Badge variant="outline" className="text-xs">
                      {order.orderNo}
                    </Badge>
                  )}
                  {selectedCustomerName && (
                    <Badge variant="secondary" className="text-xs">
                      {selectedCustomerName}
                    </Badge>
                  )}
                  {order.mappedProductName && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-0.5" />
                      已匹配
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onToggleExpand(order.id)}
                  >
                    {order.expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => onDuplicate(order.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    onClick={() => onRemove(order.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Main info */}
              <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate font-medium">{order.product_name}</span>
                  <span className="text-muted-foreground shrink-0">&times;{order.quantity}</span>
                </div>
                {order.receiver_name && (
                  <div className="flex items-center gap-1 min-w-0">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{order.receiver_name}</span>
                  </div>
                )}
                {order.receiver_phone && (
                  <div className="flex items-center gap-1 min-w-0">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{order.receiver_phone}</span>
                  </div>
                )}
                {order.receiver_address && (
                  <div className="flex items-center gap-1 min-w-0 col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate text-xs">{order.receiver_address}</span>
                  </div>
                )}

                {/* System product matched */}
                {order.mappedProductName && (
                  <div className="col-span-2 mt-1 p-2 bg-green-50 rounded border border-green-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-medium text-green-700">已匹配系统商品</span>
                      {order.matchHint && (
                        <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-600">
                          {order.matchHint as string}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
                      <div>
                        <span className="text-muted-foreground">系统商品:</span>
                        <span className="ml-1 font-medium text-green-700">
                          {order.mappedProductName as string}
                        </span>
                      </div>
                      {order.mappedProductCode && (
                        <div>
                          <span className="text-muted-foreground">编码:</span>
                          <code className="ml-1 text-green-600">
                            {order.mappedProductCode as string}
                          </code>
                        </div>
                      )}
                      {order.mappedProductBrand && (
                        <div>
                          <span className="text-muted-foreground">品牌:</span>
                          <span className="ml-1">
                            {order.mappedProductBrand as string}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Supplier match suggestions */}
                {availableSuppliers.length > 0 && (
                  <div className="col-span-2 mt-1 p-2 bg-blue-50 rounded border border-blue-100">
                    <div className="flex items-center gap-1 mb-1">
                      <Star className="h-3 w-3 text-blue-500" />
                      <span className="text-xs font-medium text-blue-700">推荐供应商</span>
                      <Badge variant="outline" className="text-[10px] py-0 bg-blue-50">
                        {availableSuppliers.length} 个供应商有货
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {availableSuppliers.slice(0, 3).map((supplier) => {
                        const isSelected = order.supplierId === supplier.supplierId;
                        return (
                          <div
                            key={supplier.supplierId}
                            className={`flex items-center justify-between text-xs p-1 rounded ${
                              isSelected ? 'bg-blue-100' : 'bg-white/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-[10px] py-0 ${
                                  !isSelected ? 'opacity-0' : ''
                                }`}
                              >
                                {isSelected ? '选中' : ''}
                              </Badge>
                              <span className="font-medium">{supplier.supplierName}</span>
                              {supplier.warehouseName && (
                                <span className="text-muted-foreground">({supplier.warehouseName})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              <span
                                className={
                                  supplier.quantity <= 2
                                    ? 'text-orange-600 font-medium'
                                    : 'text-green-600'
                                }
                              >
                                {supplier.quantity}台
                                {supplier.quantity <= 2 && (
                                  <AlertTriangle className="h-3 w-3 inline ml-1" />
                                )}
                              </span>
                              {supplier.price > 0 && (
                                <span className="text-muted-foreground">
                                  &yen;{supplier.price.toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Unmatched hint */}
                {!order.mappedProductName && (
                  <div className="col-span-2 mt-1 p-2 bg-yellow-50 rounded border border-yellow-100">
                    <div className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs text-yellow-700">
                        未匹配到系统商品，请检查SKU映射配置或手动选择商品
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded details */}
              {order.expanded && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  {/* Order info */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">单据编号</Label>
                      <Input
                        value={(order as unknown as Record<string, unknown>).billNo as string || ''}
                        onChange={(e) => onUpdate(order.id, 'billNo', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="单据编号"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">客户订单号</Label>
                      <Input
                        value={order.orderNo || ''}
                        onChange={(e) => onUpdate(order.id, 'orderNo', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="订单号"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">客户单据编号</Label>
                      <Input
                        value={order.customerOrderNo || ''}
                        onChange={(e) => onUpdate(order.id, 'customerOrderNo', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="客户单据编号"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">发货供应商</Label>
                      <Input
                        value={order.supplierName as string || ''}
                        onChange={(e) => onUpdate(order.id, 'supplierName', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="发货供应商"
                      />
                    </div>
                  </div>

                  {/* Customer product info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-orange-600">
                      <Package className="h-3.5 w-3.5" />
                      客户商品信息
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">客户商品名称</Label>
                        <Input
                          value={order.product_name || ''}
                          onChange={(e) => onUpdate(order.id, 'product_name', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="客户订单中的商品名称"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">客户规格型号</Label>
                        <Input
                          value={order.product_spec || ''}
                          onChange={(e) => onUpdate(order.id, 'product_spec', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="客户商品规格型号"
                        />
                      </div>
                    </div>
                  </div>

                  {/* System product info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                      <Check className="h-3.5 w-3.5" />
                      系统商品信息
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">系统商品编码</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 px-1 text-[10px] text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => setProductPickerOpen(true)}
                          >
                            <Package className="h-3 w-3 mr-0.5" />
                            选择商品
                          </Button>
                        </div>
                        <Input
                          value={
                            (order.mappedProductCode as string) ||
                            order.product_code ||
                            ''
                          }
                          onChange={(e) => onUpdate(order.id, 'product_code', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="系统商品编码"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">系统规格型号</Label>
                        <Input
                          value={
                            (order.mappedProductSpec as string) ||
                            order.product_spec ||
                            ''
                          }
                          onChange={(e) => onUpdate(order.id, 'product_spec', e.target.value)}
                          className="h-7 text-xs"
                          placeholder="系统规格型号"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">数量</Label>
                        <Input
                          type="number"
                          value={order.quantity}
                          onChange={(e) =>
                            onUpdate(order.id, 'quantity', parseInt(e.target.value) || 1)
                          }
                          className="h-7 text-xs"
                        />
                      </div>
                    </div>
                    {order.mappedProductName && (
                      <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                        <span className="text-muted-foreground">已匹配：</span>
                        <span className="font-medium">
                          {order.mappedProductName as string}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price info */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">单价</Label>
                      <Input
                        type="number"
                        value={order.price || ''}
                        onChange={(e) =>
                          onUpdate(order.id, 'price', parseFloat(e.target.value) || undefined)
                        }
                        className="h-7 text-xs"
                        placeholder="单价"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">价税合计</Label>
                      <Input
                        type="number"
                        value={order.amount || ''}
                        onChange={(e) =>
                          onUpdate(order.id, 'amount', parseFloat(e.target.value) || undefined)
                        }
                        className="h-7 text-xs"
                        placeholder="价税合计"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">单台折让</Label>
                      <Input
                        type="number"
                        value={order.discount as number || ''}
                        onChange={(e) =>
                          onUpdate(
                            order.id,
                            'discount',
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        className="h-7 text-xs"
                        placeholder="折让"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">税率(%)</Label>
                      <Input
                        type="number"
                        value={order.taxRate as number || ''}
                        onChange={(e) =>
                          onUpdate(
                            order.id,
                            'taxRate',
                            parseFloat(e.target.value) || undefined
                          )
                        }
                        className="h-7 text-xs"
                        placeholder="税率"
                      />
                    </div>
                  </div>

                  {/* Receiver info */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">收货人</Label>
                      <Input
                        value={order.receiver_name || ''}
                        onChange={(e) => onUpdate(order.id, 'receiver_name', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="收货人"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">收货电话</Label>
                      <Input
                        value={order.receiver_phone || ''}
                        onChange={(e) => onUpdate(order.id, 'receiver_phone', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="电话"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">收货地址</Label>
                    <Input
                      value={order.receiver_address || ''}
                      onChange={(e) => onUpdate(order.id, 'receiver_address', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="详细地址"
                    />
                  </div>

                  {/* Express info */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">快递公司</Label>
                      <Input
                        value={order.express_company || ''}
                        onChange={(e) => onUpdate(order.id, 'express_company', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="快递公司"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">物流单号</Label>
                      <Input
                        value={order.tracking_no || ''}
                        onChange={(e) => onUpdate(order.id, 'tracking_no', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="物流单号"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">仓库</Label>
                      <Input
                        value={order.warehouse as string || ''}
                        onChange={(e) => onUpdate(order.id, 'warehouse', e.target.value)}
                        className="h-7 text-xs"
                        placeholder="仓库"
                      />
                    </div>
                  </div>

                  {/* Personnel info */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">业务员</Label>
                      <Input
                        value={
                          order.salesperson || salespersonName || ''
                        }
                        onChange={(e) => {
                          onUpdate(order.id, 'salesperson', e.target.value);
                          if (!e.target.value) onUpdate(order.id, 'salespersonId', '');
                        }}
                        className="h-7 text-xs"
                        placeholder="业务员"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">跟单员</Label>
                      <Input
                        value={order.operator || operatorName || ''}
                        onChange={(e) => {
                          onUpdate(order.id, 'operator', e.target.value);
                          if (!e.target.value) onUpdate(order.id, 'operatorId', '');
                        }}
                        className="h-7 text-xs"
                        placeholder="跟单员"
                      />
                    </div>
                  </div>

                  {/* Supplier selection */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">分配供应商</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => onMatchSupplier(order.id)}
                        disabled={isMatchingSupplier || !order.product_name}
                      >
                        {isMatchingSupplier && matchingSupplierOrderId === order.id ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <Sparkles className="h-3 w-3 mr-1" />
                        )}
                        智能匹配
                      </Button>
                    </div>

                    {/* Match result table */}
                    {availableSuppliers.length > 0 && (
                      <div className="border rounded overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="w-8"></TableHead>
                              <TableHead>供应商</TableHead>
                              <TableHead>省份</TableHead>
                              <TableHead className="text-right">库存</TableHead>
                              <TableHead className="text-right">单价</TableHead>
                              <TableHead className="text-right">历史成本</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {availableSuppliers.map((supplier) => {
                              const isSelected =
                                order.supplierId === supplier.supplierId;
                              return (
                                <TableRow
                                  key={supplier.supplierId}
                                  className={`cursor-pointer hover:bg-muted/50 ${
                                    isSelected ? 'bg-primary/5' : ''
                                  } ${supplier.hasStock === false ? 'opacity-60' : ''}`}
                                  onClick={() =>
                                    onSupplierChange(order.id, supplier.supplierId)
                                  }
                                >
                                  <TableCell>
                                    <div
                                      className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                        isSelected
                                          ? 'border-primary bg-primary'
                                          : 'border-muted-foreground'
                                      }`}
                                    >
                                      {isSelected && (
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1">
                                      {supplier.hasStock === false && (
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-100 text-gray-600 border-gray-300 text-[10px] py-0 px-1 mr-1"
                                        >
                                          无库存
                                        </Badge>
                                      )}
                                      <span className="font-medium text-xs">
                                        {supplier.supplierName}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${
                                        supplier.provinceMatch === '同省'
                                          ? 'border-green-500 text-green-600 bg-green-50'
                                          : supplier.provinceMatch === '邻近'
                                          ? 'border-blue-500 text-blue-600 bg-blue-50'
                                          : 'border-gray-300'
                                      }`}
                                    >
                                      {supplier.provinceMatch || '未知'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell
                                    className={`text-right text-xs ${
                                      supplier.quantity <= 2 ? 'text-orange-600' : ''
                                    }`}
                                  >
                                    {supplier.quantity > 0 ? `${supplier.quantity}台` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-xs">
                                    {supplier.price > 0 ? `&yen;${supplier.price.toFixed(2)}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right text-xs">
                                    {supplier.historyCost != null
                                      ? `&yen;${supplier.historyCost.toFixed(2)}`
                                      : '-'}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Supplier dropdown */}
                    <Select
                      value={order.supplierId as string || 'none'}
                      onValueChange={(v) =>
                        onSupplierChange(order.id, v === 'none' ? '' : v)
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="请选择供应商" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">请选择供应商</SelectItem>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                            {s.province && `（${s.province}）`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remark */}
                  <div>
                    <Label className="text-xs text-muted-foreground">备注</Label>
                    <Input
                      value={order.remark || ''}
                      onChange={(e) => onUpdate(order.id, 'remark', e.target.value)}
                      className="h-7 text-xs"
                      placeholder="备注信息"
                    />
                  </div>

                  {/* SKU mapping info */}
                  {order.mappedProductName && (
                    <div className="bg-muted/50 p-2 rounded text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="h-3 w-3 text-primary" />
                        <span className="font-medium">SKU映射结果</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                        <span>系统商品:</span>
                        <span>
                          {order.mappedProductName as string}
                        </span>
                        <span>商品编码:</span>
                        <span>
                          {(order.mappedProductCode as string) || '-'}
                        </span>
                        <span>客户SKU:</span>
                        <span>
                          {order.customerSku as string || '-'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Product picker dialog */}
      <ProductPickerDialog
        open={productPickerOpen}
        onOpenChange={(open) => {
          setProductPickerOpen(open);
          if (!open) onProductSelect(order.id, null);
        }}
        onSelect={(product) => {
          onProductSelect(order.id, product);
          setProductPickerOpen(false);
        }}
        title="选择系统商品（按编码或名称搜索）"
      />
    </>
  );
}
