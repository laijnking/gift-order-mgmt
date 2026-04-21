import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

interface ImportedReceiptInput {
  customerOrderNo?: string;
  customer_order_no?: string;
  supplierOrderNo?: string;
  supplier_order_no?: string;
  expressCompany?: string;
  express_company?: string;
  trackingNo?: string;
  tracking_no?: string;
  shipDate?: string | null;
  ship_date?: string | null;
  warehouse?: string;
  quantity?: number;
  price?: number | null;
  remark?: string;
  ['客户订单号']?: string;
  ['供应商单据号']?: string;
  ['快递公司']?: string;
  ['快递单号']?: string;
  ['物流单号']?: string;
  ['发货日期']?: string | null;
  ['日期']?: string | null;
}

type DuplicateReason = 'batch_duplicate' | 'existing_receipt';

type NormalizedReceiptIdentity = {
  customerOrderNo: string;
  supplierOrderNo: string;
  expressCompany: string;
  trackingNo: string;
  shipDate: string | null;
  warehouse: string;
  quantity: number;
  price: number | null;
  remark: string;
};

type DuplicateDetail = {
  index: number;
  reason: DuplicateReason;
  matchedFields: Array<'tracking_no' | 'supplier_order_no' | 'customer_order_no'>;
  trackingNo: string;
  supplierOrderNo: string;
  customerOrderNo: string;
  existingReceiptId?: string;
};

const DUPLICATE_FIELDS = ['tracking_no', 'supplier_order_no', 'customer_order_no'] as const;
type DuplicateField = typeof DUPLICATE_FIELDS[number];

function normalizeText(value: unknown) {
  return String(value ?? '').trim();
}

function normalizeImportedReceipt(record: ImportedReceiptInput): NormalizedReceiptIdentity {
  const rawPrice = record.price;
  return {
    customerOrderNo: normalizeText(record.customerOrderNo || record.customer_order_no || record['客户订单号']),
    supplierOrderNo: normalizeText(record.supplierOrderNo || record.supplier_order_no || record['供应商单据号']),
    expressCompany: normalizeText(record.expressCompany || record.express_company || record['快递公司']),
    trackingNo: normalizeText(record.trackingNo || record.tracking_no || record['快递单号'] || record['物流单号']),
    shipDate: normalizeText(record.shipDate || record.ship_date || record['发货日期'] || record['日期']) || null,
    warehouse: normalizeText(record.warehouse),
    quantity: record.quantity || 1,
    price: typeof rawPrice === 'number' ? rawPrice : rawPrice ? Number(rawPrice) : null,
    remark: normalizeText(record.remark),
  };
}

function buildDuplicateKey(field: DuplicateField, value: string) {
  return `${field}:${value.toLowerCase()}`;
}

function buildDuplicateKeys(receipt: Pick<NormalizedReceiptIdentity, 'trackingNo' | 'supplierOrderNo' | 'customerOrderNo'>) {
  const entries: Array<[DuplicateField, string]> = [
    ['tracking_no', receipt.trackingNo],
    ['supplier_order_no', receipt.supplierOrderNo],
    ['customer_order_no', receipt.customerOrderNo],
  ];

  return entries
    .filter(([, value]) => Boolean(value))
    .map(([field, value]) => ({
      field,
      key: buildDuplicateKey(field, value),
    }));
}

type ReviewStatus = 'matched' | 'needs_review' | 'conflict';

function getReviewStatus(matchStatus: unknown): ReviewStatus {
  if (matchStatus === 'conflict') return 'conflict';
  if (matchStatus === 'auto_matched' || matchStatus === 'manual_matched') return 'matched';
  return 'needs_review';
}

function buildReviewSummary(receipts: Array<Record<string, unknown>>) {
  return receipts.reduce<{
    matchedCount: number;
    needsReviewCount: number;
    conflictCount: number;
  }>(
    (summary, receipt) => {
      const reviewStatus = getReviewStatus(receipt.match_status);
      if (reviewStatus === 'matched') {
        summary.matchedCount += 1;
      } else if (reviewStatus === 'conflict') {
        summary.conflictCount += 1;
      } else {
        summary.needsReviewCount += 1;
      }
      return summary;
    },
    {
      matchedCount: 0,
      needsReviewCount: 0,
      conflictCount: 0,
    }
  );
}

function mapRecord(record: Record<string, unknown>) {
  return {
    ...record,
    supplierId: record.supplier_id,
    supplierName: record.supplier_name,
    fileName: record.file_name,
    totalCount: record.total_count,
    matchedCount: record.matched_count,
    unmatchedCount: record.unmatched_count,
    importedAt: record.imported_at,
    importedBy: record.imported_by,
    reviewCount: record.review_count,
    conflictCount: record.conflict_count,
    reviewStatus: record.review_status,
  };
}

function mapReceipt(receipt: Record<string, unknown>) {
  const reviewStatus = getReviewStatus(receipt.match_status);
  return {
    ...receipt,
    supplierId: receipt.supplier_id,
    supplierName: receipt.supplier_name,
    customerOrderNo: receipt.customer_order_no,
    supplierOrderNo: receipt.supplier_order_no,
    expressCompany: receipt.express_company,
    trackingNo: receipt.tracking_no,
    shipDate: receipt.ship_date,
    matchStatus: receipt.match_status,
    orderId: receipt.order_id,
    orderNo: receipt.order_no,
    createdAt: receipt.created_at,
    matchedAt: receipt.matched_at,
    reviewStatus,
    reviewReason: reviewStatus === 'conflict'
      ? 'conflict'
      : reviewStatus === 'needs_review'
        ? 'unmatched'
        : 'matched',
  };
}

// 获取回单导入历史
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_VIEW);
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const recordId = searchParams.get('recordId');
  const supplierId = searchParams.get('supplierId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
    if (recordId) {
      const { data: record, error: recordError } = await client
        .from('return_receipt_records')
        .select('*')
        .eq('id', recordId)
        .single();

      if (recordError) throw new Error(`查询导入记录失败: ${recordError.message}`);

      const { data: receipts, error: receiptsError } = await client
        .from('return_receipts')
        .select('*')
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (receiptsError) throw new Error(`查询回单明细失败: ${receiptsError.message}`);

      const orderIds = (receipts || [])
        .map((receipt) => receipt.order_id)
        .filter((orderId): orderId is string => typeof orderId === 'string' && orderId.length > 0);

      let orderMap = new Map<string, string>();
      if (orderIds.length > 0) {
        const { data: orders, error: ordersError } = await client
          .from('orders')
          .select('id, order_no')
          .in('id', orderIds);

        if (ordersError) throw new Error(`查询关联订单失败: ${ordersError.message}`);

        orderMap = new Map((orders || []).map((order) => [order.id, order.order_no]));
      }

      const mappedReceipts = (receipts || []).map((receipt) => {
        return mapReceipt({
          ...receipt,
          order_no: receipt.order_id ? orderMap.get(receipt.order_id) || null : null,
        });
      });

      const reviewSummary = buildReviewSummary(receipts || []);

      return NextResponse.json({
        success: true,
        data: {
          ...mapRecord(record),
          receipts: mappedReceipts,
          reviewSummary,
        },
      });
    }

    let query = client
      .from('return_receipt_records')
      .select('*', { count: 'exact' })
      .order('imported_at', { ascending: false });

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (startDate) {
      query = query.gte('imported_at', startDate);
    }

    if (endDate) {
      query = query.lte('imported_at', endDate + ' 23:59:59');
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw new Error(`查询回单历史失败: ${error.message}`);

    const recordIds = (data || []).map((record) => record.id).filter(Boolean);
    const reviewStatsMap = new Map<
      string,
      {
        reviewCount: number;
        conflictCount: number;
        reviewStatus: 'clean' | 'needs_review' | 'has_conflict';
      }
    >();

    if (recordIds.length > 0) {
      const { data: receiptRows, error: receiptStatsError } = await client
        .from('return_receipts')
        .select('record_id, match_status')
        .in('record_id', recordIds);

      if (receiptStatsError) throw new Error(`查询回单复核统计失败: ${receiptStatsError.message}`);

      for (const row of receiptRows || []) {
        const recordId = row.record_id as string | undefined;
        if (!recordId) continue;

        const current = reviewStatsMap.get(recordId) || {
          reviewCount: 0,
          conflictCount: 0,
          reviewStatus: 'clean' as const,
        };

        const reviewStatus = getReviewStatus(row.match_status);
        if (reviewStatus === 'needs_review') {
          current.reviewCount += 1;
          if (current.reviewStatus === 'clean') {
            current.reviewStatus = 'needs_review';
          }
        }
        if (reviewStatus === 'conflict') {
          current.reviewCount += 1;
          current.conflictCount += 1;
          current.reviewStatus = 'has_conflict';
        }

        reviewStatsMap.set(recordId, current);
      }
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map((record) =>
        mapRecord({
          ...record,
          review_count: reviewStatsMap.get(record.id)?.reviewCount || 0,
          conflict_count: reviewStatsMap.get(record.id)?.conflictCount || 0,
          review_status: reviewStatsMap.get(record.id)?.reviewStatus || 'clean',
        })
      ),
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    });
  } catch (error) {
    console.error('获取回单导入历史失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 创建回单导入记录（导入Excel后）
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { supplierId, supplierName, receipts, fileName, importedBy } = body;

    if (!supplierId || !Array.isArray(receipts)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    const normalizedReceipts = (receipts as ImportedReceiptInput[]).map((receipt, index) => ({
      index,
      receipt: normalizeImportedReceipt(receipt),
    }));

    const { data: existingReceipts, error: existingReceiptsError } = await client
      .from('return_receipts')
      .select('id, tracking_no, supplier_order_no, customer_order_no')
      .eq('supplier_id', supplierId);

    if (existingReceiptsError) throw new Error(`查询已存在回单失败: ${existingReceiptsError.message}`);

    const existingKeyMap = new Map<string, { receiptId: string; field: DuplicateField }>();
    for (const existingReceipt of existingReceipts || []) {
      const existingRecord = {
        trackingNo: normalizeText(existingReceipt.tracking_no),
        supplierOrderNo: normalizeText(existingReceipt.supplier_order_no),
        customerOrderNo: normalizeText(existingReceipt.customer_order_no),
      };

      for (const { field, key } of buildDuplicateKeys(existingRecord)) {
        if (!existingKeyMap.has(key)) {
          existingKeyMap.set(key, {
            receiptId: String(existingReceipt.id),
            field,
          });
        }
      }
    }

    const batchKeyMap = new Map<string, { field: DuplicateField }>();
    const duplicateDetails: DuplicateDetail[] = [];
    const acceptedReceipts: Array<{ index: number; receipt: NormalizedReceiptIdentity }> = [];
    let batchDuplicateCount = 0;
    let existingDuplicateCount = 0;

    for (const item of normalizedReceipts) {
      const keys = buildDuplicateKeys(item.receipt);
      const existingMatches = keys
        .map(({ field, key }) => {
          const match = existingKeyMap.get(key);
          return match ? { field, receiptId: match.receiptId } : null;
        })
        .filter((match): match is { field: DuplicateField; receiptId: string } => Boolean(match));

      if (existingMatches.length > 0) {
        existingDuplicateCount += 1;
        duplicateDetails.push({
          index: item.index,
          reason: 'existing_receipt',
          matchedFields: Array.from(new Set(existingMatches.map((match) => match.field))),
          trackingNo: item.receipt.trackingNo,
          supplierOrderNo: item.receipt.supplierOrderNo,
          customerOrderNo: item.receipt.customerOrderNo,
          existingReceiptId: existingMatches[0]?.receiptId,
        });
        continue;
      }

      const batchMatches = keys
        .map(({ field, key }) => (batchKeyMap.has(key) ? field : null))
        .filter((field): field is DuplicateField => Boolean(field));

      if (batchMatches.length > 0) {
        batchDuplicateCount += 1;
        duplicateDetails.push({
          index: item.index,
          reason: 'batch_duplicate',
          matchedFields: Array.from(new Set(batchMatches)),
          trackingNo: item.receipt.trackingNo,
          supplierOrderNo: item.receipt.supplierOrderNo,
          customerOrderNo: item.receipt.customerOrderNo,
        });
        continue;
      }

      acceptedReceipts.push(item);
      for (const { field, key } of keys) {
        batchKeyMap.set(key, { field });
      }
    }

    const insertedCount = acceptedReceipts.length;
    const skippedCount = duplicateDetails.length;
    const duplicateSummary = {
      totalSkipped: skippedCount,
      batchDuplicateCount,
      existingDuplicateCount,
      details: duplicateDetails,
    };

    if (insertedCount === 0) {
      return NextResponse.json({
        success: true,
        message: skippedCount > 0 ? `未导入新回单，已跳过${skippedCount}条重复记录` : '未导入新回单',
        data: {
          recordId: null,
          totalCount: receipts.length,
          importedCount: 0,
          skippedCount,
        },
        duplicateSummary,
      });
    }

    // 创建导入记录
    const { data: record, error: recordError } = await client
      .from('return_receipt_records')
      .insert({
        supplier_id: supplierId,
        supplier_name: supplierName,
        file_name: fileName,
        total_count: insertedCount,
        matched_count: 0,
        unmatched_count: insertedCount,
        imported_by: importedBy || 'system',
      })
      .select()
      .single();

    if (recordError) throw new Error(`创建导入记录失败: ${recordError.message}`);

    // 批量插入回单明细
    const receiptData = acceptedReceipts.map(({ receipt }) => ({
      record_id: record.id,
      supplier_id: supplierId,
      supplier_name: supplierName,
      customer_order_no: receipt.customerOrderNo,
      supplier_order_no: receipt.supplierOrderNo,
      express_company: receipt.expressCompany,
      tracking_no: receipt.trackingNo,
      ship_date: receipt.shipDate,
      warehouse: receipt.warehouse,
      quantity: receipt.quantity,
      price: receipt.price,
      remark: receipt.remark,
      match_status: 'pending',
    }));

    const { error: insertError } = await client
      .from('return_receipts')
      .insert(receiptData);

    if (insertError) throw new Error(`插入回单明细失败: ${insertError.message}`);

    return NextResponse.json({
      success: true,
      message: skippedCount > 0
        ? `成功导入${insertedCount}条回单记录，跳过${skippedCount}条重复记录`
        : `成功导入${insertedCount}条回单记录`,
      data: {
        recordId: record.id,
        totalCount: receipts.length,
        importedCount: insertedCount,
        skippedCount,
      },
      duplicateSummary,
    });
  } catch (error) {
    console.error('创建回单导入记录失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
