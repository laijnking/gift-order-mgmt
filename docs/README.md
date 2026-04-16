# 礼品订单管理系统 - 文档目录

> 本目录包含系统的设计文档、技术文档和业务模版

---

## 一、技术设计文档

| 文档 | 说明 |
|------|------|
| [SKU_MAPPING_GUIDE.md](./SKU_MAPPING_GUIDE.md) | SKU映射系统技术设计文档 |
| [ORDER_COST_HISTORY.md](./ORDER_COST_HISTORY.md) | 历史成本库使用指南 |
| [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) | API接口文档 |
| [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) | 数据库结构文档 |

---

## 二、业务模版文档 (temp/)

| 序号 | 文档 | 说明 |
|------|------|------|
| 1 | [temp/README.md](./temp/README.md) | 数据收集指南（索引） |
| 2 | [temp/01_PRODUCT_TEMPLATE.md](./temp/01_PRODUCT_TEMPLATE.md) | 商品档案数据收集模版 |
| 3 | [temp/02_CUSTOMER_TEMPLATE.md](./temp/02_CUSTOMER_TEMPLATE.md) | 客户档案数据收集模版 |
| 4 | [temp/03_SHIPPER_TEMPLATE.md](./temp/03_SHIPPER_TEMPLATE.md) | 发货方档案数据收集模版 |
| 5 | [temp/05_SKU_MAPPING_TEMPLATE.md](./temp/05_SKU_MAPPING_TEMPLATE.md) | SKU映射表数据收集模版 |
| 6 | [temp/06_STOCK_TEMPLATE.md](./temp/06_STOCK_TEMPLATE.md) | 供应商库存数据收集模版 |
| 7 | [temp/07_USER_TEMPLATE.md](./temp/07_USER_TEMPLATE.md) | 用户档案数据收集模版 |
| 8 | [temp/08_ORDER_TEMPLATE.md](./temp/08_ORDER_TEMPLATE.md) | 订单导入数据收集模版 |

---

## 三、快速开始

### 3.1 业务初始化流程

```
1. 阅读数据收集指南 → temp/README.md
     ↓
2. 按顺序收集数据：
   - 商品档案 → 01_PRODUCT_TEMPLATE.md
   - 客户档案 → 02_CUSTOMER_TEMPLATE.md
   - 发货方档案 → 03_SHIPPER_TEMPLATE.md
   - SKU映射表 → 05_SKU_MAPPING_TEMPLATE.md
   - 供应商库存 → 06_STOCK_TEMPLATE.md
   - 用户档案 → 07_USER_TEMPLATE.md
   - 订单导入 → 08_ORDER_TEMPLATE.md
     ↓
3. 联系管理员导入数据
     ↓
4. 开始使用系统
```

### 3.2 核心概念

| 概念 | 说明 |
|------|------|
| 商品档案 | 系统中管理的商品主数据（含尺寸/重量） |
| SKU映射表 | 客户商品 ↔ 系统商品 的关联对照表 |
| 发货方档案 | 供应商/仓库/京东/拼多多渠道统一管理 |
| 供应商库存 | 各发货方的商品库存和报价 |
| 客户档案 | 客户信息及负责人员 |
| 历史成本库 | 订单全链路成本记录 |
| 数据权限 | 控制用户可见的数据范围 |

---

## 四、相关资源

### 4.1 系统访问

- 演示地址：[https://abc123.dev.coze.site](https://abc123.dev.coze.site)
- 默认账号：`admin` / `admin123`

### 4.2 常用功能路径

| 功能 | 路径 |
|------|------|
| 首页 | `/` |
| 订单中心 | `/orders` |
| AI订单录入 | `/order-parse` |
| 库存管理 | `/stocks` |
| 档案管理 | `/archive` |
| 用户管理 | `/users` |

---

*最后更新：2024年*
