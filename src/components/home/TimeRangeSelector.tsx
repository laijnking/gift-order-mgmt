'use client';

import { cn } from '@/lib/utils';
import { TimeRange } from './types';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange) => void;
  className?: string;
}

const timeRangeOptions: { key: TimeRange; label: string }[] = [
  { key: 'today', label: '今日' },
  { key: '7d', label: '近7天' },
  { key: '30d', label: '近30天' },
  { key: '90d', label: '近90天' },
];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  return (
    <div className={cn('flex items-center gap-1 p-1 bg-slate-100 rounded-lg', className)}>
      {timeRangeOptions.map((option) => (
        <Button
          key={option.key}
          variant="ghost"
          size="sm"
          onClick={() => onChange(option.key)}
          className={cn(
            'h-8 px-3 text-sm font-medium rounded-md transition-all',
            value === option.key
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          )}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

// ============================================================
// 带图标的时间范围选择器
// ============================================================

export interface TimeRangeSelectorWithIconProps extends TimeRangeSelectorProps {
  showIcon?: boolean;
}

export function TimeRangeSelectorWithIcon({
  value,
  onChange,
  className,
  showIcon = true,
}: TimeRangeSelectorWithIconProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {showIcon && <Calendar className="w-4 h-4 text-slate-400" />}
      <TimeRangeSelector value={value} onChange={onChange} />
    </div>
  );
}
