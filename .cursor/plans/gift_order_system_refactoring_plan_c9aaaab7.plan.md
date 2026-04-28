---
name: Gift Order System Refactoring Plan
overview: 完整重构礼品订单管理系统：拆分臃肿文件、合并重复代码、清理废弃模块、修复类型系统，建立清晰的分层架构。每步不超过 2 个关注点，逐步验证后进入下一步。
todos:
  - id: p0-cleanup
    content: "Phase 0: 安全清理 — 删除 3 个废弃文件（relations.ts, mock.ts, AGENTS.md.bak），验证 ts-check 通过"
    status: completed
  - id: p1-bugfix
    content: "Phase 1: 修复 2 个破坏性 Bug — order-cost-history import + order-parse 调试代码，验证 ts-check 通过"
    status: completed
  - id: p2-dedup1
    content: "Phase 2a: 合并 extractAddressParts — 2 处 → 1 处，验证 check:api-contracts 通过"
    status: completed
  - id: p2-dedup2
    content: "Phase 2b: 合并 normalizeHeaders + column-mapping 碎片模块，验证 check:api-contracts 通过"
    status: completed
  - id: p2-dedup3
    content: "Phase 2c: 统一 Permission 类型 + SupplierMatchOption 类型，验证 ts-check 通过"
    status: completed
  - id: p3-split
    content: "Phase 3: 拆分 order-parse/page.tsx — 3553 行拆为 5 个组件，建立基线后逐步拆分"
    status: completed
  - id: p4-deprecate
    content: "Phase 4: 清理废弃模块 — shippers/suppliers 评估，冗余 schema 标注"
    status: completed
  - id: p5-ui-cleanup
    content: "Phase 5: 删除未使用的 UI 组件 — 7 个从未被 import 的组件"
    status: completed
  - id: p6-scaffold
    content: "Phase 6: 建立共享基础设施 — common types + 评估是否需要 DataTable/FormDialog"
    status: completed
  - id: p7-final-test
    content: "Phase 7: 完整测试 — check:unattended-acceptance + Playwright E2E，与基线对比"
    status: completed
isProject: false
---

# 礼品订单管理系统 — 系统梳理重构计划

## 背景

用户感觉系统臃肿：部分 AI 代码无效但影响运行，模块可解构但未解构，重复功能未重用，框架混乱。

本计划按 `AGENTS.md` 规范执行：
- **规范 4**：每次不超过 2 个关注点
- **规范 9**：逐步骤验证，不积累
- **规范 11**：优先补丁修复，不做大幅重构
- **规范 2**：证据先于论断，验证命令必须提供

---

## 问题清单

| 类别 | 问题 | 文件 | 严重度 |
|------|------|------|--------|
| 编译错误 | `import type` 用于普通函数 | `src/lib/order-cost-history.ts:1` | 🔴 编译失败 |
| 调试代码 | 生产代码中残留 console 调试 | `src/app/(app)/order-parse/page.tsx:6-16` | 🟡 遗留 |
| 重复代码 | `extractAddressParts` 在 2 处实现 | 见下表 | 🟡 中等 |
| 重复代码 | `normalizeHeaders` 在 2 处实现 | 见下表 | 🟡 中等 |
| 碎片化 | 列映射逻辑分散在 4 个文件 | 见下表 | 🟡 中等 |
| 类型重复 | `Permission` 在 2 处定义 | 见下表 | 🟡 中等 |
| 类型重复 | `SupplierMatchOption` 在 2 处定义 | 见下表 | 🟡 中等 |
| 臃肿文件 | `order-parse/page.tsx` 3553 行 | 单文件 | 🔴 严重 |
| 废弃文件 | `relations.ts` 3 行空文件 | `src/storage/.../relations.ts` | 🟢 低 |
| 废弃文件 | `mock.ts` 用旧数据模型 | `src/data/mock.ts` | 🟢 低 |
| 废弃文件 | `AGENTS.md.bak` 备份 | 项目根目录 | 🟢 低 |
| 废弃文件 | `docs/mdbak/` 旧文档 | `docs/mdbak/` | 🟢 低 |
| 未用 UI | 7 个组件从未被 import | `src/components/ui/` | 🟢 低 |

---

## 执行计划

### Phase 0：安全清理（不影响任何功能）

**关注点 1**：删除 3 个废弃文件

```
待删除文件：
1. src/storage/database/shared/relations.ts     — 3 行空文件，import {} from "./schema" 无效
2. src/data/mock.ts                            — 使用旧数据模型（SUP-001 等），已无引用
3. AGENTS.md.bak                               — 过时的备份文件

验证方法：
grep -r "from.*mock" src/ --include="*.ts" --include="*.tsx"
# 预期结果：无引用
grep -r "relations" src/storage/ --include="*.ts"
# 预期结果：无引用（除了 relations.ts 本身）
```

**执行后验证**：
```bash
corepack pnpm ts-check
# 预期：全部通过，无新增错误
```

---

### Phase 1：修复 2 个破坏性 Bug

**关注点 1**：修复 `src/lib/order-cost-history.ts` 第 1 行

```typescript
// 错误
import type { getSupabaseClient } from "@/storage/database/supabase-client";

// 正确
import { getSupabaseClient } from "@/storage/database/supabase-client";
```

`import type` 只能用于类型导入，`getSupabaseClient` 是普通函数，编译时报错。

**关注点 2**：清理 `src/app/(app)/order-parse/page.tsx` 顶部调试代码（第 6-16 行）

```typescript
// 待删除代码块
if (typeof window !== 'undefined') {
  const count = (window as unknown as { __pageLoadCount?: number }).__pageLoadCount || 0;
  (window as unknown as { __pageLoadCount: number }).__pageLoadCount = count + 1;
  console.log('[DEBUG] 页面加载次数:', ...);
  window.addEventListener('beforeunload', () => {
    console.log('[DEBUG] 页面即将卸载 (beforeunload)');
  });
}
```

**执行后验证**：
```bash
corepack pnpm ts-check 2>&1 | head -50
# 预期：order-cost-history.ts 的编译错误消失
corepack pnpm check:api-contracts
# 预期：全部通过（验证删除调试代码未破坏 API）
```

---

### Phase 2a：合并重复代码 — `extractAddressParts`

**关注点 1**：`extractAddressParts` 在 2 处实现

| 文件 | 行 | 用途 |
|------|----|------|
| `src/lib/column-mapping-rules.ts` | 299 | 列映射中使用 |
| `src/app/api/order-parse/excel/route.ts` | 46 | Excel 解析 API 中使用 |

**操作**：
1. 确认两个实现逻辑完全等价
2. `src/app/api/order-parse/excel/route.ts` 改为从 `column-mapping-rules.ts` 导入
3. 删除 `route.ts` 中的本地副本

**执行后验证**：
```bash
corepack pnpm check:api-contracts 2>&1 | grep -E "(FAIL|PASS|order-parse)"
# 预期：order-parse 相关用例全部通过
```

---

### Phase 2b：合并重复代码 — `normalizeHeaders` + 列映射碎片模块

**关注点 1**：`normalizeHeaders` 在 2 处实现

| 文件 | 函数名 | 行 |
|------|--------|-----|
| `src/lib/column-mapping-rules.ts` | `normalizeHeadersForCompare` | 320 |
| `src/lib/column-mapping-metadata.ts` | `normalizeHeaders` | 4 |

两个函数功能相同（trim + filter），统一为 `normalizeHeaders`。

**关注点 2**：列映射逻辑分散在 4 个文件

```
src/lib/column-mapping-rules.ts      (329 行) — 保留
src/lib/column-mapping-metadata.ts   (42 行)  — 合并入 rules
src/lib/column-mapping-diagnostics.ts (57 行)  — 合并入 rules
src/lib/order-parse-excel.ts         (29 行)  — 保留（行级别不同）
```

**操作**：
1. `normalizeHeaders` 统一为 `normalizeHeadersForCompare`（保留功能更全的版本）
2. `column-mapping-metadata.ts` 中的函数合并入 `column-mapping-rules.ts`
3. `column-mapping-diagnostics.ts` 中的函数合并入 `column-mapping-rules.ts`
4. 所有 `import` 来源更新
5. 删除已合并的文件

**验证方法**：
```bash
# 确认无残留 import
grep -r "from.*column-mapping-metadata\|from.*column-mapping-diagnostics" src/
# 预期：无结果

corepack pnpm check:api-contracts
# 预期：全部通过
```

---

### Phase 2c：统一类型定义

**关注点 1**：统一 `Permission` 类型

| 文件 | 行 | 当前方式 |
|------|----|---------|
| `src/lib/permissions.ts` | 64 | 从 `PERMISSIONS` 常量派生（正确） |
| `src/lib/auth.tsx` | 169 | 硬编码字符串字面量（重复） |

**操作**：`src/lib/auth.tsx` 删除自己的 `Permission` 类型，改为 `import type { Permission } from "@/lib/permissions"`。

**关注点 2**：统一 `SupplierMatchOption` 类型

| 文件 | 类型名 |
|------|--------|
| `src/types/order-parse.ts` | `SupplierMatchOption` |
| `src/app/(app)/order-parse/hooks/use-order-parse-session.ts` | `SupplierMatchResultItem` |

**操作**：`use-order-parse-session.ts` 改为从 `@/types/order-parse` 导入，删除本地 `SupplierMatchResultItem`。

**验证方法**：
```bash
corepack pnpm ts-check 2>&1 | grep -E "(error|FAIL)"
# 预期：无新增类型错误
corepack pnpm lint
# 预期：全部通过
```

---

### Phase 3：拆分 `order-parse/page.tsx`（3553 行）

**这是最高风险步骤，需要先建立基线。**

**前置条件**：
1. Phase 0-2c 全部验证通过
2. 运行 `corepack pnpm check:unattended-acceptance` 获取基线通过率

**关注点 1**：建立基线

```bash
corepack pnpm check:unattended-acceptance 2>&1 | tee /tmp/baseline-run.txt
# 记录通过率 / 通过数量
```

**关注点 2**：拆分策略

```
当前: src/app/(app)/order-parse/page.tsx (3553 行)
目标: 拆为 5 个独立组件，每个 ~500-700 行

拆分顺序（每步拆分后立即验证）：
Step 3.1: 提取 OrderInputPanel   (客户选择 + Excel 上传, ~500 行)
Step 3.2: 提取 OrderMappingPanel (列映射面板, ~600 行)
Step 3.3: 提取 OrderPreviewPanel (商品预览 + 发货方选择, ~500 行)
Step 3.4: 提取 OrderSubmitSection (派发模式 + 提交, ~300 行)
Step 3.5: page.tsx 精简为入口 + 标签页 + Alert 编排 (~300 行)
```

**关键约束**：所有已存在的 hooks（`use-order-parse-session.ts` 等）保持原接口不变，仅做内部重构。

**每步验证**：
```bash
# 每次拆分后运行
corepack pnpm ts-check
corepack pnpm check:api-contracts
corepack pnpm check:business-smoke

# 与基线对比
# 通过率不应下降
```

---

### Phase 4：治理废弃模块

**前置条件**：Phase 3 完成且验证通过

**关注点 1**：评估 `shippers` vs `suppliers`

```
src/app/api/suppliers/route.ts   (133 行) — 评估是否被使用
src/app/(app)/suppliers-manage/page.tsx — 检查实际查询的是哪个表
```

**操作**：确认后决定保留哪个 API（根据 `CLAUDE.md` 应保留 `shippers`）。

**关注点 2**：标注冗余 schema

```
supabase/migrations/001_schema.sql           (849 行) — 评估是否仍在使用
supabase/migrations/012_consolidated_init.sql (1031 行) — 重构后版本
```

**操作**：在 `001_schema.sql` 顶部加上注释标注已被 `012` 取代，不修改内容。

**验证方法**：
```bash
corepack pnpm check:api-contracts 2>&1 | tail -10
# 预期：全部通过
```

---

### Phase 5：删除未使用的 UI 组件

**前置条件**：Phase 1-4 完成

**关注点 1**：验证 + 删除 7 个未用组件

| 组件 | 风险 |
|------|------|
| `src/components/ui/aspect-ratio.tsx` | 低 — 无引用 |
| `src/components/ui/hover-card.tsx` | 低 — 无引用 |
| `src/components/ui/input-group.tsx` | 低 — 无引用 |
| `src/components/ui/carousel.tsx` | 中 — 241 行，需确认 |
| `src/components/ui/slider.tsx` | 低 — 无引用 |
| `src/components/ui/input-otp.tsx` | 低 — 无引用 |
| `src/components/ui/toggle-group.tsx` | 低 — 无引用 |

**验证**：
```bash
# 每个组件单独验证
grep -r "aspect-ratio\|HoverCard\|InputGroup\|Carousel\|Slider\|InputOTP\|ToggleGroup" src/ --include="*.tsx"
# 预期：无 import 引用
```

**删除后验证**：
```bash
corepack pnpm ts-check
corepack pnpm check:api-contracts
```

---

### Phase 6：建立共享类型基础设施

**前置条件**：Phase 2c 完成（类型已统一）

**关注点 1**：建立 `src/types/common.ts`

```typescript
// 新建 src/types/common.ts
// 存放跨模块共享类型，避免未来再次出现重复定义
export type PaginationParams = { page: number; pageSize: number };
export type ApiResponse<T> = { data: T; error: string | null };
export type DataScope = "all" | "department" | "self";
```

**关注点 2**：评估是否需要 `DataTable`/`FormDialog` 共享组件

当前 10+ 管理页面各自实现了相同的 CRUD 模式。如果用户确认需要，再执行此步骤；否则跳过。

---

### Phase 7：完整功能测试

**前置条件**：Phase 0-6 全部完成

**关注点 1**：运行完整无人值守验收 + Playwright E2E 测试

所有 Phase 完成后，执行完整的回归验证：

```bash
# 1. TypeScript 编译检查
corepack pnpm ts-check

# 2. ESLint 检查
corepack pnpm lint

# 3. API 集成回归测试
corepack pnpm check:api-contracts

# 4. 权限回归测试
corepack pnpm check:permissions

# 5. 业务冒烟测试
corepack pnpm check:business-smoke

# 6. 全量无人值守验收（汇总报告）
corepack pnpm check:unattended-acceptance

# 7. Playwright E2E 功能测试
cd tests && corepack pnpm exec playwright test
```

**关注点 2**：记录测试结果

与 Phase 3 建立的基线对比，记录：
- `pnpm check:unattended-acceptance` 通过率是否下降
- Playwright E2E 是否有新增失败用例
- 整体系统健康度评分

**E2E 测试覆盖范围**（`tests/e2e/full-flow.spec.ts` 应覆盖）：
1. 登录 → 仪表盘
2. 订单录入（Excel 导入 + 列映射 + 提交）
3. 订单派发（派发 + 库存扣减）
4. 物流回单（回单导入 + 匹配确认）
5. 导出记录（发货通知单导出 + 下载）
6. 预警中心（预警规则触发 + 记录处理）
7. 各管理模块 CRUD（客户/商品/库存/发货方）
8. 权限控制（不同角色访问限制）

---

### Phase 7（最终测试）

**Phase 7 要求**：

```bash
# 完整测试序列
corepack pnpm ts-check
corepack pnpm lint
corepack pnpm check:api-contracts
corepack pnpm check:permissions
corepack pnpm check:business-smoke
corepack pnpm check:unattended-acceptance
cd tests && corepack pnpm exec playwright test
```

Playwright E2E 覆盖范围（`tests/e2e/full-flow.spec.ts`）：
1. 登录 → 仪表盘
2. 订单录入（Excel 导入 + 列映射 + 提交）
3. 订单派发（派发 + 库存扣减）
4. 物流回单（回单导入 + 匹配确认）
5. 导出记录（发货通知单导出 + 下载）
6. 预警中心（预警规则触发 + 记录处理）
7. 各管理模块 CRUD（客户/商品/库存/发货方）
8. 权限控制（不同角色访问限制）

**最终交付门槛**：
- `ts-check`：0 个错误
- `lint`：0 个警告/错误
- `check:api-contracts`：全部通过
- `check:permissions`：全部通过
- `check:business-smoke`：全部通过
- `check:unattended-acceptance`：与基线对比无退化
- `playwright test`：所有 spec 全部通过

---

## 验证命令汇总

| Phase | 验证命令 |
|-------|---------|
| Phase 0 | `pnpm ts-check` |
| Phase 1 | `pnpm ts-check && pnpm check:api-contracts` |
| Phase 2a-c | `pnpm check:api-contracts` |
| Phase 3 | `pnpm check:unattended-acceptance` (与基线对比) |
| Phase 4 | `pnpm check:api-contracts` |
| Phase 5 | `pnpm ts-check && pnpm check:api-contracts` |
| Phase 6 | `pnpm ts-check && pnpm check:api-contracts` |
| Phase 7 | `pnpm ts-check && pnpm lint && pnpm check:unattended-acceptance && pnpm exec playwright test` |

**Phase 7 测试要求（最终交付门槛）**：

| 测试类型 | 要求 |
|---------|------|
| `ts-check` | 0 个错误 |
| `lint` | 0 个警告/错误 |
| `check:api-contracts` | 全部通过 |
| `check:permissions` | 全部通过 |
| `check:business-smoke` | 全部通过 |
| `check:unattended-acceptance` | 与基线对比无退化 |
| `playwright test` | 所有 spec 全部通过 |
