import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { stocks } = await request.json();
    
    if (!stocks || !Array.isArray(stocks) || stocks.length === 0) {
      return NextResponse.json({ success: false, error: '无效的库存数据' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    
    // 先获取所有发货方（供应商）信息，用于ID匹配
    const { data: shippers } = await supabase
      .from('shippers')
      .select('id, code, name')
      .eq('type', 'supplier');

    const supplierMap = new Map<string, string>();
    if (shippers) {
      shippers.forEach((s: { id: string; code: string; name: string }) => {
        supplierMap.set(s.code, s.id);
        supplierMap.set(s.name, s.id);
      });
    }

    // 批量处理库存数据
    const stocksData: Record<string, unknown>[] = [];
    const stockId = crypto.randomUUID();
    
    for (const stock of stocks) {
      const supplierId = supplierMap.get(stock.supplierCode) || supplierMap.get(stock.supplierName) || null;
      
      // 商品档案自动匹配
      let productId: string | null = null;
      let productName = stock.productName;
      let productCode = stock.productCode;
      
      // 1. 按规格型号精确匹配
      if (stock.spec) {
        const { data: specProducts } = await supabase
          .from('products')
          .select('id, name, code, spec')
          .eq('spec', stock.spec)
          .limit(1);
        
        if (specProducts && specProducts.length > 0) {
          const p = specProducts[0];
          productId = p.id;
          productName = p.name;
          productCode = p.code;
        }
      }
      
      // 2. 按商品编码精确匹配
      if (!productId && stock.productCode) {
        const { data: codeProducts } = await supabase
          .from('products')
          .select('id, name, code')
          .eq('code', stock.productCode)
          .limit(1);
        
        if (codeProducts && codeProducts.length > 0) {
          const p = codeProducts[0];
          productId = p.id;
          productName = p.name;
          productCode = p.code;
        }
      }

      // 3. 按商品名称模糊匹配
      if (!productId && stock.productName) {
        const { data: nameProducts } = await supabase
          .from('products')
          .select('id, name, code')
          .ilike('name', `%${stock.productName}%`)
          .limit(1);
        
        if (nameProducts && nameProducts.length > 0) {
          const p = nameProducts[0];
          productId = p.id;
          productName = p.name;
          productCode = p.code;
        }
      }

      const stockRecord: Record<string, unknown> = {
        id: crypto.randomUUID(),
        supplier_id: supplierId,
        supplier_name: stock.supplierName || stock.supplierCode,
        product_name: stock.productName,
        product_code: stock.productCode,
        supplier_product_spec: stock.spec || '',
        system_product_id: productId,
        system_product_name: productName,
        system_product_code: productCode,
        quantity: stock.quantity,
        price: stock.price,
        warehouse: stock.warehouse || '默认仓',
        remark: stock.remark || '',
        match_type: productId ? 'spec' : 'none',
        updated_at: new Date().toISOString(),
      };

      // 检查是否已存在
      if (supplierId && stock.spec) {
        const { data: existing } = await supabase
          .from('stocks')
          .select('id')
          .eq('supplier_id', supplierId)
          .eq('supplier_product_spec', stock.spec)
          .maybeSingle();
        
        if (existing) {
          // 更新
          await supabase
            .from('stocks')
            .update(stockRecord)
            .eq('id', existing.id);
          continue;
        }
      }

      stocksData.push(stockRecord);
    }

    // 批量插入
    if (stocksData.length > 0) {
      const { error } = await supabase
        .from('stocks')
        .insert(stocksData);

      if (error) {
        console.error('批量导入库存失败:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, count: stocksData.length });
  } catch (error) {
    console.error('批量导入库存失败:', error);
    return NextResponse.json({ success: false, error: '批量导入失败' }, { status: 500 });
  }
}
