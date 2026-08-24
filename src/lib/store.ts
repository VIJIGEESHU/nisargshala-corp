import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseAdmin, isSupabaseConfigured } from './supabase';
import { generateSecureRedemptionCode, generateHumanReference, generateOrderNumber } from './voucherCode';
import { LOCKED_VOUCHER_PRODUCTS, calculateOrderTotal } from './pricing';

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

export interface DatabaseSchema {
  companies: DBCompany[];
  users: DBCorporateUser[];
  orders: DBOrder[];
  order_items: DBOrderItem[];
  vouchers: DBVoucher[];
  payment_records: any[];
  audit_logs: any[];
}

// Initial Admin Password Hash for "Hemant2026"
const INITIAL_ADMIN_HASH = crypto.createHash('sha256').update('Hemant2026').digest('hex');

function getInitialDB(): DatabaseSchema {
  return {
    companies: [
      {
        id: 'comp-nisargshala-demo',
        company_name: 'Acme India Pvt Ltd',
        contact_person: 'Rahul Sharma',
        designation: 'HR Lead',
        email: 'hr@acme.in',
        mobile: '+91 98765 43210',
        billing_address: 'Kothrud, Pune, Maharashtra 411038',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
      },
    ],
    users: [
      {
        id: 'usr-admin-hemant',
        company_id: 'comp-nisargshala-demo',
        email: 'admin@nisargshala.in',
        full_name: 'Hemant Admin',
        password_hash: INITIAL_ADMIN_HASH,
        role: 'SUPER_ADMIN',
        created_at: new Date().toISOString(),
      },
      {
        id: 'usr-hr-acme',
        company_id: 'comp-nisargshala-demo',
        email: 'hr@acme.in',
        full_name: 'Rahul Sharma',
        password_hash: crypto.createHash('sha256').update('Acme2026').digest('hex'),
        role: 'CORPORATE_HR',
        created_at: new Date().toISOString(),
      },
    ],
    orders: [],
    order_items: [],
    vouchers: [],
    payment_records: [],
    audit_logs: [],
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
    } catch (e) {}
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
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch or create company
    let companyId: string;
    const { data: existingComp } = await supabaseAdmin
      .from('companies')
      .select('id')
      .eq('email', params.email.trim().toLowerCase())
      .single();

    if (existingComp) {
      companyId = existingComp.id;
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
  }

  // Local Persistent JSON DB File
  const db = readDB();

  let company = db.companies.find((c) => c.email.toLowerCase() === params.email.trim().toLowerCase());
  if (!company) {
    company = {
      id: `comp-${crypto.randomBytes(6).toString('hex')}`,
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

  const orderId = `ord-${crypto.randomBytes(6).toString('hex')}`;
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
    id: `item-${crypto.randomBytes(4).toString('hex')}`,
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
    const supabaseAdmin = getSupabaseAdmin();

    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('*, company:companies(*), items:order_items(*)')
      .eq('id', orderId)
      .single();

    if (error || !order) throw new Error('Order not found in Supabase DB.');
    if (order.payment_status === 'PAID') throw new Error('Order is already PAID.');

    const { count } = await supabaseAdmin.from('vouchers').select('*', { count: 'exact', head: true });
    let sequenceCounter = (count || 0) + 1;

    const vouchersToInsert: any[] = [];
    const existingCodes = new Set<string>();

    for (const item of order.items) {
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

  // Local Persistent JSON DB File
  const db = readDB();
  const order = db.orders.find((o) => o.id === orderId);

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
        id: `vch-${crypto.randomBytes(6).toString('hex')}`,
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
