'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { 
  Users, Package, Truck, Settings,
  Upload, Download, ArrowRight, Clock
} from 'lucide-react';

interface ModuleStats {
  customers: number;
  shippers: number;  // 发货方（供应商+仓库）
  products: number;
  skuMappings: number;
}

// Excel 导入配置
const IMPORT_CONFIG = {
  customers: {
    title: '客户管理',
    moduleKey: 'customers',
  },
  products: {
    title: '商品管理',
    moduleKey: 'products',
  },
  skuMappings: {
    title: 'SKU映射',
    moduleKey: 'skuMappings',
  },
  suppliers: {
    title: '发货方管理',
    moduleKey: 'suppliers',
  },
};

// 模块定义
const MODULES = [
  {
    title: '客户管理',
    description: '客户档案、业务员/跟单员分配',
    icon: Users,
    href: '/customers',
    color: 'bg-blue-500',
    tag: 'CUST',
    hasImport: true,
    moduleKey: 'customers',
  },
  {
    title: '发货方管理',
    description: '供应商和仓库统一管理',
    icon: Truck,
    href: '/suppliers-manage',
    color: 'bg-green-500',
    tag: 'SHIP',
    hasImport: true,
    moduleKey: 'suppliers',
  },
  {
    title: '商品管理',
    description: '商品档案、SKU映射、品牌分类',
    icon: Package,
    href: '/products',
    color: 'bg-orange-500',
    tag: 'PROD',
    hasImport: true,
    moduleKey: 'products',
  },
  {
    title: 'SKU映射',
    description: '客户商品与内部商品映射关系',
    icon: Truck,
    href: '/sku-mappings',
    color: 'bg-purple-500',
    tag: 'MAP',
    hasImport: true,
    moduleKey: 'skuMappings',
  },
];

export default function ArchiveManagementPage() {
  const pathname = usePathname();
  const [stats, setStats] = useState<ModuleStats>({
    customers: 0,
    shippers: 0,
    products: 0,
    skuMappings: 0,
  });
  const [loading, setLoading] = useState(true);
  
  // Excel 导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingModule, setImportingModule] = useState<string>('');
  const [importingData, setImportingData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customersRes, suppliersRes, productsRes, warehousesRes] = await Promise.all([
        fetch('/api/customers?isActive=true'),
        fetch('/api/suppliers?active=true'),
        fetch('/api/products?isActive=true'),
        fetch('/api/warehouses?isActive=true'),
      ]);

      const [customersData, suppliersData, productsData, warehousesData] = await Promise.all([
        customersRes.json(),
        suppliersRes.json(),
        productsRes.json(),
        warehousesRes.json(),
      ]);

      // SKU映射统计
      let skuMappingsCount = 0;
      try {
        const mappingsRes = await fetch('/api/product-mappings');
        const mappingsData = await mappingsRes.json();
        skuMappingsCount = mappingsData.total || 0;
      } catch {
        // 忽略错误
      }

      setStats({
        customers: customersData.total || 0,
        shippers: (suppliersData.total || 0) + (warehousesData.total || 0),
        products: productsData.total || 0,
        skuMappings: skuMappingsCount,
      });
    } catch (error) {
      console.error('获取统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 下载模板
  const downloadTemplate = (moduleKey: string) => {
    const config = IMPORT_CONFIG[moduleKey as keyof typeof IMPORT_CONFIG];
    if (!config) return;
    
    const templates: Record<string, any[]> = {
      customers: [
        { code: 'KH-001', name: '示例客户公司', shortName: '示例', contactPerson: '张三', contactPhone: '13800138000', address: '深圳市南山区科技园', salespersonName: '李四', orderTakerName: '王五', customerLevel: 'A', paymentStatus: '月结', remark: '备注' },
      ],
      products: [
        { code: 'SKU001', barcode: '6901234567890', name: '示例商品', brand: '品牌A', category: '数码', spec: '标准版', unit: '台', costPrice: '99.00', retailPrice: '199.00', lengthCm: '30', widthCm: '25', heightCm: '20', weightKg: '3.5', lifecycleStatus: '正常', remark: '备注' },
      ],
      skuMappings: [
        { customerCode: 'KH-001', customerProductName: '苏泊尔ZMD绞肉机', customerSku: 'JRD05-U', customerSpec: 'JRD05-U', productCode: 'JRD05-U', productName: '苏泊尔ZMD安心系列绞肉机', priority: '1', remark: '' },
      ],
      suppliers: [
        { code: 'FHS-001', name: '广东云海供应链', shortName: '云海', type: '供应商', contactPerson: '张经理', contactPhone: '13800138000', province: '广东', city: '深圳', address: '深圳市宝安区xxx物流园', sendType: '下载发货', settlementType: '月结', costFactor: '1.0', canJd: '否', jdChannelId: '', canPdd: '否', pddShopId: '', expressRestrictions: '', remark: '' },
      ],
    };
    
    const ws = XLSX.utils.json_to_sheet(templates[moduleKey] || []);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title);
    XLSX.writeFile(wb, `${config.title}_导入模板.xlsx`);
    toast.success('模板下载成功');
  };

  // 处理 Excel 文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, moduleKey: string) => {
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
        
        setImportingModule(moduleKey);
        setImportingData(jsonData);
        setImportDialogOpen(true);
        toast.success(`已读取 ${jsonData.length} 条数据`);
      } catch {
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
    try {
      const res = await fetch(`/api/import/${importingModule}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: importingData }),
      });
      const result = await res.json();
      
      if (result.success) {
        toast.success(`成功导入 ${result.imported || importingData.length} 条数据`);
        setImportDialogOpen(false);
        setImportingData([]);
        fetchStats();
      } else {
        toast.error(result.error || '导入失败');
      }
    } catch {
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  // 获取模块统计
  const getModuleStats = (tag: string) => {
    switch (tag) {
      case 'CUST': return stats.customers;
      case 'SHIP': return stats.shippers;
      case 'PROD': return stats.products;
      case 'MAP': return stats.skuMappings;
      default: return 0;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">档案管理中心</h1>
                  <p className="text-sm text-gray-500">档案信息统一管理</p>
                </div>
              </div>
              <Badge variant="outline">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleDateString('zh-CN')}
              </Badge>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4">
            <nav className="flex gap-6">
              <Link 
                href="/orders" 
                className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  pathname === '/orders' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                订单中心
              </Link>
              <Link 
                href="/archive" 
                className={`py-4 px-2 border-b-2 text-sm font-medium transition-colors ${
                  pathname === '/archive' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                档案管理
              </Link>
            </nav>
          </div>
        </div>

        <main className="container mx-auto px-4 py-6">
          {/* 模块卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {MODULES.map((module) => (
              <Link key={module.tag} href={module.href}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className={`w-12 h-12 ${module.color} rounded-lg flex items-center justify-center`}>
                      <module.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center gap-2">
                      {module.hasImport && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => e.preventDefault()}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>{module.title} - Excel导入</DialogTitle>
                              <DialogDescription>
                                请下载模板，按要求填写后上传
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <Button 
                                variant="outline" 
                                onClick={() => downloadTemplate(module.moduleKey!)}
                                className="w-full"
                              >
                                <Download className="w-4 h-4 mr-2" />
                                下载模板
                              </Button>
                              <div className="relative">
                                <input
                                  type="file"
                                  accept=".xlsx,.xls"
                                  className="hidden"
                                  ref={fileInputRef}
                                  onChange={(e) => handleFileUpload(e, module.moduleKey!)}
                                />
                                <Button 
                                  variant="outline" 
                                  className="w-full"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  选择Excel文件
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {module.tag}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg mb-1">{module.title}</CardTitle>
                    <CardDescription className="text-sm mb-3">
                      {module.description}
                    </CardDescription>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-gray-700">
                        {loading ? '-' : getModuleStats(module.tag)}
                      </span>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* 模块说明 */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  客户管理
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p>• 客户档案：基本信息、联系方式</p>
                <p>• 业务员分配：负责客户拓展</p>
                <p>• 跟单员分配：负责订单跟进</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-green-500" />
                  发货方管理
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p>• 统一管理供应商和仓库</p>
                <p>• 发货限制：地区/快递配置</p>
                <p>• 京东渠道：物流配置</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Package className="w-4 h-4 text-orange-500" />
                  商品管理
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p>• 商品档案：编码、名称、规格</p>
                <p>• 品牌分类：按类型筛选</p>
                <p>• 生命周期：在售/停产</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-500" />
                  SKU映射
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-gray-600 space-y-1">
                <p>• 映射关系：客户商品编码</p>
                <p>• 价格管理：对应价格</p>
                <p>• 批量导入：Excel操作</p>
              </CardContent>
            </Card>
          </div>

          {/* 数据统计 */}
          <Card className="mt-8 bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="text-base">数据概览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">客户</p>
                  <p className="text-2xl font-bold text-blue-600">{loading ? '-' : stats.customers}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">发货方</p>
                  <p className="text-2xl font-bold text-green-600">{loading ? '-' : stats.shippers}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">商品</p>
                  <p className="text-2xl font-bold text-orange-600">{loading ? '-' : stats.products}</p>
                </div>
                <div className="bg-white/60 rounded-lg p-4 text-center">
                  <p className="text-sm text-gray-500 mb-1">SKU映射</p>
                  <p className="text-2xl font-bold text-purple-600">{loading ? '-' : stats.skuMappings}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Excel 导入确认对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>确认导入数据</DialogTitle>
            <DialogDescription>
              共 {importingData.length} 条数据，请确认是否导入
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px] border rounded-lg p-4">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b">
                  {Object.keys(importingData[0] || {}).map((key) => (
                    <th key={key} className="px-2 py-2 text-left font-medium text-gray-500">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importingData.slice(0, 50).map((row, i) => (
                  <tr key={i} className="border-b">
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-2 py-2">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {importingData.length > 50 && (
              <p className="text-center text-gray-500 py-4">
                ... 还有 {importingData.length - 50} 条数据未显示
              </p>
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmImport} disabled={importing}>
              {importing ? '导入中...' : '确认导入'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
