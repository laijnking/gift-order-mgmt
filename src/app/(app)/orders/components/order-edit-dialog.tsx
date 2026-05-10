'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Search } from 'lucide-react';
import { getOrderStatusBadgeClass, getOrderStatusLabel, ORDER_STATUS_OPTIONS } from '@/lib/order-status';
import { ProductPickerDialog } from '@/components/product/product-picker-dialog';
import type { ProductPickerItem } from '@/components/product/product-picker-dialog';
import type { OrderStatus } from '@/types/order';
import type { Order } from '../hooks/use-orders-session';
import type { Supplier } from '../hooks/use-orders-session';

export interface EditOrderForm {
  id: string;
  orderNo: string;
  customerCode: string;
  productId: string;
  productName: string;
  productCode: string;
  productSpec: string;
  productBrand: string;
  quantity: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  expressRequirement: string;
  remark: string;
  status: string;
  supplierId: string;
  supplierName: string;
  expressCompany: string;
  trackingNo: string;
}

const LOCKED_STATUSES: OrderStatus[] = ['returned', 'feedbacked', 'completed', 'cancelled'];

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EditOrderForm;
  setForm: React.Dispatch<React.SetStateAction<EditOrderForm>>;
  suppliers: Supplier[];
  onSubmit: () => void;
  loading: boolean;
  editProductPickerOpen: boolean;
  setEditProductPickerOpen: (open: boolean) => void;
  onEditProductSelect: (product: ProductPickerItem | null) => void;
  canEdit: boolean;
  getEditDisabledReason: (order: Order) => string | null;
}

export function OrderEditDialog({
  open,
  onOpenChange,
  form,
  setForm,
  suppliers,
  onSubmit,
  loading,
  editProductPickerOpen,
  setEditProductPickerOpen,
  onEditProductSelect,
}: OrderEditDialogProps) {
  const isLocked = LOCKED_STATUSES.includes(form.status as OrderStatus);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>编辑订单</DialogTitle>
            <DialogDescription asChild>
              <p>
                {form.status && (
                  <span className="mt-1 flex items-center gap-2 flex-wrap">
                    <Badge className={getOrderStatusBadgeClass(form.status)}>
                      {getOrderStatusLabel(form.status)}
                    </Badge>
                    {isLocked ? (
                      <span className="text-xs text-muted-foreground">
                        已回单/已反馈订单，仅可修改收货信息
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        可修改：发货方、状态、物流信息、收货信息、商品信息
                      </span>
                    )}
                  </span>
                )}
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* 基本信息 */}
            <div className="border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">基本信息</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>订单号</Label>
                  <Input value={form.orderNo} disabled />
                </div>
                <div className="space-y-2">
                  <Label>客户代码</Label>
                  <Input
                    value={form.customerCode}
                    onChange={(e) => setForm(prev => ({ ...prev, customerCode: e.target.value }))}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">匹配系统商品</Label>
                  {!isLocked && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditProductPickerOpen(true)}
                    >
                      <Search className="w-3 h-3 mr-1" />
                      选择系统商品
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={form.productName}
                    disabled
                    className="bg-muted flex-1"
                  />
                </div>
                {form.productCode && (
                  <div className="text-xs text-muted-foreground">
                    系统编码：<span className="font-mono">{form.productCode}</span>
                    {form.productSpec && <span className="ml-2">规格：{form.productSpec}</span>}
                    {form.productBrand && <span className="ml-2">品牌：{form.productBrand}</span>}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">数量</Label>
                  <Input value={form.quantity} disabled className="bg-muted" />
                </div>
              </div>
            </div>

            {/* 发货方与状态 */}
            <div className="border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">发货方与状态</div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>发货方</Label>
                  <Select
                    value={form.supplierId}
                    onValueChange={(val) => {
                      const supplier = suppliers.find(s => s.id === val);
                      setForm(prev => ({ ...prev, supplierId: val, supplierName: supplier?.name || '' }));
                    }}
                    disabled={isLocked}
                  >
                    <SelectTrigger className={isLocked ? 'bg-muted' : ''}>
                      <SelectValue placeholder="选择发货方" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>订单状态</Label>
                  <Select
                    value={form.status}
                    onValueChange={(val) => setForm(prev => ({ ...prev, status: val }))}
                    disabled={isLocked}
                  >
                    <SelectTrigger className={isLocked ? 'bg-muted' : ''}>
                      <SelectValue placeholder="选择状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUS_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 物流信息 */}
            <div className="border-b pb-3">
              <div className="text-sm font-medium text-muted-foreground mb-2">物流信息</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>快递公司</Label>
                  <Input
                    value={form.expressCompany}
                    onChange={(e) => setForm(prev => ({ ...prev, expressCompany: e.target.value }))}
                    placeholder="如：顺丰"
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>快递单号</Label>
                  <Input
                    value={form.trackingNo}
                    onChange={(e) => setForm(prev => ({ ...prev, trackingNo: e.target.value }))}
                    placeholder="快递单号"
                    disabled={isLocked}
                  />
                </div>
              </div>
            </div>

            {/* 收货信息 */}
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">收货信息</div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>收货人 <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.receiverName}
                      onChange={(e) => setForm(prev => ({ ...prev, receiverName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>联系电话 <span className="text-destructive">*</span></Label>
                    <Input
                      value={form.receiverPhone}
                      onChange={(e) => setForm(prev => ({ ...prev, receiverPhone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>收货省份</Label>
                  <Input
                    value={form.receiverProvince}
                    onChange={(e) => setForm(prev => ({ ...prev, receiverProvince: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>收货地址 <span className="text-destructive">*</span></Label>
                  <Textarea
                    rows={2}
                    value={form.receiverAddress}
                    onChange={(e) => setForm(prev => ({ ...prev, receiverAddress: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>快递要求</Label>
                  <Input
                    value={form.expressRequirement}
                    onChange={(e) => setForm(prev => ({ ...prev, expressRequirement: e.target.value }))}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>备注</Label>
                  <Textarea
                    rows={2}
                    value={form.remark}
                    onChange={(e) => setForm(prev => ({ ...prev, remark: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />保存中...</> : '保存修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductPickerDialog
        open={editProductPickerOpen}
        onOpenChange={setEditProductPickerOpen}
        onSelect={onEditProductSelect}
        title="选择匹配的系统商品"
      />
    </>
  );
}
