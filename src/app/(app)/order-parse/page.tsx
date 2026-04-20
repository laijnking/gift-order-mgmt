'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders } from '@/lib/auth';
import { getColumnMappingDiagnostics } from '@/lib/column-mapping-diagnostics';
import { flattenBundleDraftsToFlatOrders } from '@/lib/order-parse-bundles';
import { findUserByIdOrName, getUserDisplayName, isOperatorAssignableRole, isSalesAssignableRole } from '@/lib/roles';
import type { ParsedOrderBundleDraft, ParsedOrderDraft } from '@/types/order-parse';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Sparkles,
  Upload,
  FileText,
  RefreshCw,
  Check,
  X,
  Trash2,
  Copy,
  Send,
  Loader2,
  Package,
  User,
  Phone,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Type,
  Store,
  Save,
  History,
  Clock,
  Star,
  Eye,
  Search,
  AlertTriangle,
  Building2,
  BarChart3,
} from 'lucide-react';

// 字段选项定义
const COLUMN_OPTIONS = [
  { value: 'ignore', label: '忽略' },
  { value: 'ext_keep', label: '保留（不处理）', group: '其他' },
  { value: 'bill_no', label: '单据编号', group: '基础信息' },
  { value: 'bill_date', label: '单据日期', group: '基础信息' },
  { value: 'order_no', label: '客户订单号', group: '基础信息' },
  { value: 'customer_order_no', label: '客户单据编号', group: '基础信息' },
  { value: 'supplier_order_no', label: '供应商单据号', group: '基础信息' },
  { value: 'customer_code', label: '客户代码', group: '基础信息' },
  { value: 'customer_name', label: '客户名称', group: '基础信息' },
  { value: 'supplier_name', label: '发货供应商', group: '基础信息' },
  { value: 'salesperson', label: '业务员', group: '人员信息' },
  { value: 'operator', label: '跟单员', group: '人员信息' },
  { value: 'product_name', label: '商品名称', group: '商品信息' },
  { value: 'customer_product_name', label: '客户商品名称', group: '商品信息' },
  { value: 'product_code', label: '商品编码', group: '商品信息' },
  { value: 'product_spec', label: '规格型号', group: '商品信息' },
  { value: 'customer_product_spec', label: '客户规格型号(旧)', group: '商品信息(废弃)' },
  { value: 'quantity', label: '数量', group: '商品信息' },
  { value: 'price', label: '单价', group: '商品信息' },
  { value: 'amount', label: '价税合计', group: '商品信息' },
  { value: 'discount', label: '单台折让', group: '商品信息' },
  { value: 'tax_rate', label: '增值税税率', group: '商品信息' },
  { value: 'warehouse', label: '仓库', group: '商品信息' },
  { value: 'remark', label: '备注', group: '商品信息' },
  { value: 'receiver_name', label: '收货人', group: '收货信息' },
  { value: 'receiver_phone', label: '收货电话', group: '收货信息' },
  { value: 'receiver_address', label: '收货地址', group: '收货信息' },
  { value: 'express_company', label: '快递公司', group: '快递信息' },
  { value: 'tracking_no', label: '物流单号', group: '快递信息' },
  { value: 'invoice_required', label: '需要开票', group: '发票信息' },
  { value: 'income_name', label: '收入名称', group: '发票信息' },
  { value: 'income_amount', label: '应收金额', group: '发票信息' },
  ...Array.from({ length: 20 }, (_, i) => ({
    value: `ext_field_${i + 1}`,
    label: `备用字段${i + 1}`,
    group: '扩展字段',
  })),
];

// 按分组组织字段选项
const GROUPED_OPTIONS = COLUMN_OPTIONS.reduce((acc, opt) => {
  const group = opt.group || '其他';
  if (!acc[group]) acc[group] = [];
  acc[group].push(opt);
  return acc;
}, {} as Record<string, typeof COLUMN_OPTIONS>);

// 常用字段（置顶显示）
const COMMON_FIELDS = [
  'ignore',                      // 忽略
  'customer_order_no',           // 客户单据编号
  'customer_product_name',       // 客户商品名称
  'customer_product_spec',       // 客户规格型号
  'quantity',                    // 数量
  'price',                       // 单价
  'supplier_name',               // 发货供应商
  'receiver_name',               // 收货人
  'receiver_phone',              // 收货电话
  'receiver_address',            // 收货地址
  'express_company',             // 快递公司
  'tracking_no',                 // 物流单号
];

interface Customer {
  code: string;
  name: string;
  salesUserId?: string;
  salesUserName?: string;
  operatorUserId?: string;
  operatorUserName?: string;
}

interface UserInfo {
  id: string;
  username: string;
  realName?: string;
  name?: string;
  role: string;
}

interface Supplier {
  id: string;
  name: string;
  type: string;
  province?: string;
}

type ParsedOrder = ParsedOrderDraft & {
  id: string;
  selected?: boolean;
  expanded?: boolean;
};

type ParsedOrderDetail = ParsedOrderBundleDraft & {
  billNo?: string;
  customerOrderNo?: string;
  supplierOrderNo?: string;
  customer_code?: string;
  customer_name?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  express_company?: string;
  tracking_no?: string;
  selected?: boolean;
  expanded?: boolean;
};

interface MappingHistory {
  id: string;
  version: number;
  header_row: number;
  is_active: boolean;
  created_at: string;
  created_by?: string;
  remark?: string;
  header_fingerprint?: string;
  template_signature?: string;
  source_headers?: string[];
}

interface SubmitValidationSummary {
  invalidOrderIds: string[];
  missingProductNameCount: number;
  missingReceiverCount: number;
  missingPhoneCount: number;
  missingAddressCount: number;
  missingSupplierCount: number;
}

interface DuplicateSummary {
  totalSkipped: number;
  batchDuplicateCount: number;
  existingDuplicateCount: number;
  details: Array<{
    orderNo: string;
    receiverName: string;
    reason: 'batch_duplicate' | 'existing_order';
    existingSysOrderNo?: string;
  }>;
}

interface MatchStatsSummary {
  total: number;
  bySpec: number;
  byName: number;
  byMapping: number;
  none: number;
  matched: number;
  matchRate: string;
}

function normalizeBundleDraftsForPage(
  bundles: Array<Record<string, unknown>>
): ParsedOrderDetail[] {
  return bundles.map((bundle, index) => ({
    ...bundle,
    id: String(bundle.id || `parsed_${Date.now()}_${index}`),
    orderNo: String(bundle.orderNo || ''),
    billDate: String(bundle.billDate || ''),
    receiverName: String(bundle.receiverName || ''),
    receiverPhone: String(bundle.receiverPhone || ''),
    receiverAddress: String(bundle.receiverAddress || ''),
    province: String(bundle.province || ''),
    city: String(bundle.city || ''),
    district: String(bundle.district || ''),
    expressCompany: String(bundle.expressCompany || ''),
    trackingNo: String(bundle.trackingNo || ''),
    remark: String(bundle.remark || ''),
    items: Array.isArray(bundle.items) ? bundle.items : [],
    selected: true,
    expanded: true,
  }));
}

function buildFlatOrdersForPage(
  bundles: ParsedOrderBundleDraft[],
  customerCode: string,
  idPrefix: string
): ParsedOrder[] {
  return flattenBundleDraftsToFlatOrders(bundles, customerCode).map((order, index) => ({
    ...order,
    id: order.id || `${idPrefix}_${Date.now()}_${index}`,
    selected: true,
    expanded: true,
  }));
}

function getSubmitValidationSummary(orders: ParsedOrder[]): SubmitValidationSummary {
  const selectedOrders = orders.filter((order) => order.selected);

  return selectedOrders.reduce<SubmitValidationSummary>(
    (summary, order) => {
      const missingProductName = !order.product_name?.trim();
      const missingReceiver = !order.receiver_name?.trim();
      const missingPhone = !order.receiver_phone?.trim();
      const missingAddress = !order.receiver_address?.trim();
      const missingSupplier = !order.supplierId?.trim();

      if (
        missingProductName ||
        missingReceiver ||
        missingPhone ||
        missingAddress ||
        missingSupplier
      ) {
        summary.invalidOrderIds.push(order.id);
      }

      if (missingProductName) summary.missingProductNameCount += 1;
      if (missingReceiver) summary.missingReceiverCount += 1;
      if (missingPhone) summary.missingPhoneCount += 1;
      if (missingAddress) summary.missingAddressCount += 1;
      if (missingSupplier) summary.missingSupplierCount += 1;

      return summary;
    },
    {
      invalidOrderIds: [],
      missingProductNameCount: 0,
      missingReceiverCount: 0,
      missingPhoneCount: 0,
      missingAddressCount: 0,
      missingSupplierCount: 0,
    }
  );
}

export default function OrderParsePage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [salespersonId, setSalespersonId] = useState<string>('');
  const [operatorId, setOperatorId] = useState<string>('');
  const [salespersonName, setSalespersonName] = useState<string>('');
  const [operatorName, setOperatorName] = useState<string>('');
  const [inputMode, setInputMode] = useState<'text' | 'excel'>('excel');
  const [inputText, setInputText] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelPreview, setExcelPreview] = useState<string[][]>([]);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [headerRow, setHeaderRow] = useState(0);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>([]);
  const [parseStats, setParseStats] = useState<{
    totalItems: number;
    matchedItems: number;
    unmatchedItems: number;
    ordersWithSupplier: number;
    ordersWithoutSupplier: number;
    totalHeaderCount?: number;
    nonEmptyHeaderCount?: number;
    mappedColumnCount?: number;
    ignoredColumnCount?: number;
    extensionColumnCount?: number;
    recognizedFieldCount?: number;
    coverageRate?: number;
    conflictFields?: string[];
    unrecognizedHeaders?: string[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseResult, setParseResult] = useState<{
    duration: number;
    rawOutput?: string;
  } | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [importResult, setImportResult] = useState<{
    open: boolean;
    success: boolean;
    total: number;
    importBatch: string;
    sysOrderNos: string[];
    message: string;
    customerName?: string;
    duplicateSummary?: DuplicateSummary;
    matchStats?: MatchStatsSummary;
  } | null>(null);
  const [mappingHistory, setMappingHistory] = useState<MappingHistory[]>([]);
  const [activeMappingMeta, setActiveMappingMeta] = useState<MappingHistory | null>(null);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [mappingSearchTerm, setMappingSearchTerm] = useState('');
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [textInputCollapsed, setTextInputCollapsed] = useState(true);
  const salesUsers = users.filter((user) => isSalesAssignableRole(user.role));
  const operatorUsers = users.filter((user) => isOperatorAssignableRole(user.role));
  
  // 供应商匹配状态
  const [supplierMatchResults, setSupplierMatchResults] = useState<Record<string, {
    availableSuppliers: Array<{
      supplierId: string;
      supplierName: string;
      supplierType?: string;
      province?: string;
      provinceMatch?: string;
      productCode: string;
      productName: string;
      quantity: number;
      price: number;
      historyCost?: number | null;
      hasStock?: boolean;
    }>;
    hasStockForProduct?: boolean;
    newProductHint?: string;
    recommendedSupplierId?: string;
  }>>({});
  const [matchingSupplierOrderId, setMatchingSupplierOrderId] = useState<string | null>(null);
  const [isMatchingSupplier, setIsMatchingSupplier] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 优化后的自动检测列映射逻辑
  const autoDetectMapping = useCallback((headers: string[]) => {
    const mapping: Record<string, string> = {};
    const usedFields = new Set<string>();

    // 简化的匹配规则 - 只保留最常用、最精确的匹配
    // 避免多个目标字段竞争同一个列名
    const patterns: Record<string, Array<{ regex: RegExp; exact?: boolean; priority: number }>> = {
      bill_no: [
        { regex: /^单据编号$/, exact: true, priority: 10 },
      ],
      bill_date: [
        { regex: /^单据日期$/, exact: true, priority: 10 },
        { regex: /^订单日期$/, exact: true, priority: 9 },
        { regex: /^订单创建日期$/, exact: true, priority: 9 },
        { regex: /^创建日期$/, exact: true, priority: 8 },
        { regex: /^下单时间$/, exact: true, priority: 8 },
      ],
      order_no: [
        { regex: /^客户订单号$/, exact: true, priority: 10 },
        { regex: /^商户订单号$/, exact: true, priority: 10 },
        { regex: /^来源订单$/, exact: true, priority: 10 },
        { regex: /^订单编号$/, exact: true, priority: 9 },
        { regex: /^订单号$/, exact: true, priority: 9 },
      ],
      supplier_order_no: [
        { regex: /^供应商单据号$/, exact: true, priority: 10 },
        { regex: /^供应商订单号$/, exact: true, priority: 9 },
      ],
      customer_code: [
        { regex: /^客户代码$/, exact: true, priority: 10 },
        { regex: /^客户编码$/, exact: true, priority: 9 },
      ],
      customer_name: [
        { regex: /^客户名称$/, exact: true, priority: 10 },
        { regex: /^客户姓名$/, exact: true, priority: 9 },
      ],
      salesperson: [
        { regex: /^业务员$/, exact: true, priority: 10 },
        { regex: /^销售员$/, exact: true, priority: 8 },
      ],
      operator: [
        { regex: /^跟单员$/, exact: true, priority: 10 },
      ],
      // 客户商品名称
      product_name: [
        { regex: /^商品名称$/, exact: true, priority: 10 },
        { regex: /^商品名$/, exact: true, priority: 10 },
        { regex: /^货品名称$/, exact: true, priority: 9 },
        { regex: /^品名$/, exact: true, priority: 9 },
      ],
      // 客户商品编码
      product_code: [
        { regex: /^商品编码$/, exact: true, priority: 10 },
        { regex: /^商品代码$/, exact: true, priority: 9 },
        { regex: /^货号$/, exact: true, priority: 8 },
      ],
      // 客户规格型号
      product_spec: [
        { regex: /^商品规格$/, exact: true, priority: 10 },
        { regex: /^规格型号$/, exact: true, priority: 10 },
        { regex: /^型号规格$/, exact: true, priority: 9 },
        { regex: /^规格$/, exact: true, priority: 7 },
        { regex: /^型号$/, exact: true, priority: 7 },
      ],
      quantity: [
        { regex: /^商品数量$/, exact: true, priority: 10 },
        { regex: /^下单数量$/, exact: true, priority: 10 },
        { regex: /^数量$/, exact: true, priority: 9 },
        { regex: /^件数$/, exact: true, priority: 9 },
        { regex: /^台数$/, exact: true, priority: 9 },
      ],
      price: [
        { regex: /^单价$/, exact: true, priority: 10 },
        { regex: /^售价$/, exact: true, priority: 9 },
      ],
      amount: [
        { regex: /^价税合计$/, exact: true, priority: 10 },
        { regex: /^含税金额$/, exact: true, priority: 9 },
        { regex: /^金额$/, priority: 4 },
      ],
      discount: [
        { regex: /^单台折让$/, exact: true, priority: 10 },
        { regex: /^每台折让$/, exact: true, priority: 9 },
      ],
      tax_rate: [
        { regex: /^增值税税率$/, exact: true, priority: 10 },
      ],
      warehouse: [
        { regex: /^仓库$/, exact: true, priority: 10 },
        { regex: /^仓库名称$/, exact: true, priority: 9 },
      ],
      remark: [
        { regex: /^备注$/, exact: true, priority: 10 },
        { regex: /^商品行备注$/, exact: true, priority: 9 },
      ],
      receiver_name: [
        { regex: /^收件人姓名$/, exact: true, priority: 10 },
        { regex: /^收货人姓名$/, exact: true, priority: 10 },
        { regex: /^收货人$/, exact: true, priority: 9 },
        { regex: /^收件人$/, exact: true, priority: 9 },
        { regex: /^会员昵称$/, exact: true, priority: 8 },
      ],
      receiver_phone: [
        { regex: /^收件人手机$/, exact: true, priority: 10 },
        { regex: /^收货人手机号$/, exact: true, priority: 10 },
        { regex: /^收货人电话$/, exact: true, priority: 9 },
        { regex: /^收件人电话$/, exact: true, priority: 9 },
        { regex: /^收货电话$/, exact: true, priority: 8 },
        { regex: /^收件电话$/, exact: true, priority: 8 },
        { regex: /^手机号码$/, priority: 5 },
        { regex: /^联系电话$/, priority: 4 },
      ],
      receiver_address: [
        { regex: /^收件人地址$/, exact: true, priority: 10 },
        { regex: /^收货详细地址$/, exact: true, priority: 10 },
        { regex: /^收货人地址$/, exact: true, priority: 9 },
        { regex: /^收货地址$/, exact: true, priority: 9 },
        { regex: /^收件地址$/, exact: true, priority: 8 },
        { regex: /^详细地址$/, exact: true, priority: 7 },
      ],
      express_company: [
        { regex: /^物流公司$/, exact: true, priority: 10 },
        { regex: /^快递公司$/, exact: true, priority: 10 },
        { regex: /^承运商$/, exact: true, priority: 8 },
      ],
      tracking_no: [
        { regex: /^物流单号$/, exact: true, priority: 10 },
        { regex: /^快递单号$/, exact: true, priority: 10 },
        { regex: /^运单号$/, exact: true, priority: 9 },
        { regex: /^快递号$/, exact: true, priority: 8 },
      ],
      invoice_required: [
        { regex: /^需要开票$/, exact: true, priority: 10 },
      ],
      income_name: [
        { regex: /^收入名称$/, exact: true, priority: 10 },
      ],
      income_amount: [
        { regex: /^应收金额$/, exact: true, priority: 10 },
        { regex: /^收入金额$/, exact: true, priority: 8 },
      ],
    };

    // 需要自动忽略的字段模式（序号、行号等）
    const ignorePatterns = [
      /^序号$/, /^行号$/, /^编号$/, /^#$/, /^NO\.?$/i,
      /^index$/i, /^id$/i, /^idx$/i, /^no$/i,
      /^选择$/, /^操作$/, /^勾选$/, /^checkbox$/i,
    ];

    // 第一轮：按优先级匹配已知字段
    headers.forEach((header, idx) => {
      const key = String(idx);
      const h = header.trim();
      
      // 检查是否应该忽略
      const shouldIgnore = ignorePatterns.some(p => p.test(h));
      if (shouldIgnore) {
        mapping[key] = 'ignore';
        return;
      }
      
      let bestMatch: { field: string; priority: number } | null = null;

      for (const [field, regexList] of Object.entries(patterns)) {
        for (const { regex, exact, priority } of regexList) {
          if (regex.test(h)) {
            // 如果是精确匹配（exact: true），直接使用该优先级
            // 如果不是精确匹配，降低实际优先级
            const effectivePriority = exact ? priority : priority * 0.5;
            if (!bestMatch || effectivePriority > bestMatch.priority) {
              bestMatch = { field, priority: effectivePriority };
            }
          }
        }
      }

      if (bestMatch && !usedFields.has(bestMatch.field)) {
        mapping[key] = bestMatch.field;
        usedFields.add(bestMatch.field);
      }
    });

    // 第二轮：未匹配的列自动分配到备用字段
    headers.forEach((header, idx) => {
      const key = String(idx);
      if (!mapping[key]) {
        for (let i = 1; i <= 20; i++) {
          const extKey = `ext_field_${i}`;
          if (!usedFields.has(extKey)) {
            usedFields.add(extKey);
            mapping[key] = extKey;
            break;
          }
        }
      }
    });

    return mapping;
  }, []);

  // 加载客户列表
  useEffect(() => {
    loadCustomers();
    loadSuppliers();
    // 加载用户列表
  const loadUsers = async () => {
    try {
      const res = await fetch('/api/users', { headers: buildUserInfoHeaders() });
      const data = await res.json();
        if (data.success) {
          setUsers(data.data || []);
        }
      } catch (error) {
        console.error('加载用户列表失败:', error);
      }
    };
    loadUsers();
  }, []);

  // 选择客户时加载映射配置
  useEffect(() => {
    if (selectedCustomer) {
      loadMappingHistory(selectedCustomer);
      loadSavedMapping(selectedCustomer);
    } else {
      setMappingHistory([]);
      setColumnMapping({});
    }
  }, [selectedCustomer]);

  // 表头行变化时重新检测映射
  useEffect(() => {
    if (excelPreview.length > headerRow) {
      const detected = autoDetectMapping(excelPreview[headerRow]);
      setColumnMapping(detected);
    }
  }, [headerRow, excelPreview, autoDetectMapping]);

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers', { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) {
        setCustomers((data.data || []).filter((c: Customer) => c.code && c.name));
      }
    } catch (error) {
      console.error('加载客户失败:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers', { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success) {
        setSuppliers((data.data || []).filter((s: Supplier) => s.id && s.name));
      }
    } catch (error) {
      console.error('加载供应商失败:', error);
    }
  };

  // 加载保存的映射配置
  const loadSavedMapping = async (customerCode: string) => {
    try {
      const res = await fetch(`/api/column-mappings?customerCode=${encodeURIComponent(customerCode)}`, {
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        const savedMapping = data.data;
        setColumnMapping(savedMapping.mapping_config || {});
        setHeaderRow(savedMapping.header_row || 0);
        setActiveMappingMeta(savedMapping);
        const currentHeaders = normalizeHeadersForCompare(excelPreview[savedMapping.header_row || 0] || []);
        const savedHeaders = normalizeHeadersForCompare(savedMapping.source_headers || []);
        if (currentHeaders.length > 0 && savedHeaders.length > 0) {
          const sameHeaderShape = JSON.stringify(currentHeaders) === JSON.stringify(savedHeaders);
          if (!sameHeaderShape) {
            toast.info(`已加载保存配置 (v${savedMapping.version})，但当前表头与保存版本不完全一致`);
            return;
          }
        }
        toast.success(`已加载保存的配置 (v${savedMapping.version})`);
      } else {
        setActiveMappingMeta(null);
      }
    } catch (error) {
      console.error('加载映射配置失败:', error);
    }
  };

  // 加载映射历史版本
  const loadMappingHistory = async (customerCode: string) => {
    try {
      const res = await fetch(`/api/column-mappings/history?customerCode=${encodeURIComponent(customerCode)}`, {
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setMappingHistory(data.data || []);
      }
    } catch (error) {
      console.error('加载映射历史失败:', error);
    }
  };

  // 保存当前映射配置
  const saveMapping = async () => {
    if (!selectedCustomer) {
      toast.error('请先选择客户');
      return;
    }

    try {
      const res = await fetch('/api/column-mappings', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerCode: selectedCustomer,
          mappingConfig: columnMapping,
          headerRow,
          sourceHeaders: excelPreview[headerRow] || [],
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        loadMappingHistory(selectedCustomer);
      } else {
        toast.error(data.error || '保存失败');
      }
    } catch (error) {
      console.error('保存映射配置失败:', error);
      toast.error('保存映射配置失败');
    }
  };

  // 恢复历史版本
  const restoreMapping = async (mappingId: string) => {
    try {
      const res = await fetch(`/api/column-mappings/${mappingId}`, {
        method: 'PATCH',
        headers: buildUserInfoHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setColumnMapping(data.data.mapping_config || {});
        setHeaderRow(data.data.header_row || 0);
        toast.success(data.message);
        setShowMappingDialog(false);
      } else {
        toast.error(data.error || '恢复失败');
      }
    } catch (error) {
      console.error('恢复映射配置失败:', error);
      toast.error('恢复映射配置失败');
    }
  };

  // 解析Excel文件
  const handleExcelUpload = useCallback((file: File) => {
    setExcelFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        setExcelSheetNames(workbook.SheetNames);

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        setSelectedSheet(workbook.SheetNames[0]);
        const jsonData = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
        const preview = jsonData.slice(0, 20).map(row =>
          row.map(cell => String(cell ?? ''))
        );
        setExcelPreview(preview);

        // 自动检测列映射
        if (preview.length > 0) {
          const detected = autoDetectMapping(preview[0]);
          setColumnMapping(detected);
        }
      } catch {
        toast.error('Excel文件解析失败');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [autoDetectMapping]);

  const handleSheetChange = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    if (!excelFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
        const preview = jsonData.slice(0, 20).map(row =>
          row.map(cell => String(cell ?? ''))
        );
        setExcelPreview(preview);
        if (preview.length > 0) {
          const detected = autoDetectMapping(preview[0]);
          setColumnMapping(detected);
        }
      } catch {
        toast.error('Sheet解析失败');
      }
    };
    reader.readAsArrayBuffer(excelFile);
  }, [excelFile, autoDetectMapping]);

  // 解析文本订单
  const handleParseText = async () => {
    if (!selectedCustomer) {
      toast.error('请先选择关联客户');
      return;
    }
    if (!inputText.trim()) {
      toast.error('请输入订单内容');
      return;
    }

    setIsLoading(true);
    setParsedOrders([]);
    setParseResult(null);

    try {
      const res = await fetch('/api/order-parse', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          customerCode: selectedCustomer,
        }),
      });

      const data = await res.json();
      
      console.log('【前端】API返回:', data);

      if (data.success) {
        const detailOrders = normalizeBundleDraftsForPage(data.data.orders || []);
        const orders = buildFlatOrdersForPage(detailOrders, selectedCustomer, 'text_flat');

        setParsedOrders(orders);
        setParseResult({
          duration: data.data.duration,
          rawOutput: data.data.rawOutput,
        });
        toast.success(data.message);
      } else {
        toast.error(data.error || '解析失败');
      }
    } catch (error) {
      console.error('解析失败:', error);
      toast.error('解析失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 解析Excel为订单（增强版，支持SKU映射和供应商匹配）
  const handleParseExcel = async () => {
    console.log('handleParseExcel called', {
      excelPreviewLength: excelPreview.length,
      excelFile: excelFile?.name,
      columnMapping,
    });

    if (excelPreview.length < 2) {
      toast.error('Excel数据不足，请先上传Excel文件');
      return;
    }

    setIsLoading(true);
    setParseResult(null);

    try {
      const startTime = Date.now();
      const headers = excelPreview[headerRow] || [];
      const dataRows = excelPreview.slice(headerRow + 1);
      const mappingDiagnostics = getColumnMappingDiagnostics(headers, columnMapping);

      // 调试日志
      console.log('Excel解析调试:', {
        excelPreviewLength: excelPreview.length,
        headerRow,
        headers,
        dataRowsLength: dataRows.length,
        columnMapping,
      });

      // 调用增强版解析API
      const res = await fetch('/api/order-parse/excel', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rows: dataRows,
          headers,
          columnMapping,
          customerCode: selectedCustomer,
        }),
      });

      const data = await res.json();
      
      console.log('解析API返回:', {
        success: data.success,
        hasOrders: !!data.data?.orders,
        ordersLength: data.data?.orders?.length,
        firstOrder: data.data?.orders?.[0],
        message: data.message,
      });

      if (data.success) {
        // 设置解析统计信息
        if (data.data.stats) {
          setParseStats({
            ...data.data.stats,
            totalHeaderCount: data.data.stats.totalHeaderCount ?? mappingDiagnostics.totalHeaderCount,
            nonEmptyHeaderCount: data.data.stats.nonEmptyHeaderCount ?? mappingDiagnostics.nonEmptyHeaderCount,
            mappedColumnCount: data.data.stats.mappedColumnCount ?? mappingDiagnostics.mappedColumnCount,
            ignoredColumnCount: data.data.stats.ignoredColumnCount ?? mappingDiagnostics.ignoredColumnCount,
            extensionColumnCount: data.data.stats.extensionColumnCount ?? mappingDiagnostics.extensionColumnCount,
            recognizedFieldCount: data.data.stats.recognizedFieldCount ?? mappingDiagnostics.recognizedFieldCount,
            coverageRate: data.data.stats.coverageRate ?? mappingDiagnostics.coverageRate,
            conflictFields: data.data.stats.conflictFields ?? mappingDiagnostics.conflictFields,
            unrecognizedHeaders: data.data.stats.unrecognizedHeaders ?? mappingDiagnostics.unrecognizedHeaders,
          });
        }

        const detailOrders = normalizeBundleDraftsForPage(data.data.orders || []);
        const simpleOrders = buildFlatOrdersForPage(detailOrders, selectedCustomer, 'excel_flat');
        
        console.log('转换后的订单:', {
          detailOrdersCount: detailOrders.length,
          simpleOrdersCount: simpleOrders.length,
          firstSimpleOrder: simpleOrders[0],
        });

        setParsedOrders(simpleOrders);
        setParseResult({
          duration: Date.now() - startTime,
        });

        // 显示统计信息
        const stats = data.data.stats;
        if (stats) {
          toast.success(
            `解析完成！` +
            `${stats.totalItems}个商品，` +
            `已匹配${stats.matchedItems}个，` +
            `未匹配${stats.unmatchedItems}个，` +
            `有库存${stats.ordersWithSupplier}个`
          );
        } else {
          toast.success(data.message || `成功解析 ${detailOrders.length} 个订单`);
        }
      } else {
        toast.error(data.error || '解析失败');
        setParsedOrders([]);
        setParseStats(null);
      }
    } catch (error) {
      console.error('Excel解析失败:', error);
      toast.error('Excel解析失败');
      setParsedOrders([]);
      setParseStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParse = () => {
    if (inputMode === 'text') {
      handleParseText();
    } else {
      handleParseExcel();
    }
  };

  const handleClear = () => {
    setInputText('');
    setExcelFile(null);
    setExcelPreview([]);
    setExcelSheetNames([]);
    setSelectedSheet('');
    setParsedOrders([]);
    setParseStats(null);
    setParseResult(null);
    setSupplierMatchResults({});
    setMatchingSupplierOrderId(null);
    setIsMatchingSupplier(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const toggleOrder = (id: string) => {
    setParsedOrders(orders =>
      orders.map(o => (o.id === id ? { ...o, selected: !o.selected } : o))
    );
  };

  const toggleExpand = (id: string) => {
    setParsedOrders(orders =>
      orders.map(o => (o.id === id ? { ...o, expanded: !o.expanded } : o))
    );
  };

  const syncGlobalAssigneeToOrders = useCallback((
    kind: 'salesperson' | 'operator',
    nextId: string,
    nextName: string,
    previousName?: string
  ) => {
    const idField = kind === 'salesperson' ? 'salespersonId' : 'operatorId';

    setParsedOrders((orders) =>
      orders.map((order) => {
        const currentName = kind === 'salesperson' ? order.salesperson : order.operator;
        const currentId = kind === 'salesperson' ? order.salespersonId : order.operatorId;
        const shouldSync =
          !currentId ||
          !currentName ||
          (previousName ? currentName === previousName : false);

        if (!shouldSync) {
          return order;
        }

        return {
          ...order,
          [kind]: nextName,
          [idField]: nextId,
        };
      })
    );
  }, []);

  const updateOrder = (id: string, field: string, value: unknown) => {
    setParsedOrders(orders =>
      orders.map(o => (o.id === id ? { ...o, [field]: value } : o))
    );
  };

  const removeOrder = (id: string) => {
    setParsedOrders(orders => orders.filter(o => o.id !== id));
  };

  const duplicateOrder = (id: string) => {
    setParsedOrders(orders => {
      const idx = orders.findIndex(o => o.id === id);
      if (idx === -1) return orders;
      const original = orders[idx];
      const copy: ParsedOrder = {
        ...original,
        id: `copy_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        selected: true,
        expanded: true,
      };
      const newOrders = [...orders];
      newOrders.splice(idx + 1, 0, copy);
      return newOrders;
    });
    toast.success('已复制一条记录');
  };

  const addOrder = () => {
    setParsedOrders(orders => [
      ...orders,
      {
        id: `manual_${Date.now()}`,
        customer_code: selectedCustomer,
        product_name: '',
        quantity: 1,
        salesperson: salespersonName || undefined,
        salespersonId: salespersonId || undefined,
        operator: operatorName || undefined,
        operatorId: operatorId || undefined,
        selected: true,
        expanded: true,
      },
    ]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  // 智能匹配供应商
  const handleMatchSupplier = async (orderId: string) => {
    setIsMatchingSupplier(true);
    setMatchingSupplierOrderId(orderId);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orders: parsedOrders.filter(o => o.id === orderId),
        }),
      });
      const data = await res.json();
      
      if (data.success && data.data.length > 0) {
        const item = data.data[0];
        setSupplierMatchResults(prev => ({
          ...prev,
          [orderId]: {
            availableSuppliers: item.allSupplierOptions || [],
            hasStockForProduct: item.hasStockForProduct,
            newProductHint: item.newProductHint,
            recommendedSupplierId: item.recommendedSupplier?.id,
          },
        }));
        
        if (item.recommendedSupplier) {
          handleSupplierChange(orderId, item.recommendedSupplier.id);
        }
        
        if (item.newProductHint) {
          toast.info(item.newProductHint);
        } else if (item.warning) {
          toast.warning(item.warning);
        }
      } else {
        toast.error(data.error || '匹配失败');
      }
    } catch (error) {
      toast.error('匹配请求失败');
      console.error(error);
    } finally {
      setIsMatchingSupplier(false);
      setMatchingSupplierOrderId(null);
    }
  };

  // 批量智能匹配
  const handleMatchAllSuppliers = async () => {
    const selectedParsedOrders = parsedOrders.filter(o => o.selected && o.product_name);
    if (selectedParsedOrders.length === 0) {
      toast.error('请至少选择一条有效的订单');
      return;
    }
    
    setIsMatchingSupplier(true);
    try {
      const res = await fetch('/api/match', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orders: selectedParsedOrders }),
      });
      const data = await res.json();
      
      if (data.success) {
        const newResults: typeof supplierMatchResults = {};
        data.data.forEach((item: { orderId: string; allSupplierOptions?: Array<{ supplierId: string; supplierName: string; supplierType?: string; province?: string; provinceMatch?: string; productCode: string; productName: string; quantity: number; price: number; historyCost?: number | null; hasStock?: boolean }>; hasStockForProduct?: boolean; newProductHint?: string; recommendedSupplier?: { id: string } }) => {
          newResults[item.orderId] = {
            availableSuppliers: item.allSupplierOptions || [],
            hasStockForProduct: item.hasStockForProduct,
            newProductHint: item.newProductHint,
            recommendedSupplierId: item.recommendedSupplier?.id,
          };
          
          if (item.recommendedSupplier) {
            handleSupplierChange(item.orderId, item.recommendedSupplier.id);
          }
        });
        setSupplierMatchResults(newResults);
        
        toast.success(`已完成 ${data.data.length} 条订单的供应商匹配`);
      } else {
        toast.error(data.error || '批量匹配失败');
      }
    } catch (error) {
      toast.error('批量匹配请求失败');
      console.error(error);
    } finally {
      setIsMatchingSupplier(false);
    }
  };

  const handleSupplierChange = (orderId: string, supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    updateOrder(orderId, 'supplierId', supplierId);
    updateOrder(orderId, 'supplierName', supplier?.name || '');
  };

  const handleSubmitOrders = async () => {
    // 校验：必须选择客户
    if (!selectedCustomer) {
      toast.error('请先选择关联客户');
      return;
    }

    const selectedOrders = parsedOrders.filter((order) => order.selected && order.product_name?.trim());

    if (selectedOrders.length === 0) {
      toast.error('请至少选择一条有效的订单');
      return;
    }

    const validation = getSubmitValidationSummary(parsedOrders);
    if (validation.invalidOrderIds.length > 0) {
      const missingLabels: string[] = [];
      if (validation.missingReceiverCount > 0) missingLabels.push('收货人');
      if (validation.missingPhoneCount > 0) missingLabels.push('收货电话');
      if (validation.missingAddressCount > 0) missingLabels.push('收货地址');
      if (validation.missingSupplierCount > 0) missingLabels.push('发货供应商');

      toast.error(
        `还有 ${validation.invalidOrderIds.length} 条选中订单待补全${missingLabels.length > 0 ? `：${missingLabels.join('、')}` : ''}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        customerCode: selectedCustomer,
        customerName: customers.find(c => c.code === selectedCustomer)?.name || '',
        salespersonId: salespersonId || '',
        salespersonName: salespersonName || selectedOrders[0]?.salesperson || '',
        operatorId: operatorId || '',
        operatorName: operatorName || selectedOrders[0]?.operator || '',
        items: selectedOrders.map(o => ({
          orderNo: o.orderNo || o.billNo || '',
          billNo: o.billNo || '',
          billDate: o.billDate || '',
          supplierOrderNo: o.supplierOrderNo || '',
          // 客户商品信息
          productName: o.product_name,           // 客户商品名称
          productCode: o.product_code || '',    // 客户商品编码
          productSpec: o.product_spec || '',     // 客户规格型号
          // 系统商品信息（自动匹配）
          systemProductCode: o.mappedProductCode || '',  // 系统商品编码
          systemProductName: o.mappedProductName || '',  // 系统商品名称
          systemProductSpec: o.mappedProductSpec || '',   // 系统规格型号
          systemProductBrand: o.mappedProductBrand || '',  // 系统商品品牌
          systemProductId: o.systemProductId || '',      // 系统商品ID
          quantity: o.quantity,
          price: o.price || o.customerPrice || 0,
          amount: o.amount,
          discount: o.discount,
          taxRate: o.taxRate,
          warehouse: o.warehouse,
          remark: o.remark,
          supplierId: o.supplierId || '',
          supplierName: o.supplierName || '',
          receiver_name: o.receiver_name || '',
          receiver_phone: o.receiver_phone || '',
          receiver_address: o.receiver_address || '',
          express_company: o.express_company,
          tracking_no: o.tracking_no,
          invoice_required: o.invoice_required,
          income_name: o.income_name,
          income_amount: o.income_amount,
          salespersonId: o.salespersonId || '',
          salesperson: o.salesperson,
          operatorId: o.operatorId || '',
          operator: o.operator,
          extFields: o.extFields || {},
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          ...buildUserInfoHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await res.json();

      if (data.success) {
        const sysOrderNos = (data.data || []).map((o: Record<string, unknown>) => o.sys_order_no).filter(Boolean);
        setImportResult({
          open: true,
          success: true,
          total: data.total || selectedOrders.length,
          importBatch: data.importBatch || '',
          sysOrderNos,
          message: data.message || `成功创建 ${data.total || selectedOrders.length} 条订单`,
          customerName: customers.find(c => c.code === selectedCustomer)?.name || selectedCustomer,
          duplicateSummary: data.duplicateSummary,
          matchStats: data.matchStats,
        });
        handleClear();
      } else {
        toast.error(data.error || '创建订单失败');
      }
    } catch (error) {
      console.error('创建订单失败:', error);
      toast.error('创建订单失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 过滤映射历史
  const filteredHistory = mappingHistory.filter(h =>
    !mappingSearchTerm ||
    `v${h.version}`.includes(mappingSearchTerm) ||
    h.remark?.includes(mappingSearchTerm) ||
    h.created_by?.includes(mappingSearchTerm)
  );

  // 获取字段标签
  const getFieldLabel = (fieldValue: string) => {
    const option = COLUMN_OPTIONS.find(opt => opt.value === fieldValue);
    return option?.label || fieldValue;
  };

  const normalizeHeadersForCompare = (headers: string[]) =>
    headers.map((header) => String(header || '').trim()).filter(Boolean);

  const currentPreviewHeaders = normalizeHeadersForCompare(excelPreview[headerRow] || []);
  const activeMappingHeaders = normalizeHeadersForCompare(activeMappingMeta?.source_headers || []);
  const isCurrentHeaderAlignedWithActiveMapping =
    currentPreviewHeaders.length > 0 &&
    activeMappingHeaders.length > 0 &&
    headerRow === (activeMappingMeta?.header_row ?? headerRow) &&
    JSON.stringify(currentPreviewHeaders) === JSON.stringify(activeMappingHeaders);
  const getHistoryCompatibility = (history: MappingHistory) => {
    const historyHeaders = normalizeHeadersForCompare(history.source_headers || []);
    if (currentPreviewHeaders.length === 0 || historyHeaders.length === 0) {
      return null;
    }

    const isAligned =
      headerRow === history.header_row &&
      JSON.stringify(currentPreviewHeaders) === JSON.stringify(historyHeaders);

    return {
      isAligned,
      label: isAligned ? '匹配当前文件' : '与当前文件有差异',
    };
  };
  const submitValidation = getSubmitValidationSummary(parsedOrders);
  const selectedValidOrderCount =
    parsedOrders.filter((order) => order.selected).length - submitValidation.invalidOrderIds.length;

  return (
    <PageGuard
      permission="orders:create"
      title="无权录入订单"
      description="当前账号没有使用订单录入功能的权限。"
    >
    <div className="flex min-h-[calc(100vh-4rem)] flex-col px-3 pb-3 sm:px-4">
      {/* Header */}
      <div className="flex shrink-0 flex-col gap-3 px-1 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
            <Sparkles className="h-6 w-6 text-primary" />
            AI智能订单录入
          </h1>
          <p className="text-sm text-muted-foreground">
            支持文本/Excel导入，AI自动识别并生成结构化订单
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          {selectedCustomer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMappingDialog(true)}
              className="w-full sm:w-auto"
            >
              <History className="h-4 w-4 mr-1" />
              映射历史 ({mappingHistory.length})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
            className="w-full sm:w-auto"
          >
            {leftPanelCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 mr-1" />
            ) : (
              <PanelLeftClose className="h-4 w-4 mr-1" />
            )}
            {leftPanelCollapsed ? '展开' : '收起'}输入
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 min-h-0 flex-col gap-4 xl:flex-row">
        {/* Left Panel: Input */}
        <div
          className={`transition-all duration-300 ease-in-out shrink-0 ${
            leftPanelCollapsed ? 'h-0 overflow-hidden opacity-0 xl:h-auto xl:w-0' : 'w-full opacity-100 xl:w-[520px]'
          }`}
        >
          <div className="flex h-full flex-col gap-3 overflow-y-auto pr-0 xl:pr-1">
            {/* Customer Select */}
            <Card className="shrink-0">
              <CardContent className="pt-4 pb-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Store className="h-3.5 w-3.5" />
                    关联客户 <span className="text-red-500">*</span>
                  </Label>
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10",
                          !selectedCustomer && "text-muted-foreground",
                          !selectedCustomer && "border-red-300 bg-red-50"
                        )}
                      >
                        {selectedCustomer ? (
                          <span className="truncate">{customers.find(c => c.code === selectedCustomer)?.name}</span>
                        ) : (
                          <span className="truncate">请搜索并选择客户...</span>
                        )}
                        <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[min(400px,calc(100vw-2rem))] p-0" align="start">
                      <Command shouldFilter={true}>
                        <CommandInput
                          placeholder="输入客户名称或编码搜索..."
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          <CommandEmpty>未找到匹配的客户</CommandEmpty>
                          <CommandGroup>
                            {customers
                              .slice(0, 50)
                              .map((c) => (
                                <CommandItem
                                  key={c.code}
                                  value={`${c.code} ${c.name}`}
                                  onSelect={(value) => {
                                    // 解析选择值，可能包含名称
                                    const code = value.split(' ')[0];
                                    const selectedCode = customers.find(cc => cc.code === code)?.code || '';
                                    setSelectedCustomer(selectedCode);
                                    setCustomerSearch('');
                                    setCustomerSearchOpen(false);
                                    if (selectedCode) {
                                      const customer = customers.find(cc => cc.code === selectedCode);
                                      const matchedSalesUser = findUserByIdOrName(users, {
                                        id: customer?.salesUserId,
                                        name: customer?.salesUserName,
                                      });
                                      const matchedOperatorUser = findUserByIdOrName(users, {
                                        id: customer?.operatorUserId,
                                        name: customer?.operatorUserName,
                                      });

                                      const nextSalespersonId = matchedSalesUser?.id || customer?.salesUserId || '';
                                      const nextSalespersonName = customer?.salesUserName || getUserDisplayName(matchedSalesUser);
                                      const nextOperatorId = matchedOperatorUser?.id || customer?.operatorUserId || '';
                                      const nextOperatorName = customer?.operatorUserName || getUserDisplayName(matchedOperatorUser);

                                      setSalespersonId(nextSalespersonId);
                                      setSalespersonName(nextSalespersonName);
                                      setOperatorId(nextOperatorId);
                                      setOperatorName(nextOperatorName);
                                      syncGlobalAssigneeToOrders('salesperson', nextSalespersonId, nextSalespersonName, salespersonName);
                                      syncGlobalAssigneeToOrders('operator', nextOperatorId, nextOperatorName, operatorName);
                                    } else {
                                      setSalespersonId('');
                                      setOperatorId('');
                                      setSalespersonName('');
                                      setOperatorName('');
                                      syncGlobalAssigneeToOrders('salesperson', '', '', salespersonName);
                                      syncGlobalAssigneeToOrders('operator', '', '', operatorName);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{c.name}</span>
                                    <span className="text-xs text-muted-foreground">编码: {c.code}</span>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedCustomer && (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">业务员</Label>
                        <Select 
                          value={salespersonId || (salespersonName ? `__name__${salespersonName}` : '__empty__')} 
                          onValueChange={(v) => {
                            const previousName = salespersonName;
                            if (v === '__empty__') {
                              setSalespersonId('');
                              setSalespersonName('');
                              syncGlobalAssigneeToOrders('salesperson', '', '', previousName);
                            } else if (v.startsWith('__name__')) {
                              const nextName = v.replace('__name__', '');
                              setSalespersonId('');
                              setSalespersonName(nextName);
                              syncGlobalAssigneeToOrders('salesperson', '', nextName, previousName);
                            } else {
                              setSalespersonId(v);
                              const user = users.find(u => u.id === v);
                              const nextName = getUserDisplayName(user);
                              setSalespersonName(nextName);
                              syncGlobalAssigneeToOrders('salesperson', v, nextName, previousName);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="选择业务员" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty__">-- 不选择 --</SelectItem>
                            {salesUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {getUserDisplayName(u)}
                              </SelectItem>
                            ))}
                            {salespersonName && !users.find(u => u.id === salespersonId || u.realName === salespersonName || u.username === salespersonName) && (
                              <SelectItem value={`__name__${salespersonName}`}>
                                {salespersonName} (客户档案)
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">跟单员</Label>
                        <Select 
                          value={operatorId || (operatorName ? `__name__${operatorName}` : '__empty__')} 
                          onValueChange={(v) => {
                            const previousName = operatorName;
                            if (v === '__empty__') {
                              setOperatorId('');
                              setOperatorName('');
                              syncGlobalAssigneeToOrders('operator', '', '', previousName);
                            } else if (v.startsWith('__name__')) {
                              const nextName = v.replace('__name__', '');
                              setOperatorId('');
                              setOperatorName(nextName);
                              syncGlobalAssigneeToOrders('operator', '', nextName, previousName);
                            } else {
                              setOperatorId(v);
                              const user = users.find(u => u.id === v);
                              const nextName = getUserDisplayName(user);
                              setOperatorName(nextName);
                              syncGlobalAssigneeToOrders('operator', v, nextName, previousName);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="选择跟单员" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__empty__">-- 不选择 --</SelectItem>
                            {operatorUsers.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {getUserDisplayName(u)}
                              </SelectItem>
                            ))}
                            {operatorName && !users.find(u => u.id === operatorId || u.realName === operatorName || u.username === operatorName) && (
                              <SelectItem value={`__name__${operatorName}`}>
                                {operatorName} (客户档案)
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {selectedCustomer && (
                    <div className="space-y-2">
                      {activeMappingMeta && (
                        <div className="rounded-md border border-dashed bg-muted/30 p-2 text-xs text-muted-foreground">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">当前映射 v{activeMappingMeta.version}</Badge>
                            {activeMappingMeta.header_fingerprint && (
                              <Badge variant="outline">表头指纹 {activeMappingMeta.header_fingerprint}</Badge>
                            )}
                            {activeMappingMeta.template_signature && (
                              <Badge variant="outline">模板签名 {activeMappingMeta.template_signature}</Badge>
                            )}
                          </div>
                          {currentPreviewHeaders.length > 0 && activeMappingHeaders.length > 0 && (
                            <p className="mt-2">
                              当前表头匹配状态：
                              <span className={cn(
                                'ml-1 font-medium',
                                isCurrentHeaderAlignedWithActiveMapping ? 'text-green-600' : 'text-orange-600'
                              )}>
                                {isCurrentHeaderAlignedWithActiveMapping ? '与已保存版本一致' : '与已保存版本存在差异'}
                              </span>
                            </p>
                          )}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-full text-xs"
                        onClick={saveMapping}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        保存当前映射配置
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Input Mode Tabs */}
            <Card className="flex flex-col flex-1 min-h-0">
              <Tabs
                value={inputMode}
                onValueChange={(v) => setInputMode(v as 'text' | 'excel')}
                className="flex flex-col"
              >
                <CardHeader className="pb-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <TabsList className="grid w-full max-w-[280px] grid-cols-2">
                      <TabsTrigger value="text" className="gap-1">
                        <Type className="h-4 w-4" />
                        文本录入
                      </TabsTrigger>
                      <TabsTrigger value="excel" className="gap-1">
                        <FileSpreadsheet className="h-4 w-4" />
                        Excel导入
                      </TabsTrigger>
                    </TabsList>
                  </div>
                </CardHeader>

                <CardContent className="pb-4 flex-1 flex flex-col min-h-0">
                  {/* Text Input */}
                  <TabsContent value="text" className="mt-0 flex flex-col">
                    {/* Collapsible Header */}
                    <div className="flex items-center justify-between mb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 gap-1 text-xs"
                        onClick={() => setTextInputCollapsed(!textInputCollapsed)}
                      >
                        {textInputCollapsed ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronUp className="h-3 w-3" />
                        )}
                        文本录入 {textInputCollapsed ? '(点击展开)' : ''}
                      </Button>
                      {!textInputCollapsed && inputText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={() => setInputText('')}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          清空
                        </Button>
                      )}
                    </div>

                    {/* Collapsible Content */}
                    {textInputCollapsed ? (
                      <div
                        className="flex-1 min-h-[60px] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                        onClick={() => setTextInputCollapsed(false)}
                      >
                        <div className="text-center text-muted-foreground">
                          <Type className="h-6 w-6 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">点击此处开始文本录入</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Textarea
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          placeholder={`📋 参考案例1 - 京东/天猫订单格式：
订单号：JD20240315001
收货人：李四
电话：13912345678
地址：上海市浦东新区张江镇科苑路88号
商品：戴森吹风机 HD03 鎏金金 1台
备注：礼盒装

---
📋 参考案例2 - 微信聊天记录格式：
客户发来订单：
收件人：王五
手机号：13888888888
地址：北京市海淀区中关村大街1号
要的货：iPhone 15 Pro 256G 钛金属色 2台
急单，明天要！

---
📋 参考案例3 - Excel表格复制格式：
张三  13800001111  广州市天河区珠江新城花城大道68号  飞利浦电动牙刷HX9924 1套
李四  13900002222  深圳市南山区科技园南区深南大道9996号  小米手环8 NFC 3个

---
📋 参考案例4 - 聚水潭/管易订单格式：
渠道单号：JST20240315001
收件人：赵六
手机：13700003333
地址：杭州市西湖区文三路398号东信大厦
商品明细：
- SK-II神仙水230ml 1瓶
- 兰蔻小黑瓶精华50ml 2瓶`}
                          className="flex-1 min-h-[250px] font-mono text-sm resize-none"
                        />
                        <div className="flex gap-2 mt-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={handleParseText}
                            disabled={!inputText || isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Sparkles className="h-4 w-4" />
                            )}
                            AI解析
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleClear}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            清空
                          </Button>
                        </div>
                      </>
                    )}
                  </TabsContent>

                  {/* Excel Input */}
                  <TabsContent value="excel" className="mt-0 flex-1 flex flex-col min-h-0">
                    {!excelFile ? (
                      <div
                        className={`flex-1 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[150px] ${
                          isDragging 
                            ? 'border-primary bg-primary/10' 
                            : 'border-dashed hover:border-primary hover:bg-primary/5'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(true);
                        }}
                        onDragEnter={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(true);
                        }}
                        onDragLeave={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(false);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setIsDragging(false);
                          const files = e.dataTransfer.files;
                          if (files && files.length > 0) {
                            const file = files[0];
                            if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
                              handleExcelUpload(file);
                            } else {
                              toast.error('请上传 Excel 文件（.xlsx, .xls, .csv）');
                            }
                          }
                        }}
                      >
                        {isDragging ? (
                          <>
                            <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
                            <p className="text-sm font-medium text-primary">松开以上传文件</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              拖放文件到此处
                            </p>
                          </>
                        ) : (
                          <>
                            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                            <p className="text-sm font-medium">点击上传Excel文件</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              支持 .xlsx, .xls, .csv 格式（也可直接拖放文件到此处）
                            </p>
                          </>
                        )}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleExcelUpload(file);
                          }}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
                        {/* File info */}
                        <div className="flex flex-col gap-2 rounded-md bg-muted p-2 text-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
                          <div className="flex min-w-0 items-center gap-2 text-sm">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <span className="max-w-[180px] truncate font-medium sm:max-w-[220px]">{excelFile.name}</span>
                            <span className="text-muted-foreground">
                              ({(excelFile.size / 1024).toFixed(1)}KB)
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7"
                            onClick={() => {
                              setExcelFile(null);
                              setExcelPreview([]);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Sheet select */}
                        {excelSheetNames.length > 1 && (
                          <div className="grid gap-1 shrink-0">
                            <Label className="text-xs">工作表</Label>
                            <Select value={selectedSheet} onValueChange={handleSheetChange}>
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {excelSheetNames.map((name) => (
                                  <SelectItem key={name} value={name}>
                                    {name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {/* Header row */}
                        <div className="grid grid-cols-1 gap-2 items-end shrink-0 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="grid gap-1">
                            <Label className="text-xs">表头行（从0开始）</Label>
                            <Input
                              type="number"
                              min="0"
                              max={Math.max(0, excelPreview.length - 2)}
                              value={headerRow}
                              onChange={(e) => setHeaderRow(parseInt(e.target.value) || 0)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            onClick={() => {
                              const detected = autoDetectMapping(excelPreview[headerRow] || []);
                              setColumnMapping(detected);
                              toast.success('已重新自动检测映射');
                            }}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            重新检测
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleMatchAllSuppliers}
                            disabled={isMatchingSupplier || parsedOrders.length === 0}
                          >
                            {isMatchingSupplier ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                匹配中...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1" />
                                批量匹配供应商
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Column mapping - 优化UI，使用分组下拉框 */}
                        {excelPreview.length > headerRow && (
                          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                            <Label className="text-xs font-medium shrink-0">
                              列映射（自动识别）
                            </Label>
                            <ScrollArea className="flex-1 mt-2 pr-2">
                              <div className="space-y-2 pb-2">
                                {(excelPreview[headerRow] || []).map((header, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                                    <code className="text-xs bg-muted px-2 py-1 rounded min-w-[80px] max-w-[120px] truncate flex-shrink-0">
                                      {header || `列${idx + 1}`}
                                    </code>
                                    <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
                                    <Select
                                      value={columnMapping[String(idx)] || 'ignore'}
                                      onValueChange={(v) => {
                                        setColumnMapping(prev => {
                                          const updated = { ...prev, [String(idx)]: v };
                                          if (v.startsWith('ext_field_')) {
                                            for (const [k, val] of Object.entries(updated)) {
                                              if (k !== String(idx) && val === v) {
                                                updated[k] = 'ignore';
                                              }
                                            }
                                          }
                                          return updated;
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-7 text-xs flex-1">
                                        <SelectValue placeholder="选择字段..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectGroup>
                                          <SelectLabel className="text-xs">常用字段</SelectLabel>
                                          {COLUMN_OPTIONS.filter(opt => COMMON_FIELDS.includes(opt.value)).map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                              {opt.label}
                                            </SelectItem>
                                          ))}
                                        </SelectGroup>
                                        {Object.entries(GROUPED_OPTIONS)
                                          .filter(([group]) => group !== '其他' && !COMMON_FIELDS.some(f => GROUPED_OPTIONS[group]?.some(o => o.value === f)))
                                          .map(([group, options]) => (
                                            <SelectGroup key={group}>
                                              <SelectLabel className="text-xs">{group}</SelectLabel>
                                              {options.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                  {opt.label}
                                                </SelectItem>
                                              ))}
                                            </SelectGroup>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>

                            {/* Preview table */}
                            <details className="mt-2 shrink-0">
                              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                预览前5行数据
                              </summary>
                              <div className="mt-1 overflow-x-auto border rounded text-xs">
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-muted">
                                      {(excelPreview[headerRow] || []).map((h, i) => (
                                        <th key={i} className="px-2 py-1 text-left whitespace-nowrap">{h || `列${i+1}`}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {excelPreview.slice(headerRow + 1, headerRow + 6).map((row, ri) => (
                                      <tr key={ri} className="border-t">
                                        {row.map((cell, ci) => (
                                          <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate">{cell}</td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </details>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </CardContent>

                {/* Parse button */}
                <div className="px-6 pb-4 shrink-0 space-y-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={handleParse}
                      disabled={isLoading || (inputMode === 'text' ? !inputText.trim() : excelPreview.length < 2)}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          解析中...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          AI解析
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleClear} className="sm:w-auto">
                      清空
                    </Button>
                  </div>
                  {parseResult && (
                    <div className="text-xs text-muted-foreground flex items-center gap-2">
                      <Check className="h-3 w-3 text-green-500" />
                      解析完成，耗时 {parseResult.duration}ms
                    </div>
                  )}
                  {/* Debug info */}
                  <div className="text-xs text-muted-foreground">
                    {inputMode === 'excel' ? (
                      <>
                        Excel模式 | 数据行: {excelPreview.length > 0 ? excelPreview.length - 1 : 0} | 映射字段: {Object.keys(columnMapping).length}
                      </>
                    ) : (
                      <>文本模式 | 字符数: {inputText.length}</>
                    )}
                  </div>
                </div>
              </Tabs>
            </Card>
          </div>
        </div>

        {/* Right Panel: Parsed Orders */}
        <div className="flex-1 min-w-0 flex flex-col">
          {parsedOrders.length > 0 ? (
            <>
              {/* 解析统计信息 */}
              {parseStats && (
                <div className="mb-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">解析统计</span>
                    </div>
                    <Badge variant="outline" className="bg-white">
                      共 {parseStats.totalItems} 个商品
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <Check className="h-3 w-3 text-green-500" />
                      <span className="text-muted-foreground">已匹配商品:</span>
                      <span className="font-medium text-green-600">{parseStats.matchedItems}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <Package className="h-3 w-3 text-orange-500" />
                      <span className="text-muted-foreground">未匹配商品:</span>
                      <span className="font-medium text-orange-600">{parseStats.unmatchedItems}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <Building2 className="h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">有库存:</span>
                      <span className="font-medium text-blue-600">{parseStats.ordersWithSupplier}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      <span className="text-muted-foreground">无库存:</span>
                      <span className="font-medium text-red-600">{parseStats.ordersWithoutSupplier}</span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <FileSpreadsheet className="h-3 w-3 text-blue-500" />
                      <span className="text-muted-foreground">识别列:</span>
                      <span className="font-medium text-blue-600">{parseStats.recognizedFieldCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      <span className="text-muted-foreground">扩展列:</span>
                      <span className="font-medium text-slate-600">{parseStats.extensionColumnCount ?? 0}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <BarChart3 className="h-3 w-3 text-emerald-500" />
                      <span className="text-muted-foreground">映射命中率:</span>
                      <span className="font-medium text-emerald-600">{parseStats.coverageRate ?? 0}%</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white rounded px-2 py-1">
                      <Eye className="h-3 w-3 text-violet-500" />
                      <span className="text-muted-foreground">有效表头:</span>
                      <span className="font-medium text-violet-600">{parseStats.nonEmptyHeaderCount ?? 0}</span>
                    </div>
                  </div>
                  {((parseStats.unrecognizedHeaders?.length || 0) > 0 || (parseStats.conflictFields?.length || 0) > 0) && (
                    <div className="mt-2 space-y-2 text-xs">
                      {(parseStats.unrecognizedHeaders?.length || 0) > 0 && (
                        <div className="rounded bg-white px-2 py-2">
                          <div className="mb-1 flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-medium">未识别表头</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {parseStats.unrecognizedHeaders?.slice(0, 8).map((header) => (
                              <Badge key={header} variant="outline" className="bg-amber-50 text-amber-700">
                                {header}
                              </Badge>
                            ))}
                            {(parseStats.unrecognizedHeaders?.length || 0) > 8 && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                                +{(parseStats.unrecognizedHeaders?.length || 0) - 8}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {(parseStats.conflictFields?.length || 0) > 0 && (
                        <div className="rounded bg-white px-2 py-2">
                          <div className="mb-1 flex items-center gap-1 text-red-700">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="font-medium">冲突字段</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {parseStats.conflictFields?.map((field) => (
                              <Badge key={field} variant="outline" className="bg-red-50 text-red-700">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Action Bar */}
              <div className="mb-3 flex shrink-0 flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {parsedOrders.filter(o => o.selected).length} / {parsedOrders.length} 条
                  </Badge>
                  {submitValidation.invalidOrderIds.length > 0 && (
                    <Badge variant="destructive">
                      {submitValidation.invalidOrderIds.length} 条待补全
                    </Badge>
                  )}
                  {selectedValidOrderCount > 0 && (
                    <Badge variant="outline">
                      可提交 {selectedValidOrderCount} 条
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      const allSelected = parsedOrders.every(o => o.selected);
                      setParsedOrders(orders =>
                        orders.map(o => ({ ...o, selected: !allSelected }))
                      );
                    }}
                  >
                    {parsedOrders.every(o => o.selected) ? '取消全选' : '全选'}
                  </Button>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addOrder}
                    className="h-8 sm:w-auto"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    添加
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSubmitOrders}
                    disabled={isSubmitting || selectedValidOrderCount === 0}
                    className="h-8 sm:w-auto"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        提交中...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        提交订单
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {submitValidation.invalidOrderIds.length > 0 && (
                <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <div className="flex items-center gap-1 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    提交前还有内容待补全
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {submitValidation.missingProductNameCount > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                        商品名称 {submitValidation.missingProductNameCount}
                      </Badge>
                    )}
                    {submitValidation.missingReceiverCount > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                        收货人 {submitValidation.missingReceiverCount}
                      </Badge>
                    )}
                    {submitValidation.missingPhoneCount > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                        收货电话 {submitValidation.missingPhoneCount}
                      </Badge>
                    )}
                    {submitValidation.missingAddressCount > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                        收货地址 {submitValidation.missingAddressCount}
                      </Badge>
                    )}
                    {submitValidation.missingSupplierCount > 0 && (
                      <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                        发货供应商 {submitValidation.missingSupplierCount}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Orders List */}
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-2">
                  {parsedOrders.map((order, idx) => (
                    <Card key={order.id} className={order.selected ? '' : 'opacity-60'}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <div className="pt-1">
                            <Switch
                              checked={order.selected}
                              onCheckedChange={() => toggleOrder(order.id)}
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            {/* Header */}
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-muted-foreground">
                                  #{idx + 1}
                                </span>
                                {order.orderNo && (
                                  <Badge variant="outline" className="text-xs">
                                    {order.orderNo}
                                  </Badge>
                                )}
                                {selectedCustomer && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Building2 className="h-3 w-3 mr-0.5" />
                                    {customers.find(c => c.code === selectedCustomer)?.name || selectedCustomer}
                                  </Badge>
                                )}
                                {order.mappedProductName && (
                                  <Badge variant="default" className="text-xs">
                                    <Star className="h-3 w-3 mr-0.5" />
                                    已匹配
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-1 self-end sm:self-auto">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => toggleExpand(order.id)}
                                >
                                  {order.expanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => duplicateOrder(order.id)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                  onClick={() => removeOrder(order.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Main info */}
                            <div className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                              <div className="flex items-center gap-1 min-w-0">
                                <Package className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span className="truncate font-medium">
                                  {order.product_name}
                                </span>
                                <span className="text-muted-foreground shrink-0">
                                  ×{order.quantity}
                                </span>
                              </div>
                              {order.receiver_name && (
                                <div className="flex items-center gap-1 min-w-0">
                                  <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate">{order.receiver_name}</span>
                                </div>
                              )}
                              {order.receiver_phone && (
                                <div className="flex items-center gap-1 min-w-0">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate">{order.receiver_phone}</span>
                                </div>
                              )}
                              {order.receiver_address && (
                                <div className="flex items-center gap-1 min-w-0 col-span-2">
                                  <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                  <span className="truncate text-xs">{order.receiver_address}</span>
                                </div>
                              )}
                              
                              {/* 增强：系统商品信息 */}
                              {order.mappedProductName && (
                                <div className="col-span-2 mt-1 p-2 bg-green-50 rounded border border-green-100">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Star className="h-3 w-3 text-green-500" />
                                    <span className="text-xs font-medium text-green-700">已匹配系统商品</span>
                                    {order.matchHint && (
                                      <Badge variant="outline" className="text-[10px] py-0 bg-green-50 text-green-600">
                                        {order.matchHint}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-3">
                                    <div>
                                      <span className="text-muted-foreground">系统商品:</span>
                                      <span className="ml-1 font-medium text-green-700">{order.mappedProductName}</span>
                                    </div>
                                    {order.mappedProductCode && (
                                      <div>
                                        <span className="text-muted-foreground">编码:</span>
                                        <code className="ml-1 text-green-600">{order.mappedProductCode}</code>
                                      </div>
                                    )}
                                    {order.mappedProductBrand && (
                                      <div>
                                        <span className="text-muted-foreground">品牌:</span>
                                        <span className="ml-1">{order.mappedProductBrand}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* 增强：供应商匹配信息 */}
                              {order.supplierMatches && order.supplierMatches.length > 0 && (
                                <div className="col-span-2 mt-1 p-2 bg-blue-50 rounded border border-blue-100">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Building2 className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs font-medium text-blue-700">推荐供应商</span>
                                    <Badge variant="outline" className="text-[10px] py-0 bg-blue-50">
                                      {order.supplierMatches.length} 个供应商有货
                                    </Badge>
                                  </div>
                                  <div className="space-y-1">
                                    {order.supplierMatches.slice(0, 3).map((supplier, idx) => (
                                      <div 
                                        key={supplier.supplierId}
                                        className={`flex items-center justify-between text-xs p-1 rounded ${order.supplierId === supplier.supplierId ? 'bg-blue-100' : 'bg-white/50'}`}
                                      >
                                        <div className="flex items-center gap-2">
                                          <Badge 
                                            variant="outline" 
                                            className={`text-[10px] py-0 ${
                                              idx === 0 ? 'bg-emerald-500 text-white border-emerald-500' : ''
                                            }`}
                                          >
                                            {idx === 0 ? '推荐' : idx + 1}
                                          </Badge>
                                          <span className="font-medium">{supplier.supplierName}</span>
                                          {supplier.warehouseName && (
                                            <span className="text-muted-foreground">({supplier.warehouseName})</span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={supplier.stockQuantity <= 2 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                                            {supplier.stockQuantity}台
                                            {supplier.stockQuantity <= 2 && <AlertTriangle className="h-3 w-3 inline ml-1" />}
                                          </span>
                                          {supplier.stockPrice > 0 && (
                                            <span className="text-muted-foreground">¥{supplier.stockPrice.toFixed(2)}</span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* 未匹配提示 */}
                              {!order.mappedProductName && (
                                <div className="col-span-2 mt-1 p-2 bg-yellow-50 rounded border border-yellow-100">
                                  <div className="flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                    <span className="text-xs text-yellow-700">
                                      未匹配到系统商品，请检查SKU映射配置或手动选择商品
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Expanded details */}
                            {order.expanded && (
                              <div className="mt-3 pt-3 border-t space-y-2">
                                {/* 订单信息 */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">单据编号</Label>
                                    <Input
                                      value={order.billNo || ''}
                                      onChange={(e) => updateOrder(order.id, 'billNo', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="单据编号"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">客户订单号</Label>
                                    <Input
                                      value={order.orderNo || ''}
                                      onChange={(e) => updateOrder(order.id, 'orderNo', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="订单号"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">客户单据编号</Label>
                                    <Input
                                      value={order.customerOrderNo || ''}
                                      onChange={(e) => updateOrder(order.id, 'customerOrderNo', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="客户单据编号"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">发货供应商</Label>
                                    <Input
                                      value={order.supplierName || ''}
                                      onChange={(e) => updateOrder(order.id, 'supplierName', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="发货供应商"
                                    />
                                  </div>
                                </div>

                                {/* 客户商品信息 */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-medium text-orange-600">
                                    <Package className="h-3.5 w-3.5" />
                                    客户商品信息
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">客户商品名称</Label>
                                      <Input
                                        value={order.product_name || ''}
                                        onChange={(e) => updateOrder(order.id, 'product_name', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="客户订单中的商品名称"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">客户规格型号</Label>
                                      <Input
                                        value={order.product_spec || ''}
                                        onChange={(e) => updateOrder(order.id, 'product_spec', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="客户商品规格型号"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* 系统商品信息 */}
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                                    <Check className="h-3.5 w-3.5" />
                                    系统商品信息
                                  </div>
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    <div>
                                      <Label className="text-xs text-muted-foreground">系统商品编码</Label>
                                      <Input
                                        value={order.mappedProductCode || order.product_code || ''}
                                        onChange={(e) => updateOrder(order.id, 'product_code', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="系统商品编码"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">系统规格型号</Label>
                                      <Input
                                        value={order.mappedProductSpec || order.product_spec || ''}
                                        onChange={(e) => updateOrder(order.id, 'product_spec', e.target.value)}
                                        className="h-7 text-xs"
                                        placeholder="系统规格型号"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs text-muted-foreground">数量</Label>
                                      <Input
                                        type="number"
                                        value={order.quantity}
                                        onChange={(e) => updateOrder(order.id, 'quantity', parseInt(e.target.value) || 1)}
                                        className="h-7 text-xs"
                                      />
                                    </div>
                                  </div>
                                  {order.mappedProductName && (
                                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                                      <span className="text-muted-foreground">已匹配：</span>
                                      <span className="font-medium">{order.mappedProductName}</span>
                                      {order.mappedProductBrand && <span className="ml-2 text-muted-foreground">品牌：{order.mappedProductBrand}</span>}
                                    </div>
                                  )}
                                </div>

                                {/* 价格信息 */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">单价</Label>
                                    <Input
                                      type="number"
                                      value={order.price || ''}
                                      onChange={(e) => updateOrder(order.id, 'price', parseFloat(e.target.value) || undefined)}
                                      className="h-7 text-xs"
                                      placeholder="单价"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">价税合计</Label>
                                    <Input
                                      type="number"
                                      value={order.amount || ''}
                                      onChange={(e) => updateOrder(order.id, 'amount', parseFloat(e.target.value) || undefined)}
                                      className="h-7 text-xs"
                                      placeholder="价税合计"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">单台折让</Label>
                                    <Input
                                      type="number"
                                      value={order.discount || ''}
                                      onChange={(e) => updateOrder(order.id, 'discount', parseFloat(e.target.value) || undefined)}
                                      className="h-7 text-xs"
                                      placeholder="折让"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">税率(%)</Label>
                                    <Input
                                      type="number"
                                      value={order.taxRate || ''}
                                      onChange={(e) => updateOrder(order.id, 'taxRate', parseFloat(e.target.value) || undefined)}
                                      className="h-7 text-xs"
                                      placeholder="税率"
                                    />
                                  </div>
                                </div>

                                {/* 收货信息 */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">收货人</Label>
                                    <Input
                                      value={order.receiver_name || ''}
                                      onChange={(e) => updateOrder(order.id, 'receiver_name', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="收货人"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">收货电话</Label>
                                    <Input
                                      value={order.receiver_phone || ''}
                                      onChange={(e) => updateOrder(order.id, 'receiver_phone', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="电话"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs text-muted-foreground">收货地址</Label>
                                  <Input
                                    value={order.receiver_address || ''}
                                    onChange={(e) => updateOrder(order.id, 'receiver_address', e.target.value)}
                                    className="h-7 text-xs"
                                    placeholder="详细地址"
                                  />
                                </div>

                                {/* 快递信息 */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">快递公司</Label>
                                    <Input
                                      value={order.express_company || ''}
                                      onChange={(e) => updateOrder(order.id, 'express_company', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="快递公司"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">物流单号</Label>
                                    <Input
                                      value={order.tracking_no || ''}
                                      onChange={(e) => updateOrder(order.id, 'tracking_no', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="物流单号"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">仓库</Label>
                                    <Input
                                      value={order.warehouse || ''}
                                      onChange={(e) => updateOrder(order.id, 'warehouse', e.target.value)}
                                      className="h-7 text-xs"
                                      placeholder="仓库"
                                    />
                                  </div>
                                </div>

                                {/* 人员信息 */}
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">业务员</Label>
                                    <Input
                                      value={order.salesperson || salespersonName || ''}
                                      onChange={(e) => {
                                        updateOrder(order.id, 'salesperson', e.target.value);
                                        if (!e.target.value) {
                                          updateOrder(order.id, 'salespersonId', '');
                                        }
                                      }}
                                      className="h-7 text-xs"
                                      placeholder="业务员"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">跟单员</Label>
                                    <Input
                                      value={order.operator || operatorName || ''}
                                      onChange={(e) => {
                                        updateOrder(order.id, 'operator', e.target.value);
                                        if (!e.target.value) {
                                          updateOrder(order.id, 'operatorId', '');
                                        }
                                      }}
                                      className="h-7 text-xs"
                                      placeholder="跟单员"
                                    />
                                  </div>
                                </div>

                                {/* 供应商选择 */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-xs text-muted-foreground">分配供应商</Label>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => handleMatchSupplier(order.id)}
                                      disabled={isMatchingSupplier || !order.product_name}
                                    >
                                      {isMatchingSupplier && matchingSupplierOrderId === order.id ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <Sparkles className="h-3 w-3 mr-1" />
                                      )}
                                      智能匹配
                                    </Button>
                                  </div>
                                  
                                  {/* 匹配结果 - 表格形式展示 */}
                                  {supplierMatchResults[order.id]?.availableSuppliers && 
                                   supplierMatchResults[order.id]!.availableSuppliers.length > 0 && (
                                    <div className="space-y-2">
                                      {/* 新商品提示 */}
                                      {supplierMatchResults[order.id]?.newProductHint && (
                                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                                          <AlertTriangle className="h-3 w-3 inline mr-1" />
                                          {supplierMatchResults[order.id]!.newProductHint}
                                        </div>
                                      )}
                                      {/* 供应商表格 */}
                                      <div className="border rounded overflow-hidden">
                                        <Table>
                                          <TableHeader>
                                            <TableRow className="bg-muted/30">
                                              <TableHead className="w-8"></TableHead>
                                              <TableHead>供应商</TableHead>
                                              <TableHead>省份</TableHead>
                                              <TableHead>商品编码</TableHead>
                                              <TableHead>商品名称</TableHead>
                                              <TableHead className="text-right">库存</TableHead>
                                              <TableHead className="text-right">单价</TableHead>
                                              <TableHead className="text-right">历史成本</TableHead>
                                            </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                            {supplierMatchResults[order.id]!.availableSuppliers.map((supplier, idx) => (
                                              <TableRow 
                                                key={supplier.supplierId}
                                                className={`cursor-pointer hover:bg-muted/50 ${order.supplierId === supplier.supplierId ? 'bg-primary/5' : ''} ${supplier.hasStock === false ? 'opacity-60' : ''}`}
                                                onClick={() => handleSupplierChange(order.id, supplier.supplierId)}
                                              >
                                                <TableCell>
                                                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                                    order.supplierId === supplier.supplierId ? 'border-primary bg-primary' : 'border-muted-foreground'
                                                  }`}>
                                                    {order.supplierId === supplier.supplierId && (
                                                      <div className="h-2 w-2 rounded-full bg-white" />
                                                    )}
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <div className="flex items-center gap-1">
                                                    {supplier.hasStock === false && (
                                                      <Badge variant="outline" className="bg-gray-100 text-gray-600 border-gray-300 text-[10px] py-0 px-1 mr-1">无库存</Badge>
                                                    )}
                                                    {idx === 0 && supplier.hasStock !== false && (
                                                      <Badge variant="default" className="bg-emerald-500 text-[10px] py-0 px-1 mr-1">推荐</Badge>
                                                    )}
                                                    <span className="font-medium text-xs">{supplier.supplierName}</span>
                                                  </div>
                                                </TableCell>
                                                <TableCell>
                                                  <Badge 
                                                    variant="outline" 
                                                    className={`text-[10px] ${
                                                      supplier.provinceMatch === '同省' ? 'border-green-500 text-green-600 bg-green-50' :
                                                      supplier.provinceMatch === '邻近' ? 'border-blue-500 text-blue-600 bg-blue-50' :
                                                      supplier.provinceMatch === '较远' ? 'border-orange-500 text-orange-600 bg-orange-50' :
                                                      'border-gray-300'
                                                    }`}
                                                  >
                                                    {supplier.provinceMatch || '未知'}
                                                  </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs font-mono">{supplier.productCode || '-'}</TableCell>
                                                <TableCell className="text-xs max-w-[120px] truncate">{supplier.productName || '-'}</TableCell>
                                                <TableCell className={`text-right text-xs ${supplier.quantity <= 2 ? 'text-orange-600' : ''}`}>
                                                  {supplier.quantity > 0 ? `${supplier.quantity}台` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                  {supplier.price > 0 ? `¥${supplier.price.toFixed(2)}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                  {supplier.historyCost !== null && supplier.historyCost !== undefined ? `¥${supplier.historyCost.toFixed(2)}` : '-'}
                                                </TableCell>
                                              </TableRow>
                                            ))}
                                          </TableBody>
                                        </Table>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {/* 当前选中的供应商 */}
                                  <Select
                                    value={order.supplierId || 'none'}
                                    onValueChange={(v) => handleSupplierChange(order.id, v === 'none' ? '' : v)}
                                  >
                                    <SelectTrigger className="h-7 text-xs">
                                      <SelectValue placeholder="请选择供应商" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">请选择供应商</SelectItem>
                                      {suppliers.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                          {s.name}
                                          {s.province && `（${s.province}）`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* 备注 */}
                                <div>
                                  <Label className="text-xs text-muted-foreground">备注</Label>
                                  <Input
                                    value={order.remark || ''}
                                    onChange={(e) => updateOrder(order.id, 'remark', e.target.value)}
                                    className="h-7 text-xs"
                                    placeholder="备注信息"
                                  />
                                </div>

                                {/* SKU映射信息 */}
                                {order.mappedProductName && (
                                  <div className="bg-muted/50 p-2 rounded text-xs">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Star className="h-3 w-3 text-primary" />
                                      <span className="font-medium">SKU映射结果</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                                      <span>系统商品:</span>
                                      <span>{order.mappedProductName}</span>
                                      <span>商品编码:</span>
                                      <span>{order.mappedProductCode || '-'}</span>
                                      <span>客户SKU:</span>
                                      <span>{order.customerSku || '-'}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>暂无解析结果</p>
                <p className="text-sm">上传Excel或输入文本进行解析</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Import Result Dialog */}
      <Dialog open={importResult?.open} onOpenChange={(open) => importResult && setImportResult({ ...importResult, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {importResult?.success ? (
                <>
                  {importResult.total > 0 ? (
                    <>
                      <Check className="h-5 w-5 text-green-500" />
                      订单导入成功
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      未创建新订单
                    </>
                  )}
                </>
              ) : (
                <>
                  <X className="h-5 w-5 text-destructive" />
                  导入失败
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {importResult?.message}
            </DialogDescription>
          </DialogHeader>
          {importResult?.success && (
              <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-3 text-xs sm:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-muted-foreground">本次创建</p>
                  <p className="font-medium">{importResult.total} 条订单</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground">关联客户</p>
                  <p className="font-medium">{importResult.customerName || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">导入批次</p>
                <p className="font-medium break-all">{importResult.importBatch || '-'}</p>
              </div>
            </div>
          )}
          {importResult?.success && importResult.total === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              本次没有创建新订单，当前结果主要用于复盘重复记录和匹配情况。
            </div>
          )}
          {importResult?.success && importResult.matchStats && (
            <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs">
              <div className="flex items-center gap-1 font-medium text-blue-800">
                <BarChart3 className="h-3.5 w-3.5" />
                商品匹配统计
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded border bg-white px-2 py-1">
                  <div className="text-muted-foreground">已匹配</div>
                  <div className="font-medium text-green-700">{importResult.matchStats.matched}</div>
                </div>
                <div className="rounded border bg-white px-2 py-1">
                  <div className="text-muted-foreground">未匹配</div>
                  <div className="font-medium text-orange-700">{importResult.matchStats.none}</div>
                </div>
                <div className="rounded border bg-white px-2 py-1">
                  <div className="text-muted-foreground">匹配率</div>
                  <div className="font-medium text-blue-700">{importResult.matchStats.matchRate}</div>
                </div>
                <div className="rounded border bg-white px-2 py-1">
                  <div className="text-muted-foreground">映射匹配</div>
                  <div className="font-medium text-blue-700">{importResult.matchStats.byMapping}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {importResult.matchStats.bySpec > 0 && (
                  <Badge variant="outline" className="border-blue-300 bg-white text-blue-800">
                    规格匹配 {importResult.matchStats.bySpec}
                  </Badge>
                )}
                {importResult.matchStats.byName > 0 && (
                  <Badge variant="outline" className="border-blue-300 bg-white text-blue-800">
                    名称匹配 {importResult.matchStats.byName}
                  </Badge>
                )}
              </div>
            </div>
          )}
          {importResult?.success && importResult.duplicateSummary && importResult.duplicateSummary.totalSkipped > 0 && (
            <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs">
              <div className="flex items-center gap-1 font-medium text-amber-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                已跳过重复记录 {importResult.duplicateSummary.totalSkipped} 条
              </div>
              <div className="flex flex-wrap gap-2">
                {importResult.duplicateSummary.batchDuplicateCount > 0 && (
                  <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                    同批重复 {importResult.duplicateSummary.batchDuplicateCount}
                  </Badge>
                )}
                {importResult.duplicateSummary.existingDuplicateCount > 0 && (
                  <Badge variant="outline" className="border-amber-300 bg-white text-amber-800">
                    系统已存在 {importResult.duplicateSummary.existingDuplicateCount}
                  </Badge>
                )}
              </div>
              <ScrollArea className="h-[120px] rounded border bg-white">
                <div className="space-y-2 p-2">
                  {importResult.duplicateSummary.details.map((item, index) => (
                    <div key={`${item.orderNo}-${index}`} className="rounded border px-2 py-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{item.orderNo || '未提供订单号'}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.reason === 'batch_duplicate' ? '同批重复' : '系统已存在'}
                        </Badge>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        收货人：{item.receiverName || '未填写'}
                        {item.existingSysOrderNo ? ` | 已存在系统单号：${item.existingSysOrderNo}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          {importResult?.success && importResult.sysOrderNos && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-sm">系统订单号</Label>
                {importResult.sysOrderNos.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => copyToClipboard(importResult.sysOrderNos.join('\n'))}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    全部复制
                  </Button>
                )}
              </div>
              <ScrollArea className="h-[100px] border rounded">
                <div className="p-2 text-xs space-y-1">
                  {importResult.sysOrderNos.map((no, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span>{no}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={() => copyToClipboard(no)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setImportResult(null)}
            >
              继续录入
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const importBatch = importResult?.importBatch;
                window.location.href = importBatch
                  ? `/orders?importBatch=${encodeURIComponent(importBatch)}&status=pending`
                  : '/orders?status=pending';
              }}
            >
              查看本批待派发
            </Button>
            <Button
              onClick={() => {
                const importBatch = importResult?.importBatch;
                window.location.href = importBatch
                  ? `/orders?importBatch=${encodeURIComponent(importBatch)}`
                  : '/orders';
              }}
            >
              查看本批全部
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mapping History Dialog */}
      <Dialog open={showMappingDialog} onOpenChange={setShowMappingDialog}>
        <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              映射配置历史
            </DialogTitle>
            <DialogDescription>
              选择历史版本恢复映射配置
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索版本或备注..."
                value={mappingSearchTerm}
                onChange={(e) => setMappingSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <ScrollArea className="h-[300px]">
              {filteredHistory.length > 0 ? (
                <div className="space-y-2">
                  {filteredHistory.map((h) => {
                    const compatibility = getHistoryCompatibility(h);
                    return (
                    <div
                      key={h.id}
                      className="flex flex-col gap-3 rounded-lg border p-3 hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={h.is_active ? 'default' : 'outline'}>
                            v{h.version}
                          </Badge>
                          {h.is_active && (
                            <Badge variant="secondary" className="text-xs">
                              当前
                            </Badge>
                          )}
                          {h.header_fingerprint && (
                            <Badge variant="outline" className="text-[10px]">
                              表头 {h.header_fingerprint}
                            </Badge>
                          )}
                          {compatibility && (
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px]',
                                compatibility.isAligned ? 'border-green-200 text-green-700' : 'border-orange-200 text-orange-700'
                              )}
                            >
                              {compatibility.label}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(h.created_at).toLocaleString('zh-CN')}
                          {h.created_by && (
                            <>
                              <span>|</span>
                              <span>{h.created_by}</span>
                            </>
                          )}
                        </div>
                        {h.remark && (
                          <p className="text-xs text-muted-foreground">{h.remark}</p>
                        )}
                        {h.template_signature && (
                          <p className="text-[11px] text-muted-foreground">
                            模板签名: {h.template_signature}
                          </p>
                        )}
                      </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8"
                          onClick={() => restoreMapping(h.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          应用配置
                        </Button>
                        {!h.is_active && (
                          <Button
                            size="sm"
                            className="h-8"
                            onClick={() => restoreMapping(h.id)}
                          >
                            <History className="h-4 w-4 mr-1" />
                            恢复
                          </Button>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  暂无历史记录
                </div>
              )}
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMappingDialog(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageGuard>
  );
}
