'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RecentOrder } from './types';
import { Badge } from '@/components/ui/badge';
import { Clock, ExternalLink } from 'lucide-react';

export interface RecentOrdersProps {
  orders: RecentOrder[];
  className?: string;
}

function getStatusConfig(status: string) {
  const configMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className: string }> = {
    pending: { label: '待派发', variant: 'secondary', className: 'bg-amber-100 text-amber-800 hover:bg-amber-100' },
    assigned: { label: '已派发', variant: 'secondary', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
    partialReturned: { label: '部分回单', variant: 'secondary', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
    returned: { label: '已回单', variant: 'secondary', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
    feedbacked: { label: '已反馈', variant: 'secondary', className: 'bg-teal-100 text-teal-800 hover:bg-teal-100' },
    completed: { label: '已导金蝶', variant: 'secondary', className: 'bg-slate-100 text-slate-600 hover:bg-slate-100' },
    cancelled: { label: '已取消', variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  };

  return configMap[status] || { label: status, variant: 'secondary' as const, className: 'bg-slate-100 text-slate-600' };
}

export function RecentOrders({ orders, className }: RecentOrdersProps) {
  if (orders.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-slate-400', className)}>
        <Clock className="w-12 h-12 mb-3 opacity-50" />
        <p className="text-sm">暂无最近订单</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {orders.slice(0, 8).map((order) => {
        const statusConfig = getStatusConfig(order.status);

        return (
          <Link
            key={order.id}
            href={`/orders?search=${encodeURIComponent(order.sysOrderNo || order.orderNo)}`}
            className={cn(
              'group flex items-center gap-3 p-3 rounded-lg',
              'border border-transparent hover:border-slate-100 hover:bg-slate-50',
              'transition-all duration-150'
            )}
          >
            {/* 订单号 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-900 truncate">
                  {order.sysOrderNo || order.orderNo}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {order.customerName && (
                <p className="text-xs text-slate-500 truncate mt-0.5">
                  {order.customerName}
                </p>
              )}
            </div>

            {/* 时间 */}
            <div className="text-xs text-slate-400 whitespace-nowrap">
              {new Date(order.createdAt).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {/* 状态 */}
            <Badge
              variant={statusConfig.variant}
              className={cn('text-xs whitespace-nowrap shrink-0', statusConfig.className)}
            >
              {statusConfig.label}
            </Badge>
          </Link>
        );
      })}

      {/* 查看更多 */}
      <Link
        href="/orders"
        className={cn(
          'flex items-center justify-center gap-2 p-3 rounded-lg',
          'text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-50',
          'transition-colors duration-150 border border-dashed border-slate-200'
        )}
      >
        查看全部订单
      </Link>
    </div>
  );
}
