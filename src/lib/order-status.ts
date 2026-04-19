import type { OrderStatus } from '@/types/order';

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待派发',
  assigned: '已派发',
  partial_returned: '部分回单',
  returned: '已回单',
  feedbacked: '已反馈',
  completed: '已导金蝶',
  cancelled: '已取消',
};

export const ORDER_STATUS_BADGE_CLASSES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  partial_returned: 'bg-orange-100 text-orange-800',
  returned: 'bg-green-100 text-green-800',
  feedbacked: 'bg-teal-100 text-teal-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const ORDER_STATUS_OPTIONS = (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => ({
  value: status,
  label: ORDER_STATUS_LABELS[status],
  badgeClassName: ORDER_STATUS_BADGE_CLASSES[status],
}));

export const CUSTOMER_FEEDBACK_SOURCE_STATUSES: OrderStatus[] = [
  'returned',
  'feedbacked',
  'completed',
];

export function isCustomerFeedbackSourceStatus(status?: string | null): status is OrderStatus {
  return CUSTOMER_FEEDBACK_SOURCE_STATUSES.includes(status as OrderStatus);
}

export function getOrderStatusLabel(status?: string | null) {
  if (!status) {
    return '';
  }

  return ORDER_STATUS_LABELS[status as OrderStatus] || status;
}

export function getOrderStatusBadgeClass(status?: string | null) {
  if (!status) {
    return 'bg-gray-100 text-gray-800';
  }

  return ORDER_STATUS_BADGE_CLASSES[status as OrderStatus] || 'bg-gray-100 text-gray-800';
}
