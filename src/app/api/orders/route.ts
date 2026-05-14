import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';
import crypto from 'crypto';
import { requirePermission } from '@/lib/server-auth';
import { isManagementRole } from '@/lib/roles';
import { ORDER_STATUS_ASSIGNED, ORDER_STATUS_COMPLETED } from '@/lib/order-status';
import { PERMISSIONS } from '@/lib/permissions';
import { transformOrderItem, apiToDb } from '@/lib/order-adapter';
import { generateSysOrderNo, bulkUpdateOrderStatus, extractName, getUserRealNameByUsername, findUserIdByName, findCustomerIdByCode, findSupplierIdByName, findWarehouseIdByName, buildRelatedMaps } from '@/lib/order-service';
import { ensurePendingMatchProduct } from '@/lib/order-parser';

interface DuplicateOrderDetail {
  orderNo: string;
  receiverName: string;
  reason: 'batch_duplicate' | 'existing_order' | 'fuzzy_match';
  existingSysOrderNo?: string;
}

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

  // 转换items，处理新旧两种格式（通过 order-adapter 统一兼容逻辑）
  const rawItems = typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items as string) : (dbOrder.items || []);
  const items = rawItems.map((item: Record<string, unknown>) => {
    const normalized = transformOrderItem(item);
    return {
      // 客户原始商品信息（从Excel映射获取）
      cuProductName: (normalized.customerProductName || normalized.cu_product_name || item.product_name || '') as string,
      cuProductCode: (normalized.customerProductCode || normalized.cu_product_code || '') as string,
      cuProductSpec: (normalized.customerProductSpec || normalized.cu_product_spec || '') as string,
      cuBarcode: (normalized.customerBarcode || normalized.cu_barcode || '') as string,
      // 系统商品档案信息（自动匹配或手动指定）
      productId: (normalized.systemProductId || normalized.product_id || item.systemProductId || null) as string | null,
      productName: (normalized.systemProductName || normalized.product_name || item.systemProductName || '') as string,
      productSpec: (normalized.systemProductSpec || normalized.product_spec || item.systemProductSpec || '') as string,
      productCode: (normalized.systemProductCode || normalized.product_code || item.systemProductCode || '') as string,
      productBrand: (normalized.systemProductBrand || normalized.product_brand || item.systemProductBrand || '') as string,
      unitPrice: item.unit_price as number | null || null,
      // 订单商品信息
      quantity: item.quantity as number || 1,
      price: item.price as number | null || null,
      remark: item.remark as string || '',
      // 匹配信息
      matchType: item.match_type as string || '',
      matchHint: item.match_hint as string || '',
    };
  });

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
    channelRemark: dbOrder.channel_remark as string | undefined,
    systemRemark: dbOrder.system_remark as string | undefined,
    suggestedShipper: dbOrder.suggested_shipper as string | undefined,
    originalStatus: dbOrder.original_status as string | undefined,
    expressRequirement: dbOrder.express_requirement as string | undefined,
    extFields: Object.keys(extFields).length > 0 ? extFields : undefined,
  };
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

// 以下函数已提取到 @/lib/order-service.ts：
//   getUserRealNameByUsername, extractName, findUserIdByName,
//   findCustomerIdByCode, findSupplierIdByName, findWarehouseIdByName, buildRelatedMaps

// 商品匹配结果类型
interface ProductMatchResult {
  productId: string | null;
  productName: string;
  productSpec: string;
  productCode: string;
  unitPrice: number | null;
  matchType: 'spec' | 'name' | 'mapping' | 'unmatched' | 'none';
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
          unitPrice: Number(p.cost_price || p.retail_price || 0) || null,
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
        unitPrice: Number(p.cost_price || p.retail_price || 0) || null,
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

  // 4. 未匹配到任何商品档案，回退到"商品待匹配"默认档案
  try {
    const pendingProduct = await ensurePendingMatchProduct(client);
    return {
      productId: (pendingProduct.id as string) || null,
      productName: (pendingProduct.name as string) || '商品待匹配',
      productSpec: (pendingProduct.spec as string) || '商品待匹配',
      productCode: (pendingProduct.code as string) || 'PENDING_MATCH',
      unitPrice: null,
      matchType: 'unmatched' as ProductMatchResult['matchType'],
      matchHint: '未精确匹配到系统商品，已关联默认"商品待匹配"档案',
    };
  } catch (fallbackErr) {
    console.error('【orders/route】获取"商品待匹配"档案失败:', fallbackErr);
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
}

// 获取所有订单
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_VIEW);
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customerCode = searchParams.get('customerCode');
  const supplierId = searchParams.get('supplierId');
  const search = searchParams.get('search');
  const importBatch = searchParams.get('importBatch');
  const createdFrom = searchParams.get('createdFrom');
  const createdTo = searchParams.get('createdTo');

  // 获取当前用户信息用于数据权限过滤
  const currentUser = getCurrentUser(request);

  // Pagination params
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(99999, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));
  const offset = (page - 1) * pageSize;

  try {
    let query = client.from('orders').select('*', { count: 'exact' });

    // ==================== 数据权限过滤 ====================
    // 仅本人(self)：只看业务员或跟单员是自己的订单
    // admin 角色不看 dataScope 限制，可查看全部数据
    if (currentUser && currentUser.dataScope === 'self' && !isManagementRole(currentUser.role)) {
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
        .or(`salesperson_name.ilike.%${pureName}%,order_taker_name.ilike.%${pureName}%`);
      
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
      if (status.includes(',')) {
        query = query.in('status', status.split(',').map(s => s.trim()));
      } else {
        query = query.eq('status', status);
      }
    }

    if (customerCode) {
      query = query.eq('customer_code', customerCode);
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (importBatch) {
      query = query.eq('import_batch', importBatch);
    }

    if (search) {
      query = query.or(`order_no.ilike.%${search}%,sys_order_no.ilike.%${search}%,receiver_name.ilike.%${search}%,receiver_phone.ilike.%${search}%`);
    }

    if (createdFrom) {
      query = query.gte('created_at', createdFrom);
    }
    if (createdTo) {
      // 如果只传了日期（不含时间），则加一天以包含当天全天数据
      const endDate = createdTo.length === 10 ? createdTo + 'T23:59:59.999Z' : createdTo;
      query = query.lte('created_at', endDate);
    }

    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
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

    const total = count ?? data?.length ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: transformedData,
      total,
      page,
      pageSize,
      totalPages,
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
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const contentType = request.headers.get('content-type') || '';

    // JSON格式：从AI解析结果创建订单
    if (contentType.includes('application/json')) {
      const body = await request.json();
      const {
        customerCode,
        customerName,
        salespersonId: inputSalespersonId,
        salespersonName,
        operatorId: inputOperatorId,
        operatorName,
        items,
        receiver,
        supplierId,
        supplierName,
        freightCost,
        source: bodySource,
        skipExisting,
      } = body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({
          success: false,
          error: '请提供订单商品列表'
        }, { status: 400 });
      }

      // 预查找档案ID（只查询一次，避免循环中重复查询）
      const [customerInfo, salespersonId, operatorId, supplierInfo] = await Promise.all([
        findCustomerIdByCode(client, customerCode),
        inputSalespersonId ? Promise.resolve(inputSalespersonId) : findUserIdByName(client, salespersonName || ''),
        inputOperatorId ? Promise.resolve(inputOperatorId) : findUserIdByName(client, operatorName || ''),
        supplierId && supplierId !== 'none' ? findSupplierIdByName(client, supplierName || '') : Promise.resolve(null),
      ]);

      const importBatch = `AI-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Date.now().toString().slice(-4)}`;
      const ordersToInsert = [];

      // 预取默认"商品待匹配"档案，用于未匹配商品回退
      const pendingProduct = await ensurePendingMatchProduct(client).catch(() => null);

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.productName) continue;

        // 逐行查找档案ID（如果有变化的话）
        const itemSalespersonId = item.salespersonId || (item.salesperson ? await findUserIdByName(client, item.salesperson) : salespersonId);
        const itemOperatorId = item.operatorId || (item.operator ? await findUserIdByName(client, item.operator) : operatorId);
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
          customer_order_no: item.customerOrderNo || item.orderNo || '',
          order_no: item.customerOrderNo || item.orderNo || item.billNo || `ORD-${Date.now()}-${i}`,
          bill_no: item.billNo || null,
          bill_date: item.billDate || null,
          supplier_order_no: item.supplierOrderNo || null,
          status: itemSupplierInfo?.id ? 'assigned' : 'pending',
          items: [{
            product_id: item.systemProductId || item.productId || (pendingProduct?.id as string) || null,
            product_name: item.systemProductName || item.mappedProductName || item.productName || (pendingProduct?.name as string) || '商品待匹配',
            product_spec: item.systemProductSpec || item.mappedProductSpec || item.productSpec || (pendingProduct?.spec as string) || '',
            product_code: item.systemProductCode || item.mappedProductCode || item.productCode || (pendingProduct?.code as string) || '',
            product_brand: item.systemProductBrand || item.mappedProductBrand || (pendingProduct?.brand as string) || '',
            cu_product_name: item.cuProductName || item.productName,
            cu_product_spec: item.cuProductSpec || item.productSpec || '',
            cu_product_code: item.cuProductCode || item.productCode || '',
            cu_barcode: item.cuBarcode || item.barcode || '',
            quantity: item.quantity || 1,
            price: item.price ?? null,
            amount: item.amount ?? null,
            discount: item.discount ?? null,
            tax_rate: item.taxRate ?? null,
            warehouse: item.warehouse || null,
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
          // 发货方信息：存储ID和冗余名称
          supplier_id: itemSupplierInfo?.id || null,
          supplier_name: itemSupplierInfo?.name || supplierName || '',
          // 仓库信息：存储ID和冗余名称
          warehouse_id: itemWarehouseInfo?.id || null,
          warehouse: itemWarehouseInfo?.name || item.warehouse || '',
          // 其他字段
          express_company: item.express_company || null,
          freight_cost: freightCost || null,
          tracking_no: item.tracking_no || null,
          amount: item.amount || null,
          discount: item.discount || null,
          tax_rate: item.taxRate || null,
          income_name: item.income_name || null,
          income_amount: item.income_amount || null,
          invoice_required: item.invoice_required || null,
          source: bodySource || 'ai_parse',
          channel_remark: item.channel_remark || null,
          system_remark: item.system_remark || null,
          suggested_shipper: item.suggested_shipper || null,
          original_status: item.original_status || null,
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

      const duplicateDetails: DuplicateOrderDetail[] = [];
      let batchSkippedCount = 0;
      const batchSeen = new Set<string>();
      const deduplicatedOrders = ordersToInsert.filter((order) => {
        const orderNo = String(order.order_no || '').trim();
        const customerOrderNo = String(order.customer_order_no || '').trim();
        if (!orderNo && !customerOrderNo) {
          return true;
        }

        const identifiers = [...new Set([orderNo, customerOrderNo].filter(Boolean))];
        for (const id of identifiers) {
          const key = buildDuplicateOrderKey(String(order.customer_code || ''), id);
          if (batchSeen.has(key)) {
            duplicateDetails.push({
              orderNo: id,
              receiverName: String(order.receiver_name || ''),
              reason: 'batch_duplicate',
            });
            batchSkippedCount++;
            return false;
          }
        }
        for (const id of identifiers) {
          batchSeen.add(buildDuplicateOrderKey(String(order.customer_code || ''), id));
        }
        return true;
      });

      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      // 收集所有候选标识符（order_no + customer_order_no）
      const allCandidateIdentifiers = Array.from(
        new Set(
          deduplicatedOrders.flatMap((order) => {
            const identifiers: string[] = [];
            const on = String(order.order_no || '').trim();
            const con = String(order.customer_order_no || '').trim();
            if (on) identifiers.push(on);
            if (con && con !== on) identifiers.push(con);
            return identifiers;
          })
        )
      );

      // 查 3 天内已有订单（含 items 用于模糊匹配）
      const recentOrderMap = new Map<string, {
        id: string;
        sysOrderNo: string;
        orderNo: string;
        customerOrderNo: string;
        receiverPhone: string;
        items: Record<string, unknown>[];
      }>();
      const allRecentOrders: Array<{
        id: string; sysOrderNo: string; orderNo: string; customerOrderNo: string;
        receiverPhone: string; items: Record<string, unknown>[];
      }> = [];

      if (customerCode) {
        const { data: recentOrders, error: recentError } = await client
          .from('orders')
          .select('id, order_no, customer_order_no, customer_code, sys_order_no, receiver_name, receiver_phone, items')
          .eq('customer_code', customerCode)
          .gte('created_at', threeDaysAgo);

        if (recentError) {
          throw new Error(`查询重复订单失败: ${recentError.message}`);
        }

        const identifierSet = new Set(allCandidateIdentifiers.map((n) => n.toUpperCase().trim()));

        for (const existing of recentOrders || []) {
          const o = existing as Record<string, unknown>;
          const dbOrderNo = String(o.order_no || '').trim().toUpperCase();
          const dbCustomerOrderNo = String(o.customer_order_no || '').trim().toUpperCase();

          const parsed = {
            id: String(o.id || ''),
            sysOrderNo: String(o.sys_order_no || ''),
            orderNo: String(o.order_no || ''),
            customerOrderNo: String(o.customer_order_no || ''),
            receiverPhone: String(o.receiver_phone || ''),
            items: Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : [],
          };
          allRecentOrders.push(parsed);

          // 按 order_no 或 customer_order_no 任一匹配（用于精确去重）
          if ((dbOrderNo && identifierSet.has(dbOrderNo)) || (dbCustomerOrderNo && identifierSet.has(dbCustomerOrderNo))) {
            const key = buildDuplicateOrderKey(
              String(o.customer_code || ''),
              dbOrderNo || dbCustomerOrderNo
            );
            recentOrderMap.set(key, parsed);
          }
        }
      }

      // 已匹配 order_no 的订单 ID 集合，用于后续模糊匹配去重
      const matchedOrderIds = new Set<string>();

      const freshOrders = deduplicatedOrders.filter((order) => {
        const orderNo = String(order.order_no || '').trim();
        const customerOrderNo = String(order.customer_order_no || '').trim();

        if (!orderNo && !customerOrderNo) {
          return true; // 无编码，稍后由模糊匹配判断
        }

        // 检查 order_no
        if (orderNo) {
          const key = buildDuplicateOrderKey(String(order.customer_code || ''), orderNo.toUpperCase());
          const existing = recentOrderMap.get(key);
          if (existing) {
            matchedOrderIds.add(existing.id);
            duplicateDetails.push({
              orderNo,
              receiverName: String(order.receiver_name || ''),
              reason: 'existing_order',
              existingSysOrderNo: existing.sysOrderNo,
            });
            return !skipExisting;
          }
        }

        // 检查 customer_order_no
        if (customerOrderNo) {
          const key = buildDuplicateOrderKey(String(order.customer_code || ''), customerOrderNo.toUpperCase());
          const existing = recentOrderMap.get(key);
          if (existing) {
            matchedOrderIds.add(existing.id);
            duplicateDetails.push({
              orderNo: customerOrderNo,
              receiverName: String(order.receiver_name || ''),
              reason: 'existing_order',
              existingSysOrderNo: existing.sysOrderNo,
            });
            return !skipExisting;
          }
        }

        return true;
      });

      // 模糊维度检测：product + phone + quantity
      for (const order of freshOrders) {
        const orderNo = String(order.order_no || '').trim();
        const customerOrderNo = String(order.customer_order_no || '').trim();
        const phone = String(order.receiver_phone || '').trim();
        const orderItems = (order.items as Array<Record<string, unknown>>) || [];
        const qty = orderItems[0]?.quantity ? Number(orderItems[0].quantity) : 0;

        if (!phone || !qty) continue;

        for (const recent of allRecentOrders) {
          if (matchedOrderIds.has(recent.id)) continue;

          const dbPhone = recent.receiverPhone.trim();
          if (dbPhone !== phone) continue;

          const dbItems = recent.items;
          if (!Array.isArray(dbItems) || dbItems.length === 0) continue;

          const itemMatch = dbItems.some((dbItem: Record<string, unknown>) => {
            const targetItem = orderItems[0] || {};
            const cuName = String(dbItem.cu_product_name || dbItem.product_name || '').trim();
            const cuSpec = String(dbItem.cu_product_spec || dbItem.product_spec || '').trim();
            const cuCode = String(dbItem.cu_product_code || dbItem.product_code || '').trim();

            const targetName = String(targetItem.cu_product_name || targetItem.product_name || '').trim();
            const targetSpec = String(targetItem.cu_product_spec || targetItem.product_spec || '').trim();
            const targetCode = String(targetItem.cu_product_code || targetItem.product_code || '').trim();

            const productMatch =
              (targetName && cuName === targetName) ||
              (targetSpec && cuSpec === targetSpec) ||
              (targetCode && cuCode === targetCode);

            const qtyMatch = Number(dbItem.quantity) === qty;
            return productMatch && qtyMatch;
          });

          if (itemMatch) {
            matchedOrderIds.add(recent.id);
            duplicateDetails.push({
              orderNo: orderNo || customerOrderNo || '',
              receiverName: String(order.receiver_name || ''),
              reason: 'fuzzy_match',
              existingSysOrderNo: recent.sysOrderNo,
            });
            break;
          }
        }
      }

      // 根据模糊匹配结果过滤
      const finalOrders = skipExisting
        ? freshOrders.filter((order) => {
            const orderNo = String(order.order_no || '').trim();
            const customerOrderNo = String(order.customer_order_no || '').trim();
            return !duplicateDetails.some(
              (d) =>
                d.reason === 'fuzzy_match' &&
                (d.orderNo === orderNo || d.orderNo === customerOrderNo)
            );
          })
        : freshOrders;

      if (finalOrders.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          importBatch,
          duplicateSummary: {
            totalSkipped: batchSkippedCount,
            batchDuplicateCount: duplicateDetails.filter((item) => item.reason === 'batch_duplicate').length,
            existingDuplicateCount: duplicateDetails.filter((item) => item.reason === 'existing_order').length,
            details: duplicateDetails,
          },
          message: `没有创建新订单，${batchSkippedCount} 条记录因重复被跳过`
        });
      }

      const { data, error } = await client.from('orders').insert(finalOrders).select();
      if (error) throw new Error(`创建订单失败: ${error.message}`);

      return NextResponse.json({
        success: true,
        data: data || [],
        total: data?.length || 0,
        importBatch,
        duplicateSummary: {
          totalSkipped: batchSkippedCount + (skipExisting ? duplicateDetails.filter((item) => item.reason === 'existing_order' || item.reason === 'fuzzy_match').length : 0),
          batchDuplicateCount: duplicateDetails.filter((item) => item.reason === 'batch_duplicate').length,
          existingDuplicateCount: duplicateDetails.filter((item) => item.reason === 'existing_order').length,
          fuzzyDuplicateCount: duplicateDetails.filter((item) => item.reason === 'fuzzy_match').length,
          details: duplicateDetails,
        },
        message:
          batchSkippedCount > 0
            ? `成功创建 ${data?.length || 0} 条订单，另有 ${batchSkippedCount} 条重复记录已跳过`
            : `成功创建 ${data?.length || 0} 条订单`
      });
    }

    // FormData格式：从Excel文件导入
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const customerCode = formData.get('customerCode') as string || 'UNKNOWN';
    const customerName = formData.get('customerName') as string || '未知客户';
    const salesperson = formData.get('salesperson') as string || '未知业务员';
    const skipExisting = formData.get('skipExisting') === 'true';

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
      remark: findHeader(headers, ['备注', '商品行备注', '买家留言', '订单备注', '客服备注']),
      barcode: findHeader(headers, ['条码', '商品69码', '条形码']),
      channelRemark: findHeader(headers, ['渠道备注']),
      system_remark: findHeader(headers, ['系统备注']),
      suggestedShipper: findHeader(headers, ['店铺名称', '供应商名称', '发货供应商']),
      originalStatus: findHeader(headers, ['订单状态', '付款状态', '发货状态']),
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
    const matchStats = { spec: 0, name: 0, mapping: 0, unmatched: 0, none: 0 };

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
      const barcode = getValue(fieldMappings.barcode) || '';
      const channelRemark = getValue(fieldMappings.channelRemark) || '';
      const systemRemark = getValue(fieldMappings.system_remark) || '';
      const suggestedShipper = getValue(fieldMappings.suggestedShipper) || '';
      const originalStatus = getValue(fieldMappings.originalStatus) || '';

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
        customer_order_no: orderNo,
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
          cu_barcode: barcode,
          // 订单信息
          quantity,
          price: price || null,
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
        channel_remark: channelRemark || null,
        system_remark: systemRemark || null,
        suggested_shipper: suggestedShipper || null,
        original_status: originalStatus || null,
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

    const duplicateDetails: DuplicateOrderDetail[] = [];
    let batchSkippedCount = 0;
    const batchSeen = new Set<string>();
    const deduplicatedOrders = ordersToInsert.filter((order) => {
      const orderNo = String(order.order_no || '').trim();
      const customerOrderNo = String(order.customer_order_no || '').trim();
      if (!orderNo && !customerOrderNo) return true;

      const identifiers = [...new Set([orderNo, customerOrderNo].filter(Boolean))];
      for (const id of identifiers) {
        const key = buildDuplicateOrderKey(String(order.customer_code || ''), id);
        if (batchSeen.has(key)) {
          duplicateDetails.push({ orderNo: id, receiverName: String(order.receiver_name || ''), reason: 'batch_duplicate' });
          batchSkippedCount++;
          return false;
        }
      }
      for (const id of identifiers) {
        batchSeen.add(buildDuplicateOrderKey(String(order.customer_code || ''), id));
      }
      return true;
    });

    const threeDaysAgoFd = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

    // 收集候选标识符
    const allCandidatesFd = Array.from(
      new Set(
        deduplicatedOrders.flatMap((order) => {
          const ids: string[] = [];
          const on = String(order.order_no || '').trim();
          const con = String(order.customer_order_no || '').trim();
          if (on) ids.push(on);
          if (con && con !== on) ids.push(con);
          return ids;
        })
      )
    );

    const recentOrderMapFd = new Map<string, {
      id: string; sysOrderNo: string; orderNo: string; customerOrderNo: string;
      receiverPhone: string; items: Record<string, unknown>[];
    }>();
    const allRecentOrdersFd: Array<{
      id: string; sysOrderNo: string; orderNo: string; customerOrderNo: string;
      receiverPhone: string; items: Record<string, unknown>[];
    }> = [];

    if (customerCode) {
      const { data: recentFd, error: recentErrFd } = await client
        .from('orders')
        .select('id, order_no, customer_order_no, customer_code, sys_order_no, receiver_name, receiver_phone, items')
        .eq('customer_code', customerCode)
        .gte('created_at', threeDaysAgoFd);

      if (recentErrFd) throw new Error(`查询重复订单失败: ${recentErrFd.message}`);

      const idSetFd = new Set(allCandidatesFd.map((n) => n.toUpperCase().trim()));
      for (const existing of recentFd || []) {
        const o = existing as Record<string, unknown>;
        const dbOn = String(o.order_no || '').trim().toUpperCase();
        const dbCon = String(o.customer_order_no || '').trim().toUpperCase();

        const parsedFd = {
          id: String(o.id || ''), sysOrderNo: String(o.sys_order_no || ''),
          orderNo: String(o.order_no || ''), customerOrderNo: String(o.customer_order_no || ''),
          receiverPhone: String(o.receiver_phone || ''),
          items: Array.isArray(o.items) ? (o.items as Record<string, unknown>[]) : [],
        };
        allRecentOrdersFd.push(parsedFd);

        if ((dbOn && idSetFd.has(dbOn)) || (dbCon && idSetFd.has(dbCon))) {
          const key = buildDuplicateOrderKey(String(o.customer_code || ''), dbOn || dbCon);
          recentOrderMapFd.set(key, parsedFd);
        }
      }
    }

    const matchedOrderIdsFd = new Set<string>();

    const freshOrders = deduplicatedOrders.filter((order) => {
      const orderNo = String(order.order_no || '').trim();
      const customerOrderNo = String(order.customer_order_no || '').trim();
      if (!orderNo && !customerOrderNo) return true;

      if (orderNo) {
        const key = buildDuplicateOrderKey(String(order.customer_code || ''), orderNo.toUpperCase());
        const existing = recentOrderMapFd.get(key);
        if (existing) {
          matchedOrderIdsFd.add(existing.id);
          duplicateDetails.push({ orderNo, receiverName: String(order.receiver_name || ''), reason: 'existing_order', existingSysOrderNo: existing.sysOrderNo });
          return !skipExisting;
        }
      }
      if (customerOrderNo) {
        const key = buildDuplicateOrderKey(String(order.customer_code || ''), customerOrderNo.toUpperCase());
        const existing = recentOrderMapFd.get(key);
        if (existing) {
          matchedOrderIdsFd.add(existing.id);
          duplicateDetails.push({ orderNo: customerOrderNo, receiverName: String(order.receiver_name || ''), reason: 'existing_order', existingSysOrderNo: existing.sysOrderNo });
          return !skipExisting;
        }
      }
      return true;
    });

    // 模糊维度检测
    for (const order of freshOrders) {
      const orderNo = String(order.order_no || '').trim();
      const customerOrderNo = String(order.customer_order_no || '').trim();
      const phone = String(order.receiver_phone || '').trim();
      const orderItems = (order.items as Array<Record<string, unknown>>) || [];
      const qty = orderItems[0]?.quantity ? Number(orderItems[0].quantity) : 0;
      if (!phone || !qty) continue;

      for (const recent of allRecentOrdersFd) {
        if (matchedOrderIdsFd.has(recent.id)) continue;
        if (recent.receiverPhone.trim() !== phone) continue;
        const dbItems = recent.items;
        if (!Array.isArray(dbItems) || dbItems.length === 0) continue;

        const itemMatch = dbItems.some((dbItem: Record<string, unknown>) => {
          const targetItem = orderItems[0] || {};
          const cuName = String(dbItem.cu_product_name || dbItem.product_name || '').trim();
          const cuSpec = String(dbItem.cu_product_spec || dbItem.product_spec || '').trim();
          const cuCode = String(dbItem.cu_product_code || dbItem.product_code || '').trim();
          const tName = String(targetItem.cu_product_name || targetItem.product_name || '').trim();
          const tSpec = String(targetItem.cu_product_spec || targetItem.product_spec || '').trim();
          const tCode = String(targetItem.cu_product_code || targetItem.product_code || '').trim();
          return ((tName && cuName === tName) || (tSpec && cuSpec === tSpec) || (tCode && cuCode === tCode)) && Number(dbItem.quantity) === qty;
        });

        if (itemMatch) {
          matchedOrderIdsFd.add(recent.id);
          duplicateDetails.push({ orderNo: orderNo || customerOrderNo || '', receiverName: String(order.receiver_name || ''), reason: 'fuzzy_match', existingSysOrderNo: recent.sysOrderNo });
          break;
        }
      }
    }

    const finalOrdersFd = skipExisting
      ? freshOrders.filter((order) => {
          const on = String(order.order_no || '').trim();
          const con = String(order.customer_order_no || '').trim();
          return !duplicateDetails.some((d) => d.reason === 'fuzzy_match' && (d.orderNo === on || d.orderNo === con));
        })
      : freshOrders;

    if (finalOrdersFd.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        total: 0,
        importBatch,
        duplicateSummary: {
          totalSkipped: batchSkippedCount,
          batchDuplicateCount: duplicateDetails.filter((item) => item.reason === 'batch_duplicate').length,
          existingDuplicateCount: duplicateDetails.filter((item) => item.reason === 'existing_order').length,
          fuzzyDuplicateCount: duplicateDetails.filter((item) => item.reason === 'fuzzy_match').length,
          details: duplicateDetails,
        },
        matchStats: { total: 0, bySpec: matchStats.spec, byName: matchStats.name, byMapping: matchStats.mapping, unmatched: matchStats.unmatched, none: matchStats.none, matched: 0, matchRate: '0.0%' },
        message: `没有导入新订单，${batchSkippedCount} 条记录因重复被跳过`
      });
    }

    const { data, error } = await client.from('orders').insert(finalOrdersFd).select();
    if (error) throw new Error(`导入订单失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || [],
      total: data?.length || 0,
      importBatch,
      duplicateSummary: {
        totalSkipped: batchSkippedCount + (skipExisting ? duplicateDetails.filter((item) => item.reason === 'existing_order' || item.reason === 'fuzzy_match').length : 0),
        batchDuplicateCount: duplicateDetails.filter((item) => item.reason === 'batch_duplicate').length,
        existingDuplicateCount: duplicateDetails.filter((item) => item.reason === 'existing_order').length,
        fuzzyDuplicateCount: duplicateDetails.filter((item) => item.reason === 'fuzzy_match').length,
        details: duplicateDetails,
      },
      matchStats: {
        total: finalOrdersFd.length,
        bySpec: matchStats.spec,
        byName: matchStats.name,
        byMapping: matchStats.mapping,
        unmatched: matchStats.unmatched,
        none: matchStats.none,
        matched: Math.max(finalOrdersFd.length - matchStats.none, 0),
        matchRate: finalOrdersFd.length > 0
          ? ((Math.max(finalOrdersFd.length - matchStats.none, 0) / finalOrdersFd.length) * 100).toFixed(1) + '%'
          : '0.0%'
      },
      message:
        batchSkippedCount > 0
          ? `成功导入 ${data?.length || 0} 条订单，另有 ${batchSkippedCount} 条重复记录已跳过`
          : `成功导入 ${data?.length || 0} 条订单，其中 ${Math.max(finalOrdersFd.length - matchStats.none, 0)} 条已匹配商品档案`
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
  const debugInfo: Record<string, unknown> = { start: new Date().toISOString(), url: request.url };

  try {
    const authError = await requirePermission(request, PERMISSIONS.ORDERS_EDIT);
    if (authError) return authError;

    const client = getSupabaseClient();
    const body = await request.json();
    debugInfo.bodyKeys = Object.keys(body);

    const {
      id: bodyId,
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
      // snake_case variants (from frontend)
      supplier_id,
      supplier_name,
      operator_id,
      operator_name,
      warehouse_id,
      warehouse_name,
      express_company,
      tracking_no,
      customer_code,
      items: itemsArr,
      express_requirement,
      system_remark,
      receiver_name,
      receiver_phone,
      receiver_address,
      province,
    } = body;

    const urlId = request.nextUrl?.searchParams.get('id') ?? null;
    const targetId = bodyId || orderId || urlId;
    debugInfo.extractedId = targetId;
    debugInfo.urlId = urlId;
    debugInfo.snake = { customer_code, receiver_name, supplier_id, express_company, tracking_no };
    debugInfo.camel = { customerCode, receiver: !!receiver, expressCompany, trackingNo, items: !!items };
    if (!targetId) {
      console.log('[PATCH /api/orders] NO TARGET ID - bodyId:', bodyId, 'orderId:', orderId, 'urlId:', urlId);
      return NextResponse.json({
        success: false,
        error: '订单ID不能为空',
        debug: debugInfo,
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (status) {
      updateData.status = status;
      if (status === ORDER_STATUS_ASSIGNED) {
        updateData.assigned_at = new Date().toISOString();
      }
      if (status === ORDER_STATUS_COMPLETED) {
        updateData.completed_at = new Date().toISOString();
      }
    }

    // 发货方信息
    if (supplier_id !== undefined) updateData.supplier_id = supplier_id || null;
    else if (supplierId !== undefined) updateData.supplier_id = supplierId || null;
    if (supplier_name !== undefined) updateData.supplier_name = supplier_name || '';
    else if (supplierName !== undefined) updateData.supplier_name = supplierName || '';

    // 跟单员信息
    if (operator_id !== undefined) updateData.operator_id = operator_id || null;
    else if (operatorId !== undefined) updateData.operator_id = operatorId || null;
    if (operator_name !== undefined) updateData.operator_name = operator_name || '';
    else if (operatorName !== undefined) updateData.operator_name = operatorName || '';

    // 仓库信息
    if (warehouse_id !== undefined) updateData.warehouse_id = warehouse_id || null;
    else if (warehouseId !== undefined) updateData.warehouse_id = warehouseId || null;
    if (warehouse_name !== undefined) updateData.warehouse = warehouse_name || '';
    else if (warehouseName !== undefined) updateData.warehouse = warehouseName || '';

    // 快递信息
    if (express_company) updateData.express_company = express_company;
    else if (expressCompany) updateData.express_company = expressCompany;
    if (tracking_no) updateData.tracking_no = tracking_no;
    else if (trackingNo) updateData.tracking_no = trackingNo;

    // 客户信息
    if (customer_code !== undefined) updateData.customer_code = customer_code;
    else if (customerCode !== undefined) updateData.customer_code = customerCode;

    // 商品信息
    if (itemsArr !== undefined) {
      updateData.items = typeof itemsArr === 'string' ? itemsArr : JSON.stringify(itemsArr);
    } else if (items !== undefined) {
      updateData.items = typeof items === 'string' ? items : JSON.stringify(items);
    }

    // 收货信息（优先使用扁平字段）
    if (receiver_name !== undefined) updateData.receiver_name = receiver_name;
    if (receiver_phone !== undefined) updateData.receiver_phone = receiver_phone;
    if (receiver_address !== undefined) updateData.receiver_address = receiver_address;
    if (province !== undefined) updateData.province = province;
    // 兼容嵌套 receiver 对象
    if (receiver && receiver_name === undefined) {
      if (receiver.name !== undefined) updateData.receiver_name = receiver.name;
      if (receiver.phone !== undefined) updateData.receiver_phone = receiver.phone;
      if (receiver.address !== undefined) updateData.receiver_address = receiver.address;
      if (receiver.province !== undefined) updateData.province = receiver.province;
      if (receiver.city !== undefined) updateData.city = receiver.city;
      if (receiver.district !== undefined) updateData.district = receiver.district;
    }

    // 其他信息
    if (express_requirement !== undefined) updateData.express_requirement = express_requirement;
    else if (expressRequirement !== undefined) updateData.express_requirement = expressRequirement;
    if (remark !== undefined) updateData.remark = remark;

    // 新字段
    const { channelRemark, suggestedShipper, originalStatus } = body;
    if (channelRemark !== undefined) updateData.channel_remark = channelRemark;
    if (system_remark !== undefined) updateData.system_remark = system_remark;
    else if (body.systemRemark !== undefined) updateData.system_remark = body.systemRemark;
    if (suggestedShipper !== undefined) updateData.suggested_shipper = suggestedShipper;
    if (originalStatus !== undefined) updateData.original_status = originalStatus;

    // 支持更新备用字段
    if (extFields && typeof extFields === 'object') {
      for (const [key, val] of Object.entries(extFields)) {
        if (key.startsWith('ext_field_')) {
          updateData[key] = val;
        }
      }
    }

    debugInfo.updateDataKeys = Object.keys(updateData);
    debugInfo.updateData = updateData;

    console.log('[PATCH /api/orders] calling supabase with id:', targetId, 'data:', JSON.stringify(updateData));
    const { data, error } = await client
      .from('orders')
      .update(updateData)
      .eq('id', targetId)
      .select();

    if (error) {
      console.error('[PATCH /api/orders] supabase error:', error);
      return NextResponse.json({
        success: false,
        error: `更新订单失败: ${error.message}`,
        debug: { ...debugInfo, supabaseError: error.message },
      }, { status: 400 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: false,
        error: '订单不存在',
        debug: debugInfo,
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
      error: error instanceof Error ? error.message : '未知错误',
      debug: { ...debugInfo, catchError: error instanceof Error ? error.message : String(error) },
    }, { status: 500 });
  }
}

// 删除订单
export async function DELETE(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_DELETE);
  if (authError) return authError;
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

    // 检查订单状态约束：进入业务闭环后的订单不能删除
    const checkIds = id ? [id] : ids!.split(',');
    
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
      ['assigned', 'partial_returned', 'returned', 'feedbacked', 'completed'].includes(order.status)
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

function buildDuplicateOrderKey(customerCode: string, orderNo: string): string {
  return `${customerCode}::${orderNo.trim().toUpperCase()}`;
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
