'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Send, Bell, Truck, MessageSquare, Archive, FileInput, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Order } from '../hooks/use-orders-session';

interface BulkActionBarProps {
  selectedOrders: Set<Order>;
  pendingCount: number;
  assignedCount: number;
  returnableCount: number;
  feedbackedCount: number;
  onAssign: () => void;
  onShipNotice: () => void;
  onReturn: () => void;
  onFeedback: () => void;
  onExportKingdee: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  selectedOrders,
  pendingCount,
  assignedCount,
  returnableCount,
  feedbackedCount,
  onAssign,
  onShipNotice,
  onReturn,
  onFeedback,
  onExportKingdee,
  onDelete,
}: BulkActionBarProps) {
  const router = useRouter();
  const hasSelection = selectedOrders.size > 0;

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">常用操作：</span>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => router.push('/order-parse')}
          >
            <FileInput className="w-4 h-4 mr-1.5" />
            订单导入
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onAssign}
            disabled={!hasSelection || pendingCount === 0}
          >
            <Send className="w-4 h-4 mr-1.5" />
            分派供应商
            {pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{pendingCount}</Badge>
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onShipNotice}
            disabled={!hasSelection || assignedCount === 0}
          >
            <Bell className="w-4 h-4 mr-1.5" />
            发货通知
            {assignedCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">{assignedCount}</Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onReturn}
            disabled={!hasSelection || assignedCount === 0}
          >
            <Truck className="w-4 h-4 mr-1.5" />
            物流回单
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onFeedback}
            disabled={hasSelection && returnableCount === 0}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            反馈给客户
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onExportKingdee}
            disabled={hasSelection && feedbackedCount === 0}
          >
            <Archive className="w-4 h-4 mr-1.5" />
            导出金蝶
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
