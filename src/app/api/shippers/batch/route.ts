import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';
import { detectDuplicates, ENTITY_DEDUP_KEYS } from '@/lib/import-dedup';

export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.SUPPLIERS_CREATE);
  if (authError) return authError;

  try {
    const { shippers } = await request.json();
    
    if (!shippers || !Array.isArray(shippers) || shippers.length === 0) {
      return NextResponse.json({ success: false, error: '无效的发货方数据' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    // 转换前端 camelCase -> 数据库 snake_case
    const toDb = (row: Record<string, unknown>) => {
      const db: Record<string, unknown> = {};
      const map: Record<string, string> = {
        code: 'code', name: 'name', shortName: 'short_name',
        type: 'type', contactPerson: 'contact_person', contactPhone: 'contact_phone',
        province: 'province', city: 'city', address: 'address',
        sendType: 'send_type', jdChannelId: 'jd_channel_id', pddShopId: 'pdd_shop_id',
        canJd: 'can_jd', canPdd: 'can_pdd',
        expressRestrictions: 'express_restrictions',
        settlementType: 'settlement_type', costFactor: 'cost_factor',
        isActive: 'is_active', remark: 'remark',
      };
      for (const [k, dbKey] of Object.entries(map)) {
        if (k in row) db[dbKey] = row[k];
      }
      if ('expressRestrictions' in row) {
        const v = row.expressRestrictions;
        db.express_restrictions = Array.isArray(v) ? JSON.stringify(v) : v;
      }
      return db;
    };

    // 去重检测
    const normalizedRows = shippers.map((s: Record<string, unknown>) => ({
      code: s.code as string | undefined,
      name: s.name as string | undefined,
    }));

    const dedupResult = await detectDuplicates({
      client: supabase,
      table: 'shippers',
      keys: ENTITY_DEDUP_KEYS.shippers,
      rows: normalizedRows,
      dataStartRow: 1,
    });

    const duplicateRowSet = new Set(dedupResult.duplicates.map((d) => d.row));
    const uniqueShippers = shippers.filter(
      (_: Record<string, unknown>, idx: number) => !duplicateRowSet.has(idx + 1)
    );

    if (uniqueShippers.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        imported: 0,
        skipped: dedupResult.duplicates.length,
        duplicates: dedupResult.duplicates,
      });
    }

    // 批量插入发货方数据
    const { data, error } = await supabase
      .from('shippers')
      .insert(uniqueShippers.map(toDb))
      .select();

    if (error) {
      console.error('批量导入发货方失败:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
      count: data?.length || 0,
      imported: data?.length || 0,
      skipped: dedupResult.duplicates.length,
      duplicates: dedupResult.duplicates,
    });
  } catch (error) {
    console.error('批量导入发货方失败:', error);
    return NextResponse.json({ success: false, error: '批量导入失败' }, { status: 500 });
  }
}
