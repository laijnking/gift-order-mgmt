import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { parseTemplateFieldMappings, resolvePreferredTemplate, type TemplateRecord } from '@/lib/template-utils';
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

function toDateOnly(value?: unknown): string {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
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

async function dispatchPendingOrder(
  client: ReturnType<typeof getSupabaseClient>,
  order: Record<string, unknown>,
  supplier: Record<string, unknown>,
  batchNo: string
) {
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

    await client.from('order_cost_history').insert({
      order_id: order.id,
      order_no: order.order_no,
      match_code: order.match_code || null,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      warehouse_id: stock.warehouse_id || null,
      warehouse_name: stock.warehouse_name || null,
      product_code: stock.product_code || itemText(item, 'product_code', 'productCode'),
      product_name: stock.product_name || itemText(item, 'product_name', 'productName'),
      quantity,
      unit_cost: unitCost,
      total_cost: unitCost * quantity,
      express_fee: 0,
      other_fee: 0,
      total_amount: unitCost * quantity,
      receiver_name: order.receiver_name || null,
      receiver_phone: order.receiver_phone || null,
      receiver_address: order.receiver_address || null,
      customer_code: order.customer_code || null,
      customer_name: order.customer_name || null,
      salesperson: order.salesperson || null,
      operator_name: order.operator_name || null,
      order_date: toDateOnly(order.created_at),
      shipped_date: toDateOnly(),
      dispatch_batch: batchNo,
      remark: order.remark || null,
    });

    dispatchItems.push({
      productCode: stock.product_code || itemText(item, 'product_code', 'productCode'),
      productName: stock.product_name || itemText(item, 'product_name', 'productName'),
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

  return dispatchItems;
}

function rowsForOrder(
  order: Record<string, unknown>,
  fieldMappings: Record<string, string>,
  batchNo: string,
  dispatchItems?: Array<Record<string, unknown>>
) {
  const items = dispatchItems && dispatchItems.length > 0
    ? dispatchItems
    : parseItems(order.items).map((item) => ({
      productCode: itemText(item, 'product_code', 'productCode'),
      productName: itemText(item, 'product_name', 'productName', 'cu_product_name', 'cuProductName'),
      productSpec: itemText(item, 'product_spec', 'productSpec', 'cu_product_spec', 'cuProductSpec'),
      quantity: toNumber(item.quantity, 1),
      unitCost: toNumber(item.price || item.unit_price),
      warehouseName: itemText(item, 'warehouse'),
    }));

  return items.map((item) => {
    const context: Record<string, unknown> = {
      sysOrderNo: order.sys_order_no || '',
      orderNo: order.order_no || '',
      matchCode: order.match_code || '',
      dispatchBatch: batchNo || order.assigned_batch || '',
      productCode: item.productCode || '',
      productName: item.productName || '',
      productSpec: item.productSpec || '',
      quantity: item.quantity || 1,
      unitCost: item.unitCost || '',
      warehouseName: item.warehouseName || '',
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
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { supplierIds, templateId, exportedBy } = body;

    if (!Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个供应商' }, { status: 400 });
    }

    let resolvedTemplateId = templateId || null;
    let resolvedTemplate: TemplateRecord | null = null;
    let templateName = '默认发货通知模板';
    if (resolvedTemplateId) {
      const { data: template } = await client.from('templates').select('*').eq('id', resolvedTemplateId).maybeSingle();
      if (template) {
        resolvedTemplate = template as TemplateRecord;
        if (template.name) templateName = String(template.name);
      }
    } else {
      const { template } = await resolvePreferredTemplate(client, { type: 'shipping' });
      if (template) {
        resolvedTemplate = template;
        if (template.id) resolvedTemplateId = template.id;
        if (template.name) templateName = String(template.name);
      }
    }
    const fieldMappings = resolvedTemplate ? parseTemplateFieldMappings(resolvedTemplate) : DEFAULT_SHIPPING_FIELD_MAPPINGS;
    const exportFieldMappings = Object.keys(fieldMappings).length > 0 ? fieldMappings : DEFAULT_SHIPPING_FIELD_MAPPINGS;

    const batchId = crypto.randomUUID();
    const batchNo = `SHIP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-5)}`;
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zip = new JSZip();
    const results: Array<Record<string, unknown>> = [];
    const allOrderIds: string[] = [];
    const errors: string[] = [];
    let totalOrderCount = 0;

    for (const supplierId of supplierIds) {
      const { data: supplier } = await client.from('suppliers').select('*').eq('id', supplierId).maybeSingle();
      if (!supplier) {
        errors.push(`供应商 ${supplierId} 不存在`);
        continue;
      }

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
          const dispatchItems = order.status === 'pending'
            ? await dispatchPendingOrder(client, order, supplier as Record<string, unknown>, batchNo)
            : undefined;
          exportRows.push(...rowsForOrder(order, exportFieldMappings, batchNo, dispatchItems));
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
      const headers = Object.keys(exportFieldMappings);
      worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, Math.min(48, header.length * 2 + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '发货通知单');
      zip.file(fileName, XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));

      results.push({
        supplierId,
        supplierName,
        orderCount: supplierSuccessCount,
        templateId: resolvedTemplateId,
        templateName,
        fileName,
        fileUrl: `/exports/${fileName}`,
        status: 'success',
      });
      totalOrderCount += supplierSuccessCount;
    }

    if (totalOrderCount === 0) {
      return NextResponse.json({ success: false, error: errors.join('；') || '没有可导出的订单' }, { status: 400 });
    }

    const zipFileName = `发货通知单批量导出+${today}.zip`;
    const zipBase64 = (await zip.generateAsync({ type: 'nodebuffer' })).toString('base64');

    const { error: recordError } = await client.from('export_records').insert({
      export_type: 'shipping_notice',
      business_type: 'dispatch',
      supplier_id: supplierIds.length === 1 ? supplierIds[0] : null,
      order_ids: allOrderIds,
      template_id: resolvedTemplateId,
      template_name: templateName,
      file_url: `/exports/${zipFileName}`,
      file_name: zipFileName,
      zip_file_url: `/exports/${zipFileName}`,
      zip_file_name: zipFileName,
      total_count: totalOrderCount,
      exported_by: exportedBy || 'system',
      exported_at: new Date().toISOString(),
      metadata: { batch_id: batchId, batch_no: batchNo, supplier_ids: supplierIds, details: results, errors },
    });
    if (recordError) throw new Error(`保存导出记录失败: ${recordError.message}`);

    return NextResponse.json({
      success: errors.length === 0,
      message: `成功导出${results.length}个供应商，共${totalOrderCount}个订单${errors.length ? `，失败${errors.length}条` : ''}`,
      data: {
        batchId,
        batchNo,
        zipFileName,
        zipFileUrl: `/exports/${zipFileName}`,
        zipBase64,
        totalSupplierCount: results.length,
        totalOrderCount,
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
