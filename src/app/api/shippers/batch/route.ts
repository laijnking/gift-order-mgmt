import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_CREATE);
  if (authError) return authError;

  try {
    const { shippers } = await request.json();
    
    if (!shippers || !Array.isArray(shippers) || shippers.length === 0) {
      return NextResponse.json({ success: false, error: '无效的发货方数据' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    // 批量插入发货方数据
    const { data, error } = await supabase
      .from('shippers')
      .insert(shippers)
      .select();

    if (error) {
      console.error('批量导入发货方失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, count: data?.length || 0 });
  } catch (error) {
    console.error('批量导入发货方失败:', error);
    return NextResponse.json({ success: false, error: '批量导入失败' }, { status: 500 });
  }
}
