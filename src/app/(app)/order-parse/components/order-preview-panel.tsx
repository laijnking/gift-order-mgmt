'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Send, Loader2, AlertTriangle } from 'lucide-react';
import { OrderStats } from './order-stats';
import { OrderList } from './order-list';
import type { ParsedOrder, ParseStats, SubmitValidationSummary } from '../hooks/use-order-parse-session';
import type { SupplierMatchResult } from '../hooks/use-order-parse-session';
import type { ProductPickerItem } from '@/components/product/product-picker-dialog';

interface CustomerInfo {
  code: string;
  name: string;
}

interface SupplierInfo {
  id: string;
  name: string;
  type?: string;
  province?: string;
}

interface OrderPreviewPanelProps {
  orders: ParsedOrder[];
  parseStats: ParseStats | null;
  submitValidation: SubmitValidationSummary;
  selectedValidOrderCount: number;
  selectedCustomer: string;
  salespersonName: string;
  operatorName: string;
  customers: CustomerInfo[];
  suppliers: SupplierInfo[];
  supplierMatchResults: Record<string, SupplierMatchResult>;
  isMatchingSupplier: boolean;
  matchingSupplierOrderId: string | null;
  isSubmitting: boolean;
  onToggle: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, field: string, value: unknown) => void;
  onMatchSupplier: (id: string) => void;
  onSupplierChange: (orderId: string, supplierId: string) => void;
  onProductSelect: (orderId: string, product: ProductPickerItem | null) => void;
  onSelectAll: (selected: boolean) => void;
  onAddOrder: () => void;
  onSubmit: () => void;
}

export function OrderPreviewPanel({
  orders,
  parseStats,
  submitValidation,
  selectedValidOrderCount,
  selectedCustomer,
  salespersonName,
  operatorName,
  customers,
  suppliers,
  supplierMatchResults,
  isMatchingSupplier,
  matchingSupplierOrderId,
  isSubmitting,
  onToggle,
  onToggleExpand,
  onDuplicate,
  onRemove,
  onUpdate,
  onMatchSupplier,
  onSupplierChange,
  onProductSelect,
  onSelectAll,
  onAddOrder,
  onSubmit,
}: OrderPreviewPanelProps) {
  if (orders.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>暂无解析结果</p>
          <p className="text-sm">上传Excel或输入文本进行解析</p>
        </div>
      </div>
    );
  }

  const allSelected = orders.every((o) => o.selected);

  return (
    <div className="flex-1 min-w-0 flex flex-col">
      {/* Stats */}
      <OrderStats stats={parseStats} />

      {/* Action Bar */}
      <div className="mb-3 flex shrink-0 flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">
            {orders.filter((o) => o.selected).length} / {orders.length} 条
          </Badge>
          {submitValidation.invalidOrderIds.length > 0 && (
            <Badge variant="destructive">
              {submitValidation.invalidOrderIds.length} 条待补全
            </Badge>
          )}
          {selectedValidOrderCount > 0 && (
            <Badge variant="outline">可提交 {selectedValidOrderCount} 条</Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => onSelectAll(!allSelected)}
          >
            {allSelected ? '取消全选' : '全选'}
          </Button>
        </div>
        <div className="flex items-stretch gap-2 sm:items-center">
          <Button variant="outline" size="sm" onClick={onAddOrder} className="h-8 flex-1 sm:flex-none sm:w-auto">
            <Plus className="h-4 w-4 mr-1" />
            添加
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting || selectedValidOrderCount === 0}
            className="h-8 flex-1 sm:flex-none sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                提交订单
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Validation warning */}
      {submitValidation.invalidOrderIds.length > 0 && (
        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5" />
            提交前还有内容待补全
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {submitValidation.missingProductNameCount > 0 && (
              <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                商品名称 {submitValidation.missingProductNameCount}
              </Badge>
            )}
            {submitValidation.missingReceiverCount > 0 && (
              <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                收货人 {submitValidation.missingReceiverCount}
              </Badge>
            )}
            {submitValidation.missingPhoneCount > 0 && (
              <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                收货电话 {submitValidation.missingPhoneCount}
              </Badge>
            )}
            {submitValidation.missingAddressCount > 0 && (
              <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                收货地址 {submitValidation.missingAddressCount}
              </Badge>
            )}
            {submitValidation.missingSupplierCount > 0 && (
              <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                发货发货方 {submitValidation.missingSupplierCount}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="flex-1 overflow-y-auto">
        <OrderList
          orders={orders}
          customers={customers}
          selectedCustomer={selectedCustomer}
          salespersonName={salespersonName}
          operatorName={operatorName}
          supplierMatchResults={supplierMatchResults}
          isMatchingSupplier={isMatchingSupplier}
          matchingSupplierOrderId={matchingSupplierOrderId}
          onToggle={onToggle}
          onToggleExpand={onToggleExpand}
          onDuplicate={onDuplicate}
          onRemove={onRemove}
          onUpdate={onUpdate}
          onMatchSupplier={onMatchSupplier}
          onSupplierChange={onSupplierChange}
          onProductSelect={onProductSelect}
          suppliers={suppliers}
        />
      </div>
    </div>
  );
}
