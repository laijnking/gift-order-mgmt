import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 中文列名自动映射配置（按长度降序排列，优先匹配长名称）
const CHINESE_COLUMN_MAPPING: Record<string, string[]> = {
  // 优先匹配长名称的字段
  product_spec: ['商品规格', '规格型号', '规格名称', '型号规格', '商品型号'],
  product_name: ['商品名称', 'SKU商品名称', '全部商品名称', '商品名称/商品规格/客户SKU', '商品名', '商品'],
  product_code: ['SKU编号', 'SKUID', 'ERP编号', '商品单号', '商品编码'],
  barcode: ['商品69码', '69码', '条码'],
  brand: ['品牌名称', '商品品牌', '品牌'],
  receiver_name: ['收件人姓名', '收货人姓名', '收货人', '收件人', '会员昵称', '客户名称'],
  receiver_phone: ['收件人手机', '收货人手机号', '收货人电话', '收件人电话', '手机号', '电话'],
  receiver_address: ['收件人地址', '收货详细地址', '收货地址', '详细地址', '收货地址-省'],
  order_no: ['商户订单号', '用户订单号', '商品订单号', '订单编号', '单据编号', '序列'],
  bill_date: ['订单创建日期', '订单日期', '下单时间', '创建日期', '日期'],
  quantity: ['商品数量', '下单数量', '数量'],
  price: ['商品单价', '单价'],
  amount: ['订单合计', '金额', '总金额'],
  express_company: ['物流公司', '快递公司', '物流方'],
  tracking_no: ['物流单号', '快递单号', '快递号'],
  remark: ['客户备注', '客服备注', '备注'],
};

// 匹配精度排序
const MATCH_PRIORITY = ['spec', 'code', 'barcode', 'name'];

interface ParsedOrderItem {
  id: string;
  // 客户原始信息
  customerProductName: string;
  customerProductSpec: string;
  customerProductCode: string;
  customerBarcode: string;
  // 匹配后的系统信息
  systemProductId: string | null;
  systemProductName: string | null;
  systemProductSpec: string | null;
  systemProductCode: string | null;
  systemProductBrand: string | null;
  systemProductPrice: number | null;
  matchType: string | null;
  matchHint: string | null;
  // 供应商库存信息
  supplierMatches: {
    supplierId: string;
    supplierName: string;
    stockQuantity: number;
    stockPrice: number;
    warehouseName: string;
    matchType: string;
  }[];
  // 其他字段
  quantity: number;
  price: number | null;
  remark: string;
}

interface ParsedOrder {
  id: string;
  orderNo: string;
  billDate: string;
  // 收货信息
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  province: string;
  city: string;
  district: string;
  // 商品列表
  items: ParsedOrderItem[];
  // 订单级别的其他信息
  expressCompany: string;
  trackingNo: string;
  remark: string;
}

// 从地址中提取省市区
function extractAddressParts(address: string): { province: string; city: string; district: string } {
  const result = { province: '', city: '', district: '' };
  if (!address) return result;
  
  // 匹配省/市/区
  const match = address.match(/^([^省市区]+省)?([^省市区]+市)?([^省市区]+区)?/);
  if (match) {
    result.province = match[1]?.replace('省', '') || '';
    result.city = match[2]?.replace('市', '') || '';
    result.district = match[3]?.replace('区', '') || '';
  }
  
  return result;
}

// 自动检测Excel列名并生成映射（优先匹配最长名称）
function autoDetectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  
  // 将所有别名扁平化并按长度降序排列
  const allAliases: { alias: string; field: string; length: number }[] = [];
  for (const [field, aliases] of Object.entries(CHINESE_COLUMN_MAPPING)) {
    for (const alias of aliases) {
      allAliases.push({ alias, field, length: alias.length });
    }
  }
  // 按长度降序排列，优先匹配长名称
  allAliases.sort((a, b) => b.length - a.length);
  
  headers.forEach((header, index) => {
    if (!header) {
      mapping[index] = 'ignore';
      return;
    }
    
    const headerTrim = header.trim();
    let matched = false;
    
    // 遍历所有别名，优先匹配最长的
    for (const { alias, field } of allAliases) {
      if (headerTrim === alias) {
        mapping[index] = field;
        matched = true;
        break;
      }
    }
    
    // 如果没有精确匹配，尝试模糊匹配（表头包含别名）
    if (!matched) {
      const headerLower = headerTrim.toLowerCase();
      for (const { alias, field } of allAliases) {
        if (alias.length >= 2 && headerLower.includes(alias.toLowerCase())) {
          mapping[index] = field;
          matched = true;
          break;
        }
      }
    }
    
    if (!matched) {
      mapping[index] = 'ignore';
    }
  });
  
  return mapping;
}

// 匹配系统商品
async function matchSystemProduct(
  client: ReturnType<typeof getSupabaseClient>,
  customerCode: string,
  productName: string,
  productSpec: string,
  productCode: string,
  barcode: string
): Promise<{
  productId: string | null;
  productName: string | null;
  productSpec: string | null;
  productCode: string | null;
  brand: string | null;
  price: number | null;
  matchType: string | null;
  matchHint: string | null;
}> {
  const result = {
    productId: null as string | null,
    productName: null as string | null,
    productSpec: null as string | null,
    productCode: null as string | null,
    brand: null as string | null,
    price: null as number | null,
    matchType: null as string | null,
    matchHint: null as string | null,
  };
  
  // 1. 先查找客户商品映射
  const { data: mappings } = await client
    .from('product_mappings')
    .select('*')
    .eq('is_active', true)
    .or(`customer_code.eq.${customerCode},source_id.eq.${customerCode}`);
  
  // 按优先级匹配
  const matchOrder = [
    { type: 'code', value: productCode, field: 'source_product_code' },
    { type: 'spec', value: productSpec, field: 'source_product_spec' },
    { type: 'barcode', value: barcode, field: 'source_product_barcode' },
    { type: 'name', value: productName, field: 'source_product_name' },
  ];
  
  for (const match of matchOrder) {
    if (!match.value) continue;
    
    const mapping = mappings?.find((m: Record<string, unknown>) => {
      const fieldValue = m[match.field] as string;
      return fieldValue && (fieldValue === match.value || fieldValue.includes(match.value) || match.value.includes(fieldValue));
    });
    
    if (mapping) {
      result.productId = mapping.product_id as string;
      result.productName = mapping.system_product_name as string;
      result.productSpec = mapping.system_product_spec as string;
      result.productCode = mapping.system_product_code as string;
      result.price = mapping.price as number;
      result.matchType = 'mapping';
      result.matchHint = `通过客户SKU映射匹配 (${match.type})`;
      break;
    }
  }
  
  // 2. 如果没有找到映射，直接在商品档案中匹配
  if (!result.productId) {
    for (const match of matchOrder) {
      if (!match.value) continue;
      
      let query = client.from('products').select('*').eq('status', 'active');
      
      if (match.type === 'spec') {
        query = query.eq('spec', match.value);
      } else if (match.type === 'code') {
        query = query.eq('code', match.value);
      } else if (match.type === 'barcode') {
        query = query.eq('barcode', match.value);
      } else if (match.type === 'name') {
        query = query.ilike('name', `%${match.value}%`);
      }
      
      const { data: products } = await query;
      
      if (products && products.length > 0) {
        result.productId = products[0].id;
        result.productName = products[0].name;
        result.productSpec = products[0].spec;
        result.productCode = products[0].code;
        result.brand = products[0].brand;
        result.price = products[0].unit_price;
        result.matchType = match.type;
        result.matchHint = `通过商品档案匹配 (${match.type})`;
        break;
      }
    }
  }
  
  return result;
}

// 匹配供应商库存
async function matchSupplierStocks(
  client: ReturnType<typeof getSupabaseClient>,
  productId: string | null,
  productSpec: string | null,
  productCode: string | null,
  province: string
): Promise<{
  supplierId: string;
  supplierName: string;
  stockQuantity: number;
  stockPrice: number;
  warehouseName: string;
  matchType: string;
}[]> {
  let query = client
    .from('stocks')
    .select('*, warehouses(name)')
    .gt('quantity', 0)
    .eq('is_active', true);
  
  if (productId) {
    query = query.eq('system_product_id', productId);
  } else if (productCode) {
    query = query.eq('system_product_code', productCode);
  } else if (productSpec) {
    query = query.eq('system_product_spec', productSpec);
  } else {
    return [];
  }
  
  const { data: stocks } = await query;
  
  if (!stocks || stocks.length === 0) return [];
  
  // 按库存数量和同省优先排序
  const sortedStocks = stocks
    .map((s: Record<string, unknown>) => ({
      supplierId: s.supplier_id as string,
      supplierName: s.supplier_name as string,
      stockQuantity: s.quantity as number,
      stockPrice: s.price as number,
      warehouseName: ((s.warehouses as Record<string, unknown>)?.name as string) || '',
      matchType: s.match_type as string || 'unknown',
      isSameProvince: (s.supplier_name as string)?.includes(province) || false,
    }))
    .sort((a, b) => {
      // 尾货预警：库存<=2的排在后面
      const aLowStock = a.stockQuantity <= 2 ? -1000 : 0;
      const bLowStock = b.stockQuantity <= 2 ? -1000 : 0;
      // 同省优先
      const aProvince = a.isSameProvince ? 1000 : 0;
      const bProvince = b.isSameProvince ? 1000 : 0;
      // 按库存数量排序
      return (b.stockQuantity + bLowStock + bProvince) - (a.stockQuantity + aLowStock + aProvince);
    });
  
  return sortedStocks.slice(0, 5); // 最多返回5个供应商
}

// 批量解析Excel数据
async function parseExcelData(
  client: ReturnType<typeof getSupabaseClient>,
  rows: (string | number | null)[][],
  columnMapping: Record<string, string>,
  customerCode: string
): Promise<ParsedOrder[]> {
  const orders: Map<string, ParsedOrder> = new Map();
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // 提取各字段值
    const getField = (field: string): string => {
      for (const [colIdx, mappedField] of Object.entries(columnMapping)) {
        if (mappedField === field) {
          // 二维数组格式：用列索引获取值
          const value = row[parseInt(colIdx)];
          return value === null || value === undefined ? '' : String(value).trim();
        }
      }
      return '';
    };
    
    const orderNo = getField('order_no') || `AUTO-${Date.now()}-${i}`;
    const productName = getField('product_name');
    const productSpec = getField('product_spec');
    const productCode = getField('product_code');
    const barcode = getField('barcode');
    const quantity = parseInt(getField('quantity')) || 1;
    const price = parseFloat(getField('price')) || null;
    const receiverName = getField('receiver_name');
    const receiverPhone = getField('receiver_phone');
    const receiverAddress = getField('receiver_address');
    const expressCompany = getField('express_company');
    const trackingNo = getField('tracking_no');
    const remark = getField('remark');
    const billDate = getField('bill_date');
    
    // 如果没有商品名称，跳过此行
    if (!productName) continue;
    
    // 获取或创建订单
    let order = orders.get(orderNo);
    if (!order) {
      const addressParts = extractAddressParts(receiverAddress);
      order = {
        id: `order_${Date.now()}_${orders.size}`,
        orderNo,
        billDate,
        receiverName,
        receiverPhone,
        receiverAddress,
        province: addressParts.province,
        city: addressParts.city,
        district: addressParts.district,
        items: [],
        expressCompany,
        trackingNo,
        remark,
      };
      orders.set(orderNo, order);
    }
    
    // 匹配系统商品
    const matchedProduct = await matchSystemProduct(
      client,
      customerCode,
      productName,
      productSpec,
      productCode,
      barcode
    );
    
    // 匹配供应商库存
    const supplierMatches = await matchSupplierStocks(
      client,
      matchedProduct.productId,
      matchedProduct.productSpec,
      matchedProduct.productCode,
      order.province
    );
    
    // 创建订单商品明细
    const orderItem: ParsedOrderItem = {
      id: `item_${Date.now()}_${i}`,
      customerProductName: productName,
      customerProductSpec: productSpec,
      customerProductCode: productCode,
      customerBarcode: barcode,
      systemProductId: matchedProduct.productId,
      systemProductName: matchedProduct.productName,
      systemProductSpec: matchedProduct.productSpec,
      systemProductCode: matchedProduct.productCode,
      systemProductBrand: matchedProduct.brand,
      systemProductPrice: matchedProduct.price,
      matchType: matchedProduct.matchType,
      matchHint: matchedProduct.matchHint,
      supplierMatches,
      quantity,
      price: price || matchedProduct.price,
      remark: '',
    };
    
    order.items.push(orderItem);
  }
  
  return Array.from(orders.values());
}

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { rows, columnMapping, customerCode } = body;
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '数据不能为空',
      }, { status: 400 });
    }
    
    // 如果没有提供列映射，自动检测
    const mapping = columnMapping || autoDetectColumnMapping(Object.keys(rows[0] || {}));
    
    // 解析数据
    const orders = await parseExcelData(client, rows, mapping, customerCode || '');
    
    // 统计匹配结果
    const stats = {
      totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
      matchedItems: orders.reduce((sum, o) => sum + o.items.filter(i => i.systemProductId).length, 0),
      unmatchedItems: orders.reduce((sum, o) => sum + o.items.filter(i => !i.systemProductId).length, 0),
      ordersWithSupplier: orders.reduce((sum, o) => sum + o.items.filter(i => i.supplierMatches.length > 0).length, 0),
      ordersWithoutSupplier: orders.reduce((sum, o) => sum + o.items.filter(i => i.supplierMatches.length === 0).length, 0),
    };
    
    return NextResponse.json({
      success: true,
      data: {
        orders,
        stats,
        columnMapping: mapping,
      },
      message: `成功解析 ${orders.length} 个订单，共 ${stats.totalItems} 个商品`,
    });
  } catch (error) {
    console.error('解析Excel失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

// 获取列映射建议
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const headers = searchParams.get('headers');
  
  if (!headers) {
    return NextResponse.json({
      success: false,
      error: '缺少headers参数',
    }, { status: 400 });
  }
  
  try {
    const headerList = JSON.parse(headers) as string[];
    const mapping = autoDetectColumnMapping(headerList);
    
    // 转换为更友好的格式
    const suggestions = headerList.map((header, index) => ({
      column: index,
      originalHeader: header,
      suggestedField: mapping[index] === 'ignore' ? null : mapping[index],
      suggestions: mapping[index] === 'ignore' 
        ? Object.entries(CHINESE_COLUMN_MAPPING)
            .filter(([_, aliases]) => aliases.some(a => header.toLowerCase().includes(a.toLowerCase())))
            .map(([field]) => field)
        : [],
    }));
    
    return NextResponse.json({
      success: true,
      data: {
        mapping,
        suggestions,
        fieldOptions: Object.keys(CHINESE_COLUMN_MAPPING),
      },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
