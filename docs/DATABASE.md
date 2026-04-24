# 数据库设计文档

## 1. ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  customers  │       │   orders    │       │ suppliers   │  ← API层档案
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◀──┐   │ id          │   ┌──▶│ id          │
│ name        │   │   │ customer_id │───┘   │ name        │
│ code        │   │   │ supplier_id│───┐   │ type        │
│ salesperson │   │   │ status      │   │   │ send_type   │
└─────────────┘   │   │ items       │   │   └─────────────┘
      │          │   │ receiver    │   │       ┌─────────────┐
      │          │   └─────────────┘   │       │ shippers    │  ← 前端发货方管理
      │          │         │          │       ├─────────────┤
      │          │         │          └──────▶│ id          │
      │          │         │                  │ type        │  supplier/jd/pdd/self
      ▼          │         ▼                  └─────────────┘
┌─────────────┐   │   ┌─────────────┐               │
│   users     │   │   │   stocks    │               │
├─────────────┤   │   ├─────────────┤               │
│ id          │   │   │ supplier_id │───────────────┘
│ name        │   │   │ warehouse_id│───┐
│ role        │   │   │ product_id │   │   ┌─────────────┐
└─────────────┘   │   └─────────────┘   └──▶│ products    │
                  │                       ├─────────────┤
                  ▼                       │ id          │
        ┌─────────────────┐               │ code (SKU) │
        │product_mappings │               └─────────────┘
        ├─────────────────┤
        │ mapping_type: customer / supplier
        │ customer_id / supplier_id
        │ product_id
        └─────────────────┘
```

## 2. 供应商档案系统说明

> **重要：存在两套并行的供应商档案表，需注意区分使用场景。**

| 表名 | 使用场景 | 特点 |
|------|----------|------|
| `suppliers` | 订单/报表等业务 API | API 层实际使用，部分字段较旧 |
| `shippers` | 前端发货方管理页面 | 字段更丰富，支持京东/拼多多渠道 |

**关联方式**：通过 `code` 字段可建立对应关系（理想情况下 `code` 应唯一）。

**后续建议**：统一使用一个表，避免数据不一致。

## 3. 表结构

### 3.1 suppliers（供应商档案 - API 层）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| code | VARCHAR(100) | | 供应商编码 |
| name | VARCHAR(255) | NOT NULL | 供应商名称 |
| short_name | VARCHAR(100) | | 简称 |
| type | VARCHAR(50) | NOT NULL | 类型：supplier/jd/self/third_party |
| contact | VARCHAR(100) | | 联系人姓名 |
| contact_person | VARCHAR(100) | | 联系人姓名（同 contact） |
| contact_phone | VARCHAR(50) | | 联系电话 |
| phone | VARCHAR(50) | | 联系电话（同 contact_phone） |
| send_type | VARCHAR(50) | NOT NULL | 发货方式：download/jd/pdd/self |
| province | VARCHAR(50) | | 所在省份 |
| city | VARCHAR(50) | | 所在城市 |
| can_jd | BOOLEAN | DEFAULT true | 是否支持京东发货 |
| express_restrictions | JSONB | | 禁止使用的快递列表（JSON 数组） |
| cost_factor | INTEGER | | 成本系数（百分比，如 100 表示 1.0） |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| remark | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

> 注意：`suppliers` 表中没有 `settlement_type` 字段（该字段仅在 `shippers` 表中存在）。

### 3.2 shippers（发货方档案 - 前端发货方管理页面）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| code | VARCHAR(255) | NOT NULL | 发货方编码 |
| name | VARCHAR(255) | NOT NULL | 发货方名称 |
| type | VARCHAR(50) | NOT NULL | 类型：supplier/jd/pdd/self/third_party |
| send_type | VARCHAR(50) | NOT NULL | 发货方式：download/jd/pdd/self |
| short_name | VARCHAR(100) | | 简称 |
| contact_person | VARCHAR(100) | | 联系人 |
| contact_phone | VARCHAR(50) | | 联系电话 |
| contact | VARCHAR(100) | | 联系人姓名（同 contact_person） |
| phone | VARCHAR(50) | | 联系电话（同 contact_phone） |
| province | VARCHAR(50) | | 所在省份 |
| city | VARCHAR(50) | | 所在城市 |
| address | VARCHAR(255) | | 详细地址 |
| jd_channel_id | VARCHAR(255) | | 京东渠道 ID（仅 type=jd 时有效） |
| pdd_shop_id | VARCHAR(255) | | 拼多多店铺 ID（仅 type=pdd 时有效） |
| can_jd | BOOLEAN | DEFAULT false | 是否支持京东发货 |
| can_pdd | BOOLEAN | DEFAULT false | 是否支持拼多多发货 |
| express_restrictions | JSONB | | 禁止使用的快递列表 |
| settlement_type | VARCHAR(50) | | 结算方式：prepaid/monthly/per_order |
| cost_factor | NUMERIC | | 成本系数 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| sort_order | INTEGER | | 排序 |
| api_config | JSONB | | API 配置（扩展字段） |
| remark | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.3 customers（客户档案）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| code | VARCHAR(255) | NOT NULL | 客户编码 |
| name | VARCHAR(255) | NOT NULL | 客户名称 |
| type | VARCHAR(50) | DEFAULT 'normal' | 类型 |
| status | VARCHAR(50) | DEFAULT 'active' | 状态 |
| salesperson_id | UUID | | 业务员 ID |
| salesperson_name | VARCHAR(255) | | 业务员姓名 |
| order_taker_id | UUID | | 跟单员 ID |
| order_taker_name | VARCHAR(255) | | 跟单员姓名 |
| contact | VARCHAR(100) | | 联系人 |
| contact_person | VARCHAR(100) | | 联系人姓名 |
| phone | VARCHAR(50) | | 联系电话 |
| mobile | VARCHAR(50) | | 手机号 |
| contact_phone | VARCHAR(50) | | 联系电话 |
| contact_email | VARCHAR(255) | | 联系邮箱 |
| address | VARCHAR(255) | | 地址 |
| region | VARCHAR(100) | | 地区 |
| district | VARCHAR(100) | | 区县 |
| credit_limit | NUMERIC | DEFAULT 0 | 信用额度 |
| settlement_cycle | VARCHAR(50) | | 结算周期 |
| remark | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.4 products（商品档案）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键（uuid_generate_v4） |
| code | VARCHAR(255) | NOT NULL | 商品编码（SKU） |
| name | VARCHAR(255) | NOT NULL | 商品名称 |
| sku | VARCHAR(255) | | SKU 编码（与 code 类似） |
| brand | VARCHAR(255) | | 品牌 |
| category | VARCHAR(255) | | 分类 |
| unit | VARCHAR(50) | DEFAULT '台' | 单位 |
| spec | VARCHAR(255) | | 规格型号 |
| barcode | VARCHAR(255) | | 条码 |
| unit_price | NUMERIC | | 单价 |
| cost_price | NUMERIC | DEFAULT 0 | 成本价 |
| retail_price | NUMERIC | | 零售价 |
| status | VARCHAR(50) | DEFAULT 'active' | 状态 |
| lifecycle_status | VARCHAR(50) | DEFAULT '在售' | 生命周期状态 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| weight | NUMERIC | | 重量 |
| length | NUMERIC | | 长度（备用） |
| width | NUMERIC | | 宽度（备用） |
| height | NUMERIC | | 高度（备用） |
| length_cm | NUMERIC | | 长度 cm |
| width_cm | NUMERIC | | 宽度 cm |
| height_cm | NUMERIC | | 高度 cm |
| weight_kg | NUMERIC | | 重量 kg |
| volume | NUMERIC | | 体积 |
| volume_factor | INTEGER | DEFAULT 6000 | 体积系数 |
| size | VARCHAR(100) | | 尺寸 |
| description | TEXT | | 商品描述 |
| remark | TEXT | | 备注 |
| image_url | VARCHAR(500) | | 商品图片 URL |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.5 warehouses（仓库档案）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键（uuid_generate_v4） |
| code | VARCHAR(255) | NOT NULL | 仓库编码 |
| name | VARCHAR(255) | NOT NULL | 仓库名称 |
| type | VARCHAR(50) | | 类型：self/third_party |
| short_name | VARCHAR(100) | | 简称 |
| address | VARCHAR(255) | | 地址 |
| province | VARCHAR(100) | | 省份 |
| city | VARCHAR(100) | | 城市 |
| contact | VARCHAR(100) | | 联系人 |
| contact_person | VARCHAR(100) | | 联系人姓名 |
| contact_phone | VARCHAR(50) | | 联系电话 |
| phone | VARCHAR(50) | | 联系电话 |
| status | VARCHAR(50) | DEFAULT 'active' | 状态 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| remark | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.6 orders（订单）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | VARCHAR(36) | PK | 主键（gen_random_uuid） |
| order_no | VARCHAR(255) | NOT NULL | 客户订单号 |
| sys_order_no | VARCHAR(255) | | 系统订单号 |
| status | VARCHAR(50) | NOT NULL | 状态：pending/assigned/partial_returned/returned/completed/cancelled |
| source | VARCHAR(50) | DEFAULT 'excel' | 来源：excel/api |
| items | JSONB | NOT NULL | 商品明细 |
| receiver_name | VARCHAR(255) | NOT NULL | 收货人姓名 |
| receiver_phone | VARCHAR(255) | NOT NULL | 收货人电话 |
| receiver_address | TEXT | NOT NULL | 收货人地址 |
| province | VARCHAR(100) | | 省份 |
| city | VARCHAR(100) | | 城市 |
| district | VARCHAR(100) | | 区县 |
| customer_id | UUID | | 关联客户 ID |
| customer_code | VARCHAR(255) | | 客户编码 |
| customer_name | VARCHAR(255) | | 客户名称 |
| salesperson | VARCHAR(100) | | 业务员姓名 |
| salesperson_id | UUID | | 业务员 ID |
| supplier_id | VARCHAR(255) | | 关联发货方 ID（suppliers.id） |
| supplier_name | VARCHAR(255) | | 发货方名称 |
| supplier_order_no | VARCHAR(255) | | 供应商订单号 |
| warehouse | VARCHAR(255) | | 仓库名称 |
| warehouse_id | VARCHAR(255) | | 仓库 ID |
| express_company | VARCHAR(100) | | 快递公司 |
| express_requirement | VARCHAR(255) | | 快递要求 |
| tracking_no | VARCHAR(100) | | 快递单号 |
| express_fee | NUMERIC | | 快递费 |
| other_fee | NUMERIC | | 其他费用 |
| match_code | VARCHAR(100) | | 匹配码（回单匹配用） |
| assigned_batch | VARCHAR(100) | | 派发批次 |
| assigned_at | TIMESTAMPTZ | | 派发时间 |
| completed_at | TIMESTAMPTZ | | 完成时间 |
| returned_at | TIMESTAMPTZ | | 回单时间 |
| amount | NUMERIC | | 订单金额 |
| discount | NUMERIC | | 折扣 |
| tax_rate | NUMERIC | | 税率 |
| invoice_required | BOOLEAN | | 是否需要发票 |
| income_name | VARCHAR(255) | | 收款人姓名 |
| income_amount | NUMERIC | | 收款金额 |
| bill_no | VARCHAR(100) | | 账单编号 |
| bill_date | VARCHAR(100) | | 账单日期 |
| import_batch | VARCHAR(100) | | 导入批次 |
| operator_name | VARCHAR(100) | | 操作员姓名 |
| remark | TEXT | | 备注 |
| ext_field_1~20 | TEXT | | 备用扩展字段 |
| created_at | TIMESTAMPTZ | NOT NULL | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.7 stocks（库存档案）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键（gen_random_uuid） |
| supplier_id | UUID | NOT NULL | 关联发货方 ID（suppliers.id） |
| supplier_name | VARCHAR(255) | | 发货方名称（冗余） |
| warehouse_id | UUID | | 关联仓库 ID |
| warehouse_name | VARCHAR(255) | | 仓库名称（冗余） |
| product_id | UUID | NOT NULL | 关联商品 ID |
| product_code | VARCHAR(255) | | 商品编码 |
| product_name | VARCHAR(255) | | 商品名称 |
| quantity | INTEGER | DEFAULT 0 | 当前库存数量 |
| reserved_quantity | INTEGER | DEFAULT 0 | 预占数量（订单占用但未出库） |
| available_quantity | INTEGER | | 可用数量 = quantity - reserved_quantity |
| unit_price | NUMERIC | | 单价 |
| min_stock | INTEGER | DEFAULT 0 | 最低库存预警阈值 |
| max_stock | INTEGER | | 最高库存阈值 |
| status | VARCHAR(50) | DEFAULT 'active' | 状态 |
| in_transit | INTEGER | DEFAULT 0 | 在途数量 |
| last_stock_in_at | TIMESTAMPTZ | | 最后入库时间 |
| last_stock_out_at | TIMESTAMPTZ | | 最后出库时间 |
| remark | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.8 stock_versions（库存版本历史）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键（gen_random_uuid） |
| stock_id | UUID | | 关联库存记录 ID |
| product_code | VARCHAR(255) | | 商品编码 |
| product_name | VARCHAR(255) | | 商品名称 |
| supplier_id | UUID | | 关联发货方 ID |
| supplier_name | VARCHAR(255) | | 发货方名称（冗余） |
| warehouse_id | UUID | | 关联仓库 ID |
| warehouse_name | VARCHAR(255) | | 仓库名称（冗余） |
| before_quantity | INTEGER | | 变更前库存 |
| after_quantity | INTEGER | NOT NULL | 变更后库存 |
| change_quantity | INTEGER | | 库存变化 = after - before |
| before_price | NUMERIC | | 变更前价格 |
| after_price | NUMERIC | | 变更后价格 |
| change_price | NUMERIC | | 价格变化 = after - before |
| change_type | VARCHAR(50) | NOT NULL | 变更类型：manual/import/order/adjust |
| change_reason | TEXT | | 变更原因 |
| reference_id | VARCHAR(255) | | 关联单据 ID（如订单 ID） |
| operator | VARCHAR(100) | | 操作人 |
| created_at | TIMESTAMPTZ | | 创建时间 |

### 3.9 product_mappings（商品映射档案）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键（gen_random_uuid） |
| product_id | UUID | | 关联系统商品 ID |
| product_code | VARCHAR(255) | | 系统商品编码 |
| product_name | VARCHAR(255) | | 系统商品名称 |
| customer_id | UUID | | 关联客户 ID（仅 mapping_type=customer 时有效） |
| customer_code | VARCHAR(255) | | 客户编码 |
| customer_name | VARCHAR(255) | | 客户名称 |
| supplier_id | UUID | | 关联发货方 ID（仅 mapping_type=supplier 时有效） |
| supplier_name | VARCHAR(255) | | 发货方名称 |
| customer_sku | VARCHAR(255) | | 客户/发货方商品 SKU 编码 |
| customer_barcode | VARCHAR(255) | | 客户/发货方商品条码 |
| customer_product_name | VARCHAR(255) | NOT NULL | 客户/发货方商品名称（品名） |
| price | NUMERIC | | 客户/发货方采购价格 |
| mapping_type | VARCHAR(50) | DEFAULT 'customer' | 映射类型：customer/supplier |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| remark | TEXT | | 备注 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

### 3.10 users（用户档案）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键（uuid_generate_v4） |
| username | VARCHAR(100) | UNIQUE | 用户名 |
| password | VARCHAR(255) | | 密码（加密） |
| name | VARCHAR(100) | NOT NULL | 姓名 |
| role | VARCHAR(50) | | 角色：admin/salesperson/order_taker |
| phone | VARCHAR(50) | | 电话 |
| email | VARCHAR(100) | | 邮箱 |
| status | VARCHAR(50) | | 状态 |
| created_at | TIMESTAMPTZ | | 创建时间 |
| updated_at | TIMESTAMPTZ | | 更新时间 |

## 4. 索引设计

| 表名 | 索引字段 | 类型 | 说明 |
|------|----------|------|------|
| orders | customer_code | B-Tree | 按客户筛选 |
| orders | supplier_id | B-Tree | 按发货方筛选 |
| orders | status | B-Tree | 按状态筛选 |
| orders | created_at | B-Tree | 按时间排序 |
| orders | match_code | B-Tree | 回单匹配 |
| orders | tracking_no | B-Tree | 快递追踪 |
| stocks | product_code | B-Tree | 按商品查询 |
| stocks | supplier_id | B-Tree | 按发货方查询 |
| stocks | warehouse_id | B-Tree | 按仓库查询 |
| stock_versions | stock_id | B-Tree | 历史追溯 |
| price_history | product_code | B-Tree | 价格历史 |
| alert_records | is_read | B-Tree | 未读预警 |
| products | code | B-Tree | SKU 精确查询 |
| products | category | B-Tree | 按分类查询 |
| products | brand | B-Tree | 按品牌查询 |

## 5. 数据类型说明

### 5.1 订单状态 (orders.status)
- `pending`: 待派发
- `assigned`: 已派发
- `partial_returned`: 部分回单
- `returned`: 已回单
- `completed`: 已完成
- `cancelled`: 已取消

### 5.2 发货方类型 (suppliers.type / shippers.type)
- `supplier`: 供应商
- `jd`: 京东渠道
- `pdd`: 拼多多渠道
- `self`: 自有仓库
- `third_party`: 第三方仓库

### 5.3 发货方式 (send_type)
- `download`: 下载发货
- `jd`: 京东发货
- `pdd`: 拼多多发货
- `self`: 自有发货

### 5.4 库存变更类型 (stock_versions.change_type)
- `manual`: 手动调整
- `import`: 批量导入
- `order`: 订单扣减
- `adjust`: 系统调整

### 5.5 价格变更类型 (price_history.change_type)
- `manual`: 手动调整
- `adjust`: 系统调整
- `contract`: 合同价
- `market`: 市场价

### 5.6 预警级别 (alert_records.alert_level)
- `critical`: 紧急
- `error`: 错误
- `warning`: 警告
- `info`: 信息
