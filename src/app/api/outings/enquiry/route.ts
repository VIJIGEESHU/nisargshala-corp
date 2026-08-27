import { NextRequest, NextResponse } from 'next/server';
import { createCustomCorporateEnquiryInDB } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      company_name,
      contact_person,
      email,
      mobile,
      gst_number,
      team_size,
      preferred_date,
      preferred_location,
      experience_type,
      budget_range,
      special_requirements,
    } = body;

    if (!company_name || !contact_person || !email || !mobile) {
      return NextResponse.json({ error: 'MISSING_FIELDS', message: 'Company name, contact person, email, and mobile are required.' }, { status: 400 });
    }

    const enquiry = await createCustomCorporateEnquiryInDB({
      company_name,
      contact_person,
      email,
      mobile,
      gst_number,
      team_size: Number(team_size) || 10,
      preferred_date,
      preferred_location,
      experience_type,
      budget_range,
      special_requirements,
    });

    return NextResponse.json({
      success: true,
      message: `Custom Corporate Experience enquiry ${enquiry.enquiry_number} submitted successfully! Our team will contact you within 24 hours.`,
      enquiry,
    });
  } catch (err: any) {
    console.error('Custom Enquiry API error:', err);
    return NextResponse.json({ error: 'ENQUIRY_FAILED', message: err.message || 'Failed to submit custom enquiry.' }, { status: 400 });
  }
}
