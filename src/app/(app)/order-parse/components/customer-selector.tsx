'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { buildUserInfoHeaders } from '@/lib/auth';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, Store, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserDisplayName, isOperatorAssignableRole, isSalesAssignableRole } from '@/lib/roles';

export interface UserInfo {
  id: string;
  username: string;
  realName?: string;
  name?: string;
  role: string;
}

interface Customer {
  code: string;
  name: string;
  salesUserId?: string;
  salesUserName?: string;
  operatorUserId?: string;
  operatorUserName?: string;
}

interface CustomerSelectorProps {
  customers: Customer[];
  selectedCustomer: string;
  users: UserInfo[];
  salespersonId: string;
  salespersonName: string;
  operatorId: string;
  operatorName: string;
  activeMappingMeta?: {
    version: number;
    header_fingerprint?: string;
    template_signature?: string;
    source_headers?: string[];
  } | null;
  currentPreviewHeaders: string[];
  activeMappingHeaders: string[];
  isCurrentHeaderAlignedWithActiveMapping: boolean;
  onCustomerChange: (code: string, customer: Customer) => void;
  onSalespersonChange: (id: string, name: string) => void;
  onOperatorChange: (id: string, name: string) => void;
  onSaveMapping: () => void;
}

export function CustomerSelector({
  customers,
  selectedCustomer,
  users,
  salespersonId,
  salespersonName,
  operatorId,
  operatorName,
  activeMappingMeta,
  currentPreviewHeaders,
  activeMappingHeaders,
  isCurrentHeaderAlignedWithActiveMapping,
  onCustomerChange,
  onSalespersonChange,
  onOperatorChange,
  onSaveMapping,
}: CustomerSelectorProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // 服务端搜索（防抖 300ms）
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!search.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}&isActive=false&pageSize=50`, {
          headers: buildUserInfoHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          setSearchResults((data.data || []).filter((c: Customer) => !!(String(c.code ?? '').trim() && String(c.name ?? '').trim())));
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  const salesUsers = users.filter((u) => isSalesAssignableRole(u.role));
  const operatorUsers = users.filter((u) => isOperatorAssignableRole(u.role));

  return (
    <div className="grid gap-2">
      <Label className="text-sm font-medium flex items-center gap-1">
        <Store className="h-3.5 w-3.5" />
        关联客户 <span className="text-red-500">*</span>
      </Label>

      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              'w-full justify-start text-left font-normal h-10',
              !selectedCustomer && 'text-muted-foreground',
              !selectedCustomer && 'border-red-300 bg-red-50'
            )}
          >
            {selectedCustomer ? (
              <span className="truncate">
                {customers.find((c) => c.code === selectedCustomer)?.name ||
                 searchResults.find((c) => c.code === selectedCustomer)?.name ||
                 selectedCustomer}
              </span>
            ) : (
              <span className="truncate">请搜索并选择客户...</span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0" align="start">
          <div className="p-2 border-b">
            <Input
              placeholder="输入客户名称或编码搜索..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="p-1 max-h-[300px] overflow-y-auto">
            {search.trim()
              ? (searchLoading
                  ? <div className="px-3 py-6 text-center text-sm text-muted-foreground">搜索中...</div>
                  : searchResults.length === 0
                    ? <div className="px-3 py-6 text-center text-sm text-muted-foreground">未找到匹配的客户</div>
                    : searchResults.map((c) => (
                        <button
                          key={c.code}
                          onClick={() => {
                            onCustomerChange(c.code, c);
                            setSearch('');
                            setSearchOpen(false);
                          }}
                          className={cn(
                            'w-full text-left px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer truncate',
                            selectedCustomer === c.code && 'bg-primary/10 text-primary'
                          )}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium truncate">{c.name}</span>
                            <span className="text-xs text-muted-foreground">编码: {c.code}</span>
                          </div>
                        </button>
                      ))
                )
              : customers.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => {
                      onCustomerChange(c.code, c);
                      setSearch('');
                      setSearchOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm rounded hover:bg-muted cursor-pointer truncate',
                      selectedCustomer === c.code && 'bg-primary/10 text-primary'
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium truncate">{c.name}</span>
                      <span className="text-xs text-muted-foreground">编码: {c.code}</span>
                    </div>
                  </button>
                ))
            }
          </div>
        </PopoverContent>
      </Popover>

      {selectedCustomer && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">业务员</Label>
            <Select
              value={salespersonId || (salespersonName ? `__name__${salespersonName}` : '__empty__')}
              onValueChange={(v) => {
                if (v === '__empty__') {
                  onSalespersonChange('', '');
                } else if (v.startsWith('__name__')) {
                  onSalespersonChange('', v.replace('__name__', ''));
                } else {
                  const user = users.find((u) => u.id === v);
                  onSalespersonChange(v, getUserDisplayName(user));
                }
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="选择业务员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty__">-- 不选择 --</SelectItem>
                {salesUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {getUserDisplayName(u)}
                  </SelectItem>
                ))}
                {salespersonName &&
                  !users.find(
                    (u) =>
                      u.id === salespersonId ||
                      u.realName === salespersonName ||
                      u.username === salespersonName
                  ) && (
                    <SelectItem value={`__name__${salespersonName}`}>
                      {salespersonName} (客户档案)
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">跟单员</Label>
            <Select
              value={operatorId || (operatorName ? `__name__${operatorName}` : '__empty__')}
              onValueChange={(v) => {
                if (v === '__empty__') {
                  onOperatorChange('', '');
                } else if (v.startsWith('__name__')) {
                  onOperatorChange('', v.replace('__name__', ''));
                } else {
                  const user = users.find((u) => u.id === v);
                  onOperatorChange(v, getUserDisplayName(user));
                }
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="选择跟单员" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__empty__">-- 不选择 --</SelectItem>
                {operatorUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {getUserDisplayName(u)}
                  </SelectItem>
                ))}
                {operatorName &&
                  !users.find(
                    (u) =>
                      u.id === operatorId ||
                      u.realName === operatorName ||
                      u.username === operatorName
                  ) && (
                    <SelectItem value={`__name__${operatorName}`}>
                      {operatorName} (客户档案)
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {selectedCustomer && activeMappingMeta && (
        <div className="rounded-md border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">当前映射 v{activeMappingMeta.version}</Badge>
            {activeMappingMeta.header_fingerprint && (
              <Badge variant="outline">表头指纹 {activeMappingMeta.header_fingerprint}</Badge>
            )}
            {activeMappingMeta.template_signature && (
              <Badge variant="outline">模板签名 {activeMappingMeta.template_signature}</Badge>
            )}
          </div>
          {currentPreviewHeaders.length > 0 && activeMappingHeaders.length > 0 && (
            <p className="mt-2">
              当前表头匹配状态：
              <span
                className={cn(
                  'ml-1 font-medium',
                  isCurrentHeaderAlignedWithActiveMapping ? 'text-green-600' : 'text-orange-600'
                )}
              >
                {isCurrentHeaderAlignedWithActiveMapping
                  ? '与已保存版本一致'
                  : '与已保存版本存在差异'}
              </span>
            </p>
          )}
        </div>
      )}

      {selectedCustomer && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-full text-xs"
          onClick={onSaveMapping}
        >
          <Save className="h-3 w-3 mr-1" />
          保存当前映射配置
        </Button>
      )}
    </div>
  );
}
