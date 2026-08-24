import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import crypto from 'crypto';

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
    const { redemption_code, timeout_minutes = 15 } = body;

    if (!redemption_code) {
      return NextResponse.json({ error: 'INVALID_PAYLOAD', message: 'redemption_code is required' }, { status: 400 });
    }

    const cleanCode = redemption_code.trim().toUpperCase();

    if (!isSupabaseConfigured()) {
      const reservationToken = `RES-${crypto.randomBytes(8).toString('hex')}`;
      return NextResponse.json({
        success: true,
        reservation_token: reservationToken,
        reserved_until: new Date(Date.now() + timeout_minutes * 60000).toISOString(),
      });
    }

    const supabaseAdmin = getSupabaseAdmin();
    
    // Fetch voucher
    const { data: voucher, error } = await supabaseAdmin
      .from('vouchers')
      .select('id, status, expiry_date, reserved_until')
      .eq('redemption_code', cleanCode)
      .single();

    if (error || !voucher) {
      return NextResponse.json({ success: false, error: 'VOUCHER_NOT_FOUND' }, { status: 404 });
    }

    const now = new Date();

    if (voucher.status === 'RESERVED' && voucher.reserved_until) {
      const currentExpiry = new Date(voucher.reserved_until);
      if (currentExpiry > now) {
        return NextResponse.json({ success: false, error: 'ALREADY_RESERVED', message: 'Voucher is currently reserved.' }, { status: 409 });
      }
    }

    if (voucher.status !== 'ACTIVE' && voucher.status !== 'RESERVED') {
      return NextResponse.json({ success: false, error: 'VOUCHER_NOT_ACTIVE', status: voucher.status }, { status: 400 });
    }

    const reservationToken = `RES-${crypto.randomBytes(12).toString('hex')}`;
    const reservedUntil = new Date(now.getTime() + timeout_minutes * 60000).toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({
        status: 'RESERVED',
        reservation_token: reservationToken,
        reserved_until: reservedUntil,
        updated_at: now.toISOString(),
      })
      .eq('id', voucher.id);

    if (updateError) {
      return NextResponse.json({ success: false, error: 'RESERVATION_FAILED' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      reservation_token: reservationToken,
      reserved_until: reservedUntil,
    });
  } catch (err) {
    console.error('Reserve voucher error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
