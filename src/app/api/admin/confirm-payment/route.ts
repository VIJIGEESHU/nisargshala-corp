import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentAndGenerateVouchersInDB, readDB, generateTaxInvoiceRecord } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured, isValidUUID } from '@/lib/supabase';
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

    // 1. Confirm payment & generate distinct voucher instruments (idempotent)
    const { vouchersCount, vouchers, alreadyPaid } = await confirmPaymentAndGenerateVouchersInDB(order_id, admin_id);

    if (alreadyPaid) {
      return NextResponse.json({
        success: true,
        message: `Order payment was already verified and ${vouchersCount} vouchers are active.`,
        vouchersCount,
        emailSent: true,
        alreadyPaid: true,
      });
    }

    // 2. Fetch order & company information for email dispatch
    const db = readDB();
    let order = db.orders.find((o) => o.id === order_id || o.order_number === order_id);
    let companyName = 'Nisargshala Corporate Client';
    let recipientEmail = '';
    let orderNumber = order?.order_number || order_id;
    let totalAmount = order?.total_amount || 0;
    let buyerGstin = order?.company?.gst_number || '27AAAAA0000A1Z5';

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        let ordQuery = supabaseAdmin.from('orders').select('*, company:companies(*)');
        if (isValidUUID(order_id)) {
          ordQuery = ordQuery.or(`id.eq.${order_id},order_number.eq.${order_id}`);
        } else {
          ordQuery = ordQuery.eq('order_number', order_id);
        }
        const { data: sbOrder } = await ordQuery.maybeSingle();

        if (sbOrder) {
          orderNumber = sbOrder.order_number || orderNumber;
          totalAmount = sbOrder.total_amount || totalAmount;
          companyName = sbOrder.company?.company_name || companyName;
          recipientEmail = sbOrder.company?.email || recipientEmail;
          buyerGstin = sbOrder.company?.gst_number || buyerGstin;
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
        buyerGstin = comp.gst_number || buyerGstin;
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

    // 3. Generate or retrieve Tax Invoice Record (Idempotent)
    let invoiceRecord: any = null;
    try {
      invoiceRecord = await generateTaxInvoiceRecord({
        order_id: order?.id || order_id,
        company_id: order?.company_id || 'comp-default',
        buyer_gstin: buyerGstin,
        subtotal_amount: order?.subtotal_amount || Math.round((totalAmount * 100) / 118),
        gst_rate: 18,
        gst_amount: order?.gst_amount || Math.round((totalAmount * 18) / 118),
        total_amount: totalAmount,
      });
    } catch (invErr) {
      console.warn('generateTaxInvoiceRecord warning for voucher order:', invErr);
    }

    // 4. Format vouchers & generate ZIP package
    let emailSent = false;
    let emailNotice = '';
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

        try {
          const emailRes = await sendVouchersConfirmationEmail({
            to: recipientEmail,
            companyName,
            orderNumber,
            totalAmount,
            vouchersCount,
            zipBuffer,
          });

          emailSent = Boolean(emailRes.success);
          if (!emailSent && emailRes.reason === 'EMAIL_SERVICE_NOT_CONFIGURED') {
            emailNotice = ' (Note: Email service not configured in environment variables.)';
          } else if (!emailSent) {
            emailNotice = ` (Note: Email delivery failed: ${emailRes.error || 'Unknown error'})`;
          }
        } catch (emailErr) {
          console.error('Failed sending voucher confirmation email:', emailErr);
          emailNotice = ' (Note: Email dispatch error occurred)';
        }
      } catch (zipErr) {
        console.error('Failed to generate voucher PDF zip:', zipErr);
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
      message: `Payment verified & confirmed! ${vouchersCount} vouchers activated ${emailSent ? 'and emailed to client with attached PDF ZIP package.' : emailNotice}`,
      vouchers_count: vouchersCount,
      email_sent: emailSent,
      email_notice: emailNotice,
      vouchers,
    });
  } catch (err: any) {
    console.error('Confirm payment API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Server error confirming payment.' }, { status: 500 });
  }
}
