'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface Tab {
  id: string;
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  closable: boolean;
}

interface TabsContextType {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Omit<Tab, 'id'>) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  const addTab = useCallback((tab: Omit<Tab, 'id'>) => {
    setTabs((prevTabs) => {
      // 检查是否已存在
      const existing = prevTabs.find((t) => t.href === tab.href);
      if (existing) {
        setActiveTabId(existing.id);
        return prevTabs;
      }

      const newTab: Tab = {
        ...tab,
        id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      };

      setActiveTabId(newTab.id);
      // 限制最多打开 10 个标签
      const newTabs = [...prevTabs, newTab];
      if (newTabs.length > 10) {
        return newTabs.slice(-10);
      }
      return newTabs;
    });
  }, []);

  const removeTab = useCallback((id: string) => {
    setTabs((prevTabs) => {
      const index = prevTabs.findIndex((t) => t.id === id);
      const newTabs = prevTabs.filter((t) => t.id !== id);

      // 如果关闭的是当前激活的 tab，切换到相邻的 tab
      if (activeTabId === id && newTabs.length > 0) {
        const newActiveIndex = Math.min(index, newTabs.length - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }

      return newTabs;
    });
  }, [activeTabId]);

  const setActiveTab = useCallback((id: string) => {
    setActiveTabId(id);
  }, []);

  const closeAllTabs = useCallback(() => {
    setTabs([]);
    setActiveTabId(null);
  }, []);

  const closeOtherTabs = useCallback((id: string) => {
    setTabs((prevTabs) => prevTabs.filter((t) => t.id === id || !t.closable));
    setActiveTabId(id);
  }, []);

  return (
    <TabsContext.Provider
      value={{
        tabs,
        activeTabId,
        addTab,
        removeTab,
        setActiveTab,
        closeAllTabs,
        closeOtherTabs,
      }}
    >
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
}
