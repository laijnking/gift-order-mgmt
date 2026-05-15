# 礼品订单管理系统 — AI Agent 知识库

更新时间：2026-04-29

## 项目概述

礼品一件代发业务订单管理系统。技术栈：Next.js 16 (App Router) + React 19 + TypeScript 5 + shadcn/ui + Tailwind CSS 4 + Supabase PostgreSQL。

> 项目说明、登录账号、快速开始见 `README.md`。开发命令、架构要点见 `CLAUDE.md`。

## 模块总览

| 模块      | 路径                           | 优先级 | 核心功能                       |
| ------- | ---------------------------- | --- | -------------------------- |
| 首页      | `/`                          | P0  | 数据概览、快捷入口                  |
| 订单中心    | `/orders`                    | P0  | 订单列表、状态管理、批量派发             |
| 订单录入    | `/order-parse`               | P0  | Excel 导入、表头解析、列映射、商品/发货方匹配 |
| 库存管理    | `/stocks`                    | P0  | 库存查询、版本历史、价格历史、批量导入        |
| 发货通知单   | `/shipping-export`           | P1  | 按发货方导出派发单（三种模式）            |
| 物流回单    | `/return-receipt`            | P1  | 回单导入、自动匹配、冲突处理             |
| 客户反馈导出  | `/feedback-export`           | P1  | 导出已回单订单给客户、二次导出历史          |
| 导出记录    | `/export-records`            | P1  | 导出历史、明细重生成、下载              |
| 历史成本库   | `/order-cost-history`        | P1  | 成本记录、费用录入（分摊）              |
| 预警中心    | `/alerts`                    | P1  | 预警规则、记录处理、三阶段执行器           |
| 客户管理    | `/customers`                 | P1  | 客户档案、业务员/跟单员分配、批量交接        |
| 发货方管理   | `/suppliers-manage`          | P1  | 发货方档案、仓库/京东/拼多多渠道          |
| 商品管理    | `/products`                  | P1  | 商品档案、品牌分类                  |
| SKU映射   | `/sku-mappings`              | P1  | 映射关系管理（含发货方商品编码 Tab）       |
| 数据报表    | `/reports`                   | P1  | 订单统计、销售业绩、发货方分析、回单时效       |
| 档案概览    | `/archive`                   | P1  | 档案总览                       |
| 用户管理    | `/users`                     | P2  | 用户列表、角色分配                  |
| 角色管理    | `/roles`                     | P2  | 角色配置、权限分配                  |
| 模板配置    | `/templates`                 | P2  | 发货通知/客户反馈导出模板              |
| AI配置/日志 | `/agent-configs`, `/ai-logs` | P2  | 预留                         |

***

## 业务枚举字典

### 订单状态

| status             | 标签    | 可流转至                                             |
| ------------------ | ----- | ------------------------------------------------ |
| `pending`          | 待派发   | assigned, cancelled                              |
| `assigned`         | 已派发   | partial\_returned, notified, returned, cancelled |
| `notified`         | 通知发货  | partial\_returned, returned, cancelled           |
| `partial_returned` | 部分回单  | returned, feedbacked, completed                  |
| `returned`         | 已回单   | feedbacked, completed                            |
| `feedbacked`       | 已反馈客户 | completed                                        |
| `completed`        | 已完成   | -                                                |
| `cancelled`        | 已取消   | -                                                |

> `feedbacked` 是独立状态，表示订单已反馈给客户但尚未完成最终归档。回单阶段统计聚合 assigned / partial\_returned / returned / feedbacked 四种状态。

### 发货方类型

| type          | 说明    | send\_type |
| ------------- | ----- | ---------- |
| `platform`    | 平台    | `platform` |
| `self`        | 自有仓   | `self`     |
| `third_party` | 第三方代发 | `download` |

### 派发模式

| dispatchMode                | 效果    | 副作用                    |
| --------------------------- | ----- | ---------------------- |
| `preview`                   | 生成预览  | 无                      |
| `dispatch_only`             | 派发    | 扣减库存 + 写入派发记录 + 写入成本记录 |
| `dispatch_with_persistence` | 派发+留痕 | 上述 + 写入导出记录 + 文件持久化    |

### 回单匹配规则

优先级（4 级）：

1. 快递单号精确匹配
2. 订单号 + 收货人手机号
3. 订单号 + 收货人姓名
4. 收货人手机号 + 商品名称

匹配结果：`auto_matched` | `conflict`（多候选→复核池） | `manual_matched` | `unmatched`

### 库存变更类型

`manual`（手动） | `import`（批量导入） | `order`（订单扣减） | `adjust`（系统调整） | `return`（退货入库） | `transfer`（调拨）

### 历史成本库生命周期

```
派发 ──▶ 创建记录（unit_cost, total_cost, shipped_date）
回单 ──▶ 补全快递（express_company, tracking_no, returned_date）
费用录入 ──▶ 补充分摊费用（express_fee, other_fee, total_amount）
```

> 运费和其他费用按各商品行成本占比**分摊**，不是整单费用复制到每行。

### 预警规则执行器

`src/lib/alert-executor.ts`，通过 `/api/alert-rules/execute` 统一执行：

| 阶段   | 条件             | 操作                |
| ---- | -------------- | ----------------- |
| 新增   | 满足规则 + 无未处理预警  | 创建 alert\_records |
| 复用   | 满足规则 + 已有未处理预警 | 跳过                |
| 自动关闭 | 不满足规则 + 有未处理预警 | is\_resolved=true |

三类规则：`LOW_STOCK_ALERT`（库存 ≤ 阈值） | `ORDER_TIMEOUT_ALERT`（待派发超时） | `RETURN_DELAY_ALERT`（回单超时）

***

## 模块交互

### 1. 订单录入 → 档案管理

**选择客户后联动**：查询 `customers` 表获取 `salesperson_id`、`order_taker_id`，自动填充表单。优先使用 ID 字段，ID 缺失时按姓名匹配兼容。

**Excel 列映射**：上传 Excel 后按表头 SHA256 指纹查询 `column_mappings`，命中则自动加载历史映射。保存映射时同步写入 `feedback_export_headers`（"客户列名 → 系统字段名"），确保客户用什么列名导入就用什么列名导出。物流信息由系统追加。

API：`GET /api/customers/[id]`, `GET /api/column-mappings/history`

### 2. 订单录入 → 库存管理

商品匹配后查询 `stocks` 表，按发货方分组返回库存。库存 ≤ 2 台触发尾货预警。

API：`POST /api/match` (Body: `{ productId, province }`)

### 3. 订单派发 → 发货通知单

派发流程：选择订单 → 选择模式 → 对每个发货方循环：

1. `resolvePreferredTemplate(targetType='supplier', targetId=supplierId)` 查询专属模板
2. 有专属模板 → `supplierProductCode` 优先；否则 fallback 默认模板 → `productCode` 优先
3. 生成 dispatchItems（含发货方商品编码**快照**）
4. 按模式执行副作用 → 返回 dispatchSummary（newDispatchCount / reusedDispatchCount / assignedOnlyCount）

**派发幂等**：同一订单重复派发复用既有 `dispatch_records`，不重复扣减。

**库存扣减**：更新 `stocks.quantity` → 写入 `stock_versions`（change\_type: "order"）→ 库存 ≤ 2 触发预警。

### 4. 物流回单

上传回单 Excel → 按 4 级优先级匹配订单 → 单一匹配自动确认 / 多候选标记 conflict 进复核池 / 无匹配标记 unmatched。人工确认冲突时调用 `POST /api/return-receipts/confirm`。

### 5. 回单 → 历史成本库

回单确认后，补全 `order_cost_history` 的 `express_company`、`tracking_no`、`returned_date`，并更新 `orders.returned_at`（回单时效报表依赖此字段）。

### 6. 客户反馈导出（列名还原）

```
Excel导入 → SHA256 指纹 → 查询 column_mappings
  ├─ 命中 → 自动加载映射（折叠 + 绿色提示）
  └─ 未命中 → 人工映射 → 保存到 feedback_export_headers
→ 派发 → 回单确认 → 导出客户反馈单
→ 按 feedback_export_headers 还原原始列名 + 追加物流列
```

API：`POST /api/export-feedback/batch`

### 7. 文件持久化

| provider | 写入              | 下载          |
| -------- | --------------- | ----------- |
| `local`  | `data/exports/` | 本地文件        |
| `s3`     | S3/MinIO bucket | 预签名链接（900s） |

S3 不可用时降级到本地（若有 fallback）。文件未持久化时降级为"按需重新生成"。

### 8. 权限控制

四级守卫：菜单（Sidebar 过滤） → 页面（`PageGuard`） → 按钮（disabled/降级） → API（`server-auth.ts` 校验 `x-user-info` 头）。

数据范围：`all`（全部） | `department`（本部门） | `self`（仅本人）。

"仅本人"实现：业务员通过 JOIN customers 按 `salesperson_name` 过滤，跟单员按 `operator_name` 过滤。前端通过 `src/lib/client-auth.ts` 的 `buildUserInfoHeaders()` 构建 `x-user-info` 头。

### 9. 状态流转

**订单**：`pending → assigned → partial_returned/returned → feedbacked → completed`（`cancelled` 可从 pending/assigned/notified 进入）

**回单匹配**：`pending → auto_matched → confirmed`；若多候选 → `conflict → manual_matched → confirmed`；若无法匹配 → `unmatched`

### 10. 异常处理摘要

| 场景      | 处理                             |
| ------- | ------------------------------ |
| 订单号重复   | 时间戳+随机码重新生成                    |
| 同批/系统重复 | 保留第一条，跳过后续，返回跳过数量              |
| 库存不足/负数 | 禁止派发，通过尾货预警提前告知                |
| 回单冲突    | 标记 conflict 进入复核池              |
| 回单重复导入  | 检测已存在记录后跳过，返回 duplicateSummary |
| 导出记录不存在 | 返回 404                         |
| S3 不可用  | 降级到本地磁盘                        |

***

## 关键设计原则

### 数据源

- **`shippers`** **表是发货方唯一数据源**，已废弃 `suppliers` 表
- `orders.items` 为 JSONB 数组存储商品明细，**不存在独立** **`order_items`** **表**
- `orders.supplier_id` 类型为 `VARCHAR(36)`（非 UUID）
- `product_mappings.id` 类型为 `VARCHAR`（非 UUID），兼容客户自定义编码
- 客户表新旧字段兼容：运行时通过 `src/lib/customer-schema.ts` 自动选择 `contact_person`（新）或 `contact`（旧）

### 派发快照

派发时将发货方商品编码（supplierProductCode/Name/Spec/Price）快照写入 `orders.items` 和 `dispatch_records.items`。导出时直接读取快照，不跨表查询 `product_mappings`。

### 模板优先级

发货通知导出：发货方专属模板（targetType=supplier + targetId）> 默认模板 > 内置默认字段。有专属模板时商品字段按 `supplierProductCode` 优先，否则按 `productCode` 优先。

### API-Schema 对齐

以 API 代码为 source of truth，数据库 schema 跟随 API 实际使用的字段名。迁移文件在 `supabase/migrations/`，按序号手动执行（不用 ORM 迁移）。

### 商品匹配优先级

编码匹配 > 条码匹配 > 规格匹配 > 名称匹配

### 字段命名规范

表名 snake\_case 复数 | 主键 `id`（uuid） | 外键 `{table}_id` | 时间字段 `{action}_at` | 布尔 `is_`/`can_` 前缀

***

## AI Agent 开发规范

1. **先读后改** — 编辑文件前必须用 Read 工具读取完整内容，不得在未阅读的情况下直接修改。
2. **证据先于论断** — 声明"修复成功""功能正常""测试通过"必须附验证命令的实际输出。禁止"应该可以""看起来没问题"。
3. **无人值守验收优先** — 完成后运行 `pnpm check:unattended-acceptance`，所有 check:\* 脚本通过方可声明完成。
4. **仅改需要的** — 禁止修复 Bug 时顺便重构无关代码，同一提交不超过 2 个关注点。
5. **破坏性操作需确认** — `rm`、`DROP TABLE`、强制覆盖等必须先告知后果。
6. **不擅自推送** — `git push` 需用户明确要求，禁止 `--force`。
7. **变更同步文档** — 功能/数据结构/API 变化时同步更新 `docs/Product/` 下文档。

### 7b. 文档同步规范（强制执行）

系统功能、字段、API 有调整时，必须同步更新 `docs/Product/` 下对应文档，并在文档内记录版本变更。

**文档与代码的对应关系：**

| 文档          | 对应变更类型                     |
| ----------- | -------------------------- |
| `数据字典.md`   | 新增/修改/删除数据表字段、索引、约束、枚举值    |
| `模块功能说明.md` | 新增/修改/删除功能模块、字段映射规则、业务逻辑   |
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

❌ 不好：`更新了文档`
❌ 不好：`orders 表加了字段`
✅ 好：`v1.3 | 2026-04-27 | 新增 orders.remark_v2 字段（备注视名），用于发货通知单导出时展示客户备注；同步更新发货通知单导出模块功能说明`
✅ 好：`v1.2 | 2026-04-20 | 新增 alert_rules / alert_records 表及三阶段执行器，支持库存不足、待派发超时、回单超时三类预警规则`
✅ 好：`v1.3 | 2026-04-27 | 拆分 customers.contact → salesperson_id / order_taker_id / operator_id，详见 客户档案管理 模块功能说明`

**禁止行为：**

- ❌ 修改了表字段但 `数据字典.md` 未更新
- ❌ 新增了 API 但 `模块交互说明.md` 未更新
- ❌ 版本记录只写"更新"而不描述具体变更内容
- ❌ 删除了功能但文档未做标注（用删除线标注，不要直接删除历史记录）

### 8. 系统性调试（遇到 Bug 必须遵循）

**铁律：未定位根因，不得修复。**

四阶段顺序执行，不得跳过：

1. **根因调查** — 完整阅读错误信息，重现问题，检查最近变更（`git diff`）
2. **模式分析** — 找到同模块正常工作的代码，对比差异
3. **形成假设** — 明确"我认为 X 是根因"，最小化修改验证
4. **实施修复** — 一次只改一个变量

**停止线**：同一 Bug 尝试 3 次修复均失败 → 停止，质疑架构设计，向用户报告。

### 9. 多步骤任务规划

涉及 2 个以上文件或多个步骤的任务：

1. **确认 worktree 上下文** — 任务开始前 `git worktree list` 确认当前分支和工作树路径，确保改动落在正确的 worktree 上。项目使用 git worktree 管理多分支并行开发（详见 `CLAUDE.md`）
2. **先写计划** — 明确每个步骤改哪个文件、预期行为、验证命令
3. **逐步骤验证** — 每个步骤完成后立即运行验证，不积累
4. **执行方式**：
   - 子 Agent 驱动（推荐）：每个任务派发独立子 Agent，步骤间 review
   - 内联执行：当前会话顺序执行，在关键节点 checkpoint review

### 10. 代码审查反馈

- 收到反馈时先完整理解，有疑问立即澄清，不清楚的部分不得凭猜测实现
- 技术上不同意时，以代码和项目实际为准进行有理有据的反驳
- 禁止"谢谢""好的""理解"等礼貌性废话，直接描述修改内容或提出问题
- 外部反馈视为建议，需对照代码库实际验证后再决定是否采纳（YAGNI 原则）

### 11. 收尾阶段特别注意事项

- **谨慎操作数据库迁移**：任何 SQL 迁移脚本修改需评估对现有数据的影响，优先本地测试验证
- **避免大幅重构**：优先通过补丁修复问题，而非对现有架构进行大幅重构
- **向后兼容优先**：API 变更优先保证向后兼容
- **变更通知**：对任何可能影响现有功能或数据的变更，提前与用户沟通并获得确认
- **Worktree 清理**：功能分支合并到 master 后，删除对应 worktree（`git worktree remove <path>`）和远程分支，避免 worktree 堆积

***

## 完整开发-测试-验收流程（强制执行）

> 每一次功能开发、Bug 修复必须走完以下全部环节，不得跳过任何一步。

### 流程图

```
需求澄清 → 方案设计 → 编码实现 → 单元验证
  → API 集成测试（check:api-contracts）
  → 权限回归测试（check:permissions）
  → 业务冒烟测试（check:business-smoke）
  → 浏览器 UI 验收（/qa）
  → 代码审查（/review）
  → 安全审计（/cso，发版前）
  → 文档同步（/document-release，发版后）
  → 提交代码
```

### 各阶段要求

| 阶段            | 执行条件           | 必须完成才算结束                                       |
| ------------- | -------------- | ---------------------------------------------- |
| **需求澄清**      | 任务涉及新功能或复杂改动   | 理解业务目标，确认边界                                    |
| **方案设计**      | 涉及 2+ 文件或跨模块   | 写实现计划，明确文件、步骤、验证方式                             |
| **编码实现**      | 始终             | 先读后改，一次只改一件事                                   |
| **单元验证**      | 始终             | 每次改动后运行相关验证命令，确认不破坏现有功能                        |
| **API 集成回归**  | 始终             | `pnpm check:api-contracts` 全部通过                |
| **权限回归**      | 涉及权限/角色/页面守卫改动 | `pnpm check:permissions` 全部通过                  |
| **业务冒烟**      | 始终             | `pnpm check:business-smoke` 覆盖录单→派发→回单→导出回看    |
| **浏览器 UI 验收** | 有前端 UI 改动      | 运行 `/qa`，截图记录，发现 bug 即修复                       |
| **代码审查**      | 始终             | 运行 `/review`，处理所有 AUTO-FIX 和 ASK 项             |
| **安全审计**      | 发版前            | 运行 `/cso`，处理所有高置信度问题                           |
| **文档同步**      | 功能/字段变更后 + 发版后 | 按 7b 规范同步更新 `docs/Product/`，记录版本变更             |
| **提交代码**      | 始终             | `git diff` 确认变更范围合理，commit message 描述做了什么而非为什么 |

### 禁止行为

- ❌ 写完代码不运行任何 check 就声明完成
- ❌ 只跑 `pnpm lint` 就认为没问题
- ❌ 在不同终端各自跑一部分 check，然后报告"都过了"
- ❌ UI 改了不上浏览器验证，只看代码说"应该没问题"
- ❌ 多个改动一次性提交，不写实现计划
- ❌ 跳过 `/review` 直接 push

### 验证证据规范

每次报告结果必须包含：

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

***

## 无人值守验收体系

| 命令                                 | 覆盖范围                  |
| ---------------------------------- | --------------------- |
| `pnpm check:unattended-acceptance` | **全量总入口**             |
| `pnpm check:api-contracts`         | 核心 API 集成回归           |
| `pnpm check:permissions`           | 权限 401/403 回归         |
| `pnpm check:business-smoke`        | 关键业务冒烟（录单→派发→回单→导出回看） |

Fixture 契约：`fixtures:export-results` | `fixtures:export-interactions` | `fixtures:export-records` | `fixtures:order-parse` | `fixtures:customer-schema` | `fixtures:ai-test`

***

## AI 开发工具扩展（gstack）

项目已集成 [gstack](https://github.com/garrytan/gstack) 作为 AI 编程能力扩展，弥补浏览器端验收和安全审计短板。

### 安装位置

- **gstack 源码**：`~/.claude/skills/gstack/`（全局）
- **Cursor 技能**：`~/.cursor/skills-cursor/gstack/`

### 已启用技能

| 技能                  | 用途                                        | 优先级          |
| ------------------- | ----------------------------------------- | ------------ |
| `/qa`               | 真浏览器 UI 验收（Playwright），自动找 bug 并修复，生成回归测试 | **高**        |
| `/qa-only`          | 纯报告模式，不修改代码                               | 中            |
| `/cso`              | OWASP Top 10 + STRIDE 安全审计                | **高**（上线前必跑） |
| `/document-release` | 发版后自动更新项目文档                               | 中            |
| `/review`           | 代码审查，捕获 CI 通过但生产会爆炸的 bug                  | 中            |
| `/investigate`      | 根因调试（系统性四阶段，3 次失败停止）                      | 低            |
| `/careful`          | 破坏性命令预警（`rm -rf`、`DROP TABLE`、force-push） | 中            |

### 使用时机

- **新功能完成后**：运行 `/qa` 在真实浏览器中验收 UI/交互
- **发版前**：运行 `/cso` 做一次安全审计
- **发版后**：运行 `/document-release` 同步文档
- **提交前**：运行 `/review` 做代码审查

### 升级

```bash
cd ~/.claude/skills/gstack && git pull && bun run build
```

> 升级后需重新为 Cursor 执行路径替换安装。

***

## 参考文档

| 文档                       | 内容                    |
| ------------------------ | --------------------- |
| `CLAUDE.md`              | 开发命令、技术栈、架构要点         |
| `README.md`              | 项目概述、快速开始、登录账号        |
| `docs/Product/数据字典.md`   | 26 张数据表完整字段定义、索引      |
| `docs/Product/模块功能说明.md` | 各模块功能清单、字段映射、SKU 匹配算法 |
| `docs/Product/模块交互说明.md` | 模块间交互流程、API 调用详情      |
| `supabase/migrations/`   | SQL 迁移脚本（按序号执行）       |

