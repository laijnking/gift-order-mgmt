import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { extractAddressParts, getColumnMappingDiagnostics } from '@/lib/column-mapping-rules';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import type {
  ParsedOrderBundleDraft,
  ParsedOrderDraftItem,
} from '@/types/order-parse';

// 中文列名自动映射配置（简化为最常用的精确匹配，避免冲突）
const CHINESE_COLUMN_MAPPING: Record<string, string[]> = {
  // 基础信息
  order_no: [],
  customer_order_no: ['客户单据编号', '序号', '客户订单号', '订单号','客户订单号','商户订单号', '来源订单', '订单编号'],
  bill_date: ['单据日期', '订单日期', '订单创建日期', '创建日期', '下单时间'],
  bill_no: ['单据编号'],
  supplier_order_no: ['发货方单据号', '发货方订单号'],
  customer_code: ['客户代码', '客户编码'],
  customer_name: ['客户名称', '客户姓名'],
  // 客户商品信息（使用 customer_product_* 作为内部字段名）
  customer_product_name: ['商品', '商品名称', '商品名', '货品名称', '品名', '客户商品名称', '客户商品名', '客户货品名称'],
  customer_product_code: ['商品编码', '商品代码', '货号', '客户商品编码', '客户商品代码', '客户货号'],
  customer_product_spec: ['商品规格', '规格/型号', '规格型号', '型号规格', '规格', '型号', '商品型号', '客户商品规格', '客户规格型号', '客户型号规格'],
  quantity: ['商品数量', '下单数量', '数量', '件数', '台数'],
  price: ['单价', '售价'],
  amount: ['价税合计', '含税金额', '金额'],
  discount: ['单台折让', '每台折让'],
  tax_rate: ['增值税税率'],
  warehouse: ['仓库', '仓库名称'],
  remark: ['备注', '商品行备注'],
  // 收货信息
  receiver_name: ['收件人姓名', '收货人姓名', '收货人', '收件人', '会员昵称'],
  receiver_phone: ['电话', '收件人手机', '收货人手机号', '收货人电话', '收件人电话', '收货电话', '收件电话', '手机号码', '联系电话'],
  receiver_address: ['收件人地址', '收货详细地址', '收货人地址', '收货地址', '收件地址', '详细地址'],
  // 快递信息
  express_company: ['物流公司', '快递公司', '承运商'],
  tracking_no: ['物流单号', '快递单号', '运单号', '快递号'],
  // 发票信息
  invoice_required: ['需要开票'],
  income_name: ['收入名称'],
  income_amount: ['应收金额', '收入金额'],
};

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
  productName: unknown,
  productSpec: unknown,
  productCode: unknown,
  barcode: unknown
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

  // 确保参数都是字符串
  const str = (v: unknown): string => (v == null ? '' : String(v));
  const safeIncludes = (s1: string, s2: string): boolean => s1.includes(s2);

  // 1. 先查找客户商品映射。当前真实库按 customer_id 关联，不再查询旧字段 customer_code/source_id。
  let mappings: Record<string, unknown>[] = [];
  if (customerCode) {
    const { data: customer } = await client
      .from('customers')
      .select('id')
      .eq('code', customerCode)
      .maybeSingle();

    if (customer?.id) {
      const { data } = await client
        .from('product_mappings')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('is_active', true);
      mappings = (data || []) as Record<string, unknown>[];
    }
  }

  const matchOrder = [
    { type: 'code', value: str(productCode), field: 'customer_sku' },
    { type: 'barcode', value: str(barcode), field: 'customer_barcode' },
    { type: 'spec', value: str(productSpec), field: 'customer_product_name' },
    { type: 'name', value: str(productName), field: 'customer_product_name' },
  ];

  for (const match of matchOrder) {
    if (!match.value) continue;

    const mapping = mappings.find((m: Record<string, unknown>) => {
      const fieldValue = str(m[match.field]);
      if (!fieldValue) return false;
      return fieldValue === match.value ||
             safeIncludes(fieldValue, match.value) ||
             safeIncludes(match.value, fieldValue);
    });

    if (mapping) {
      const pmProductId = str(mapping.product_id);
      const pmProductCode = str(mapping.product_code);

      if (pmProductId) {
        const { data: productsById } = await client
          .from('products')
          .select('*')
          .eq('id', pmProductId)
          .limit(1);
        if (productsById && productsById.length > 0) {
          const p = productsById[0] as Record<string, unknown>;
          result.productId = str(p.id);
          result.productName = str(p.name);
          result.productSpec = str(p.spec);
          result.productCode = str(p.code);
          result.brand = str(p.brand);
          result.price = Number(mapping.price) || null;
        }
      } else if (pmProductCode) {
        const { data: productsByCode } = await client
          .from('products')
          .select('*')
          .eq('code', pmProductCode)
          .limit(1);
        if (productsByCode && productsByCode.length > 0) {
          const p = productsByCode[0] as Record<string, unknown>;
          result.productId = str(p.id);
          result.productName = str(p.name);
          result.productSpec = str(p.spec);
          result.productCode = pmProductCode;
          result.brand = str(p.brand);
          result.price = Number(mapping.price) || null;
        }
      }
      if (result.productId) {
        result.matchType = 'mapping';
        result.matchHint = `通过SKU映射匹配 (${match.type})`;
        break;
      }
    }
  }

  // 2. 如果没有找到映射，直接在商品档案中匹配
  if (!result.productId) {
    // 获取所有活跃商品
    const { data: products } = await client
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(1000);

    if (!products || products.length === 0) {
      return result;
    }

    // 智能匹配算法
    let bestMatch: { product: Record<string, unknown>; score: number; matchType: string } | null = null;

    for (const product of products) {
      const pName = str(product.name);
      const pSpec = str(product.spec);
      const pCode = str(product.code);
      const pBarcode = str(product.barcode);

      let score = 0;
      let matchType = '';

      // 1. 条码精确匹配（最高优先级）
      if (barcode && pBarcode && (str(barcode) === pBarcode || safeIncludes(pBarcode, str(barcode)) || safeIncludes(str(barcode), pBarcode))) {
        score = 100;
        matchType = 'barcode';
      }
      // 2. 商品编码精确匹配
      else if (productCode && pCode && (str(productCode) === pCode || safeIncludes(pCode, str(productCode)) || safeIncludes(str(productCode), pCode))) {
        score = 95;
        matchType = 'code';
      }
      // 3. 规格型号精确匹配
      else if (productSpec && pSpec && (str(productSpec) === pSpec || safeIncludes(pSpec, str(productSpec)) || safeIncludes(str(productSpec), pSpec))) {
        score = 90;
        matchType = 'spec';
      }
      // 4. 商品名称精确匹配
      else if (productName && pName && str(productName) === pName) {
        score = 85;
        matchType = 'name';
      }
      // 5. 商品名称包含匹配
      else if (productName && pName && (safeIncludes(pName, str(productName)) || safeIncludes(str(productName), pName))) {
        score = 75;
        matchType = 'name';
      }
      // 6. 规格型号关键词匹配（提取规格中的关键部分）
      else if (productSpec && pSpec && (safeIncludes(pSpec, str(productSpec)) || safeIncludes(str(productSpec), pSpec))) {
        score = 65;
        matchType = 'spec';
      }
      // 7. 商品编码部分匹配
      else if (productCode && pCode && (safeIncludes(pCode, str(productCode)) || safeIncludes(str(productCode), pCode))) {
        score = 60;
        matchType = 'code';
      }
      // 8. 品牌+品类关键词匹配
      else if (productName && pName) {
        // 提取前4个字符作为关键词
        const key1 = str(productName).slice(0, Math.min(4, str(productName).length));
        const key2 = pName.slice(0, Math.min(4, pName.length));
        if (key1 && key2 && (safeIncludes(pName, key1) || safeIncludes(str(productName), key2))) {
          score = 40;
          matchType = 'keyword';
        }
      }

      if (score > (bestMatch?.score || 0)) {
        bestMatch = { product, score, matchType };
      }
    }

    // 只有匹配分数超过阈值才采用
    if (bestMatch && bestMatch.score >= 40) {
      const p = bestMatch.product;
      result.productId = p.id as string;
      result.productName = p.name as string;
      result.productSpec = p.spec as string;
      result.productCode = p.code as string;
      result.brand = p.brand as string;
      result.price = p.retail_price as number;
      result.matchType = bestMatch.matchType;
      result.matchHint = `通过商品档案${bestMatch.matchType}匹配 (${bestMatch.score}%)`;
    }
  }

  return result;
}

// 匹配发货方库存
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
    .select('*')
    .gt('quantity', 0)
    .eq('status', 'active');
  
  if (productId) {
    query = query.eq('product_id', productId);
  } else if (productCode) {
    query = query.eq('product_code', productCode);
  } else if (productSpec) {
    query = query.ilike('product_name', `%${productSpec}%`);
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
      stockPrice: Number(s.unit_price || 0),
      warehouseName: (s.warehouse_name as string) || '',
      matchType: productId ? 'product_id' : productCode ? 'product_code' : 'product_name',
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
  
  return sortedStocks.slice(0, 5); // 最多返回5个发货方
}

// 字段别名映射（前端字段名 -> 后端内部字段名）
const FIELD_ALIASES: Record<string, string[]> = {
  // 客户商品字段（内部统一使用 customer_product_*）
  'customer_product_name': ['customer_product_name'],
  'customer_product_spec': ['customer_product_spec'],
  'customer_product_code': ['customer_product_code'],
};

// 获取字段值（支持别名）
function getFieldValue(row: (string | number | null)[], columnMapping: Record<string, string>, field: string): string {
  // 可能的字段名列表（包括原始字段名和别名）
  const possibleFields = [field, ...(FIELD_ALIASES[field] || [])];

  for (const f of possibleFields) {
    for (const [colIdx, mappedField] of Object.entries(columnMapping)) {
      if (mappedField === f) {
        const value = row[parseInt(colIdx)];
        return value === null || value === undefined ? '' : String(value).trim();
      }
    }
  }
  return '';
}

// 批量解析Excel数据
async function parseExcelData(
  client: ReturnType<typeof getSupabaseClient>,
  rows: (string | number | null)[][],
  columnMapping: Record<string, string>,
  customerCode: string
): Promise<ParsedOrderBundleDraft[]> {
  const orders: Map<string, ParsedOrderBundleDraft> = new Map();

  for (let i = 0; i < rows.length; i++) {
    try {
      const row = rows[i];

      const customerOrderNo = getFieldValue(row, columnMapping, 'customer_order_no');
      const orderNo = getFieldValue(row, columnMapping, 'order_no') || customerOrderNo || `AUTO-${Date.now()}-${i}`;

      // 读取客户商品字段和系统商品字段，优先使用客户商品字段
      const customerProductName = getFieldValue(row, columnMapping, 'customer_product_name');
      const customerProductSpec = getFieldValue(row, columnMapping, 'customer_product_spec');
      const customerProductCode = getFieldValue(row, columnMapping, 'customer_product_code');
      const productName = getFieldValue(row, columnMapping, 'product_name');
      const productSpec = getFieldValue(row, columnMapping, 'product_spec');
      const productCode = getFieldValue(row, columnMapping, 'product_code');
      const barcode = getFieldValue(row, columnMapping, 'barcode');
      const quantity = parseInt(getFieldValue(row, columnMapping, 'quantity')) || 1;
      const price = parseFloat(getFieldValue(row, columnMapping, 'price')) || null;
      const receiverName = getFieldValue(row, columnMapping, 'receiver_name');
      const receiverPhone = getFieldValue(row, columnMapping, 'receiver_phone');
      const receiverAddress = getFieldValue(row, columnMapping, 'receiver_address');
      const expressCompany = getFieldValue(row, columnMapping, 'express_company');
      const trackingNo = getFieldValue(row, columnMapping, 'tracking_no');
      const remark = getFieldValue(row, columnMapping, 'remark');
      const billDate = getFieldValue(row, columnMapping, 'bill_date');

      // 最终使用的客户商品信息：优先使用 customer_product_* 字段，若为空则降级到 product_*
      const finalProductName = customerProductName || productName;
      const finalProductSpec = customerProductSpec || productSpec;
      const finalProductCode = customerProductCode || productCode;

      // 如果没有商品名称，跳过此行
      if (!finalProductName || finalProductName.trim() === '') continue;

      // 获取或创建订单
      let order = orders.get(orderNo);
      if (!order) {
        try {
          const addressParts = extractAddressParts(receiverAddress);
          order = {
            id: `order_${Date.now()}_${orders.size}`,
            orderNo,
            customerOrderNo,
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
        } catch (orderErr) {
          console.error('【API】创建订单失败:', orderErr, {orderNo, receiverAddress});
          continue;
        }
      }

      // 匹配系统商品
      let matchedProduct;
      try {
        matchedProduct = await matchSystemProduct(
          client,
          customerCode,
          finalProductName,
          finalProductSpec,
          finalProductCode,
          barcode
        );
      } catch (matchErr) {
        console.error('【API】matchSystemProduct失败:', matchErr, {productName: finalProductName, spec: finalProductSpec, code: finalProductCode});
        throw matchErr;
      }

      // 匹配发货方库存
      const supplierMatches = await matchSupplierStocks(
        client,
        matchedProduct.productId,
        matchedProduct.productSpec,
        matchedProduct.productCode,
        order.province
      );

      // 创建订单商品明细
      const orderItem: ParsedOrderDraftItem = {
        id: `item_${Date.now()}_${i}`,
        customerProductName: finalProductName,
        customerProductSpec: finalProductSpec,
        customerProductCode: finalProductCode,
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
    } catch (parseRowErr) {
      console.error(`【API】第${i}行解析失败:`, parseRowErr);
      continue;
    }
  }

  return Array.from(orders.values());
}

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { rows: rawRows, columnMapping, customerCode, headers = [] } = body;
    
    // 规范化 rows：如果前端传的是对象数组（{ "0": val, "1": val }），转换为真正的数组
    const rows: (string | number | null)[][] = (rawRows || []).map((row: unknown) => {
      if (Array.isArray(row)) return row;
      if (row && typeof row === 'object') {
        // 对象格式：{ "0": val, "1": val } -> [val, val]
        const obj = row as Record<string, unknown>;
        const maxIdx = Math.max(...Object.keys(obj).map(Number));
        return Array.from({ length: maxIdx + 1 }, (_, i) => {
          const v = obj[String(i)];
          return v === null || v === undefined ? null : (typeof v === 'string' || typeof v === 'number' ? v : String(v));
        });
      }
      return [];
    });
    
    // 调试日志
    console.log('【API】接收请求:', {
      rowsCount: rows?.length,
      columnMapping,
      customerCode,
    });
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: '数据不能为空',
      }, { status: 400 });
    }
    
    // 如果没有提供列映射，自动检测
    // 优先使用传入的 headers 参数（包含真实表头文本），否则从 rows[0] 的索引重建
    const excelHeaders: string[] = Array.isArray(headers) && headers.length > 0
      ? headers.map((h: unknown) => String(h ?? ''))
      : (rows[0] || []).map((_: unknown, idx: number) => String(idx));
    const mapping = columnMapping || autoDetectColumnMapping(excelHeaders);
    console.log('【API】使用的映射:', mapping);
    console.log('【API】Excel表头:', excelHeaders);
    
    // 解析数据
    let orders;
    try {
      orders = await parseExcelData(client, rows, mapping, customerCode || '');
    } catch (parseErr) {
      console.error('【API】parseExcelData内部错误:', parseErr);
      throw parseErr;
    }
    console.log('【API】解析结果:', { ordersCount: orders.length, itemsCount: orders.reduce((s, o) => s + o.items.length, 0) });
    
    // 如果解析结果为0，输出每行的调试信息
    if (orders.length === 0 && rows.length > 0) {
      for (let i = 0; i < Math.min(3, rows.length); i++) {
        const row = rows[i];
        const productName = mapping ? Object.entries(mapping).find(([, v]) => v === 'product_name')?.[0] : null;
        const productNameValue = productName ? row[parseInt(productName)] : null;
        console.log(`【API】第${i}行原始数据:`, row, '-> 商品名称值:', productNameValue);
      }
    }
    
    // 统计匹配结果
    const mappingDiagnostics = getColumnMappingDiagnostics(
      Array.isArray(headers) ? headers.map((header) => String(header ?? '')) : [],
      mapping
    );

    const stats = {
      totalItems: orders.reduce((sum, o) => sum + o.items.length, 0),
      matchedItems: orders.reduce((sum, o) => sum + o.items.filter(i => i.systemProductId).length, 0),
      unmatchedItems: orders.reduce((sum, o) => sum + o.items.filter(i => !i.systemProductId).length, 0),
      ordersWithSupplier: orders.reduce((sum, o) => sum + o.items.filter(i => i.supplierMatches.length > 0).length, 0),
      ordersWithoutSupplier: orders.reduce((sum, o) => sum + o.items.filter(i => i.supplierMatches.length === 0).length, 0),
      totalHeaderCount: mappingDiagnostics.totalHeaderCount,
      nonEmptyHeaderCount: mappingDiagnostics.nonEmptyHeaderCount,
      mappedColumnCount: mappingDiagnostics.mappedColumnCount,
      ignoredColumnCount: mappingDiagnostics.ignoredColumnCount,
      extensionColumnCount: mappingDiagnostics.extensionColumnCount,
      recognizedFieldCount: mappingDiagnostics.recognizedFieldCount,
      coverageRate: mappingDiagnostics.coverageRate,
      conflictFields: mappingDiagnostics.conflictFields,
      unrecognizedHeaders: mappingDiagnostics.unrecognizedHeaders,
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
            .filter(([, aliases]) => aliases.some(a => header.toLowerCase().includes(a.toLowerCase())))
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
