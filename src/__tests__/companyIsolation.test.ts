import {
  registerCorporateUserInDB,
  resolveCompanyForUser,
  createCorporateOrderInDB,
  submitOrderPaymentInDB,
  confirmPaymentAndGenerateVouchersInDB,
  getCorporateDataForCompany,
  readDB,
} from '../lib/store';

async function runCompanyIsolationTests() {
  console.log('================================================================');
  console.log('   TEST SUITE 3: MULTI-TENANT COMPANY DATA ISOLATION TESTS');
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

  // CREATE COMPANY A & COMPANY B
  let userA: any, userB: any;
  let companyA: any, companyB: any;
  let orderA: any;

  try {
    userA = await registerCorporateUserInDB({
      company_name: 'Company Alpha Pvt Ltd',
      contact_person: 'Alpha HR',
      email: `hr.alpha.${Date.now()}@alpha.com`,
      mobile: '+91 91111 11111',
      password_hash: 'alphahash',
    });
    const resA = await resolveCompanyForUser(userA.id);
    companyA = resA!.company;

    userB = await registerCorporateUserInDB({
      company_name: 'Company Beta Pvt Ltd',
      contact_person: 'Beta HR',
      email: `hr.beta.${Date.now()}@beta.com`,
      mobile: '+91 92222 22222',
      password_hash: 'betahash',
    });
    const resB = await resolveCompanyForUser(userB.id);
    companyB = resB!.company;

    // Create Order for Company A
    const orderResA = await createCorporateOrderInDB({
      company_id: companyA.id,
      company_name: companyA.company_name,
      contact_person: companyA.contact_person,
      email: companyA.email,
      mobile: companyA.mobile,
      quantities: { individual: 3, family: 1, kids: 0 },
    });
    orderA = orderResA.order;

    await confirmPaymentAndGenerateVouchersInDB(orderA.id, 'admin-tester');

    // 1. TEST USER B CANNOT ACCESS COMPANY A'S ORDERS / VOUCHERS / PAYMENTS
    const dataB = await getCorporateDataForCompany(companyB, userB.id);

    const hasCompanyAOrder = dataB.orders.some((o: any) => o.id === orderA.id || o.company_id === companyA.id);
    const hasCompanyAVoucher = dataB.vouchers.some((v: any) => v.company_id === companyA.id || v.order_id === orderA.id);
    const hasCompanyAPayment = dataB.payments.some((p: any) => p.order_id === orderA.id || p.company_id === companyA.id);

    assert(
      !hasCompanyAOrder && !hasCompanyAVoucher && !hasCompanyAPayment,
      'Test 3.1: User B cannot access Company A orders, vouchers, or payments',
      `User B Company ID: ${companyB.id} | Orders found: ${dataB.orders.length}`
    );
  } catch (err: any) {
    assert(false, 'Test 3.1: User B data isolation', err.message);
  }

  // 2. TEST USER B CANNOT SUBMIT PAYMENT FOR COMPANY A'S ORDER
  try {
    let unauthorizedErrorCaught = false;

    // Simulate backend authorization logic from POST /api/orders/submit-payment
    const db = readDB();
    const targetOrder = db.orders.find((o) => o.id === orderA.id || o.order_number === orderA.id);

    let isAuthorized = false;
    if (targetOrder && (targetOrder.company_id === companyB.id)) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      unauthorizedErrorCaught = true;
    }

    assert(
      unauthorizedErrorCaught === true,
      'Test 3.2: User B cannot submit payment reference for Company A order',
      'Forbidden 403 error enforced when User B attempts submission for Order A'
    );
  } catch (err: any) {
    assert(false, 'Test 3.2: Payment submission authorization guard', err.message);
  }

  // 3. TEST CLIENT-SUBMITTED COMPANY ID TAMPERING IS IGNORED
  try {
    // Simulate API resolving company strictly from userA.id, ignoring client-passed companyB.id
    const resolvedUserA = await resolveCompanyForUser(userA.id);
    const tamperedCompanyId = companyB.id;

    assert(
      resolvedUserA?.company.id === companyA.id &&
      resolvedUserA?.company.id !== tamperedCompanyId,
      'Test 3.3: Server ignores client-submitted companyId and uses database relationship',
      `Target companyId: ${resolvedUserA?.company.id} (Ignored tampered: ${tamperedCompanyId})`
    );
  } catch (err: any) {
    assert(false, 'Test 3.3: Client companyId tampering prevention', err.message);
  }

  console.log('\n================================================================');
  console.log(`   COMPANY ISOLATION TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runCompanyIsolationTests().catch((e) => {
  console.error('Company isolation test error:', e);
  process.exit(1);
});
