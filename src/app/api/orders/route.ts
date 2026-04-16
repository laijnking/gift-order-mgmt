import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';
import crypto from 'crypto';

// 数据库字段转前端格式
function transformOrder(dbOrder: Record<string, unknown>, options?: {
  customerMap?: Record<string, { id: string; salesUserName: string; operatorUserName: string }>;
  userMap?: Record<string, { id: string; realName: string }>;
  supplierMap?: Record<string, { id: string; name: string }>;
  warehouseMap?: Record<string, { id: string; name: string }>;
}) {
  const customerCode = (dbOrder.customer_code || '') as string;
  const customerInfo = options?.customerMap?.[customerCode];
  const salespersonId = dbOrder.salesperson_id as string | undefined;
  const operatorId = dbOrder.operator_id as string | undefined;
  const customerId = dbOrder.customer_id as string | undefined;
  const supplierId = dbOrder.supplier_id as string | undefined;
  const warehouseId = dbOrder.warehouse_id as string | undefined;

  // 组装备用字段
  const extFields: Record<string, string | null> = {};
  for (let i = 1; i <= 20; i++) {
    const key = `ext_field_${i}`;
    const val = dbOrder[key] as string | null;
    if (val) extFields[key] = val;
  }

  // 优先使用档案名称，fallback到冗余字段
  const salespersonName = dbOrder.salesperson as string ||
    options?.userMap?.[salespersonId || '']?.realName ||
    customerInfo?.salesUserName || '';

  const operatorName = dbOrder.operator_name as string ||
    options?.userMap?.[operatorId || '']?.realName ||
    customerInfo?.operatorUserName || '';

  const supplierName = dbOrder.supplier_name as string ||
    options?.supplierMap?.[supplierId || '']?.name || '';

  const warehouseName = dbOrder.warehouse as string ||
    options?.warehouseMap?.[warehouseId || '']?.name || '';

  // 转换items，处理新旧两种格式
  const rawItems = typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items as string) : (dbOrder.items || []);
  const items = rawItems.map((item: Record<string, unknown>) => ({
    // 客户原始商品信息（从Excel映射获取）
    cuProductName: item.cu_product_name as string || item.product_name as string || '',
    cuProductCode: item.cu_product_code as string || '',
    cuProductSpec: item.cu_product_spec as string || '',
    // 系统商品档案信息（自动匹配或手动指定）
    productId: item.product_id as string || item.systemProductId as string || null,
    productName: item.product_name as string || item.systemProductName as string || '',
    productSpec: item.product_spec as string || item.systemProductSpec as string || '',
    productCode: item.product_code as string || item.systemProductCode as string || '',
    productBrand: item.product_brand as string || item.systemProductBrand as string || '',
    unitPrice: item.unit_price as number | null || null,
    // 订单商品信息
    quantity: item.quantity as number || 1,
    price: item.price as number | null || null,
    remark: item.remark as string || '',
    // 匹配信息
    matchType: item.match_type as string || '',
    matchHint: item.match_hint as string || '',
  }));

  return {
    id: dbOrder.id,
    sysOrderNo: dbOrder.sys_order_no as string | undefined,
    orderNo: dbOrder.order_no,
    billNo: dbOrder.bill_no as string | undefined,
    billDate: dbOrder.bill_date as string | undefined,
    supplierOrderNo: dbOrder.supplier_order_no,
    status: dbOrder.status,
    items: items,
    receiver: {
      name: dbOrder.receiver_name || '',
      phone: dbOrder.receiver_phone || '',
      address: dbOrder.receiver_address || '',
      province: dbOrder.province as string | undefined,
      city: dbOrder.city as string | undefined,
      district: dbOrder.district as string | undefined,
    },
    customerId: customerId,
    customerCode: dbOrder.customer_code || '',
    customerName: dbOrder.customer_name || customerInfo?.id || '',
    salespersonId: salespersonId,
    salesperson: salespersonName,
    salespersonName: salespersonName,
    operatorId: operatorId,
    operatorName: operatorName,
    supplierId: supplierId,
    supplierName: supplierName,
    warehouseId: warehouseId,
    warehouse: warehouseName,
    amount: dbOrder.amount as number | undefined,
    discount: dbOrder.discount as number | undefined,
    taxRate: dbOrder.tax_rate as number | undefined,
    incomeName: dbOrder.income_name as string | undefined,
    incomeAmount: dbOrder.income_amount as number | undefined,
    invoiceRequired: dbOrder.invoice_required as boolean | undefined,
    expressCompany: dbOrder.express_company as string | undefined,
    trackingNo: dbOrder.tracking_no as string | undefined,
    source: dbOrder.source || 'excel',
    importBatch: dbOrder.import_batch as string | undefined,
    assignedBatch: dbOrder.assigned_batch as string | undefined,
    matchCode: dbOrder.match_code as string | undefined,
    createdAt: dbOrder.created_at,
    updatedAt: dbOrder.updated_at,
    assignedAt: dbOrder.assigned_at as string | undefined,
    completedAt: dbOrder.completed_at as string | undefined,
    remark: dbOrder.remark as string | undefined,
    expressRequirement: dbOrder.express_requirement as string | undefined,
    extFields: Object.keys(extFields).length > 0 ? extFields : undefined,
  };
}

// 生成系统订单号: SYS-YYYYMMDD-XXXX + 随机后缀 (确保高并发唯一性)
async function generateSysOrderNo(client: ReturnType<typeof getSupabaseClient>): Promise<string> {
  const today = new Date();
  const dateStr = today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, '0') +
    String(today.getDate()).padStart(2, '0');
  
  // 查询当天已有订单数
  const startOfDay = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}T00:00:00`;
  const { count } = await client
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay);
  
  // 使用微秒时间戳 + 随机数确保唯一性
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const seq = (count || 0) + 1;
  return `SYS-${dateStr}-${String(seq).padStart(4, '0')}-${timestamp}${random}`;
}

// 获取当前用户信息（从请求头）
function getCurrentUser(request: NextRequest): { username: string; role: string; dataScope: string } | null {
  try {
    const userHeader = request.headers.get('x-user-info');
    if (userHeader) {
      return JSON.parse(userHeader);
    }
  } catch {
    // 忽略解析错误
  }
  return null;
}

// 根据 username 获取用户的真实姓名（用于数据权限过滤）
async function getUserRealNameByUsername(client: ReturnType<typeof getSupabaseClient>, username: string): Promise<string | null> {
  if (!username) return null;
  
  const { data: users } = await client
    .from('users')
    .select('real_name')
    .eq('username', username)
    .limit(1);
  
  return users?.[0]?.real_name || null;
}

// 提取纯姓名（去除括号内容，如 "张三（业务员）" -> "张三"）
function extractName(realName: string): string {
  // 去除括号及其内容
  return realName.replace(/\s*[\（\(].*[\）\)].*$/, '').trim();
}

// 辅助函数：根据名称查找用户ID
async function findUserIdByName(client: ReturnType<typeof getSupabaseClient>, name: string): Promise<string | null> {
  if (!name) return null;
  const pureName = extractName(name);
  
  // 优先精确匹配（去除括号后的姓名）
  const { data: users } = await client
    .from('users')
    .select('id, real_name')
    .ilike('real_name', `%${pureName}%`)
    .limit(1);
  
  return users?.[0]?.id || null;
}

// 辅助函数：根据客户代码查找客户ID
async function findCustomerIdByCode(client: ReturnType<typeof getSupabaseClient>, code: string): Promise<{ id: string; name: string } | null> {
  if (!code) return null;
  
  const { data: customers } = await client
    .from('customers')
    .select('id, name')
    .eq('code', code)
    .limit(1);
  
  if (customers?.[0]) {
    return { id: customers[0].id, name: customers[0].name };
  }
  
  // 如果代码匹配不到，尝试模糊匹配名称
  const { data: customersByName } = await client
    .from('customers')
    .select('id, name')
    .ilike('name', `%${code}%`)
    .limit(1);
  
  return customersByName?.[0] ? { id: customersByName[0].id, name: customersByName[0].name } : null;
}

// 辅助函数：根据供应商名称查找供应商ID
async function findSupplierIdByName(client: ReturnType<typeof getSupabaseClient>, name: string): Promise<{ id: string; name: string } | null> {
  if (!name) return null;
  
  const { data: suppliers } = await client
    .from('suppliers')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .limit(1);
  
  return suppliers?.[0] ? { id: suppliers[0].id, name: suppliers[0].name } : null;
}

// 辅助函数：根据仓库名称查找仓库ID
async function findWarehouseIdByName(client: ReturnType<typeof getSupabaseClient>, name: string): Promise<{ id: string; name: string } | null> {
  if (!name) return null;
  
  const { data: warehouses } = await client
    .from('warehouses')
    .select('id, name')
    .ilike('name', `%${name}%`)
    .limit(1);
  
  return warehouses?.[0] ? { id: warehouses[0].id, name: warehouses[0].name } : null;
}

// 辅助函数：批量构建档案映射（用于transformOrder优化）
async function buildRelatedMaps(client: ReturnType<typeof getSupabaseClient>, orders: Record<string, unknown>[]) {
  // 收集所有需要查询的ID
  const userIds = new Set<string>();
  const customerCodes = new Set<string>();
  const supplierIds = new Set<string>();
  const warehouseIds = new Set<string>();
  
  for (const order of orders) {
    if (order.salesperson_id) userIds.add(order.salesperson_id as string);
    if (order.operator_id) userIds.add(order.operator_id as string);
    if (order.customer_code) customerCodes.add(order.customer_code as string);
    if (order.supplier_id) supplierIds.add(order.supplier_id as string);
    if (order.warehouse_id) warehouseIds.add(order.warehouse_id as string);
  }
  
  // 批量查询用户
  const userMap: Record<string, { id: string; realName: string }> = {};
  if (userIds.size > 0) {
    const { data: users } = await client
      .from('users')
      .select('id, real_name')
      .in('id', Array.from(userIds));
    users?.forEach(u => { userMap[u.id] = { id: u.id, realName: u.real_name }; });
  }
  
  // 批量查询客户
  const customerMap: Record<string, { id: string; salesUserName: string; operatorUserName: string }> = {};
  if (customerCodes.size > 0) {
    const { data: customers } = await client
      .from('customers')
      .select('code, id, sales_user_name, operator_user_name')
      .in('code', Array.from(customerCodes));
    customers?.forEach(c => {
      customerMap[c.code] = {
        id: c.id,
        salesUserName: c.sales_user_name || '',
        operatorUserName: c.operator_user_name || '',
      };
    });
  }
  
  // 批量查询供应商
  const supplierMap: Record<string, { id: string; name: string }> = {};
  if (supplierIds.size > 0) {
    const { data: suppliers } = await client
      .from('suppliers')
      .select('id, name')
      .in('id', Array.from(supplierIds));
    suppliers?.forEach(s => { supplierMap[s.id] = { id: s.id, name: s.name }; });
  }
  
  // 批量查询仓库
  const warehouseMap: Record<string, { id: string; name: string }> = {};
  if (warehouseIds.size > 0) {
    const { data: warehouses } = await client
      .from('warehouses')
      .select('id, name')
      .in('id', Array.from(warehouseIds));
    warehouses?.forEach(w => { warehouseMap[w.id] = { id: w.id, name: w.name }; });
  }
  
  return { userMap, customerMap, supplierMap, warehouseMap };
}

// 商品匹配结果类型
interface ProductMatchResult {
  productId: string | null;
  productName: string;
  productSpec: string;
  productCode: string;
  unitPrice: number | null;
  matchType: 'spec' | 'name' | 'mapping' | 'none';
  matchHint: string;
}

// 商品档案自动匹配函数
async function matchProduct(
  client: ReturnType<typeof getSupabaseClient>,
  customerProductName: string,
  customerProductCode: string,
  customerProductSpec: string
): Promise<ProductMatchResult> {
  // 1. 先查询SKU映射表（客户商品→系统商品）
  const { data: mappings } = await client
    .from('product_mappings')
    .select('*')
    .ilike('customer_product_name', `%${customerProductName}%`)
    .limit(5);

  if (mappings && mappings.length > 0) {
    // 找到映射关系，匹配到系统商品
    const mapping = mappings.find((m: Record<string, unknown>) => {
      const mappingName = (m.customer_product_name as string) || '';
      return mappingName.includes(customerProductName) || customerProductName.includes(mappingName);
    }) || mappings[0];

    if (mapping) {
      const { data: products } = await client
        .from('products')
        .select('*')
        .eq('id', mapping.system_product_id)
        .limit(1);

      if (products && products.length > 0) {
        const p = products[0];
        return {
          productId: p.id,
          productName: p.name as string,
          productSpec: p.spec as string || '',
          productCode: p.code as string || '',
          unitPrice: p.unit_price as number || null,
          matchType: 'mapping',
          matchHint: `通过SKU映射匹配：${customerProductName} → ${p.name}`,
        };
      }
    }
  }

  // 2. 根据规格型号精确匹配 products 表
  if (customerProductSpec) {
    const { data: specProducts } = await client
      .from('products')
      .select('*')
      .ilike('spec', customerProductSpec)
      .limit(3);

    if (specProducts && specProducts.length > 0) {
      // 找到精确匹配
      const p = specProducts[0];
      return {
        productId: p.id,
        productName: p.name as string,
        productSpec: p.spec as string || '',
        productCode: p.code as string || '',
        unitPrice: p.unit_price as number || null,
        matchType: 'spec',
        matchHint: `通过规格型号精确匹配：${customerProductSpec}`,
      };
    }
  }

  // 3. 根据商品名称模糊匹配 products 表
  if (customerProductName) {
    const { data: nameProducts } = await client
      .from('products')
      .select('*')
      .ilike('name', `%${customerProductName}%`)
      .limit(3);

    if (nameProducts && nameProducts.length > 0) {
      const p = nameProducts[0];
      return {
        productId: p.id,
        productName: p.name as string,
        productSpec: p.spec as string || '',
        productCode: p.code as string || '',
        unitPrice: p.unit_price as number || null,
        matchType: 'name',
        matchHint: `通过商品名称模糊匹配：${customerProductName} → ${p.name}`,
      };
    }
  }

  // 4. 未匹配到任何商品档案
  return {
    productId: null,
    productName: customerProductName,
    productSpec: customerProductSpec,
    productCode: customerProductCode,
    unitPrice: null,
    matchType: 'none',
    matchHint: `未匹配到商品档案，使用客户原始信息`,
  };
}

// 获取所有订单
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customerCode = searchParams.get('customerCode');
  const supplierId = searchParams.get('supplierId');
  const search = searchParams.get('search');

  // 获取当前用户信息用于数据权限过滤
  const currentUser = getCurrentUser(request);

  try {
    let query = client.from('orders').select('*');

    // ==================== 数据权限过滤 ====================
    // 仅本人(self)：只看业务员或跟单员是自己的订单
    if (currentUser && currentUser.dataScope === 'self') {
      // 根据 username 获取用户的真实姓名
      const realName = await getUserRealNameByUsername(client, currentUser.username);
      
      if (!realName) {
        // 如果无法获取用户姓名，返回空结果
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          message: '无法获取用户信息'
        });
      }
      
      // 提取纯姓名（去除括号，如 "张三（业务员）" -> "张三"）
      const pureName = extractName(realName);
      
      // 查询当前用户负责的客户代码
      const { data: userCustomers } = await client
        .from('customers')
        .select('code')
        .or(`sales_user_name.ilike.%${pureName}%,operator_user_name.ilike.%${pureName}%`);
      
      const customerCodes = userCustomers?.map(c => c.code) || [];
      
      if (customerCodes.length > 0) {
        query = query.in('customer_code', customerCodes);
      } else {
        // 如果用户没有负责任何客户，返回空结果
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          message: '暂无权限查看的订单'
        });
      }
    }
    // =====================================================

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (customerCode) {
      query = query.eq('customer_code', customerCode);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (search) {
      query = query.or(`order_no.ilike.%${search}%,sys_order_no.ilike.%${search}%,receiver_name.ilike.%${search}%,receiver_phone.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(`查询订单失败: ${error.message}`);

    // 批量构建档案映射
    const relatedMaps = await buildRelatedMaps(client, data || []);
    const customerMap = relatedMaps.customerMap;

    // 转换数据格式
    const transformedData = (data || []).map((order) => transformOrder(order as Record<string, unknown>, {
      customerMap,
      userMap: relatedMaps.userMap,
      supplierMap: relatedMaps.supplierMap,
      warehouseMap: relatedMaps.warehouseMap
    }));

    return NextResponse.json({
      success: true,
      data: transformedData,
      total: data?.length || 0
    });
  } catch (error) {
    console.error('获取订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 导入订单（支持JSON格式创建和Excel文件上传）
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const contentType = request.headers.get('content-type') || '';

    // JSON格式：从AI解析结果创建订单
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const { customerCode, customerName, salespersonName, operatorName, items, receiver, supplierId, supplierName } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({
          success: false,
          error: '请提供订单商品列表'
        }, { status: 400 });
      }

      // 预查找档案ID（只查询一次，避免循环中重复查询）
      const [customerInfo, salespersonId, operatorId, supplierInfo] = await Promise.all([
        findCustomerIdByCode(client, customerCode),
        findUserIdByName(client, salespersonName || ''),
        findUserIdByName(client, operatorName || ''),
        supplierId && supplierId !== 'none' ? findSupplierIdByName(client, supplierName || '') : Promise.resolve(null),
      ]);

      const importBatch = `AI-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
      const ordersToInsert = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.productName) continue;

        // 逐行查找档案ID（如果有变化的话）
        const itemSalespersonId = item.salesperson ? await findUserIdByName(client, item.salesperson) : salespersonId;
        const itemOperatorId = item.operator ? await findUserIdByName(client, item.operator) : operatorId;
        const itemWarehouseInfo = item.warehouse ? await findWarehouseIdByName(client, item.warehouse) : null;
        const itemSupplierInfo = item.supplierId && item.supplierId !== 'none' 
          ? { id: item.supplierId, name: item.supplierName || '' } 
          : supplierInfo;

        const receiverName = item.receiver_name || receiver?.name || '未知';
        const receiverPhone = item.receiver_phone || receiver?.phone || '';
        const receiverAddress = item.receiver_address || receiver?.address || '';
        const matchCode = generateMatchCode(
          customerCode || 'UNKNOWN',
          receiverName,
          item.productSpec || item.productName,
          item.quantity || 1
        );
        const addrParsed = parseAddress(receiverAddress);
        const sysOrderNo = await generateSysOrderNo(client);

        // 构备用字段
        const extFieldData: Record<string, string | null> = {};
        if (item.extFields && typeof item.extFields === 'object') {
          for (const [key, val] of Object.entries(item.extFields)) {
            if (key.startsWith('ext_field_') && val) {
              extFieldData[key] = String(val);
            }
          }
        }

        ordersToInsert.push({
          sys_order_no: sysOrderNo,
          order_no: item.orderNo || item.billNo || `ORD-${Date.now()}-${i}`,
          bill_no: item.billNo || null,
          bill_date: item.billDate || null,
          supplier_order_no: item.supplierOrderNo || null,
          status: itemSupplierInfo?.id ? 'assigned' : 'pending',
          items: [{
            product_name: item.productName,
            product_spec: item.productSpec || '',
            product_code: item.productCode || '',
            quantity: item.quantity || 1,
            price: item.price || undefined,
            amount: item.amount || undefined,
            discount: item.discount || undefined,
            tax_rate: item.taxRate || undefined,
            warehouse: item.warehouse || undefined,
            remark: item.remark || ''
          }],
          receiver_name: receiverName,
          receiver_phone: receiverPhone,
          receiver_address: receiverAddress,
          province: addrParsed.province,
          city: addrParsed.city,
          district: addrParsed.district,
          // 客户信息：存储ID和冗余名称
          customer_id: customerInfo?.id || null,
          customer_code: customerCode || 'UNKNOWN',
          customer_name: customerInfo?.name || customerName || '未知客户',
          // 业务员信息：存储ID和冗余名称
          salesperson_id: itemSalespersonId || null,
          salesperson: itemSalespersonId ? (item.salesperson || salespersonName || '') : (salespersonName || item.salesperson || '未知业务员'),
          // 跟单员信息：存储ID和冗余名称
          operator_id: itemOperatorId || null,
          operator_name: itemOperatorId ? (item.operator || operatorName || '') : (operatorName || item.operator || ''),
          // 供应商信息：存储ID和冗余名称
          supplier_id: itemSupplierInfo?.id || null,
          supplier_name: itemSupplierInfo?.name || supplierName || '',
          // 仓库信息：存储ID和冗余名称
          warehouse_id: itemWarehouseInfo?.id || null,
          warehouse: itemWarehouseInfo?.name || item.warehouse || '',
          // 其他字段
          express_company: item.express_company || null,
          tracking_no: item.tracking_no || null,
          amount: item.amount || null,
          discount: item.discount || null,
          tax_rate: item.taxRate || null,
          income_name: item.income_name || null,
          income_amount: item.income_amount || null,
          invoice_required: item.invoice_required || null,
          source: 'ai_parse',
          import_batch: importBatch,
          match_code: matchCode,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...extFieldData,
        });
      }

      if (ordersToInsert.length === 0) {
        return NextResponse.json({
          success: false,
          error: '未解析到有效订单数据'
        }, { status: 400 });
      }

      const { data, error } = await client.from('orders').insert(ordersToInsert).select();
      if (error) throw new Error(`创建订单失败: ${error.message}`);

      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
        importBatch,
        message: `成功创建 ${data?.length || 0} 条订单`
      });
    }

    // FormData格式：从Excel文件导入
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerCode = formData.get('customerCode') as string || 'UNKNOWN';
    const customerName = formData.get('customerName') as string || '未知客户';
    const salesperson = formData.get('salesperson') as string || '未知业务员';

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        error: '请上传Excel文件' 
      }, { status: 400 });
    }

    // 读取Excel文件
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as (string | number | undefined)[][];

    if (jsonData.length < 2) {
      return NextResponse.json({ 
        success: false, 
        error: 'Excel文件数据为空或格式不正确' 
      }, { status: 400 });
    }

    // 解析表头
    const headers = jsonData[0].map(h => String(h).trim());
    
    // 字段映射配置
    const fieldMappings = {
      orderNo: findHeader(headers, ['订单号', '订单编号', '销售订单编号', '单据编号', '订单号']),
      productName: findHeader(headers, ['商品名称', '商品品名', '品名', '商品标题']),
      productSpec: findHeader(headers, ['规格', '规格型号', '型号', '规格型号', '商品规格']),
      productCode: findHeader(headers, ['编码', '商品编码', 'SKU', '商品货号', '货号']),
      quantity: findHeader(headers, ['数量', '商品数量', 'qty', '件数']),
      price: findHeader(headers, ['单价', '采购单价', 'price']),
      receiverName: findHeader(headers, ['收货人', '收件人', '姓名']),
      receiverPhone: findHeader(headers, ['电话', '手机', '收货电话', '收件人电话', '手机号码']),
      receiverAddress: findHeader(headers, ['地址', '收货地址', '收件地址', '收货地址']),
      remark: findHeader(headers, ['备注', '商品行备注']),
    };

    // 识别已映射的列索引，剩余列自动分配到备用字段
    const mappedIndices = new Set(Object.values(fieldMappings).filter((v): v is number => v !== null));
    const extFieldColumns: { headerIndex: number; extFieldKey: string }[] = [];
    let extCounter = 1;
    for (let h = 0; h < headers.length; h++) {
      if (!mappedIndices.has(h) && extCounter <= 20) {
        extFieldColumns.push({ headerIndex: h, extFieldKey: `ext_field_${extCounter}` });
        extCounter++;
      }
    }

    // 预查找档案ID（Excel导入时使用表单提供的客户和业务员信息）
    const [customerInfo, salespersonId] = await Promise.all([
      findCustomerIdByCode(client, customerCode),
      findUserIdByName(client, salesperson),
    ]);

    // 解析数据行
    const ordersToInsert = [];
    const importBatch = `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
    // 记录匹配结果统计
    const matchStats = { spec: 0, name: 0, mapping: 0, none: 0 };

    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0 || !row.some(cell => cell)) continue;

      const getValue = (headerIndex: number | null) => {
        if (headerIndex === null || headerIndex >= row.length) return undefined;
        return String(row[headerIndex] || '').trim();
      };

      const productName = getValue(fieldMappings.productName);
      const quantity = parseInt(getValue(fieldMappings.quantity) || '1');
      
      if (!productName) continue;

      const orderNo = getValue(fieldMappings.orderNo) || `ORD-${Date.now()}-${i}`;
      const customerProductCode = getValue(fieldMappings.productCode) || '';
      const customerProductSpec = getValue(fieldMappings.productSpec) || '';
      const price = parseFloat(getValue(fieldMappings.price) || '0');
      const receiverName = getValue(fieldMappings.receiverName) || '未知';
      const receiverPhone = getValue(fieldMappings.receiverPhone) || '';
      const receiverAddress = getValue(fieldMappings.receiverAddress) || '';
      const remark = getValue(fieldMappings.remark) || '';

      // 商品档案自动匹配
      const matchResult = await matchProduct(client, productName, customerProductCode, customerProductSpec);
      matchStats[matchResult.matchType]++;

      // 生成唯一匹配码
      const matchCode = generateMatchCode(customerCode, receiverName, customerProductCode || productName, quantity);

      // 解析收货地址
      const receiver = parseAddress(receiverAddress);

      // 收集备用字段
      const extData: Record<string, string> = {};
      for (const col of extFieldColumns) {
        const val = getValue(col.headerIndex);
        if (val) extData[col.extFieldKey] = val;
      }

      const sysOrderNo = await generateSysOrderNo(client);

      ordersToInsert.push({
        sys_order_no: sysOrderNo,
        order_no: orderNo,
        status: 'pending',
        // items中保存客户原始信息和系统匹配信息
        items: [{
          // 系统匹配的商品档案信息
          product_id: matchResult.productId,
          product_name: matchResult.productName,
          product_spec: matchResult.productSpec,
          product_code: matchResult.productCode,
          unit_price: matchResult.unitPrice,
          // 客户原始商品信息
          cu_product_name: productName,
          cu_product_code: customerProductCode,
          cu_product_spec: customerProductSpec,
          // 订单信息
          quantity,
          price: price || undefined,
          remark,
          // 匹配信息
          match_type: matchResult.matchType,
          match_hint: matchResult.matchHint,
        }],
        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        receiver_address: receiverAddress,
        province: receiver.province,
        city: receiver.city,
        district: receiver.district,
        // 客户信息：存储ID和冗余名称
        customer_id: customerInfo?.id || null,
        customer_code: customerCode,
        customer_name: customerInfo?.name || customerName,
        // 业务员信息：存储ID和冗余名称
        salesperson_id: salespersonId || null,
        salesperson: salesperson,
        source: 'excel',
        import_batch: importBatch,
        match_code: matchCode,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...extData,
      });
    }

    if (ordersToInsert.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未解析到有效订单数据' 
      }, { status: 400 });
    }

    // 批量插入
    const { data, error } = await client.from('orders').insert(ordersToInsert).select();
    if (error) throw new Error(`导入订单失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
      importBatch,
      // 商品匹配统计
      matchStats: {
        total: ordersToInsert.length,
        bySpec: matchStats.spec,
        byName: matchStats.name,
        byMapping: matchStats.mapping,
        none: matchStats.none,
        matched: ordersToInsert.length - matchStats.none,
        matchRate: ((ordersToInsert.length - matchStats.none) / ordersToInsert.length * 100).toFixed(1) + '%'
      },
      message: `成功导入 ${data?.length || 0} 条订单，其中 ${ordersToInsert.length - matchStats.none} 条已匹配商品档案`
    });

  } catch (error) {
    console.error('导入订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 更新订单状态
export async function PATCH(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { 
      id, 
      orderId, 
      status, 
      supplierId, 
      supplierName, 
      operatorId,
      operatorName,
      warehouseId,
      warehouseName,
      expressCompany, 
      trackingNo, 
      extFields,
      customerCode,
      items,
      receiver,
      expressRequirement,
      remark,
    } = body;

    const targetId = id || orderId;
    if (!targetId) {
      return NextResponse.json({ 
        success: false, 
        error: '订单ID不能为空' 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === 'assigned') {
        updateData.assigned_at = new Date().toISOString();
      }
    }
    
    // 供应商信息
    if (supplierId !== undefined) updateData.supplier_id = supplierId || null;
    if (supplierName !== undefined) updateData.supplier_name = supplierName || '';
    
    // 跟单员信息
    if (operatorId !== undefined) updateData.operator_id = operatorId || null;
    if (operatorName !== undefined) updateData.operator_name = operatorName || '';
    
    // 仓库信息
    if (warehouseId !== undefined) updateData.warehouse_id = warehouseId || null;
    if (warehouseName !== undefined) updateData.warehouse = warehouseName || '';
    
    // 快递信息
    if (expressCompany) updateData.express_company = expressCompany;
    if (trackingNo) updateData.tracking_no = trackingNo;

    // 客户信息
    if (customerCode !== undefined) updateData.customer_code = customerCode;

    // 商品信息
    if (items !== undefined) {
      updateData.items = typeof items === 'string' ? items : JSON.stringify(items);
    }

    // 收货信息
    if (receiver) {
      if (receiver.name !== undefined) updateData.receiver_name = receiver.name;
      if (receiver.phone !== undefined) updateData.receiver_phone = receiver.phone;
      if (receiver.address !== undefined) updateData.receiver_address = receiver.address;
      if (receiver.province !== undefined) updateData.province = receiver.province;
      if (receiver.city !== undefined) updateData.city = receiver.city;
      if (receiver.district !== undefined) updateData.district = receiver.district;
    }

    // 其他信息
    if (expressRequirement !== undefined) updateData.express_requirement = expressRequirement;
    if (remark !== undefined) updateData.remark = remark;

    // 支持更新备用字段
    if (extFields && typeof extFields === 'object') {
      for (const [key, val] of Object.entries(extFields)) {
        if (key.startsWith('ext_field_')) {
          updateData[key] = val;
        }
      }
    }

    const { data, error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', targetId)
      .select();
    
    if (error) throw new Error(`更新订单失败: ${error.message}`);

    if (!data || data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '订单不存在' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data[0],
      message: '订单更新成功'
    });

  } catch (error) {
    console.error('更新订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 删除订单
export async function DELETE(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // 批量删除，多个ID用逗号分隔

    if (!id && !ids) {
      return NextResponse.json({ 
        success: false, 
        error: '订单ID不能为空' 
      }, { status: 400 });
    }

    // 检查订单状态约束：已派发、已完成、部分回单的订单不能删除
    let checkIds = id ? [id] : ids!.split(',');
    
    const { data: ordersToDelete, error: queryError } = await client
      .from('orders')
      .select('id, status, sys_order_no')
      .in('id', checkIds);

    if (queryError) throw new Error(`查询订单失败: ${queryError.message}`);

    if (!ordersToDelete || ordersToDelete.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '订单不存在' 
      }, { status: 404 });
    }

    // 检查是否有不能删除的订单
    const protectedOrders = ordersToDelete.filter(order => 
      ['assigned', 'partial_returned', 'completed'].includes(order.status)
    );

    if (protectedOrders.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `以下订单状态不允许删除：${protectedOrders.map(o => `${o.sys_order_no}(${o.status})`).join(', ')}。请先取消订单。` 
      }, { status: 400 });
    }

    // 执行删除
    const { error: deleteError } = await client
      .from('orders')
      .delete()
      .in('id', checkIds);

    if (deleteError) throw new Error(`删除订单失败: ${deleteError.message}`);

    return NextResponse.json({
      success: true,
      message: `成功删除 ${checkIds.length} 条订单`
    });

  } catch (error) {
    console.error('删除订单失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 辅助函数：查找匹配的表头
function findHeader(headers: string[], candidates: string[]): number | null {
  for (const candidate of candidates) {
    const index = headers.findIndex(h => 
      h.includes(candidate) || candidate.includes(h)
    );
    if (index !== -1) return index;
  }
  return null;
}

// 生成唯一匹配码
function generateMatchCode(customerCode: string, receiverName: string, productCode: string, quantity: number): string {
  const raw = `${customerCode}-${receiverName}-${productCode}-${quantity}`;
  return crypto.createHash('md5').update(raw).digest('hex').slice(0, 8).toUpperCase();
}

// 解析收货地址
function parseAddress(address: string): { province: string; city: string; district: string } {
  const provinces = ['北京', '上海', '天津', '重庆', '广东', '浙江', '江苏', '福建', '山东', '四川', '湖北', '湖南', '河南', '河北', '辽宁', '吉林', '黑龙江', '陕西', '山西', '安徽', '江西', '云南', '贵州', '广西', '海南', '内蒙古', '新疆', '西藏', '甘肃', '青海', '宁夏', '台湾', '香港', '澳门'];
  
  let province = '';
  const city = '';
  const district = '';

  for (const p of provinces) {
    if (address.includes(p)) {
      province = p;
      break;
    }
  }

  return { province, city, district };
}
