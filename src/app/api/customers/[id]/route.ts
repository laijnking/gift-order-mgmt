import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { buildCustomerMutationData, getCustomerSchemaMode, transformCustomerRecord } from '@/lib/customer-schema';

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
      data: transformCustomerRecord(data as Record<string, unknown>),
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
    const schemaMode = await getCustomerSchemaMode(client);
    const customerData = {
      ...buildCustomerMutationData(body, schemaMode),
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
      data: transformCustomerRecord(data as Record<string, unknown>),
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
    const schemaMode = await getCustomerSchemaMode(client);
    const { error } = await client
      .from('customers')
      .update(
        schemaMode === 'modern'
          ? { is_active: false, updated_at: new Date().toISOString() }
          : { status: 'inactive', updated_at: new Date().toISOString() }
      )
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
