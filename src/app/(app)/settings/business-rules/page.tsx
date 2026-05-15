'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { buildUserInfoHeaders } from '@/lib/auth';
import { Loader2, Save } from 'lucide-react';
import { useCurrentTenantId } from '@/hooks/use-tenant';
import { COST_CONFIG_DEFAULTS } from '@/lib/config/cost-config';
import { RECEIPT_MATCH_DEFAULTS } from '@/lib/config/receipt-match-config';
import { MATCH_CONFIG } from '@/lib/config/match-config';
import { SUPPLIER_TYPE_OPTIONS, SEND_TYPE_OPTIONS, SETTLEMENT_TYPE_OPTIONS } from '@/lib/config';

export default function BusinessRulesPage() {
  const tenantId = useCurrentTenantId();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Cost allocation
  const [costAllocation, setCostAllocation] = useState(COST_CONFIG_DEFAULTS);

  // Receipt matching
  const [receiptMatch, setReceiptMatch] = useState(RECEIPT_MATCH_DEFAULTS);

  // Supplier matching
  const [matchWeights, setMatchWeights] = useState(MATCH_CONFIG.weights);
  const [remoteRegions, setRemoteRegions] = useState(MATCH_CONFIG.remoteRegions.join('\n'));
  const [scoreWeights, setScoreWeights] = useState({
    stockBonus: MATCH_CONFIG.weights.stockBonus,
    priceScoreMax: MATCH_CONFIG.weights.priceScoreMax,
    selfBonus: MATCH_CONFIG.weights.selfBonus,
  });

  // Import mapping
  const [supplierTypeMap, setSupplierTypeMap] = useState<Record<string, string>>({});
  const [sendTypeMap, setSendTypeMap] = useState<Record<string, string>>({});
  const [settlementTypeMap, setSettlementTypeMap] = useState<Record<string, string>>({});

  const loadConfig = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tenant-configs?tenantId=${tenantId}`, { headers: buildUserInfoHeaders() });
      const data = await res.json();
      if (data.success && data.data?.businessRules) {
        const rules = data.data.businessRules;
        if (rules.costAllocation) setCostAllocation(prev => ({ ...prev, ...rules.costAllocation }));
        if (rules.receiptMatch) setReceiptMatch(prev => ({ ...prev, ...rules.receiptMatch }));
        if (rules.matchWeights) {
          setMatchWeights(prev => ({
            ...prev,
            sameProvince: rules.matchWeights.sameProvince ?? prev.sameProvince,
            adjacentProvince: rules.matchWeights.adjacentProvince ?? prev.adjacentProvince,
            distantProvince: rules.matchWeights.distantProvince ?? prev.distantProvince,
            unknownProvince: rules.matchWeights.unknownProvince ?? prev.unknownProvince,
          }));
          setScoreWeights(prev => ({
            stockBonus: rules.matchWeights.stockBonus ?? prev.stockBonus,
            priceScoreMax: rules.matchWeights.priceScoreMax ?? prev.priceScoreMax,
            selfBonus: rules.matchWeights.selfBonus ?? prev.selfBonus,
          }));
        }
        if (rules.remoteRegions) setRemoteRegions(rules.remoteRegions);
        if (rules.supplierTypeMap) setSupplierTypeMap(rules.supplierTypeMap);
        if (rules.sendTypeMap) setSendTypeMap(rules.sendTypeMap);
        if (rules.settlementTypeMap) setSettlementTypeMap(rules.settlementTypeMap);
      }
    } catch { /* keep defaults */ }
    finally { setLoading(false); }
  }, [tenantId]);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  const saveAll = async () => {
    if (!tenantId) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tenant-configs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...buildUserInfoHeaders() },
        body: JSON.stringify({
          businessRules: {
            costAllocation,
            receiptMatch,
            matchWeights: { ...matchWeights, ...scoreWeights },
            remoteRegions,
            supplierTypeMap,
            sendTypeMap,
            settlementTypeMap,
          },
        }),
      });
      const data = await res.json();
      if (data.success) toast.success('已保存');
      else toast.error(data.error || '保存失败');
    } catch { toast.error('保存失败'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">业务规则配置</h1>
          <p className="text-muted-foreground">配置当前租户的业务规则，未配置时使用系统默认值</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          保存全部
        </Button>
      </div>

      <Tabs defaultValue="match">
        <TabsList>
          <TabsTrigger value="match">发货方匹配</TabsTrigger>
          <TabsTrigger value="score">综合得分</TabsTrigger>
          <TabsTrigger value="import">导入映射</TabsTrigger>
          <TabsTrigger value="receipt">回单匹配</TabsTrigger>
          <TabsTrigger value="cost">成本分摊</TabsTrigger>
        </TabsList>

        {/* 发货方匹配 */}
        <TabsContent value="match" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>评分权重</CardTitle><CardDescription>根据收货省份与发货方省份的距离关系评分</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {(['sameProvince', 'adjacentProvince', 'distantProvince', 'unknownProvince'] as const).map(key => (
                <div key={key} className="flex items-center gap-4">
                  <Label className="w-32 text-right text-sm">
                    {key === 'sameProvince' ? '同省得分' : key === 'adjacentProvince' ? '邻近省得分' : key === 'distantProvince' ? '较远省得分' : '未知省份得分'}
                  </Label>
                  <Input
                    type="number"
                    className="w-32"
                    value={matchWeights[key]}
                    onChange={e => setMatchWeights(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>偏远地区关键词</CardTitle><CardDescription>每行一个关键词，匹配到则降低评分</CardDescription></CardHeader>
            <CardContent>
              <textarea
                className="w-full h-32 font-mono text-sm border rounded p-3"
                value={remoteRegions}
                onChange={e => setRemoteRegions(e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 综合得分 */}
        <TabsContent value="score" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>综合得分规则</CardTitle>
              <CardDescription>发货方匹配时各评分项的加分值，设为 0 即禁用该项</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right text-sm">库存充足加分</Label>
                <Input
                  type="number"
                  className="w-32"
                  value={scoreWeights.stockBonus}
                  onChange={e => setScoreWeights(prev => ({ ...prev, stockBonus: Number(e.target.value) }))}
                />
                <span className="text-xs text-muted-foreground">库存 &gt; 需求数量时加分</span>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right text-sm">价格评分上限</Label>
                <Input
                  type="number"
                  className="w-32"
                  value={scoreWeights.priceScoreMax}
                  onChange={e => setScoreWeights(prev => ({ ...prev, priceScoreMax: Number(e.target.value) }))}
                />
                <span className="text-xs text-muted-foreground">max(0, 上限 − 单价÷10)</span>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-32 text-right text-sm">自有仓加分</Label>
                <Input
                  type="number"
                  className="w-32"
                  value={scoreWeights.selfBonus}
                  onChange={e => setScoreWeights(prev => ({ ...prev, selfBonus: Number(e.target.value) }))}
                />
                <span className="text-xs text-muted-foreground">发货方类型 = 自有仓时加分</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 导入映射 */}
        <TabsContent value="import" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>发货方类型映射</CardTitle><CardDescription>Excel 中的类型名 → 系统类型代码</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              {SUPPLIER_TYPE_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-4">
                  <Label className="w-24 text-right text-sm">{opt.label}</Label>
                  <Input
                    className="flex-1"
                    placeholder={`匹配关键词 (默认: ${opt.label})`}
                    value={supplierTypeMap[opt.value] || ''}
                    onChange={e => setSupplierTypeMap(prev => ({ ...prev, [opt.value]: e.target.value }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>发货方式映射</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {SEND_TYPE_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-4">
                  <Label className="w-24 text-right text-sm">{opt.label}</Label>
                  <Input
                    className="flex-1"
                    placeholder={`匹配关键词 (默认: ${opt.label})`}
                    value={sendTypeMap[opt.value] || ''}
                    onChange={e => setSendTypeMap(prev => ({ ...prev, [opt.value]: e.target.value }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>结算方式映射</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {SETTLEMENT_TYPE_OPTIONS.map(opt => (
                <div key={opt.value} className="flex items-center gap-4">
                  <Label className="w-24 text-right text-sm">{opt.label}</Label>
                  <Input
                    className="flex-1"
                    placeholder={`匹配关键词 (默认: ${opt.label})`}
                    value={settlementTypeMap[opt.value] || ''}
                    onChange={e => setSettlementTypeMap(prev => ({ ...prev, [opt.value]: e.target.value }))}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 回单匹配 */}
        <TabsContent value="receipt" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>匹配优先级</CardTitle><CardDescription>从上到下优先级递减（拖拽排序将在后续版本支持）</CardDescription></CardHeader>
            <CardContent>
              <div className="space-y-2">
                {receiptMatch.priority.map((p, i) => (
                  <div key={p} className="flex items-center gap-3 border rounded p-3">
                    <span className="text-muted-foreground text-sm w-6">#{i + 1}</span>
                    <span className="text-sm">
                      {p === 'tracking_no' ? '系统订单号精确匹配' : p === 'order_no_phone' ? '订单号+手机号' : p === 'order_no_name' ? '订单号+收货人' : '手机号+商品名'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>冲突策略</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={receiptMatch.globalMatch} onCheckedChange={v => setReceiptMatch(prev => ({ ...prev, globalMatch: v }))} />
                  <Label>启用总库匹配（跨租户）</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Label className="w-24">冲突策略</Label>
                <Select value={receiptMatch.conflictStrategy} onValueChange={v => setReceiptMatch(prev => ({ ...prev, conflictStrategy: v as 'manual_review' | 'auto_latest' | 'auto_first' }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual_review">人工复核</SelectItem>
                    <SelectItem value="auto_latest">自动取最新</SelectItem>
                    <SelectItem value="auto_first">自动取第一条</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 成本分摊 */}
        <TabsContent value="cost" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>成本分摊规则</CardTitle><CardDescription>历史成本库费用录入的分摊逻辑</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Label className="w-24">分摊方式</Label>
                <Select value={costAllocation.allocationMethod} onValueChange={v => setCostAllocation(prev => ({ ...prev, allocationMethod: v as 'by_amount' | 'by_quantity' | 'by_weight' }))}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="by_amount">按金额占比</SelectItem>
                    <SelectItem value="by_quantity">按数量均摊</SelectItem>
                    <SelectItem value="by_weight">按重量均摊</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={costAllocation.allocateFreight} onCheckedChange={v => setCostAllocation(prev => ({ ...prev, allocateFreight: v }))} />
                  <Label>运费分摊</Label>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch checked={costAllocation.allocateMiscFees} onCheckedChange={v => setCostAllocation(prev => ({ ...prev, allocateMiscFees: v }))} />
                  <Label>杂费分摊</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
