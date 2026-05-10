'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { buildUserInfoHeaders } from '@/lib/auth';
import { Settings, FolderOpen, HardDrive, Save, RefreshCw } from 'lucide-react';

interface SystemConfig {
  id: string;
  code: string;
  name: string;
  category: string;
  config: Record<string, unknown>;
  description?: string;
  is_active: boolean;
  is_public: boolean;
  editable: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  export: '导出设置',
  general: '通用设置',
  ai: 'AI 设置',
  notification: '通知设置',
};

export default function SystemConfigsPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, Record<string, unknown>>>({});

  const loadConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/system-configs?isPublic=true', { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) {
        setConfigs(data.data || []);
        // 初始化本地值
        const initial: Record<string, Record<string, unknown>> = {};
        for (const c of data.data) {
          initial[c.code] = c.config;
        }
        setLocalValues(initial);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '加载配置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleSave = async (code: string) => {
    const config = localValues[code];
    if (!config) return;

    setSaving(code);
    try {
      const res = await fetch('/api/system-configs', {
        method: 'PATCH',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code, config }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('配置已保存');
        loadConfigs();
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(null);
    }
  };

  const updateLocalConfig = (code: string, key: string, value: unknown) => {
    setLocalValues((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [key]: value,
      },
    }));
  };

  const groupedConfigs = configs.reduce((acc, config) => {
    const cat = config.category || 'general';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(config);
    return acc;
  }, {} as Record<string, SystemConfig[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageGuard permission={['system_configs:view', 'settings:view']} title="无权访问系统设置" description="当前账号没有访问系统设置的权限。">
      <div className="space-y-6 px-3 py-4 sm:px-4 sm:py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Settings className="h-7 w-7 text-primary" />
              系统设置
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              配置系统的全局参数和选项
            </p>
          </div>
          <Button
            variant="outline"
            onClick={loadConfigs}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {/* 配置分组 */}
        {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                {CATEGORY_LABELS[category] || category}
              </CardTitle>
              <CardDescription>
                {category === 'export' && '配置导出文件的存储方式和路径'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoryConfigs.map((config) => (
                <div key={config.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">{config.name}</Label>
                      <Badge variant="outline" className="text-xs">{config.code}</Badge>
                      {!config.editable && (
                        <Badge variant="secondary" className="text-xs">只读</Badge>
                      )}
                    </div>
                  </div>

                  {config.description && (
                    <p className="text-sm text-muted-foreground">{config.description}</p>
                  )}

                  {/* 导出目录配置 */}
                  {config.code === 'export_default_dir' && config.editable && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">本地路径</Label>
                        <div className="flex gap-2">
                          <Input
                            value={(localValues[config.code]?.localPath as string) || ''}
                            onChange={(e) => updateLocalConfig(config.code, 'localPath', e.target.value)}
                            placeholder="留空使用系统默认路径"
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleSave(config.code)}
                            disabled={saving === config.code}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {saving === config.code ? '保存中...' : '保存'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          导出文件将保存到此目录。留空则使用浏览器默认下载路径。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 导出 provider 配置 */}
                  {config.code === 'export_provider' && config.editable && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">存储方式</Label>
                        <div className="flex gap-2 items-center">
                          <select
                            value={(localValues[config.code]?.provider as string) || 'local'}
                            onChange={(e) => updateLocalConfig(config.code, 'provider', e.target.value)}
                            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                          >
                            <option value="local">本地存储</option>
                            <option value="s3">S3 对象存储</option>
                          </select>
                          <Button
                            size="sm"
                            onClick={() => handleSave(config.code)}
                            disabled={saving === config.code}
                          >
                            <Save className="h-4 w-4 mr-1" />
                            {saving === config.code ? '保存中...' : '保存'}
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          选择导出文件的存储方式。S3 需要额外配置云存储参数。
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 其他只读配置 */}
                  {!config.editable && (
                    <p className="text-sm text-muted-foreground italic">此配置项不可编辑</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {configs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>暂无系统配置</p>
          </div>
        )}
      </div>
    </PageGuard>
  );
}
