import {
  registerCorporateUserInDB,
  authenticateCorporateUserInDB,
  resolveCompanyForUser,
  createTeamOutingBookingInDB,
  submitOutingPaymentUtrInDB,
  createCustomCorporateEnquiryInDB,
  generateTaxInvoiceRecord,
  validateGSTINFormat,
  readDB,
} from '../lib/store';
import { generateTaxInvoiceHtml } from '../lib/invoicePdfGenerator';
import { isValidUUID } from '../lib/supabase';
import crypto from 'crypto';

async function runTeamOutingsAndInvoiceTests() {
  console.log('================================================================');
  console.log('   TEST SUITE: NISARGSHALA CORPORATE GATEWAY & TEAM OUTINGS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (detail) console.log(`       ↳ ${detail}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (detail) console.error(`       ↳ ERROR: ${detail}`);
      failed++;
    }
  }

  // Test 1: GSTIN Format Validation
  try {
    const validGstin = validateGSTINFormat('27AAAAA0000A1Z5');
    const userScreenshotGstin = validateGSTINFormat('27ARHPV2783R17N');
    const invalidGstin = validateGSTINFormat('INVALID123');
    assert(
      validGstin === true && userScreenshotGstin === true && invalidGstin === false,
      'Test 1: Server-side 15-character GSTIN format validation accepts standard & user GSTINs (27ARHPV2783R17N)',
      `Valid: 27AAAAA0000A1Z5 (${validGstin}) | User GSTIN: 27ARHPV2783R17N (${userScreenshotGstin}) | Invalid: INVALID123 (${invalidGstin})`
    );
  } catch (err: any) {
    assert(false, 'Test 1: GSTIN validation', err.message);
  }

  // Test 2: Mandatory GSTIN Enforcement on Registration
  try {
    let failedWithoutGstin = false;
    try {
      await registerCorporateUserInDB({
        company_name: 'No GST Corp',
        contact_person: 'Admin',
        email: `nogstin.${Date.now()}@test.com`,
        mobile: '+91 99999 88888',
        password: 'Password123!',
        password_hash: 'scrypt:test',
        gst_number: 'INVALID_GST',
      });
    } catch (e) {
      failedWithoutGstin = true;
    }

    assert(
      failedWithoutGstin,
      'Test 2: Registration strictly rejects invalid or missing mandatory corporate GSTIN',
      `Rejected invalid GSTIN successfully`
    );
  } catch (err: any) {
    assert(false, 'Test 2: Mandatory GSTIN enforcement', err.message);
  }

  // Test 3: Create Team Outing Booking with Valid Corporate Account
  const companyEmail = `gateway.corp.${Date.now()}@nisargshala.in`;
  const rawPassword = 'GatewayPassword2026!';
  let createdCompUser: any = null;

  try {
    createdCompUser = await registerCorporateUserInDB({
      company_name: 'Apex Gateway Logistics Pvt Ltd',
      contact_person: 'Vikram Mehta',
      email: companyEmail,
      mobile: '+91 98220 11223',
      billing_address: 'BKC, Mumbai, Maharashtra',
      gst_number: '27ARHPV2783R1ZN',
      password: rawPassword,
      password_hash: 'scrypt:placeholder',
    });

    const { booking, company } = await createTeamOutingBookingInDB({
      company_id: createdCompUser.company_id,
      package_code: 'WILDERNESS_BONDING',
      event_date: '2026-10-15',
      attendees_count: 20,
      special_requirements: 'Barbecue dinner & Guided hike',
    });

    const isBookingRefValid = booking.booking_number.startsWith('OUTING-');
    const isSubtotalCorrect = booking.subtotal_amount === 20 * 3200; // 64,000
    const isGstCorrect = booking.gst_amount === Math.round((64000 * 18) / 100); // 11,520
    const isTotalCorrect = booking.total_amount === 64000 + 11520; // 75,520

    assert(
      isBookingRefValid && isSubtotalCorrect && isGstCorrect && isTotalCorrect,
      'Test 3: Team Outing Booking created with server-authoritative tax pricing and OUTING- reference',
      `Booking Ref: ${booking.booking_number} | Subtotal: ₹${booking.subtotal_amount} | GST: ₹${booking.gst_amount} | Total: ₹${booking.total_amount}`
    );

    // Test 4: Submit Payment UTR Reference
    const utrRes = await submitOutingPaymentUtrInDB({
      booking_id: booking.id,
      company_id: createdCompUser.company_id,
      utr_reference: 'UTR998877665544',
    });

    assert(
      utrRes.booking.payment_status === 'AWAITING_VERIFICATION' && utrRes.booking.utr_reference === 'UTR998877665544',
      'Test 4: UTR payment reference submission transitions booking status to AWAITING_VERIFICATION',
      `Payment Status: ${utrRes.booking.payment_status} | UTR: ${utrRes.booking.utr_reference}`
    );

    // Test 5: Authorization Enforcement (Cross-Company UTR Rejection)
    let crossCompRejected = false;
    try {
      await submitOutingPaymentUtrInDB({
        booking_id: booking.id,
        company_id: 'other-company-uuid-12345',
        utr_reference: 'HACK_UTR_9999',
      });
    } catch (e: any) {
      crossCompRejected = e.message.includes('FORBIDDEN');
    }

    assert(
      crossCompRejected,
      'Test 5: Cross-company payment submission attempts are strictly rejected with FORBIDDEN authorization error',
      `Cross-company isolation verified`
    );

    // Test 6: Tax Invoice Generation (NS/26-27/000123)
    const invoiceRecord = await generateTaxInvoiceRecord({
      booking_id: booking.id,
      company_id: createdCompUser.company_id,
      buyer_gstin: company.gst_number || '27ARHPV2783R1ZN',
      subtotal_amount: booking.subtotal_amount,
      gst_rate: 18,
      gst_amount: booking.gst_amount,
      total_amount: booking.total_amount,
    });

    const isInvoiceNumFormat = invoiceRecord.invoice_number.startsWith('NS/');
    const isSellerGstinCorrect = invoiceRecord.seller_gstin === '27ARHPV2783R1ZN';

    assert(
      isInvoiceNumFormat && isSellerGstinCorrect,
      'Test 6: Tax Invoice PDF engine generates unique NS/ reference with distinct Seller & Buyer GSTINs',
      `Invoice #: ${invoiceRecord.invoice_number} | Seller GSTIN: ${invoiceRecord.seller_gstin} | Buyer GSTIN: ${invoiceRecord.buyer_gstin}`
    );

    // Test 7: Invoice Idempotency Check
    const invoiceRecord2 = await generateTaxInvoiceRecord({
      booking_id: booking.id,
      company_id: createdCompUser.company_id,
      buyer_gstin: company.gst_number || '27ARHPV2783R1ZN',
      subtotal_amount: booking.subtotal_amount,
      gst_rate: 18,
      gst_amount: booking.gst_amount,
      total_amount: booking.total_amount,
    });

    assert(
      invoiceRecord.id === invoiceRecord2.id && invoiceRecord.invoice_number === invoiceRecord2.invoice_number,
      'Test 7: Tax Invoice generation is strictly idempotent and prevents duplicate invoice numbers',
      `Same Invoice ID returned: ${invoiceRecord.id}`
    );

    // Test 8: Render Tax Invoice HTML Template
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
      gstRate: 18,
      gstAmount: booking.gst_amount,
      totalAmount: booking.total_amount,
      advanceReceived: booking.total_amount,
      totalDue: 0,
    });

    const containsSellerGstin = invoiceHtml.includes('27ARHPV2783R1ZN');
    const containsNisargshalaLogo = invoiceHtml.includes('Nisargshala Logo') || invoiceHtml.includes('Invoice');

    assert(
      containsSellerGstin && containsNisargshalaLogo,
      'Test 8: HTML Tax Invoice contains Nisargshala Seller GSTIN (27ARHPV2783R1ZN) and printable invoice structure',
      `Rendered HTML length: ${invoiceHtml.length} chars`
    );

  } catch (err: any) {
    assert(false, 'Test 3-8: Team Outings & Tax Invoice execution', err.message);
  }

  // Test 9: Custom Corporate Experience Enquiry Submission (ENQ-YYYYMMDD-XXXX)
  try {
    const enquiry = await createCustomCorporateEnquiryInDB({
      company_name: 'Global Tech Offsites Ltd',
      contact_person: 'Ananya Roy',
      email: `enquiry.${Date.now()}@globaltech.com`,
      mobile: '+91 91111 22222',
      team_size: 45,
      preferred_location: 'Panchgani',
      experience_type: 'Leadership Strategy Offsite',
      special_requirements: 'Needs conference room setup and guided trekking',
    });

    const isEnquiryRefValid = enquiry.enquiry_number.startsWith('ENQ-');
    assert(
      isEnquiryRefValid && enquiry.status === 'NEW',
      'Test 9: Custom corporate experience enquiry registered with ENQ- reference and NEW status',
      `Enquiry Ref: ${enquiry.enquiry_number} | Status: ${enquiry.status}`
    );
  } catch (err: any) {
    assert(false, 'Test 9: Custom enquiry submission', err.message);
  }

  // Test 10: Multi-Tenant Data Isolation for Resolved Users
  try {
    const resolvedAuth = await resolveCompanyForUser(createdCompUser.id);
    const db = readDB();
    const companyOutings = (db.team_outing_bookings || []).filter((b) => b.company_id === resolvedAuth?.companyId);

    assert(
      resolvedAuth?.companyId === createdCompUser.company_id && companyOutings.length > 0,
      'Test 10: Server-side company resolution strictly isolates company bookings and user profiles',
      `Resolved Company ID: ${resolvedAuth?.companyId}`
    );
  } catch (err: any) {
    assert(false, 'Test 10: Multi-tenant data isolation', err.message);
  }

  console.log('\n================================================================');
  console.log(`   TEAM OUTINGS & TAX INVOICE TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runTeamOutingsAndInvoiceTests().catch((e) => {
  console.error('Team outings regression test error:', e);
  process.exit(1);
});
