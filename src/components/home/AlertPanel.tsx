'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AlertItem } from './types';
import { AlertTriangle, Package, Clock, ArrowRight } from 'lucide-react';

export interface AlertPanelProps {
  alerts: AlertItem[];
  className?: string;
}

function getAlertIcon(type: AlertItem['type']) {
  switch (type) {
    case 'stock':
      return Package;
    case 'timeout':
      return Clock;
    case 'pending':
      return AlertTriangle;
    default:
      return AlertTriangle;
  }
}

function getAlertColor(type: AlertItem['type']) {
  switch (type) {
    case 'stock':
      return {
        bg: 'bg-amber-50 border-amber-200',
        icon: 'text-amber-500',
        badge: 'bg-amber-100 text-amber-700',
      };
    case 'timeout':
      return {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-500',
        badge: 'bg-red-100 text-red-700',
      };
    case 'pending':
      return {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-500',
        badge: 'bg-blue-100 text-blue-700',
      };
    default:
      return {
        bg: 'bg-slate-50 border-slate-200',
        icon: 'text-slate-500',
        badge: 'bg-slate-100 text-slate-700',
      };
  }
}

export function AlertPanel({ alerts, className }: AlertPanelProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-slate-400', className)}>
        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
          <svg className="w-6 h-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm">暂无预警信息</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {alerts.map((alert) => {
        const Icon = getAlertIcon(alert.type);
        const colors = getAlertColor(alert.type);

        return (
          <Link
            key={alert.id}
            href={alert.actionHref}
            className={cn(
              'group flex items-start gap-3 p-3 rounded-lg',
              'border transition-all duration-150 hover:shadow-sm',
              colors.bg
            )}
          >
            {/* 图标 */}
            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', colors.icon)}>
              <Icon className="w-4 h-4" />
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-slate-900">{alert.title}</span>
                {alert.count !== undefined && alert.count > 0 && (
                  <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded', colors.badge)}>
                    {alert.count}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{alert.description}</p>
            </div>

            {/* 箭头 */}
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 mt-1" />
          </Link>
        );
      })}
    </div>
  );
}

// ============================================================
// 预警统计汇总
// ============================================================

export interface AlertSummaryProps {
  alerts: AlertItem[];
  className?: string;
}

export function AlertSummary({ alerts, className }: AlertSummaryProps) {
  const stockCount = alerts.filter((a) => a.type === 'stock').reduce((sum, a) => sum + (a.count || 0), 0);
  const timeoutCount = alerts.filter((a) => a.type === 'timeout').reduce((sum, a) => sum + (a.count || 0), 0);
  const pendingCount = alerts.filter((a) => a.type === 'pending').reduce((sum, a) => sum + (a.count || 0), 0);

  return (
    <div className={cn('flex gap-3', className)}>
      {stockCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200">
          <Package className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-xs font-medium text-amber-700">{stockCount} 库存预警</span>
        </div>
      )}
      {timeoutCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 border border-red-200">
          <Clock className="w-3.5 h-3.5 text-red-500" />
          <span className="text-xs font-medium text-red-700">{timeoutCount} 超时订单</span>
        </div>
      )}
      {pendingCount > 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200">
          <AlertTriangle className="w-3.5 h-3.5 text-blue-500" />
          <span className="text-xs font-medium text-blue-700">{pendingCount} 待处理</span>
        </div>
      )}
      {alerts.length === 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200">
          <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs font-medium text-emerald-700">一切正常</span>
        </div>
      )}
    </div>
  );
}
