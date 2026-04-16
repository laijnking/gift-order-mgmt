import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import crypto from 'crypto';

// 简单的密码哈希函数
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 创建指向 public schema 的 client
function getPublicSupabaseClient() {
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, anonKey, {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { users } = await request.json();
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: false, error: '无效的用户数据' }, { status: 400 });
    }

    const supabase = getPublicSupabaseClient();
    
    // 转换数据以匹配 public.users 表结构
    const usersData = users.map(row => ({
      username: row.username || row['用户名'] || '',
      real_name: row.realName || row['姓名'] || '',
      role: row.role || row['角色'] || 'operator',
      department: row.department || row['部门'] || null,
      is_active: (row.isActive || row['状态']) === '禁用' ? false : true,
      password_hash: hashPassword(row.password || row['密码'] || '123456'),
    })).filter((u: { username: string; real_name: string }) => u.username && u.real_name);

    if (usersData.length === 0) {
      return NextResponse.json({ success: false, error: '未解析到有效的用户数据' }, { status: 400 });
    }

    // 批量插入用户数据到 public.users 表
    const { data, error } = await supabase
      .from('users')
      .insert(usersData)
      .select();

    if (error) {
      console.error('批量导入用户失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, count: data?.length || 0 });
  } catch (error) {
    console.error('批量导入用户失败:', error);
    return NextResponse.json({ success: false, error: '批量导入失败' }, { status: 500 });
  }
}
