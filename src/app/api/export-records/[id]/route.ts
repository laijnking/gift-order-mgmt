import { NextRequest, NextResponse } from 'next/server';
import { saveExportArtifact } from '@/lib/export-artifacts';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import JSZip from 'jszip';
import { requirePermission } from '@/lib/server-auth';

type ExportRecordMetadata = {
  details?: Array<Record<string, unknown>>;
  template_source?: string;
  shipped_order_count?: number;
  pending_receipt_count?: number;
  [key: string]: unknown;
};

function buildDetailDownloadPath(recordId: string, detailIndex: number) {
  return `/api/export-records/${recordId}/download?detailIndex=${detailIndex}`;
}

function getDetailIndex(
  details: Array<Record<string, unknown>>,
  key: 'supplierId' | 'customerId',
  expectedId?: string
) {
  if (!expectedId) {
    return 0;
  }

  const index = details.findIndex((detail) => detail[key] === expectedId);
  return index >= 0 ? index : 0;
}

function mergeDetail(
  existingDetails: Array<Record<string, unknown>>,
  incomingDetail: Record<string, unknown>,
  key: 'supplierId' | 'customerId',
  expectedId?: string
) {
  if (!expectedId) {
    return existingDetails;
  }

  let replaced = false;
  const merged = existingDetails.map((detail) => {
    if (detail[key] === expectedId) {
      replaced = true;
      return { ...detail, ...incomingDetail };
    }
    return detail;
  });

  return replaced ? merged : [...merged, incomingDetail];
}

async function extractDetailArtifactFromZip(
  recordId: string,
  zipBase64: string,
  detail: Record<string, unknown> | undefined
) {
  const fileName = typeof detail?.fileName === 'string' ? detail.fileName : null;
  if (!fileName) {
    return null;
  }

  const zipBuffer = Buffer.from(zipBase64, 'base64');
  const zip = await JSZip.loadAsync(zipBuffer);
  const entry = zip.file(fileName);
  if (!entry) {
    return null;
  }

  const content = await entry.async('nodebuffer');
  const artifact = await saveExportArtifact(recordId, fileName, content);

  return {
    fileName,
    fileUrl: artifact.downloadPath,
    artifact: {
      relative_path: artifact.relativePath,
      file_name: artifact.fileName,
      provider: artifact.provider,
    },
  };
}

async function enrichDetailsWithArtifactsFromZip(
  recordId: string,
  zipBase64: string,
  details: Array<Record<string, unknown>> | undefined
) {
  if (!Array.isArray(details) || details.length === 0) {
    return details || [];
  }

  const enrichedDetails = await Promise.all(
    details.map(async (detail, index) => {
      const persistedDetail = await extractDetailArtifactFromZip(recordId, zipBase64, detail);
      return persistedDetail
        ? {
            ...detail,
            ...persistedDetail,
            fileUrl: buildDetailDownloadPath(recordId, index),
          }
        : detail;
    })
  );

  return enrichedDetails;
}

// 获取导出记录详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'orders:export');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    // 获取导出记录
    const { data: record, error: recordError } = await client
      .from('export_records')
      .select('*')
      .eq('id', id)
      .single();

    if (recordError) throw new Error(`查询导出记录失败: ${recordError.message}`);

    // 获取批量导出详情
    let details = [];
    if (record.metadata?.details) {
      details = record.metadata.details;
    }

    // 获取供应商/客户信息
    let entityName = '';
    if (record.supplier_id) {
      const { data: supplier } = await client
        .from('suppliers')
        .select('name')
        .eq('id', record.supplier_id)
        .single();
      entityName = supplier?.name || '';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...record,
        entityName,
        details,
      },
    });
  } catch (error) {
    console.error('获取导出记录详情失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 重新生成并下载导出文件
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, 'orders:export');
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;

  try {
    let payload: {
      supplierId?: string;
      customerId?: string;
      templateId?: string | null;
    } = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }

    const { data: record, error: recordError } = await client
      .from('export_records')
      .select('*')
      .eq('id', id)
      .single();

    if (recordError) throw new Error(`查询导出记录失败: ${recordError.message}`);
    const metadata = (record.metadata || {}) as ExportRecordMetadata;
    const isDetailRegeneration = Boolean(payload.supplierId || payload.customerId);

    const origin = request.nextUrl.origin;

    if (record.export_type === 'shipping_notice') {
      const supplierIds = payload.supplierId
        ? [payload.supplierId]
        : record.supplier_id
          ? [record.supplier_id]
          : Array.isArray(record.metadata?.supplier_ids)
            ? record.metadata.supplier_ids
            : [];

      if (supplierIds.length === 0) {
        return NextResponse.json({ success: false, error: '导出记录缺少供应商信息，无法重新生成' }, { status: 400 });
      }

      const response = await fetch(`${origin}/api/shipping-exports/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierIds,
          templateId: payload.templateId ?? record.template_id ?? null,
          exportedBy: record.exported_by || 'system',
          dispatchMode: 'dispatch',
          persistenceMode: 'none',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.zipBase64 && data.data?.zipFileName) {
        const artifact = await saveExportArtifact(
          record.id,
          data.data.zipFileName,
          Buffer.from(data.data.zipBase64, 'base64')
        );
        const nextMetadata: ExportRecordMetadata = {
          ...metadata,
          download_mode: 'regenerate',
          last_regenerated_at: new Date().toISOString(),
          last_regenerated_file_name: payload.supplierId
            ? data.data?.details?.[0]?.fileName || data.data?.zipFileName || null
            : data.data?.zipFileName || null,
        };

        if (isDetailRegeneration && payload.supplierId && data.data?.details?.[0]) {
          const existingDetails = Array.isArray(metadata.details) ? metadata.details : [];
          const detailIndex = getDetailIndex(existingDetails, 'supplierId', payload.supplierId);
          const persistedDetail = await extractDetailArtifactFromZip(
            record.id,
            data.data.zipBase64,
            data.data.details[0] as Record<string, unknown>
          );
          nextMetadata.details = mergeDetail(
            existingDetails,
            {
              ...(data.data.details[0] as Record<string, unknown>),
              ...(persistedDetail || {}),
              fileUrl: buildDetailDownloadPath(record.id, detailIndex),
            },
            'supplierId',
            payload.supplierId
          );
        } else {
          nextMetadata.artifact = {
            relative_path: artifact.relativePath,
            file_name: artifact.fileName,
            provider: artifact.provider,
          };
          nextMetadata.template_source = data.data?.templateSource ?? metadata.template_source;
          nextMetadata.details = await enrichDetailsWithArtifactsFromZip(
            record.id,
            data.data.zipBase64,
            data.data?.details as Array<Record<string, unknown>> | undefined
          );
        }

        await client
          .from('export_records')
          .update({
            ...(isDetailRegeneration
              ? {}
              : {
                  file_url: artifact.downloadPath,
                  file_name: data.data?.zipFileName || record.file_name,
                  zip_file_url: artifact.downloadPath,
                  zip_file_name: data.data?.zipFileName || record.zip_file_name || record.file_name,
                  template_id: data.data?.templateId ?? record.template_id ?? null,
                  template_name: data.data?.templateName || record.template_name,
                  total_count: data.data?.totalOrderCount ?? record.total_count,
                }),
            metadata: nextMetadata,
          })
          .eq('id', record.id);
      }

      return NextResponse.json(data, { status: response.status });
    }

    if (record.export_type === 'customer_feedback') {
      const customerIds = payload.customerId
        ? [payload.customerId]
        : record.customer_id
          ? [record.customer_id]
          : Array.isArray(record.metadata?.customer_ids)
            ? record.metadata.customer_ids
            : [];

      if (customerIds.length === 0) {
        return NextResponse.json({ success: false, error: '导出记录缺少客户信息，无法重新生成' }, { status: 400 });
      }

      const response = await fetch(`${origin}/api/export-feedback/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerIds,
          templateId: payload.templateId ?? record.template_id ?? null,
          exportedBy: record.exported_by || 'system',
          persistenceMode: 'none',
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data?.zipBase64 && data.data?.zipFileName) {
        const artifact = await saveExportArtifact(
          record.id,
          data.data.zipFileName,
          Buffer.from(data.data.zipBase64, 'base64')
        );
        const nextMetadata: ExportRecordMetadata = {
          ...metadata,
          download_mode: 'regenerate',
          last_regenerated_at: new Date().toISOString(),
          last_regenerated_file_name: payload.customerId
            ? data.data?.details?.[0]?.fileName || data.data?.zipFileName || null
            : data.data?.zipFileName || null,
        };

        if (isDetailRegeneration && payload.customerId && data.data?.details?.[0]) {
          const existingDetails = Array.isArray(metadata.details) ? metadata.details : [];
          const detailIndex = getDetailIndex(existingDetails, 'customerId', payload.customerId);
          const persistedDetail = await extractDetailArtifactFromZip(
            record.id,
            data.data.zipBase64,
            data.data.details[0] as Record<string, unknown>
          );
          nextMetadata.details = mergeDetail(
            existingDetails,
            {
              ...(data.data.details[0] as Record<string, unknown>),
              ...(persistedDetail || {}),
              fileUrl: buildDetailDownloadPath(record.id, detailIndex),
            },
            'customerId',
            payload.customerId
          );
        } else {
          nextMetadata.artifact = {
            relative_path: artifact.relativePath,
            file_name: artifact.fileName,
            provider: artifact.provider,
          };
          nextMetadata.template_source = data.data?.templateSource ?? metadata.template_source;
          nextMetadata.details = await enrichDetailsWithArtifactsFromZip(
            record.id,
            data.data.zipBase64,
            data.data?.details as Array<Record<string, unknown>> | undefined
          );
          nextMetadata.shipped_order_count = data.data?.shippedOrderCount ?? metadata.shipped_order_count;
          nextMetadata.pending_receipt_count = data.data?.pendingReceiptCount ?? metadata.pending_receipt_count;
        }

        await client
          .from('export_records')
          .update({
            ...(isDetailRegeneration
              ? {}
              : {
                  file_url: artifact.downloadPath,
                  file_name: data.data?.zipFileName || record.file_name,
                  zip_file_url: artifact.downloadPath,
                  zip_file_name: data.data?.zipFileName || record.zip_file_name || record.file_name,
                  template_id: data.data?.templateId ?? record.template_id ?? null,
                  template_name: data.data?.templateName || record.template_name,
                  total_count: data.data?.totalOrderCount ?? record.total_count,
                }),
            metadata: nextMetadata,
          })
          .eq('id', record.id);
      }

      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json({ success: false, error: '暂不支持该导出类型的重新生成' }, { status: 400 });
  } catch (error) {
    console.error('重新生成导出文件失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
