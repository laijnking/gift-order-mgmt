# OBS 系统功能开发执行计划

> **版本**: v1.2
> **创建时间**: 2026-04-10
> **最后更新**: 2026-04-10
> **文档来源**: OBS界面功能节点清单简化-V3.0.md
> **目标**: 根据设计文档修正当前系统各模块的功能细节和交互逻辑

---

## 文档更新记录

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v1.0 | 2026-04-10 | 初始版本，包含主要任务清单和API设计 |
| v1.1 | 2026-04-10 | 补充完整业务规则：订单状态流转、逾期计算、作废恢复、快捷操作、详情弹窗、发货通知单导出、客户反馈导出、回单导入匹配等详细业务流程 |
| v1.2 | 2026-04-10 | 补充批量导出功能：发货通知单批量导出（按供应商分文件）、客户反馈批量导出（按客户分文件，含未回单预校验）|

---

## 一、现状分析

### 1.1 当前系统已有功能

| 模块 | 状态 | 说明 |
|------|------|------|
| 登录页面 | ✅ 已实现 | 用户认证基础功能 |
| 订单中心 | ⚠️ 部分实现 | 基础CRUD，缺少快捷操作、状态驱动功能 |
| 客户管理 | ⚠️ 部分实现 | 基础CRUD，缺少SKU对照表、批量交接 |
| 供应商管理 | ⚠️ 部分实现 | 基础CRUD，缺少发货限制配置 |
| 商品管理 | ⚠️ 部分实现 | 基础CRUD，后端API未对接 |
| 库存管理 | ⚠️ 部分实现 | 缺少版本管理功能 |
| SKU映射 | ⚠️ 部分实现 | 缺少导出历史追溯 |
| **模板配置中心** | ⚠️ 部分实现 | 已有基础CRUD，缺少模板字段配置、模板关联功能 |
| 发货通知单导出 | ❌ 未实现 | 需依赖模板配置中心 |
| 客户订单反馈导出 | ❌ 未实现 | 需依赖模板配置中心 |
| 回单导入匹配 | ❌ 未实现 | - |
| 历史价格库 | ❌ 未实现 | - |
| 订单预期预警规则 | ❌ 未实现 | - |
| Agent调试管理 | ✅ 已实现 | - |

### 1.2 需要重点修复的功能差异

1. **模板配置中心**：完善模板字段配置、模板与客户/供应商关联
2. **发货通知单导出**：整个模块缺失，需关联供应商模板
3. **客户订单反馈导出**：整个模块缺失，需关联客户模板
4. **订单中心**：状态流转、快捷操作、详情弹窗
5. **SKU映射**：缺少导出历史追溯

---

## 二、开发任务清单

### 阶段一：核心订单流程（优先级：P0）

#### 任务 1.1：订单中心功能完善

**目标**：修正订单中心筛选、操作、状态流转逻辑

---

### 1.1.1 业务规则定义

#### 订单状态定义

| 状态值 | 中文名称 | 说明 | 流转规则 |
|--------|----------|------|----------|
| `pending` | 待派发 | 业务员录入订单，等待分配供应商 | 初始状态 |
| `assigned` | 已分派 | 已分配供应商 | 由"待派发"变更 |
| `notified` | 通知发货 | 已导出派发单给供应商 | 由"已分派"变更 |
| `partial_returned` | 部分回单 | 部分商品已回传快递 | 由"通知发货"变更 |
| `returned` | 已回传 | 供应商发货并回传快递单号 | 由"部分回单"或"通知发货"变更 |
| `completed` | 已完成 | 订单完结 | 由"已回传"变更 |
| `cancelled` | 已取消 | 订单作废 | 所有状态可用 |

#### 订单状态流转图

```
                       ┌─────────────────┐
                       │     待派发       │ ←─── [AI快捷录入/Excel导入]
                       │   (pending)     │
                       └────────┬─────────┘

                             分配供应商
                                   │
                                   ▼
                       ┌─────────────────┐
                       │    已分派       │
                       │   (assigned)   │
                       └────────┬─────────┘
                                 │ 导出发货通知单
                                 ▼
                       ┌─────────────────┐
                       │   通知发货      │
                       │   (notified)   │
                       └────────┬─────────┘
                                 │ 回单导入匹配
                                 ▼
                       ┌─────────────────┐
                       │   部分回单      │ ←─── (部分商品回传)
                       │(partial_return)│
                       └────────┬─────────┘
                                 │ 全部回传
                                 ▼
                       ┌─────────────────┐
                       │    已回传       │
                       │   (returned)   │
                       └────────┬─────────┘
                                 │ 订单完结
                                 ▼
                       ┌─────────────────┐
                       │    已完成       │
                       │   (completed)  │
                       └─────────────────┘

            ┌─────────────────────────────────────┐
            │              已取消                 │
            │           (cancelled)               │
            └─────────────────────────────────────┘
                       ↕ 可恢复
                  (需校验一致性)
```

#### 各状态操作按钮

| 当前状态 | 可执行操作 | 目标状态 |
|----------|------------|----------|
| 待派发 | 分派供应商 | 已分派 |
| 已分派 | 发货通知 | 通知发货 |
| 通知发货 | 回单导入 | 已回传/部分回单 |
| 部分回单 | 回单导入 | 已回传 |
| 已回传 | 订单归档 | 已完成 |
| 任意状态 | 订单作废 | 已取消 |

#### 逾期计算规则 (ORD-05)

**定义**：从订单录入开始（系统录入后则为待派发状态），一直到已回传；超过24小时未到达"已回传"状态即标记为逾期订单。

**计算公式**：
```
逾期 = 当前时间 - 订单创建时间 > 24小时 AND 订单状态 NOT IN ('returned', 'completed', 'cancelled')
```

**逾期标记显示**：
- 逾期订单在列表中显示红色警示图标
- 逾期时间显示：逾期 X小时 / 逾期 X天

#### 作废恢复规则 (ORD-44)

**恢复条件校验**：订单作废后允许恢复，但需校验以下字段是否完全一致：
- 客户代码
- 商品信息
- 订单号
- 商品数量

**恢复逻辑**：
- 若以上字段**完全一致**：不允许恢复（防止重复下单）
- 若以上字段**不一致**：允许恢复

**注意事项**：作废不影响库存（库存已在之前回单导入时处理）

---

### 1.1.2 功能节点对照表

| 节点ID | 功能 | 当前状态 | 修订内容 |
|--------|------|----------|----------|
| ORD-01 | 搜索框 | 无效 | 修复搜索功能，支持订单号、客户名搜索 |
| ORD-02 | 状态筛选 | 部分实现 | 修正为：全部/待发货/通知发货/已发货/已反馈/已归档 |
| ORD-03 | 时间范围筛选 | 已实现 | 今天/本周/本月/自定义 |
| ORD-04 | 价格预警筛选 | - | 取消此功能 |
| ORD-05 | 逾期订单筛选 | 未实现 | 新增：从录入到已发货超过24小时标记逾期 |
| ORD-06 | 刷新按钮 | 已实现 | 重新加载数据 |
| ORD-10 | 我的待发货 | 部分实现 | 快速筛选订单状态：录入和通知发货 |
| ORD-20 | 订单号列 | 已实现 | 显示订单号，支持点击复制 |
| ORD-21 | 客户名列 | 已实现 | 显示客户名称 |
| ORD-22 | 商品明细列 | 已实现 | 显示商品数量和规格 |
| ORD-23 | 业务员列 | 未实现 | **新增**：显示业务员名称 |
| ORD-24 | 跟单员列 | 未实现 | **新增**：显示跟单员名称 |
| ORD-25 | 供应商列 | 已实现 | 显示分配的供应商 |
| ORD-26 | 状态列 | 已实现 | 彩色状态徽章 |
| ORD-27 | 预警列 | 部分实现 | **修正**：仅保留逾期预警图标，取消价格预警 |
| ORD-28 | 创建时间列 | 已实现 | 显示下单时间 |
| ORD-29 | 操作列 | 已实现 | 查看详情按钮 |

---

### 1.1.3 订单快捷操作

**触发条件**：在选择多行订单后，显示订单快捷操作栏

| 操作名称 | 功能说明 | 状态变更 |
|----------|----------|----------|
| AI录入 | 全选框旁边增加按钮，跳转到AI快捷订单录入界面 | - |
| 全选复选框 | 选中多条记录后，显示出多个操作按钮 | - |
| 分派供应商 | 选择供应商分配订单 | 待派发 → 已分派 |
| 发货通知 | 导出发货通知单给供应商 | 已分派 → 通知发货 |
| 物流回单 | 调起回单导入界面，导入后更新状态 | 通知发货 → 已回传 |
| 反馈给客户 | 导出客户反馈表 | 已回传 → 已完成 |
| 订单归档 | 标记订单完结 | 已回传 → 已完成 |

---

### 1.1.4 详情弹窗 (ORD-30~36)

#### 订单信息区

| 区域 | 字段 | 说明 |
|------|------|------|
| 基本信息 | 订单号 | 系统订单号（自动生成） |
| | 客户名称 | 关联客户档案 |
| | 状态 | 当前订单状态徽章 |
| | 创建时间 | 订单录入时间 |
| 订单号信息 | 供应商单号 | 供应商内部订单号 |
| | 客户单号 | 客户提供的订单号 |
| | 采购单号 | 采购系统订单号 |
| | 财务单号 | 财务系统订单号 |
| 收件人信息 | 姓名 | 收货人姓名 |
| | 电话 | 收货人电话 |
| | 地址 | 收货人详细地址 |
| 物流信息 | **新增** | 直接显示物流方和快递单号 |
| | **新增** | 显示物流费用（如有） |

#### 商品明细表

| 列名 | 说明 |
|------|------|
| 商品名称 | 商品全称 |
| 规格型号 | 商品规格 |
| 数量 | 订购数量 |
| 单价 | 商品单价 |
| 小计 | 数量 × 单价 |
| 备注 | 特殊说明 |

**底部**：合计行显示所有商品的总数量和总金额

---

### 1.1.5 状态驱动操作按钮 (ORD-40~48)

根据当前订单状态，显示不同的操作按钮：

| 当前状态 | 可用操作 | 操作效果 |
|----------|----------|----------|
| 待派发 | 分配供应商 | 选择供应商派发订单，状态→已分派 |
| 已分派 | 发货通知 | 导出发货通知单，状态→通知发货 |
| | 取消订单 | 作废订单，状态→已取消 |
| 通知发货 | 回单导入 | 导入回单后，状态→已回传 |
| | 取消订单 | 作废订单，状态→已取消 |
| 部分回单 | 回单导入 | 继续导入回单，状态→已回传 |
| 已回传 | 订单归档 | 完结订单，状态→已完成 |
| | 取消订单 | 作废订单，状态→已取消 |
| 已完成 | - | 订单完结，无可执行操作 |
| 已取消 | 恢复订单 | 校验后恢复（见作废恢复规则） |

#### 详情弹窗特殊操作

| 操作ID | 功能 | 说明 |
|--------|------|------|
| ORD-47 | 一键复制订单信息 | 复制订单编号/型号/商品名称/数量/收件信息/物流信息 |
| ORD-48 | 左右面板收起 | 左侧筛选面板和右侧详情面板可收起 |

---

### 1.1.6 面板收起功能 (ORD-48)

**功能说明**：
- 左侧筛选面板可收起/展开
- 右侧详情面板可收起/展开
- 收起后增大主表格区域

**交互方式**：
- 点击收起按钮图标切换状态
- 状态记忆：刷新页面保持收起/展开状态

---

**交付物**：
- `src/app/(app)/orders/page.tsx` 修正
- `src/components/orders/OrderTable.tsx` 新增/修正
- `src/components/orders/OrderDetail.tsx` 修正
- `src/components/orders/OrderFilters.tsx` 修正
- `src/components/orders/OrderQuickActions.tsx` 新增
- `src/hooks/useOrderStatus.ts` 新增
- `src/utils/orderUtils.ts` 新增

**验收标准**：
- [ ] 搜索框可按订单号、客户名搜索
- [ ] 状态筛选正确显示7种状态（待派发/已分派/通知发货/部分回单/已回传/已完成/已取消）
- [ ] 逾期订单正确标记（超过24小时未回传）
- [ ] 逾期时间显示：逾期 X小时
- [ ] 订单表格显示业务员、跟单员列
- [ ] 详情弹窗显示物流信息（物流方、快递单号、物流费用）
- [ ] 各状态对应操作按钮正确显示
- [ ] 多选订单显示快捷操作栏
- [ ] 快捷操作正确变更订单状态
- [ ] 作废订单可恢复（需校验一致性）
- [ ] 筛选面板和详情面板可收起/展开
- [ ] 一键复制订单信息功能

---

#### 任务 1.2：模板配置中心功能完善 ⭐ 核心基础模块

**目标**：完善模板配置中心，支持发货通知单模板和客户订单反馈模板的字段配置、客户/供应商关联

**重要性**：此模块是发货通知单导出和客户订单反馈导出的基础，所有导出功能必须依赖模板配置中心的模板进行。

**功能节点**：

| 节点ID | 功能 | 当前状态 | 修订内容 |
|--------|------|----------|----------|
| TPL-01 | 模板类型筛选 | 已实现 | 筛选：发货通知模板/客户反馈模板 |
| TPL-02 | 模板列表 | 已实现 | 显示模板名称、类型、关联客户/供应商 |
| TPL-03 | 新建模板弹窗 | 已实现 | 创建新模板 |
| TPL-04 | 编辑模板弹窗 | 已实现 | 修改模板内容 |
| TPL-05 | 删除模板 | 已实现 | 删除模板 |
| TPL-06 | 模板字段配置 | ⚠️ 部分 | **新增**：配置模板包含的字段列表 |
| TPL-07 | 客户关联 | ⚠️ 部分 | **新增**：模板与客户档案关联 |
| TPL-08 | 供应商关联 | ⚠️ 部分 | **新增**：模板与供应商档案关联 |
| TPL-09 | 默认模板设置 | ⚠️ 部分 | **新增**：设置某类型模板的默认模板 |
| TPL-10 | 模板预览 | ⚠️ 部分 | **新增**：预览模板导出效果 |
| TPL-11 | 模板复制 | ⚠️ 部分 | **新增**：复制已有模板创建新模板 |

**模板类型定义**：

| 模板类型 | 用途 | 关联对象 |
|----------|------|----------|
| `shipping_notice` | 发货通知单模板 | 供应商 |
| `customer_feedback` | 客户订单反馈模板 | 客户 |
| `financial_export` | 金蝶财务导出模板 | 系统级 |

**模板字段配置**：

发货通知单模板字段（可配置）：
| 字段ID | 字段名称 | 数据来源 | 是否必填 |
|--------|----------|----------|----------|
| supplier_product_code | 供应商商品编码 | 供应商SKU映射表 | 是* |
| supplier_product_name | 供应商商品名称 | 供应商SKU映射表 | 是* |
| my_company_product_code | 我司商品编码 | 系统商品档案 | |
| my_company_product_name | 我司商品名称 | 系统商品档案 | 是 |
| quantity | 数量 | 订单明细 | 是 |
| customer_order_no | 客户订单号 | 订单 | 是 |
| receiver_name | 收货人姓名 | 订单 | 是 |
| receiver_phone | 收货人电话 | 订单 | 是 |
| receiver_address | 收货人地址 | 订单 | 是 |
| express_company | 快递公司 | 回单记录 | |
| tracking_no | 快递单号 | 回单记录 | |
| price | 单价 | 供应商报价 | |
| remark | 备注 | 订单 | |

客户订单反馈模板字段（可配置）：
| 字段ID | 字段名称 | 数据来源 | 是否必填 |
|--------|----------|----------|----------|
| customer_order_no | 客户订单号 | 订单 | 是 |
| product_name | 商品名称 | 订单明细 | 是 |
| quantity | 数量 | 订单明细 | 是 |
| express_company | 快递公司 | 回单记录 | 是 |
| tracking_no | 快递单号 | 回单记录 | 是 |
| ship_date | 发货日期 | 回单记录 | |
| remark | 备注 | 订单 | |

**模板数据结构**：
```typescript
interface Template {
  id: string;
  name: string;
  type: 'shipping_notice' | 'customer_feedback' | 'financial_export';
  isDefault: boolean;
  // 关联的客户/供应商列表（为空表示适用于所有）
  linkedCustomers?: string[]; // 客户ID列表
  linkedSuppliers?: string[]; // 供应商ID列表
  fields: TemplateField[]; // 配置的字段列表
  headerStyle?: HeaderStyle; // 表头样式配置
  createdAt: string;
  updatedAt: string;
}

interface TemplateField {
  fieldId: string;
  fieldName: string;
  sourceTable: string;
  sourceField: string;
  isRequired: boolean;
  order: number; // Excel列顺序
  width?: number; // 列宽
}

interface HeaderStyle {
  fontBold?: boolean;
  fontSize?: number;
  bgColor?: string;
}
```

**模板匹配逻辑**（导出时自动应用）：
```
1. 获取订单/供应商信息
2. 查找关联模板：
   - 先查找是否有该客户/供应商的专属模板
   - 若无专属模板，则使用该类型的默认模板
3. 按模板字段配置生成Excel
```

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/templates` | GET | 获取模板列表（支持按类型、关联对象筛选） |
| `/api/templates` | POST | 创建模板（含字段配置） |
| `/api/templates/[id]` | GET/PUT/DELETE | 模板详情操作 |
| `/api/templates/[id]/fields` | GET/PUT | 获取/更新模板字段配置 |
| `/api/templates/[id]/preview` | POST | 预览模板导出效果 |
| `/api/templates/[id]/duplicate` | POST | 复制模板 |
| `/api/templates/default/[type]` | GET | 获取指定类型的默认模板 |
| `/api/templates/link` | POST | 关联模板到客户/供应商 |

**交付物**：
- `src/app/api/templates/route.ts` 增强
- `src/app/api/templates/[id]/route.ts` 增强
- `src/app/api/templates/default/[type]/route.ts` 新建
- `src/app/api/templates/link/route.ts` 新建
- `src/app/(app)/templates/page.tsx` 增强（添加字段配置Tab）
- `src/components/templates/TemplateFieldEditor.tsx` 新建
- `src/components/templates/TemplateLinkManager.tsx` 新建
- `src/components/templates/TemplatePreview.tsx` 新建

**验收标准**：
- [ ] 模板支持配置字段列表和字段顺序
- [ ] 模板支持关联客户（专属模板）
- [ ] 模板支持关联供应商（专属模板）
- [ ] 模板支持设置默认模板
- [ ] 导出时自动匹配对应模板

---

#### 任务 1.3：发货通知单导出模块

**目标**：实现按供应商导出发货通知单功能（依赖模板配置中心）

**前置依赖**：任务 1.2 模板配置中心功能完善

---

### 1.3.1 业务规则

#### Tab页面结构

| Tab标签 | 说明 |
|---------|------|
| 待发货 | 显示待导出的供应商及其订单 |
| 历史 | 显示已导出的发货通知单历史记录 |

#### 待发货标签页 (SUP-EXP-01~06)

**供应商卡片列表**：
- 按供应商分组显示待发货订单
- 每个卡片显示：供应商名称、待发货订单数、商品种类数
- 支持点击卡片展开/收起该供应商的订单列表

**供应商选择筛选**：
- 支持按供应商名称搜索
- 支持多供应商同时导出

**模板选择下拉**：
- 默认显示该供应商的专属模板（若有）
- 若无专属模板，显示系统默认发货通知模板
- 支持手动切换其他可用模板

**商品预览**：
- 按模板字段配置显示数据列
- 支持勾选要导出的商品
- 显示合计：商品种类数、总数量

**查看全部订单**：
- 点击展开该供应商所有待发货订单详情
- 订单详情包含：客户名称、商品明细、收件人信息

**确认导出**：
- 点击后按模板生成Excel
- 保存导出记录
- **自动更新订单状态**：`pending` → `assigned`（通知发货）
- 导出完成后刷新列表，待发货数相应减少

---

### 1.3.2 历史标签页

| 节点ID | 功能 | 说明 |
|--------|------|------|
| SUP-EXP-10 | 导出历史列表 | 显示已导出的发货通知单 |
| SUP-EXP-11 | 供应商筛选 | 按供应商筛选历史记录 |
| SUP-EXP-12 | 时间范围筛选 | 按导出时间筛选 |
| SUP-EXP-13 | 重新导出 | 从历史记录重新导出 |
| SUP-EXP-14 | 下载按钮 | 下载导出文件 |
| SUP-EXP-15 | 查看关联订单 | 查看本次导出的订单列表 |

**历史记录字段**：
| 字段 | 说明 |
|------|------|
| 导出时间 | 导出操作的时间 |
| 供应商名称 | 导出发货单的供应商 |
| 模板名称 | 使用的导出模板 |
| 订单数量 | 本次导出的订单数 |
| 商品种类 | 本次导出的商品种类数 |
| 导出人 | 执行导出的操作员 |
| 操作 | 下载/重新导出/查看订单 |

---

### 1.3.3 功能节点

| 节点ID | 功能 | 说明 |
|--------|------|------|
| SUP-EXP-01 | 供应商卡片列表 | 显示待发货供应商 |
| SUP-EXP-02 | 供应商选择 | 点击筛选供应商 |
| SUP-EXP-03 | 模板选择下拉 | 选择发货通知模板（从模板配置中心获取） |
| SUP-EXP-04 | 商品预览 | 显示供应商待发货商品（按模板字段配置） |
| SUP-EXP-05 | 查看全部订单 | 查看该供应商所有待发货订单 |
| SUP-EXP-06 | 确认导出 | 导出后订单状态调整为"通知发货" |

---

### 1.3.4 导出流程

```
1. 选择供应商 → 获取该供应商待发货订单
2. 选择模板 → 从模板配置中心获取模板字段配置
3. 预览数据 → 按模板字段填充数据
4. 确认导出 → 生成Excel → 保存导出记录 → 更新订单状态
```

### 1.3.5 模板匹配规则

```
1. 优先使用该供应商的专属发货通知模板
2. 若无专属模板，使用系统默认发货通知模板
3. 模板字段决定导出的列和列顺序
```

### 1.3.6 发货通知单模板标准字段

| 字段ID | 字段名称 | 数据来源 | 说明 |
|--------|----------|----------|------|
| supplier_product_code | 供应商商品编码 | 供应商SKU映射表 | 供应商物料编码 |
| supplier_product_name | 供应商商品名称 | 供应商SKU映射表 | 供应商商品名称 |
| my_product_code | 我司商品编码 | 系统商品档案 | 系统商品编码 |
| my_product_name | 我司商品名称 | 系统商品档案 | 商品全称 |
| quantity | 数量 | 订单明细 | 订购数量 |
| customer_order_no | 客户订单号 | 订单 | 客户提供的订单号 |
| receiver_name | 收货人姓名 | 订单 | |
| receiver_phone | 收货人电话 | 订单 | |
| receiver_address | 收货人地址 | 订单 | 含省市区 |
| express_company | 快递公司 | 回单记录 | 回单导入后填充 |
| tracking_no | 快递单号 | 回单记录 | 回单导入后填充 |
| price | 单价 | 供应商报价 | 采购单价 |
| remark | 备注 | 订单 | 特殊说明 |

**数据模型**：
```typescript
interface ShippingExportRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  orderIds: string[];
  templateId: string;
  exportedBy: string;
  exportedAt: string;
  fileUrl: string;
  orderStatus: 'pending' | 'notified';
}
```

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/shipping-exports` | GET | 获取导出历史列表（支持供应商、时间筛选） |
| `/api/shipping-exports` | POST | 创建新的发货通知单导出 |
| `/api/shipping-exports/[id]` | GET | 获取导出详情（含关联订单） |
| `/api/shipping-exports/[id]/download` | GET | 下载导出文件 |
| `/api/shipping-exports/[id]/reexport` | POST | 重新导出 |
| `/api/shipping-exports/pending` | GET | 获取待发货供应商列表 |

**交付物**：
- `src/app/(app)/supplier-export/page.tsx` 新建
- `src/app/api/shipping-exports/route.ts` 新建
- `src/app/api/shipping-exports/[id]/route.ts` 新建
- `src/components/shipping-export/SupplierCard.tsx` 新建
- `src/components/shipping-export/ExportPreview.tsx` 新建
- `src/components/shipping-export/ExportHistory.tsx` 新建

**验收标准**：
- [ ] 供应商卡片列表正确显示待发货供应商
- [ ] 模板选择自动匹配供应商专属模板
- [ ] 预览数据按模板字段配置显示
- [ ] 确认导出后订单状态正确变更（待发货→通知发货）
- [ ] 历史记录正确显示导出历史
- [ ] 支持重新导出功能
- [ ] 支持下载导出文件

---

### 1.3.7 批量导出功能 ⭐ 新增

**功能说明**：支持一次性导出多个供应商的发货通知单，系统自动按供应商分组生成独立Excel文件。

**批量导出规则**：

| 规则ID | 规则内容 | 说明 |
|--------|----------|------|
| EXP-B001 | 多供应商选择 | 支持勾选多个供应商同时导出 |
| EXP-B002 | 按供应商分文件 | 每个供应商生成独立的Excel文件 |
| EXP-B003 | 模板匹配 | 每个供应商自动匹配其专属模板，无专属模板则使用系统默认模板 |
| EXP-B004 | 文件命名格式 | `{供应商名称}+发货通知单+{导出日期}` |
| EXP-B005 | 批量打包下载 | 多个文件自动打包为ZIP压缩包下载 |
| EXP-B006 | 批量状态更新 | 导出后批量更新所有涉及订单的状态 |

**批量导出流程**：

```
1. 选择多个供应商 → 系统显示待发货订单汇总
2. 点击"批量导出发货通知单"按钮
3. 系统按供应商分组处理：
   ┌─────────────────────────────────────────────────────┐
   │ 供应商A → 调用专属模板 → 生成: 供应商A+发货通知单+20260410.xlsx │
   │ 供应商B → 调用专属模板 → 生成: 供应商B+发货通知单+20260410.xlsx │
   │ 供应商C → 使用通用模板 → 生成: 供应商C+发货通知单+20260410.xlsx │
   └─────────────────────────────────────────────────────┘
4. 所有文件打包为ZIP: 发货通知单批量导出+20260410.zip
5. 保存批量导出记录（记录每个供应商的导出信息）
6. 批量更新订单状态：pending → assigned
```

**文件命名格式详解**：

| 场景 | 文件名格式 | 示例 |
|------|-----------|------|
| 单个供应商 | `{供应商名称}+发货通知单+{日期}` | 顺丰供应商+发货通知单+20260410.xlsx |
| 批量导出ZIP | `发货通知单批量导出+{日期}` | 发货通知单批量导出+20260410.zip |
| 有专属模板 | 使用供应商专属模板 | - |
| 无专属模板 | 使用系统默认发货通知模板 | - |

**批量导出数据结构**：

```typescript
interface BatchShippingExport {
  id: string;
  exportedAt: string;
  exportedBy: string;
  totalSupplierCount: number; // 涉及供应商数量
  totalOrderCount: number; // 涉及订单总数
  zipFileUrl: string;
  zipFileName: string;
  details: BatchShippingExportDetail[];
}

interface BatchShippingExportDetail {
  supplierId: string;
  supplierName: string;
  orderCount: number;
  templateId: string;
  templateName: string;
  fileUrl: string;
  fileName: string;
}
```

**API 扩展**：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/shipping-exports/batch` | POST | 批量导出发货通知单 |
| `/api/shipping-exports/batch/[id]` | GET | 获取批量导出详情 |

---

#### 任务 1.4：客户订单反馈导出模块

**目标**：实现导出订单反馈给客户的功能（依赖模板配置中心）

**前置依赖**：任务 1.2 模板配置中心功能完善

---

### 1.4.1 业务规则

#### Tab页面结构

| Tab标签 | 说明 |
|---------|------|
| 待反馈 | 显示已发货但未反馈给客户的订单 |
| 历史 | 显示已导出的客户反馈单历史记录 |

#### 待反馈标签页 (EXP-01~08)

**筛选功能**：
- 客户筛选：支持下拉选择客户
- 时间范围筛选：按发货时间筛选
- 搜索框：支持订单号、客户单号搜索

**客户卡片列表**：
- 按客户分组显示待反馈订单
- 每个卡片显示：客户名称、待反馈订单数
- 支持点击卡片展开/收起该客户的订单列表

**模板选择下拉**：
- 默认显示该客户的专属反馈模板（若有）
- 若无专属模板，显示系统默认客户反馈模板
- 支持手动切换其他可用模板

**预览导出数据**：
- 按模板字段配置显示数据列
- **重要**：快递单号、发货日期必须从已导入的回单中获取
- 若订单尚未回单导入，预览时显示"待回单"标记
- 支持勾选要导出的订单

**确认导出**：
- 点击后按模板生成Excel
- 保存导出记录
- **自动更新订单状态**：`shipped` → `feedback`（已反馈）
- 导出完成后刷新列表，待反馈数相应减少

---

### 1.4.2 批量导出功能 ⭐ 新增

**功能说明**：支持一次性导出多个客户的订单反馈单，系统自动按客户分组生成独立Excel文件。

**批量导出规则**：

| 规则ID | 规则内容 | 说明 |
|--------|----------|------|
| EXP-C001 | 多客户选择 | 支持勾选多个客户同时导出 |
| EXP-C002 | 按客户分文件 | 每个客户生成独立的Excel文件 |
| EXP-C003 | 模板匹配 | 每个客户自动匹配其专属模板，无专属模板则使用系统默认模板 |
| EXP-C004 | 文件命名格式 | `{客户名称}+订单反馈+{导出日期}` |
| EXP-C005 | 批量打包下载 | 多个文件自动打包为ZIP压缩包下载 |
| EXP-C006 | 批量状态更新 | 导出后批量更新所有涉及订单的状态 |
| EXP-C007 | 回单预校验 | 导出前自动检查每个客户订单是否已回单导入 |

**批量导出流程**：

```
1. 选择多个客户 → 系统显示待反馈订单汇总（含回单状态）
2. 点击"批量导出客户反馈"按钮
3. 系统自动校验：
   ┌─────────────────────────────────────────────────────────────┐
   │ 客户A（3个订单已回单）→ 正常导出                           │
   │ 客户B（5个订单，2个待回单）→ 高亮提示，确认后仍可导出        │
   │ 客户C（2个订单已回单）→ 正常导出                            │
   └─────────────────────────────────────────────────────────────┘
4. 系统按客户分组处理：
   ┌─────────────────────────────────────────────────────────────────┐
   │ 客户A → 调用专属模板 → 生成: 客户A+订单反馈+20260410.xlsx        │
   │ 客户B → 使用通用模板 → 生成: 客户B+订单反馈+20260410.xlsx        │
   │ 客户C → 调用专属模板 → 生成: 客户C+订单反馈+20260410.xlsx        │
   └─────────────────────────────────────────────────────────────────┘
5. 所有文件打包为ZIP: 客户反馈批量导出+20260410.zip
6. 保存批量导出记录（记录每个客户的导出信息）
7. 批量更新订单状态：shipped → feedback
```

**文件命名格式详解**：

| 场景 | 文件名格式 | 示例 |
|------|-----------|------|
| 单个客户 | `{客户名称}+订单反馈+{日期}` | 厦门万翔商城+订单反馈+20260410.xlsx |
| 批量导出ZIP | `客户反馈批量导出+{日期}` | 客户反馈批量导出+20260410.zip |
| 有专属模板 | 使用客户专属反馈模板 | - |
| 无专属模板 | 使用系统默认客户反馈模板 | - |

**未回单订单处理**：

| 处理方式 | 说明 |
|----------|------|
| 导出前提示 | 显示"以下订单尚未回单，快递信息为空" |
| 允许确认导出 | 客户确认后仍可导出，空字段留空 |
| 导出后跟踪 | 在历史记录中标记"含未回单订单" |

**批量导出数据结构**：

```typescript
interface BatchFeedbackExport {
  id: string;
  exportedAt: string;
  exportedBy: string;
  totalCustomerCount: number; // 涉及客户数量
  totalOrderCount: number; // 涉及订单总数
  shippedOrderCount: number; // 已回单订单数
  pendingReceiptCount: number; // 待回单订单数
  zipFileUrl: string;
  zipFileName: string;
  details: BatchFeedbackExportDetail[];
}

interface BatchFeedbackExportDetail {
  customerId: string;
  customerName: string;
  orderCount: number;
  shippedOrderCount: number;
  pendingReceiptCount: number;
  templateId: string;
  templateName: string;
  fileUrl: string;
  fileName: string;
}
```

**API 扩展**：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/export-feedback/batch` | POST | 批量导出客户反馈单 |
| `/api/export-feedback/batch/[id]` | GET | 获取批量导出详情 |
| `/api/export-feedback/pending-check` | POST | 导出前校验订单回单状态 |

---

### 1.4.3 历史标签页

| 节点ID | 功能 | 说明 |
|--------|------|------|
| EXP-10 | 导出历史列表 | 显示已导出的客户反馈单 |
| EXP-11 | 客户筛选 | 按客户筛选历史记录 |
| EXP-12 | 时间范围筛选 | 按导出时间筛选 |
| EXP-13 | 重新导出 | 从历史记录重新导出 |
| EXP-14 | 下载按钮 | 下载导出文件 |
| EXP-15 | 查看关联订单 | 查看本次导出的订单列表 |

---

### 1.4.3 功能节点

| 节点ID | 功能 | 说明 |
|--------|------|------|
| EXP-01 | 搜索框 | 搜索导出记录 |
| EXP-02 | 导出历史列表 | 显示历史导出记录 |
| EXP-03 | 客户筛选 | 按客户筛选导出记录 |
| EXP-04 | 时间范围筛选 | 按导出时间筛选 |
| EXP-05 | 模板选择下拉 | 选择客户反馈模板（从模板配置中心获取） |
| EXP-06 | 预览导出数据 | 按模板字段预览数据 |
| EXP-07 | 重新导出 | 从历史记录重新导出 |
| EXP-08 | 下载按钮 | 下载导出文件 |

---

### 1.4.4 导出流程

```
1. 选择客户 → 获取该客户已发货订单
2. 选择模板 → 从模板配置中心获取模板字段配置
3. 预览数据 → 按模板字段填充数据（含快递信息）
4. 确认导出 → 生成Excel → 保存导出记录 → 更新订单状态为"已反馈"
```

### 1.4.5 模板匹配规则

```
1. 优先使用该客户的专属反馈模板
2. 若无专属模板，使用系统默认客户反馈模板
3. 模板字段决定导出的列和列顺序
```

### 1.4.6 客户反馈模板标准字段

| 字段ID | 字段名称 | 数据来源 | 说明 |
|--------|----------|----------|------|
| customer_order_no | 客户订单号 | 订单 | 客户提供的订单号 |
| product_name | 商品名称 | 订单明细 | 商品全称 |
| product_model | 规格型号 | 订单明细 | 商品规格 |
| quantity | 数量 | 订单明细 | 订购数量 |
| express_company | 快递公司 | 回单记录 | **必须从回单获取** |
| tracking_no | 快递单号 | 回单记录 | **必须从回单获取** |
| ship_date | 发货日期 | 回单记录 | **必须从回单导入时间获取** |
| receiver_name | 收货人姓名 | 订单 | |
| receiver_phone | 收货人电话 | 订单 | |
| receiver_address | 收货人地址 | 订单 | |
| remark | 备注 | 订单 | 特殊说明 |

**客户反馈模板特殊字段规则**：
- **快递单号**：必须从已导入的回单中获取，若无回单则显示空
- **发货日期**：必须从回单导入时间获取，若无回单则显示空
- **预校验**：导出前检查待导出订单是否都已回单导入，未回单的订单高亮提示

---

**数据模型**：
```typescript
interface ExportFeedbackRecord {
  id: string;
  customerId: string;
  customerName: string;
  orderIds: string[];
  templateId: string;
  exportedBy: string;
  exportedAt: string;
  fileUrl: string;
  fileName: string;
  totalCount: number;
}
```

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/export-feedback` | GET | 获取导出历史列表（支持客户、时间筛选） |
| `/api/export-feedback` | POST | 创建新的客户反馈导出 |
| `/api/export-feedback/[id]` | GET | 获取导出详情 |
| `/api/export-feedback/[id]/download` | GET | 下载导出文件 |
| `/api/export-feedback/[id]/reexport` | POST | 重新导出 |

**交付物**：
- `src/app/(app)/export-feedback/page.tsx` 新建
- `src/app/api/export-feedback/route.ts` 新建
- `src/app/api/export-feedback/[id]/route.ts` 新建
- `src/components/export-feedback/*` 新建组件

---

#### 任务 1.5：回单导入匹配模块

**目标**：实现导入供应商回单、自动匹配订单功能

---

### 1.5.1 业务规则

#### Tab页面结构

| Tab标签 | 说明 |
|---------|------|
| 导入回单 | 上传供应商回单Excel并匹配订单 |
| 导入历史 | 显示已导入的回单记录历史 |

#### 导入回单标签页 (REC-01~06)

**Excel上传区**：
- 支持拖拽上传和点击上传
- 支持文件格式：.xlsx, .xls
- 上传后自动解析Excel内容

**回单Excel格式要求**：
| 列名 | 说明 | 必填 |
|------|------|------|
| 客户订单号/订单号 | 客户提供的订单号 | 是 |
| 快递公司 | 快递公司名称 | 是 |
| 快递单号 | 快递单号 | 是 |
| 发货日期 | 发货日期 | 否 |
| 备注 | 其他说明 | 否 |

**回单表格预览**：
- 解析后显示回单数据列表
- 每行显示：客户订单号、快递公司、快递单号、匹配状态
- 支持编辑修改解析结果

**自动匹配逻辑** (REC-03)：
```
匹配优先级：
1. 按客户订单号精确匹配系统订单号
2. 按客户订单号模糊匹配（含客户代码）
3. 未匹配订单进入待手动匹配队列
```

**手动匹配** (REC-04)：
- 对于未自动匹配的订单，支持手动选择对应订单
- 提供订单搜索功能
- 支持批量手动匹配

**批量确认** (REC-05)：
- 确认后执行以下操作：
  1. 更新匹配订单的物流信息（快递公司、快递单号）
  2. **自动更新订单状态**：`assigned` → `shipped`（已发货）
  3. 扣减对应供应商仓库库存
  4. 保存回单导入记录

**多物流单号存储规则** (REC-06)：
```
重要规则：一个订单对应多个快递单号时，用分号(;)隔开存储

示例：
订单A由两个包裹发出：
  - 快递单号1：SF123456789
  - 快递单号2：SF987654321
  
存储格式：SF123456789;SF987654321
```

---

### 1.5.2 导入历史标签页

| 节点ID | 功能 | 说明 |
|--------|------|------|
| REC-10 | 导入历史列表 | 显示已导入的回单记录 |
| REC-11 | 供应商筛选 | 按供应商筛选历史记录 |
| REC-12 | 时间范围筛选 | 按导入时间筛选 |
| REC-13 | 查看详情 | 查看本次导入的回单明细 |
| REC-14 | 重新导入 | 重新导入相同的Excel文件 |

**历史记录字段**：
| 字段 | 说明 |
|------|------|
| 导入时间 | 回单导入的时间 |
| 供应商名称 | 回单对应的供应商 |
| 导入文件 | 原始Excel文件名 |
| 总数 | 本次导入的回单数量 |
| 已匹配 | 成功匹配订单的数量 |
| 未匹配 | 未匹配订单的数量 |
| 导入人 | 执行导入的操作员 |
| 操作 | 查看详情/重新导入 |

---

### 1.5.3 功能节点

| 节点ID | 功能 | 说明 |
|--------|------|------|
| REC-01 | Excel上传区 | 拖拽上传供应商回单Excel |
| REC-02 | 回单表格预览 | 解析后显示回单数据 |
| REC-03 | 自动匹配逻辑 | 按订单号/客户单号匹配系统订单 |
| REC-04 | 手动匹配 | 未匹配订单手动选择对应订单 |
| REC-05 | 批量确认 | 确认后更新订单状态为"已发货" |
| REC-06 | 多物流单号 | 同一字段用分号隔开 |

---

### 1.5.4 回单导入后处理

**库存扣减规则**：
```
回单导入后，对应供应商仓库的库存扣减：
1. 查找订单中每个商品的供应商SKU映射
2. 找到对应供应商的库存记录
3. 扣减数量 = 订单商品数量
4. 允许库存出现负数（库存不足时仍可发货）
```

---

**数据模型**：
```typescript
interface ReturnReceipt {
  id: string;
  orderId?: string;
  supplierId: string;
  supplierName: string;
  customerOrderNo: string;
  expressCompany: string;
  trackingNo: string;
  importedAt: string;
  importedBy: string;
  status: 'pending' | 'matched' | 'confirmed';
}

interface ReturnReceiptRecord {
  id: string;
  supplierId: string;
  supplierName: string;
  fileUrl: string;
  fileName: string;
  totalCount: number;
  matchedCount: number;
  importedAt: string;
  importedBy: string;
}
```

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/return-receipts` | GET | 获取回单列表 |
| `/api/return-receipts` | POST | 导入回单Excel |
| `/api/return-receipts/match` | POST | 自动匹配订单 |
| `/api/return-receipts/[id]` | GET/PATCH | 回单详情/更新 |
| `/api/return-receipts/confirm` | POST | 批量确认回单 |
| `/api/return-receipts/history` | GET | 回单导入历史 |

**交付物**：
- `src/app/(app)/return-receipts/page.tsx` 新建
- `src/app/api/return-receipts/route.ts` 新建
- `src/app/api/return-receipts/match/route.ts` 新建
- `src/app/api/return-receipts/confirm/route.ts` 新建
- `src/app/api/return-receipts/history/route.ts` 新建
- `src/components/return-receipts/ReceiptUploader.tsx` 新建
- `src/components/return-receipts/ReceiptMatcher.tsx` 新建
- `src/components/return-receipts/ReceiptHistory.tsx` 新建

**验收标准**：
- [ ] Excel拖拽上传功能正常
- [ ] Excel解析显示回单数据
- [ ] 自动匹配逻辑正确（按订单号精确/模糊匹配）
- [ ] 未匹配订单支持手动选择匹配
- [ ] 确认后更新订单物流信息和状态（已发货）
- [ ] 多快递单号用分号隔开存储
- [ ] 回单导入后扣减供应商库存
- [ ] 历史记录正确显示导入记录

---

### 阶段二：SKU映射增强（优先级：P1）

#### 任务 2.1：SKU映射导出历史追溯

**目标**：实现导出历史记录追溯和重复导出功能

**功能节点**：

| 节点ID | 功能 | 说明 |
|--------|------|------|
| SKU-EXP-01 | 导出历史列表 | 显示所有SKU映射导出记录 |
| SKU-EXP-02 | 导出详情 | 查看每次导出的映射数量、导出人、时间 |
| SKU-EXP-03 | 重新导出 | 从历史记录重新导出 |
| SKU-EXP-04 | 下载按钮 | 下载历史导出文件 |
| SKU-EXP-05 | 导出统计 | 导出数量、关联订单数统计 |

**数据模型**：
```typescript
interface MappingExportRecord {
  id: string;
  exportType: 'customer' | 'supplier';
  mappingIds: string[];
  totalCount: number;
  exportedBy: string;
  exportedAt: string;
  fileUrl: string;
  filterConditions?: Record<string, string>;
}
```

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/mapping-exports` | GET | 获取导出历史 |
| `/api/mapping-exports` | POST | 创建新的映射导出 |
| `/api/mapping-exports/[id]` | GET | 获取导出详情 |
| `/api/mapping-exports/[id]/download` | GET | 下载导出文件 |
| `/api/mapping-exports/[id]/reexport` | POST | 重新导出 |

**交付物**：
- `src/app/api/mapping-exports/route.ts` 新建
- `src/app/api/mapping-exports/[id]/route.ts` 新建
- `src/app/(app)/sku-mappings/page.tsx` 增强导出历史Tab

---

### 阶段三：客户管理增强（优先级：P1）

#### 任务 3.1：客户SKU对照表

**目标**：实现客户商品SKU对照表功能

**功能节点**：
| 节点ID | 功能 | 说明 |
|--------|------|------|
| CUST-SKU-01 | 客户商品列表 | 显示客户的商品SKU对照 |
| CUST-SKU-02 | 新增对照 | 添加新的SKU对照 |
| CUST-SKU-03 | 编辑对照 | 修改SKU对照信息 |
| CUST-SKU-04 | 删除对照 | 删除SKU对照 |
| CUST-SKU-05 | Excel导入 | 批量导入SKU对照 |
| CUST-SKU-06 | Excel导出 | 导出客户SKU对照表 |

**对照表字段**：
| 字段 | 说明 | 必填 |
|------|------|------|
| 唯一编码 | 自动生成 | 是 |
| 客户名称 | * | 是 |
| 客户商品编码 | | |
| 客户商品名称 | * | 是 |
| 客户的商品型号 | * | 是 |
| 对应我司的商品编码 | 自动带出 | |
| 我司的商品型号 | 自动带出 | |
| 我司的商品名称 | 自动带出 | |

**交付物**：
- `src/app/api/customer-product-mappings/route.ts` 新建
- `src/components/customers/CustomerSkuMapping.tsx` 新建

---

#### 任务 3.2：批量交接功能

**目标**：实现批量更换业务员/跟单员功能

**功能节点**：
| 节点ID | 功能 | 说明 |
|--------|------|------|
| CUST-BATCH-01 | 客户多选 | 选择多个客户 |
| CUST-BATCH-02 | 批量更换业务员 | 更换所选客户的业务员 |
| CUST-BATCH-03 | 批量更换跟单员 | 更换所选客户的跟单员 |
| CUST-BATCH-04 | 交接确认 | 确认批量交接 |

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/customers/batch-update` | POST | 批量更新客户信息 |

**交付物**：
- `src/app/api/customers/batch-update/route.ts` 新建
- `src/components/customers/BatchTransferDialog.tsx` 新建

---

### 阶段四：库存管理增强（优先级：P1）

#### 任务 4.1：库存版本管理

**目标**：实现库存版本控制功能

**功能节点**：
| 节点ID | 功能 | 说明 |
|--------|------|------|
| INV-10 | 库存版本管理 | 导入时记录版本号 |
| INV-11 | 版本失效机制 | 供应商维度版本控制 |
| INV-12 | 最新版本生效 | 仅最新版本为有效数据 |

**数据模型**：
```typescript
interface StockVersion {
  id: string;
  supplierId: string;
  supplierName: string;
  versionNumber: string;
  importedAt: string;
  importedBy: string;
  totalProducts: number;
  status: 'active' | 'superseded';
}
```

**交付物**：
- `src/app/api/stock-versions/route.ts` 新建
- `src/app/api/stock-versions/[id]/route.ts` 新建
- `src/components/inventory/StockVersionHistory.tsx` 新建

---

### 阶段五：预警功能（优先级：P2）

#### 任务 5.1：订单预期预警规则

**目标**：实现订单时效监控预警功能

**预警规则**：
| 规则ID | 预警场景 | 触发条件 | 预警时间节点 |
|--------|----------|----------|-------------|
| WARN-01 | 通知发货预警 | 订单录入→通知供应商发货 | 当天16:00 |
| WARN-02 | 回单导入预警 | 通知供应商发货→导入回单 | 次日10:00 |
| WARN-03 | 客户反馈时效 | 待发货→订单反馈给客户 | 24小时 |

**功能节点**：
| 节点ID | 功能 | 说明 |
|--------|------|------|
| WARN-01 | 预警规则配置 | 配置预警时间参数 |
| WARN-02 | 预警开关控制 | 启用/禁用预警功能 |
| WARN-03 | 订单列表预警标记 | 未及时更新的订单高亮 |
| WARN-04 | 通知发货时效监控 | 超时触发预警 |
| WARN-05 | 回单导入时效监控 | 超时触发预警 |
| WARN-06 | 客户反馈时效监控 | 超时触发预警 |

**数据模型**：
```typescript
interface AlertRule {
  id: string;
  name: string;
  code: string;
  type: 'ship_notice' | 'receipt_import' | 'customer_feedback';
  config: {
    cutoffTime?: string; // 预警时间点
    cutoffHours?: number; // 预警小时数
  };
  isEnabled: boolean;
  priority: number;
}

interface AlertRecord {
  id: string;
  ruleId: string;
  orderId: string;
  alertType: string;
  alertLevel: 'info' | 'warning' | 'error';
  title: string;
  content: string;
  isRead: boolean;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
}
```

**API 设计**：
| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/alert-rules` | GET/POST | 获取/创建预警规则 |
| `/api/alert-rules/[id]` | GET/PUT/DELETE | 规则详情操作 |
| `/api/alert-records` | GET | 获取预警记录 |
| `/api/alert-records/[id]` | PATCH | 更新预警状态 |

**交付物**：
- `src/app/api/alert-rules/route.ts` 新建
- `src/app/api/alert-rules/[id]/route.ts` 新建
- `src/app/api/alert-records/route.ts` 新建
- `src/app/api/alert-records/[id]/route.ts` 新建
- `src/app/(app)/alerts/page.tsx` 新建预警中心页面
- `src/components/alerts/*` 新建组件

---

## 三、开发执行顺序

### 第一批（立即执行）⭐ 核心基础模块优先
1. ~~SKU映射页面Unicode问题修复~~ ✅ 已完成
2. **模板配置中心功能完善** ⭐ 核心基础模块
   - 模板字段配置功能
   - 模板与客户/供应商关联
   - 默认模板设置
3. 发货通知单导出模块（依赖模板配置中心）
4. 客户订单反馈导出模块（依赖模板配置中心）

### 第二批（下一迭代）
5. SKU映射导出历史追溯功能
6. 回单导入匹配模块
7. 订单中心功能完善

### 第三批（后续迭代）
8. 客户SKU对照表
9. 批量交接功能
10. 库存版本管理
11. 订单预期预警规则

---

### 任务依赖关系图

```
┌─────────────────────────────────────────────────────────────┐
│                    模板配置中心 (任务1.2)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ 发货通知模板 │  │客户反馈模板 │  │ 财务导出模板 │        │
│  └──────┬──────┘  └──────┬──────┘  └─────────────┘        │
└─────────┼────────────────┼─────────────────────────────────┘
          │                │
          ▼                ▼
┌─────────────────┐  ┌─────────────────┐
│ 发货通知单导出   │  │客户订单反馈导出 │
│ (任务1.3)       │  │ (任务1.4)       │
└────────┬────────┘  └────────┬────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
           ┌─────────────────┐
           │   订单中心      │
           │ (任务2.3)       │
           └─────────────────┘
```

---

## 四、技术注意事项

### 4.1 导出文件存储
- 所有导出的Excel文件存储到对象存储
- 导出记录保存文件URL和元数据

### 4.2 订单状态流转
```
待发货 → 通知发货 → 已发货 → 已反馈 → 已归档
    ↓
  已取消（可恢复，需校验）
```

### 4.3 权限控制
- 发货通知单导出：testop及以上
- 客户订单反馈导出：testop及以上
- 回单导入匹配：所有登录用户
- 预警配置：管理员

### 4.4 库存版本控制
- 每次导入以供应商维度整体导入
- 新版本生效，旧版本自动失效
- 查询库存仅展示最新版本数据

---

## 五、数据库变更

### 新增表

```sql
-- 导出历史记录表（统一存储各类导出历史）
CREATE TABLE export_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    export_type VARCHAR(50) NOT NULL, -- 'shipping_notice' | 'customer_feedback' | 'mapping'
    business_type VARCHAR(50), -- 'order' | 'sku_mapping'
    supplier_id UUID,
    customer_id UUID,
    order_ids UUID[],
    template_id UUID,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    total_count INTEGER DEFAULT 0,
    exported_by VARCHAR(100),
    exported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    filter_conditions JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 回单导入记录表
CREATE TABLE return_receipt_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(200),
    file_url TEXT NOT NULL,
    file_name VARCHAR(255),
    total_count INTEGER DEFAULT 0,
    matched_count INTEGER DEFAULT 0,
    imported_by VARCHAR(100),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 库存版本表
CREATE TABLE stock_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL,
    supplier_name VARCHAR(200),
    version_number VARCHAR(50) NOT NULL,
    version_date DATE NOT NULL,
    total_products INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- 'active' | 'superseded'
    imported_by VARCHAR(100),
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预警规则表
CREATE TABLE alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'ship_notice' | 'receipt_import' | 'customer_feedback'
    config JSONB NOT NULL,
    priority INTEGER DEFAULT 0,
    is_enabled BOOLEAN DEFAULT true,
    notification_channels JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 预警记录表
CREATE TABLE alert_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID REFERENCES alert_rules(id),
    rule_code VARCHAR(50),
    order_id UUID,
    order_no VARCHAR(100),
    alert_type VARCHAR(50),
    alert_level VARCHAR(20) DEFAULT 'warning', -- 'info' | 'warning' | 'error' | 'critical'
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 客户商品SKU对照表
CREATE TABLE customer_product_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL,
    customer_code VARCHAR(100),
    customer_name VARCHAR(200),
    customer_product_code VARCHAR(100),
    customer_product_name VARCHAR(200) NOT NULL,
    customer_product_model VARCHAR(100),
    product_id UUID,
    product_code VARCHAR(100),
    product_name VARCHAR(200),
    product_model VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 索引
```sql
CREATE INDEX idx_export_records_type ON export_records(export_type);
CREATE INDEX idx_export_records_date ON export_records(exported_at);
CREATE INDEX idx_return_receipt_records_supplier ON return_receipt_records(supplier_id);
CREATE INDEX idx_stock_versions_supplier ON stock_versions(supplier_id);
CREATE INDEX idx_stock_versions_status ON stock_versions(status);
CREATE INDEX idx_alert_records_order ON alert_records(order_id);
CREATE INDEX idx_alert_records_rule ON alert_records(rule_id);
CREATE INDEX idx_customer_product_mappings_customer ON customer_product_mappings(customer_id);
```

---

## 六、待确认事项

1. **导出文件格式**：确认统一使用xlsx格式
2. **预警通知方式**：短信/邮件/系统内通知
3. **历史数据迁移**：是否需要迁移现有数据到新表结构
4. **权限细化**：各角色具体权限分配

---

**文档版本**: v1.0
**下次更新**: 根据反馈修订
