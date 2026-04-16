import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function POST(request: NextRequest) {
  const client = getSupabaseClient();
  
  try {
    const body = await request.json();
    const { type, data } = body;
    
    if (!type || !data || !Array.isArray(data)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid parameters, requires type and data array' 
      }, { status: 400 });
    }
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    switch (type) {
      case 'products': {
        for (const item of data) {
          const productData = {
            id: item.id || crypto.randomUUID(),
            code: item.code || item.sku,
            barcode: item.barcode || '',
            name: item.name,
            brand: item.brand || '',
            category: item.category || '',
            spec: item.spec || '',
            unit: item.unit || 'PC',
            cost_price: item.costPrice || item.cost_price || 0,
            retail_price: item.retailPrice || item.retail_price || 0,
            lifecycle_status: item.lifecycleStatus || item.lifecycle_status || 'active',
            is_active: item.isActive !== false && item.is_active !== false,
            remark: item.remark || '',
          };
          
          const { error } = await client
            .from('products')
            .upsert(productData, { onConflict: 'code' });
          
          if (error) {
            errorCount++;
            errors.push('Product ' + item.name + ': ' + error.message);
          } else {
            successCount++;
          }
        }
        break;
      }
      
      case 'suppliers': {
        for (const item of data) {
          const supplierData = {
            id: item.id || crypto.randomUUID(),
            name: item.name,
            short_name: item.shortName || '',
            type: item.type || 'ThirdParty',
            contact: item.contact || '',
            send_type: item.sendType || 'Dropship',
            province: item.province || '',
            can_jd: item.canJd || false,
            express_restrictions: item.expressRestrictions || item.express_restrictions || '[]',
            cost_factor: item.costFactor || 1,
            is_active: item.isActive !== false,
          };
          
          const { data: existing } = await client
            .from('suppliers')
            .select('id')
            .eq('name', item.name)
            .maybeSingle();
          
          if (existing) {
            const { error } = await client
              .from('suppliers')
              .update(supplierData)
              .eq('id', existing.id);
            
            if (error) {
              errorCount++;
              errors.push('Supplier ' + item.name + ': ' + error.message);
            } else {
              successCount++;
            }
          } else {
            const { error } = await client
              .from('suppliers')
              .insert(supplierData);
            
            if (error) {
              errorCount++;
              errors.push('Supplier ' + item.name + ': ' + error.message);
            } else {
              successCount++;
            }
          }
        }
        break;
      }
      
      case 'warehouses': {
        for (const item of data) {
          const warehouseData = {
            id: item.id || crypto.randomUUID(),
            code: item.code,
            name: item.name,
            short_name: item.shortName || '',
            type: item.type || 'ThirdParty',
            contact_person: item.contact || item.contactPerson || '',
            contact_phone: item.phone || item.contactPhone || '',
            address: item.address || '',
            province: item.province || '',
            city: item.city || '',
            is_active: item.isActive !== false,
            remark: item.remark || '',
          };
          
          const { error } = await client
            .from('warehouses')
            .upsert(warehouseData, { onConflict: 'code' });
          
          if (error) {
            errorCount++;
            errors.push('Warehouse ' + item.name + ': ' + error.message);
          } else {
            successCount++;
          }
        }
        break;
      }
      
      case 'stocks': {
        for (const item of data) {
          let supplierId = item.supplierId || item.supplier_id || '';
          
          if (!supplierId && item.supplier_name) {
            const { data: supplier } = await client
              .from('suppliers')
              .select('id')
              .eq('name', item.supplier_name)
              .maybeSingle();
            
            if (supplier) {
              supplierId = supplier.id;
            }
          }
          
          const stockData = {
            id: item.id || crypto.randomUUID(),
            supplier_id: supplierId,
            supplier_name: item.supplierName || item.supplier_name || '',
            product_code: item.productCode || item.product_code,
            product_name: item.productName || item.product_name,
            quantity: item.quantity || 0,
            in_transit: item.inTransit || item.in_transit || 0,
            price: item.price || 0,
          };
          
          const { error } = await client
            .from('stocks')
            .insert(stockData);
          
          if (error) {
            errorCount++;
            errors.push('Stock ' + item.product_name + ': ' + error.message);
          } else {
            successCount++;
          }
        }
        break;
      }
      
      case 'orders': {
        for (const item of data) {
          const orderNo = item.orderNo || item.order_no;
          
          const { data: existing } = await client
            .from('orders')
            .select('id')
            .eq('order_no', orderNo)
            .maybeSingle();
          
          const orderData = {
            id: existing?.id || item.id || crypto.randomUUID(),
            order_no: orderNo,
            supplier_order_no: item.supplierOrderNo || item.supplier_order_no || '',
            status: item.status || 'pending',
            items: item.items || [],
            receiver_name: item.receiverName || item.receiver_name,
            receiver_phone: item.receiverPhone || item.receiver_phone,
            receiver_address: item.receiverAddress || item.receiver_address,
            province: item.province || '',
            city: item.city || '',
            district: item.district || '',
            customer_code: item.customerCode || item.customer_code || '',
            customer_name: item.customerName || item.customer_name || '',
            salesperson: item.salesperson || '',
            supplier_id: item.supplierId || item.supplier_id || null,
            supplier_name: item.supplierName || item.supplier_name || '',
            express_company: item.expressCompany || item.express_company || '',
            tracking_no: item.trackingNo || item.tracking_no || '',
            source: item.source || '',
            import_batch: item.importBatch || '',
            assigned_batch: item.assignedBatch || '',
            match_code: item.matchCode || item.match_code || '',
            remark: item.remark || '',
            express_requirement: item.expressRequirement || item.express_requirement || '',
          };
          
          let error;
          if (existing) {
            const result = await client
              .from('orders')
              .update(orderData)
              .eq('id', existing.id);
            error = result.error;
          } else {
            const result = await client
              .from('orders')
              .insert(orderData);
            error = result.error;
          }
          
          if (error) {
            errorCount++;
            errors.push('Order ' + orderNo + ': ' + error.message);
          } else {
            successCount++;
          }
        }
        break;
      }
      
      default:
        return NextResponse.json({ 
          success: false, 
          error: 'Unsupported type: ' + type 
        }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      data: {
        successCount,
        errorCount,
        total: data.length,
      },
      errors: errors.slice(0, 10),
      message: 'Imported ' + successCount + ' records, ' + errorCount + ' failed'
    });
    
  } catch (error) {
    console.error('Batch import failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
