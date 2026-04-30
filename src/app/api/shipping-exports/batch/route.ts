import { NextRequest, NextResponse } from 'next/server';
import { saveExportArtifact, type ExportConfig } from '@/lib/export-artifacts';
import { buildExportRecordDownloadPath } from '@/lib/export-download';
import { recordOrderCostFromDispatch } from '@/lib/order-cost-history';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { parseTemplateFieldMappings, parseTemplateFieldMappingsArray, resolvePreferredTemplate, type TemplateRecord } from '@/lib/template-utils';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

type OrderItem = Record<string, unknown>;

// 获取导出配置（从数据库的 system_configs 表读取）
async function getExportConfig(client: ReturnType<typeof getSupabaseClient>): Promise<ExportConfig | undefined> {
  try {
    // 查询导出配置
    const { data: configs, error } = await client
      .from('system_configs')
      .select('code, config')
      .in('code', ['export_default_dir', 'export_provider'])
      .eq('is_active', true);

    if (error) {
      console.warn('获取导出配置失败，使用默认配置:', error.message);
      return undefined;
    }

    const configMap: Record<string, Record<string, unknown>> = {};
    for (const c of (configs || [])) {
      configMap[c.code] = c.config;
    }

    const exportDirConfig = configMap['export_default_dir'];
    const exportProviderConfig = configMap['export_provider'];

    return {
      provider: (exportProviderConfig?.provider as 'local' | 's3') || undefined,
      localPath: exportDirConfig?.localPath as string || undefined,
    };
  } catch (err) {
    console.warn('获取导出配置异常，使用默认配置:', err);
    return undefined;
  }
}

function parseItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value as OrderItem[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

// 默认字段映射 - 有序数组格式，保持导出列顺序
const DEFAULT_SHIPPING_FIELD_MAPPINGS: Array<{ excelColumn: string; systemField: string }> = [
  { excelColumn: '系统订单号', systemField: 'sysOrderNo' },
  { excelColumn: '客户订单号', systemField: 'orderNo' },
  { excelColumn: '收货人', systemField: 'receiverName' },
  { excelColumn: '联系电话', systemField: 'receiverPhone' },
  { excelColumn: '收货地址', systemField: 'receiverAddress' },
  { excelColumn: '商品编码', systemField: 'productCode' },
  { excelColumn: '商品名称', systemField: 'productName' },
  { excelColumn: '数量', systemField: 'quantity' },
  { excelColumn: '单价', systemField: 'unitCost' },
  { excelColumn: '仓库', systemField: 'warehouseName' },
  { excelColumn: '客户代码', systemField: 'customerCode' },
  { excelColumn: '客户名称', systemField: 'customerName' },
  { excelColumn: '业务员', systemField: 'salesperson' },
  { excelColumn: '跟单员', systemField: 'operator' },
  { excelColumn: '备注', systemField: 'remark' },
];

function itemText(item: OrderItem, ...keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function stockMatchesItem(stock: Record<string, unknown>, item: OrderItem): boolean {
  const productId = itemText(item, 'product_id', 'productId', 'systemProductId');
  const productCode = itemText(item, 'product_code', 'productCode', 'systemProductCode', 'cu_product_code', 'cuProductCode');
  const productSpec = itemText(item, 'product_spec', 'productSpec', 'systemProductSpec', 'cu_product_spec', 'cuProductSpec');
  const productName = itemText(item, 'product_name', 'productName', 'systemProductName', 'cu_product_name', 'cuProductName');

  if (productId && stock.product_id === productId) return true;
  if (productCode && stock.product_code === productCode) return true;
  if (productSpec && String(stock.product_code || '') === productSpec) return true;
  if (productSpec && String(stock.product_name || '').includes(productSpec)) return true;
  if (productName && String(stock.product_name || '').includes(productName)) return true;
  return false;
}

async function findStockForItem(
  client: ReturnType<typeof getSupabaseClient>,
  supplierId: string,
  item: OrderItem
): Promise<Record<string, unknown> | null> {
  const { data: stocks, error } = await client
    .from('stocks')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('status', 'active')
    .gt('quantity', 0);

  if (error) throw new Error(`查询库存失败: ${error.message}`);
  return ((stocks || []) as Record<string, unknown>[]).find((stock) => stockMatchesItem(stock, item)) || null;
}

async function findSupplierProductMapping(
  client: ReturnType<typeof getSupabaseClient>,
  supplierId: string,
  productId: string
): Promise<{ supplierProductCode?: string; supplierProductName?: string; supplierProductSpec?: string } | null> {
  if (!supplierId || !productId) return null;
  const { data } = await client
    .from('product_mappings')
    .select('supplier_product_code, supplier_product_name, supplier_product_spec')
    .eq('supplier_id', supplierId)
    .eq('product_id', productId)
    .maybeSingle();

  return data ? {
    supplierProductCode: (data as Record<string, unknown>).supplier_product_code as string || undefined,
    supplierProductName: (data as Record<string, unknown>).supplier_product_name as string || undefined,
    supplierProductSpec: (data as Record<string, unknown>).supplier_product_spec as string || undefined,
  } : null;
}

async function getExistingDispatchContext(
  client: ReturnType<typeof getSupabaseClient>,
  orderId: string
) {
  // D-3 派发去重：以 dispatch_records 的 dispatched 记录为准，
  // 只要存在已派发记录，就复用而不重复扣库存/记成本
  const { data: latestDispatch } = await client
    .from('dispatch_records')
    .select('batch_no, items, dispatch_at')
    .eq('order_id', orderId)
    .eq('status', 'dispatched')
    .order('dispatch_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 成本记录和库存版本仅作历史参考，不作为去重依据
  const { count: costCount } = await client
    .from('order_cost_history')
    .select('*', { count: 'exact', head: true })
    .eq('order_id', orderId);

  const { count: stockVersionCount } = await client
    .from('stock_versions')
    .select('*', { count: 'exact', head: true })
    .eq('reference_id', orderId)
    .eq('change_type', 'order');

  // 有 dispatched 记录 → 复用；仅有成本/库存记录但无派发记录 → 视为新派发
  const hasExistingSideEffects = Boolean(latestDispatch) || (costCount || 0) > 0 || (stockVersionCount || 0) > 0;

  return {
    hasExistingSideEffects,
    latestDispatch: latestDispatch as { batch_no?: string; items?: unknown; dispatch_at?: string } | null,
  };
}

async function dispatchPendingOrder(
  client: ReturnType<typeof getSupabaseClient>,
  order: Record<string, unknown>,
  supplier: Record<string, unknown>,
  batchNo: string,
  supplierId?: string,
  isSynthetic = false,
  targetStatus: 'assigned' | 'notified' = 'notified'
) {
  const existingDispatch = await getExistingDispatchContext(client, String(order.id));
  if (existingDispatch.hasExistingSideEffects) {
    const reusedBatchNo =
      String(existingDispatch.latestDispatch?.batch_no || order.assigned_batch || batchNo);
    const existingItems = parseItems(existingDispatch.latestDispatch?.items).map((item) => ({
      productCode: itemText(item, 'productCode', 'product_code'),
      productName: itemText(item, 'productName', 'product_name'),
      quantity: toNumber(item.quantity, 1),
      unitCost: toNumber(item.unitCost || item.unit_cost),
      warehouseName: itemText(item, 'warehouseName', 'warehouse_name'),
      // 保留发货方商品字段（派发时快照），二次导出时优先使用
      supplierProductCode: itemText(item, 'supplierProductCode') || itemText(item, 'productCode', 'product_code'),
      supplierProductName: itemText(item, 'supplierProductName') || itemText(item, 'productName', 'product_name'),
      supplierProductSpec: itemText(item, 'supplierProductSpec') || itemText(item, 'productSpec', 'product_spec'),
    }));

    const currentStatus = String(order.status || 'pending');
    const targetStatus = (currentStatus === 'pending' || currentStatus === 'assigned' || currentStatus === 'notified')
      ? 'notified'
      : currentStatus;
    await client
      .from('orders')
      .update({
        status: targetStatus,
        assigned_batch: String(order.assigned_batch || reusedBatchNo),
        assigned_at: order.assigned_at || existingDispatch.latestDispatch?.dispatch_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return {
      dispatchItems: existingItems,
      dispatchBatch: String(order.assigned_batch || reusedBatchNo),
      reusedExistingDispatch: true,
      wasActuallyDispatched: false,
      stockWarnings: [],
    };
  }

  const dispatchItems: Array<Record<string, unknown>> = [];
  const items = parseItems(order.items);
  if (items.length === 0) throw new Error(`订单 ${order.order_no || order.id} 没有商品明细`);

  // 收集库存相关的 warning（不阻断派发）
  const stockWarnings: string[] = [];

  for (const item of items) {
    const quantity = toNumber(item.quantity, 1);
    const itemName = itemText(item, 'product_name', 'productName', 'cu_product_name', 'cuProductName') || '未知商品';
    // 虚拟发货方没有真实 supplier_id，跳过库存操作（虚拟发货方的订单通常已通过其他途径派发过）
    const stockQueryId = isSynthetic
      ? undefined
      : (supplierId || (supplier?.id ? String(supplier.id) : undefined));
    const stock = stockQueryId
      ? await findStockForItem(client, stockQueryId, item)
      : null;

    // 发货方商品映射信息
    const supplierMapping = stockQueryId && stock?.product_id
      ? await findSupplierProductMapping(client, stockQueryId, String(stock.product_id))
      : null;

    if (!stock) {
      // 无匹配库存：允许负库存发货，使用订单商品信息兜底
      stockWarnings.push(`「${itemName}」未找到发货方库存，已按负库存发货（订单 ${order.order_no || order.id}）`);
      const unitCost = toNumber(item.price || item.unit_price);
      dispatchItems.push({
        supplierProductCode: supplierMapping?.supplierProductCode || itemText(item, 'cu_product_code', 'cuProductCode') || itemText(item, 'product_code', 'productCode'),
        supplierProductName: supplierMapping?.supplierProductName || itemText(item, 'cu_product_name', 'cuProductName') || itemText(item, 'product_name', 'productName'),
        supplierProductSpec: supplierMapping?.supplierProductSpec || itemText(item, 'cu_product_spec', 'cuProductSpec') || itemText(item, 'product_spec', 'productSpec'),
        productCode: itemText(item, 'product_code', 'productCode'),
        productName: itemText(item, 'product_name', 'productName'),
        productSpec: itemText(item, 'product_spec', 'productSpec'),
        quantity,
        unitCost,
        warehouseName: '',
      });
      continue;
    }

    const beforeQuantity = toNumber(stock.quantity);
    const afterQuantity = beforeQuantity - quantity;
    const unitCost = toNumber(stock.unit_price || item.price || item.unit_price);
    const now = new Date().toISOString();

    // 库存不足时记录 warning，仍允许负库存发货
    if (beforeQuantity < quantity) {
      stockWarnings.push(`「${itemName}」库存不足（当前 ${beforeQuantity} 台，需要 ${quantity} 台），已按负库存发货（订单 ${order.order_no || order.id}）`);
    }

    const { error: stockError } = await client
      .from('stocks')
      .update({ quantity: afterQuantity, last_stock_out_at: now, updated_at: now })
      .eq('id', stock.id);
    if (stockError) throw new Error(`扣减库存失败: ${stockError.message}`);

    await client.from('stock_versions').insert({
      stock_id: stock.id,
      product_code: stock.product_code,
      product_name: stock.product_name,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      warehouse_id: stock.warehouse_id || null,
      warehouse_name: stock.warehouse_name || null,
      before_quantity: beforeQuantity,
      after_quantity: afterQuantity,
      change_quantity: -quantity,
      before_price: unitCost,
      after_price: unitCost,
      change_price: 0,
      change_type: 'order',
      change_reason: `发货通知派发 ${order.order_no || order.id}`,
      reference_id: order.id,
      operator: 'system',
    });

    await recordOrderCostFromDispatch(client, {
      order,
      supplier,
      stock,
      item,
      quantity,
      unitCost,
      batchNo,
    });

    dispatchItems.push({
      // 发货方商品编码：优先取 product_mappings.supplier_product_code，没有则用系统商品编码
      supplierProductCode: supplierMapping?.supplierProductCode || stock.product_code,
      supplierProductName: supplierMapping?.supplierProductName || stock.product_name,
      supplierProductSpec: supplierMapping?.supplierProductSpec || String(stock.supplier_product_spec || ''),
      // 系统商品编码（用于内部成本核算）
      productCode: stock.product_code,
      productName: stock.product_name,
      productSpec: stock.supplier_product_spec || '',
      quantity,
      unitCost,
      warehouseName: stock.warehouse_name || '',
    });
  }

    const stockSupplierId = isSynthetic ? null : (supplierId || (supplier?.id ? String(supplier.id) : null));
    const stockSupplierName = String(supplier.name || '');

    await client.from('dispatch_records').insert({
      id: crypto.randomUUID(),
      order_id: order.id,
      supplier_id: stockSupplierId,
      supplier_name: stockSupplierName,
      batch_no: batchNo,
      dispatch_at: new Date().toISOString(),
      status: 'dispatched',
      items: dispatchItems,
    });

    await client
      .from('orders')
      .update({
        status: targetStatus,
        assigned_batch: batchNo,
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

  return {
    dispatchItems,
    dispatchBatch: batchNo,
    reusedExistingDispatch: false,
    wasActuallyDispatched: true,
    stockWarnings,
  };
}

function rowsForOrder(
  order: Record<string, unknown>,
  fieldMappings: Array<{ excelColumn: string; systemField: string }>,
  batchNo: string,
  dispatchItems?: Array<Record<string, unknown>>,
  isSupplierTemplate?: boolean
) {
  const items = dispatchItems && dispatchItems.length > 0
    ? dispatchItems
    : parseItems(order.items).map((item) => {
      // 发货方专属模板优先取发货方商品信息；通用模板优先取系统商品信息
      const resolvedProductCode = isSupplierTemplate
        ? itemText(item, 'cu_product_code', 'cuProductCode') || itemText(item, 'product_code', 'productCode')
        : itemText(item, 'product_code', 'productCode') || itemText(item, 'cu_product_code', 'cuProductCode');
      const resolvedProductName = isSupplierTemplate
        ? itemText(item, 'cu_product_name', 'cuProductName') || itemText(item, 'product_name', 'productName')
        : itemText(item, 'product_name', 'productName') || itemText(item, 'cu_product_name', 'cuProductName');
      const resolvedProductSpec = isSupplierTemplate
        ? itemText(item, 'cu_product_spec', 'cuProductSpec') || itemText(item, 'product_spec', 'productSpec')
        : itemText(item, 'product_spec', 'productSpec') || itemText(item, 'cu_product_spec', 'cuProductSpec');
      return {
        productCode: resolvedProductCode,
        productName: resolvedProductName,
        productSpec: resolvedProductSpec,
        // 发货方商品信息默认使用系统字段兜底（如果没有派发快照）
        supplierProductCode: resolvedProductCode,
        supplierProductName: resolvedProductName,
        supplierProductSpec: resolvedProductSpec,
        quantity: toNumber(item.quantity, 1),
        unitCost: toNumber(item.price || item.unit_price),
        warehouseName: itemText(item, 'warehouse'),
      };
    });

  return items.map((item) => {
    // dispatchItems 已有发货方商品字段（派发时已优先保留 cu_product_*），直接用
    const supplierProductCode = (item as Record<string, unknown>).supplierProductCode as string || '';
    const supplierProductName = (item as Record<string, unknown>).supplierProductName as string || '';
    const supplierProductSpec = (item as Record<string, unknown>).supplierProductSpec as string || '';

    const context: Record<string, unknown> = {
      sysOrderNo: order.sys_order_no || '',
      orderNo: order.order_no || '',
      matchCode: order.match_code || '',
      dispatchBatch: batchNo || order.assigned_batch || '',
      // 发货方模板优先用发货方编码，系统模板用系统编码，都没有则互相兜底
      productCode: isSupplierTemplate
        ? (supplierProductCode || (item.productCode as string) || '')
        : ((item.productCode as string) || supplierProductCode || ''),
      productName: isSupplierTemplate
        ? (supplierProductName || (item.productName as string) || '')
        : ((item.productName as string) || supplierProductName || ''),
      productSpec: isSupplierTemplate
        ? (supplierProductSpec || (item.productSpec as string) || '')
        : ((item.productSpec as string) || supplierProductSpec || ''),
      supplierProductCode: supplierProductCode || '',
      supplierProductName: supplierProductName || '',
      supplierProductSpec: supplierProductSpec || '',
      quantity: item.quantity || 1,
      unitCost: item.unitCost || '',
      warehouseName: (item.warehouseName as string) || '',
      receiverName: order.receiver_name || '',
      receiverPhone: order.receiver_phone || '',
      receiverAddress: order.receiver_address || '',
      customerCode: order.customer_code || '',
      customerName: order.customer_name || '',
      salesperson: order.salesperson || '',
      operator: order.operator_name || '',
      supplierName: order.supplier_name || '',
      expressCompany: order.express_company || '',
      trackingNo: order.tracking_no || '',
      expressFee: order.express_fee || '',
      remark: order.remark || '',
    };

    return Object.fromEntries(
      fieldMappings.map(({ excelColumn, systemField }) => [excelColumn, context[systemField] ?? ''])
    );
  });
}

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();

  // 获取导出配置（数据库配置优先于环境变量）
  const exportConfig = await getExportConfig(client);

  try {
    const body = await request.json();
    const { supplierIds, templateId, exportedBy, dispatchMode, persistenceMode, mode } = body;
    // mode: 'pending' = 待导出的首次导出（会派发 pending 订单）, 'reexport' = 已导出订单的二次导出（不派发）
    const exportMode: 'preview' | 'dispatch' = dispatchMode === 'preview' ? 'preview' : 'dispatch';
    const isReexport = mode === 'reexport';
    const resolvedPersistenceMode: 'none' | 'full' =
      exportMode === 'preview' ? 'none' : persistenceMode === 'none' ? 'none' : 'full';
    const executionMode: 'preview' | 'dispatch_only' | 'dispatch_with_persistence' | 'reexport' | 'reexport_with_persistence' =
      exportMode === 'preview'
        ? 'preview'
        : isReexport
          ? resolvedPersistenceMode === 'full' ? 'reexport_with_persistence' : 'reexport'
          : resolvedPersistenceMode === 'none'
            ? 'dispatch_only'
            : 'dispatch_with_persistence';

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个发货方' }, { status: 400 });
    }

    const resolvedTemplateId = templateId || null;
    let resolvedTemplate: TemplateRecord | null = null;
    let templateName = '默认发货通知模板';
    let templateSource: 'explicit' | 'target' | 'linked' | 'default' | 'first' = 'default';
    if (resolvedTemplateId) {
      const { data: template } = await client.from('templates').select('*').eq('id', resolvedTemplateId).maybeSingle();
      if (template) {
        resolvedTemplate = template as TemplateRecord;
        if (template.name) templateName = String(template.name);
        templateSource = 'explicit';
      }
    }
    const fieldMappings = resolvedTemplate ? parseTemplateFieldMappingsArray(resolvedTemplate) : DEFAULT_SHIPPING_FIELD_MAPPINGS;
    const exportFieldMappings = fieldMappings.length > 0 ? fieldMappings : DEFAULT_SHIPPING_FIELD_MAPPINGS;

    const batchId = crypto.randomUUID();
    const recordId = crypto.randomUUID();
    const batchNo = `SHIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zip = new JSZip();
    const results: Array<Record<string, unknown>> = [];
    const allOrderIds: string[] = [];
    const supplierNames: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];
    let totalOrderCount = 0;
    let newDispatchCount = 0;
    let reusedDispatchCount = 0;
    let assignedOnlyCount = 0;
    let persistedDetailCount = 0;

    for (const supplierId of supplierIds) {
      // 判断是否为虚拟发货方（suppliers 表中不存在，从 pending 接口补充进来的）
      const isSynthetic = String(supplierId).startsWith('synthetic-');
      const syntheticName = isSynthetic ? String(supplierId).replace('synthetic-', '') : '';

      // 虚拟发货方：从 orders 表按 supplier_name 查询；真实发货方：查 shippers 表（统一数据源）
      const { data: supplier } = isSynthetic
        ? { data: null }
        : await client.from('shippers').select('*').eq('id', supplierId).maybeSingle();

      if (!isSynthetic && !supplier) {
        errors.push(`发货方 ${supplierId} 不存在`);
        continue;
      }

      const supplierName = isSynthetic ? syntheticName : String((supplier as Record<string, unknown>).name || '');
      supplierNames.push(supplierName);

      // 用户下拉框选择的模板（全局）
      const userSelectedTemplate = resolvedTemplate;
      const userSelectedTemplateId = resolvedTemplateId;
      const userSelectedTemplateName = templateName;
      const userSelectedTemplateSource: 'explicit' | 'target' | 'linked' | 'default' | 'first' = templateSource;

      // 始终 per-supplier 解析专属模板（即使选了用户模板，也优先用发货方专属模板）
      const { template: supplierTemplate, source: supplierTemplateSource } =
        await resolvePreferredTemplate(client, {
          type: 'shipping',
          targetType: 'supplier',
          targetId: isSynthetic ? undefined : supplierId,
          targetName: isSynthetic ? supplierName : undefined,
        });

      // 优先级：per-supplier 专属模板 > 用户选择的模板 > 默认模板
      const actualTemplate = supplierTemplate || userSelectedTemplate || null;
      const actualTemplateId = actualTemplate?.id || null;
      const actualTemplateName = actualTemplate?.name || userSelectedTemplateName || '默认发货通知模板';
      const actualTemplateSource = supplierTemplate
        ? (supplierTemplateSource as 'target' | 'linked' | 'default' | 'first')
        : (userSelectedTemplate ? 'explicit' : 'first');
      const supplierFieldMappings = supplierTemplate ? parseTemplateFieldMappingsArray(supplierTemplate) : DEFAULT_SHIPPING_FIELD_MAPPINGS;
      const supplierExportFieldMappings = supplierFieldMappings.length > 0 ? supplierFieldMappings : DEFAULT_SHIPPING_FIELD_MAPPINGS;
      // 判断当前应用的模板是否为该供应商的专属模板
      // 专属模板：target_type=supplier 且 target_id=supplierId（真实）或 target_name=supplierName（虚拟）
      const isSupplierTemplate = Boolean(
        supplierTemplate?.target_type === 'supplier' &&
        (supplierTemplate?.target_id === supplierId ||
          supplierTemplate?.target_id === supplierName)
      );

      // 虚拟发货方：直接按 supplier_name 查询；真实发货方：优先按 supplier_id 精确匹配，回退按 supplier_name 匹配
      let orders: Record<string, unknown>[] = [];

      if (isSynthetic) {
        const { data, error } = await client
          .from('orders')
          .select('*')
          .eq('supplier_name', supplierName)
          .in('status', isReexport ? ['notified'] : ['pending', 'assigned']);
        if (error) throw new Error(`按名称查询订单失败: ${error.message}`);
        orders = (data || []) as Record<string, unknown>[];
      } else {
        const { data: ordersById, error: ordersErrorById } = await client
          .from('orders')
          .select('*')
          .eq('supplier_id', supplierId)
          .in('status', isReexport ? ['notified'] : ['pending', 'assigned']);

        if (ordersErrorById) throw new Error(`查询订单失败: ${ordersErrorById.message}`);

        const { data: ordersByName, error: ordersErrorByName } = await client
          .from('orders')
          .select('*')
          .is('supplier_id', null)
          .eq('supplier_name', supplierName)
          .in('status', isReexport ? ['notified'] : ['pending', 'assigned']);

        if (ordersErrorByName) throw new Error(`按名称查询订单失败: ${ordersErrorByName.message}`);

        // 合并去重
        const orderMap = new Map<string, Record<string, unknown>>();
        for (const o of (ordersById || []) as Record<string, unknown>[]) {
          orderMap.set(o.id as string, o);
        }
        for (const o of (ordersByName || []) as Record<string, unknown>[]) {
          if (!orderMap.has(o.id as string)) {
            orderMap.set(o.id as string, o);
          }
        }
        orders = Array.from(orderMap.values());
      }
      if (orders.length === 0) continue;

      const exportRows: Array<Record<string, unknown>> = [];
      let supplierSuccessCount = 0;

      for (const order of orders as Record<string, unknown>[]) {
        try {
          // 二次导出模式：不派发、不扣库存，只生成文件
          if (isReexport) {
            // 从 dispatch_records 查询历史派发记录，获取发货方商品信息
            const { data: dispatchRecord } = await client
              .from('dispatch_records')
              .select('items, batch_no')
              .eq('order_id', order.id)
              .eq('status', 'dispatched')
              .order('dispatch_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            const dispatchItems = dispatchRecord?.items || undefined;
            const dispatchBatchNo = dispatchRecord?.batch_no || String(order.assigned_batch || batchNo);
            assignedOnlyCount += 1;
            exportRows.push(...rowsForOrder(order, supplierExportFieldMappings, dispatchBatchNo, dispatchItems, isSupplierTemplate));
          } else {
            // 导出时：pending → notified（首次导出发货通知），已通知的订单幂等
            const dispatchResult = exportMode === 'dispatch'
              ? await dispatchPendingOrder(
                  client,
                  order,
                  supplier as Record<string, unknown>,
                  batchNo,
                  isSynthetic ? undefined : supplierId,
                  isSynthetic,
                  'notified'
                )
              : undefined;
            if (dispatchResult?.reusedExistingDispatch) {
              reusedDispatchCount += 1;
            } else if (dispatchResult) {
              newDispatchCount += 1;
            } else {
              assignedOnlyCount += 1;
            }
            const exportBatchNo = dispatchResult?.dispatchBatch || batchNo;
            exportRows.push(...rowsForOrder(order, supplierExportFieldMappings, exportBatchNo, dispatchResult?.dispatchItems, isSupplierTemplate));
            // 收集库存警告（无库存/库存不足等提示）
            if (dispatchResult?.stockWarnings?.length) {
              warnings.push(...dispatchResult.stockWarnings);
            }
          }
          allOrderIds.push(String(order.id));
          supplierSuccessCount += 1;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }

      if (exportRows.length === 0) continue;

      const safeSupplierName = supplierName.replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `${safeSupplierName}+发货通知单+${today}.xlsx`;
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const headers = supplierExportFieldMappings.map(m => m.excelColumn);
      worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, Math.min(48, header.length * 2 + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '发货通知单');
      const workbookBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      zip.file(fileName, workbookBuffer);
      const detailIndex = results.length;
      const detailArtifact = exportMode === 'dispatch' && resolvedPersistenceMode === 'full'
        ? await saveExportArtifact(recordId, fileName, workbookBuffer, exportConfig)
        : null;
      if (detailArtifact) {
        persistedDetailCount += 1;
      }

      results.push({
        supplierId,
        supplierName,
        orderCount: supplierSuccessCount,
        templateId: actualTemplateId,
        templateName: actualTemplateName,
        templateSource: actualTemplateSource as string,
        fileName,
        fileUrl: detailArtifact ? buildExportRecordDownloadPath(recordId, detailIndex) : null,
        artifact: detailArtifact
          ? {
              relative_path: detailArtifact.relativePath,
              file_name: detailArtifact.fileName,
              provider: detailArtifact.provider,
            }
          : null,
        status: 'success',
      });
      totalOrderCount += supplierSuccessCount;
    }

    if (totalOrderCount === 0) {
      return NextResponse.json({ success: false, error: errors.join('；') || '没有可导出的订单' }, { status: 400 });
    }

    const zipFileName = `发货通知单批量导出+${today}.zip`;
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipBase64 = zipBuffer.toString('base64');
    if (exportMode === 'preview') {
      return NextResponse.json({
        success: errors.length === 0,
        message: `已生成预览内容：${results.length}个发货方，共${totalOrderCount}个订单${errors.length ? `，失败${errors.length}条` : ''}`,
        data: {
          batchId,
          batchNo,
          zipFileName,
          zipBase64,
          zipFileUrl: null,
          artifact: null,
          totalSupplierCount: results.length,
          totalOrderCount,
          templateId: resolvedTemplateId,
          templateName,
          templateSource,
          dispatchSummary: {
            mode: exportMode,
            newDispatchCount: 0,
            reusedDispatchCount: 0,
            assignedOnlyCount: totalOrderCount,
          },
          persistenceSummary: {
            exportRecordCreated: false,
            zipArtifactPersisted: false,
            detailArtifactPersistedCount: 0,
          },
          executionMode,
          persistenceMode: resolvedPersistenceMode,
          details: results,
          errors,
          warnings,
          dispatchMode: exportMode,
          supplierIds,
        },
      });
    }

    if (resolvedPersistenceMode === 'none') {
      return NextResponse.json({
        success: errors.length === 0,
        message: `成功派发${results.length}个发货方，共${totalOrderCount}个订单${errors.length ? `，失败${errors.length}条` : ''}，未写入导出记录`,
        data: {
          batchId,
          recordId: null,
          batchNo,
          zipFileName,
          zipFileUrl: null,
          zipBase64,
          artifact: null,
          totalSupplierCount: results.length,
          totalOrderCount,
          templateId: resolvedTemplateId,
          templateName,
          templateSource,
          dispatchSummary: {
            mode: exportMode,
            newDispatchCount,
            reusedDispatchCount,
            assignedOnlyCount,
          },
          persistenceSummary: {
            exportRecordCreated: false,
            zipArtifactPersisted: false,
            detailArtifactPersistedCount: 0,
          },
          executionMode,
          persistenceMode: resolvedPersistenceMode,
          dispatchMode: exportMode,
          supplierIds,
          details: results,
          errors,
          warnings,
        },
      });
    }

    let artifact = null;
    let artifactError: string | null = null;
    try {
      artifact = await saveExportArtifact(recordId, zipFileName, zipBuffer, exportConfig);
    } catch (err) {
      artifactError = err instanceof Error ? err.message : String(err);
      console.error('保存导出文件失败:', artifactError);
      // 即使文件保存失败，也记录错误并继续创建导出记录
      errors.push(`文件持久化失败: ${artifactError}`);
    }

    const { error: recordError } = await client.from('export_records').insert({
      id: recordId,
      export_type: 'shipping_notice',
      business_type: isReexport ? 'reexport' : 'dispatch',
      // 单供应商时存实际 ID（真实供应商存 supplierId，虚拟供应商存名称），多供应商时存 null
      supplier_id: supplierIds.length === 1
        ? (supplierIds[0].startsWith('synthetic-') ? supplierIds[0].replace('synthetic-', '') : supplierIds[0])
        : null,
      supplier_name: supplierNames.join(','),
      order_ids: allOrderIds,
      template_id: resolvedTemplateId,
      template_name: templateName,
      file_url: artifact?.downloadPath || null,
      file_name: zipFileName,
      zip_file_url: artifact?.downloadPath || null,
      zip_file_name: zipFileName,
      total_count: totalOrderCount,
      exported_by: exportedBy || 'system',
      exported_at: new Date().toISOString(),
      metadata: {
        batch_id: batchId,
        batch_no: batchNo,
        supplier_ids: supplierIds,
        supplier_names: supplierNames,
        download_mode: artifact ? 'regenerate' : 'inline',
        is_reexport: isReexport,
        artifact: artifact ? {
          relative_path: artifact.relativePath,
          file_name: artifact.fileName,
          provider: artifact.provider,
        } : null,
        template_source: templateSource,
        details: results,
        errors,
        warnings,
      },
    });
    if (recordError) {
      console.error('保存导出记录失败:', recordError);
      errors.push(`保存导出记录失败: ${recordError.message}`);
    }

    return NextResponse.json({
      success: errors.length === 0,
      message: errors.length > 0
        ? `部分成功：导出完成但有${errors.length}个问题，详见错误列表`
        : `成功导出${results.length}个发货方，共${totalOrderCount}个订单`,
      data: {
        batchId,
        recordId,
        batchNo,
        zipFileName,
        zipFileUrl: artifact?.downloadPath || null,
        zipBase64,
        artifact: artifact ? {
          relative_path: artifact.relativePath,
          file_name: artifact.fileName,
          provider: artifact.provider,
        } : null,
        totalSupplierCount: results.length,
        totalOrderCount,
        templateId: resolvedTemplateId,
        templateName,
        templateSource,
        dispatchSummary: {
          mode: exportMode,
          newDispatchCount,
          reusedDispatchCount,
          assignedOnlyCount,
        },
        persistenceSummary: {
          exportRecordCreated: true,
          zipArtifactPersisted: !!artifact,
          detailArtifactPersistedCount: persistedDetailCount,
        },
        executionMode,
        persistenceMode: resolvedPersistenceMode,
        dispatchMode: exportMode,
        supplierIds,
        details: results,
        errors,
        warnings,
      },
    });
  } catch (error) {
    console.error('批量导出发货通知单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
