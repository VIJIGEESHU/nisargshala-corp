import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { createCorporateOrderInDB, resolveCompanyForUser } from '@/lib/store';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (!checkRateLimit(ip, 10, 60000).success) {
    return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many order requests.' }, { status: 429 });
  }

  // 1. Mandatory Server Authorization: Verify HR session cookie
  const hrCookie = req.cookies.get('nisargshala_hr_session')?.value;
  if (!hrCookie) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Please sign in to your Corporate HR account to purchase vouchers.' },
      { status: 401 }
    );
  }

  let session: any;
  try {
    session = JSON.parse(hrCookie);
  } catch (e) {
    return NextResponse.json({ error: 'INVALID_SESSION', message: 'Invalid session cookie.' }, { status: 401 });
  }

  if (!session || !session.userId) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Please sign in to your Corporate HR account to purchase vouchers.' },
      { status: 401 }
    );
  }

  // 2. Resolve company strictly from session.userId in DB
  const resolved = await resolveCompanyForUser(session.userId);
  if (!resolved || !resolved.company) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Failed to resolve corporate HR company profile.' }, { status: 403 });
  }

  const company = resolved.company;

  try {
    const body = await req.json();
    const { quantities, notes } = body;

    const { individual = 0, family = 0, kids = 0 } = quantities || {};
    const totalCount = Number(individual) + Number(family) + Number(kids);

    if (totalCount <= 0) {
      return NextResponse.json({ error: 'INVALID_QUANTITY', message: 'Please select at least 1 voucher to order.' }, { status: 400 });
    }

    // Persist order tied strictly to server-resolved company UUID / ID
    const { order, orderNumber, totals } = await createCorporateOrderInDB({
      company_id: company.id,
      company_name: company.company_name,
      contact_person: company.contact_person,
      designation: company.designation || 'HR Contact',
      email: company.email,
      mobile: company.mobile,
      billing_address: company.billing_address,
      gst_number: company.gst_number || undefined,
      quantities: { individual: Number(individual), family: Number(family), kids: Number(kids) },
      notes,
    });

    await logAuditEvent({
      actorId: session.userId,
      actorType: 'CORPORATE_USER',
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      metadata: { order_number: orderNumber, total_amount: totals.total, company_name: company.company_name },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Corporate order submitted successfully! Please complete payment via RTGS/NEFT.',
      order: {
        id: order.id,
        order_number: order.order_number,
        total_amount: order.total_amount,
        payment_status: order.payment_status,
      },
    });
  } catch (err: any) {
    console.error('Order creation API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Server error creating corporate order.' }, { status: 500 });
  }
}

