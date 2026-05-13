'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { DuplicateInfo } from '@/lib/import-dedup';
import { generateDuplicateCSV } from '@/lib/import-dedup';

type ImportDuplicateFeedbackProps = {
  duplicates: DuplicateInfo[];
  columns: string[];
  filename?: string;
  open: boolean;
  onClose: () => void;
};

export function ImportDuplicateFeedback({
  duplicates,
  columns,
  filename = '重复记录',
  open,
  onClose,
}: ImportDuplicateFeedbackProps) {
  const [showAll, setShowAll] = useState(false);
  const displayDuplicates = showAll ? duplicates : duplicates.slice(0, 10);
  const hasMore = duplicates.length > 10;

  // 按重复原因分组统计
  const reasonGroups = duplicates.reduce(
    (acc, d) => {
      const reason = d.reason;
      acc[reason] = (acc[reason] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const handleExportCSV = () => {
    const csv = generateDuplicateCSV(duplicates, columns);
    const bom = '﻿';
    const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_重复记录.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>重复记录检测结果</DialogTitle>
          <DialogDescription>
            共检测到 {duplicates.length} 条重复记录，已自动跳过
          </DialogDescription>
        </DialogHeader>

        {/* 分类统计 */}
        <div className="space-y-1 text-sm">
          {Object.entries(reasonGroups).map(([reason, count]) => (
            <div key={reason} className="flex justify-between text-muted-foreground">
              <span>{reason}</span>
              <span className="font-medium">{count} 条</span>
            </div>
          ))}
        </div>

        {/* 重复列表 */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">行号</TableHead>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
                <TableHead>重复原因</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayDuplicates.map((d, i) => (
                <TableRow key={i}>
                  <TableCell>{d.row}</TableCell>
                  {columns.map((col) => (
                    <TableCell key={col}>
                      {d.keyValues[col] !== undefined && d.keyValues[col] !== null
                        ? String(d.keyValues[col])
                        : '-'}
                    </TableCell>
                  ))}
                  <TableCell className="text-destructive text-xs">{d.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {hasMore && !showAll && (
          <p className="text-sm text-muted-foreground text-center">
            还有 {duplicates.length - 10} 条未显示，
            <button
              type="button"
              className="underline text-primary"
              onClick={() => setShowAll(true)}
            >
              查看全部
            </button>
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleExportCSV}>
            导出重复记录 CSV
          </Button>
          <Button onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
