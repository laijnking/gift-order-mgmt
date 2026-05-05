'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import {
  COLUMN_OPTIONS,
  GROUPED_OPTIONS,
  COMMON_FIELDS,
} from '../hooks/use-column-mapping';

interface ColumnMappingUIProps {
  preview: string[][];
  headerRow: number;
  columnMapping: Record<string, string>;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  onMappingChange: (mapping: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  onAutoLoadedClear: () => void;
}

export function ColumnMappingUI({
  preview,
  headerRow,
  columnMapping,
  collapsed,
  onCollapsedChange,
  onMappingChange,
  onAutoLoadedClear,
}: ColumnMappingUIProps) {
  const headers = preview[headerRow] || [];

  return (
    <Collapsible
      open={!collapsed}
      onOpenChange={(open) => onCollapsedChange(!open)}
      className="flex-1 min-h-0 overflow-hidden flex flex-col"
    >
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer select-none shrink-0">
          <Label className="text-xs font-medium">列映射（自动识别）</Label>
          {collapsed && <ChevronDown className="h-3 w-3 text-muted-foreground" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto mt-2 pr-2">
          <div className="space-y-2 pb-2">
            {headers.map((header, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-muted/50 p-2 rounded">
                <code className="text-xs bg-muted px-2 py-1 rounded min-w-[80px] max-w-[120px] truncate flex-shrink-0">
                  {header || `列${idx + 1}`}
                </code>
                <span className="text-muted-foreground text-xs flex-shrink-0">→</span>
                <Select
value={columnMapping[String(idx)] || ''}
onValueChange={(v) => {
  onAutoLoadedClear();
  const updater = (prev: Record<string, string>) => {
    const updated = { ...prev, [String(idx)]: v };
    if (v.startsWith('ext_field_')) {
      for (const [k, val] of Object.entries(updated)) {
        if (k !== String(idx) && val === v) {
          updated[k] = '';
        }
      }
    }
    return updated;
  };
  onMappingChange(updater);
}}
                >
<SelectTrigger className="h-7 text-xs flex-1">
  <SelectValue placeholder="选择字段..." />
</SelectTrigger>
<SelectContent>
  <SelectGroup>
    <SelectLabel className="text-xs">常用字段</SelectLabel>
    {COLUMN_OPTIONS.filter((opt) => COMMON_FIELDS.includes(opt.value)).map((opt) => (
      <SelectItem key={opt.value} value={opt.value}>
        {opt.label}
      </SelectItem>
    ))}
  </SelectGroup>
  {Object.entries(GROUPED_OPTIONS)
    .map(([group, options]) => {
      // 过滤掉已在"常用字段"中出现的选项，避免重复
      const nonCommon = options.filter((opt) => !COMMON_FIELDS.includes(opt.value));
      if (nonCommon.length === 0) return null;
      return (
        <SelectGroup key={group}>
          <SelectLabel className="text-xs">{group}</SelectLabel>
          {nonCommon.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      );
    })
    .filter(Boolean)}
</SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Preview table */}
        <details className="mt-2 shrink-0">
          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
            预览前5行数据
          </summary>
          <div className="mt-1 overflow-x-auto border rounded text-xs">
            <table className="w-full">
              <thead>
                <tr className="bg-muted">
{headers.map((h, i) => (
  <th key={i} className="px-2 py-1 text-left whitespace-nowrap">
    {h || `列${i + 1}`}
  </th>
))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(headerRow + 1, headerRow + 6).map((row, ri) => (
<tr key={ri} className="border-t">
  {row.map((cell, ci) => (
    <td key={ci} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate">
      {cell}
    </td>
  ))}
</tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </CollapsibleContent>
    </Collapsible>
  );
}
