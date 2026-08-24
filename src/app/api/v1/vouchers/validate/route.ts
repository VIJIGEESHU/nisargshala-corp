import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { LOCKED_VOUCHER_PRODUCTS } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  
  // Rate limit: Max 20 requests per minute
  const rateLimit = checkRateLimit(ip, 20, 60000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Authenticate Retail API Key
  const authHeader = req.headers.get('authorization');
  const expectedSecret = process.env.VOUCHER_API_SECRET || 'dev_secret_retail_api_token_nisargshala_2026';
  
  if (!authHeader || authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing API authorization token.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { redemption_code, experience_code } = body;

    if (!redemption_code || typeof redemption_code !== 'string') {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Redemption code is required.' },
        { status: 400 }
      );
    }

    const cleanCode = redemption_code.trim().toUpperCase();

    if (!isSupabaseConfigured()) {
      // Local fallback for standalone dev testing
      if (cleanCode.startsWith('NS-TEST-VALID')) {
        return NextResponse.json({
          valid: true,
          status: 'ACTIVE',
          voucher_value: 12000,
          product_code: 'FAMILY',
          eligible_experience_codes: ['FAMILY_CAMPING', 'FAMILY_ADVENTURE', 'KUTUHAL_ADULT', 'KUTUHAL_CHILD'],
          expiry_date: '2027-08-21T00:00:00Z',
        });
      }
      if (cleanCode.startsWith('NS-TEST-USED')) {
        return NextResponse.json({
          valid: false,
          status: 'REDEEMED',
          error: 'ALREADY_REDEEMED',
          message: 'Voucher has already been redeemed.',
        });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: voucher, error } = await supabaseAdmin
      .from('vouchers')
      .select('id, human_ref, status, voucher_value, product_code, eligible_experience_codes, expiry_date, reservation_token, reserved_until')
      .eq('redemption_code', cleanCode)
      .single();

    if (error || !voucher) {
      return NextResponse.json(
        { valid: false, error: 'VOUCHER_NOT_FOUND', message: 'Voucher code is invalid.' },
        { status: 404 }
      );
    }

    // Check status
    if (voucher.status === 'PENDING_PAYMENT') {
      return NextResponse.json({
        valid: false,
        status: 'PENDING_PAYMENT',
        error: 'UNPAID_VOUCHER',
        message: 'Voucher payment has not been confirmed yet.',
      });
    }

    if (voucher.status === 'REDEEMED') {
      return NextResponse.json({
        valid: false,
        status: 'REDEEMED',
        error: 'ALREADY_REDEEMED',
        message: 'This voucher has already been redeemed.',
      });
    }

    if (voucher.status === 'CANCELLED' || voucher.status === 'VOID') {
      return NextResponse.json({
        valid: false,
        status: voucher.status,
        error: 'VOUCHER_INVALID',
        message: 'This voucher has been cancelled or voided.',
      });
    }

    // Check expiry
    const now = new Date();
    const expiryDate = new Date(voucher.expiry_date);
    if (expiryDate < now || voucher.status === 'EXPIRED') {
      return NextResponse.json({
        valid: false,
        status: 'EXPIRED',
        error: 'VOUCHER_EXPIRED',
        message: `Voucher expired on ${voucher.expiry_date}.`,
      });
    }

    // Check reservation
    if (voucher.status === 'RESERVED' && voucher.reserved_until) {
      const reservedUntil = new Date(voucher.reserved_until);
      if (reservedUntil > now) {
        return NextResponse.json({
          valid: false,
          status: 'RESERVED',
          error: 'VOUCHER_RESERVED',
          message: 'Voucher is currently reserved by another active booking session.',
        });
      }
    }

    // Check experience eligibility if provided
    if (experience_code) {
      const isEligible = voucher.eligible_experience_codes.includes(experience_code);
      if (!isEligible) {
        return NextResponse.json({
          valid: false,
          status: voucher.status,
          error: 'INELIGIBLE_EXPERIENCE',
          message: 'Selected experience is not eligible for this voucher.',
          eligible_experience_codes: voucher.eligible_experience_codes,
        });
      }
    }

    return NextResponse.json({
      valid: true,
      status: 'ACTIVE',
      product_code: voucher.product_code,
      voucher_value: voucher.voucher_value,
      eligible_experience_codes: voucher.eligible_experience_codes,
      expiry_date: voucher.expiry_date,
    });
  } catch (err: any) {
    console.error('Error validating voucher:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: 'Unable to validate voucher. Please try again.' },
      { status: 500 }
    );
  }
}
