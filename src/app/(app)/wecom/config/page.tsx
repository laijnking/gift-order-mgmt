'use client';

import { useEffect, useState } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { buildUserInfoHeaders } from '@/lib/auth';
import { Plus, Edit, Trash2, Power, PowerOff, RefreshCw, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface AppConfig {
  id: string;
  name: string;
  corp_id: string;
  agent_id: string;
  is_active: boolean;
  created_at: string;
}

export default function WeComConfigPage() {
  return (
    <PageGuard permission="wecom:manage">
      <WeComConfigContent />
    </PageGuard>
  );
}

function WeComConfigContent() {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    corp_id: '',
    agent_id: '',
    secret: '',
    token: '',
    encoding_aes_key: '',
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wecom/manage/config');
      const data = await res.json();
      if (data.success) {
        setConfigs(data.data || []);
      }
    } catch (err) {
      toast.error('加载配置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wecom/manage/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders(user) },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('创建成功');
        setShowForm(false);
        setFormData({ name: '', corp_id: '', agent_id: '', secret: '', token: '', encoding_aes_key: '' });
        loadConfigs();
      } else {
        toast.error(data.error || '创建失败');
      }
    } catch {
      toast.error('创建失败');
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/wecom/manage/config/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders(user) },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentActive ? '已停用' : '已启用');
        loadConfigs();
      }
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除此配置吗？')) return;
    try {
      const res = await fetch(`/api/wecom/manage/config/${id}`, {
        method: 'DELETE',
        headers: buildUserInfoHeaders(user),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        loadConfigs();
      }
    } catch {
      toast.error('删除失败');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">企业微信应用配置</h1>
          <p className="text-sm text-muted-foreground mt-1">管理企业微信自建应用，配置回调接收</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          添加应用
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>新建应用配置</CardTitle>
            <CardDescription>在企业微信管理后台创建自建应用后，填入以下信息</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>应用名称</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：订单助手"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>AgentID</Label>
                  <Input
                    value={formData.agent_id}
                    onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                    placeholder="在企业微信后台查看"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>企业ID (CorpID)</Label>
                  <Input
                    value={formData.corp_id}
                    onChange={(e) => setFormData({ ...formData, corp_id: e.target.value })}
                    placeholder="企业微信后台获取"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>应用Secret</Label>
                  <Input
                    type="password"
                    value={formData.secret}
                    onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                    placeholder="企业微信后台获取"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>回调Token</Label>
                  <Input
                    value={formData.token}
                    onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                    placeholder="自行生成的随机字符串"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>EncodingAESKey</Label>
                  <Input
                    value={formData.encoding_aes_key}
                    onChange={(e) => setFormData({ ...formData, encoding_aes_key: e.target.value })}
                    placeholder="43位随机字符"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  取消
                </Button>
                <Button type="submit">
                  保存
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : configs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无配置</div>
        ) : (
          configs.map((config) => (
            <Card key={config.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${config.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium">{config.name}</p>
                      <p className="text-sm text-muted-foreground">
                        AgentID: {config.agent_id} | CorpID: {config.corp_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(config.id, config.is_active)}
                    >
                      {config.is_active ? (
                        <PowerOff className="w-4 h-4 text-green-600" />
                      ) : (
                        <Power className="w-4 h-4 text-gray-400" />
                      )}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(config.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  回调地址: <code className="bg-muted px-1 rounded">/api/wecom/callback?agentid={config.agent_id}</code>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
