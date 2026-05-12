import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

interface DuplicateInfo {
  orderNo: string;
  receiverName: string;
  sysOrderNo?: string;
}

interface FuzzyDuplicateInfo extends DuplicateInfo {
  matchReason: 'fuzzy_match';
}

interface CheckItem {
  orderNo?: string;
  customerOrderNo?: string;
  productName?: string;
  productSpec?: string;
  productCode?: string;
  receiverPhone?: string;
  receiverName?: string;
  quantity?: number;
}

function buildKey(customerCode: string, identifier: string): string {
  return `${customerCode}::${identifier.trim().toUpperCase()}`;
}

/** 检查 items JSONB 中是否有与目标商品匹配的 item */
function itemMatchesFuzzy(
  items: Record<string, unknown>[],
  target: CheckItem,
): boolean {
  if (!Array.isArray(items)) return false;
  return items.some((item) => {
    const cuName = String(item.cu_product_name || item.product_name || '').trim();
    const cuSpec = String(item.cu_product_spec || item.product_spec || '').trim();
    const cuCode = String(item.cu_product_code || item.product_code || '').trim();

    const targetName = (target.productName || '').trim();
    const targetSpec = (target.productSpec || '').trim();
    const targetCode = (target.productCode || '').trim();

    // 任一产品维度匹配
    const productMatch =
      (targetName && cuName === targetName) ||
      (targetSpec && cuSpec === targetSpec) ||
      (targetCode && cuCode === targetCode);

    const qtyMatch = Number(item.quantity) === (target.quantity || 0);

    return productMatch && qtyMatch;
  });
}

export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const customerCode = searchParams.get('customerCode');
  const orderNosParam = searchParams.get('orderNos');

  if (!customerCode || !orderNosParam) {
    return NextResponse.json({
      success: false,
      error: '缺少 customerCode 或 orderNos 参数',
    }, { status: 400 });
  }

  const orderNos = orderNosParam.split(',').map((s) => s.trim()).filter(Boolean);
  if (orderNos.length === 0) {
    return NextResponse.json({
      success: true,
      data: { existingOrders: [], batchDuplicates: [], fuzzyDuplicates: [] },
    });
  }

  const client = getSupabaseClient();

  try {
    // 批次内重复
    const seen = new Set<string>();
    const batchDuplicates: DuplicateInfo[] = [];
    for (const orderNo of orderNos) {
      const key = buildKey(customerCode, orderNo);
      if (seen.has(key)) {
        batchDuplicates.push({ orderNo, receiverName: '' });
      } else {
        seen.add(key);
      }
    }

    // 查 3 天内 order_no 或 customer_order_no 匹配的订单
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingOrders, error } = await client
      .from('orders')
      .select('order_no, customer_order_no, sys_order_no, receiver_name, customer_code')
      .eq('customer_code', customerCode)
      .gte('created_at', threeDaysAgo);

    if (error) {
      return NextResponse.json({
        success: false,
        error: `查询重复订单失败: ${error.message}`,
      }, { status: 500 });
    }

    const orderNoSet = new Set(orderNos.map((n) => n.toUpperCase().trim()));
    const existingOrdersResult: DuplicateInfo[] = [];
    for (const o of existingOrders || []) {
      const dbOrderNo = String(o.order_no || '').trim().toUpperCase();
      const dbCustomerOrderNo = String(o.customer_order_no || '').trim().toUpperCase();
      if ((dbOrderNo && orderNoSet.has(dbOrderNo)) || (dbCustomerOrderNo && orderNoSet.has(dbCustomerOrderNo))) {
        existingOrdersResult.push({
          orderNo: String(o.order_no || o.customer_order_no || ''),
          sysOrderNo: String(o.sys_order_no || ''),
          receiverName: String(o.receiver_name || ''),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        existingOrders: existingOrdersResult,
        batchDuplicates,
        fuzzyDuplicates: [],
      },
    });
  } catch (error) {
    console.error('检查重复订单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerCode, items = [] } = body as { customerCode?: string; items?: CheckItem[] };

    if (!customerCode || items.length === 0) {
      return NextResponse.json({
        success: false,
        error: '缺少 customerCode 或 items 参数',
      }, { status: 400 });
    }

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // —— A. 订单编码检测（order_no + customer_order_no）——

    // 收集所有 orderNo 和 customerOrderNo
    const allOrderNos = items.map((it) => (it.orderNo || '').trim()).filter(Boolean);
    const allCustomerOrderNos = items.map((it) => (it.customerOrderNo || '').trim()).filter(Boolean);
    const allIdentifiers = [...allOrderNos, ...allCustomerOrderNos];

    // 批次内重复
    const seen = new Set<string>();
    const batchDuplicates: DuplicateInfo[] = [];
    for (const identifier of allIdentifiers) {
      const key = buildKey(customerCode, identifier);
      if (seen.has(key)) {
        batchDuplicates.push({ orderNo: identifier, receiverName: '' });
      } else {
        seen.add(key);
      }
    }

    // 查 3 天内已有订单
    const { data: recentOrders, error: queryError } = await client
      .from('orders')
      .select('id, order_no, customer_order_no, sys_order_no, receiver_name, receiver_phone, items')
      .eq('customer_code', customerCode)
      .gte('created_at', threeDaysAgo);

    if (queryError) {
      return NextResponse.json({
        success: false,
        error: `查询重复订单失败: ${queryError.message}`,
      }, { status: 500 });
    }

    const recentOrderList = (recentOrders || []) as Array<{
      id: string;
      order_no: string | null;
      customer_order_no: string | null;
      sys_order_no: string | null;
      receiver_name: string | null;
      receiver_phone: string | null;
      items: Record<string, unknown>[];
    }>;

    // 订单编码匹配
    const identifierSet = new Set(allIdentifiers.map((n) => n.toUpperCase().trim()));
    const matchedOrderIds = new Set<string>();
    const existingOrdersResult: DuplicateInfo[] = [];

    for (const o of recentOrderList) {
      const dbOrderNo = String(o.order_no || '').trim().toUpperCase();
      const dbCustomerOrderNo = String(o.customer_order_no || '').trim().toUpperCase();
      if ((dbOrderNo && identifierSet.has(dbOrderNo)) || (dbCustomerOrderNo && identifierSet.has(dbCustomerOrderNo))) {
        matchedOrderIds.add(o.id);
        existingOrdersResult.push({
          orderNo: String(o.order_no || o.customer_order_no || ''),
          sysOrderNo: String(o.sys_order_no || ''),
          receiverName: String(o.receiver_name || ''),
        });
      }
    }

    // —— B. 模糊维度检测（product + phone + quantity）——
    const fuzzyDuplicates: FuzzyDuplicateInfo[] = [];

    for (const item of items) {
      const phone = (item.receiverPhone || '').trim();
      if (!phone || !item.quantity) continue;

      for (const o of recentOrderList) {
        if (matchedOrderIds.has(o.id)) continue; // 已命中订单编码检测

        const dbPhone = String(o.receiver_phone || '').trim();
        if (dbPhone !== phone) continue;

        const dbItems = o.items;
        if (!Array.isArray(dbItems)) continue;

        if (itemMatchesFuzzy(dbItems, item)) {
          fuzzyDuplicates.push({
            orderNo: item.orderNo || item.customerOrderNo || '',
            receiverName: item.receiverName || '',
            sysOrderNo: o.sys_order_no || '',
            matchReason: 'fuzzy_match',
          });
          break; // 找到匹配即停止
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        existingOrders: existingOrdersResult,
        batchDuplicates,
        fuzzyDuplicates,
      },
    });
  } catch (error) {
    console.error('[check-duplicates POST] unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
