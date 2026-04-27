'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle } from 'lucide-react';

interface OrderReturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trackingNos: string;
  setTrackingNos: (v: string) => void;
  expressCompany: string;
  setExpressCompany: (v: string) => void;
  onSubmit: () => void;
  selectedCount: number;
}

export function OrderReturnDialog({
  open,
  onOpenChange,
  trackingNos,
  setTrackingNos,
  expressCompany,
  setExpressCompany,
  onSubmit,
  selectedCount,
}: OrderReturnDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>物流回单</DialogTitle>
          <DialogDescription>
            导入快递单号，匹配订单完成回单
            {selectedCount > 0 && `（当前已选 ${selectedCount} 条订单）`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>快递公司（可选，统一设置）</Label>
            <Input
              placeholder="如：顺丰、中通等"
              value={expressCompany}
              onChange={(e) => setExpressCompany(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>快递单号</Label>
            <Textarea
              placeholder={'每行一个快递单号，或"单号,快递公司"格式\n例如：\nSF1234567890\nYT9876543210,圆通'}
              value={trackingNos}
              onChange={(e) => setTrackingNos(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {selectedCount > 0
                ? `将按顺序匹配已选的 ${selectedCount} 条订单`
                : '未选择订单时，将自动匹配已派发状态的订单'}
            </p>
          </div>
          <Button className="w-full" onClick={onSubmit}>
            <CheckCircle className="w-4 h-4 mr-2" />
            确认回单
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
