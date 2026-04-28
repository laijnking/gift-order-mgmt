'use client';

import { useCallback, useState } from 'react';
import { buildUserInfoHeaders } from '@/lib/auth';
import type { ParsedOrder } from './use-order-parse-session';
import type { SupplierMatchResult } from './use-order-parse-session';

export interface MatchAPIItem {
  orderId: string;
  allSupplierOptions?: Array<{
    supplierId: string;
    supplierName: string;
    supplierType?: string;
    province?: string;
    provinceMatch?: string;
    productCode: string;
    productName: string;
    quantity: number;
    price: number;
    historyCost?: number | null;
    hasStock?: boolean;
  }>;
  hasStockForProduct?: boolean;
  newProductHint?: string;
  recommendedSupplier?: { id: string };
  warning?: string;
}

export function useSupplierMatcher() {
  const [isMatching, setIsMatching] = useState(false);
  const [matchingOrderId, setMatchingOrderId] = useState<string | null>(null);

  const matchSingle = useCallback(
    async (
      orderId: string,
      orders: ParsedOrder[],
      onResults: (orderId: string, results: SupplierMatchResult) => void,
      onRecommended: (orderId: string, supplierId: string) => void,
      onHint: (message: string) => void,
      onWarning: (message: string) => void,
      onError: (message: string) => void
    ) => {
      setIsMatching(true);
      setMatchingOrderId(orderId);
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: {
            ...buildUserInfoHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orders: orders.filter((o) => o.id === orderId),
          }),
        });
        const data = await res.json();

        if (data.success && data.data && data.data.length > 0) {
          const item = data.data[0] as MatchAPIItem;
          const result: SupplierMatchResult = {
            availableSuppliers: item.allSupplierOptions || [],
            hasStockForProduct: item.hasStockForProduct,
            newProductHint: item.newProductHint,
            recommendedSupplierId: item.recommendedSupplier?.id,
          };
          onResults(orderId, result);

          if (item.recommendedSupplier) {
            onRecommended(orderId, item.recommendedSupplier.id);
          } else if (item.allSupplierOptions && item.allSupplierOptions.length > 0) {
            // 没有推荐发货方但有候选发货方时，自动选中第一个
            onRecommended(orderId, item.allSupplierOptions[0].supplierId);
          }
          if (item.newProductHint) {
            onHint(item.newProductHint);
          } else if (item.warning) {
            onWarning(item.warning);
          }
        } else {
          onError(data.error || '匹配失败');
        }
      } catch {
        onError('匹配请求失败');
      } finally {
        setIsMatching(false);
        setMatchingOrderId(null);
      }
    },
    []
  );

  const matchBatch = useCallback(
    async (
      orders: ParsedOrder[],
      onResults: (newResults: Record<string, SupplierMatchResult>) => void,
      onRecommended: (orderId: string, supplierId: string) => void,
      onError: (message: string) => void
    ) => {
      setIsMatching(true);
      try {
        const res = await fetch('/api/match', {
          method: 'POST',
          headers: {
            ...buildUserInfoHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ orders }),
        });
        const data = await res.json();

        if (data.success) {
          const newResults: Record<string, SupplierMatchResult> = {};
          for (const item of data.data as MatchAPIItem[]) {
            newResults[item.orderId] = {
              availableSuppliers: item.allSupplierOptions || [],
              hasStockForProduct: item.hasStockForProduct,
              newProductHint: item.newProductHint,
              recommendedSupplierId: item.recommendedSupplier?.id,
            };
            if (item.recommendedSupplier) {
              onRecommended(item.orderId, item.recommendedSupplier.id);
            } else if (item.allSupplierOptions && item.allSupplierOptions.length > 0) {
              // 没有推荐发货方但有候选发货方时，自动选中第一个
              onRecommended(item.orderId, item.allSupplierOptions[0].supplierId);
            }
          }
          onResults(newResults);
        } else {
          onError(data.error || '批量匹配失败');
        }
      } catch {
        onError('批量匹配请求失败');
      } finally {
        setIsMatching(false);
      }
    },
    []
  );

  return {
    isMatching,
    matchingOrderId,
    matchSingle,
    matchBatch,
  };
}
