import { NextRequest, NextResponse } from 'next/server';
import { resolveCompanyForUser, updateCompanyProfileInDB } from '@/lib/store';

export async function PATCH(req: NextRequest) {
  const hrCookie = req.cookies.get('nisargshala_hr_session')?.value;
  if (!hrCookie) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Corporate HR authentication required.' }, { status: 401 });
  }

  let session: any;
  try {
    session = JSON.parse(hrCookie);
  } catch (e) {
    return NextResponse.json({ error: 'INVALID_SESSION', message: 'Invalid session cookie.' }, { status: 401 });
  }

  if (!session.userId) {
    return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid user session.' }, { status: 401 });
  }

  // 1. Mandatory Server Authorization: Resolve company from session.userId
  const resolved = await resolveCompanyForUser(session.userId);
  if (!resolved || !resolved.company) {
    return NextResponse.json({ error: 'FORBIDDEN', message: 'Corporate company resolution failed.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { company_name, contact_person, designation, mobile, billing_address, gst_number } = body;

    const updatedCompany = await updateCompanyProfileInDB(resolved.company.id, {
      company_name,
      contact_person,
      designation,
      mobile,
      billing_address,
      gst_number,
    });

    return NextResponse.json({
      success: true,
      message: 'Corporate profile updated successfully.',
      company: updatedCompany,
    });
  } catch (err: any) {
    console.error('Update company profile API error:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message || 'Failed to update company profile.' }, { status: 500 });
  }
}
