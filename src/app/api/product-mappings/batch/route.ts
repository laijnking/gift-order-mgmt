import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 根据客户编码查找客户ID
async function findCustomerIdByCode(client: ReturnType<typeof getSupabaseClient>, code: string): Promise<string | null> {
  if (!code) return null;
  
  const { data: customers } = await client
    .from('customers')
    .select('id')
    .eq('code', code)
    .limit(1);
  
  return customers?.[0]?.id || null;
}

// 根据发货方编码查找发货方ID
async function findShipperIdByCode(client: ReturnType<typeof getSupabaseClient>, code: string): Promise<string | null> {
  if (!code) return null;
  
  const { data: shippers } = await client
    .from('shippers')
    .select('id')
    .eq('code', code)
    .limit(1);
  
  return shippers?.[0]?.id || null;
}

// 批量导入SKU映射
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { mappings } = body;
    
    if (!Array.isArray(mappings)) {
      return NextResponse.json({ 
        success: false, 
        error: '无效的参数，需要 mappings 数组' 
      }, { status: 400 });
    }
    
    if (mappings.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '映射数据为空' 
      }, { status: 400 });
    }
    
    // 收集需要查询的客户编码和发货方编码
    const customerCodes = new Set<string>();
    const shipperCodes = new Set<string>();
    
    mappings.forEach((m: Record<string, unknown>) => {
      if (m.customerCode) customerCodes.add(m.customerCode as string);
      if (m.supplierId && typeof m.supplierId === 'string' && !m.supplierId.includes('-')) {
        // 如果 supplierId 看起来像是编码而不是 UUID，先收集起来
        shipperCodes.add(m.supplierId as string);
      }
    });
    
    // 批量查询客户ID映射
    const customerIdMap: Record<string, string> = {};
    if (customerCodes.size > 0) {
      const { data: customers } = await client
        .from('customers')
        .select('id, code')
        .in('code', Array.from(customerCodes));
      customers?.forEach(c => {
        customerIdMap[c.code] = c.id;
      });
    }
    
    // 批量查询发货方ID映射
    const shipperIdMap: Record<string, string> = {};
    if (shipperCodes.size > 0) {
      const { data: shippers } = await client
        .from('shippers')
        .select('id, code')
        .in('code', Array.from(shipperCodes));
      shippers?.forEach(s => {
        shipperIdMap[s.code] = s.id;
      });
    }
    
    // 校验：检查无效的客户编码
    const invalidCustomerCodes: string[] = [];
    mappings.forEach((m) => {
      if (m.customerCode && !customerIdMap[m.customerCode as string]) {
        if (!invalidCustomerCodes.includes(m.customerCode as string)) {
          invalidCustomerCodes.push(m.customerCode as string);
        }
      }
    });
    
    // 校验：检查无效的供应商编码
    const invalidShipperCodes: string[] = [];
    mappings.forEach((m) => {
      const supplierId = m.supplierId as string;
      if (supplierId && !supplierId.includes('-') && !shipperIdMap[supplierId]) {
        if (!invalidShipperCodes.includes(supplierId)) {
          invalidShipperCodes.push(supplierId);
        }
      }
    });
    
    // 如果有无效编码，返回错误
    if (invalidCustomerCodes.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `以下客户编码不存在: ${invalidCustomerCodes.map(c => `"${c}"`).join(', ')}。请检查后重试。`,
        invalidCustomerCodes
      }, { status: 400 });
    }
    
    if (invalidShipperCodes.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `以下供应商编码不存在: ${invalidShipperCodes.map(c => `"${c}"`).join(', ')}。请检查后重试。`,
        invalidShipperCodes
      }, { status: 400 });
    }
    
    const insertData = mappings.map((m: Record<string, unknown>) => {
      // 解析 customer_id：优先使用传入的 customerId（UUID格式），否则根据 customerCode 查找
      let customerId = m.customerId as string | null;
      if (!customerId && m.customerCode) {
        customerId = customerIdMap[m.customerCode as string] || null;
      }
      
      // 解析 supplier_id：优先使用传入的 supplierId（UUID格式），否则根据 supplierId 编码查找
      let supplierId = m.supplierId as string | null;
      if (supplierId && !supplierId.includes('-')) {
        // 如果不是 UUID 格式，尝试作为编码查找
        supplierId = shipperIdMap[supplierId] || null;
      }
      
      return {
        product_id: m.productId || null,
        product_code: m.productCode || '',
        product_name: m.productName || '',
        customer_id: customerId,
        customer_code: m.customerCode || '',
        customer_name: m.customerName || '',
        supplier_id: supplierId,
        supplier_name: m.supplierName || '',
        customer_sku: m.customerSku || '',
        customer_barcode: m.customerBarcode || '',
        customer_product_name: m.customerProductName || '',
        price: m.price !== undefined && m.price !== null ? Number(m.price) : null,
        is_active: m.isActive !== false,
        remark: m.remark || '',
        mapping_type: m.mappingType || (m.customerCode ? 'customer' : 'supplier'),
      };
    });

    const { data, error } = await client
      .from('product_mappings')
      .insert(insertData)
      .select();
    
    if (error) {
      console.error('批量导入SKU映射失败:', error);
      return NextResponse.json({ 
        success: false, 
        error: `批量导入失败: ${error.message}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data?.length || 0,
      message: `成功导入 ${data?.length || 0} 条映射`
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('批量导入SKU映射失败:', errMsg, error instanceof Error ? error.stack : '');
    return NextResponse.json({ 
      success: false, 
      error: `导入失败: ${errMsg}` 
    }, { status: 500 });
  }
}
