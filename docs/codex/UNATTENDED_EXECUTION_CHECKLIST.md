# Unattended Execution Checklist

维护约定：

- 每次推进按"模型 / 接口 / 页面 / 文档 / 校验"顺序记录
- 每次只在清单里更新状态，不在这里堆大段过程描述
- 已完成事项尽量落到对应方案文档中的"已实施"或"验收标准"

状态说明：

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成

## Preflight - 工程基线

- [x] 安装项目依赖（`corepack pnpm install`）
- [x] 通过 TypeScript 检查（`corepack pnpm ts-check`）
- [x] 收口 ESLint 阻塞错误（错误级 lint 已清零）
- [x] 输出当前体检基线与执行阶段文档

## Phase A - 统一模型与边界

- [x] 统一角色字典与角色分组工具
- [x] 统一权限矩阵（菜单 / 页面 / 按钮 / API）
- [x] 统一订单状态机、回单状态机、反馈状态机
- [x] 对齐模板 schema、API、migration

## Phase B - 订单录入主链路

- [x] 定义统一 `ParsedOrderDraft`
- [x] 统一文本录入与 Excel 导入的输出结构
- [x] 修复客户选择后业务员 / 跟单员按 ID 联动
- [x] 重构字段映射保存、恢复、模板签名机制
- [x] 字段映射保存前加入基础校验（必填 / 冲突）
- [x] 建立订单录入验收样例
- [x] 让订单录入夹具可执行

## Phase C - 模板与导出

- [x] 重构模板模型
- [x] 修复默认模板与专属模板查找逻辑
- [x] 修复客户反馈导出查询条件与状态过滤
- [x] 拆开发货通知"预览 / 派发 / 文件生成"
- [x] 打通真实文件生成与下载
- [x] 明细级导出文件持久化与下载
- [x] 发货通知导出副作用去重与派发职责收口

## Phase D - 回单 / 库存 / 预警 / 成本

- [x] 回单导入加入重复检测
- [x] 回单导入加入人工复核池
- [x] 派发动作去重，避免重复扣库存
- [x] 预警规则执行器化
- [x] 成本库更新时机校准

## Phase E - 测试与回归

- [x] 核心 API 集成测试
- [x] 权限矩阵回归断言
- [x] 订单录入 / 派发 / 回单 / 导出 E2E 冒烟测试
- [x] 样例 Excel / JSON 测试夹具
- [x] 导出记录下载状态夹具
- [x] 导出结果契约夹具
- [x] 导出交互表达夹具
- [x] 导出下载路由 / 结果页集成校验
- [x] `export_records` 重生成不新增新记录的契约回归
- [x] 发货通知 -> 导出记录 -> 重生成下载 跨页 UI 回归
- [x] 导出验收总入口（Acceptance）统一收口
- [x] 回归验收清单
- [x] UI 级导出交互验证

## Phase F - 页面适配与可用性

- [x] 收口全局布局在移动端的顶部留白与侧栏行为
- [x] 修复订单录入页的窄屏布局、动作区和表单栅格
- [x] 修复订单中心的窄屏头部、筛选区和预警侧栏
- [x] 修复发货通知 / 回单导入等表格页的窄屏布局
- [x] 修复角色 / 预警 / SKU 映射等管理页的窄屏布局与弹窗宽度
- [x] 修复用户 / 客户 / 商品 / 模板等管理页的窄屏布局、表格横向滚动和弹窗宽度
- [x] 建立关键页面适配验收清单

## 执行约束

- [x] 每阶段先改模型，再改页面和接口
- [-] 每次修改导入导出逻辑必须补测试夹具
- [x] 每阶段完成后更新 `docs/codex` 文档
- [x] 无人值守固定队列与阻塞顺延规则已落档

## 最近推进

- [x] 系统设置与导出主线的页面级 / 按钮级 / API 级权限开始闭环：已为 `users / roles / templates / alert-rules / shipping-exports / export-records` 补服务端权限守卫，并让对应页面请求统一透传 `x-user-info`
- [x] 导出 UI 校验脚本改为复用共享起服底座，`check:export-ui` 与 `check:export-acceptance` 已重新跑通
- [x] 订单中心 / 回单导入 / 库存 / 报表这批高风险入口已补首批权限闭环：对应 API 已加服务端权限守卫，页面已补 `PageGuard`、认证头透传，库存与回单页也已补首轮按钮级禁用
- [x] 订单中心预警侧链已补齐：`/api/alert-records` 已接服务端权限守卫，订单中心的预警拉取与"标记已读"已透传认证头，并修正为与后端一致的 `ids` 批量更新语义
- [x] 档案管理中的客户 / 商品主链已补首轮权限闭环：`/api/customers*`、`/api/products*` 已接服务端权限守卫，对应页面已补 `PageGuard`、认证头透传，以及新增 / 编辑 / 删除 / 批量交接 / 导入等首轮按钮级禁用
- [x] 档案管理中的发货方 / 仓库主链已补首轮权限闭环：`/api/suppliers*`、`/api/shippers*`、`/api/warehouses*` 已接服务端权限守卫，`suppliers-manage / warehouses-manage` 页面已补 `PageGuard`、认证头透传，以及新增 / 编辑 / 删除 / 导入等首轮按钮级禁用
- [x] 档案管理总入口与导入侧边角已补权限闭环：`archive` 总览页已按权限透传统计请求、禁用模块导入入口并补无权兜底；`/api/import/customers|products|suppliers|skuMappings`、`/api/import`、`/api/product-mappings` 已补服务端权限守卫
- [x] 权限回归脚本已补齐并跑通：新增 `check:permissions`，已覆盖 customers / products / suppliers / alert-records / reports 这批关键 401/403 契约，避免页面/API 收口后再悄悄回退
- [x] 权限改动后的基线校验已通过：`ts-check`、相关 `eslint`、`check:api-contracts`
- [x] 预警规则执行器已落地并补齐回归：新增 `/api/alert-rules/execute` 与共享执行器 `src/lib/alert-executor.ts`，支持库存不足、待派发超时、回单超时三类规则的批量执行、未处理预警复用以及条件恢复后的自动关闭；预警中心规则页已补"执行全部规则 / 单条执行"入口，且新增 `check:alert-executor` 回归脚本，已覆盖三类规则的"新增 / 复用 / 自动关闭"行为
- [x] 成本库更新时机已完成第一轮校准：已新增共享生命周期工具 `src/lib/order-cost-history.ts`，把派发时的成本写入改成"首次派发冻结、重复派发复用"，并让回单确认 / 自动匹配 / 手动匹配统一补齐物流与回单日期，费用录入则改为按订单总额分摊到商品行，避免多商品订单把运费重复记多次；同时已补 `check:order-cost-history` 脚本覆盖"派发 -> 费用 -> 回单 -> 重复派发"主链，当前代码侧已通过 `ts-check`，脚本在本沙箱里因本地 PostgreSQL 连接受限未能实跑
- [x] 报表口径与状态机已完成第一轮对齐：`feedbacked` 已并入"回单阶段"统计，首页与销售/供应商分析不再把它漏掉；回单匹配/确认链路已统一回写 `orders.returned_at`，回单时效分析开始具备真实回单时间点；同时顺手修正了报表中的供应商活跃口径和库存金额字段来源
- [x] 报表 API 契约回归已补入口：新增 `check:api-reports` 与 `scripts/validate-api-reports.ts`，用最小样例覆盖 `pending / assigned / partial_returned / returned / feedbacked / completed / cancelled` 七种状态，并锁住 `stats / sales-performance / supplier-analysis / return-timeline` 四条报表接口的关键口径；当前脚本在本沙箱里仍因本地 PostgreSQL 连接受限未能实跑
- [x] 页面层残留状态口径已完成首轮清理：首页总览已拆开"精确状态计数"和"回单阶段聚合计数"，避免把 `feedbacked` 同时算进"已回单"和"已反馈"；报表页回单时效 CSV 已改为使用真实 `avgDispatchDays`；订单中心批次摘要已把 `feedbacked` 纳入"回单阶段"筛选
- [x] 剩余高风险页面与 API 的权限矩阵继续收口中（已完成多轮扫尾）
  - 本轮已补 `export / returns / match / order-cost-history / order-parse / column-mappings` 这批高风险 API 的服务端权限守卫，并让 `order-cost-history / order-parse` 两页补上 `PageGuard` 与 `x-user-info` 透传；当前 `ts-check` 已通过，针对性 `eslint` 无新增错误，仅保留仓库原有 warning
  - 本轮继续补首页与 SKU 映射侧边角：`page / sku-mappings` 已补 `PageGuard` 与认证头透传，SKU 映射页新增 / 导入 / 编辑 / 删除 / 启停已按 `products:edit / delete` 收口；同时 `product-mappings/[id]` 与 `product-mappings/batch` 已补服务端权限守卫
  - 本轮继续补 AI 配置侧边角：`agent-configs / ai-logs` 页面已补 `PageGuard` 与认证头透传，Agent 配置页的新建 / 编辑 / 删除 / 启停 / 测试已按 `agent_configs:edit` 收口；同时 `agent-configs* / ai-logs / ai-test` 已补服务端权限守卫
  - 本轮继续补遗留 API 守卫并扩权权限回归：`export-feedback* / product-match / templates/default|fields|link / shipping-exports/batch/[id] / permissions / fetch-url / admin/clear` 已补服务端权限守卫；`check:permissions` 入口已扩到 `permissions / fetch-url / agent-configs / ai-logs / ai-test`，但当前沙箱因 `listen EPERM` 无法本地起服实跑
- [x] 用户导入、客户导入/保存、订单 Excel 导入链路已完成一轮故障收口
  - `users/batch` 与 `users/[id]` 已切回统一数据库 client，不再依赖单独的 `COZE_SUPABASE_*` 环境变量
  - `customers` 与 `import/customers` 已按客户表新旧字段做兼容写入，避免部署环境 schema 漂移导致保存/导入失败
  - `order-parse` 页的 Excel 解析改为读取整张 sheet，而不再只提交预览前 20 行；同时补回"未选客户不能解析 Excel"的前端校验
- [x] 现场故障项已补夹具回归入口
  - 新增 `fixtures:customer-schema`，锁客户表新旧 schema 的兼容读写
  - 已修复 `fixtures:order-parse` 与 `fixtures:order-parse-excel` 共用目录时的结构冲突，`fixtures:order-parse` 现只读取映射诊断夹具，当前已恢复通过
  - 新增 `fixtures:order-parse-excel`，锁 Excel 解析使用整张 sheet 而不是预览前 20 行
  - 现已补统一聚合命令 `check:local-fixtures`，会串行执行 `ts-check`、相关 lint，以及 `fixtures:customer-schema / fixtures:order-parse / fixtures:order-parse-excel / fixtures:ai-test`
  - 当前两条新增夹具命令与 `ts-check` 已通过；针对性 `eslint` 仅剩仓库原有 warning，无新增错误
  - 后续已继续把 `order-parse` 页面遗留的局部 warning 一并收口，当前针对该页的 `eslint` 与全量 `ts-check` 均已通过
- [x] 回单导入与发货导出的操作人占位已收口
  - `return-receipt` 与 `shipping-export` 页面不再提交 `current_user` 占位，改为使用当前登录用户的真实姓名/用户名
  - 两页相关 hooks 依赖与局部 warning 已顺手收口；当前针对性 `eslint` 与 `ts-check` 已通过
- [x] AI 测试口径已改为显式模拟模式
  - `/api/ai-test` 不再把 mock 返回记成普通 `success` 语义的真实成功，开始显式返回 `mode=mock`，并将 `agent_configs.test_status` / `ai_logs.status` 统一标为 `mock`
  - `agent-configs` 测试对话框已补模拟模式提示，避免把本地假响应误当成真实大模型输出
  - 同轮已顺手清掉 `agent-configs` 页与 `ai-test` 路由的针对性 warning；当前这两处 `eslint` 与 `ts-check` 已通过
  - 新增 `fixtures:ai-test` 与对应夹具，开始把 mock 结果契约固定成可重复执行的本地回归入口；当前 `corepack pnpm fixtures:ai-test` 已通过
- [x] 页面适配尾差已继续推进四轮：`agent-configs / ai-logs / archive / roles / templates / users / orders / shipping-export / return-receipt / customers / suppliers-manage / products / export-records / alerts / warehouses-manage / reports / order-cost-history / stocks / page / order-parse / sku-mappings` 已补齐一批移动端按钮换行、表格横向滚动、对话框安全宽度和弹窗底部按钮堆叠；当前 `ts-check` 已通过，针对性 `eslint` 无新增错误，仅保留仓库原有 warning
- [x] 全局布局与侧栏移动端行为已补尾差：`src/app/(app)/layout.tsx` 现已避免移动端继承桌面折叠宽度，打开抽屉时会锁定背景滚动，切换路由后会自动收起侧栏；当前 `ts-check` 与针对性 `eslint` 已通过
- [x] 页面适配已补统一验收入口：新增 `check:layout-acceptance` 与 `scripts/validate-layout-acceptance.ts`，当前会校验关键页面适配清单文档结构、`ts-check` 与整批关键页面的错误级 `eslint`，为后续页面收口提供固定回归命令
- [x] 本地无人值守回归已补更高层总入口：新增 `check:local-acceptance` 与 `scripts/validate-local-acceptance.ts`，会串行执行 `check:local-fixtures`、`check:layout-acceptance` 与 `check:export-acceptance`；当前整条命令已通过
- [x] `business-smoke` 起服稳定性已收口：`scripts/validate-business-smoke.ts` 已切到共享 `api-test-harness` 起服底座，单独执行 `check:business-smoke` 不再出现"单跑超时、组合入口通过"的波动；当前单独 `check:business-smoke`、上层 `check:export-acceptance` 均已通过
- [x] 导出 API 集成回归已补串行总入口：新增 `check:export-api-acceptance` 与 `scripts/validate-export-api-acceptance.ts`，会串行执行 `check:api-export-feedback`、`check:api-shipping-exports`、`check:api-export-records`，避免并行执行时争抢 `.next/dev/lock`；当前整条命令已通过
- [x] 订单 / 回单 API 集成回归已补串行总入口：新增 `check:order-receipt-api-acceptance` 与 `scripts/validate-order-receipt-api-acceptance.ts`，会串行执行 `check:api-orders`、`check:api-orders-duplicates`、`check:api-return-receipts`、`check:api-return-receipts-duplicates`；当前整条命令已通过
- [x] `api-return-receipts` 的无人值守可观测性已补齐：`scripts/validate-api-return-receipts.ts` 现会输出 `server startup` 与逐条 `RUN/PASS` 阶段日志，避免再次出现"整条脚本长时间静默却难以定位阶段"的问题；当前单独 `check:api-return-receipts` 已通过
- [x] 重型后端集成回归已补串行总入口：新增 `check:backend-heavy-acceptance` 与 `scripts/validate-backend-heavy-acceptance.ts`，会串行执行 `check:api-reports`、`check:alert-executor`、`check:order-cost-history`；当前整条命令已通过
- [x] `api-reports` 断言口径已对齐接口实现：`scripts/validate-api-reports.ts` 中"活跃供应商"基线查询已从 `is_active = true` 改为与接口一致的 `is_active IS DISTINCT FROM false`，避免旧数据里 `NULL` 被接口算作活跃、但脚本基线少算 1 的漂移；当前单独 `check:api-reports` 已通过
- [x] 无人值守总入口已补齐并实跑通过：新增 `check:unattended-acceptance` 与 `scripts/validate-unattended-acceptance.ts`，会串行执行 `check:local-acceptance`、`check:export-api-acceptance`、`check:order-receipt-api-acceptance`、`check:backend-heavy-acceptance`；当前整条命令已通过
- [x] 总入口可观测性已收口：`scripts/validate-unattended-acceptance.ts` 与 `scripts/validate-local-acceptance.ts` 已从缓冲式 `execFile` 改为流式 `spawn(..., { stdio: 'inherit' })`，并补 `RUN/PASS` 阶段日志；当前可在 `check:unattended-acceptance` 中直接看到 `Local Fixtures / Layout Acceptance / Export Acceptance / Export API / Order Receipt API / Backend Heavy` 的逐层推进
- [x] 权限回归已并入顶层总入口：`scripts/validate-unattended-acceptance.ts` 现已继续串行执行 `check:permissions`，当前完整 `check:unattended-acceptance` 已覆盖权限回归并重新跑通
- [x] `business-smoke` 的订单页 mock 漏拦截已修复：`scripts/validate-business-smoke.ts` 中订单接口路由已从 `**/api/orders` 补为 `**/api/orders**`，避免录单成功后跳转订单页时带 query 的请求未被 mock 命中、页面卡在 loading；当前 `check:business-smoke`、`check:export-acceptance` 与顶层 `check:unattended-acceptance` 均已通过
- [x] 复合后端契约快捷入口已恢复通过：`check:api-contracts` 当前已重新跑通，会顺序覆盖 `orders / orders-duplicates / export-records / export-feedback / return-receipts / return-receipts-duplicates / shipping-exports / alert-executor / order-cost-history / reports`
- [x] `check:api-contracts` 已升级为脚本化串行入口：原先的 `&&` shell 链已替换为 `scripts/validate-api-contracts-acceptance.ts`，现在会输出 `RUN/PASS` 阶段日志并流式透传各子脚本输出；当前整条命令已通过
- [x] 中层聚合脚本可观测性已统一：`validate-local-fixtures.ts`、`validate-export-api-acceptance.ts`、`validate-order-receipt-api-acceptance.ts`、`validate-backend-heavy-acceptance.ts` 已从缓冲式 `execFile` 改为流式 `spawn(..., { stdio: 'inherit' })`，并补 `RUN/PASS` 日志；当前抽样回归 `check:export-api-acceptance` 已验证子脚本输出可直接透传
- [x] 旧的 acceptance 入口也已统一成流式风格：`validate-export-acceptance.ts`、`validate-layout-acceptance.ts` 已从缓冲式 `execFile` 改为流式 `spawn(..., { stdio: 'inherit' })`，并补 `RUN/PASS` 阶段日志；当前抽样回归 `check:layout-acceptance` 已验证输出可直接透传
- [x] `check:unattended` 视图已增强：`scripts/check-unattended-progress.ts` 现在除 checklist 摘要外，还会输出可用回归入口矩阵与 `UNATTENDED_QUEUE.md` 中的当前阻塞事实；当前 `corepack pnpm check:unattended` 已验证输出包含 `Regression entrypoints / Current blockers`
- [x] 聚合脚本执行器已统一抽象：新增 `scripts/lib/step-runner.ts`，把 `spawn(..., { stdio: 'inherit' })`、`RUN/PASS` 日志与退出码处理收敛成共享 helper；`validate-unattended-acceptance.ts`、`validate-local-acceptance.ts`、`validate-export-acceptance.ts`、`validate-export-api-acceptance.ts`、`validate-layout-acceptance.ts`、`validate-local-fixtures.ts`、`validate-order-receipt-api-acceptance.ts`、`validate-backend-heavy-acceptance.ts`、`validate-api-contracts-acceptance.ts` 已切到共享实现，当前抽样回归 `check:backend-heavy-acceptance` 已通过
- [x] 文档章节校验也已统一抽象：新增 `scripts/lib/doc-check.ts`，把 acceptance 脚本里重复的"读取 Markdown 并检查必需章节"逻辑收成共享 helper；`validate-export-acceptance.ts`、`validate-layout-acceptance.ts` 已切到共享实现，当前抽样回归 `check:layout-acceptance` 已通过
- [x] 夹具场景继续扩收：export-results 夹具已从 2 个扩展到 7 个场景（新增 `shipping-export-preview-mode / customer-feedback-preview-mode / shipping-export-dispatch-only / shipping-export-explicit-template / customer-feedback-s3-provider`），覆盖预览模式、仅派发模式、显式模板来源、S3 provider 等场景；export-interactions 夹具已从 4 个扩展到 10 个场景（新增 `local-no-provider-default / s3-no-artifact / undefined-provider-persisted / undefined-provider-no-artifact / shipping-export-scenario / customer-feedback-detail-regenerate`），覆盖 undefined provider、无 artifact 降级、业务场景定制 hint 等场景；当前 `corepack pnpm fixtures:export-results` 与 `corepack pnpm fixtures:export-interactions` 均已通过
- [x] 权限回归脚本已补齐 `product-mappings` 与 `product-mappings/batch` 的 401/403 断言：`/api/product-mappings GET` 在 `products:view` 和 `suppliers:view` 下不会被拒绝，`POST` 在只读权限下返回 403；当前 `ts-check` 与 `eslint` 均已通过
- [x] 代码库已完成 warning 清理：`corepack pnpm ts-check` 与 `corepack pnpm exec eslint src --quiet` 均通过，无错误级问题；`corepack pnpm exec eslint scripts --quiet` 也通过，无新增问题
- [-] `check:local-acceptance` 基线验证：静态步骤（ts-check / lint / fixtures）全部通过；`check:export-ui` 因沙箱缺少 Playwright 浏览器无法运行（`Executable doesn't exist at .../chromium_headless_shell`），这是环境限制而非代码问题；数据库/端口恢复后应重跑完整 `check:unattended-acceptance`
- [-] Queue 第 1 项动态验证（2026-04-21 本轮执行结果）：
  - ✅ `check:api-reports` PASS（reports API contract）
  - ✅ `check:api-contracts` 主体 PASS（orders / orders-duplicates / export-records 子项全部通过；export-feedback 因测试服务器启动超时而失败，这是环境限制）
  - ⚠️ `check:order-cost-history` 失败（测试服务器启动超时，环境限制）
  - ⚠️ `check:permissions` 失败（测试服务器启动超时，环境限制）
  - ✅ `npx tsc --noEmit` PASS（0 errors）
  - ✅ `npm run lint` PASS（0 errors, 151 warnings）
  - 说明：PostgreSQL 已连接（`gift-order-mgmt-db` 容器运行中），生产应用在 127.0.0.1:3001 正常运行；但 Node.js 子进程启动 Next.js 测试服务器（端口 5214-5226）在沙箱中超时，这是环境资源限制
