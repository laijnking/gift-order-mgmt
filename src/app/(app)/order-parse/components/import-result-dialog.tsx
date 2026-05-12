'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { DuplicateSummary } from '../hooks/use-order-submit';

interface ImportResultDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  importBatch: string;
  sysOrderNos: string[];
  message: string;
  customerName?: string;
  duplicateTotalSkipped?: number;
  duplicateSummary?: DuplicateSummary;
  skipExisting?: boolean;
  onClose: () => void;
}

export function ImportResultDialog({
  open,
  onOpenChange,
  total,
  importBatch,
  sysOrderNos,
  message,
  customerName,
  duplicateTotalSkipped,
  duplicateSummary,
  skipExisting,
  onClose,
}: ImportResultDialogProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = sysOrderNos.join(', ');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    onOpenChange(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>订单导入完成</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded bg-muted p-2">
              <div className="text-xs text-muted-foreground">导入数量</div>
              <div className="text-lg font-bold">{total} 条</div>
            </div>
            {duplicateTotalSkipped !== undefined && duplicateTotalSkipped > 0 && (
              <div className="rounded bg-amber-50 p-2 border border-amber-200">
                <div className="text-xs text-amber-600">跳过（重复）</div>
                <div className="text-lg font-bold text-amber-600">{duplicateTotalSkipped} 条</div>
              </div>
            )}
          </div>

          {duplicateSummary && duplicateSummary.details.length > 0 && (
            <div className="rounded bg-amber-50 p-3 border border-amber-200 space-y-1.5">
              <div className="text-xs font-medium text-amber-700">重复订单详情</div>
              {duplicateSummary.details
                .filter((d) => d.reason === 'batch_duplicate')
                .slice(0, 10)
                .map((d) => (
                  <div key={d.orderNo} className="text-xs text-amber-600">
                    批次内重复: {d.orderNo}（{d.receiverName}）
                  </div>
                ))}
              {duplicateSummary.details.filter((d) => d.reason === 'batch_duplicate').length > 10 && (
                <div className="text-xs text-amber-500">
                  ...还有 {duplicateSummary.details.filter((d) => d.reason === 'batch_duplicate').length - 10} 条
                </div>
              )}
              {duplicateSummary.existingDuplicateCount > 0 && (
                <div className="text-xs text-amber-700 mt-1">
                  {duplicateSummary.existingDuplicateCount} 条订单在系统中已存在{skipExisting ? '（已跳过）' : ''}
                </div>
              )}
            </div>
          )}

          {importBatch && (
            <div className="rounded bg-muted p-2">
              <div className="text-xs text-muted-foreground">批次号</div>
              <div className="font-mono text-sm">{importBatch}</div>
            </div>
          )}

          {customerName && (
            <div className="rounded bg-muted p-2">
              <div className="text-xs text-muted-foreground">关联客户</div>
              <div className="text-sm font-medium">{customerName}</div>
            </div>
          )}

          {sysOrderNos.length > 0 && (
            <div className="rounded bg-muted p-2">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-muted-foreground">系统订单号（点击复制）</div>
                <Button variant="ghost" size="sm" className="h-5 text-xs" onClick={handleCopy}>
                  {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                  {copied ? '已复制' : '复制'}
                </Button>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-0.5">
                {sysOrderNos.map((no) => (
                  <div key={no} className="font-mono text-xs text-muted-foreground">
                    {no}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={handleClose}>确定</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
