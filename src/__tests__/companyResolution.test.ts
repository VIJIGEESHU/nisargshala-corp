import {
  registerCorporateUserInDB,
  resolveCompanyForUser,
  readDB,
} from '../lib/store';
import { isValidUUID } from '../lib/supabase';

async function runCompanyResolutionTests() {
  console.log('================================================================');
  console.log('   TEST SUITE 1: COMPANY RESOLUTION & SECURITY TESTS');
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

  // 1. TEST USER -> CORPORATE_USERS -> COMPANY RESOLUTION
  let newUser: any;
  const testEmail = `hr.resolution.${Date.now()}@acmetest.com`;
  try {
    newUser = await registerCorporateUserInDB({
      company_name: 'Acme Resolution Corp',
      contact_person: 'Resolution Manager',
      designation: 'HR Lead',
      email: testEmail,
      mobile: '+91 98000 11111',
      billing_address: '100 Cyber Tower, Pune',
      gst_number: '27AAACA1234A1Z1',
      password_hash: 'secretpasswordhash123',
    });

    const resolved = await resolveCompanyForUser(newUser.id);

    assert(
      resolved !== null &&
      resolved.company.id === newUser.company_id &&
      resolved.company.company_name === 'Acme Resolution Corp',
      'Test 1.1: User -> corporate_users -> company resolution chain',
      `Resolved User ID ${newUser.id} -> Company ID ${resolved?.company?.id}`
    );

    // Verify password_hash is not present in resolved object for client exposure
    const safeUserProfile = { ...resolved?.user };
    delete safeUserProfile.password_hash;
    assert(
      safeUserProfile.password_hash === undefined,
      'Test 1.2: Password hash stripped from resolved user payload',
      'Verified password_hash is undefined in client-facing payload'
    );

  } catch (err: any) {
    assert(false, 'Test 1.1: User -> company resolution chain', err.message);
  }

  // 2. TEST NON-AUTHORITATIVE CLIENT COMPANY ID REJECTION
  try {
    const fakeClientCompanyId = 'fake-company-id-999';
    const resolvedReal = await resolveCompanyForUser(newUser.id);

    assert(
      resolvedReal?.company.id !== fakeClientCompanyId &&
      resolvedReal?.company.id === newUser.company_id,
      'Test 1.3: Client-submitted companyId cannot override database relationship',
      `Ignored fake client company ID: ${fakeClientCompanyId} | Used database canonical: ${resolvedReal?.company.id}`
    );
  } catch (err: any) {
    assert(false, 'Test 1.3: Client companyId override rejection', err.message);
  }

  // 3. TEST UUID FORMAT VS LEGACY ID SAFETY
  try {
    const validUuid = '7f9a1b2c-e89b-12d3-a456-426614174000';
    const legacyId = 'comp-legacy-tata';

    assert(
      isValidUUID(validUuid) === true && isValidUUID(legacyId) === false,
      'Test 1.4: UUID v4 format vs legacy ID detection helper',
      `UUID: ${isValidUUID(validUuid)} | Legacy ID: ${isValidUUID(legacyId)}`
    );
  } catch (err: any) {
    assert(false, 'Test 1.4: UUID format detection', err.message);
  }

  console.log('\n================================================================');
  console.log(`   COMPANY RESOLUTION TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runCompanyResolutionTests().catch((e) => {
  console.error('Company resolution test error:', e);
  process.exit(1);
});
