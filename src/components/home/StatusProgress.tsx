'use client';

import { cn } from '@/lib/utils';
import { StatusItem, calculatePercentage } from './types';

export interface StatusProgressProps {
  items: StatusItem[];
  total: number;
  className?: string;
}

export function StatusProgress({ items, total, className }: StatusProgressProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => {
        const percentage = parseFloat(calculatePercentage(item.count, total));
        const isActive = item.count > 0;

        return (
          <div key={item.key} className="flex items-center gap-3">
            {/* 标签 */}
            <span className="w-16 text-sm text-slate-600 flex-shrink-0">
              {item.label}
            </span>

            {/* 进度条 */}
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: item.color,
                  opacity: isActive ? 1 : 0.3,
                }}
              />
            </div>

            {/* 数量 */}
            <span className="w-12 text-right text-sm font-medium text-slate-700 tabular-nums">
              {item.count}
            </span>

            {/* 百分比 */}
            <span className="w-12 text-right text-xs text-slate-400 tabular-nums">
              {percentage.toFixed(0)}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// 状态概览卡片 - 紧凑显示
// ============================================================

export interface StatusOverviewCardProps {
  pending: number;
  assigned: number;
  returned: number;
  completed: number;
  className?: string;
}

export function StatusOverviewCard({
  pending,
  assigned,
  returned,
  completed,
  className,
}: StatusOverviewCardProps) {
  const total = pending + assigned + returned + completed;

  const items: StatusItem[] = [
    { key: 'pending', label: '待派发', count: pending, color: '#F59E0B' },
    { key: 'assigned', label: '已派发', count: assigned, color: '#3B82F6' },
    { key: 'returned', label: '已回单', count: returned, color: '#10B981' },
    { key: 'completed', label: '已完成', count: completed, color: '#6B7280' },
  ];

  return (
    <div className={cn('space-y-3', className)}>
      {/* 迷你进度条 */}
      <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
        {items.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div
              key={item.key}
              className="h-full transition-all duration-500"
              style={{
                width: `${percentage}%`,
                backgroundColor: item.color,
              }}
            />
          );
        })}
      </div>

      {/* 状态列表 */}
      <StatusProgress items={items} total={total} />
    </div>
  );
}
