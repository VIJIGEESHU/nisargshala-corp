import { NextRequest, NextResponse } from 'next/server';
import { resolveCompanyForUser, createTeamOutingBookingInDB, validateGSTINFormat } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const hrSessionCookie = req.cookies.get('nisargshala_hr_session')?.value;
    if (!hrSessionCookie) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Corporate login session required.' }, { status: 401 });
    }

    let sessionData: any = null;
    try {
      sessionData = JSON.parse(hrSessionCookie);
    } catch (e) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Invalid session data.' }, { status: 401 });
    }

    if (!sessionData || !sessionData.userId) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Valid corporate user session required.' }, { status: 401 });
    }

    // Authoritative Server-Side Company Resolution (userId -> corporate_users -> company_id -> companies)
    const resolved = await resolveCompanyForUser(sessionData.userId);
    if (!resolved || !resolved.companyId || !resolved.company) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Corporate account profile not found.' }, { status: 403 });
    }

    const company = resolved.company;
    const body = await req.json();
    const { package_code, event_date, attendees_count, special_requirements, gst_number } = body;

    const effectiveGstin = (gst_number || company.gst_number || '').trim().toUpperCase();

    // Enforce mandatory GSTIN format check
    if (!effectiveGstin || !validateGSTINFormat(effectiveGstin)) {
      return NextResponse.json(
        {
          error: 'MANDATORY_GSTIN_REQUIRED',
          message: 'A valid 15-character corporate GSTIN is mandatory to book team outings and retreats. Please enter a valid GSTIN.',
        },
        { status: 400 }
      );
    }

    if (!package_code || !event_date || !attendees_count) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Package code, event date, and attendees count are required.' }, { status: 400 });
    }

    const { booking } = await createTeamOutingBookingInDB({
      company_id: company.id,
      package_code,
      event_date,
      attendees_count: Number(attendees_count),
      special_requirements,
      gst_number,
    });

    return NextResponse.json({
      success: true,
      message: `Team Outing booking ${booking.booking_number} created successfully!`,
      booking,
    });
  } catch (err: any) {
    console.error('Create Outing API error:', err);
    return NextResponse.json({ error: 'CREATE_OUTING_FAILED', message: err.message || 'Failed to create team outing booking.' }, { status: 400 });
  }
}
