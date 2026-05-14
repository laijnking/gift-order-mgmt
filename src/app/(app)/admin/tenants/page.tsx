'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SuperadminGuard } from '@/components/auth/superadmin-guard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildUserInfoHeaders } from '@/lib/auth';
import { toast } from 'sonner';
import { Plus, Loader2, Building2 } from 'lucide-react';

interface Tenant {
  id: string; code: string; name: string; status: string; plan: string;
  created_at: string; member_count?: number;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState('basic');
  const [creating, setCreating] = useState(false);

  const loadTenants = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tenants', { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) setTenants(data.data || []);
    } catch { toast.error('加载租户列表失败'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadTenants(); }, []);

  const createTenant = async () => {
    if (!newCode.trim() || !newName.trim()) { toast.error('请填写租户编码和名称'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/tenants', {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ code: newCode.toUpperCase(), name: newName, plan: newPlan }),
      });
      const data = await res.json();
      if (data.success) { toast.success('租户已创建'); setCreateOpen(false); loadTenants(); setNewCode(''); setNewName(''); }
      else toast.error(data.error || '创建失败');
    } catch { toast.error('创建失败'); }
    finally { setCreating(false); }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/tenants/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) { toast.success(`租户已${newStatus === 'active' ? '启用' : '停用'}`); loadTenants(); }
      else toast.error(data.error || '操作失败');
    } catch { toast.error('操作失败'); }
  };

  return (
    <SuperadminGuard>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">租户管理</h1>
          <p className="text-muted-foreground">管理平台所有租户</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="mr-2 h-4 w-4" />创建租户</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>租户列表</CardTitle><CardDescription>{tenants.length} 个租户</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>编码</TableHead><TableHead>名称</TableHead><TableHead>套餐</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead><TableHead className="w-24">操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.code}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.plan || 'basic'}</Badge></TableCell>
                    <TableCell><Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status === 'active' ? '活跃' : '已停用'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.created_at ? new Date(t.created_at).toLocaleDateString('zh-CN') : '-'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => toggleStatus(t.id, t.status)}>
                        {t.status === 'active' ? '停用' : '启用'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建新租户</DialogTitle><DialogDescription>填写基本信息创建租户，配置将从全局默认配置初始化</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>租户编码</Label><Input placeholder="如: DEMO" value={newCode} onChange={e => setNewCode(e.target.value.toUpperCase())} /></div>
            <div className="space-y-2"><Label>租户名称</Label><Input placeholder="如: 演示租户" value={newName} onChange={e => setNewName(e.target.value)} /></div>
            <div className="space-y-2"><Label>套餐</Label>
              <Select value={newPlan} onValueChange={setNewPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="basic">基础版</SelectItem>
                  <SelectItem value="standard">标准版</SelectItem>
                  <SelectItem value="premium">高级版</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>取消</Button>
            <Button onClick={createTenant} disabled={creating}>{creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}确认创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </SuperadminGuard>
  );
}
