'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, RotateCcw, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { MappingHistory } from '../hooks/use-column-mapping';

interface MappingHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  history: MappingHistory[];
  onRestore: (mappingId: string) => void;
}

export function MappingHistoryDialog({
  open,
  onOpenChange,
  history,
  onRestore,
}: MappingHistoryDialogProps) {
  const [search, setSearch] = useState('');

  const filtered = history.filter(
    (h) =>
      !search ||
      `v${h.version}`.includes(search) ||
      h.remark?.includes(search) ||
      h.created_by?.includes(search)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            映射历史版本
          </DialogTitle>
          <DialogDescription>
            选择一个历史版本进行恢复，仅恢复映射配置，不影响当前数据
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索版本号、备注、创建人..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无映射历史
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">v{item.version}</Badge>
                    {item.header_fingerprint && (
                      <Badge variant="outline" className="text-xs">
                        {item.header_fingerprint.slice(0, 8)}...
                      </Badge>
                    )}
                    {item.is_active && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">当前</Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-x-2">
                    <span>表头行: {item.header_row}</span>
                    <span>列配置: {Object.keys(item.mapping_config || {}).length} 列</span>
                    {item.created_by && <span>创建人: {item.created_by}</span>}
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                  {item.remark && (
                    <div className="text-xs text-muted-foreground mt-1">备注: {item.remark}</div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRestore(item.id);
                    onOpenChange(false);
                  }}
                  className="ml-3 shrink-0"
                >
                  <RotateCcw className="h-3 w-3 mr-1" />
                  恢复
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
