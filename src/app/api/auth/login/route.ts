import { NextRequest, NextResponse } from 'next/server';
import { authenticateCorporateUserInDB } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, login_type = 'corporate' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'MISSING_CREDENTIALS', message: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Authenticate user via canonical scrypt verification with backward-compatible legacy hash fallback
    const authResult = await authenticateCorporateUserInDB(cleanEmail, password, login_type);

    if (!authResult || !authResult.success || !authResult.user) {
      if (authResult?.reason === 'FORBIDDEN') {
        return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied. Administrator privileges required.' }, { status: 403 });
      }
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }, { status: 401 });
    }

    const user = authResult.user;
    const role = authResult.role || 'CORPORATE_HR';
    const isSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';

    const cookieName = isSuperAdmin ? 'nisargshala_admin_session' : 'nisargshala_hr_session';
    const sessionPayload = {
      userId: user.id,
      role: role,
      email: cleanEmail,
      companyId: user.company?.id || null,
      companyName: user.company?.company_name || null,
    };

    // Ensure password_hash is never exposed in response
    const safeUserPayload = {
      id: user.id,
      email: cleanEmail,
      full_name: user.full_name,
      role: role,
      company: user.company || null,
    };

    const res = NextResponse.json({
      success: true,
      user: safeUserPayload,
    });

    res.cookies.set(cookieName, JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return res;
  } catch (err: any) {
    console.error('Login API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Server error during login.' }, { status: 500 });
  }
}
