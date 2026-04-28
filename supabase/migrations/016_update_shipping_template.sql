-- 更新默认发货通知模板配置
-- 新的发货通知单模板包含：系统订单号（回单匹配依据）、发货方商品编码/名称、物流信息

-- 更新标准发货通知单模板（c0000000-0000-0000-0000-000000000001）
UPDATE templates
SET
  field_mappings = '{"系统订单号（请勿删除和修改）":"sysOrderNo","发货方商品编码":"supplierProductCode","发货方商品名称":"supplierProductName","收货人":"receiverName","联系电话":"receiverPhone","收货地址":"receiverAddress","数量":"quantity","物流方":"expressCompany","物流单号":"trackingNo","运费":"expressFee"}',
  config = '{"fieldMappings":{"系统订单号（请勿删除和修改）":"sysOrderNo","发货方商品编码":"supplierProductCode","发货方商品名称":"supplierProductName","收货人":"receiverName","联系电话":"receiverPhone","收货地址":"receiverAddress","数量":"quantity","物流方":"expressCompany","物流单号":"trackingNo","运费":"expressFee"}}',
  description = '发货通知单标准模板。系统订单号用于回单匹配，请勿删除和修改。发货方商品编码/名称来自派发时快照。'
WHERE id = 'c0000000-0000-0000-0000-000000000001';

-- 更新详细发货通知单模板（c0000000-0000-0000-0000-000000000002）
UPDATE templates
SET
  field_mappings = '{"系统订单号（请勿删除和修改）":"sysOrderNo","发货方商品编码":"supplierProductCode","发货方商品名称":"supplierProductName","收货人":"receiverName","联系电话":"receiverPhone","收货地址":"receiverAddress","规格型号":"productSpec","数量":"quantity","单价":"unitCost","物流方":"expressCompany","物流单号":"trackingNo","运费":"expressFee","备注":"remark"}',
  config = '{"fieldMappings":{"系统订单号（请勿删除和修改）":"sysOrderNo","发货方商品编码":"supplierProductCode","发货方商品名称":"supplierProductName","收货人":"receiverName","联系电话":"receiverPhone","收货地址":"receiverAddress","规格型号":"productSpec","数量":"quantity","单价":"unitCost","物流方":"expressCompany","物流单号":"trackingNo","运费":"expressFee","备注":"remark"}}',
  description = '详细发货通知单模板，包含更多字段。系统订单号用于回单匹配，请勿删除和修改。'
WHERE id = 'c0000000-0000-0000-0000-000000000002';

-- 验证更新结果
SELECT
  id,
  name,
  type,
  field_mappings
FROM templates
WHERE id IN ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002');
