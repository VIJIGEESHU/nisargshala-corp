import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (!checkRateLimit(ip, 30, 60000).success) {
    return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'MISSING_CODE', message: 'Voucher code query parameter is required.' }, { status: 400 });
  }

  const cleanCode = code.trim().toUpperCase();

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      status: 'ACTIVE',
      voucher_value: 4000,
      product_code: 'INDIVIDUAL',
      expiry_date: '2027-08-21T00:00:00Z',
    });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: voucher, error } = await supabaseAdmin
      .from('vouchers')
      .select('status, voucher_value, product_code, eligible_experience_codes, expiry_date')
      .eq('redemption_code', cleanCode)
      .single();

    if (error || !voucher) {
      return NextResponse.json({ error: 'VOUCHER_NOT_FOUND' }, { status: 404 });
    }

    return NextResponse.json({
      status: voucher.status,
      voucher_value: voucher.voucher_value,
      product_code: voucher.product_code,
      eligible_experience_codes: voucher.eligible_experience_codes,
      expiry_date: voucher.expiry_date,
    });
  } catch (err) {
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
