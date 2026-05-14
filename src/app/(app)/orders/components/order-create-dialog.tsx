'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ProductPickerDialog } from '@/components/product/product-picker-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserDisplayName, isOperatorAssignableRole, isSalesAssignableRole, findUserByIdOrName } from '@/lib/roles';
import type { Customer } from '../hooks/use-orders-session';

export interface CreateOrderForm {
  orderNo: string;
  customerCode: string;
  customerName: string;
  salespersonId: string;
  salespersonName: string;
  operatorId: string;
  operatorName: string;
  supplierId: string;
  supplierName: string;
  productName: string;
  productCode: string;
  productSpec: string;
  productBrand: string;
  cuProductName: string;
  cuProductCode: string;
  cuProductSpec: string;
  quantity: number;
  price: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  freightCost: string;
  channelRemark: string;
  expressRequirement: string;
  remark: string;
  systemRemark: string;
}

interface UserInfo {
  id: string;
  username: string;
  realName?: string;
  name?: string;
  role: string;
}

interface Supplier {
  id: string;
  name: string;
  province?: string;
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
  customers: Customer[];
  users: UserInfo[];
  suppliers: Supplier[];
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
  customers,
  users,
  suppliers,
}: OrderCreateDialogProps) {
  const effectiveOrderNo = useMemo(() => form.orderNo || autoOrderNo, [form.orderNo, autoOrderNo]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [supplierSearchOpen, setSupplierSearchOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  const salesUsers = users.filter((u) => isSalesAssignableRole(u.role));
  const operatorUsers = users.filter((u) => isOperatorAssignableRole(u.role));

  const handleCustomerChange = (code: string, customer: Customer) => {
    const matchedSales = findUserByIdOrName(users, {
      id: customer.salesUserId,
      name: customer.salesUserName,
    });
    const matchedOperator = findUserByIdOrName(users, {
      id: customer.operatorUserId,
      name: customer.operatorUserName,
    });
    setForm(prev => ({
      ...prev,
      customerCode: customer.code,
      customerName: customer.name,
      salespersonId: matchedSales?.id || '',
      salespersonName: matchedSales ? getUserDisplayName(matchedSales) : (customer.salesUserName || ''),
      operatorId: matchedOperator?.id || '',
      operatorName: matchedOperator ? getUserDisplayName(matchedOperator) : (customer.operatorUserName || ''),
    }));
  };

  const selectedCustomerName = customers.find(c => c.code === form.customerCode)?.name || form.customerName;
  const selectedSupplierName = suppliers.find(s => s.id === form.supplierId)?.name || form.supplierName;

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
                <Label>客户 <span className="text-destructive">*</span></Label>
                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-full justify-start text-left font-normal h-9',
                        !form.customerCode && 'text-muted-foreground'
                      )}
                    >
                      {form.customerCode ? (
                        <span className="truncate">{selectedCustomerName || form.customerCode}</span>
                      ) : (
                        <span className="truncate">请搜索并选择客户...</span>
                      )}
                      <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <div className="p-2 border-b">
                      <Input
                        placeholder="输入客户名称或编码搜索..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="p-1 max-h-[240px] overflow-y-auto">
                      {customers
                        .filter(
                          (c) =>
                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                            String(c.code).toLowerCase().includes(customerSearch.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((c) => (
                          <button
                            key={c.code}
                            onClick={() => {
                              handleCustomerChange(c.code, c);
                              setCustomerSearch('');
                              setCustomerSearchOpen(false);
                            }}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer',
                              form.customerCode === c.code && 'bg-primary/10 text-primary'
                            )}
                          >
                            <div className="flex flex-col">
                              <span className="font-medium truncate">{c.name}</span>
                              <span className="text-xs text-muted-foreground">编码: {c.code}</span>
                            </div>
                          </button>
                        ))}
                      {customers.filter(
                        (c) =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          String(c.code).toLowerCase().includes(customerSearch.toLowerCase())
                      ).length === 0 && (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                          未找到匹配的客户
                        </div>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {form.customerCode && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">业务员</Label>
                  <Select
                    value={form.salespersonId || (form.salespersonName ? `__name__${form.salespersonName}` : '__empty__')}
                    onValueChange={(v) => {
                      if (v === '__empty__') {
                        setForm(prev => ({ ...prev, salespersonId: '', salespersonName: '' }));
                      } else if (v.startsWith('__name__')) {
                        setForm(prev => ({ ...prev, salespersonId: '', salespersonName: v.replace('__name__', '') }));
                      } else {
                        const user = users.find((u) => u.id === v);
                        setForm(prev => ({ ...prev, salespersonId: v, salespersonName: getUserDisplayName(user) }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="选择业务员" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">-- 不选择 --</SelectItem>
                      {salesUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {getUserDisplayName(u)}
                        </SelectItem>
                      ))}
                      {form.salespersonName &&
                        !users.find(
                          (u) =>
                            u.id === form.salespersonId ||
                            u.realName === form.salespersonName ||
                            u.username === form.salespersonName
                        ) && (
                          <SelectItem value={`__name__${form.salespersonName}`}>
                            {form.salespersonName} (客户档案)
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">跟单员</Label>
                  <Select
                    value={form.operatorId || (form.operatorName ? `__name__${form.operatorName}` : '__empty__')}
                    onValueChange={(v) => {
                      if (v === '__empty__') {
                        setForm(prev => ({ ...prev, operatorId: '', operatorName: '' }));
                      } else if (v.startsWith('__name__')) {
                        setForm(prev => ({ ...prev, operatorId: '', operatorName: v.replace('__name__', '') }));
                      } else {
                        const user = users.find((u) => u.id === v);
                        setForm(prev => ({ ...prev, operatorId: v, operatorName: getUserDisplayName(user) }));
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="选择跟单员" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty__">-- 不选择 --</SelectItem>
                      {operatorUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {getUserDisplayName(u)}
                        </SelectItem>
                      ))}
                      {form.operatorName &&
                        !users.find(
                          (u) =>
                            u.id === form.operatorId ||
                            u.realName === form.operatorName ||
                            u.username === form.operatorName
                        ) && (
                          <SelectItem value={`__name__${form.operatorName}`}>
                            {form.operatorName} (客户档案)
                          </SelectItem>
                        )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>发货方</Label>
              <Popover open={supplierSearchOpen} onOpenChange={setSupplierSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      'w-full justify-start text-left font-normal h-9',
                      !form.supplierId && 'text-muted-foreground'
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
              <Label>商品名称</Label>
              <div className="flex gap-2">
                <Input
                  placeholder={'商品名称，选填，默认"商品待匹配"'}
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

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">客户商品信息</Label>
              <Input
                placeholder="客户商品名称"
                value={form.cuProductName}
                onChange={(e) => setForm(prev => ({ ...prev, cuProductName: e.target.value }))}
                className="h-9"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="客户商品编码"
                  value={form.cuProductCode}
                  onChange={(e) => setForm(prev => ({ ...prev, cuProductCode: e.target.value }))}
                  className="h-9"
                />
                <Input
                  placeholder="客户商品型号"
                  value={form.cuProductSpec}
                  onChange={(e) => setForm(prev => ({ ...prev, cuProductSpec: e.target.value }))}
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
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
                <Label>商品单价</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="¥"
                  value={form.price}
                  onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>商品总价</Label>
                <div className="h-9 px-3 py-2 border rounded-md bg-muted/50 text-sm">
                  ¥{(parseFloat(form.price) || 0) * form.quantity}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>收货人 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="收货人姓名"
                  value={form.receiverName}
                  onChange={(e) => setForm(prev => ({ ...prev, receiverName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>联系电话 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="手机号码"
                  value={form.receiverPhone}
                  onChange={(e) => setForm(prev => ({ ...prev, receiverPhone: e.target.value }))}
                />
              </div>
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
              <Label>运费</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="运费金额"
                value={form.freightCost}
                onChange={(e) => setForm(prev => ({ ...prev, freightCost: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">系统备注</Label>
              <Textarea
                placeholder="系统备注（内部运营使用，最长200字）"
                rows={2}
                maxLength={200}
                value={form.systemRemark}
                onChange={(e) => setForm(prev => ({ ...prev, systemRemark: e.target.value }))}
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
