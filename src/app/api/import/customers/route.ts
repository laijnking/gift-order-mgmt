import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/server-auth';

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

// 英文字段名到数据库字段的映射
const FIELD_MAPPING: Record<string, string> = {
  code: 'code',
  name: 'name',
  contactPerson: 'contact_person',
  contactPhone: 'contact_phone',
  contactEmail: 'contact_email',
  province: 'province',
  city: 'city',
  district: 'district',
  address: 'address',
  salespersonName: 'sales_user_name',
  orderTakerName: 'operator_user_name',
  paymentStatus: 'payment_status',
  creditLimit: 'credit_limit',
  paymentDays: 'payment_days',
  status: 'status',
  remark: 'remark',
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
  const authError = requirePermission(request, 'customers:create');
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
        // 获取标准化字段值
        const name = getFieldValue(item, 'name') as string;
        
        // 验证必需字段
        if (!name) {
          errors.push(`第 ${imported + skipped + 1} 行：缺少客户名称`);
          skipped++;
          continue;
        }

        // 构建客户数据
        const customerData: Record<string, unknown> = {
          code: getFieldValue(item, 'code') || `C${Date.now()}${imported + skipped}`,
          name: name,
        };
        
        const contactPerson = getFieldValue(item, 'contactPerson');
        if (contactPerson) customerData.contact_person = contactPerson;
        
        const contactPhone = getFieldValue(item, 'contactPhone');
        if (contactPhone) customerData.contact_phone = contactPhone;
        
        const contactEmail = getFieldValue(item, 'contactEmail');
        if (contactEmail) customerData.contact_email = contactEmail;
        
        const province = getFieldValue(item, 'province');
        if (province) customerData.province = province;
        
        const city = getFieldValue(item, 'city');
        if (city) customerData.city = city;
        
        const district = getFieldValue(item, 'district');
        if (district) customerData.district = district;
        
        const address = getFieldValue(item, 'address');
        if (address) customerData.address = address;
        
        const salespersonName = getFieldValue(item, 'salespersonName');
        if (salespersonName) customerData.sales_user_name = salespersonName;
        
        const orderTakerName = getFieldValue(item, 'orderTakerName');
        if (orderTakerName) customerData.operator_user_name = orderTakerName;
        
        const paymentStatus = getFieldValue(item, 'paymentStatus');
        if (paymentStatus) customerData.payment_status = paymentStatus;
        
        const creditLimit = getFieldValue(item, 'creditLimit');
        if (creditLimit) customerData.credit_limit = parseFloat(String(creditLimit)) || 0;
        
        const paymentDays = getFieldValue(item, 'paymentDays');
        if (paymentDays) customerData.payment_days = parseInt(String(paymentDays)) || 0;
        
        const remark = getFieldValue(item, 'remark');
        if (remark) customerData.remark = remark;
        
        customerData.is_active = true;

        const { error } = await supabase
          .from('customers')
          .insert(customerData);

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
    console.error('Customer import error:', error);
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
