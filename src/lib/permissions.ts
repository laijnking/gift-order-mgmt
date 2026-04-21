/**
 * 权限枚举 — 统一管理所有权限编码
 *
 * 事实来源：src/app/api/ 所有路由的 requirePermission 调用（共 25 个唯一权限）
 *
 * 使用约定：
 * - 禁止在各 API 中硬编码权限字符串，统一引用本模块常量
 * - 新增权限必须同时更新本模块的 PERMISSIONS 常量
 *
 * 权限分组（与 roles.ts 的角色分组对齐）：
 * - 订单相关：orders:*
 * - 商品相关：products:*
 * - 供应商/仓库/物流相关：suppliers:*
 * - 库存相关：stocks:*
 * - 用户相关：users:*
 * - 设置相关：settings:*
 * - 仪表盘/报表：dashboard:view
 * - AI 日志：ai_logs:view
 * - 智能体配置：agent_configs:*
 */

export const PERMISSIONS = {
  // 订单
  ORDERS_VIEW: 'orders:view',
  ORDERS_EDIT: 'orders:edit',
  ORDERS_CREATE: 'orders:create',
  ORDERS_DELETE: 'orders:delete',
  ORDERS_EXPORT: 'orders:export',
  // 客户
  CUSTOMERS_VIEW: 'customers:view',
  CUSTOMERS_CREATE: 'customers:create',
  CUSTOMERS_EDIT: 'customers:edit',
  CUSTOMERS_DELETE: 'customers:delete',
  // 商品
  PRODUCTS_VIEW: 'products:view',
  PRODUCTS_EDIT: 'products:edit',
  PRODUCTS_DELETE: 'products:delete',
  PRODUCTS_CREATE: 'products:create',
  // 供应商 / 仓库 / 物流商
  SUPPLIERS_VIEW: 'suppliers:view',
  SUPPLIERS_EDIT: 'suppliers:edit',
  SUPPLIERS_DELETE: 'suppliers:delete',
  SUPPLIERS_CREATE: 'suppliers:create',
  // 库存
  STOCKS_VIEW: 'stocks:view',
  STOCKS_EDIT: 'stocks:edit',
  // 用户
  USERS_VIEW: 'users:view',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_CREATE: 'users:create',
  // 设置
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  // 仪表盘 / 报表
  DASHBOARD_VIEW: 'dashboard:view',
  // AI 日志
  AI_LOGS_VIEW: 'ai_logs:view',
  // 智能体配置
  AGENT_CONFIGS_VIEW: 'agent_configs:view',
  AGENT_CONFIGS_EDIT: 'agent_configs:edit',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
