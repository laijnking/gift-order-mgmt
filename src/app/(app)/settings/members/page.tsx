'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export default function MembersPage() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">成员管理</h1><p className="text-muted-foreground">管理当前租户的成员及其角色分配</p></div>
      <Card><CardHeader><CardTitle>成员列表</CardTitle><CardDescription>此功能将在后续版本中实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">成员管理页面 — 待实现</p></CardContent></Card>
    </div>
  );
}
