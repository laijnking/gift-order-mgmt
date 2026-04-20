import type {
  ParsedOrderBundleDraft,
  ParsedOrderDraft,
  ParsedOrderDraftItem,
} from '@/types/order-parse';

export function buildBundleDraftsFromFlatOrders(
  orders: ParsedOrderDraft[]
): ParsedOrderBundleDraft[] {
  return orders.map((order, index) => {
    const item: ParsedOrderDraftItem = {
      id: `${order.id || `text_item_${index}`}_item`,
      customerProductName: order.product_name,
      customerProductSpec: order.product_spec || '',
      customerProductCode: order.product_code || order.customerSku || '',
      customerBarcode: '',
      systemProductId: order.systemProductId || null,
      systemProductName: order.mappedProductName || null,
      systemProductSpec: order.mappedProductSpec || null,
      systemProductCode: order.mappedProductCode || null,
      systemProductBrand: order.mappedProductBrand || null,
      systemProductPrice: order.customerPrice ?? order.price ?? null,
      matchType: order.matchType || null,
      matchHint: order.matchHint || null,
      supplierMatches: order.supplierMatches || [],
      quantity: order.quantity,
      price: order.price ?? null,
      remark: order.remark || '',
    };

    return {
      id: order.id || `text_bundle_${index}`,
      orderNo:
        order.orderNo ||
        order.customerOrderNo ||
        order.billNo ||
        `TEXT-${index + 1}`,
      billDate: order.billDate || '',
      receiverName: order.receiver_name || '',
      receiverPhone: order.receiver_phone || '',
      receiverAddress: order.receiver_address || '',
      province: '',
      city: '',
      district: '',
      items: [item],
      expressCompany: order.express_company || '',
      trackingNo: order.tracking_no || '',
      remark: order.remark || '',
    };
  });
}

export function flattenBundleDraftsToFlatOrders(
  bundles: ParsedOrderBundleDraft[],
  fallbackCustomerCode = ''
): ParsedOrderDraft[] {
  return bundles.flatMap((bundle, bundleIndex) =>
    bundle.items.map((item, itemIndex) => ({
      id: item.id || `${bundle.id}_item_${itemIndex}`,
      orderNo: bundle.orderNo || '',
      billDate: bundle.billDate || '',
      customer_code: fallbackCustomerCode,
      product_name: item.customerProductName || '',
      product_code: item.customerProductCode || '',
      product_spec: item.customerProductSpec || '',
      quantity: item.quantity || 1,
      price: item.price ?? item.systemProductPrice ?? undefined,
      receiver_name: bundle.receiverName || '',
      receiver_phone: bundle.receiverPhone || '',
      receiver_address: bundle.receiverAddress || '',
      express_company: bundle.expressCompany || '',
      tracking_no: bundle.trackingNo || '',
      remark: item.remark || bundle.remark || '',
      mappedProductCode: item.systemProductCode || undefined,
      mappedProductName: item.systemProductName || undefined,
      mappedProductSpec: item.systemProductSpec || undefined,
      mappedProductBrand: item.systemProductBrand || undefined,
      systemProductId: item.systemProductId || undefined,
      supplierMatches: item.supplierMatches || [],
      matchType: item.matchType ?? undefined,
      matchHint: item.matchHint ?? undefined,
      customerSku: item.customerProductCode || undefined,
      customerPrice: item.price ?? item.systemProductPrice ?? undefined,
      supplierId: item.supplierMatches?.[0]?.supplierId,
      supplierName: item.supplierMatches?.[0]?.supplierName,
    }))
  );
}
