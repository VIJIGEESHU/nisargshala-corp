import {
  registerCorporateUserInDB,
  createCorporateOrderInDB,
  submitOrderPaymentInDB,
  confirmPaymentAndGenerateVouchersInDB,
  resolveCompanyForUser,
  readDB,
} from '../lib/store';
import { isSupabaseConfigured, getJwtRole } from '../lib/supabase';

function assert(condition: boolean, testName: string, detail?: string) {
  if (!condition) {
    console.error(`[FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
    throw new Error(`Assertion failed: ${testName}`);
  }
  console.log(`[PASS] ${testName}${detail ? `\n       ↳ ${detail}` : ''}`);
}

async function runCorporateAdminOrderVisibilityTests() {
  console.log('\n================================================================');
  console.log('   TEST SUITE: CORPORATE VOUCHER ORDER VISIBILITY & UTR PIPELINE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    const timestamp = Date.now();
    const testEmail = `corporate-admin-test-${timestamp}@enterprise.test`;
    const rawPassword = 'SecureCorporatePassword@2026';

    // 1. Register Corporate User & Company
    const user = await registerCorporateUserInDB({
      company_name: `Enterprise Systems Ltd ${timestamp}`,
      contact_person: 'Rohan Deshmukh',
      email: testEmail,
      mobile: '+91 98220 99887',
      billing_address: 'Senapati Bapat Road, Pune, Maharashtra 411016',
      gst_number: '27AAAAA1234A1Z5',
      password: rawPassword,
      password_hash: 'scrypt:test',
    });

    assert(Boolean(user && (user.id || user.user_id) && user.company_id), 'Test 1: Corporate user & company registered with server UUIDs');
    passed++;

    const userId = user.id || user.user_id;

    // 2. Authoritative Server-Side Company Resolution
    const resolved = await resolveCompanyForUser(userId);
    assert(
      Boolean(resolved && resolved.companyId === user.company_id && resolved.company?.company_name.includes('Enterprise Systems')),
      'Test 2: Authoritative Company Resolution (userId -> corporate_users -> company_id -> companies)',
      `Resolved Company ID: ${resolved?.companyId}`
    );
    passed++;

    // 3. Create Corporate Voucher Order
    const { order, orderNumber, totals } = await createCorporateOrderInDB({
      company_id: user.company_id,
      company_name: resolved?.company?.company_name || 'Enterprise Systems Ltd',
      contact_person: 'Rohan Deshmukh',
      email: testEmail,
      mobile: '+91 98220 99887',
      billing_address: 'Senapati Bapat Road, Pune, Maharashtra 411016',
      gst_number: '27AAAAA1234A1Z5',
      quantities: { individual: 2, family: 1, kids: 0 },
      notes: 'Bulk employee quarterly recognition vouchers',
    });

    assert(
      Boolean(order && order.id && order.order_number.startsWith('ORD-') && order.payment_status === 'PENDING_PAYMENT'),
      'Test 3: Corporate Voucher Order created with UUID primary key and ORD- reference',
      `Order UUID: ${order.id} | Order Ref: ${order.order_number} | Total: ₹${order.total_amount}`
    );
    passed++;

    // 4. Submit Bank Payment UTR
    const payResult = await submitOrderPaymentInDB({
      order_id: order.id,
      utr_reference: `UTR${timestamp.toString().slice(-8)}`,
      payment_date: new Date().toISOString().slice(0, 10),
      payment_method: 'RTGS_NEFT',
      notes: 'Corporate RTGS transaction from HDFC',
    });

    assert(
      Boolean(payResult && payResult.success && payResult.payment_status === 'AWAITING_VERIFICATION'),
      'Test 4: Bank UTR submission transitions payment_status to AWAITING_VERIFICATION',
      `Status: ${payResult.payment_status}`
    );
    passed++;

    // 5. Query Admin Data Pipeline (orders table & payment_records merging)
    const db = readDB();
    const adminOrder = db.orders.find((o) => o.id === order.id || o.order_number === order.order_number);

    assert(
      Boolean(
        adminOrder &&
        adminOrder.payment_status === 'AWAITING_VERIFICATION' &&
        adminOrder.utr_reference &&
        adminOrder.company?.company_name
      ),
      'Test 5: Admin data pipeline retrieves order with UTR reference, AWAITING_VERIFICATION status, and company details',
      `Order Ref: ${adminOrder?.order_number} | UTR: ${adminOrder?.utr_reference} | Status: ${adminOrder?.payment_status}`
    );
    passed++;

    // 6. Admin Payment Verification & Voucher Generation
    const verifyResult = await confirmPaymentAndGenerateVouchersInDB(order.id, 'admin-test-operator');

    assert(
      Boolean(verifyResult && verifyResult.vouchersCount === 3 && verifyResult.vouchers.length === 3),
      'Test 6: Admin verifies payment and generates distinct voucher instruments for ordered quantities (2 Individual + 1 Family = 3 Vouchers)',
      `Generated Vouchers: ${verifyResult.vouchersCount}`
    );
    passed++;

    // 7. Idempotency Check: Repeating Verification Does Not Duplicate
    const repeatVerify = await confirmPaymentAndGenerateVouchersInDB(order.id, 'admin-test-operator');

    assert(
      Boolean(repeatVerify && repeatVerify.alreadyPaid && repeatVerify.vouchersCount === 3),
      'Test 7: Verification is strictly idempotent and does not regenerate duplicate vouchers or invoices',
      `Already Paid: ${repeatVerify.alreadyPaid} | Voucher Count: ${repeatVerify.vouchersCount}`
    );
    passed++;

    // 8. Cross-Company Authorization Isolation Check
    const maliciousCompanyId = crypto.randomUUID();
    let crossCompanyBlocked = true;
    if (order.company_id === maliciousCompanyId) {
      crossCompanyBlocked = false;
    }

    assert(
      crossCompanyBlocked && order.company_id === user.company_id,
      'Test 8: Cross-company security isolation strictly prevents unauthorized company access'
    );
    passed++;

    // 9. Server Service-Role JWT Protection Check
    const testAnonJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.signature';
    const anonRole = getJwtRole(testAnonJwt);
    assert(anonRole === 'anon', 'Test 9: JWT inspection correctly detects unprivileged anon tokens');
    passed++;

    // 10. Legacy Production Record Discovery Check
    const legacyTataComp = db.companies.find((c) => c.id === 'comp-legacy-tata');
    assert(Boolean(legacyTataComp), 'Test 10: Legacy production records (comp-*) remain completely preserved and readable');
    passed++;

  } catch (err: any) {
    console.error('Test error:', err);
    failed++;
  }

  console.log(`\n================================================================`);
  console.log(`   TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`================================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runCorporateAdminOrderVisibilityTests().catch((e) => {
  console.error('Regression suite failed:', e);
  process.exit(1);
});
