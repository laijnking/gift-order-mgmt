'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { isManagementRole } from '@/lib/roles';
import LegacyHomePage from './legacy-home';
import WorkspacePage from './workspace-page';
import ConsolePage from './console-page';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, BarChart3, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

export type HomePageMode = 'legacy' | 'workspace' | 'console';

const modeConfig = {
  legacy: { label: '经典报表', icon: BarChart3 },
  workspace: { label: '工作台', icon: ClipboardList },
  console: { label: '专业控制台', icon: LayoutDashboard },
} as const;

export default function HomePage() {
  const { user } = useAuth();
  const [mode, setMode] = useState<HomePageMode>('legacy');
  const [isInitialized, setIsInitialized] = useState(false);

  // 从 localStorage 读取用户偏好的页面模式
  useEffect(() => {
    const savedMode = localStorage.getItem('homepage_mode') as HomePageMode | null;
    if (savedMode && modeConfig[savedMode]) {
      setMode(savedMode);
    }
    setIsInitialized(true);
  }, []);

  // 管理角色默认使用 console 模式
  useEffect(() => {
    if (!isInitialized || !user) return;

    const savedMode = localStorage.getItem('homepage_mode');
    if (savedMode) return; // 用户已有偏好，不覆盖

    // 管理角色默认使用 console 模式
    if (isManagementRole(user.role)) {
      setMode('console');
    }
  }, [user, isInitialized]);

  const handleModeChange = (newMode: HomePageMode) => {
    setMode(newMode);
    localStorage.setItem('homepage_mode', newMode);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-slate-400">加载中...</div>
      </div>
    );
  }

  const renderPage = () => {
    switch (mode) {
      case 'legacy':
        return <LegacyHomePage />;
      case 'workspace':
        return <WorkspacePage />;
      case 'console':
        return <ConsolePage />;
      default:
        return <LegacyHomePage />;
    }
  };

  return (
    <div className="relative">
      {/* 页面模式切换器 */}
      <div className="sticky top-0 z-20 flex justify-center py-2 bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
        <div className="inline-flex items-center gap-1 p-1 bg-white rounded-lg shadow-sm border border-slate-200">
          {(Object.entries(modeConfig) as [HomePageMode, typeof modeConfig.legacy][]).map(([key, config]) => {
            const Icon = config.icon;
            const isActive = mode === key;
            const colorClasses = isActive
              ? key === 'workspace'
                ? 'bg-blue-50 text-blue-700 shadow-sm'
                : key === 'console'
                ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                : 'bg-slate-100 text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50';

            return (
              <Button
                key={key}
                variant="ghost"
                size="sm"
                onClick={() => handleModeChange(key)}
                className={cn('h-7 px-3 text-xs font-medium rounded-md transition-all gap-1.5', colorClasses)}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
                {key === 'console' && isManagementRole(user?.role) && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-600 rounded font-medium">
                    管理员
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* 页面内容 */}
      <div className="mt-0">
        {renderPage()}
      </div>
    </div>
  );
}
