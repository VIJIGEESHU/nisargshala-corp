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

  const companyId = session.companyId;

  if (isSupabaseConfigured()) {
    const supabaseAdmin = getSupabaseAdmin();
    // ISOLATION: Filter strictly by company_id!
    const { data: orders } = await supabaseAdmin.from('orders').select('*, items:order_items(*)').eq('company_id', companyId).order('created_at', { ascending: false });
    const { data: vouchers } = await supabaseAdmin.from('vouchers').select('*').eq('company_id', companyId).order('created_at', { ascending: false });
    const { data: company } = await supabaseAdmin.from('companies').select('*').eq('id', companyId).single();

    return NextResponse.json({
      company,
      orders: orders || [],
      vouchers: vouchers || [],
    });
  }

  // Local Persistent JSON DB
  const db = readDB();
  const company = db.companies.find((c) => c.id === companyId || c.email.toLowerCase() === session.email?.toLowerCase());
  
  const targetCompanyId = company ? company.id : companyId;

  // STRICT COMPANY DATA ISOLATION FILTERING
  const companyOrders = db.orders.filter((o) => o.company_id === targetCompanyId);
  const companyVouchers = db.vouchers.filter((v) => v.company_id === targetCompanyId);

  return NextResponse.json({
    company: company || { company_name: session.companyName || 'Corporate Client', email: session.email },
    orders: companyOrders,
    vouchers: companyVouchers,
  });
}
