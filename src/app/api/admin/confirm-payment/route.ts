import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentAndGenerateVouchersInDB, readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { generateBulkOrderVouchersZip } from '@/lib/pdfGenerator';
import { sendVouchersConfirmationEmail } from '@/lib/email';
import { LOCKED_VOUCHER_PRODUCTS } from '@/lib/pricing';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  // Verify Admin session
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { order_id, admin_id } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'MISSING_ORDER_ID', message: 'Order ID is required.' }, { status: 400 });
    }

    // 1. Confirm payment & generate distinct voucher instruments
    const { vouchersCount, vouchers } = await confirmPaymentAndGenerateVouchersInDB(order_id, admin_id);

    // 2. Fetch order & company information for email dispatch
    const db = readDB();
    let order = db.orders.find((o) => o.id === order_id);
    let companyName = 'Nisargshala Corporate Client';
    let recipientEmail = '';
    let orderNumber = order?.order_number || order_id;
    let totalAmount = order?.total_amount || 0;

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: sbOrder } = await supabaseAdmin
          .from('orders')
          .select('*, company:companies(*)')
          .eq('id', order_id)
          .single();

        if (sbOrder) {
          orderNumber = sbOrder.order_number || orderNumber;
          totalAmount = sbOrder.total_amount || totalAmount;
          companyName = sbOrder.company?.company_name || companyName;
          recipientEmail = sbOrder.company?.email || recipientEmail;
        }
      } catch (e) {
        console.warn('Supabase fetch order for email warning:', e);
      }
    }

    if (!recipientEmail && order) {
      const comp = db.companies.find((c) => c.id === order.company_id);
      if (comp) {
        companyName = comp.company_name;
        recipientEmail = comp.email;
      }
    }

    // Fallback recipient email if missing
    if (!recipientEmail && vouchers.length > 0) {
      const comp = db.companies.find((c) => c.id === vouchers[0].company_id);
      if (comp) {
        companyName = comp.company_name;
        recipientEmail = comp.email;
      }
    }

    // 3. Format vouchers & generate ZIP package
    let emailSent = false;
    if (vouchers && vouchers.length > 0 && recipientEmail) {
      try {
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
          orderNumber,
          totalAmount,
          vouchersCount,
          zipBuffer,
        });

        emailSent = Boolean(emailRes.success);
      } catch (emailErr) {
        console.error('Failed to generate or send voucher confirmation email:', emailErr);
      }
    }

    await logAuditEvent({
      actorId: admin_id || undefined,
      actorType: 'ADMIN',
      action: 'PAYMENT_CONFIRMED_VOUCHERS_GENERATED',
      entityType: 'ORDER',
      entityId: order_id,
      metadata: { vouchers_count: vouchersCount, email_sent: emailSent },
    });

    return NextResponse.json({
      success: true,
      message: `Payment verified & confirmed! ${vouchersCount} vouchers activated ${emailSent ? 'and emailed to client with attached PDF ZIP package.' : '.'}`,
      vouchers_count: vouchersCount,
      email_sent: emailSent,
      vouchers,
    });
  } catch (err: any) {
    console.error('Confirm payment API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Server error confirming payment.' }, { status: 500 });
  }
}
