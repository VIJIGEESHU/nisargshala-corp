import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { submitOrderPaymentInDB } from '@/lib/store';
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

    const result = await submitOrderPaymentInDB({
      order_id,
      utr_reference,
      payment_date,
      payment_method,
      notes,
    });

    await logAuditEvent({
      actorType: 'CORPORATE_USER',
      action: 'PAYMENT_SUBMITTED',
      entityType: 'ORDER',
      entityId: order_id,
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
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Server error submitting payment.' }, { status: 500 });
  }
}
