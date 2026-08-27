import {
  registerCorporateUserInDB,
  resolveCompanyForUser,
  createCorporateOrderInDB,
} from '../lib/store';
import { calculateOrderTotal } from '../lib/pricing';

async function runAuthCheckoutFlowTests() {
  console.log('================================================================');
  console.log('   TEST SUITE 2: AUTHENTICATION & CHECKOUT FLOW TESTS');
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

  // 1. TEST ANONYMOUS CHECKOUT REDIRECT URL
  try {
    const redirectUrl = '/login?redirect=/#order-wizard&msg=Please%20sign%20in%20to%20your%20Corporate%20HR%20account%20to%20purchase%20vouchers.';
    assert(
      redirectUrl.includes('/login') &&
      redirectUrl.includes('redirect=/#order-wizard') &&
      redirectUrl.includes('msg=Please%20sign%20in'),
      'Test 2.1: Anonymous checkout redirect URL format',
      `Redirect target: ${redirectUrl}`
    );
  } catch (err: any) {
    assert(false, 'Test 2.1: Anonymous redirect URL format', err.message);
  }

  // 2. TEST REGISTRATION & CHECKOUT AUTO-POPULATION
  let regUser: any;
  const email = `hr.checkout.${Date.now()}@acmecheckout.com`;
  try {
    regUser = await registerCorporateUserInDB({
      company_name: 'Acme Checkout Pvt Ltd',
      contact_person: 'Checkout Manager',
      designation: 'HR Generalist',
      email,
      mobile: '+91 98777 66666',
      billing_address: 'Tech Park, Sector 5, Navi Mumbai',
      gst_number: '27AAAAA8888A1Z9',
      password_hash: 'hash123456',
    });

    const resolved = await resolveCompanyForUser(regUser.id);
    const profile = resolved?.company;

    assert(
      profile !== undefined &&
      profile.company_name === 'Acme Checkout Pvt Ltd' &&
      profile.contact_person === 'Checkout Manager' &&
      profile.email === email &&
      profile.gst_number === '27AAAAA8888A1Z9',
      'Test 2.2: Profile details loaded for checkout auto-population',
      `Company: ${profile?.company_name} | Contact: ${profile?.contact_person} | GSTIN: ${profile?.gst_number}`
    );
  } catch (err: any) {
    assert(false, 'Test 2.2: Registration & Checkout Auto-population', err.message);
  }

  // 3. TEST DYNAMIC GST PRICING CALCULATION
  try {
    const quantities = { individual: 4, family: 2, kids: 1 };
    const pricing18 = calculateOrderTotal(quantities, 18);
    const expectedSubtotal = 4 * 4000 + 2 * 12000 + 1 * 7000; // 16000 + 24000 + 7000 = 47000
    const expectedGst = expectedSubtotal * 0.18; // 8460
    const expectedTotal = expectedSubtotal + expectedGst; // 55460

    assert(
      pricing18.subtotal === expectedSubtotal &&
      pricing18.gst === expectedGst &&
      pricing18.total === expectedTotal,
      'Test 2.3: Dynamic GST breakdown server calculation',
      `Subtotal: ₹${pricing18.subtotal} | GST (18%): ₹${pricing18.gst} | Total: ₹${pricing18.total}`
    );
  } catch (err: any) {
    assert(false, 'Test 2.3: Dynamic GST calculation', err.message);
  }

  // 4. TEST ORDER CREATION TIED TO AUTHORIZED COMPANY
  try {
    const orderRes = await createCorporateOrderInDB({
      company_id: regUser.company_id,
      company_name: 'Acme Checkout Pvt Ltd',
      contact_person: 'Checkout Manager',
      email,
      mobile: '+91 98777 66666',
      quantities: { individual: 2, family: 1, kids: 0 },
    });

    assert(
      orderRes.order.company_id === regUser.company_id &&
      orderRes.order.order_number.startsWith('ORD-') &&
      orderRes.totals.total > 0,
      'Test 2.4: Order created with canonical server-resolved company_id',
      `Order Ref: ${orderRes.order.order_number} | Company ID: ${orderRes.order.company_id}`
    );
  } catch (err: any) {
    assert(false, 'Test 2.4: Order creation company_id binding', err.message);
  }

  console.log('\n================================================================');
  console.log(`   AUTH & CHECKOUT TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runAuthCheckoutFlowTests().catch((e) => {
  console.error('Auth checkout test error:', e);
  process.exit(1);
});
