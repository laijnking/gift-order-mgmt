import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const ALL_PERMISSIONS = [
  { id: 'e0000000-0000-0000-0000-000000000001', code: 'dashboard:view', name: '首页查看', category: '仪表盘', description: '查看仪表盘数据' },
  { id: 'e0000000-0000-0000-0000-000000000002', code: 'orders:view', name: '订单中心查看', category: '订单', description: '查看订单列表' },
  { id: 'e0000000-0000-0000-0000-000000000003', code: 'orders:create', name: '订单创建', category: '订单', description: '创建新订单' },
  { id: 'e0000000-0000-0000-0000-000000000004', code: 'orders:edit', name: '订单编辑', category: '订单', description: '编辑订单' },
  { id: 'e0000000-0000-0000-0000-000000000005', code: 'orders:delete', name: '订单删除', category: '订单', description: '删除订单' },
  { id: 'e0000000-0000-0000-0000-000000000006', code: 'orders:export', name: '发货通知单', category: '订单', description: '导出订单数据' },
  { id: 'e0000000-0000-0000-0000-000000000007', code: 'customers:view', name: '客户管理查看', category: '客户', description: '查看客户列表' },
  { id: 'e0000000-0000-0000-0000-000000000008', code: 'customers:create', name: '客户创建', category: '客户', description: '创建客户' },
  { id: 'e0000000-0000-0000-0000-000000000009', code: 'customers:edit', name: '客户编辑', category: '客户', description: '编辑客户' },
  { id: 'e0000000-0000-0000-0000-000000000010', code: 'customers:delete', name: '客户删除', category: '客户', description: '删除客户' },
  { id: 'e0000000-0000-0000-0000-000000000011', code: 'suppliers:view', name: '发货方管理查看', category: '发货方', description: '查看发货方' },
  { id: 'e0000000-0000-0000-0000-000000000012', code: 'suppliers:create', name: '发货方创建', category: '发货方', description: '创建发货方' },
  { id: 'e0000000-0000-0000-0000-000000000013', code: 'suppliers:edit', name: '发货方编辑', category: '发货方', description: '编辑发货方' },
  { id: 'e0000000-0000-0000-0000-000000000014', code: 'suppliers:delete', name: '发货方删除', category: '发货方', description: '删除发货方' },
  { id: 'e0000000-0000-0000-0000-000000000015', code: 'products:view', name: '商品管理查看', category: '商品', description: '查看商品列表' },
  { id: 'e0000000-0000-0000-0000-000000000016', code: 'products:create', name: '商品创建', category: '商品', description: '创建商品' },
  { id: 'e0000000-0000-0000-0000-000000000017', code: 'products:edit', name: '商品编辑', category: '商品', description: '编辑商品' },
  { id: 'e0000000-0000-0000-0000-000000000018', code: 'products:delete', name: '商品删除', category: '商品', description: '删除商品' },
  { id: 'e0000000-0000-0000-0000-000000000019', code: 'stocks:view', name: '库存管理查看', category: '库存', description: '查看库存' },
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
  { id: 'e0000000-0000-0000-0000-000000000030', code: 'wecom:manage', name: '企业微信管理', category: '系统', description: '管理企业微信群自动接单/回单功能，包括群映射配置、队列监控、回单发送' },
  { id: 'e0000000-0000-0000-0000-000000000031', code: 'return_receipt:view', name: '物流回单查看', category: '订单', description: '查看物流回单列表和匹配管理' },
  { id: 'e0000000-0000-0000-0000-000000000032', code: 'order_cost_history:view', name: '历史成本库查看', category: '订单', description: '查看历史成本记录和费用录入' },
  { id: 'e0000000-0000-0000-0000-000000000033', code: 'export_records:view', name: '导出记录查看', category: '订单', description: '查看导出历史记录和下载' },
  { id: 'e0000000-0000-0000-0000-000000000034', code: 'feedback_export:view', name: '客户反馈导出查看', category: '订单', description: '导出已回单订单给客户、查看二次导出历史' },
  { id: 'e0000000-0000-0000-0000-000000000035', code: 'reports:view', name: '数据报表查看', category: '仪表盘', description: '查看订单统计、销售业绩、发货方分析、回单时效报表' },
  { id: 'e0000000-0000-0000-0000-000000000036', code: 'user_management:view', name: '用户管理查看', category: '系统', description: '查看和管理用户列表及角色分配' },
  { id: 'e0000000-0000-0000-0000-000000000037', code: 'alerts:view', name: '预警设置查看', category: '系统', description: '查看预警规则和预警记录处理' },
  { id: 'e0000000-0000-0000-0000-000000000038', code: 'templates:view', name: '模板配置查看', category: '系统', description: '查看和管理导出模板配置' },
  { id: 'e0000000-0000-0000-0000-000000000039', code: 'sku_mappings:view', name: 'SKU映射查看', category: '商品', description: '查看SKU映射关系和发货方商品编码' },
  { id: 'e0000000-0000-0000-0000-000000000040', code: 'order_parse:create', name: 'AI订单录入', category: '订单', description: 'Excel导入订单、表头解析、列映射、商品/发货方匹配' },
  { id: 'e0000000-0000-0000-0000-000000000041', code: 'archive:view', name: '档案概览查看', category: '系统', description: '查看档案总览信息' },
  { id: 'e0000000-0000-0000-0000-000000000042', code: 'roles:view', name: '角色与权限查看', category: '系统', description: '管理角色配置和权限分配' },
  { id: 'e0000000-0000-0000-0000-000000000043', code: 'system_configs:view', name: '系统配置查看', category: '系统', description: '查看和修改系统配置参数' },
];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  admin: ALL_PERMISSIONS.map(p => p.code),
  salesperson: [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
    'customers:view', 'customers:create', 'customers:edit',
    'suppliers:view', 'products:view', 'stocks:view',
    'return_receipt:view', 'order_cost_history:view', 'export_records:view', 'feedback_export:view',
    'reports:view', 'sku_mappings:view', 'order_parse:create',
    'archive:view',
  ],
  operator: [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit',
    'customers:view', 'suppliers:view', 'products:view', 'stocks:view',
    'return_receipt:view', 'order_cost_history:view', 'reports:view', 'sku_mappings:view', 'order_parse:create',
    'archive:view',
  ],
  sales_manager: [
    'dashboard:view', 'orders:view', 'orders:create', 'orders:edit', 'orders:export',
    'customers:view', 'customers:create', 'customers:edit',
    'suppliers:view', 'products:view', 'stocks:view', 'users:view',
    'return_receipt:view', 'order_cost_history:view', 'export_records:view', 'feedback_export:view',
    'reports:view', 'sku_mappings:view', 'order_parse:create',
    'archive:view', 'roles:view', 'system_configs:view',
  ],
  finance: [
    'dashboard:view', 'orders:view', 'orders:export',
    'customers:view', 'suppliers:view', 'products:view', 'stocks:view', 'users:view',
    'return_receipt:view', 'order_cost_history:view', 'export_records:view', 'feedback_export:view',
    'reports:view', 'sku_mappings:view',
    'archive:view',
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
