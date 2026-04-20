'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { PageGuard } from '@/components/auth/page-guard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { buildUserInfoHeaders, useAuth, usePermission } from '@/lib/auth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { 
  ArrowLeft, Search, Plus, Edit, Building2, Truck, 
  AlertTriangle, Trash2, Check, X, Package, Upload, Download
} from 'lucide-react';

// Excel导入配置
const IMPORT_CONFIG = {
  title: '发货方管理',
  fields: ['code', 'name', 'shortName', 'type', 'contactPerson', 'contactPhone', 'province', 'city', 'address', 'sendType', 'settlementType', 'costFactor', 'canJd', 'jdChannelId', 'canPdd', 'pddShopId', 'expressRestrictions', 'remark'],
  fieldLabels: ['发货方编码', '发货方名称', '简称', '类型', '联系人', '联系电话', '所在省份', '所在城市', '详细地址', '发货方式', '结算方式', '成本系数', '支持京东', '京东渠道ID', '支持拼多多', '拼多多店铺ID', '快递限制', '备注'],
  template: [
    { code: 'FHS-001', name: '广东云海供应链', shortName: '云海', type: '供应商', contactPerson: '张经理', contactPhone: '13800138000', province: '广东', city: '深圳', address: '深圳市宝安区xxx物流园', sendType: '下载发货', settlementType: '月结', costFactor: '1.0', canJd: '否', jdChannelId: '', canPdd: '否', pddShopId: '', expressRestrictions: '', remark: '' },
    { code: 'FHS-002', name: '京东一件代发', shortName: '京东', type: '京东', contactPerson: '李经理', contactPhone: '13900139000', province: '北京', city: '北京', address: '北京市大兴区京东仓库', sendType: '京东发货', settlementType: '月结预付', costFactor: '1.05', canJd: '是', jdChannelId: 'JD-CHANNEL-001', canPdd: '否', pddShopId: '', expressRestrictions: '', remark: '' },
  ],
};

interface Shipper {
  id: string;
  code: string;
  name: string;
  shortName: string;
  type: string; // supplier/jd/pdd/self/third_party
  contactPerson: string;
  contactPhone: string;
  province: string;
  city: string;
  address: string;
  sendType: string; // download/jd/pdd/self
  jdChannelId: string;
  pddShopId: string;
  canJd: boolean;
  canPdd: boolean;
  expressRestrictions: string[];
  settlementType: string;
  costFactor: number;
  isActive: boolean;
  remark: string;
  createdAt: string;
}

// 发货类型选项
const SHIPPER_TYPES = [
  { value: 'supplier', label: '供应商' },
  { value: 'jd', label: '京东' },
  { value: 'pdd', label: '拼多多' },
  { value: 'self', label: '自有仓' },
  { value: 'third_party', label: '第三方仓' },
];

// 发货方式选项
const SEND_TYPES = [
  { value: 'download', label: '下载发货' },
  { value: 'jd', label: '京东发货' },
  { value: 'pdd', label: '拼多多发货' },
  { value: 'self', label: '自有发货' },
];

// 结算方式选项
const SETTLEMENT_TYPES = [
  { value: 'prepaid', label: '月结预付' },
  { value: 'monthly', label: '月结' },
  { value: 'per_order', label: '单结' },
];

// 快递选项
const EXPRESS_OPTIONS = ['极兔速递', '中通快递', '圆通速递', '韵达快递', '申通快递', '顺丰速运', '京东物流', 'EMS'];

export default function ShippersManagePage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const canCreateSuppliers = hasPermission('suppliers:create');
  const canEditSuppliers = hasPermission('suppliers:edit');
  const canDeleteSuppliers = hasPermission('suppliers:delete');
  const [shippers, setShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingShipper, setEditingShipper] = useState<Shipper | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    type: 'supplier',
    contactPerson: '',
    contactPhone: '',
    province: '',
    city: '',
    address: '',
    sendType: 'download',
    jdChannelId: '',
    pddShopId: '',
    canJd: true,
    canPdd: true,
    expressRestrictions: [] as string[],
    settlementType: 'monthly',
    costFactor: 1.0,
    remark: '',
    isActive: true,
  });

  // Excel导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [excelImportData, setExcelImportData] = useState<Record<string, string>[]>([]);
  const [excelImportDialogOpen, setExcelImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchShippers();
  }, []);

  const authHeaders = useCallback(() => buildUserInfoHeaders(user), [user]);

  const fetchShippers = async () => {
    try {
      const res = await fetch('/api/shippers', { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setShippers(data.data);
      }
    } catch (error) {
      console.error('获取发货方失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredShippers = shippers.filter(shipper => {
    if (!searchTerm && !typeFilter) return true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!shipper.name.toLowerCase().includes(term) && 
          !shipper.shortName?.toLowerCase().includes(term) &&
          !shipper.code?.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (typeFilter && shipper.type !== typeFilter) return false;
    return true;
  });

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      shortName: '',
      type: 'supplier',
      contactPerson: '',
      contactPhone: '',
      province: '',
      city: '',
      address: '',
      sendType: 'download',
      jdChannelId: '',
      pddShopId: '',
      canJd: true,
      canPdd: true,
      expressRestrictions: [],
      settlementType: 'monthly',
      costFactor: 1.0,
      remark: '',
      isActive: true,
    });
    setEditingShipper(null);
  };

  // 下载模板
  const downloadTemplate = () => {
    try {
      const wsData = [
        IMPORT_CONFIG.fieldLabels,
        ...IMPORT_CONFIG.template.map(row => 
          IMPORT_CONFIG.fields.map(field => row[field as keyof typeof row] || '')
        )
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, IMPORT_CONFIG.title);
      
      // 使用 base64 方式下载
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = `${IMPORT_CONFIG.title}_导入模板.xlsx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('模板下载成功');
    } catch (error) {
      console.error('模板下载失败:', error);
      toast.error('模板下载失败');
    }
  };

  // 处理Excel文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as Record<string, string>[];
        
        if (jsonData.length === 0) {
          toast.error('导入文件为空');
          return;
        }
        
        setExcelImportData(jsonData);
        setExcelImportDialogOpen(true);
        toast.success(`已读取 ${jsonData.length} 条数据`);
      } catch (err) {
        toast.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 确认Excel导入
  const confirmExcelImport = async () => {
    if (excelImportData.length === 0) {
      toast.error('请先选择要导入的文件');
      return;
    }
    
    setImporting(true);
    try {
      const shippersData = excelImportData.map(row => {
        // 类型映射
        const typeMap: Record<string, string> = {
          '供应商': 'supplier', '京东': 'jd', '拼多多': 'pdd', '自有仓': 'self', '第三方仓': 'third_party'
        };
        // 发货方式映射
        const sendTypeMap: Record<string, string> = {
          '下载发货': 'download', '京东发货': 'jd', '拼多多发货': 'pdd', '自有发货': 'self'
        };
        // 结算方式映射
        const settlementMap: Record<string, string> = {
          '月结预付': 'prepaid', '月结': 'monthly', '单结': 'per_order'
        };
        
        return {
          code: row.code || row['发货方编码'] || '',
          name: row.name || row['发货方名称'] || '',
          shortName: row.shortName || row['简称'] || '',
          type: typeMap[row.type || row['类型']] || 'supplier',
          contactPerson: row.contactPerson || row['联系人'] || '',
          contactPhone: row.contactPhone || row['联系电话'] || '',
          province: row.province || row['所在省份'] || '',
          city: row.city || row['所在城市'] || '',
          address: row.address || row['详细地址'] || '',
          sendType: sendTypeMap[row.sendType || row['发货方式']] || 'download',
          settlementType: settlementMap[row.settlementType || row['结算方式']] || 'monthly',
          costFactor: parseFloat(row.costFactor || row['成本系数'] || '1') || 1.0,
          canJd: (row.canJd || row['支持京东']) === '是',
          jdChannelId: row.jdChannelId || row['京东渠道ID'] || '',
          canPdd: (row.canPdd || row['支持拼多多']) === '是',
          pddShopId: row.pddShopId || row['拼多多店铺ID'] || '',
          expressRestrictions: (row.expressRestrictions || row['快递限制'] || '').split(/[,，]/).filter(Boolean),
          remark: row.remark || row['备注'] || '',
          isActive: true,
        };
      }).filter((s: { name: string }) => s.name);

      if (shippersData.length === 0) {
        toast.error('未解析到有效的发货方数据');
        return;
      }

      const res = await fetch('/api/shippers/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify({ shippers: shippersData }),
      });

      const result = await res.json();
      if (result.success) {
        toast.success(`成功导入 ${shippersData.length} 条发货方`);
        setExcelImportDialogOpen(false);
        setExcelImportData([]);
        fetchShippers();
      } else {
        toast.error(result.error || '导入失败');
      }
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const handleOpenDialog = (shipper?: Shipper) => {
    if (shipper) {
      setEditingShipper(shipper);
      setFormData({
        code: shipper.code || '',
        name: shipper.name,
        shortName: shipper.shortName || '',
        type: shipper.type || 'supplier',
        contactPerson: shipper.contactPerson || '',
        contactPhone: shipper.contactPhone || '',
        province: shipper.province || '',
        city: shipper.city || '',
        address: shipper.address || '',
        sendType: shipper.sendType || 'download',
        jdChannelId: shipper.jdChannelId || '',
        pddShopId: shipper.pddShopId || '',
        canJd: shipper.canJd ?? true,
        canPdd: shipper.canPdd ?? true,
        expressRestrictions: shipper.expressRestrictions || [],
        settlementType: shipper.settlementType || 'monthly',
        costFactor: shipper.costFactor || 1.0,
        remark: shipper.remark || '',
        isActive: shipper.isActive ?? true,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingShipper && !canEditSuppliers) {
      setAlert({ type: 'error', message: '当前账号没有编辑发货方的权限' });
      return;
    }

    if (!editingShipper && !canCreateSuppliers) {
      setAlert({ type: 'error', message: '当前账号没有新增发货方的权限' });
      return;
    }

    if (!formData.name) {
      setAlert({ type: 'error', message: '请填写发货方名称' });
      return;
    }

    try {
      const url = editingShipper ? `/api/shippers/${editingShipper.id}` : '/api/shippers';
      const method = editingShipper ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: editingShipper ? '发货方更新成功' : '发货方创建成功' });
        setDialogOpen(false);
        fetchShippers();
        resetForm();
      } else {
        setAlert({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: '操作失败' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteSuppliers) {
      setAlert({ type: 'error', message: '当前账号没有删除发货方的权限' });
      return;
    }

    try {
      const res = await fetch(`/api/shippers/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: '发货方删除成功' });
        setDeleteConfirmId(null);
        fetchShippers();
      } else {
        setAlert({ type: 'error', message: data.error || '删除失败' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: '删除失败' });
    }
  };

  const toggleExpressRestriction = (express: string) => {
    setFormData(prev => ({
      ...prev,
      expressRestrictions: prev.expressRestrictions.includes(express)
        ? prev.expressRestrictions.filter(e => e !== express)
        : [...prev.expressRestrictions, express]
    }));
  };

  // 获取类型标签
  const getTypeBadge = (type: string) => {
    const typeConfig: Record<string, { label: string; className: string }> = {
      supplier: { label: '供应商', className: 'bg-blue-100 text-blue-800' },
      jd: { label: '京东', className: 'bg-red-100 text-red-800' },
      pdd: { label: '拼多多', className: 'bg-orange-100 text-orange-800' },
      self: { label: '自有仓', className: 'bg-green-100 text-green-800' },
      third_party: { label: '第三方仓', className: 'bg-purple-100 text-purple-800' },
    };
    const config = typeConfig[type] || { label: type, className: '' };
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // 获取发货方式标签
  const getSendTypeBadge = (sendType: string) => {
    const config = SEND_TYPES.find(s => s.value === sendType);
    return <Badge variant="outline">{config?.label || sendType}</Badge>;
  };

  // 获取结算方式标签
  const getSettlementBadge = (type: string) => {
    const config = SETTLEMENT_TYPES.find(s => s.value === type);
    return <Badge variant="outline">{config?.label || type}</Badge>;
  };

  // 统计数据
  const stats = {
    total: shippers.length,
    byType: {
      supplier: shippers.filter(s => s.type === 'supplier').length,
      jd: shippers.filter(s => s.type === 'jd').length,
      pdd: shippers.filter(s => s.type === 'pdd').length,
      self: shippers.filter(s => s.type === 'self').length,
      thirdParty: shippers.filter(s => s.type === 'third_party').length,
    },
    active: shippers.filter(s => s.isActive).length,
  };

  return (
    <PageGuard permission="suppliers:view">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/archive">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  返回
                </Button>
              </Link>
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">发货方管理</h1>
                  <p className="text-sm text-gray-500">统一管理供应商、仓库、京东/拼多多渠道</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-4">
            <nav className="flex gap-4 overflow-x-auto">
              <Link href="/archive" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
                总览
              </Link>
              <Link href="/customers" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
                客户管理
              </Link>
              <Link href="/suppliers-manage" className="py-4 px-2 border-b-2 border-green-600 text-sm font-medium text-green-600">
                发货方管理
              </Link>
              <Link href="/products" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
                商品管理
              </Link>
              <Link href="/sku-mappings" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
                SKU映射
              </Link>
            </nav>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6">
          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">发货方总数</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-gray-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">供应商</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.byType.supplier}</p>
                  </div>
                  <Package className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">京东渠道</p>
                    <p className="text-2xl font-bold text-red-600">{stats.byType.jd}</p>
                  </div>
                  <Truck className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">拼多多渠道</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.byType.pdd}</p>
                  </div>
                  <Truck className="w-8 h-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">自有仓</p>
                    <p className="text-2xl font-bold text-green-600">{stats.byType.self}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">活跃</p>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                  </div>
                  <Check className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Actions */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索发货方名称/简称/编码..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter || 'all'} onValueChange={(v) => setTypeFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-full xl:w-[150px]">
                    <SelectValue placeholder="按类型筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部类型</SelectItem>
                    {SHIPPER_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto">
                    <Download className="w-4 h-4 mr-1" />
                    模板下载
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto"
                    disabled={!canCreateSuppliers}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    导入
                  </Button>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => { resetForm(); setDialogOpen(true); }}
                      className="w-full xl:w-auto"
                      disabled={!canCreateSuppliers}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      新增发货方
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[85vh] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{editingShipper ? '编辑发货方' : '新增发货方'}</DialogTitle>
                      <DialogDescription>
                        {editingShipper ? '修改发货方信息' : '填写发货方基本信息'}
                      </DialogDescription>
                    </DialogHeader>
                    {alert && (
                      <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
                        <AlertDescription>{alert.message}</AlertDescription>
                      </Alert>
                    )}
                    <div className="grid gap-4 py-4 sm:grid-cols-2">
                      {/* 基本信息 */}
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">基本信息</h3>
                      </div>
                      <div className="space-y-2">
                        <Label>发货方编码</Label>
                        <Input 
                          value={formData.code} 
                          onChange={(e) => setFormData({...formData, code: e.target.value})}
                          placeholder="如: FHS-001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>发货方名称 *</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="如: 广东云海供应链"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>简称</Label>
                        <Input 
                          value={formData.shortName} 
                          onChange={(e) => setFormData({...formData, shortName: e.target.value})}
                          placeholder="如: 云海"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>类型 *</Label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SHIPPER_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 联系信息 */}
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">联系信息</h3>
                      </div>
                      <div className="space-y-2">
                        <Label>联系人</Label>
                        <Input 
                          value={formData.contactPerson} 
                          onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                          placeholder="联系人姓名"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>联系电话</Label>
                        <Input 
                          value={formData.contactPhone} 
                          onChange={(e) => setFormData({...formData, contactPhone: e.target.value})}
                          placeholder="手机或电话"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>所在省份</Label>
                        <Input 
                          value={formData.province} 
                          onChange={(e) => setFormData({...formData, province: e.target.value})}
                          placeholder="如: 广东"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>所在城市</Label>
                        <Input 
                          value={formData.city} 
                          onChange={(e) => setFormData({...formData, city: e.target.value})}
                          placeholder="如: 深圳"
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>详细地址</Label>
                        <Input 
                          value={formData.address} 
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                          placeholder="详细街道地址"
                        />
                      </div>

                      {/* 发货设置 */}
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">发货设置</h3>
                      </div>
                      <div className="space-y-2">
                        <Label>发货方式</Label>
                        <Select value={formData.sendType} onValueChange={(v) => setFormData({...formData, sendType: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SEND_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>结算方式</Label>
                        <Select value={formData.settlementType} onValueChange={(v) => setFormData({...formData, settlementType: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SETTLEMENT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>成本系数</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={formData.costFactor} 
                          onChange={(e) => setFormData({...formData, costFactor: parseFloat(e.target.value) || 1.0})}
                          placeholder="1.0"
                        />
                      </div>

                      {/* 渠道配置 */}
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">渠道配置</h3>
                      </div>
                      <div className="space-y-3 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>支持京东发货</Label>
                          <Switch 
                            checked={formData.canJd}
                            onCheckedChange={(checked) => setFormData({...formData, canJd: checked})}
                          />
                        </div>
                        {formData.canJd && (
                          <Input 
                            value={formData.jdChannelId} 
                            onChange={(e) => setFormData({...formData, jdChannelId: e.target.value})}
                            placeholder="京东渠道ID"
                            className="mt-2"
                          />
                        )}
                      </div>
                      <div className="space-y-3 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>支持拼多多发货</Label>
                          <Switch 
                            checked={formData.canPdd}
                            onCheckedChange={(checked) => setFormData({...formData, canPdd: checked})}
                          />
                        </div>
                        {formData.canPdd && (
                          <Input 
                            value={formData.pddShopId} 
                            onChange={(e) => setFormData({...formData, pddShopId: e.target.value})}
                            placeholder="拼多多店铺ID"
                            className="mt-2"
                          />
                        )}
                      </div>

                      {/* 快递限制 */}
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">快递限制</h3>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <div className="flex flex-wrap gap-2">
                          {EXPRESS_OPTIONS.map(express => (
                            <Button
                              key={express}
                              type="button"
                              variant={formData.expressRestrictions.includes(express) ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleExpressRestriction(express)}
                              disabled={editingShipper ? !canEditSuppliers : !canCreateSuppliers}
                            >
                              {express}
                            </Button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">选中的快递将不被允许从此发货方发货</p>
                      </div>

                      {/* 其他设置 */}
                      <div className="sm:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">其他设置</h3>
                      </div>
                      <div className="space-y-3 sm:col-span-2">
                        <div className="flex items-center justify-between">
                          <Label>启用状态</Label>
                          <Switch 
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                          />
                        </div>
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>备注</Label>
                        <Input 
                          value={formData.remark} 
                          onChange={(e) => setFormData({...formData, remark: e.target.value})}
                          placeholder="其他说明..."
                        />
                      </div>
                    </div>
                    <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <Button variant="outline" onClick={() => setDialogOpen(false)} className="w-full sm:w-auto">取消</Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={editingShipper ? !canEditSuppliers : !canCreateSuppliers}
                        className="w-full sm:w-auto"
                      >
                        {editingShipper ? '保存修改' : '创建发货方'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Shipper List */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>发货方编码</TableHead>
                    <TableHead>发货方名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>发货方式</TableHead>
                    <TableHead>结算方式</TableHead>
                    <TableHead>渠道配置</TableHead>
                    <TableHead>快递限制</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        加载中...
                      </TableCell>
                    </TableRow>
                  ) : filteredShippers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        暂无发货方数据
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShippers.map((shipper) => (
                      <TableRow key={shipper.id}>
                        <TableCell className="font-medium">{shipper.code || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <span>{shipper.name}</span>
                            {shipper.shortName && (
                              <span className="text-gray-400 text-sm ml-1">({shipper.shortName})</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getTypeBadge(shipper.type)}</TableCell>
                        <TableCell>{getSendTypeBadge(shipper.sendType)}</TableCell>
                        <TableCell>{getSettlementBadge(shipper.settlementType)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {shipper.canJd && (
                              <Badge variant="outline" className="text-xs border-red-200 text-red-600">京东</Badge>
                            )}
                            {shipper.canPdd && (
                              <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">拼多多</Badge>
                            )}
                            {!shipper.canJd && !shipper.canPdd && (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {shipper.expressRestrictions && shipper.expressRestrictions.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {shipper.expressRestrictions.slice(0, 2).map(exp => (
                                <Badge key={exp} variant="outline" className="text-xs">{exp}</Badge>
                              ))}
                              {shipper.expressRestrictions.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{shipper.expressRestrictions.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">无</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={shipper.isActive ? 'default' : 'secondary'}>
                            {shipper.isActive ? '启用' : '禁用'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(shipper)}
                              disabled={!canEditSuppliers}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Dialog open={deleteConfirmId === shipper.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(shipper.id)}
                                  disabled={!canDeleteSuppliers}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>确认删除</DialogTitle>
                                  <DialogDescription>
                                    确定要删除发货方 &quot;{shipper.name}&quot; 吗？此操作无法撤销。
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                  <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="w-full sm:w-auto">取消</Button>
                                  <Button variant="destructive" onClick={() => handleDelete(shipper.id)} disabled={!canDeleteSuppliers} className="w-full sm:w-auto">删除</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>

          {/* Info */}
          <Alert className="mt-6 border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>发货方档案说明：</strong>发货方档案统一管理供应商、仓库、京东/拼多多渠道等信息。
              渠道配置决定该发货方支持哪些平台发货，快递限制可设置不能使用的快递公司。
            </AlertDescription>
          </Alert>

          {/* Excel导入预览对话框 */}
          <Dialog open={excelImportDialogOpen} onOpenChange={setExcelImportDialogOpen}>
            <DialogContent className="flex max-h-[80vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden sm:max-w-4xl">
              <DialogHeader>
                <DialogTitle>导入发货方数据预览</DialogTitle>
                <DialogDescription>
                  共 {excelImportData.length} 条数据，请确认后点击 &quot;确认导入&quot; 按钮
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-auto">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>发货方名称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>发货方式</TableHead>
                      <TableHead>联系人</TableHead>
                      <TableHead>联系电话</TableHead>
                      <TableHead>结算方式</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelImportData.slice(0, 20).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.name || row['发货方名称'] || '-'}</TableCell>
                        <TableCell>{row.type || row['类型'] || '-'}</TableCell>
                        <TableCell>{row.sendType || row['发货方式'] || '-'}</TableCell>
                        <TableCell>{row.contactPerson || row['联系人'] || '-'}</TableCell>
                        <TableCell>{row.contactPhone || row['联系电话'] || '-'}</TableCell>
                        <TableCell>{row.settlementType || row['结算方式'] || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                </div>
                {excelImportData.length > 20 && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    仅显示前20条数据...
                  </p>
                )}
              </div>
              <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setExcelImportDialogOpen(false)} className="w-full sm:w-auto">取消</Button>
                <Button onClick={confirmExcelImport} disabled={importing || !canCreateSuppliers} className="w-full sm:w-auto">
                  {importing ? '导入中...' : `确认导入 ${excelImportData.length} 条`}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </PageGuard>
  );
}
