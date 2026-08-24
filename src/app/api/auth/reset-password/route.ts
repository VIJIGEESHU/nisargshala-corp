import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { generatePasswordResetOTP, verifyOTPAndResetPassword } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'request_otp', email, otp_code, new_password } = body;

    if (!email) {
      return NextResponse.json({ error: 'MISSING_EMAIL', message: 'Registered work email address is required.' }, { status: 400 });
    }

    if (action === 'request_otp') {
      const result = await generatePasswordResetOTP(email);
      return NextResponse.json(result);
    }

    if (action === 'verify_otp') {
      if (!otp_code || !new_password) {
        return NextResponse.json(
          { error: 'MISSING_FIELDS', message: '6-digit verification code and new password are required.' },
          { status: 400 }
        );
      }

      const passwordHash = crypto.createHash('sha256').update(new_password).digest('hex');
      const result = await verifyOTPAndResetPassword(email, otp_code, passwordHash);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'INVALID_ACTION', message: 'Invalid reset password action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return NextResponse.json({ error: 'RESET_FAILED', message: err.message || 'Failed to process password reset.' }, { status: 400 });
  }
}
