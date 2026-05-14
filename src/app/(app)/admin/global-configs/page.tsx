'use client';

import { useState, useEffect } from 'react';
import { SuperadminGuard } from '@/components/auth/superadmin-guard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { buildUserInfoHeaders } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

const STATUS_KEYS = ['pending', 'assigned', 'notified', 'partial_returned', 'returned', 'feedbacked', 'completed', 'cancelled'];
const ACTION_KEYS = ['complete', 'exportKingdee', 'completeAction', 'shipping', 'exportShipping'];
const PREFIX_KEYS = ['kingdee', 'shipping'];

const DEFAULT_VALUES: Record<string, Record<string, string>> = {
  statusLabels: { pending:'待派发', assigned:'已派发', notified:'通知发货', partial_returned:'部分回单', returned:'已回单', feedbacked:'已反馈', completed:'已完成', cancelled:'已取消' },
  actionLabels: { complete:'完成', exportKingdee:'导出', completeAction:'已完成', shipping:'发货通知单', exportShipping:'导出发货通知单' },
  exportPrefixes: { kingdee:'导出', shipping:'发货通知单' },
};

export default function GlobalConfigsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>({ ...DEFAULT_VALUES.statusLabels });
  const [actionLabels, setActionLabels] = useState<Record<string, string>>({ ...DEFAULT_VALUES.actionLabels });
  const [exportPrefixes, setExportPrefixes] = useState<Record<string, string>>({ ...DEFAULT_VALUES.exportPrefixes });
  const [financialSystem, setFinancialSystem] = useState('财务管理');

  useEffect(() => {
    fetch('/api/platform-defaults', { headers: buildUserInfoHeaders() })
      .then(r => r.json()).then(d => {
        if (d.success && d.data) {
          if (d.data.statusLabels) setStatusLabels(d.data.statusLabels);
          if (d.data.actionLabels) setActionLabels(d.data.actionLabels);
          if (d.data.exportPrefixes) setExportPrefixes(d.data.exportPrefixes);
          if (d.data.financialSystem) setFinancialSystem(d.data.financialSystem);
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const saveAll = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/platform-defaults', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ statusLabels, actionLabels, exportPrefixes, financialSystem }),
      });
      const data = await res.json();
      if (data.success) toast.success('全局默认配置已保存');
      else toast.error(data.error || '保存失败');
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <SuperadminGuard>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">全局默认配置</h1>
          <p className="text-muted-foreground">新租户创建时的默认配置模板。修改不影响已有租户。</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}保存
        </Button>
      </div>

      <Tabs defaultValue="status">
        <TabsList>
          <TabsTrigger value="status">状态标签</TabsTrigger>
          <TabsTrigger value="actions">操作标签</TabsTrigger>
          <TabsTrigger value="prefixes">导出前缀</TabsTrigger>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
        </TabsList>

        <TabsContent value="status" className="mt-4">
          <Card><CardHeader><CardTitle>订单状态标签默认值</CardTitle><CardDescription>新租户初始化时默认使用这些文案</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {STATUS_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 text-right text-muted-foreground">{key}</Label>
                  <Input value={statusLabels[key] || ''} onChange={e => setStatusLabels(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="mt-4">
          <Card><CardHeader><CardTitle>操作标签默认值</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ACTION_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 text-right text-muted-foreground">{key}</Label>
                  <Input value={actionLabels[key] || ''} onChange={e => setActionLabels(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prefixes" className="mt-4">
          <Card><CardHeader><CardTitle>导出前缀默认值</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {PREFIX_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 text-right text-muted-foreground">{key}</Label>
                  <Input value={exportPrefixes[key] || ''} onChange={e => setExportPrefixes(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="basic" className="mt-4">
          <Card><CardHeader><CardTitle>基本信息默认值</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-40 text-right text-muted-foreground">财务系统名称</Label>
                <Input value={financialSystem} onChange={e => setFinancialSystem(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </SuperadminGuard>
  );
}
