'use client';

import { useCallback, useState } from 'react';
import { buildUserInfoHeaders } from '@/lib/auth';
import type { ParsedOrder } from './use-order-parse-session';

export interface DuplicateDetail {
  orderNo: string;
  receiverName: string;
  reason: 'batch_duplicate' | 'existing_order' | 'fuzzy_match';
  existingSysOrderNo?: string;
}

export interface DuplicateSummary {
  totalSkipped: number;
  batchDuplicateCount: number;
  existingDuplicateCount: number;
  fuzzyDuplicateCount?: number;
  details: DuplicateDetail[];
}

export interface MatchStatsSummary {
  total: number;
  bySpec: number;
  byName: number;
  byMapping: number;
  none: number;
  matched: number;
  matchRate: string;
}

export interface ImportResult {
  open: boolean;
  success: boolean;
  total: number;
  importBatch: string;
  sysOrderNos: string[];
  message: string;
  customerName?: string;
  duplicateSummary?: DuplicateSummary;
  matchStats?: MatchStatsSummary;
  skipExisting?: boolean;
}

export interface SubmitOptions {
  customerCode: string;
  customerName: string;
  salespersonId: string;
  salespersonName: string;
  operatorId: string;
  operatorName: string;
  columnMapping: Record<string, string>;
  headerRow: number;
  excelPreview: string[][];
  skipMappingSave?: boolean;
  skipExisting?: boolean;
  onSuccess: (result: ImportResult) => void;
  onError: (message: string) => void;
  onFinally: () => void;
}

export function useOrderSubmit() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitOrders = useCallback(async (orders: ParsedOrder[], options: SubmitOptions) => {
    setIsSubmitting(true);

    const selectedOrders = orders.filter((o) => o.selected && o.product_name?.trim());

    const orderData = {
      skipExisting: options.skipExisting || false,
      customerCode: options.customerCode,
      customerName: options.customerName,
      salespersonId: options.salespersonId || '',
      salespersonName: options.salespersonName || selectedOrders[0]?.salesperson || '',
      operatorId: options.operatorId || '',
      operatorName: options.operatorName || selectedOrders[0]?.operator || '',
      items: selectedOrders.map((o) => {
        const price = o.price ?? (o.customerPrice as number) ?? 0;
        return {
          orderNo: o.orderNo || o.customerOrderNo || o.billNo || '',
          customerOrderNo: o.customerOrderNo || o.orderNo || '',
          billNo: o.billNo || '',
          billDate: o.billDate || '',
          supplierOrderNo: o.supplierOrderNo || '',
          productName: o.product_name,
          productCode: o.product_code || '',
          productSpec: o.product_spec || '',
          systemProductCode: o.mappedProductCode as string || '',
          systemProductName: o.mappedProductName as string || '',
          systemProductSpec: o.mappedProductSpec as string || '',
          systemProductBrand: o.mappedProductBrand as string || '',
          systemProductId: o.systemProductId as string || '',
          quantity: o.quantity,
          price,
          amount: o.amount ?? null,
          discount: o.discount as number ?? null,
          taxRate: o.taxRate as number ?? null,
          warehouse: o.warehouse as string ?? null,
          remark: o.remark ?? '',
          supplierId: o.supplierId as string || '',
          supplierName: o.supplierName as string || '',
          receiver_name: o.receiver_name || '',
          receiver_phone: o.receiver_phone || '',
          receiver_address: o.receiver_address || '',
          express_company: o.express_company ?? null,
          tracking_no: o.tracking_no ?? null,
          invoice_required: o.invoice_required ?? null,
          income_name: o.income_name ?? null,
          income_amount: o.income_amount ?? null,
          salespersonId: o.salespersonId as string || '',
          salesperson: o.salesperson ?? '',
          operatorId: o.operatorId as string || '',
          operator: o.operator ?? '',
          extFields: o.extFields as Record<string, string> || {},
          channel_remark: o.channel_remark ?? null,
          suggested_shipper: o.suggested_shipper ?? null,
          original_status: o.original_status ?? null,
        };
      }),
    };

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.success) {
        const sysOrderNos = ((data.data as Array<Record<string, unknown>>) || [])
          .map((o) => o.sys_order_no as string)
          .filter(Boolean);
        const createdCount = data.total || 0;
        const skippedCount = data.duplicateSummary?.totalSkipped || 0;

        if (createdCount === 0 && skippedCount > 0) {
          options.onError(`所选订单均已在系统中存在，共 ${skippedCount} 条，无法重复录入`);
          return;
        }

        // Auto-save mapping after successful submit (only if mapping changed)
        if (options.customerCode && Object.keys(options.columnMapping).length > 0 && !options.skipMappingSave) {
          fetch('/api/column-mappings', {
            method: 'POST',
            headers: {
              ...buildUserInfoHeaders(),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              customerCode: options.customerCode,
              mappingConfig: options.columnMapping,
              headerRow: options.headerRow,
              sourceHeaders: (options.excelPreview[options.headerRow] || []) as string[],
              feedbackExportHeaderOverrides: {},
            }),
          }).catch((err) => console.warn('自动保存映射失败:', err));
        }

        options.onSuccess({
          open: true,
          success: true,
          total: createdCount,
          importBatch: data.importBatch || '',
          sysOrderNos,
          message: data.message || `成功创建 ${createdCount} 条订单`,
          customerName: options.customerName || options.customerCode,
          duplicateSummary: data.duplicateSummary,
          matchStats: data.matchStats,
          skipExisting: options.skipExisting || false,
        });
      } else {
        options.onError(data.error || '创建订单失败');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      options.onError('创建订单失败');
    } finally {
      setIsSubmitting(false);
      options.onFinally();
    }
  }, []);

  return { isSubmitting, submitOrders };
}
