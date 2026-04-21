import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { buildCustomerMutationData, getCustomerSchemaMode } from '@/lib/customer-schema';

// 中文列名映射到字段名
const CHINESE_MAPPING: Record<string, string> = {
  '客户编码': 'code',
  '编码': 'code',
  '客户名称': 'name',
  '名称': 'name',
  '联系人': 'contactPerson',
  '联系人姓名': 'contactPerson',
  '联系电话': 'contactPhone',
  '手机': 'contactPhone',
  '电话': 'contactPhone',
  '电子邮箱': 'contactEmail',
  '邮箱': 'contactEmail',
  '省份': 'province',
  '城市': 'city',
  '区县': 'district',
  '详细地址': 'address',
  '地址': 'address',
  '联系地址': 'address',
  '业务员': 'salespersonName',
  '销售员': 'salespersonName',
  '跟单员': 'orderTakerName',
  '会计授信定额': 'creditLimit',
  '信用额度': 'creditLimit',
  '账期(天)': 'paymentDays',
  '账期天数': 'paymentDays',
  '账期': 'paymentDays',
  '结算状态': 'paymentStatus',
  '结算方式': 'paymentStatus',
  '状态': 'status',
  '备注': 'remark',
};

// 获取标准化字段值
function getFieldValue(item: Record<string, unknown>, fieldName: string): unknown {
  // 先检查英文字段名
  if (item[fieldName] !== undefined && item[fieldName] !== null && item[fieldName] !== '') {
    return item[fieldName];
  }
  
  // 再检查中文列名
  for (const [chineseName, mappedField] of Object.entries(CHINESE_MAPPING)) {
    if (mappedField === fieldName && item[chineseName] !== undefined && item[chineseName] !== null && item[chineseName] !== '') {
      return item[chineseName];
    }
  }
  
  return undefined;
}

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.CUSTOMERS_CREATE);
  if (authError) return authError;

  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: '数据格式无效' }, { status: 400 });
    }

    const supabase = getSupabaseClient();
    const schemaMode = await getCustomerSchemaMode(supabase);
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        // 获取标准化字段值
        const name = getFieldValue(item, 'name') as string;
        
        // 验证必需字段
        if (!name) {
          errors.push(`第 ${imported + skipped + 1} 行：缺少客户名称`);
          skipped++;
          continue;
        }

        // 构建客户数据
        const customerData = buildCustomerMutationData({
          code: String(getFieldValue(item, 'code') || `C${Date.now()}${imported + skipped}`),
          name,
          contactPerson: String(getFieldValue(item, 'contactPerson') || ''),
          contactPhone: String(getFieldValue(item, 'contactPhone') || ''),
          contactEmail: String(getFieldValue(item, 'contactEmail') || ''),
          province: String(getFieldValue(item, 'province') || ''),
          city: String(getFieldValue(item, 'city') || ''),
          district: String(getFieldValue(item, 'district') || ''),
          address: String(getFieldValue(item, 'address') || ''),
          salesUserName: String(getFieldValue(item, 'salespersonName') || ''),
          operatorUserName: String(getFieldValue(item, 'orderTakerName') || ''),
          paymentStatus: String(getFieldValue(item, 'paymentStatus') || 'normal'),
          creditLimit: parseFloat(String(getFieldValue(item, 'creditLimit') || 0)) || 0,
          paymentDays: parseInt(String(getFieldValue(item, 'paymentDays') || 0), 10) || 0,
          isActive: true,
          remark: String(getFieldValue(item, 'remark') || ''),
        }, schemaMode);

        const { error } = await supabase
          .from('customers')
          .insert(customerData);

        if (error) {
          errors.push(`第 ${imported + skipped + 1} 行：${error.message}`);
          skipped++;
        } else {
          imported++;
        }
      } catch {
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
    console.error('Customer import error:', error);
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
