# Unattended Execution Checklist

维护约定：

- 每次推进按“模型 / 接口 / 页面 / 文档 / 校验”顺序记录
- 每次只在清单里更新状态，不在这里堆大段过程描述
- 已完成事项尽量落到对应方案文档中的“已实施”或“验收标准”

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

- [-] 统一角色字典与角色分组工具
- [-] 统一权限矩阵（菜单 / 页面 / 按钮 / API）
- [-] 统一订单状态机、回单状态机、反馈状态机
- [-] 对齐模板 schema、API、migration

## Phase B - 订单录入主链路

 - [-] 定义统一 `ParsedOrderDraft`
- [-] 统一文本录入与 Excel 导入的输出结构
- [-] 修复客户选择后业务员 / 跟单员按 ID 联动
- [-] 重构字段映射保存、恢复、模板签名机制
- [-] 字段映射保存前加入基础校验（必填 / 冲突）
- [x] 建立订单录入验收样例
- [x] 让订单录入夹具可执行

## Phase C - 模板与导出

- [-] 重构模板模型
- [-] 修复默认模板与专属模板查找逻辑
- [-] 修复客户反馈导出查询条件与状态过滤
- [-] 拆开发货通知“预览 / 派发 / 文件生成”
- [-] 打通真实文件生成与下载
- [-] 明细级导出文件持久化与下载
- [-] 发货通知导出副作用去重与派发职责收口

## Phase D - 回单 / 库存 / 预警 / 成本

- [-] 回单导入加入重复检测
- [-] 回单导入加入人工复核池
- [-] 派发动作去重，避免重复扣库存
- [x] 预警规则执行器化
- [x] 成本库更新时机校准

## Phase E - 测试与回归

- [-] 核心 API 集成测试
- [x] 权限矩阵回归断言
- [x] 订单录入 / 派发 / 回单 / 导出 E2E 冒烟测试
- [-] 样例 Excel / JSON 测试夹具
- [-] 导出记录下载状态夹具
- [-] 导出结果契约夹具
- [-] 导出交互表达夹具
- [-] 导出下载路由 / 结果页集成校验
- [-] `export_records` 重生成不新增新记录的契约回归
- [-] 发货通知 -> 导出记录 -> 重生成下载 跨页 UI 回归
- [-] 导出验收总入口（Acceptance）统一收口
- [x] 回归验收清单
- [x] UI 级导出交互验证

## Phase F - 页面适配与可用性

- [-] 收口全局布局在移动端的顶部留白与侧栏行为
- [-] 修复订单录入页的窄屏布局、动作区和表单栅格
- [-] 修复订单中心的窄屏头部、筛选区和预警侧栏
- [-] 修复发货通知 / 回单导入等表格页的窄屏布局
- [-] 修复角色 / 预警 / SKU 映射等管理页的窄屏布局与弹窗宽度
- [-] 修复用户 / 客户 / 商品 / 模板等管理页的窄屏布局、表格横向滚动和弹窗宽度
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
- [x] 订单中心预警侧链已补齐：`/api/alert-records` 已接服务端权限守卫，订单中心的预警拉取与“标记已读”已透传认证头，并修正为与后端一致的 `ids` 批量更新语义
- [x] 档案管理中的客户 / 商品主链已补首轮权限闭环：`/api/customers*`、`/api/products*` 已接服务端权限守卫，对应页面已补 `PageGuard`、认证头透传，以及新增 / 编辑 / 删除 / 批量交接 / 导入等首轮按钮级禁用
- [x] 档案管理中的发货方 / 仓库主链已补首轮权限闭环：`/api/suppliers*`、`/api/shippers*`、`/api/warehouses*` 已接服务端权限守卫，`suppliers-manage / warehouses-manage` 页面已补 `PageGuard`、认证头透传，以及新增 / 编辑 / 删除 / 导入等首轮按钮级禁用
- [x] 档案管理总入口与导入侧边角已补权限闭环：`archive` 总览页已按权限透传统计请求、禁用模块导入入口并补无权兜底；`/api/import/customers|products|suppliers|skuMappings`、`/api/import`、`/api/product-mappings` 已补服务端权限守卫
- [x] 权限回归脚本已补齐并跑通：新增 `check:permissions`，已覆盖 customers / products / suppliers / alert-records / reports 这批关键 401/403 契约，避免页面/API 收口后再悄悄回退
- [x] 权限改动后的基线校验已通过：`ts-check`、相关 `eslint`、`check:api-contracts`
- [x] 预警规则执行器已落地并补齐回归：新增 `/api/alert-rules/execute` 与共享执行器 `src/lib/alert-executor.ts`，支持库存不足、待派发超时、回单超时三类规则的批量执行、未处理预警复用以及条件恢复后的自动关闭；预警中心规则页已补“执行全部规则 / 单条执行”入口，且新增 `check:alert-executor` 回归脚本，已覆盖三类规则的“新增 / 复用 / 自动关闭”行为
- [x] 成本库更新时机已完成第一轮校准：已新增共享生命周期工具 `src/lib/order-cost-history.ts`，把派发时的成本写入改成“首次派发冻结、重复派发复用”，并让回单确认 / 自动匹配 / 手动匹配统一补齐物流与回单日期，费用录入则改为按订单总额分摊到商品行，避免多商品订单把运费重复记多次；同时已补 `check:order-cost-history` 脚本覆盖“派发 -> 费用 -> 回单 -> 重复派发”主链，当前代码侧已通过 `ts-check`，脚本在本沙箱里因本地 PostgreSQL 连接受限未能实跑
- [x] 报表口径与状态机已完成第一轮对齐：`feedbacked` 已并入“回单阶段”统计，首页与销售/供应商分析不再把它漏掉；回单匹配/确认链路已统一回写 `orders.returned_at`，回单时效分析开始具备真实回单时间点；同时顺手修正了报表中的供应商活跃口径和库存金额字段来源
- [x] 报表 API 契约回归已补入口：新增 `check:api-reports` 与 `scripts/validate-api-reports.ts`，用最小样例覆盖 `pending / assigned / partial_returned / returned / feedbacked / completed / cancelled` 七种状态，并锁住 `stats / sales-performance / supplier-analysis / return-timeline` 四条报表接口的关键口径；当前脚本在本沙箱里仍因本地 PostgreSQL 连接受限未能实跑
- [x] 页面层残留状态口径已完成首轮清理：首页总览已拆开“精确状态计数”和“回单阶段聚合计数”，避免把 `feedbacked` 同时算进“已回单”和“已反馈”；报表页回单时效 CSV 已改为使用真实 `avgDispatchDays`；订单中心批次摘要已把 `feedbacked` 纳入“回单阶段”筛选
- [-] 剩余高风险页面与 API 的权限矩阵继续收口中
  - 本轮已补 `export / returns / match / order-cost-history / order-parse / column-mappings` 这批高风险 API 的服务端权限守卫，并让 `order-cost-history / order-parse` 两页补上 `PageGuard` 与 `x-user-info` 透传；当前 `ts-check` 已通过，针对性 `eslint` 无新增错误，仅保留仓库原有 warning
  - 本轮继续补首页与 SKU 映射侧边角：`page / sku-mappings` 已补 `PageGuard` 与认证头透传，SKU 映射页新增 / 导入 / 编辑 / 删除 / 启停已按 `products:edit / delete` 收口；同时 `product-mappings/[id]` 与 `product-mappings/batch` 已补服务端权限守卫
  - 本轮继续补 AI 配置侧边角：`agent-configs / ai-logs` 页面已补 `PageGuard` 与认证头透传，Agent 配置页的新建 / 编辑 / 删除 / 启停 / 测试已按 `agent_configs:edit` 收口；同时 `agent-configs* / ai-logs / ai-test` 已补服务端权限守卫
  - 本轮继续补遗留 API 守卫并扩权权限回归：`export-feedback* / product-match / templates/default|fields|link / shipping-exports/batch/[id] / permissions / fetch-url / admin/clear` 已补服务端权限守卫；`check:permissions` 入口已扩到 `permissions / fetch-url / agent-configs / ai-logs / ai-test`，但当前沙箱因 `listen EPERM` 无法本地起服实跑
- [x] 页面适配尾差已继续推进四轮：`agent-configs / ai-logs / archive / roles / templates / users / orders / shipping-export / return-receipt / customers / suppliers-manage / products / export-records / alerts / warehouses-manage / reports / order-cost-history / stocks / page / order-parse / sku-mappings` 已补齐一批移动端按钮换行、表格横向滚动、对话框安全宽度和弹窗底部按钮堆叠；当前 `ts-check` 已通过，针对性 `eslint` 无新增错误，仅保留仓库原有 warning
- [x] 全局布局与侧栏移动端行为已补尾差：`src/app/(app)/layout.tsx` 现已避免移动端继承桌面折叠宽度，打开抽屉时会锁定背景滚动，切换路由后会自动收起侧栏；当前 `ts-check` 与针对性 `eslint` 已通过
- [x] 页面适配已补统一验收入口：新增 `check:layout-acceptance` 与 `scripts/validate-layout-acceptance.ts`，当前会校验关键页面适配清单文档结构、`ts-check` 与整批关键页面的错误级 `eslint`，为后续页面收口提供固定回归命令
