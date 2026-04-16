import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 获取预警规则列表
export async function GET(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isEnabled = searchParams.get('isEnabled');

    let query = client
      .from('alert_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (type) {
      query = query.eq('type', type);
    }
    if (isEnabled !== null) {
      query = query.eq('is_enabled', isEnabled === 'true');
    }

    const { data, error } = await query;

    if (error) throw new Error(`查询预警规则失败: ${error.message}`);

    const rules = (data || []).map(r => ({
      id: r.id,
      name: r.name,
      code: r.code,
      type: r.type,
      config: r.config,
      priority: r.priority,
      isEnabled: r.is_enabled,
      notificationChannels: r.notification_channels,
      description: r.description,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: rules,
      total: rules.length
    });

  } catch (error) {
    console.error('查询预警规则失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 创建预警规则
export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { name, code, type, config, priority, isEnabled, notificationChannels, description } = body;

    if (!name || !code || !type) {
      return NextResponse.json({ 
        success: false, 
        error: '缺少必要参数' 
      }, { status: 400 });
    }

    const ruleData = {
      name,
      code,
      type,
      config: config || {},
      priority: priority || 0,
      is_enabled: isEnabled ?? true,
      notification_channels: notificationChannels || ['system'],
      description: description || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await client
      .from('alert_rules')
      .insert(ruleData)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ 
          success: false, 
          error: '规则编码已存在' 
        }, { status: 400 });
      }
      throw new Error(`创建预警规则失败: ${error.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: '预警规则创建成功'
    });

  } catch (error) {
    console.error('创建预警规则失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}

// 批量更新预警规则状态
export async function PATCH(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { ids, isEnabled } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '请选择要更新的规则' 
      }, { status: 400 });
    }

    const { error } = await client
      .from('alert_rules')
      .update({ 
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })
      .in('id', ids);

    if (error) throw new Error(`更新预警规则失败: ${error.message}`);

    return NextResponse.json({
      success: true,
      message: `已更新 ${ids.length} 条规则`
    });

  } catch (error) {
    console.error('更新预警规则失败:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    }, { status: 500 });
  }
}
