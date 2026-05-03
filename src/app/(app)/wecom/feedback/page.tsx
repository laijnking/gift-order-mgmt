'use client';

import { useEffect, useState } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { buildUserInfoHeaders } from '@/lib/auth';
import { RefreshCw, CheckCircle2, XCircle, Clock, Upload, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface FeedbackTask {
  id: string;
  group_id: string;
  orders_count: number;
  status: string;
  error_message: string | null;
  retry_count: number;
  sent_at: string | null;
  created_at: string;
  customers?: { name: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4" /> },
  exporting: { label: '导出中', color: 'bg-blue-100 text-blue-800', icon: <Upload className="w-4 h-4" /> },
  uploading: { label: '上传中', color: 'bg-purple-100 text-purple-800', icon: <Upload className="w-4 h-4" /> },
  sent: { label: '已发送', color: 'bg-green-100 text-green-800', icon: <CheckCircle2 className="w-4 h-4" /> },
  failed: { label: '失败', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

export default function WeComFeedbackPage() {
  return (
    <PageGuard permission="wecom:manage">
      <WeComFeedbackContent />
    </PageGuard>
  );
}

function WeComFeedbackContent() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedbackTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: '' });
  const [total, setTotal] = useState(0);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set('status', filter.status);
      const res = await fetch(`/api/wecom/manage/feedback?${params}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.data || []);
        setTotal(data.total || 0);
      }
    } catch {
      toast.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (taskId: string) => {
    try {
      const res = await fetch('/api/wecom/manage/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders(user) },
        body: JSON.stringify({ task_id: taskId, action: 'resend' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已重新发送');
        loadItems();
      } else {
        toast.error(data.error || '重发失败');
      }
    } catch {
      toast.error('重发失败');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">回单发送记录</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 条记录</p>
        </div>
        <Button onClick={loadItems} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              className="border rounded-md px-3 py-2 text-sm"
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
            >
              <option value="">全部状态</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <Button onClick={loadItems} variant="outline">
              搜索
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">加载中...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">暂无记录</div>
        ) : (
          items.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            return (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {statusConfig.icon}
                      <div>
                        <p className="font-medium">客户: {item.customers?.name || '未知'}</p>
                        <p className="text-sm text-muted-foreground">
                          群ID: {item.group_id.slice(0, 20)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          创建时间: {new Date(item.created_at).toLocaleString()}
                          {item.sent_at && ` | 发送时间: ${new Date(item.sent_at).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-sm">
                        订单数: {item.orders_count}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        重试: {item.retry_count}
                      </span>
                      {item.status === 'failed' && (
                        <Button size="sm" variant="outline" onClick={() => handleResend(item.id)}>
                          重发
                        </Button>
                      )}
                    </div>
                  </div>
                  {item.error_message && (
                    <p className="mt-2 text-sm text-red-600">错误: {item.error_message}</p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
