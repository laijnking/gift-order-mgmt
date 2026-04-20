'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import {
  Package, BarChart3, Warehouse, Users, Bot, FileText,
  Link2, Settings, ChevronLeft, ChevronRight, LogOut, User,
  Building2, Truck, Menu, X, ChevronDown, Bell, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen]);

  const toggleMenu = (label: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedMenus(newExpanded);
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
  const hideSidebarLabels = collapsed && !mobileOpen;

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
              ${hideSidebarLabels ? 'justify-center' : ''}
            `}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!hideSidebarLabels && (
              <>
                <span className="flex-1 text-sm font-medium text-left">{item.label}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
          
          {!hideSidebarLabels && isExpanded && (
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
          ${hideSidebarLabels ? 'justify-center' : ''}
        `}
        title={hideSidebarLabels ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!hideSidebarLabels && <span className="text-sm font-medium">{item.label}</span>}
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
          w-[min(85vw,320px)] ${collapsed ? 'lg:w-[70px]' : 'lg:w-[240px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          bg-gradient-to-b from-sidebar to-sidebar/95
          border-r border-sidebar-border
          flex flex-col
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
          {!hideSidebarLabels && (
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
          {hideSidebarLabels && (
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
        <div className={`p-3 border-t border-sidebar-border bg-sidebar/50 shrink-0 ${hideSidebarLabels ? 'text-center' : ''}`}>
          <div className={`flex items-center gap-3 ${hideSidebarLabels ? 'justify-center' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 rounded-full flex items-center justify-center shadow-sm">
              <User className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            {!hideSidebarLabels && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.realName || user.username}</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {user.roleName || user.role}
                </p>
              </div>
            )}
            {!hideSidebarLabels && (
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
    </div>
  );
}
