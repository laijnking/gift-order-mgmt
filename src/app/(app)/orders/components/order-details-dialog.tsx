'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { CheckCircle, AlertCircle } from 'lucide-react';
import { getOrderStatusBadgeClass, getOrderStatusLabel } from '@/lib/order-status';
import type { Order } from '../hooks/use-orders-session';

interface OrderDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  canEdit: boolean;
  canDelete: boolean;
  getEditDisabledReason: (order: Order) => string | null;
  getDeleteDisabledReason: (order: Order) => string | null;
  getEditableFieldsHint: (order: Order) => string;
}

export function OrderDetailsDialog({
  open,
  onOpenChange,
  order,
  canEdit,
  canDelete,
  getEditDisabledReason,
  getDeleteDisabledReason,
  getEditableFieldsHint,
}: OrderDetailsDialogProps) {
  if (!order) return null;

  const firstItem = order.items?.[0] || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>订单详情</DialogTitle>
          <DialogDescription>系统单号：{order.sysOrderNo}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">系统单号</h4>
              <p className="font-mono font-medium text-primary">{order.sysOrderNo || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">客户单号</h4>
              <p className="font-mono">{order.orderNo}</p>
            </div>
            {order.billNo && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">单据编号</h4>
                <p className="font-mono">{order.billNo}</p>
              </div>
            )}
            {order.billDate && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">单据日期</h4>
                <p>{order.billDate}</p>
              </div>
            )}
            {order.supplierOrderNo && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">发货方单据号</h4>
                <p className="font-mono">{order.supplierOrderNo}</p>
              </div>
            )}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">状态</h4>
              <Badge className={getOrderStatusBadgeClass(order.status)}>
                {getOrderStatusLabel(order.status)}
              </Badge>
              <div className="mt-2 text-xs text-muted-foreground space-y-1">
                {!canEdit && (
                  <p className="text-orange-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getEditDisabledReason(order)}
                  </p>
                )}
                {!canDelete && (
                  <p className="text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {getDeleteDisabledReason(order)}
                  </p>
                )}
                {canEdit && (
                  <p className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {getEditableFieldsHint(order)}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">客户</h4>
              <p>{order.customerName || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">导入批次</h4>
              <p className="font-mono break-all text-xs">{order.importBatch || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">业务员</h4>
              <p>{order.salespersonName || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">跟单员</h4>
              <p>{order.operatorName || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">收货人</h4>
              <p>{order.receiver.name}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">联系电话</h4>
              <p>{order.receiver.phone}</p>
            </div>
            <div className="col-span-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">收货地址</h4>
              <p>{order.receiver.address}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-1">发货方</h4>
              <p>{order.supplierName || '-'}</p>
            </div>
            {(order.warehouse || firstItem.warehouse) && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">仓库</h4>
                <p>{order.warehouse || firstItem.warehouse}</p>
              </div>
            )}
            {order.expressCompany && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">快递公司</h4>
                <p>{order.expressCompany}</p>
              </div>
            )}
            {order.trackingNo && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">快递单号</h4>
                <p className="font-mono">{order.trackingNo}</p>
              </div>
            )}
            {order.suggestedShipper && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">建议发货方</h4>
                <p>{order.suggestedShipper}</p>
              </div>
            )}
            {order.originalStatus && (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-1">原订单状态</h4>
                <Badge variant="outline">{order.originalStatus}</Badge>
              </div>
            )}
          </div>

          {/* Invoice & amount */}
          {(order.amount || order.invoiceRequired || order.incomeName) && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">发票与金额信息</h4>
              <div className="grid grid-cols-4 gap-4">
                {order.amount && (
                  <div>
                    <p className="text-xs text-muted-foreground">价税合计</p>
                    <p className="font-medium">¥{order.amount.toFixed(2)}</p>
                  </div>
                )}
                {order.discount && (
                  <div>
                    <p className="text-xs text-muted-foreground">单台折让</p>
                    <p className="font-medium">¥{order.discount.toFixed(2)}</p>
                  </div>
                )}
                {order.taxRate && (
                  <div>
                    <p className="text-xs text-muted-foreground">税率</p>
                    <p className="font-medium">{order.taxRate}%</p>
                  </div>
                )}
                {order.invoiceRequired !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground">需要开票</p>
                    <p className="font-medium">{order.invoiceRequired ? '是' : '否'}</p>
                  </div>
                )}
                {order.incomeName && (
                  <div>
                    <p className="text-xs text-muted-foreground">收入名称</p>
                    <p className="font-medium">{order.incomeName}</p>
                  </div>
                )}
                {order.incomeAmount && (
                  <div>
                    <p className="text-xs text-muted-foreground">应收金额</p>
                    <p className="font-medium">¥{order.incomeAmount.toFixed(2)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Remark */}
          {order.remark && (
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <h4 className="text-sm font-medium text-yellow-800 mb-1">订单备注</h4>
              <p className="text-sm text-yellow-700">{order.remark}</p>
            </div>
          )}
          {order.channelRemark && (
            <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
              <h4 className="text-sm font-medium text-blue-800 mb-1">渠道备注</h4>
              <p className="text-sm text-blue-700">{order.channelRemark}</p>
            </div>
          )}
          {order.systemRemark && (
            <div className="border rounded-lg p-4 bg-green-50 border-green-200">
              <h4 className="text-sm font-medium text-green-800 mb-1">系统备注</h4>
              <p className="text-sm text-green-700">{order.systemRemark}</p>
            </div>
          )}

          {/* Items */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">商品明细</h4>
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>商品名称</TableHead>
                    <TableHead>规格型号</TableHead>
                    <TableHead>商品编码</TableHead>
                    <TableHead>品牌</TableHead>
                    <TableHead>客户SKU</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">单价</TableHead>
                    <TableHead className="text-right">小计</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, i) => (
                    <TableRow key={item.productCode || item.product_code || `item-${i}`}>
                      <TableCell>
                        <div className="space-y-1">
                          {item.productName && item.productName !== item.cuProductName && (
                            <div className="text-sm">
                              <span className="text-green-600 font-medium">系统：</span>
                              {item.productName}
                            </div>
                          )}
                          <div className="text-sm">
                            <span className={item.productName && item.productName !== item.cuProductName ? 'text-orange-600' : 'text-gray-900'}>
                              {item.cuProductName || item.productName}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {item.productSpec && item.productSpec !== item.cuProductSpec && (
                            <div className="text-xs">
                              <span className="text-green-600">系统：</span>
                              <span className="text-muted-foreground">{item.productSpec || '-'}</span>
                            </div>
                          )}
                          <div className="text-xs">
                            <span className="text-muted-foreground">{item.cuProductSpec || item.productSpec || '-'}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        <div>{item.product_code || '-'}</div>
                        {item.cuProductCode && item.cuProductCode !== item.product_code && (
                          <div className="text-orange-500">客:{item.cuProductCode}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.productBrand || '-'}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {item.cuProductCode && item.cuProductCode !== item.product_code ? item.cuProductCode : (item.cuBarcode || '-')}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.price ? `¥${item.price.toFixed(2)}` : (item.unitPrice ? `¥${item.unitPrice.toFixed(2)}` : '-')}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.price ? `¥${(item.price * item.quantity).toFixed(2)}` : (item.unitPrice ? `¥${(item.unitPrice * item.quantity).toFixed(2)}` : '-')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {firstItem.matchType && (
              <div className="mt-2 text-xs text-muted-foreground">
                <span className="font-medium">匹配方式：</span>
                {firstItem.matchType === 'spec' && '按规格型号精确匹配'}
                {firstItem.matchType === 'name' && '按商品名称模糊匹配'}
                {firstItem.matchType === 'mapping' && '按SKU映射匹配'}
                {firstItem.matchType === 'none' && '未匹配到商品档案'}
                {firstItem.matchHint && (
                  <span className="ml-2 text-gray-500">({firstItem.matchHint})</span>
                )}
              </div>
            )}
          </div>

          {/* Ext fields */}
          {order.extFields && Object.keys(order.extFields).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">附加信息</h4>
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>字段</TableHead>
                      <TableHead>值</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(order.extFields).map(([key, val]) => {
                      const idx = parseInt(key.replace('ext_field_', ''));
                      return (
                        <TableRow key={key}>
                          <TableCell className="text-muted-foreground">备用字段{idx}</TableCell>
                          <TableCell>{val}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>创建时间：{new Date(order.createdAt).toLocaleString('zh-CN')}</span>
            <span>更新时间：{new Date(order.updatedAt).toLocaleString('zh-CN')}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
