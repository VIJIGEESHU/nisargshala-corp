import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (!checkRateLimit(ip, 10, 60000).success) {
    return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { order_id, utr_reference, payment_date, payment_method = 'RTGS_NEFT', notes } = body;

    if (!order_id || !utr_reference || !payment_date) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Order ID, UTR reference, and payment date are required.' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({
        success: true,
        message: 'Payment details submitted for verification! (Dev Mode)',
        payment_status: 'AWAITING_VERIFICATION',
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Verify order exists
    const { data: order, error: fetchErr } = await supabaseAdmin
      .from('orders')
      .select('id, order_number, payment_status, total_amount')
      .eq('id', order_id)
      .single();

    if (fetchErr || !order) {
      return NextResponse.json({ error: 'ORDER_NOT_FOUND', message: 'Order not found.' }, { status: 404 });
    }

    if (order.payment_status === 'PAID') {
      return NextResponse.json({ error: 'ALREADY_PAID', message: 'This order has already been verified and paid.' }, { status: 400 });
    }

    // Update order status to AWAITING_VERIFICATION
    const { error: updateErr } = await supabaseAdmin
      .from('orders')
      .update({
        payment_status: 'AWAITING_VERIFICATION',
        order_status: 'VERIFYING_PAYMENT',
        utr_reference: utr_reference.trim().toUpperCase(),
        payment_date,
        payment_method,
        notes: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    if (updateErr) {
      return NextResponse.json({ error: 'UPDATE_FAILED', message: 'Failed to update order payment status.' }, { status: 500 });
    }

    // Record payment entry
    await supabaseAdmin.from('payment_records').insert({
      order_id: order.id,
      amount: order.total_amount,
      method: payment_method,
      utr_reference: utr_reference.trim().toUpperCase(),
      payment_date,
      status: 'PENDING',
      notes,
    });

    await logAuditEvent({
      actorType: 'CORPORATE_USER',
      action: 'PAYMENT_SUBMITTED',
      entityType: 'ORDER',
      entityId: order.id,
      metadata: { utr_reference, payment_date },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment reference submitted successfully! Nisargshala admin will verify the transaction.',
      payment_status: 'AWAITING_VERIFICATION',
    });
  } catch (err: any) {
    console.error('Submit payment API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Server error submitting payment.' }, { status: 500 });
  }
}
