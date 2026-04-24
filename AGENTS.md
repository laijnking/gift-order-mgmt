# 礼品订单管理系统 (Gift Order Management System)

## 项目概述

这是一个礼品一件代发业务的订单管理系统MVP，支持多渠道订单收集、供应商智能匹配、订单自动拆分导出和快递回单管理。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4

## 核心功能

### P0 - 核心功能
1. **订单导入**: 支持Excel多格式解析，自动识别表头
2. **订单列表**: 状态管理、筛选搜索、详情查看
3. **供应商匹配**: 按库存、价格、类型自动推荐供应商
4. **尾货预警**: 库存≤2台时提醒，防止撞单

### P1 - 扩展功能
5. **订单拆分导出**: 按供应商生成独立Excel文件
6. **快递回单**: 导入回传单号，自动匹配订单

### P2 - 档案管理
7. **发货方档案**: 发货方信息管理、供应商/仓库/京东/拼多多渠道统一管理
8. **客户档案**: 客户信息管理、业务员/跟单员分配、批量交接
9. **商品档案**: SKU映射、品牌分类、尺寸重量（运费计算）
10. **历史成本库**: 订单全链路成本记录

## 业务流程

```
客户 ──(微信/表格)──▶ 跟单员 ──▶ 订单中心 ──▶ 匹配供应商 ──▶ 派发订单 ──▶ 供应商回传快递 ──▶ 汇总反馈
```

## API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/orders` | GET | 获取订单列表 |
| `/api/orders` | POST | 导入订单(Excel) |
| `/api/orders` | PATCH | 更新订单状态 |
| `/api/shippers` | GET/POST | 发货方列表/创建 |
| `/api/shippers/[id]` | GET/PUT/DELETE | 发货方详情操作 |
| `/api/customers` | GET/POST | 客户列表/创建 |
| `/api/customers/[id]` | GET/PUT/DELETE | 客户详情操作 |
| `/api/products` | GET/POST | 商品列表/创建 |
| `/api/products/[id]` | GET/PUT/DELETE | 商品详情操作 |
| `/api/users` | GET/POST | 用户列表/创建 |
| `/api/match` | POST | 匹配供应商 |
| `/api/export` | POST | 导出派发单 |
| `/api/returns` | POST | 导入回单 |
| `/api/templates` | GET/POST | 模板列表/创建 |
| `/api/templates/[id]` | GET/PUT/DELETE | 模板详情操作 |
| `/api/stock-versions` | GET/POST | 库存版本历史 |
| `/api/price-history` | GET/POST | 价格历史记录 |
| `/api/order-cost-history` | GET/POST | 历史成本库 |
| `/api/order-cost-history/fee` | PATCH | 更新成本费用 |
| `/api/stocks` | GET | 库存查询 |
| `/api/stocks/import` | POST | 库存导入 |
| `/api/alert-rules` | GET/POST/PATCH | 预警规则管理 |
| `/api/alert-rules/[id]` | GET/PUT/DELETE | 预警规则详情 |
| `/api/alert-records` | GET/POST/PATCH | 预警记录管理 |
| `/api/fetch-url` | POST | 抓取URL内容 |
| `/api/roles` | GET/POST | 角色列表/创建 |
| `/api/roles/[id]` | GET/PUT/DELETE | 角色详情操作 |
| `/api/permissions` | GET | 权限列表 |
| `/api/reports/stats` | GET | 报表统计数据(订单/客户/供应商/库存) |
| `/api/reports/sales-performance` | GET | 销售业绩报表(业务员/跟单员业绩) |
| `/api/reports/supplier-analysis` | GET | 供应商分析报表 |
| `/api/reports/return-timeline` | GET | 回单时效分析报表 |

## 数据库表结构

数据库通过 SQL 迁移脚本管理，位于 `supabase/migrations/` 目录。重要说明：
- **执行顺序**：`001_schema.sql` → `004_migrate-prod-schema.sql` → `007_sync-all-tables.sql` → `008_api-schema-align.sql`
- **管理方式**：所有表通过 SQL 手动管理，不使用 ORM 迁移
- **RLS**：所有表已启用行级安全策略（MVP 阶段为全开放策略）
- **`product_mappings`**：使用 `VARCHAR(36)` 而非 `UUID` 作为主键（见 `001_fix_product_mappings.sql`）

### orders (订单)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(36) | 主键 |
| order_no | varchar(100) | 客户订单号 |
| supplier_order_no | varchar(100) | 供应商单据号 |
| status | varchar(30) | 状态(pending/assigned/partial_returned/returned/feedbacked/completed/cancelled) |
| items | jsonb | 商品明细数组 |
| receiver_name | varchar(100) | 收货人 |
| receiver_phone | varchar(20) | 收货电话 |
| receiver_address | text | 收货地址 |
| province / city / district | varchar | 收货地址省市区 |
| customer_id | uuid | 客户档案ID |
| customer_code | varchar(50) | 客户代码 |
| customer_name | varchar(100) | 客户名称 |
| salesperson_id | uuid | 业务员ID |
| salesperson | varchar(50) | 业务员名称(冗余) |
| operator_id | uuid | 跟单员ID |
| operator_name | varchar(50) | 跟单员名称(冗余) |
| supplier_id | varchar(36) | 供应商ID |
| supplier_name | varchar(100) | 供应商名称(冗余) |
| warehouse_id | varchar(100) | 仓库ID |
| warehouse | varchar(100) | 仓库名称(冗余) |
| express_company | varchar(50) | 快递公司 |
| tracking_no | varchar(100) | 快递单号 |
| source | varchar(20) | 来源(excel/ai_parse/wechat/form/jushuitan) |
| import_batch | varchar(50) | 导入批次号 |
| assigned_batch | varchar(50) | 派发批次号 |
| match_code | varchar(20) | 唯一匹配码 |
| sys_order_no | varchar(50) | 系统订单号 |
| amount / discount / tax_rate | numeric | 订单金额/折扣/税率 |
| income_name / income_amount | varchar/numeric | 收票人/收票金额 |
| invoice_required | boolean | 是否需要发票 |
| express_fee / other_fee | numeric | 快递费/其他费用 |
| returned_at | timestamp | 回单时间 |
| bill_no / bill_date | varchar | 单据编号/日期 |
| ext_field_1~20 | text | 备用扩展字段 |
| assigned_at / completed_at | timestamp | 派发/完成时间 |
| created_at / updated_at | timestamp | 创建/更新时间 |

### customers (客户)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar(50) | 客户编码(唯一) |
| name | varchar(200) | 客户名称 |
| type | varchar(20) | 类型(normal等) |
| contact_person | varchar(100) | 联系人 |
| contact_phone | varchar(20) | 联系电话 |
| contact_email | varchar(100) | 联系邮箱 |
| phone / mobile | varchar | 电话/手机 |
| address | varchar(500) | 地址 |
| province / city / district | varchar | 省市区 |
| salesperson_id | uuid | 业务员ID |
| salesperson_name | varchar(50) | 业务员名称 |
| order_taker_id | uuid | 跟单员ID |
| order_taker_name | varchar(50) | 跟单员名称 |
| credit_limit | numeric | 信用额度 |
| payment_days / payment_status | integer/varchar | 账期/状态 |
| settlement_cycle | varchar | 结算周期 |
| status | varchar(20) | 状态(active/inactive) |
| remark | text | 备注 |

### products (商品)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar(50) | 商品编码(唯一) |
| sku | varchar(50) | SKU别名（前端展示） |
| name | varchar(200) | 商品名称 |
| barcode | varchar(50) | 条码 |
| brand / category | varchar | 品牌/分类 |
| spec | varchar(200) | 规格型号 |
| unit | varchar(20) | 单位(默认"台") |
| size | varchar(50) | 尺寸 |
| weight | decimal | 重量 |
| cost_price / retail_price | numeric | 成本价/零售价 |
| lifecycle_status | varchar(20) | 生命周期(在售/停售等) |
| length / width / height | decimal | 长/宽/高 |
| volume | decimal | 体积 |
| length_cm / width_cm / height_cm | decimal | 长/宽/高(CM) |
| weight_kg | decimal | 重量(KG) |
| volume_factor | integer | 体积重系数(默认6000) |
| is_active | boolean | 是否启用 |

### shippers (发货方)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar(50) | 发货方编码(唯一) |
| name | varchar(200) | 发货方名称 |
| short_name | varchar(100) | 简称 |
| type | varchar(20) | 类型(supplier/jd/pdd/self/third_party) |
| contact_person / contact_phone | varchar | 联系人/电话 |
| province / city | varchar | 省市 |
| address | varchar(500) | 地址 |
| send_type | varchar(20) | 发货方式(download/jd/pdd/self) |
| jd_channel_id / pdd_shop_id | varchar | 京东/拼多多渠道ID |
| can_jd / can_pdd | boolean | 是否支持京东/拼多多 |
| express_restrictions | jsonb | 快递限制 |
| settlement_type | varchar | 结算方式 |
| cost_factor | decimal | 成本系数 |
| is_active | boolean | 是否启用 |

### suppliers (供应商)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar(200) | 供应商名称 |
| short_name | varchar(100) | 简称 |
| type | varchar(20) | 类型(warehouse/supplier) |
| contact / contact_person / contact_phone | varchar | 联系方式 |
| province / city | varchar | 省市 |
| send_type | varchar(20) | 发货方式 |
| can_jd | boolean | 是否支持京东 |
| express_restrictions | jsonb | 快递限制 |
| cost_factor | integer | 成本系数(默认100) |
| is_active | boolean | 是否启用 |

### warehouses (仓库)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar(50) | 仓库编码(唯一) |
| name | varchar(200) | 仓库名称 |
| short_name | varchar(100) | 简称 |
| type | varchar(20) | 类型 |
| address | varchar(500) | 地址 |
| contact_person / contact_phone | varchar | 联系人/电话 |
| province / city | varchar | 省市 |
| status | varchar(20) | 状态 |

### stocks (库存)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| product_id | uuid | 商品ID(NOT NULL) |
| product_code / product_name | varchar | 商品编码/名称 |
| supplier_id | uuid | 供应商ID(NOT NULL) |
| supplier_name | varchar | 供应商名称 |
| warehouse_id / warehouse_name | uuid/varchar | 仓库 |
| quantity / reserved_quantity | integer | 库存/预留数量 |
| available_quantity | integer GENERATED | 可用数量(自动计算) |
| unit_price | numeric | 单价 |
| min_stock / max_stock | integer | 最小/最大库存 |
| status | varchar | 状态 |
| in_transit | integer | 在途数量 |
| UNIQUE(product_id, supplier_id, warehouse_id) | | 唯一约束 |

### stock_versions (库存版本历史)
同 AGENTS.md 原内容，新增 warehouse_id/warehouse_name 字段。

### price_history (价格历史)
同 AGENTS.md 原内容。

### order_cost_history (历史成本库)
同 AGENTS.md 原内容。字段对齐 API 实际使用的 `orders.express_fee` / `orders.other_fee` 写入路径。

### alert_rules (预警规则)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name / code | varchar | 规则名称/编码(唯一) |
| type | varchar | 类型(stock/order/return) |
| config | jsonb | 规则配置 |
| priority | integer | 优先级(默认5) |
| is_enabled | boolean | 是否启用 |
| notification_channels | jsonb | 通知渠道 |
| description / remark | text | 描述/备注 |

### alert_records (预警记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| rule_id / rule_code | uuid/varchar | 关联规则 |
| order_id / order_no | uuid/varchar | 关联订单 |
| stock_id | uuid | 关联库存 |
| customer_code / product_code | varchar | 客户/商品编码(补充字段) |
| supplier_id / supplier_name | uuid/varchar | 供应商(补充字段) |
| alert_type / alert_level | varchar | 类型/级别 |
| title / content | varchar/text | 标题/内容 |
| data | jsonb | 附加数据 |
| is_read / is_resolved | boolean | 已读/已处理 |
| resolved_at / resolved_by | timestamp/varchar | 处理时间/人 |

### roles / permissions / role_permissions
同 AGENTS.md 原内容。

### templates (模板)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar(100) | 模板编码(唯一) |
| name / description | varchar/text | 名称/描述 |
| type | varchar(20) | 类型(shipping/customer_feedback/common) |
| target_type / target_id / target_name | varchar/uuid | 目标关联 |
| field_mappings | jsonb | 字段映射 |
| config | jsonb | 完整配置 |
| is_default / is_active | boolean | 默认/启用状态 |

### product_mappings (SKU映射)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | **varchar**(主键) | 使用VARCHAR而非UUID |
| product_id / product_code / product_name | uuid/varchar | 系统商品信息 |
| customer_id / customer_code / customer_name | uuid/varchar | 客户信息 |
| supplier_id / supplier_name | uuid/varchar | 供应商信息 |
| customer_sku / customer_barcode | varchar | 客户SKU/条码 |
| customer_product_name | **varchar**(NOT NULL) | 客户商品名称 |
| price | numeric | 客户专属价格 |
| is_active | boolean | 是否启用 |

### dispatch_records (派发记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | varchar(36) | 主键 |
| order_id | varchar(36) | 订单ID |
| supplier_id / supplier_name | varchar | 供应商 |
| batch_no | varchar(50) | 派发批次号 |
| dispatch_at | timestamp | 派发时间 |
| status | varchar | 状态(sent/dispatched等) |
| items | jsonb | 派发明细 |

### return_records / return_receipts / return_receipt_records (回单相关)
字段对齐 API 使用，`supplier_id` / `record_id` / `order_id` 使用 `VARCHAR(36)` 类型以支持灵活关联。

### export_records / batch_export_details (导出相关)
同 AGENTS.md 原内容。

### users (用户)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| username | varchar(50)(唯一) | 用户名 |
| password_hash | varchar(255) | 密码哈希 |
| real_name | varchar(100) | 真实姓名 |
| role | varchar(20) | 角色(operator/admin等) |
| department | varchar(100) | 部门 |
| phone / email | varchar | 电话/邮箱 |
| data_scope | varchar(20) | 数据权限(self/department/all) |
| is_active | boolean | 是否启用 |
| last_login_at | timestamp | 最后登录时间 |

## 数据模型

### Order (订单)
```typescript
{
  id: string;              // 内部唯一ID
  sysOrderNo: string;      // 系统订单号（自动生成，全局唯一，格式 SYS-YYYYMMDD-XXXX）
  orderNo: string;         // 客户订单号（客户侧，可能重复）
  status: OrderStatus;     // 订单状态
  items: OrderItem[];      // 商品列表
  receiver: ReceiverInfo;  // 收货信息
  customerCode: string;    // 客户代码
  customerName: string;    // 客户名称
  salespersonName: string; // 业务员名称（来自客户档案）
  operatorName: string;    // 跟单员名称（来自客户档案）
  supplierId?: string;    // 供应商ID
  supplierName?: string;   // 供应商名称
  expressCompany?: string; // 快递公司
  trackingNo?: string;     // 快递单号
  matchCode?: string;      // 唯一匹配码
  extFields?: Record<string, string | null>; // 备用字段(ext_field_1~ext_field_20)
}
```

### OrderStatus (订单状态)
- `pending`: 待派发
- `assigned`: 已派发
- `partial_returned`: 部分回单
- `returned`: 已回单
- `completed`: 已完成
- `cancelled`: 已取消

## 供应商匹配规则

1. **内部仓库优先**: 自有仓库优先级最高
2. **尾货预警**: 库存≤2台时标记预警
3. **成本最优**: 综合考虑商品单价+运费
4. **快递限制**: 排除不兼容的供应商

## 数据权限控制

### 权限范围
| 范围 | 说明 | 适用角色 |
|------|------|----------|
| `all` | 全部数据 | 管理员、财务 |
| `department` | 本部门数据 | 销售主管、跟单员 |
| `self` | 仅本人数据 | 普通业务员、普通跟单员 |

### 仅本人权限说明
当用户的数据权限设置为"仅本人"时，订单查询将自动过滤为只显示该用户负责的订单：
- **业务员**: 只能查看客户档案中`业务员`字段等于自己姓名的客户的订单
- **跟单员**: 只能查看客户档案中`跟单员`字段等于自己姓名的客户的订单

### 实现方式
- 前端：在调用订单 API 时，通过 `x-user-info` 请求头传递用户信息
- 后端：API 根据用户的数据权限范围过滤订单结果

### 测试用户
| 用户名 | 密码 | 角色 | 数据权限 |
|--------|------|------|----------|
| admin | admin123 | 管理员 | 全部 |
| salesperson | sales123 | 普通业务员 | 仅本人 |
| operator | operator123 | 跟单员 | 仅本人 |

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 启动生产服务
pnpm start

# 代码检查
pnpm lint
```

## 导航菜单结构

### 菜单项
| 菜单 | 路径 | 说明 | 权限 |
|------|------|------|------|
| 首页 | `/` | 数据概览 | 全部 |
| 订单中心 | `/orders` | 订单列表 | 全部 |
| 发货通知单 | `/shipping-export` | 发货通知单导出 | 全部 |
| 物流回单 | `/return-receipt` | 回单导入 | 全部 |
| 客户回单 | `/export-records` | 客户反馈导出 | 全部 |
| 库存管理 | `/stocks` | 库存查询 | 全部 |
| 历史成本库 | `/order-cost-history` | 历史成本记录 | 全部 |
| 数据报表 | `/reports` | 数据统计分析 | 全部 |
| 档案管理 | `/archive` | 档案概览 | 全部 |
| 　├ 档案概览 | `/archive` | 档案总览 | 全部 |
| 　├ 客户管理 | `/customers` | 客户档案 | 全部 |
| 　├ 发货方管理 | `/suppliers-manage` | 发货方档案 | 全部 |
| 　├ 商品管理 | `/products` | 商品档案 | 全部 |
| 　└ SKU映射 | `/sku-mappings` | 映射关系 | 全部 |
| 系统设置 | `/users` | 系统配置 | admin |
| 　├ 用户管理 | `/users` | 用户列表 | admin |
| 　├ 角色管理 | `/roles` | 角色配置 | admin |
| 　├ 权限管理 | `/users` | 权限配置 | admin |
| 　└ 模板配置 | `/templates` | 模板管理 | admin |

## 文件结构

```
src/
├── app/
│   ├── (app)/              # 业务模块路由
│   │   ├── orders/         # 订单管理
│   │   ├── stocks/         # 库存管理（含版本历史、价格历史）
│   │   ├── order-cost-history/ # 历史成本库
│   │   ├── alerts/         # 预警中心
│   │   ├── archive/        # 档案管理（含档案概览）
│   │   ├── customers/      # 客户管理
│   │   ├── suppliers-manage/ # 发货方管理
│   │   ├── products/        # 商品管理
│   │   ├── sku-mappings/    # SKU映射
│   │   ├── users/          # 用户管理
│   │   ├── roles/          # 角色管理
│   │   ├── templates/      # 模板配置
│   │   ├── order-parse/    # 订单录入（规则解析）
│   │   ├── export-records/ # 导出记录
│   │   ├── shipping-export/ # 发货通知导出
│   │   └── return-receipt/ # 回单管理
│   ├── api/                # API 路由
│   │   ├── orders/         # 订单相关接口
│   │   ├── shippers/       # 发货方接口
│   │   ├── match/          # 供应商匹配接口
│   │   ├── export/         # 导出接口
│   │   ├── returns/        # 回单接口
│   │   ├── templates/      # 模板接口
│   │   ├── stock-versions/ # 库存版本接口
│   │   ├── price-history/  # 价格历史接口
│   │   ├── order-cost-history/ # 历史成本接口
│   │   ├── alert-rules/    # 预警规则接口
│   │   └── alert-records/  # 预警记录接口
│   └── page.tsx            # 首页
├── components/
│   ├── ui/                 # shadcn/ui 组件
│   └── sidebar.tsx         # 侧边栏菜单
├── storage/                # 存储层
├── lib/                    # 工具函数
└── types/                  # 类型定义
```

## TODO

### 已完成
- [x] 添加数据库持久化 (Supabase)
- [x] 添加用户认证和权限管理
- [x] 开发模板配置中心
- [x] 开发库存版本管理
- [x] 开发历史价格库
- [x] 开发订单预期预警规则
- [x] 开发发货通知单导出功能（按供应商批量导出）
- [x] 开发回单导入与自动匹配功能
- [x] 开发导出记录查询功能
- [x] 优化档案管理中心结构与导航菜单
- [x] 开发角色管理功能界面（角色增删改查、权限配置、预设系统角色和权限）
- [x] 启用数据权限功能（仅本人：业务员/跟单员只能查看自己负责客户的订单）
- [x] 修正订单导入功能，建立正确的档案关联（存储主键ID）
- [x] 修正订单导出功能，使用关联查询获取档案信息
- [x] 修正订单详情页，展示正确的关联信息
- [x] 开发历史成本库（数据库表、API接口、前端页面）
- [x] 完善历史成本库流程（订单派发写入、回单更新、费用录入）
- [x] 合并供应商档案+仓库档案为发货方档案
- [x] 商品档案增加尺寸/重量字段（用于运费计算）
- [x] 隐藏未使用的 Agent配置 模块
- [x] API-Schema 字段对齐（以 API 为准，补全缺失字段，修正类型不一致）
- [x] 重写 schema.ts 包含全部 32 个数据表定义
- [x] 更新 src/types/order.ts 与 API 实际字段对齐
- [x] 新增 `008_api-schema-align.sql` 迁移脚本

### 待开发
- [ ] 添加微信机器人对接
- [ ] 添加聚水潭API对接
- [ ] 添加运费计算模块
- [x] 添加数据报表功能
- [ ] 添加大模型能力（如需处理非结构化数据）

### Bug修复记录
- [x] 修复 `orders.shipped_at` 字段不存在问题（改为 `assigned_at`）
- [x] 修复发货通知模板 API `config` 字段默认值处理
- [x] 创建 `shipping` 类型的发货通知模板
- [x] 修复 Supabase 部署平台 schema 同步错误（`product_mappings` 表 id 类型改为 varchar）
- [x] 修复 `buildRelatedMaps` 查询 customers 表列名错误（`sales_user_name` → `salesperson_name`，`operator_user_name` → `order_taker_name`）
- [x] 修复 `stocks/[id]` 读取 `currentStock.price` 错误（应为 `unit_price`）
- [x] 修复 `alert-records` GET 响应缺少 `stockId` 字段（`createLowStockAlert` 写入但 GET 未映射）
- [x] 修复 `stocks` GET 响应缺少 `minStock`/`maxStock` 字段（写入 DB 但 enhanceStock 未读取）
- [x] 清理 `suppliers` 和 `customers` transform 中的死代码（`contact`/`region` 旧字段回退读取）
- [x] 清理 `schema.ts` 多处字段定义（`products.sku` → `products.code`、`dispatch_records` 补全 `warehouse_id`/`created_at`/`updated_at`、`return_receipts` 补全 `receipt_no`/`customer_id`/`updated_at`、`return_receipt_records` 补全 `product_id`/`quantity`/`price`）

### API-Schema 对齐说明
- **原则**：以 API 代码为事实来源（source of truth），Schema 和数据库跟随 API 实际使用的字段名
- **命名规范**：数据库使用 `snake_case`，TypeScript 接口使用 `camelCase`
- **数据库迁移**：`008_api-schema-align.sql` 负责以 `ADD COLUMN IF NOT EXISTS` 和 `ALTER COLUMN TYPE` 模式补充缺失字段和修正类型
- **常见类型差异**：
  - `order_cost_history.unit_cost`（API 写入）vs 期望的 `unit_price`（语义一致）
  - `alert_rules.type`（API 写入）vs 期望的 `rule_type`（语义一致）
  - `products.code`（DB 主键）vs `products.sku`（前端展示别名）

### 技术说明
- **当前版本不使用大模型**：系统核心功能（订单解析、档案匹配、供应商匹配）均采用规则引擎实现，MVP阶段无需大模型
- **大模型扩展预留**：如未来需处理微信消息等非结构化数据，可按需引入大模型
