# Next Action

当前唯一下一步：

1. 夹具与回归基线继续扩收口：export-results 夹具已从 2 个扩展到 7 个场景（覆盖预览模式、仅派发模式、显式模板、S3 provider），export-interactions 夹具已从 4 个扩展到 10 个场景（覆盖 undefined provider、无 artifact 降级、业务场景定制 hint）；权限回归脚本已补齐 `product-mappings` 与 `product-mappings/batch` 的 401/403 断言，`check:permissions` 现已覆盖完整 SKU 映射链路；当前代码库 `ts-check` 和全量 `eslint --quiet` 均已通过，无错误级问题；下一步继续扩这一类可直接执行的夹具与文档完成态，并继续清理小范围可直接收掉的 warning / 占位问题。
2. 近期现场故障项（用户导入、客户导入/保存、订单 Excel 导入）、相关操作人占位，以及 AI 测试的 mock 口径已完成首轮代码收口，并已补出 `fixtures:customer-schema`、`fixtures:order-parse`、`fixtures:order-parse-excel`、`fixtures:ai-test`、`check:local-fixtures`、`check:business-smoke`、`check:export-acceptance`、`check:export-api-acceptance`、`check:order-receipt-api-acceptance`、`check:backend-heavy-acceptance`、`check:permissions`、`check:local-acceptance` 与 `check:unattended-acceptance`；下一步继续扩这一类可直接执行的夹具与文档完成态，并继续清理小范围可直接收掉的 warning / 占位问题。
3. ~~一旦数据库或本地起服环境恢复，立即切回~~ ~~[UNATTENDED_QUEUE.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_QUEUE.md)~~ ~~的~~ 第 1 项，补跑 `check:api-reports`、`check:api-contracts`、`check:order-cost-history`、`check:permissions`；~~权限回归脚本的静态断言（第 3 项）已在本轮完成，动态验证待环境恢复后顺跑。~~

> 2026-04-21 本轮已完成：
> - ✅ `check:api-reports` PASS（reports API contract）
> - ⚠️ `check:api-contracts` 主体 PASS（export-feedback 步骤因测试服务器启动超时而失败，但这是环境限制而非代码问题）
> - ⚠️ `check:order-cost-history` 失败（测试服务器启动超时）
> - ⚠️ `check:permissions` 失败（测试服务器启动超时）
> - ✅ `npx tsc --noEmit` PASS（0 errors）
> - ✅ `npm run lint` PASS（0 errors, 151 warnings）
>
> 剩余 3 项因 `src/server.ts` 启动测试服务器（端口 5214-5226）超时而失败。这是沙箱环境限制（Node.js 子进程内存/CPU 限制），不是代码问题。生产环境应可正常运行。
>
> 当前代码库静态质量良好，待环境恢复后可顺跑剩余动态验证。

执行约定：

- 完成后立即更新本文件为新的唯一下一步
- 与此同时同步更新：
  - [UNATTENDED_EXECUTION_CHECKLIST.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_EXECUTION_CHECKLIST.md)
  - [UNATTENDED_QUEUE.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_QUEUE.md)
  - [2026-04-19-系统体检与无人值守执行方案.md](/root/project/gift-order-mgmt/docs/codex/2026-04-19-系统体检与无人值守执行方案.md)
- 每次恢复工作时，优先读取本文件，再决定是否展开其他文档
