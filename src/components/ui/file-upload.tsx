'use client';

import { useState, useCallback } from 'react';
import { Upload, X, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  accept?: string;
  onFileSelect: (file: File | null) => void;
  file?: File | null;
  className?: string;
}

export function FileUpload({ 
  accept = '.xlsx,.xls,.csv', 
  onFileSelect, 
  file,
  className 
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      onFileSelect(selectedFile);
    }
  };

  const handleRemove = () => {
    onFileSelect(null);
  };

  if (file) {
    return (
      <div className={cn(
        'flex items-center justify-between p-3 border rounded-lg bg-gray-50',
        className
      )}>
        <div className="flex items-center gap-3">
          <File className="h-5 w-5 text-blue-500" />
          <div>
            <p className="text-sm font-medium">{file.name}</p>
            <p className="text-xs text-gray-500">
              {(file.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-gray-500 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
        isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400',
        className
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-input')?.click()}
    >
      <input
        id="file-input"
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
      />
      <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p className="text-sm text-gray-600">
        拖拽文件到此处，或 <span className="text-blue-500">点击选择</span>
      </p>
      <p className="text-xs text-gray-400 mt-1">
        支持 {accept} 格式
      </p>
    </div>
  );
}
