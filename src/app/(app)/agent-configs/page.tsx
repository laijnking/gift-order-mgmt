'use client';

import { useState, useEffect } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Switch } from '@/components/ui/switch';
import { buildUserInfoHeaders, usePermission } from '@/lib/auth';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Edit,
  Trash2,
  Play,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Terminal,
} from 'lucide-react';

interface AgentConfig {
  id: string;
  code: string;
  name: string;
  type: string;
  description?: string;
  prompt_template: string;
  model: string;
  temperature: number;
  max_tokens?: number;
  is_active: boolean;
  is_default: boolean;
  test_input?: string;
  test_output?: string;
  test_status?: string;
  run_count: number;
  success_count: number;
  fail_count: number;
  avg_duration_ms: number;
  last_run_at?: string;
  created_at: string;
  updated_at: string;
}

type AgentTestMode = 'real' | 'mock';

const AGENT_TYPES = [
  { value: 'order_parser', label: '订单解析' },
  { value: 'price_query', label: '价格查询' },
  { value: 'supplier_match', label: '供应商匹配' },
  { value: 'text_classifier', label: '文本分类' },
  { value: 'custom', label: '自定义' },
];

const MODELS = [
  { value: 'doubao-seed', label: '豆包 Seed' },
  { value: 'doubao-pro', label: '豆包 Pro' },
  { value: 'kimi-chat', label: 'Kimi Chat' },
  { value: 'deepseek-chat', label: 'DeepSeek Chat' },
];

export default function AgentConfigsPage() {
  const { hasPermission } = usePermission();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [filteredAgents, setFilteredAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);
  const [testingAgent, setTestingAgent] = useState<AgentConfig | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testDuration, setTestDuration] = useState<number | null>(null);
  const [testMode, setTestMode] = useState<AgentTestMode>('real');
  const canEditAgentConfigs = hasPermission('agent_configs:edit');

  // 表单状态
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'custom',
    description: '',
    prompt_template: '',
    model: 'doubao-seed',
    temperature: 0.7,
    max_tokens: 2000,
    is_active: true,
    is_default: false,
  });

  // 加载数据
  useEffect(() => {
    loadAgents();
  }, []);

  // 筛选数据
  useEffect(() => {
    let filtered = agents;

    if (typeFilter !== 'all') {
      filtered = filtered.filter(a => a.type === typeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(a =>
        a.name.toLowerCase().includes(term) ||
        a.code.toLowerCase().includes(term) ||
        a.description?.toLowerCase().includes(term)
      );
    }

    setFilteredAgents(filtered);
  }, [agents, searchTerm, typeFilter]);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent-configs', { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) {
        setAgents(data.data || []);
      }
    } catch (error) {
      console.error('加载Agent配置失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!canEditAgentConfigs) {
      toast.error('当前账号没有编辑 Agent 配置的权限');
      return;
    }

    try {
      const url = editingAgent
        ? `/api/agent-configs/${editingAgent.id}`
        : '/api/agent-configs';
      const method = editingAgent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingAgent ? '更新成功' : '创建成功');
        setIsDialogOpen(false);
        resetForm();
        loadAgents();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleEdit = (agent: AgentConfig) => {
    setEditingAgent(agent);
    setFormData({
      code: agent.code,
      name: agent.name,
      type: agent.type,
      description: agent.description || '',
      prompt_template: agent.prompt_template,
      model: agent.model,
      temperature: agent.temperature,
      max_tokens: agent.max_tokens || 2000,
      is_active: agent.is_active,
      is_default: agent.is_default,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canEditAgentConfigs) {
      toast.error('当前账号没有编辑 Agent 配置的权限');
      return;
    }

    if (!confirm('确定要删除这个Agent配置吗？')) return;

    try {
      const res = await fetch(`/api/agent-configs/${id}`, {
        method: 'DELETE',
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        loadAgents();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const handleToggleActive = async (agent: AgentConfig) => {
    if (!canEditAgentConfigs) {
      toast.error('当前账号没有编辑 Agent 配置的权限');
      return;
    }

    try {
      const res = await fetch(`/api/agent-configs/${agent.id}`, {
        method: 'PUT',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !agent.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('状态更新成功');
        loadAgents();
      }
    } catch (error) {
      console.error('更新失败:', error);
      toast.error('更新失败');
    }
  };

  const handleTest = async () => {
    if (!canEditAgentConfigs) {
      toast.error('当前账号没有执行 Agent 测试的权限');
      return;
    }

    if (!testInput.trim()) {
      toast.error('请输入测试内容');
      return;
    }

    setIsTesting(true);
    setTestOutput('');
    setTestDuration(null);
    setTestMode('real');

    try {
      const res = await fetch('/api/ai-test', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentId: testingAgent?.id,
          input: testInput,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestOutput(data.data.output);
        setTestDuration(data.data.duration);
        const mode: AgentTestMode = data.data.mode === 'mock' ? 'mock' : 'real';
        setTestMode(mode);
        if (mode === 'mock') {
          toast.warning(data.message || '测试完成（模拟模式）');
        } else {
          toast.success('测试完成');
        }
      } else {
        setTestOutput(`错误: ${data.error}`);
        toast.error(data.error || '测试失败');
      }
    } catch (error) {
      console.error('测试失败:', error);
      setTestOutput(`错误: ${error}`);
      toast.error('测试失败');
    } finally {
      setIsTesting(false);
      loadAgents(); // 刷新统计数据
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      code: '',
      name: '',
      type: 'custom',
      description: '',
      prompt_template: '',
      model: 'doubao-seed',
      temperature: 0.7,
      max_tokens: 2000,
      is_active: true,
      is_default: false,
    });
  };

  const openTestDialog = (agent: AgentConfig) => {
    setTestingAgent(agent);
    setTestInput(agent.test_input || '');
    setTestOutput(agent.test_output || '');
    setTestDuration(null);
    setTestMode(agent.test_status === 'mock' ? 'mock' : 'real');
    setIsTestDialogOpen(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const getTypeLabel = (type: string) => {
    return AGENT_TYPES.find(t => t.value === type)?.label || type;
  };

  const templateVariables = [
    { var: '{input}', desc: '用户输入内容' },
    { var: '{customer_code}', desc: '客户代码' },
    { var: '{product_name}', desc: '商品名称' },
    { var: '{order_no}', desc: '订单号' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageGuard permission="agent_configs:view" title="无权查看 Agent 配置" description="当前账号没有查看 Agent 配置管理的权限。">
      <div className="space-y-6 px-3 py-4 sm:px-4 sm:py-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
              <Bot className="h-7 w-7 sm:h-8 sm:w-8" />
              Agent配置管理
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              配置AI Agent的 Prompt 模板和模型参数
            </p>
          </div>
          <Button
            onClick={() => { resetForm(); setIsDialogOpen(true); }}
            disabled={!canEditAgentConfigs}
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            新建Agent
          </Button>
        </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索Agent名称、编码..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="筛选类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            {AGENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredAgents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            {agents.length === 0 ? '暂无Agent配置' : '未找到匹配的Agent'}
          </div>
        ) : (
          filteredAgents.map((agent) => (
            <Card key={agent.id} className={!agent.is_active ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="truncate text-lg">{agent.name}</CardTitle>
                  </div>
                  <Switch
                    checked={agent.is_active}
                    disabled={!canEditAgentConfigs}
                    onCheckedChange={() => handleToggleActive(agent)}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{getTypeLabel(agent.type)}</Badge>
                  <code className="break-all text-xs text-muted-foreground">{agent.code}</code>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {agent.description || '暂无描述'}
                </p>

                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <span className="text-muted-foreground">模型：</span>
                    <span className="font-medium">{agent.model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">温度：</span>
                    <span className="font-medium">{agent.temperature}</span>
                  </div>
                </div>

                {agent.run_count > 0 && (
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      {agent.run_count}次运行
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {agent.success_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <XCircle className="h-3 w-3 text-red-500" />
                      {agent.fail_count}
                    </span>
                  </div>
                )}

                {agent.last_run_at && (
                  <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(agent.last_run_at).toLocaleString()}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-[120px]"
                    disabled={!canEditAgentConfigs}
                    onClick={() => openTestDialog(agent)}
                  >
                    <Play className="mr-1 h-3 w-3" />
                    测试
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!canEditAgentConfigs}
                    onClick={() => handleEdit(agent)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!canEditAgentConfigs}
                    onClick={() => handleDelete(agent.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        共 {filteredAgents.length} 个Agent配置
      </div>

      {/* 新建/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? '编辑Agent配置' : '新建Agent配置'}
            </DialogTitle>
            <DialogDescription>
              配置AI Agent的基本信息和Prompt模板
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="code">Agent编码 *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="如：order_parser"
                  disabled={!!editingAgent}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Agent名称 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="如：订单解析Agent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="type">类型 *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="model">模型</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => setFormData({ ...formData, model: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="简要描述Agent的功能"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="prompt_template">Prompt模板 *</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(formData.prompt_template)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  复制
                </Button>
              </div>
              <Textarea
                id="prompt_template"
                value={formData.prompt_template}
                onChange={(e) => setFormData({ ...formData, prompt_template: e.target.value })}
                placeholder="输入Prompt模板，使用 {input} 等变量..."
                rows={8}
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                <p>可用变量：</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {templateVariables.map((v) => (
                    <Badge key={v.var} variant="outline" className="font-mono">
                      {v.var} - {v.desc}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="temperature">温度 (0-1)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="max_tokens">最大Token数</Label>
                <Input
                  id="max_tokens"
                  type="number"
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) || 2000 })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">启用</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_default"
                  checked={formData.is_default}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_default: checked })}
                />
                <Label htmlFor="is_default">设为默认</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!canEditAgentConfigs || !formData.code || !formData.name || !formData.prompt_template}>
              {editingAgent ? '保存修改' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 测试对话框 */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>测试Agent - {testingAgent?.name}</DialogTitle>
            <DialogDescription>
              输入测试内容并查看AI响应
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>模型参数</Label>
              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-4">
                <span>模型：{testingAgent?.model}</span>
                <span>温度：{testingAgent?.temperature}</span>
                <span>最大Token：{testingAgent?.max_tokens}</span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="test_input">输入内容</Label>
              <Textarea
                id="test_input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                placeholder="输入测试内容..."
                rows={6}
                className="font-mono text-sm"
              />
            </div>

            <div className="flex justify-center">
              <Button onClick={handleTest} disabled={!canEditAgentConfigs || isTesting || !testInput.trim()}>
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    运行中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    执行测试
                  </>
                )}
              </Button>
            </div>

            {testDuration !== null && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                耗时 {testDuration}ms
              </div>
            )}

            {testMode === 'mock' && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                当前为模拟测试模式，尚未接入真实大模型调用。
              </div>
            )}

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>输出结果</Label>
                {testOutput && (
                  <Button variant="ghost" size="sm" onClick={() => copyToClipboard(testOutput)}>
                    <Copy className="h-3 w-3 mr-1" />
                    复制
                  </Button>
                )}
              </div>
              <Textarea
                value={testOutput}
                readOnly
                placeholder="AI响应将显示在这里..."
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            {testingAgent?.test_input && !testInput && (
              <div className="text-xs text-muted-foreground">
                <p>上次测试输入：</p>
                <code className="block bg-muted p-2 rounded mt-1 whitespace-pre-wrap">
                  {testingAgent.test_input}
                </code>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
