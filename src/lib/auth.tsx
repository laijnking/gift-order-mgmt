'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  realName: string;
  role: 'admin' | 'salesperson' | 'operator';
  department?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 默认用户数据（简化版，实际应从后端验证）
export const DEMO_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      realName: '系统管理员',
      role: 'admin',
      department: '管理部',
    },
  },
  salesperson: {
    password: 'sales123',
    user: {
      id: '2',
      username: 'salesperson',
      realName: '张三（业务员）',
      role: 'salesperson',
      department: '销售部',
    },
  },
  operator: {
    password: 'operator123',
    user: {
      id: '3',
      username: 'operator',
      realName: '李四（跟单员）',
      role: 'operator',
      department: '跟单部',
    },
  },
};

// 独立的登录验证函数（可在无Context时使用）
export async function validateLogin(username: string, password: string): Promise<User | null> {
  const demoUser = DEMO_USERS[username];
  if (demoUser && demoUser.password === password) {
    return demoUser.user;
  }
  return null;
}

// 从 localStorage 获取当前登录用户信息
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') return null;
  const savedUser = localStorage.getItem('gift_order_user');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  }
  return null;
}

// 获取用户数据权限范围（需配合角色表使用）
// 本地模拟：根据用户角色返回默认数据权限
export function getUserDataScope(user: User | null): string {
  if (!user) return 'all';
  switch (user.role) {
    case 'admin':
      return 'all';      // 管理员：全部数据
    case 'salesperson':
      return 'self';     // 业务员：仅本人
    case 'operator':
      return 'self';     // 跟单员：仅本人
    default:
      return 'self';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // 页面加载时检查本地存储的登录状态
  useEffect(() => {
    const savedUser = localStorage.getItem('gift_order_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('gift_order_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500));

    const demoUser = DEMO_USERS[username];
    if (demoUser && demoUser.password === password) {
      setUser(demoUser.user);
      localStorage.setItem('gift_order_user', JSON.stringify(demoUser.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gift_order_user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 权限定义
export type Permission =
  | 'dashboard:view'
  | 'orders:view' | 'orders:create' | 'orders:edit' | 'orders:delete' | 'orders:export'
  | 'customers:view' | 'customers:create' | 'customers:edit' | 'customers:delete'
  | 'suppliers:view' | 'suppliers:create' | 'suppliers:edit' | 'suppliers:delete'
  | 'products:view' | 'products:create' | 'products:edit' | 'products:delete'
  | 'stocks:view' | 'stocks:edit'
  | 'users:view' | 'users:create' | 'users:edit' | 'users:delete'
  | 'agent_configs:view' | 'agent_configs:edit'
  | 'ai_logs:view'
  | 'settings:view';

// 角色权限矩阵
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'dashboard:view',
    'orders:view', 'orders:create', 'orders:edit', 'orders:delete', 'orders:export',
    'customers:view', 'customers:create', 'customers:edit', 'customers:delete',
    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete',
    'products:view', 'products:create', 'products:edit', 'products:delete',
    'stocks:view', 'stocks:edit',
    'users:view', 'users:create', 'users:edit', 'users:delete',
    'agent_configs:view', 'agent_configs:edit',
    'ai_logs:view',
    'settings:view',
  ],
  salesperson: [
    'dashboard:view',
    'orders:view', 'orders:create', 'orders:edit', 'orders:export',
    'customers:view', 'customers:create', 'customers:edit',
    'suppliers:view',
    'products:view',
    'stocks:view',
  ],
  operator: [
    'dashboard:view',
    'orders:view', 'orders:create', 'orders:edit',
    'customers:view',
    'suppliers:view',
    'products:view',
    'stocks:view',
  ],
};

// 权限检查钩子
export function usePermission() {
  const { user } = useAuth();

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions };
}
