'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BusinessRulesPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">业务规则配置</h1>
        <p className="text-muted-foreground">配置当前租户的发货方匹配、导入映射、商品匹配等业务规则</p>
      </div>
      <Tabs defaultValue="match">
        <TabsList>
          <TabsTrigger value="match">发货方匹配</TabsTrigger>
          <TabsTrigger value="import">导入映射</TabsTrigger>
          <TabsTrigger value="product">商品匹配</TabsTrigger>
          <TabsTrigger value="receipt">回单匹配</TabsTrigger>
          <TabsTrigger value="cost">成本分摊</TabsTrigger>
        </TabsList>
        <TabsContent value="match" className="mt-4"><Card><CardHeader><CardTitle>发货方匹配配置</CardTitle><CardDescription>评分权重、省份邻近关系、偏远地区定义 — 待实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">此功能将在后续版本中实现</p></CardContent></Card></TabsContent>
        <TabsContent value="import" className="mt-4"><Card><CardHeader><CardTitle>导入映射配置</CardTitle><CardDescription>发货方类型、发货方式、结算方式映射 — 待实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">此功能将在后续版本中实现</p></CardContent></Card></TabsContent>
        <TabsContent value="product" className="mt-4"><Card><CardHeader><CardTitle>商品匹配配置</CardTitle><CardDescription>匹配优先级、各方式得分、最低阈值 — 待实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">此功能将在后续版本中实现</p></CardContent></Card></TabsContent>
        <TabsContent value="receipt" className="mt-4"><Card><CardHeader><CardTitle>回单匹配配置</CardTitle><CardDescription>匹配优先级、全局匹配开关、冲突策略 — 待实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">此功能将在后续版本中实现</p></CardContent></Card></TabsContent>
        <TabsContent value="cost" className="mt-4"><Card><CardHeader><CardTitle>成本分摊配置</CardTitle><CardDescription>分摊方式、运费/杂费分摊开关 — 待实现</CardDescription></CardHeader><CardContent><p className="text-muted-foreground">此功能将在后续版本中实现</p></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
