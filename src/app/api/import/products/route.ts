import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

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

// 字段映射：前端字段名 -> 数据库字段名
const FIELD_MAPPING: Record<string, string> = {
  code: 'code',
  barcode: 'barcode',
  name: 'name',
  brand: 'brand',
  category: 'category',
  spec: 'spec',
  unit: 'unit',
  costPrice: 'cost_price',
  retailPrice: 'retail_price',
  lengthCm: 'length_cm',
  widthCm: 'width_cm',
  heightCm: 'height_cm',
  weightKg: 'weight_kg',
  lifecycleStatus: 'lifecycle_status',
  remark: 'remark',
};

// 中文列名到字段名的映射
const CHINESE_MAPPING: Record<string, string> = {
  '商品编码': 'code',
  '编码': 'code',
  'SKU': 'code',
  '条码': 'barcode',
  '商品条码': 'barcode',
  '商品名称': 'name',
  '名称': 'name',
  '商品': 'name',
  '品名': 'name',
  '品牌': 'brand',
  '商品品牌': 'brand',
  '分类': 'category',
  '类别': 'category',
  '商品分类': 'category',
  '规格型号': 'spec',
  '规格': 'spec',
  '型号': 'spec',
  '商品规格': 'spec',
  '单位': 'unit',
  '计量单位': 'unit',
  '成本价': 'costPrice',
  '采购价': 'costPrice',
  '成本': 'costPrice',
  '零售价': 'retailPrice',
  '售价': 'retailPrice',
  '零售': 'retailPrice',
  '价格': 'retailPrice',
  '单价': 'retailPrice',
  '长度(cm)': 'lengthCm',
  '长(cm)': 'lengthCm',
  '长度': 'lengthCm',
  '长': 'lengthCm',
  '宽度(cm)': 'widthCm',
  '宽(cm)': 'widthCm',
  '宽度': 'widthCm',
  '宽': 'widthCm',
  '高度(cm)': 'heightCm',
  '高(cm)': 'heightCm',
  '高度': 'heightCm',
  '高': 'heightCm',
  '重量(kg)': 'weightKg',
  '重量': 'weightKg',
  '重': 'weightKg',
  '生命周期状态': 'lifecycleStatus',
  '生命周期': 'lifecycleStatus',
  '状态': 'lifecycleStatus',
  '备注': 'remark',
  '备注信息': 'remark',
};

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_CREATE);
  if (authError) return authError;

  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: '数据格式无效' }, { status: 400 });
    }

    const supabase = getPublicSupabaseClient();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 验证必需字段
        if (!item.name && !item['商品名称']) {
          errors.push(`第 ${imported + skipped + 1} 行：缺少商品名称`);
          skipped++;
          continue;
        }

        // 构建商品数据
        const productData: Record<string, unknown> = {};
        
        // 处理所有字段
        for (const [key, value] of Object.entries(item)) {
          // 如果是已知的英文字段名
          if (FIELD_MAPPING[key]) {
            const dbField = FIELD_MAPPING[key];
            if (key === 'costPrice' || key === 'retailPrice') {
              productData[dbField] = parseFloat(String(value)) || 0;
            } else if (['lengthCm', 'widthCm', 'heightCm', 'weightKg'].includes(key)) {
              productData[dbField] = parseFloat(String(value)) || null;
            } else if (key === 'lifecycleStatus') {
              // 转换生命周期状态
              const statusMap: Record<string, string> = {
                '正常': 'active',
                '停产': 'discontinued',
                '清仓': 'clearance',
                'active': 'active',
                'discontinued': 'discontinued',
                'clearance': 'clearance',
              };
              productData[dbField] = statusMap[String(value)] || 'active';
            } else {
              productData[dbField] = value;
            }
          }
          // 如果是中文列名，转换为标准字段名
          else if (CHINESE_MAPPING[key]) {
            const fieldName = CHINESE_MAPPING[key];
            if (fieldName === 'costPrice' || fieldName === 'retailPrice') {
              productData[FIELD_MAPPING[fieldName]] = parseFloat(String(value)) || 0;
            } else if (['lengthCm', 'widthCm', 'heightCm', 'weightKg'].includes(fieldName)) {
              productData[FIELD_MAPPING[fieldName]] = parseFloat(String(value)) || null;
            } else if (fieldName === 'lifecycleStatus') {
              const statusMap: Record<string, string> = {
                '正常': 'active',
                '停产': 'discontinued',
                '清仓': 'clearance',
              };
              productData[FIELD_MAPPING[fieldName]] = statusMap[String(value)] || 'active';
            } else {
              productData[FIELD_MAPPING[fieldName]] = value;
            }
          }
        }
        
        // 设置默认值
        if (!productData.code) {
          productData.code = `P${Date.now()}${imported + skipped}`;
        }
        productData.is_active = true;

        const { error } = await supabase
          .from('products')
          .insert(productData);

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
    console.error('Product import error:', error);
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
