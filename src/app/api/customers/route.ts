import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformCustomer(dbCustomer: Record<string, unknown>) {
  return {
    id: dbCustomer.id,
    code: dbCustomer.code,
    name: dbCustomer.name,
    contactPerson: dbCustomer.contact_person,
    contactPhone: dbCustomer.contact_phone,
    contactEmail: dbCustomer.contact_email,
    address: dbCustomer.address,
    province: dbCustomer.province,
    city: dbCustomer.city,
    district: dbCustomer.district,
    salesUserId: dbCustomer.sales_user_id,
    salesUserName: dbCustomer.sales_user_name,
    operatorUserId: dbCustomer.operator_user_id,
    operatorUserName: dbCustomer.operator_user_name,
    creditLimit: dbCustomer.credit_limit,
    paymentDays: dbCustomer.payment_days,
    paymentStatus: dbCustomer.payment_status,
    isActive: dbCustomer.is_active,
    remark: dbCustomer.remark,
    createdAt: dbCustomer.created_at,
    updatedAt: dbCustomer.updated_at,
  };
}

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
    let query = client.from('customers').select('*');

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }

    if (salesUserId) {
      query = query.eq('sales_user_id', salesUserId);
    }

    if (operatorUserId) {
      query = query.eq('operator_user_id', operatorUserId);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询客户失败: ${error.message}`);

    const transformedData = (data || []).map((customer) => transformCustomer(customer as Record<string, unknown>));

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
    
    const customerData = {
      code: body.code,
      name: body.name,
      contact_person: body.contactPerson,
      contact_phone: body.contactPhone,
      contact_email: body.contactEmail,
      address: body.address,
      province: body.province,
      city: body.city,
      district: body.district,
      sales_user_id: body.salesUserId,
      sales_user_name: body.salesUserName,
      operator_user_id: body.operatorUserId,
      operator_user_name: body.operatorUserName,
      credit_limit: body.creditLimit || 0,
      payment_days: body.paymentDays || 0,
      payment_status: body.paymentStatus || 'normal',
      is_active: body.isActive !== false,
      remark: body.remark,
    };

    const { data, error } = await client
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    
    if (error) throw new Error(`创建客户失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformCustomer(data as Record<string, unknown>),
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
