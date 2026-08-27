import { NextRequest, NextResponse } from 'next/server';
import { generatePasswordResetOTP, verifyOTPAndResetPassword } from '@/lib/store';
import { hashPasswordCanonical } from '@/lib/password';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action = 'request_otp', email, otp_code, new_password } = body;

    if (!email) {
      return NextResponse.json({ error: 'MISSING_EMAIL', message: 'Registered work email address is required.' }, { status: 400 });
    }

    if (action === 'request_otp') {
      try {
        const result = await generatePasswordResetOTP(email);
        return NextResponse.json(result);
      } catch (err: any) {
        if (err.message === 'EMAIL_SERVICE_NOT_CONFIGURED') {
          return NextResponse.json(
            {
              error: 'EMAIL_SERVICE_NOT_CONFIGURED',
              message: 'We could not send the verification email. Production email service (SMTP / Resend API) is not configured yet. Please contact Nisargshala support.',
            },
            { status: 400 }
          );
        }
        if (err.message === 'EMAIL_SEND_FAILED') {
          return NextResponse.json(
            {
              error: 'EMAIL_SEND_FAILED',
              message: 'We could not send the verification email right now. Please check your email address or try again in a few minutes.',
            },
            { status: 400 }
          );
        }
        return NextResponse.json({ error: 'OTP_REQUEST_FAILED', message: err.message || 'Failed to request verification code.' }, { status: 400 });
      }
    }

    if (action === 'verify_otp') {
      if (!otp_code || !new_password) {
        return NextResponse.json(
          { error: 'MISSING_FIELDS', message: '6-digit verification code and new password are required.' },
          { status: 400 }
        );
      }

      const canonicalHash = hashPasswordCanonical(new_password);
      const result = await verifyOTPAndResetPassword(email, otp_code, canonicalHash);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'INVALID_ACTION', message: 'Invalid reset password action.' }, { status: 400 });
  } catch (err: any) {
    console.error('Reset password API error:', err.message || err);
    return NextResponse.json({ error: 'RESET_FAILED', message: err.message || 'Failed to process password reset.' }, { status: 400 });
  }
}
