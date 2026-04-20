import { createHash } from 'crypto';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export function normalizeHeaders(headers: string[]) {
  return headers.map((header) => header.trim()).filter(Boolean);
}

export function buildHeaderFingerprint(headers: string[]) {
  return createHash('sha256')
    .update(JSON.stringify(normalizeHeaders(headers)))
    .digest('hex')
    .slice(0, 16);
}

export function buildTemplateSignature(
  mappingConfig: Record<string, string>,
  headerRow: number,
  headers: string[]
) {
  const normalizedMapping = Object.entries(mappingConfig)
    .filter(([, targetField]) => Boolean(targetField) && targetField !== 'ignore')
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey));

  return createHash('sha256')
    .update(JSON.stringify({
      headerFingerprint: buildHeaderFingerprint(headers),
      headerRow,
      mapping: normalizedMapping,
    }))
    .digest('hex')
    .slice(0, 24);
}

export async function supportsColumnMappingMetadata(client: ReturnType<typeof getSupabaseClient>) {
  const { error } = await client
    .from('column_mappings')
    .select('id, source_headers, header_fingerprint, template_signature')
    .limit(1);

  return !error;
}
