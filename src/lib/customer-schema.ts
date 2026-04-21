import { getSupabaseClient } from '@/storage/database/supabase-client';

type CustomerClient = ReturnType<typeof getSupabaseClient>;

export type CustomerSchemaMode = 'modern' | 'legacy';

let cachedCustomerSchemaMode: CustomerSchemaMode | null = null;

export async function getCustomerSchemaMode(client: CustomerClient): Promise<CustomerSchemaMode> {
  if (cachedCustomerSchemaMode) {
    return cachedCustomerSchemaMode;
  }

  const { error } = await client
    .from('customers')
    .select('id, sales_user_id, operator_user_id, contact_phone, contact_email, payment_days, is_active')
    .limit(1);

  cachedCustomerSchemaMode = error ? 'legacy' : 'modern';
  return cachedCustomerSchemaMode;
}

function normalizeTruthyString(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function normalizeNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function transformCustomerRecord(dbCustomer: Record<string, unknown>) {
  const legacyStatus = normalizeTruthyString(dbCustomer.status);

  return {
    id: dbCustomer.id,
    code: dbCustomer.code,
    name: dbCustomer.name,
    contactPerson: dbCustomer.contact_person || dbCustomer.contact || '',
    contactPhone: dbCustomer.contact_phone || dbCustomer.phone || dbCustomer.mobile || '',
    contactEmail: dbCustomer.contact_email || '',
    address: dbCustomer.address || '',
    province: dbCustomer.province || dbCustomer.region || '',
    city: dbCustomer.city || '',
    district: dbCustomer.district || '',
    salesUserId: dbCustomer.sales_user_id || dbCustomer.salesperson_id || '',
    salesUserName: dbCustomer.sales_user_name || dbCustomer.salesperson_name || '',
    operatorUserId: dbCustomer.operator_user_id || dbCustomer.order_taker_id || '',
    operatorUserName: dbCustomer.operator_user_name || dbCustomer.order_taker_name || '',
    creditLimit: normalizeNumber(dbCustomer.credit_limit, 0),
    paymentDays: normalizeNumber(dbCustomer.payment_days, 0),
    paymentStatus: String(dbCustomer.payment_status || dbCustomer.settlement_cycle || 'normal'),
    isActive:
      typeof dbCustomer.is_active === 'boolean'
        ? dbCustomer.is_active
        : !['inactive', 'disabled', 'deleted'].includes(legacyStatus.toLowerCase()),
    remark: dbCustomer.remark || '',
    createdAt: dbCustomer.created_at,
    updatedAt: dbCustomer.updated_at,
  };
}

type CustomerPayload = {
  code?: string;
  name?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  province?: string;
  city?: string;
  district?: string;
  salesUserId?: string;
  salesUserName?: string;
  operatorUserId?: string;
  operatorUserName?: string;
  creditLimit?: number;
  paymentDays?: number;
  paymentStatus?: string;
  isActive?: boolean;
  remark?: string;
};

export function buildCustomerMutationData(payload: CustomerPayload, schemaMode: CustomerSchemaMode) {
  if (schemaMode === 'modern') {
    return {
      code: payload.code,
      name: payload.name,
      contact_person: payload.contactPerson || null,
      contact_phone: payload.contactPhone || null,
      contact_email: payload.contactEmail || null,
      address: payload.address || null,
      province: payload.province || null,
      city: payload.city || null,
      district: payload.district || null,
      sales_user_id: payload.salesUserId || null,
      sales_user_name: payload.salesUserName || null,
      operator_user_id: payload.operatorUserId || null,
      operator_user_name: payload.operatorUserName || null,
      credit_limit: payload.creditLimit ?? 0,
      payment_days: payload.paymentDays ?? 0,
      payment_status: payload.paymentStatus || 'normal',
      is_active: payload.isActive !== false,
      remark: payload.remark || null,
    };
  }

  return {
    code: payload.code,
    name: payload.name,
    salesperson_id: payload.salesUserId || null,
    salesperson_name: payload.salesUserName || null,
    order_taker_id: payload.operatorUserId || null,
    order_taker_name: payload.operatorUserName || null,
    contact: payload.contactPerson || null,
    phone: payload.contactPhone || null,
    address: payload.address || null,
    region: payload.province || null,
    credit_limit: payload.creditLimit ?? 0,
    settlement_cycle: payload.paymentStatus || null,
    status: payload.isActive === false ? 'inactive' : 'active',
    remark: payload.remark || null,
  };
}
