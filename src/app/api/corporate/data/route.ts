import { NextRequest, NextResponse } from 'next/server';
import { getCorporateDataForCompany, resolveCompanyForUser } from '@/lib/store';

export async function GET(req: NextRequest) {
  // 1. Authenticate Corporate HR session
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

  try {
    // 2. CRITICAL AUTHORIZATION: Resolve company strictly from session.userId in DB
    const resolved = await resolveCompanyForUser(session.userId);
    if (!resolved || !resolved.company) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Company resolution failed for user.' }, { status: 403 });
    }

    // 3. Fetch orders, payments, and vouchers linked to the resolved company
    const data = await getCorporateDataForCompany(resolved.company, session.userId);

    return NextResponse.json({
      company: data.company,
      orders: data.orders,
      payments: data.payments,
      vouchers: data.vouchers,
    });
  } catch (err: any) {
    console.error('[CORPORATE_DATA_ERROR] Server error fetching corporate data:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Error fetching corporate portal records.' },
      { status: 500 }
    );
  }
}
