import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  buildHeaderFingerprint,
  buildTemplateSignature,
  normalizeHeaders,
  supportsColumnMappingMetadata,
} from '@/lib/column-mapping-metadata';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

const REQUIRED_MAPPING_FIELDS = [
  'product_name',
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
  const authError = requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const customerCode = searchParams.get('customerCode');

  try {
    if (!customerCode) {
      return NextResponse.json({ success: false, error: '缺少customerCode参数' }, { status: 400 });
    }

    const { data, error } = await client
      .from('column_mappings')
      .select('*')
      .eq('customer_code', customerCode)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();

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
  const authError = requirePermission(request, PERMISSIONS.ORDERS_CREATE);
  if (authError) return authError;
  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerCode, mappingConfig, headerRow, remark, createdBy, sourceHeaders } = body;

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

    // 获取当前最新版本号
    const { data: existing } = await client
      .from('column_mappings')
      .select('version')
      .eq('customer_code', customerCode)
      .eq('is_active', true)
      .single();

    const newVersion = (existing?.version || 0) + 1;

    // 先将旧的配置标记为非活跃
    await client
      .from('column_mappings')
      .update({ is_active: false })
      .eq('customer_code', customerCode)
      .eq('is_active', true);

    const insertPayload: Record<string, unknown> = {
      customer_code: customerCode,
      mapping_config: mappingConfig,
      header_row: headerRow ?? 0,
      version: newVersion,
      is_active: true,
      remark: remark || null,
      created_by: createdBy || null,
    };

    if (await supportsColumnMappingMetadata(client)) {
      insertPayload.source_headers = normalizedHeaders;
      insertPayload.header_fingerprint = buildHeaderFingerprint(normalizedHeaders);
      insertPayload.template_signature = buildTemplateSignature(
        mappingConfig,
        headerRow ?? 0,
        normalizedHeaders
      );
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
