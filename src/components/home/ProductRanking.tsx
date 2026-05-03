'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductRankingItem, formatNumber } from './types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface ProductRankingProps {
  products: ProductRankingItem[];
  className?: string;
}

const rankColors = [
  'bg-gradient-to-r from-amber-400 to-amber-500 text-white',
  'bg-gradient-to-r from-slate-400 to-slate-500 text-white',
  'bg-gradient-to-r from-orange-400 to-orange-500 text-white',
  'bg-gradient-to-r from-blue-400 to-blue-500 text-white',
  'bg-gradient-to-r from-purple-400 to-purple-500 text-white',
];

export function ProductRanking({ products, className }: ProductRankingProps) {
  if (products.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-slate-400', className)}>
        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-sm">暂无商品排行</p>
      </div>
    );
  }

  const maxCount = products[0]?.orderCount || 1;

  return (
    <div className={cn('space-y-3', className)}>
      {products.map((product, index) => {
        const percentage = (product.orderCount / maxCount) * 100;
        const TrendIcon = product.trend === 'up' ? TrendingUp : product.trend === 'down' ? TrendingDown : Minus;

        return (
          <div key={product.name} className="space-y-1.5">
            {/* 标题行 */}
            <div className="flex items-center gap-2">
              {/* 排名 */}
              <span
                className={cn(
                  'w-6 h-6 rounded flex items-center justify-center text-xs font-bold',
                  rankColors[index % rankColors.length]
                )}
              >
                {product.rank}
              </span>

              {/* 商品名称 */}
              <span className="flex-1 text-sm font-medium text-slate-700 truncate" title={product.name}>
                {product.name}
              </span>

              {/* 订单数 */}
              <span className="text-sm font-semibold text-slate-900 tabular-nums">
                {formatNumber(product.orderCount)}
              </span>

              {/* 趋势 */}
              {product.trend !== 'neutral' && (
                <TrendIcon
                  className={cn(
                    'w-4 h-4',
                    product.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                  )}
                />
              )}
            </div>

            {/* 进度条 */}
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden ml-8">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  index === 0 ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                  index === 1 ? 'bg-gradient-to-r from-slate-400 to-slate-500' :
                  index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-500' :
                  index === 3 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                  'bg-gradient-to-r from-purple-400 to-purple-500'
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
