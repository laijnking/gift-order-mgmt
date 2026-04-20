# 导出结果契约夹具

这组夹具用于验证两条核心导出接口的返回结构是否保持稳定：

- 发货通知导出
- 客户反馈导出

当前重点校验：

- 顶层 `zipFileName / zipFileUrl / artifact / details`
- 明细层 `fileName / fileUrl / artifact / templateSource`
- 下载策略判断所需的最小元信息是否齐全
- 顶层 ZIP 和明细文件的下载路由是否符合统一约定

运行方式：

```bash
corepack pnpm fixtures:export-results
```
