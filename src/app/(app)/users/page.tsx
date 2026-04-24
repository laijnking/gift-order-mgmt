'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders, useAuth, usePermission } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  UserCog,
  Shield,
  ShieldAlert,
  UserCheck,
  Loader2,
  Upload,
  Download,
} from 'lucide-react';

// Excel导入配置
const IMPORT_CONFIG = {
  title: '用户管理',
  fields: ['username', 'realName', 'phone', 'email', 'role', 'dataScope', 'isActive', 'remark'],
  fieldLabels: ['用户名', '姓名', '手机号', '邮箱', '角色', '数据权限', '状态', '备注'],
  template: [
    { username: 'admin', realName: '管理员', phone: '13800000001', email: 'admin@example.com', role: '管理员', dataScope: '全部', isActive: '启用', remark: '系统管理员' },
    { username: 'salesperson', realName: '李四', phone: '13800000002', email: 'lisi@example.com', role: '业务员', dataScope: '仅本人', isActive: '启用', remark: '' },
    { username: 'operator', realName: '王五', phone: '13800000003', email: 'wangwu@example.com', role: '跟单员', dataScope: '仅本人', isActive: '启用', remark: '' },
  ],
};

interface User {
  id: string;
  username: string;
  realName: string;
  role: string;
  department?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
  // 新增字段
  phone?: string | null;
  email?: string | null;
  remark?: string | null;
  dataScope?: string;
}

interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_system: boolean;
  is_active: boolean;
}

// 角色名称映射（code -> 中文名称）
const ROLE_NAME_MAP: Record<string, string> = {
  admin: '管理员',
  admin_viewer: '管理员查看者',
  salesman: '普通业务员',
  sales_manager: '销售主管',
  order_taker: '普通跟单员',
  order_manager: '跟单主管',
  finance: '财务',
  finance_manager: '财务主管',
  viewer: '查看者',
  // 兼容旧数据
  salesperson: '普通业务员',
  operator: '普通跟单员',
  sales: '普通业务员',
};

// 角色图标映射
const ROLE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  admin_viewer: Shield,
  salesman: UserCog,
  sales_manager: UserCog,
  order_taker: UserCheck,
  order_manager: UserCheck,
  finance: ShieldAlert,
  finance_manager: ShieldAlert,
  viewer: Users,
  // 兼容旧数据
  salesperson: UserCog,
  operator: UserCheck,
  sales: UserCog,
};

export default function UsersPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    realName: '',
    role: '',
    department: '',
    isActive: true,
  });

  // Excel导入相关状态
  const [excelImportData, setExcelImportData] = useState<Record<string, string>[]>([]);
  const [excelImportDialogOpen, setExcelImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const authHeaders = () => buildUserInfoHeaders(user);

  // 合并 roles 表的角色和用户表中已存在的角色
  const allRoles = React.useMemo(() => {
    const roleCodes = new Set(roles.map(r => r.code));
    const existingRoles = users.map(u => u.role).filter(Boolean);
    const uniqueExisting = [...new Set(existingRoles)].filter(code => !roleCodes.has(code));
    
    // 合并去重
    return [
      ...roles.map(r => ({ code: r.code, name: r.name })),
      ...uniqueExisting.map(code => ({ code, name: code }))
    ];
  }, [roles, users]);

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (roleFilter && roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(term) ||
        u.realName?.toLowerCase().includes(term) ||
        u.department?.toLowerCase().includes(term)
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter]);

  const loadRoles = async () => {
    setRolesLoading(true);
    try {
      const res = await fetch('/api/roles', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('加载角色失败:', error);
    } finally {
      setRolesLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('加载用户失败:', error);
      toast.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingUser
        ? `/api/users/${editingUser.id}`
        : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      // 编辑时如果密码为空，不发送密码字段
      const { password: _, ...submitData } = { ...formData };
      const finalData = (editingUser && !formData.password) ? submitData : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(finalData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingUser ? '更新成功' : '创建成功');
        setIsDialogOpen(false);
        resetForm();
        loadUsers();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user.username || '',
      password: '',
      realName: user.realName || '',
      role: user.role || allRoles[0]?.code || '',
      department: user.department || '',
      isActive: user.isActive ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    // 区分删除和禁用操作
    const action = confirm('确定要彻底删除这个用户吗？\n\n点击"确定"将永久删除用户。\n点击"取消"改为禁用用户。');
    
    if (action) {
      // 真正删除
      try {
        const res = await fetch(`/api/users?id=${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        const data = await res.json();
        if (data.success) {
          toast.success('删除成功');
          loadUsers();
        } else {
          toast.error(data.error || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        toast.error('删除失败');
      }
    } else {
      // 改为禁用
      toast.info('已取消，可使用禁用按钮禁用该用户');
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('状态更新成功');
        loadUsers();
      }
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败');
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      realName: '',
      role: allRoles[0]?.code || '',
      department: '',
      isActive: true,
    });
  };

  // 下载模板
  const downloadTemplate = () => {
    try {
      const wsData = [
        IMPORT_CONFIG.fieldLabels,
        ...IMPORT_CONFIG.template.map(row => 
          IMPORT_CONFIG.fields.map(field => row[field as keyof typeof row] || '')
        )
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, IMPORT_CONFIG.title);
      
      // 使用 base64 方式下载
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = `${IMPORT_CONFIG.title}_导入模板.xlsx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('模板下载成功');
    } catch (error) {
      console.error('模板下载失败:', error);
      toast.error('模板下载失败');
    }
  };

  // 处理Excel文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];
        
        if (jsonData.length === 0) {
          toast.error('导入文件为空');
          return;
        }
        
        setExcelImportData(jsonData);
        setExcelImportDialogOpen(true);
        toast.success(`已读取 ${jsonData.length} 条数据`);
      } catch (err) {
        toast.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 确认Excel导入
  const confirmExcelImport = async () => {
    if (excelImportData.length === 0) {
      toast.error('请先选择要导入的文件');
      return;
    }
    
    setImporting(true);
    try {
      // 角色映射
      const roleNameToCode: Record<string, string> = {
        '管理员': 'admin', 'admin': 'admin',
        '业务员': 'salesperson', 'salesperson': 'salesperson',
        '跟单员': 'operator', 'operator': 'operator',
      };
      // 数据权限映射
      const dataScopeNameToCode: Record<string, string> = {
        '全部': 'all', '本部门': 'department', '仅本人': 'self',
      };
      
      const usersData = excelImportData.map(row => ({
        username: row.username || row['用户名'] || '',
        password: row.password || row['密码'] || '123456', // 默认密码
        realName: row.realName || row['姓名'] || '',
        phone: row.phone || row['手机号'] || '',
        email: row.email || row['邮箱'] || '',
        role: roleNameToCode[row.role || row['角色']] || 'salesperson',
        dataScope: dataScopeNameToCode[row.dataScope || row['数据权限']] || 'self',
        isActive: (row.isActive || row['状态']) === '启用' || (row.isActive || row['状态']) === '是',
        remark: row.remark || row['备注'] || '',
      })).filter((u: { username: string; realName: string }) => u.username && u.realName);

      if (usersData.length === 0) {
        toast.error('未解析到有效的用户数据');
        return;
      }

      const res = await fetch('/api/users/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ users: usersData }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`成功导入 ${usersData.length} 个用户`);
        setExcelImportDialogOpen(false);
        setExcelImportData([]);
        loadUsers();
      } else {
        toast.error(result.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const getRoleBadge = (roleCode: string) => {
    const role = roles.find(r => r.code === roleCode);
    const Icon = ROLE_ICONS[roleCode] || Shield;
    // 优先使用数据库中的 name，其次使用本地映射，最后显示原始 code
    const displayName = role?.name || ROLE_NAME_MAP[roleCode] || roleCode;
    return (
      <Badge variant="outline" className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {displayName}
      </Badge>
    );
  };

  const getRoleByCode = (code: string) => roles.find(r => r.code === code);

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    byRole: roles.map(role => ({
      code: role.code,
      name: role.name,
      count: users.filter(u => u.role === role.code).length,
    })),
  };

  return (
    <PageGuard permission="settings:view" title="无法访问用户管理">
      {loading ? (
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
      <div className="space-y-6 px-3 pb-4 sm:px-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Users className="h-8 w-8" />
              用户管理
            </h1>
            <p className="text-muted-foreground">
              员工账号管理
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              模板下载
            </Button>
            {hasPermission('users:create') && (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              导入
            </Button>
            )}
            {hasPermission('users:create') && (
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              添加用户
            </Button>
            )}
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户名、姓名..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter || 'all'} onValueChange={(v) => setRoleFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full lg:w-[150px]">
              <SelectValue placeholder="筛选角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {allRoles.map((r) => (
                <SelectItem key={r.code} value={r.code}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadUsers} className="w-full lg:w-auto">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>

        {/* 用户列表 */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>部门</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>最后登录</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {users.length === 0 ? '暂无用户' : '未找到匹配的用户'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                      <TableCell className="font-medium">
                        <code className="bg-muted px-2 py-1 rounded">{user.username}</code>
                      </TableCell>
                      <TableCell>{user.realName || '-'}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{user.department || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? '在职' : '离职'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString('zh-CN')
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          {hasPermission('users:edit') && (
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => handleToggleActive(user)}
                          />
                          )}
                          {hasPermission('users:edit') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          )}
                          {hasPermission('users:delete') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        <div className="text-sm text-muted-foreground">
          共 {filteredUsers.length} 个用户
        </div>
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? '编辑用户' : '添加用户'}
            </DialogTitle>
            <DialogDescription>
              {editingUser ? '修改用户信息' : '创建新的用户账号'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username">用户名 *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="登录用户名"
                disabled={!!editingUser}
              />
            </div>
            {!editingUser && (
              <div className="grid gap-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="登录密码"
                />
              </div>
            )}
            {editingUser && (
              <div className="grid gap-2">
                <Label htmlFor="password">新密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="留空则不修改密码"
                />
                <p className="text-xs text-muted-foreground">
                  如需修改密码，请输入新密码
                </p>
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="realName">姓名</Label>
              <Input
                id="realName"
                value={formData.realName}
                onChange={(e) => setFormData({ ...formData, realName: e.target.value })}
                placeholder="员工姓名"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">角色 *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allRoles.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="department">部门</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="所属部门"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">启用账号</Label>
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              取消
            </Button>
            {((editingUser && hasPermission('users:edit')) || (!editingUser && hasPermission('users:create'))) && (
            <Button
              onClick={handleSubmit}
              disabled={!formData.username || (!editingUser && !formData.password)}
              className="w-full sm:w-auto"
            >
              {editingUser ? '保存修改' : '创建'}
            </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excel导入预览对话框 */}
      <Dialog open={excelImportDialogOpen} onOpenChange={setExcelImportDialogOpen}>
        <DialogContent className="flex max-h-[80vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>导入用户数据预览</DialogTitle>
            <DialogDescription>
              共 {excelImportData.length} 条数据，请确认后点击 &quot;确认导入&quot; 按钮
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>数据权限</TableHead>
                  <TableHead>状态</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {excelImportData.slice(0, 20).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row.username || row['用户名'] || '-'}</TableCell>
                    <TableCell>{row.realName || row['姓名'] || '-'}</TableCell>
                    <TableCell>{row.phone || row['手机号'] || '-'}</TableCell>
                    <TableCell>{row.email || row['邮箱'] || '-'}</TableCell>
                    <TableCell>{row.role || row['角色'] || '-'}</TableCell>
                    <TableCell>{row.dataScope || row['数据权限'] || '-'}</TableCell>
                    <TableCell>{row.isActive || row['状态'] || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
            {excelImportData.length > 20 && (
              <p className="text-sm text-gray-500 text-center py-2">
                仅显示前20条数据...
              </p>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setExcelImportDialogOpen(false)} className="w-full sm:w-auto">取消</Button>
            {hasPermission('users:create') && (
            <Button onClick={confirmExcelImport} disabled={importing} className="w-full sm:w-auto">
              {importing ? '导入中...' : `确认导入 ${excelImportData.length} 条`}
            </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </PageGuard>
  );
}
