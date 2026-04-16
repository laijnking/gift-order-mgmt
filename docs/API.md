# 接口设计文档

## 1. 接口规范

### 1.1 基础规范

- **协议**: HTTP/HTTPS
- **数据格式**: JSON
- **编码**: UTF-8
- **认证**: Token (预留)

### 1.2 响应格式

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功",
  "total": 100
}

// 错误响应
{
  "success": false,
  "error": "错误信息",
  "code": "ERROR_CODE"
}
```

### 1.3 分页参数

| 参数 | 类型 | 说明 |
|------|------|------|
| page | number | 页码（从1开始）|
| limit | number | 每页条数（默认20）|

---

## 2. 订单接口

### 2.1 订单状态说明

| 状态值 | 中文名称 | 说明 |
|--------|----------|------|
| `pending` | 待派发 | 订单录入，等待分配供应商 |
| `assigned` | 已分派 | 已分配供应商 |
| `notified` | 通知发货 | 已导出派发单给供应商 |
| `partial_returned` | 部分回单 | 部分商品已回传快递 |
| `returned` | 已回传 | 供应商回传快递单号 |
| `completed` | 已完成 | 订单完结 |
| `cancelled` | 已取消 | 订单作废 |

### 2.2 获取订单列表

```
GET /api/orders
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 否 | 订单状态 |
| customerCode | string | 否 | 客户代码 |
| supplierId | string | 否 | 供应商ID |
| search | string | 否 | 搜索关键词 |
| page | number | 否 | 页码 |
| limit | number | 否 | 每页条数 |

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sysOrderNo": "SYS-20240101-0001",
      "orderNo": "CUST-001",
      "status": "pending",
      "items": [...],
      "receiver": {...},
      "customerName": "客户A",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100
}
```

### 2.2 导入订单

```
POST /api/orders
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orders | Order[] | 是 | 订单数组 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "importedCount": 10,
    "failedCount": 2,
    "errors": ["第3行数据格式错误"]
  }
}
```

### 2.3 更新订单状态

```
PATCH /api/orders
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 订单ID |
| status | string | 否 | 订单状态 |
| supplierId | string | 否 | 供应商ID |
| supplierName | string | 否 | 供应商名称 |
| trackingNo | string | 否 | 快递单号 |
| expressCompany | string | 否 | 快递公司 |

---

## 3. 供应商接口

### 3.1 获取供应商列表

```
GET /api/suppliers
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| active | boolean | 否 | 是否只获取启用 |
| type | string | 否 | 供应商类型 |

### 3.2 供应商详情

```
GET /api/suppliers/:id
```

### 3.3 创建供应商

```
POST /api/suppliers
```

### 3.4 更新供应商

```
PUT /api/suppliers/:id
```

### 3.5 删除供应商

```
DELETE /api/suppliers/:id
```

---

## 4. 客户接口

### 4.1 获取客户列表

```
GET /api/customers
```

### 4.2 创建客户

```
POST /api/customers
```

### 4.3 更新客户

```
PUT /api/customers/:id
```

### 4.4 批量更新客户

```
PATCH /api/customers
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | string[] | 是 | 客户ID数组 |
| salespersonId | string | 否 | 业务员ID |
| orderTakerId | string | 否 | 跟单员ID |

---

## 5. 库存接口

### 5.1 获取库存列表

```
GET /api/stocks
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| lowStockOnly | boolean | 否 | 只看预警 |

### 5.2 创建库存

```
POST /api/stocks
```

### 5.3 更新库存

```
PUT /api/stocks/:id
```

### 5.4 删除库存

```
DELETE /api/stocks/:id
```

### 5.5 获取库存版本历史

```
GET /api/stock-versions
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| stockId | string | 否 | 库存ID |
| productCode | string | 否 | 商品编码 |
| supplierId | string | 否 | 供应商ID |
| limit | number | 否 | 返回条数 |

---

## 6. 价格接口

### 6.1 获取价格历史

```
GET /api/price-history
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| productCode | string | 否 | 商品编码 |
| supplierId | string | 否 | 供应商ID |
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

### 6.2 记录价格变更

```
POST /api/price-history
```

---

## 7. 预警接口

### 7.1 获取预警规则

```
GET /api/alert-rules
```

### 7.2 创建预警规则

```
POST /api/alert-rules
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 规则名称 |
| code | string | 是 | 规则编码 |
| type | string | 是 | 规则类型 |
| config | object | 否 | 规则配置 |
| priority | number | 否 | 优先级 |
| description | string | 否 | 描述 |

### 7.3 更新预警规则

```
PUT /api/alert-rules/:id
```

### 7.4 删除预警规则

```
DELETE /api/alert-rules/:id
```

### 7.5 获取预警记录

```
GET /api/alert-records
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ruleCode | string | 否 | 规则编码 |
| alertLevel | string | 否 | 预警级别 |
| isRead | boolean | 否 | 是否已读 |
| isResolved | boolean | 否 | 是否已处理 |

### 7.6 标记预警记录

```
PATCH /api/alert-records
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| ids | string[] | 是 | 记录ID数组 |
| isRead | boolean | 否 | 标记已读 |
| isResolved | boolean | 否 | 标记已处理 |
| resolvedBy | string | 否 | 处理人 |

---

## 8. 业务接口

### 8.1 匹配供应商

```
POST /api/match
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderIds | string[] | 是 | 订单ID数组 |

**响应示例**
```json
{
  "success": true,
  "data": [
    {
      "orderId": "uuid",
      "orderNo": "CUST-001",
      "recommendedSupplier": {...},
      "alternativeSuppliers": [...],
      "warning": null
    }
  ]
}
```

### 8.2 导出派发单

```
POST /api/export
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| orderIds | string[] | 是 | 订单ID数组 |
| supplierId | string | 否 | 供应商ID |

### 8.3 导入回单

```
POST /api/returns
```

**FormData 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | Excel文件 |
| supplierId | string | 是 | 供应商ID |
| supplierName | string | 是 | 供应商名称 |

---

## 9. 配置接口

### 9.1 获取模板列表

```
GET /api/templates
```

### 9.2 创建模板

```
POST /api/templates
```

**Body 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 模板名称 |
| type | string | 是 | 模板类型 |
| fieldMappings | object | 是 | 字段映射 |
| isDefault | boolean | 否 | 是否默认 |

### 9.3 更新模板

```
PUT /api/templates/:id
```

### 9.4 删除模板

```
DELETE /api/templates/:id
```

### 9.5 复制模板

```
POST /api/templates/:id/copy
```

---

## 11. 报表接口

### 11.1 报表统计数据

```
GET /api/reports/stats
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 (YYYY-MM-DD) |
| endDate | string | 否 | 结束日期 (YYYY-MM-DD) |
| groupBy | string | 否 | 分组维度 (day/week/month) |

**响应示例**
```json
{
  "success": true,
  "data": {
    "orderStatus": {
      "total": 100,
      "pending": 20,
      "assigned": 30,
      "returned": 25,
      "completed": 20,
      "cancelled": 5
    },
    "customer": {
      "total": 50,
      "active": 45,
      "newThisMonth": 5
    },
    "supplier": {
      "total": 20,
      "active": 18,
      "byType": { "supplier": 15, "jd": 3, "pdd": 2 }
    },
    "stock": {
      "totalProducts": 100,
      "totalQuantity": 500,
      "lowStock": 5,
      "outOfStock": 2
    },
    "topProducts": [
      { "name": "商品A", "quantity": 50, "amount": 25000 }
    ],
    "topCustomers": [
      { "customerName": "客户A", "orderCount": 30 }
    ]
  }
}
```

### 11.2 销售业绩报表

```
GET /api/reports/sales-performance
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "bySalesperson": [
      {
        "name": "张三",
        "orderCount": 50,
        "pendingCount": 5,
        "assignedCount": 10,
        "returnedCount": 15,
        "completedCount": 18,
        "cancelledCount": 2,
        "completionRate": 36
      }
    ],
    "byOperator": [...],
    "summary": {
      "totalOrders": 100,
      "totalSalesperson": 5,
      "avgOrdersPerSalesperson": 20
    }
  }
}
```

### 11.3 供应商分析报表

```
GET /api/reports/supplier-analysis
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "topSuppliers": [
      {
        "id": "uuid",
        "name": "供应商A",
        "type": "supplier",
        "orderCount": 80,
        "totalQuantity": 100,
        "completionRate": 75,
        "lastOrderDate": "2024-04-15"
      }
    ],
    "byType": [
      { "type": "supplier", "supplierCount": 15, "orderCount": 50 }
    ],
    "summary": {
      "totalSuppliers": 20,
      "totalOrders": 100,
      "avgOrdersPerSupplier": 5
    }
  }
}
```

### 11.4 回单时效分析报表

```
GET /api/reports/return-timeline
```

**Query 参数**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| startDate | string | 否 | 开始日期 |
| endDate | string | 否 | 结束日期 |

**响应示例**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalOrders": 100,
      "ordersWithDispatch": 95,
      "ordersWithReturn": 80,
      "avgDispatchDays": "1.5",
      "avgReturnDays": "3.2",
      "returnOnTimeRate": 85
    },
    "dispatchDistribution": [
      { "range": "0-1天", "count": 60 },
      { "range": "2-3天", "count": 30 }
    ],
    "returnDistribution": [...],
    "byExpress": [
      { "company": "顺丰", "orderCount": 50, "avgReturnDays": "2.5" }
    ],
    "bySupplier": [...]
  }
}
```

---

## 12. 通用响应码

| 码 | 说明 |
|----|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 404 | 资源不存在 |
| 500 | 服务器错误 |
