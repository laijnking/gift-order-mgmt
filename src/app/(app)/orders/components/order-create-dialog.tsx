'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProductPickerDialog } from '@/components/product/product-picker-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

export interface CreateOrderForm {
  orderNo: string;
  customerCode: string;
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
}

interface OrderCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: CreateOrderForm;
  setForm: React.Dispatch<React.SetStateAction<CreateOrderForm>>;
  onSubmit: () => void;
  loading: boolean;
  productPickerOpen: boolean;
  setProductPickerOpen: (open: boolean) => void;
  autoOrderNo: string;
}

export function OrderCreateDialog({
  open,
  onOpenChange,
  form,
  setForm,
  onSubmit,
  loading,
  productPickerOpen,
  setProductPickerOpen,
  autoOrderNo,
}: OrderCreateDialogProps) {
  const effectiveOrderNo = useMemo(() => form.orderNo || autoOrderNo, [form.orderNo, autoOrderNo]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>新增订单</DialogTitle>
            <DialogDescription>手动创建新订单</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>订单号 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="系统自动生成或手动输入"
                  value={effectiveOrderNo}
                  onChange={(e) => setForm(prev => ({ ...prev, orderNo: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>客户代码</Label>
                <Input
                  placeholder="客户编码"
                  value={form.customerCode}
                  onChange={(e) => setForm(prev => ({ ...prev, customerCode: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>商品名称 <span className="text-destructive">*</span></Label>
              <div className="flex gap-2">
                <Input
                  placeholder="商品名称"
                  value={form.productName}
                  onChange={(e) => setForm(prev => ({ ...prev, productName: e.target.value }))}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setProductPickerOpen(true)}
                  title="从商品目录选择"
                >
                  选择商品
                </Button>
              </div>
              {form.productCode && (
                <div className="text-xs text-muted-foreground">
                  系统编码：<span className="font-mono">{form.productCode}</span>
                  {form.productSpec && <span className="ml-2">规格：{form.productSpec}</span>}
                  {form.productBrand && <span className="ml-2">品牌：{form.productBrand}</span>}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>数量</Label>
                <Input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>收货人 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="收货人姓名"
                  value={form.receiverName}
                  onChange={(e) => setForm(prev => ({ ...prev, receiverName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>联系电话 <span className="text-destructive">*</span></Label>
              <Input
                placeholder="手机号码"
                value={form.receiverPhone}
                onChange={(e) => setForm(prev => ({ ...prev, receiverPhone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>收货省份</Label>
              <Input
                placeholder="如：福建、北京"
                value={form.receiverProvince}
                onChange={(e) => setForm(prev => ({ ...prev, receiverProvince: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>收货地址 <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="详细收货地址"
                rows={2}
                value={form.receiverAddress}
                onChange={(e) => setForm(prev => ({ ...prev, receiverAddress: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>快递要求</Label>
              <Input
                placeholder="如：顺丰优先"
                value={form.expressRequirement}
                onChange={(e) => setForm(prev => ({ ...prev, expressRequirement: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                placeholder="订单备注"
                rows={2}
                value={form.remark}
                onChange={(e) => setForm(prev => ({ ...prev, remark: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
            <Button onClick={onSubmit} disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />创建中...</> : '创建订单'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProductPickerDialog
        open={productPickerOpen}
        onOpenChange={setProductPickerOpen}
        onSelect={(product) => {
          if (!product) return;
          setForm(prev => ({
            ...prev,
            productName: product.name,
            productCode: product.code || '',
            productSpec: product.spec || '',
            productBrand: product.brand || '',
          }));
        }}
      />
    </>
  );
}
