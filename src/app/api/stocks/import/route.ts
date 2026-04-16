import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';

// 商品档案自动匹配函数（供应商商品 → 系统商品）
async function matchSystemProduct(
  client: ReturnType<typeof getSupabaseClient>,
  supplierProductName: string,
  supplierProductCode: string,
  supplierProductSpec: string,
  supplierId?: string
): Promise<{
  productId: string | null;
  productName: string;
  productSpec: string;
  productCode: string;
  unitPrice: number | null;
  matchType: 'spec' | 'name' | 'mapping' | 'none';
  matchHint: string;
}> {
  
  // 1. 查找供应商商品映射表（最高优先级）
  if (supplierId) {
    const { data: supplierMappings } = await client
      .from('product_mappings')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('mapping_type', 'supplier')
      .eq('is_active', true)
      .limit(5);

    if (supplierMappings && supplierMappings.length > 0) {
      const exactMatch = supplierMappings.find((m: Record<string, unknown>) => {
        const mSpec = (m.source_product_spec as string) || '';
        const mName = (m.source_product_name as string) || '';
        return mSpec === supplierProductSpec || mName === supplierProductName;
      });

      const mapping = exactMatch || supplierMappings[0];
      
      if (mapping && mapping.product_id) {
        const { data: products } = await client
          .from('products')
          .select('*')
          .eq('id', mapping.product_id)
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
            matchHint: `通过供应商SKU映射匹配：${supplierProductName} → ${p.name}`,
          };
        }
      }
    }
  }

  // 2. 按规格型号精确匹配
  if (supplierProductSpec) {
    const { data: specProducts } = await client
      .from('products')
      .select('*')
      .eq('spec', supplierProductSpec)
      .limit(3);

    if (specProducts && specProducts.length > 0) {
      const p = specProducts[0];
      return {
        productId: p.id,
        productName: p.name as string,
        productSpec: p.spec as string || '',
        productCode: p.code as string || '',
        unitPrice: p.unit_price as number || null,
        matchType: 'spec',
        matchHint: `通过规格型号精确匹配：${supplierProductSpec}`,
      };
    }
  }

  // 3. 按商品编码精确匹配
  if (supplierProductCode) {
    const { data: codeProducts } = await client
      .from('products')
      .select('*')
      .eq('code', supplierProductCode)
      .limit(3);

    if (codeProducts && codeProducts.length > 0) {
      const p = codeProducts[0];
      return {
        productId: p.id,
        productName: p.name as string,
        productSpec: p.spec as string || '',
        productCode: p.code as string || '',
        unitPrice: p.unit_price as number || null,
        matchType: 'spec',
        matchHint: `通过商品编码精确匹配：${supplierProductCode}`,
      };
    }
  }

  // 4. 按商品名称模糊匹配
  if (supplierProductName) {
    const { data: nameProducts } = await client
      .from('products')
      .select('*')
      .ilike('name', `%${supplierProductName}%`)
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
        matchHint: `通过商品名称模糊匹配：${supplierProductName} → ${p.name}`,
      };
    }
  }

  // 5. 未匹配到任何商品档案
  return {
    productId: null,
    productName: supplierProductName,
    productSpec: supplierProductSpec,
    productCode: supplierProductCode,
    unitPrice: null,
    matchType: 'none',
    matchHint: `未匹配到系统商品档案`,
  };
}

// 解析Excel文件为数据数组
async function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet, { raw: false }) as Record<string, string>[];
    return rawData;
  } catch (error) {
    throw new Error('Excel文件解析失败');
  }
}

// 标准化数据：将Excel列名映射到标准字段名
function normalizeData(rawData: Record<string, string>[]): Record<string, string>[] {
  if (rawData.length === 0) return [];

  const standardFields = ['supplierCode', 'supplierName', 'productName', 'productCode', 'spec', 'quantity', 'price', 'warehouse', 'remark'];
  const firstRow = rawData[0];
  
  // 检查是否已经是标准格式（第一行的key就是标准字段）
  const hasStandardFormat = standardFields.some(field => field in firstRow);
  
  if (hasStandardFormat) {
    // 已经是标准格式，直接返回
    return rawData.filter(row => row.productName || row.supplierName);
  }

  // 否则需要做列名映射
  const columnMappings: Record<string, string[]> = {
    supplierCode: ['供应商编码', '供应商代码', '编码'],
    supplierName: ['供应商名称', '供应商', '供货商'],
    productName: ['商品名称', '品名', '商品'],
    productCode: ['商品编码', 'SKU', '货号'],
    spec: ['规格', '规格型号', '型号规格'],
    quantity: ['库存', '数量', '库存数量'],
    price: ['单价', '价格', '采购价'],
    warehouse: ['仓库', '仓库名称', '仓库编码'],
    remark: ['备注', '说明'],
  };

  const excelToField: Record<string, string> = {};
  for (const [field, possibleNames] of Object.entries(columnMappings)) {
    for (const name of possibleNames) {
      const normalizedName = name.trim().toLowerCase();
      for (const excelCol of Object.keys(firstRow)) {
        if (excelCol.trim().toLowerCase() === normalizedName) {
          excelToField[excelCol] = field;
          break;
        }
      }
    }
  }

  return rawData.map(row => {
    const mappedRow: Record<string, string> = {};
    for (const [excelCol, value] of Object.entries(row)) {
      const field = excelToField[excelCol];
      if (field) {
        mappedRow[field] = value;
      }
    }
    return mappedRow;
  }).filter(row => row.productName || row.supplierName);
}

// 处理库存数据导入的核心函数
async function processStockImport(
  client: ReturnType<typeof getSupabaseClient>,
  items: Record<string, string>[]
) {
  const stocksToInsert: Record<string, unknown>[] = [];
  const stocksToUpdate: Record<string, unknown>[] = [];
  const matchStats = { spec: 0, name: 0, mapping: 0, none: 0 };
  const supplierNotFound: string[] = [];

  for (const row of items) {
    const supplierCode = row.supplierCode || '';
    const supplierName = row.supplierName || '';
    const supplierProductName = row.productName || '';
    
    if (!supplierProductName) continue;

    // 查找供应商
    let supplierId: string | null = null;
    let matchedSupplierName = supplierName;

    if (supplierCode) {
      const { data: supplierByCode } = await client
        .from('suppliers')
        .select('id, name')
        .eq('id', supplierCode)
        .eq('is_active', true)
        .limit(1);
      
      if (supplierByCode && supplierByCode.length > 0) {
        supplierId = supplierByCode[0].id as string;
        matchedSupplierName = supplierByCode[0].name as string;
      }
    }

    if (!supplierId && supplierName) {
      const { data: supplierByName } = await client
        .from('suppliers')
        .select('id, name')
        .ilike('name', `%${supplierName}%`)
        .eq('is_active', true)
        .limit(1);
      
      if (supplierByName && supplierByName.length > 0) {
        supplierId = supplierByName[0].id as string;
        matchedSupplierName = supplierByName[0].name as string;
      }
    }

    if (!supplierId) {
      const key = supplierCode || supplierName;
      if (key && !supplierNotFound.includes(key)) {
        supplierNotFound.push(key);
      }
      continue;
    }

    const supplierProductCode = row.productCode || '';
    const supplierProductSpec = row.spec || '';
    const quantity = parseInt(row.quantity || '0') || 0;
    const price = parseFloat(row.price || '0') || 0;
    const warehouse = row.warehouse || '';
    const remark = row.remark || '';

    // 商品档案自动匹配
    const matchResult = await matchSystemProduct(
      client, 
      supplierProductName, 
      supplierProductCode, 
      supplierProductSpec,
      supplierId
    );
    matchStats[matchResult.matchType === 'mapping' ? 'mapping' : matchResult.matchType === 'spec' ? 'spec' : matchResult.matchType === 'name' ? 'name' : 'none']++;

    const stockId = crypto.randomUUID();

    const stockData: Record<string, unknown> = {
      id: stockId,
      supplier_id: supplierId,
      supplier_name: matchedSupplierName,
      product_name: supplierProductName,
      product_code: supplierProductCode,
      supplier_product_spec: supplierProductSpec,
      system_product_id: matchResult.productId,
      system_product_name: matchResult.productName,
      system_product_code: matchResult.productCode,
      system_product_spec: matchResult.productSpec,
      quantity,
      price,
      warehouse,
      remark,
      match_type: matchResult.matchType,
      match_hint: matchResult.matchHint,
      matched_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 检查是否已存在
    let existingStockId: string | null = null;
    if (supplierProductSpec) {
      const { data: existing } = await client
        .from('stocks')
        .select('id, quantity')
        .eq('supplier_id', supplierId)
        .eq('supplier_product_spec', supplierProductSpec)
        .maybeSingle();
      existingStockId = existing?.id || null;
    }

    if (!existingStockId && supplierProductCode) {
      const { data: existing } = await client
        .from('stocks')
        .select('id, quantity')
        .eq('supplier_id', supplierId)
        .eq('product_code', supplierProductCode)
        .maybeSingle();
      existingStockId = existing?.id || null;
    }

    if (existingStockId) {
      stocksToUpdate.push({ id: existingStockId, ...stockData });
    } else {
      stocksToInsert.push(stockData);
    }
  }

  // 执行数据库操作
  let inserted = 0;
  let updated = 0;
  let insertError: string | null = null;
  let updateError: string | null = null;

  if (stocksToInsert.length > 0) {
    const { error } = await client.from('stocks').insert(stocksToInsert);
    if (error) {
      insertError = error.message;
    } else {
      inserted = stocksToInsert.length;
    }
  }

  if (stocksToUpdate.length > 0) {
    for (const stock of stocksToUpdate) {
      const { error } = await client
        .from('stocks')
        .update({
          quantity: stock.quantity,
          price: stock.price,
          warehouse: stock.warehouse,
          remark: stock.remark,
          system_product_id: stock.system_product_id,
          system_product_name: stock.system_product_name,
          system_product_code: stock.system_product_code,
          system_product_spec: stock.system_product_spec,
          match_type: stock.match_type,
          match_hint: stock.match_hint,
          matched_at: stock.matched_at,
          updated_at: stock.updated_at,
        })
        .eq('id', stock.id);
      
      if (error) {
        updateError = error.message;
      } else {
        updated++;
      }
    }
  }

  return {
    inserted,
    updated,
    matchStats,
    supplierNotFound,
    errors: [insertError, updateError].filter(Boolean),
  };
}

// 供应商库存导入 API
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();

  try {
    const contentType = request.headers.get('content-type') || '';
    let items: Record<string, string>[] = [];

    // 判断是文件上传还是JSON数组
    if (contentType.includes('multipart/form-data')) {
      // 文件上传模式
      const formData = await request.formData();
      const file = formData.get('file') as File;

      if (!file) {
        return NextResponse.json({ success: false, error: '请上传文件' }, { status: 400 });
      }

      const rawData = await parseExcelFile(file);
      items = normalizeData(rawData);

      if (items.length === 0) {
        return NextResponse.json({ success: false, error: 'Excel 文件数据为空或格式不正确' }, { status: 400 });
      }
    } else {
      // JSON数组模式
      const body = await request.json();
      items = normalizeData(body.data || []);

      if (items.length === 0) {
        return NextResponse.json({ success: false, error: '没有有效的导入数据' }, { status: 400 });
      }
    }

    const result = await processStockImport(client, items);

    const totalProcessed = result.inserted + result.updated;
    const matchRate = totalProcessed > 0 
      ? ((totalProcessed - result.matchStats.none) / totalProcessed * 100).toFixed(1) + '%' 
      : '0%';

    const response: Record<string, unknown> = {
      success: true,
      data: {
        inserted: result.inserted,
        updated: result.updated,
        total: totalProcessed,
      },
      matchStats: {
        total: totalProcessed,
        bySpec: result.matchStats.spec,
        byName: result.matchStats.name,
        byMapping: result.matchStats.mapping,
        none: result.matchStats.none,
        matched: totalProcessed - result.matchStats.none,
        matchRate,
      },
      errors: result.errors,
      message: `成功导入 ${totalProcessed} 条，其中新增 ${result.inserted} 条，更新 ${result.updated} 条，${totalProcessed - result.matchStats.none} 条已匹配商品档案`,
    };

    if (result.supplierNotFound.length > 0) {
      response.supplierNotFound = result.supplierNotFound;
      response.message += `；注意：有 ${result.supplierNotFound.length} 个供应商未匹配到系统档案`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('供应商库存导入失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '导入失败' 
    }, { status: 500 });
  }
}
