'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders, usePermission } from '@/lib/auth';
import {
  Package,
  AlertTriangle,
  AlertCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Warehouse,
  TrendingDown,
  TrendingUp,
  DollarSign,
  History,
  ArrowUpDown,
  User,
  Download,
  Upload,
  Loader2,
  Check,
  X,
} from 'lucide-react';

// Excel模板配置
const IMPORT_TEMPLATE = {
  title: '库存管理',
  fields: ['supplierCode', 'supplierName', 'productName', 'productCode', 'spec', 'quantity', 'price', 'warehouse', 'remark'],
  fieldLabels: ['供应商编码', '供应商名称', '商品名称', '商品编码', '规格型号', '库存数量', '单价', '仓库', '备注'],
  template: [
    { supplierCode: 'GYS-001', supplierName: '首映礼省内仓', productName: '九阳电蒸锅', productCode: 'DZ100HG-GZ605', spec: 'DZ100HG-GZ605', quantity: '15', price: '145.00', warehouse: '默认仓', remark: '' },
    { supplierCode: 'GYS-001', supplierName: '首映礼省内仓', productName: '苏泊尔果蔬清洗机', productCode: 'GS10', spec: 'GS10', quantity: '3', price: '115.00', warehouse: '默认仓', remark: '尾货预警' },
  ],
};

interface Stock {
  id: string;
  supplier_id?: string;
  supplier_name?: string;
  product_code: string;
  product_name: string;
  quantity: number;
  in_transit: number;
  price: number;
  warehouse_id?: string;
  isLowStock?: boolean;
  stockLevel?: 'out' | 'low' | 'normal';
  available?: number;
  created_at: string;
  updated_at: string;
}

interface Supplier {
  id: string;
  code: string;
  name: string;
}

interface StockStats {
  totalCount: number;
  lowStockCount: number;
  outOfStockCount: number;
}

interface StockVersion {
  id: string;
  stockId: string;
  productCode: string;
  productName: string;
  supplierName: string;
  beforeQuantity: number | null;
  afterQuantity: number;
  changeQuantity: number;
  beforePrice: number | null;
  afterPrice: number | null;
  changePrice: number;
  changeType: string;
  changeReason: string;
  operator: string;
  createdAt: string;
}

interface PriceHistory {
  id: string;
  productCode: string;
  productName: string;
  supplierName: string;
  beforePrice: number | null;
  afterPrice: number;
  changePrice: number;
  changeType: string;
  changeReason: string;
  operator: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
}

export default function StocksPage() {
  const { hasPermission } = usePermission();
  const canEditStocks = hasPermission('stocks:edit');
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [stats, setStats] = useState<StockStats>({ totalCount: 0, lowStockCount: 0, outOfStockCount: 0 });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  
  // 版本历史相关状态
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [selectedStockForVersion, setSelectedStockForVersion] = useState<Stock | null>(null);
  const [stockVersions, setStockVersions] = useState<StockVersion[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [versionSearchTerm, setVersionSearchTerm] = useState('');
  const [versionChangeReason, setVersionChangeReason] = useState('');
  
  // 价格历史相关状态
  const [activeTab, setActiveTab] = useState<string>('stock');
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loadingPriceHistory, setLoadingPriceHistory] = useState(false);
  const [priceHistorySearch, setPriceHistorySearch] = useState('');
  const [priceHistorySupplier, setPriceHistorySupplier] = useState<string>('all');
  const [priceHistoryDateRange, setPriceHistoryDateRange] = useState<{start: string; end: string}>({
    start: '',
    end: ''
  });

  // 导入相关状态
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importingData, setImportingData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 导入配置
  const IMPORT_CONFIG = {
    fields: ['supplierCode', 'supplierName', 'productName', 'productCode', 'spec', 'quantity', 'price', 'warehouse', 'remark'],
    fieldLabels: ['供应商编码', '供应商名称', '商品名称', '商品编码', '规格型号', '库存数量', '单价', '仓库', '备注'],
    columnMappings: {
      supplierCode: ['供应商编码', '供应商代码', '编码'],
      supplierName: ['供应商名称', '供应商', '供货商'],
      productName: ['商品名称', '品名', '商品'],
      productCode: ['商品编码', 'SKU', '货号'],
      spec: ['规格', '规格型号', '型号规格'],
      quantity: ['库存', '数量', '库存数量'],
      price: ['单价', '价格', '采购价'],
      warehouse: ['仓库', '仓库名称', '仓库编码'],
      remark: ['备注', '说明'],
    },
  };

  // 表单状态
  const [formData, setFormData] = useState({
    supplier_id: '',
    supplier_name: '',
    product_code: '',
    product_name: '',
    quantity: 0,
    in_transit: 0,
    price: 0,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, [showLowStockOnly]);

  const authHeaders = useCallback(() => buildUserInfoHeaders(), []);
  const jsonHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      ...buildUserInfoHeaders(),
    }),
    []
  );

  // 筛选数据
  useEffect(() => {
    let filtered = stocks;

    if (supplierFilter !== 'all') {
      filtered = filtered.filter(s => s.supplier_id === supplierFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.product_name?.toLowerCase().includes(term) ||
        s.product_code?.toLowerCase().includes(term) ||
        s.supplier_name?.toLowerCase().includes(term)
      );
    }

    setFilteredStocks(filtered);
  }, [stocks, searchTerm, supplierFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showLowStockOnly) {
        params.set('lowStockOnly', 'true');
      }

      const [stocksRes, suppliersRes] = await Promise.all([
        fetch(`/api/stocks?${params.toString()}`, { headers: authHeaders() }),
        fetch('/api/suppliers?active=true'),
      ]);

      const stocksData = await stocksRes.json();
      const suppliersData = await suppliersRes.json();

      if (stocksData.success) {
        setStocks(stocksData.data || []);
        if (stocksData.stats) {
          setStats(stocksData.stats);
        }
      }
      if (suppliersData.success) {
        setSuppliers(suppliersData.data || []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
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

        // 将工作表转换为JSON
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
            const normalizedName = name.trim().toLowerCase();
            for (const excelCol of Object.keys(firstRow)) {
              if (excelCol.trim().toLowerCase() === normalizedName) {
                excelToField[excelCol] = field;
                break;
              }
            }
          }
        }

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
        }).filter(row => row.productName || row.supplierName);

        if (jsonData.length === 0) {
          toast.error('未找到有效的导入数据，请检查文件格式');
          return;
        }

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

    // 分批导入，每批50条
    const batchSize = 50;
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

        const res = await fetch('/api/stocks/import', {
          method: 'POST',
          headers: jsonHeaders(),
          body: JSON.stringify({ data: batch }),
        });
        const result = await res.json();

        if (result.success) {
          totalSuccess += (result.data?.inserted || 0) + (result.data?.updated || 0);
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
      loadData();
    } catch (error) {
      console.error('导入失败:', error);
      toast.error('导入失败，请重试');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = editingStock
        ? `/api/stocks/${editingStock.id}`
        : '/api/stocks';
      const method = editingStock ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: jsonHeaders(),
        body: JSON.stringify({
          ...formData,
          supplierId: formData.supplier_id,
          supplierName: formData.supplier_name,
          productCode: formData.product_code,
          productName: formData.product_name,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingStock ? '更新成功' : '添加成功');
        if (data.warning) {
          toast.warning(data.warning);
        }
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      toast.error('操作失败');
    }
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      supplier_id: stock.supplier_id || '',
      supplier_name: stock.supplier_name || '',
      product_code: stock.product_code || '',
      product_name: stock.product_name || '',
      quantity: stock.quantity || 0,
      in_transit: stock.in_transit || 0,
      price: stock.price || 0,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条库存记录吗？')) return;

    try {
      const res = await fetch(`/api/stocks/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        loadData();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  const resetForm = () => {
    setEditingStock(null);
    setFormData({
      supplier_id: '',
      supplier_name: '',
      product_code: '',
      product_name: '',
      quantity: 0,
      in_transit: 0,
      price: 0,
    });
  };

  const handleSupplierSelect = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    setFormData(prev => ({
      ...prev,
      supplier_id: supplierId,
      supplier_name: supplier?.name || '',
    }));
  };

  // 加载版本历史
  const loadStockVersions = async (stock: Stock) => {
    setSelectedStockForVersion(stock);
    setLoadingVersions(true);
    setIsVersionDialogOpen(true);
    try {
      const params = new URLSearchParams();
      if (stock.id) {
        params.set('stockId', stock.id);
      }
      params.set('productCode', stock.product_code);
      if (stock.supplier_id) {
        params.set('supplierId', stock.supplier_id);
      }
      
      const res = await fetch(`/api/stock-versions?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setStockVersions(data.data || []);
      } else {
        toast.error(data.error || '加载版本历史失败');
        setStockVersions([]);
      }
    } catch (error) {
      console.error('加载版本历史失败:', error);
      toast.error('加载版本历史失败');
      setStockVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  // 加载全局版本历史
  const loadAllVersions = async () => {
    setSelectedStockForVersion(null);
    setLoadingVersions(true);
    setIsVersionDialogOpen(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (versionSearchTerm) {
        params.set('productCode', versionSearchTerm);
      }
      
      const res = await fetch(`/api/stock-versions?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setStockVersions(data.data || []);
      } else {
        toast.error(data.error || '加载版本历史失败');
        setStockVersions([]);
      }
    } catch (error) {
      console.error('加载版本历史失败:', error);
      toast.error('加载版本历史失败');
      setStockVersions([]);
    } finally {
      setLoadingVersions(false);
    }
  };

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return <Badge variant="secondary">手动调整</Badge>;
      case 'import':
        return <Badge variant="default">批量导入</Badge>;
      case 'order':
        return <Badge variant="outline">订单扣减</Badge>;
      case 'adjust':
        return <Badge variant="warning" className="bg-blue-500">系统调整</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  // 加载价格历史
  const loadPriceHistory = async () => {
    setLoadingPriceHistory(true);
    try {
      const params = new URLSearchParams();
      params.set('limit', '100');
      if (priceHistorySearch) {
        params.set('productCode', priceHistorySearch);
      }
      if (priceHistorySupplier && priceHistorySupplier !== 'all') {
        params.set('supplierId', priceHistorySupplier);
      }
      if (priceHistoryDateRange.start) {
        params.set('startDate', priceHistoryDateRange.start);
      }
      if (priceHistoryDateRange.end) {
        params.set('endDate', priceHistoryDateRange.end);
      }
      
      const res = await fetch(`/api/price-history?${params.toString()}`, { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setPriceHistory(data.data || []);
      } else {
        toast.error(data.error || '加载价格历史失败');
        setPriceHistory([]);
      }
    } catch (error) {
      console.error('加载价格历史失败:', error);
      toast.error('加载价格历史失败');
      setPriceHistory([]);
    } finally {
      setLoadingPriceHistory(false);
    }
  };

  const getPriceChangeTypeBadge = (type: string) => {
    switch (type) {
      case 'manual':
        return <Badge variant="secondary">手动调整</Badge>;
      case 'adjust':
        return <Badge variant="warning" className="bg-blue-500">系统调整</Badge>;
      case 'contract':
        return <Badge variant="default">合同价</Badge>;
      case 'market':
        return <Badge variant="outline">市场价</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const getStockLevelBadge = (stock: Stock) => {
    switch (stock.stockLevel) {
      case 'out':
        return <Badge variant="destructive">缺货</Badge>;
      case 'low':
        return <Badge variant="warning" className="bg-orange-500">库存不足</Badge>;
      default:
        return <Badge variant="secondary">正常</Badge>;
    }
  };

  const totalValue = stocks.reduce((sum, s) => sum + (s.quantity || 0) * (s.price || 0), 0);
  const totalQuantity = stocks.reduce((sum, s) => sum + (s.quantity || 0), 0);

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <PageGuard permission="stocks:view" title="无权查看库存" description="当前账号没有查看库存管理的权限。">
    <>
      <div className="space-y-6 px-3 pb-4 sm:px-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-2xl font-bold sm:text-3xl">
            <Warehouse className="h-8 w-8" />
            库存管理
          </h1>
          <p className="text-muted-foreground">
            实时库存查询与尾货预警管理
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={() => { setShowLowStockOnly(!showLowStockOnly); }} className="w-full sm:w-auto">
            <AlertTriangle className={`mr-2 h-4 w-4 ${showLowStockOnly ? 'text-orange-500' : ''}`} />
            {showLowStockOnly ? '显示全部' : '只看预警'}
          </Button>
          <Button variant="outline" onClick={() => { setActiveTab('history'); loadPriceHistory(); }} className="w-full sm:w-auto">
            <TrendingUp className="mr-2 h-4 w-4" />
            价格历史
          </Button>
          <Button variant="outline" onClick={() => {
            try {
              // 生成Excel模板
              const wsData = [
                IMPORT_TEMPLATE.fieldLabels,
                ...IMPORT_TEMPLATE.template.map(row => 
                  IMPORT_TEMPLATE.fields.map(field => row[field as keyof typeof row] || '')
                )
              ];
              const ws = XLSX.utils.aoa_to_sheet(wsData);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, IMPORT_TEMPLATE.title);
              
              // 使用 base64 方式下载
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
              const downloadLink = document.createElement('a');
              downloadLink.href = linkSource;
              downloadLink.download = `${IMPORT_TEMPLATE.title}_导入模板.xlsx`;
              document.body.appendChild(downloadLink);
              downloadLink.click();
              document.body.removeChild(downloadLink);
              
              toast.success('模板下载成功');
            } catch (error) {
              console.error('模板下载失败:', error);
              toast.error('模板下载失败');
            }
          }} className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            模板下载
          </Button>
          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} disabled={!canEditStocks} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            添加库存
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!canEditStocks} className="w-full sm:w-auto">
            <Upload className="mr-2 h-4 w-4" />
            导入库存
          </Button>
        </div>
      </div>

      {/* 隐藏的文件上传input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存总量</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantity}</div>
            <p className="text-xs text-muted-foreground">
              共 {stocks.length} 条记录
            </p>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">缺货</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">{stats.outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">库存不足 (≤2)</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800">{stats.lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">库存总值</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* 预警提示 */}
      {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && !showLowStockOnly && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  尾货预警提醒
                </p>
                <p className="text-sm text-orange-700">
                  当前有 {stats.outOfStockCount} 种商品缺货，{stats.lowStockCount - stats.outOfStockCount} 种商品库存不足（≤2台）。
                  请及时补货，避免撞单。
                </p>
              </div>
              <Button
                variant="outline"
                className="sm:ml-auto"
                onClick={() => setShowLowStockOnly(true)}
              >
                查看预警详情
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选器 */}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称、SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-start lg:w-[200px]">
              <span className={supplierFilter && supplierFilter !== 'all' ? '' : 'text-muted-foreground'}>
                {supplierFilter && supplierFilter !== 'all' 
                  ? suppliers.find(s => s.id === supplierFilter)?.name || '筛选供应商'
                  : '筛选供应商'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[250px] p-0" align="start">
            <div className="flex flex-col">
              <div className="flex items-center border-b px-3">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <input
                  placeholder="搜索供应商..."
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  className="flex h-9 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                <div
                  className={`px-2 py-1.5 text-sm cursor-pointer hover:bg-muted ${
                    supplierFilter === '' || supplierFilter === 'all' ? 'bg-primary/10 text-primary font-medium' : ''
                  }`}
                  onClick={() => {
                    setSupplierFilter('all');
                    setSupplierSearch('');
                  }}
                >
                  全部供应商
                </div>
                {suppliers
                  .filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()))
                  .map((s) => (
                    <div
                      key={s.id}
                      className={`px-2 py-1.5 text-sm cursor-pointer hover:bg-muted ${
                        supplierFilter === s.id ? 'bg-primary/10 text-primary font-medium' : ''
                      }`}
                      onClick={() => {
                        setSupplierFilter(s.id);
                        setSupplierSearch('');
                      }}
                    >
                      {s.name}
                    </div>
                  ))}
                {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).length === 0 && (
                  <div className="px-2 py-4 text-sm text-center text-muted-foreground">
                    没有找到匹配的供应商
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" onClick={loadData} className="w-full lg:w-auto">
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 库存列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品名称</TableHead>
                <TableHead>SKU编码</TableHead>
                <TableHead>供应商</TableHead>
                <TableHead className="text-right">库存</TableHead>
                <TableHead className="text-right">在途</TableHead>
                <TableHead className="text-right">可用</TableHead>
                <TableHead className="text-right">单价</TableHead>
                <TableHead>库存状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStocks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    {stocks.length === 0 ? '暂无库存数据' : '未找到匹配的库存'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredStocks.map((stock) => (
                  <TableRow
                    key={stock.id}
                    className={stock.stockLevel === 'out' ? 'bg-red-50' : stock.stockLevel === 'low' ? 'bg-orange-50' : ''}
                  >
                    <TableCell className="font-medium">{stock.product_name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-1 rounded">{stock.product_code}</code>
                    </TableCell>
                    <TableCell>{stock.supplier_name || '-'}</TableCell>
                    <TableCell className={`text-right font-bold ${
                      stock.stockLevel === 'out' ? 'text-red-600' :
                      stock.stockLevel === 'low' ? 'text-orange-600' : ''
                    }`}>
                      {stock.quantity}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {stock.in_transit || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {stock.available ?? stock.quantity - (stock.in_transit || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      ¥{stock.price?.toFixed(2) || '-'}
                    </TableCell>
                    <TableCell>
                      {getStockLevelBadge(stock)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => loadStockVersions(stock)}
                          title="版本历史"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(stock)}
                          disabled={!canEditStocks}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(stock.id)}
                          disabled={!canEditStocks}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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

      <div className="text-sm text-muted-foreground">
        共 {filteredStocks.length} 条库存记录
        {showLowStockOnly && ` (预警：${stats.lowStockCount} 条)`}
      </div>

      {/* 添加/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStock ? '编辑库存' : '添加库存'}
            </DialogTitle>
            <DialogDescription>
              {editingStock ? '修改库存信息' : '添加新的库存记录'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="supplier">供应商 *</Label>
              <Select
                value={formData.supplier_id || 'none'}
                onValueChange={(value) => {
                  if (value === 'none') {
                    setFormData(prev => ({ ...prev, supplier_id: '', supplier_name: '' }));
                  } else {
                    handleSupplierSelect(value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择供应商" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="product_code">SKU编码 *</Label>
                <Input
                  id="product_code"
                  value={formData.product_code}
                  onChange={(e) => setFormData({ ...formData, product_code: e.target.value })}
                  placeholder="商品SKU"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product_name">商品名称 *</Label>
                <Input
                  id="product_name"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  placeholder="商品名称"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="grid gap-2">
                <Label htmlFor="quantity">库存数量</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="in_transit">在途数量</Label>
                <Input
                  id="in_transit"
                  type="number"
                  value={formData.in_transit}
                  onChange={(e) => setFormData({ ...formData, in_transit: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">单价</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            {formData.quantity <= 2 && formData.quantity > 0 && (
              <div className="flex items-center gap-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span className="text-sm text-orange-800">
                  库存不足预警：当前库存仅剩 {formData.quantity} 台
                </span>
              </div>
            )}
            {formData.quantity === 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm text-red-800">
                  缺货警告：库存为0，请及时补货
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={!canEditStocks || !formData.supplier_id || !formData.product_code || !formData.product_name} className="w-full sm:w-auto">
              {editingStock ? '保存修改' : '添加'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 版本历史对话框 */}
      <Dialog open={isVersionDialogOpen} onOpenChange={setIsVersionDialogOpen}>
        <DialogContent className="flex max-h-[80vh] w-[calc(100vw-1.5rem)] flex-col overflow-hidden sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              库存版本历史
              {selectedStockForVersion && (
                <span className="text-muted-foreground font-normal">
                  - {selectedStockForVersion.product_name} ({selectedStockForVersion.product_code})
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              查看库存变更记录，了解历史调整情况
            </DialogDescription>
          </DialogHeader>
          
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索商品编码..."
                value={versionSearchTerm}
                onChange={(e) => setVersionSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadAllVersions} className="w-full sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto">
            {loadingVersions ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : stockVersions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                暂无版本历史记录
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>商品</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead className="text-right">变更前</TableHead>
                    <TableHead className="text-right">变更后</TableHead>
                    <TableHead className="text-right">变化</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>操作人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockVersions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(version.createdAt).toLocaleString('zh-CN')}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{version.productName || '-'}</div>
                          <div className="text-muted-foreground text-xs">{version.productCode}</div>
                        </div>
                      </TableCell>
                      <TableCell>{version.supplierName || '-'}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {version.beforeQuantity ?? '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {version.afterQuantity}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${
                        version.changeQuantity > 0 ? 'text-green-600' : 
                        version.changeQuantity < 0 ? 'text-red-600' : ''
                      }`}>
                        {version.changeQuantity > 0 ? '+' : ''}{version.changeQuantity}
                      </TableCell>
                      <TableCell>
                        {getChangeTypeBadge(version.changeType)}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">
                        {version.changeReason || '-'}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {version.operator || 'system'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </div>
          
          <div className="text-sm text-muted-foreground mt-2">
            共 {stockVersions.length} 条记录
          </div>
        </DialogContent>
      </Dialog>

      {/* 导入库存对话框 */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => {
        // 如果正在导入中，不允许关闭对话框
        if (importing && !open) return;
        setImportDialogOpen(open);
      }}>
        <DialogContent className="max-h-[80vh] w-[calc(100vw-1.5rem)] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              {importing ? '正在导入库存数据...' : '确认导入库存数据'}
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
                        <TableCell key={field} className={field === 'productName' ? 'max-w-[150px] truncate' : ''}>
                          {row[field] || '-'}
                        </TableCell>
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

          <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setImportDialogOpen(false);
                if (!importing) {
                  setImportingData([]);
                }
              }}
              disabled={importing || !canEditStocks}
              className="w-full sm:w-auto"
            >
              {importing ? '导入中，请稍候...' : '取消'}
            </Button>
            <Button
              onClick={confirmImport}
              disabled={importing || importingData.length === 0 || !canEditStocks}
              className="w-full sm:w-auto"
            >
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  确认导入
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 价格历史标签页 */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                价格历史
              </h2>
              <p className="text-sm text-muted-foreground">
                查看商品价格变更记录
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="outline" onClick={() => setActiveTab('stock')}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                返回库存
              </Button>
              <Button variant="outline" onClick={loadPriceHistory}>
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新
              </Button>
            </div>
          </div>

          {/* 价格历史筛选 */}
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">商品编码</Label>
                  <Input
                    placeholder="搜索商品编码..."
                    value={priceHistorySearch}
                    onChange={(e) => setPriceHistorySearch(e.target.value)}
                    className="h-8 w-full lg:w-[180px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">供应商</Label>
                  <Select value={priceHistorySupplier} onValueChange={setPriceHistorySupplier}>
                    <SelectTrigger className="h-8 w-full lg:w-[180px]">
                      <SelectValue placeholder="全部供应商" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部供应商</SelectItem>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">开始日期</Label>
                  <Input
                    type="date"
                    value={priceHistoryDateRange.start}
                    onChange={(e) => setPriceHistoryDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="h-8 w-full lg:w-[150px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">结束日期</Label>
                  <Input
                    type="date"
                    value={priceHistoryDateRange.end}
                    onChange={(e) => setPriceHistoryDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="h-8 w-full lg:w-[150px]"
                  />
                </div>
                <Button onClick={loadPriceHistory} className="w-full sm:w-auto">查询</Button>
              </div>
            </CardContent>
          </Card>

          {/* 价格历史列表 */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>时间</TableHead>
                    <TableHead>商品</TableHead>
                    <TableHead>供应商</TableHead>
                    <TableHead className="text-right">原价</TableHead>
                    <TableHead className="text-right">新价</TableHead>
                    <TableHead className="text-right">变化</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>原因</TableHead>
                    <TableHead>操作人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingPriceHistory ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-12">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : priceHistory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        暂无价格历史记录
                      </TableCell>
                    </TableRow>
                  ) : (
                    priceHistory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{item.productName || '-'}</div>
                            <div className="text-muted-foreground text-xs">{item.productCode}</div>
                          </div>
                        </TableCell>
                        <TableCell>{item.supplierName || '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.beforePrice !== null ? `¥${item.beforePrice.toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ¥{item.afterPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${
                          item.changePrice > 0 ? 'text-green-600' : 
                          item.changePrice < 0 ? 'text-red-600' : ''
                        }`}>
                          {item.changePrice > 0 ? '+' : ''}{item.changePrice !== 0 ? `¥${item.changePrice.toFixed(2)}` : '0'}
                        </TableCell>
                        <TableCell>
                          {getPriceChangeTypeBadge(item.changeType)}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">
                          {item.changeReason || '-'}
                        </TableCell>
                        <TableCell className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {item.operator || 'system'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
          
          <div className="text-sm text-muted-foreground">
            共 {priceHistory.length} 条记录
          </div>
        </div>
      )}
    </div>
    </>
    </PageGuard>
  );
}
