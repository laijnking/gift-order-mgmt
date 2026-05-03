'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { QuickAction } from './types';

export interface QuickActionGridProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionGrid({ actions, className }: QuickActionGridProps) {
  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              'group flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
              'border border-slate-100 hover:border-slate-200 hover:shadow-sm',
              action.color
            )}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-2 transition-transform duration-200 group-hover:scale-105">
              <Icon className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium text-slate-700">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

// ============================================================
// 紧凑版快捷操作 - 小图标
// ============================================================

export interface QuickActionCompactProps {
  actions: QuickAction[];
  className?: string;
}

export function QuickActionCompact({ actions, className }: QuickActionCompactProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <Link
            key={action.id}
            href={action.href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
              'border border-slate-100 hover:border-slate-200 hover:bg-slate-50',
              'transition-all duration-200'
            )}
          >
            <Icon className="w-4 h-4 text-slate-500" />
            <span className="text-slate-700">{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
