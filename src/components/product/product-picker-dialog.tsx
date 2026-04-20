'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { buildUserInfoHeaders } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { Search, Package, X, Loader2 } from 'lucide-react';

export interface ProductPickerItem {
  id: string;
  code: string;
  name: string;
  brand?: string;
  spec?: string;
  category?: string;
  unit?: string;
  barcode?: string;
}

interface ProductPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (product: ProductPickerItem | null) => void;
  title?: string;
}

export function ProductPickerDialog({
  open,
  onOpenChange,
  onSelect,
  title = '选择系统商品',
}: ProductPickerDialogProps) {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<ProductPickerItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 防抖搜索
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 搜索商品
  const fetchProducts = useCallback(async (keyword: string) => {
    setLoading(true);
    try {
      const headers = await buildUserInfoHeaders();
      const params = new URLSearchParams();
      if (keyword) params.set('search', keyword);
      params.set('isActive', 'true');

      const res = await fetch(`/api/products?${params.toString()}`, { headers });
      if (!res.ok) throw new Error('获取商品失败');
      const data = await res.json();
      setProducts(data.data || []);
      setSelectedIndex(0);
    } catch (err) {
      console.error('搜索商品失败:', err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchProducts(debouncedSearch);
    }
  }, [open, debouncedSearch, fetchProducts]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, products.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && products.length > 0) {
      e.preventDefault();
      onSelect(products[selectedIndex]);
      handleClose();
    }
  };

  const handleClose = () => {
    setSearch('');
    setProducts([]);
    setSelectedIndex(0);
    onOpenChange(false);
  };

  const handleSelect = (product: ProductPickerItem) => {
    onSelect(product);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="输入商品名称或编码搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-9"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 搜索结果 */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              {debouncedSearch ? '未找到匹配的商品' : '请输入关键词搜索商品'}
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1 p-1">
                {products.map((product, index) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelect(product)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-colors',
                      'hover:bg-accent hover:border-accent',
                      index === selectedIndex
                        ? 'bg-accent border-accent'
                        : 'border-transparent'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{product.name}</span>
                          {product.brand && (
                            <Badge variant="outline" className="text-[10px] py-0">
                              {product.brand}
                            </Badge>
                          )}
                          {product.category && (
                            <Badge variant="secondary" className="text-[10px] py-0">
                              {product.category}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span>
                            编码:{' '}
                            <code className="text-foreground font-mono">{product.code}</code>
                          </span>
                          {product.spec && (
                            <span>规格: {product.spec}</span>
                          )}
                          {product.barcode && (
                            <span>条码: {product.barcode}</span>
                          )}
                        </div>
                      </div>
                      <Package className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* 底部提示 */}
        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          支持按编码或名称搜索 · Enter 确认 · ↑↓ 切换选项
        </div>
      </DialogContent>
    </Dialog>
  );
}
