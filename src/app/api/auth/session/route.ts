import { NextRequest, NextResponse } from 'next/server';
import { readDB } from '@/lib/store';

export async function GET(req: NextRequest) {
  const adminCookie = req.cookies.get('nisargshala_admin_session')?.value;
  const hrCookie = req.cookies.get('nisargshala_hr_session')?.value;

  let session: any = null;
  let userType: 'ADMIN' | 'HR' | null = null;

  if (adminCookie) {
    try {
      session = JSON.parse(adminCookie);
      userType = 'ADMIN';
    } catch (e) {}
  } else if (hrCookie) {
    try {
      session = JSON.parse(hrCookie);
      userType = 'HR';
    } catch (e) {}
  }

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  if (userType === 'ADMIN') {
    return NextResponse.json({
      authenticated: true,
      userType: 'ADMIN',
      user: {
        id: session.userId || 'usr-admin-hemant',
        email: session.email || 'admin@nisargshala.in',
        role: 'SUPER_ADMIN',
        company: {
          id: 'comp-nisargshala-ops',
          company_name: 'Nisargshala Operations',
        },
      },
    });
  }

  const db = readDB();
  const company = db.companies.find((c) => c.id === session.companyId);

  return NextResponse.json({
    authenticated: true,
    userType,
    user: {
      id: session.userId,
      email: session.email,
      role: session.role,
      company: company || { id: session.companyId, company_name: session.companyName || 'Corporate Partner' },
    },
  });
}
