import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { resetCorporateUserPasswordInDB } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, new_password } = body;

    if (!email) {
      return NextResponse.json({ error: 'MISSING_EMAIL', message: 'Registered work email address is required.' }, { status: 400 });
    }

    const passwordHash = new_password
      ? crypto.createHash('sha256').update(new_password).digest('hex')
      : crypto.createHash('sha256').update('Nisargshala2026!').digest('hex');

    const result = await resetCorporateUserPasswordInDB(email, passwordHash);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (err: any) {
    console.error('Reset password API error:', err);
    return NextResponse.json({ error: 'RESET_FAILED', message: err.message || 'Failed to process password reset.' }, { status: 500 });
  }
}
