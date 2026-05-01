import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const ALL_PERMISSIONS = [
  { id: 'e0000000-0000-0000-0000-000000000001', code: 'dashboard:view', name: '仪表盘查看', category: '仪表盘', description: '查看仪表盘数据' },
  { id: 'e0000000-0000-0000-0000-000000000002', code: 'orders:view', name: '订单查看', category: '订单', description: '查看订单列表' },
  { id: 'e0000000-0000-0000-0000-000000000003', code: 'orders:create', name: '订单创建', category: '订单', description: '创建新订单' },
  { id: 'e0000000-0000-0000-0000-000000000004', code: 'orders:edit', name: '订单编辑', category: '订单', description: '编辑订单' },
  { id: 'e0000000-0000-0000-0000-000000000005', code: 'orders:delete', name: '订单删除', category: '订单', description: '删除订单' },
  { id: 'e0000000-0000-0000-0000-000000000006', code: 'orders:export', name: '订单导出', category: '订单', description: '导出订单数据' },
  { id: 'e0000000-0000-0000-0000-000000000007', code: 'customers:view', name: '客户查看', category: '客户', description: '查看客户列表' },
  { id: 'e0000000-0000-0000-0000-000000000008', code: 'customers:create', name: '客户创建', category: '客户', description: '创建客户' },
  { id: 'e0000000-0000-0000-0000-000000000009', code: 'customers:edit', name: '客户编辑', category: '客户', description: '编辑客户' },
  { id: 'e0000000-0000-0000-0000-000000000010', code: 'customers:delete', name: '客户删除', category: '客户', description: '删除客户' },
  { id: 'e0000000-0000-0000-0000-000000000011', code: 'suppliers:view', name: '发货方查看', category: '发货方', description: '查看发货方' },
  { id: 'e0000000-0000-0000-0000-000000000012', code: 'suppliers:create', name: '发货方创建', category: '发货方', description: '创建发货方' },
  { id: 'e0000000-0000-0000-0000-000000000013', code: 'suppliers:edit', name: '发货方编辑', category: '发货方', description: '编辑发货方' },
  { id: 'e0000000-0000-0000-0000-000000000014', code: 'suppliers:delete', name: '发货方删除', category: '发货方', description: '删除发货方' },
  { id: 'e0000000-0000-0000-0000-000000000015', code: 'products:view', name: '商品查看', category: '商品', description: '查看商品列表' },
  { id: 'e0000000-0000-0000-0000-000000000016', code: 'products:create', name: '商品创建', category: '商品', description: '创建商品' },
  { id: 'e0000000-0000-0000-0000-000000000017', code: 'products:edit', name: '商品编辑', category: '商品', description: '编辑商品' },
  { id: 'e0000000-0000-0000-0000-000000000018', code: 'products:delete', name: '商品删除', category: '商品', description: '删除商品' },
  { id: 'e0000000-0000-0000-0000-000000000019', code: 'stocks:view', name: '库存查看', category: '库存', description: '查看库存' },
  { id: 'e0000000-0000-0000-0000-000000000020', code: 'stocks:edit', name: '库存编辑', category: '库存', description: '编辑库存' },
  { id: 'e0000000-0000-0000-0000-000000000021', code: 'users:view', name: '用户查看', category: '用户', description: '查看用户' },
  { id: 'e0000000-0000-0000-0000-000000000022', code: 'users:create', name: '用户创建', category: '用户', description: '创建用户' },
  { id: 'e0000000-0000-0000-0000-000000000023', code: 'users:edit', name: '用户编辑', category: '用户', description: '编辑用户' },
  { id: 'e0000000-0000-0000-0000-000000000024', code: 'users:delete', name: '用户删除', category: '用户', description: '删除用户' },
  { id: 'e0000000-0000-0000-0000-000000000025', code: 'agent_configs:view', name: 'Agent配置查看', category: '系统', description: '查看Agent配置' },
  { id: 'e0000000-0000-0000-0000-000000000026', code: 'agent_configs:edit', name: 'Agent配置编辑', category: '系统', description: '编辑Agent配置' },
  { id: 'e0000000-0000-0000-0000-000000000027', code: 'ai_logs:view', name: 'AI日志查看', category: '系统', description: '查看AI调用日志' },
  { id: 'e0000000-0000-0000-0000-000000000028', code: 'settings:view', name: '设置查看', category: '系统', description: '查看系统设置' },
  { id: 'e0000000-0000-0000-0000-000000000029', code: 'settings:edit', name: '设置编辑', category: '系统', description: '编辑系统设置' },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  admin: ALL_PERMISSIONS.map(p => p.code),
  salesperson: [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
    'customers:view', 'customers:create', 'customers:edit',
    'suppliers:view', 'products:view', 'stocks:view',
  ],
  operator: [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
    'customers:view', 'suppliers:view', 'products:view', 'stocks:view',
  ],
  sales_manager: [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
    'customers:view', 'customers:create', 'customers:edit',
    'suppliers:view', 'products:view', 'stocks:view', 'users:view',
  ],
  finance: [
    'dashboard:view', 'orders:view', 'orders:export',
    'customers:view', 'suppliers:view', 'products:view', 'stocks:view', 'users:view',
  ],
};

export async function POST() {
  const client = getSupabaseClient();
  const results: string[] = [];

  try {
    // 1. 插入所有权限
    for (const perm of ALL_PERMISSIONS) {
      const { error } = await client.from('permissions').upsert({
        id: perm.id,
        code: perm.code,
        name: perm.name,
        category: perm.category,
        description: perm.description,
      }, { onConflict: 'code' });

      if (error) {
        results.push(`权限 ${perm.code} 插入失败: ${error.message}`);
      }
    }
    results.push(`已确保 ${ALL_PERMISSIONS.length} 条权限记录存在`);

    // 2. 为每个角色分配权限
    for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_MAP)) {
      const { data: role, error: roleError } = await client
        .from('roles')
        .select('id')
        .eq('code', roleCode)
        .single();

      if (roleError || !role) {
        results.push(`角色 ${roleCode} 不存在，跳过`);
        continue;
      }

      const { data: perms, error: permsError } = await client
        .from('permissions')
        .select('id, code')
        .in('code', permCodes);

      if (permsError) {
        results.push(`查询角色 ${roleCode} 权限失败: ${permsError.message}`);
        continue;
      }

      let assigned = 0;
      for (const perm of perms || []) {
        const { error } = await client.from('role_permissions').upsert({
          role_id: role.id,
          permission_id: perm.id,
        }, { onConflict: 'role_id,permission_id' });

        if (!error) assigned++;
      }
      results.push(`角色 ${roleCode}: 已分配 ${assigned} 条权限`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Bootstrap error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
