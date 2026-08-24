import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { createCorporateOrderInDB } from '@/lib/store';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  if (!checkRateLimit(ip, 10, 60000).success) {
    return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED', message: 'Too many order requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const {
      company_name,
      contact_person,
      designation,
      email,
      mobile,
      billing_address,
      gst_number,
      quantities,
      notes,
    } = body;

    // Validate corporate fields
    if (!company_name || !contact_person || !email || !mobile || !billing_address) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Company name, contact person, email, mobile, and billing address are required.' }, { status: 400 });
    }

    const { individual = 0, family = 0, kids = 0 } = quantities || {};
    const totalCount = Number(individual) + Number(family) + Number(kids);

    if (totalCount <= 0) {
      return NextResponse.json({ error: 'INVALID_QUANTITY', message: 'Please select at least 1 voucher to order.' }, { status: 400 });
    }

    // Persist order directly into database
    const { order, orderNumber, totals } = await createCorporateOrderInDB({
      company_name,
      contact_person,
      designation,
      email,
      mobile,
      billing_address,
      gst_number,
      quantities: { individual: Number(individual), family: Number(family), kids: Number(kids) },
      notes,
    });

    await logAuditEvent({
      actorType: 'CORPORATE_USER',
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: order.id,
      metadata: { order_number: orderNumber, total_amount: totals.total, company_name },
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
