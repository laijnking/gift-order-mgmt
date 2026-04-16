import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

// 导入回单
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const supplierId = formData.get('supplierId') as string;
    const supplierName = formData.get('supplierName') as string;

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: '请上传回单Excel文件' 
      }, { status: 400 });
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | undefined)[][];

    if (jsonData.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Excel文件数据为空' 
      }, { status: 400 });
    }

    const headers = jsonData[0].map(h => String(h).trim());
    
    // 字段映射
    const fieldMappings = {
      matchCode: findHeader(headers, ['内部订单号', '订单号', '匹配码']),
      orderNo: findHeader(headers, ['客户订单号', '客户单据号']),
      expressCompany: findHeader(headers, ['快递公司', '物流商', '快递']),
      trackingNo: findHeader(headers, ['快递单号', '物流单号', '单号']),
      quantity: findHeader(headers, ['数量', '件数']),
    };

    const batchNo = `RET-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatched: string[] = [];
    const returnsToInsert: Array<{ tracking_no: string; express_company: string; quantity: number; order_id?: string; supplier_id?: string; supplier_name?: string; batch_no: string; return_at: string }> = [];
    const ordersToUpdate: { id: string; expressCompany: string; trackingNo: string; status: string }[] = [];

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0 || !row.some(cell => cell)) continue;

      const getValue = (headerIndex: number | null) => {
        if (headerIndex === null || headerIndex >= row.length) return undefined;
        return String(row[headerIndex] || '').trim();
      };

      const matchCode = getValue(fieldMappings.matchCode);
      const orderNo = getValue(fieldMappings.orderNo);
      const expressCompany = getValue(fieldMappings.expressCompany) || '其他';
      const trackingNo = getValue(fieldMappings.trackingNo);
      const quantity = parseInt(getValue(fieldMappings.quantity) || '1');

      if (!trackingNo) continue;

      returnsToInsert.push({
        supplier_id: supplierId,
        supplier_name: supplierName,
        batch_no: batchNo,
        return_at: new Date().toISOString(),
        express_company: expressCompany,
        tracking_no: trackingNo,
        quantity: quantity || 1
      });

      // 尝试匹配订单
      let matchedOrderId: string | null = null;
      let matchedOrderItems: unknown[] = [];
      
      if (matchCode) {
        const { data: matchedOrders } = await client
          .from('orders')
          .select('id, items')
          .eq('match_code', matchCode)
          .maybeSingle();
        
        if (matchedOrders) {
          matchedOrderId = matchedOrders.id;
          matchedOrderItems = (matchedOrders.items as unknown[]) || [];
        }
      }
      
      if (!matchedOrderId && orderNo) {
        const { data: matchedOrders } = await client
          .from('orders')
          .select('id, items')
          .eq('order_no', orderNo)
          .maybeSingle();
        
        if (matchedOrders) {
          matchedOrderId = matchedOrders.id;
          matchedOrderItems = (matchedOrders.items as unknown[]) || [];
        }
      }

      if (matchedOrderId) {
        // 更新回单记录
        returnsToInsert[returnsToInsert.length - 1].order_id = matchedOrderId;
        
        // 判断订单状态
        const items = matchedOrderItems as { quantity?: number }[] || [];
        const totalQty = items.reduce((sum: number, item: Record<string, unknown>) => sum + ((item.quantity as number) || 0), 0);
        const newStatus = quantity >= totalQty ? 'returned' : 'partial_returned';
        
        ordersToUpdate.push({
          id: matchedOrderId,
          expressCompany,
          trackingNo,
          status: newStatus
        });
        
        matchedCount++;
      } else {
        unmatchedCount++;
        unmatched.push(`${orderNo || matchCode || '未知'} - ${trackingNo}`);
      }
    }

    // 批量插入回单
    if (returnsToInsert.length > 0) {
      const { error: insertError } = await client.from('return_records').insert(returnsToInsert);
      if (insertError) throw new Error(`插入回单失败: ${insertError.message}`);
    }

    // 更新订单状态
    for (const update of ordersToUpdate) {
      await client
        .from('orders')
        .update({
          express_company: update.expressCompany,
          tracking_no: update.trackingNo,
          status: update.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id);

      // 更新历史成本库
      await client
        .from('order_cost_history')
        .update({
          express_company: update.expressCompany,
          tracking_no: update.trackingNo,
          returned_date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString()
        })
        .eq('order_id', update.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        matchedCount,
        unmatchedCount,
        unmatched: unmatched.slice(0, 10)
      },
      message: `处理完成：成功匹配 ${matchedCount} 条，${unmatchedCount} 条未匹配${unmatchedCount > 0 ? `：${unmatched.slice(0, 5).join(', ')}${unmatchedCount > 5 ? '...' : ''}` : ''}`
    });

  } catch (error) {
    console.error('导入回单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 辅助函数
function findHeader(headers: string[], candidates: string[]): number | null {
  for (const candidate of candidates) {
    const index = headers.findIndex(h => 
      h.includes(candidate) || candidate.includes(h)
    );
    if (index !== -1) return index;
  }
  return null;
}
