/**
 * 角色字典 — 统一管理所有角色编码与分组逻辑
 *
 * 事实来源：src/lib/roles.ts
 *
 * 使用约定：
 * - 禁止在各页面或 API 中硬编码角色字符串比较，统一使用本模块提供的辅助函数
 * - 新增角色编码必须同时更新本模块的三个常量
 *
 * 角色分组：
 * - 销售岗：SALES_ROLE_CODES
 * - 跟单岗：OPERATOR_ROLE_CODES
 * - 管理岗：MANAGEMENT_ROLE_CODES
 */

/** 销售岗角色编码（可分配订单给客户） */
export const SALES_ROLE_CODES = ['sales', 'salesman', 'salesperson', 'sales_manager'] as const;
/** 跟单岗角色编码（可处理客户跟单） */
export const OPERATOR_ROLE_CODES = ['operator', 'order_taker', 'order_manager'] as const;
/** 管理岗角色编码（可查看后台） */
export const MANAGEMENT_ROLE_CODES = ['admin', 'admin_viewer', 'viewer', 'finance', 'finance_manager'] as const;

type UserIdentity = {
  id?: string;
  username?: string;
  realName?: string;
  name?: string;
  role?: string;
};

export function normalizeRoleCode(role?: string | null) {
  return (role || '').trim().toLowerCase();
}

export function isSalesRole(role?: string | null) {
  return SALES_ROLE_CODES.includes(normalizeRoleCode(role) as typeof SALES_ROLE_CODES[number]);
}

export function isOperatorRole(role?: string | null) {
  return OPERATOR_ROLE_CODES.includes(normalizeRoleCode(role) as typeof OPERATOR_ROLE_CODES[number]);
}

export function isManagementRole(role?: string | null) {
  return MANAGEMENT_ROLE_CODES.includes(normalizeRoleCode(role) as typeof MANAGEMENT_ROLE_CODES[number]);
}

export function isSalesAssignableRole(role?: string | null) {
  return isSalesRole(role) || normalizeRoleCode(role) === 'admin';
}

export function isOperatorAssignableRole(role?: string | null) {
  return isOperatorRole(role) || normalizeRoleCode(role) === 'admin';
}

export function getUserDisplayName(user?: Pick<UserIdentity, 'realName' | 'username' | 'name'> | null) {
  return user?.realName || user?.name || user?.username || '';
}

export function findUserByIdOrName<T extends UserIdentity>(
  users: T[],
  options: {
    id?: string | null;
    name?: string | null;
  }
) {
  const id = options.id?.trim();
  if (id) {
    const matchedById = users.find(user => user.id === id);
    if (matchedById) {
      return matchedById;
    }
  }

  const name = options.name?.trim();
  if (!name) {
    return undefined;
  }

  return users.find(user =>
    user.realName === name ||
    user.name === name ||
    user.username === name
  );
}
