import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { parseTemplateFieldMappingsArray, resolvePreferredTemplate, type TemplateRecord } from '@/lib/template-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant-context';
import * as XLSX from 'xlsx';

type OrderItem = Record<string, unknown>;

// 金蝶导出默认字段映射 - 有序数组格式，保持导出列顺序
const DEFAULT_KINGDEE_FIELD_MAPPINGS: Array<{ excelColumn: string; systemField: string }> = [
  { excelColumn: '系统单号', systemField: 'sysOrderNo' },
  { excelColumn: '客户单号', systemField: 'orderNo' },
  { excelColumn: '客户', systemField: 'customerName' },
  { excelColumn: '收货人', systemField: 'receiverName' },
  { excelColumn: '电话', systemField: 'receiverPhone' },
  { excelColumn: '地址', systemField: 'receiverAddress' },
  { excelColumn: '商品', systemField: 'productName' },
  { excelColumn: '数量', systemField: 'quantity' },
  { excelColumn: '发货方', systemField: 'supplierName' },
  { excelColumn: '快递公司', systemField: 'expressCompany' },
  { excelColumn: '快递单号', systemField: 'trackingNo' },
  { excelColumn: '业务员', systemField: 'salesperson' },
  { excelColumn: '跟单员', systemField: 'operator' },
  { excelColumn: '派发批次', systemField: 'dispatchBatch' },
  { excelColumn: '日期', systemField: 'createdAt' },
];

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

function itemText(item: OrderItem, ...keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return '';
}

function buildKingdeeRows(
  orders: Record<string, unknown>[],
  fieldMappings: Array<{ excelColumn: string; systemField: string }>
) {
  const normalizedMappings = fieldMappings.length > 0 ? fieldMappings : DEFAULT_KINGDEE_FIELD_MAPPINGS;

  return orders.flatMap((order) => {
    const items = parseItems(order.items);
    const rowItems = items.length > 0
      ? items
      : [{ product_name: '', product_code: '', product_spec: '', quantity: 1, price: null }];

    return rowItems.map((item) => {
      // 构建 context（keys 必须与 DEFAULT_KINGDEE_FIELD_MAPPINGS 值精确一致）
      const context: Record<string, unknown> = {
        sysOrderNo: order.sys_order_no || '',
        orderNo: order.order_no || '',
        customerName: order.customer_name || '',
        receiverName: order.receiver_name || '',
        receiverPhone: order.receiver_phone || '',
        receiverAddress: order.receiver_address || '',
        // 商品信息：优先使用系统商品名称
        productName: itemText(item, 'product_name', 'productName') || itemText(item, 'cu_product_name', 'cuProductName'),
        productCode: itemText(item, 'product_code', 'productCode') || itemText(item, 'cu_product_code', 'cuProductCode'),
        quantity: toNumber(item.quantity, 1),
        supplierName: order.supplier_name || '',
        expressCompany: order.express_company || '',
        trackingNo: order.tracking_no || '',
        salesperson: order.salesperson || '',
        operator: order.operator_name || '',
        dispatchBatch: order.assigned_batch || '',
        createdAt: order.created_at || '',
      };

      return Object.fromEntries(
        normalizedMappings.map(({ excelColumn, systemField }) => [excelColumn, context[systemField] ?? ''])
      );
    });
  });
}

// 批量导出金蝶
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const tenant = await getTenantFromRequest(request);
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个订单' }, { status: 400 });
    }

    // 获取金蝶模板（使用 kingdee 类型）
    const { template, source: templateSource } = await resolvePreferredTemplate(client, { type: 'kingdee' });

    // 获取模板字段映射
    const fieldMappings = template ? parseTemplateFieldMappingsArray(template) : DEFAULT_KINGDEE_FIELD_MAPPINGS;

    // 查询订单数据
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select('*')
      .eq('tenant_id', tenant.tenantId)
      .in('id', orderIds);

    if (ordersError) {
      throw new Error(`查询订单失败: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: false, error: '没有找到可导出的订单' }, { status: 404 });
    }

    // 生成导出数据
    const exportRows = buildKingdeeRows(orders as Record<string, unknown>[], fieldMappings);

    // 生成 Excel
    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const headers = fieldMappings.length > 0 ? fieldMappings.map(m => m.excelColumn) : DEFAULT_KINGDEE_FIELD_MAPPINGS.map(m => m.excelColumn);
    worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, Math.min(40, header.length * 2 + 4)) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '金蝶导出');
    const workbookBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 生成文件名
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `金蝶导出_${today}.xlsx`;

    return new NextResponse(workbookBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      },
    });
  } catch (error) {
    console.error('批量导出金蝶失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
