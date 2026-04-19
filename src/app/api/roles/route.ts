import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取角色列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const includePermissions = searchParams.get('includePermissions') === 'true';

  try {
    const query = client.from('roles').select('*');

    const { data, error } = await query.order('is_system', { ascending: false }).order('created_at', { ascending: true });

    if (error) throw new Error(`查询角色失败: ${error.message}`);

    // 如果需要包含权限信息
    if (includePermissions && data) {
      for (const role of data) {
        const { data: perms } = await client
          .from('role_permissions')
          .select(`
            permission_id,
            permissions (
              code,
              name,
              category
            )
          `)
          .eq('role_id', role.id);
        
        (role as Record<string, unknown>).permissions = perms?.map((p: Record<string, unknown>) => 
          (p.permissions as Record<string, unknown>)?.code
        ) || [];
      }
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取角色失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建角色
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    
    // 检查编码是否已存在
    const { data: existing } = await client
      .from('roles')
      .select('id')
      .eq('code', body.code)
      .single();
    
    if (existing) {
      return NextResponse.json({ 
        success: false, 
        error: '角色编码已存在' 
      }, { status: 400 });
    }

    const roleData = {
      code: body.code,
      name: body.name,
      description: body.description,
      data_scope: body.dataScope || 'self',
      is_system: false,
      is_active: body.isActive !== false,
    };

    const { data, error } = await client
      .from('roles')
      .insert(roleData)
      .select()
      .single();
    
    if (error) throw new Error(`创建角色失败: ${error.message}`);

    // 如果有权限配置，插入权限关联
    if (body.permissions && Array.isArray(body.permissions) && body.permissions.length > 0) {
      const permissionLinks = body.permissions.map((permId: string) => ({
        role_id: data.id,
        permission_id: permId,
      }));
      
      await client.from('role_permissions').insert(permissionLinks);
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '角色创建成功'
    });
  } catch (error) {
    console.error('创建角色失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
