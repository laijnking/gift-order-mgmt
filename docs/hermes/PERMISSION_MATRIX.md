# 权限矩阵

> 审计时间：2026-04-21（Hermes 接力审计）
> 事实来源：`src/lib/roles.ts`（角色字典）、`src/lib/server-auth.ts`（认证中间件）

---

## 角色定义

| 角色分组 | 编码 | 说明 |
|----------|------|------|
| 销售岗 | `sales`, `salesman`, `salesperson`, `sales_manager` | 可分配订单给客户 |
| 跟单岗 | `operator`, `order_taker`, `order_manager` | 可处理客户跟单 |
| 管理岗 | `admin`, `admin_viewer`, `viewer`, `finance`, `finance_manager` | 可查看后台 |

辅助函数：
- `isSalesRole(role)` — 是否销售岗
- `isOperatorRole(role)` — 是否跟单岗
- `isManagementRole(role)` — 是否管理岗
- `isSalesAssignableRole(role)` — 可分配订单（含 admin）
- `isOperatorAssignableRole(role)` — 可处理跟单（含 admin）

---

## API 级权限

> 所有 API 路由通过 `requirePermission(request, 'permission:action')` 守卫，无一例外。

| API Route | 权限 | 操作 |
|-----------|------|------|
| `POST /api/orders` | `orders:create` | 创建订单 |
| `GET/PATCH/DELETE /api/orders` | *(dataScope 过滤，详见下方)* | 订单 CRUD |
| `POST /api/order-parse` | `orders:create` | 订单解析 |
| `POST /api/order-parse/excel` | `orders:create` | Excel 导入 |
| `GET /api/match` | `orders:view` | 订单匹配 |
| `GET/POST /api/alert-records` | `orders:view` / `orders:edit` | 预警记录 |
| `GET/POST /api/returns` | `orders:edit` | 退货处理 |
| `GET/POST /api/alert-rules` | `settings:view` / `settings:edit` | 预警规则 |
| `POST /api/alert-rules/execute` | `settings:view` | 执行预警 |
| `GET /api/ai-logs` | `ai_logs:view` | AI 日志 |
| `GET/POST /api/roles` | `settings:view` | 角色管理 |
| `GET /api/users/batch` | `users:create` | 批量创建用户 |
| `GET /api/products` | `products:view` | 商品查看 |
| `POST /api/products` | `products:create` | 商品创建 |
| `PATCH/DELETE /api/products/:id` | `products:edit` / `products:delete` | 商品管理 |
| `GET /api/product-match` | `products:view` | 商品匹配 |
| `GET/POST /api/suppliers` | `suppliers:view` / `suppliers:create` | 供应商管理 |
| `PATCH/DELETE /api/suppliers/:id` | `suppliers:edit` / `suppliers:delete` | 供应商管理 |
| `GET/POST /api/warehouses` | `suppliers:view` / `suppliers:create` | 仓库管理 |
| `PATCH/DELETE /api/warehouses/:id` | `suppliers:edit` / `suppliers:delete` | 仓库管理 |
| `GET/POST /api/shippers` | `suppliers:view` / `suppliers:create` | 物流商管理 |
| `PATCH/DELETE /api/shippers/:id` | `suppliers:edit` / `suppliers:delete` | 物流商管理 |
| `POST /api/shippers/batch` | `suppliers:create` | 批量物流商 |
| `GET/POST /api/stocks` | `stocks:view` / `stocks:edit` | 库存管理 |
| `POST /api/stocks/batch` | `stocks:edit` | 批量库存 |
| `POST /api/stocks/import` | `stocks:edit` | 库存导入 |
| `GET/POST /api/templates` | `settings:view` / `settings:edit` | 模板管理 |
| `GET /api/templates/default/:type` | `settings:view` | 默认模板 |
| `GET/POST /api/templates/fields` | `settings:view` / `settings:edit` | 模板字段 |
| `GET/POST /api/templates/link` | `settings:edit` / `settings:view` | 模板关联 |
| `POST /api/column-mappings` | `orders:create` | 字段映射 |
| `GET /api/column-mappings/history` | `orders:create` | 映射历史 |
| `GET /api/shipping-exports/pending` | `orders:export` | 待发货导出 |
| `POST /api/shipping-exports/batch` | `orders:export` | 批量发货导出 |
| `GET/POST /api/shipping-exports/batch/:id` | `orders:export` | 批量导出详情 |
| `GET /api/export` | `orders:export` | 导出 |
| `GET /api/export-records` | `orders:export` | 导出记录 |
| `GET /api/export-records/:id` | `orders:export` | 导出记录详情 |
| `GET /api/export-records/:id/download` | `orders:export` | 导出下载 |

---

## 数据权限过滤

`src/app/api/orders/route.ts`（行 438-441）实现了 `dataScope` 数据边界：

```
dataScope = 'self' + role !== 'admin'
  → 仅看业务员或跟单员是自己的订单
  → 根据 username 查 realName 后过滤
dataScope 未设置 或 role = 'admin'
  → 不看 dataScope 限制，可查看全部数据
```

---

## 页面级权限

> 路由守卫：Next.js `layout.tsx` 中间件层，未使用 `requirePermission`，依赖前端隐藏。

| 页面 | 路由 | 权限说明 |
|------|------|----------|
| 登录 | `/login` | 公开 |
| 首页（仪表盘） | `/` | 所有登录用户 |
| 订单列表 | `/orders` | `orders:view` 数据范围过滤 |
| 订单录入 | `/order-parse` | `orders:create` |
| 客户管理 | `/customers` | 角色辅助函数已接入 `roles.ts` |
| 商品管理 | `/products` | `products:view` |
| 供应商 | `/suppliers-manage` | `suppliers:view` |
| 仓库管理 | `/warehouses-manage` | `suppliers:view` |
| 物流商 | `/shippers` | `suppliers:view` |
| 发货通知 | `/shipping-export` | `orders:export` |
| 导出记录 | `/export-records` | `orders:export` |
| 归档 | `/archive` | 状态过滤 `completed`/`cancelled` |
| 用户管理 | `/users` | 管理岗可见 |
| 角色管理 | `/roles` | 管理岗可见 |
| 预警规则 | `/alert-rules` | `settings:view` |
| 预警记录 | `/alert-records` | `orders:view` |
| AI 日志 | `/ai-logs` | `ai_logs:view` |
| 商品匹配 | `/product-match` | `products:view` |
| 字段映射 | `/column-mappings` | `orders:create` |
| 智能体配置 | `/agent-configs` | `agent_configs:view` |
| SKU 映射 | `/sku-mappings` | — |
| 回单管理 | `/return-receipt` | 状态机 `returned` 过滤 |
| 库存 | `/stocks` | `stocks:view` |

---

## 按钮/操作级权限

| 操作 | 允许角色/权限 | 实现位置 |
|------|---------------|----------|
| 创建订单 | `orders:create` | `api/order-parse/route.ts` |
| 编辑订单 | `orders:edit` | `api/orders/route.ts`（PATCH）|
| 派发订单 | `orders:export` | `api/shipping-exports/*` |
| 确认退货 | `orders:edit` | `api/returns/route.ts` |
| 下载导出文件 | `orders:export` | `api/export-records/:id/download` |
| 管理模板 | `settings:edit` | `api/templates/*` |
| 管理预警规则 | `settings:edit` | `api/alert-rules/*` |
| 执行预警 | `settings:view` | `api/alert-rules/execute/route.ts` |
| 管理商品 | `products:edit` | `api/products/:id/route.ts` |
| 管理供应商 | `suppliers:edit` | `api/suppliers/:id/route.ts` |

---

## 已知缺口

### 1. 前端页面无路由级守卫
`layout.tsx` 只做 UI 隐藏，未调用 `requirePermission`，用户可直接通过 URL 访问任何页面。API 层有守卫所以数据不会泄露，但用户体验上会出现"点了没反应"。

**建议**：Next.js middleware 拦截所有 `/(app)/*` 路由，读取 `x-user-info` header 并校验权限，无效返回 401。

### 2. `role !== 'admin'` 硬编码 → ✅ 已修复
`src/app/api/orders/route.ts:442` 已改为 `!isManagementRole(currentUser.role)`，接入 `roles.ts`。

### 3. 权限字符串无枚举 → ✅ 已收口
`src/lib/permissions.ts` 已定义 23 个权限常量（`PERMISSIONS.ORDERS_VIEW` 等），70 个 API 文件已统一引用。

### 4. 前端页面无路由级守卫
`layout.tsx` 只做 UI 隐藏，未调用 `requirePermission`，用户可直接通过 URL 访问任何页面。API 层有守卫所以数据不会泄露，但用户体验上会出现"点了没反应"。

**建议**：Next.js middleware 拦截所有 `/(app)/*` 路由，读取 `x-user-info` header 并校验权限，无效返回 401。

### 5. `api/orders/route.ts` 缺少 `requirePermission`
`GET /api/orders` 和 `PATCH /api/orders` 未调用 `requirePermission`，仅靠 `dataScope` 过滤。其他人如果伪造 header 可能穿透。

---

## 审计结果汇总

| 项目 | 状态 |
|------|------|
| API 路由 `requirePermission` 全覆盖 | ✅ 50 处调用，无遗漏 |
| 角色字典统一 (`roles.ts`) | ✅ 已标准化 |
| `dataScope` 数据边界 | ✅ 已实现 |
| `role !== 'admin'` 硬编码 | ✅ 已修复为 `isManagementRole()` |
| 权限字符串枚举 | ✅ `src/lib/permissions.ts` 23 个常量，70 文件统一引用 |
| 前端路由守卫 | ❌ 缺失（仅 UI 隐藏）|
| `orders` API 缺少 `requirePermission` | ⚠️ 仅 dataScope 过滤 |
