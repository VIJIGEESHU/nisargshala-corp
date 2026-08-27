import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateTaxInvoiceRecord, resolveCompanyForUser } from '@/lib/store';
import { generateTaxInvoiceHtml } from '@/lib/invoicePdfGenerator';
import { sendTeamOutingConfirmationEmail } from '@/lib/email';
import { isSupabaseConfigured, getSupabaseAdmin, isValidUUID } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const adminSessionCookie = req.cookies.get('nisargshala_admin_session')?.value;
    if (!adminSessionCookie) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Administrator login session required.' }, { status: 401 });
    }

    const body = await req.json();
    const { booking_id } = body;

    if (!booking_id) {
      return NextResponse.json({ error: 'MISSING_BOOKING_ID', message: 'Booking ID is required.' }, { status: 400 });
    }

    const db = readDB();
    if (!db.team_outing_bookings) db.team_outing_bookings = [];

    let booking = db.team_outing_bookings.find((b) => b.id === booking_id || b.booking_number === booking_id);

    if (!booking && isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        let query = supabaseAdmin.from('team_outing_bookings').select('*, company:companies(*)');
        if (isValidUUID(booking_id)) {
          query = query.or(`id.eq.${booking_id},booking_number.eq.${booking_id}`);
        } else {
          query = query.eq('booking_number', booking_id);
        }
        const { data: sbBooking } = await query.maybeSingle();
        if (sbBooking) booking = sbBooking;
      } catch (e) {}
    }

    if (!booking) {
      return NextResponse.json({ error: 'BOOKING_NOT_FOUND', message: 'Team Outing booking not found.' }, { status: 404 });
    }

    // Resolve company profile
    const resolvedComp = await resolveCompanyForUser(booking.company_id);
    const company = resolvedComp?.company || booking.company;

    if (!company) {
      return NextResponse.json({ error: 'COMPANY_NOT_FOUND', message: 'Company profile not found for booking.' }, { status: 404 });
    }

    // Update booking status
    booking.payment_status = 'PAID';
    booking.booking_status = 'CONFIRMED';
    booking.updated_at = new Date().toISOString();

    // Idempotent Tax Invoice Generation
    const invoiceRecord = await generateTaxInvoiceRecord({
      booking_id: booking.id,
      company_id: company.id,
      buyer_gstin: company.gst_number || booking.buyer_gstin || '27AAAAA0000A1Z5',
      subtotal_amount: booking.subtotal_amount,
      gst_rate: booking.gst_rate || 18,
      gst_amount: booking.gst_amount,
      total_amount: booking.total_amount,
    });

    booking.invoice_number = invoiceRecord.invoice_number;
    writeDB(db);

    if (isSupabaseConfigured() && isValidUUID(booking.id)) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        await supabaseAdmin.from('team_outing_bookings').update({
          payment_status: 'PAID',
          booking_status: 'CONFIRMED',
          invoice_number: invoiceRecord.invoice_number,
        }).eq('id', booking.id);
      } catch (e) {}
    }

    // Render Tax Invoice HTML
    const invoiceHtml = generateTaxInvoiceHtml({
      invoiceNumber: invoiceRecord.invoice_number,
      invoiceDate: invoiceRecord.invoice_date,
      dueDate: invoiceRecord.due_date,
      referenceNumber: booking.booking_number,
      companyName: company.company_name,
      contactPerson: company.contact_person,
      billingAddress: company.billing_address || '',
      buyerGstin: invoiceRecord.buyer_gstin,
      items: [
        {
          description: `${booking.package_title} (${booking.location})`,
          quantity: booking.attendees_count,
          unitPrice: booking.unit_price,
          totalPrice: booking.subtotal_amount,
        },
      ],
      subtotal: booking.subtotal_amount,
      gstRate: booking.gst_rate || 18,
      gstAmount: booking.gst_amount,
      totalAmount: booking.total_amount,
      advanceReceived: booking.total_amount,
      totalDue: 0,
    });

    // Send Confirmation Email with Tax Invoice Attached
    let emailResult: any = { success: false, reason: 'NOT_ATTEMPTED' };
    try {
      emailResult = await sendTeamOutingConfirmationEmail({
        to: company.email,
        clientName: company.contact_person,
        companyName: company.company_name,
        bookingNumber: booking.booking_number,
        packageTitle: booking.package_title,
        eventDate: booking.event_date,
        attendeesCount: booking.attendees_count,
        location: booking.location,
        totalAmount: booking.total_amount,
        utrReference: booking.utr_reference || 'N/A',
        invoiceHtml: invoiceHtml,
        buyerGstin: invoiceRecord.buyer_gstin,
      });

      booking.email_status = emailResult.success ? 'SENT' : 'FAILED';
      booking.email_sent_at = emailResult.success ? new Date().toISOString() : undefined;
      writeDB(db);
    } catch (ee: any) {
      console.error('Outing confirmation email dispatch error:', ee);
      booking.email_status = 'FAILED';
      booking.email_error = ee.message;
      writeDB(db);
    }

    return NextResponse.json({
      success: true,
      message: `Team Outing booking ${booking.booking_number} payment verified and confirmed successfully!`,
      booking,
      invoice: invoiceRecord,
      emailResult,
    });
  } catch (err: any) {
    console.error('Confirm Outing Payment API error:', err);
    return NextResponse.json({ error: 'CONFIRM_OUTING_FAILED', message: err.message || 'Failed to verify outing payment.' }, { status: 400 });
  }
}
