import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 批量导出客户反馈单
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerIds, templateId, exportedBy, skipUnshipped = false } = body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个客户' }, { status: 400 });
    }

    const results = [];
    const batchId = crypto.randomUUID();
    let totalOrderCount = 0;
    let totalShippedCount = 0;
    let totalPendingReceiptCount = 0;

    // 获取模板信息
    let templateName = '默认客户反馈模板';
    if (templateId) {
      const { data: template } = await client
        .from('templates')
        .select('name')
        .eq('id', templateId)
        .single();
      if (template) templateName = template.name;
    }

    // 按客户分别处理
    for (const customerId of customerIds) {
      // 获取客户已发货订单（状态为shipped）
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('customer_code', customerId)
        .eq('status', 'shipped');

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);

      if (!orders || orders.length === 0) continue;

      // 统计已回单和待回单订单
      let shippedCount = 0;
      let pendingReceiptCount = 0;

      for (const order of orders) {
        if (order.tracking_no && order.tracking_no.trim() !== '') {
          shippedCount++;
        } else {
          pendingReceiptCount++;
        }
      }

      // 如果设置了跳过未回单订单且存在未回单订单，则跳过该客户
      if (skipUnshipped && pendingReceiptCount > 0) {
        continue;
      }

      // 获取客户信息
      const { data: customer } = await client
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();

      const customerName = customer?.name || '未知客户';

      // 生成文件名: 客户名称+订单反馈+日期
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${customerName}+订单反馈+${today}.xlsx`;

      // 记录导出详情
      const detailResult = {
        customerId,
        customerName,
        orderCount: orders.length,
        shippedOrderCount: shippedCount,
        pendingReceiptCount,
        templateId: templateId || null,
        templateName,
        fileName,
        fileUrl: `/exports/${fileName}`, // TODO: 实际生成Excel并上传
        hasPendingReceipts: pendingReceiptCount > 0,
        status: 'success',
      };

      results.push(detailResult);
      totalOrderCount += orders.length;
      totalShippedCount += shippedCount;
      totalPendingReceiptCount += pendingReceiptCount;
    }

    // 生成ZIP文件名
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFileName = `客户反馈批量导出+${today}.zip`;

    // 保存批量导出记录
    const { error: recordError } = await client
      .from('export_records')
      .insert({
        export_type: 'customer_feedback',
        customer_id: customerIds.length === 1 ? customerIds[0] : null,
        template_id: templateId || null,
        template_name: templateName,
        file_url: `/exports/${zipFileName}`,
        file_name: zipFileName,
        total_count: totalOrderCount,
        exported_by: exportedBy || 'system',
        metadata: {
          batch_id: batchId,
          customer_ids: customerIds,
          details: results,
          shipped_order_count: totalShippedCount,
          pending_receipt_count: totalPendingReceiptCount,
        },
      });

    if (recordError) throw new Error(`保存导出记录失败: ${recordError.message}`);

    return NextResponse.json({
      success: true,
      message: `成功导出${results.length}个客户，共${totalOrderCount}个订单`,
      data: {
        batchId,
        zipFileName,
        zipFileUrl: `/exports/${zipFileName}`,
        totalCustomerCount: results.length,
        totalOrderCount,
        shippedOrderCount: totalShippedCount,
        pendingReceiptCount: totalPendingReceiptCount,
        details: results,
      },
    });
  } catch (error) {
    console.error('批量导出客户反馈单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
