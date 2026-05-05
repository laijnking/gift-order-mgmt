import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  buildHeaderFingerprint,
  buildTemplateSignature,
  normalizeHeaders,
  supportsColumnMappingMetadata,
} from '@/lib/column-mapping-rules';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

const REQUIRED_MAPPING_FIELDS = [
  'customer_product_name',
  'quantity',
  'receiver_name',
  'receiver_phone',
  'receiver_address',
];

function validateMappingConfig(mappingConfig: Record<string, string>) {
  const normalizedEntries = Object.entries(mappingConfig).filter(([, targetField]) => (
    Boolean(targetField) && targetField !== 'ignore' && targetField !== 'ext_keep'
  ));

  const duplicateFields = normalizedEntries.reduce<string[]>((duplicates, [, targetField], index, entries) => {
    if (targetField.startsWith('ext_field_')) {
      return duplicates;
    }

    const firstIndex = entries.findIndex(([, field]) => field === targetField);
    if (firstIndex !== index && !duplicates.includes(targetField)) {
      duplicates.push(targetField);
    }

    return duplicates;
  }, []);

  const assignedFields = new Set(normalizedEntries.map(([, targetField]) => targetField));
  const missingFields = REQUIRED_MAPPING_FIELDS.filter((field) => !assignedFields.has(field));

  return {
    duplicateFields,
    missingFields,
  };
}

// 获取客户当前生效的字段映射配置
export async function GET(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const customerCode = searchParams.get('customerCode');

  try {
    if (!customerCode) {
      return NextResponse.json({ success: false, error: '缺少customerCode参数' }, { status: 400 });
    }

    // 先解析 customer_id，优先使用 customer_id 查询
    const { data: customer } = await client
      .from('customers')
      .select('id')
      .eq('code', customerCode)
      .maybeSingle();

    let query = client
      .from('column_mappings')
      .select('*')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1);

    if (customer?.id) {
      query = query.eq('customer_id', customer.id);
    } else {
      query = query.eq('customer_code', customerCode);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw new Error(`查询字段映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: data || null
    });
  } catch (error) {
    console.error('获取字段映射失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 保存客户字段映射配置
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerCode, mappingConfig, headerRow, remark, createdBy, sourceHeaders, feedbackExportHeaderOverrides } = body;

    if (!customerCode || !mappingConfig) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 });
    }

    const { duplicateFields, missingFields } = validateMappingConfig(mappingConfig);

    if (duplicateFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `存在重复映射字段: ${duplicateFields.join('、')}`
      }, { status: 400 });
    }

    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: `缺少必填映射字段: ${missingFields.join('、')}`
      }, { status: 400 });
    }

    const normalizedHeaders = Array.isArray(sourceHeaders)
      ? normalizeHeaders(sourceHeaders.map((header) => String(header ?? '')))
      : [];

    // 构建反馈导出列名映射：{ "客户列名": "系统字段名" }
    // 基础映射：从 columnMapping 的列索引反推出客户原始列名
    const feedbackExportHeaders: Record<string, string> = {};
    Object.entries(mappingConfig as Record<string, string>).forEach(([colIndex, fieldName]) => {
      const colIdx = parseInt(colIndex);
      const header = normalizedHeaders[colIdx];
      if (header && fieldName && fieldName !== 'ignore' && fieldName !== 'ext_keep') {
        feedbackExportHeaders[header] = fieldName;
      }
    });

    // 用户可额外指定导出列名覆盖（如"货号"映射到 productCode，导出时希望列名叫"商品编码"）
    if (feedbackExportHeaderOverrides && typeof feedbackExportHeaderOverrides === 'object') {
      for (const [key, value] of Object.entries(feedbackExportHeaderOverrides)) {
        if (typeof value === 'string') {
          feedbackExportHeaders[key] = value;
        }
      }
    }

    // 解析 customer_id（优先使用 ID 查询）
    const { data: customer } = await client
      .from('customers')
      .select('id')
      .eq('code', customerCode)
      .maybeSingle();
    const customerId = customer?.id || null;

    // 获取当前最新版本号（优先 customer_id，fallback customer_code）
    let existingQuery = client
      .from('column_mappings')
      .select('version')
      .eq('is_active', true);

    if (customerId) {
      existingQuery = existingQuery.eq('customer_id', customerId);
    } else {
      existingQuery = existingQuery.eq('customer_code', customerCode);
    }
    const { data: existing } = await existingQuery.single();

    const newVersion = (existing?.version || 0) + 1;

    // 先将旧的配置标记为非活跃（优先 customer_id）
    let deactivateQuery = client
      .from('column_mappings')
      .update({ is_active: false })
      .eq('is_active', true);

    if (customerId) {
      deactivateQuery = deactivateQuery.eq('customer_id', customerId);
    } else {
      deactivateQuery = deactivateQuery.eq('customer_code', customerCode);
    }
    await deactivateQuery;

    const insertPayload: Record<string, unknown> = {
      customer_id: customerId,
      customer_code: customerCode,
      mapping_config: mappingConfig,
      header_row: headerRow ?? 0,
      version: newVersion,
      is_active: true,
      remark: remark || null,
      created_by: createdBy || null,
    };

    if (await supportsColumnMappingMetadata(client)) {
      insertPayload.source_headers = JSON.stringify(normalizedHeaders);
      insertPayload.header_fingerprint = buildHeaderFingerprint(normalizedHeaders);
      insertPayload.template_signature = buildTemplateSignature(
        mappingConfig,
        headerRow ?? 0,
        normalizedHeaders
      );
      insertPayload.feedback_export_headers = feedbackExportHeaders;
    }

    // 插入新配置
    const { data, error } = await client
      .from('column_mappings')
      .insert(insertPayload)
      .select()
      .single();

    if (error) throw new Error(`保存字段映射失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data,
      message: `成功保存字段映射配置，版本号：${newVersion}`
    });
  } catch (error) {
    console.error('保存字段映射失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
