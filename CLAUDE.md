# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 完整的 AI Agent 知识库见 `AGENTS.md`（模块交互、数据字典、状态流转、异常处理等）。

## 常用命令

```bash
corepack pnpm install          # 安装依赖（必须用 pnpm）
corepack pnpm dev              # 开发服务器
corepack pnpm build            # 生产构建
corepack pnpm start            # 生产启动
corepack pnpm ts-check         # TypeScript 类型检查
corepack pnpm lint             # ESLint 检查

# 无人值守验收（全量回归总入口）
corepack pnpm check:unattended-acceptance

# 核心 API 集成回归
corepack pnpm check:api-contracts

# 权限 401/403 回归
corepack pnpm check:permissions

# 关键业务冒烟
corepack pnpm check:business-smoke

# 各类 fixture 契约测试
corepack pnpm fixtures:export-results
corepack pnpm fixtures:export-interactions
corepack pnpm fixtures:order-parse
```

## 技术栈

Next.js 16 (App Router) + React 19 + TypeScript 5 + shadcn/ui (Radix UI) + Tailwind CSS 4 + Supabase PostgreSQL

## 模块总览

| 模块 | 路径 | 优先级 | 核心功能 |
|------|------|--------|----------|
| 首页 | `/` | P0 | 数据概览、快捷入口 |
| 订单中心 | `/orders` | P0 | 订单列表、状态管理、批量派发 |
| 订单录入 | `/order-parse` | P0 | Excel 导入、表头解析、列映射、商品/发货方匹配 |
| 库存管理 | `/stocks` | P0 | 库存查询、版本历史、价格历史、批量导入 |
| 发货通知单 | `/shipping-export` | P1 | 按发货方导出派发单（三种模式） |
| 物流回单 | `/return-receipt` | P1 | 回单导入、自动匹配、冲突处理 |
| 客户反馈导出 | `/feedback-export` | P1 | 导出已回单订单给客户、二次导出历史 |
| 导出记录 | `/export-records` | P1 | 导出历史、明细重生成、下载 |
| 历史成本库 | `/order-cost-history` | P1 | 成本记录、费用录入（分摊） |
| 预警中心 | `/alerts` | P1 | 预警规则、记录处理、三阶段执行器 |
| 客户管理 | `/customers` | P1 | 客户档案、业务员/跟单员分配、批量交接 |
| 发货方管理 | `/suppliers-manage` | P1 | 发货方档案、仓库/京东/拼多多渠道 |
| 商品管理 | `/products` | P1 | 商品档案、品牌分类 |
| SKU映射 | `/sku-mappings` | P1 | 映射关系管理（含发货方商品编码 Tab） |
| 数据报表 | `/reports` | P1 | 订单统计、销售业绩、发货方分析、回单时效 |
| 档案概览 | `/archive` | P1 | 档案总览 |
| 用户管理 | `/users` | P2 | 用户列表、角色分配 |
| 角色管理 | `/roles` | P2 | 角色配置、权限分配 |

## 架构要点

### 订单核心设计

- **`orders.items` 是 JSONB 数组**，直接包含商品明细，不存在独立的 `order_items` 表
- **`supplier_id` 类型是 `VARCHAR(36)`**，不是 UUID — 但其他外键通常是 UUID
- 订单号有两条：`order_no`（客户原始订单号，可能重复）和 `sys_order_no`（系统唯一，格式 `SYS-YYYYMMDD-XXXX-TIMESTAMP`）
- 状态流转：`pending → assigned → partial_returned/returned → feedbacked → completed`，以及 `cancelled`
- `feedbacked` 是独立状态，表示已反馈客户但尚未最终归档

### 派发机制

三种派发模式（`dispatchMode`）：
- `preview` — 纯预览，无副作用
- `dispatch_only` — 派发 + 扣减库存 + 写入派发记录和成本记录
- `dispatch_with_persistence` — 上述一切 + 写入导出记录 + 文件持久化（local/S3）

派发是**幂等**的：同一订单重复派发时复用既有 `dispatch_records`，不重复扣减库存。派发时将发货方商品编码**快照**写入 `orders.items` 和 `dispatch_records.items`，后续导出不再查询 `product_mappings`。

### 数据源约定

- **`shippers` 表是发货方数据的唯一来源**，已废弃独立的 `suppliers` 表。所有 API 统一使用 shippers
- **客户表有新旧字段兼容**：`src/lib/customer-schema.ts` 在运行时探测实际字段，自动选择 `contact_person`（新）或 `contact`（旧）
- **`product_mappings.id` 是 VARCHAR 类型**（非 UUID），用于兼容客户自定义编码

### 权限体系

四层权限守卫：菜单（Sidebar 过滤） → 页面（`PageGuard` 组件） → 按钮（`disabled`/降级） → API（`src/lib/server-auth.ts`）

前端通过 `x-user-info` 请求头传递用户信息，由 `src/lib/client-auth.ts` 的 `buildUserInfoHeaders()` 构建。数据权限范围：`all` / `department` / `self`。

### 列映射与客户列名还原

客户导入 Excel 时，表头指纹（SHA256 前 16 位）存入 `column_mappings.header_fingerprint`，下次导入同一客户同类表格时自动加载历史映射。`feedback_export_headers` 存储"客户列名 → 系统字段名"的映射，客户反馈导出时按原始列名还原，物流信息由系统追加。

### 商品匹配优先级

编码匹配 > 条码匹配 > 规格匹配 > 名称匹配

### 回单匹配优先级（4 级）

1. 快递单号精确匹配
2. 订单号 + 收货人手机号
3. 订单号 + 收货人姓名
4. 收货人手机号 + 商品名称

匹配结果：`auto_matched` | `conflict`（多候选→复核池） | `manual_matched` | `unmatched`

### 预警执行器

`src/lib/alert-executor.ts` 统一三阶段：新增（满足条件 + 无未处理预警）→ 复用（满足条件 + 已有未处理预警，跳过）→ 自动关闭（不满足条件 + 有未处理预警，自动标记 resolved）。三类规则：`low_stock`、`order_timeout`、`return_delay`。

### 历史成本库生命周期

派发（写入 unit_cost/total_cost） → 回单（补全 express_company/tracking_no） → 费用录入（补充分摊运费/杂费）。运费按各商品行成本占比分摊到各行，不是整单费用复制。

### API-Schema 对齐原则

以 API 代码为事实来源（source of truth），数据库 schema 跟随 API 实际使用的字段名。迁移文件在 `supabase/migrations/`，按序号执行，不使用 ORM 迁移。

### 字段命名规范

表名 snake_case 复数 | 主键 `id`（uuid） | 外键 `{table}_id` | 时间字段 `{action}_at` | 布尔 `is_`/`can_` 前缀

## 开发约定

- **包管理器**：必须用 pnpm（>=9.0.0），`preinstall` 脚本会拒绝 npm/yarn
- **导入别名**：`@/` 映射到 `src/`
- **组件优先使用 shadcn/ui**（`src/components/ui/`），不要从零写基础组件
- **数据库操作**：通过 Supabase 客户端（`src/storage/database/supabase-client.ts`），不直接使用 `pg`
- **类型**：订单相关类型在 `src/types/order.ts`，解析类型在 `src/types/order-parse.ts`
- **校验脚本**：所有 `scripts/validate-*.ts` 脚本通过 `tsx` 或 `node --import tsx` 运行，启动开发服务器后直接对本地 API 发 HTTP 请求
- **`src/server.ts`** 是自定义服务器入口（Next.js 通过它启动）

## 重要提醒

- `orders.items` 是 JSONB，不要创建 `order_items` 表
- `orders.supplier_id` 是 VARCHAR(36)，不是 UUID — JOIN 时注意类型
- `product_mappings.id` 是 VARCHAR，不是 UUID
- 发货方数据只用 `shippers` 表，不要用已废弃的 `suppliers` 表
- 派发时商品编码已快照，导出时不要跨表查询 `product_mappings`
- 客户反馈导出必须还原客户原始列名，物流信息由系统追加
- 编辑 `supabase/migrations/` 中已有迁移文件时需格外谨慎（可能影响生产数据）

---

## AI Agent 开发规范

以下规范来自 `AGENTS.md`，强制执行。

### 1. 基本纪律

1. **先读后改** — 编辑文件前必须用 Read 工具读取完整内容，不得在未阅读的情况下直接修改。
2. **证据先于论断** — 声明"修复成功""功能正常""测试通过"必须附验证命令的实际输出。禁止"应该可以""看起来没问题"。
3. **无人值守验收优先** — 完成后运行 `pnpm check:unattended-acceptance`，所有 check:* 脚本通过方可声明完成。
4. **仅改需要的** — 禁止修复 Bug 时顺便重构无关代码，同一提交不超过 2 个关注点。
5. **破坏性操作需确认** — `rm`、`DROP TABLE`、强制覆盖等必须先告知后果。
6. **不擅自推送** — `git push` 需用户明确要求，禁止 `--force`。
7. **变更同步文档** — 功能/数据结构/API 变化时同步更新 `docs/Product/` 下文档（详见下方文档同步规范）。

### 2. 文档同步规范（强制执行）

系统功能、字段、API 有调整时，必须同步更新 `docs/Product/` 下对应文档，并在文档内记录版本变更。

**文档与代码的对应关系：**

| 文档 | 对应变更类型 |
|------|------------|
| `数据字典.md` | 新增/修改/删除数据表字段、索引、约束、枚举值 |
| `模块功能说明.md` | 新增/修改/删除功能模块、字段映射规则、业务逻辑 |
| `模块交互说明.md` | 模块间 API 调用变更、交互流程变化、数据流向变更 |

**文档版本记录规范（每篇文档必须包含）：**

```markdown
# 礼品订单管理系统 — 数据字典

> 本文档记录系统所有数据表的完整字段定义。
> 版本：v1.3 | 更新日期：2026-04-27 | 更新内容：新增 orders 表 remark_v2 字段
> 版本：v1.2 | 更新日期：2026-04-20 | 更新内容：新增 alert_rules 预警规则表
> 版本：v1.1 | 更新日期：2026-04-15 | 更新内容：orders 表新增 source_channel 字段
> 版本：v1.0 | 更新日期：2026-04-10 | 初始版本
```

**版本记录规则：**

- 每次对文档覆盖的内容有变更时，在文档顶部追加一条版本记录
- 格式：`版本 | 日期 | 变更内容`，按日期倒序排列（最新在前）
- 版本号按语义化版本：`v主.次.修订`，仅字段增删用修订号，接口级变更用次版本号
- `变更内容` 描述：**谁** 在 **哪个模块** 做了 **什么改动**，影响 **哪些字段/接口**

**变更描述规范：**

- ✅ `v1.3 | 2026-04-27 | 新增 orders.remark_v2 字段（备注视名），用于发货通知单导出时展示客户备注；同步更新发货通知单导出模块功能说明`
- ✅ `v1.2 | 2026-04-20 | 新增 alert_rules / alert_records 表及三阶段执行器，支持库存不足、待派发超时、回单超时三类预警规则`
- ❌ `更新了文档`
- ❌ `orders 表加了字段`

**禁止行为：**

- ❌ 修改了表字段但 `数据字典.md` 未更新
- ❌ 新增了 API 但 `模块交互说明.md` 未更新
- ❌ 版本记录只写"更新"而不描述具体变更内容
- ❌ 删除了功能但文档未做标注（用删除线标注，不要直接删除历史记录）

### 3. 系统性调试（遇到 Bug 必须遵循）

**铁律：未定位根因，不得修复。**

四阶段顺序执行，不得跳过：

1. **根因调查** — 完整阅读错误信息，重现问题，检查最近变更（`git diff`）
2. **模式分析** — 找到同模块正常工作的代码，对比差异
3. **形成假设** — 明确"我认为 X 是根因"，最小化修改验证
4. **实施修复** — 一次只改一个变量

**停止线**：同一 Bug 尝试 3 次修复均失败 → 停止，质疑架构设计，向用户报告。

### 4. 多步骤任务规划

涉及 2 个以上文件或多个步骤的任务：

1. **先写计划** — 明确每个步骤改哪个文件、预期行为、验证命令
2. **逐步骤验证** — 每个步骤完成后立即运行验证，不积累
3. **执行方式**：
   - 子 Agent 驱动（推荐）：每个任务派发独立子 Agent，步骤间 review
   - 内联执行：当前会话顺序执行，在关键节点 checkpoint review

### 5. 代码审查反馈

- 收到反馈时先完整理解，有疑问立即澄清，不清楚的部分不得凭猜测实现
- 技术上不同意时，以代码和项目实际为准进行有理有据的反驳
- 禁止"谢谢""好的""理解"等礼貌性废话，直接描述修改内容或提出问题
- 外部反馈视为建议，需对照代码库实际验证后再决定是否采纳（YAGNI 原则）

### 6. 收尾阶段特别注意事项

- **谨慎操作数据库迁移**：任何 SQL 迁移脚本修改需评估对现有数据的影响，优先本地测试验证
- **避免大幅重构**：优先通过补丁修复问题，而非对现有架构进行大幅重构
- **向后兼容优先**：API 变更优先保证向后兼容
- **变更通知**：对任何可能影响现有功能或数据的变更，提前与用户沟通并获得确认

---

## 完整开发-测试-验收流程（强制执行）

每一次功能开发、Bug 修复必须走完以下全部环节，不得跳过任何一步。

```
需求澄清 → 方案设计 → 编码实现 → 单元验证
  → API 集成测试（check:api-contracts）
  → 权限回归测试（check:permissions）
  → 业务冒烟测试（check:business-smoke）
  → 浏览器 UI 验收（/qa）
  → 代码审查（/review）
  → 安全审计（/cso，发版前）
  → 文档同步（按上方文档同步规范更新 docs/Product/）
  → 提交代码
```

| 阶段 | 执行条件 | 必须完成才算结束 |
|------|----------|----------------|
| **需求澄清** | 任务涉及新功能或复杂改动 | 理解业务目标，确认边界 |
| **方案设计** | 涉及 2+ 文件或跨模块 | 写实现计划，明确文件、步骤、验证方式 |
| **编码实现** | 始终 | 先读后改，一次只改一件事 |
| **单元验证** | 始终 | 每次改动后运行相关验证命令，确认不破坏现有功能 |
| **API 集成回归** | 始终 | `pnpm check:api-contracts` 全部通过 |
| **权限回归** | 涉及权限/角色/页面守卫改动 | `pnpm check:permissions` 全部通过 |
| **业务冒烟** | 始终 | `pnpm check:business-smoke` 覆盖录单→派发→回单→导出回看 |
| **浏览器 UI 验收** | 有前端 UI 改动 | 运行 `/qa`，截图记录，发现 bug 即修复 |
| **代码审查** | 始终 | 运行 `/review`，处理所有 AUTO-FIX 和 ASK 项 |
| **安全审计** | 发版前 | 运行 `/cso`，处理所有高置信度问题 |
| **文档同步** | 功能/字段变更后 + 发版后 | 按文档同步规范更新 `docs/Product/`，记录版本变更 |
| **提交代码** | 始终 | `git diff` 确认变更范围合理，commit message 描述做了什么 |

**禁止行为：**

- ❌ 写完代码不运行任何 check 就声明完成
- ❌ 只跑 `pnpm lint` 就认为没问题
- ❌ UI 改了不上浏览器验证，只看代码说"应该没问题"
- ❌ 多个改动一次性提交，不写实现计划
- ❌ 跳过 `/review` 直接 push

**验证证据规范：**

```
✅ 命令：pnpm check:api-contracts
✅ 结果：全部通过（X 条用例）
✅ 命令：pnpm check:business-smoke
✅ 结果：全部通过（X 条用例）
```

禁止：
- ❌ "跑过了，没问题"
- ❌ "应该可以了"
- ❌ "看起来正常"

---

## 无人值守验收体系

| 命令 | 覆盖范围 |
|------|----------|
| `pnpm check:unattended-acceptance` | **全量总入口** |
| `pnpm check:api-contracts` | 核心 API 集成回归 |
| `pnpm check:permissions` | 权限 401/403 回归 |
| `pnpm check:business-smoke` | 关键业务冒烟（录单→派发→回单→导出回看） |

Fixture 契约：`fixtures:export-results` | `fixtures:export-interactions` | `fixtures:order-parse` | `fixtures:customer-schema`

---

## AI 开发工具扩展（gstack）

项目已集成 gstack 作为 AI 编程能力扩展。

| 技能 | 用途 | 优先级 |
|------|------|--------|
| `/qa` | 真浏览器 UI 验收（Playwright），自动找 bug 并修复 | **高** |
| `/qa-only` | 纯报告模式，不修改代码 | 中 |
| `/cso` | OWASP Top 10 + STRIDE 安全审计 | **高**（上线前必跑） |
| `/document-release` | 发版后自动更新项目文档 | 中 |
| `/review` | 代码审查，捕获 CI 通过但生产会爆炸的 bug | 中 |
| `/investigate` | 根因调试（系统性四阶段，3 次失败停止） | 低 |
| `/careful` | 破坏性命令预警（`rm -rf`、`DROP TABLE`、force-push） | 中 |

**使用时机：**

- **新功能完成后**：运行 `/qa` 在真实浏览器中验收 UI/交互
- **发版前**：运行 `/cso` 做安全审计
- **发版后**：运行 `/document-release` 同步文档
- **提交前**：运行 `/review` 做代码审查

**升级：**

```bash
cd ~/.claude/skills/gstack && git pull && bun run build
```

---

## Agent skills (mattpocock/skills)

### Issue tracker

Issues tracked on Gitee (gitee.com/laijnking/gift-order-mgmt) via OpenAPI v5. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical labels: needs-triage / needs-info / ready-for-agent / ready-for-human / wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

---

## 部署规范

**严格禁止未经同意部署生产环境。** 生产环境部署必须经用户明确同意。

标准流程：
1. **开发环境** — 本地修改代码，编译通过
2. **验证** — 启动 dev server，实际测试功能正确性
3. **提交推送** — `git commit` + `git push`
4. **询问用户** — 明确告知改动内容，获得同意后才能部署
5. **生产部署** — 用户同意后执行 `ssh LP@1.95.139.195 ... git pull ... pnpm build ... systemctl restart`

> 不要在用户未明确同意的情况下直接操作生产服务器。

## 生产环境部署

详见 [docs/deploy.md](docs/deploy.md)

**服务器**: `ssh LP@1.95.139.195`  
**项目目录**: `/data/project`  
**服务管理**: systemd (`gift-order-mgmt.service`)  
**构建脚本**: `scripts/build.sh`（Next.js build + tsup 编译 `src/server.ts` → `dist/server.js`）

### 快速部署

```bash
ssh LP@1.95.139.195
cd /data/project
git pull origin feature/local-0424-merge   # 或其他分支
pnpm install --prefer-frozen-lockfile --prefer-offline
pnpm build
sudo systemctl restart gift-order-mgmt
```

## 参考文档

| 文档 | 内容 |
|------|------|
| `AGENTS.md` | 完整 AI Agent 知识库（模块交互、数据字典、状态流转、异常处理、业务枚举等） |
| `README.md` | 项目概述、快速开始、登录账号 |
| `docs/Product/数据字典.md` | 26 张数据表完整字段定义、索引 |
| `docs/Product/模块功能说明.md` | 各模块功能清单、字段映射、SKU 匹配算法 |
| `docs/Product/模块交互说明.md` | 模块间交互流程、API 调用详情 |
| `docs/deploy.md` | 生产环境部署文档 |
| `supabase/migrations/` | SQL 迁移脚本（按序号执行） |
