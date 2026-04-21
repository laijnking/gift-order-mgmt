# Order Parse Fixtures

这些夹具用于固定订单录入的 Excel 映射回归基线。

目录里目前并存两类夹具：

- `fixtures:order-parse` 使用 `headers / columnMapping / expected / expectedMetadata`
- `fixtures:order-parse-excel` 使用顶层 `cases`

当前包含：

- `excel-basic.json`：标准表头、应达到高命中率
- `excel-unrecognized-headers.json`：包含客户自定义列名，验证未识别表头和扩展列统计
- `excel-conflict-fields.json`：重复映射同一系统字段，验证冲突字段和模板签名
- `excel-sheet-payload.json`：验证 Excel 解析使用整张 sheet，而不是只吃前 20 行预览

约定：

- `headers` 表示表头行
- `columnMapping` 表示期望或样例映射
- `rows` 表示数据行
- `expected` 表示当前解析诊断最关键的验收口径
- `expectedMetadata` 表示表头标准化、表头指纹、模板签名等追溯元数据预期

执行方式：

- `corepack pnpm fixtures:order-parse`
- `corepack pnpm fixtures:order-parse-excel`

说明：

- `fixtures:order-parse` 只会读取带 `headers / columnMapping / expected` 的映射诊断夹具
- `excel-sheet-payload.json` 属于 `fixtures:order-parse-excel`，不会参与 `fixtures:order-parse`

当前脚本会校验夹具中的映射诊断预期，先覆盖：

- `coverageRate`
- `recognizedFieldCount`
- `unrecognizedHeaders`
- `conflictFields`
- `normalizedHeaders`
- `headerFingerprint`
- `templateSignature`
