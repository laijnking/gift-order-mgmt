import { NextRequest, NextResponse } from 'next/server';
import { requirePermission, requireAnyPermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 数据库字段转前端格式
function transformMapping(dbMapping: Record<string, unknown>) {
  return {
    id: dbMapping.id,
    productId: dbMapping.product_id,
    productCode: dbMapping.product_code,
    productName: dbMapping.product_name,
    customerId: dbMapping.customer_id,
    customerCode: dbMapping.customer_code,
    customerName: dbMapping.customer_name,
    supplierId: dbMapping.supplier_id,
    supplierName: dbMapping.supplier_name,
    customerSku: dbMapping.customer_sku,
    customerBarcode: dbMapping.customer_barcode,
    customerProductName: dbMapping.customer_product_name,
    price: dbMapping.price,
    isActive: dbMapping.is_active,
    remark: dbMapping.remark,
    mappingType: dbMapping.mapping_type,
    createdAt: dbMapping.created_at,
    updatedAt: dbMapping.updated_at,
  };
}

// 获取SKU映射列表
export async function GET(request: NextRequest) {
  const authError = requireAnyPermission(request, [PERMISSIONS.PRODUCTS_VIEW, PERMISSIONS.SUPPLIERS_VIEW]);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const productCode = searchParams.get('productCode');
  const customerCode = searchParams.get('customerCode');
  const supplierId = searchParams.get('supplierId');
  const mappingType = searchParams.get('mappingType');

  try {
    let query = client.from('product_mappings').select('*');

    if (mappingType) {
      query = query.eq('mapping_type', mappingType);
    }

    if (search) {
      query = query.or(`product_code.ilike.%${search}%,product_name.ilike.%${search}%,customer_sku.ilike.%${search}%,customer_product_name.ilike.%${search}%`);
    }

    if (productCode) {
      query = query.eq('product_code', productCode);
    }

    if (customerCode) {
      query = query.eq('customer_code', customerCode);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询SKU映射失败: ${error.message}`);

    const transformedData = (data || []).map((mapping) => transformMapping(mapping as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增SKU映射
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    // 确定映射类型
    const mappingType = body.mappingType || (body.supplierId || body.supplierCode ? 'supplier' : 'customer');
    
    // 解析 customer_id：优先使用传入的 customerId（UUID格式），否则根据 customerCode 查找
    let customerId = body.customerId || null;
    if (!customerId && body.customerCode) {
      const { data: customers } = await client
        .from('customers')
        .select('id')
        .eq('code', body.customerCode)
        .limit(1);
      customerId = customers?.[0]?.id || null;
    }
    
    // 解析 supplier_id：优先使用传入的 supplierId（UUID格式），否则根据编码查找
    let supplierId = body.supplierId || null;
    if (supplierId && !supplierId.includes('-')) {
      const { data: shippers } = await client
        .from('shippers')
        .select('id')
        .eq('code', supplierId)
        .limit(1);
      supplierId = shippers?.[0]?.id || null;
    }
    
    // 校验：如果指定了客户编码但找不到客户，报错
    if (body.customerCode && !customerId) {
      return NextResponse.json({
        success: false,
        error: `客户编码 "${body.customerCode}" 不存在，请检查后重试`
      }, { status: 400 });
    }
    
    // 校验：如果指定了发货方编码但找不到发货方，报错
    if ((body.supplierId || body.supplierCode) && !supplierId && mappingType === 'supplier') {
      return NextResponse.json({
        success: false,
        error: `发货方编码 "${body.supplierId || body.supplierCode}" 不存在，请检查后重试`
      }, { status: 400 });
    }
    
    const mappingData = {
      product_id: body.productId || null,
      product_code: body.productCode || '',
      product_name: body.productName || '',
      customer_id: customerId,
      customer_code: body.customerCode || '',
      customer_name: body.customerName || '',
      supplier_id: supplierId,
      supplier_name: body.supplierName || '',
      customer_sku: body.customerSku || '',
      customer_barcode: body.customerBarcode || '',
      customer_product_name: body.customerProductName || '',
      price: body.price || null,
      is_active: body.isActive !== false,
      remark: body.remark || '',
      mapping_type: mappingType,
    };

    const { data, error } = await client
      .from('product_mappings')
      .insert(mappingData)
      .select()
      .single();
    
    if (error) throw new Error(`添加SKU映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformMapping(data as Record<string, unknown>)
    });
  } catch (error) {
    console.error('添加SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 批量导入SKU映射
export async function PUT(request: NextRequest) {
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
    
    // 收集需要查询的客户编码和发货方编码
    const customerCodes = new Set<string>();
    const shipperCodes = new Set<string>();
    
    mappings.forEach((m: Record<string, unknown>) => {
      if (m.customerCode) customerCodes.add(m.customerCode as string);
      if (m.supplierId && typeof m.supplierId === 'string') {
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
    
    // 批量查询发货方ID映射（同时查code和id，确保UUID格式也能验证）
    const shipperIdMap: Record<string, string> = {};
    const allShipperIdentifiers = Array.from(shipperCodes);
    if (allShipperIdentifiers.length > 0) {
      const { data: shippers } = await client
        .from('shippers')
        .select('id, code')
        .or(`code.in.(${allShipperIdentifiers.map(c => `"${c}"`).join(',')}),id.in.(${allShipperIdentifiers.map(c => `"${c}"`).join(',')})`);
      shippers?.forEach(s => {
        shipperIdMap[s.code] = s.id;
        shipperIdMap[s.id] = s.id;
      });
    }
    
    // 校验：检查无效的客户编码
    const invalidCustomerCodes: string[] = [];
    mappings.forEach((m, i) => {
      if (m.customerCode && !customerIdMap[m.customerCode as string]) {
        invalidCustomerCodes.push(`"${m.customerCode}"`);
      }
    });
    
    // 校验：检查无效的发货方编码和无效的UUID格式supplierId
    const invalidShipperCodes: string[] = [];
    const invalidShipperIds: string[] = [];
    mappings.forEach((m) => {
      const supplierId = m.supplierId as string;
      if (!supplierId) return;

      if (!supplierId.includes('-')) {
        if (!shipperIdMap[supplierId]) {
          if (!invalidShipperCodes.includes(supplierId)) {
            invalidShipperCodes.push(supplierId);
          }
        }
      } else {
        if (!shipperIdMap[supplierId]) {
          if (!invalidShipperIds.includes(supplierId)) {
            invalidShipperIds.push(supplierId);
          }
        }
      }
    });

    if (invalidCustomerCodes.length > 0) {
      return NextResponse.json({
        success: false,
        error: `以下客户编码不存在: ${invalidCustomerCodes.join(', ')}。请检查后重试。`,
        invalidCustomerCodes
      }, { status: 400 });
    }

    if (invalidShipperCodes.length > 0) {
      return NextResponse.json({
        success: false,
        error: `以下发货方编码不存在: ${invalidShipperCodes.join(', ')}。请检查后重试。`,
        invalidShipperCodes
      }, { status: 400 });
    }

    if (invalidShipperIds.length > 0) {
      return NextResponse.json({
        success: false,
        error: `以下发货方ID不存在: ${invalidShipperIds.join(', ')}。请检查后重试。`,
        invalidShipperIds
      }, { status: 400 });
    }
    
    const insertData = mappings.map((m: Record<string, unknown>) => {
      // 解析 customer_id
      let customerId = m.customerId as string | null;
      if (!customerId && m.customerCode) {
        customerId = customerIdMap[m.customerCode as string] || null;
      }
      
      // 解析 supplier_id：支持编码和UUID两种格式，都走shipperIdMap验证过的结果
      let supplierId = m.supplierId as string | null;
      if (supplierId) {
        supplierId = shipperIdMap[supplierId] || null;
      }
      
      // 确定映射类型
      const mappingType = (m as Record<string, unknown>).mappingType || 
        (m.supplierId ? 'supplier' : 'customer');
      
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
        price: m.price || null,
        is_active: m.isActive !== false,
        remark: m.remark || '',
        mapping_type: mappingType,
      };
    });

    const { data, error } = await client
      .from('product_mappings')
      .upsert(insertData, { onConflict: 'customer_sku,customer_code' })
      .select();
    
    if (error) throw new Error(`批量导入SKU映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data?.length || 0,
      message: `成功导入 ${data?.length || 0} 条映射`
    });
  } catch (error) {
    console.error('批量导入SKU映射失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
