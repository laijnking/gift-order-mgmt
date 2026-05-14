'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth';
import { Package, Lock, User, AlertCircle, Mail } from 'lucide-react';

interface BrandInfo {
  brandName?: string;
  logoUrl?: string;
  themeColor?: string;
  welcomeMessage?: string;
  tenantCode?: string;
}

export function LoginForm({ brand }: { brand: BrandInfo }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const systemName = brand.brandName || '礼品订单管理系统';
  const welcomeMessage = brand.welcomeMessage || 'Gift Order Management System';
  const themeColor = brand.themeColor || 'hsl(217, 91%, 60%)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) { router.replace('/'); router.refresh(); }
      else setError('用户名或密码错误');
    } catch { setError('登录失败，请重试'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-md" style={{ '--primary': themeColor } as React.CSSProperties}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 mb-6" style={brand.themeColor ? { backgroundColor: brand.themeColor } : {}}>
            {brand.logoUrl ? (
              <img src={brand.logoUrl} alt={systemName} className="w-10 h-10 object-contain" />
            ) : (
              <Package className="w-10 h-10 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">{systemName}</h1>
          <p className="text-muted-foreground mt-2 text-base">{welcomeMessage}</p>
          {brand.tenantCode && (
            <p className="text-xs text-muted-foreground/60 mt-1">{brand.tenantCode}.lp.lianxiaoyun.com</p>
          )}
        </div>

        <Card className="shadow-xl shadow-foreground/5 border-primary/10">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">用户登录</CardTitle>
            <CardDescription>输入您的账号信息登录系统</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="username" type="text" placeholder="请输入用户名" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="请输入密码" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>
              <Button type="submit" className="w-full h-11" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-1">
          <button className="text-sm text-muted-foreground hover:text-primary transition-colors" onClick={() => setForgotPasswordOpen(true)}>
            忘记密码?
          </button>
          <p className="text-xs text-muted-foreground/40">粤ICP备2025418442号</p>
        </div>

        <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>忘记密码</DialogTitle><DialogDescription>请联系系统管理员重置密码</DialogDescription></DialogHeader>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm">请联系您的租户管理员或系统管理员协助重置密码。</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
