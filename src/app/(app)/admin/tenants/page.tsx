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
import { Plus, Loader2, Building2, KeyRound, UserCog, Copy } from 'lucide-react';

interface Tenant {
  id: string; code: string; name: string; status: string; plan: string;
  created_at: string; member_count?: number; admin_username?: string;
}

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newPlan, setNewPlan] = useState('basic');
  const [creating, setCreating] = useState(false);
  const [createdResult, setCreatedResult] = useState<{ adminUsername: string; adminPassword: string } | null>(null);

  // 密码重置
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTenantId, setResetTenantId] = useState('');
  const [resetTenantName, setResetTenantName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState('');

  // 更换管理员
  const [changeOpen, setChangeOpen] = useState(false);
  const [changeTenantId, setChangeTenantId] = useState('');
  const [changeTenantName, setChangeTenantName] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminResults, setAdminResults] = useState<{ id: string; username: string; real_name: string }[]>([]);
  const [adminSearching, setAdminSearching] = useState(false);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState('');
  const [changing, setChanging] = useState(false);

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
      if (data.success) {
        setCreatedResult({ adminUsername: data.data.adminUsername, adminPassword: data.data.adminPassword });
        setCreateOpen(false); loadTenants(); setNewCode(''); setNewName('');
      }
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

  const openResetPassword = (t: Tenant) => {
    setResetTenantId(t.id);
    setResetTenantName(t.name);
    setNewPassword('');
    setResetResult('');
    setResetOpen(true);
  };

  const resetPassword = async () => {
    setResetting(true);
    try {
      const res = await fetch(`/api/tenants/${resetTenantId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ resetAdminPassword: true, newPassword: newPassword || undefined }),
      });
      const data = await res.json();
      if (data.success) { setResetResult(data.data.newPassword); toast.success('密码已重置'); }
      else toast.error(data.error || '重置失败');
    } catch { toast.error('重置失败'); }
    finally { setResetting(false); }
  };

  const openChangeAdmin = (t: Tenant) => {
    setChangeTenantId(t.id);
    setChangeTenantName(t.name);
    setAdminSearch('');
    setAdminResults([]);
    setSelectedNewAdmin('');
    setChangeOpen(true);
  };

  const searchAdmins = async () => {
    if (!adminSearch.trim()) return;
    setAdminSearching(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(adminSearch)}&pageSize=20`, { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) setAdminResults(data.data || []);
    } catch { toast.error('搜索失败'); }
    finally { setAdminSearching(false); }
  };

  const changeAdmin = async () => {
    if (!selectedNewAdmin) return;
    setChanging(true);
    try {
      const res = await fetch(`/api/tenants/${changeTenantId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ changeAdminUserId: selectedNewAdmin }),
      });
      const data = await res.json();
      if (data.success) { toast.success('管理员已更换'); setChangeOpen(false); loadTenants(); }
      else toast.error(data.error || '更换失败');
    } catch { toast.error('更换失败'); }
    finally { setChanging(false); }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  return (
    <SuperadminGuard>
      <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">租户管理</h1>
          <p className="text-muted-foreground">管理平台所有租户，创建时自动初始化管理员账号和默认配置</p>
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
              <TableHeader><TableRow>
                <TableHead>编码</TableHead><TableHead>名称</TableHead><TableHead>套餐</TableHead><TableHead>管理员</TableHead><TableHead>状态</TableHead><TableHead>创建时间</TableHead><TableHead className="w-40">操作</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {tenants.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.code}</TableCell>
                    <TableCell>{t.name}</TableCell>
                    <TableCell><Badge variant="outline">{t.plan || 'basic'}</Badge></TableCell>
                    <TableCell className="text-sm font-mono">{t.admin_username || '-'}</TableCell>
                    <TableCell><Badge variant={t.status === 'active' ? 'default' : 'secondary'}>{t.status === 'active' ? '活跃' : '已停用'}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{t.created_at ? new Date(t.created_at).toLocaleDateString('zh-CN') : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => toggleStatus(t.id, t.status)}>
                          {t.status === 'active' ? '停用' : '启用'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openResetPassword(t)} title="重置管理员密码">
                          <KeyRound className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openChangeAdmin(t)} title="更换管理员">
                          <UserCog className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 创建租户 */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>创建新租户</DialogTitle><DialogDescription>填写基本信息，将自动创建管理员账号并从全局默认配置初始化</DialogDescription></DialogHeader>
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

      {/* 创建结果（管理员账号） */}
      <Dialog open={!!createdResult} onOpenChange={() => setCreatedResult(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>租户创建成功</DialogTitle><DialogDescription>请将以下管理员账号交给租户管理员</DialogDescription></DialogHeader>
          {createdResult && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">管理员账号</span>
                  <span className="font-mono font-bold text-lg">{createdResult.adminUsername}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">初始密码</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg">{createdResult.adminPassword}</span>
                    <Button variant="ghost" size="icon" onClick={() => copyToClipboard(createdResult.adminPassword)}><Copy className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
              <p className="text-sm text-destructive">请立即保存密码，关闭后不可查看</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setCreatedResult(null)}>已保存，关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码 */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>重置管理员密码</DialogTitle><DialogDescription>租户：{resetTenantName}</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>新密码（留空则使用默认密码 Admin123!）</Label>
              <Input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Admin123!" />
            </div>
            {resetResult && (
              <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
                <span className="font-mono text-lg font-bold">{resetResult}</span>
                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(resetResult)}><Copy className="h-4 w-4" /></Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>取消</Button>
            <Button onClick={resetPassword} disabled={resetting}>{resetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}确认重置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 更换管理员 */}
      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>更换管理员</DialogTitle><DialogDescription>租户：{changeTenantName} — 搜索用户并指定为新管理员</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="搜索用户名..." value={adminSearch} onChange={e => setAdminSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchAdmins()} />
              <Button variant="outline" onClick={searchAdmins} disabled={adminSearching}>{adminSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : '搜索'}</Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {adminResults.map(u => (
                <div key={u.id} className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer ${selectedNewAdmin === u.id ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelectedNewAdmin(u.id)}>
                  <div><p className="font-medium text-sm">{u.username}</p><p className="text-xs text-muted-foreground">{u.real_name}</p></div>
                  {selectedNewAdmin === u.id && <Badge variant="secondary">已选择</Badge>}
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeOpen(false)}>取消</Button>
            <Button onClick={changeAdmin} disabled={!selectedNewAdmin || changing}>{changing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}确认更换</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </SuperadminGuard>
  );
}
