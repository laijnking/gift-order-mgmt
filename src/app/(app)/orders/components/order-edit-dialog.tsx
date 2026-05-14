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
import { Loader2, Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  cuProductName: string;
  cuProductCode: string;
  cuProductSpec: string;
  quantity: number;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverProvince: string;
  expressRequirement: string;
  remark: string;
  systemRemark: string;
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
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const selectedSupplierName = suppliers.find(s => s.id === form.supplierId)?.name || form.supplierName;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[95vw]">
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
          <div className="space-y-4 max-h-[75vh] overflow-y-auto">
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
                <Label className="text-muted-foreground">客户商品信息</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    value={form.cuProductName || '-'}
                    readOnly
                    className="bg-muted text-sm"
                    placeholder="商品名称"
                  />
                  <Input
                    value={form.cuProductCode || '-'}
                    readOnly
                    className="bg-muted text-sm"
                    placeholder="商品编码"
                  />
                  <Input
                    value={form.cuProductSpec || '-'}
                    readOnly
                    className="bg-muted text-sm"
                    placeholder="商品规格"
                  />
                </div>
              </div>
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">系统商品信息</Label>
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
                  <Popover open={supplierSearchOpen} onOpenChange={(open) => { if (!isLocked) setSupplierSearchOpen(open); }}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        disabled={isLocked}
                        className={cn(
                          'w-full justify-start text-left font-normal h-9',
                          !form.supplierId && 'text-muted-foreground',
                          isLocked && 'bg-muted'
                        )}
                      >
                        {form.supplierId ? (
                          <span className="truncate">{selectedSupplierName || form.supplierId}</span>
                        ) : (
                          <span className="truncate">请搜索并选择发货方...</span>
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="输入发货方名称搜索..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="h-9 text-sm"
                        />
                      </div>
                      <div className="p-1 max-h-[240px] overflow-y-auto">
                        <button
                          onClick={() => {
                            setForm(prev => ({ ...prev, supplierId: '', supplierName: '' }));
                            setSupplierSearch('');
                            setSupplierSearchOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer text-muted-foreground"
                        >
                          -- 不指定 --
                        </button>
                        {suppliers
                          .filter((s) => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                          .slice(0, 50)
                          .map((s) => (
                            <button
                              key={s.id}
                              onClick={() => {
                                setForm(prev => ({ ...prev, supplierId: s.id, supplierName: s.name }));
                                setSupplierSearch('');
                                setSupplierSearchOpen(false);
                              }}
                              className={cn(
                                'w-full text-left px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer',
                                form.supplierId === s.id && 'bg-primary/10 text-primary'
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium truncate">{s.name}</span>
                                <span className="text-xs text-muted-foreground">编码: {s.id}</span>
                              </div>
                            </button>
                          ))}
                        {suppliers.filter((s) => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            未找到匹配的发货方
                          </div>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
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
                  <Label>系统备注</Label>
                  <Textarea
                    rows={2}
                    maxLength={200}
                    value={form.systemRemark}
                    onChange={(e) => setForm(prev => ({ ...prev, systemRemark: e.target.value }))}
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
