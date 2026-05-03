'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatNumber } from './types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  label: string;
  value: number | string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  href?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const colorClasses = {
  primary: {
    border: 'border-t-primary',
    bg: 'bg-gradient-to-br from-blue-600 to-blue-500',
    icon: 'bg-white/20',
    text: 'text-white',
    trendUp: 'bg-emerald-400 text-emerald-900',
    trendDown: 'bg-red-400 text-red-900',
  },
  success: {
    border: 'border-t-emerald-500',
    bg: 'bg-gradient-to-br from-emerald-600 to-emerald-500',
    icon: 'bg-white/20',
    text: 'text-white',
    trendUp: 'bg-emerald-400 text-emerald-900',
    trendDown: 'bg-red-400 text-red-900',
  },
  warning: {
    border: 'border-t-amber-500',
    bg: 'bg-gradient-to-br from-amber-500 to-amber-400',
    icon: 'bg-white/20',
    text: 'text-white',
    trendUp: 'bg-emerald-400 text-emerald-900',
    trendDown: 'bg-red-400 text-red-900',
  },
  danger: {
    border: 'border-t-red-500',
    bg: 'bg-gradient-to-br from-red-600 to-red-500',
    icon: 'bg-white/20',
    text: 'text-white',
    trendUp: 'bg-emerald-400 text-emerald-900',
    trendDown: 'bg-red-400 text-red-900',
  },
};

export function MetricCard({
  label,
  value,
  trend,
  icon,
  href,
  color = 'primary',
  className,
}: MetricCardProps) {
  const colors = colorClasses[color];

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border-t-4 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
        colors.border,
        className
      )}
    >
      {/* 装饰性圆形 */}
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-white/10 to-transparent" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-gradient-to-tr from-white/5 to-transparent" />

      <div className="relative z-10">
        {/* 标签行 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500">{label}</span>
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', colors.icon)}>
            {icon}
          </div>
        </div>

        {/* 数值 */}
        <div className={cn('text-3xl font-bold tabular-nums tracking-tight mb-2', colors.text)}>
          {typeof value === 'number' ? formatNumber(value) : value}
        </div>

        {/* 趋势指示 */}
        {trend && (
          <div className="flex items-center gap-1">
            {trend.direction === 'up' && (
              <span className="flex items-center gap-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" />
                +{trend.value}%
              </span>
            )}
            {trend.direction === 'down' && (
              <span className="flex items-center gap-0.5 text-xs font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                <TrendingDown className="w-3 h-3" />
                {trend.value}%
              </span>
            )}
            {trend.direction === 'neutral' && (
              <span className="flex items-center gap-0.5 text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                <Minus className="w-3 h-3" />
                {trend.value}%
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

// ============================================================
// 指标条组件 - 横向排列多个指标
// ============================================================

export interface MetricStripProps {
  metrics: MetricCardProps[];
  className?: string;
}

export function MetricStrip({ metrics, className }: MetricStripProps) {
  return (
    <div className={cn('flex gap-4 overflow-x-auto pb-2 -mx-1 px-1', className)}>
      {metrics.map((metric, index) => (
        <div key={index} className="flex-shrink-0 min-w-[160px]">
          <MetricCard {...metric} />
        </div>
      ))}
    </div>
  );
}
