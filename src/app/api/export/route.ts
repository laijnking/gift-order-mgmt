import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

// 导出订单（按供应商拆分）
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { orderIds, supplierId } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择要导出的订单' 
      }, { status: 400 });
    }

    // 获取订单
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select('*')
      .in('id', orderIds);
    
    if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到订单' 
      }, { status: 404 });
    }

    // 获取供应商
    const { data: suppliers, error: suppliersError } = await client
      .from('suppliers')
      .select('*');
    
    if (suppliersError) throw new Error(`查询供应商失败: ${suppliersError.message}`);

    // 如果指定了供应商，只导出该供应商的订单
    const filteredOrders = supplierId 
      ? orders.filter((o: Record<string, unknown>) => o.supplier_id === supplierId)
      : orders;

    // 按供应商分组
    const ordersBySupplier: Record<string, Record<string, unknown>[]> = {};
    for (const order of filteredOrders) {
      const supId = (order.supplier_id as string) || 'UNASSIGNED';
      if (!ordersBySupplier[supId]) {
        ordersBySupplier[supId] = [];
      }
      ordersBySupplier[supId].push(order);
    }

    // 生成Excel数据
    const exportData: Record<string, Record<string, unknown>[]> = {};
    const batchNo = `EXPORT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;

    for (const [supId, supplierOrders] of Object.entries(ordersBySupplier)) {
      const supplier = suppliers?.find((s: Record<string, unknown>) => s.id === supId);
      const supplierName = (supplier?.name as string) || '未分配';

      // 生成派发批次号
      const dispatchBatch = `${batchNo}-${supId.slice(0, 8)}`;

      const rows = supplierOrders.map((order: Record<string, unknown>) => {
        const items = order.items as { product_name?: string; product_code?: string; quantity?: number; price?: number; amount?: number; discount?: number; tax_rate?: number; warehouse?: string; remark?: string }[];
        return {
          '内部订单号': order.match_code || order.id,
          '客户订单号': order.order_no,
          '供应商单据号': order.supplier_order_no || '',
          '派发批次': dispatchBatch,
          '派发时间': new Date().toLocaleString('zh-CN'),
          '商品名称': items?.map((i: Record<string, unknown>) => i.product_name).join('; ') || '',
          '型号': items?.map((i: Record<string, unknown>) => i.product_code).join('; ') || '',
          '数量': items?.reduce((sum: number, i: Record<string, unknown>) => sum + ((i.quantity as number) || 0), 0) || 0,
          '单价': items?.[0]?.price || '',
          '价税合计': order.amount || items?.reduce((sum: number, i: Record<string, unknown>) => sum + ((i.amount as number) || 0), 0) || '',
          '单台折让': order.discount || items?.[0]?.discount || '',
          '税率(%)': order.tax_rate || items?.[0]?.tax_rate || '',
          '仓库': order.warehouse || items?.[0]?.warehouse || '',
          '收货人': order.receiver_name,
          '收货电话': order.receiver_phone,
          '收货地址': order.receiver_address,
          '客户代码': order.customer_code || '',
          '客户名称': order.customer_name || '',
          '业务员': order.salesperson || '',
          '跟单员': order.operator_name || '',
          '是否开票': order.invoice_required ? '是' : '否',
          '收入名称': order.income_name || '',
          '应收金额': order.income_amount || '',
          '快递公司': '',
          '物流单号': '',
          '备注': items?.map((i: Record<string, unknown>) => i.remark).filter(Boolean).join('; ') || order.remark || ''
        };
      });

      exportData[supplierName] = rows;

      // 写入历史成本库
      for (const order of supplierOrders) {
        const items = order.items as Array<Record<string, unknown>> || [];
        const item = items[0] || {};
        
        // 优先使用系统商品信息
        const productName = (item.product_name as string) || (item.productName as string) || '';
        const productCode = (item.product_code as string) || (item.productCode as string) || '';
        const productSpec = (item.product_spec as string) || (item.productSpec as string) || '';
        const quantity = (item.quantity as number) || 1;
        const unitCost = (item.unit_cost as number) || (item.unitCost as number) || (item.price as number) || 0;
        const totalCost = unitCost * quantity;

        const costRecord = {
          order_id: order.id,
          order_no: order.order_no,
          match_code: order.match_code || null,
          supplier_id: supplier?.id || null,
          supplier_name: supplierName,
          product_code: productCode,
          product_name: productName,
          quantity: quantity,
          unit_cost: unitCost,
          total_cost: totalCost,
          express_fee: 0,
          other_fee: 0,
          total_amount: totalCost,
          receiver_name: order.receiver_name || null,
          receiver_phone: order.receiver_phone || null,
          receiver_address: order.receiver_address || null,
          customer_code: order.customer_code || null,
          customer_name: order.customer_name || null,
          salesperson: order.salesperson || null,
          operator_name: order.operator_name || null,
          order_date: order.order_date ? new Date(order.order_date as string).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
          shipped_date: null,
          returned_date: null,
          dispatch_batch: dispatchBatch,
          remark: order.remark || null,
        };

        await client
          .from('order_cost_history')
          .insert(costRecord);
      }

      // 更新订单状态为已派发
      const orderIdsToUpdate = supplierOrders.map((o: Record<string, unknown>) => o.id as string);
      if (orderIdsToUpdate.length > 0) {
        await client
          .from('orders')
          .update({
            status: 'assigned',
            assigned_batch: dispatchBatch,
            assigned_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .in('id', orderIdsToUpdate);
      }
    }

    // 创建工作簿
    const workbook = XLSX.utils.book_new();

    for (const [supplierName, rows] of Object.entries(exportData)) {
      const worksheet = XLSX.utils.json_to_sheet(rows as Record<string, string | number>[]);
      
      // 设置列宽
      worksheet['!cols'] = [
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 20 },
        { wch: 40 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 12 },
        { wch: 15 }, { wch: 15 }, { wch: 50 },
        { wch: 12 }, { wch: 15 }, { wch: 10 }, { wch: 15 },
        { wch: 8 }, { wch: 15 }, { wch: 12 }, { wch: 20 },
        { wch: 30 },
      ];

      XLSX.utils.book_append_sheet(workbook, worksheet, supplierName.slice(0, 31));
    }

    // 生成文件
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    const base64 = buffer.toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        filename: `${batchNo}.xlsx`,
        content: base64,
        sheets: Object.keys(exportData),
        totalOrders: filteredOrders.length,
        suppliersCount: Object.keys(exportData).length
      },
      message: `已生成 ${Object.keys(exportData).length} 个供应商的派发单，共 ${filteredOrders.length} 条订单`
    });

  } catch (error) {
    console.error('导出订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
