import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

// 系统商品匹配接口
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { productName, productSpec, customerCode } = body;

    if (!productName && !productSpec) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供商品名称或规格型号' 
      }, { status: 400 });
    }

    // 1. 首先查询客户SKU映射表，查找是否有对应的映射记录
    let mappingsQuery = client.from('product_mappings').select('*');
    
    if (customerCode) {
      mappingsQuery = mappingsQuery.eq('customer_code', customerCode);
    }
    
    const { data: mappings, error: mappingsError } = await mappingsQuery;
    if (mappingsError) {
      console.error('查询SKU映射失败:', mappingsError.message);
    }

    // 2. 优先通过SKU映射表匹配
    if (mappings && mappings.length > 0) {
      // 精确匹配商品名称
      let matchedMapping = mappings.find((m: Record<string, unknown>) => {
        const mappedName = (m.customer_product_name as string) || '';
        return mappedName === productName || mappedName.includes(productName) || productName.includes(mappedName);
      });

      // 如果没匹配到名称，尝试匹配规格型号
      if (!matchedMapping && productSpec) {
        matchedMapping = mappings.find((m: Record<string, unknown>) => {
          const mappedSpec = (m.customer_product_spec as string) || '';
          return mappedSpec === productSpec || mappedSpec.includes(productSpec) || productSpec.includes(mappedSpec);
        });
      }

      if (matchedMapping) {
        // 查询系统商品详情
        const productId = matchedMapping.product_id;
        if (productId) {
          const { data: product, error: productError } = await client
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          
          if (!productError && product) {
            return NextResponse.json({
              success: true,
              data: {
                productId: product.id,
                productCode: product.code,
                productName: product.name,
                productSpec: product.spec,
                productBrand: product.brand,
                unitPrice: product.retail_price,
                matchType: 'mapping',
                matchSource: 'sku_mapping',
              }
            });
          }
        }

        // 如果没有关联系统商品，但映射表有记录
        return NextResponse.json({
          success: true,
          data: {
            productId: matchedMapping.product_id,
            productCode: matchedMapping.product_code,
            productName: matchedMapping.product_name,
            productSpec: matchedMapping.product_spec,
            productBrand: matchedMapping.product_brand,
            unitPrice: matchedMapping.price,
            matchType: 'mapping',
            matchSource: 'sku_mapping',
          }
        });
      }
    }

    // 3. 如果SKU映射表没有匹配，尝试直接查询系统商品档案
    // 使用模糊匹配（商品名包含搜索词，或规格型号包含搜索词）
    const productsQuery = client.from('products').select('*').eq('is_active', true);
    
    const { data: products, error: productsError } = await productsQuery;
    if (productsError) {
      throw new Error(`查询商品失败: ${productsError.message}`);
    }

    if (products && products.length > 0) {
      // 匹配策略：
      // 1. 优先精确匹配名称或规格
      // 2. 其次包含匹配
      // 3. 最后模糊匹配（截取关键词）

      let matchedProduct = null;
      let matchScore = 0;

      for (const product of products) {
        const pName = (product.name as string) || '';
        const pSpec = (product.spec as string) || '';
        const pCode = (product.code as string) || '';

        let score = 0;

        // 名称精确匹配
        if (productName && pName === productName) {
          score = 100;
        }
        // 规格精确匹配
        else if (productSpec && pSpec === productSpec) {
          score = 95;
        }
        // 名称包含匹配
        else if (productName && (pName.includes(productName) || productName.includes(pName))) {
          score = 80;
        }
        // 规格包含匹配
        else if (productSpec && (pSpec.includes(productSpec) || productSpec.includes(pSpec))) {
          score = 75;
        }
        // 品牌+规格组合匹配
        else if (productSpec) {
          // 提取规格中的关键型号进行匹配
          const specMatch = pSpec.includes(productSpec) || productSpec.includes(pSpec);
          if (specMatch) {
            score = 70;
          }
        }
        // 编码匹配
        else if (productName && pCode.includes(productName)) {
          score = 60;
        }

        // 关键词匹配（取商品名称的前两个字符作为关键词）
        if (score === 0 && productName) {
          const keywords = productName.slice(0, Math.min(4, productName.length));
          if (pName.includes(keywords) || pSpec.includes(keywords)) {
            score = 40;
          }
        }

        if (score > matchScore) {
          matchScore = score;
          matchedProduct = product;
        }
      }

      // 只有匹配分数超过阈值才返回
      if (matchedProduct && matchScore >= 40) {
        return NextResponse.json({
          success: true,
          data: {
            productId: matchedProduct.id,
            productCode: matchedProduct.code,
            productName: matchedProduct.name,
            productSpec: matchedProduct.spec,
            productBrand: matchedProduct.brand,
            unitPrice: matchedProduct.retail_price,
            matchType: matchScore >= 70 ? 'fuzzy' : 'keyword',
            matchSource: 'products',
            matchScore: matchScore,
          }
        });
      }
    }

    // 4. 完全没有匹配
    return NextResponse.json({
      success: true,
      data: null,
      message: '未找到匹配的系统商品'
    });

  } catch (error) {
    console.error('系统商品匹配失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '系统商品匹配失败' 
    }, { status: 500 });
  }
}

// 批量匹配接口
export async function PUT(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.PRODUCTS_VIEW);
  if (authError) return authError;

  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { items, customerCode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请提供要匹配的商品列表' 
      }, { status: 400 });
    }

    // 获取客户SKU映射表
    let mappingsQuery = client.from('product_mappings').select('*');
    if (customerCode) {
      mappingsQuery = mappingsQuery.eq('customer_code', customerCode);
    }
    const { data: mappings } = await mappingsQuery;

    // 获取系统商品列表
    const { data: products } = await client
      .from('products')
      .select('*')
      .eq('is_active', true);

    const results = items.map((item: { productName?: string; productSpec?: string }) => {
      const { productName, productSpec } = item;
      
      // 1. 优先通过SKU映射表匹配
      if (mappings && mappings.length > 0) {
        let matchedMapping = mappings.find((m: Record<string, unknown>) => {
          const mappedName = (m.customer_product_name as string) || '';
          return mappedName === productName || mappedName.includes(productName || '') || (productName || '').includes(mappedName);
        });

        if (!matchedMapping && productSpec) {
          matchedMapping = mappings.find((m: Record<string, unknown>) => {
            const mappedSpec = (m.customer_product_spec as string) || '';
            return mappedSpec === productSpec || mappedSpec.includes(productSpec) || productSpec.includes(mappedSpec);
          });
        }

        if (matchedMapping) {
          return {
            productName,
            productSpec,
            matched: true,
            matchType: 'mapping',
            productId: matchedMapping.product_id,
            productCode: matchedMapping.product_code,
            productNameResult: matchedMapping.product_name,
            productSpecResult: matchedMapping.product_spec,
            productBrand: matchedMapping.product_brand,
          };
        }
      }

      // 2. 直接匹配系统商品
      if (products && products.length > 0) {
        let matchedProduct = null;
        let matchScore = 0;

        for (const product of products) {
          const pName = (product.name as string) || '';
          const pSpec = (product.spec as string) || '';
          const pCode = (product.code as string) || '';

          let score = 0;

          if (productName && pName === productName) score = 100;
          else if (productSpec && pSpec === productSpec) score = 95;
          else if (productName && (pName.includes(productName) || productName.includes(pName))) score = 80;
          else if (productSpec && (pSpec.includes(productSpec) || productSpec.includes(pSpec))) score = 75;
          else if (productSpec && pSpec.includes(productSpec)) score = 70;

          if (score > matchScore) {
            matchScore = score;
            matchedProduct = product;
          }
        }

        if (matchedProduct && matchScore >= 40) {
          return {
            productName,
            productSpec,
            matched: true,
            matchType: matchScore >= 70 ? 'fuzzy' : 'keyword',
            productId: matchedProduct.id,
            productCode: matchedProduct.code,
            productNameResult: matchedProduct.name,
            productSpecResult: matchedProduct.spec,
            productBrand: matchedProduct.brand,
            matchScore,
          };
        }
      }

      return {
        productName,
        productSpec,
        matched: false,
        matchType: null,
      };
    });

    const matchedCount = results.filter((r: { matched: boolean }) => r.matched).length;

    return NextResponse.json({
      success: true,
      data: results,
      summary: {
        total: items.length,
        matched: matchedCount,
        unmatched: items.length - matchedCount,
      }
    });

  } catch (error) {
    console.error('批量系统商品匹配失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '批量系统商品匹配失败' 
    }, { status: 500 });
  }
}
