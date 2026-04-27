'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Trash2, Loader2, ChevronDown, ChevronUp, Type } from 'lucide-react';

interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  onParse: () => void;
  onClear: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const PLACEHOLDER = `📋 参考案例1 - 京东/天猫订单格式：
订单号：JD20240315001
收货人：李四
电话：13912345678
地址：上海市浦东新区张江镇科苑路88号
商品：戴森吹风机 HD03 鎏金金 1台
备注：礼盒装

---
📋 参考案例2 - 微信聊天记录格式：
客户发来订单：
收件人：王五
手机号：13888888888
地址：北京市海淀区中关村大街1号
要的货：iPhone 15 Pro 256G 钛金属色 2台
急单，明天要！

---
📋 参考案例3 - Excel表格复制格式：
张三  13800001111  广州市天河区珠江新城花城大道68号  飞利浦电动牙刷HX9924 1套
李四  13900002222  深圳市南山区科技园南区深南大道9996号  小米手环8 NFC 3个

---
📋 参考案例4 - 聚水潭/管易订单格式：
渠道单号：JST20240315001
收件人：赵六
手机：13700003333
地址：杭州市西湖区文三路398号东信大厦
商品明细：
- SK-II神仙水230ml 1瓶
- 兰蔻小黑瓶精华50ml 2瓶`;

export function TextInput({ value, onChange, onParse, onClear, isLoading, disabled }: TextInputProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Collapsible Header */}
      <div className="flex items-center justify-between mb-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2 gap-1 text-xs"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronUp className="h-3 w-3" />
          )}
          文本录入 {collapsed ? '(点击展开)' : ''}
        </Button>
        {!collapsed && value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground"
            onClick={() => onChange('')}
          >
            <Trash2 className="h-3 w-3 mr-1" />
            清空
          </Button>
        )}
      </div>

      {/* Collapsible Content */}
      {collapsed ? (
        <div
          className="flex-1 min-h-[60px] border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => setCollapsed(false)}
        >
          <div className="text-center text-muted-foreground">
            <Type className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="text-xs">点击此处开始文本录入</p>
          </div>
        </div>
      ) : (
        <>
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={PLACEHOLDER}
            className="flex-1 min-h-[250px] font-mono text-sm resize-none"
            disabled={disabled}
          />
          <div className="flex gap-2 mt-2 shrink-0">
            <Button
              size="sm"
              onClick={onParse}
              disabled={!value || isLoading || disabled}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              AI解析
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              清空
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
