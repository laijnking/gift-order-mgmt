'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Plus,
  Edit,
  Trash2,
  Copy,
  Star,
  StarOff,
  Search,
  Eye,
  Settings,
  Check,
  X,
  Building2,
  Users,
  Upload,
  Download,
  FileUp,
  Columns,
  Zap,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface ExportTemplate {
  id: string;
  code: string;
  name: string;
  description: string;
  type: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  fieldMappings: Record<string, string>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
}

// 预设字段映射方案
const PRESET_MAPPINGS = [
  {
    name: '标准派发单',
    icon: '📋',
    mappings: {
      '订单号': 'orderNo',
      '商品名称': 'productName',
      '规格型号': 'productSpec',
      '数量': 'quantity',
      '收货人': 'receiverName',
      '收货电话': 'receiverPhone',
      '收货地址': 'receiverAddress',
      '备注': 'remark',
    }
  },
  {
    name: '客户确认单',
    icon: '✅',
    mappings: {
      '客户订单号': 'orderNo',
      '系统订单号': 'sysOrderNo',
      '商品名称': 'productName',
      '数量': 'quantity',
      '收货人': 'receiverName',
      '收货电话': 'receiverPhone',
      '收货地址': 'receiverAddress',
      '快递公司': 'expressCompany',
      '快递单号': 'trackingNo',
    }
  },
  {
    name: '供应商发货单',
    icon: '🚚',
    mappings: {
      'SKU': 'productCode',
      '商品名称': 'productName',
      '数量': 'quantity',
      '收货人': 'receiverName',
      '电话': 'receiverPhone',
      '地址': 'receiverAddress',
      '客户代码': 'customerCode',
      '客户名称': 'customerName',
    }
  },
  {
    name: '简明模板',
    icon: '📄',
    mappings: {
      '订单号': 'orderNo',
      '商品': 'productName',
      '数量': 'quantity',
      '收件人': 'receiverName',
      '电话': 'receiverPhone',
      '地址': 'receiverAddress',
    }
  },
];

// 系统字段列表
const SYSTEM_FIELDS = [
  { key: 'sysOrderNo', label: '系统订单号' },
  { key: 'orderNo', label: '客户订单号' },
  { key: 'matchCode', label: '匹配码' },
  { key: 'dispatchBatch', label: '派发批次' },
  { key: 'productName', label: '商品名称' },
  { key: 'productCode', label: '商品编码/SKU' },
  { key: 'productSpec', label: '规格型号' },
  { key: 'quantity', label: '数量' },
  { key: 'receiverName', label: '收货人' },
  { key: 'receiverPhone', label: '收货电话' },
  { key: 'receiverAddress', label: '收货地址' },
  { key: 'customerCode', label: '客户代码' },
  { key: 'customerName', label: '客户名称' },
  { key: 'salesperson', label: '业务员' },
  { key: 'operator', label: '跟单员' },
  { key: 'supplierName', label: '供应商名称' },
  { key: 'expressCompany', label: '快递公司' },
  { key: 'trackingNo', label: '快递单号' },
  { key: 'remark', label: '备注' },
];

const TEMPLATE_TYPES = [
  { value: 'customer', label: '客户模板', desc: '客户确认单', color: 'bg-blue-500' },
  { value: 'supplier', label: '供应商模板', desc: '发货通知单', color: 'bg-green-500' },
  { value: 'common', label: '通用模板', desc: '通用导出', color: 'bg-purple-500' },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ExportTemplate | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ExportTemplate | null>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    type: 'common',
    targetType: '',
    targetId: '',
    targetName: '',
    isDefault: false,
    isActive: true,
  });
  
  // 映射配置
  const [mappings, setMappings] = useState<{ excelColumn: string; systemField: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadTemplates(), loadCustomers(), loadSuppliers()]);
    setLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.data || []);
      }
    } catch (error) {
      console.error('获取模板失败:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (error) {
      console.error('获取客户失败:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      if (data.success) {
        setSuppliers(data.data || []);
      }
    } catch (error) {
      console.error('获取供应商失败:', error);
    }
  };

  // 筛选逻辑
  const filteredTemplates = templates.filter(template => {
    // 搜索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const match = 
        template.name.toLowerCase().includes(term) ||
        template.code.toLowerCase().includes(term) ||
        template.description?.toLowerCase().includes(term) ||
        template.targetName?.toLowerCase().includes(term);
      if (!match) return false;
    }
    // 类型筛选
    if (typeFilter && template.type !== typeFilter) return false;
    // 关联对象筛选
    if (targetTypeFilter && template.targetType !== targetTypeFilter) return false;
    // 状态筛选
    if (statusFilter === 'active' && !template.isActive) return false;
    if (statusFilter === 'inactive' && template.isActive) return false;
    if (statusFilter === 'default' && !template.isDefault) return false;
    
    return true;
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      type: 'common',
      targetType: '',
      targetId: '',
      targetName: '',
      isDefault: false,
      isActive: true,
    });
    setMappings([{ excelColumn: '', systemField: '' }]);
    setEditingTemplate(null);
  };

  const handleOpenDialog = (template?: ExportTemplate) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        code: template.code,
        description: template.description || '',
        type: template.type,
        targetType: template.targetType || '',
        targetId: template.targetId || '',
        targetName: template.targetName || '',
        isDefault: template.isDefault ?? false,
        isActive: template.isActive ?? true,
      });
      const mappingArray = Object.entries(template.fieldMappings || {}).map(([excelColumn, systemField]) => ({
        excelColumn,
        systemField: systemField as string,
      }));
      if (mappingArray.length === 0) mappingArray.push({ excelColumn: '', systemField: '' });
      setMappings(mappingArray);
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const applyPreset = (preset: typeof PRESET_MAPPINGS[0]) => {
    const mappingArray = Object.entries(preset.mappings).map(([excelColumn, systemField]) => ({
      excelColumn,
      systemField: systemField as string,
    }));
    setMappings(mappingArray);
    toast.success(`已应用「${preset.name}」方案`);
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as string[][];
        
        if (jsonData.length > 0) {
          const headers = jsonData[0].filter(h => h);
          const mappingArray = headers.map(h => ({ excelColumn: h, systemField: '' }));
          setMappings(mappingArray);
          toast.success(`已导入 ${headers.length} 个列名`);
        }
      } catch {
        toast.error('文件解析失败');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleExportTemplate = (template: ExportTemplate) => {
    const exportData = {
      name: template.name,
      code: template.code,
      description: template.description,
      type: template.type,
      targetType: template.targetType,
      targetName: template.targetName,
      fieldMappings: template.fieldMappings,
    };
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([exportData]);
    XLSX.utils.book_append_sheet(wb, ws, '模板配置');
    XLSX.writeFile(wb, `${template.name}_模板配置.json`);
    toast.success('模板配置已导出');
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('请输入模板名称');
      return;
    }

    try {
      const fieldMappings: Record<string, string> = {};
      mappings.forEach(m => {
        if (m.excelColumn.trim() && m.systemField) {
          fieldMappings[m.excelColumn.trim()] = m.systemField;
        }
      });

      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fieldMappings,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingTemplate ? '模板更新成功' : '模板创建成功');
        setDialogOpen(false);
        loadTemplates();
        resetForm();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        toast.success('模板删除成功');
        setDeleteConfirmId(null);
        loadTemplates();
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  const handleSetDefault = async (template: ExportTemplate) => {
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, isDefault: true }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('已设为默认模板');
        loadTemplates();
      }
    } catch (error) {
      toast.error('设置失败');
    }
  };

  const handleCopy = async (template: ExportTemplate) => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          name: `${template.name} (副本)`,
          code: `${template.code}-COPY`,
          isDefault: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('模板复制成功');
        loadTemplates();
      }
    } catch (error) {
      toast.error('复制失败');
    }
  };

  const handleToggleActive = async (template: ExportTemplate) => {
    try {
      const res = await fetch(`/api/templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, isActive: !template.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(template.isActive ? '已禁用' : '已启用');
        loadTemplates();
      }
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 映射操作
  const addMappingRow = () => {
    setMappings([...mappings, { excelColumn: '', systemField: '' }]);
  };

  const removeMappingRow = (index: number) => {
    if (mappings.length > 1) {
      setMappings(mappings.filter((_, i) => i !== index));
    }
  };

  const updateMapping = (index: number, field: 'excelColumn' | 'systemField', value: string) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    setMappings(newMappings);
  };

  const clearAllMappings = () => {
    setMappings([{ excelColumn: '', systemField: '' }]);
  };

  const previewSample = () => {
    const headers = mappings.filter(m => m.excelColumn && m.systemField).map(m => m.excelColumn);
    const sampleRow = mappings.filter(m => m.excelColumn && m.systemField).map(m => {
      switch (m.systemField) {
        case 'sysOrderNo': return 'SYS-20260415-0001';
        case 'orderNo': return 'ORD20260415001';
        case 'productName': return '苏泊尔破壁机 SPJ002S';
        case 'quantity': return '5';
        case 'receiverName': return '张三';
        case 'receiverPhone': return '13800138000';
        case 'receiverAddress': return '福建省厦门市思明区XX路XX号';
        default: return '-';
      }
    });
    return { headers, sampleRow };
  };

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="h-8 w-8" />
            模板配置中心
          </h1>
          <p className="text-muted-foreground">
            管理导出模板，支持关联客户或供应商，可快速设置字段映射
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            导入模板
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            新增模板
          </Button>
        </div>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-3">
            {/* 搜索框 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索模板名称/编码/关联对象..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 模板类型 */}
            <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="模板类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {TEMPLATE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* 关联对象 */}
            <Select value={targetTypeFilter || 'all'} onValueChange={(v) => setTargetTypeFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="关联对象" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部对象</SelectItem>
                <SelectItem value="customer">已关联客户</SelectItem>
                <SelectItem value="supplier">已关联供应商</SelectItem>
                <SelectItem value="none">未关联</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 状态 */}
            <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="active">已启用</SelectItem>
                <SelectItem value="inactive">已禁用</SelectItem>
                <SelectItem value="default">默认模板</SelectItem>
              </SelectContent>
            </Select>
            
            {/* 刷新 */}
            <Button variant="outline" size="icon" onClick={loadData}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {/* 统计 */}
            <Badge variant="outline" className="ml-auto">
              共 {filteredTemplates.length} 个模板
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 模板列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">模板信息</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>关联对象</TableHead>
                <TableHead>字段映射</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">加载中...</p>
                  </TableCell>
                </TableRow>
              ) : filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">暂无模板数据</p>
                    <Button variant="outline" className="mt-4" onClick={() => handleOpenDialog()}>
                      创建第一个模板
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template) => (
                  <TableRow key={template.id} className={!template.isActive ? 'opacity-50' : ''}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.isDefault && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-medium">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        template.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                        template.type === 'supplier' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }>
                        {TEMPLATE_TYPES.find(t => t.value === template.type)?.label || template.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!template.targetType ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          {template.targetType === 'customer' ? <Users className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                          {template.targetName || '未知'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Object.entries(template.fieldMappings || {}).slice(0, 3).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-xs">
                            {k}→{v}
                          </Badge>
                        ))}
                        {Object.keys(template.fieldMappings || {}).length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{Object.keys(template.fieldMappings || {}).length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.isActive ? (
                          <Badge className="bg-green-100 text-green-800">启用</Badge>
                        ) : (
                          <Badge variant="secondary">禁用</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => { setPreviewTemplate(template); setPreviewDialogOpen(true); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleExportTemplate(template)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button variant="ghost" size="sm" onClick={() => handleSetDefault(template)} title="设为默认">
                            <StarOff className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => handleCopy(template)} title="复制">
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleToggleActive(template)}>
                          {template.isActive ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(template)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(template.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
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

      {/* 新增/编辑模板对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? '编辑模板' : '新增模板'}</DialogTitle>
            <DialogDescription>
              {editingTemplate ? '修改模板配置' : '创建新的导出模板，可关联客户或供应商'}
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="basic" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="mapping">字段映射</TabsTrigger>
              <TabsTrigger value="preview">预览</TabsTrigger>
            </TabsList>
            
            {/* 基本信息 */}
            <TabsContent value="basic" className="flex-1 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>模板名称 *</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="如: 泉州礼品公司确认单"
                  />
                </div>
                <div className="space-y-2">
                  <Label>模板编码</Label>
                  <Input 
                    value={formData.code} 
                    onChange={(e) => setFormData({...formData, code: e.target.value})}
                    placeholder="如: TPL-CUST-QZLP"
                  />
                </div>
                <div className="space-y-2">
                  <Label>模板类型</Label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${type.color}`} />
                            <span>{type.label}</span>
                            <span className="text-muted-foreground">- {type.desc}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>关联对象</Label>
                  <Select value={formData.targetType} onValueChange={(v) => setFormData({...formData, targetType: v, targetId: '', targetName: ''})}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择关联类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>客户</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="supplier">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          <span>供应商</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 选择具体对象 */}
              {formData.targetType === 'customer' && (
                <div className="space-y-2">
                  <Label>选择客户</Label>
                  <Select value={formData.targetId} onValueChange={(v) => {
                    const customer = customers.find(c => c.id === v);
                    setFormData({...formData, targetId: v, targetName: customer?.name || ''});
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择客户" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name} ({customer.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {formData.targetType === 'supplier' && (
                <div className="space-y-2">
                  <Label>选择供应商</Label>
                  <Select value={formData.targetId} onValueChange={(v) => {
                    const supplier = suppliers.find(s => s.id === v);
                    setFormData({...formData, targetId: v, targetName: supplier?.name || ''});
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="选择供应商" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map(supplier => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name} ({supplier.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label>模板描述</Label>
                <Input 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="简要描述此模板的用途..."
                />
              </div>
              
              <div className="flex items-center gap-4">
                <Checkbox 
                  id="isDefault"
                  checked={formData.isDefault}
                  onCheckedChange={(v) => setFormData({...formData, isDefault: !!v})}
                />
                <Label htmlFor="isDefault" className="cursor-pointer">设为默认模板</Label>
              </div>
            </TabsContent>
            
            {/* 字段映射 */}
            <TabsContent value="mapping" className="flex-1 overflow-y-auto space-y-4">
              {/* 快捷操作 */}
              <div className="space-y-2">
                <Label>快速设置</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_MAPPINGS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="h-8"
                    >
                      <span className="mr-1">{preset.icon}</span>
                      {preset.name}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* 导入Excel */}
              <div className="space-y-2">
                <Label>从Excel导入列名</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImportExcel}
                  />
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    选择Excel文件
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    将自动读取Excel第一行作为列名
                  </span>
                </div>
              </div>
              
              {/* 映射配置 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>字段映射配置</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {mappings.filter(m => m.excelColumn && m.systemField).length} 个映射
                    </span>
                    <Button variant="outline" size="sm" onClick={clearAllMappings}>
                      清空
                    </Button>
                    <Button variant="outline" size="sm" onClick={addMappingRow}>
                      <Plus className="h-4 w-4 mr-1" />
                      添加
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[45%]">Excel 列名</TableHead>
                        <TableHead className="w-[10%]">映射</TableHead>
                        <TableHead className="w-[45%]">系统字段</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mappings.map((mapping, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={mapping.excelColumn}
                              onChange={(e) => updateMapping(index, 'excelColumn', e.target.value)}
                              placeholder="如: 商品名称"
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-gray-400">→</span>
                          </TableCell>
                          <TableCell className="flex items-center gap-2">
                            <Select 
                              value={mapping.systemField} 
                              onValueChange={(v) => updateMapping(index, 'systemField', v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="选择系统字段" />
                              </SelectTrigger>
                              <SelectContent>
                                {SYSTEM_FIELDS.map(field => (
                                  <SelectItem key={field.key} value={field.key}>{field.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {mappings.length > 1 && (
                              <Button variant="ghost" size="sm" onClick={() => removeMappingRow(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
            
            {/* 预览 */}
            <TabsContent value="preview" className="flex-1 overflow-y-auto">
              {mappings.filter(m => m.excelColumn && m.systemField).length === 0 ? (
                <div className="text-center py-12">
                  <Columns className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="mt-2 text-muted-foreground">请先配置字段映射</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {mappings.filter(m => m.excelColumn && m.systemField).length} 列
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {formData.targetType === 'customer' ? <Users className="h-3 w-3" /> : 
                       formData.targetType === 'supplier' ? <Building2 className="h-3 w-3" /> : null}
                      {formData.targetName || '通用'}
                    </Badge>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {previewSample().headers.map((header, i) => (
                            <TableHead key={i} className="bg-gray-50 font-medium">{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          {previewSample().sampleRow.map((cell, i) => (
                            <TableCell key={i}>{cell}</TableCell>
                          ))}
                        </TableRow>
                        <TableRow className="text-gray-400">
                          {previewSample().sampleRow.map((_, i) => (
                            <TableCell key={i}>...</TableCell>
                          ))}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    * 以上为示例数据，实际导出时将根据订单内容填充。
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editingTemplate ? '保存修改' : '创建模板'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此模板吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>取消</Button>
            <Button variant="destructive" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 预览对话框 */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>模板预览 - {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className="py-4">
              <div className="mb-4 flex items-center gap-2">
                <Badge className={
                  previewTemplate.type === 'customer' ? 'bg-blue-100 text-blue-800' :
                  previewTemplate.type === 'supplier' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }>
                  {TEMPLATE_TYPES.find(t => t.value === previewTemplate.type)?.label}
                </Badge>
                {previewTemplate.targetType && (
                  <Badge variant="outline">
                    {previewTemplate.targetType === 'customer' ? <Users className="h-3 w-3 mr-1" /> : <Building2 className="h-3 w-3 mr-1" />}
                    {previewTemplate.targetName || '未知'}
                  </Badge>
                )}
              </div>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {Object.keys(previewTemplate.fieldMappings || {}).map((header, i) => (
                        <TableHead key={i} className="bg-gray-50 font-medium">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      {Object.values(previewTemplate.fieldMappings || {}).map((cell, i) => (
                        <TableCell key={i} className="text-gray-400">示例</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 导入对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入模板配置</DialogTitle>
            <DialogDescription>
              从JSON文件导入模板配置
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              支持从之前导出的模板配置文件(.json)导入。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
