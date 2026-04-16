'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { ArrowLeft, Search, Plus, Edit, Package, Tag, Trash2, Check, Upload, Download, ChevronDown, Loader2, AlertCircle, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Excel导入配置
const IMPORT_CONFIG = {
  title: '商品管理',
  fields: ['code', 'barcode', 'name', 'brand', 'category', 'spec', 'unit', 'costPrice', 'retailPrice', 'lengthCm', 'widthCm', 'heightCm', 'weightKg', 'lifecycleStatus', 'remark'],
  fieldLabels: ['商品编码', '条码', '商品名称', '品牌', '分类', '规格型号', '单位', '成本价', '零售价', '长度(cm)', '宽度(cm)', '高度(cm)', '重量(kg)', '生命周期状态', '备注'],
  // Excel列名到字段的映射（支持多种可能的列名）
  columnMappings: {
    'code': ['商品编码', '编码', 'code', 'SKU'],
    'barcode': ['条码', 'barcode', '商品条码'],
    'name': ['商品名称', '名称', 'name', '商品', '品名'],
    'brand': ['品牌', 'brand', '商品品牌'],
    'category': ['分类', 'category', '商品分类', '类别'],
    'spec': ['规格型号', '规格', 'spec', '型号', '商品规格'],
    'unit': ['单位', 'unit', '计量单位'],
    'costPrice': ['成本价', '采购价', 'costPrice', '成本'],
    'retailPrice': ['零售价', '售价', 'retailPrice', '零售', '价格'],
    'lengthCm': ['长度(cm)', '长(cm)', 'lengthCm', '长度', '长'],
    'widthCm': ['宽度(cm)', '宽(cm)', 'widthCm', '宽度', '宽'],
    'heightCm': ['高度(cm)', '高(cm)', 'heightCm', '高度', '高'],
    'weightKg': ['重量(kg)', 'weightKg', '重量', '重'],
    'lifecycleStatus': ['生命周期状态', '生命周期', '状态', 'lifecycleStatus'],
    'remark': ['备注', 'remark', '备注信息'],
  },
  template: [
    { code: 'SKU001', barcode: '6901234567890', name: '示例商品', brand: '品牌A', category: '数码', spec: '标准版', unit: '台', costPrice: '99.00', retailPrice: '199.00', lengthCm: '30', widthCm: '25', heightCm: '20', weightKg: '3.5', lifecycleStatus: '正常', remark: '备注' },
  ],
};

interface Product {
  id: string;
  code: string;
  barcode: string;
  name: string;
  brand: string;
  category: string;
  spec: string;
  unit: string;
  costPrice: number;
  retailPrice: number;
  lifecycleStatus: string;
  isActive: boolean;
  remark: string;
  // 尺寸和重量字段（用于抛货判断和运费计算）
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  weightKg: number | null;
  volumeFactor: number;
  volumeWeight: number | null; // 体积重量 = 长*宽*高/抛货系数
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    barcode: '',
    name: '',
    brand: '',
    category: '',
    spec: '',
    unit: '台',
    costPrice: 0,
    retailPrice: 0,
    lifecycleStatus: 'active',
    remark: '',
    // 尺寸和重量字段（用于抛货判断和运费计算）
    lengthCm: null as number | null,
    widthCm: null as number | null,
    heightCm: null as number | null,
    weightKg: null as number | null,
    volumeFactor: 6000,
  });
  // Excel导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingData, setImportingData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalProducts(data.total || data.data.length);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('获取商品失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    if (!searchTerm && !brandFilter && selectedBrands.length === 0 && !lifecycleFilter) return true;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (!product.code.toLowerCase().includes(term) && 
          !product.name.toLowerCase().includes(term) &&
          !product.barcode?.toLowerCase().includes(term)) {
        return false;
      }
    }
    if (brandFilter && product.brand !== brandFilter) return false;
    if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand)) return false;
    if (selectedBrands.length > 0 && !product.brand) return false;
    if (lifecycleFilter && product.lifecycleStatus !== lifecycleFilter) return false;
    return true;
  });

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const resetForm = () => {
    setFormData({
      code: '',
      barcode: '',
      name: '',
      brand: '',
      category: '',
      spec: '',
      unit: '台',
      costPrice: 0,
      retailPrice: 0,
      lifecycleStatus: 'active',
      remark: '',
      // 尺寸和重量字段
      lengthCm: null,
      widthCm: null,
      heightCm: null,
      weightKg: null,
      volumeFactor: 6000,
    });
    setEditingProduct(null);
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        code: product.code,
        barcode: product.barcode || '',
        name: product.name,
        brand: product.brand || '',
        category: product.category || '',
        spec: product.spec || '',
        unit: product.unit || '台',
        costPrice: product.costPrice || 0,
        retailPrice: product.retailPrice || 0,
        lifecycleStatus: product.lifecycleStatus || 'active',
        remark: product.remark || '',
        // 尺寸和重量字段
        lengthCm: product.lengthCm ?? null,
        widthCm: product.widthCm ?? null,
        heightCm: product.heightCm ?? null,
        weightKg: product.weightKg ?? null,
        volumeFactor: product.volumeFactor || 6000,
      });
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: editingProduct ? '商品更新成功' : '商品创建成功' });
        setDialogOpen(false);
        fetchProducts();
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
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAlert({ type: 'success', message: '商品删除成功' });
        setDeleteConfirmId(null);
        fetchProducts();
      }
    } catch (error) {
      setAlert({ type: 'error', message: '删除失败' });
    }
  };

  // 下载导入模板
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
        
        // 将工作表转换为JSON，保留原始键名
        const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false }) as Record<string, string>[];
        
        if (rawData.length === 0) {
          toast.error('导入文件为空');
          return;
        }
        
        // 建立Excel列名到字段的映射
        const firstRow = rawData[0];
        const excelToField: Record<string, string> = {};
        
        for (const [field, possibleNames] of Object.entries(IMPORT_CONFIG.columnMappings)) {
          for (const name of possibleNames) {
            // 尝试在第一行找到匹配的列名（不区分大小写，去除空格）
            const normalizedName = name.trim().toLowerCase();
            for (const excelCol of Object.keys(firstRow)) {
              if (excelCol.trim().toLowerCase() === normalizedName) {
                excelToField[excelCol] = field;
                break;
              }
            }
          }
        }
        
        console.log('Excel列名到字段的映射:', excelToField);
        
        // 转换数据：将Excel列名映射到标准字段名
        const jsonData = rawData.map(row => {
          const mappedRow: Record<string, string> = {};
          for (const [excelCol, value] of Object.entries(row)) {
            const field = excelToField[excelCol];
            if (field) {
              mappedRow[field] = value;
            }
          }
          return mappedRow;
        });
        
        console.log('转换后的数据示例:', jsonData.slice(0, 3));
        
        setImportingData(jsonData);
        setImportDialogOpen(true);
        toast.success(`已读取 ${jsonData.length} 条数据`);
      } catch (error) {
        console.error('文件解析错误:', error);
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
        const batchIndex = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(importingData.length / batchSize);
        
        setImportProgress({ 
          current: Math.min(i + batchSize, importingData.length), 
          total: importingData.length, 
          success: totalSuccess, 
          failed: totalFailed 
        });
        
        const res = await fetch('/api/import/products', {
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
      fetchProducts();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  // 导出商品数据
  const handleExport = () => {
    const dataToExport = filteredProducts.map(p => ({
      '商品编码': p.code,
      '条码': p.barcode || '',
      '商品名称': p.name,
      '品牌': p.brand || '',
      '分类': p.category || '',
      '规格': p.spec || '',
      '单位': p.unit || '',
      '成本价': p.costPrice || 0,
      '零售价': p.retailPrice || 0,
      '生命周期状态': p.lifecycleStatus === 'active' ? '正常' : p.lifecycleStatus === 'discontinued' ? '停产' : '清仓',
      '状态': p.isActive ? '启用' : '停用',
      '备注': p.remark || '',
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '商品管理');
    XLSX.writeFile(wb, `商品管理_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('导出成功');
  };

  const getLifecycleBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">正常</Badge>;
      case 'discontinued':
        return <Badge className="bg-yellow-100 text-yellow-800">停产</Badge>;
      case 'clearance':
        return <Badge className="bg-orange-100 text-orange-800">清仓</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // 分页计算 - 使用 API 返回的总数，或者筛选后的数量
  const isFiltered = searchTerm || brandFilter || selectedBrands.length > 0 || lifecycleFilter;
  const totalItems = isFiltered ? filteredProducts.length : totalProducts;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedProducts = isFiltered ? filteredProducts.slice(startIndex, endIndex) : products.slice(startIndex, endIndex);

  // 重置页码当筛选条件改变时
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, brandFilter, selectedBrands.length, lifecycleFilter]);

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
              <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">商品管理</h1>
                <p className="text-sm text-gray-500">Product Management</p>
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
            <Link href="/customers" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              客户管理
            </Link>
            <Link href="/suppliers-manage" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              供应商管理
            </Link>
            <Link href="/products" className="py-4 px-2 border-b-2 border-orange-600 text-sm font-medium text-orange-600">
              商品管理
            </Link>
            <Link href="/warehouses-manage" className="py-4 px-2 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900">
              仓库管理
            </Link>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索商品编码/名称/条码..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="w-[150px] justify-between">
                    {selectedBrands.length > 0 ? (
                      <span className="truncate">已选 {selectedBrands.length} 个</span>
                    ) : brandFilter ? (
                      <span className="truncate">{brandFilter}</span>
                    ) : (
                      <span className="text-muted-foreground truncate">按品牌筛选</span>
                    )}
                    <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-0" align="start">
                  <div className="p-2 border-b bg-muted/30">
                    <div className="text-xs font-medium text-muted-foreground">选择品牌（可多选）</div>
                  </div>
                  <div className="p-1 max-h-64 overflow-y-auto">
                    <div className="px-2 py-1.5">
                      <button
                        onClick={() => {
                          setBrandFilter('');
                          setSelectedBrands([]);
                        }}
                        className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer flex items-center gap-2 ${
                          !brandFilter && selectedBrands.length === 0 ? 'bg-primary/10 text-primary' : ''
                        }`}
                      >
                        全部品牌
                      </button>
                    </div>
                    {brands.map(brand => (
                      <div key={brand} className="px-2 py-1">
                        <button
                          onClick={() => {
                            setBrandFilter(''); // 清空单选
                            setSelectedBrands(prev => 
                              prev.includes(brand) 
                                ? prev.filter(b => b !== brand)
                                : [...prev, brand]
                            );
                          }}
                          className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-muted cursor-pointer flex items-center gap-2 ${
                            selectedBrands.includes(brand) ? 'bg-primary/10 text-primary' : ''
                          }`}
                        >
                          <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                            selectedBrands.includes(brand) ? 'bg-primary border-primary' : 'border-muted-foreground'
                          }`}>
                            {selectedBrands.includes(brand) && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                          {brand}
                        </button>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Select value={lifecycleFilter || 'all'} onValueChange={(v) => setLifecycleFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="按状态筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="discontinued">停产</SelectItem>
                  <SelectItem value="clearance">清仓</SelectItem>
                </SelectContent>
              </Select>
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
                模板下载
              </Button>
              <Button variant="outline" onClick={handleExport} disabled={filteredProducts.length === 0}>
                <Download className="w-4 h-4 mr-1" />
                导出
              </Button>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
                    <Plus className="w-4 h-4 mr-1" />
                    新增商品
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingProduct ? '编辑商品' : '新增商品'}</DialogTitle>
                    <DialogDescription>
                      {editingProduct ? '修改商品信息' : '填写商品基本信息'}
                    </DialogDescription>
                  </DialogHeader>
                  {alert && (
                    <Alert variant={alert.type === 'success' ? 'default' : 'destructive'}>
                      <AlertDescription>{alert.message}</AlertDescription>
                    </Alert>
                  )}
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>商品编码 *</Label>
                      <Input 
                        value={formData.code} 
                        onChange={(e) => setFormData({...formData, code: e.target.value})}
                        placeholder="如: JRD05-U"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>条码</Label>
                      <Input 
                        value={formData.barcode} 
                        onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                        placeholder="商品条码"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label>商品名称 *</Label>
                      <Input 
                        value={formData.name} 
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="完整的商品名称"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>品牌</Label>
                      <Input 
                        value={formData.brand} 
                        onChange={(e) => setFormData({...formData, brand: e.target.value})}
                        placeholder="如: 苏泊尔"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>分类</Label>
                      <Input 
                        value={formData.category} 
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        placeholder="如: 厨房电器"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>规格</Label>
                      <Input 
                        value={formData.spec} 
                        onChange={(e) => setFormData({...formData, spec: e.target.value})}
                        placeholder="如: 1.75L"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>单位</Label>
                      <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="台">台</SelectItem>
                          <SelectItem value="个">个</SelectItem>
                          <SelectItem value="套">套</SelectItem>
                          <SelectItem value="箱">箱</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>成本价</Label>
                      <Input 
                        type="number"
                        value={formData.costPrice} 
                        onChange={(e) => setFormData({...formData, costPrice: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>零售价</Label>
                      <Input 
                        type="number"
                        value={formData.retailPrice} 
                        onChange={(e) => setFormData({...formData, retailPrice: parseFloat(e.target.value) || 0})}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>生命周期</Label>
                      <Select value={formData.lifecycleStatus} onValueChange={(v) => setFormData({...formData, lifecycleStatus: v})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">正常</SelectItem>
                          <SelectItem value="discontinued">停产</SelectItem>
                          <SelectItem value="clearance">清仓</SelectItem>
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
                    {/* 尺寸和重量字段 */}
                    <div className="col-span-2">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-4">尺寸与重量（用于运费计算）</h3>
                    </div>
                    <div className="space-y-2">
                      <Label>长度(cm)</Label>
                      <Input 
                        type="number"
                        value={formData.lengthCm ?? ''} 
                        onChange={(e) => setFormData({...formData, lengthCm: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="如: 30"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>宽度(cm)</Label>
                      <Input 
                        type="number"
                        value={formData.widthCm ?? ''} 
                        onChange={(e) => setFormData({...formData, widthCm: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="如: 20"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>高度(cm)</Label>
                      <Input 
                        type="number"
                        value={formData.heightCm ?? ''} 
                        onChange={(e) => setFormData({...formData, heightCm: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="如: 15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>重量(kg)</Label>
                      <Input 
                        type="number"
                        value={formData.weightKg ?? ''} 
                        onChange={(e) => setFormData({...formData, weightKg: e.target.value ? parseFloat(e.target.value) : null})}
                        placeholder="如: 2.5"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
                    <Button onClick={handleSubmit}>{editingProduct ? '保存修改' : '创建商品'}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {/* 导入确认对话框 */}
              <Dialog open={importDialogOpen} onOpenChange={(open) => {
                // 如果正在导入中，不允许关闭对话框
                if (importing && !open) return;
                setImportDialogOpen(open);
              }}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {importing ? '正在导入商品数据...' : '确认导入商品数据'}
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

        {/* Product List */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>商品编码</TableHead>
                  <TableHead>条码</TableHead>
                  <TableHead>商品名称</TableHead>
                  <TableHead>品牌</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>规格</TableHead>
                  <TableHead>成本价</TableHead>
                  <TableHead>生命周期</TableHead>
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
                ) : paginatedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      暂无商品数据
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.code}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {product.barcode || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[250px] truncate" title={product.name}>
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.brand && <Badge variant="outline">{product.brand}</Badge>}
                      </TableCell>
                      <TableCell>{product.category || '-'}</TableCell>
                      <TableCell>{product.spec || '-'}</TableCell>
                      <TableCell className="text-right">¥{product.costPrice?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">¥{product.retailPrice?.toFixed(2)}</TableCell>
                      <TableCell>{getLifecycleBadge(product.lifecycleStatus)}</TableCell>
                      <TableCell>
                        <Badge variant={product.isActive ? 'default' : 'secondary'}>
                          {product.isActive ? '启用' : '禁用'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(product)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Dialog open={deleteConfirmId === product.id} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmId(product.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>确认删除</DialogTitle>
                                <DialogDescription>
                                确定要删除商品 &quot;{product.name}&quot; 吗？此操作无法撤销。
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>取消</Button>
                                <Button variant="destructive" onClick={() => handleDelete(product.id)}>删除</Button>
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
            {/* Pagination */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    共 {totalItems} 条，第 {startIndex + 1}-{endIndex} 条
                  </div>
                  {!isFiltered && hasMore && (
                    <div className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      平台限制，可能还有更多数据，请使用筛选功能
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="20">20条/页</SelectItem>
                      <SelectItem value="50">50条/页</SelectItem>
                      <SelectItem value="100">100条/页</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    >
                      首页
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      上一页
                    </Button>
                    <span className="px-3 text-sm">
                      {currentPage} / {totalPages}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    >
                      末页
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    </>
  );
}
