# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

规格匹配 > 编码匹配 > 条码匹配 > 名称匹配

### 回单匹配优先级（3 级）

回单 Excel 中的系统订单号列（支持多种列名：`系统订单`、`系统订单号`、`系统订单号（请勿删除和修改）`、`客户订单号`、`订单号`、`单据编号`），对应回单的 `customer_order_no` 字段，按以下顺序在 `orders` 表中查找匹配：

1. **系统订单号精确匹配** — `orders.sys_order_no = receipt.customer_order_no`，命中则立即返回，不继续
2. **客户订单号精确匹配** — `orders.order_no = receipt.customer_order_no`，放入候选集
3. **客户订单号模糊匹配** — `orders.order_no ILIKE %receipt.customer_order_no%`，仅当前两级都为空时执行

多候选命中 → 标记为 `conflict`，进入人工复核池。

### 预警执行器

`src/lib/alert-executor.ts` 统一三阶段：新增（满足条件 + 无未处理预警）→ 复用（满足条件 + 已有未处理预警，跳过）→ 自动关闭（不满足条件 + 有未处理预警，自动标记 resolved）。三类规则：`low_stock`、`order_timeout`、`return_delay`。

### 历史成本库生命周期

派发（写入 unit_cost/total_cost） → 回单（补全 express_company/tracking_no） → 费用录入（补充分摊运费/杂费）。运费按各商品行成本占比分摊到各行，不是整单费用复制。

### API-Schema 对齐原则

以 API 代码为事实来源（source of truth），数据库 schema 跟随 API 实际使用的字段名。迁移文件在 `supabase/migrations/`，按序号执行，不使用 ORM 迁移。

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

- `AGENTS.md` — 完整的项目文档（模块交互、数据字典、状态流转、异常处理等）
- `docs/Product/数据字典.md` — 26 张数据表的完整字段定义
- `docs/Product/模块功能说明.md` — 各模块详细功能清单
- `docs/Product/模块交互说明.md` — 模块间交互流程与 API 调用
- `docs/deploy.md` — 生产环境部署文档
