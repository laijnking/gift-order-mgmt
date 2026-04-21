import type { SupabaseClient } from '@supabase/supabase-js';

export type TemplateBusinessType = 'shipping' | 'customer_feedback' | 'common';
export type TemplateTargetType = 'customer' | 'supplier';

/** DB row shape — mirrors templates table (snake_case, nullable columns) */
export type TemplateRecord = {
  id: string;
  code: string | null;
  name: string | null;
  description: string | null;
  type: string | null;
  config: Record<string, unknown> | null;
  is_default: boolean | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  // non-standard columns (exist in DB)
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  field_mappings: Record<string, string> | string | null;
};

export function normalizeTemplateType(type?: string | null): TemplateBusinessType {
  switch ((type || '').trim().toLowerCase()) {
    case 'supplier':
    case 'dispatch':
    case 'shipping':
      return 'shipping';
    case 'customer':
    case 'feedback':
    case 'customer_feedback':
      return 'customer_feedback';
    default:
      return 'common';
  }
}

export function parseTemplateFieldMappings(record: TemplateRecord) {
  if (typeof record.field_mappings === 'string') {
    try {
      return JSON.parse(record.field_mappings) as Record<string, string>;
    } catch {
      return {};
    }
  }

  if (record.field_mappings && typeof record.field_mappings === 'object') {
    return record.field_mappings;
  }

  const config = record.config || {};
  const configMappings = config.fieldMappings;
  if (configMappings && typeof configMappings === 'object') {
    return configMappings as Record<string, string>;
  }

  return {};
}

export function transformTemplateRecord(record: TemplateRecord) {
  return {
    id: record.id,
    code: record.code || '',
    name: record.name || '',
    description: record.description || '',
    type: normalizeTemplateType(record.type),
    targetType: record.target_type || '',
    targetId: record.target_id || '',
    targetName: record.target_name || '',
    fieldMappings: parseTemplateFieldMappings(record),
    config: record.config || {},
    isDefault: record.is_default ?? false,
    isActive: record.is_active ?? true,
    createdAt: record.created_at || '',
    updatedAt: record.updated_at || '',
  };
}

export async function syncTemplateTargetLink(
  client: SupabaseClient,
  options: {
    templateId: string;
    targetType?: string | null;
    targetId?: string | null;
    targetName?: string | null;
  }
) {
  await client.from('template_links').delete().eq('template_id', options.templateId);

  if (!options.targetType || !options.targetId) {
    return;
  }

  await client.from('template_links').insert({
    template_id: options.templateId,
    link_type: options.targetType,
    partner_id: options.targetId,
    partner_name: options.targetName || null,
  });
}

export async function resolvePreferredTemplate(
  client: SupabaseClient,
  options: {
    type: string;
    targetType?: string | null;
    targetId?: string | null;
  }
) {
  const normalizedType = normalizeTemplateType(options.type);
  const targetType = options.targetType || null;
  const targetId = options.targetId || null;

  if (targetType && targetId) {
    const { data: directTargetTemplate } = await client
      .from('templates')
      .select('*')
      .eq('type', normalizedType)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (directTargetTemplate) {
      return {
        template: directTargetTemplate as TemplateRecord,
        source: 'target',
      };
    }

    const { data: links } = await client
      .from('template_links')
      .select('template_id')
      .eq('link_type', targetType)
      .eq('partner_id', targetId);

    const templateIds = links?.map((link) => link.template_id).filter(Boolean) || [];
    if (templateIds.length > 0) {
      const { data: linkedTemplate } = await client
        .from('templates')
        .select('*')
        .in('id', templateIds)
        .eq('type', normalizedType)
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (linkedTemplate) {
        return {
          template: linkedTemplate as TemplateRecord,
          source: 'linked',
        };
      }
    }
  }

  const { data: defaultTemplate } = await client
    .from('templates')
    .select('*')
    .eq('type', normalizedType)
    .eq('is_default', true)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (defaultTemplate) {
    return {
      template: defaultTemplate as TemplateRecord,
      source: 'default',
    };
  }

  const { data: firstTemplate } = await client
    .from('templates')
    .select('*')
    .eq('type', normalizedType)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    template: (firstTemplate as TemplateRecord | null) || null,
    source: 'first',
  };
}
