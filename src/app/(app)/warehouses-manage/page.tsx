'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders, useAuth, usePermission } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  ArrowLeft, Search, Plus, Edit, Warehouse, Truck, 
  AlertTriangle, Trash2, Package
} from 'lucide-react';

interface WarehouseType {
  id: string;
  code: string;
  name: string;
  shortName: string;
  type: string;
  contactPerson: string;
  contactPhone: string;
  address: string;
  province: string;
  city: string;
  isActive: boolean;
  remark: string;
  createdAt: string;
}

interface StockItem {
  id: string;
  supplierId: string;
  supplierName: string;
  productCode: string;
  productName: string;
  quantity: number;
  price: number;
  warehouseType: string;
  isLowStock: boolean;
}

export default function WarehousesManagePage() {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [warehouses, setWarehouses] = useState<WarehouseType[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'warehouses' | 'stocks'>('warehouses');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    type: 'supplier',
    contactPerson: '',
    contactPhone: '',
    address: '',
    province: '',
    city: '',
    remark: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const authHeaders = () => buildUserInfoHeaders(user);
  const canCreateSuppliers = hasPermission('suppliers:create');
  const canEditSuppliers = hasPermission('suppliers:edit');
  const canDeleteSuppliers = hasPermission('suppliers:delete');

  const fetchData = async () => {
    try {
      const [warehousesRes, stocksRes, suppliersRes] = await Promise.all([
        fetch('/api/warehouses', { headers: authHeaders() }),
        fetch('/api/stocks', { headers: authHeaders() }),
        fetch('/api/suppliers', { headers: authHeaders() }),
      ]);

      const [warehousesData, stocksData, suppliersData] = await Promise.all([
        warehousesRes.json(),
        stocksRes.json().catch(() => ({ data: [] })),
        suppliersRes.json(),
      ]);

      setWarehouses(warehousesData.data || []);
      
      // 合并供应商数据作为库存数据
      const supplierStocks: StockItem[] = (suppliersData.data || []).map((s: Record<string, unknown>) => ({
        id: s.id as string,
        supplierId: s.id as string,
        supplierName: s.name as string,
        productCode: '-',
        productName: '-',
        quantity: 0,
        price: 0,
        warehouseType: s.type as string,
        isLowStock: false,
      }));
      setStocks(supplierStocks);
    } catch (error) {
      console.error('获取数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWarehouses = warehouses.filter(wh => {
    if (!searchTerm && !typeFilter) return true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!wh.code.toLowerCase().includes(term) && !wh.name.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (typeFilter && wh.type !== typeFilter) return false;
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
      address: '',
      province: '',
      city: '',
      remark: '',
    });
    setEditingWarehouse(null);
  };

  const handleOpenDialog = (warehouse?: WarehouseType) => {
    if (warehouse) {
      setEditingWarehouse(warehouse);
      setFormData({
        code: warehouse.code,
        name: warehouse.name,
        shortName: warehouse.shortName || '',
        type: warehouse.type,
        contactPerson: warehouse.contactPerson || '',
        contactPhone: warehouse.contactPhone || '',
        address: warehouse.address || '',
        province: warehouse.province || '',
        city: warehouse.city || '',
        remark: warehouse.remark || '',
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingWarehouse ? `/api/warehouses/${editingWarehouse.id}` : '/api/warehouses';
      const method = editingWarehouse ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: editingWarehouse ? '仓库更新成功' : '仓库创建成功' });
        setDialogOpen(false);
        fetchData();
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
      const res = await fetch(`/api/warehouses/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      
      if (data.success) {
        setAlert({ type: 'success', message: '仓库删除成功' });
        setDeleteConfirmId(null);
        fetchData();
      }
    } catch (error) {
      setAlert({ type: 'error', message: '删除失败' });
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'own':
        return <Badge className="bg-purple-100 text-purple-800">自有仓库</Badge>;
      case 'supplier':
        return <Badge className="bg-blue-100 text-blue-800">供应商</Badge>;
      case 'factory':
        return <Badge className="bg-green-100 text-green-800">工厂直发</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStockBadge = (item: StockItem) => {
    if (item.quantity === 0) {
      return <Badge className="bg-red-100 text-red-800">缺货</Badge>;
    } else if (item.quantity <= 2) {
      return <Badge className="bg-orange-100 text-orange-800">尾货</Badge>;
    } else if (item.quantity <= 10) {
      return <Badge className="bg-yellow-100 text-yellow-800">库存紧张</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">充足</Badge>;
  };

  const warehouseStats = {
    total: warehouses.length,
    own: warehouses.filter(w => w.type === 'own').length,
    supplier: warehouses.filter(w => w.type === 'supplier').length,
  };

  const stockStats = {
    total: stocks.length,
    lowStock: stocks.filter(s => s.quantity > 0 && s.quantity <= 2).length,
    outOfStock: stocks.filter(s => s.quantity === 0).length,
  };

  return (
    <PageGuard permission="suppliers:view">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/archive">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                返回
              </Button>
            </Link>
            <div className="flex min-w-0 items-center gap-3">
              <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">仓库管理</h1>
                <p className="text-sm text-gray-500">Warehouse Management</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex gap-6 overflow-x-auto">
            <Link href="/archive" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              总览
            </Link>
            <Link href="/customers" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              客户管理
            </Link>
            <Link href="/suppliers-manage" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              供应商管理
            </Link>
            <Link href="/products" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              商品管理
            </Link>
            <Link href="/warehouses-manage" className="py-4 px-2 border-b-2 border-purple-600 text-sm font-medium text-purple-600">
              仓库管理
            </Link>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">仓库总数</p>
                  <p className="text-2xl font-bold">{warehouseStats.total}</p>
                </div>
                <Warehouse className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700">自有仓库</p>
                  <p className="text-2xl font-bold text-purple-700">{warehouseStats.own}</p>
                </div>
                <Package className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">供应商</p>
                  <p className="text-2xl font-bold text-blue-700">{warehouseStats.supplier}</p>
                </div>
                <Truck className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700">尾货预警</p>
                  <p className="text-2xl font-bold text-orange-700">{stockStats.lowStock}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <Button
            variant={activeTab === 'warehouses' ? 'default' : 'outline'}
            onClick={() => setActiveTab('warehouses')}
            className="w-full sm:w-auto"
          >
            <Warehouse className="w-4 h-4 mr-1" />
            仓库档案
          </Button>
          <Button
            variant={activeTab === 'stocks' ? 'default' : 'outline'}
            onClick={() => setActiveTab('stocks')}
            className="w-full sm:w-auto"
          >
            <Package className="w-4 h-4 mr-1" />
            库存管理
          </Button>
        </div>

        {activeTab === 'warehouses' ? (
          <>
            {/* Warehouse Search and Actions */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="搜索仓库编码/名称..."
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
                      <SelectItem value="own">自有仓库</SelectItem>
                      <SelectItem value="supplier">供应商</SelectItem>
                      <SelectItem value="factory">工厂直发</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button
                        onClick={() => { resetForm(); setDialogOpen(true); }}
                        disabled={!canCreateSuppliers}
                        className="w-full xl:w-auto"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        新增仓库
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingWarehouse ? '编辑仓库' : '新增仓库'}</DialogTitle>
                        <DialogDescription>
                          {editingWarehouse ? '修改仓库信息' : '填写仓库基本信息'}
                        </DialogDescription>
                      </DialogHeader>
                      {alert && (
                        <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
                          <AlertDescription>{alert.message}</AlertDescription>
                        </Alert>
                      )}
                      <div className="grid gap-4 py-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>仓库编码 *</Label>
                          <Input 
                            value={formData.code} 
                            onChange={(e) => setFormData({...formData, code: e.target.value})}
                            placeholder="如: WH001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>仓库名称 *</Label>
                          <Input 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="完整的仓库名称"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>简称</Label>
                          <Input 
                            value={formData.shortName} 
                            onChange={(e) => setFormData({...formData, shortName: e.target.value})}
                            placeholder="如: 首映礼"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>类型 *</Label>
                          <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="own">自有仓库</SelectItem>
                              <SelectItem value="supplier">供应商</SelectItem>
                              <SelectItem value="factory">工厂直发</SelectItem>
                            </SelectContent>
                          </Select>
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
                            placeholder="如: 广州"
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
                          disabled={editingWarehouse ? !canEditSuppliers : !canCreateSuppliers}
                          className="w-full sm:w-auto"
                        >
                          {editingWarehouse ? '保存修改' : '创建仓库'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>

            {/* Warehouse List */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>仓库编码</TableHead>
                      <TableHead>仓库名称</TableHead>
                      <TableHead>简称</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>地区</TableHead>
                      <TableHead>联系人</TableHead>
                      <TableHead>联系电话</TableHead>
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
                    ) : filteredWarehouses.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                          暂无仓库数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWarehouses.map((warehouse) => (
                        <TableRow key={warehouse.id}>
                          <TableCell className="font-mono text-sm">{warehouse.code}</TableCell>
                          <TableCell className="font-medium">{warehouse.name}</TableCell>
                          <TableCell>{warehouse.shortName || '-'}</TableCell>
                          <TableCell>{getTypeBadge(warehouse.type)}</TableCell>
                          <TableCell>
                            {warehouse.province && warehouse.city 
                              ? `${warehouse.province} ${warehouse.city}` 
                              : '-'}
                          </TableCell>
                          <TableCell>{warehouse.contactPerson || '-'}</TableCell>
                          <TableCell>{warehouse.contactPhone || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={warehouse.isActive ? 'default' : 'secondary'}>
                              {warehouse.isActive ? '启用' : '禁用'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(warehouse)}
                                disabled={!canEditSuppliers}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Dialog open={deleteConfirmId === warehouse.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteConfirmId(warehouse.id)}
                                    disabled={!canDeleteSuppliers}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-lg">
                                  <DialogHeader>
                                    <DialogTitle>确认删除</DialogTitle>
                                    <DialogDescription>
                                      确定要删除仓库 &quot;{warehouse.name}&quot; 吗？此操作无法撤销。
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                    <Button variant="outline" onClick={() => setDeleteConfirmId(null)} className="w-full sm:w-auto">取消</Button>
                                    <Button
                                      variant="destructive"
                                      onClick={() => handleDelete(warehouse.id)}
                                      disabled={!canDeleteSuppliers}
                                      className="w-full sm:w-auto"
                                    >
                                      删除
                                    </Button>
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
          </>
        ) : (
          <>
            {/* Stock List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">实时库存</CardTitle>
                <CardDescription>显示各仓库/供应商的商品库存情况</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>仓库/供应商</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>商品编码</TableHead>
                      <TableHead>商品名称</TableHead>
                      <TableHead className="text-right">库存数量</TableHead>
                      <TableHead className="text-right">单价</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          加载中...
                        </TableCell>
                      </TableRow>
                    ) : stocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          暂无库存数据
                        </TableCell>
                      </TableRow>
                    ) : (
                      stocks.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">{stock.supplierName}</TableCell>
                          <TableCell>{getTypeBadge(stock.warehouseType)}</TableCell>
                          <TableCell className="font-mono text-sm">{stock.productCode}</TableCell>
                          <TableCell>{stock.productName}</TableCell>
                          <TableCell className="text-right font-mono">{stock.quantity}</TableCell>
                          <TableCell className="text-right">¥{stock.price?.toFixed(2)}</TableCell>
                          <TableCell>{getStockBadge(stock)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Stock Warning Info */}
        {activeTab === 'stocks' && (
          <Alert className="mt-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>尾货预警规则：</strong>当某商品库存 ≤ 2 台时，系统将标记为&quot;尾货&quot;并发出预警提示，以防止撞单风险。
              建议在派发订单时优先考虑库存充足的供应商。
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
    </PageGuard>
  );
}
