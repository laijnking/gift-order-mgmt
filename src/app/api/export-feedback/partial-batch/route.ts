import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { saveExportArtifact } from '@/lib/export-artifacts';
import { buildExportRecordDownloadPath } from '@/lib/export-download';
import { parseTemplateFieldMappings, migrateFieldMappings, type TemplateRecord } from '@/lib/template-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { PERMISSIONS } from '@/lib/permissions';
import { getTenantFromRequest } from '@/lib/tenant-context';
import { buildFeedbackRows, DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS, applyTextFormat } from '@/lib/feedback-exporter';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

type ExportTemplateSource = 'explicit' | 'default' | 'first' | 'column_mapping' | 'mixed';

function summarizeTemplateSource(
  details: Array<{ templateSource?: Exclude<ExportTemplateSource, 'mixed'> }>,
  fallback: Exclude<ExportTemplateSource, 'mixed'>
): ExportTemplateSource {
  const sources = details
    .map((detail) => detail.templateSource)
    .filter((source): source is Exclude<ExportTemplateSource, 'mixed'> => Boolean(source));

  if (sources.length === 0) return fallback;

  const uniqueSources = Array.from(new Set(sources));
  return uniqueSources.length > 1 ? 'mixed' : uniqueSources[0];
}

/**
 * 批量导出部分回单状态的客户反馈单（仅返回 partial_returned 状态订单）
 * 与 /api/export-feedback/returned-batch 对应，提供分开导出功能
 */
export async function POST(request: NextRequest) {
  const authError = await requirePermission(request, PERMISSIONS.ORDERS_EXPORT);
  if (authError) return authError;
  const tenant = await getTenantFromRequest(request);
  const tenantId = tenant.tenantId;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerIds, templateId, exportedBy, persistenceMode } = body;
    const resolvedPersistenceMode: 'none' | 'full' = persistenceMode === 'none' ? 'none' : 'full';

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个客户' }, { status: 400 });
    }

    const results = [];
    const zip = new JSZip();
    const batchId = crypto.randomUUID();
    const recordId = crypto.randomUUID();
    let totalOrderCount = 0;

    const resolvedTemplateId = templateId || null;
    let resolvedTemplate: TemplateRecord | null = null;
    let templateName = '默认客户反馈模板';
    let templateSource: 'explicit' | 'default' | 'first' = 'default';

    if (resolvedTemplateId) {
      const { data: template } = await client
        .from('templates')
        .select('*')
        .eq('id', resolvedTemplateId)
        .single();
      if (template) {
        resolvedTemplate = template as TemplateRecord;
        templateName = template.name;
        templateSource = 'explicit';
      }
    }

    // 按客户分别处理
    for (const customerId of customerIds) {
      // 仅查询 partial_returned 状态的订单
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .eq('status', 'partial_returned')
        .eq('tenant_id', tenantId);

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);
      if (!orders || orders.length === 0) continue;

      // 获取客户信息
      const { data: customer } = await client
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();

      const customerName = customer?.name || '未知客户';
      const orderCustomerCode = orders[0]?.customer_code || '';
      const buildMappingQuery = (activeOnly: boolean) => {
        let q = client
          .from('column_mappings')
          .select('id, version, mapping_config, feedback_export_headers, column_order')
          .order('version', { ascending: false })
          .limit(1);
        if (activeOnly) q = q.eq('is_active', true);
        if (customerId && orderCustomerCode) {
          q = q.or(`customer_id.eq.${customerId},customer_code.eq.${orderCustomerCode}`);
        } else if (customerId) {
          q = q.eq('customer_id', customerId);
        } else if (orderCustomerCode) {
          q = q.eq('customer_code', orderCustomerCode);
        }
        return q;
      };
      let { data: customerMapping } = await buildMappingQuery(true).maybeSingle();
      if (!customerMapping) {
        const fallbackRes = await buildMappingQuery(false).maybeSingle();
        customerMapping = fallbackRes.data ?? null;
      }

      const rawFeedbackHeaders = customerMapping?.feedback_export_headers;
      let feedbackExportHeaders: Record<string, string> | null = null;
      if (rawFeedbackHeaders) {
        try {
          const parsed = typeof rawFeedbackHeaders === 'string'
            ? JSON.parse(rawFeedbackHeaders) as Record<string, string>
            : rawFeedbackHeaders;
          feedbackExportHeaders = {};
          for (const [k, v] of Object.entries(parsed)) {
            const val = String(v);
            feedbackExportHeaders[k] = (val === 'order_no' ? 'orderNo'
              : val === 'customer_order_no' ? 'customerOrderNo'
              : val === 'supplier_order_no' ? 'supplierOrderNo'
              : val === 'customer_code' ? 'customerCode'
              : val === 'customer_name' ? 'customerName'
              : val === 'supplier_name' ? 'supplierName'
              : val === 'product_name' ? 'productName'
              : val === 'product_code' ? 'productCode'
              : val === 'product_spec' ? 'productSpec'
              : val === 'receiver_name' ? 'receiverName'
              : val === 'receiver_phone' ? 'receiverPhone'
              : val === 'receiver_address' ? 'receiverAddress'
              : val === 'express_company' ? 'expressCompany'
              : val === 'tracking_no' ? 'trackingNo'
              : val === 'salesperson' ? 'salesperson'
              : val === 'operator' ? 'operator'
              : val === 'remark' ? 'remark'
              : val === 'quantity' ? 'quantity'
              : val === 'price' ? 'price'
              : val === 'amount' ? 'amount'
              : val === 'warehouse' ? 'warehouse'
              : val === 'sys_order_no' ? 'sysOrderNo'
              : val === 'match_code' ? 'matchCode'
              : val === 'dispatch_batch' ? 'dispatchBatch'
              : val === 'unit_cost' ? 'unitCost'
              : val === 'warehouse_name' ? 'warehouseName'
              : val);
          }
        } catch { /* ignore parse errors */ }
      }
      // 获取原始 Excel 列名顺序（JSONB 数组，保序）
      let columnOrder: string[] | null = null;
      if (customerMapping?.column_order && Array.isArray(customerMapping.column_order)) {
        columnOrder = (customerMapping.column_order as unknown[]).map(String);
      }

      let exportFieldMappings: Record<string, string> = {};
      if (customerMapping?.mapping_config) {
        const rawConfig = typeof customerMapping.mapping_config === 'string'
          ? JSON.parse(customerMapping.mapping_config) as Record<string, string>
          : customerMapping.mapping_config;
        exportFieldMappings = migrateFieldMappings(rawConfig);
      }
      let exportTemplateName = customerMapping
        ? `客户导入映射(v${customerMapping.version})`
        : templateName;
      let exportTemplateId = resolvedTemplateId;
      let exportTemplateSource: 'explicit' | 'default' | 'first' | 'column_mapping' =
        customerMapping ? 'column_mapping' : templateSource;

      if (!customerMapping) {
        // 无导入映射时：优先使用用户显式选择的模板，否则使用默认映射
        // 不再自动从模板管理（templates 表）查询模板回退
        if (resolvedTemplate) {
          exportTemplateId = resolvedTemplate.id || exportTemplateId;
          exportTemplateName = String(resolvedTemplate.name || exportTemplateName);
          exportFieldMappings = parseTemplateFieldMappings(resolvedTemplate);
          feedbackExportHeaders = null;
          if (templateSource === 'explicit') {
            exportTemplateSource = 'explicit';
          }
        }
      }

      // 生成文件名
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${customerName}+部分回单反馈+${today}.xlsx`;
      const exportRows = buildFeedbackRows(orders as Record<string, unknown>[], exportFieldMappings, feedbackExportHeaders || undefined, columnOrder || undefined);
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      applyTextFormat(worksheet);
      const headers = Object.keys(exportRows[0] || exportFieldMappings || DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS);
      worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, Math.min(40, header.length * 2 + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '部分回单反馈');
      const workbookBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      zip.file(fileName, workbookBuffer);
      const detailArtifact = resolvedPersistenceMode === 'full'
        ? await saveExportArtifact(recordId, fileName, workbookBuffer)
        : null;
      const detailIndex: number = results.length;

      const detailResult: {
        customerId: string;
        customerName: string;
        orderCount: number;
        templateId: string | null;
        templateName: string;
        fileName: string;
        fileUrl: string;
        artifact: {
          relative_path: string;
          file_name: string;
          provider: 'local' | 's3';
        } | null;
        status: 'success';
        templateSource: 'explicit' | 'default' | 'first' | 'column_mapping';
      } = {
        customerId,
        customerName,
        orderCount: orders.length,
        templateId: exportTemplateId,
        templateName: exportTemplateName,
        fileName,
        fileUrl: detailArtifact ? buildExportRecordDownloadPath(recordId, detailIndex) : '',
        artifact: detailArtifact
          ? {
              relative_path: detailArtifact.relativePath,
              file_name: detailArtifact.fileName,
              provider: detailArtifact.provider,
            }
          : null,
        status: 'success',
        templateSource: exportTemplateSource,
      };

      results.push(detailResult);
      totalOrderCount += orders.length;
    }

    // 生成ZIP文件名
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFileName = `部分回单反馈批量导出+${today}.zip`;
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipBase64 = zipBuffer.toString('base64');
    const responseTemplateSource = summarizeTemplateSource(results, templateSource);

    if (resolvedPersistenceMode === 'none') {
      return NextResponse.json({
        success: true,
        message: `成功生成${results.length}个客户的反馈内容，共${totalOrderCount}个订单`,
        data: {
          batchId,
          recordId: null,
          zipFileName,
          zipFileUrl: null,
          zipBase64,
          artifact: null,
          totalCustomerCount: results.length,
          totalOrderCount,
          templateId: resolvedTemplateId,
          templateName,
          templateSource: responseTemplateSource,
          persistenceMode: resolvedPersistenceMode,
          details: results,
        },
      });
    }

    const artifact = await saveExportArtifact(recordId, zipFileName, zipBuffer);

    // 保存批量导出记录
    const { error: recordError } = await client
      .from('export_records')
      .insert({
        id: recordId,
        export_type: 'customer_feedback_partial',
        customer_id: customerIds.length === 1 ? customerIds[0] : null,
        template_id: resolvedTemplateId,
        template_name: templateName,
        file_url: artifact.downloadPath,
        file_name: zipFileName,
        zip_file_url: artifact.downloadPath,
        zip_file_name: zipFileName,
        total_count: totalOrderCount,
        exported_by: exportedBy || 'system',
        tenant_id: tenantId,
        metadata: {
          batch_id: batchId,
          customer_ids: customerIds,
          download_mode: 'regenerate',
          artifact: {
            relative_path: artifact.relativePath,
            file_name: artifact.fileName,
            provider: artifact.provider,
          },
          template_source: responseTemplateSource,
          details: results,
        },
      });

    if (recordError) throw new Error(`保存导出记录失败: ${recordError.message}`);

    return NextResponse.json({
      success: true,
      message: `成功导出${results.length}个客户，共${totalOrderCount}个订单`,
      data: {
        batchId,
        recordId,
        zipFileName,
        zipFileUrl: artifact.downloadPath,
        zipBase64,
        artifact: {
          relative_path: artifact.relativePath,
          file_name: artifact.fileName,
          provider: artifact.provider,
        },
        totalCustomerCount: results.length,
        totalOrderCount,
        templateId: resolvedTemplateId,
        templateName,
        templateSource: responseTemplateSource,
        persistenceMode: resolvedPersistenceMode,
        details: results,
      },
    });
  } catch (error) {
    console.error('批量导出部分回单反馈单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 });
  }
}
