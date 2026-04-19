'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { Package, Lock, User, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        router.replace('/');
        router.refresh();
      } else {
        setError('用户名或密码错误');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20 mb-6">
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">礼品订单管理系统</h1>
          <p className="text-muted-foreground mt-2 text-base">Gift Order Management System</p>
        </div>

        {/* Login Card */}
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
                <Label htmlFor="username" className="text-sm font-medium">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">密码</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </form>

            {/* Demo Accounts */}
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3">演示账号：</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-muted rounded-md">
                  <p className="font-medium">管理员</p>
                  <p className="text-muted-foreground">admin</p>
                  <p className="text-muted-foreground">admin123</p>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <p className="font-medium">业务员</p>
                  <p className="text-muted-foreground">salesperson</p>
                  <p className="text-muted-foreground">sales123</p>
                </div>
                <div className="p-2 bg-muted rounded-md">
                  <p className="font-medium">跟单员</p>
                  <p className="text-muted-foreground">operator</p>
                  <p className="text-muted-foreground">operator123</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link href="/" className="underline hover:text-foreground">
            返回首页
          </Link>
        </p>
      </div>
    </div>
  );
}
