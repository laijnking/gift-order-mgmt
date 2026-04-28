'use client';

import { useCallback, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Upload,
  FileSpreadsheet,
  X,
  RefreshCw,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

interface ExcelUploadProps {
  file: File | null;
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  selectedSheet: string;
  headerRow: number;
  preview: string[][];
  parsedOrdersCount: number;
  isMatchingSupplier: boolean;
  onFileUpload: (file: File) => void;
  onSheetChange: (sheetName: string) => void;
  onHeaderRowChange: (row: number) => void;
  onReDetect: () => void;
  onMatchAllSuppliers: () => void;
  onRemoveFile: () => void;
}

export function ExcelUpload({
  file,
  fileName,
  fileSize,
  sheetNames,
  selectedSheet,
  headerRow,
  preview,
  parsedOrdersCount,
  isMatchingSupplier,
  onFileUpload,
  onSheetChange,
  onHeaderRowChange,
  onReDetect,
  onMatchAllSuppliers,
  onRemoveFile,
}: ExcelUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleExcelUpload = useCallback(
    (f: File) => {
      onFileUpload(f);
    },
    [onFileUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const f = files[0];
        if (f.name.match(/\.(xlsx|xls|csv)$/i)) {
          handleExcelUpload(f);
        } else {
          toast.error('请上传 Excel 文件（.xlsx, .xls, .csv）');
        }
      }
    },
    [handleExcelUpload]
  );

  if (!file && !fileName) {
    return (
      <div
        className={`flex-1 border-2 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors min-h-[150px] ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-dashed hover:border-primary hover:bg-primary/5'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={handleDrop}
      >
        {isDragging ? (
          <>
            <FileSpreadsheet className="h-10 w-10 text-primary mb-3" />
            <p className="text-sm font-medium text-primary">松开以上传文件</p>
            <p className="text-xs text-muted-foreground mt-1">拖放文件到此处</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-muted-foreground mb-3" />
            <p className="text-sm font-medium">点击上传Excel文件</p>
            <p className="text-xs text-muted-foreground mt-1">
              支持 .xlsx, .xls, .csv 格式（也可直接拖放文件到此处）
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleExcelUpload(f);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 shrink-0">
      {/* File info */}
      <div className="flex flex-col gap-2 rounded-md bg-muted p-2 text-sm sm:flex-row sm:items-center sm:justify-between shrink-0">
        <div className="flex min-w-0 items-center gap-2 text-sm">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          <span className="max-w-[180px] truncate font-medium sm:max-w-[220px]">
            {file?.name ?? fileName ?? '未知文件'}
          </span>
          <span className="text-muted-foreground">
            ({((file?.size ?? fileSize ?? 0) / 1024).toFixed(1)}KB)
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={onRemoveFile}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Sheet select */}
      {sheetNames.length > 1 && (
        <div className="grid gap-1 shrink-0">
          <Label className="text-xs">工作表</Label>
          <Select value={selectedSheet} onValueChange={onSheetChange}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sheetNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Header row and action buttons */}
      <div className="grid grid-cols-1 gap-2 items-end shrink-0 sm:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-1">
          <Label className="text-xs">表头行（从0开始）</Label>
          <Input
            type="number"
            min="0"
            max={Math.max(0, preview.length - 2)}
            value={headerRow}
            onChange={(e) => onHeaderRowChange(parseInt(e.target.value) || 0)}
            className="h-8 text-sm"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={onReDetect}
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          重新检测
        </Button>
        <Button
          variant="default"
          size="sm"
          className="h-8 bg-emerald-600 hover:bg-emerald-700"
          onClick={onMatchAllSuppliers}
          disabled={isMatchingSupplier || parsedOrdersCount === 0}
        >
          {isMatchingSupplier ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              匹配中...
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3 mr-1" />
              批量匹配发货方
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
