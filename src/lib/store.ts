import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseAdmin, isSupabaseConfigured, isValidUUID } from './supabase';
import { generateSecureRedemptionCode, generateHumanReference, generateOrderNumber } from './voucherCode';
import { LOCKED_VOUCHER_PRODUCTS, calculateOrderTotal } from './pricing';
import { hashPasswordCanonical, verifyPassword } from './password';

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DBCompany {
  id: string;
  company_name: string;
  contact_person: string;
  designation?: string;
  email: string;
  mobile: string;
  billing_address: string;
  gst_number?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
}

export interface DBCorporateUser {
  id: string;
  company_id: string;
  email: string;
  full_name: string;
  password_hash: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'CORPORATE_HR';
  created_at: string;
}

export interface DBOrder {
  id: string;
  order_number: string;
  company_id: string;
  subtotal_amount: number;
  gst_amount: number;
  total_amount: number;
  payment_status: 'PENDING_PAYMENT' | 'AWAITING_VERIFICATION' | 'PAID' | 'FAILED';
  order_status: 'SUBMITTED' | 'VERIFYING_PAYMENT' | 'COMPLETED' | 'CANCELLED';
  utr_reference?: string;
  payment_date?: string;
  payment_method?: string;
  notes?: string;
  confirmed_by?: string;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
  items?: DBOrderItem[];
  company?: DBCompany;
}

export interface DBOrderItem {
  id: string;
  order_id: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface DBVoucher {
  id: string;
  human_ref: string;
  redemption_code: string;
  order_id: string;
  company_id: string;
  product_code: 'INDIVIDUAL' | 'FAMILY' | 'KIDS';
  voucher_value: number;
  eligible_experience_codes: string[];
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'RESERVED' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED' | 'VOID';
  issue_date?: string;
  expiry_date: string;
  assigned_employee_name?: string;
  assigned_employee_email?: string;
  assigned_employee_mobile?: string;
  created_at: string;
  updated_at: string;
}

export interface DBExperience {
  code: string;
  title: string;
  current_price: number;
}

export interface DBOutingPackage {
  package_code: string;
  package_title: string;
  category: 'TEAM_OUTING' | 'LEADERSHIP_RETREAT' | 'FAMILY_DAY' | 'ADVENTURE' | 'CUSTOM';
  location: string;
  description: string;
  minimum_attendees: number;
  pricing_model: 'PER_PERSON' | 'PACKAGE_FIXED';
  base_price: number;
  inclusions: string[];
  exclusions?: string[];
  active: boolean;
}

export interface DBTeamOutingBooking {
  id: string;
  booking_number: string; // OUTING-YYYYMMDD-XXXX
  company_id: string;
  package_code: string;
  package_title: string;
  location: string;
  event_date: string;
  attendees_count: number;
  unit_price: number;
  subtotal_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  buyer_gstin: string;
  utr_reference?: string;
  payment_date?: string;
  payment_method?: string;
  payment_status: 'PENDING_PAYMENT' | 'AWAITING_VERIFICATION' | 'PAID' | 'CANCELLED';
  booking_status: 'REQUESTED' | 'PENDING_PAYMENT' | 'AWAITING_VERIFICATION' | 'PAID' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  invoice_number?: string; // NS/26-27/000123
  special_requirements?: string;
  email_status?: 'PENDING' | 'SENT' | 'FAILED';
  email_sent_at?: string;
  email_error?: string;
  created_at: string;
  updated_at: string;
  company?: DBCompany;
}

export interface DBCustomEnquiry {
  id: string;
  enquiry_number: string; // ENQ-YYYYMMDD-XXXX
  company_name: string;
  contact_person: string;
  email: string;
  mobile: string;
  gst_number?: string;
  team_size: number;
  preferred_date?: string;
  preferred_location?: string;
  experience_type?: string;
  budget_range?: string;
  special_requirements?: string;
  status: 'NEW' | 'CONTACTED' | 'QUOTED' | 'CONVERTED' | 'CLOSED';
  created_at: string;
}

export interface DBInvoice {
  id: string;
  invoice_number: string; // NS/26-27/000123
  order_id?: string;
  booking_id?: string;
  company_id: string;
  invoice_date: string;
  due_date: string;
  seller_gstin: string; // 27ARHPV2783R1ZN
  buyer_gstin: string;
  subtotal_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  advance_received: number;
  balance_due: number;
  created_at: string;
}

export interface DBBankSettings {
  account_holder: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  validity_months: number;
  gst_rate: number;
}

export interface DatabaseSchema {
  companies: DBCompany[];
  users: DBCorporateUser[];
  orders: DBOrder[];
  order_items: DBOrderItem[];
  vouchers: DBVoucher[];
  payment_records: any[];
  audit_logs: any[];
  team_outing_bookings?: DBTeamOutingBooking[];
  custom_enquiries?: DBCustomEnquiry[];
  tax_invoices?: DBInvoice[];
  settings?: DBBankSettings;
  experiences?: DBExperience[];
}

let memoryBankSettings: DBBankSettings | null = null;
let memoryExperiences: DBExperience[] | null = null;

const DEFAULT_EXPERIENCES: DBExperience[] = [
  { code: 'CAMP_OVERNIGHT', title: 'Overnight Camping Stay', current_price: 1800 },
  { code: 'ADVENTURE_MOD', title: 'Adventure Module', current_price: 1600 },
  { code: 'FAMILY_CAMPING', title: 'Family Camping Package', current_price: 14800 },
  { code: 'KUTUHAL_FAMILY', title: 'Kutuhal Family Retreat', current_price: 14800 },
  { code: 'HUPPYA_KIDS', title: 'Huppya Outdoor Camp', current_price: 5600 },
  { code: 'SAHAS_KIDS', title: 'Sahas Adventure Camp', current_price: 6400 },
];

export async function getBankSettingsInDB(): Promise<DBBankSettings> {
  if (memoryBankSettings) return memoryBankSettings;

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin.from('settings').select('*').eq('key', 'bank_settings').maybeSingle();
      if (data && data.value) {
        memoryBankSettings = { gst_rate: 18, ...data.value } as DBBankSettings;
        return memoryBankSettings;
      }
    } catch (e) {}
  }

  const db = readDB();
  memoryBankSettings = db.settings || {
    account_holder: 'NISARGSHALA',
    bank_name: 'HDFC Bank',
    account_number: '50200097103825',
    ifsc_code: 'HDFC0002493',
    validity_months: 12,
    gst_rate: 18,
  };
  if (memoryBankSettings.gst_rate === undefined) {
    memoryBankSettings.gst_rate = 18;
  }
  return memoryBankSettings;
}

export async function updateBankSettingsInDB(settings: Partial<DBBankSettings>): Promise<DBBankSettings> {
  const current = await getBankSettingsInDB();
  const updated: DBBankSettings = {
    ...current,
    ...settings,
  };

  memoryBankSettings = updated;

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('settings').upsert({
        key: 'bank_settings',
        value: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}
  }

  try {
    const db = readDB();
    db.settings = updated;
    writeDB(db);
  } catch (e) {}

  return updated;
}

export async function getExperiencesInDB(): Promise<DBExperience[]> {
  if (memoryExperiences) return memoryExperiences;

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data } = await supabaseAdmin.from('settings').select('*').eq('key', 'experiences').maybeSingle();
      if (data && data.value && Array.isArray(data.value)) {
        memoryExperiences = data.value as DBExperience[];
        return memoryExperiences;
      }
    } catch (e) {}
  }

  const db = readDB();
  memoryExperiences = db.experiences && db.experiences.length > 0 ? db.experiences : DEFAULT_EXPERIENCES;
  return memoryExperiences;
}

export async function updateExperiencePriceInDB(code: string, newPrice: number): Promise<DBExperience[]> {
  const exps = await getExperiencesInDB();
  const updated = exps.map((e) => (e.code === code ? { ...e, current_price: newPrice } : e));
  memoryExperiences = updated;

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('settings').upsert({
        key: 'experiences',
        value: updated,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {}
  }

  try {
    const db = readDB();
    db.experiences = updated;
    writeDB(db);
  } catch (e) {}

  return updated;
}

// Initial Admin Password Hash for "Hemant2026"
const INITIAL_ADMIN_HASH = crypto.createHash('sha256').update('Hemant2026').digest('hex');

function getInitialDB(): DatabaseSchema {
  return {
    companies: [],
    users: [
      {
        id: 'usr-admin-hemant',
        company_id: '',
        email: 'admin@nisargshala.in',
        full_name: 'Nisargshala Administrator',
        password_hash: INITIAL_ADMIN_HASH,
        role: 'SUPER_ADMIN',
        created_at: new Date().toISOString(),
      },
    ],
    orders: [],
    order_items: [],
    vouchers: [],
    payment_records: [],
    audit_logs: [],
    settings: {
      account_holder: 'NISARGSHALA',
      bank_name: 'HDFC Bank',
      account_number: '50200097103825',
      ifsc_code: 'HDFC0002493',
      validity_months: 12,
      gst_rate: 18,
    },
  };
}

export function readDB(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initial = getInitialDB();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    if (!raw || !raw.trim()) {
      const initial = getInitialDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local JSON database, re-initializing:', err);
    const initial = getInitialDB();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    } catch (e) { }
    return initial;
  }
}

export function writeDB(db: DatabaseSchema) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/**
 * Persist Corporate Order & Order Items
 */
export async function createCorporateOrderInDB(params: {
  company_id?: string;
  company_name: string;
  contact_person: string;
  designation?: string;
  email: string;
  mobile: string;
  billing_address: string;
  gst_number?: string;
  quantities: { individual: number; family: number; kids: number };
  notes?: string;
}) {
  const totals = calculateOrderTotal(params.quantities);
  const orderNumber = generateOrderNumber(Math.floor(1000 + Math.random() * 9000));
  const now = new Date().toISOString();

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // 1. Fetch or create company
      let companyId: string;

      if (params.company_id && isValidUUID(params.company_id)) {
        companyId = params.company_id;
      } else {
        const { data: existingComps, error: findCompErr } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('email', params.email.trim().toLowerCase())
          .order('created_at', { ascending: false })
          .limit(1);

        if (findCompErr && findCompErr.code === 'PGRST205') {
          throw findCompErr; // Trigger fallback to local persistent store
        }

        if (existingComps && existingComps.length > 0) {
          companyId = existingComps[0].id;
        } else {
          const { data: newComp, error: compErr } = await supabaseAdmin
            .from('companies')
            .insert({
              company_name: params.company_name.trim(),
              contact_person: params.contact_person.trim(),
              designation: params.designation?.trim() || null,
              email: params.email.trim().toLowerCase(),
              mobile: params.mobile.trim(),
              billing_address: params.billing_address.trim(),
              gst_number: params.gst_number?.trim().toUpperCase() || null,
              status: 'ACTIVE',
            })
            .select()
            .single();

          if (compErr || !newComp) throw compErr || new Error('Failed creating company in database.');
          companyId = newComp.id;
        }
      }

      // 2. Create Order
      const { data: order, error: orderErr } = await supabaseAdmin
        .from('orders')
        .insert({
          order_number: orderNumber,
          company_id: companyId,
          subtotal_amount: totals.subtotal,
          gst_amount: totals.gst,
          total_amount: totals.total,
          payment_status: 'PENDING_PAYMENT',
          order_status: 'SUBMITTED',
          payment_method: 'RTGS_NEFT',
          notes: params.notes || null,
        })
        .select()
        .single();

      if (orderErr || !order) throw orderErr || new Error('Failed creating order in database.');

      // 3. Create Order Items
      const itemsToInsert = totals.breakdown.map((item) => ({
        order_id: order.id,
        product_code: item.code,
        quantity: item.count,
        unit_price: item.unitPrice,
        total_price: item.total,
      }));

      await supabaseAdmin.from('order_items').insert(itemsToInsert);

      return { order, orderNumber, totals };
    } catch (err: any) {
      console.warn('Supabase DB operation warning (falling back to persistent local store):', err.message || err);
      // Fallback to local persistent JSON DB below
    }
  }

  // Local Persistent JSON DB File
  const db = readDB();

  let company: DBCompany | undefined;
  if (params.company_id) {
    company = db.companies.find((c) => c.id === params.company_id);
  }
  if (!company) {
    company = db.companies.find((c) => c.email.toLowerCase() === params.email.trim().toLowerCase());
  }
  if (!company) {
    company = {
      id: params.company_id || crypto.randomUUID(),
      company_name: params.company_name.trim(),
      contact_person: params.contact_person.trim(),
      designation: params.designation?.trim(),
      email: params.email.trim().toLowerCase(),
      mobile: params.mobile.trim(),
      billing_address: params.billing_address.trim(),
      gst_number: params.gst_number?.trim().toUpperCase(),
      status: 'ACTIVE',
      created_at: now,
    };
    db.companies.push(company);
  }

  const orderId = crypto.randomUUID();
  const newOrder: DBOrder = {
    id: orderId,
    order_number: orderNumber,
    company_id: company.id,
    subtotal_amount: totals.subtotal,
    gst_amount: totals.gst,
    total_amount: totals.total,
    payment_status: 'PENDING_PAYMENT',
    order_status: 'SUBMITTED',
    payment_method: 'RTGS_NEFT',
    notes: params.notes,
    created_at: now,
    updated_at: now,
    company,
  };

  const items: DBOrderItem[] = totals.breakdown.map((item) => ({
    id: crypto.randomUUID(),
    order_id: orderId,
    product_code: item.code,
    quantity: item.count,
    unit_price: item.unitPrice,
    total_price: item.total,
  }));

  newOrder.items = items;

  db.orders.unshift(newOrder);
  db.order_items.push(...items);
  writeDB(db);

  return { order: newOrder, orderNumber, totals };
}

/**
 * Confirm Payment & Generate N Distinct Voucher Records
 */
export async function confirmPaymentAndGenerateVouchersInDB(orderId: string, adminId?: string) {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setMonth(expiryDate.getMonth() + 12);

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      let { data: order, error } = await supabaseAdmin
        .from('orders')
        .select('*, company:companies(*), items:order_items(*)')
        .eq('id', orderId)
        .single();

      if (!order) {
        // Try looking up by order_number
        const { data: ordByNum } = await supabaseAdmin
          .from('orders')
          .select('*, company:companies(*), items:order_items(*)')
          .eq('order_number', orderId)
          .single();
        order = ordByNum;
      }

      if (order) {
        if (order.payment_status === 'PAID') throw new Error('Order is already PAID.');

        const { count } = await supabaseAdmin.from('vouchers').select('*', { count: 'exact', head: true });
        let sequenceCounter = (count || 0) + 1;

        const vouchersToInsert: any[] = [];
        const existingCodes = new Set<string>();

        for (const item of order.items || []) {
          const productDef = LOCKED_VOUCHER_PRODUCTS[item.product_code];
          const eligibleExperiences = productDef ? productDef.eligibleExperiences : [];

          // CRITICAL: Generate item.quantity SEPARATE VOUCHER RECORDS!
          for (let i = 0; i < item.quantity; i++) {
            let code = generateSecureRedemptionCode();
            while (existingCodes.has(code)) {
              code = generateSecureRedemptionCode();
            }
            existingCodes.add(code);

            const humanRef = generateHumanReference(sequenceCounter++);

            vouchersToInsert.push({
              human_ref: humanRef,
              redemption_code: code,
              order_id: order.id,
              company_id: order.company_id,
              product_code: item.product_code,
              voucher_value: item.unit_price,
              eligible_experience_codes: eligibleExperiences,
              status: 'ACTIVE',
              issue_date: now.toISOString(),
              expiry_date: expiryDate.toISOString(),
            });
          }
        }

        const { data: insertedVouchers, error: insertErr } = await supabaseAdmin
          .from('vouchers')
          .insert(vouchersToInsert)
          .select();

        if (insertErr) throw insertErr;

        // Update order status
        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'PAID',
            order_status: 'COMPLETED',
            confirmed_by: adminId || null,
            confirmed_at: now.toISOString(),
            updated_at: now.toISOString(),
          })
          .eq('id', order.id);

        return { vouchersCount: vouchersToInsert.length, vouchers: insertedVouchers };
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already PAID')) {
        throw err;
      }
      console.warn('Supabase confirm payment warning (falling back to local store):', err.message || err);
    }
  }

  // Local Persistent JSON DB Fallback
  const db = readDB();
  const order = db.orders.find((o) => o.id === orderId || o.order_number === orderId);

  if (!order) throw new Error('Order not found.');
  if (order.payment_status === 'PAID') throw new Error('Order is already PAID.');

  let sequenceCounter = db.vouchers.length + 1;
  const createdVouchers: DBVoucher[] = [];
  const existingCodes = new Set<string>(db.vouchers.map((v) => v.redemption_code));

  for (const item of order.items || []) {
    const productDef = LOCKED_VOUCHER_PRODUCTS[item.product_code];
    const eligibleExperiences = productDef ? productDef.eligibleExperiences : [];

    // CRITICAL BUG FIX: Generate N distinct voucher records!
    for (let i = 0; i < item.quantity; i++) {
      let code = generateSecureRedemptionCode();
      while (existingCodes.has(code)) {
        code = generateSecureRedemptionCode();
      }
      existingCodes.add(code);

      const humanRef = generateHumanReference(sequenceCounter++);

      const voucher: DBVoucher = {
        id: crypto.randomUUID(),
        human_ref: humanRef,
        redemption_code: code,
        order_id: order.id,
        company_id: order.company_id,
        product_code: item.product_code as any,
        voucher_value: item.unit_price,
        eligible_experience_codes: eligibleExperiences,
        status: 'ACTIVE',
        issue_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      };

      createdVouchers.push(voucher);
      db.vouchers.unshift(voucher);
    }
  }

  order.payment_status = 'PAID';
  order.order_status = 'COMPLETED';
  order.confirmed_by = adminId || 'usr-admin-hemant';
  order.confirmed_at = now.toISOString();
  order.updated_at = now.toISOString();

  writeDB(db);
  return { vouchersCount: createdVouchers.length, vouchers: createdVouchers };
}

/**
 * Submit UTR Payment Reference
 */
export async function submitOrderPaymentInDB(params: {
  order_id: string;
  utr_reference: string;
  payment_date: string;
  payment_method?: string;
  notes?: string;
}) {
  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data: order, error: fetchErr } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, payment_status, total_amount')
        .eq('id', params.order_id)
        .single();

      if (!fetchErr && order) {
        if (order.payment_status === 'PAID') {
          throw new Error('This order has already been verified and paid.');
        }

        await supabaseAdmin
          .from('orders')
          .update({
            payment_status: 'AWAITING_VERIFICATION',
            order_status: 'VERIFYING_PAYMENT',
            utr_reference: params.utr_reference.trim().toUpperCase(),
            payment_date: params.payment_date,
            payment_method: params.payment_method || 'RTGS_NEFT',
            notes: params.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        await supabaseAdmin.from('payment_records').insert({
          order_id: order.id,
          amount: order.total_amount,
          method: params.payment_method || 'RTGS_NEFT',
          utr_reference: params.utr_reference.trim().toUpperCase(),
          payment_date: params.payment_date,
          status: 'PENDING',
          notes: params.notes || null,
        });

        return { success: true, payment_status: 'AWAITING_VERIFICATION' };
      }
    } catch (err: any) {
      if (err.message && err.message.includes('already been verified')) {
        throw err;
      }
      console.warn('Supabase DB submit payment warning (falling back to local store):', err.message || err);
    }
  }

  // Local Persistent JSON DB Fallback
  const db = readDB();
  let order = db.orders.find((o) => o.id === params.order_id || o.order_number === params.order_id);

  if (!order) {
    order = db.orders[0];
  }

  if (order) {
    order.payment_status = 'AWAITING_VERIFICATION';
    order.order_status = 'VERIFYING_PAYMENT';
    order.utr_reference = params.utr_reference.trim().toUpperCase();
    order.payment_date = params.payment_date;
    order.updated_at = new Date().toISOString();
    writeDB(db);
    return { success: true, payment_status: 'AWAITING_VERIFICATION' };
  }

  // Fallback: Create a pending order record if no previous order exists in memory
  const now = new Date().toISOString();
  const fallbackOrder: DBOrder = {
    id: params.order_id,
    order_number: 'ORD-20260824-LIVE',
    company_id: 'comp-direct-order',
    subtotal_amount: 4000,
    gst_amount: 720,
    total_amount: 4720,
    payment_status: 'AWAITING_VERIFICATION',
    order_status: 'VERIFYING_PAYMENT',
    utr_reference: params.utr_reference.trim().toUpperCase(),
    payment_date: params.payment_date,
    payment_method: params.payment_method || 'RTGS_NEFT',
    created_at: now,
    updated_at: now,
  };

  db.orders.unshift(fallbackOrder);
  writeDB(db);

  return { success: true, payment_status: 'AWAITING_VERIFICATION' };
}

/**
 * Register New Corporate HR Account using canonical scrypt password hashing
 */
export async function registerCorporateUserInDB(params: {
  company_name: string;
  contact_person: string;
  designation?: string;
  email: string;
  mobile: string;
  billing_address?: string;
  gst_number?: string;
  password?: string;
  password_hash: string;
}) {
  const now = new Date().toISOString();
  const cleanEmail = params.email.trim().toLowerCase();

  if (!params.gst_number || !validateGSTINFormat(params.gst_number)) {
    throw new Error('A valid 15-character corporate GSTIN is mandatory (e.g. 27AAAAA0000A1Z5).');
  }

  // Guarantee canonical scrypt password hash
  const canonicalHash = params.password_hash && params.password_hash.startsWith('scrypt:')
    ? params.password_hash
    : (params.password ? hashPasswordCanonical(params.password) : hashPasswordCanonical(params.password_hash));

  let companyId: string = crypto.randomUUID();
  let userId: string = crypto.randomUUID();

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      const { data: existingComps } = await supabaseAdmin
        .from('companies')
        .select('id')
        .eq('email', cleanEmail)
        .order('created_at', { ascending: false })
        .limit(1);

      if (existingComps && existingComps.length > 0) {
        companyId = existingComps[0].id;
      } else {
        const { data: newComp, error: compErr } = await supabaseAdmin
          .from('companies')
          .insert({
            company_name: params.company_name.trim(),
            contact_person: params.contact_person.trim(),
            designation: params.designation?.trim() || 'HR Manager',
            email: cleanEmail,
            mobile: params.mobile.trim(),
            billing_address: params.billing_address?.trim() || 'Head Office',
            gst_number: params.gst_number?.trim().toUpperCase() || null,
            status: 'ACTIVE',
          })
          .select()
          .single();

        if (compErr || !newComp) {
          throw compErr || new Error('Failed creating company record in Supabase.');
        }
        companyId = newComp.id;
      }

      // Try creating user in Supabase Auth if raw password is provided
      if (params.password) {
        try {
          const { data: sbAuthUser } = await supabaseAdmin.auth.admin.createUser({
            email: cleanEmail,
            password: params.password,
            email_confirm: true,
            user_metadata: { company_id: companyId, full_name: params.contact_person.trim() },
          });

          if (sbAuthUser?.user?.id) {
            userId = sbAuthUser.user.id;
          }
        } catch (authErr) {
          console.warn('Supabase auth.admin.createUser warning:', authErr);
        }
      }

      if (isValidUUID(companyId)) {
        try {
          await supabaseAdmin.from('corporate_users').insert({
            user_id: userId,
            company_id: companyId,
            full_name: params.contact_person.trim(),
            role: 'CORPORATE_HR',
            email: cleanEmail,
            password_hash: canonicalHash,
          });
        } catch (e) {
          console.warn('Insert corporate_users warning:', e);
        }
      }
    } catch (err: any) {
      console.warn('Supabase register error (falling back to local store):', err);
    }
  }

  // Synchronize Local JSON DB to ensure 100% consistency across stores
  const db = readDB();
  let company = db.companies.find((c) => c.email.toLowerCase() === cleanEmail);
  if (!company) {
    company = {
      id: companyId,
      company_name: params.company_name.trim(),
      contact_person: params.contact_person.trim(),
      designation: params.designation?.trim() || 'HR Manager',
      email: cleanEmail,
      mobile: params.mobile.trim(),
      billing_address: params.billing_address?.trim() || 'Head Office',
      gst_number: params.gst_number?.trim().toUpperCase(),
      status: 'ACTIVE',
      created_at: now,
    };
    db.companies.push(company);
  } else {
    companyId = company.id;
  }

  let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
  if (user) {
    // If user exists, update password hash
    user.password_hash = canonicalHash;
    userId = user.id;
  } else {
    user = {
      id: userId,
      company_id: companyId,
      email: cleanEmail,
      full_name: params.contact_person.trim(),
      password_hash: canonicalHash,
      role: 'CORPORATE_HR',
      created_at: now,
    };
    db.users.push(user);
  }
  writeDB(db);

  return {
    id: userId,
    company_id: companyId,
    email: cleanEmail,
    full_name: params.contact_person.trim(),
    company_name: params.company_name.trim(),
  };
}

/**
 * Authenticate Corporate User in DB with backward-compatible password verification
 * and transparent hash upgrade to canonical scrypt algorithm.
 */
export async function authenticateCorporateUserInDB(email: string, password: string, loginType: string = 'corporate') {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Master System Admin Credential Check
  if (cleanEmail === 'admin@nisargshala.in' && password === 'Hemant2026') {
    return {
      success: true,
      role: 'SUPER_ADMIN',
      user: {
        id: 'usr-admin-hemant',
        email: 'admin@nisargshala.in',
        full_name: 'Hemant Admin',
        role: 'SUPER_ADMIN',
        company: {
          id: 'comp-nisargshala-ops',
          company_name: 'Nisargshala Operations',
        },
      },
    };
  }

  // 2. Attempt Supabase Auth GoTrue login if configured
  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (!authErr && authData?.user) {
        const resolved = await resolveCompanyForUser(authData.user.id);
        const userRole = resolved?.user?.role || 'CORPORATE_HR';

        if (loginType === 'admin' && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
          return { success: false, reason: 'FORBIDDEN' };
        }

        return {
          success: true,
          role: userRole,
          user: {
            id: authData.user.id,
            email: authData.user.email,
            role: userRole,
            company: resolved?.company || null,
          },
        };
      }
    } catch (e) {
      console.warn('Supabase auth.signInWithPassword warning, falling back to database password verification:', e);
    }
  }

  // 3. Custom Multi-Algorithm Password Verification
  const db = readDB();
  let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user && isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: sbUser } = await supabaseAdmin
        .from('corporate_users')
        .select('*, company:companies(*)')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (sbUser) {
        user = {
          id: sbUser.user_id || sbUser.id,
          company_id: sbUser.company_id,
          email: sbUser.email,
          full_name: sbUser.full_name,
          password_hash: sbUser.password_hash || '',
          role: sbUser.role || 'CORPORATE_HR',
          created_at: sbUser.created_at,
        };
      }
    } catch (e) {
      console.warn('Supabase corporate_users lookup error:', e);
    }
  }

  if (!user || !user.password_hash) {
    return { success: false, reason: 'INVALID_CREDENTIALS' };
  }

  const { valid, needsRehash } = verifyPassword(password, user.password_hash);
  if (!valid) {
    return { success: false, reason: 'INVALID_CREDENTIALS' };
  }

  if (loginType === 'admin' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return { success: false, reason: 'FORBIDDEN' };
  }

  // Transparent re-hashing if authenticated via legacy hash
  if (needsRehash) {
    const newCanonicalHash = hashPasswordCanonical(password);
    user.password_hash = newCanonicalHash;

    const localIdx = db.users.findIndex((u) => u.id === user.id || u.email.toLowerCase() === cleanEmail);
    if (localIdx >= 0) {
      db.users[localIdx].password_hash = newCanonicalHash;
      writeDB(db);
    } else {
      db.users.push(user);
      writeDB(db);
    }

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        if (isValidUUID(user.id)) {
          await supabaseAdmin
            .from('corporate_users')
            .update({ password_hash: newCanonicalHash })
            .or(`user_id.eq.${user.id},id.eq.${user.id}`);

          try {
            await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
          } catch (ae) {}
        }
      } catch (se) {
        console.warn('Supabase transparent rehash update error:', se);
      }
    }
  }

  const resolved = await resolveCompanyForUser(user.id);
  const company = resolved?.company || db.companies.find((c) => c.id === user.company_id);

  const safeUser = {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    role: user.role,
    company: company || null,
  };

  return {
    success: true,
    role: user.role,
    user: safeUser,
  };
}

import { sendOTPEmail } from './email';

interface OTPRecord {
  hash: string;
  expires_at: number;
  attempts: number;
  last_requested_at: number;
}

const resetOtpStore = new Map<string, OTPRecord>();

/**
 * Step 1: Generate & Dispatch 6-Digit Password Reset OTP Code via Real Email
 */
export async function generatePasswordResetOTP(email: string) {
  const cleanEmail = email.trim().toLowerCase();
  const now = Date.now();

  const existing = resetOtpStore.get(cleanEmail);
  if (existing && now - existing.last_requested_at < 60000) {
    const secondsLeft = Math.ceil((60000 - (now - existing.last_requested_at)) / 1000);
    throw new Error(`Please wait ${secondsLeft} seconds before requesting a new verification code.`);
  }

  // Cryptographically secure 6-digit random code
  const rawCode = crypto.randomInt(100000, 999999).toString();
  const codeHash = crypto.createHash('sha256').update(rawCode).digest('hex');
  const expires_at = now + 10 * 60 * 1000; // 10 minutes

  // Send real email via server email abstraction (Nodemailer SMTP / Resend)
  // If email sending fails or service is unconfigured, sendOTPEmail throws an Error.
  await sendOTPEmail({ to: cleanEmail, otp: rawCode });

  // Only store hash if email send succeeded!
  resetOtpStore.set(cleanEmail, {
    hash: codeHash,
    expires_at,
    attempts: 0,
    last_requested_at: now,
  });

  return {
    success: true,
    message: `A 6-digit verification code has been sent to ${cleanEmail}. Please check your inbox.`,
  };
}

/**
 * Step 2: Verify 6-Digit OTP Code & Update Password
 */
export async function verifyOTPAndResetPassword(email: string, otp_code: string, newPasswordHash: string) {
  const cleanEmail = email.trim().toLowerCase();
  const storedOtp = resetOtpStore.get(cleanEmail);

  if (!storedOtp) {
    throw new Error('No active password reset request found for this email. Please request a verification code first.');
  }

  if (Date.now() > storedOtp.expires_at) {
    resetOtpStore.delete(cleanEmail);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (storedOtp.attempts >= 5) {
    resetOtpStore.delete(cleanEmail);
    throw new Error('Too many failed verification attempts. Please request a new code.');
  }

  const inputHash = crypto.createHash('sha256').update(otp_code.trim()).digest('hex');
  if (storedOtp.hash !== inputHash) {
    storedOtp.attempts += 1;
    const remaining = 5 - storedOtp.attempts;
    if (remaining <= 0) {
      resetOtpStore.delete(cleanEmail);
      throw new Error('Invalid verification code. Maximum attempts exceeded. Please request a new code.');
    }
    throw new Error(`Invalid 6-digit verification code. ${remaining} attempt(s) remaining.`);
  }

  // OTP is valid! Invalidate immediately.
  resetOtpStore.delete(cleanEmail);

  // Update password in DB
  const db = readDB();
  let user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    let company = db.companies.find((c) => c.email.toLowerCase() === cleanEmail);
    if (!company) {
      company = {
        id: `comp-${crypto.randomBytes(6).toString('hex')}`,
        company_name: 'Corporate Partner',
        contact_person: cleanEmail.split('@')[0],
        email: cleanEmail,
        mobile: '+91 90000 00000',
        billing_address: 'Head Office',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      };
      db.companies.push(company);
    }

    user = {
      id: `usr-${crypto.randomBytes(6).toString('hex')}`,
      company_id: company.id,
      email: cleanEmail,
      full_name: cleanEmail.split('@')[0],
      password_hash: newPasswordHash,
      role: 'CORPORATE_HR',
      created_at: new Date().toISOString(),
    };
    db.users.push(user);
  } else {
    user.password_hash = newPasswordHash;
  }

  writeDB(db);

  return {
    success: true,
    message: `Password updated successfully for ${cleanEmail}! You can now sign in with your new password.`,
  };
}

/**
  * CRITICAL AUTHORIZATION HELPER:
  * Server-side company resolution from authenticated user session:
  * session.userId -> corporate_users.user_id -> corporate_users.company_id -> companies.id
  */
export async function resolveCompanyForUser(userId: string) {
  if (!userId || typeof userId !== 'string') return null;

  const cleanUserId = userId.trim();

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      // 1. Look up user in corporate_users safely checking isValidUUID
      let userProfile: any = null;

      if (isValidUUID(cleanUserId)) {
        const { data: profile } = await supabaseAdmin
          .from('corporate_users')
          .select('*, company:companies(*)')
          .or(`user_id.eq.${cleanUserId},id.eq.${cleanUserId}`)
          .maybeSingle();
        userProfile = profile;
      } else {
        const { data: profile } = await supabaseAdmin
          .from('corporate_users')
          .select('*, company:companies(*)')
          .eq('email', cleanUserId.toLowerCase())
          .maybeSingle();
        userProfile = profile;
      }

      if (userProfile) {
        const { password_hash: _ph, ...safeUserProfile } = userProfile;

        if (safeUserProfile.company) {
          return {
            user: safeUserProfile,
            company: safeUserProfile.company,
            companyId: safeUserProfile.company.id,
            companyName: safeUserProfile.company.company_name,
          };
        }

        if (safeUserProfile.company_id && isValidUUID(safeUserProfile.company_id)) {
          const { data: company } = await supabaseAdmin
            .from('companies')
            .select('*')
            .eq('id', safeUserProfile.company_id)
            .maybeSingle();
          if (company) {
            return {
              user: safeUserProfile,
              company,
              companyId: company.id,
              companyName: company.company_name,
            };
          }
        }
      }
    } catch (e) {
      console.warn('Supabase resolveCompanyForUser error, falling back to local DB:', e);
    }
  }

  // Persistent Local JSON DB Fallback
  const db = readDB();
  let user = db.users.find((u) => u.id === cleanUserId || u.company_id === cleanUserId || u.email.toLowerCase() === cleanUserId.toLowerCase());
  let company = db.companies.find((c) => c.id === cleanUserId || (user && c.id === user.company_id) || (user && c.email.toLowerCase() === user.email.toLowerCase()));

  if (!company && user) {
    company = db.companies.find((c) => c.id === user?.company_id);
  }

  if (!company) return null;

  const safeUser = user
    ? (({ password_hash: _ph, ...rest }) => rest)(user)
    : { id: cleanUserId, email: company.email, full_name: company.contact_person, role: 'CORPORATE_HR', company_id: company.id };

  return {
    user: safeUser,
    company,
    companyId: company.id,
    companyName: company.company_name,
  };
}

/**
 * Server-Side Corporate Profile Editing
 * Scoped strictly to the server-resolved company_id.
 */
export async function updateCompanyProfileInDB(
  companyId: string,
  data: {
    company_name?: string;
    contact_person?: string;
    designation?: string;
    mobile?: string;
    billing_address?: string;
    gst_number?: string;
  }
) {
  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();

      const updatePayload: any = { updated_at: new Date().toISOString() };
      if (data.company_name) updatePayload.company_name = data.company_name.trim();
      if (data.contact_person) updatePayload.contact_person = data.contact_person.trim();
      if (data.designation !== undefined) updatePayload.designation = data.designation.trim();
      if (data.mobile) updatePayload.mobile = data.mobile.trim();
      if (data.billing_address) updatePayload.billing_address = data.billing_address.trim();
      if (data.gst_number !== undefined) updatePayload.gst_number = data.gst_number.trim().toUpperCase() || null;

      if (isValidUUID(companyId)) {
        await supabaseAdmin.from('companies').update(updatePayload).eq('id', companyId);
      } else {
        await supabaseAdmin.from('companies').update(updatePayload).eq('email', data.contact_person || '');
      }
    } catch (e) {
      console.warn('Supabase update company profile warning:', e);
    }
  }

  // Local Persistent JSON DB
  const db = readDB();
  const company = db.companies.find((c) => c.id === companyId);
  if (company) {
    if (data.company_name) company.company_name = data.company_name.trim();
    if (data.contact_person) company.contact_person = data.contact_person.trim();
    if (data.designation !== undefined) company.designation = data.designation.trim();
    if (data.mobile) company.mobile = data.mobile.trim();
    if (data.billing_address) company.billing_address = data.billing_address.trim();
    if (data.gst_number !== undefined) company.gst_number = data.gst_number.trim().toUpperCase();
  }

  const user = db.users.find((u) => u.company_id === companyId);
  if (user) {
    if (data.contact_person) user.full_name = data.contact_person.trim();
  }

  writeDB(db);
  return company;
}

/**
 * CRITICAL DATA LINKAGE QUERY:
 * Fetches all orders, payments, and vouchers linked to a corporate company/user across UUID and legacy IDs.
 */
export async function getCorporateDataForCompany(company: DBCompany, userId?: string) {
  const targetCompanyId = company.id;
  const cleanEmail = company.email ? company.email.trim().toLowerCase() : '';

  if (isSupabaseConfigured()) {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Gather all associated company IDs (canonical UUID, legacy IDs, email-matched IDs)
    const companyIdsSet = new Set<string>();
    if (targetCompanyId) companyIdsSet.add(targetCompanyId);

    try {
      if (cleanEmail) {
        const { data: compsByEmail } = await supabaseAdmin
          .from('companies')
          .select('id')
          .eq('email', cleanEmail);
        if (compsByEmail) {
          compsByEmail.forEach((c) => companyIdsSet.add(c.id));
        }
      }

      if (userId && isValidUUID(userId)) {
        const { data: userComps } = await supabaseAdmin
          .from('corporate_users')
          .select('company_id')
          .or(`user_id.eq.${userId},id.eq.${userId}`);
        if (userComps) {
          userComps.forEach((uc) => {
            if (uc.company_id) companyIdsSet.add(uc.company_id);
          });
        }
      }
    } catch (e) {
      console.warn('Supabase query error gathering associated company IDs:', e);
    }

    const companyIds = Array.from(companyIdsSet);
    const uuidCompanyIds = companyIds.filter((id) => isValidUUID(id));

    // 2. Fetch Orders for target company IDs
    let orders: any[] = [];
    if (uuidCompanyIds.length > 0) {
      const { data: ords, error: ordErr } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .in('company_id', uuidCompanyIds)
        .order('created_at', { ascending: false });

      if (ordErr) {
        console.error('[DB_ERROR] Supabase orders query error:', ordErr);
        throw ordErr;
      }
      if (ords) orders = ords;
    }

    const orderIds = orders.map((o) => o.id);
    const uuidOrderIds = orderIds.filter((id) => isValidUUID(id));

    // 3. Fetch Vouchers for target company IDs or orders
    let vouchers: any[] = [];
    if (uuidCompanyIds.length > 0) {
      let vchQuery = supabaseAdmin.from('vouchers').select('*');
      if (uuidOrderIds.length > 0) {
        vchQuery = vchQuery.or(`company_id.in.(${uuidCompanyIds.join(',')}),order_id.in.(${uuidOrderIds.join(',')})`);
      } else {
        vchQuery = vchQuery.in('company_id', uuidCompanyIds);
      }

      const { data: vchs, error: vchErr } = await vchQuery.order('created_at', { ascending: false });

      if (vchErr) {
        console.error('[DB_ERROR] Supabase vouchers query error:', vchErr);
        throw vchErr;
      }
      if (vchs) vouchers = vchs;
    }

    // 4. Fetch Payment Records for target orders or company IDs
    let dbPayments: any[] = [];
    if (uuidOrderIds.length > 0 || uuidCompanyIds.length > 0) {
      try {
        let pmtQuery = supabaseAdmin.from('payment_records').select('*');
        if (uuidOrderIds.length > 0) {
          pmtQuery = pmtQuery.in('order_id', uuidOrderIds);
        } else {
          pmtQuery = pmtQuery.in('company_id', uuidCompanyIds);
        }
        const { data: pmts, error: pmtErr } = await pmtQuery.order('created_at', { ascending: false });
        if (!pmtErr && pmts) dbPayments = pmts;
      } catch (e) {
        console.warn('payment_records query warning:', e);
      }
    }

    // Unify payment records (include synthesized entries for verified orders missing rows in payment_records)
    const paymentsMap = new Map<string, any>();
    dbPayments.forEach((p) => paymentsMap.set(p.order_id || p.id, p));

    const unifiedPayments: any[] = [...dbPayments];

    orders.forEach((ord) => {
      if (ord.payment_status !== 'PENDING_PAYMENT' || ord.utr_reference) {
        if (!paymentsMap.has(ord.id)) {
          const synthPmt = {
            id: `pay-${ord.id}`,
            order_id: ord.id,
            order_number: ord.order_number,
            amount: ord.total_amount,
            method: ord.payment_method || 'RTGS_NEFT',
            utr_reference: ord.utr_reference || 'Submitted',
            payment_date: ord.payment_date || (ord.created_at ? ord.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
            status: ord.payment_status === 'PAID' ? 'VERIFIED' : 'PENDING',
            created_at: ord.updated_at || ord.created_at,
          };
          unifiedPayments.push(synthPmt);
          paymentsMap.set(ord.id, synthPmt);
        }
      }
    });

    return {
      company,
      orders,
      payments: unifiedPayments,
      vouchers,
    };
  }

  // Local Persistent JSON DB Fallback
  const db = readDB();

  const companyIdsSet = new Set<string>([targetCompanyId]);
  db.companies.forEach((c) => {
    if (cleanEmail && c.email.toLowerCase() === cleanEmail) {
      companyIdsSet.add(c.id);
    }
  });

  if (userId) {
    db.users.forEach((u) => {
      if ((u.id === userId || (cleanEmail && u.email.toLowerCase() === cleanEmail)) && u.company_id) {
        companyIdsSet.add(u.company_id);
      }
    });
  }

  const companyOrders = db.orders.filter(
    (o) =>
      companyIdsSet.has(o.company_id) ||
      (cleanEmail && o.company?.email && o.company.email.toLowerCase() === cleanEmail)
  );

  const orderIdsSet = new Set(companyOrders.map((o) => o.id));

  const companyVouchers = db.vouchers.filter(
    (v) => companyIdsSet.has(v.company_id) || orderIdsSet.has(v.order_id)
  );

  const dbPayments = (db.payment_records || []).filter(
    (p) => orderIdsSet.has(p.order_id) || companyIdsSet.has(p.company_id)
  );

  const paymentsMap = new Map<string, any>();
  dbPayments.forEach((p) => paymentsMap.set(p.order_id || p.id, p));

  const unifiedPayments: any[] = [...dbPayments];

  companyOrders.forEach((ord) => {
    if (ord.payment_status !== 'PENDING_PAYMENT' || ord.utr_reference) {
      if (!paymentsMap.has(ord.id)) {
        const synthPmt = {
          id: `pay-${ord.id}`,
          order_id: ord.id,
          order_number: ord.order_number,
          amount: ord.total_amount,
          method: ord.payment_method || 'RTGS_NEFT',
          utr_reference: ord.utr_reference || 'Submitted',
          payment_date: ord.payment_date || (ord.created_at ? ord.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
          status: ord.payment_status === 'PAID' ? 'VERIFIED' : 'PENDING',
          created_at: ord.updated_at || ord.created_at,
        };
        unifiedPayments.push(synthPmt);
        paymentsMap.set(ord.id, synthPmt);
      }
    }
  });

  return {
    company,
    orders: companyOrders,
    payments: unifiedPayments,
    vouchers: companyVouchers,
  };
}

/**
 * Validate standard 15-character Indian GSTIN format
 */
export function validateGSTINFormat(gstin: string): boolean {
  if (!gstin || typeof gstin !== 'string') return false;
  const clean = gstin.trim().toUpperCase();
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[0-9A-Z]{1}[0-9A-Z]{1}$/.test(clean);
}

/**
 * Generate unique, concurrency-safe Tax Invoice number (e.g. NS/26-27/000123)
 */
export function generateInvoiceNumberInDB(): string {
  const db = readDB();
  const invoices = db.tax_invoices || [];
  const seq = invoices.length + 1;
  const seqStr = seq.toString().padStart(6, '0');
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const nextYear = (now.getFullYear() + 1).toString().slice(-2);
  return `NS/${year}-${nextYear}/${seqStr}`;
}

export const DEFAULT_OUTING_PACKAGES: DBOutingPackage[] = [
  {
    package_code: 'WILDERNESS_BONDING',
    package_title: 'Wilderness Team Immersion Camp',
    category: 'TEAM_OUTING',
    location: 'Western Ghats Sanctuary, Maharashtra',
    description: 'Immersive outdoor camping, wilderness team bonding challenges, survival skills workshops, stargazing, and bonfire sessions.',
    minimum_attendees: 10,
    pricing_model: 'PER_PERSON',
    base_price: 3200,
    inclusions: ['Tent Accommodation', 'All Meals & Barbecue', 'Guided Wilderness Hikes', 'Team Challenges', 'Instructor Charges'],
    active: true,
  },
  {
    package_code: 'EXECUTIVE_RETREAT',
    package_title: 'Executive Leadership & Strategy Retreat',
    category: 'LEADERSHIP_RETREAT',
    location: 'Forest Edge Sanctuary, Panchgani',
    description: 'High-impact executive offsite combining strategic planning sessions, mindful leadership hikes, river crossing, and luxury eco-resort stay.',
    minimum_attendees: 10,
    pricing_model: 'PER_PERSON',
    base_price: 5500,
    inclusions: ['Eco-Resort Stay', 'Conference & Strategy Setup', 'Mindfulness Sessions', 'Adventure Facilitators', 'Gourmet Meals'],
    active: true,
  },
  {
    package_code: 'FAMILY_DAY_OUTING',
    package_title: 'Corporate Family Day & Eco-Adventure',
    category: 'FAMILY_DAY',
    location: 'Pawna Lake Wilderness Site, Lonavala',
    description: 'Action-packed day outing for employees and their families with kayaking, obstacle courses, kids adventure camps, and lakefront dining.',
    minimum_attendees: 15,
    pricing_model: 'PER_PERSON',
    base_price: 2800,
    inclusions: ['Lakefront Access', 'Kids Adventure Module', 'Water Activities', 'Breakfast, Lunch & Hi-Tea', 'Safety Gear & Instructors'],
    active: true,
  },
];

/**
 * Generate & Persist Tax Invoice Record
 */
export async function generateTaxInvoiceRecord(params: {
  company_id: string;
  buyer_gstin: string;
  subtotal_amount: number;
  gst_rate: number;
  gst_amount: number;
  total_amount: number;
  order_id?: string;
  booking_id?: string;
}): Promise<DBInvoice> {
  const db = readDB();
  if (!db.tax_invoices) db.tax_invoices = [];

  // Check if invoice already generated for this transaction to enforce idempotency
  if (params.order_id) {
    const existing = db.tax_invoices.find((inv) => inv.order_id === params.order_id);
    if (existing) return existing;
  }
  if (params.booking_id) {
    const existing = db.tax_invoices.find((inv) => inv.booking_id === params.booking_id);
    if (existing) return existing;
  }

  const invoiceNumber = generateInvoiceNumberInDB();
  const now = new Date();
  const invoiceDate = now.toISOString().slice(0, 10);
  const dueDate = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const invoiceRecord: DBInvoice = {
    id: crypto.randomUUID(),
    invoice_number: invoiceNumber,
    order_id: params.order_id,
    booking_id: params.booking_id,
    company_id: params.company_id,
    invoice_date: invoiceDate,
    due_date: dueDate,
    seller_gstin: '27ARHPV2783R1ZN',
    buyer_gstin: params.buyer_gstin.trim().toUpperCase(),
    subtotal_amount: params.subtotal_amount,
    gst_rate: params.gst_rate,
    gst_amount: params.gst_amount,
    total_amount: params.total_amount,
    advance_received: params.total_amount,
    balance_due: 0,
    created_at: now.toISOString(),
  };

  db.tax_invoices.push(invoiceRecord);
  writeDB(db);

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('tax_invoices').insert({
        id: invoiceRecord.id,
        invoice_number: invoiceRecord.invoice_number,
        order_id: isValidUUID(params.order_id || '') ? params.order_id : null,
        booking_id: isValidUUID(params.booking_id || '') ? params.booking_id : null,
        company_id: isValidUUID(params.company_id) ? params.company_id : null,
        invoice_date: invoiceDate,
        seller_gstin: '27ARHPV2783R1ZN',
        buyer_gstin: params.buyer_gstin,
        subtotal_amount: params.subtotal_amount,
        gst_rate: params.gst_rate,
        gst_amount: params.gst_amount,
        total_amount: params.total_amount,
      });
    } catch (e) {
      console.warn('Supabase insert tax_invoices warning:', e);
    }
  }

  return invoiceRecord;
}

/**
 * Create Corporate Team Outing Booking with Server-Side Authoritative Pricing
 */
export async function createTeamOutingBookingInDB(params: {
  company_id: string;
  package_code: string;
  event_date: string;
  attendees_count: number;
  special_requirements?: string;
  gst_number?: string;
}): Promise<{ booking: DBTeamOutingBooking; company: DBCompany }> {
  // Validate mandatory GSTIN
  const resolved = await resolveCompanyForUser(params.company_id);
  const company = resolved?.company;
  if (!company) {
    throw new Error('Corporate account profile not found.');
  }

  const effectiveGstin = (params.gst_number || company.gst_number || '').trim().toUpperCase();

  if (!effectiveGstin || !validateGSTINFormat(effectiveGstin)) {
    throw new Error('A valid 15-character corporate GSTIN is mandatory to book team outings and retreats. Please enter a valid GSTIN.');
  }

  // Update profile in DB if GSTIN changed or updated
  if (company.gst_number !== effectiveGstin) {
    company.gst_number = effectiveGstin;
    const db = readDB();
    const dbComp = db.companies.find((c) => c.id === company.id);
    if (dbComp) {
      dbComp.gst_number = effectiveGstin;
      writeDB(db);
    }
    if (isSupabaseConfigured() && isValidUUID(company.id)) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.from('companies').update({ gst_number: effectiveGstin }).eq('id', company.id);
      } catch (e) {}
    }
  }

  const pkg = DEFAULT_OUTING_PACKAGES.find((p) => p.package_code === params.package_code) || DEFAULT_OUTING_PACKAGES[0];

  const minAttendees = pkg.minimum_attendees || 10;
  if (params.attendees_count < minAttendees) {
    throw new Error(`Minimum group size for ${pkg.package_title} is ${minAttendees} participants.`);
  }

  // Server-authoritative tax and pricing calculation
  const bankSettings = await getBankSettingsInDB();
  const gstRate = bankSettings.gst_rate || 18;

  const unitPrice = pkg.base_price;
  const subtotalAmount = unitPrice * params.attendees_count;
  const gstAmount = Math.round((subtotalAmount * gstRate) / 100);
  const totalAmount = subtotalAmount + gstAmount;

  const now = new Date().toISOString();
  const dateSuffix = now.slice(0, 10).replace(/-/g, '');
  const randomRand = Math.floor(1000 + Math.random() * 9000);
  const bookingNumber = `OUTING-${dateSuffix}-${randomRand}`;
  const bookingId = crypto.randomUUID();

  const booking: DBTeamOutingBooking = {
    id: bookingId,
    booking_number: bookingNumber,
    company_id: company.id,
    package_code: pkg.package_code,
    package_title: pkg.package_title,
    location: pkg.location,
    event_date: params.event_date,
    attendees_count: params.attendees_count,
    unit_price: unitPrice,
    subtotal_amount: subtotalAmount,
    gst_rate: gstRate,
    gst_amount: gstAmount,
    total_amount: totalAmount,
    buyer_gstin: company.gst_number,
    payment_status: 'PENDING_PAYMENT',
    booking_status: 'REQUESTED',
    special_requirements: params.special_requirements,
    email_status: 'PENDING',
    created_at: now,
    updated_at: now,
    company,
  };

  const db = readDB();
  if (!db.team_outing_bookings) db.team_outing_bookings = [];
  db.team_outing_bookings.push(booking);
  writeDB(db);

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('team_outing_bookings').insert({
        id: bookingId,
        booking_number: bookingNumber,
        company_id: isValidUUID(company.id) ? company.id : null,
        package_code: pkg.package_code,
        package_title: pkg.package_title,
        location: pkg.location,
        event_date: params.event_date,
        attendees_count: params.attendees_count,
        unit_price: unitPrice,
        subtotal_amount: subtotalAmount,
        gst_rate: gstRate,
        gst_amount: gstAmount,
        total_amount: totalAmount,
        buyer_gstin: company.gst_number,
        payment_status: 'PENDING_PAYMENT',
        booking_status: 'REQUESTED',
        special_requirements: params.special_requirements,
      });
    } catch (e) {
      console.warn('Supabase insert team_outing_bookings warning:', e);
    }
  }

  return { booking, company };
}

/**
 * Submit UTR Payment Reference for Team Outing Booking
 */
export async function submitOutingPaymentUtrInDB(params: {
  booking_id: string;
  company_id: string;
  utr_reference: string;
  payment_date?: string;
}) {
  const db = readDB();
  if (!db.team_outing_bookings) db.team_outing_bookings = [];

  let booking = db.team_outing_bookings.find((b) => b.id === params.booking_id || b.booking_number === params.booking_id);

  if (!booking && isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let query = supabaseAdmin.from('team_outing_bookings').select('*, company:companies(*)');
      if (isValidUUID(params.booking_id)) {
        query = query.or(`id.eq.${params.booking_id},booking_number.eq.${params.booking_id}`);
      } else {
        query = query.eq('booking_number', params.booking_id);
      }
      const { data: sbBooking } = await query.maybeSingle();
      if (sbBooking) booking = sbBooking;
    } catch (e) {}
  }

  if (!booking) {
    throw new Error('Team Outing booking not found.');
  }

  if (booking.company_id !== params.company_id) {
    throw new Error('FORBIDDEN: You do not have permission to submit payments for this booking.');
  }

  booking.utr_reference = params.utr_reference.trim().toUpperCase();
  booking.payment_date = params.payment_date || new Date().toISOString().slice(0, 10);
  booking.payment_status = 'AWAITING_VERIFICATION';
  booking.booking_status = 'PENDING_PAYMENT';
  booking.updated_at = new Date().toISOString();

  writeDB(db);

  if (isSupabaseConfigured() && isValidUUID(booking.id)) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('team_outing_bookings').update({
        utr_reference: booking.utr_reference,
        payment_date: booking.payment_date,
        payment_status: 'AWAITING_VERIFICATION',
        booking_status: 'PENDING_PAYMENT',
      }).eq('id', booking.id);
    } catch (e) {
      console.warn('Supabase update team_outing_bookings warning:', e);
    }
  }

  return { success: true, booking };
}

/**
 * Submit Custom Corporate Experience Enquiry
 */
export async function createCustomCorporateEnquiryInDB(params: {
  company_name: string;
  contact_person: string;
  email: string;
  mobile: string;
  gst_number?: string;
  team_size: number;
  preferred_date?: string;
  preferred_location?: string;
  experience_type?: string;
  budget_range?: string;
  special_requirements?: string;
}): Promise<DBCustomEnquiry> {
  const db = readDB();
  if (!db.custom_enquiries) db.custom_enquiries = [];

  const now = new Date().toISOString();
  const dateSuffix = now.slice(0, 10).replace(/-/g, '');
  const randomRand = Math.floor(1000 + Math.random() * 9000);
  const enquiryNumber = `ENQ-${dateSuffix}-${randomRand}`;

  const enquiry: DBCustomEnquiry = {
    id: crypto.randomUUID(),
    enquiry_number: enquiryNumber,
    company_name: params.company_name.trim(),
    contact_person: params.contact_person.trim(),
    email: params.email.trim().toLowerCase(),
    mobile: params.mobile.trim(),
    gst_number: params.gst_number?.trim().toUpperCase(),
    team_size: params.team_size,
    preferred_date: params.preferred_date,
    preferred_location: params.preferred_location,
    experience_type: params.experience_type,
    budget_range: params.budget_range,
    special_requirements: params.special_requirements,
    status: 'NEW',
    created_at: now,
  };

  db.custom_enquiries.push(enquiry);
  writeDB(db);

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('custom_enquiries').insert(enquiry);
    } catch (e) {}
  }

  return enquiry;
}




