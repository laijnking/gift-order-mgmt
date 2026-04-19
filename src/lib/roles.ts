export const SALES_ROLE_CODES = ['sales', 'salesman', 'salesperson', 'sales_manager'] as const;
export const OPERATOR_ROLE_CODES = ['operator', 'order_taker', 'order_manager'] as const;
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
