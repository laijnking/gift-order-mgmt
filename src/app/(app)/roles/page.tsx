'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Shield,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  FileText,
  Package,
  Truck,
  Warehouse,
  BarChart3,
  Settings,
} from 'lucide-react';

interface Permission {
  id: string;
  code: string;
  name: string;
  category: string;
}

interface Role {
  id: string;
  code: string;
  name: string;
  description: string;
  data_scope: string;
  is_system: boolean;
  is_active: boolean;
  permissions?: string[];
  created_at: string;
}

const DATA_SCOPE_OPTIONS = [
  { value: 'self', label: '仅本人', desc: '只能查看和操作自己的数据' },
  { value: 'department', label: '本部门', desc: '可以查看和操作本部门的数据' },
  { value: 'all', label: '全部', desc: '可以查看和操作所有数据' },
];

// 分类图标映射
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '订单管理': FileText,
  '客户管理': Users,
  '供应商管理': Truck,
  '商品管理': Package,
  '库存管理': Warehouse,
  '系统设置': Settings,
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    dataScope: 'self',
    isActive: true,
    permissions: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadRoles(), loadPermissions()]);
    setLoading(false);
  };

  const loadRoles = async () => {
    try {
      const res = await fetch('/api/roles?includePermissions=true');
      const data = await res.json();
      if (data.success) {
        setRoles(data.data || []);
      }
    } catch (error) {
      console.error('获取角色失败:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const res = await fetch('/api/permissions');
      const data = await res.json();
      if (data.success) {
        setPermissions(data.data || []);
      }
    } catch (error) {
      console.error('获取权限失败:', error);
    }
  };

  const filteredRoles = roles.filter(role => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      role.name.toLowerCase().includes(term) ||
      role.code.toLowerCase().includes(term) ||
      role.description?.toLowerCase().includes(term)
    );
  });

  // 动态获取权限分类
  const permissionCategories = useMemo(() => {
    const categories = new Set(permissions.map(p => p.category).filter(Boolean));
    return Array.from(categories).map(cat => ({
      key: cat,
      icon: CATEGORY_ICONS[cat] || Shield,
    }));
  }, [permissions]);

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      dataScope: 'self',
      isActive: true,
      permissions: [],
    });
    setEditingRole(null);
    setActiveTab('basic');
  };

  const handleOpenDialog = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        code: role.code,
        name: role.name,
        description: role.description || '',
        dataScope: role.data_scope || 'self',
        isActive: role.is_active ?? true,
        permissions: role.permissions || [],
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入角色名称');
      return;
    }

    try {
      // 自动生成编码（如果为空）
      const codeToSubmit = formData.code.trim() || `role_${Date.now()}`;
      
      const url = editingRole ? `/api/roles/${editingRole.id}` : '/api/roles';
      const method = editingRole ? 'PUT' : 'POST';

      // 将 permission codes 转换为 IDs
      const permissionIds = formData.permissions
        .map(code => permissions.find(p => p.code === code)?.id)
        .filter(Boolean);

      const payload = {
        ...formData,
        code: codeToSubmit,
        permissions: permissionIds,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingRole ? '角色更新成功' : '角色创建成功');
        setDialogOpen(false);
        loadRoles();
        resetForm();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/roles/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('角色删除成功');
        setDeleteConfirmId(null);
        loadRoles();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const togglePermission = (permCode: string) => {
    const newPerms = formData.permissions.includes(permCode)
      ? formData.permissions.filter(p => p !== permCode)
      : [...formData.permissions, permCode];
    setFormData({ ...formData, permissions: newPerms });
  };

  const toggleCategory = (category: string, checked: boolean) => {
    const categoryPerms = permissions
      .filter(p => p.category === category)
      .map(p => p.code);
    
    if (checked) {
      setFormData({
        ...formData,
        permissions: [...new Set([...formData.permissions, ...categoryPerms])],
      });
    } else {
      setFormData({
        ...formData,
        permissions: formData.permissions.filter(p => !categoryPerms.includes(p)),
      });
    }
  };

  const getCategoryPermissions = (category: string) => {
    return permissions.filter(p => p.category === category);
  };

  const isCategoryAllSelected = (category: string) => {
    const categoryPerms = getCategoryPermissions(category);
    return categoryPerms.every(p => formData.permissions.includes(p.code));
  };

  const isCategoryPartialSelected = (category: string) => {
    const categoryPerms = getCategoryPermissions(category);
    const selected = categoryPerms.filter(p => formData.permissions.includes(p.code)).length;
    return selected > 0 && selected < categoryPerms.length;
  };

  const getRolePermissionCount = (role: Role) => {
    return role.permissions?.length || 0;
  };

  const getDataScopeLabel = (scope: string) => {
    return DATA_SCOPE_OPTIONS.find(o => o.value === scope)?.label || scope;
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            角色管理
          </h1>
          <p className="text-muted-foreground">
            管理系统角色和权限配置
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          新增角色
        </Button>
      </div>

      {/* 筛选 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索角色名称/编码..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadData}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              刷新
            </Button>
            <Badge variant="outline">
              共 {filteredRoles.length} 个角色
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 角色列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">角色名称</TableHead>
                <TableHead>角色编码</TableHead>
                <TableHead>数据权限</TableHead>
                <TableHead>权限数量</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : filteredRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">暂无角色数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {role.code === 'admin' ? (
                          <ShieldCheck className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Shield className="h-5 w-5 text-gray-400" />
                        )}
                        <span className="font-medium">{role.name}</span>
                      </div>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{role.code}</code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDataScopeLabel(role.data_scope)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getRolePermissionCount(role)} 个权限</Badge>
                    </TableCell>
                    <TableCell>
                      {role.is_active ? (
                        <Badge className="bg-green-100 text-green-800">启用</Badge>
                      ) : (
                        <Badge variant="secondary">禁用</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {role.code === 'admin' ? (
                        <Badge className="bg-blue-100 text-blue-800">系统角色</Badge>
                      ) : (
                        <Badge variant="outline">自定义</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(role)} disabled={role.code === 'admin'}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!role.is_system && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(role.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 新增/编辑角色对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingRole ? '编辑角色' : '新增角色'}</DialogTitle>
            <DialogDescription>
              {editingRole ? '修改角色配置' : '创建新的角色并配置权限'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="permissions">权限配置</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>

            {/* 基本信息 */}
            <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>角色名称 *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如: 销售主管"
                    disabled={editingRole?.code === 'admin'}
                  />
                </div>
                <div className="space-y-2">
                  <Label>角色编码</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="留空将自动生成"
                    disabled={!!editingRole}
                  />
                  <p className="text-xs text-muted-foreground">
                    留空将自动生成唯一编码
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>角色描述</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="简要描述此角色的职责..."
                  disabled={editingRole?.code === 'admin'}
                />
              </div>

              <div className="space-y-3">
                <Label>数据权限范围</Label>
                <div className="grid grid-cols-3 gap-3">
                  {DATA_SCOPE_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={`
                        p-4 border rounded-lg cursor-pointer transition-all
                        ${formData.dataScope === option.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                        }
                      `}
                      onClick={() => setFormData({ ...formData, dataScope: option.value })}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`
                          w-5 h-5 rounded-full border-2 flex items-center justify-center
                          ${formData.dataScope === option.value
                            ? 'border-primary bg-primary'
                            : 'border-gray-300'
                          }
                        `}>
                          {formData.dataScope === option.value && (
                            <Check className="w-3 h-3 text-primary-foreground" />
                          )}
                        </div>
                        <span className="font-medium">{option.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 ml-7">{option.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(v) => setFormData({ ...formData, isActive: !!v })}
                  disabled={editingRole?.code === 'admin'}
                />
                <Label htmlFor="isActive" className="cursor-pointer">启用角色</Label>
              </div>
            </TabsContent>

            {/* 权限配置 */}
            <TabsContent value="permissions" className="flex-1 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>功能权限配置</Label>
                  <p className="text-sm text-muted-foreground">
                    已选择 {formData.permissions.length} 个权限
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData({ ...formData, permissions: [] })}
                  disabled={editingRole?.code === 'admin'}
                >
                  清空全部
                </Button>
              </div>

              <div className="space-y-4">
                {permissionCategories.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无权限数据，请先配置权限
                  </div>
                ) : (
                  permissionCategories.map((category) => {
                    const categoryPerms = getCategoryPermissions(category.key);
                    if (categoryPerms.length === 0) return null;

                    const isAllSelected = isCategoryAllSelected(category.key);
                    const isPartial = isCategoryPartialSelected(category.key);
                    const Icon = category.icon;

                    return (
                      <Card key={category.key}>
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`cat-${category.key}`}
                                checked={isAllSelected}
                                ref={(el) => {
                                  if (el) (el as unknown as { indeterminate: boolean }).indeterminate = isPartial;
                                }}
                                onCheckedChange={(v) => toggleCategory(category.key, !!v)}
                                disabled={editingRole?.code === 'admin'}
                              />
                              <Label htmlFor={`cat-${category.key}`} className="cursor-pointer font-medium flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {category.key}
                              </Label>
                            </div>
                            <Badge variant="secondary">
                              {categoryPerms.filter(p => formData.permissions.includes(p.code)).length}/{categoryPerms.length}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2">
                            {categoryPerms.map((perm) => (
                              <div
                                key={perm.id}
                                className={`
                                  flex items-center gap-2 p-2 rounded border cursor-pointer
                                  ${formData.permissions.includes(perm.code)
                                    ? 'border-primary bg-primary/5'
                                    : 'border-transparent hover:bg-muted'
                                  }
                                  ${editingRole?.is_system ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                onClick={() => {
                                  if (!editingRole?.is_system) {
                                    togglePermission(perm.code);
                                  }
                                }}
                              >
                                <Checkbox
                                  checked={formData.permissions.includes(perm.code)}
                                  onCheckedChange={() => {}}
                                  disabled={editingRole?.code === 'admin'}
                                />
                                <span className="text-sm">{perm.name}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* 预览 */}
            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              <Card>
                <CardHeader>
                  <CardTitle>{formData.name || '未命名角色'}</CardTitle>
                  <CardDescription>{formData.description || '暂无描述'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">角色编码</p>
                      <p className="font-medium">{formData.code || '-'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">数据权限</p>
                      <p className="font-medium">{getDataScopeLabel(formData.dataScope)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">状态</p>
                      <Badge className={formData.isActive ? 'bg-green-100 text-green-800' : ''}>
                        {formData.isActive ? '启用' : '禁用'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">权限数量</p>
                      <p className="font-medium">{formData.permissions.length} 个</p>
                    </div>
                  </div>

                  {formData.permissions.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">权限清单</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.permissions.map((permCode) => {
                          const perm = permissions.find(p => p.code === permCode);
                          return perm ? (
                            <Badge key={permCode} variant="secondary">
                              {perm.category}: {perm.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit} disabled={editingRole?.code === 'admin'}>
              {editingRole ? '保存修改' : '创建角色'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此角色吗？删除后，使用此角色的用户将失去对应权限。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
