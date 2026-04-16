import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// 批量导出发货通知单
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { supplierIds, templateId, exportedBy } = body;

    if (!supplierIds || !Array.isArray(supplierIds) || supplierIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个供应商' }, { status: 400 });
    }

    const results = [];
    const batchId = crypto.randomUUID();
    let totalOrderCount = 0;
    const zip = new JSZip();

    // 获取模板信息
    let templateName = '默认发货通知模板';
    if (templateId) {
      const { data: template } = await client
        .from('templates')
        .select('name')
        .eq('id', templateId)
        .single();
      if (template) templateName = template.name;
    }

    // 按供应商分别处理
    for (const supplierId of supplierIds) {
      // 获取供应商待发货订单（包括待派发和已派发状态）
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .in('status', ['pending', 'assigned']);

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);

      if (!orders || orders.length === 0) continue;

      // 将待派发订单更新为已派发状态
      const pendingOrders = orders.filter(o => o.status === 'pending');
      if (pendingOrders.length > 0) {
        await client
          .from('orders')
          .update({ status: 'assigned', assigned_at: new Date().toISOString() })
          .in('id', pendingOrders.map(o => o.id));
      }

      // 获取供应商信息
      const { data: supplier } = await client
        .from('suppliers')
        .select('name')
        .eq('id', supplierId)
        .single();

      const supplierName = supplier?.name || '未知供应商';

      // 生成文件名: 供应商名称+发货通知单+日期
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${supplierName}+发货通知单+${today}.xlsx`;

      // 生成Excel数据
      const wsData = [
        ['系统订单号', '客户订单号', '收货人', '联系电话', '收货地址', '商品名称', '数量', '单价', '合计', '备注']
      ];

      for (const order of orders) {
        // 解析订单商品信息
        const items = order.items || [];
        const itemNames = items.map((item: any) => item.productName || item.name || '').join(', ');
        const itemQuantities = items.map((item: any) => item.quantity || 1).join(', ');
        
        wsData.push([
          order.sys_order_no || order.orderNo || '',
          order.customer_order_no || order.orderNo || '',
          order.receiver_name || '',
          order.receiver_phone || '',
          order.receiver_address || '',
          itemNames,
          itemQuantities,
          '',
          '',
          ''
        ]);
      }

      // 创建工作表
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, '发货通知单');

      // 生成Excel Buffer
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // 添加到ZIP
      zip.file(fileName, excelBuffer);

      // 记录导出详情
      const detailResult = {
        supplierId,
        supplierName,
        orderCount: orders.length,
        templateId: templateId || null,
        templateName,
        fileName,
        fileUrl: `/exports/${fileName}`,
        status: 'success',
      };

      results.push(detailResult);
      totalOrderCount += orders.length;
    }

    // 生成ZIP文件
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipBase64 = zipBuffer.toString('base64');

    // 生成ZIP文件名
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFileName = `发货通知单批量导出+${today}.zip`;

    // 保存批量导出记录
    const { error: recordError } = await client
      .from('export_records')
      .insert({
        export_type: 'shipping_notice',
        supplier_id: supplierIds.length === 1 ? supplierIds[0] : null,
        template_id: templateId || null,
        template_name: templateName,
        file_url: `/exports/${zipFileName}`,
        file_name: zipFileName,
        total_count: totalOrderCount,
        exported_by: exportedBy || 'system',
        metadata: {
          batch_id: batchId,
          supplier_ids: supplierIds,
          details: results,
        },
      });

    if (recordError) throw new Error(`保存导出记录失败: ${recordError.message}`);

    return NextResponse.json({
      success: true,
      message: `成功导出${results.length}个供应商，共${totalOrderCount}个订单`,
      data: {
        batchId,
        zipFileName,
        zipFileUrl: `/exports/${zipFileName}`,
        zipBase64,
        totalSupplierCount: results.length,
        totalOrderCount,
        details: results,
      },
    });
  } catch (error) {
    console.error('批量导出发货通知单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
