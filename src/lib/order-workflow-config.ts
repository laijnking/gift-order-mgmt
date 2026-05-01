/**
 * SSOT - 订单工作流配置
 * 
 * 本文件是订单状态流转、按钮可用性、字段可编辑性的唯一事实来源。
 * 所有涉及订单状态决策的代码必须引用此配置。
 * 
 * 更新历史：
 * - v1.0 (2026-05-01): 初始版本，整合订单状态机、按钮权限、字段编辑规则
 */

import type { OrderStatus } from '@/types/order';

// ============================================================
// 状态定义
// ============================================================

/** 所有订单状态的完整列表 */
export const ALL_ORDER_STATUSES: OrderStatus[] = [
  'pending',
  'assigned',
  'notified',
  'partial_returned',
  'returned',
  'feedbacked',
  'completed',
  'cancelled',
];

// ============================================================
// 状态流转规则
// ============================================================

/** 状态流转矩阵 - 定义每个状态可以转换到哪些状态 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['assigned', 'cancelled'],
  assigned: ['notified', 'partial_returned', 'returned', 'cancelled'],
  notified: ['partial_returned', 'returned', 'cancelled'],
  partial_returned: ['returned', 'feedbacked', 'completed'],
  returned: ['feedbacked', 'completed'],
  feedbacked: ['completed'],
  completed: [],
  cancelled: [],
};

/** 检查状态转换是否允许 */
export function isAllowedTransition(
  fromStatus: OrderStatus,
  toStatus: OrderStatus
): boolean {
  return ALLOWED_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

// ============================================================
// 字段可编辑性规则
// ============================================================

/** 各状态下可编辑的字段 - null 表示不可编辑，'*' 表示全部可编辑 */
export const EDITABLE_FIELDS_BY_STATUS: Record<OrderStatus, string[] | null> = {
  pending: ['*'],  // 待派发状态可以编辑所有字段
  assigned: ['remark'],  // 已派发状态只能编辑备注
  notified: ['remark'],  // 通知发货状态只能编辑备注
  partial_returned: [],  // 部分回单不可编辑
  returned: [],  // 已回单不可编辑
  feedbacked: [],  // 已反馈不可编辑
  completed: [],  // 已导金蝶不可编辑
  cancelled: [],  // 已取消不可编辑
};

/** 检查某状态下某字段是否可编辑 */
export function isFieldEditable(
  status: OrderStatus,
  fieldName: string
): boolean {
  const editableFields = EDITABLE_FIELDS_BY_STATUS[status];
  if (editableFields === null || editableFields === undefined) {
    return false;
  }
  if (editableFields.includes('*')) {
    return true;
  }
  return editableFields.includes(fieldName);
}

// ============================================================
// 按钮可用性规则
// ============================================================

/** 批量操作上下文类型 */
export interface BulkActionContext {
  selectedCount: number;
  pendingCount: number;     // 待派发状态数量
  assignedCount: number;    // 已派发状态数量
  notifiedCount: number;   // 通知发货状态数量
  returnableCount: number; // 可回单状态数量 (assigned, notified)
  returnedCount: number;     // 已回单状态数量
  partialReturnedCount: number;  // 部分回单状态数量
  feedbackableCount: number; // 可反馈状态数量 (returned, partial_returned)
  totalCount: number;
  hasPartialReturned: boolean;
}

/** 按钮禁用原因 */
export interface DisabledReason {
  noSelection?: string;           // 未选择任何订单
  noPending?: string;            // 没有待派发状态订单
  noAssigned?: string;           // 没有已派发状态订单
  noNotified?: string;           // 没有通知发货状态订单
  noReturnable?: string;         // 没有可回单状态订单
  noReturned?: string;           // 没有已回单状态订单
  noPartialReturned?: string;    // 没有部分回单状态订单
  noFeedbackable?: string;       // 没有可反馈状态订单
  noCompleted?: string;           // 没有已导金蝶状态订单
  noCancellable?: string;        // 没有可取消状态订单
  multipleStatuses?: string;      // 混合状态无法执行
  singleSelectRequired?: string;   // 需要单选
}

/** 批量操作配置 */
export interface BulkActionConfig {
  /** 是否在工具栏显示 */
  visible: boolean;
  /** 是否启用（返回禁用原因对象，如果为空则启用） */
  enabled: (ctx: BulkActionContext) => DisabledReason;
  /** 按钮显示文本 */
  label: string;
  /** 图标（可选） */
  icon?: string;
  /** 操作类型 */
  action: 'assign' | 'notify' | 'return' | 'partial_return' | 'feedback' | 'complete' | 'cancel' | 'delete' | 'export_returned' | 'export_partial';
}

/** 批量操作规则 */
export const BULK_ACTIONS: Record<string, BulkActionConfig> = {
  assign: {
    visible: true,
    label: '批量派发',
    action: 'assign',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      if (ctx.pendingCount === 0) return { noPending: '所选订单中没有待派发状态' };
      return {};
    },
  },
  notify: {
    visible: true,
    label: '通知发货',
    action: 'notify',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      if (ctx.assignedCount === 0) return { noAssigned: '所选订单中没有已派发状态' };
      return {};
    },
  },
  return: {
    visible: true,
    label: '确认回单',
    action: 'return',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      if (ctx.assignedCount === 0 && ctx.returnableCount === 0) {
        return { noReturnable: '仅已派发或通知发货状态可确认回单' };
      }
      return {};
    },
  },
  partial_return: {
    visible: true,
    label: '部分回单',
    action: 'partial_return',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      if (ctx.assignedCount === 0 && ctx.notifiedCount === 0) {
        return { noNotified: '仅已派发或通知发货状态可部分回单' };
      }
      return {};
    },
  },
  feedback: {
    visible: true,
    label: '客户反馈',
    action: 'feedback',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      if (ctx.feedbackableCount === 0) {
        return { noFeedbackable: '仅已回单或部分回单订单可反馈客户' };
      }
      return {};
    },
  },
  complete: {
    visible: true,
    label: '导金蝶',
    action: 'complete',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      if (ctx.feedbackableCount === 0 && ctx.returnedCount === 0) {
        return { noReturned: '仅已回单、已反馈或部分回单订单可导金蝶' };
      }
      return {};
    },
  },
  cancel: {
    visible: true,
    label: '取消订单',
    action: 'cancel',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      // 只有 pending, assigned, notified 状态可取消
      const cancellableCount = ctx.pendingCount + ctx.assignedCount;
      if (cancellableCount === 0) {
        return { noCancellable: '仅待派发、已派发、通知发货状态可取消' };
      }
      return {};
    },
  },
  delete: {
    visible: true,
    label: '删除订单',
    action: 'delete',
    enabled: (ctx) => {
      if (ctx.selectedCount === 0) return { noSelection: '请先选择订单' };
      // 只有 pending 状态可删除
      if (ctx.pendingCount === 0) {
        return { noPending: '仅待派发状态订单可删除' };
      }
      // 如果有非 pending 状态，提示一下
      if (ctx.selectedCount > ctx.pendingCount) {
        return { multipleStatuses: '只能删除待派发状态的订单' };
      }
      return {};
    },
  },
  export_returned: {
    visible: true,
    label: '导出已回单',
    action: 'export_returned',
    enabled: (ctx) => {
      if (ctx.returnedCount === 0) {
        return { noReturned: '没有已回单状态的订单' };
      }
      return {};
    },
  },
  export_partial: {
    visible: true,
    label: '导出部分回单',
    action: 'export_partial',
    enabled: (ctx) => {
      if (ctx.partialReturnedCount === 0) {
        return { noPartialReturned: '没有部分回单状态的订单' };
      }
      return {};
    },
  },
};

/** 获取批量操作的禁用原因 */
export function getBulkActionDisabledReason(
  actionKey: string,
  ctx: BulkActionContext
): DisabledReason {
  const action = BULK_ACTIONS[actionKey];
  if (!action) {
    return { noSelection: '未知操作' };
  }
  return action.enabled(ctx);
}

/** 检查批量操作是否启用 */
export function isBulkActionEnabled(
  actionKey: string,
  ctx: BulkActionContext
): boolean {
  const reason = getBulkActionDisabledReason(actionKey, ctx);
  return Object.keys(reason).length === 0;
}

// ============================================================
// 行级操作规则
// ============================================================

/** 行级操作配置 */
export interface RowActionConfig {
  visible: boolean;
  editable: (status: OrderStatus) => boolean;
  label: string;
}

/** 行级操作规则 */
export const ROW_ACTIONS: Record<string, RowActionConfig> = {
  edit: {
    visible: true,
    label: '编辑',
    editable: (status) => status === 'pending',
  },
  assign: {
    visible: true,
    label: '派发',
    editable: (status) => status === 'pending',
  },
  notify: {
    visible: true,
    label: '通知发货',
    editable: (status) => status === 'assigned',
  },
  return: {
    visible: true,
    label: '确认回单',
    editable: (status) => status === 'assigned' || status === 'notified',
  },
  partial_return: {
    visible: true,
    label: '部分回单',
    editable: (status) => status === 'assigned' || status === 'notified',
  },
  feedback: {
    visible: true,
    label: '客户反馈',
    editable: (status) => status === 'returned' || status === 'partial_returned',
  },
  complete: {
    visible: true,
    label: '导金蝶',
    editable: (status) => 
      status === 'returned' || 
      status === 'partial_returned' || 
      status === 'feedbacked',
  },
  cancel: {
    visible: true,
    label: '取消',
    editable: (status) => 
      status === 'pending' || 
      status === 'assigned' || 
      status === 'notified',
  },
  delete: {
    visible: true,
    label: '删除',
    editable: (status) => status === 'pending',
  },
};

/** 检查行级操作是否可编辑 */
export function isRowActionEditable(actionKey: string, status: OrderStatus): boolean {
  const action = ROW_ACTIONS[actionKey];
  if (!action) return false;
  return action.editable(status);
}

// ============================================================
// 状态统计辅助函数
// ============================================================

/** 订单项类型（只要求 status 属性） */
export interface OrderLike {
  status: string;
}

/** 从订单列表计算批量操作上下文 */
export function computeBulkActionContext(orders: OrderLike[]): BulkActionContext {
  const ctx: BulkActionContext = {
    selectedCount: 0,
    pendingCount: 0,
    assignedCount: 0,
    notifiedCount: 0,
    returnableCount: 0,
    returnedCount: 0,
    partialReturnedCount: 0,
    feedbackableCount: 0,
    totalCount: orders.length,
    hasPartialReturned: false,
  };

  for (const order of orders) {
    ctx.selectedCount++;
    
    switch (order.status) {
      case 'pending':
        ctx.pendingCount++;
        break;
      case 'assigned':
        ctx.assignedCount++;
        ctx.returnableCount++;
        break;
      case 'notified':
        ctx.notifiedCount++;
        ctx.returnableCount++;
        break;
      case 'partial_returned':
        ctx.partialReturnedCount++;
        ctx.feedbackableCount++;
        ctx.hasPartialReturned = true;
        break;
      case 'returned':
        ctx.returnedCount++;
        ctx.feedbackableCount++;
        break;
      case 'feedbacked':
        ctx.feedbackableCount++;
        break;
    }
  }

  return ctx;
}
