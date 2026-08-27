import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured, isValidUUID } from '@/lib/supabase';
import { generateBulkOrderVouchersZip } from '@/lib/pdfGenerator';
import { sendVouchersConfirmationEmail } from '@/lib/email';
import { LOCKED_VOUCHER_PRODUCTS } from '@/lib/pricing';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  // 1. Verify Admin session
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' }, { status: 401 });
  }

  let adminSession: any;
  try {
    adminSession = JSON.parse(adminCookie);
  } catch (e) {
    return NextResponse.json({ error: 'INVALID_SESSION', message: 'Invalid admin session cookie.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { order_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'MISSING_ORDER_ID', message: 'Order ID is required.' }, { status: 400 });
    }

    // 2. Fetch existing order and vouchers (NO GENERATION OF NEW VOUCHERS)
    let order: any = null;
    let vouchers: any[] = [];
    let companyName = 'Nisargshala Corporate Client';
    let recipientEmail = '';

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        
        let ordQuery = supabaseAdmin.from('orders').select('*, company:companies(*)');
        if (isValidUUID(order_id)) {
          ordQuery = ordQuery.or(`id.eq.${order_id},order_number.eq.${order_id}`);
        } else {
          ordQuery = ordQuery.eq('order_number', order_id);
        }
        const { data: dbOrd } = await ordQuery.maybeSingle();

        if (dbOrd) {
          order = dbOrd;
          companyName = dbOrd.company?.company_name || companyName;
          recipientEmail = dbOrd.company?.email || recipientEmail;

          let vchQuery = supabaseAdmin.from('vouchers').select('*');
          if (isValidUUID(dbOrd.id)) {
            vchQuery = vchQuery.or(`order_id.eq.${dbOrd.id},company_id.eq.${dbOrd.company_id}`);
          } else {
            vchQuery = vchQuery.eq('company_id', dbOrd.company_id);
          }
          const { data: dbVchs } = await vchQuery;
          if (dbVchs) vouchers = dbVchs;
        }
      } catch (e) {
        console.warn('Supabase resend fetch warning:', e);
      }
    }

    if (!order) {
      const db = readDB();
      order = db.orders.find((o) => o.id === order_id || o.order_number === order_id);
      if (order) {
        const comp = db.companies.find((c) => c.id === order.company_id);
        if (comp) {
          companyName = comp.company_name;
          recipientEmail = comp.email;
        }
        vouchers = db.vouchers.filter((v) => v.order_id === order.id || v.company_id === order.company_id);
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'ORDER_NOT_FOUND', message: 'Order reference not found.' }, { status: 404 });
    }

    if (!recipientEmail) {
      return NextResponse.json({ error: 'EMAIL_MISSING', message: 'No registered recipient email address found for this order.' }, { status: 400 });
    }

    if (!vouchers || vouchers.length === 0) {
      return NextResponse.json({ error: 'NO_VOUCHERS_FOUND', message: 'No existing vouchers found for this order. Payment must be verified first.' }, { status: 400 });
    }

    // 3. Format existing vouchers and generate ZIP package WITHOUT creating new vouchers
    const formattedVouchers = vouchers.map((v: any) => {
      const pDef = LOCKED_VOUCHER_PRODUCTS[v.product_code as keyof typeof LOCKED_VOUCHER_PRODUCTS];
      return {
        humanRef: v.human_ref,
        redemptionCode: v.redemption_code,
        productTitle: pDef ? pDef.title : `${v.product_code} Experience Voucher`,
        voucherValue: v.voucher_value,
        companyName,
        issueDate: v.issue_date ? new Date(v.issue_date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        expiryDate: v.expiry_date ? new Date(v.expiry_date).toISOString().slice(0, 10) : new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
        eligibleExperiences: pDef ? pDef.eligibleExperiences : [],
        terms: [
          'Valid for 12 months from issue date.',
          'Redeemable exclusively on nisargshala.in.',
          'Single-use voucher. Non-refundable for cash.',
        ],
        assignedEmployee: v.assigned_employee_name || undefined,
      };
    });

    const zipBuffer = await generateBulkOrderVouchersZip(formattedVouchers);

    const emailRes = await sendVouchersConfirmationEmail({
      to: recipientEmail,
      companyName,
      orderNumber: order.order_number || order_id,
      totalAmount: order.total_amount || 0,
      vouchersCount: vouchers.length,
      zipBuffer,
      customerGstin: order.company?.gst_number,
    });

    await logAuditEvent({
      actorId: adminSession.userId,
      actorType: 'ADMIN',
      action: 'VOUCHER_EMAIL_RESENT',
      entityType: 'ORDER',
      entityId: order.id,
      metadata: { recipient_email: recipientEmail, vouchers_count: vouchers.length },
    });

    return NextResponse.json({
      success: true,
      message: `Voucher email package successfully resent to ${recipientEmail} (${vouchers.length} existing vouchers attached).`,
      email_sent: Boolean(emailRes.success),
    });
  } catch (err: any) {
    console.error('Resend vouchers API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Failed to resend voucher email.' }, { status: 500 });
  }
}
