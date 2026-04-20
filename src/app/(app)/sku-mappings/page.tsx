'use client';

import { useState, useEffect, useRef } from 'react';
import { PageGuard } from '@/components/auth/page-guard';
import { Card, CardContent } from '@/components/ui/card';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { buildUserInfoHeaders, usePermission } from '@/lib/auth';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  RefreshCw,
  Copy,
  Loader2,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';

// Excel导入配置 - 客户商品映射
const CUSTOMER_IMPORT_CONFIG = {
  title: '客户商品映射',
  fields: ['customerCode', 'customerProductName', 'customerSku', 'customerSpec', 'productCode', 'productName', 'priority', 'remark'],
  fieldLabels: ['客户编码', '客户商品名称', '客户商品编码', '客户商品规格', '系统商品编码', '系统商品名称', '映射优先级', '备注'],
  template: [
    { customerCode: 'KH-001', customerProductName: '苏泊尔ZMD绞肉机', customerSku: 'JRD05-U', customerSpec: 'JRD05-U', productCode: 'JRD05-U', productName: '苏泊尔ZMD安心系列绞肉机', priority: '1', remark: '' },
  ],
};

// 客户SKU映射表中文列名映射
const CUSTOMER_SKU_CHINESE_MAPPING: Record<string, string> = {
  '客户名称': 'customerName',
  '客户商品名称/商品规格/客户SKU': 'customerProductName',
  '系统商品编码': 'productCode',
  '价格': 'price',
  '状态': 'status',
};

// 中文列名别名映射（用于匹配Excel表头）
const COLUMN_ALIASES: Record<string, string[]> = {
  'customerName': ['客户名称', '客户'],
  'customerProductName': ['客户商品名称', '客户商品名称/商品规格/客户SKU', '商品名称', '商品规格', '客户SKU', 'SKU', '名称'],
  'customerSpec': ['型号规格', '规格', '规格型号', '商品规格', '产品型号', '型号'],
  'productCode': ['系统商品编码', '商品编码', '编码'],
  'price': ['价格', '单价'],
  'status': ['状态'],
};

// 系统字段配置
const SYSTEM_FIELDS = [
  { key: 'customerName', label: '客户名称', required: true, description: '客户名称，用于匹配客户档案' },
  { key: 'customerProductName', label: '客户商品名称', required: true, description: '客户商品名称/品名' },
  { key: 'customerSpec', label: '型号规格', required: false, description: '客户商品的规格型号' },
  { key: 'productCode', label: '系统商品编码', required: true, description: '系统商品编码' },
  { key: 'price', label: '价格', required: false, description: '客户采购价格' },
  { key: 'status', label: '状态', required: false, description: '启用/禁用状态' },
];

// Excel导入配置 - 供应商商品映射
const SUPPLIER_IMPORT_CONFIG = {
  title: '供应商商品映射',
  fields: ['supplierCode', 'supplierProductName', 'supplierSku', 'supplierSpec', 'productCode', 'productName', 'price', 'remark'],
  fieldLabels: ['供应商编码', '供应商商品名称', '供应商商品编码', '供应商商品规格', '系统商品编码', '系统商品名称', '价格', '备注'],
  template: [
    { supplierCode: 'GYS-001', supplierProductName: '苏泊尔果蔬清洗机', supplierSku: 'GS10', supplierSpec: 'GS10', productCode: 'GS10', productName: '苏泊尔果蔬清洗机', price: '115.00', remark: '' },
  ],
};

interface ProductMapping {
  id: string;
  productId?: string;
  productCode?: string;
  productName?: string;
  customerId?: string;
  customerCode?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  customerSku?: string;
  customerBarcode?: string;
  customerProductName?: string;
  price?: number;
  isActive?: boolean;
  remark?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Customer {
  code: string;
  name: string;
}

interface Supplier {
  id: string;
  code?: string;
  name: string;
  shortName?: string;
}

interface Product {
  code: string;
  name: string;
  sku?: string;
}

interface MappingData {
  success: boolean;
  data?: ProductMapping[];
  error?: string;
}

interface CustomerData {
  success: boolean;
  data?: Customer[];
  error?: string;
}

interface SupplierData {
  success: boolean;
  data?: Supplier[];
  error?: string;
}

interface ProductData {
  success: boolean;
  data?: Product[];
  error?: string;
}

type MappingType = 'customer' | 'supplier';

export default function ProductMappingsPage() {
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState<MappingType>('customer');
  const [mappings, setMappings] = useState<ProductMapping[]>([]);
  const [filteredMappings, setFilteredMappings] = useState<ProductMapping[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<ProductMapping | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  // Excel导入相关状态
  const [excelImportData, setExcelImportData] = useState<Record<string, string>[]>([]);
  const [excelImportDialogOpen, setExcelImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 导入进度状态
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 });
  const [importErrors, setImportErrors] = useState<string[]>([]);
  // 字段映射对话框状态
  const [fieldMappingDialogOpen, setFieldMappingDialogOpen] = useState(false);
  const [excelColumns, setExcelColumns] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({});
  const [mappingSearchTerm, setMappingSearchTerm] = useState<Record<string, string>>({});
  const canEditProducts = hasPermission('products:edit');
  const canDeleteProducts = hasPermission('products:delete');

  // 表单状态
  const [formData, setFormData] = useState({
    partnerCode: '',
    partnerProductName: '',
    partnerSku: '',
    productCode: '',
    price: 0,
    isActive: true,
  });

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 筛选数据
  useEffect(() => {
    let filtered = mappings;

    if (activeTab === 'customer' && customerFilter !== 'all') {
      filtered = filtered.filter(m => m.customerCode === customerFilter);
    }

    if (activeTab === 'supplier' && supplierFilter !== 'all') {
      filtered = filtered.filter(m => m.supplierId === supplierFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (activeTab === 'customer') {
        filtered = filtered.filter(m =>
          m.customerProductName?.toLowerCase().includes(term) ||
          m.customerSku?.toLowerCase().includes(term) ||
          m.productName?.toLowerCase().includes(term) ||
          m.productCode?.toLowerCase().includes(term)
        );
      } else {
        filtered = filtered.filter(m =>
          m.customerProductName?.toLowerCase().includes(term) ||
          m.customerSku?.toLowerCase().includes(term) ||
          m.productName?.toLowerCase().includes(term) ||
          m.productCode?.toLowerCase().includes(term)
        );
      }
    }

    setFilteredMappings(filtered);
  }, [mappings, searchTerm, customerFilter, supplierFilter, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = buildUserInfoHeaders();
      const [mappingsRes, customersRes, suppliersRes, productsRes] = await Promise.all([
        fetch('/api/product-mappings', { headers }),
        fetch('/api/customers', { headers }),
        fetch('/api/suppliers?active=true', { headers }),
        fetch('/api/products', { headers }),
      ]);

      const mappingsData = await mappingsRes.json() as MappingData;
      const customersData = await customersRes.json() as CustomerData;
      const suppliersData = await suppliersRes.json() as SupplierData;
      const productsData = await productsRes.json() as ProductData;

      if (mappingsData.success) {
        setMappings(mappingsData.data || []);
      }
      if (customersData.success) {
        setCustomers((customersData.data || []).filter((c): c is Customer => c.code !== undefined && c.name !== undefined));
      }
      if (suppliersData.success) {
        setSuppliers((suppliersData.data || []).filter((s): s is Supplier => s.id !== undefined && s.name !== undefined));
      }
      if (productsData.success) {
        setProducts((productsData.data || []).filter((p): p is Product => p.code !== undefined && p.name !== undefined));
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取当前Tab的过滤值
  const getPartnerFilter = activeTab === 'customer' ? customerFilter : supplierFilter;
  const setPartnerFilter = activeTab === 'customer' ? setCustomerFilter : setSupplierFilter;
  const getPartnerOptions = activeTab === 'customer' 
    ? customers.map(c => ({ value: c.code, label: c.name }))
    : suppliers.map(s => ({ value: s.id, label: s.name }));
  const getPartnerName = (code: string) => {
    if (activeTab === 'customer') {
      return customers.find(c => c.code === code)?.name || code;
    }
    return suppliers.find(s => s.id === code)?.name || code;
  };

  const handleSubmit = async () => {
    if (!canEditProducts) {
      toast.error('当前账号没有编辑 SKU 映射的权限');
      return;
    }

    try {
      const url = editingMapping
        ? `/api/product-mappings/${editingMapping.id}`
        : '/api/product-mappings';
      const method = editingMapping ? 'PUT' : 'POST';

      const mappingData: Record<string, unknown> = {
        productCode: formData.productCode,
        isActive: formData.isActive,
      };

      if (activeTab === 'customer') {
        mappingData.customerCode = formData.partnerCode;
        mappingData.customerProductName = formData.partnerProductName;
        mappingData.customerSku = formData.partnerSku;
      } else {
        mappingData.supplierId = formData.partnerCode;
        mappingData.supplierName = getPartnerName(formData.partnerCode);
        mappingData.customerProductName = formData.partnerProductName;
        mappingData.customerSku = formData.partnerSku;
      }

      if (formData.price > 0) {
        mappingData.price = formData.price;
      }

      const res = await fetch(url, {
        method,
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappingData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingMapping ? '更新成功' : '创建成功');
        setIsDialogOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error(data.error || '操作失败');
      }
    } catch (err) {
      console.error('操作失败:', err);
      toast.error('操作失败');
    }
  };

  const handleEdit = (mapping: ProductMapping) => {
    setEditingMapping(mapping);
    if (activeTab === 'customer') {
      setFormData({
        partnerCode: mapping.customerCode || '',
        partnerProductName: mapping.customerProductName || '',
        partnerSku: mapping.customerSku || '',
        productCode: mapping.productCode || '',
        price: mapping.price || 0,
        isActive: mapping.isActive ?? true,
      });
    } else {
      setFormData({
        partnerCode: mapping.supplierId || '',
        partnerProductName: mapping.customerProductName || '',
        partnerSku: mapping.customerSku || '',
        productCode: mapping.productCode || '',
        price: mapping.price || 0,
        isActive: mapping.isActive ?? true,
      });
    }
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!canDeleteProducts) {
      toast.error('当前账号没有删除 SKU 映射的权限');
      return;
    }

    if (!confirm('确定要删除这条映射吗？')) return;

    try {
      const res = await fetch(`/api/product-mappings/${id}`, {
        method: 'DELETE',
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('删除成功');
        loadData();
      } else {
        toast.error(data.error || '删除失败');
      }
    } catch (err) {
      console.error('删除失败:', err);
      toast.error('删除失败');
    }
  };

  const handleToggleActive = async (mapping: ProductMapping) => {
    if (!canEditProducts) {
      toast.error('当前账号没有编辑 SKU 映射的权限');
      return;
    }

    try {
      const res = await fetch(`/api/product-mappings/${mapping.id}`, {
        method: 'PUT',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !mapping.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('状态更新成功');
        loadData();
      }
    } catch (err) {
      console.error('更新失败:', err);
      toast.error('更新失败');
    }
  };

  const resetForm = () => {
    setEditingMapping(null);
    setFormData({
      partnerCode: '',
      partnerProductName: '',
      partnerSku: '',
      productCode: '',
      price: 0,
      isActive: true,
    });
    setSelectedCustomer('');
    setSelectedSupplier('');
  };

  const handleProductSelect = (productCode: string) => {
    setFormData(prev => ({
      ...prev,
      productCode,
    }));
  };

  const handleImport = async () => {
    if (!canEditProducts) {
      toast.error('当前账号没有导入 SKU 映射的权限');
      return;
    }

    const partnerCode = activeTab === 'customer' ? selectedCustomer : selectedSupplier;
    if (!partnerCode || !importText.trim()) {
      toast.error('请选择' + (activeTab === 'customer' ? '客户' : '供应商') + '并输入映射数据');
      return;
    }

    try {
      // 解析导入文本（格式：供应商商品名称,SKU,系统商品编码,价格）
      const lines = importText.trim().split('\n');
      const mappings = lines
        .map(line => {
          const parts = line.split(',').map(p => p.trim());
          if (parts.length >= 3) {
            const mapping: Record<string, unknown> = {
              customerProductName: parts[0],
              customerSku: parts[1] || '',
              productCode: parts[2],
              price: parseFloat(parts[3]) || 0,
              isActive: true,
            };
            
            if (activeTab === 'customer') {
              mapping.customerCode = partnerCode;
            } else {
              mapping.supplierId = partnerCode;
              mapping.supplierName = getPartnerName(partnerCode);
            }
            
            return mapping;
          }
          return null;
        })
        .filter(Boolean);

      if (mappings.length === 0) {
        toast.error('未解析到有效的映射数据');
        return;
      }

      // 批量创建
      const res = await fetch('/api/product-mappings/batch', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mappings }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`成功导入 ${mappings.length} 条映射`);
        setIsImportDialogOpen(false);
        setImportText('');
        setSelectedCustomer('');
        setSelectedSupplier('');
        loadData();
      } else {
        toast.error(data.error || '导入失败');
      }
    } catch (err) {
      console.error('导入失败:', err);
      toast.error('导入失败');
    }
  };

  const handleExport = () => {
    const partnerLabel = activeTab === 'customer' ? '客户' : '供应商';
    const headers = [partnerLabel + '商品名称', partnerLabel + 'SKU', '系统商品编码', '商品名称', '价格', '状态'];
    const rows = filteredMappings.map(m => [
      m.customerProductName || '',
      m.customerSku || '',
      m.productCode || '',
      m.productName || '',
      m.price || 0,
      m.isActive ? '启用' : '禁用',
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (activeTab === 'customer' ? '客户' : '供应商') + `SKU映射_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  };

  // 下载Excel模板
  const downloadTemplate = () => {
    try {
      const config = activeTab === 'customer' ? CUSTOMER_IMPORT_CONFIG : SUPPLIER_IMPORT_CONFIG;
      const wsData = [
        config.fieldLabels,
        ...config.template.map(row => 
          config.fields.map(field => row[field as keyof typeof row] || '')
        )
      ];
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.title);
      
      // 使用 base64 方式下载
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
      const linkSource = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;
      const downloadLink = document.createElement('a');
      downloadLink.href = linkSource;
      downloadLink.download = `${config.title}_导入模板.xlsx`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      toast.success('模板下载成功');
    } catch (error) {
      console.error('模板下载失败:', error);
      toast.error('模板下载失败');
    }
  };

  // 获取字段值 - 支持中英文列名
  const getFieldValue = (row: Record<string, string>, fieldName: string): string => {
    // 先检查英文字段名
    if (row[fieldName] !== undefined && row[fieldName] !== null && row[fieldName] !== '') {
      return row[fieldName];
    }
    // 检查列名别名
    const aliases = COLUMN_ALIASES[fieldName];
    if (aliases) {
      for (const alias of aliases) {
        if (row[alias] !== undefined && row[alias] !== null && row[alias] !== '') {
          return row[alias];
        }
      }
    }
    // 检查中文映射
    for (const [chineseName, mappedField] of Object.entries(CUSTOMER_SKU_CHINESE_MAPPING)) {
      if (mappedField === fieldName && row[chineseName] !== undefined) {
        return row[chineseName];
      }
    }
    return '';
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
        
        // 提取Excel列名
        const columns = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
        setExcelColumns(columns);
        
        // 自动匹配字段映射
        const autoMappings: Record<string, string> = {};
        for (const field of SYSTEM_FIELDS) {
          const aliases = COLUMN_ALIASES[field.key] || [];
          for (const col of columns) {
            const colLower = col.trim().toLowerCase();
            // 检查是否完全匹配
            if (aliases.some(a => a.toLowerCase() === colLower) || colLower === field.key.toLowerCase()) {
              autoMappings[field.key] = col;
              break;
            }
          }
        }
        setFieldMappings(autoMappings);
        setMappingSearchTerm({});
        
        setExcelImportData(jsonData);
        setFieldMappingDialogOpen(true);
        toast.success(`已读取 ${jsonData.length} 条数据，发现 ${columns.length} 列`);
      } catch (err) {
        toast.error('文件解析失败，请检查文件格式');
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  // 确认字段映射并继续导入
  const confirmFieldMapping = () => {
    // 验证必填字段是否已映射
    const requiredFields = SYSTEM_FIELDS.filter(f => f.required);
    const missingFields = requiredFields.filter(f => !fieldMappings[f.key]);
    
    if (missingFields.length > 0) {
      toast.error(`请先完成必填字段映射：${missingFields.map(f => f.label).join('、')}`);
      return;
    }
    
    // 关闭字段映射对话框，打开确认对话框
    setFieldMappingDialogOpen(false);
    setExcelImportDialogOpen(true);
  };

  // 确认Excel导入
  const confirmExcelImport = async () => {
    if (!canEditProducts) {
      toast.error('当前账号没有导入 SKU 映射的权限');
      return;
    }

    if (excelImportData.length === 0) {
      toast.error('请先上传Excel文件');
      return;
    }
    
    setImporting(true);
    setImportProgress({ current: 0, total: excelImportData.length, success: 0, failed: 0 });
    setImportErrors([]);
    
    try {
      // 构建客户名称到编码的映射
      const customerNameToCode: Record<string, string> = {};
      customers.forEach(c => {
        customerNameToCode[c.name] = c.code;
      });
      
      // 构建客户编码到名称的映射（用于显示）
      const customerCodeToName: Record<string, string> = {};
      customers.forEach(c => {
        customerCodeToName[c.code] = c.name;
      });
      
      // 分析Excel数据：是否包含客户名称列
      const sampleRow = excelImportData[0];
      const hasCustomerNameColumn = fieldMappings.customerName || getFieldValue(sampleRow, 'customerName') !== '' || 
        sampleRow['客户名称'] !== undefined;
      
      if (!hasCustomerNameColumn && activeTab === 'customer') {
        // 如果没有客户名称列，需要选择一个客户
        const partnerCode = activeTab === 'customer' ? selectedCustomer : selectedSupplier;
        if (!partnerCode) {
          toast.error('请先选择' + (activeTab === 'customer' ? '客户' : '供应商'));
          setImporting(false);
          return;
        }
      }
      
      // 解析所有Excel数据为映射对象
      const mappings: Record<string, unknown>[] = [];
      const errors: string[] = [];
      
  // 使用字段映射获取Excel值
  const getMappedValue = (row: Record<string, string>, fieldKey: string): string => {
    const mappedColumn = fieldMappings[fieldKey];
    if (mappedColumn && row[mappedColumn] !== undefined) {
      return row[mappedColumn];
    }
    return getFieldValue(row, fieldKey);
  };
      
      for (let i = 0; i < excelImportData.length; i++) {
        const row = excelImportData[i];
        
        // 获取客户名称和系统商品编码（使用自定义映射）
        const customerName = getMappedValue(row, 'customerName');
        const customerProductName = getMappedValue(row, 'customerProductName');
        const customerSpec = getMappedValue(row, 'customerSpec');
        const productCode = getMappedValue(row, 'productCode');
        const priceStr = getMappedValue(row, 'price');
        const price = priceStr ? parseFloat(priceStr) : 0;
        
        if (!customerProductName && !productCode) {
          errors.push(`第 ${i + 2} 行：缺少客户商品名称和系统商品编码`);
          continue;
        }
        
        let customerCode = '';
        let partnerCode = activeTab === 'customer' ? selectedCustomer : selectedSupplier;
        
        if (activeTab === 'customer') {
          if (hasCustomerNameColumn && customerName) {
            // 根据客户名称查找客户编码
            customerCode = customerNameToCode[customerName];
            if (!customerCode) {
              errors.push(`第 ${i + 2} 行：客户 "${customerName}" 不存在，将跳过`);
              continue;
            }
            partnerCode = customerCode;
          }
        }
        
        mappings.push({
          customerProductName: customerProductName || productCode || '',
          customerSku: customerProductName, // 客户商品名称也作为SKU
          customerSpec: customerSpec,
          productCode: productCode || '',
          price: price,
          isActive: true,
          ...(activeTab === 'customer' 
            ? { 
                customerCode: customerCode || partnerCode || '',
                customerName: customerName || customerCodeToName[customerCode || partnerCode || ''] || '',
              }
            : { 
                supplierId: partnerCode, 
                supplierName: getPartnerName(partnerCode || ''),
                customerCode: '',
                customerName: '',
              }
          ),
        });
        
        setImportProgress(prev => ({ ...prev, current: i + 1 }));
      }
      
      setImportErrors(errors);
      
      if (mappings.length === 0) {
        toast.error('未解析到有效的映射数据');
        setImporting(false);
        return;
      }
      
      // 分批导入，每批100条
      const batchSize = 100;
      let totalSuccess = 0;
      
      for (let i = 0; i < mappings.length; i += batchSize) {
        const batch = mappings.slice(i, i + batchSize);
        
        const res = await fetch('/api/product-mappings/batch', {
          method: 'POST',
          headers: {
            ...buildUserInfoHeaders(),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ mappings: batch }),
        });

        const result = await res.json();
        if (result.success) {
          totalSuccess += batch.length;
        }
        
        setImportProgress(prev => ({ ...prev, success: totalSuccess }));
      }
      
      toast.success(`成功导入 ${totalSuccess} 条映射`);
      if (errors.length > 0) {
        toast.warning(`${errors.length} 条数据因客户不存在或其他原因被跳过`);
      }
      
      setExcelImportDialogOpen(false);
      setExcelImportData([]);
      setSelectedCustomer('');
      setSelectedSupplier('');
      loadData();
    } catch (err) {
      toast.error('导入失败');
    } finally {
      setImporting(false);
    }
  };

  const copyMappingCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('已复制到剪贴板');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const partnerLabel = activeTab === 'customer' ? '客户' : '供应商';

  return (
    <PageGuard permission="products:view" title="无权查看 SKU 映射" description="当前账号没有查看 SKU 映射管理的权限。">
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold sm:text-3xl">SKU映射管理</h1>
            <p className="text-muted-foreground">管理客户/供应商商品与系统商品的映射关系</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {/* 隐藏的文件输入 */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            <Button variant="outline" onClick={downloadTemplate} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              模板下载
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={!canEditProducts} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              Excel导入
            </Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)} disabled={!canEditProducts} className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" />
              批量导入
            </Button>
            <Button variant="outline" onClick={handleExport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" />
              导出
            </Button>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} disabled={!canEditProducts} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              添加映射
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as MappingType)}>
          <TabsList className="grid w-full grid-cols-2 sm:inline-flex sm:w-auto">
            <TabsTrigger value="customer">客户商品映射</TabsTrigger>
            <TabsTrigger value="supplier">供应商商品映射</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'customer' ? "搜索客户商品名称、SKU..." : "搜索供应商商品名称、SKU..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={getPartnerFilter || 'all'} onValueChange={(v) => setPartnerFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="w-full lg:w-[200px]">
              <SelectValue placeholder={activeTab === 'customer' ? "筛选客户" : "筛选供应商"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{activeTab === 'customer' ? '全部客户' : '全部供应商'}</SelectItem>
              {getPartnerOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{partnerLabel}</TableHead>
                  <TableHead>{partnerLabel}商品名称</TableHead>
                  <TableHead>{partnerLabel}SKU</TableHead>
                  <TableHead>系统商品</TableHead>
                  <TableHead>系统商品编码</TableHead>
                  <TableHead className="text-right">价格</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMappings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      {mappings.length === 0 ? '暂无映射数据' : '未找到匹配的映射'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMappings.map((mapping) => (
                    <TableRow key={mapping.id} className={!mapping.isActive ? 'opacity-50' : ''}>
                      <TableCell>
                        <Badge variant="outline">
                          {activeTab === 'customer' 
                            ? (customers.find(c => c.code === mapping.customerCode)?.name || mapping.customerCode || '-')
                            : (suppliers.find(s => s.id === mapping.supplierId)?.name || mapping.supplierName || '-')
                          }
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{mapping.customerProductName || '-'}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 rounded">
                          {mapping.customerSku || '-'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span>{mapping.productName || '-'}</span>
                          {mapping.productCode && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyMappingCode(mapping.productCode || '')}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-1 rounded">
                          {mapping.productCode || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">
                        {mapping.price && mapping.price > 0 ? `￥${mapping.price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={mapping.isActive ?? true}
                          disabled={!canEditProducts}
                          onCheckedChange={() => handleToggleActive(mapping)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canEditProducts}
                            onClick={() => handleEdit(mapping)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={!canDeleteProducts}
                            onClick={() => handleDelete(mapping.id)}
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
          共 {filteredMappings.length} 条映射
        </div>

        {/* 添加/编辑对话框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingMapping ? '编辑SKU映射' : '添加SKU映射'}
              </DialogTitle>
              <DialogDescription>
                {activeTab === 'customer' ? '配置客户商品与系统商品的映射关系' : '配置供应商商品与系统商品的映射关系'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="partner">{partnerLabel} *</Label>
                <Select
                  value={formData.partnerCode || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, partnerCode: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={'选择' + partnerLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {getPartnerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_product_name">{partnerLabel}商品名称 *</Label>
                <Input
                  id="partner_product_name"
                  value={formData.partnerProductName}
                  onChange={(e) => setFormData({ ...formData, partnerProductName: e.target.value })}
                  placeholder={activeTab === 'customer' ? '输入客户商品名称' : '输入供应商商品名称'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="partner_sku">{partnerLabel}SKU</Label>
                <Input
                  id="partner_sku"
                  value={formData.partnerSku}
                  onChange={(e) => setFormData({ ...formData, partnerSku: e.target.value })}
                  placeholder={'输入' + partnerLabel + 'SKU编码'}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product_code">系统商品 *</Label>
                <Select
                  value={formData.productCode || 'none'}
                  onValueChange={(value) => {
                    if (value === 'none') {
                      setFormData(prev => ({ ...prev, productCode: '' }));
                    } else {
                      handleProductSelect(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择系统商品" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name} ({p.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">价格</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  placeholder="输入价格"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="is_active">启用映射</Label>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                取消
              </Button>
              <Button onClick={handleSubmit} disabled={!canEditProducts || !formData.partnerCode || !formData.partnerProductName || !formData.productCode} className="w-full sm:w-auto">
                {editingMapping ? '保存修改' : '创建映射'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 批量导入对话框 */}
        <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
          <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>批量导入SKU映射</DialogTitle>
              <DialogDescription>
                {activeTab === 'customer' ? '每行一条映射，格式：客户商品名称,SKU,系统商品编码,价格' : '每行一条映射，格式：供应商商品名称,SKU,系统商品编码,价格'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="import_partner">{'导入到' + partnerLabel} *</Label>
                <Select value={(activeTab === 'customer' ? selectedCustomer : selectedSupplier) || 'none'} onValueChange={(v) => {
                  if (activeTab === 'customer') {
                    setSelectedCustomer(v === 'none' ? '' : v);
                  } else {
                    setSelectedSupplier(v === 'none' ? '' : v);
                  }
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder={'选择' + partnerLabel} />
                  </SelectTrigger>
                  <SelectContent>
                    {getPartnerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="import_text">映射数据 *</Label>
                <Textarea
                  id="import_text"
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={activeTab === 'customer' 
                    ? `客户商品1,SKU001,PROD001,99
客户商品2,SKU002,PROD002,199`
                    : `供应商商品1,SKU001,PROD001,99
供应商商品2,SKU002,PROD002,199`
                  }
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>导入格式说明：</p>
                <ul className="list-disc list-inside mt-1">
                  <li>每行一条映射记录</li>
                  <li>字段用英文逗号分隔</li>
                  <li>格式：{partnerLabel}商品名称,SKU,{partnerLabel === '客户' ? '客户' : '供应商'}系统商品编码,价格</li>
                  <li>价格可为空，默认为0</li>
                </ul>
              </div>
            </div>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="w-full sm:w-auto">
                取消
              </Button>
              <Button onClick={handleImport} disabled={!canEditProducts} className="w-full sm:w-auto">
                开始导入
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 字段映射对话框 */}
        <Dialog open={fieldMappingDialogOpen} onOpenChange={(open) => {
          if (!open) {
            setFieldMappingDialogOpen(false);
            setExcelImportData([]);
            setFieldMappings({});
            setMappingSearchTerm({});
          }
        }}>
          <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[900px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>字段映射配置</DialogTitle>
              <DialogDescription>
                请将Excel列与系统字段进行映射匹配。系统会自动识别部分列，您也可以手动调整映射关系。
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Excel列名提示 */}
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Excel文件包含以下 {excelColumns.length} 列：</p>
                <div className="flex flex-wrap gap-2">
                  {excelColumns.map((col, idx) => (
                    <Badge key={idx} variant="outline" className="font-mono text-xs">
                      {col}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 字段映射表格 */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">系统字段</TableHead>
                      <TableHead className="w-[100px]">必填</TableHead>
                      <TableHead>Excel列映射</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {SYSTEM_FIELDS.map((field) => {
                      const searchTerm = mappingSearchTerm[field.key] || '';
                      const filteredColumns = excelColumns.filter(col => 
                        col.toLowerCase().includes(searchTerm.toLowerCase())
                      );
                      
                      return (
                        <TableRow key={field.key}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{field.label}</p>
                              <p className="text-xs text-muted-foreground">{field.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {field.required ? (
                              <Badge variant="destructive" className="text-xs">必填</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">选填</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  className="w-full justify-between font-normal"
                                  disabled={importing}
                                >
                                  {fieldMappings[field.key] || (
                                    <span className="text-muted-foreground">选择Excel列...</span>
                                  )}
                                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[300px] p-0" align="start">
                                <div className="p-2">
                                  <Input
                                    placeholder="搜索列名..."
                                    value={searchTerm}
                                    onChange={(e) => setMappingSearchTerm(prev => ({ ...prev, [field.key]: e.target.value }))}
                                    className="h-8 mb-2"
                                  />
                                </div>
                                <Command>
                                  <CommandGroup>
                                    <CommandItem
                                      onSelect={() => {
                                        setFieldMappings(prev => {
                                          const next = { ...prev };
                                          delete next[field.key];
                                          return next;
                                        });
                                        setMappingSearchTerm(prev => ({ ...prev, [field.key]: '' }));
                                      }}
                                      className="text-muted-foreground"
                                    >
                                      <X className="mr-2 h-4 w-4" />
                                      不映射此字段
                                    </CommandItem>
                                    {filteredColumns.map((col) => (
                                      <CommandItem
                                        key={col}
                                        value={col}
                                        onSelect={() => {
                                          setFieldMappings(prev => ({ ...prev, [field.key]: col }));
                                          setMappingSearchTerm(prev => ({ ...prev, [field.key]: '' }));
                                        }}
                                      >
                                        <Check
                                          className={`mr-2 h-4 w-4 ${
                                            fieldMappings[field.key] === col ? "opacity-100" : "opacity-0"
                                          }`}
                                        />
                                        {col}
                                      </CommandItem>
                                    ))}
                                    {filteredColumns.length === 0 && (
                                      <CommandEmpty>未找到匹配的列</CommandEmpty>
                                    )}
                                  </CommandGroup>
                                </Command>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 映射统计 */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>已映射: {Object.keys(fieldMappings).filter(k => fieldMappings[k]).length} / {SYSTEM_FIELDS.length}</span>
                <span>|</span>
                <span>必填项: {SYSTEM_FIELDS.filter(f => f.required && fieldMappings[f.key]).length} / {SYSTEM_FIELDS.filter(f => f.required).length}</span>
              </div>
            </div>

            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => {
                setFieldMappingDialogOpen(false);
                setExcelImportData([]);
                setFieldMappings({});
                setMappingSearchTerm({});
              }} disabled={importing} className="w-full sm:w-auto">
                取消
              </Button>
              <Button onClick={confirmFieldMapping} disabled={importing || !canEditProducts} className="w-full sm:w-auto">
                <Check className="mr-2 h-4 w-4" />
                确认映射并继续
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Excel导入确认对话框 */}
        <Dialog open={excelImportDialogOpen} onOpenChange={setExcelImportDialogOpen}>
          <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{'确认Excel导入SKU映射'}</DialogTitle>
              <DialogDescription>
                已读取 {excelImportData.length} 条数据，请确认信息正确后继续导入
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* 客户名称匹配说明 */}
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium">导入说明：</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-muted-foreground">
                  <li>系统将根据 Excel 中的 &quot;客户名称&quot; 列自动匹配客户档案</li>
                  <li>如果客户名称在系统中不存在，该行数据将被跳过</li>
                  <li>客户商品名称和系统商品编码为必填项</li>
                </ul>
              </div>
              
              {/* 预览表格 */}
              <div className="overflow-x-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">客户名称</TableHead>
                      <TableHead>客户商品名称</TableHead>
                      <TableHead className="w-[120px]">系统商品编码</TableHead>
                      <TableHead className="w-[80px]">价格</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {excelImportData.slice(0, 10).map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{getFieldValue(row, 'customerName') || '-'}</TableCell>
                        <TableCell>{getFieldValue(row, 'customerProductName') || '-'}</TableCell>
                        <TableCell><code className="text-sm bg-muted px-1 rounded">{getFieldValue(row, 'productCode') || '-'}</code></TableCell>
                        <TableCell className="text-right">{getFieldValue(row, 'price') || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {excelImportData.length > 10 && (
                  <p className="text-sm text-muted-foreground mt-2">共读取 {excelImportData.length} 条数据，此处显示前10条</p>
                )}
              </div>
              
              {/* 导入进度 */}
              {importing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>导入进度：{importProgress.current} / {importProgress.total}</span>
                    <span className="text-green-600">成功: {importProgress.success}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              
              {/* 错误提示 */}
              {importErrors.length > 0 && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm max-h-[100px] overflow-y-auto">
                  <p className="font-medium mb-1">以下数据将被跳过：</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {importErrors.slice(0, 5).map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                    {importErrors.length > 5 && (
                      <li>...还有 {importErrors.length - 5} 条</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => setExcelImportDialogOpen(false)} disabled={importing} className="w-full sm:w-auto">取消</Button>
              <Button onClick={confirmExcelImport} disabled={importing || !canEditProducts} className="w-full sm:w-auto">
                {importing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    导入中 {Math.round((importProgress.current / importProgress.total) * 100)}%
                  </>
                ) : '确认导入'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageGuard>
  );
}
