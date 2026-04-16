import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 从收货地址提取省份
function extractProvince(address: string): string | null {
  if (!address) return null;
  
  const provinces = [
    '北京市', '天津市', '上海市', '重庆市',
    '河北省', '山西省', '辽宁省', '吉林省', '黑龙江省',
    '江苏省', '浙江省', '安徽省', '福建省', '江西省', '山东省',
    '河南省', '湖北省', '湖南省', '广东省', '海南省',
    '四川省', '贵州省', '云南省', '陕西省', '甘肃省', '青海省', '台湾省',
    '内蒙古自治区', '广西壮族自治区', '西藏自治区', '宁夏回族自治区', '新疆维吾尔自治区',
    '香港特别行政区', '澳门特别行政区'
  ];
  
  for (const province of provinces) {
    if (address.includes(province)) {
      if (province === '北京市') return '北京';
      if (province === '天津市') return '天津';
      if (province === '上海市') return '上海';
      if (province === '重庆市') return '重庆';
      if (province.includes('自治区')) {
        return province.replace(/壮族|回族|维吾尔|特别行政区$/, '');
      }
      return province.replace(/省$/, '');
    }
  }
  
  return null;
}

// 计算匹配分数 - 同省优先
function getMatchScore(supplierProvince: string | undefined, receiverProvince: string | null): number {
  if (!receiverProvince) return 50;
  if (!supplierProvince) return 30;
  
  if (supplierProvince === receiverProvince) return 100;
  
  const adjacentMap: Record<string, string[]> = {
    '广东': ['广西', '海南', '湖南', '江西', '福建'],
    '北京': ['天津', '河北', '山东'],
    '上海': ['江苏', '浙江', '安徽'],
    '福建': ['广东', '江西', '浙江'],
    '浙江': ['上海', '江苏', '安徽', '江西', '福建'],
    '江苏': ['上海', '浙江', '安徽', '山东'],
    '山东': ['江苏', '河北', '河南'],
    '河南': ['山东', '河北', '湖北', '安徽'],
    '湖北': ['河南', '湖南', '江西', '安徽'],
    '湖南': ['湖北', '江西', '广东', '广西', '贵州'],
    '四川': ['重庆', '云南', '贵州', '陕西', '甘肃', '青海'],
    '陕西': ['四川', '甘肃', '山西', '河南', '湖北'],
    '辽宁': ['吉林', '黑龙江', '河北'],
  };
  
  if (adjacentMap[receiverProvince]?.includes(supplierProvince)) return 60;
  
  return 10;
}

// 供应商匹配接口 - 统一API
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择要分配的订单' 
      }, { status: 400 });
    }

    // 获取订单
    const { data: orders, error: ordersError } = await client
      .from('orders')
      .select('*')
      .in('id', orderIds);
    
    if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '未找到订单' 
      }, { status: 404 });
    }

    // 获取历史成本
    const { data: costHistory, error: costError } = await client
      .from('order_cost_history')
      .select('product_code, supplier_id, unit_cost')
      .order('created_at', { ascending: false });
    
    if (costError) console.error('查询历史成本失败:', costError.message);

    // 获取所有活跃供应商
    const { data: suppliers, error: suppliersError } = await client
      .from('suppliers')
      .select('*')
      .eq('is_active', true);
    
    if (suppliersError) throw new Error(`查询供应商失败: ${suppliersError.message}`);

    // 获取库存（有库存和无库存都获取，用于判断商品是否有库存）
    const { data: allStocks, error: stocksError } = await client
      .from('stocks')
      .select('*');
    
    if (stocksError) throw new Error(`查询库存失败: ${stocksError.message}`);

    // 只获取有库存的库存记录
    const stocksWithQty = allStocks?.filter((s: Record<string, unknown>) => (s.quantity as number) > 0) || [];

    // 获取商品映射
    const { data: mappings, error: mappingsError } = await client
      .from('product_mappings')
      .select('*');
    
    if (mappingsError) throw new Error(`查询商品映射失败: ${mappingsError.message}`);

    const results = orders.map((order: Record<string, unknown>) => {
      // 解析 items 字段（支持新旧两种格式）
      let items: { 
        product_id?: string | null;  // 系统商品ID
        product_name?: string;        // 系统商品名称
        product_code?: string;       // 系统商品编码
        product_spec?: string;       // 系统商品规格
        productName?: string; 
        productCode?: string; 
        productSpec?: string;
        quantity?: number;
        // 客户原始商品信息
        cu_product_name?: string;
        cu_product_code?: string;
        cu_product_spec?: string;
        cuProductName?: string;
        cuProductCode?: string;
        cuProductSpec?: string;
      }[] = [];
      if (typeof order.items === 'string') {
        try {
          items = JSON.parse(order.items);
        } catch {
          items = [];
        }
      } else if (Array.isArray(order.items)) {
        items = order.items;
      }

      // 优先使用系统商品信息
      const systemProductId = items?.[0]?.product_id || null;
      const systemProductName = items?.[0]?.product_name || items?.[0]?.productName || '';
      const systemProductCode = items?.[0]?.product_code || items?.[0]?.productCode || '';
      const systemProductSpec = items?.[0]?.product_spec || items?.[0]?.productSpec || '';
      // 客户原始商品信息（用于显示）
      const customerProductName = items?.[0]?.cu_product_name || items?.[0]?.cuProductName || systemProductName;
      const customerProductCode = items?.[0]?.cu_product_code || items?.[0]?.cuProductCode || systemProductCode;
      const customerProductSpec = items?.[0]?.cu_product_spec || items?.[0]?.cuProductSpec || systemProductSpec;
      const orderQuantity = items?.[0]?.quantity || 1;
      const expressReq = (order.express_requirement as string) || '';
      const receiverAddress = (order.receiver_address as string) || '';
      const receiverProvince = extractProvince(receiverAddress);

      // 查找商品映射
      const mapping = mappings?.find((m: Record<string, unknown>) => {
        const customerProductNameField = m.customer_product_name as string;
        return customerProductNameField?.includes(customerProductName) || customerProductName?.includes(customerProductNameField);
      });

      // 查找有库存的供应商记录（优先使用系统商品ID精准匹配）
      let availableStocks = stocksWithQty.filter((s: Record<string, unknown>) => {
        // 1. 最高优先级：通过系统商品ID精准匹配
        if (systemProductId && s.system_product_id === systemProductId) {
          return true;
        }
        // 2. 次优先级：通过系统商品规格精确匹配
        if (systemProductSpec && s.system_product_spec === systemProductSpec) {
          return true;
        }
        // 3. 通过系统商品编码精确匹配
        if (systemProductCode && s.system_product_code === systemProductCode) {
          return true;
        }
        // 4. 通过商品映射的系统商品编码匹配
        if (mapping && s.system_product_code === mapping.system_product_code) {
          return true;
        }
        // 5. 备用：通过供应商商品编码匹配（兼容旧数据）
        if (customerProductCode && s.product_code === customerProductCode) {
          return true;
        }
        // 6. 备用：通过供应商商品规格匹配（兼容旧数据）
        if (customerProductSpec && (s.supplier_product_spec as string)?.includes(customerProductSpec)) {
          return true;
        }
        // 7. 最低优先级：通过商品名称模糊匹配
        if (customerProductName && (s.product_name as string)?.includes(customerProductName.split(' ')[0])) {
          return true;
        }
        return false;
      }) || [];

      // 为每个库存记录关联供应商信息
      const supplierStockList = availableStocks.map((stock: Record<string, unknown>) => {
        const supplier = suppliers?.find((s: Record<string, unknown>) => s.id === stock.supplier_id);
        if (!supplier) return null;
        
        // 检查快递限制
        const expressRestrictions = typeof supplier.express_restrictions === 'string' 
          ? JSON.parse(supplier.express_restrictions as string)
          : (supplier.express_restrictions as string[] | undefined);
        
        if (expressRestrictions?.length) {
          if ((expressRestrictions as string[]).includes('不发偏远地区')) {
            if (receiverAddress.includes('新疆') || receiverAddress.includes('西藏')) {
              return null;
            }
          }
        }
        
        // 检查京东限制
        if ((expressReq.includes('必须发京东') || expressReq.includes('京东')) && !(supplier.can_jd as boolean)) {
          return null;
        }
        
        // 获取该供应商对该商品的历史成本
        const historyCosts = costHistory?.filter((c: { product_code: string; supplier_id: string }) => 
          c.product_code === stock.product_code && c.supplier_id === supplier.id
        );
        const lastCost = historyCosts?.[0]?.unit_cost;
        
        return {
          supplier: {
            id: supplier.id,
            name: supplier.name,
            type: supplier.type,
            province: supplier.province,
            canJd: supplier.can_jd,
          },
          stock: {
            id: stock.id,
            productCode: stock.product_code,
            productName: stock.product_name,
            quantity: stock.quantity,
            price: stock.price,
            version: stock.version,
          },
          historyCost: lastCost || null,
          score: getMatchScore(supplier.province as string | undefined, receiverProvince),
        };
      }).filter(Boolean) as {
        supplier: { id: string; name: string; type: string; province?: string; canJd?: boolean };
        stock: { id: string; productCode: string; productName: string; quantity: number; price: number; version?: string };
        historyCost: number | null;
        score: number;
      }[];

      // 按分数排序
      supplierStockList.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.stock.quantity - a.stock.quantity;
      });

      // 省份匹配说明
      const getProvinceDesc = (supplierProvince?: string) => {
        if (!receiverProvince) return '';
        if (!supplierProvince) return '省份未知';
        if (supplierProvince === receiverProvince) return '同省';
        const adjacentMap: Record<string, string[]> = {
          '广东': ['广西', '海南', '湖南', '江西', '福建'],
          '北京': ['天津', '河北', '山东'],
          '上海': ['江苏', '浙江', '安徽'],
          '福建': ['广东', '江西', '浙江'],
          '浙江': ['上海', '江苏', '安徽', '江西', '福建'],
          '江苏': ['上海', '浙江', '安徽', '山东'],
          '山东': ['江苏', '河北', '河南'],
          '河南': ['山东', '河北', '湖北', '安徽'],
          '湖北': ['河南', '湖南', '江西', '安徽'],
          '湖南': ['湖北', '江西', '广东', '广西', '贵州'],
          '四川': ['重庆', '云南', '贵州', '陕西', '甘肃', '青海'],
        };
        if (adjacentMap[receiverProvince]?.includes(supplierProvince)) return '邻近';
        return '较远';
      };

      // 尾货预警
      let warning: string | undefined;
      if (supplierStockList.length > 0 && supplierStockList[0].stock.quantity <= 2) {
        warning = `尾货预警：库存仅剩 ${supplierStockList[0].stock.quantity} 台`;
      }

      // 推荐供应商
      const recommended = supplierStockList[0] || null;

      // 判断是否为新商品（没有任何供应商有该商品库存）
      const hasStockForProduct = supplierStockList.length > 0;

      // 如果没有有库存的供应商，返回所有供应商列表（允许手动选择）
      const allSupplierOptions = hasStockForProduct ? supplierStockList.map(s => ({
        supplierId: s.supplier.id,
        supplierName: s.supplier.name,
        supplierType: s.supplier.type,
        province: s.supplier.province,
        provinceMatch: getProvinceDesc(s.supplier.province),
        productCode: s.stock.productCode,
        productName: s.stock.productName,
        quantity: s.stock.quantity,
        price: s.stock.price,
        historyCost: s.historyCost,
        version: s.stock.version,
        score: s.score,
        hasStock: true,
      })) : suppliers?.map(s => ({
        supplierId: s.id,
        supplierName: s.name,
        supplierType: s.type,
        province: s.province,
        provinceMatch: getProvinceDesc(s.province as string | undefined),
        productCode: customerProductCode || '-',
        productName: customerProductName || '-',
        quantity: 0,
        price: 0,
        historyCost: null,
        version: null,
        score: getMatchScore(s.province as string | undefined, receiverProvince),
        hasStock: false,
      })) || [];

      // 新商品提示
      let newProductHint: string | undefined;
      if (!hasStockForProduct) {
        newProductHint = `新商品"${customerProductName || customerProductCode || '未知商品'}"暂无库存，可手动选择供应商`;
      }

      return {
        orderId: order.id,
        orderNo: order.order_no,
        // 客户原始商品信息
        customerProductName,
        customerProductCode,
        customerProductSpec,
        // 系统商品信息
        systemProductId,
        systemProductName,
        systemProductCode,
        systemProductSpec,
        // 订单数量
        quantity: orderQuantity,
        receiverProvince,
        receiverAddress,
        // 推荐供应商
        recommendedSupplier: recommended ? {
          id: recommended.supplier.id,
          name: recommended.supplier.name,
          type: recommended.supplier.type,
          province: recommended.supplier.province,
          provinceMatch: getProvinceDesc(recommended.supplier.province),
        } : null,
        // 库存详情（使用系统商品信息）
        stockInfo: recommended ? {
          productCode: recommended.stock.productCode,
          productName: recommended.stock.productName,
          productSpec: (recommended.stock as Record<string, unknown>).productSpec as string || '',
          quantity: recommended.stock.quantity,
          price: recommended.stock.price,
          historyCost: recommended.historyCost,
          version: recommended.stock.version,
        } : null,
        // 所有供应商选项（带库存状态的）
        allSupplierOptions: allSupplierOptions.map(opt => ({
          ...opt,
          // 添加供应商商品信息（来自库存表）
          supplierProductSpec: (availableStocks.find(s => s.supplier_id === opt.supplierId) as Record<string, unknown>)?.supplier_product_spec || '',
        })),
        // 是否有库存的供应商
        hasStockForProduct,
        warning,
        newProductHint,
      };
    });

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length
    });

  } catch (error) {
    console.error('匹配供应商失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
