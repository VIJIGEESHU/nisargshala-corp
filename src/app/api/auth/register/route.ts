import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { registerCorporateUserInDB } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { company_name, contact_person, email, mobile, password, billing_address, gst_number } = body;

    if (!company_name || !contact_person || !email || !mobile || !password) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'Company Name, Contact Person, Email, Mobile, and Password are required.' },
        { status: 400 }
      );
    }

    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    const newUser = await registerCorporateUserInDB({
      company_name,
      contact_person,
      email,
      mobile,
      password_hash: passwordHash,
      billing_address,
      gst_number,
    });

    const res = NextResponse.json({
      success: true,
      message: 'Corporate HR account created successfully!',
      user: newUser,
    });

    // Automatically set HR session cookie
    const sessionData = {
      userId: newUser.id,
      role: 'CORPORATE_HR',
      email: newUser.email,
      companyId: newUser.company_id,
      companyName: newUser.company_name,
    };

    res.cookies.set('nisargshala_hr_session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    console.error('Registration API error:', err);
    return NextResponse.json(
      { error: 'REGISTRATION_FAILED', message: err.message || 'Failed to create corporate account.' },
      { status: 400 }
    );
  }
}
