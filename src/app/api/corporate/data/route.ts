import { NextRequest, NextResponse } from 'next/server';
import { readDB, resolveCompanyForUser } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured, isValidUUID } from '@/lib/supabase';

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

  // 2. CRITICAL AUTHORIZATION: Resolve company strictly from session.userId in DB
  const resolved = await resolveCompanyForUser(session.userId);
  if (!resolved || !resolved.company) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Company resolution failed for user.' }, { status: 403 });
  }

  const company = resolved.company;
  const targetCompanyId = company.id;

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let orders: any[] = [];
      let vouchers: any[] = [];

      if (targetCompanyId && isValidUUID(targetCompanyId)) {
        // Fetch Orders for target company UUID
        const { data: ords, error: ordErr } = await supabaseAdmin
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('company_id', targetCompanyId)
          .order('created_at', { ascending: false });

        if (!ordErr && ords) orders = ords;

        // Fetch Vouchers for target company UUID
        const { data: vchs, error: vchErr } = await supabaseAdmin
          .from('vouchers')
          .select('*')
          .eq('company_id', targetCompanyId)
          .order('created_at', { ascending: false });

        if (!vchErr && vchs) vouchers = vchs;
      }

      return NextResponse.json({
        company,
        orders,
        vouchers,
      });
    } catch (err: any) {
      console.error('[CORPORATE_DATA_ERROR] Server error fetching corporate data:', err);
    }
  }

  // Local Persistent JSON DB Fallback
  const db = readDB();

  // Company Data Isolation Filtering based strictly on server-resolved company
  const companyOrders = db.orders.filter(
    (o) =>
      o.company_id === targetCompanyId ||
      (company.email && o.company?.email?.toLowerCase() === company.email.toLowerCase())
  );

  const companyVouchers = db.vouchers.filter(
    (v) => v.company_id === targetCompanyId
  );

  return NextResponse.json({
    company,
    orders: companyOrders,
    vouchers: companyVouchers,
  });
}
