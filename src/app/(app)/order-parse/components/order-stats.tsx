'use client';

import type { ParseStats } from '../hooks/use-order-parse-session';
import { Check, Package, Building2, AlertTriangle, FileSpreadsheet, Clock, BarChart3, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface OrderStatsProps {
  stats: ParseStats | null;
}

export function OrderStats({ stats }: OrderStatsProps) {
  if (!stats) return null;

  const hasUnrecognized = (stats.unrecognizedHeaders?.length || 0) > 0;
  const hasConflicts = (stats.conflictFields?.length || 0) > 0;

  return (
    <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">解析统计</span>
        </div>
        <Badge variant="outline" className="bg-white">
          共 {stats.totalItems} 个商品
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <Check className="h-3 w-3 text-green-500" />
          <span className="text-muted-foreground">已匹配商品:</span>
          <span className="font-medium text-green-600">{stats.matchedItems}</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <Package className="h-3 w-3 text-orange-500" />
          <span className="text-muted-foreground">未匹配商品:</span>
          <span className="font-medium text-orange-600">{stats.unmatchedItems}</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <Building2 className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">有库存:</span>
          <span className="font-medium text-blue-600">{stats.ordersWithSupplier}</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <AlertTriangle className="h-3 w-3 text-red-500" />
          <span className="text-muted-foreground">无库存:</span>
          <span className="font-medium text-red-600">{stats.ordersWithoutSupplier}</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <FileSpreadsheet className="h-3 w-3 text-blue-500" />
          <span className="text-muted-foreground">识别列:</span>
          <span className="font-medium text-blue-600">{stats.recognizedFieldCount ?? 0}</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <Clock className="h-3 w-3 text-slate-500" />
          <span className="text-muted-foreground">扩展列:</span>
          <span className="font-medium text-slate-600">{stats.extensionColumnCount ?? 0}</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <BarChart3 className="h-3 w-3 text-emerald-500" />
          <span className="text-muted-foreground">映射命中率:</span>
          <span className="font-medium text-emerald-600">{stats.coverageRate ?? 0}%</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
          <Eye className="h-3 w-3 text-violet-500" />
          <span className="text-muted-foreground">有效表头:</span>
          <span className="font-medium text-violet-600">{stats.nonEmptyHeaderCount ?? 0}</span>
        </div>
      </div>

      {(hasUnrecognized || hasConflicts) && (
        <div className="mt-2 space-y-2 text-xs">
          {hasUnrecognized && (
            <div className="rounded bg-white px-2 py-2">
              <div className="mb-1 flex items-center gap-1 text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">未识别表头</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.unrecognizedHeaders?.slice(0, 8).map((header) => (
                  <Badge key={header} variant="outline" className="bg-amber-50 text-amber-700">
                    {header}
                  </Badge>
                ))}
                {(stats.unrecognizedHeaders?.length || 0) > 8 && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700">
                    +{(stats.unrecognizedHeaders?.length || 0) - 8}
                  </Badge>
                )}
              </div>
            </div>
          )}
          {hasConflicts && (
            <div className="rounded bg-white px-2 py-2">
              <div className="mb-1 flex items-center gap-1 text-red-700">
                <AlertTriangle className="h-3 w-3" />
                <span className="font-medium">冲突字段</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {stats.conflictFields?.map((field) => (
                  <Badge key={field} variant="outline" className="bg-red-50 text-red-700">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
