# Unattended Queue

用途：

- 作为无人值守推进时的固定任务队列
- 当 `NEXT_ACTION` 所指任务被环境阻塞时，提供自动顺延规则
- 让后续执行不依赖临时口头指令

执行规则：

1. 始终先执行 `NEXT_ACTION`。
2. 如果 `NEXT_ACTION` 因环境阻塞无法推进：
   - 数据库阻塞：跳到本队列中“本地可完成”的下一项
   - Docker / 网络阻塞：跳过依赖部署或外部连接的任务
3. 每完成一项，必须同步更新：
   - `docs/codex/NEXT_ACTION.md`
   - `docs/codex/UNATTENDED_EXECUTION_CHECKLIST.md`
   - `docs/codex/2026-04-19-系统体检与无人值守执行方案.md`
4. 每一项默认做到：
   - 代码落地
   - `ts-check`
   - 针对性 `eslint`
   - 记录阻塞项或残余风险

当前阻塞事实：

- 当前沙箱无法连接本地 PostgreSQL：`EPERM 127.0.0.1:5432`
- 当前沙箱无法访问 Docker daemon
- 当前沙箱无法监听本地服务端口：`listen EPERM 0.0.0.0:5000`

## Queue

1. 真实数据库验证收口
   - 目标：实跑 `check:api-reports`、`check:api-contracts`、`check:order-cost-history`
   - 前置：可连接本地 PostgreSQL
   - 完成标准：三条命令完成，若失败则把回归断言或代码修正补回仓库

2. 剩余权限矩阵全页面一致化
   - 目标：继续清理尚未纳入统一权限模式的页面、按钮和 API
   - 优先范围：
     - 仍未补 `PageGuard` 的页面
     - 已有 `PageGuard` 但按钮级禁用不完整的管理页
     - 仍未接 `requirePermission` 的遗留 API
   - 完成标准：新增变更全部通过 `ts-check` 和针对性 `eslint`

3. 权限回归脚本扩容
  - 目标：把最近新增收口的 `product-mappings`、`agent-configs`、`ai-logs` 等接口补进权限回归
  - 前置：对应页面/API 收口完成
  - 完成标准：`check:permissions` 覆盖新增 401/403 契约
   - 当前阻塞：本沙箱无法本地起服，`check:permissions` 会在 `listen EPERM` 处退出

4. 页面层适配与交互尾差清理
   - 目标：继续扫移动端和中宽度下的管理页、列表页、弹窗页残留问题
   - 优先范围：
     - 管理页表格横向滚动
     - 筛选区换行
     - 弹窗宽度和按钮拥挤
   - 完成标准：页面改动通过 `ts-check`、针对性 `eslint`

5. 测试与夹具补全
   - 目标：把最近新增口径和权限收口补成脚本或夹具
   - 优先范围：
     - 报表状态口径
     - 权限 401/403 回归
     - 成本库生命周期
   - 完成标准：新增命令或脚本可执行，且被文档纳入固定回归入口

## 自动顺延规则

- 若第 1 项因数据库阻塞，自动转到第 2 项。
- 若第 2 项完成，自动转到第 3 项。
- 若第 3 项完成且数据库仍不可用，继续做第 4 项和第 5 项。
- 若第 3 项因本地端口监听受限无法实跑，自动转到第 4 项。
- 一旦数据库环境恢复，优先回到第 1 项。
