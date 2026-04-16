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

### shippers (发货方)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar | 发货方编码 |
| name | varchar | 发货方名称 |
| type | varchar | 类型(supplier/jd/pdd/self/third_party) |
| send_type | varchar | 发货方式(download/jd/pdd/self) |
| jd_channel_id | varchar | 京东渠道ID |
| pdd_shop_id | varchar | 拼多多店铺ID |
| can_jd | boolean | 是否支持京东发货 |
| can_pdd | boolean | 是否支持拼多多发货 |
| express_restrictions | jsonb | 快递限制 |
| settlement_type | varchar | 结算方式 |
| cost_factor | decimal | 成本系数 |
| is_active | boolean | 是否启用 |
| created_at | timestamp | 创建时间 |

### customers (客户)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 客户名称 |
| code | varchar | 客户编码 |
| salesperson_id | uuid | 业务员ID |
| order_taker_id | uuid | 跟单员ID |
| status | varchar | 状态 |
| created_at | timestamp | 创建时间 |

### products (商品)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 商品名称 |
| sku | varchar | SKU编码 |
| brand | varchar | 品牌 |
| category | varchar | 分类 |
| unit_price | decimal | 单价 |
| status | varchar | 状态(在售/停售/预售) |
| created_at | timestamp | 创建时间 |

### warehouses (仓库)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 仓库名称 |
| code | varchar | 仓库编码 |
| type | varchar | 类型(自有/三方) |
| address | varchar | 地址 |
| contact | varchar | 联系人 |
| phone | varchar | 联系电话 |
| status | varchar | 状态 |
| created_at | timestamp | 创建时间 |

### users (用户/员工)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 姓名 |
| username | varchar | 用户名 |
| role | varchar | 角色(业务员/跟单员/管理员) |
| phone | varchar | 电话 |
| email | varchar | 邮箱 |
| status | varchar | 状态 |
| created_at | timestamp | 创建时间 |

### stock_versions (库存版本历史)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| stock_id | uuid | 库存记录ID |
| product_code | varchar | 商品编码 |
| product_name | varchar | 商品名称 |
| supplier_id | uuid | 供应商ID |
| supplier_name | varchar | 供应商名称 |
| before_quantity | integer | 变更前库存 |
| after_quantity | integer | 变更后库存 |
| change_quantity | integer | 库存变化 |
| before_price | decimal | 变更前价格 |
| after_price | decimal | 变更后价格 |
| change_price | decimal | 价格变化 |
| change_type | varchar | 变更类型(manual/import/order/adjust) |
| change_reason | text | 变更原因 |
| operator | varchar | 操作人 |
| created_at | timestamp | 创建时间 |

### price_history (价格历史)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| product_code | varchar | 商品编码 |
| product_name | varchar | 商品名称 |
| supplier_id | uuid | 供应商ID |
| supplier_name | varchar | 供应商名称 |
| before_price | decimal | 原价 |
| after_price | decimal | 新价 |
| change_price | decimal | 价格变化 |
| change_type | varchar | 变更类型(manual/adjust/contract/market) |
| change_reason | text | 变更原因 |
| operator | varchar | 操作人 |
| effective_from | timestamp | 生效时间 |
| effective_to | timestamp | 失效时间 |
| created_at | timestamp | 创建时间 |

### order_cost_history (历史成本库)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| order_id | uuid | 订单ID |
| order_no | varchar | 客户订单号 |
| match_code | varchar | 匹配码 |
| supplier_id | uuid | 供应商ID |
| supplier_name | varchar | 供应商名称 |
| warehouse_id | uuid | 仓库ID |
| warehouse_name | varchar | 仓库名称 |
| product_code | varchar | 商品编码 |
| product_name | varchar | 商品名称 |
| quantity | integer | 数量 |
| unit_cost | decimal | 单台成本单价 |
| total_cost | decimal | 总成本（不含运费） |
| express_fee | decimal | 运费 |
| other_fee | decimal | 其他费用 |
| total_amount | decimal | 总金额（含运费） |
| express_company | varchar | 快递公司 |
| tracking_no | varchar | 物流单号 |
| receiver_name | varchar | 收货人 |
| receiver_phone | varchar | 收货电话 |
| receiver_address | varchar | 收货地址 |
| customer_code | varchar | 客户代码 |
| customer_name | varchar | 客户名称 |
| salesperson | varchar | 业务员 |
| operator_name | varchar | 跟单员 |
| order_date | date | 下单日期 |
| shipped_date | date | 发货日期 |
| returned_date | date | 回单日期 |
| dispatch_batch | varchar | 派发批次 |
| remark | text | 备注 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### alert_rules (预警规则)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| name | varchar | 规则名称 |
| code | varchar | 规则编码(唯一) |
| type | varchar | 规则类型(stock/order/price/customer) |
| config | jsonb | 规则配置 |
| priority | integer | 优先级 |
| is_enabled | boolean | 是否启用 |
| notification_channels | jsonb | 通知渠道 |
| description | text | 规则描述 |
| created_at | timestamp | 创建时间 |

### alert_records (预警记录)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| rule_id | uuid | 规则ID |
| rule_code | varchar | 规则编码 |
| order_id | uuid | 关联订单ID |
| order_no | varchar | 订单号 |
| alert_type | varchar | 预警类型 |
| alert_level | varchar | 预警级别(info/warning/error/critical) |
| title | varchar | 预警标题 |
| content | text | 预警内容 |
| is_read | boolean | 是否已读 |
| is_resolved | boolean | 是否已处理 |
| resolved_at | timestamp | 处理时间 |
| resolved_by | varchar | 处理人 |
| created_at | timestamp | 创建时间 |

### roles (角色)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar | 角色编码(唯一) |
| name | varchar | 角色名称 |
| description | text | 角色描述 |
| data_scope | varchar | 数据权限范围(self/department/all) |
| is_system | boolean | 是否系统内置角色 |
| is_active | boolean | 是否启用 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### permissions (权限)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| code | varchar | 权限编码(唯一) |
| name | varchar | 权限名称 |
| category | varchar | 权限分类 |
| description | text | 权限描述 |
| created_at | timestamp | 创建时间 |

### role_permissions (角色权限关联)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| role_id | uuid | 角色ID |
| permission_id | uuid | 权限ID |
| created_at | timestamp | 创建时间 |

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

### 技术说明
- **当前版本不使用大模型**：系统核心功能（订单解析、档案匹配、供应商匹配）均采用规则引擎实现，MVP阶段无需大模型
- **大模型扩展预留**：如未来需处理微信消息等非结构化数据，可按需引入大模型
