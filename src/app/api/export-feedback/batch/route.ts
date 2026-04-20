import { NextRequest, NextResponse } from 'next/server';
import { requirePermission } from '@/lib/server-auth';
import { CUSTOMER_FEEDBACK_SOURCE_STATUSES } from '@/lib/order-status';
import { saveExportArtifact } from '@/lib/export-artifacts';
import { buildExportRecordDownloadPath } from '@/lib/export-download';
import { parseTemplateFieldMappings, resolvePreferredTemplate, type TemplateRecord } from '@/lib/template-utils';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

type OrderItem = Record<string, unknown>;
type ExportTemplateSource = 'explicit' | 'default' | 'first' | 'column_mapping' | 'mixed';

const DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS: Record<string, string> = {
  客户订单号: 'order_no',
  客户单据编号: 'customer_order_no',
  收货人: 'receiver_name',
  收货电话: 'receiver_phone',
  收货地址: 'receiver_address',
  商品名称: 'product_name',
  商品编码: 'product_code',
  规格型号: 'product_spec',
  数量: 'quantity',
  单价: 'price',
  快递公司: 'express_company',
  物流单号: 'tracking_no',
  业务员: 'salesperson',
  跟单员: 'operator',
  备注: 'remark',
};

function parseItems(value: unknown): OrderItem[] {
  if (Array.isArray(value)) return value as OrderItem[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function itemText(item: OrderItem, ...keys: string[]) {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
}

function buildFeedbackRows(
  orders: Record<string, unknown>[],
  fieldMappings: Record<string, string>
) {
  const normalizedMappings = Object.keys(fieldMappings).length > 0 ? fieldMappings : DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS;

  return orders.flatMap((order) => {
    const items = parseItems(order.items);
    const rowItems = items.length > 0
      ? items
      : [{ product_name: '', product_code: '', product_spec: '', quantity: 1, price: null }];

    return rowItems.map((item) => {
      const context: Record<string, unknown> = {
        bill_no: order.sys_order_no || '',
        bill_date: order.created_at || '',
        order_no: order.order_no || '',
        customer_order_no: order.customer_order_no || '',
        supplier_order_no: order.supplier_order_no || '',
        customer_code: order.customer_code || '',
        customer_name: order.customer_name || '',
        supplier_name: order.supplier_name || '',
        salesperson: order.salesperson || '',
        operator: order.operator_name || '',
        product_name: itemText(item, 'product_name', 'productName', 'cu_product_name', 'cuProductName'),
        customer_product_name: itemText(item, 'cu_product_name', 'cuProductName', 'product_name', 'productName'),
        product_code: itemText(item, 'product_code', 'productCode', 'cu_product_code', 'cuProductCode'),
        product_spec: itemText(item, 'product_spec', 'productSpec', 'cu_product_spec', 'cuProductSpec'),
        quantity: toNumber(item.quantity, 1),
        price: item.price ?? item.unit_price ?? '',
        amount: toNumber(item.quantity, 1) * toNumber(item.price ?? item.unit_price, 0),
        warehouse: itemText(item, 'warehouse', 'warehouseName'),
        remark: order.remark || itemText(item, 'remark'),
        receiver_name: order.receiver_name || '',
        receiver_phone: order.receiver_phone || '',
        receiver_address: order.receiver_address || '',
        express_company: order.express_company || '',
        tracking_no: order.tracking_no || '',
      };

      return Object.fromEntries(
        Object.entries(normalizedMappings).map(([header, fieldKey]) => [header, context[fieldKey] ?? ''])
      );
    });
  });
}

function summarizeTemplateSource(
  details: Array<{ templateSource?: Exclude<ExportTemplateSource, 'mixed'> }>,
  fallback: Exclude<ExportTemplateSource, 'mixed'>
): ExportTemplateSource {
  const sources = details
    .map((detail) => detail.templateSource)
    .filter((source): source is Exclude<ExportTemplateSource, 'mixed'> => Boolean(source));

  if (sources.length === 0) {
    return fallback;
  }

  const uniqueSources = Array.from(new Set(sources));
  return uniqueSources.length > 1 ? 'mixed' : uniqueSources[0];
}

// 批量导出客户反馈单
export async function POST(request: NextRequest) {
  const authError = requirePermission(request, 'orders:export');
  if (authError) return authError;

  const client = getSupabaseClient();

  try {
    const body = await request.json();
    const { customerIds, templateId, exportedBy, skipUnshipped = false, persistenceMode } = body;
    const resolvedPersistenceMode: 'none' | 'full' = persistenceMode === 'none' ? 'none' : 'full';

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return NextResponse.json({ success: false, error: '请选择至少一个客户' }, { status: 400 });
    }

    const results = [];
    const zip = new JSZip();
    const batchId = crypto.randomUUID();
    const recordId = crypto.randomUUID();
    let totalOrderCount = 0;
    let totalShippedCount = 0;
    let totalPendingReceiptCount = 0;

    let resolvedTemplateId = templateId || null;
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
      // 获取可用于客户反馈导出的订单
      const { data: orders, error: ordersError } = await client
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .in('status', CUSTOMER_FEEDBACK_SOURCE_STATUSES);

      if (ordersError) throw new Error(`查询订单失败: ${ordersError.message}`);

      if (!orders || orders.length === 0) continue;

      // 统计已回单和待回单订单
      let shippedCount = 0;
      let pendingReceiptCount = 0;

      for (const order of orders) {
        if (order.tracking_no && order.tracking_no.trim() !== '') {
          shippedCount++;
        } else {
          pendingReceiptCount++;
        }
      }

      // 如果设置了跳过未回单订单且存在未回单订单，则跳过该客户
      if (skipUnshipped && pendingReceiptCount > 0) {
        continue;
      }

      // 获取客户信息
      const { data: customer } = await client
        .from('customers')
        .select('name')
        .eq('id', customerId)
        .single();

      const customerName = customer?.name || '未知客户';
      const { data: customerMapping } = await client
        .from('column_mappings')
        .select('id, version, mapping_config')
        .eq('customer_code', orders[0]?.customer_code || '')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      let exportFieldMappings = customerMapping?.mapping_config || {};
      let exportTemplateName = customerMapping
        ? `客户导入映射(v${customerMapping.version})`
        : templateName;
      let exportTemplateId = resolvedTemplateId;
      let exportTemplateSource: 'explicit' | 'default' | 'first' | 'column_mapping' =
        customerMapping ? 'column_mapping' : templateSource;

      if (!customerMapping) {
        let customerScopedTemplate = resolvedTemplate;
        if (!customerScopedTemplate) {
          const { template, source } = await resolvePreferredTemplate(client, {
            type: 'customer_feedback',
            targetType: 'customer',
            targetId: customerId,
          });
          if (template) {
            customerScopedTemplate = template;
            if (!resolvedTemplateId && template.id) resolvedTemplateId = template.id;
            exportTemplateSource = source === 'first' ? 'first' : 'default';
          }
        }

        if (customerScopedTemplate) {
          exportTemplateId = customerScopedTemplate.id || exportTemplateId;
          exportTemplateName = String(customerScopedTemplate.name || exportTemplateName);
          exportFieldMappings = parseTemplateFieldMappings(customerScopedTemplate);
          if (resolvedTemplate?.id === customerScopedTemplate.id && templateSource === 'explicit') {
            exportTemplateSource = 'explicit';
          }
        }
      }

      // 生成文件名: 客户名称+订单反馈+日期
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${customerName}+订单反馈+${today}.xlsx`;
      const exportRows = buildFeedbackRows(orders as Record<string, unknown>[], exportFieldMappings);
      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const headers = Object.keys(exportRows[0] || exportFieldMappings || DEFAULT_CUSTOMER_FEEDBACK_MAPPINGS);
      worksheet['!cols'] = headers.map((header) => ({ wch: Math.max(12, Math.min(40, header.length * 2 + 4)) }));
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '客户反馈');
      const workbookBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      zip.file(fileName, workbookBuffer);
      const detailArtifact = resolvedPersistenceMode === 'full'
        ? await saveExportArtifact(recordId, fileName, workbookBuffer)
        : null;
      const detailIndex: number = results.length;

      // 记录导出详情
      const detailResult: {
        customerId: string;
        customerName: string;
        orderCount: number;
        shippedOrderCount: number;
        pendingReceiptCount: number;
        templateId: string | null;
        templateName: string;
        fileName: string;
        fileUrl: string;
        artifact: {
          relative_path: string;
          file_name: string;
          provider: 'local' | 's3';
        } | null;
        hasPendingReceipts: boolean;
        status: 'success';
        templateSource: 'explicit' | 'default' | 'first' | 'column_mapping';
      } = {
        customerId,
        customerName,
        orderCount: orders.length,
        shippedOrderCount: shippedCount,
        pendingReceiptCount,
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
        hasPendingReceipts: pendingReceiptCount > 0,
        status: 'success',
        templateSource: exportTemplateSource,
      };

      results.push(detailResult);
      totalOrderCount += orders.length;
      totalShippedCount += shippedCount;
      totalPendingReceiptCount += pendingReceiptCount;
    }

    // 生成ZIP文件名
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const zipFileName = `客户反馈批量导出+${today}.zip`;
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
          shippedOrderCount: totalShippedCount,
          pendingReceiptCount: totalPendingReceiptCount,
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
        export_type: 'customer_feedback',
        customer_id: customerIds.length === 1 ? customerIds[0] : null,
        template_id: resolvedTemplateId,
        template_name: templateName,
        file_url: artifact.downloadPath,
        file_name: zipFileName,
        zip_file_url: artifact.downloadPath,
        zip_file_name: zipFileName,
        total_count: totalOrderCount,
        exported_by: exportedBy || 'system',
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
          shipped_order_count: totalShippedCount,
          pending_receipt_count: totalPendingReceiptCount,
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
        shippedOrderCount: totalShippedCount,
        pendingReceiptCount: totalPendingReceiptCount,
        templateId: resolvedTemplateId,
        templateName,
        templateSource: responseTemplateSource,
        persistenceMode: resolvedPersistenceMode,
        details: results,
      },
    });
  } catch (error) {
    console.error('批量导出客户反馈单失败:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
