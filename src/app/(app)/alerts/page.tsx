'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Bell,
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Info,
  Search,
  RefreshCw,
  Eye,
  CheckCheck,
  X,
  Settings,
  Plus,
  Trash2,
} from 'lucide-react';

interface AlertRule {
  id: string;
  name: string;
  code: string;
  type: string;
  config: Record<string, unknown>;
  priority: number;
  isEnabled: boolean;
  notificationChannels: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface AlertRecord {
  id: string;
  ruleId: string;
  ruleCode: string;
  ruleName: string;
  orderId: string;
  orderNo: string;
  customerCode: string;
  productCode: string;
  supplierName: string;
  alertType: string;
  alertLevel: string;
  title: string;
  content: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt: string;
  resolvedBy: string;
  createdAt: string;
}

interface AlertStats {
  total: number;
  unread: number;
  warning: number;
  critical: number;
}

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<string>('records');
  
  // 预警记录相关状态
  const [records, setRecords] = useState<AlertRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [stats, setStats] = useState<AlertStats>({ total: 0, unread: 0, warning: 0, critical: 0 });
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [recordFilters, setRecordFilters] = useState({
    alertLevel: 'all',
    isRead: 'all',
    search: '',
  });

  // 预警规则相关状态
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    code: '',
    type: 'stock',
    config: '{}',
    priority: 0,
    description: '',
  });

  // 详情对话框
  const [detailRecord, setDetailRecord] = useState<AlertRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    loadRecords();
    loadRules();
  }, []);

  // 加载预警记录
  const loadRecords = async () => {
    setLoadingRecords(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (recordFilters.alertLevel !== 'all') {
        params.set('alertLevel', recordFilters.alertLevel);
      }
      if (recordFilters.isRead !== 'all') {
        params.set('isRead', recordFilters.isRead === 'unread' ? 'false' : 'true');
      }
      if (recordFilters.search) {
        params.set('orderNo', recordFilters.search);
      }

      const res = await fetch(`/api/alert-records?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.data || []);
        setStats(data.stats || { total: 0, unread: 0, warning: 0, critical: 0 });
      } else {
        toast.error(data.error || '加载预警记录失败');
      }
    } catch (error) {
      console.error('加载预警记录失败:', error);
      toast.error('加载预警记录失败');
    } finally {
      setLoadingRecords(false);
    }
  };

  // 加载预警规则
  const loadRules = async () => {
    setLoadingRules(true);
    try {
      const res = await fetch('/api/alert-rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.data || []);
      } else {
        toast.error(data.error || '加载预警规则失败');
      }
    } catch (error) {
      console.error('加载预警规则失败:', error);
      toast.error('加载预警规则失败');
    } finally {
      setLoadingRules(false);
    }
  };

  // 标记已读
  const handleMarkAsRead = async (ids: string[]) => {
    try {
      const res = await fetch('/api/alert-records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isRead: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已标记为已读');
        setSelectedRecords([]);
        loadRecords();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 标记已处理
  const handleMarkAsResolved = async (ids: string[]) => {
    try {
      const res = await fetch('/api/alert-records', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, isResolved: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已标记为已处理');
        setSelectedRecords([]);
        loadRecords();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 切换规则启用状态
  const handleToggleRule = async (rule: AlertRule) => {
    try {
      const res = await fetch(`/api/alert-rules/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !rule.isEnabled }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${rule.isEnabled ? '禁用' : '启用'}成功`);
        loadRules();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 打开规则编辑对话框
  const openRuleDialog = (rule?: AlertRule) => {
    if (rule) {
      setEditingRule(rule);
      setRuleForm({
        name: rule.name,
        code: rule.code,
        type: rule.type,
        config: JSON.stringify(rule.config, null, 2),
        priority: rule.priority,
        description: rule.description || '',
      });
    } else {
      setEditingRule(null);
      setRuleForm({
        name: '',
        code: '',
        type: 'stock',
        config: '{}',
        priority: 0,
        description: '',
      });
    }
    setIsRuleDialogOpen(true);
  };

  // 保存规则
  const handleSaveRule = async () => {
    try {
      let config;
      try {
        config = JSON.parse(ruleForm.config);
      } catch {
        toast.error('配置格式不正确，请输入有效的JSON');
        return;
      }

      const url = editingRule ? `/api/alert-rules/${editingRule.id}` : '/api/alert-rules';
      const method = editingRule ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ruleForm,
          config,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editingRule ? '更新成功' : '创建成功');
        setIsRuleDialogOpen(false);
        loadRules();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 查看详情
  const handleViewDetail = (record: AlertRecord) => {
    setDetailRecord(record);
    setIsDetailOpen(true);
    if (!record.isRead) {
      handleMarkAsRead([record.id]);
    }
  };

  // 获取预警级别图标和颜色
  const getAlertLevelBadge = (level: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> 紧急</Badge>;
      case 'error':
        return <Badge variant="destructive" className="gap-1 bg-red-600"><AlertCircle className="h-3 w-3" /> 错误</Badge>;
      case 'warning':
        return <Badge variant="warning" className="bg-orange-500 gap-1"><AlertTriangle className="h-3 w-3" /> 警告</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" /> 信息</Badge>;
    }
  };

  // 筛选记录
  const filteredRecords = records.filter(r => {
    if (recordFilters.search) {
      const q = recordFilters.search.toLowerCase();
      return (
        r.title?.toLowerCase().includes(q) ||
        r.orderNo?.toLowerCase().includes(q) ||
        r.content?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loadingRecords && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="h-8 w-8" />
            预警中心
          </h1>
          <p className="text-muted-foreground">
            系统预警信息集中管理
          </p>
        </div>
        <Button variant="outline" onClick={() => loadRecords()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <Card className={stats.critical > 0 ? 'border-red-500 bg-red-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stats.critical > 0 ? 'text-red-800' : ''}`}>
              紧急预警
            </CardTitle>
            <AlertCircle className={`h-4 w-4 ${stats.critical > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.critical > 0 ? 'text-red-800' : ''}`}>
              {stats.critical}
            </div>
          </CardContent>
        </Card>
        <Card className={stats.warning > 0 ? 'border-orange-500 bg-orange-50' : ''}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${stats.warning > 0 ? 'text-orange-800' : ''}`}>
              警告预警
            </CardTitle>
            <AlertTriangle className={`h-4 w-4 ${stats.warning > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.warning > 0 ? 'text-orange-800' : ''}`}>
              {stats.warning}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未读预警</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unread}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总计预警</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
      </div>

      {/* 标签页 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="records" className="gap-1">
            <BellRing className="h-4 w-4" />
            预警记录
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1.5">{stats.unread}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-1">
            <Settings className="h-4 w-4" />
            预警规则
          </TabsTrigger>
        </TabsList>

        {/* 预警记录标签页 */}
        <TabsContent value="records" className="space-y-4">
          {/* 筛选器 */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">搜索</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索订单号、标题..."
                      value={recordFilters.search}
                      onChange={(e) => setRecordFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="pl-10 w-[200px] h-8"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">预警级别</Label>
                  <Select
                    value={recordFilters.alertLevel}
                    onValueChange={(v) => setRecordFilters(prev => ({ ...prev, alertLevel: v }))}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="critical">紧急</SelectItem>
                      <SelectItem value="warning">警告</SelectItem>
                      <SelectItem value="info">信息</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">阅读状态</Label>
                  <Select
                    value={recordFilters.isRead}
                    onValueChange={(v) => setRecordFilters(prev => ({ ...prev, isRead: v }))}
                  >
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="unread">未读</SelectItem>
                      <SelectItem value="read">已读</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={loadRecords} variant="outline" size="sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  查询
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 批量操作 */}
          {selectedRecords.length > 0 && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm">已选择 {selectedRecords.length} 条</span>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(selectedRecords)}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    标记已读
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleMarkAsResolved(selectedRecords)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    标记已处理
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelectedRecords([])}>
                    取消选择
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 预警记录列表 */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px]">
                      <input
                        type="checkbox"
                        checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords(filteredRecords.map(r => r.id));
                          } else {
                            setSelectedRecords([]);
                          }
                        }}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead>级别</TableHead>
                    <TableHead>预警标题</TableHead>
                    <TableHead>关联订单</TableHead>
                    <TableHead>预警类型</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                        暂无预警记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                      <TableRow
                        key={record.id}
                        className={!record.isRead ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedRecords.includes(record.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedRecords(prev => [...prev, record.id]);
                              } else {
                                setSelectedRecords(prev => prev.filter(id => id !== record.id));
                              }
                            }}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell>{getAlertLevelBadge(record.alertLevel)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{record.title}</div>
                        </TableCell>
                        <TableCell>
                          {record.orderNo ? (
                            <code className="text-sm bg-muted px-1 rounded">{record.orderNo}</code>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.alertType}</Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {new Date(record.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          {record.isResolved ? (
                            <Badge variant="secondary" className="gap-1">
                              <CheckCircle className="h-3 w-3" /> 已处理
                            </Badge>
                          ) : (
                            <Badge variant="outline">待处理</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="ghost" onClick={() => handleViewDetail(record)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 预警规则标签页 */}
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>预警规则配置</CardTitle>
                  <CardDescription>管理系统预警规则</CardDescription>
                </div>
                <Button onClick={() => openRuleDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  新建规则
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>规则名称</TableHead>
                    <TableHead>规则编码</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRules ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        暂无预警规则
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>
                          <code className="text-sm bg-muted px-1 rounded">{rule.code}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.type}</Badge>
                        </TableCell>
                        <TableCell>{rule.priority}</TableCell>
                        <TableCell>
                          <Switch
                            checked={rule.isEnabled}
                            onCheckedChange={() => handleToggleRule(rule)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {rule.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => openRuleDialog(rule)}>
                              编辑
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 详情对话框 */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailRecord && getAlertLevelBadge(detailRecord.alertLevel)}
              {detailRecord?.title}
            </DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">预警规则</Label>
                  <p className="font-medium">{detailRecord.ruleName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">预警类型</Label>
                  <p className="font-medium">{detailRecord.alertType}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">关联订单</Label>
                  <p className="font-medium">{detailRecord.orderNo || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">发生时间</Label>
                  <p className="font-medium">
                    {new Date(detailRecord.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
                {detailRecord.supplierName && (
                  <div>
                    <Label className="text-muted-foreground">供应商</Label>
                    <p className="font-medium">{detailRecord.supplierName}</p>
                  </div>
                )}
                {detailRecord.productCode && (
                  <div>
                    <Label className="text-muted-foreground">商品编码</Label>
                    <p className="font-medium">{detailRecord.productCode}</p>
                  </div>
                )}
              </div>
              {detailRecord.content && (
                <div>
                  <Label className="text-muted-foreground">详细说明</Label>
                  <p className="mt-1 p-3 bg-muted rounded-lg">{detailRecord.content}</p>
                </div>
              )}
              {detailRecord.isResolved && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">已处理</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    处理时间：{detailRecord.resolvedAt ? new Date(detailRecord.resolvedAt).toLocaleString('zh-CN') : '-'}
                    {detailRecord.resolvedBy && `，处理人：${detailRecord.resolvedBy}`}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            {!detailRecord?.isResolved && detailRecord && (
              <Button
                variant="outline"
                onClick={() => {
                  handleMarkAsResolved([detailRecord.id]);
                  setIsDetailOpen(false);
                }}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                标记已处理
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 规则编辑对话框 */}
      <Dialog open={isRuleDialogOpen} onOpenChange={setIsRuleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? '编辑预警规则' : '新建预警规则'}
            </DialogTitle>
            <DialogDescription>
              {editingRule ? '修改预警规则配置' : '创建新的预警规则'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">规则名称 *</Label>
              <Input
                id="name"
                value={ruleForm.name}
                onChange={(e) => setRuleForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="如：尾货预警"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">规则编码 *</Label>
              <Input
                id="code"
                value={ruleForm.code}
                onChange={(e) => setRuleForm(prev => ({ ...prev, code: e.target.value }))}
                placeholder="如：low_stock"
                disabled={!!editingRule}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">规则类型</Label>
                <Select
                  value={ruleForm.type}
                  onValueChange={(v) => setRuleForm(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">库存预警</SelectItem>
                    <SelectItem value="order">订单预警</SelectItem>
                    <SelectItem value="price">价格预警</SelectItem>
                    <SelectItem value="customer">客户预警</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">优先级</Label>
                <Input
                  id="priority"
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="config">配置 (JSON)</Label>
              <Textarea
                id="config"
                value={ruleForm.config}
                onChange={(e) => setRuleForm(prev => ({ ...prev, config: e.target.value }))}
                placeholder='{"threshold": 2}'
                rows={4}
                className="font-mono text-sm"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">描述</Label>
              <Input
                id="description"
                value={ruleForm.description}
                onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="规则描述"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRuleDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleSaveRule}
              disabled={!ruleForm.name || !ruleForm.code}
            >
              {editingRule ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
