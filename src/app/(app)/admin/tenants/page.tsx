'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export default function AdminTenantsPage() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">租户管理</h1><p className="text-muted-foreground">平台级租户生命周期管理</p></div>
      <Card><CardHeader><CardTitle>租户列表</CardTitle><CardDescription>此功能将在后续版本中实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">租户管理页面 — 待实现</p></CardContent></Card>
    </div>
  );
}
