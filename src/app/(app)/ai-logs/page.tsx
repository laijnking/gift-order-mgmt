'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  FileText,
  RefreshCw,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Eye,
  Bot,
  Download,
  Trash2,
} from 'lucide-react';

interface AiLog {
  id: string;
  agent_id: string;
  agent_code: string;
  agent_name: string;
  input: string;
  output: string;
  status: string;
  duration_ms: number;
  model: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  error_message?: string;
  created_at: string;
}

interface Agent {
  id: string;
  code: string;
  name: string;
}

export default function AiLogsPage() {
  const [logs, setLogs] = useState<AiLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AiLog[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AiLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 筛选数据
  useEffect(() => {
    let filtered = logs;

    if (agentFilter !== 'all') {
      filtered = filtered.filter(l => l.agent_code === agentFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(l => l.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(l =>
        l.input?.toLowerCase().includes(term) ||
        l.output?.toLowerCase().includes(term) ||
        l.agent_name?.toLowerCase().includes(term)
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, agentFilter, statusFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsRes, agentsRes] = await Promise.all([
        fetch('/api/ai-logs?limit=100'),
        fetch('/api/agent-configs'),
      ]);

      const logsData = await logsRes.json();
      const agentsData = await agentsRes.json();

      if (logsData.success) {
        setLogs(logsData.data || []);
      }
      if (agentsData.success) {
        setAgents(agentsData.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = (log: AiLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const handleExport = () => {
    const headers = ['时间', 'Agent', '状态', '耗时(ms)', '输入', '输出'];
    const rows = filteredLogs.map(l => [
      new Date(l.created_at).toLocaleString(),
      l.agent_name || l.agent_code,
      l.status,
      String(l.duration_ms),
      (l.input || '').substring(0, 100),
      (l.output || '').substring(0, 100),
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai日志_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-500">成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDurationColor = (ms: number) => {
    if (ms < 1000) return 'text-green-600';
    if (ms < 3000) return 'text-yellow-600';
    return 'text-red-600';
  };

  // 统计数据
  const stats = {
    total: logs.length,
    success: logs.filter(l => l.status === 'success').length,
    failed: logs.filter(l => l.status === 'failed').length,
    avgDuration: logs.length > 0
      ? Math.round(logs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / logs.length)
      : 0,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <FileText className="h-8 w-8" />
              AI执行日志
          </h1>
          <p className="text-muted-foreground">
            查看AI Agent的执行记录和结果
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            导出
          </Button>
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总执行次数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">成功</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均耗时</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration}ms</div>
          </CardContent>
        </Card>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索输入输出内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={agentFilter || 'all'} onValueChange={(v) => setAgentFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="筛选Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部Agent</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.code} value={a.code}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="筛选状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="success">成功</SelectItem>
            <SelectItem value="failed">失败</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 日志列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">时间</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">耗时</TableHead>
                <TableHead>输入预览</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {logs.length === 0 ? '暂无日志记录' : '未找到匹配的日志'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className={log.status === 'failed' ? 'bg-red-50' : ''}>
                    <TableCell className="text-sm">
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <span>{log.agent_name || log.agent_code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(log.status)}
                        {getStatusBadge(log.status)}
                      </div>
                    </TableCell>
                    <TableCell className={`text-right font-mono ${getDurationColor(log.duration_ms)}`}>
                      {log.duration_ms}ms
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      <p className="text-sm truncate" title={log.input}>
                        {log.input || '-'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDetail(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        详情
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        共 {filteredLogs.length} 条日志
      </div>

      {/* 详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>日志详情</DialogTitle>
            <DialogDescription>
              {selectedLog && new Date(selectedLog.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-4 py-4">
              {/* 基本信息 */}
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Agent</p>
                  <p className="font-medium">{selectedLog.agent_name || selectedLog.agent_code}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(selectedLog.status)}
                    {getStatusBadge(selectedLog.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">耗时</p>
                  <p className={`font-mono font-medium ${getDurationColor(selectedLog.duration_ms)}`}>
                    {selectedLog.duration_ms}ms
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">模型</p>
                  <p className="font-medium">{selectedLog.model || '-'}</p>
                </div>
              </div>

              {/* 输入 */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>输入内容</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedLog.input)}>
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                </div>
                <Textarea
                  value={selectedLog.input}
                  readOnly
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>

              {/* 输出 */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label>输出结果</Label>
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(selectedLog.output)}>
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                </div>
                <Textarea
                  value={selectedLog.output}
                  readOnly
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>

              {/* 错误信息 */}
              {selectedLog.error_message && (
                <div className="grid gap-2">
                  <Label className="text-red-600">错误信息</Label>
                  <Textarea
                    value={selectedLog.error_message}
                    readOnly
                    rows={4}
                    className="font-mono text-sm text-red-600"
                  />
                </div>
              )}

              {/* 配置信息 */}
              {selectedLog.config && Object.keys(selectedLog.config).length > 0 && (
                <div className="grid gap-2">
                  <Label>配置参数</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.config, null, 2)}
                  </pre>
                </div>
              )}

              {/* 元数据 */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="grid gap-2">
                  <Label>元数据</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-sm font-medium ${className}`}>
      {children}
    </p>
  );
}
