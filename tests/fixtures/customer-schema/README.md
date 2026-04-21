# Customer Schema Fixtures

这些夹具用于固定客户档案新旧 schema 兼容层的回归基线。

当前覆盖：

- `modern` 写入口径：`sales_user_id / operator_user_id / contact_phone / is_active`
- `legacy` 写入口径：`salesperson_id / order_taker_id / phone / status`
- 读取侧统一转换：无论数据库记录来自哪一套字段，页面都拿到同一份客户对象结构

执行方式：

- `corepack pnpm fixtures:customer-schema`
