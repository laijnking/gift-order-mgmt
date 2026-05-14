'use client';

import { Building2, Check, ChevronsUpDown } from 'lucide-react';
import { useTenant, type Tenant } from '@/hooks/use-tenant';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function TenantSelector() {
  const { user } = useAuth();
  const { currentTenant, setCurrentTenant } = useTenant();
  const tenants = user?.tenants || [];

  if (!user || tenants.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between" size="sm">
          <span className="flex items-center gap-2 truncate">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="truncate">{currentTenant?.name || '选择租户'}</span>
          </span>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-52">
        <DropdownMenuLabel>切换租户</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((tenant: Tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => setCurrentTenant(tenant)}
            className="flex items-center justify-between"
          >
            <span className="truncate">{tenant.name}</span>
            {currentTenant?.id === tenant.id && (
              <Check className="h-4 w-4 shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
