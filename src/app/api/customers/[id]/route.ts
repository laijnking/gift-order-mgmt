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

// 获取单个客户
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.CUSTOMERS_VIEW);
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
  const authError = requirePermission(request, PERMISSIONS.CUSTOMERS_EDIT);
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
      sales_user_id: body.salesUserId,
      sales_user_name: body.salesUserName,
      operator_user_id: body.operatorUserId,
      operator_user_name: body.operatorUserName,
      credit_limit: body.creditLimit || 0,
      payment_days: body.paymentDays || 0,
      payment_status: body.paymentStatus || 'normal',
      is_active: body.isActive !== undefined ? body.isActive : true,
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
  const authError = requirePermission(request, PERMISSIONS.CUSTOMERS_DELETE);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  
  try {
    const { error } = await client
      .from('customers')
      .update({ is_active: false, updated_at: new Date().toISOString() })
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
