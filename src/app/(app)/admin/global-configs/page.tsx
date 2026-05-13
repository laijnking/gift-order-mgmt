'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export default function GlobalConfigsPage() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-bold">全局默认配置</h1><p className="text-muted-foreground">新租户初始化时的默认配置模板</p></div>
      <Card><CardHeader><CardTitle>默认配置</CardTitle><CardDescription>此功能将在后续版本中实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">全局默认配置页面 — 待实现</p></CardContent></Card>
    </div>
  );
}
