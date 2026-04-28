'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, PanelRightClose, PanelRightOpen, X, AlertTriangle } from 'lucide-react';
import type { Order } from '../hooks/use-orders-session';

const ALERT_LEVEL_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  info: { label: '提示', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  warning: { label: '警告', color: 'text-yellow-600', bgColor: 'bg-yellow-50 border-yellow-200' },
  error: { label: '错误', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  critical: { label: '严重', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
};

export interface AlertRecord {
  id: string;
  ruleId?: string;
  orderId?: string;
  orderNo?: string;
  alertType: string;
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  content: string;
  isRead: boolean;
  isResolved: boolean;
  createdAt: string;
}

export interface OrderAlertSummary {
  type: 'pending_to_assign' | 'assigned_to_ship' | 'assigned_to_returned' | 'overdue_24h';
  label: string;
  description: string;
  count: number;
  orders: Order[];
}

interface OrderWarningsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alerts: AlertRecord[];
  unreadCount: number;
  orders: Order[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onViewOrder: (orderId: string) => void;
  onStatusFilter: (status: string) => void;
}

export function calculateOrderAlerts(orders: Order[]): OrderAlertSummary[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today16 = new Date(today.getTime() + 16 * 60 * 60 * 1000);
  const tomorrow10 = new Date(today.getTime() + 34 * 60 * 60 * 1000);

  const alerts: OrderAlertSummary[] = [];

  const pendingToAssign = orders.filter(o => {
    if (o.status !== 'pending') return false;
    const createdAt = new Date(o.createdAt);
    return createdAt < today16 && now >= today16;
  });
  alerts.push({ type: 'pending_to_assign', label: '待发货超时', description: '当天16:00前未通知发货方发货', count: pendingToAssign.length, orders: pendingToAssign });

  const assignedToShip = orders.filter(o => {
    if (o.status !== 'notified') return false;
    const assignedAt = o.assignedAt ? new Date(o.assignedAt) : new Date(o.createdAt);
    return (now.getTime() - assignedAt.getTime()) / (1000 * 60 * 60) > 24;
  });
  alerts.push({ type: 'assigned_to_ship', label: '发货通知超时', description: '已导出发货通知超过24小时未收到回单', count: assignedToShip.length, orders: assignedToShip });

  const assignedToReturned = orders.filter(o => {
    if (o.status !== 'notified') return false;
    const createdAt = new Date(o.createdAt);
    return createdAt < tomorrow10 && now >= tomorrow10;
  });
  alerts.push({ type: 'assigned_to_returned', label: '回单超时', description: '通知发货后次日10:00前未导入回单', count: assignedToReturned.length, orders: assignedToReturned });

  const overdue24h = orders.filter(o => {
    const createdAt = new Date(o.createdAt);
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 24 && o.status !== 'completed' && o.status !== 'cancelled';
  });
  alerts.push({ type: 'overdue_24h', label: '时效超时', description: '从录入到反馈超过24小时', count: overdue24h.length, orders: overdue24h });

  return alerts;
}

export function OrderWarningsPanel({
  open,
  onOpenChange,
  alerts,
  unreadCount,
  orders,
  onMarkRead,
  onMarkAllRead,
  onViewOrder,
  onStatusFilter,
}: OrderWarningsPanelProps) {
  const calculateOrderAlertsMemo = useMemo(() => calculateOrderAlerts(orders), [orders]);

  return (
    <div className={`fixed right-0 top-0 z-40 h-full w-full transform border-l bg-background shadow-lg transition-transform duration-300 ease-in-out sm:w-[380px] lg:w-80 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">订单预警</h2>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">{unreadCount} 未读</Badge>
            )}
          </div>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={onMarkAllRead} title="全部已读">
                <BellOff className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Alert summary cards */}
        <div className="p-3 border-b space-y-2">
          {calculateOrderAlertsMemo.map((alert) => (
            <div
              key={alert.type}
              className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                alert.count > 0 ? 'bg-orange-50 border-orange-200' : 'bg-muted/50 border-muted'
              }`}
              onClick={() => {
                onStatusFilter(
                  alert.type === 'pending_to_assign' ? 'pending' :
                  alert.type === 'assigned_to_ship' || alert.type === 'assigned_to_returned' ? 'notified' : ''
                );
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${alert.count > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
                  <span className="text-sm font-medium">{alert.label}</span>
                </div>
                <Badge variant={alert.count > 0 ? 'destructive' : 'secondary'} className="text-xs">
                  {alert.count}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{alert.description}</p>
              {alert.count > 0 && (
                <p className="text-xs text-orange-600 mt-1 font-medium">
                  点击查看{alert.count}条超时订单
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Alert list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无预警信息</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  ALERT_LEVEL_CONFIG[alert.alertLevel]?.bgColor || 'bg-muted'
                } ${!alert.isRead ? 'ring-2 ring-primary/20' : ''}`}
                onClick={() => {
                  if (!alert.isRead) onMarkRead(alert.id);
                  if (alert.orderId) onViewOrder(alert.orderId);
                }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 ${ALERT_LEVEL_CONFIG[alert.alertLevel]?.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${ALERT_LEVEL_CONFIG[alert.alertLevel]?.color}`}>
                        {ALERT_LEVEL_CONFIG[alert.alertLevel]?.label}
                      </span>
                      {alert.orderNo && (
                        <span className="text-xs font-mono text-muted-foreground">{alert.orderNo}</span>
                      )}
                    </div>
                    <p className="text-sm font-medium mt-1 line-clamp-2">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t bg-muted/30">
          <Button variant="outline" size="sm" className="w-full" onClick={() => window.location.href = '/alerts'}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            查看全部预警
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AlertPanelToggleProps {
  open: boolean;
  onToggle: () => void;
  unreadCount: number;
}

export function AlertPanelToggle({ open, onToggle, unreadCount }: AlertPanelToggleProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="fixed right-0 top-1/2 z-50 hidden h-24 w-6 -translate-y-1/2 rounded-l-lg rounded-r-none border-l-0 bg-card shadow-lg lg:flex"
      onClick={onToggle}
    >
      {open ? (
        <PanelRightClose className="w-4 h-4" />
      ) : (
        <div className="flex flex-col items-center gap-1">
          <PanelRightOpen className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0.5 min-w-[16px] h-4">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      )}
    </Button>
  );
}
