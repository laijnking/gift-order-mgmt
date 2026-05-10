'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// sessionStorage key，用于在路由变化导致组件重新挂载时恢复工作状态
const SESSION_KEY = 'order_parse_session_v2';

interface SessionState {
  selectedCustomer: string;
  salespersonId: string;
  operatorId: string;
  salespersonName: string;
  operatorName: string;
  inputMode: 'text' | 'excel';
  inputText: string;
  headerRow: number;
  columnMapping: Record<string, string>;
  parsedOrders: ParsedOrder[];
  parseStats: {
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
  } | null;
  parseResult: { duration: number; rawOutput?: string } | null;
  excelSheetNames: string[];
  selectedSheet: string;
  excelRows: string[][];
  excelPreview: string[][];
  excelFileName: string;
  excelFileSize: number;
  mappingAutoLoaded: boolean;
  mappingAutoLoadedId: string | null;
  supplierMatchResults: Record<string, {
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
  }>;
  savedAt: number;
  mappingCollapsed: boolean;
}

function saveSession(state: Partial<SessionState>) {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    const prev: SessionState | null = existing ? JSON.parse(existing) : null;
    const next: SessionState = {
      selectedCustomer: state.selectedCustomer ?? prev?.selectedCustomer ?? '',
      salespersonId: state.salespersonId ?? prev?.salespersonId ?? '',
      operatorId: state.operatorId ?? prev?.operatorId ?? '',
      salespersonName: state.salespersonName ?? prev?.salespersonName ?? '',
      operatorName: state.operatorName ?? prev?.operatorName ?? '',
      inputMode: state.inputMode ?? prev?.inputMode ?? 'excel',
      inputText: state.inputText ?? prev?.inputText ?? '',
      headerRow: state.headerRow ?? prev?.headerRow ?? 0,
      columnMapping: state.columnMapping ?? prev?.columnMapping ?? {},
      parsedOrders: state.parsedOrders ?? prev?.parsedOrders ?? [],
      parseStats: state.parseStats ?? prev?.parseStats ?? null,
      parseResult: state.parseResult ?? prev?.parseResult ?? null,
      excelSheetNames: state.excelSheetNames ?? prev?.excelSheetNames ?? [],
      selectedSheet: state.selectedSheet ?? prev?.selectedSheet ?? '',
      excelRows: state.excelRows ?? prev?.excelRows ?? [],
      excelPreview: state.excelPreview ?? prev?.excelPreview ?? [],
      excelFileName: state.excelFileName ?? prev?.excelFileName ?? '',
      excelFileSize: state.excelFileSize ?? prev?.excelFileSize ?? 0,
      mappingAutoLoaded: state.mappingAutoLoaded ?? prev?.mappingAutoLoaded ?? false,
      mappingAutoLoadedId: state.mappingAutoLoadedId ?? prev?.mappingAutoLoadedId ?? null,
      supplierMatchResults: state.supplierMatchResults ?? prev?.supplierMatchResults ?? {},
      savedAt: Date.now(),
      mappingCollapsed: state.mappingCollapsed ?? prev?.mappingCollapsed ?? false,
    };
    // 超过2小时的会话数据不再恢复
    if (Date.now() - next.savedAt < 2 * 60 * 60 * 1000) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    }
  } catch {
    // 序列化失败时静默忽略
  }
}

function loadSession(): Partial<SessionState> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SessionState;
    // 超过2小时的会话数据视为过期
    if (Date.now() - data.savedAt > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { PageGuard } from '@/components/auth/page-guard';
import { buildUserInfoHeaders } from '@/lib/auth';
import { autoDetectColumnMapping, normalizeHeadersForCompare as normalizeHeadersForCompareFn, getColumnMappingDiagnostics, buildHeaderFingerprint } from '@/lib/column-mapping-rules';
import { flattenBundleDraftsToFlatOrders } from '@/lib/order-parse-bundles';
import { buildExcelPreviewRows, normalizeExcelSheetRows, resolveExcelParsePayload } from '@/lib/order-parse-excel';
import { findUserByIdOrName, getUserDisplayName, isOperatorAssignableRole, isSalesAssignableRole } from '@/lib/roles';
import type { ParsedOrderBundleDraft, ParsedOrderDraft } from '@/types/order-parse';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  CheckCircle,
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
import { ProductPickerDialog } from '@/components/product/product-picker-dialog';
import type { ProductPickerItem } from '@/components/product/product-picker-dialog';
import { HelpGuide, HelpSection, HelpSteps, HelpNote, HelpLinks } from '@/components/ui/help-guide';
import { InputPanel } from './components/input-panel';
import type { InputPanelProps } from './components/input-panel';
import { CustomerSelector } from './components/customer-selector';
import { OrderPreviewPanel } from './components/order-preview-panel';
import { ImportResultDialog } from './components/import-result-dialog';
import { MappingHistoryDialog } from './components/mapping-history-dialog';
import { useOrderSubmit } from './hooks/use-order-submit';
import type { DuplicateSummary, MatchStatsSummary } from './hooks/use-order-submit';

// 字段选项定义
const COLUMN_OPTIONS = [
  { value: 'bill_date', label: '单据日期', group: '基础信息' },
  { value: 'customer_order_no', label: '客户单据编号', group: '基础信息' },
  { value: 'supplier_order_no', label: '发货方单据号', group: '基础信息' },
  { value: 'customer_code', label: '客户代码', group: '基础信息' },
  { value: 'customer_name', label: '客户名称', group: '基础信息' },
  { value: 'supplier_name', label: '发货方', group: '基础信息' },
  { value: 'suggested_shipper', label: '建议发货方', group: '基础信息' },
  { value: 'channel_remark', label: '渠道备注', group: '基础信息' },
  { value: 'original_status', label: '原订单状态', group: '基础信息' },
  { value: 'salesperson', label: '业务员', group: '人员信息' },
  { value: 'operator', label: '跟单员', group: '人员信息' },
  { value: 'customer_product_name', label: '客户商品名称', group: '商品信息' },
  { value: 'customer_product_code', label: '客户商品编码', group: '商品信息' },
  { value: 'customer_product_spec', label: '客户商品型号', group: '商品信息' },
  { value: 'barcode', label: '商品条码', group: '商品信息' },
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
  'customer_order_no',           // 客户单据编号
  'customer_product_name',       // 商品名称
  'customer_product_spec',       // 商品型号
  'customer_product_code',       // 客户商品编码
  'quantity',                    // 数量
  'price',                       // 单价
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
  mapping_config?: Record<string, string>;
  feedback_export_headers?: Record<string, string>;
}

interface SubmitValidationSummary {
  invalidOrderIds: string[];
  missingProductNameCount: number;
  missingReceiverCount: number;
  missingPhoneCount: number;
  missingAddressCount: number;
  missingSupplierCount: number;
}

function normalizeBundleDraftsForPage(
  bundles: Array<Record<string, unknown>>
): ParsedOrderDetail[] {
  return bundles.map((bundle, index) => ({
    ...bundle,
    id: String(bundle.id || `parsed_${Date.now()}_${index}`),
    orderNo: String(bundle.orderNo || ''),
    customerOrderNo: String(bundle.customerOrderNo || ''),
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
    channelRemark: String(bundle.channelRemark || ''),
    suggestedShipper: String(bundle.suggestedShipper || ''),
    originalStatus: String(bundle.originalStatus || ''),
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
    id: order.id || `${idPrefix}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 6)}`,
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

      // 核心必填字段缺失才算无效（收货人/电话/地址，发货方可留空走待派发）
      if (
        missingProductName ||
        missingReceiver ||
        missingPhone ||
        missingAddress
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
  // 尝试从 sessionStorage 恢复工作状态（路由变化后组件重新挂载时）
  const _restored = loadSession();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(_restored?.selectedCustomer ?? '');
  const [salespersonId, setSalespersonId] = useState<string>(_restored?.salespersonId ?? '');
  const [operatorId, setOperatorId] = useState<string>(_restored?.operatorId ?? '');
  const [salespersonName, setSalespersonName] = useState<string>(_restored?.salespersonName ?? '');
  const [operatorName, setOperatorName] = useState<string>(_restored?.operatorName ?? '');
  const [inputMode, setInputMode] = useState<'text' | 'excel'>(_restored?.inputMode ?? 'excel');
  const [inputText, setInputText] = useState<string>(_restored?.inputText ?? '');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelRows, setExcelRows] = useState<string[][]>(_restored?.excelRows ?? []);
  const [excelPreview, setExcelPreview] = useState<string[][]>(_restored?.excelPreview ?? []);
  const [excelFileName, setExcelFileName] = useState<string>(_restored?.excelFileName ?? '');
  const [excelFileSize, setExcelFileSize] = useState<number>(_restored?.excelFileSize ?? 0);
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>(_restored?.excelSheetNames ?? []);
  const [selectedSheet, setSelectedSheet] = useState<string>(_restored?.selectedSheet ?? '');
  const [headerRow, setHeaderRow] = useState<number>(_restored?.headerRow ?? 0);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>(_restored?.columnMapping ?? {});
  const [parsedOrders, setParsedOrders] = useState<ParsedOrder[]>(_restored?.parsedOrders ?? []);
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
  } | null>(_restored?.parseStats ?? null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { isSubmitting, submitOrders } = useOrderSubmit();
  const [parseResult, setParseResult] = useState<{
    duration: number;
    rawOutput?: string;
  } | null>(_restored?.parseResult ?? null);
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
  const [mappingAutoLoaded, setMappingAutoLoaded] = useState(_restored?.mappingAutoLoaded ?? false);
  const [mappingCollapsed, setMappingCollapsed] = useState(_restored?.mappingCollapsed ?? false);
  const [mappingAutoLoadedId, setMappingAutoLoadedId] = useState<string | null>(_restored?.mappingAutoLoadedId ?? null);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [textInputCollapsed, setTextInputCollapsed] = useState(true);
  const salesUsers = users.filter((user) => isSalesAssignableRole(user.role));
  const operatorUsers = users.filter((user) => isOperatorAssignableRole(user.role));

  // 发货方匹配状态
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
  }>>(_restored?.supplierMatchResults ?? {});
  const [matchingSupplierOrderId, setMatchingSupplierOrderId] = useState<string | null>(null);
  const [isMatchingSupplier, setIsMatchingSupplier] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productPickerOrderId, setProductPickerOrderId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 优化后的自动检测列映射逻辑
  // autoDetectColumnMapping is a pure function — stable reference, no useCallback wrapper needed
  const autoDetectMapping = useCallback(
    (headers: string[]) => autoDetectColumnMapping(headers),
    [autoDetectColumnMapping]
  );

  const normalizeHeadersForCompare = useCallback(
    (headers: string[]) => normalizeHeadersForCompareFn(headers),
    [normalizeHeadersForCompareFn]
  );

  const loadCustomers = async () => {
    try {
      const res = await fetch('/api/customers?isActive=false', { headers: buildUserInfoHeaders() });
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
      console.error('加载发货方失败:', error);
    }
  };

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

  // 关键工作状态变更时自动保存到 sessionStorage
  // 在路由变化（Next.js 客户端导航）导致组件重新挂载后，状态从 sessionStorage 恢复
  useEffect(() => {
    saveSession({
      selectedCustomer,
      salespersonId,
      operatorId,
      salespersonName,
      operatorName,
      inputMode,
      inputText,
      headerRow,
      columnMapping,
      parsedOrders,
      parseStats,
      parseResult,
      excelSheetNames,
      selectedSheet,
      excelRows,
      excelPreview,
      excelFileName,
      excelFileSize,
      mappingAutoLoaded,
      mappingAutoLoadedId,
      supplierMatchResults,
    });
  }, [
    selectedCustomer,
    salespersonId,
    operatorId,
    salespersonName,
    operatorName,
    inputMode,
    inputText,
    headerRow,
    columnMapping,
    parsedOrders,
    parseStats,
    parseResult,
    excelSheetNames,
    selectedSheet,
    excelRows,
    excelPreview,
    excelFileName,
    excelFileSize,
      mappingAutoLoaded,
      mappingAutoLoadedId,
      supplierMatchResults,
      mappingCollapsed,
    ]);

  // 恢复会话时显示提示
  useEffect(() => {
    const restored = _restored;
    if (!restored) return;
    const hasWork = restored.parsedOrders && restored.parsedOrders.length > 0;
    if (hasWork) {
      toast.info(`已恢复上次的录入数据（${restored.parsedOrders!.length} 条订单）`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 避免覆盖用户手动映射或自动加载的历史映射
  useEffect(() => {
    // 只有当 columnMapping 为空时才自动检测（首次加载或清除后）
    if (excelPreview.length > headerRow && Object.keys(columnMapping).length === 0) {
      const detected = autoDetectMapping(excelPreview[headerRow]);
      setColumnMapping(detected);
    }
  }, [headerRow, excelPreview, autoDetectMapping, columnMapping]);

  // 自动加载历史映射：按 fingerprint 精确匹配
  const autoLoadMappingByFingerprint = useCallback(async (customerCode: string) => {
    const currentHeaders = excelPreview[headerRow] || [];
    if (currentHeaders.length === 0) {
      setActiveMappingMeta(null);
      return;
    }

    const normalizedHeaders = normalizeHeadersForCompare(currentHeaders);
    // 使用与后端一致的 SHA256 指纹计算方式
    const fingerprint = buildHeaderFingerprint(currentHeaders);

    try {
      const res = await fetch(
        `/api/column-mappings/history?customerCode=${encodeURIComponent(customerCode)}&fingerprint=${encodeURIComponent(fingerprint)}`,
        { headers: buildUserInfoHeaders() }
      );
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        const savedMapping = data.data[0];
        // 再次确认列名完全一致
        const savedHeaders = normalizeHeadersForCompare(savedMapping.source_headers || []);
        if (JSON.stringify(normalizedHeaders) === JSON.stringify(savedHeaders)) {
          setColumnMapping(savedMapping.mapping_config || {});
          setActiveMappingMeta(savedMapping);
          setMappingAutoLoaded(true);
          setMappingAutoLoadedId(savedMapping.id);
          setMappingCollapsed(true); // 折叠列表
          toast.success(`已自动加载历史映射 (v${savedMapping.version})，${Object.keys(savedMapping.mapping_config || {}).length} 列已配置`);
        }
      } else {
        // 无匹配映射，重置状态
        setActiveMappingMeta(null);
        setMappingAutoLoaded(false);
        setMappingAutoLoadedId(null);
        setMappingCollapsed(false);
      }
    } catch (error) {
      console.error('自动加载历史映射失败:', error);
    }
  }, [excelPreview, headerRow, normalizeHeadersForCompare]);

  // 加载映射历史版本
  const loadMappingHistory = useCallback(async (customerCode: string) => {
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
  }, []);

  // 选择客户时：优先按 fingerprint 自动加载历史映射
  useEffect(() => {
    if (selectedCustomer) {
      loadMappingHistory(selectedCustomer);
      autoLoadMappingByFingerprint(selectedCustomer);
    } else {
      setActiveMappingMeta(null);
      setMappingHistory([]);
      setColumnMapping({});
      setMappingAutoLoaded(false);
      setMappingAutoLoadedId(null);
      setMappingCollapsed(false);
    }
  }, [selectedCustomer, autoLoadMappingByFingerprint, loadMappingHistory]);

  // 当 Excel 文件上传后（excelPreview 就绪），也尝试按 fingerprint 自动加载历史映射
  // 这解决「先选客户后上传文件」场景下映射未自动加载的问题
  useEffect(() => {
    if (
      selectedCustomer &&
      excelPreview.length > headerRow &&
      (excelPreview[headerRow]?.length ?? 0) > 0 &&
      !mappingAutoLoaded
    ) {
      autoLoadMappingByFingerprint(selectedCustomer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [excelPreview, headerRow]);

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
    setExcelFileName(file.name);
    setExcelFileSize(file.size);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        setExcelSheetNames(workbook.SheetNames);

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        setSelectedSheet(workbook.SheetNames[0]);
        const jsonData = XLSX.utils.sheet_to_json<Array<string | number | boolean | null | undefined>>(firstSheet, { header: 1 });
        const normalizedRows = normalizeExcelSheetRows(jsonData);
        const preview = buildExcelPreviewRows(normalizedRows);
        setExcelRows(normalizedRows);
        setExcelPreview(preview);

        // 重置自动匹配标志，确保新上传文件能重新触发 fingerprint 匹配
        setMappingAutoLoaded(false);
        setMappingAutoLoadedId(null);

        // 自动检测列映射
        if (preview.length > 0) {
          const detected = autoDetectMapping(preview[0]);
          setColumnMapping(detected);
        }
      } catch (error) {
        console.error('[handleExcelUpload] Excel解析失败:', error);
        toast.error('Excel文件解析失败');
      }
    };
    reader.readAsArrayBuffer(file);
  }, [autoDetectMapping]);

  const handleSheetChange = useCallback((sheetName: string) => {
    setSelectedSheet(sheetName);
    // 切换 sheet 时清除旧的映射，避免不同 sheet 的列结构混淆
    setColumnMapping({});
    setHeaderRow(0);
    setMappingAutoLoaded(false);
    setMappingAutoLoadedId(null);
    if (!excelFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Array<string | number | boolean | null | undefined>>(sheet, { header: 1 });
        const normalizedRows = normalizeExcelSheetRows(jsonData);
        const preview = buildExcelPreviewRows(normalizedRows);
        setExcelRows(normalizedRows);
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

  // 解析Excel为订单（增强版，支持SKU映射和发货方匹配）
  const handleParseExcel = async () => {
    if (excelPreview.length < 2) {
      toast.error('Excel数据不足，请先上传Excel文件');
      return;
    }

    if (!selectedCustomer) {
      toast.error('请先选择关联客户');
      return;
    }

    setIsLoading(true);
    setParseResult(null);

    try {
      const startTime = Date.now();
      const { headers, dataRows } = resolveExcelParsePayload(excelRows, excelPreview, headerRow);
      const mappingDiagnostics = getColumnMappingDiagnostics(headers, columnMapping);

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
    setExcelFileName('');
    setExcelFileSize(0);
    setExcelRows([]);
    setExcelPreview([]);
    setExcelSheetNames([]);
    setSelectedSheet('');
    setParsedOrders([]);
    setParseStats(null);
    setParseResult(null);
    setSupplierMatchResults({});
    setMatchingSupplierOrderId(null);
    setIsMatchingSupplier(false);
    setMappingAutoLoaded(false);
    setMappingAutoLoadedId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    // 清除会话存储
    sessionStorage.removeItem(SESSION_KEY);
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

  // Bridge alias for OrderPreviewPanel props interface compatibility
  const updateOrderField = updateOrder;

  // 打开商品选择器（用于手动选择系统商品）
  const openProductPicker = (orderId: string) => {
    setProductPickerOrderId(orderId);
    setProductPickerOpen(true);
  };

  // 商品选择器选中商品后更新订单
  const handleProductSelect = (product: ProductPickerItem | null) => {
    if (!product || !productPickerOrderId) return;
    setParsedOrders(orders =>
      orders.map(o =>
        o.id === productPickerOrderId
          ? {
              ...o,
              mappedProductCode: product.code,
              mappedProductName: product.name,
              mappedProductSpec: product.spec || '',
              mappedProductBrand: product.brand || '',
              systemProductId: product.id,
              // 同步到 product_code 字段（保持兼容）
              product_code: product.code,
            }
          : o
      )
    );
    setProductPickerOrderId(null);
  };

  // Bridge: handles product selection from any OrderCard-level product picker
  const handleProductSelectFromDialog = (_orderId: string, product: ProductPickerItem | null) => {
    if (!product || !_orderId) return;
    setParsedOrders(orders =>
      orders.map(o =>
        o.id === _orderId
          ? {
              ...o,
              mappedProductCode: product.code,
              mappedProductName: product.name,
              mappedProductSpec: product.spec || '',
              mappedProductBrand: product.brand || '',
              systemProductId: product.id,
              product_code: product.code,
            }
          : o
      )
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
        id: `copy_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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
        id: `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
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

  // 智能匹配发货方
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
        } else if (item.allSupplierOptions && item.allSupplierOptions.length > 0) {
          // 没有推荐发货方但有候选发货方时，自动选中第一个
          handleSupplierChange(orderId, item.allSupplierOptions[0].supplierId);
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
          } else if (item.allSupplierOptions && item.allSupplierOptions.length > 0) {
            // 没有推荐发货方（商品无库存匹配）但有候选发货方时，自动选中第一个
            handleSupplierChange(item.orderId, item.allSupplierOptions[0].supplierId);
          }
        });
        setSupplierMatchResults(newResults);
        
        toast.success(`已完成 ${data.data.length} 条订单的发货方匹配`);
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
    // 核心字段缺失（收货人/电话/地址）仍阻止提交
    const coreInvalidCount = validation.invalidOrderIds.length;
    const missingSupplierCount = validation.missingSupplierCount;

    if (coreInvalidCount > 0) {
      const missingLabels: string[] = [];
      if (validation.missingReceiverCount > 0) missingLabels.push('收货人');
      if (validation.missingPhoneCount > 0) missingLabels.push('收货电话');
      if (validation.missingAddressCount > 0) missingLabels.push('收货地址');

      toast.error(
        `还有 ${coreInvalidCount} 条选中订单缺少核心信息${missingLabels.length > 0 ? `：${missingLabels.join('、')}` : ''}，请补全后再提交`
      );
      return;
    }

    // 发货方缺失时给出提示，但允许提交（订单将标记为待派发）
    if (missingSupplierCount > 0) {
      toast.warning(
        `有 ${missingSupplierCount} 条订单未选择发货发货方，提交后将标记为「待派发」状态，可后续由业务员线下采购后再调整`
      );
    }

    // 比较当前映射与活动映射是否一致，一致则跳过保存
    const currentSourceHeaders = normalizeHeadersForCompare(excelPreview[headerRow] || []);
    const activeSourceHeaders = normalizeHeadersForCompare(activeMappingMeta?.source_headers || []);
    const isMappingUnchanged = activeMappingMeta?.mapping_config &&
      headerRow === activeMappingMeta.header_row &&
      JSON.stringify(columnMapping) === JSON.stringify(activeMappingMeta.mapping_config) &&
      JSON.stringify(currentSourceHeaders) === JSON.stringify(activeSourceHeaders);

    submitOrders(parsedOrders, {
      customerCode: selectedCustomer,
      customerName: customers.find(c => c.code === selectedCustomer)?.name || '',
      salespersonId: salespersonId || '',
      salespersonName: salespersonName || '',
      operatorId: operatorId || '',
      operatorName: operatorName || '',
      columnMapping,
      headerRow,
      excelPreview,
      skipMappingSave: isMappingUnchanged,
      onSuccess: (result) => {
        setImportResult(result);
        handleClear();
      },
      onError: (message) => {
        toast.error(message);
      },
      onFinally: () => {
        // isSubmitting is managed by the hook
      },
    });
  };

  // 过滤映射历史
  const filteredHistory = mappingHistory.filter(h =>
    !mappingSearchTerm ||
    `v${h.version}`.includes(mappingSearchTerm) ||
    h.remark?.includes(mappingSearchTerm) ||
    h.created_by?.includes(mappingSearchTerm)
  );

  const submitValidation = useMemo(() => getSubmitValidationSummary(parsedOrders), [parsedOrders]);
  const selectedValidOrderCount = useMemo(() => {
    return parsedOrders.filter((order) => order.selected).length - submitValidation.invalidOrderIds.length;
  }, [parsedOrders, submitValidation]);

  // === Bridge functions: component props → page state ===

  const handleCustomerChange = (code: string, customer: Customer) => {
    setSelectedCustomer(code);
    setActiveMappingMeta(null);
    loadMappingHistory(code);
    autoLoadMappingByFingerprint(code);
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
  };

  const handleSelectAll = (selected: boolean) => {
    setParsedOrders((prev) => prev.map((o) => ({ ...o, selected })));
  };

  const handleMappingChange: InputPanelProps['onMappingChange'] = (val) => {
    if (typeof val === 'function') {
      setColumnMapping(val(columnMapping));
    } else {
      setColumnMapping(val);
    }
  };

  const handleRemoveFile = () => {
    setExcelFile(null);
    setExcelFileName('');
    setExcelFileSize(0);
    setExcelRows([]);
    setExcelPreview([]);
    setExcelSheetNames([]);
    setSelectedSheet('');
    setColumnMapping({});
    setMappingAutoLoaded(false);
    setMappingAutoLoadedId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReDetectMapping = () => {
    const detected = autoDetectMapping(excelPreview[headerRow] || []);
    setColumnMapping(detected);
    setMappingAutoLoaded(false);
    setMappingAutoLoadedId(null);
  };

  return (
    <PageGuard
      permission={['order_parse:create', 'orders:create']}
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
          <HelpGuide
            title="订单解析帮助"
            docUrl="/docs/guides/order-parse"
          >
            <HelpSection title="功能说明">
              支持通过 Excel 批量导入订单：自动识别表头并建立列映射、智能匹配系统商品与发货方库存、历史映射一键复用。客户反馈导出时按原始列名还原。
            </HelpSection>
            <HelpSection title="操作流程">
              <HelpSteps steps={[
                { title: "选择客户", description: "联动业务员/跟单员，同时检索该客户的历史映射配置" },
                { title: "上传 Excel", description: "支持 .xls/.xlsx，自动计算表头指纹匹配历史映射" },
                { title: "配置列映射", description: "首次导入需手工配置；再次导入自动加载，仅在 Excel 列有变动时调整" },
                { title: "解析订单", description: "系统按 规格→编码→条码→名称 四级优先级自动匹配商品，并查询各发货方库存" },
                { title: "确认发货方", description: "系统按 内部仓库优先→成本最优→库存充足 规则推荐默认发货方，不合适可批量重选" },
                { title: "提交订单", description: "提交时自动保存列映射（映射历史 +1），后续反馈导出按客户原始列名+顺序+系统追加物流信息输出" },
              ]} />
            </HelpSection>
            <HelpSection title="首次 vs 再次导入">
              <div className="text-xs space-y-2">
                <div>
                  <span className="font-medium text-foreground">首次导入：</span>
                  选择客户 → 上传 Excel → 手工配置列映射 → 解析匹配商品 → 确认发货方 → 提交。映射自动保存。
                </div>
                <div>
                  <span className="font-medium text-foreground">再次导入（同客户同类表格）：</span>
                  选择客户 → 上传 Excel → 自动加载历史映射（绿色提示）→ 解析匹配 → 确认发货方 → 提交。仅当 Excel 列有变动时才需调整映射。
                </div>
              </div>
            </HelpSection>
            <HelpSection title="商品匹配优先级">
              <div className="text-xs space-y-1">
                <div>1. 规格匹配（精确）</div>
                <div>2. 编码匹配（精确）</div>
                <div>3. 条码匹配（精确）</div>
                <div>4. 名称匹配（模糊）</div>
              </div>
            </HelpSection>
            <HelpNote type="tip">
              提示：库存 ≤ 2 台时会显示尾货预警，请注意撞单风险。列映射提交时自动保存，无需手动操作。
            </HelpNote>
            <HelpLinks links={[
              { label: "订单管理", href: "/orders", description: "查看已提交订单" },
              { label: "发货导出", href: "/shipping-export", description: "派发订单" },
              { label: "核心业务流", href: "/docs/guides/business-flow", description: "模块数据流转" },
            ]} />
          </HelpGuide>
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
            className={cn(
              'transition-all duration-300 ease-in-out shrink-0',
              leftPanelCollapsed
                ? 'hidden xl:block xl:w-0 xl:overflow-hidden'
                : 'w-full xl:w-[520px]'
            )}
          >
            <div className="flex h-full flex-col gap-3 overflow-y-auto pr-0 xl:pr-1">
            <CustomerSelector
              customers={customers}
              selectedCustomer={selectedCustomer}
              users={users as Array<{ id: string; username: string; realName?: string; name?: string; role: string }>}
              salespersonId={salespersonId}
              salespersonName={salespersonName}
              operatorId={operatorId}
              operatorName={operatorName}
              onCustomerChange={handleCustomerChange}
              onSalespersonChange={(id, name) => {
                const previousName = salespersonName;
                setSalespersonId(id);
                setSalespersonName(name);
                syncGlobalAssigneeToOrders('salesperson', id, name, previousName);
              }}
              onOperatorChange={(id, name) => {
                const previousName = operatorName;
                setOperatorId(id);
                setOperatorName(name);
                syncGlobalAssigneeToOrders('operator', id, name, previousName);
              }}
            />

            {/* Input Panel */}
            <InputPanel
              inputMode={inputMode}
              onInputModeChange={(v) => setInputMode(v)}
              inputText={inputText}
              onInputTextChange={(v) => setInputText(v)}
              excelFile={excelFile}
              excelFileName={excelFileName}
              excelFileSize={excelFileSize}
              excelSheetNames={excelSheetNames}
              selectedSheet={selectedSheet}
              headerRow={headerRow}
              excelPreview={excelPreview}
              columnMapping={columnMapping}
              mappingAutoLoaded={mappingAutoLoaded}
              mappingAutoLoadedId={mappingAutoLoadedId}
              isLoading={isLoading}
              parseResult={parseResult}
              parsedOrdersCount={parsedOrders.length}
              isMatchingSupplier={isMatchingSupplier}
              onTextParse={handleParseText}
              onExcelFileUpload={handleExcelUpload}
              onSheetChange={handleSheetChange}
              onHeaderRowChange={(row) => setHeaderRow(row)}
              onReDetectMapping={handleReDetectMapping}
              onMatchAllSuppliers={handleMatchAllSuppliers}
              onParse={handleParse}
              onClear={handleClear}
              onMappingChange={handleMappingChange}
              onMappingAutoLoadedClear={() => { setMappingAutoLoaded(false); setMappingAutoLoadedId(null); }}
              onMappingCollapsedChange={(v) => setMappingCollapsed(v)}
              mappingCollapsed={mappingCollapsed}
              onRemoveFile={handleRemoveFile}
            />
            </div>
          </div>

          {/* Right Panel: Parsed Orders */}
          <OrderPreviewPanel
          orders={parsedOrders}
          parseStats={parseStats}
          submitValidation={submitValidation}
          selectedValidOrderCount={selectedValidOrderCount}
          selectedCustomer={selectedCustomer}
          salespersonName={salespersonName}
          operatorName={operatorName}
          customers={customers as Array<{ code: string; name: string }>}
          suppliers={suppliers as Array<{ id: string; name: string; type?: string; province?: string }>}
          supplierMatchResults={supplierMatchResults}
          isMatchingSupplier={isMatchingSupplier}
          matchingSupplierOrderId={matchingSupplierOrderId}
          isSubmitting={isSubmitting}
          onToggle={toggleOrder}
          onToggleExpand={toggleExpand}
          onDuplicate={duplicateOrder}
          onRemove={removeOrder}
          onUpdate={updateOrderField}
          onMatchSupplier={handleMatchSupplier}
          onSupplierChange={handleSupplierChange}
          onProductSelect={handleProductSelectFromDialog}
          onSelectAll={handleSelectAll}
          onAddOrder={addOrder}
          onSubmit={handleSubmitOrders}
        />
        </div>

          {/* Product Picker Dialog */}
          <ProductPickerDialog
            open={productPickerOpen}
            onOpenChange={(open) => {
              setProductPickerOpen(open);
              if (!open) setProductPickerOrderId(null);
            }}
            onSelect={handleProductSelect}
            title="选择系统商品（按编码或名称搜索）"
          />

          {/* Import Result Dialog */}
          <ImportResultDialog
            open={!!importResult}
            onOpenChange={(open) => { if (!open) setImportResult(null); }}
            total={importResult?.total ?? 0}
            importBatch={importResult?.importBatch ?? ''}
            sysOrderNos={importResult?.sysOrderNos ?? []}
            message={importResult?.message ?? ''}
            customerName={importResult?.customerName}
            onClose={() => setImportResult(null)}
          />

          {/* Mapping History Dialog */}
          <MappingHistoryDialog
            open={showMappingDialog}
            onOpenChange={setShowMappingDialog}
            history={mappingHistory}
            onRestore={restoreMapping}
          />
        </div>
      </PageGuard>
    );
  }
