'use client';

import { useState, useEffect } from 'react';
import { useTenantConfig } from '@/hooks/use-tenant-config';
import { useCurrentTenantId } from '@/hooks/use-tenant';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { buildUserInfoHeaders } from '@/lib/auth';
import { Loader2, Package, Save } from 'lucide-react';

const STATUS_KEYS = ['pending', 'assigned', 'notified', 'partial_returned', 'returned', 'feedbacked', 'completed', 'cancelled'];
const ACTION_KEYS = ['complete', 'exportKingdee', 'completeAction', 'shipping', 'exportShipping'];
const PREFIX_KEYS = ['kingdee', 'shipping'];

export default function TenantSettingsPage() {
  const tenantId = useCurrentTenantId();
  const { config, isLoading, refresh } = useTenantConfig();
  const [saving, setSaving] = useState(false);

  const [basic, setBasic] = useState({ name: '', financialSystem: '' });
  const [brand, setBrand] = useState({ logoUrl: '', themeColor: '#1890ff', welcomeMessage: '' });
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>({});
  const [actionLabels, setActionLabels] = useState<Record<string, string>>({});
  const [exportPrefixes, setExportPrefixes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (config) {
      setBasic({ name: config.name, financialSystem: config.financialSystem });
      setStatusLabels({ ...config.statusLabels });
      setActionLabels({ ...config.actionLabels });
      setExportPrefixes({ ...config.exportPrefixes });
    }
  }, [config]);

  useEffect(() => {
    if (!tenantId) return;
    fetch(`/api/tenants/${tenantId}`, { headers: buildUserInfoHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setBasic(prev => ({ ...prev, name: d.data.name }));
        }
      });
    fetch(`/api/tenants/${tenantId}/brand`, { headers: buildUserInfoHeaders() })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setBrand({
            logoUrl: d.data.logo_url || '',
            themeColor: d.data.theme_color || '#1890ff',
            welcomeMessage: d.data.welcome_message || '',
          });
        }
      }).catch(() => {});
  }, [tenantId]);

  const saveAll = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const headers = { 'Content-Type': 'application/json', ...buildUserInfoHeaders() };
      await fetch('/api/tenant-configs', {
        method: 'PATCH', headers,
        body: JSON.stringify({ basic, statusLabels, actionLabels, exportPrefixes }),
      });
      await fetch(`/api/tenants/${tenantId}/brand`, {
        method: 'PATCH', headers,
        body: JSON.stringify({
          brand_name: basic.name, logo_url: brand.logoUrl,
          theme_color: brand.themeColor, welcome_message: brand.welcomeMessage,
          footer_text: '',
        }),
      });
      toast.success('配置已保存');
      refresh();
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">租户设置</h1>
          <p className="text-muted-foreground">管理当前租户的基本信息、品牌和标签文案</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          保存全部
        </Button>
      </div>

      <Tabs defaultValue="basic">
        <TabsList>
          <TabsTrigger value="basic">基本信息</TabsTrigger>
          <TabsTrigger value="brand">品牌配置</TabsTrigger>
          <TabsTrigger value="status">状态标签</TabsTrigger>
          <TabsTrigger value="actions">操作标签 & 导出前缀</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>基本信息</CardTitle><CardDescription>租户名称和财务系统名称</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>租户名称</Label>
                <Input value={basic.name} onChange={e => setBasic(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>财务系统名称</Label>
                <Input value={basic.financialSystem} onChange={e => setBasic(p => ({ ...p, financialSystem: e.target.value }))} placeholder="如：金蝶、用友" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>品牌配置</CardTitle><CardDescription>登录页和系统界面的品牌展示</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex gap-4 items-start">
                  <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted/30 overflow-hidden shrink-0">
                    {brand.logoUrl ? (
                      <img src={brand.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('file', file);
                        try {
                          const res = await fetch('/api/upload', { method: 'POST', body: formData });
                          const data = await res.json();
                          if (data.success) setBrand(p => ({ ...p, logoUrl: data.data.url }));
                          else toast.error(data.error || '上传失败');
                        } catch { toast.error('上传失败'); }
                      }}
                    />
                    <p className="text-xs text-muted-foreground">建议尺寸 200×200px，PNG/JPEG/WebP，最大 2MB</p>
                    <Input
                      value={brand.logoUrl}
                      onChange={e => setBrand(p => ({ ...p, logoUrl: e.target.value }))}
                      placeholder="或输入 Logo URL"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>主题色</Label>
                <div className="flex gap-2 items-center">
                  <Input value={brand.themeColor} onChange={e => setBrand(p => ({ ...p, themeColor: e.target.value }))} className="w-32" />
                  <div className="w-8 h-8 rounded border" style={{ backgroundColor: brand.themeColor }} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>欢迎语</Label>
                <Input value={brand.welcomeMessage} onChange={e => setBrand(p => ({ ...p, welcomeMessage: e.target.value }))} placeholder="欢迎使用..." />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>订单状态标签</CardTitle><CardDescription>自定义各订单状态的显示文案</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {STATUS_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 text-right text-muted-foreground">{key}</Label>
                  <Input
                    value={statusLabels[key] || ''}
                    onChange={e => setStatusLabels(p => ({ ...p, [key]: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>操作标签</CardTitle><CardDescription>按钮和操作的显示文案</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {ACTION_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 text-right text-muted-foreground">{key}</Label>
                  <Input
                    value={actionLabels[key] || ''}
                    onChange={e => setActionLabels(p => ({ ...p, [key]: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>导出前缀</CardTitle><CardDescription>导出文件名的前缀</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {PREFIX_KEYS.map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-40 text-right text-muted-foreground">{key}</Label>
                  <Input
                    value={exportPrefixes[key] || ''}
                    onChange={e => setExportPrefixes(p => ({ ...p, [key]: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
