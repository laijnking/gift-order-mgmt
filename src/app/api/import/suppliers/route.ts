import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.SUPPLIERS_CREATE);
  if (authError) return authError;

  try {
    const { data } = await request.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ success: false, error: '无效的数据格式' }, { status: 400 });
    }

    const client = getSupabaseClient();
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of data) {
      try {
        const name = item.name || item['发货方名称'] || item['名称'] || '';
        
        if (!name) {
          errors.push(`第 ${imported + skipped + 1} 行：缺少名称`);
          skipped++;
          continue;
        }

        // 类型映射
        const typeMap: Record<string, string> = {
          '供应商': 'supplier', 'supplier': 'supplier',
          '京东': 'jd', 'jd': 'jd',
          '拼多多': 'pdd', 'pdd': 'pdd',
          '自有仓': 'self', 'self': 'self',
          '第三方仓': 'third_party', 'third_party': 'third_party'
        };
        
        // 发货方式映射
        const sendTypeMap: Record<string, string> = {
          '下载发货': 'download', 'download': 'download',
          '京东发货': 'jd', 'jd': 'jd',
          '拼多多发货': 'pdd', 'pdd': 'pdd',
          '自有发货': 'self', 'self': 'self'
        };
        
        // 结算方式映射
        const settlementMap: Record<string, string> = {
          '月结预付': 'prepaid', 'prepaid': 'prepaid',
          '月结': 'monthly', 'monthly': 'monthly',
          '单结': 'per_order', 'per_order': 'per_order'
        };

        const typeValue = (item.type || item['类型'] || '供应商').toString();
        const sendTypeValue = (item.sendType || item['发货方式'] || '下载发货').toString();
        const settlementValue = (item.settlementType || item['结算方式'] || '月结').toString();

        const shipperData: Record<string, unknown> = {
          code: item.code || item['发货方编码'] || `SP${Date.now()}${imported + skipped}`,
          name: name,
        };

        if (item.shortName || item['简称']) shipperData.short_name = item.shortName || item['简称'];
        if (item.type || item['类型']) shipperData.type = typeMap[typeValue] || 'supplier';
        if (item.contactPerson || item['联系人'] || item.contact) shipperData.contact_person = item.contactPerson || item['联系人'] || item.contact;
        if (item.contactPhone || item['联系电话'] || item.phone) shipperData.contact_phone = item.contactPhone || item['联系电话'] || item.phone;
        if (item.province || item['所在省份']) shipperData.province = item.province || item['所在省份'];
        if (item.city || item['所在城市']) shipperData.city = item.city || item['所在城市'];
        if (item.address || item['详细地址']) shipperData.address = item.address || item['详细地址'];
        if (item.sendType || item['发货方式']) shipperData.send_type = sendTypeMap[sendTypeValue] || 'download';
        if (item.jdChannelId || item['京东渠道ID']) shipperData.jd_channel_id = item.jdChannelId || item['京东渠道ID'];
        if (item.pddShopId || item['拼多多店铺ID']) shipperData.pdd_shop_id = item.pddShopId || item['拼多多店铺ID'];
        if (item.canJd || item['支持京东']) shipperData.can_jd = (item.canJd || item['支持京东'] || '否') === '是';
        if (item.canPdd || item['支持拼多多']) shipperData.can_pdd = (item.canPdd || item['支持拼多多'] || '否') === '是';
        if (item.expressRestrictions || item['快递限制']) shipperData.express_restrictions = (item.expressRestrictions || item['快递限制'] || '').toString().split(/[,，]/).filter(Boolean);
        if (item.settlementType || item['结算方式']) shipperData.settlement_type = settlementMap[settlementValue] || 'monthly';
        if (item.costFactor || item['成本系数']) shipperData.cost_factor = parseFloat(item.costFactor || item['成本系数'] || '1') || 1.0;
        if (item.remark || item['备注']) shipperData.remark = item.remark || item['备注'];
        shipperData.is_active = true;

        const { error } = await client
          .from('shippers')
          .insert(shipperData);

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
    console.error('发货方导入错误:', error);
    return NextResponse.json({ success: false, error: '导入失败' }, { status: 500 });
  }
}
