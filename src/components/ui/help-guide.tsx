"use client";

import { useState } from "react";
import { HelpCircle, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface HelpGuideProps {
  /** 帮助文档标题 */
  title: string;
  /** 帮助文档内容 - ReactNode */
  children: React.ReactNode;
  /** 是否显示为简短模式（使用 Tooltip） */
  compact?: boolean;
  /** Tooltip 显示的简短提示 */
  tooltipText?: string;
  /** 自定义按钮样式 */
  className?: string;
  /** 是否在 Dialog 中显示文档链接按钮 */
  showDocLink?: boolean;
  /** 文档链接地址 */
  docUrl?: string;
}

export function HelpGuide({
  title,
  children,
  compact = false,
  tooltipText,
  className,
  showDocLink = true,
  docUrl,
}: HelpGuideProps) {
  const [open, setOpen] = useState(false);

  // 简短模式：使用 Tooltip 显示
  if (compact) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 w-8 p-0 text-muted-foreground hover:text-foreground", className)}
              onClick={() => setOpen(true)}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="sr-only">帮助</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{tooltipText || `查看${title}帮助`}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // 完整模式：使用 Dialog 显示
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-8 gap-1.5 text-muted-foreground hover:text-foreground", className)}
        >
          <HelpCircle className="h-4 w-4" />
          <span>帮助</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-background pb-4 border-b z-10">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="sr-only">
            {title}操作指引
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
          {children}
        </div>
        {showDocLink && docUrl && (
          <div className="mt-4 pt-4 border-t">
            <a
              href={docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              在新窗口中打开完整文档
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/**
 * 帮助内容分区组件 - 用于组织帮助文档结构
 */
interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function HelpSection({ title, children, className }: HelpSectionProps) {
  return (
    <div className={cn("mb-6", className)}>
      <h3 className="text-base font-semibold mb-2 text-foreground flex items-center gap-2">
        {title}
      </h3>
      <div className="text-sm text-muted-foreground space-y-2">
        {children}
      </div>
    </div>
  );
}

/**
 * 帮助内容中的步骤列表
 */
interface HelpStepsProps {
  steps: Array<{
    title: string;
    description?: string;
  }>;
}

export function HelpSteps({ steps }: HelpStepsProps) {
  return (
    <ol className="list-decimal list-inside space-y-2 ml-2">
      {steps.map((step, index) => (
        <li key={index} className="text-sm">
          <span className="font-medium text-foreground">{step.title}</span>
          {step.description && (
            <span className="text-muted-foreground"> - {step.description}</span>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * 帮助内容中的注意事项
 */
interface HelpNoteProps {
  type?: "info" | "warning" | "tip";
  children: React.ReactNode;
}

export function HelpNote({ type = "info", children }: HelpNoteProps) {
  const styles = {
    info: "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
    warning: "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200",
    tip: "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
  };

  return (
    <div
      className={cn(
        "px-3 py-2 rounded-md border text-sm",
        styles[type]
      )}
    >
      {children}
    </div>
  );
}

/**
 * 帮助内容中的快捷链接
 */
interface HelpLinksProps {
  links: Array<{
    label: string;
    href: string;
    description?: string;
  }>;
}

export function HelpLinks({ links }: HelpLinksProps) {
  return (
    <div className="grid gap-2">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="flex items-center justify-between p-2 rounded-md border hover:bg-muted/50 transition-colors"
        >
          <div>
            <div className="font-medium text-sm text-foreground">{link.label}</div>
            {link.description && (
              <div className="text-xs text-muted-foreground">{link.description}</div>
            )}
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      ))}
    </div>
  );
}
