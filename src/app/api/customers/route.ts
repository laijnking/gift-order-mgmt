import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 数据库字段转前端格式
function transformCustomer(dbCustomer: Record<string, unknown>) {
  return {
    id: dbCustomer.id,
    code: dbCustomer.code,
    name: dbCustomer.name,
    contactPerson: (dbCustomer as Record<string, unknown>).contact_person as string || dbCustomer.contact as string || '',
    contactPhone: (dbCustomer as Record<string, unknown>).contact_phone as string || dbCustomer.phone as string || '',
    contactEmail: (dbCustomer as Record<string, unknown>).contact_email as string || dbCustomer.email as string || '',
    address: dbCustomer.address,
    province: dbCustomer.province as string || '',
    city: dbCustomer.city as string || '',
    district: (dbCustomer as Record<string, unknown>).district as string || '',
    salesUserId: dbCustomer.salesperson_id,
    salesUserName: dbCustomer.salesperson_name,
    operatorUserId: dbCustomer.order_taker_id,
    operatorUserName: dbCustomer.order_taker_name,
    creditLimit: dbCustomer.credit_limit,
    paymentDays: dbCustomer.payment_days,
    paymentStatus: dbCustomer.payment_status,
    isActive: dbCustomer.status === 'active',
    remark: dbCustomer.remark,
    createdAt: dbCustomer.created_at,
    updatedAt: dbCustomer.updated_at,
  };
}

// 获取客户列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'customers:view');
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
      query = query.eq('salesperson_id', salesUserId);
    }

    if (operatorUserId) {
      query = query.eq('order_taker_id', operatorUserId);
    }

    if (isActive === 'true') {
      query = query.eq('status', 'active');
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
  const authError = requirePermission(request, 'customers:create');
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
      salesperson_id: body.salesUserId,
      salesperson_name: body.salesUserName,
      order_taker_id: body.operatorUserId,
      order_taker_name: body.operatorUserName,
      credit_limit: body.creditLimit || 0,
      payment_days: body.paymentDays || 0,
      payment_status: body.paymentStatus || 'normal',
      status: body.isActive !== false ? 'active' : 'inactive',
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
