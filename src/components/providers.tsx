'use client';

import { AuthProvider } from '@/lib/auth';
import { TabsProvider } from '@/components/providers/tabs-context';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TabsProvider>{children}</TabsProvider>
    </AuthProvider>
  );
}
