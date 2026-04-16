'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { Upload, Download, ArrowLeft, Search, Plus, Edit, Trash2, Users, AlertTriangle, Check, UsersRound, Filter, Loader2, X } from 'lucide-react';

// Excel导入配置
const IMPORT_CONFIG = {
  title: '客户管理',
  fields: ['code', 'name', 'shortName', 'contactPerson', 'contactPhone', 'address', 'salespersonName', 'orderTakerName', 'customerLevel', 'paymentStatus', 'remark'],
  fieldLabels: ['客户编码', '客户名称', '客户简称', '联系人', '联系电话', '联系地址', '业务员', '跟单员', '客户等级', '结算方式', '备注'],
  template: [
    { code: 'KH-001', name: '示例客户公司', shortName: '示例', contactPerson: '张三', contactPhone: '13800138000', address: '深圳市南山区科技园', salespersonName: '李四', orderTakerName: '王五', customerLevel: 'A', paymentStatus: '月结', remark: '备注' },
  ],
};

interface Customer {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  address: string;
  province: string;
  city: string;
  district: string;
  salesUserId: string;
  salesUserName: string;
  operatorUserId: string;
  operatorUserName: string;
  creditLimit: number;
  paymentDays: number;
  paymentStatus: string;
  isActive: boolean;
  remark: string;
  createdAt: string;
}

interface User {
  id: string;
  username: string;
  realName: string;
  role: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [batchSalesUserId, setBatchSalesUserId] = useState<string>('');
  const [batchOperatorUserId, setBatchOperatorUserId] = useState<string>('');
  // Excel导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingData, setImportingData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 高级筛选状态
  const [salesUserFilter, setSalesUserFilter] = useState<string>('');
  const [operatorUserFilter, setOperatorUserFilter] = useState<string>('');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    province: '',
    city: '',
    district: '',
    salesUserId: '',
    salesUserName: '',
    operatorUserId: '',
    operatorUserName: '',
    creditLimit: 0,
    paymentDays: 0,
    paymentStatus: 'normal',
    remark: '',
  });

  useEffect(() => {
    fetchCustomers();
    fetchUsers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('获取客户失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users?isActive=true');
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
      }
    } catch (error) {
      console.error('获取用户失败:', error);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    // 关键词搜索
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !customer.code.toLowerCase().includes(term) &&
        !customer.name.toLowerCase().includes(term) &&
        !(customer.contactPerson?.toLowerCase().includes(term)) &&
        !customer.contactPhone?.includes(term)
      ) {
        return false;
      }
    }
    // 按业务员筛选
    if (salesUserFilter && customer.salesUserId !== salesUserFilter) {
      return false;
    }
    // 按跟单员筛选
    if (operatorUserFilter && customer.operatorUserId !== operatorUserFilter) {
      return false;
    }
    return true;
  });

  const salesUsers = users.filter(u => 
    ['sales', 'salesperson', 'salesman', 'sales_manager'].includes(u.role) || u.role === 'admin'
  );
  const operatorUsers = users.filter(u => 
    ['operator', 'order_taker'].includes(u.role) || u.role === 'admin'
  );

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      address: '',
      province: '',
      city: '',
      district: '',
      salesUserId: '',
      salesUserName: '',
      operatorUserId: '',
      operatorUserName: '',
      creditLimit: 0,
      paymentDays: 0,
      paymentStatus: 'normal',
      remark: '',
    });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        code: customer.code,
        name: customer.name,
        contactPerson: customer.contactPerson || '',
        contactPhone: customer.contactPhone || '',
        contactEmail: customer.contactEmail || '',
        address: customer.address || '',
        province: customer.province || '',
        city: customer.city || '',
        district: customer.district || '',
        salesUserId: customer.salesUserId || '',
        salesUserName: customer.salesUserName || '',
        operatorUserId: customer.operatorUserId || '',
        operatorUserName: customer.operatorUserName || '',
        creditLimit: customer.creditLimit || 0,
        paymentDays: customer.paymentDays || 0,
        paymentStatus: customer.paymentStatus || 'normal',
        remark: customer.remark || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : '/api/customers';
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: editingCustomer ? '客户更新成功' : '客户创建成功' });
        setDialogOpen(false);
        fetchCustomers();
        resetForm();
      } else {
        setAlert({ type: 'error', message: data.error || '操作失败' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: '操作失败' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: '客户删除成功' });
        setDeleteConfirmId(null);
        fetchCustomers();
      }
    } catch (error) {
      setAlert({ type: 'error', message: '删除失败' });
    }
  };

  const handleUserSelect = (type: 'sales' | 'operator', userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      if (type === 'sales') {
        setFormData({ ...formData, salesUserId: user.id, salesUserName: user.realName });
      } else {
        setFormData({ ...formData, operatorUserId: user.id, operatorUserName: user.realName });
      }
    }
  };

  // 批量选择相关
  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedCustomers.includes(id)) {
      setSelectedCustomers(selectedCustomers.filter(cid => cid !== id));
    } else {
      setSelectedCustomers([...selectedCustomers, id]);
    }
  };

  // 批量交接
  const handleBatchTransfer = async () => {
    if (selectedCustomers.length === 0) {
      setAlert({ type: 'error', message: '请先选择要交接的客户' });
      return;
    }
    if (!batchSalesUserId && !batchOperatorUserId) {
      setAlert({ type: 'error', message: '请至少选择一个交接对象' });
      return;
    }

    try {
      const updates: { id: string; salesUserId?: string; salesUserName?: string; operatorUserId?: string; operatorUserName?: string }[] = [];
      const salesUser = users.find(u => u.id === batchSalesUserId);
      const operatorUser = users.find(u => u.id === batchOperatorUserId);

      for (const customerId of selectedCustomers) {
        const update: { id: string; salesUserId?: string; salesUserName?: string; operatorUserId?: string; operatorUserName?: string } = { id: customerId };
        if (batchSalesUserId && salesUser) {
          update.salesUserId = salesUser.id;
          update.salesUserName = salesUser.realName;
        }
        if (batchOperatorUserId && operatorUser) {
          update.operatorUserId = operatorUser.id;
          update.operatorUserName = operatorUser.realName;
        }
        updates.push(update);
      }

      // 逐个更新
      for (const update of updates) {
        const res = await fetch(`/api/customers/${update.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(update),
        });
        if (!res.ok) throw new Error('更新失败');
      }

      setAlert({ type: 'success', message: `成功交接 ${selectedCustomers.length} 个客户` });
      setBatchDialogOpen(false);
      setSelectedCustomers([]);
      setBatchSalesUserId('');
      setBatchOperatorUserId('');
      fetchCustomers();
    } catch (error) {
      setAlert({ type: 'error', message: '批量交接失败' });
    }
  };

  // 下载导入模板
  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet(IMPORT_CONFIG.template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, IMPORT_CONFIG.title);
    XLSX.writeFile(wb, `${IMPORT_CONFIG.title}_导入模板.xlsx`);
    toast.success('下载模板成功');
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
        
        setImportingData(jsonData);
        setImportDialogOpen(true);
        toast.success(`已读取 ${jsonData.length} 条数据`);
      } catch (error) {
        toast.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 确认导入
  const confirmImport = async () => {
    if (importingData.length === 0) return;
    
    setImporting(true);
    setImportProgress({ current: 0, total: importingData.length, success: 0, failed: 0 });
    
    // 分批导入，每批100条
    const batchSize = 100;
    let totalSuccess = 0;
    let totalFailed = 0;
    
    try {
      for (let i = 0; i < importingData.length; i += batchSize) {
        const batch = importingData.slice(i, i + batchSize);
        
        setImportProgress({ 
          current: Math.min(i + batchSize, importingData.length), 
          total: importingData.length, 
          success: totalSuccess, 
          failed: totalFailed 
        });
        
        const res = await fetch('/api/import/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: batch }),
        });
        const result = await res.json();
        
        if (result.success) {
          totalSuccess += result.imported || 0;
          totalFailed += result.skipped || 0;
        } else {
          totalFailed += batch.length;
        }
        
        setImportProgress({ 
          current: Math.min(i + batchSize, importingData.length), 
          total: importingData.length, 
          success: totalSuccess, 
          failed: totalFailed 
        });
      }
      
      // 最终结果
      setImportProgress({ 
        current: importingData.length, 
        total: importingData.length, 
        success: totalSuccess, 
        failed: totalFailed 
      });
      
      toast.success(`导入完成：成功 ${totalSuccess} 条${totalFailed > 0 ? `，失败 ${totalFailed} 条` : ''}`);
      setImportDialogOpen(false);
      setImportingData([]);
      fetchCustomers();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 导出客户数据
  const handleExport = () => {
    const dataToExport = filteredCustomers.map(c => ({
      '客户编码': c.code,
      '客户名称': c.name,
      '联系人': c.contactPerson || '',
      '联系电话': c.contactPhone || '',
      '电子邮箱': c.contactEmail || '',
      '省份': c.province || '',
      '城市': c.city || '',
      '区县': c.district || '',
      '详细地址': c.address || '',
      '业务员': c.salesUserName || '',
      '跟单员': c.operatorUserName || '',
      '会计授信定额': c.creditLimit || 0,
      '账期(天)': c.paymentDays || 0,
      '结算状态': c.paymentStatus === 'normal' ? '正常' : c.paymentStatus === 'warning' ? '预警' : '逾期',
      '状态': c.isActive ? '活跃' : '禁用',
      '备注': c.remark || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '客户管理');
    XLSX.writeFile(wb, `客户管理_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('导出成功');
  };

  const stats = {
    total: customers.length,
    active: customers.filter(c => c.isActive).length,
    inactive: customers.filter(c => !c.isActive).length,
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/archive">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">客户管理</h1>
                <p className="text-sm text-gray-500">Customer Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6">
            <Link href="/archive" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              总览
            </Link>
            <Link href="/customers" className="py-4 px-2 border-b-2 border-blue-600 text-sm font-medium text-blue-600">
              客户管理
            </Link>
            <Link href="/suppliers-manage" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              供应商管理
            </Link>
            <Link href="/products" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              商品管理
            </Link>
            <Link href="/warehouses-manage" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              仓库管理
            </Link>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">客户总数</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">活跃客户</p>
                  <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                </div>
                <Check className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-gray-200 bg-gray-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-700">已禁用</p>
                  <p className="text-2xl font-bold text-gray-700">{stats.inactive}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索客户代码/名称/联系人/电话..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              {/* 业务员筛选 */}
              <Select value={salesUserFilter || 'all'} onValueChange={(v) => setSalesUserFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="按业务员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部业务员</SelectItem>
                  {salesUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.realName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 跟单员筛选 */}
              <Select value={operatorUserFilter || 'all'} onValueChange={(v) => setOperatorUserFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="按跟单员" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部跟单员</SelectItem>
                  {operatorUsers.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.realName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* 批量交接按钮 */}
              <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" disabled={selectedCustomers.length === 0}>
                    <UsersRound className="w-4 h-4 mr-1" />
                    批量交接 ({selectedCustomers.length})
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>批量交接客户</DialogTitle>
                    <DialogDescription>
                      将选中的 {selectedCustomers.length} 个客户交接给新的业务员/跟单员
                    </DialogDescription>
                  </DialogHeader>
                  {alert && (
                    <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  )}
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>新业务员</Label>
                      <Select value={batchSalesUserId || 'none'} onValueChange={(v) => setBatchSalesUserId(v === 'none' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择新业务员（可选）" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">不更改</SelectItem>
                          {salesUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.realName} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>新跟单员</Label>
                      <Select value={batchOperatorUserId || 'none'} onValueChange={(v) => setBatchOperatorUserId(v === 'none' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择新跟单员（可选）" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">不更改</SelectItem>
                          {operatorUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.realName} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>取消</Button>
                    <Button onClick={handleBatchTransfer}>确认交接</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* 导入按钮 */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" />
                导入
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-1" />
                下载模板
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={filteredCustomers.length === 0}>
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    新增客户
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingCustomer ? '编辑客户' : '新增客户'}</DialogTitle>
                    <DialogDescription>
                      {editingCustomer ? '修改客户信息' : '填写客户基本信息'}
                    </DialogDescription>
                  </DialogHeader>
                  {alert && (
                    <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>客户代码 *</Label>
                      <Input 
                        value={formData.code} 
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        placeholder="如: C001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>客户名称 *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="如: 厦门万翔商城"
                      />
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
                        placeholder="手机号码"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>电子邮箱</Label>
                      <Input 
                        value={formData.contactEmail} 
                        onChange={(e) => setFormData({...formData, contactEmail: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>所在省份</Label>
                      <Input 
                        value={formData.province} 
                        onChange={(e) => setFormData({...formData, province: e.target.value})}
                        placeholder="如: 福建"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>所在城市</Label>
                      <Input 
                        value={formData.city} 
                        onChange={(e) => setFormData({...formData, city: e.target.value})}
                        placeholder="如: 厦门"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>所在区县</Label>
                      <Input 
                        value={formData.district} 
                        onChange={(e) => setFormData({...formData, district: e.target.value})}
                        placeholder="如: 思明区"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>详细地址</Label>
                      <Input 
                        value={formData.address} 
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        placeholder="详细街道地址"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>业务员</Label>
                      <Select value={formData.salesUserId || 'none'} onValueChange={(v) => handleUserSelect('sales', v === 'none' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择业务员" />
                        </SelectTrigger>
                        <SelectContent>
                          {salesUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.realName} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>跟单员</Label>
                      <Select value={formData.operatorUserId || 'none'} onValueChange={(v) => handleUserSelect('operator', v === 'none' ? '' : v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="选择跟单员" />
                        </SelectTrigger>
                        <SelectContent>
                          {operatorUsers.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.realName} ({user.username})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>信用额度</Label>
                      <Input 
                        type="number"
                        value={formData.creditLimit} 
                        onChange={(e) => setFormData({...formData, creditLimit: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>账期(天)</Label>
                      <Input 
                        type="number"
                        value={formData.paymentDays} 
                        onChange={(e) => setFormData({...formData, paymentDays: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>结算状态</Label>
                      <Select value={formData.paymentStatus} onValueChange={(v) => setFormData({...formData, paymentStatus: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">正常</SelectItem>
                          <SelectItem value="warning">预警</SelectItem>
                          <SelectItem value="overdue">逾期</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>备注</Label>
                      <Input 
                        value={formData.remark} 
                        onChange={(e) => setFormData({...formData, remark: e.target.value})}
                        placeholder="其他说明..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                    <Button onClick={handleSubmit}>{editingCustomer ? '保存修改' : '创建客户'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* 导入确认对话框 */}
              <Dialog open={importDialogOpen} onOpenChange={(open) => {
                if (importing && !open) return;
                setImportDialogOpen(open);
              }}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {importing ? '正在导入客户数据...' : '确认导入客户数据'}
                    </DialogTitle>
                    <DialogDescription>
                      {importing ? (
                        <span className="text-foreground font-medium">
                          已读取 {importProgress.total} 条数据，正在导入中...
                        </span>
                      ) : (
                        `已读取 ${importingData.length} 条数据，请确认信息正确后继续`
                      )}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {/* 导入进度显示 */}
                  {importing && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">导入进度</span>
                        <span className="text-muted-foreground">
                          {importProgress.current} / {importProgress.total}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4">
                          <span className="text-green-600 flex items-center gap-1">
                            <Check className="h-3 w-3" /> 成功 {importProgress.success}
                          </span>
                          {importProgress.failed > 0 && (
                            <span className="text-red-600 flex items-center gap-1">
                              <X className="h-3 w-3" /> 失败 {importProgress.failed}
                            </span>
                          )}
                        </div>
                        <span className="text-muted-foreground">
                          {Math.round((importProgress.current / importProgress.total) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* 数据预览表格 */}
                  {!importing && (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {IMPORT_CONFIG.fieldLabels.map((label, idx) => (
                              <TableHead key={idx}>{label}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importingData.slice(0, 10).map((row, idx) => (
                            <TableRow key={idx}>
                              {IMPORT_CONFIG.fields.map((field) => (
                                <TableCell key={field}>{row[field] || ''}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {importingData.length > 10 && (
                        <p className="text-sm text-muted-foreground mt-2">共读取 {importingData.length} 条数据，此处显示前10条</p>
                      )}
                    </div>
                  )}
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setImportDialogOpen(false)}
                      disabled={importing}
                    >
                      {importing ? '导入中，请稍候...' : '取消'}
                    </Button>
                    <Button 
                      onClick={confirmImport} 
                      disabled={importing}
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          导入中...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          确认导入
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox 
                      checked={selectedCustomers.length > 0 && selectedCustomers.length === filteredCustomers.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>客户代码</TableHead>
                  <TableHead>客户名称</TableHead>
                  <TableHead>联系人</TableHead>
                  <TableHead>联系方式</TableHead>
                  <TableHead>地区</TableHead>
                  <TableHead>业务员</TableHead>
                  <TableHead>跟单员</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      暂无客户数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className={selectedCustomers.includes(customer.id) ? 'bg-blue-50' : ''}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => toggleSelect(customer.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm">{customer.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.name}</div>
                      </TableCell>
                      <TableCell>{customer.contactPerson || '-'}</TableCell>
                      <TableCell>
                        <div className="text-sm">{customer.contactPhone || '-'}</div>
                      </TableCell>
                      <TableCell>
                        {customer.province && customer.city 
                          ? `${customer.province} ${customer.city}` 
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {customer.salesUserName ? (
                          <Badge variant="default" className="bg-blue-100 text-blue-800">
                            {customer.salesUserName}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        {customer.operatorUserName ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            {customer.operatorUserName}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.isActive ? 'default' : 'secondary'}>
                          {customer.isActive ? '活跃' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(customer)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Dialog open={deleteConfirmId === customer.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(customer.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>确认删除</DialogTitle>
                                <DialogDescription>
                                确定要删除客户 &quot;{customer.name}&quot; 吗？此操作无法撤销。
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>取消</Button>
                                <Button variant="destructive" onClick={() => handleDelete(customer.id)}>删除</Button>
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
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
}
