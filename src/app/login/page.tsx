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

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
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
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <button
            type="button"
            onClick={() => setForgotPasswordOpen(true)}
            className="underline hover:text-foreground bg-transparent border-none cursor-pointer"
          >
            忘记密码？
          </button>
        </p>

        {/* 忘记密码对话框 */}
        <ForgotPasswordDialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen} />

        {/* 底部版权信息 */}
        <div className="text-center text-xs text-muted-foreground mt-6 space-y-1">
          <p>© 2025 深圳链销云科技有限公司.版权所有</p>
          <p>粤ICP备2025418442号</p>
        </div>
      </div>
    </div>
  );
}

// 忘记密码对话框组件
function ForgotPasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState<'input' | 'verify' | 'reset' | 'success'>('input');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep('input');
      setEmail('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setCountdown(0);
    }, 200);
  };

  const handleSendCode = async () => {
    if (!email) {
      setError('请输入邮箱地址');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('verify');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        setError(data.error || '发送验证码失败');
      }
    } catch {
      setError('发送验证码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code) {
      setError('请输入验证码');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('reset');
      } else {
        setError(data.error || '验证码错误');
      }
    } catch {
      setError('验证失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError('请输入新密码');
      return;
    }
    if (newPassword.length < 6) {
      setError('密码长度不能少于6位');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setStep('success');
      } else {
        setError(data.error || '重置密码失败');
      }
    } catch {
      setError('重置密码失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' && '找回密码'}
            {step === 'verify' && '输入验证码'}
            {step === 'reset' && '设置新密码'}
            {step === 'success' && '密码重置成功'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input' && '请输入您注册时使用的邮箱地址'}
            {step === 'verify' && `验证码已发送至 ${email}，请查收`}
            {step === 'reset' && '请设置您的新密码'}
            {step === 'success' && '您可以使用新密码登录账号了'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-lg border border-destructive/20">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {step === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">邮箱地址</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="请输入注册邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSendCode} disabled={loading} className="w-full">
                {loading ? '发送中...' : '发送验证码'}
              </Button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verify-code">验证码</Label>
                <div className="flex gap-2">
                  <Input
                    id="verify-code"
                    placeholder="请输入6位验证码"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={loading || countdown > 0}
                    className="whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}秒后重发` : '获取验证码'}
                  </Button>
                </div>
              </div>
              <Button onClick={handleVerifyCode} disabled={loading} className="w-full">
                {loading ? '验证中...' : '下一步'}
              </Button>
            </div>
          )}

          {step === 'reset' && (
            <div className="space-y-4">
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
                <Label htmlFor="confirm-password">确认密码</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="再次输入新密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleResetPassword} disabled={loading} className="w-full">
                {loading ? '重置中...' : '确认重置'}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-muted-foreground mb-4">密码重置成功，请使用新密码登录</p>
              <Button onClick={handleClose} className="w-full">
                返回登录
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
