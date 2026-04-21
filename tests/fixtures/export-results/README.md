# 导出结果契约夹具

这组夹具用于验证两条核心导出接口的返回结构是否保持稳定：

- 发货通知导出
- 客户反馈导出

当前重点校验：

- 顶层 `zipFileName / zipFileUrl / artifact / details`
- 明细层 `fileName / fileUrl / artifact / templateSource`
- 下载策略判断所需的最小元信息是否齐全
- 顶层 ZIP 和明细文件的下载路由是否符合统一约定
- 预览模式（无 ZIP / 无持久化 artifact）
- 仅派发模式（无 ZIP、无明细）
- 显式模板来源场景
- S3 对象存储 provider 场景

当前覆盖场景（7 个）：

| 场景 | 说明 |
|------|------|
| `shipping-export-response` | 发货通知 + local provider + 已落盘 |
| `customer-feedback-response` | 客户反馈 + s3 provider + mixed 模板来源 + 已落盘 |
| `shipping-export-preview-mode` | 发货通知预览模式，无 ZIP，无持久化 |
| `customer-feedback-preview-mode` | 客户反馈预览模式，无 ZIP，无持久化 |
| `shipping-export-dispatch-only` | 仅派发模式，无 ZIP，无明细 |
| `shipping-export-explicit-template` | 发货通知 + 显式模板 + 多明细 |
| `customer-feedback-s3-provider` | 客户反馈 + s3 provider |

运行方式：

```bash
corepack pnpm fixtures:export-results
```
