import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { getColumnMappingDiagnostics, autoDetectColumnMapping, buildChineseColumnMapping, COLUMN_OPTIONS } from '@/lib/column-mapping-rules';
import { parseExcelData } from '@/lib/order-parser';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant-context';

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { rows: rawRows, columnMapping, customerCode, headers = [] } = body;
    
    // 规范化 rows：如果前端传的是对象数组（{ "0": val, "1": val }），转换为真正的数组
    const rows: (string | number | null)[][] = (rawRows || []).map((row: unknown) => {
      if (Array.isArray(row)) return row;
      if (row && typeof row === 'object') {
        // 对象格式：{ "0": val, "1": val } -> [val, val]
        const obj = row as Record<string, unknown>;
        const maxIdx = Math.max(...Object.keys(obj).map(Number));
        return Array.from({ length: maxIdx + 1 }, (_, i) => {
          const v = obj[String(i)];
          return v === null || v === undefined ? null : (typeof v === 'string' || typeof v === 'number' ? v : String(v));
        });
      }
      return [];
    });
    
    // 调试日志
    console.log('【API】接收请求:', {
      rowsCount: rows?.length,
      columnMapping,
      customerCode,
    });
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '数据不能为空',
      }, { status: 400 });
    }
    
    // 如果没有提供列映射，自动检测
    // 优先使用传入的 headers 参数（包含真实表头文本），否则从 rows[0] 的索引重建
    const excelHeaders: string[] = Array.isArray(headers) && headers.length > 0
      ? headers.map((h: unknown) => String(h ?? ''))
      : (rows[0] || []).map((_: unknown, idx: number) => String(idx));
    const mapping = columnMapping || autoDetectColumnMapping(excelHeaders);
    console.log('【API】使用的映射:', mapping);
    console.log('【API】Excel表头:', excelHeaders);
    
    const tenant = await getTenantFromRequest(request);

    // 解析数据
    let orders;
    try {
      orders = await parseExcelData(client, rows, mapping, customerCode || '', tenant.tenantId);
    } catch (parseErr) {
      console.error('【API】parseExcelData内部错误:', parseErr);
      throw parseErr;
    }
    console.log('【API】解析结果:', { ordersCount: orders.length, itemsCount: orders.reduce((s, o) => s + o.items.length, 0) });
    
    // 如果解析结果为0，输出每行的调试信息
    if (orders.length === 0 && rows.length > 0) {
      for (let i = 0; i < Math.min(3, rows.length); i++) {
        const row = rows[i];
        const productName = mapping ? Object.entries(mapping).find(([, v]) => v === 'product_name')?.[0] : null;
        const productNameValue = productName ? row[parseInt(productName)] : null;
        console.log(`【API】第${i}行原始数据:`, row, '-> 商品名称值:', productNameValue);
      }
    }
    
    // 统计匹配结果
    const mappingDiagnostics = getColumnMappingDiagnostics(
      Array.isArray(headers) ? headers.map((header) => String(header ?? '')) : [],
      mapping
    );

    const stats = {
      totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
      matchedItems: orders.reduce((sum, o) => sum + o.items.filter(i => i.systemProductId).length, 0),
      unmatchedItems: orders.reduce((sum, o) => sum + o.items.filter(i => !i.systemProductId).length, 0),
      ordersWithSupplier: orders.reduce((sum, o) => sum + o.items.filter(i => i.supplierMatches.length > 0).length, 0),
      ordersWithoutSupplier: orders.reduce((sum, o) => sum + o.items.filter(i => i.supplierMatches.length === 0).length, 0),
      totalHeaderCount: mappingDiagnostics.totalHeaderCount,
      nonEmptyHeaderCount: mappingDiagnostics.nonEmptyHeaderCount,
      mappedColumnCount: mappingDiagnostics.mappedColumnCount,
      ignoredColumnCount: mappingDiagnostics.ignoredColumnCount,
      extensionColumnCount: mappingDiagnostics.extensionColumnCount,
      recognizedFieldCount: mappingDiagnostics.recognizedFieldCount,
      coverageRate: mappingDiagnostics.coverageRate,
      conflictFields: mappingDiagnostics.conflictFields,
      unrecognizedHeaders: mappingDiagnostics.unrecognizedHeaders,
    };
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats,
        columnMapping: mapping,
      },
      message: `成功解析 ${orders.length} 个订单，共 ${stats.totalItems} 个商品`,
    });
  } catch (error) {
    console.error('解析Excel失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// 获取列映射建议
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = searchParams.get('headers');
  
  if (!headers) {
    return NextResponse.json({
      success: false,
      error: '缺少headers参数',
    }, { status: 400 });
  }
  
  try {
    const headerList = JSON.parse(headers) as string[];
    const mapping = autoDetectColumnMapping(headerList);
    
    // 转换为更友好的格式
    const chineseColumnMapping = buildChineseColumnMapping();
    const suggestions = headerList.map((header, index) => ({
      column: index,
      originalHeader: header,
      suggestedField: mapping[index] === 'ignore' ? null : mapping[index],
      suggestions: mapping[index] === 'ignore' 
        ? Object.entries(chineseColumnMapping)
            .filter(([, aliases]) => aliases.some(a => header.toLowerCase().includes(a.toLowerCase())))
            .map(([field]) => field)
        : [],
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        mapping,
        suggestions,
        fieldOptions: Object.keys(chineseColumnMapping),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
