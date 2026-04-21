import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { buildCustomerMutationData, getCustomerSchemaMode, transformCustomerRecord } from '@/lib/customer-schema';

// 获取客户列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.CUSTOMERS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const salesUserId = searchParams.get('salesUserId');
  const operatorUserId = searchParams.get('operatorUserId');
  const isActive = searchParams.get('isActive');

  try {
    const schemaMode = await getCustomerSchemaMode(client);
    let query = client.from('customers').select('*');

    if (search) {
      query = schemaMode === 'modern'
        ? query.or(`code.ilike.%${search}%,name.ilike.%${search}%,contact_person.ilike.%${search}%`)
        : query.or(`code.ilike.%${search}%,name.ilike.%${search}%,contact.ilike.%${search}%`);
    }

    if (salesUserId) {
      query = query.eq(schemaMode === 'modern' ? 'sales_user_id' : 'salesperson_id', salesUserId);
    }

    if (operatorUserId) {
      query = query.eq(schemaMode === 'modern' ? 'operator_user_id' : 'order_taker_id', operatorUserId);
    }

    if (isActive === 'true') {
      query = schemaMode === 'modern'
        ? query.eq('is_active', true)
        : query.eq('status', 'active');
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询客户失败: ${error.message}`);

    const transformedData = (data || []).map((customer) => transformCustomerRecord(customer as Record<string, unknown>));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取客户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增客户
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.CUSTOMERS_CREATE);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const schemaMode = await getCustomerSchemaMode(client);
    const customerData = buildCustomerMutationData(body, schemaMode);

    const { data, error } = await client
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    
    if (error) throw new Error(`创建客户失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformCustomerRecord(data as Record<string, unknown>),
      message: '客户创建成功'
    });
  } catch (error) {
    console.error('创建客户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
