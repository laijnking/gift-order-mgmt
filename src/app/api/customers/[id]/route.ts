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
    province: dbCustomer.province as string || (dbCustomer as Record<string, unknown>).region as string || '',
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

// 获取单个客户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'customers:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { data, error } = await client
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(`查询客户失败: ${error.message}`);
    if (!data) {
      return NextResponse.json({ 
        success: false, 
        error: '客户不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: transformCustomer(data as Record<string, unknown>),
    });
  } catch (error) {
    console.error('获取客户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新客户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'customers:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
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
      status: body.isActive !== undefined ? (body.isActive ? 'active' : 'inactive') : 'active',
      remark: body.remark,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await client
      .from('customers')
      .update(customerData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新客户失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: transformCustomer(data as Record<string, unknown>),
      message: '客户更新成功'
    });
  } catch (error) {
    console.error('更新客户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除客户（软删除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'customers:delete');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { error } = await client
      .from('customers')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw new Error(`删除客户失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '客户删除成功'
    });
  } catch (error) {
    console.error('删除客户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
