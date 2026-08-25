import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

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
    const supabaseAdmin = getSupabaseAdmin();
    let company: any = null;

    if (companyId) {
      const { data: c } = await supabaseAdmin.from('companies').select('*').eq('id', companyId).maybeSingle();
      if (c) company = c;
    }

    if (!company && sessionEmail) {
      const { data: c } = await supabaseAdmin.from('companies').select('*').eq('email', sessionEmail).maybeSingle();
      if (c) {
        company = c;
        companyId = c.id;
      }
    }

    let orders: any[] = [];
    let vouchers: any[] = [];
    const targetId = company ? company.id : companyId;

    if (targetId) {
      const { data: ords } = await supabaseAdmin
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('company_id', targetId)
        .order('created_at', { ascending: false });

      if (ords) orders = ords;

      const { data: vchs } = await supabaseAdmin
        .from('vouchers')
        .select('*')
        .eq('company_id', targetId)
        .order('created_at', { ascending: false });

      if (vchs) vouchers = vchs;
    }

    return NextResponse.json({
      company: company || { company_name: session.companyName || 'Corporate Client', email: session.email },
      orders: orders || [],
      vouchers: vouchers || [],
    });
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
