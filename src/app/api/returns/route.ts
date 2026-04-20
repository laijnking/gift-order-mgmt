import { NextRequest, NextResponse } from 'next/server';
import { syncOrderCostHistoryAfterReturn } from '@/lib/order-cost-history';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

interface ReturnRow {
  matchCode: string;
  orderNo: string;
  receiverPhone: string;
  receiverName: string;
  productName: string;
  expressCompany: string;
  trackingNo: string;
  quantity: number;
  remark: string;
}

function pick(row: Record<string, unknown>, names: string[]): string {
  for (const name of names) {
    const value = row[name];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function toNumber(value: unknown, fallback = 1): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function findHeader(headers: string[], candidates: string[]): number | null {
  for (const candidate of candidates) {
    const index = headers.findIndex((header) => header.includes(candidate) || candidate.includes(header));
    if (index !== -1) return index;
  }
  return null;
}

function normalizeObjectRows(rows: Record<string, unknown>[]): ReturnRow[] {
  return rows
    .map((row) => ({
      matchCode: pick(row, ['matchCode', 'match_code', '匹配码', '内部订单号']),
      orderNo: pick(row, ['orderNo', 'order_no', '客户订单号', '订单号', '客户单据号']),
      receiverPhone: pick(row, ['receiverPhone', 'receiver_phone', '收货电话', '联系电话', '手机号码']),
      receiverName: pick(row, ['receiverName', 'receiver_name', '收货人', '收件人']),
      productName: pick(row, ['productName', 'product_name', '商品名称', '品名']),
      expressCompany: pick(row, ['expressCompany', 'express_company', '快递公司', '物流公司', '承运商']) || '其他',
      trackingNo: pick(row, ['trackingNo', 'tracking_no', '快递单号', '物流单号', '运单号']),
      quantity: toNumber(pick(row, ['quantity', '数量', '件数']), 1),
      remark: pick(row, ['remark', '备注']),
    }))
    .filter((row) => row.trackingNo);
}

async function parseRows(request: NextRequest): Promise<{ rows: ReturnRow[]; supplierId: string | null; supplierName: string }> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) throw new Error('请上传回单Excel文件');

    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as (string | number | undefined)[][];
    if (data.length < 2) throw new Error('Excel文件数据为空');

    const headers = data[0].map((h) => String(h || '').trim());
    const mapping = {
      matchCode: findHeader(headers, ['内部订单号', '匹配码']),
      orderNo: findHeader(headers, ['客户订单号', '客户单据号', '订单号']),
      receiverPhone: findHeader(headers, ['收货电话', '联系电话', '手机号码']),
      receiverName: findHeader(headers, ['收货人', '收件人']),
      productName: findHeader(headers, ['商品名称', '品名']),
      expressCompany: findHeader(headers, ['快递公司', '物流公司', '承运商']),
      trackingNo: findHeader(headers, ['快递单号', '物流单号', '运单号', '单号']),
      quantity: findHeader(headers, ['数量', '件数']),
      remark: findHeader(headers, ['备注']),
    };

    const rows = data.slice(1).map((row) => {
      const getValue = (index: number | null) => index === null ? '' : String(row[index] || '').trim();
      return {
        matchCode: getValue(mapping.matchCode),
        orderNo: getValue(mapping.orderNo),
        receiverPhone: getValue(mapping.receiverPhone),
        receiverName: getValue(mapping.receiverName),
        productName: getValue(mapping.productName),
        expressCompany: getValue(mapping.expressCompany) || '其他',
        trackingNo: getValue(mapping.trackingNo),
        quantity: toNumber(getValue(mapping.quantity), 1),
        remark: getValue(mapping.remark),
      };
    }).filter((row) => row.trackingNo);

    return {
      rows,
      supplierId: (formData.get('supplierId') as string) || null,
      supplierName: (formData.get('supplierName') as string) || '',
    };
  }

  const body = await request.json();
  return {
    rows: normalizeObjectRows(body.rows || body.data || []),
    supplierId: body.supplierId || null,
    supplierName: body.supplierName || '',
  };
}

async function findOrder(client: ReturnType<typeof getSupabaseClient>, row: ReturnRow) {
  if (row.matchCode) {
    const { data } = await client.from('orders').select('*').eq('match_code', row.matchCode).maybeSingle();
    if (data) return { order: data as Record<string, unknown>, matchedBy: 'match_code' };
  }

  if (row.orderNo && row.receiverPhone) {
    const { data } = await client
      .from('orders')
      .select('*')
      .eq('order_no', row.orderNo)
      .eq('receiver_phone', row.receiverPhone)
      .maybeSingle();
    if (data) return { order: data as Record<string, unknown>, matchedBy: 'order_phone' };
  }

  if (row.orderNo && row.receiverName) {
    const { data } = await client
      .from('orders')
      .select('*')
      .eq('order_no', row.orderNo)
      .eq('receiver_name', row.receiverName)
      .maybeSingle();
    if (data) return { order: data as Record<string, unknown>, matchedBy: 'order_name' };
  }

  if (row.orderNo) {
    const { data } = await client.from('orders').select('*').eq('order_no', row.orderNo).maybeSingle();
    if (data) return { order: data as Record<string, unknown>, matchedBy: 'order_no' };
  }

  if (row.receiverPhone && row.productName) {
    const { data } = await client
      .from('orders')
      .select('*')
      .eq('receiver_phone', row.receiverPhone)
      .limit(20);
    const match = data?.find((order: Record<string, unknown>) => JSON.stringify(order.items || '').includes(row.productName));
    if (match) return { order: match as Record<string, unknown>, matchedBy: 'phone_product' };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'orders:edit');
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const { rows, supplierId, supplierName } = await parseRows(request);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '没有有效的回单数据' }, { status: 400 });
    }

    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatched: string[] = [];

    for (const row of rows) {
      const matched = await findOrder(client, row);
      const now = new Date().toISOString();

      if (!matched) {
        unmatchedCount += 1;
        unmatched.push(`${row.orderNo || row.matchCode || row.receiverPhone || '未知'} - ${row.trackingNo}`);
        await client.from('return_records').insert({
          order_no: row.orderNo || null,
          express_company: row.expressCompany,
          tracking_no: row.trackingNo,
          returned_at: now,
          matched_by: 'unmatched',
          match_confidence: 0,
          supplier_id: supplierId,
          supplier_name: supplierName || null,
          operator: 'system',
          status: 'unmatched',
          remark: row.remark || null,
        });
        continue;
      }

      const order = matched.order;
      await client.from('return_records').insert({
        order_id: order.id,
        order_no: order.order_no,
        express_company: row.expressCompany,
        tracking_no: row.trackingNo,
        returned_at: now,
        matched_by: matched.matchedBy,
        match_confidence: matched.matchedBy === 'order_no' ? 80 : 95,
        supplier_id: supplierId || order.supplier_id || null,
        supplier_name: supplierName || order.supplier_name || null,
        operator: 'system',
        status: 'matched',
        remark: row.remark || null,
      });

      await client
        .from('orders')
        .update({
          express_company: row.expressCompany,
          tracking_no: row.trackingNo,
          status: 'returned',
          updated_at: now,
        })
        .eq('id', order.id);

      await syncOrderCostHistoryAfterReturn(client, {
        orderId: String(order.id),
        expressCompany: row.expressCompany,
        trackingNo: row.trackingNo,
        returnedAt: now,
      });

      await client.from('return_receipts').insert({
        order_id: order.id,
        supplier_id: supplierId || order.supplier_id || null,
        supplier_name: supplierName || order.supplier_name || null,
        customer_order_no: order.order_no,
        express_company: row.expressCompany,
        tracking_no: row.trackingNo,
        ship_date: now.slice(0, 10),
        quantity: row.quantity,
        remark: row.remark || null,
        match_status: 'matched',
        matched_at: now,
        supplier_order_no: order.supplier_order_no || null,
        warehouse: order.warehouse || null,
        order_id_key: order.id,
      });

      matchedCount += 1;
    }

    return NextResponse.json({
      success: true,
      data: { matchedCount, unmatchedCount, unmatched: unmatched.slice(0, 20) },
      message: `回单处理完成：匹配 ${matchedCount} 条，未匹配 ${unmatchedCount} 条`,
    });
  } catch (error) {
    console.error('导入回单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
