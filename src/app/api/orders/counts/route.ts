import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { isManagementRole } from '@/lib/roles';
import { extractName, getUserRealNameByUsername } from '@/lib/order-service';
import { PERMISSIONS } from '@/lib/permissions';

// 获取订单状态统计（用于快捷筛选数量）
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_VIEW);
  if (authError) return authError;
  const client = getSupabaseClient();
  const { searchParams } = new URL(request.url);
  const createdFrom = searchParams.get('createdFrom');
  const createdTo = searchParams.get('createdTo');
  const customerCode = searchParams.get('customerCode');
  const supplierId = searchParams.get('supplierId');
  const search = searchParams.get('search');
  const importBatch = searchParams.get('importBatch');
  const currentUser = getCurrentUser(request);

  try {
    const statuses = ['pending', 'assigned', 'notified', 'partial_returned', 'returned', 'feedbacked', 'completed', 'cancelled'];

    // Count total (with data scope filter)
    const totalQ = client.from('orders').select('id', { count: 'exact', head: true });
    if (currentUser && currentUser.dataScope === 'self' && !isManagementRole(currentUser.role)) {
      const realName = await getUserRealNameByUsername(client, currentUser.username);
      if (!realName) return NextResponse.json({ success: true, total: 0, counts: {} });
      const pureName = extractName(realName);
      const { data: userCustomers } = await client.from('customers').select('code')
        .or(`salesperson_name.ilike.%${pureName}%,order_taker_name.ilike.%${pureName}%`);
      const customerCodes = userCustomers?.map(c => c.code) || [];
      if (customerCodes.length === 0) return NextResponse.json({ success: true, total: 0, counts: {} });
      totalQ.in('customer_code', customerCodes);
    }
    if (customerCode) totalQ.eq('customer_code', customerCode);
    if (supplierId) totalQ.eq('supplier_id', supplierId);
    if (importBatch) totalQ.eq('import_batch', importBatch);
    if (search) totalQ.or(`order_no.ilike.%${search}%,sys_order_no.ilike.%${search}%,receiver_name.ilike.%${search}%,receiver_phone.ilike.%${search}%`);
    if (createdFrom) totalQ.gte('created_at', createdFrom);
    if (createdTo) totalQ.lte('created_at', createdTo);
    const { count: total } = await totalQ;

    // Count per status in parallel
    const counts: Record<string, number> = {};
    await Promise.all(statuses.map(async (status) => {
      let q = client.from('orders').select('id', { count: 'exact', head: true });
      if (currentUser && currentUser.dataScope === 'self' && !isManagementRole(currentUser.role)) {
        const realName = await getUserRealNameByUsername(client, currentUser.username);
        if (!realName) { counts[status] = 0; return; }
        const pureName = extractName(realName);
        const { data: userCustomers } = await client.from('customers').select('code')
          .or(`salesperson_name.ilike.%${pureName}%,order_taker_name.ilike.%${pureName}%`);
        const customerCodes = userCustomers?.map(c => c.code) || [];
        if (customerCodes.length === 0) { counts[status] = 0; return; }
        q = q.in('customer_code', customerCodes);
      }
      if (customerCode) q = q.eq('customer_code', customerCode);
      if (supplierId) q = q.eq('supplier_id', supplierId);
      if (importBatch) q = q.eq('import_batch', importBatch);
      if (search) q = q.or(`order_no.ilike.%${search}%,sys_order_no.ilike.%${search}%,receiver_name.ilike.%${search}%,receiver_phone.ilike.%${search}%`);
      if (createdFrom) q = q.gte('created_at', createdFrom);
      if (createdTo) q = q.lte('created_at', createdTo);
      q = q.eq('status', status);
      const { count } = await q;
      counts[status] = count ?? 0;
    }));

    return NextResponse.json({ success: true, total: total ?? 0, counts });
  } catch (error) {
    console.error('获取订单统计失败:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : '未知错误' }, { status: 500 });
  }
}

function getCurrentUser(request: NextRequest): { username: string; role: string; dataScope: string } | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => { const [k, ...v] = c.trim().split('='); return [k, v.join('=')]; })
  );
  const userCookie = cookies['user_info'];
  if (!userCookie) return null;
  try {
    return JSON.parse(decodeURIComponent(userCookie));
  } catch {
    return null;
  }
}

// getUserRealNameByUsername, extractName 已提取到 @/lib/order-service.ts

