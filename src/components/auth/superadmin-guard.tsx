'use client';

import { type ReactNode } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX } from 'lucide-react';

export function SuperadminGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user?.isSuperadmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>需要平台管理员权限</CardTitle>
            <CardDescription>此页面仅平台超级管理员可访问</CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-muted-foreground">
            请联系平台管理员获取权限
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
