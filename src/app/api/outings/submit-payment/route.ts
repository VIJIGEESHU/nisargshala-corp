import { NextRequest, NextResponse } from 'next/server';
import { resolveCompanyForUser, submitOutingPaymentUtrInDB } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const hrSessionCookie = req.cookies.get('nisargshala_hr_session')?.value;
    if (!hrSessionCookie) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Corporate login session required.' }, { status: 401 });
    }

    let sessionData: any = null;
    try {
      sessionData = JSON.parse(hrSessionCookie);
    } catch (e) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid session data.' }, { status: 401 });
    }

    if (!sessionData || !sessionData.userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Valid corporate user session required.' }, { status: 401 });
    }

    const resolved = await resolveCompanyForUser(sessionData.userId);
    if (!resolved || !resolved.companyId) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Corporate account profile not found.' }, { status: 403 });
    }

    const body = await req.json();
    const { booking_id, utr_reference } = body;

    if (!booking_id || !utr_reference) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Booking ID and UTR reference number are required.' }, { status: 400 });
    }

    const result = await submitOutingPaymentUtrInDB({
      booking_id,
      company_id: resolved.companyId,
      utr_reference,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment UTR reference submitted successfully! Nisargshala accounts will verify payment and dispatch your Tax Invoice.',
      booking: result.booking,
    });
  } catch (err: any) {
    console.error('Submit Outing Payment UTR API error:', err);
    return NextResponse.json({ error: 'SUBMIT_PAYMENT_FAILED', message: err.message || 'Failed to submit payment UTR.' }, { status: 400 });
  }
}
