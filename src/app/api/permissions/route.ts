import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取权限列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'settings:view');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

  try {
    let query = client.from('permissions').select('*');
    
    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('category').order('name');

    if (error) throw new Error(`查询权限失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取权限失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
