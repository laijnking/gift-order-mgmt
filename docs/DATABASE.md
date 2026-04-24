# 数据库设计文档

> 本文档由 schema.ts 自动生成，最后更新时间：2026-04-24

## 目录

- [1. ER 图](#1-er-图)
- [2. 表结构](#2-表结构)
  - [2.1 用户与权限](#21-用户与权限)
  - [2.2 客户管理](#22-客户管理)
  - [2.3 供应商管理](#23-供应商管理)
  - [2.4 商品管理](#24-商品管理)
  - [2.5 仓库管理](#25-仓库管理)
  - [2.6 订单管理](#26-订单管理)
  - [2.7 库存管理](#27-库存管理)
  - [2.8 回单管理](#28-回单管理)
  - [2.9 导出管理](#29-导出管理)
  - [2.10 映射配置](#210-映射配置)
  - [2.11 预警管理](#211-预警管理)
  - [2.12 模板管理](#212-模板管理)
  - [2.13 AI 与日志](#213-ai-与日志)
- [3. 数据类型说明](#3-数据类型说明)

---

## 1. ER 图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  customers  │────▶│   orders    │◀────│ suppliers   │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ code        │     │ customer_id │     │ code        │
│ name        │     │ supplier_id │     │ name        │
│ salesperson │     │ status      │     │ type        │
└─────────────┘     │ items       │     └─────────────┘
      │             └─────────────┘            │
      │                   │                    │
      │                   ▼                    ▼
      │             ┌─────────────┐     ┌─────────────┐
      │             │return_records    │ stocks      │
      │             └─────────────┘     ├─────────────┤
      │                                   │ id          │
      │                                   │ supplier_id │
      │                                   │ product_code│
      │                                   └─────────────┘
      │                                         │
      ▼                                         ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │     │ products    │     │ warehouses  │
├─────────────┤     ├─────────────┤     ├─────────────┤
│ id          │     │ id          │     │ id          │
│ username    │     │ code        │     │ code        │
│ role        │     │ name        │     │ name        │
└─────────────┘     │ brand       │     └─────────────┘
                    │ category    │
                    └─────────────┘
```

---

## 2. 表结构

### 2.1 用户与权限

#### users (用户)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| username | varchar(50) | NOT NULL, UNIQUE | 用户名 |
| password_hash | varchar(255) | NOT NULL | 密码哈希 |
| real_name | varchar(100) | | 真实姓名 |
| role | varchar(20) | DEFAULT 'operator' | 角色 |
| department | varchar(100) | | 部门 |
| is_active | boolean | DEFAULT true | 是否启用 |
| last_login_at | timestamp | | 最后登录时间 |
| phone | varchar(20) | | 电话 |
| email | varchar(100) | | 邮箱 |
| remark | text | | 备注 |
| data_scope | varchar(20) | DEFAULT 'self' | 数据范围 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### roles (角色)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 角色代码 |
| name | varchar(50) | NOT NULL | 角色名称 |
| description | text | | 描述 |
| data_scope | varchar(20) | DEFAULT 'self' | 数据范围 |
| is_system | boolean | DEFAULT false | 是否系统角色 |
| is_active | boolean | DEFAULT true | 是否启用 |
| sort_order | integer | DEFAULT 0 | 排序 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### permissions (权限)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 权限代码 |
| name | varchar(100) | NOT NULL | 权限名称 |
| category | varchar(50) | | 分类 |
| description | text | | 描述 |
| parent_id | uuid | | 父权限ID |
| sort_order | integer | DEFAULT 0 | 排序 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

#### role_permissions (角色权限关联)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| role_id | uuid | NOT NULL, FK→roles | 角色ID |
| permission_id | uuid | NOT NULL, FK→permissions | 权限ID |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

---

### 2.2 客户管理

#### customers (客户)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 客户编码 |
| name | varchar(200) | NOT NULL | 客户名称 |
| type | varchar(20) | DEFAULT 'normal' | 类型 |
| contact | varchar(100) | | 联系人 |
| phone | varchar(20) | | 电话 |
| mobile | varchar(20) | | 手机 |
| address | varchar(500) | | 地址 |
| region | varchar(50) | | 区域 |
| province | varchar(50) | | 省份 |
| city | varchar(50) | | 城市 |
| district | varchar(50) | | 区县 |
| contact_person | varchar(100) | | 联系人 |
| contact_phone | varchar(20) | | 联系电话 |
| contact_email | varchar(100) | | 联系邮箱 |
| salesperson_id | uuid | | 业务员ID |
| salesperson_name | varchar(50) | | 业务员姓名 |
| order_taker_id | uuid | | 跟单员ID |
| order_taker_name | varchar(50) | | 跟单员姓名 |
| credit_limit | numeric(12,2) | | 信用额度 |
| payment_days | integer | DEFAULT 0 | 账期天数 |
| payment_status | varchar(20) | DEFAULT 'normal' | 付款状态 |
| settlement_cycle | varchar(20) | | 结算周期 |
| status | varchar(20) | DEFAULT 'active' | 状态 |
| remark | text | | 备注 |
| created_by | uuid | | 创建人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

---

### 2.3 供应商管理

#### suppliers (供应商)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | | 供应商编码 |
| name | varchar(200) | NOT NULL | 供应商名称 |
| short_name | varchar(100) | | 简称 |
| type | varchar(20) | NOT NULL | 类型 |
| contact | varchar(100) | | 联系人 |
| send_type | varchar(20) | NOT NULL | 发货方式 |
| province | varchar(50) | | 省份 |
| city | varchar(50) | | 城市 |
| can_jd | boolean | DEFAULT false | 是否支持京东 |
| express_restrictions | jsonb | DEFAULT [] | 快递限制 |
| cost_factor | integer | DEFAULT 100 | 成本系数 |
| remark | text | | 备注 |
| contact_person | varchar(100) | | 联系人 |
| contact_phone | varchar(20) | | 联系电话 |
| is_active | boolean | DEFAULT true | 是否启用 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | | 更新时间 |

#### shippers (发货方)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 发货方编码 |
| name | varchar(200) | NOT NULL | 发货方名称 |
| short_name | varchar(100) | | 简称 |
| type | varchar(20) | NOT NULL | 类型 |
| contact_person | varchar(100) | | 联系人 |
| contact_phone | varchar(20) | | 联系电话 |
| province | varchar(50) | | 省份 |
| city | varchar(50) | | 城市 |
| address | varchar(500) | | 地址 |
| send_type | varchar(20) | NOT NULL | 发货方式 |
| jd_channel_id | varchar(50) | | 京东渠道ID |
| pdd_shop_id | varchar(50) | | 拼多多店铺ID |
| can_jd | boolean | DEFAULT false | 是否支持京东 |
| can_pdd | boolean | DEFAULT false | 是否支持拼多多 |
| express_restrictions | jsonb | DEFAULT [] | 快递限制 |
| settlement_type | varchar(20) | | 结算方式 |
| cost_factor | numeric(5,4) | | 成本系数 |
| contact | varchar(100) | | 联系人 |
| phone | varchar(20) | | 电话 |
| region | varchar(50) | | 区域 |
| api_config | jsonb | | API配置 |
| is_active | boolean | DEFAULT true | 是否启用 |
| sort_order | integer | DEFAULT 0 | 排序 |
| remark | text | | 备注 |
| created_by | uuid | | 创建人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

---

### 2.4 商品管理

#### products (商品)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 商品编码 |
| name | varchar(200) | NOT NULL | 商品名称 |
| sku | varchar(50) | | SKU |
| barcode | varchar(50) | | 条码 |
| brand | varchar(100) | | 品牌 |
| category | varchar(100) | | 分类 |
| spec | varchar(200) | | 规格 |
| unit | varchar(20) | | 单位 |
| size | varchar(50) | | 尺寸 |
| weight | numeric(8,3) | | 重量 |
| cost_price | numeric(12,2) | DEFAULT 0 | 成本价 |
| retail_price | numeric(12,2) | DEFAULT 0 | 零售价 |
| lifecycle_status | varchar(20) | DEFAULT '在售' | 生命周期状态 |
| is_active | boolean | DEFAULT true | 是否启用 |
| length | numeric(8,2) | | 长度 |
| width | numeric(8,2) | | 宽度 |
| height | numeric(8,2) | | 高度 |
| volume | numeric(10,4) | | 体积 |
| length_cm | numeric(8,2) | | 长度(cm) |
| width_cm | numeric(8,2) | | 宽度(cm) |
| height_cm | numeric(8,2) | | 高度(cm) |
| weight_kg | numeric(8,3) | | 重量(kg) |
| volume_factor | integer | DEFAULT 6000 | 体积系数 |
| image_url | varchar(500) | | 图片URL |
| description | text | | 描述 |
| remark | text | | 备注 |
| created_by | uuid | | 创建人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

---

### 2.5 仓库管理

#### warehouses (仓库)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 仓库编码 |
| name | varchar(200) | NOT NULL | 仓库名称 |
| short_name | varchar(100) | | 简称 |
| type | varchar(20) | NOT NULL | 类型 |
| address | varchar(500) | | 地址 |
| contact | varchar(100) | | 联系人 |
| phone | varchar(20) | | 电话 |
| province | varchar(50) | | 省份 |
| city | varchar(50) | | 城市 |
| contact_person | varchar(100) | | 联系人 |
| contact_phone | varchar(20) | | 联系电话 |
| status | varchar(20) | DEFAULT 'active' | 状态 |
| remark | text | | 备注 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

---

### 2.6 订单管理

#### orders (订单)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar(36) | PK | 主键 |
| order_no | varchar(100) | NOT NULL | 客户订单号 |
| supplier_order_no | varchar(100) | | 供应商订单号 |
| status | varchar(30) | NOT NULL, DEFAULT 'pending' | 状态 |
| items | jsonb | NOT NULL, DEFAULT [] | 商品明细 |
| receiver_name | varchar(100) | NOT NULL | 收货人 |
| receiver_phone | varchar(20) | NOT NULL | 收货电话 |
| receiver_address | text | NOT NULL | 收货地址 |
| province | varchar(50) | | 省份 |
| city | varchar(50) | | 城市 |
| district | varchar(50) | | 区县 |
| customer_code | varchar(50) | | 客户代码 |
| customer_name | varchar(100) | | 客户名称 |
| salesperson | varchar(50) | | 业务员 |
| supplier_id | varchar(36) | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| express_company | varchar(50) | | 快递公司 |
| tracking_no | varchar(100) | | 快递单号 |
| source | varchar(20) | NOT NULL, DEFAULT 'excel' | 来源 |
| import_batch | varchar(50) | | 导入批次 |
| assigned_batch | varchar(50) | | 派发批次 |
| match_code | varchar(20) | | 匹配码 |
| remark | text | | 备注 |
| express_requirement | varchar(200) | | 快递要求 |
| sys_order_no | varchar(50) | | 系统订单号 |
| operator_name | varchar(50) | DEFAULT '' | 操作员 |
| bill_no | varchar(100) | | 账单号 |
| bill_date | varchar(50) | | 账单日期 |
| warehouse | varchar(100) | | 仓库 |
| discount | numeric(10,2) | | 折扣 |
| tax_rate | numeric(5,2) | | 税率 |
| amount | numeric(12,2) | | 金额 |
| income_name | varchar(100) | | 收款人 |
| income_amount | numeric(12,2) | | 收款金额 |
| invoice_required | boolean | | 是否需要发票 |
| salesperson_id | uuid | | 业务员ID |
| operator_id | uuid | | 操作员ID |
| customer_id | uuid | | 客户ID |
| warehouse_id | varchar(100) | | 仓库ID |
| express_fee | numeric(12,2) | | 快递费 |
| other_fee | numeric(12,2) | | 其他费用 |
| returned_at | timestamp | | 回单时间 |
| ext_field_1~20 | text | | 扩展字段 |
| created_at | timestamp | NOT NULL, DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | | 更新时间 |
| assigned_at | timestamp | | 派发时间 |
| completed_at | timestamp | | 完成时间 |

#### dispatch_records (派发记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar(36) | PK | 主键 |
| order_id | varchar(36) | NOT NULL | 订单ID |
| supplier_id | varchar(36) | NOT NULL | 供应商ID |
| supplier_name | varchar(200) | NOT NULL | 供应商名称 |
| warehouse_id | varchar(36) | | 仓库ID |
| batch_no | varchar(50) | NOT NULL | 批次号 |
| dispatch_at | timestamp | NOT NULL, DEFAULT NOW() | 派发时间 |
| status | varchar(20) | NOT NULL, DEFAULT 'sent' | 状态 |
| items | jsonb | NOT NULL, DEFAULT [] | 商品明细 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### order_cost_history (订单成本历史)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| order_id | uuid | NOT NULL | 订单ID |
| order_no | varchar(50) | | 订单号 |
| match_code | varchar(50) | | 匹配码 |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| warehouse_id | uuid | | 仓库ID |
| warehouse_name | varchar(100) | | 仓库名称 |
| product_code | varchar(50) | | 商品编码 |
| product_name | varchar(200) | | 商品名称 |
| quantity | integer | | 数量 |
| unit_cost | numeric(12,2) | | 单位成本 |
| total_cost | numeric(12,2) | | 总成本 |
| express_fee | numeric(12,2) | | 快递费 |
| other_fee | numeric(12,2) | | 其他费用 |
| total_amount | numeric(12,2) | | 总金额 |
| express_company | varchar(50) | | 快递公司 |
| tracking_no | varchar(100) | | 快递单号 |
| receiver_name | varchar(50) | | 收货人 |
| receiver_phone | varchar(20) | | 收货电话 |
| receiver_address | varchar(500) | | 收货地址 |
| customer_code | varchar(50) | | 客户代码 |
| customer_name | varchar(100) | | 客户名称 |
| salesperson | varchar(50) | | 业务员 |
| operator_name | varchar(50) | | 操作员 |
| order_date | date | | 订单日期 |
| shipped_date | date | | 发货日期 |
| returned_date | date | | 回单日期 |
| dispatch_batch | varchar(50) | | 派发批次 |
| remark | text | | 备注 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

---

### 2.7 库存管理

#### stocks (库存)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| product_id | uuid | NOT NULL | 商品ID |
| product_code | varchar(50) | | 商品编码 |
| product_name | varchar(200) | | 商品名称 |
| supplier_id | uuid | NOT NULL | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| warehouse_id | uuid | | 仓库ID |
| warehouse_name | varchar(100) | | 仓库名称 |
| quantity | integer | DEFAULT 0 | 库存数量 |
| reserved_quantity | integer | DEFAULT 0 | 预留数量 |
| unit_price | numeric(12,2) | | 单价 |
| min_stock | integer | DEFAULT 0 | 最小库存 |
| max_stock | integer | | 最大库存 |
| in_transit | integer | DEFAULT 0 | 在途数量 |
| status | varchar(20) | DEFAULT 'active' | 状态 |
| last_stock_in_at | timestamp | | 最后入库时间 |
| last_stock_out_at | timestamp | | 最后出库时间 |
| remark | text | | 备注 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### stock_versions (库存版本历史)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| stock_id | uuid | | 库存ID |
| product_code | varchar(50) | | 商品编码 |
| product_name | varchar(200) | | 商品名称 |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| warehouse_id | uuid | | 仓库ID |
| warehouse_name | varchar(100) | | 仓库名称 |
| before_quantity | integer | | 变更前库存 |
| after_quantity | integer | | 变更后库存 |
| change_quantity | integer | | 库存变化 |
| before_price | numeric(12,2) | | 变更前价格 |
| after_price | numeric(12,2) | | 变更后价格 |
| change_price | numeric(12,2) | | 价格变化 |
| change_type | varchar(20) | NOT NULL | 变更类型 |
| change_reason | text | | 变更原因 |
| reference_id | varchar(50) | | 关联ID |
| operator | varchar(50) | | 操作人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

#### price_history (价格历史)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| product_code | varchar(50) | | 商品编码 |
| product_name | varchar(200) | | 商品名称 |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| before_price | numeric(12,2) | | 原价 |
| after_price | numeric(12,2) | | 新价 |
| change_price | numeric(12,2) | | 价格变化 |
| change_type | varchar(20) | NOT NULL | 变更类型 |
| change_reason | text | | 变更原因 |
| effective_from | timestamp | DEFAULT NOW() | 生效时间 |
| effective_to | timestamp | | 失效时间 |
| operator | varchar(50) | | 操作人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

---

### 2.8 回单管理

#### return_records (回单记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| order_id | uuid | | 订单ID |
| order_no | varchar(50) | | 订单号 |
| express_company | varchar(50) | NOT NULL | 快递公司 |
| tracking_no | varchar(100) | NOT NULL | 快递单号 |
| returned_at | timestamp | | 回单时间 |
| matched_by | varchar(20) | | 匹配方式 |
| match_confidence | numeric(5,2) | | 匹配置信度 |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| operator | varchar(50) | | 操作员 |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 状态 |
| remark | text | | 备注 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

#### return_receipts (回单收据)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| receipt_no | varchar(50) | | 收据号 |
| record_id | varchar(36) | NOT NULL | 记录ID |
| customer_id | varchar(36) | | 客户ID |
| order_id | varchar(36) | | 订单ID |
| supplier_id | varchar(36) | NOT NULL | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| customer_order_no | varchar(50) | | 客户订单号 |
| express_company | varchar(50) | | 快递公司 |
| tracking_no | varchar(100) | | 快递单号 |
| ship_date | date | | 发货日期 |
| quantity | integer | | 数量 |
| price | numeric(12,2) | | 价格 |
| remark | text | | 备注 |
| match_status | varchar(20) | DEFAULT 'pending' | 匹配状态 |
| matched_at | timestamp | | 匹配时间 |
| supplier_order_no | varchar(50) | | 供应商订单号 |
| warehouse | varchar(100) | | 仓库 |
| order_id_key | uuid | | 订单ID密钥 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### return_receipt_records (回单收据记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| supplier_id | varchar(36) | NOT NULL | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| product_id | uuid | | 商品ID |
| quantity | integer | | 数量 |
| price | numeric(12,2) | | 价格 |
| file_url | text | NOT NULL | 文件URL |
| file_name | varchar(100) | | 文件名 |
| total_count | integer | DEFAULT 0 | 总数 |
| matched_count | integer | DEFAULT 0 | 已匹配数 |
| unmatched_count | integer | DEFAULT 0 | 未匹配数 |
| imported_by | varchar(50) | | 导入人 |
| imported_at | timestamp | DEFAULT NOW() | 导入时间 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| supplier_order_no | varchar(50) | | 供应商订单号 |
| warehouse | varchar(100) | | 仓库 |

---

### 2.9 导出管理

#### export_records (导出记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| export_type | varchar(20) | NOT NULL | 导出类型 |
| business_type | varchar(20) | | 业务类型 |
| supplier_id | uuid | | 供应商ID |
| customer_id | uuid | | 客户ID |
| order_ids | jsonb | | 订单ID列表 |
| template_id | uuid | | 模板ID |
| template_name | varchar(100) | | 模板名称 |
| file_url | text | | 文件URL |
| file_name | varchar(255) | | 文件名 |
| zip_file_url | text | | 压缩文件URL |
| zip_file_name | varchar(255) | | 压缩文件名 |
| total_count | integer | DEFAULT 0 | 总数 |
| exported_by | varchar(50) | | 导出人 |
| exported_at | timestamp | | 导出时间 |
| filter_conditions | jsonb | | 筛选条件 |
| metadata | jsonb | | 元数据 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

#### batch_export_details (批量导出详情)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| batch_id | uuid | NOT NULL | 批次ID |
| order_id | uuid | | 订单ID |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| file_url | text | | 文件URL |
| file_name | varchar(255) | | 文件名 |
| status | varchar(20) | DEFAULT 'pending' | 状态 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

---

### 2.10 映射配置

#### product_mappings (商品映射)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | varchar | PK | 主键(VARCHAR类型) |
| product_id | uuid | | 商品ID |
| product_code | varchar(50) | | 商品编码 |
| product_name | varchar(200) | | 商品名称 |
| customer_id | uuid | | 客户ID |
| customer_code | varchar(50) | | 客户编码 |
| customer_name | varchar(100) | | 客户名称 |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| customer_sku | varchar(50) | | 客户SKU |
| customer_barcode | varchar(50) | | 客户条码 |
| customer_product_name | varchar | NOT NULL | 客户商品名称 |
| price | numeric | | 价格 |
| is_active | boolean | DEFAULT true | 是否启用 |
| remark | text | | 备注 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### customer_product_mappings (客户商品映射)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| customer_id | uuid | NOT NULL | 客户ID |
| customer_code | varchar(50) | | 客户编码 |
| customer_name | varchar(100) | | 客户名称 |
| customer_product_code | varchar(50) | | 客户商品编码 |
| customer_product_name | varchar(200) | NOT NULL | 客户商品名称 |
| customer_product_model | varchar(200) | | 客户商品型号 |
| product_id | uuid | | 系统商品ID |
| product_code | varchar(50) | | 系统商品编码 |
| product_name | varchar(100) | | 系统商品名称 |
| product_model | varchar(100) | | 系统商品型号 |
| is_active | boolean | DEFAULT true | 是否启用 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### product_customer_mappings (商品客户映射)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| product_id | uuid | | 商品ID |
| customer_id | uuid | | 客户ID |
| customer_product_code | varchar(50) | | 客户商品编码 |
| customer_product_name | varchar(100) | | 客户商品名称 |
| supplier_product_code | varchar(50) | | 供应商商品编码 |
| supplier_product_name | varchar(100) | | 供应商商品名称 |
| price | numeric(12,2) | DEFAULT 0 | 价格 |
| is_active | boolean | DEFAULT true | 是否启用 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### column_mappings (列映射)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| customer_code | varchar(50) | NOT NULL | 客户代码 |
| mapping_config | jsonb | NOT NULL, DEFAULT {} | 映射配置 |
| header_row | integer | DEFAULT 0 | 表头行号 |
| version | integer | DEFAULT 1 | 版本 |
| is_active | boolean | DEFAULT true | 是否启用 |
| created_by | varchar(50) | | 创建人 |
| remark | text | | 备注 |
| source_headers | jsonb | DEFAULT [] | 源表头 |
| header_fingerprint | varchar(64) | | 表头指纹 |
| template_signature | varchar(64) | | 模板签名 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

---

### 2.11 预警管理

#### alert_rules (预警规则)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| name | varchar(100) | NOT NULL | 规则名称 |
| code | varchar(50) | NOT NULL, UNIQUE | 规则代码 |
| type | varchar(20) | NOT NULL | 规则类型 |
| config | jsonb | NOT NULL, DEFAULT {} | 规则配置 |
| priority | integer | DEFAULT 5 | 优先级 |
| is_enabled | boolean | DEFAULT true | 是否启用 |
| notification_channels | jsonb | | 通知渠道 |
| description | text | | 描述 |
| remark | text | | 备注 |
| created_by | uuid | | 创建人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### alert_records (预警记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| rule_id | uuid | | 规则ID |
| rule_code | varchar(50) | | 规则代码 |
| order_id | uuid | | 订单ID |
| order_no | varchar(50) | | 订单号 |
| stock_id | uuid | | 库存ID |
| alert_type | varchar(20) | NOT NULL | 预警类型 |
| alert_level | varchar(20) | NOT NULL | 预警级别 |
| title | varchar(200) | NOT NULL | 预警标题 |
| content | text | NOT NULL | 预警内容 |
| data | jsonb | | 附加数据 |
| is_read | boolean | DEFAULT false | 是否已读 |
| is_resolved | boolean | DEFAULT false | 是否已处理 |
| resolved_at | timestamp | | 处理时间 |
| resolved_by | varchar(50) | | 处理人 |
| resolution | text | | 解决方案 |
| customer_code | varchar(50) | | 客户代码 |
| product_code | varchar(50) | | 商品编码 |
| supplier_id | uuid | | 供应商ID |
| supplier_name | varchar(100) | | 供应商名称 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

---

### 2.12 模板管理

#### templates (模板)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(100) | | 模板代码 |
| name | varchar(100) | NOT NULL | 模板名称 |
| description | text | | 描述 |
| type | varchar(20) | NOT NULL | 类型 |
| target_type | varchar(20) | | 目标类型 |
| target_id | uuid | | 目标ID |
| target_name | varchar(100) | | 目标名称 |
| field_mappings | jsonb | NOT NULL, DEFAULT {} | 字段映射 |
| config | jsonb | NOT NULL, DEFAULT {} | 配置 |
| is_default | boolean | DEFAULT false | 是否默认 |
| is_active | boolean | DEFAULT true | 是否启用 |
| created_by | uuid | | 创建人 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### template_fields (模板字段)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| template_id | uuid | NOT NULL, FK→templates | 模板ID |
| field_id | varchar(50) | NOT NULL | 字段ID |
| field_name | varchar(50) | NOT NULL | 字段名称 |
| source_table | varchar(50) | | 源表 |
| source_field | varchar(50) | | 源字段 |
| is_required | boolean | DEFAULT false | 是否必填 |
| order_num | integer | DEFAULT 0 | 排序 |
| width | integer | DEFAULT 100 | 宽度 |
| format | varchar(50) | | 格式 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

#### template_links (模板链接)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| template_id | uuid | NOT NULL, FK→templates | 模板ID |
| link_type | varchar(20) | NOT NULL | 链接类型 |
| partner_id | uuid | NOT NULL | 合作伙伴ID |
| partner_name | varchar(100) | | 合作伙伴名称 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

---

### 2.13 AI 与日志

#### agent_configs (Agent 配置)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| code | varchar(50) | NOT NULL, UNIQUE | 配置代码 |
| name | varchar(100) | NOT NULL | 配置名称 |
| type | varchar(20) | DEFAULT 'custom' | 类型 |
| description | text | | 描述 |
| prompt_template | text | NOT NULL | Prompt模板 |
| model | varchar(50) | DEFAULT 'doubao-seed' | 模型 |
| temperature | numeric(3,2) | DEFAULT 0.7 | 温度参数 |
| max_tokens | integer | DEFAULT 2000 | 最大Token数 |
| config | jsonb | | 配置 |
| is_active | boolean | DEFAULT true | 是否启用 |
| is_default | boolean | DEFAULT false | 是否默认 |
| test_input | text | | 测试输入 |
| test_output | text | | 测试输出 |
| test_status | varchar(20) | | 测试状态 |
| run_count | integer | DEFAULT 0 | 运行次数 |
| success_count | integer | DEFAULT 0 | 成功次数 |
| fail_count | integer | DEFAULT 0 | 失败次数 |
| avg_duration_ms | integer | DEFAULT 0 | 平均耗时(ms) |
| last_run_at | timestamp | | 最后运行时间 |
| remark | text | | 备注 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |
| updated_at | timestamp | DEFAULT NOW() | 更新时间 |

#### ai_logs (AI 日志)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| agent_id | uuid | | Agent ID |
| agent_code | varchar(50) | | Agent代码 |
| agent_name | varchar(100) | | Agent名称 |
| input | text | NOT NULL | 输入 |
| output | text | | 输出 |
| status | varchar(20) | DEFAULT 'success' | 状态 |
| duration_ms | integer | | 耗时(ms) |
| model | varchar(50) | | 模型 |
| config | jsonb | | 配置 |
| metadata | jsonb | | 元数据 |
| error_message | text | | 错误信息 |
| created_at | timestamp | DEFAULT NOW() | 创建时间 |

#### health_check (健康检查)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | uuid | PK | 主键 |
| status | varchar(20) | DEFAULT 'ok' | 状态 |
| message | text | | 消息 |
| checked_at | timestamp | DEFAULT NOW() | 检查时间 |

---

## 3. 数据类型说明

### 3.1 订单状态 (status)
- `pending`: 待派发
- `assigned`: 已派发
- `partial_returned`: 部分回单
- `returned`: 已回单
- `completed`: 已完成
- `cancelled`: 已取消

### 3.2 供应商类型 (type)
- `warehouse`: 自有仓库（优先）
- `jd`: 京东渠道
- `pdd`: 拼多多渠道

### 3.3 库存变更类型 (change_type)
- `manual`: 手动调整
- `import`: 批量导入
- `order`: 订单扣减
- `adjust`: 系统调整
- `contract`: 合同价
- `market`: 市场价

### 3.4 预警级别 (alert_level)
- `critical`: 紧急
- `error`: 错误
- `warning`: 警告
- `info`: 信息

### 3.5 回单状态 (status)
- `pending`: 待匹配
- `matched`: 已匹配
- `partial`: 部分匹配
- `unmatched`: 未匹配

### 3.6 用户角色 (role)
- `admin`: 管理员
- `operator`: 操作员
- `salesperson`: 业务员
- `order_taker`: 跟单员

### 3.7 商品生命周期状态 (lifecycle_status)
- `在售`: 在售
- `停售`: 停售
- `预售`: 预售
