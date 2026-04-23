import { NextRequest, NextResponse } from 'next/server';
import { saveExportArtifact } from '@/lib/export-artifacts';
import { buildExportRecordDownloadPath } from '@/lib/export-download';
import { recordOrderCostFromDispatch } from '@/lib/order-cost-history';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { parseTemplateFieldMappings, resolvePreferredTemplate, type TemplateRecord } from '@/lib/template-utils';
import { requirePermission } from '@/lib/server-auth';
import { ORDER_STATUS_PENDING } from '@/lib/order-status';
import { PERMISSIONS } from '@/lib/permissions';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

type OrderItem = Record<string, unknown>;

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

const DEFAULT_SHIPPING_FIELD_MAPPINGS: Record<string, string> = {
  系统订单号: 'sysOrderNo',
  客户订单号: 'orderNo',
  收货人: 'receiverName',
  联系电话: 'receiverPhone',
  收货地址: 'receiverAddress',
  商品编码: 'productCode',
  商品名称: 'productName',
  数量: 'quantity',
  单价: 'unitCost',
  仓库: 'warehouseName',
  客户代码: 'customerCode',
  客户名称: 'customerName',
  业务员: 'salesperson',
  跟单员: 'operator',
  备注: 'remark',
};

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
  batchNo: string
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
    }));

    await client
      .from('orders')
      .update({
        status: 'assigned',
        assigned_batch: String(order.assigned_batch || reusedBatchNo),
        assigned_at: order.assigned_at || existingDispatch.latestDispatch?.dispatch_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    return {
      dispatchItems: existingItems,
      dispatchBatch: String(order.assigned_batch || reusedBatchNo),
      reusedExistingDispatch: true,
    };
  }

  const dispatchItems: Array<Record<string, unknown>> = [];
  const items = parseItems(order.items);
  if (items.length === 0) throw new Error(`订单 ${order.order_no || order.id} 没有商品明细`);

  for (const item of items) {
    const quantity = toNumber(item.quantity, 1);
    const stock = await findStockForItem(client, String(supplier.id), item);
    if (!stock) {
      throw new Error(`订单 ${order.order_no || order.id} 的商品「${itemText(item, 'product_name', 'productName', 'cu_product_name', 'cuProductName') || '未知商品'}」未找到供应商库存`);
    }

    const beforeQuantity = toNumber(stock.quantity);
    if (beforeQuantity < quantity) {
      throw new Error(`库存不足：${stock.product_name || ''} 当前 ${beforeQuantity} 台，订单需要 ${quantity} 台`);
    }

    const afterQuantity = beforeQuantity - quantity;
    const unitCost = toNumber(stock.unit_price || item.price || item.unit_price);
    const now = new Date().toISOString();

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
      // 供应商商品编码（来自订单/SKU映射，供应商发货时使用）
      supplierProductCode: itemText(item, 'cu_product_code', 'cuProductCode') || stock.product_code,
      supplierProductName: itemText(item, 'cu_product_name', 'cuProductName') || stock.product_name,
      supplierProductSpec: itemText(item, 'cu_product_spec', 'cuProductSpec') || String(stock.supplier_product_spec || ''),
      // 系统商品编码（用于内部成本核算）
      productCode: stock.product_code,
      productName: stock.product_name,
      productSpec: stock.supplier_product_spec || '',
      quantity,
      unitCost,
      warehouseName: stock.warehouse_name || '',
    });
  }

  await client.from('dispatch_records').insert({
    id: crypto.randomUUID(),
    order_id: order.id,
    supplier_id: supplier.id,
    supplier_name: supplier.name,
    batch_no: batchNo,
    dispatch_at: new Date().toISOString(),
    status: 'dispatched',
    items: dispatchItems,
  });

  await client
    .from('orders')
    .update({
      status: 'assigned',
      assigned_batch: batchNo,
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order.id);

  return {
    dispatchItems,
    dispatchBatch: batchNo,
    reusedExistingDispatch: false,
  };
}

function rowsForOrder(
  order: Record<string, unknown>,
  fieldMappings: Record<string, string>,
  batchNo: string,
  dispatchItems?: Array<Record<string, unknown>>,
  isSupplierTemplate?: boolean
) {
  const items = dispatchItems && dispatchItems.length > 0
    ? dispatchItems
    : parseItems(order.items).map((item) => ({
      // 供应商专属模板优先取供应商商品信息；通用模板优先取系统商品信息
      productCode: isSupplierTemplate
        ? itemText(item, 'cu_product_code', 'cuProductCode') || itemText(item, 'product_code', 'productCode')
        : itemText(item, 'product_code', 'productCode') || itemText(item, 'cu_product_code', 'cuProductCode'),
      productName: isSupplierTemplate
        ? itemText(item, 'cu_product_name', 'cuProductName') || itemText(item, 'product_name', 'productName')
        : itemText(item, 'product_name', 'productName') || itemText(item, 'cu_product_name', 'cuProductName'),
      productSpec: isSupplierTemplate
        ? itemText(item, 'cu_product_spec', 'cuProductSpec') || itemText(item, 'product_spec', 'productSpec')
        : itemText(item, 'product_spec', 'productSpec') || itemText(item, 'cu_product_spec', 'cuProductSpec'),
      quantity: toNumber(item.quantity, 1),
      unitCost: toNumber(item.price || item.unit_price),
      warehouseName: itemText(item, 'warehouse'),
    }));

  return items.map((item) => {
    // dispatchItems 已有供应商商品字段（派发时已优先保留 cu_product_*），直接用
    const supplierProductCode = (item as Record<string, unknown>).supplierProductCode as string || '';
    const supplierProductName = (item as Record<string, unknown>).supplierProductName as string || '';
    const supplierProductSpec = (item as Record<string, unknown>).supplierProductSpec as string || '';

    const context: Record<string, unknown> = {
      sysOrderNo: order.sys_order_no || '',
      orderNo: order.order_no || '',
      matchCode: order.match_code || '',
      dispatchBatch: batchNo || order.assigned_batch || '',
      // 供应商模板优先用供应商编码，系统模板用系统编码，都没有则互相兜底
      productCode: isSupplierTemplate
        ? (supplierProductCode || (item.productCode as string) || '')
        : ((item.productCode as string) || supplierProductCode || ''),
      productName: isSupplierTemplate
        ? (supplierProductName || (item.productName as string) || '')
        : ((item.productName as string) || supplierProductName || ''),
      productSpec: isSupplierTemplate
        ? (supplierProductSpec || (item.productSpec as string) || '')
        : ((item.productSpec as string) || supplierProductSpec || ''),
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
      remark: order.remark || '',
    };

    return Object.fromEntries(
      Object.entries(fieldMappings).map(([header, fieldKey]) => [header, context[fieldKey] ?? ''])
    );
  });
}

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { supplierIds, templateId, exportedBy, dispatchMode, persistenceMode } = body;
    const exportMode: 'preview' | 'dispatch' = dispatchMode === 'preview' ? 'preview' : 'dispatch';
    const resolvedPersistenceMode: 'none' | 'full' =
      exportMode === 'preview' ? 'none' : persistenceMode === 'none' ? 'none' : 'full';
    const executionMode: 'preview' | 'dispatch_only' | 'dispatch_with_persistence' =
      exportMode === 'preview'
        ? 'preview'
        : resolvedPersistenceMode === 'none'
          ? 'dispatch_only'
          : 'dispatch_with_persistence';

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个供应商' }, { status: 400 });
    }

    let resolvedTemplateId = templateId || null;
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
    const fieldMappings = resolvedTemplate ? parseTemplateFieldMappings(resolvedTemplate) : DEFAULT_SHIPPING_FIELD_MAPPINGS;
    const exportFieldMappings = Object.keys(fieldMappings).length > 0 ? fieldMappings : DEFAULT_SHIPPING_FIELD_MAPPINGS;

    const batchId = crypto.randomUUID();
    const recordId = crypto.randomUUID();
    const batchNo = `SHIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zip = new JSZip();
    const results: Array<Record<string, unknown>> = [];
    const allOrderIds: string[] = [];
    const errors: string[] = [];
    let totalOrderCount = 0;
    let newDispatchCount = 0;
    let reusedDispatchCount = 0;
    let assignedOnlyCount = 0;
    let persistedDetailCount = 0;

    for (const supplierId of supplierIds) {
      const { data: supplier } = await client.from('suppliers').select('*').eq('id', supplierId).maybeSingle();
      if (!supplier) {
        errors.push(`供应商 ${supplierId} 不存在`);
        continue;
      }

      let supplierTemplate = resolvedTemplate;
      let supplierTemplateId = resolvedTemplateId;
      let supplierTemplateName = templateName;
      let supplierTemplateSource: 'explicit' | 'target' | 'linked' | 'default' | 'first' = templateSource;
      if (!supplierTemplate) {
        const { template, source } = await resolvePreferredTemplate(client, { type: 'shipping', targetType: 'supplier', targetId: supplierId });
        if (template) {
          supplierTemplate = template;
          supplierTemplateId = template.id;
          supplierTemplateName = String(template.name || '供应商发货模板');
          supplierTemplateSource = source as 'target' | 'linked' | 'default' | 'first';
        }
      }
      const supplierFieldMappings = supplierTemplate ? parseTemplateFieldMappings(supplierTemplate) : DEFAULT_SHIPPING_FIELD_MAPPINGS;
      const supplierExportFieldMappings = Object.keys(supplierFieldMappings).length > 0 ? supplierFieldMappings : DEFAULT_SHIPPING_FIELD_MAPPINGS;
      const isSupplierTemplate = Boolean(supplierTemplate?.target_type === 'supplier' && supplierTemplate?.target_id === supplierId);

      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .in('status', ['pending', 'assigned'])
        .order('created_at', { ascending: true });
      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
      if (!orders || orders.length === 0) continue;

      const exportRows: Array<Record<string, unknown>> = [];
      let supplierSuccessCount = 0;

      for (const order of orders as Record<string, unknown>[]) {
        try {
          const dispatchResult = exportMode === 'dispatch' && order.status === 'pending'
            ? await dispatchPendingOrder(client, order, supplier as Record<string, unknown>, batchNo)
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
          allOrderIds.push(String(order.id));
          supplierSuccessCount += 1;
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error));
        }
      }

      if (exportRows.length === 0) continue;

      const supplierName = String(supplier.name || '未知供应商');
      const safeSupplierName = supplierName.replace(/[\\/:*?"<>|]/g, '_');
      const fileName = `${safeSupplierName}+发货通知单+${today}.xlsx`;
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const headers = Object.keys(supplierExportFieldMappings);
      worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, Math.min(48, header.length * 2 + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '发货通知单');
      const workbookBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      zip.file(fileName, workbookBuffer);
      const detailIndex = results.length;
      const detailArtifact = exportMode === 'dispatch' && resolvedPersistenceMode === 'full'
        ? await saveExportArtifact(recordId, fileName, workbookBuffer)
        : null;
      if (detailArtifact) {
        persistedDetailCount += 1;
      }

      results.push({
        supplierId,
        supplierName,
        orderCount: supplierSuccessCount,
        templateId: supplierTemplateId,
        templateName: supplierTemplateName,
        templateSource: supplierTemplateSource as string,
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
        message: `已生成预览内容：${results.length}个供应商，共${totalOrderCount}个订单${errors.length ? `，失败${errors.length}条` : ''}`,
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
          dispatchMode: exportMode,
          supplierIds,
        },
      });
    }

    if (resolvedPersistenceMode === 'none') {
      return NextResponse.json({
        success: errors.length === 0,
        message: `成功派发${results.length}个供应商，共${totalOrderCount}个订单${errors.length ? `，失败${errors.length}条` : ''}，未写入导出记录`,
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
        },
      });
    }

    const artifact = await saveExportArtifact(recordId, zipFileName, zipBuffer);

    const { error: recordError } = await client.from('export_records').insert({
      id: recordId,
      export_type: 'shipping_notice',
      business_type: 'dispatch',
      supplier_id: supplierIds.length === 1 ? supplierIds[0] : null,
      order_ids: allOrderIds,
      template_id: resolvedTemplateId,
      template_name: templateName,
      file_url: artifact.downloadPath,
      file_name: zipFileName,
      zip_file_url: artifact.downloadPath,
      zip_file_name: zipFileName,
      total_count: totalOrderCount,
      exported_by: exportedBy || 'system',
      exported_at: new Date().toISOString(),
      metadata: {
        batch_id: batchId,
        batch_no: batchNo,
        supplier_ids: supplierIds,
        download_mode: 'regenerate',
        artifact: {
          relative_path: artifact.relativePath,
          file_name: artifact.fileName,
          provider: artifact.provider,
        },
        template_source: templateSource,
        details: results,
        errors,
      },
    });
    if (recordError) throw new Error(`保存导出记录失败: ${recordError.message}`);

    return NextResponse.json({
      success: errors.length === 0,
      message: `成功导出${results.length}个供应商，共${totalOrderCount}个订单${errors.length ? `，失败${errors.length}条` : ''}`,
      data: {
        batchId,
        recordId,
        batchNo,
        zipFileName,
        zipFileUrl: artifact.downloadPath,
        zipBase64,
        artifact: {
          relative_path: artifact.relativePath,
          file_name: artifact.fileName,
          provider: artifact.provider,
        },
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
          zipArtifactPersisted: true,
          detailArtifactPersistedCount: persistedDetailCount,
        },
        executionMode,
        persistenceMode: resolvedPersistenceMode,
        dispatchMode: exportMode,
        supplierIds,
        details: results,
        errors,
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
