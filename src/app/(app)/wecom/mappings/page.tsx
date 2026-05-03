'use client';

import { useEffect, useState } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { buildUserInfoHeaders } from '@/lib/auth';
import { Users, Search, Link2, Unlink, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface GroupMapping {
  id: string;
  group_id: string;
  group_name: string;
  customer_id: string;
  match_score: number;
  match_source: string;
  is_active: boolean;
  auto_create_order: boolean;
  auto_send_feedback: boolean;
  customers?: { id: string; code: string; name: string };
}

interface AppConfig {
  id: string;
  name: string;
}

export default function WeComMappingsPage() {
  return (
    <PageGuard permission="wecom:manage">
      <WeComMappingsContent />
    </PageGuard>
  );
}

function WeComMappingsContent() {
  const { user } = useAuth();
  const [mappings, setMappings] = useState<GroupMapping[]>([]);
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ app_id: '', is_active: '' });

  useEffect(() => {
    loadApps();
    loadMappings();
  }, []);

  const loadApps = async () => {
    try {
      const res = await fetch('/api/wecom/manage/config');
      const data = await res.json();
      if (data.success) {
        setApps(data.data || []);
      }
    } catch {}
  };

  const loadMappings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.app_id) params.set('app_id', filter.app_id);
      if (filter.is_active) params.set('is_active', filter.is_active);
      
      const res = await fetch(`/api/wecom/manage/mappings?${params}`);
      const data = await res.json();
      if (data.success) {
        setMappings(data.data || []);
      }
    } catch {
      toast.error('加载映射失败');
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/wecom/manage/mappings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders(user) },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(currentActive ? '已停用' : '已启用');
        loadMappings();
      }
    } catch {
      toast.error('操作失败');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">群映射管理</h1>
          <p className="text-sm text-muted-foreground mt-1">管理企业微信群与客户的绑定关系</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filter.app_id}
              onChange={(e) => setFilter({ ...filter, app_id: e.target.value })}
            >
              <option value="">全部应用</option>
              {apps.map((app) => (
                <option key={app.id} value={app.id}>{app.name}</option>
              ))}
            </select>
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filter.is_active}
              onChange={(e) => setFilter({ ...filter, is_active: e.target.value })}
            >
              <option value="">全部状态</option>
              <option value="true">已启用</option>
              <option value="false">已停用</option>
            </select>
            <Button onClick={loadMappings} variant="outline">
              <Search className="w-4 h-4 mr-2" />
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : mappings.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无映射</div>
        ) : (
          mappings.map((mapping) => (
            <Card key={mapping.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${mapping.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {mapping.group_name || '未知群名'}
                        {mapping.match_source === 'auto' ? (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">自动</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">手动</span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        群ID: {mapping.group_id.slice(0, 20)}...
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {mapping.customers?.name || '未绑定'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        匹配度: {mapping.match_score}%
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span title="自动接单" className={`text-xs ${mapping.auto_create_order ? 'text-green-600' : 'text-gray-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                      <span title="自动回单" className={`text-xs ${mapping.auto_send_feedback ? 'text-green-600' : 'text-gray-300'}`}>
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(mapping.id, mapping.is_active)}
                    >
                      {mapping.is_active ? '停用' : '启用'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
