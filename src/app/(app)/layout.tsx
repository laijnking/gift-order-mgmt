'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Package, BarChart3, Warehouse, Users, Bot, FileText,
  Link2, Settings, ChevronLeft, ChevronRight, LogOut, User,
  Building2, Truck, Menu, X, ChevronDown, Bell, DollarSign,
  UserCircle, Lock, Mail, Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { buildUserInfoHeaders } from '@/lib/auth';

interface MenuItem {
  label: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
  permissions?: string[];
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  { label: '首页', href: '/', icon: BarChart3 },
  { label: '订单中心', href: '/orders', icon: Package },
  { label: 'AI订单录入', href: '/order-parse', icon: Bot },
  { label: '发货通知单', href: '/shipping-export', icon: Truck },
  { label: '物流回单', href: '/return-receipt', icon: Package },
  { label: '客户回单', href: '/export-records', icon: FileText },
  { label: '库存管理', href: '/stocks', icon: Warehouse },
  { label: '历史成本库', href: '/order-cost-history', icon: DollarSign },
  { label: '数据报表', href: '/reports', icon: BarChart3 },
  {
    label: '档案管理',
    href: '/archive',
    icon: Building2,
    children: [
      { label: '档案概览', href: '/archive', icon: Building2 },
      { label: '客户管理', href: '/customers', icon: Users },
      { label: '发货方管理', href: '/suppliers-manage', icon: Truck },
      { label: '商品管理', href: '/products', icon: Package },
      { label: 'SKU映射', href: '/sku-mappings', icon: Link2 },
    ]
  },
  {
    label: '系统设置',
    href: '/users',
    icon: Settings,
    permissions: ['settings:view'],
    children: [
      { label: '用户管理', href: '/users', icon: Users },
      { label: '角色与权限', href: '/roles', icon: Settings },
      { label: '预警设置', href: '/alerts', icon: Bell },
      { label: '模板配置', href: '/templates', icon: Settings },
    ]
  },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['档案管理', '系统设置']));
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [userProfile, setUserProfile] = useState({ phone: '', email: '' });
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  // 公开路径
  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.some(p => pathname.startsWith(p));

  useEffect(() => {
    if (!isLoading && !user && !isPublicPath) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router, isPublicPath]);

  const toggleMenu = (label: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedMenus(newExpanded);
  };

  // 加载用户资料
  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/users/me', {
        headers: buildUserInfoHeaders(user),
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile({
          phone: data.data.phone || '',
          email: data.data.email || '',
        });
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
    }
  };

  // 修改密码
  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !oldPassword) {
      toast.error('请填写所有字段');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('新密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('两次输入的新密码不一致');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders(user) },
        body: JSON.stringify({ oldPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('密码修改成功');
        setPasswordDialogOpen(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || '密码修改失败');
      }
    } catch {
      toast.error('密码修改失败，请重试');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  // 更新个人资料
  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/users/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders(user) },
        body: JSON.stringify(userProfile),
      });
      const data = await res.json();

      if (data.success) {
        toast.success('资料更新成功');
        setProfileDialogOpen(false);
      } else {
        toast.error(data.error || '资料更新失败');
      }
    } catch {
      toast.error('资料更新失败，请重试');
    }
  };

  // 打开个人资料弹窗
  const handleOpenProfile = () => {
    setUserMenuOpen(false);
    loadUserProfile();
    setProfileDialogOpen(true);
  };

  // 打开修改密码弹窗
  const handleOpenPassword = () => {
    setUserMenuOpen(false);
    setPasswordDialogOpen(true);
  };

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const visibleMenuItems = menuItems.filter(item => {
    const roleAllowed = !item.roles || item.roles.includes(user.role);
    const permissionAllowed = !item.permissions || item.permissions.some(permission => user.permissions.includes(permission));
    return roleAllowed && permissionAllowed;
  });

  const renderMenuItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.has(item.label);
    const isActive = pathname === item.href || (item.href && item.href !== '/' && pathname.startsWith(item.href));
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleMenu(item.label)}
            className={`
              w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
              transition-all duration-200
              ${isActive 
                ? 'bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-primary border-l-2 border-sidebar-primary' 
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }
              ${collapsed ? 'justify-center' : ''}
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          
          {!collapsed && isExpanded && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children?.map((child) => {
                const childIsActive = pathname === child.href || (child.href && child.href !== '/' && pathname.startsWith(child.href));
                const ChildIcon = child.icon;
                return (
                  <Link
                    key={child.label}
                    href={child.href || '#'}
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                      transition-colors
                      ${childIsActive 
                        ? 'bg-sidebar-primary/10 text-sidebar-primary font-medium' 
                        : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                      }
                    `}
                  >
                    <ChildIcon className="w-4 h-4 flex-shrink-0" />
                    <span>{child.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.label}
        href={item.href || '#'}
        onClick={() => setMobileOpen(false)}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg
          transition-all duration-200
          ${isActive 
            ? 'bg-gradient-to-r from-sidebar-primary/20 to-sidebar-primary/10 text-sidebar-primary border-l-2 border-sidebar-primary' 
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
          }
          ${collapsed ? 'justify-center' : ''}
        `}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed left-3 top-3 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-background/95 shadow-sm backdrop-blur"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 left-0 h-full z-50
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-[70px]' : 'w-[240px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-gradient-to-b from-sidebar to-sidebar/95
          border-r border-sidebar-border
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                <Package className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-bold text-base text-sidebar-foreground">礼品订单</span>
                <span className="block text-[10px] text-sidebar-foreground/60 -mt-0.5">管理系统</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center mx-auto shadow-sm">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Menu - 可滚动区域 */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/40">
          {visibleMenuItems.map((item) => renderMenuItem(item))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex justify-center py-2 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="bg-sidebar-accent/50 hover:bg-sidebar-accent text-sidebar-accent-foreground"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* User info */}
        <div className={`p-3 border-t border-sidebar-border bg-sidebar/50 shrink-0 ${collapsed ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-9 h-9 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity"
            >
              <User className="w-4 h-4 text-sidebar-primary-foreground" />
            </button>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="w-full text-left"
                >
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{user.realName || user.username}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {user.roleName || user.role}
                  </p>
                </button>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* User dropdown menu */}
          {userMenuOpen && !collapsed && (
            <div className="absolute bottom-16 left-0 w-[200px] bg-sidebar border border-sidebar-border rounded-lg shadow-lg py-1 z-50">
              <button
                onClick={handleOpenProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <UserCircle className="w-4 h-4" />
                个人资料
              </button>
              <button
                onClick={handleOpenPassword}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <Lock className="w-4 h-4" />
                修改密码
              </button>
              <div className="my-1 border-t border-sidebar-border" />
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main 
        className={`
          min-h-screen transition-all duration-300 pt-16 lg:pt-0
          ${collapsed ? 'lg:ml-[70px]' : 'lg:ml-[240px]'}
        `}
      >
        {children}
      </main>

      {/* 修改密码对话框 */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>修改密码</DialogTitle>
            <DialogDescription>请输入您的新密码</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="old-password">原密码</Label>
              <Input
                id="old-password"
                type="password"
                placeholder="请输入原密码"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="至少6位字符"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="再次输入新密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setPasswordDialogOpen(false);
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={changePasswordLoading}
              className="w-full sm:w-auto"
            >
              {changePasswordLoading ? '修改中...' : '确认修改'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 个人资料对话框 */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>个人资料</DialogTitle>
            <DialogDescription>修改您的个人信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="profile-username">用户名</Label>
              <Input
                id="profile-username"
                value={user?.username || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">用户名不可修改</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-realname">姓名</Label>
              <Input
                id="profile-realname"
                value={user?.realName || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-role">角色</Label>
              <Input
                id="profile-role"
                value={user?.roleName || user?.role || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                手机号
              </Label>
              <Input
                id="profile-phone"
                placeholder="请输入手机号"
                value={userProfile.phone}
                onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                邮箱
              </Label>
              <Input
                id="profile-email"
                type="email"
                placeholder="请输入邮箱"
                value={userProfile.email}
                onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setProfileDialogOpen(false)}
              className="w-full sm:w-auto"
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateProfile}
              className="w-full sm:w-auto"
            >
              保存修改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
