import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

// 获取预警记录列表
export async function GET(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_VIEW);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const ruleCode = searchParams.get('ruleCode');
    const alertType = searchParams.get('alertType');
    const alertLevel = searchParams.get('alertLevel');
    const isRead = searchParams.get('isRead');
    const isResolved = searchParams.get('isResolved');
    const orderId = searchParams.get('orderId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = client
      .from('alert_records')
      .select('*, alert_rules(name, code)')
      .order('created_at', { ascending: false });

    if (ruleCode) {
      query = query.eq('rule_code', ruleCode);
    }
    if (alertType) {
      query = query.eq('alert_type', alertType);
    }
    if (alertLevel) {
      query = query.eq('alert_level', alertLevel);
    }
    if (isRead !== null) {
      query = query.eq('is_read', isRead === 'true');
    }
    if (isResolved !== null) {
      query = query.eq('is_resolved', isResolved === 'true');
    }
    if (orderId) {
      query = query.eq('order_id', orderId);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    query = query.limit(limit);

    const { data, error } = await query;

    if (error) throw new Error(`查询预警记录失败: ${error.message}`);

    // 获取统计数据
    const { data: statsData } = await client
      .from('alert_records')
      .select('alert_level, is_read', { count: 'exact' });

    const unreadCount = statsData?.filter(r => !r.is_read).length || 0;
    const warningCount = statsData?.filter(r => r.alert_level === 'warning' && !r.is_read).length || 0;
    const criticalCount = statsData?.filter(r => r.alert_level === 'critical' && !r.is_read).length || 0;

    const records = (data || []).map(r => ({
      id: r.id,
      ruleId: r.rule_id,
      ruleCode: r.rule_code,
      ruleName: r.alert_rules?.name || r.rule_code,
      orderId: r.order_id,
      orderNo: r.order_no,
      customerCode: r.customer_code,
      productCode: r.product_code,
      supplierId: r.supplier_id,
      supplierName: r.supplier_name,
      alertType: r.alert_type,
      alertLevel: r.alert_level,
      title: r.title,
      content: r.content,
      data: r.data,
      isRead: r.is_read,
      isResolved: r.is_resolved,
      resolvedAt: r.resolved_at,
      resolvedBy: r.resolved_by,
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: records,
      stats: {
        total: records.length,
        unread: unreadCount,
        warning: warningCount,
        critical: criticalCount
      },
      total: records.length
    });

  } catch (error) {
    console.error('查询预警记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建预警记录
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { 
      ruleId,
      ruleCode,
      orderId,
      orderNo,
      customerCode,
      productCode,
      supplierId,
      supplierName,
      alertType,
      alertLevel,
      title,
      content,
      data
    } = body;

    if (!ruleCode || !title) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    const recordData = {
      rule_id: ruleId || null,
      rule_code: ruleCode,
      order_id: orderId || null,
      order_no: orderNo || '',
      customer_code: customerCode || '',
      product_code: productCode || '',
      supplier_id: supplierId || null,
      supplier_name: supplierName || '',
      alert_type: alertType || 'system',
      alert_level: alertLevel || 'info',
      title,
      content: content || '',
      data: data || {},
      is_read: false,
      is_resolved: false,
      created_at: new Date().toISOString()
    };

    const { data: record, error } = await client
      .from('alert_records')
      .insert(recordData)
      .select()
      .single();

    if (error) throw new Error(`创建预警记录失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      data: record,
      message: '预警记录已创建'
    });

  } catch (error) {
    console.error('创建预警记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 批量标记已读
export async function PATCH(request: NextRequest) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EDIT);
  if (authError) return authError;
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { ids, isRead, isResolved, resolvedBy } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择要更新的记录' 
      }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (isRead !== undefined) {
      updateData.is_read = isRead;
    }
    if (isResolved !== undefined) {
      updateData.is_resolved = isResolved;
      if (isResolved) {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = resolvedBy || 'system';
      }
    }

    const { error } = await client
      .from('alert_records')
      .update(updateData)
      .in('id', ids);

    if (error) throw new Error(`更新预警记录失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: `已更新 ${ids.length} 条记录`
    });

  } catch (error) {
    console.error('更新预警记录失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
