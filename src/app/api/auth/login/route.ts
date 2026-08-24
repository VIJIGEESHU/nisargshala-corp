import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { readDB } from '@/lib/store';
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, login_type = 'corporate' } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'MISSING_CREDENTIALS', message: 'Email and password are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // 1. MASTER SYSTEM ADMIN CREDENTIAL CHECK (Hemant2026)
    if (cleanEmail === 'admin@nisargshala.in' && password === 'Hemant2026') {
      const adminSession = {
        userId: 'usr-admin-hemant',
        role: 'SUPER_ADMIN',
        email: 'admin@nisargshala.in',
        companyId: 'comp-nisargshala-demo',
        companyName: 'Nisargshala Operations',
      };

      const res = NextResponse.json({
        success: true,
        user: {
          id: 'usr-admin-hemant',
          email: 'admin@nisargshala.in',
          full_name: 'Hemant Admin',
          role: 'SUPER_ADMIN',
          company: {
            id: 'comp-nisargshala-demo',
            company_name: 'Nisargshala Operations',
          },
        },
      });

      res.cookies.set('nisargshala_admin_session', JSON.stringify(adminSession), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });

      return res;
    }

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: authData, error: authErr } = await supabaseAdmin.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!authErr && authData?.user) {
          // Check role in corporate_users table
          const { data: userProfile } = await supabaseAdmin
            .from('corporate_users')
            .select('*, company:companies(*)')
            .eq('user_id', authData.user.id)
            .single();

          const userRole = userProfile?.role || 'CORPORATE_HR';

          if (login_type === 'admin' && userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
            return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied. Admin privileges required.' }, { status: 403 });
          }

          const res = NextResponse.json({
            success: true,
            user: {
              id: authData.user.id,
              email: authData.user.email,
              role: userRole,
              company: userProfile?.company || null,
            },
          });

          const cookieName = userRole === 'SUPER_ADMIN' || userRole === 'ADMIN' ? 'nisargshala_admin_session' : 'nisargshala_hr_session';
          res.cookies.set(cookieName, JSON.stringify({ userId: authData.user.id, role: userRole, email: cleanEmail }), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7,
          });

          return res;
        }
      } catch (e) {
        console.warn('Supabase auth warning, falling back to local DB check:', e);
      }
    }

    // Persistent Local JSON DB check
    const db = readDB();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);

    if (!user || user.password_hash !== passwordHash) {
      return NextResponse.json({ error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' }, { status: 401 });
    }

    if (login_type === 'admin' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Access denied. Corporate accounts cannot access admin.' }, { status: 403 });
    }

    const company = db.companies.find((c) => c.id === user.company_id);

    const cookieName = user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' ? 'nisargshala_admin_session' : 'nisargshala_hr_session';
    const sessionData = { userId: user.id, role: user.role, email: user.email, companyId: user.company_id, companyName: company?.company_name };

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        company,
      },
    });

    res.cookies.set(cookieName, JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: 'Server error during login.' }, { status: 500 });
  }
}
