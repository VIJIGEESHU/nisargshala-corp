import {
  registerCorporateUserInDB,
  resolveCompanyForUser,
  createCorporateOrderInDB,
  submitOrderPaymentInDB,
  confirmPaymentAndGenerateVouchersInDB,
  updateCompanyProfileInDB,
  readDB,
  writeDB
} from '../lib/store';
import { calculateOrderTotal } from '../lib/pricing';
import { isValidUUID } from '../lib/supabase';
import { generateVoucherHtml } from '../lib/pdfGenerator';

async function runAcceptanceTests() {
  console.log('================================================================');
  console.log('   NISARGSHALA CORPORATE PORTAL — ACCEPTANCE & REGRESSION SUITE');
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

  // 0. SEED LEGACY TEST RECORD FOR BACKWARD COMPATIBILITY VERIFICATION
  const db = readDB();
  if (!db.companies.some((c) => c.id.startsWith('comp-'))) {
    db.companies.push({
      id: 'comp-legacy-tata',
      company_name: 'Tata Consultancy Services (Legacy Record)',
      contact_person: 'Rahul Sharma',
      email: 'hr.legacy@tcs.com',
      mobile: '+91 98111 22233',
      billing_address: 'TCS House, Fort, Mumbai',
      gst_number: '27AAACT1234F1Z0',
      status: 'ACTIVE',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    db.users.push({
      id: 'usr-legacy-rahul',
      company_id: 'comp-legacy-tata',
      email: 'hr.legacy@tcs.com',
      full_name: 'Rahul Sharma',
      role: 'CORPORATE_HR',
      password_hash: 'legacyhash',
      created_at: '2026-01-01T00:00:00.000Z',
    });
    writeDB(db);
  }

  // 1. TEST RECORD CREATION & UUID FORMAT
  const testCompanyEmail = `hr.test.${Date.now()}@acmetech.com`;
  let regUser: any;
  try {
    regUser = await registerCorporateUserInDB({
      company_name: 'Acme Technologies Pvt Ltd',
      contact_person: 'Hemant Vavale',
      designation: 'VP of Human Resources',
      email: testCompanyEmail,
      mobile: '+91 98200 12345',
      billing_address: 'Plot 42, Tech Park, MIDC, Pune 411057',
      gst_number: '27AAAAA1234A1Z5',
      password_hash: 'dummyhash123',
    });

    assert(
      isValidUUID(regUser.id) && isValidUUID(regUser.company_id),
      'Criterion 4: PostgreSQL UUID Architecture for New Records',
      `User ID: ${regUser.id} | Company ID: ${regUser.company_id}`
    );
  } catch (err: any) {
    assert(false, 'Criterion 4: PostgreSQL UUID Architecture for New Records', err.message);
  }

  // 2. TEST SERVER-SIDE AUTHORIZATION RESOLUTION
  try {
    const resolved = await resolveCompanyForUser(regUser.id);
    assert(
      resolved !== null &&
      resolved.company !== null &&
      resolved.company.id === regUser.company_id &&
      resolved.company.company_name === 'Acme Technologies Pvt Ltd',
      'Criterion 3: Critical Authorization Rule (userId -> corporate_users -> company_id)',
      `Resolved Company: ${resolved?.company?.company_name} (ID: ${resolved?.company?.id})`
    );
  } catch (err: any) {
    assert(false, 'Criterion 3: Critical Authorization Rule', err.message);
  }

  // 3. TEST ORDER CREATION & SEPARATE HUMAN REFERENCES
  let createdOrder: any;
  try {
    const orderRes = await createCorporateOrderInDB({
      company_id: regUser.company_id,
      company_name: regUser.company_name,
      contact_person: regUser.contact_person,
      email: regUser.email,
      mobile: regUser.mobile,
      quantities: { individual: 5, family: 2, kids: 1 },
      notes: 'Automated test purchase',
    });
    createdOrder = orderRes.order;

    assert(
      isValidUUID(createdOrder.id) &&
      createdOrder.order_number.startsWith('ORD-') &&
      createdOrder.subtotal_amount > 0 &&
      createdOrder.gst_amount > 0 &&
      createdOrder.total_amount > 0,
      'Criterion 4: Distinct Primary Key UUID vs Human Order Reference (ORD-YYYYMMDD-XXXX)',
      `Order UUID: ${createdOrder.id} | Order Ref: ${createdOrder.order_number} | Total: ₹${createdOrder.total_amount}`
    );
  } catch (err: any) {
    assert(false, 'Criterion 4: Order Creation & References', err.message);
  }

  // 4. TEST DYNAMIC GST PRICING CALCULATION
  try {
    const pricing18 = calculateOrderTotal({ individual: 10, family: 0, kids: 0 }, 18);
    const pricing12 = calculateOrderTotal({ individual: 10, family: 0, kids: 0 }, 12);

    assert(
      pricing18.gst === pricing18.subtotal * 0.18 &&
      pricing12.gst === pricing12.subtotal * 0.12 &&
      pricing18.gstRate === 18 &&
      pricing12.gstRate === 12,
      'Criterion 5: Dynamic GST Rate Calculation',
      `18% GST: ₹${pricing18.gst} | 12% GST: ₹${pricing12.gst}`
    );
  } catch (err: any) {
    assert(false, 'Criterion 5: Dynamic GST Rate Calculation', err.message);
  }

  // 5. TEST PAYMENT SUBMISSION & UTR RECORDING
  try {
    const payResult = await submitOrderPaymentInDB({
      order_id: createdOrder.id,
      utr_reference: `UTR-TEST-${Date.now()}`,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'RTGS_NEFT',
    });

    assert(
      payResult.success === true && payResult.payment_status === 'AWAITING_VERIFICATION',
      'Criterion 7: Payment Reference Submission (UTR)',
      `Payment status: ${payResult.payment_status}`
    );
  } catch (err: any) {
    assert(false, 'Criterion 7: Payment Reference Submission', err.message);
  }

  // 6. TEST ADMIN PAYMENT VERIFICATION & VOUCHER GENERATION WITH HUMAN REFS
  let generatedVouchers: any[] = [];
  try {
    const activation = await confirmPaymentAndGenerateVouchersInDB(createdOrder.id, 'admin-tester');
    generatedVouchers = activation.vouchers;

    const firstVoucher = generatedVouchers[0];
    assert(
      activation.vouchersCount === 8 &&
      generatedVouchers.length === 8 &&
      isValidUUID(firstVoucher.id) &&
      (firstVoucher.human_ref.startsWith('VCH-') || firstVoucher.human_ref.startsWith('NS-CORP-')),
      'Criterion 4: Voucher Generation with PostgreSQL UUIDs and Human References (NS-CORP / VCH)',
      `Total Vouchers: ${generatedVouchers.length} | Example Ref: ${firstVoucher?.human_ref} (UUID: ${firstVoucher?.id})`
    );
  } catch (err: any) {
    assert(false, 'Criterion 4: Voucher Generation', err.message);
  }

  // 7. TEST COMPANY PROFILE EDITING
  try {
    const updatedCompany = await updateCompanyProfileInDB(regUser.company_id, {
      contact_person: 'Hemant Vavale (Updated)',
      designation: 'Senior HR Director',
      gst_number: '27AAAAA9999Z1Z0',
      billing_address: 'Suite 500, Cyber City, Magarpatta, Pune 411028',
    });

    assert(
      updatedCompany.contact_person === 'Hemant Vavale (Updated)' &&
      updatedCompany.designation === 'Senior HR Director' &&
      updatedCompany.gst_number === '27AAAAA9999Z1Z0',
      'Criterion 6: Corporate Profile Editing Endpoint',
      `Updated Person: ${updatedCompany.contact_person} | GSTIN: ${updatedCompany.gst_number}`
    );
  } catch (err: any) {
    assert(false, 'Criterion 6: Corporate Profile Editing Endpoint', err.message);
  }

  // 8. TEST SELLER GSTIN IN PDF TEMPLATE
  try {
    const pdfHtml = generateVoucherHtml(
      {
        humanRef: 'VCH-999999',
        redemptionCode: 'NIS-TEST-1234',
        productTitle: 'Corporate Outdoor Tent Camping Experience',
        voucherValue: 3500,
        companyName: 'Acme Technologies Pvt Ltd',
        issueDate: '2026-08-26',
        expiryDate: '2027-08-26',
        eligibleExperiences: ['Overnight Stay'],
        terms: ['Valid for 12 months'],
      },
      ''
    );

    assert(
      pdfHtml.includes('27ARHPV2783R1ZN') && pdfHtml.includes('Seller GSTIN (Nisargshala)'),
      'Criterion 8: PDF Invoice & Voucher Seller GSTIN Inclusion (27ARHPV2783R1ZN)',
      'Verified Nisargshala Seller GSTIN present in rendered PDF HTML'
    );
  } catch (err: any) {
    assert(false, 'Criterion 8: PDF Invoice & Voucher Seller GSTIN Inclusion', err.message);
  }

  // 9. TEST BACKWARD COMPATIBILITY WITH LEGACY RECORDS
  try {
    const dbNow = readDB();
    const legacyComp = dbNow.companies.find((c) => c.id.startsWith('comp-'));
    const legacyUser = dbNow.users.find((u) => u.id.startsWith('usr-legacy-'));

    const legacyResolved = await resolveCompanyForUser(legacyUser!.id);

    assert(
      legacyComp !== undefined && legacyResolved !== null && legacyResolved.company.id === 'comp-legacy-tata',
      'Criterion 9: Backward Compatibility with Legacy Production Records (comp-*, usr-*)',
      `Legacy Company ID: ${legacyComp?.id} | Dual-Resolution Result: ${legacyResolved?.company?.company_name}`
    );
  } catch (err: any) {
    assert(false, 'Criterion 9: Backward Compatibility', err.message);
  }

  console.log('\n================================================================');
  console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAcceptanceTests().catch((e) => {
  console.error('Test execution error:', e);
  process.exit(1);
});
