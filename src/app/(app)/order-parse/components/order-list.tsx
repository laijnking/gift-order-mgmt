'use client';

import { OrderCard } from './order-card';
import type { ParsedOrder } from '../hooks/use-order-parse-session';
import type { SupplierMatchResult } from '../hooks/use-order-parse-session';
import type { ProductPickerItem } from '@/components/product/product-picker-dialog';

interface SupplierInfo {
  id: string;
  name: string;
  type?: string;
  province?: string;
}

interface OrderListProps {
  orders: ParsedOrder[];
  customers: Array<{ code: string; name: string }>;
  selectedCustomer: string;
  salespersonName: string;
  operatorName: string;
  supplierMatchResults: Record<string, SupplierMatchResult>;
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
  suppliers: SupplierInfo[];
}

export function OrderList({
  orders,
  customers,
  selectedCustomer,
  salespersonName,
  operatorName,
  supplierMatchResults,
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
  suppliers,
}: OrderListProps) {
  const customerName = customers.find((c) => c.code === selectedCustomer)?.name;

  return (
    <div className="space-y-2">
      {orders.map((order, index) => (
        <OrderCard
          key={order.id}
          order={order}
          index={index}
          selectedCustomerName={customerName}
          salespersonName={salespersonName}
          operatorName={operatorName}
          supplierMatchResults={supplierMatchResults[order.id] || { availableSuppliers: [] }}
          suppliers={suppliers}
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
        />
      ))}
    </div>
  );
}
