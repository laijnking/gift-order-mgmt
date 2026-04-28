'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileSpreadsheet, Type, CheckCircle, ChevronDown } from 'lucide-react';
import { TextInput } from './text-input';
import { ExcelUpload } from './excel-upload';
import { ColumnMappingUI } from './column-mapping-ui';
import { ParseButton } from './parse-button';

export interface InputPanelProps {
  inputMode: 'text' | 'excel';
  onInputModeChange: (v: 'text' | 'excel') => void;
  // Text
  inputText: string;
  onInputTextChange: (v: string) => void;
  // Excel
  excelFile: File | null;
  excelFileName: string;
  excelFileSize: number;
  excelSheetNames: string[];
  selectedSheet: string;
  headerRow: number;
  excelPreview: string[][];
  columnMapping: Record<string, string>;
  mappingAutoLoaded: boolean;
  mappingAutoLoadedId: string | null;
  // Parse
  isLoading: boolean;
  parseResult: { duration: number } | null;
  parsedOrdersCount: number;
  isMatchingSupplier: boolean;
  // Actions
  onTextParse: () => void;
  onExcelFileUpload: (file: File) => void;
  onSheetChange: (sheetName: string) => void;
  onHeaderRowChange: (row: number) => void;
  onReDetectMapping: () => void;
  onMatchAllSuppliers: () => void;
  onParse: () => void;
  onClear: () => void;
  onMappingChange: (mapping: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  onMappingAutoLoadedClear: () => void;
  onMappingCollapsedChange: (v: boolean) => void;
  mappingCollapsed: boolean;
  onRemoveFile: () => void;
}

export function InputPanel({
  inputMode,
  onInputModeChange,
  inputText,
  onInputTextChange,
  excelFile,
  excelFileName,
  excelFileSize,
  excelSheetNames,
  selectedSheet,
  headerRow,
  excelPreview,
  columnMapping,
  mappingAutoLoaded,
  mappingAutoLoadedId,
  isLoading,
  parseResult,
  parsedOrdersCount,
  isMatchingSupplier,
  onTextParse,
  onExcelFileUpload,
  onSheetChange,
  onHeaderRowChange,
  onReDetectMapping,
  onMatchAllSuppliers,
  onParse,
  onClear,
  onMappingChange,
  onMappingAutoLoadedClear,
  onMappingCollapsedChange,
  mappingCollapsed,
  onRemoveFile,
}: InputPanelProps) {
  const handleMappingChange = (
    mappingOrUpdater: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)
  ) => {
    if (typeof mappingOrUpdater === 'function') {
      onMappingChange(mappingOrUpdater(columnMapping));
    } else {
      onMappingChange(mappingOrUpdater);
    }
  };

  return (
    <Card className="flex flex-col flex-1 min-h-0">
      <Tabs
        value={inputMode}
        onValueChange={(v) => onInputModeChange(v as 'text' | 'excel')}
        className="flex flex-col"
      >
        <CardHeader className="pb-2 shrink-0">
          <div className="flex items-center justify-between">
            <TabsList className="grid w-full max-w-[280px] grid-cols-2">
              <TabsTrigger value="text" className="gap-1">
                <Type className="h-4 w-4" />
                文本录入
              </TabsTrigger>
              <TabsTrigger value="excel" className="gap-1">
                <FileSpreadsheet className="h-4 w-4" />
                Excel导入
              </TabsTrigger>
            </TabsList>
          </div>
        </CardHeader>

        <CardContent className="pb-4 flex-1 flex flex-col min-h-0">
          {/* Text Input */}
          <TabsContent value="text" className="mt-0 flex flex-col">
            <TextInput
              value={inputText}
              onChange={onInputTextChange}
              onParse={onTextParse}
              onClear={onClear}
              isLoading={isLoading && inputMode === 'text'}
              disabled={false}
            />
          </TabsContent>

          {/* Excel Input */}
          <TabsContent value="excel" className="mt-0 flex-1 flex flex-col min-h-0">
            <ExcelUpload
              file={excelFile}
              fileName={excelFileName}
              fileSize={excelFileSize}
              sheetNames={excelSheetNames}
              selectedSheet={selectedSheet}
              headerRow={headerRow}
              preview={excelPreview}
              parsedOrdersCount={parsedOrdersCount}
              isMatchingSupplier={isMatchingSupplier}
              onFileUpload={onExcelFileUpload}
              onSheetChange={onSheetChange}
              onHeaderRowChange={onHeaderRowChange}
              onReDetect={onReDetectMapping}
              onMatchAllSuppliers={onMatchAllSuppliers}
              onRemoveFile={onRemoveFile}
            />

            {/* Auto-loaded mapping banner */}
            {mappingAutoLoaded && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg mb-2 shrink-0">
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
                <span className="text-sm text-green-800 flex-1">
                  已自动加载历史映射 (v{mappingAutoLoadedId})，
                  {Object.keys(columnMapping).filter(
                    (k) => columnMapping[k] && columnMapping[k] !== 'ignore'
                  ).length} 列已配置
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs shrink-0"
                  onClick={() => onMappingCollapsedChange(true)}
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  收起
                </Button>
              </div>
            )}

            {excelPreview.length > headerRow && (
              <ColumnMappingUI
                preview={excelPreview}
                headerRow={headerRow}
                columnMapping={columnMapping}
                collapsed={mappingCollapsed}
                onCollapsedChange={onMappingCollapsedChange}
                onMappingChange={handleMappingChange}
                onAutoLoadedClear={onMappingAutoLoadedClear}
              />
            )}
          </TabsContent>
        </CardContent>

        {/* Parse button */}
        <ParseButton
          inputMode={inputMode}
          isLoading={isLoading}
          hasText={!!inputText.trim()}
          hasExcelData={excelPreview.length >= 2}
          parseResult={parseResult}
          mappedColumnCount={Object.keys(columnMapping).filter(
            (k) => columnMapping[k] && columnMapping[k] !== 'ignore'
          ).length}
          textLength={inputText.length}
          onParse={onParse}
          onClear={onClear}
        />
      </Tabs>
    </Card>
  );
}

// Helper to remove file state (passed as null cast)
