import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  if (!checkRateLimit(ip, 20, 60000).success) {
    return NextResponse.json({ error: 'RATE_LIMIT_EXCEEDED' }, { status: 429 });
  }

  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.VOUCHER_API_SECRET || 'dev_secret_retail_api_token_nisargshala_2026';
  
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { redemption_code, reservation_token } = body;

    if (!redemption_code || !reservation_token) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD', message: 'redemption_code and reservation_token are required' }, { status: 400 });
    }

    const cleanCode = redemption_code.trim().toUpperCase();

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ success: true, message: 'Reservation released successfully' });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { data: voucher } = await supabaseAdmin
      .from('vouchers')
      .select('id, status, reservation_token')
      .eq('redemption_code', cleanCode)
      .single();

    if (!voucher) {
      return NextResponse.json({ success: false, error: 'VOUCHER_NOT_FOUND' }, { status: 404 });
    }

    if (voucher.reservation_token && voucher.reservation_token !== reservation_token) {
      return NextResponse.json({ success: false, error: 'TOKEN_MISMATCH', message: 'Invalid reservation token.' }, { status: 403 });
    }

    if (voucher.status === 'RESERVED') {
      await supabaseAdmin
        .from('vouchers')
        .update({
          status: 'ACTIVE',
          reservation_token: null,
          reserved_until: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', voucher.id);
    }

    return NextResponse.json({ success: true, message: 'Reservation released successfully' });
  } catch (err) {
    console.error('Release voucher error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
