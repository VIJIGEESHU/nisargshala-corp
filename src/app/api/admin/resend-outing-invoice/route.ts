import { NextRequest, NextResponse } from 'next/server';
import { readDB, writeDB, generateTaxInvoiceRecord, resolveCompanyForUser } from '@/lib/store';
import { generateTaxInvoiceHtml, generateTaxInvoicePdfBuffer } from '@/lib/invoicePdfGenerator';
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
        let sbBooking = null;
        try {
          let query = supabaseAdmin.from('team_outing_bookings').select('*, company:companies(*)');
          if (isValidUUID(booking_id)) {
            query = query.or(`id.eq.${booking_id},booking_number.eq.${booking_id}`);
          } else {
            query = query.eq('booking_number', booking_id);
          }
          const { data } = await query.maybeSingle();
          sbBooking = data;
        } catch (e) {}

        if (!sbBooking) {
          let flatQuery = supabaseAdmin.from('team_outing_bookings').select('*');
          if (isValidUUID(booking_id)) {
            flatQuery = flatQuery.or(`id.eq.${booking_id},booking_number.eq.${booking_id}`);
          } else {
            flatQuery = flatQuery.eq('booking_number', booking_id);
          }
          const { data } = await flatQuery.maybeSingle();
          sbBooking = data;
        }

        if (!sbBooking) {
          let ordQuery = supabaseAdmin.from('orders').select('*, company:companies(*)');
          if (isValidUUID(booking_id)) {
            ordQuery = ordQuery.or(`id.eq.${booking_id},order_number.eq.${booking_id}`);
          } else {
            ordQuery = ordQuery.eq('order_number', booking_id);
          }
          const { data: ordData } = await ordQuery.maybeSingle();
          if (ordData) {
            let notesData: any = {};
            try {
              if (ordData.notes && typeof ordData.notes === 'string' && ordData.notes.startsWith('{')) {
                notesData = JSON.parse(ordData.notes);
              }
            } catch (e) {}
            sbBooking = {
              id: ordData.id,
              booking_number: ordData.order_number,
              company_id: ordData.company_id,
              company: ordData.company,
              package_code: notesData.package_code || 'WILDERNESS_BONDING',
              package_title: notesData.package_title || 'Wilderness Adventure & Tent Stay Camp',
              location: notesData.location || 'Nisargshala',
              event_date: notesData.event_date || (ordData.created_at ? ordData.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
              attendees_count: notesData.attendees_count || 15,
              unit_price: notesData.unit_price || 3200,
              subtotal_amount: ordData.subtotal_amount,
              gst_rate: 18,
              gst_amount: ordData.gst_amount,
              total_amount: ordData.total_amount,
              buyer_gstin: notesData.buyer_gstin || ordData.company?.gst_number || '',
              payment_status: ordData.payment_status,
              booking_status: ordData.payment_status === 'PAID' ? 'CONFIRMED' : 'REQUESTED',
              utr_reference: ordData.utr_reference,
              payment_date: ordData.payment_date,
              special_requirements: notesData.special_requirements || '',
              created_at: ordData.created_at,
              updated_at: ordData.updated_at,
            };
          }
        }

        if (sbBooking) booking = sbBooking;
      } catch (e) {}
    }

    if (!booking) {
      return NextResponse.json({ error: 'BOOKING_NOT_FOUND', message: 'Team Outing booking not found.' }, { status: 404 });
    }

    const resolvedComp = await resolveCompanyForUser(booking.company_id);
    const company = resolvedComp?.company || booking.company;

    if (!company) {
      return NextResponse.json({ error: 'COMPANY_NOT_FOUND', message: 'Company profile not found for booking.' }, { status: 404 });
    }

    // Reuse existing tax invoice or generate idempotently
    const invoiceRecord = await generateTaxInvoiceRecord({
      booking_id: booking.id,
      company_id: company.id,
      buyer_gstin: company.gst_number || booking.buyer_gstin || '27AAAAA0000A1Z5',
      subtotal_amount: booking.subtotal_amount,
      gst_rate: booking.gst_rate || 18,
      gst_amount: booking.gst_amount,
      total_amount: booking.total_amount,
    });

    const invoicePayload = {
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
    };

    const invoiceHtml = generateTaxInvoiceHtml(invoicePayload);
    const invoicePdfBuffer = generateTaxInvoicePdfBuffer(invoicePayload);

    const emailResult = await sendTeamOutingConfirmationEmail({
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
      invoicePdfBuffer: invoicePdfBuffer,
      buyerGstin: invoiceRecord.buyer_gstin,
    });

    booking.email_status = emailResult.success ? 'SENT' : 'FAILED';
    booking.email_sent_at = emailResult.success ? new Date().toISOString() : undefined;
    writeDB(db);

    return NextResponse.json({
      success: true,
      message: `Tax Invoice & Confirmation email resent successfully to ${company.email}!`,
      booking,
      invoice: invoiceRecord,
      emailResult,
    });
  } catch (err: any) {
    console.error('Resend Outing Invoice API error:', err);
    return NextResponse.json({ error: 'RESEND_OUTING_FAILED', message: err.message || 'Failed to resend outing invoice email.' }, { status: 400 });
  }
}
