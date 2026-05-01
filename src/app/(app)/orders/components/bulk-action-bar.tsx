'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, Bell, Truck, MessageSquare, Archive, FileInput, HelpCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  BULK_ACTIONS,
  computeBulkActionContext,
  type BulkActionContext,
  type DisabledReason,
} from '@/lib/order-workflow-config';
import type { Order } from '../hooks/use-orders-session';

interface BulkActionBarProps {
  selectedOrders: Set<Order>;
  onAssign: () => void;
  onShipNotice: () => void;
  onReturn: () => void;
  onFeedback: () => void;
  onExportKingdee: () => void;
  onDelete: () => void;
}

export function BulkActionBar({
  selectedOrders,
  onAssign,
  onShipNotice,
  onReturn,
  onFeedback,
  onExportKingdee,
  onDelete,
}: BulkActionBarProps) {
  const router = useRouter();

  // 从已选订单计算上下文
  const ctx = computeBulkActionContext(Array.from(selectedOrders));

  // 获取禁用原因的显示文本
  const getDisabledReasonText = (reason: DisabledReason): string | null => {
    if (Object.keys(reason).length === 0) return null;
    
    // 优先显示最有意义的提示
    if (reason.noSelection) return reason.noSelection;
    if (reason.noPending) return reason.noPending;
    if (reason.noAssigned) return reason.noAssigned;
    if (reason.noReturnable) return reason.noReturnable;
    if (reason.noFeedbackable) return reason.noFeedbackable;
    if (reason.noReturned) return reason.noReturned;
    if (reason.multipleStatuses) return reason.multipleStatuses;
    
    // 返回第一个非空原因
    const firstReason = Object.values(reason)[0];
    return typeof firstReason === 'string' ? firstReason : null;
  };

  // 创建带有禁用原因提示的按钮
  const ActionButton = ({
    actionKey,
    onClick,
    children,
    icon: Icon,
    variant = 'outline' as const,
  }: {
    actionKey: string;
    onClick: () => void;
    children: React.ReactNode;
    icon: React.ElementType;
    variant?: 'default' | 'outline';
  }) => {
    const action = BULK_ACTIONS[actionKey];
    const disabledReason = action.enabled(ctx);
    const isDisabled = Object.keys(disabledReason).length > 0;
    const reasonText = getDisabledReasonText(disabledReason);

    const button = (
      <Button
        variant={variant}
        size="sm"
        className="w-full sm:w-auto"
        onClick={onClick}
        disabled={isDisabled}
      >
        <Icon className="w-4 h-4 mr-1.5" />
        {children}
        {ctx.selectedCount > 0 && (
          <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
            {ctx.selectedCount}
          </Badge>
        )}
      </Button>
    );

    if (isDisabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{reasonText}</p>
          </TooltipContent>
        </Tooltip>
      );
    }

    return button;
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground mr-1">常用操作：</span>
          
          {/* 订单导入 */}
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => router.push('/order-parse')}
          >
            <FileInput className="w-4 h-4 mr-1.5" />
            订单导入
          </Button>

          {/* 分派发货方 */}
          <ActionButton
            actionKey="assign"
            onClick={onAssign}
            icon={Send}
          >
            分派发货方
            {ctx.pendingCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {ctx.pendingCount}
              </Badge>
            )}
          </ActionButton>

          {/* 发货通知 */}
          <ActionButton
            actionKey="notify"
            onClick={onShipNotice}
            icon={Bell}
            variant="default"
          >
            发货通知
            {ctx.assignedCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {ctx.assignedCount}
              </Badge>
            )}
          </ActionButton>

          {/* 物流回单 */}
          <ActionButton
            actionKey="return"
            onClick={onReturn}
            icon={Truck}
          >
            物流回单
            {(ctx.assignedCount + ctx.notifiedCount) > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {ctx.assignedCount + ctx.notifiedCount}
              </Badge>
            )}
          </ActionButton>

          {/* 反馈给客户 */}
          <ActionButton
            actionKey="feedback"
            onClick={onFeedback}
            icon={MessageSquare}
          >
            反馈给客户
            {ctx.feedbackableCount > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {ctx.feedbackableCount}
              </Badge>
            )}
          </ActionButton>

          {/* 导出金蝶 */}
          <ActionButton
            actionKey="complete"
            onClick={onExportKingdee}
            icon={Archive}
          >
            导出金蝶
            {(ctx.returnedCount + ctx.feedbackableCount) > 0 && (
              <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-xs">
                {ctx.returnedCount + ctx.feedbackableCount}
              </Badge>
            )}
          </ActionButton>

          {/* 帮助说明 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="text-xs space-y-1">
                <p className="font-medium">操作说明：</p>
                <p>分派发货方：选中待派发订单后可用</p>
                <p>发货通知：选中已派发订单后可用</p>
                <p>物流回单：选中已派发/通知发货订单后可用</p>
                <p>反馈给客户：选中已回单/部分回单订单后可用</p>
                <p>导出金蝶：选中已回单/已反馈订单后可用</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardContent>
    </Card>
  );
}
