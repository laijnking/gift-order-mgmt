# 发货导出 - 操作指引

更新时间：2026-04-29

## 1. 功能说明

发货导出模块按发货方生成派发单，支持自定义模板和三种派发模式：预览（preview）、仅派发（dispatch_only）、派发+留痕（dispatch_with_persistence）。

---

## 2. 操作流程

### 2.1 基本操作步骤

#### 步骤1：查询待发货订单
1. 进入「发货导出」页面
2. 系统自动加载「已派发」状态的订单
3. 可按发货方、日期范围等条件筛选

#### 步骤2：选择派发模式
系统支持三种派发模式：

| 模式 | 效果 | 适用场景 |
|------|------|----------|
| 预览 | 生成预览内容，不派发、不扣库存、不写记录 | 确认导出内容 |
| 仅派发 | 派发订单、扣减库存、写入派发记录和成本 | 日常派发 |
| 派发并留痕 | 执行所有副作用，并写入导出记录和文件持久化 | 标准发货流程 |

#### 步骤3：选择模板
1. 点击「选择模板」下拉框
2. 选择发货通知模板（支持发货方专属模板）
3. 系统按以下优先级匹配模板：
   - 优先：发货方专属模板（targetType=supplier + targetId 一致）
   - 其次：用户选择的模板
   - 最后：默认模板

#### 步骤4：预览确认
1. 点击「预览」按钮
2. 查看发货通知内容
3. 确认无误后执行派发

#### 步骤5：下载文件
派发完成后，可下载导出的发货通知单：
- 按发货方拆分订单，生成独立 Excel 文件
- 压缩为 ZIP 包下载

---

## 3. 三种派发模式详解

### 3.1 预览模式 (preview)

**效果**：仅生成预览内容

**副作用**：
- 不派发订单
- 不扣减库存
- 不写派发记录
- 不写成本记录

**适用场景**：
- 确认导出内容格式正确
- 检查订单数据是否完整

### 3.2 仅派发模式 (dispatch_only)

**效果**：派发订单

**副作用**：
- 派发订单，更新状态为 `assigned` 或 `notified`
- 扣减库存
- 写入派发记录 (dispatch_records)
- 写入成本记录 (order_cost_history)

**不执行**：
- 不写导出记录
- 不持久化文件

**适用场景**：
- 只需要派发订单，不需要文件记录
- 后续会通过其他方式导出发货通知

### 3.3 派发并留痕模式 (dispatch_with_persistence)

**效果**：执行所有副作用，并留痕

**副作用**：
- 包含「仅派发」模式的所有副作用
- 写入导出记录 (export_records)
- 文件持久化（本地磁盘或 S3）

**适用场景**：
- 标准发货流程
- 需要留痕和下载的场景

---

## 4. 发货方专属模板

### 4.1 模板匹配优先级

```
1. 命中 targetType=supplier + targetId 一致的模板
2. 通过 template_links 关联的模板
3. fallback 到默认模板 / 第一个可用模板
```

### 4.2 商品字段优先级

在导出时，商品字段来源按以下优先级：

| 场景 | productCode 来源 | productName 来源 | productSpec 来源 |
|------|-----------------|-----------------|-----------------|
| 发货方专属模板（从 dispatchItems） | supplierProductCode | supplierProductName | supplierProductSpec |
| 通用模板（从 dispatchItems） | productCode | productName | productSpec |
| 发货方专属模板（无派发记录） | cu_product_code | cu_product_name | cu_product_spec |
| 通用模板（无派发记录） | product_code | product_name | product_spec |

---

## 5. 数据流转

### 5.1 派发流程

```
用户选择订单 → 选择派发模式 → 选择模板 → 执行派发
                                              ↓
                    ┌─────────────────────────┼─────────────────────────┐
                    ↓                         ↓                         ↓
              preview                  dispatch_only          dispatch_with_persistence
           (仅预览)                   (仅派发)              (派发+留痕)
                    ↓                         ↓                         ↓
              无副作用              扣库存+写记录              全部副作用
```

### 5.2 发货方商品编码快照

派发时，系统会快照写入发货方商品编码：

```
1. 订单派发时，根据 orders.items 中的 product_id 和 supplier_id
2. 调用 findSupplierProductMapping 查询 product_mappings 表
3. 快照写入 dispatch_records.items：
   - supplierProductCode: 发货方商品编码
   - supplierProductName: 发货方商品名称
   - supplierProductSpec: 发货方商品规格
4. 导出时直接从 dispatch_items 读取，不再查询 product_mappings
```

---

## 6. 快捷入口

| 入口 | 目标页面 | 说明 |
|------|----------|------|
| 回单导入 | `/return-receipt` | 导入回单快递信息 |
| 导出记录 | `/export-records` | 查看导出历史 |

---

## 7. 注意事项

### 7.1 库存扣减
- 派发时会扣减对应发货方的库存
- 库存不足时系统会提示

### 7.2 重复派发
- 同一订单重复派发时会复用既有派发记录
- 不会重复扣减库存

### 7.3 文件持久化
- 本地模式：写入 `data/exports/` 目录
- S3 模式：写入对象存储，返回预签名直链

---

## 8. 相关文档

- [核心业务流数据流转](./business-flow) - 模块间数据流转总览
- [订单管理指引](./orders) - 订单查看和派发
- [回单管理指引](./return-receipt) - 回单导入处理
