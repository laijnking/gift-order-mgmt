import { NextRequest, NextResponse } from 'next/server';
import { getExportArtifactDownloadTarget, readExportArtifact } from '@/lib/export-artifacts';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requirePermission } from '@/lib/server-auth';
import { PERMISSIONS } from '@/lib/permissions';

type ExportDetailRecord = {
  artifact?: {
    relative_path?: string;
    provider?: 'local' | 's3';
    file_name?: string;
  };
  fileName?: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;

  const client = getSupabaseClient();
  const { id } = await params;
  const { searchParams } = new URL(request.url);

  try {
    const { data: record, error } = await client
      .from('export_records')
      .select('file_name, zip_file_name, metadata')
      .eq('id', id)
      .single();

    if (error) throw new Error(`查询导出记录失败: ${error.message}`);

    const detailIndexParam = searchParams.get('detailIndex');
    let detail: ExportDetailRecord | null = null;

    if (detailIndexParam !== null) {
      const parsedDetailIndex = Number.parseInt(detailIndexParam, 10);
      if (!Number.isInteger(parsedDetailIndex) || parsedDetailIndex < 0) {
        return NextResponse.json({ success: false, error: 'detailIndex 参数不合法' }, { status: 400 });
      }

      detail = (record?.metadata?.details?.[parsedDetailIndex] as ExportDetailRecord | undefined) || null;
      if (!detail) {
        return NextResponse.json({ success: false, error: '未找到对应的明细导出文件' }, { status: 404 });
      }
    }

    const artifactPath = detail?.artifact?.relative_path || record?.metadata?.artifact?.relative_path;
    const artifactProvider = detail?.artifact?.provider || record?.metadata?.artifact?.provider || 'local';
    const fileName =
      detail?.artifact?.file_name ||
      detail?.fileName ||
      record?.metadata?.artifact?.file_name ||
      record?.zip_file_name ||
      record?.file_name ||
      'export.zip';
    const contentType = detail ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/zip';

    if (!artifactPath) {
      return NextResponse.json({ success: false, error: '当前记录没有已持久化的导出文件，请先重新生成' }, { status: 404 });
    }

    const downloadTarget = await getExportArtifactDownloadTarget(
      artifactPath,
      artifactProvider,
      fileName,
      contentType
    );

    if (downloadTarget.type === 'redirect' && downloadTarget.url) {
      return NextResponse.redirect(downloadTarget.url);
    }

    const fileBuffer = await readExportArtifact(artifactPath, artifactProvider);

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error) {
    console.error('下载导出文件失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
