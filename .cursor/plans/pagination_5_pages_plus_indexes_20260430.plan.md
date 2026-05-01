---
name: 5 pages server-side pagination + database indexes
overview: 为库存管理、SKU映射、回单管理、AI日志、发货方管理这5个高优先级页面实现服务器端分页功能，同时增加必要的数据库索引以提升查询性能。
todos:
  - id: stocks-api
    content: "库存管理: API增加 page/pageSize 分页参数"
    status: pending
  - id: stocks-ui
    content: "库存管理: 前端页面添加分页状态和UI"
    status: pending
  - id: sku-api
    content: "SKU映射: API增加 page/pageSize 分页参数"
    status: pending
  - id: sku-ui
    content: "SKU映射: 前端页面添加分页状态和UI"
    status: pending
  - id: receipt-api
    content: "回单管理: API增强返回 total/totalPages"
    status: pending
  - id: receipt-ui
    content: "回单管理: 前端页面添加分页状态和UI"
    status: pending
  - id: ailogs-api
    content: "AI日志: API改为 offset 分页"
    status: pending
  - id: ailogs-ui
    content: "AI日志: 前端页面添加分页状态和UI"
    status: pending
  - id: suppliers-api
    content: "发货方管理: API增加 page/pageSize 分页参数"
    status: pending
  - id: suppliers-ui
    content: "发货方管理: 前端页面添加分页状态和UI"
    status: pending
  - id: add-indexes
    content: "数据库索引: 在 data/schema.sql 中增加排序和过滤索引"
    status: pending
isProject: false
---

# 5个高优先级页面分页 + 数据库索引计划

## 一、分页改造

### 涉及文件概览

| 页面 | 前端文件 | API文件 | 分页情况 |
|------|---------|---------|---------|
| 库存管理 | `src/app/(app)/stocks/page.tsx` | `src/app/api/stocks/route.ts` | API无分页，需新增 |
| SKU映射 | `src/app/(app)/sku-mappings/page.tsx` | `src/app/api/product-mappings/route.ts` | API无分页，需新增 |
| 回单管理 | `src/app/(app)/return-receipt/page.tsx` | `src/app/api/return-receipts/history/route.ts` | API已有基础分页，需增强+前端UI |
| AI日志 | `src/app/(app)/ai-logs/page.tsx` | `src/app/api/ai-logs/route.ts` | API仅limit，需改为offset分页 |
| 发货方管理 | `src/app/(app)/suppliers-manage/page.tsx` | `src/app/api/shippers/route.ts` | API无分页，需新增 |

---

### 1. 库存管理 (stocks)

#### API: `src/app/api/stocks/route.ts`

- 新增 `page` 和 `pageSize` 查询参数（默认 page=1, pageSize=50）
- 计算 `offset = (page - 1) * pageSize`
- 将现有的 `.limit(1000)` 替换为 `.range(offset, offset + pageSize - 1)` + `{ count: 'exact' }`
- 返回结构增加: `total`, `page`, `pageSize`, `totalPages`

```typescript
// GET handler 中
const page = parseInt(searchParams.get('page') || '1');
const pageSize = parseInt(searchParams.get('pageSize') || '50');
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

// 将 .limit(1000) 改为
query = query.range(from, to);
const { data, count } = await query;
const total = count ?? 0;

return NextResponse.json({
  success: true,
  data,
  stats, // 保留现有 stats
  total,
  page,
  pageSize,
  totalPages: Math.ceil(total / pageSize),
});
```

#### 前端: `src/app/(app)/stocks/page.tsx`

- 新增状态: `currentPage`, `pageSize`, `totalCount`, `totalPages`
- 修改 `loadData()` 接受 `page` 参数，URL 拼接 `&page=${page}&pageSize=${pageSize}`
- `currentPage`/`pageSize`/`totalCount` 作为 useEffect 依赖项
- 移除 `filteredStocks` 的客户端过滤逻辑（改为 API 分页后直接用 `stocks`），`supplierFilter`/`searchTerm` 等过滤参数仍传给 API
- 移除底部 `共 {filteredStocks.length} 条库存记录`，改为分页条
- 添加分页UI（统一样式，见底部）

---

### 2. SKU映射 (sku-mappings)

#### API: `src/app/api/product-mappings/route.ts`

- 新增 `page`/`pageSize` 参数（默认 page=1, pageSize=50）
- 添加 `.range()` + `{ count: 'exact' }`
- 返回 `{ success, data, total, page, pageSize, totalPages }`

#### 前端: `src/app/(app)/sku-mappings/page.tsx`

- 新增分页状态
- `loadData(activeTab)` 增加 `page`/`pageSize` 参数
- 移除 `共 {filteredMappings.length} 条映射`，添加分页条
- 客户端过滤逻辑保留（基于 API 返回的当前页数据再做二次过滤）

---

### 3. 回单管理 (return-receipt)

#### API: `src/app/api/return-receipts/history/route.ts`

- 已有 `page`/`pageSize` 支持，确认 range + `{ count: 'exact' }` 存在
- 增强返回值: `{ success, data, total, page, pageSize, totalPages }`

#### 前端: `src/app/(app)/return-receipt/page.tsx`

- 新增分页状态
- `loadRecords(page, pageSize)` 
- 添加分页条 UI

---

### 4. AI日志 (ai-logs)

#### API: `src/app/api/ai-logs/route.ts`

- 移除 `limit` 单参数，改为 `page`/`pageSize`
- `offset = (page - 1) * pageSize`
- 使用 `.range(offset, offset + pageSize - 1)` + `{ count: 'exact' }`
- 返回 `{ success, data, total, page, pageSize, totalPages }`

#### 前端: `src/app/(app)/ai-logs/page.tsx`

- 新增分页状态
- 修改 `loadData()` 传递 `page`/`pageSize`
- 移除 `?limit=100` 拼接
- 添加分页条 UI

---

### 5. 发货方管理 (suppliers-manage)

#### API: `src/app/api/shippers/route.ts`

- 新增 `page`/`pageSize` 参数
- 添加 `.range()` + `{ count: 'exact' }`
- 返回 `{ success, data, total, page, pageSize, totalPages }`

#### 前端: `src/app/(app)/suppliers-manage/page.tsx`

- 新增分页状态
- 修改 `fetchShippers(page, pageSize)`
- 添加分页条 UI

---

### 统一分页UI样式

每个页面的分页条放在 `<Table>` 组件之后：

```tsx
<div className="flex items-center justify-between px-2 py-3 border-t">
  {/* 左侧：总数 */}
  <div className="text-sm text-muted-foreground">
    共 {totalCount} 条
  </div>

  {/* 中间：页码导航 */}
  <div className="flex items-center gap-1">
    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>首页</Button>
    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>上一页</Button>
    <span className="px-2 text-sm">第 {currentPage} / {totalPages} 页</span>
    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>下一页</Button>
    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>末页</Button>
  </div>

  {/* 右侧：每页条数 */}
  <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
    <SelectTrigger className="w-[100px] h-8 text-sm">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="20">20条/页</SelectItem>
      <SelectItem value="50">50条/页</SelectItem>
      <SelectItem value="100">100条/页</SelectItem>
    </SelectContent>
  </Select>
</div>
```

需要导入: `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` from `@/components/ui/select`

---

## 二、数据库索引

### 索引分析

现有索引已覆盖大部分主键和外键，但以下场景需要补充索引：

| 表名 | 字段 | 索引名 | 类型 | 用途 |
|------|------|--------|------|------|
| `stocks` | `warehouse_id` | `idx_stocks_warehouse` | B-tree | 按仓库过滤库存 |
| `stocks` | `updated_at DESC` | `idx_stocks_updated_at` | B-tree | 库存列表排序 |
| `product_mappings` | `supplier_id` | `idx_product_mappings_supplier` | B-tree | 按发货方过滤SKU映射 |
| `product_mappings` | `mapping_type` | `idx_product_mappings_type` | B-tree | 按映射类型过滤 |
| `product_mappings` | `product_id` | `idx_product_mappings_product` | B-tree | 按商品ID过滤 |
| `return_receipt_records` | `imported_at` | `idx_receipt_records_imported` | B-tree | 回单记录按导入时间排序/过滤 |
| `return_receipts` | `record_id` | `idx_return_receipts_record` | B-tree | 回单明细按记录ID关联 |
| `ai_logs` | `status` | `idx_ai_logs_status` | B-tree | 按状态过滤AI日志 |
| `ai_logs` | `(agent_code)` 已有 `idx_ai_logs_agent` | — | — | 已存在 |
| `shippers` | `type` | `idx_shippers_type` | B-tree | 按类型过滤发货方 |
| `shippers` | `is_active` | `idx_shippers_active` | B-tree | 只查启用状态发货方 |

### 索引DDL（追加到 `data/schema.sql`）

```sql
-- =====================================================
-- 分页优化索引
-- =====================================================

-- stocks 表: 仓库过滤 + 更新时间排序
CREATE INDEX IF NOT EXISTS idx_stocks_warehouse ON stocks(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stocks_updated_at ON stocks(updated_at DESC);

-- product_mappings 表: 按发货方/类型/商品过滤
CREATE INDEX IF NOT EXISTS idx_product_mappings_supplier ON product_mappings(supplier_id);
CREATE INDEX IF NOT EXISTS idx_product_mappings_type ON product_mappings(mapping_type);
CREATE INDEX IF NOT EXISTS idx_product_mappings_product ON product_mappings(product_id);

-- return_receipt_records 表: 按导入时间排序
CREATE INDEX IF NOT EXISTS idx_receipt_records_imported ON return_receipt_records(imported_at DESC);

-- return_receipts 表: 按 record_id 关联
CREATE INDEX IF NOT EXISTS idx_return_receipts_record ON return_receipts(record_id);

-- ai_logs 表: 按状态过滤
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON ai_logs(status);

-- shippers 表: 按类型/状态过滤
CREATE INDEX IF NOT EXISTS idx_shippers_type ON shippers(type);
CREATE INDEX IF NOT EXISTS idx_shippers_active ON shippers(is_active);
```

---

## 三、实施顺序

1. **添加数据库索引** (data/schema.sql) — 先加索引，部署时同步执行
2. **库存管理** — API + 前端
3. **SKU映射** — API + 前端
4. **回单管理** — API增强 + 前端
5. **AI日志** — API + 前端
6. **发货方管理** — API + 前端
7. **TypeScript 类型检查** — `corepack pnpm ts-check`
8. **提交 Git** — 分两个 commit（索引 + 分页功能）

---

## 四、验证方式

- 本地 `corepack pnpm ts-check` 通过
- 依次访问每个页面，确认分页条显示正确
- 切换页码和每页条数，验证数据正确更新
- 过滤器组合分页，确认数据一致
