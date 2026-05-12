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
import { AlertTriangle } from 'lucide-react';

interface DuplicateInfo {
  orderNo: string;
  receiverName: string;
  sysOrderNo?: string;
}

interface DuplicateCheckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingOrders: DuplicateInfo[];
  batchDuplicates: DuplicateInfo[];
  fuzzyDuplicates?: DuplicateInfo[];
  /** 跳过重复后还剩多少新订单 */
  remainingCount: number;
  onSkip: () => void;
  onImportAll: () => void;
}

export function DuplicateCheckDialog({
  open,
  onOpenChange,
  existingOrders,
  batchDuplicates,
  fuzzyDuplicates,
  remainingCount,
  onSkip,
  onImportAll,
}: DuplicateCheckDialogProps) {
  const existingCount = existingOrders.length;
  const batchCount = batchDuplicates.length;
  const fuzzyCount = fuzzyDuplicates?.length || 0;
  const totalDuplicate = existingCount + batchCount + fuzzyCount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            检测到重复订单
          </DialogTitle>
          <DialogDescription>
            共 {totalDuplicate} 条订单重复，请选择处理方式
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm max-h-[300px] overflow-y-auto">
          {batchCount > 0 && (
            <div className="rounded bg-amber-50 p-3 border border-amber-200 space-y-1">
              <div className="text-xs font-medium text-amber-700">
                批次内重复（{batchCount} 条，将自动跳过）
              </div>
              {batchDuplicates.slice(0, 10).map((d) => (
                <div key={d.orderNo} className="text-xs text-amber-600 truncate">
                  {d.orderNo}{d.receiverName ? `（${d.receiverName}）` : ''}
                </div>
              ))}
              {batchCount > 10 && (
                <div className="text-xs text-amber-500">...还有 {batchCount - 10} 条</div>
              )}
            </div>
          )}

          {existingCount > 0 && (
            <div className="rounded bg-orange-50 p-3 border border-orange-200 space-y-1">
              <div className="text-xs font-medium text-orange-700">
                订单编码重复（{existingCount} 条）
              </div>
              {existingOrders.slice(0, 10).map((d) => (
                <div key={d.orderNo} className="text-xs text-orange-600 truncate">
                  {d.orderNo}{d.receiverName ? `（${d.receiverName}）` : ''}
                  {d.sysOrderNo ? ` → ${d.sysOrderNo}` : ''}
                </div>
              ))}
              {existingCount > 10 && (
                <div className="text-xs text-orange-500">...还有 {existingCount - 10} 条</div>
              )}
            </div>
          )}

          {fuzzyCount > 0 && (
            <div className="rounded bg-yellow-50 p-3 border border-yellow-200 space-y-1">
              <div className="text-xs font-medium text-yellow-700">
                模糊匹配重复（{fuzzyCount} 条，商品+电话+数量一致）
              </div>
              {fuzzyDuplicates!.slice(0, 10).map((d) => (
                <div key={d.orderNo} className="text-xs text-yellow-600 truncate">
                  {d.orderNo || '(无编码)'}{d.receiverName ? `（${d.receiverName}）` : ''}
                  {d.sysOrderNo ? ` → ${d.sysOrderNo}` : ''}
                </div>
              ))}
              {fuzzyCount > 10 && (
                <div className="text-xs text-yellow-500">...还有 {fuzzyCount - 10} 条</div>
              )}
            </div>
          )}

          {remainingCount > 0 && (
            <div className="rounded bg-green-50 p-2 border border-green-200">
              <div className="text-xs text-green-700">
                跳过重复后，将导入 <span className="font-bold">{remainingCount}</span> 条新订单
              </div>
            </div>
          )}

          {remainingCount === 0 && (
            <div className="rounded bg-muted p-2">
              <div className="text-xs text-muted-foreground">
                跳过重复后将不创建任何新订单
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            取消
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onImportAll();
            }}
          >
            全部导入（含重复）
          </Button>
          <Button
            onClick={() => {
              onOpenChange(false);
              onSkip();
            }}
          >
            跳过已存在，仅导入新订单
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
