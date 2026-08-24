import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentAndGenerateVouchersInDB } from '@/lib/store';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  // Verify Admin session
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  if (!adminCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Admin authentication required.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { order_id, admin_id, notes } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'MISSING_ORDER_ID', message: 'Order ID is required.' }, { status: 400 });
    }

    const { vouchersCount, vouchers } = await confirmPaymentAndGenerateVouchersInDB(order_id, admin_id);

    await logAuditEvent({
      actorId: admin_id || undefined,
      actorType: 'ADMIN',
      action: 'PAYMENT_CONFIRMED_VOUCHERS_GENERATED',
      entityType: 'ORDER',
      entityId: order_id,
      metadata: { vouchers_count: vouchersCount },
    });

    return NextResponse.json({
      success: true,
      message: `Payment verified & confirmed! ${vouchersCount} distinct individual vouchers activated.`,
      vouchers_count: vouchersCount,
      vouchers,
    });
  } catch (err: any) {
    console.error('Confirm payment API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Server error confirming payment.' }, { status: 500 });
  }
}
