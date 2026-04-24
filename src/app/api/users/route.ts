import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

// 数据库字段转前端格式
function transformUser(dbUser: Record<string, unknown>) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    realName: dbUser.real_name,
    role: dbUser.role,
    department: dbUser.department,
    isActive: dbUser.is_active,
    lastLoginAt: dbUser.last_login_at,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
    // 新增字段
    phone: dbUser.phone || null,
    email: dbUser.email || null,
    remark: dbUser.remark || null,
    dataScope: dbUser.data_scope || 'self',
  };
}

function hashPassword(password: string) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 获取用户列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'users:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const role = searchParams.get('role');
  const isActive = searchParams.get('isActive');

  try {
    let query = client.from('users').select('*');

    if (search) {
      query = query.or(`username.ilike.%${search}%,real_name.ilike.%${search}%`);
    }

    if (role) {
      query = query.eq('role', role);
    }

    if (isActive === 'true') {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询用户失败: ${error.message}`);

    // 不返回密码
    const safeData = (data || []).map((user) => {
      const { password_hash, ...rest } = user as Record<string, unknown>;
      return transformUser(rest);
    });

    return NextResponse.json({
      success: true,
      data: safeData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新用户
export async function PUT(request: NextRequest) {
  const authError = requirePermission(request, 'users:edit');
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    // 支持从URL查询参数或请求体获取ID
    const { searchParams } = new URL(request.url);
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    
    const id = searchParams.get('id') || body.id;

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: '用户ID不能为空' 
      }, { status: 400 });
    }

    const { username, realName, role, department, isActive, phone, email, remark, dataScope } = body;

    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (realName !== undefined) updateData.real_name = realName;
    if (role !== undefined) updateData.role = role;
    if (department !== undefined) updateData.department = department;
    if (isActive !== undefined) updateData.is_active = isActive;
    // 新增字段
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (remark !== undefined) updateData.remark = remark;
    if (dataScope !== undefined) updateData.data_scope = dataScope;

    const { data, error } = await client
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw new Error(`更新用户失败: ${error.message}`);

    const { password_hash, ...rest } = data as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: transformUser(rest),
      message: '用户更新成功'
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除用户
export async function DELETE(request: NextRequest) {
  const authError = requirePermission(request, 'users:delete');
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ 
        success: false, 
        error: '用户ID不能为空' 
      }, { status: 400 });
    }

    const { error } = await client
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw new Error(`删除用户失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 新增用户
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'users:create');
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    const userData = {
      username: body.username,
      password_hash: hashPassword(body.password || '123456'),
      real_name: body.realName,
      role: body.role || 'operator',
      department: body.department,
      is_active: body.isActive !== false,
      // 新增字段
      phone: body.phone || null,
      email: body.email || null,
      remark: body.remark || null,
      data_scope: body.dataScope || 'self',
    };

    const { data, error } = await client
      .from('users')
      .insert(userData)
      .select()
      .single();
    
    if (error) throw new Error(`创建用户失败: ${error.message}`);

    const { password_hash, ...rest } = data as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      data: transformUser(rest),
      message: '用户创建成功'
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
