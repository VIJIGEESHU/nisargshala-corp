import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/store';
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

  const sessionEmail = session.email?.trim().toLowerCase();
  let companyId = session.companyId;

  if (isSupabaseConfigured()) {
    try {
      const supabaseAdmin = getSupabaseAdmin();
      let company: any = null;

      // 1. Direct Lookup by companyId from session IF it is a valid UUID
      if (companyId && isValidUUID(companyId)) {
        const { data: c, error: compErr } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .maybeSingle();

        if (compErr) {
          console.error(`[CORPORATE_DATA_ERROR] Company fetch by ID (${companyId}) error:`, compErr);
          return NextResponse.json({ error: 'DATABASE_ERROR', message: 'Database error fetching company profile by ID.', details: compErr.message }, { status: 500 });
        }
        if (c) company = c;
      }

      // 2. Documented Fallback: Lookup by email if companyId is absent, non-UUID, or not matched by ID
      if (!company && sessionEmail) {
        const { data: comps, error: emailErr } = await supabaseAdmin
          .from('companies')
          .select('*')
          .eq('email', sessionEmail)
          .order('created_at', { ascending: false })
          .limit(1);

        if (emailErr) {
          console.error(`[CORPORATE_DATA_ERROR] Company fetch by email (${sessionEmail}) error:`, emailErr);
          return NextResponse.json({ error: 'DATABASE_ERROR', message: 'Database error fetching company profile by email.', details: emailErr.message }, { status: 500 });
        }

        if (comps && comps.length > 0) {
          company = comps[0];
          companyId = company.id; // Resolved real UUID
        }
      }

      // 3. Controlled Application Error if non-UUID companyId was provided and fallback email could not resolve a company
      if (!company && companyId && !isValidUUID(companyId) && !sessionEmail) {
        return NextResponse.json({
          error: 'INVALID_COMPANY_UUID',
          message: `The company identifier '${companyId}' is not a valid UUID format and no fallback email was available to resolve the company.`,
        }, { status: 400 });
      }

      const targetId = company ? company.id : (isValidUUID(companyId) ? companyId : null);
      let orders: any[] = [];
      let vouchers: any[] = [];

      if (targetId && isValidUUID(targetId)) {
        // Fetch Orders for target company UUID
        const { data: ords, error: ordErr } = await supabaseAdmin
          .from('orders')
          .select('*, items:order_items(*)')
          .eq('company_id', targetId)
          .order('created_at', { ascending: false });

        if (ordErr) {
          console.error(`[CORPORATE_DATA_ERROR] Orders fetch error for company ${targetId}:`, ordErr);
          return NextResponse.json({ error: 'DATABASE_ERROR', message: 'Database error fetching corporate orders.', details: ordErr.message }, { status: 500 });
        }
        if (ords) orders = ords;

        // Fetch Vouchers for target company UUID
        const { data: vchs, error: vchErr } = await supabaseAdmin
          .from('vouchers')
          .select('*')
          .eq('company_id', targetId)
          .order('created_at', { ascending: false });

        if (vchErr) {
          console.error(`[CORPORATE_DATA_ERROR] Vouchers fetch error for company ${targetId}:`, vchErr);
          return NextResponse.json({ error: 'DATABASE_ERROR', message: 'Database error fetching corporate vouchers.', details: vchErr.message }, { status: 500 });
        }
        if (vchs) vouchers = vchs;
      }

      return NextResponse.json({
        company: company || { company_name: session.companyName || 'Corporate Client', email: session.email },
        orders,
        vouchers,
      });
    } catch (err: any) {
      console.error('[CORPORATE_DATA_ERROR] Server error fetching corporate data:', err);
      return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Server error fetching corporate data.' }, { status: 500 });
    }
  }

  // Local Persistent JSON DB
  const db = readDB();
  const company = db.companies.find(
    (c) => (companyId && c.id === companyId) || (sessionEmail && c.email.toLowerCase() === sessionEmail)
  );

  const targetCompanyId = company ? company.id : companyId;

  // Company Data Isolation Filtering
  const companyOrders = db.orders.filter(
    (o) =>
      (targetCompanyId && o.company_id === targetCompanyId) ||
      (company && o.company_id === company.id) ||
      (sessionEmail && o.company?.email?.toLowerCase() === sessionEmail)
  );

  const companyVouchers = db.vouchers.filter(
    (v) => (targetCompanyId && v.company_id === targetCompanyId) || (company && v.company_id === company.id)
  );

  return NextResponse.json({
    company: company || { company_name: session.companyName || 'Corporate Client', email: session.email },
    orders: companyOrders,
    vouchers: companyVouchers,
  });
}
