import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface ProductLookup {
  id: string;
  barcode: string | null;
  name: string | null;
}

// 创建指向 public schema 的 client
function getPublicSupabaseClient() {
  const url = process.env.COZE_SUPABASE_URL;
  const anonKey = process.env.COZE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, anonKey, {
    db: { schema: 'public' },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: '数据格式无效' }, { status: 400 });
    }

    const supabase = getPublicSupabaseClient();
    
    // 获取商品和客户列表用于映射
    const { data: products } = await supabase
      .from('products')
      .select('id, barcode, name')
      .eq('is_active', true);
    
    const { data: customers } = await supabase
      .from('customers')
      .select('id, code')
      .eq('is_active', true);

    const productMap = new Map((products || []).map(p => [p.barcode, p.id]));
    const customerMap = new Map((customers || []).map(c => [c.code, c.id]));

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        const customerProductName = item.customerProductName || item['客户商品名'] || item['商品名'];
        const customerSku = item.customerSku || item['客户SKU'] || item['SKU'];
        const price = parseFloat(item.price || item['价格'] || '0') || 0;

        let productId = customerSku ? productMap.get(customerSku) : null;
        
        if (!productId && item.internalProductName) {
          const found = (products as ProductLookup[] | null)?.find((product) => product.name === item.internalProductName);
          if (found) productId = found.id;
        }

        const customerId = item.customerCode ? customerMap.get(item.customerCode) : null;

        // 验证至少有一个商品名称
        if (!customerProductName && !customerSku) {
          errors.push(`第 ${imported + skipped + 1} 行：缺少商品名称或SKU`);
          skipped++;
          continue;
        }

        const mappingData: Record<string, unknown> = {
          customer_product_name: customerProductName,
        };

        if (customerId) mappingData.customer_id = customerId;
        if (item.customerCode) mappingData.customer_code = item.customerCode;
        if (customerSku) mappingData.customer_sku = customerSku;
        if (item.customerBarcode) mappingData.customer_barcode = item.customerBarcode;
        if (productId) mappingData.product_id = productId;
        if (item.internalSku) mappingData.product_code = item.internalSku;
        if (item.internalProductName) mappingData.product_name = item.internalProductName;
        if (price) mappingData.price = price;
        if (item.remark || item['备注']) mappingData.remark = item.remark || item['备注'];
        mappingData.is_active = true;

        const { error } = await supabase
          .from('product_mappings')
          .insert(mappingData);

        if (error) {
          errors.push(`第 ${imported + skipped + 1} 行：${error.message}`);
          skipped++;
        } else {
          imported++;
        }
      } catch (err) {
        errors.push(`第 ${imported + skipped + 1} 行：处理失败`);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: data.length,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('SKU mapping import error:', error);
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
