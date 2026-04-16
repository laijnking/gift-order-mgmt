# 数据库设计文档

## 1. ER 图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  customers  │       │   orders    │       │ suppliers   │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │◀──┐   │ id          │   ┌──▶│ id          │
│ name        │   │   │ customer_id │───┘   │ name        │
│ code        │   │   │ supplier_id│───┐   │ type        │
│ salesperson │   │   │ status      │   │   │ express_*   │
│ order_taker │   │   │ items       │   │   └─────────────┘
└─────────────┘   │   │ receiver    │   │
      │          │   └─────────────┘   │       ┌─────────────┐
      │          │         │          │       │   stocks    │
      │          │         │          └──────▶├─────────────┤
      │          │         │                  │ id          │
      │          │         │                  │ supplier_id │
      ▼          │         ▼                  │ product_code│
┌─────────────┐   │   ┌─────────────┐         └─────────────┘
│   users     │   │   │return_records│              │
├─────────────┤   │   ├─────────────┤              │
│ id          │   │   │ id          │              ▼
│ name        │   │   │ order_id    │        ┌─────────────┐
│ role        │   │   │ tracking_no │        │ products    │
│ username    │   │   └─────────────┘        ├─────────────┤
└─────────────┘   │                           │ id          │
                  │                           │ sku         │
                  │                           │ brand       │
                  │                           │ category    │
                  └───────────────────────────┴─────────────┘
```

## 2. 表结构

### 2.1 核心业务表

#### suppliers (供应商)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(255) | NOT NULL | 供应商名称 |
| code | VARCHAR(100) | UNIQUE | 供应商编码 |
| type | VARCHAR(50) | | 类型(warehouse/jd/pdd) |
| short_name | VARCHAR(100) | | 简称 |
| contact | VARCHAR(100) | | 联系人 |
| phone | VARCHAR(50) | | 联系电话 |
| send_type | VARCHAR(50) | | 发货方式 |
| province | VARCHAR(50) | | 所在省份 |
| can_jd | BOOLEAN | DEFAULT true | 是否支持京东 |
| express_restrictions | JSONB | | 快递限制 |
| settlement_type | VARCHAR(50) | | 结算方式 |
| cost_factor | DECIMAL(5,2) | | 成本系数 |
| is_active | BOOLEAN | DEFAULT true | 是否启用 |
| status | VARCHAR(50) | | 状态 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### customers (客户)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(255) | NOT NULL | 客户名称 |
| code | VARCHAR(100) | UNIQUE | 客户编码 |
| salesperson_id | UUID | FK→users | 业务员ID |
| order_taker_id | UUID | FK→users | 跟单员ID |
| contact | VARCHAR(100) | | 联系人 |
| phone | VARCHAR(50) | | 联系电话 |
| address | TEXT | | 地址 |
| status | VARCHAR(50) | | 状态 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### products (商品)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(255) | NOT NULL | 商品名称 |
| sku | VARCHAR(100) | UNIQUE | SKU编码 |
| brand | VARCHAR(100) | | 品牌 |
| category | VARCHAR(100) | | 分类 |
| unit_price | DECIMAL(10,2) | | 单价 |
| status | VARCHAR(50) | | 状态(in_sale/stop_sale/pre_sale) |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### warehouses (仓库)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(255) | NOT NULL | 仓库名称 |
| code | VARCHAR(100) | UNIQUE | 仓库编码 |
| type | VARCHAR(50) | | 类型(self/third_party) |
| address | TEXT | | 地址 |
| contact | VARCHAR(100) | | 联系人 |
| phone | VARCHAR(50) | | 联系电话 |
| status | VARCHAR(50) | | 状态 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### users (用户/员工)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(100) | NOT NULL | 姓名 |
| username | VARCHAR(100) | UNIQUE | 用户名 |
| password | VARCHAR(255) | | 密码(加密) |
| role | VARCHAR(50) | | 角色(admin/salesperson/order_taker) |
| phone | VARCHAR(50) | | 电话 |
| email | VARCHAR(100) | | 邮箱 |
| status | VARCHAR(50) | | 状态 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

### 2.2 订单业务表

#### orders (订单)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| order_no | VARCHAR(100) | | 客户订单号 |
| sys_order_no | VARCHAR(100) | UNIQUE | 系统订单号 |
| status | VARCHAR(50) | | 状态 |
| items | JSONB | | 商品明细 |
| receiver_name | VARCHAR(100) | | 收货人 |
| receiver_phone | VARCHAR(50) | | 收货电话 |
| receiver_address | TEXT | | 收货地址 |
| customer_id | UUID | FK→customers | 客户ID |
| customer_code | VARCHAR(100) | | 客户代码 |
| customer_name | VARCHAR(255) | | 客户名称 |
| salesperson | VARCHAR(100) | | 业务员 |
| salesperson_id | UUID | FK→users | 业务员ID |
| operator | VARCHAR(100) | | 跟单员 |
| operator_id | UUID | FK→users | 跟单员ID |
| supplier_id | UUID | FK→suppliers | 供应商ID |
| supplier_name | VARCHAR(255) | | 供应商名称 |
| express_requirement | TEXT | | 快递要求 |
| express_company | VARCHAR(100) | | 快递公司 |
| tracking_no | VARCHAR(100) | | 快递单号 |
| match_code | VARCHAR(100) | | 匹配码 |
| remark | TEXT | | 备注 |
| assigned_batch | VARCHAR(100) | | 派发批次 |
| assigned_at | TIMESTAMP | | 派发时间 |
| ext_field_1~20 | TEXT | | 备用字段 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### return_records (回单记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| order_id | UUID | FK→orders | 订单ID |
| supplier_id | UUID | FK→suppliers | 供应商ID |
| supplier_name | VARCHAR(255) | | 供应商名称 |
| batch_no | VARCHAR(100) | | 批次号 |
| express_company | VARCHAR(100) | | 快递公司 |
| tracking_no | VARCHAR(100) | | 快递单号 |
| quantity | INTEGER | | 数量 |
| return_at | TIMESTAMP | | 回单时间 |
| created_at | TIMESTAMP | | 创建时间 |

### 2.3 库存业务表

#### stocks (库存)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| supplier_id | UUID | FK→suppliers | 供应商ID |
| supplier_name | VARCHAR(255) | | 供应商名称 |
| product_code | VARCHAR(100) | NOT NULL | 商品编码 |
| product_name | VARCHAR(255) | | 商品名称 |
| quantity | INTEGER | DEFAULT 0 | 库存数量 |
| in_transit | INTEGER | DEFAULT 0 | 在途数量 |
| price | DECIMAL(10,2) | | 单价 |
| warehouse_id | UUID | FK→warehouses | 仓库ID |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### stock_versions (库存版本历史)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| stock_id | UUID | FK→stocks | 库存记录ID |
| product_code | VARCHAR(100) | NOT NULL | 商品编码 |
| product_name | VARCHAR(255) | | 商品名称 |
| supplier_id | UUID | FK→suppliers | 供应商ID |
| supplier_name | VARCHAR(255) | | 供应商名称 |
| before_quantity | INTEGER | | 变更前库存 |
| after_quantity | INTEGER | NOT NULL | 变更后库存 |
| change_quantity | INTEGER | | 库存变化 |
| before_price | DECIMAL(10,2) | | 变更前价格 |
| after_price | DECIMAL(10,2) | | 变更后价格 |
| change_price | DECIMAL(10,2) | | 价格变化 |
| change_type | VARCHAR(50) | | 变更类型 |
| change_reason | TEXT | | 变更原因 |
| operator | VARCHAR(100) | | 操作人 |
| created_at | TIMESTAMP | | 创建时间 |

#### price_history (价格历史)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| product_code | VARCHAR(100) | NOT NULL | 商品编码 |
| product_name | VARCHAR(255) | | 商品名称 |
| supplier_id | UUID | FK→suppliers | 供应商ID |
| supplier_name | VARCHAR(255) | | 供应商名称 |
| before_price | DECIMAL(10,2) | | 原价 |
| after_price | DECIMAL(10,2) | NOT NULL | 新价 |
| change_price | DECIMAL(10,2) | | 价格变化 |
| change_type | VARCHAR(50) | | 变更类型 |
| change_reason | TEXT | | 变更原因 |
| operator | VARCHAR(100) | | 操作人 |
| effective_from | TIMESTAMP | | 生效时间 |
| effective_to | TIMESTAMP | | 失效时间 |
| created_at | TIMESTAMP | | 创建时间 |

### 2.4 映射表

#### product_mappings (商品映射)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| customer_id | UUID | FK→customers | 客户ID |
| customer_product_name | VARCHAR(255) | | 客户商品名称 |
| customer_product_code | VARCHAR(100) | | 客户商品编码 |
| system_product_code | VARCHAR(100) | | 系统商品编码 |
| system_product_name | VARCHAR(255) | | 系统商品名称 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

### 2.5 配置表

#### templates (导入模板)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(255) | NOT NULL | 模板名称 |
| type | VARCHAR(50) | NOT NULL | 模板类型 |
| field_mappings | JSONB | | 字段映射 |
| sample_data | JSONB | | 示例数据 |
| is_default | BOOLEAN | DEFAULT false | 是否默认 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### alert_rules (预警规则)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(255) | NOT NULL | 规则名称 |
| code | VARCHAR(100) | UNIQUE | 规则编码 |
| type | VARCHAR(50) | NOT NULL | 规则类型 |
| config | JSONB | | 规则配置 |
| priority | INTEGER | DEFAULT 0 | 优先级 |
| is_enabled | BOOLEAN | DEFAULT true | 是否启用 |
| notification_channels | JSONB | | 通知渠道 |
| description | TEXT | | 规则描述 |
| created_at | TIMESTAMP | | 创建时间 |
| updated_at | TIMESTAMP | | 更新时间 |

#### alert_records (预警记录)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| rule_id | UUID | FK→alert_rules | 规则ID |
| rule_code | VARCHAR(100) | | 规则编码 |
| order_id | UUID | FK→orders | 订单ID |
| order_no | VARCHAR(100) | | 订单号 |
| customer_code | VARCHAR(100) | | 客户代码 |
| product_code | VARCHAR(100) | | 商品编码 |
| supplier_id | UUID | FK→suppliers | 供应商ID |
| supplier_name | VARCHAR(255) | | 供应商名称 |
| alert_type | VARCHAR(50) | NOT NULL | 预警类型 |
| alert_level | VARCHAR(20) | | 预警级别 |
| title | VARCHAR(255) | NOT NULL | 预警标题 |
| content | TEXT | | 预警内容 |
| data | JSONB | | 附加数据 |
| is_read | BOOLEAN | DEFAULT false | 是否已读 |
| is_resolved | BOOLEAN | DEFAULT false | 是否已处理 |
| resolved_at | TIMESTAMP | | 处理时间 |
| resolved_by | VARCHAR(100) | | 处理人 |
| created_at | TIMESTAMP | | 创建时间 |

#### ai_logs (AI 日志)

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| agent_type | VARCHAR(50) | | Agent类型 |
| input | TEXT | | 输入 |
| output | TEXT | | 输出 |
| status | VARCHAR(50) | | 状态 |
| error | TEXT | | 错误信息 |
| duration | INTEGER | | 耗时(ms) |
| created_at | TIMESTAMP | | 创建时间 |

## 3. 索引设计

| 表名 | 索引字段 | 类型 | 说明 |
|------|----------|------|------|
| orders | customer_code | B-Tree | 按客户筛选 |
| orders | supplier_id | B-Tree | 按供应商筛选 |
| orders | status | B-Tree | 按状态筛选 |
| orders | created_at | B-Tree | 按时间排序 |
| orders | match_code | B-Tree | 回单匹配 |
| stocks | product_code | B-Tree | 按商品查询 |
| stocks | supplier_id | B-Tree | 按供应商查询 |
| stock_versions | product_code | B-Tree | 历史追溯 |
| price_history | product_code | B-Tree | 价格历史 |
| alert_records | is_read | B-Tree | 未读预警 |

## 4. 数据类型说明

### 4.1 订单状态 (status)
- `pending`: 待派发
- `assigned`: 已派发
- `partial_returned`: 部分回单
- `returned`: 已回单
- `completed`: 已完成
- `cancelled`: 已取消

### 4.2 供应商类型 (type)
- `warehouse`: 自有仓库（优先）
- `jd`: 京东渠道
- `pdd`: 拼多多渠道

### 4.3 预警级别 (alert_level)
- `critical`: 紧急
- `error`: 错误
- `warning`: 警告
- `info`: 信息

### 4.4 变更类型 (change_type)
- `manual`: 手动调整
- `import`: 批量导入
- `order`: 订单扣减
- `adjust`: 系统调整
- `contract`: 合同价
- `market`: 市场价
