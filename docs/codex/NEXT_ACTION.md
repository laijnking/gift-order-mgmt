# Next Action

当前唯一下一步：

1. 页面层适配已补出统一入口 `check:layout-acceptance`，当前沙箱仍受本地 PostgreSQL `EPERM 127.0.0.1:5432` 和本地监听 `listen EPERM 0.0.0.0:5000` 阻塞，因此按无人值守队列从第 4 项切到第 5 项，继续补本地可执行的夹具与回归脚本。
2. 优先顺序：先把最近补过的页面口径、权限收口和成本/报表链路继续固化为脚本或夹具，再回头收紧文档里的完成态。
3. 一旦数据库或本地起服环境恢复，立即切回 [UNATTENDED_QUEUE.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_QUEUE.md) 的第 1 项和第 3 项，补跑 `check:api-reports`、`check:api-contracts`、`check:order-cost-history`、`check:permissions`。

执行约定：

- 完成后立即更新本文件为新的唯一下一步
- 与此同时同步更新：
  - [UNATTENDED_EXECUTION_CHECKLIST.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_EXECUTION_CHECKLIST.md)
  - [UNATTENDED_QUEUE.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_QUEUE.md)
  - [2026-04-19-系统体检与无人值守执行方案.md](/root/project/gift-order-mgmt/docs/codex/2026-04-19-系统体检与无人值守执行方案.md)
- 每次恢复工作时，优先读取本文件，再决定是否展开其他文档
