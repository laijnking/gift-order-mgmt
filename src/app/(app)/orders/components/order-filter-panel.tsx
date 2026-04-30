'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Search, ChevronDown, ChevronUp, SlidersHorizontal, X, Plus } from 'lucide-react';
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
import { ORDER_STATUS_OPTIONS } from '@/lib/order-status';
import type { Customer, Supplier, Order } from '../hooks/use-orders-session';

const FILTERABLE_FIELDS = [
  { key: 'orderNo', label: '订单号', placeholder: '输入订单号' },
  { key: 'productName', label: '商品名称/型号', placeholder: '输入商品名称或型号' },
  { key: 'customerInfo', label: '客户信息', placeholder: '输入客户名称或编码' },
  { key: 'phone', label: '电话号码', placeholder: '输入电话号码' },
  { key: 'supplierName', label: '发货方', placeholder: '输入发货方名称' },
  { key: 'salesperson', label: '业务员', placeholder: '输入业务员姓名' },
  { key: 'operator', label: '跟单员', placeholder: '输入跟单员姓名' },
  { key: 'receiverName', label: '收货人', placeholder: '输入收货人姓名' },
  { key: 'address', label: '收货地址', placeholder: '输入收货地址关键词' },
  { key: 'trackingNo', label: '快递单号', placeholder: '输入快递单号' },
  { key: 'expressCompany', label: '快递公司', placeholder: '输入快递公司名称' },
  { key: 'importBatch', label: '导入批次', placeholder: '输入导入批次号' },
];

interface OrderFilterPanelProps {
  orders: Order[];
  selectedOrders: Set<Order>;
  filteredCount: number;
  statusCounts: Record<string, number>;
  totalCount: number;
  // Filter state
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (v: string[] | ((prev: string[]) => string[])) => void;
  customerFilter: string;
  setCustomerFilter: (v: string) => void;
  customerSearch: string;
  setCustomerSearch: (v: string) => void;
  supplierFilter: string;
  setSupplierFilter: (v: string) => void;
  supplierSearch: string;
  setSupplierSearch: (v: string) => void;
  quantityOp: 'gt' | 'lt' | 'eq';
  setQuantityOp: (v: 'gt' | 'lt' | 'eq') => void;
  quantityFilter: string;
  setQuantityFilter: (v: string) => void;
  searchFields: Record<string, string>;
  setSearchFields: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  showAdvancedFilter: boolean;
  setShowAdvancedFilter: (v: boolean) => void;
  advancedFields: Record<string, string>;
  setAdvancedFields: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  // Date range filter
  createdFrom: string;
  setCreatedFrom: (v: string) => void;
  createdTo: string;
  setCreatedTo: (v: string) => void;
  // Reference data
  customers: Customer[];
  suppliers: Supplier[];
  // Actions
  addAdvancedField: (key: string) => void;
  removeAdvancedField: (key: string) => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

export function OrderFilterPanel({
  orders,
  selectedOrders,
  filteredCount,
  statusCounts,
  totalCount,
  statusFilter,
  setStatusFilter,
  selectedStatuses,
  setSelectedStatuses,
  customerFilter,
  setCustomerFilter,
  customerSearch,
  setCustomerSearch,
  supplierFilter,
  setSupplierFilter,
  supplierSearch,
  setSupplierSearch,
  quantityOp,
  setQuantityOp,
  quantityFilter,
  setQuantityFilter,
  searchFields,
  setSearchFields,
  showAdvancedFilter,
  setShowAdvancedFilter,
  advancedFields,
  setAdvancedFields,
  createdFrom,
  setCreatedFrom,
  createdTo,
  setCreatedTo,
  customers,
  suppliers,
  addAdvancedField,
  removeAdvancedField,
  clearAllFilters,
  hasActiveFilters,
}: OrderFilterPanelProps) {
  const updateSearchField_ = (key: string, value: string) =>
    setSearchFields(prev => ({ ...prev, [key]: value }));

  const updateAdvancedField_ = (key: string, value: string) =>
    setAdvancedFields(prev => ({ ...prev, [key]: value }));

  return (
    <Card id="filter-card">
      <CardContent className="pt-4 pb-3 space-y-3">
        {/* Row 1: Status quick tags */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setStatusFilter(''); setSelectedStatuses([]); }}
            className={`h-7 px-3 text-xs rounded-full cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${
              !statusFilter && selectedStatuses.length === 0
                ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            全部订单
            <span className={`text-[10px] px-1 rounded-full ${
              !statusFilter && selectedStatuses.length === 0 ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'
            }`}>{totalCount}</span>
          </button>
          {ORDER_STATUS_OPTIONS.map((option) => {
            const count = statusCounts[option.value] ?? 0;
            const isActive = statusFilter === option.value && selectedStatuses.length === 0;
            const isMultiSelected = selectedStatuses.includes(option.value);
            return (
              <button
                key={option.value}
                onClick={() => {
                  setStatusFilter('');
                  setSelectedStatuses(prev =>
                    prev.includes(option.value)
                      ? prev.filter(k => k !== option.value)
                      : [...prev, option.value]
                  );
                }}
                className={`h-7 px-3 text-xs rounded-full cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 ${
                  isActive || isMultiSelected
                    ? 'bg-primary text-primary-foreground font-medium shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {option.label}
                <span className={`text-[10px] px-1 rounded-full ${
                  isActive || isMultiSelected ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20'
                }`}>{count}</span>
              </button>
            );
          })}
          {selectedStatuses.length > 0 && (
            <button
              onClick={() => setSelectedStatuses([])}
              className="h-7 px-2.5 text-xs rounded-full cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              已选 {selectedStatuses.length} 个状态
            </button>
          )}
          {/* Stats */}
          <div className="ml-auto flex items-center gap-3 shrink-0">
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={clearAllFilters}>
                <X className="w-3 h-3 mr-1" />
                清除筛选
              </Button>
            )}
            {selectedOrders.size > 0 && (
              <Badge variant="secondary" className="text-xs">已选 {selectedOrders.size} 条</Badge>
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filteredCount} / {totalCount}
            </span>
          </div>
        </div>

        {/* Row 2: Condition filters */}
        <div className="flex flex-wrap xl:flex-nowrap xl:items-end gap-3">
          {/* Order no */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">订单号</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="系统单号/客户单号"
                value={searchFields.orderNo}
                onChange={(e) => updateSearchField_('orderNo', e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Product name */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">商品名称/型号</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="输入商品名称或型号"
                value={searchFields.productName}
                onChange={(e) => updateSearchField_('productName', e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">电话号码</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="输入电话号码"
                value={searchFields.phone}
                onChange={(e) => updateSearchField_('phone', e.target.value)}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>

          {/* Creation date range */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">创建时间</Label>
            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
                className="h-8 text-xs w-[130px]"
                max={createdTo || undefined}
              />
              <span className="text-muted-foreground text-xs">至</span>
              <Input
                type="date"
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
                className="h-8 text-xs w-[130px]"
                min={createdFrom || undefined}
              />
            </div>
          </div>

          {/* Customer */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">客户</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-full justify-between font-normal">
                  {customerFilter ? (
                    <span className="truncate">{customers.find(c => c.code === customerFilter)?.name || customerFilter}</span>
                  ) : (
                    <span className="text-muted-foreground truncate">全部客户</span>
                  )}
                  <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="搜索客户..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="h-7 text-sm"
                  />
                </div>
                <div className="p-1 max-h-[200px] overflow-y-auto">
                  <button
                    onClick={() => { setCustomerFilter(''); setCustomerSearch(''); }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer ${!customerFilter ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    全部客户
                  </button>
                  {customers
                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.code.toLowerCase().includes(customerSearch.toLowerCase()))
                    .map((c) => (
                      <button
                        key={c.code}
                        onClick={() => { setCustomerFilter(c.code); setCustomerSearch(''); }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer truncate ${customerFilter === c.code ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        {c.name}
                      </button>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Quantity */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">商品数量</Label>
            <div className="flex items-center gap-1">
              <Select value={quantityOp || 'eq'} onValueChange={(v) => setQuantityOp(v as 'gt' | 'lt' | 'eq')}>
                <SelectTrigger className="h-8 w-[70px] text-sm shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gt">大于</SelectItem>
                  <SelectItem value="lt">小于</SelectItem>
                  <SelectItem value="eq">等于</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="number"
                min="1"
                placeholder="数量"
                value={quantityFilter}
                onChange={(e) => setQuantityFilter(e.target.value)}
                className="h-8 text-sm w-full"
              />
            </div>
          </div>

          {/* Supplier */}
          <div className="space-y-1 min-w-0 flex-1">
            <Label className="text-xs text-muted-foreground">发货方</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-full justify-between font-normal">
                  {supplierFilter ? (
                    <span className="truncate">{suppliers.find(s => s.id === supplierFilter)?.name || supplierFilter}</span>
                  ) : (
                    <span className="text-muted-foreground truncate">全部发货方</span>
                  )}
                  <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[240px] p-0" align="start">
                <div className="p-2 border-b">
                  <Input
                    placeholder="搜索发货方..."
                    value={supplierSearch}
                    onChange={(e) => setSupplierSearch(e.target.value)}
                    className="h-7 text-sm"
                  />
                </div>
                <div className="p-1 max-h-[200px] overflow-y-auto">
                  <button
                    onClick={() => { setSupplierFilter(''); setSupplierSearch(''); }}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer ${!supplierFilter ? 'bg-primary/10 text-primary' : ''}`}
                  >
                    全部发货方
                  </button>
                  {suppliers
                    .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                    .map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSupplierFilter(s.id); setSupplierSearch(''); }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer truncate ${supplierFilter === s.id ? 'bg-primary/10 text-primary' : ''}`}
                      >
                        {s.name}
                      </button>
                    ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="hidden xl:block xl:flex-1" />

          {/* Advanced */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 shrink-0"
            onClick={() => setShowAdvancedFilter(!showAdvancedFilter)}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
            高级
            {showAdvancedFilter ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </div>

        {/* Advanced filter panel */}
        {showAdvancedFilter && (
          <div className="mt-3 pt-3 border-t space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Label className="text-sm font-medium">高级筛选</Label>
              <span className="text-xs text-muted-foreground">添加更多筛选字段</span>
            </div>

            {Object.entries(advancedFields).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(advancedFields).map(([key, value]) => {
                  const fieldDef = FILTERABLE_FIELDS.find((f) => f.key === key);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs text-muted-foreground">{fieldDef?.label || key}</Label>
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder={fieldDef?.placeholder || ''}
                            value={value}
                            onChange={(e) => updateAdvancedField_(key, e.target.value)}
                            className="pl-8 h-8 text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 mt-5"
                        onClick={() => removeAdvancedField(key)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center gap-2">
              <Select
                value=""
                onValueChange={(v) => { if (v) addAdvancedField(v); }}
              >
                <SelectTrigger className="w-[180px] h-8 text-sm">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  <SelectValue placeholder="添加筛选字段" />
                </SelectTrigger>
                <SelectContent>
                  {FILTERABLE_FIELDS.filter(
                    (f) => !advancedFields.hasOwnProperty(f.key) && !searchFields.hasOwnProperty(f.key)
                  ).map((f) => (
                    <SelectItem key={f.key} value={f.key}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
