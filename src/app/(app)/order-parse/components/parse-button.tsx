'use client';

import { Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ParseResult } from '../hooks/use-order-parse-session';

interface ParseButtonProps {
  inputMode: 'text' | 'excel';
  isLoading: boolean;
  hasText: boolean;
  hasExcelData: boolean;
  parseResult: ParseResult | null;
  mappedColumnCount: number;
  textLength: number;
  onParse: () => void;
  onClear: () => void;
}

export function ParseButton({
  inputMode,
  isLoading,
  hasText,
  hasExcelData,
  parseResult,
  onParse,
  onClear,
}: ParseButtonProps) {
  const canParse = isLoading ? false : inputMode === 'text' ? hasText : hasExcelData;

  return (
    <div className="px-6 pb-4 shrink-0 space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={onParse}
          disabled={!canParse}
          className="flex-1"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              解析中...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              AI解析
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onClear} className="sm:w-auto">
          清空
        </Button>
      </div>
      {parseResult && (
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Check className="h-3 w-3 text-green-500" />
          解析完成，耗时 {parseResult.duration}ms
        </div>
      )}
    </div>
  );
}
