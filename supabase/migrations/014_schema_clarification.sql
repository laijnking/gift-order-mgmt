-- ============================================================
-- Migration: 011_schema_clarification
-- Date: 2026-04-24
-- Description:
--   澄清数据模型：明确 suppliers 和 shippers 两个档案表的关系
--   以及 product_mappings 表的字段结构。
--
-- 背景说明（仅供理解，不要在代码中依赖此注释）：
--   系统经历过一次档案合并，历史上存在独立的"供应商档案"和"发货方档案"。
--   后来合并为一个档案系统，通过 type 字段区分类型（supplier/jd/self/third_party）。
--   当前实现中，两个表都存在但承担不同角色：
--     - suppliers: 原始表，API层使用，目前业务数据通过此表关联
--     - shippers: 新表，通过前端发货方管理页面写入，包含更丰富的字段
--   理想情况是统一使用一个表。但由于已有API和业务逻辑依赖 suppliers 表，
--   暂不做合并，以避免破坏性变更。
--   新增的发货方档案建议写入 shippers 表（通过前端页面）。
-- ============================================================

-- ----------------------------------------------------------
-- 1. suppliers 表（当前业务实际使用的档案表）
-- ----------------------------------------------------------
-- 字段说明（已与数据库同步）：

COMMENT ON TABLE suppliers IS '供应商档案表（业务层实际使用）。通过 type 字段区分类型：supplier/jd/self/third_party。';
COMMENT ON COLUMN suppliers.id IS '主键UUID';
COMMENT ON COLUMN suppliers.code IS '供应商编码';
COMMENT ON COLUMN suppliers.name IS '供应商名称';
COMMENT ON COLUMN suppliers.short_name IS '简称';
COMMENT ON COLUMN suppliers.type IS '类型：supplier(供应商)/jd(京东)/self(自有仓)/third_party(第三方仓)';
COMMENT ON COLUMN suppliers.contact IS '联系人姓名';
COMMENT ON COLUMN suppliers.contact_person IS '联系人姓名（与contact同义，优先使用此字段）';
COMMENT ON COLUMN suppliers.contact_phone IS '联系电话';
COMMENT ON COLUMN suppliers.send_type IS '发货方式：download/jd/pdd/self';
COMMENT ON COLUMN suppliers.province IS '所在省份';
COMMENT ON COLUMN suppliers.city IS '所在城市';
COMMENT ON COLUMN suppliers.can_jd IS '是否支持京东发货';
COMMENT ON COLUMN suppliers.express_restrictions IS '禁止使用的快递列表（JSON数组）';
COMMENT ON COLUMN suppliers.cost_factor IS '成本系数（百分比，如100表示1.0）';
COMMENT ON COLUMN suppliers.is_active IS '是否启用';
COMMENT ON COLUMN suppliers.remark IS '备注';

-- ----------------------------------------------------------
-- 2. shippers 表（前端发货方管理页面使用的档案表）
-- ----------------------------------------------------------

COMMENT ON TABLE shippers IS '发货方档案表（前端发货方管理页面使用）。与 suppliers 表功能有重叠，详见 011_schema_clarification 说明。';
COMMENT ON COLUMN shippers.code IS '发货方编码（与 suppliers.code 对应）';
COMMENT ON COLUMN shippers.name IS '发货方名称（与 suppliers.name 对应）';
COMMENT ON COLUMN shippers.type IS '类型：supplier/jd/pdd/self/third_party（与 suppliers.type 对应）';
COMMENT ON COLUMN shippers.send_type IS '发货方式（与 suppliers.send_type 对应）';
COMMENT ON COLUMN shippers.jd_channel_id IS '京东渠道ID（仅 type=jd 时有效）';
COMMENT ON COLUMN shippers.pdd_shop_id IS '拼多多店铺ID（仅 type=pdd 时有效）';
COMMENT ON COLUMN shippers.can_jd IS '是否支持京东发货';
COMMENT ON COLUMN shippers.can_pdd IS '是否支持拼多多发货';
COMMENT ON COLUMN shippers.express_restrictions IS '禁止使用的快递列表（JSON数组）';
COMMENT ON COLUMN shippers.settlement_type IS '结算方式';
COMMENT ON COLUMN shippers.cost_factor IS '成本系数';
COMMENT ON COLUMN shippers.province IS '所在省份';
COMMENT ON COLUMN shippers.city IS '所在城市';
COMMENT ON COLUMN shippers.short_name IS '简称';
COMMENT ON COLUMN shippers.contact_person IS '联系人';
COMMENT ON COLUMN shippers.contact_phone IS '联系电话';
COMMENT ON COLUMN shippers.address IS '详细地址';
COMMENT ON COLUMN shippers.is_active IS '是否启用';

-- ----------------------------------------------------------
-- 3. stocks 表（库存档案）
-- ----------------------------------------------------------

COMMENT ON TABLE stocks IS '库存档案表';
COMMENT ON COLUMN stocks.supplier_id IS '关联 suppliers.id（供应商/发货方档案ID）';
COMMENT ON COLUMN stocks.supplier_name IS '供应商/发货方名称（冗余存储，便于展示）';
COMMENT ON COLUMN stocks.warehouse_id IS '关联 warehouses.id（仓库ID，可为空）';
COMMENT ON COLUMN stocks.warehouse_name IS '仓库名称（冗余存储）';
COMMENT ON COLUMN stocks.quantity IS '当前库存数量';
COMMENT ON COLUMN stocks.reserved_quantity IS '预占数量（订单占用但未出库）';
COMMENT ON COLUMN stocks.available_quantity IS '可用数量 = quantity - reserved_quantity';
COMMENT ON COLUMN stocks.unit_price IS '单价';
COMMENT ON COLUMN stocks.min_stock IS '最低库存预警阈值';
COMMENT ON COLUMN stocks.max_stock IS '最高库存阈值';
COMMENT ON COLUMN stocks.status IS '状态：active/inactive';

-- ----------------------------------------------------------
-- 4. product_mappings 表（商品映射档案）
-- ----------------------------------------------------------

COMMENT ON TABLE product_mappings IS '商品映射档案表，支持客户映射和供应商映射。mapping_type 字段区分类型。';
COMMENT ON COLUMN product_mappings.product_id IS '关联 products.id（系统商品ID）';
COMMENT ON COLUMN product_mappings.product_code IS '系统商品编码';
COMMENT ON COLUMN product_mappings.product_name IS '系统商品名称';
COMMENT ON COLUMN product_mappings.customer_id IS '关联 customers.id（仅 mapping_type=customer 时有效）';
COMMENT ON COLUMN product_mappings.customer_code IS '客户编码';
COMMENT ON COLUMN product_mappings.customer_name IS '客户名称';
COMMENT ON COLUMN product_mappings.supplier_id IS '关联 suppliers.id（仅 mapping_type=supplier 时有效）';
COMMENT ON COLUMN product_mappings.supplier_name IS '供应商名称';
COMMENT ON COLUMN product_mappings.customer_sku IS '客户/供应商商品SKU编码';
COMMENT ON COLUMN product_mappings.customer_barcode IS '客户/供应商商品条码';
COMMENT ON COLUMN product_mappings.customer_product_name IS '客户/供应商商品名称（品名）';
COMMENT ON COLUMN product_mappings.price IS '客户/供应商采购价格';
COMMENT ON COLUMN product_mappings.mapping_type IS '映射类型：customer（客户商品映射）/supplier（供应商商品映射）';
COMMENT ON COLUMN product_mappings.is_active IS '是否启用（默认 true）';

-- ----------------------------------------------------------
-- 5. suppliers 表和 shippers 表的数据关系说明
-- ----------------------------------------------------------
-- suppliers 是 API 层的档案表，shippers 是前端发货方管理的档案表。
-- 两者通过 code 字段可以建立对应关系（理想情况下 code 应唯一）。
--
-- 当前业务规则：
--   - 库存导入时，从 shippers 表查找供应商（已修复）
--   - 订单相关API，从 suppliers 表查找供应商
--   - 建议：后续统一使用一个表，避免数据不一致
