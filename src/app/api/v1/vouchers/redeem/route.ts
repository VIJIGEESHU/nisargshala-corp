import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import { logAuditEvent } from '@/lib/audit';

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
    const {
      redemption_code,
      experience_code,
      experience_title,
      experience_price,
      retail_booking_id,
      participant_details = {},
    } = body;

    if (!redemption_code || !experience_code || experience_price === undefined) {
      return NextResponse.json({
        error: 'INVALID_PAYLOAD',
        message: 'redemption_code, experience_code, and experience_price are required.',
      }, { status: 400 });
    }

    const cleanCode = redemption_code.trim().toUpperCase();

    if (!isSupabaseConfigured()) {
      // Standalone dev mock response
      const voucherValue = 12000;
      const price = Number(experience_price);
      const balance = price > voucherValue ? price - voucherValue : 0;
      const unused = price < voucherValue ? voucherValue - price : 0;

      return NextResponse.json({
        success: true,
        message: 'Voucher redeemed successfully (Dev Fallback)',
        voucher_id: 'dev-voucher-uuid',
        human_ref: 'NS-CORP-2026-0001',
        voucher_value: voucherValue,
        experience_price: price,
        customer_paid_balance: balance,
        unused_amount: unused,
      });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Call stored procedure redeem_voucher_atomic for atomic, race-condition free DB execution!
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc('redeem_voucher_atomic', {
      p_redemption_code: cleanCode,
      p_experience_code: experience_code,
      p_experience_title: experience_title || experience_code,
      p_experience_price: Number(experience_price),
      p_retail_booking_id: retail_booking_id || null,
      p_participant_details: participant_details,
      p_ip_address: ip,
    });

    if (rpcError) {
      console.error('Atomic redemption RPC error:', rpcError);
      
      // Fallback SQL transactional update in case RPC is not yet created in DB
      const { data: voucher } = await supabaseAdmin
        .from('vouchers')
        .select('*')
        .eq('redemption_code', cleanCode)
        .single();

      if (!voucher) {
        return NextResponse.json({ success: false, error: 'VOUCHER_NOT_FOUND' }, { status: 404 });
      }

      if (voucher.status === 'PENDING_PAYMENT') {
        return NextResponse.json({ success: false, error: 'UNPAID_VOUCHER', message: 'Voucher payment has not been verified.' }, { status: 400 });
      }

      if (voucher.status === 'REDEEMED') {
        return NextResponse.json({ success: false, error: 'ALREADY_REDEEMED', message: 'Voucher has already been redeemed.' }, { status: 409 });
      }

      if (voucher.status !== 'ACTIVE' && voucher.status !== 'RESERVED') {
        return NextResponse.json({ success: false, error: 'VOUCHER_NOT_ELIGIBLE', status: voucher.status }, { status: 400 });
      }

      const price = Number(experience_price);
      const customerBalance = price > voucher.voucher_value ? price - voucher.voucher_value : 0;
      const unusedAmount = price < voucher.voucher_value ? voucher.voucher_value - price : 0;

      // Update status
      const { error: updateErr } = await supabaseAdmin
        .from('vouchers')
        .update({ status: 'REDEEMED', updated_at: new Date().toISOString() })
        .eq('id', voucher.id)
        .in('status', ['ACTIVE', 'RESERVED']);

      if (updateErr) {
        return NextResponse.json({ success: false, error: 'REDEMPTION_FAILED' }, { status: 500 });
      }

      // Record redemption
      await supabaseAdmin.from('redemptions').insert({
        voucher_id: voucher.id,
        redemption_code: cleanCode,
        experience_code,
        experience_title: experience_title || experience_code,
        experience_price: price,
        voucher_value: voucher.voucher_value,
        customer_paid_balance: customerBalance,
        unused_voucher_amount: unusedAmount,
        retail_booking_id: retail_booking_id || null,
        participant_details,
        ip_address: ip,
      });

      await logAuditEvent({
        actorType: 'RETAIL_API',
        action: 'VOUCHER_REDEEMED',
        entityType: 'VOUCHER',
        entityId: voucher.id,
        metadata: { retail_booking_id, experience_code, price },
        ipAddress: ip,
      });

      return NextResponse.json({
        success: true,
        message: 'Voucher redeemed successfully!',
        voucher_id: voucher.id,
        human_ref: voucher.human_ref,
        voucher_value: voucher.voucher_value,
        experience_price: price,
        customer_paid_balance: customerBalance,
        unused_amount: unusedAmount,
      });
    }

    if (!rpcResult || !rpcResult.success) {
      return NextResponse.json(
        { success: false, error: rpcResult?.error || 'REDEMPTION_FAILED', message: rpcResult?.message || 'Unable to redeem voucher.' },
        { status: 400 }
      );
    }

    return NextResponse.json(rpcResult);
  } catch (err: any) {
    console.error('Redeem API Error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Internal server error during redemption.' }, { status: 500 });
  }
}
