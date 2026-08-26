import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { submitOrderPaymentInDB, resolveCompanyForUser, readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (!checkRateLimit(ip, 10, 60000).success) {
    return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
  }

  // 1. Mandatory Server Authorization: Verify HR session
  const hrCookie = req.cookies.get('nisargshala_hr_session')?.value;
  if (!hrCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Corporate HR authentication required.' }, { status: 401 });
  }

  let session: any;
  try {
    session = JSON.parse(hrCookie);
  } catch (e) {
    return NextResponse.json({ error: 'INVALID_SESSION', message: 'Invalid session cookie.' }, { status: 401 });
  }

  if (!session || !session.userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid user session.' }, { status: 401 });
  }

  const resolved = await resolveCompanyForUser(session.userId);
  if (!resolved || !resolved.company) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Company resolution failed.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { order_id, utr_reference, payment_date, payment_method = 'RTGS_NEFT', notes } = body;

    if (!order_id || !utr_reference || !payment_date) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Order ID, UTR reference, and payment date are required.' }, { status: 400 });
    }

    // 2. Verify Order Ownership Server-Side
    let orderOwnedByCompany = false;

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: dbOrd } = await supabaseAdmin
          .from('orders')
          .select('id, company_id')
          .or(`id.eq.${order_id},order_number.eq.${order_id}`)
          .maybeSingle();

        if (dbOrd && (dbOrd.company_id === resolved.company.id || dbOrd.company_id === session.companyId)) {
          orderOwnedByCompany = true;
        }
      } catch (e) {}
    }

    if (!orderOwnedByCompany) {
      const db = readDB();
      const localOrd = db.orders.find((o) => o.id === order_id || o.order_number === order_id);
      if (localOrd && (localOrd.company_id === resolved.company.id || localOrd.company?.email?.toLowerCase() === resolved.company.email.toLowerCase())) {
        orderOwnedByCompany = true;
      }
    }

    if (!orderOwnedByCompany) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You are not authorized to submit payment for this order.' },
        { status: 403 }
      );
    }

    const result = await submitOrderPaymentInDB({
      order_id,
      utr_reference,
      payment_date,
      payment_method,
      notes,
    });

    await logAuditEvent({
      actorId: session.userId,
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

