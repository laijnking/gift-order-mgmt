# Next Action

当前唯一下一步：

1. 真实数据库验证与起服型权限回归在当前沙箱同时受阻：本地 PostgreSQL 仍报 `EPERM 127.0.0.1:5432`，本地服务监听也会报 `listen EPERM 0.0.0.0:5000`；因此按无人值守队列自动顺延到第 4 项，继续处理页面层适配与交互尾差清理。
2. 页面适配优先顺序：先扫管理页表格横向滚动、筛选区换行、弹窗宽度和动作区拥挤，再回头补对应页面的固定验收记录。
3. 一旦数据库或本地起服环境恢复，立即切回 [UNATTENDED_QUEUE.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_QUEUE.md) 的第 1 项和第 3 项，补跑 `check:api-reports`、`check:api-contracts`、`check:order-cost-history`、`check:permissions`。

执行约定：

- 完成后立即更新本文件为新的唯一下一步
- 与此同时同步更新：
  - [UNATTENDED_EXECUTION_CHECKLIST.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_EXECUTION_CHECKLIST.md)
  - [UNATTENDED_QUEUE.md](/root/project/gift-order-mgmt/docs/codex/UNATTENDED_QUEUE.md)
  - [2026-04-19-系统体检与无人值守执行方案.md](/root/project/gift-order-mgmt/docs/codex/2026-04-19-系统体检与无人值守执行方案.md)
- 每次恢复工作时，优先读取本文件，再决定是否展开其他文档
