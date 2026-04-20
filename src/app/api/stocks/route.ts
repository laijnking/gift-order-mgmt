import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';

const LOW_STOCK_THRESHOLD = 2;

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

type EnhancedStock = Record<string, unknown> & {
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  unitPrice: number;
  price: number;
  isLowStock: boolean;
  stockLevel: 'out' | 'low' | 'normal';
  available: number;
};

function enhanceStock(stock: Record<string, unknown>): EnhancedStock {
  const quantity = toNumber(stock.quantity);
  const reserved = toNumber(stock.reserved_quantity);
  const available = Math.max(0, toNumber(stock.available_quantity, quantity - reserved));
  const unitPrice = toNumber(stock.unit_price);

  return {
    ...stock,
    quantity,
    reservedQuantity: reserved,
    availableQuantity: available,
    unitPrice,
    price: unitPrice,
    isLowStock: quantity > 0 && quantity <= LOW_STOCK_THRESHOLD,
    stockLevel: quantity === 0 ? 'out' : quantity <= LOW_STOCK_THRESHOLD ? 'low' : 'normal',
    available,
  };
}

export async function GET(request: NextRequest) {
  const authError = requirePermission(request, 'stocks:view');
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const supplierId = searchParams.get('supplierId');
  const supplierName = searchParams.get('supplierName');
  const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
  const warehouseId = searchParams.get('warehouseId');

  try {
    let query = client.from('stocks').select('*');

    if (search) {
      query = query.or(`product_code.ilike.%${search}%,product_name.ilike.%${search}%,supplier_name.ilike.%${search}%`);
    }
    if (supplierId) query = query.eq('supplier_id', supplierId);
    if (supplierName) query = query.ilike('supplier_name', `%${supplierName}%`);
    if (warehouseId) query = query.eq('warehouse_id', warehouseId);
    if (lowStockOnly) query = query.lte('quantity', LOW_STOCK_THRESHOLD);

    const { data, error } = await query.order('updated_at', { ascending: false }).limit(1000);
    if (error) throw new Error(`查询库存失败: ${error.message}`);

    const enhancedData = (data || []).map((stock) => enhanceStock(stock as Record<string, unknown>));
    return NextResponse.json({
      success: true,
      data: enhancedData,
      total: enhancedData.length,
      stats: {
        lowStockCount: enhancedData.filter((s) => s.isLowStock).length,
        outOfStockCount: enhancedData.filter((s) => s.stockLevel === 'out').length,
        totalCount: enhancedData.length,
        totalQuantity: enhancedData.reduce((sum, s) => sum + s.quantity, 0),
        totalValue: enhancedData.reduce((sum, s) => sum + s.quantity * s.unitPrice, 0),
      },
    });
  } catch (error) {
    console.error('获取库存失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'stocks:edit');
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    let productId = body.productId || body.product_id || null;
    const supplierId = body.supplierId || body.supplier_id;
    const quantity = toNumber(body.quantity);
    const unitPrice = toNumber(body.unitPrice ?? body.unit_price ?? body.price);

    if (!supplierId) {
      return NextResponse.json({ success: false, error: '供应商不能为空' }, { status: 400 });
    }

    if (!productId) {
      const generatedCode = String(body.productCode || body.product_code || body.productName || body.product_name || `AUTO-${Date.now().toString(36)}`).slice(0, 50);
      const generatedName = String(body.productName || body.product_name || generatedCode);
      const { data: product, error: productError } = await client
        .from('products')
        .insert({
          id: crypto.randomUUID(),
          code: generatedCode,
          name: generatedName,
          spec: body.productSpec || body.product_spec || generatedCode,
          cost_price: unitPrice,
          lifecycle_status: '在售',
          is_active: true,
          remark: '库存新增时自动创建的商品档案',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      if (productError) throw new Error(`自动创建商品档案失败: ${productError.message}`);
      productId = product.id;
    }

    const stockData = {
      product_id: productId,
      product_code: body.productCode || body.product_code || null,
      product_name: body.productName || body.product_name || '',
      supplier_id: supplierId,
      supplier_name: body.supplierName || body.supplier_name || '',
      warehouse_id: body.warehouseId || body.warehouse_id || null,
      warehouse_name: body.warehouseName || body.warehouse_name || null,
      quantity,
      reserved_quantity: toNumber(body.reservedQuantity ?? body.reserved_quantity),
      unit_price: unitPrice,
      min_stock: toNumber(body.minStock ?? body.min_stock, LOW_STOCK_THRESHOLD),
      max_stock: body.maxStock ?? body.max_stock ?? null,
      status: body.status || 'active',
      remark: body.remark || null,
      updated_at: new Date().toISOString(),
    };

    let existing = null;
    if (productId) {
      const { data } = await client
        .from('stocks')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('product_id', productId)
        .maybeSingle();
      existing = data;
    }

    if (!existing && stockData.product_code) {
      const { data } = await client
        .from('stocks')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('product_code', stockData.product_code)
        .maybeSingle();
      existing = data;
    }

    if (existing) {
      const { data, error } = await client
        .from('stocks')
        .update(stockData)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw new Error(`更新库存失败: ${error.message}`);
      return NextResponse.json({ success: true, data: enhanceStock(data as Record<string, unknown>), message: '库存已更新' });
    }

    const { data, error } = await client
      .from('stocks')
      .insert({ id: body.id || crypto.randomUUID(), ...stockData, created_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw new Error(`添加库存失败: ${error.message}`);

    return NextResponse.json({ success: true, data: enhanceStock(data as Record<string, unknown>), message: '库存已新增' });
  } catch (error) {
    console.error('添加库存失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const authError = requirePermission(request, 'stocks:edit');
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: '缺少库存ID' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.quantity !== undefined) updateData.quantity = toNumber(body.quantity);
    if (body.reservedQuantity !== undefined || body.reserved_quantity !== undefined) {
      updateData.reserved_quantity = toNumber(body.reservedQuantity ?? body.reserved_quantity);
    }
    if (body.unitPrice !== undefined || body.unit_price !== undefined || body.price !== undefined) {
      updateData.unit_price = toNumber(body.unitPrice ?? body.unit_price ?? body.price);
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.remark !== undefined) updateData.remark = body.remark;

    const { data, error } = await client
      .from('stocks')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();
    if (error) throw new Error(`更新库存失败: ${error.message}`);

    const enhanced = enhanceStock(data as Record<string, unknown>);
    return NextResponse.json({
      success: true,
      data: enhanced,
      warning: enhanced.isLowStock ? `库存预警：${String(enhanced['product_name'] || '商品')}库存仅剩 ${enhanced.quantity} 台` : null,
    });
  } catch (error) {
    console.error('更新库存失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
