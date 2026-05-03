import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取系统配置列表
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const isPublic = searchParams.get('isPublic');

  try {
    let query = client.from('system_configs').select('*');

    if (category) {
      query = query.eq('category', category);
    }

    if (isPublic === 'true') {
      query = query.eq('is_public', true);
    }

    query = query.eq('is_active', true).order('category', { ascending: true }).order('created_at', { ascending: true });

    const { data, error } = await query;
    if (error) throw new Error(`查询系统配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('获取系统配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// 更新系统配置
export async function PATCH(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SETTINGS_EDIT);
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { code, config } = body;

    if (!code) {
      return NextResponse.json({
        success: false,
        error: '配置项编码不能为空',
      }, { status: 400 });
    }

    // 查询现有配置
    const { data: existing, error: findError } = await client
      .from('system_configs')
      .select('id, editable')
      .eq('code', code)
      .maybeSingle();

    if (findError) throw new Error(`查询配置失败: ${findError.message}`);

    if (!existing) {
      return NextResponse.json({
        success: false,
        error: '配置项不存在',
      }, { status: 404 });
    }

    if (!existing.editable) {
      return NextResponse.json({
        success: false,
        error: '该配置项不可编辑',
      }, { status: 403 });
    }

    // 更新配置
    const { data, error } = await client
      .from('system_configs')
      .update({
        config,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw new Error(`更新配置失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data,
      message: '配置更新成功',
    });
  } catch (error) {
    console.error('更新系统配置失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
