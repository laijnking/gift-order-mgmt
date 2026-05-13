'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentTenantId } from '@/hooks/use-tenant';
import { buildUserInfoHeaders } from '@/lib/auth';
import { toast } from 'sonner';
import { UserPlus, Trash2, Loader2, Search } from 'lucide-react';

const ROLE_OPTIONS = [
  { value: 'admin', label: '管理员' },
  { value: 'salesperson', label: '业务员' },
  { value: 'operator', label: '跟单员' },
  { value: 'sales_manager', label: '销售经理' },
  { value: 'finance', label: '财务' },
];

interface Member {
  id: string;
  userId: string;
  username: string;
  realName: string;
  role: string;
  joinedAt: string;
}

interface UserSearchResult {
  id: string;
  username: string;
  real_name: string;
}

export default function MembersPage() {
  const tenantId = useCurrentTenantId();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('salesperson');
  const [inviting, setInviting] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/members`, { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) setMembers(data.data || []);
    } catch { toast.error('加载成员失败'); }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/users?search=${encodeURIComponent(searchQuery)}`, { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) setSearchResults(data.data || []);
    } catch { toast.error('搜索用户失败'); }
    finally { setSearching(false); }
  };

  const inviteMember = async () => {
    if (!tenantId || !selectedUserId) return;
    setInviting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/members`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ userId: selectedUserId, role: selectedRole }),
      });
      const data = await res.json();
      if (data.success) { toast.success('成员已添加'); setInviteOpen(false); loadMembers(); }
      else toast.error(data.error || '添加失败');
    } catch { toast.error('添加失败'); }
    finally { setInviting(false); }
  };

  const changeRole = async (userId: string, role: string) => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}/members`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (data.success) { toast.success('角色已更新'); loadMembers(); }
      else toast.error(data.error || '更新失败');
    } catch { toast.error('更新失败'); }
  };

  const removeMember = async (userId: string) => {
    if (!tenantId || !confirm('确定要移除该成员吗？')) return;
    try {
      const res = await fetch(`/api/tenants/${tenantId}/members`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success) { toast.success('成员已移除'); loadMembers(); }
      else toast.error(data.error || '移除失败');
    } catch { toast.error('移除失败'); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">成员管理</h1>
          <p className="text-muted-foreground">管理当前租户的成员及其角色</p>
        </div>
        <Button onClick={() => { setInviteOpen(true); setSearchQuery(''); setSearchResults([]); setSelectedUserId(''); }}>
          <UserPlus className="mr-2 h-4 w-4" />邀请成员
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle>成员列表</CardTitle><CardDescription>{members.length} 位成员</CardDescription></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>用户名</TableHead><TableHead>姓名</TableHead><TableHead>角色</TableHead><TableHead className="w-32">操作</TableHead></TableRow></TableHeader>
              <TableBody>
                {members.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.username}</TableCell>
                    <TableCell>{m.realName}</TableCell>
                    <TableCell>
                      <Select value={m.role} onValueChange={(v) => changeRole(m.userId, v)}>
                        <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>{ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeMember(m.userId)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>邀请成员</DialogTitle><DialogDescription>搜索已有用户并加入当前租户</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input placeholder="搜索用户名..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && searchUsers()} />
              <Button variant="outline" onClick={searchUsers} disabled={searching}>{searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}</Button>
            </div>
            {searchResults.map(u => (
              <div key={u.id} className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer ${selectedUserId === u.id ? 'border-primary bg-primary/5' : ''}`} onClick={() => setSelectedUserId(u.id)}>
                <div><p className="font-medium">{u.username}</p><p className="text-sm text-muted-foreground">{u.real_name}</p></div>
                {selectedUserId === u.id && <Badge variant="secondary">已选择</Badge>}
              </div>
            ))}
            {selectedUserId && (
              <div className="space-y-2">
                <p className="text-sm font-medium">分配角色</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLE_OPTIONS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>取消</Button>
            <Button onClick={inviteMember} disabled={!selectedUserId || inviting}>{inviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}确认邀请</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
