import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取回单导入历史
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const supplierId = searchParams.get('supplierId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '20');

  try {
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

    return NextResponse.json({
      success: true,
      data: data || [],
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
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { supplierId, supplierName, receipts, fileName, importedBy } = body;

    if (!supplierId || !Array.isArray(receipts)) {
      return NextResponse.json({ success: false, error: '参数错误' }, { status: 400 });
    }

    // 创建导入记录
    const { data: record, error: recordError } = await client
      .from('return_receipt_records')
      .insert({
        supplier_id: supplierId,
        supplier_name: supplierName,
        file_name: fileName,
        total_count: receipts.length,
        matched_count: 0,
        unmatched_count: receipts.length,
        imported_by: importedBy || 'system',
      })
      .select()
      .single();

    if (recordError) throw new Error(`创建导入记录失败: ${recordError.message}`);

    // 批量插入回单明细
    const receiptData = receipts.map((r: any) => ({
      record_id: record.id,
      supplier_id: supplierId,
      supplier_name: supplierName,
      customer_order_no: r.customerOrderNo || r.customer_order_no || r['客户订单号'] || '',
      supplier_order_no: r.supplierOrderNo || r.supplier_order_no || r['供应商单据号'] || '',
      express_company: r.expressCompany || r.express_company || r['快递公司'] || '',
      tracking_no: r.trackingNo || r.tracking_no || r['快递单号'] || r['物流单号'] || '',
      ship_date: r.shipDate || r.ship_date || r['发货日期'] || r['日期'] || null,
      warehouse: r.warehouse || '',
      quantity: r.quantity || 1,
      price: r.price || null,
      remark: r.remark || '',
      match_status: 'pending',
    }));

    const { error: insertError } = await client
      .from('return_receipts')
      .insert(receiptData);

    if (insertError) throw new Error(`插入回单明细失败: ${insertError.message}`);

    return NextResponse.json({
      success: true,
      message: `成功导入${receipts.length}条回单记录`,
      data: {
        recordId: record.id,
        totalCount: receipts.length,
      },
    });
  } catch (error) {
    console.error('创建回单导入记录失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
