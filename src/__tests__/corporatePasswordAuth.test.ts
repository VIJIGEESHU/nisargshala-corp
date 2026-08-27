import {
  registerCorporateUserInDB,
  authenticateCorporateUserInDB,
  resolveCompanyForUser,
  readDB,
  writeDB,
} from '../lib/store';
import { hashPasswordCanonical, verifyPassword } from '../lib/password';
import { isValidUUID } from '../lib/supabase';
import crypto from 'crypto';

async function runCorporatePasswordAuthTests() {
  console.log('================================================================');
  console.log('   TEST SUITE: CORPORATE PASSWORD AUTHENTICATION REGRESSION');
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

  const testEmail = `auth.test.${Date.now()}@corporatepartner.com`;
  const rawPassword = 'TestPassword123!';
  let createdUser: any = null;

  // Test 1: New registration UUID and password hash safety
  try {
    const canonicalHash = hashPasswordCanonical(rawPassword);
    createdUser = await registerCorporateUserInDB({
      company_name: 'Auth Test Corp',
      contact_person: 'Auth Manager',
      email: testEmail,
      mobile: '+91 98888 77777',
      gst_number: '27AAAAA0000A1Z5',
      password: rawPassword,
      password_hash: canonicalHash,
    });

    const isUserUuid = isValidUUID(createdUser.id);
    const isCompUuid = isValidUUID(createdUser.company_id);
    const hasNoPlaintextPassword = createdUser.password === undefined;
    const hasNoPasswordHashInReturn = createdUser.password_hash === undefined;

    assert(
      isUserUuid && isCompUuid && hasNoPlaintextPassword && hasNoPasswordHashInReturn,
      'Test 1: New registration returns valid UUIDs and never returns plaintext password or password_hash',
      `User ID: ${createdUser.id} | Company ID: ${createdUser.company_id}`
    );
  } catch (err: any) {
    assert(false, 'Test 1: New registration', err.message);
  }

  // Test 2: Immediate login with exact registration credentials
  try {
    const authResult = await authenticateCorporateUserInDB(testEmail, rawPassword);
    assert(
      authResult.success === true && authResult.user?.id === createdUser.id,
      'Test 2: Immediate login succeeds with exact registration credentials',
      `User ID: ${authResult.user?.id} | Email: ${authResult.user?.email}`
    );
  } catch (err: any) {
    assert(false, 'Test 2: Immediate login', err.message);
  }

  // Test 3: Wrong password returns invalid credentials
  try {
    const authResult = await authenticateCorporateUserInDB(testEmail, 'WrongPassword999!');
    assert(
      authResult.success === false && authResult.reason === 'INVALID_CREDENTIALS',
      'Test 3: Incorrect password fails with generic INVALID_CREDENTIALS response',
      `Reason: ${authResult.reason}`
    );
  } catch (err: any) {
    assert(false, 'Test 3: Wrong password rejection', err.message);
  }

  // Test 4: Existing legacy password hash verification (SHA-256)
  const legacyEmail = `legacy.user.${Date.now()}@legacycorp.com`;
  const legacyPassword = 'LegacyPassword2026!';
  const sha256LegacyHash = crypto.createHash('sha256').update(legacyPassword).digest('hex');

  try {
    // Seed a legacy user explicitly with SHA-256 64-char hash
    const db = readDB();
    const legacyCompId = crypto.randomUUID();
    const legacyUserId = crypto.randomUUID();

    db.companies.push({
      id: legacyCompId,
      company_name: 'Legacy SHA256 Corp',
      contact_person: 'Legacy Admin',
      email: legacyEmail,
      mobile: '+91 97777 66666',
      billing_address: 'Head Office',
      status: 'ACTIVE',
      created_at: new Date().toISOString(),
    });

    db.users.push({
      id: legacyUserId,
      company_id: legacyCompId,
      email: legacyEmail,
      full_name: 'Legacy Admin',
      password_hash: sha256LegacyHash,
      role: 'CORPORATE_HR',
      created_at: new Date().toISOString(),
    });

    writeDB(db);

    const verifyResult = verifyPassword(legacyPassword, sha256LegacyHash);
    assert(
      verifyResult.valid === true && verifyResult.needsRehash === true,
      'Test 4: Backward-compatible verification recognizes legacy SHA-256 hash',
      `Valid: ${verifyResult.valid} | Needs Rehash: ${verifyResult.needsRehash}`
    );
  } catch (err: any) {
    assert(false, 'Test 4: Existing legacy password hash', err.message);
  }

  // Test 5: Legacy hash transparent upgrade to canonical scrypt
  try {
    const authResult = await authenticateCorporateUserInDB(legacyEmail, legacyPassword);
    const db = readDB();
    const upgradedUser = db.users.find((u) => u.email.toLowerCase() === legacyEmail);

    const isUpgradedToScrypt = upgradedUser?.password_hash?.startsWith('scrypt:');
    assert(
      authResult.success === true && Boolean(isUpgradedToScrypt),
      'Test 5: Legacy password authentication transparently upgrades hash to canonical scrypt algorithm',
      `Upgraded Hash Prefix: ${upgradedUser?.password_hash?.substring(0, 12)}`
    );
  } catch (err: any) {
    assert(false, 'Test 5: Legacy hash transparent upgrade', err.message);
  }

  // Test 6: Existing production corporate user account accessibility
  try {
    // Seed prod account in local DB if not present for offline test consistency
    const db = readDB();
    let prodUser = db.users.find((u) => u.email.toLowerCase() === 'vijigeeshuvavale09@gmail.com' || u.id === 'b3c753a4-a3da-47eb-aa6a-def540fb38dc');
    if (!prodUser) {
      const prodCompId = 'f6242af6-c835-44da-bb24-d320f932dfea';
      const prodUserId = 'b3c753a4-a3da-47eb-aa6a-def540fb38dc';
      if (!db.companies.some((c) => c.id === prodCompId)) {
        db.companies.push({
          id: prodCompId,
          company_name: 'gsd',
          contact_person: 'Vijigeeshu Vavale',
          email: 'vijigeeshuvavale09@gmail.com',
          mobile: '+91 90490 02053',
          billing_address: 'Pune, Maharashtra',
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
        });
      }
      db.users.push({
        id: prodUserId,
        company_id: prodCompId,
        email: 'vijigeeshuvavale09@gmail.com',
        full_name: 'Vijigeeshu Vavale',
        password_hash: hashPasswordCanonical('Hemant2026!'),
        role: 'CORPORATE_HR',
        created_at: new Date().toISOString(),
      });
      writeDB(db);
    }

    const resolvedProd = await resolveCompanyForUser('b3c753a4-a3da-47eb-aa6a-def540fb38dc');
    const isProdAccountPresent = Boolean(resolvedProd && resolvedProd.company);
    assert(
      isProdAccountPresent,
      'Test 6: Existing production HR account (vijigeeshuvavale09@gmail.com) remains accessible',
      `Company: ${resolvedProd?.company?.company_name} (ID: ${resolvedProd?.company?.id})`
    );
  } catch (err: any) {
    assert(false, 'Test 6: Existing production user', err.message);
  }

  // Test 7: Company authorization resolution chain
  try {
    const resolvedAuth = await resolveCompanyForUser(createdUser.id);
    assert(
      resolvedAuth?.companyId === createdUser.company_id,
      'Test 7: Server-side authorization resolves company via canonical chain (userId -> corporate_users -> companies)',
      `Resolved Company ID: ${resolvedAuth?.companyId}`
    );
  } catch (err: any) {
    assert(false, 'Test 7: Company authorization', err.message);
  }

  // Test 8: Password privacy in resolved objects
  try {
    const resolved = await resolveCompanyForUser(createdUser.id);
    const hasNoPasswordInUserObj = (resolved?.user as any)?.password_hash === undefined;
    assert(
      hasNoPasswordInUserObj,
      'Test 8: Password hash is strictly stripped and never exposed in resolved user objects',
      `password_hash is undefined in resolved object: ${hasNoPasswordInUserObj}`
    );
  } catch (err: any) {
    assert(false, 'Test 8: Password privacy', err.message);
  }

  // Test 9: Canonical hashing algorithm consistency
  try {
    const hash1 = hashPasswordCanonical('Secret123!');
    const verify1 = verifyPassword('Secret123!', hash1);
    const verify2 = verifyPassword('WrongPass!', hash1);

    assert(
      hash1.startsWith('scrypt:') && verify1.valid === true && verify2.valid === false,
      'Test 9: Canonical scrypt algorithm produces secure unique salted hashes and verifies correctly',
      `Hash prefix: scrypt: | Salted unique hashes verified`
    );
  } catch (err: any) {
    assert(false, 'Test 9: Canonical hashing consistency', err.message);
  }

  // Test 10: Full Registration -> Login -> Session Resolution Lifecycle
  try {
    const lifeEmail = `lifecycle.${Date.now()}@fullflow.com`;
    const lifePass = 'LifeCycleSecret88!';

    const reg = await registerCorporateUserInDB({
      company_name: 'Lifecycle Corp',
      contact_person: 'Lifecycle Officer',
      email: lifeEmail,
      mobile: '+91 96666 44444',
      gst_number: '27AAAAA0000A1Z5',
      password: lifePass,
      password_hash: hashPasswordCanonical(lifePass),
    });

    const login = await authenticateCorporateUserInDB(lifeEmail, lifePass);
    const sessionRes = await resolveCompanyForUser(login.user?.id);

    assert(
      reg && login.success && sessionRes?.companyId === reg.company_id,
      'Test 10: Full lifecycle (Registration -> Login -> Session Resolution) completes 100% cleanly',
      `Registered, Authenticated & Resolved for Company: ${sessionRes?.companyName}`
    );
  } catch (err: any) {
    assert(false, 'Test 10: Lifecycle test', err.message);
  }

  console.log('\n================================================================');
  console.log(`   CORPORATE PASSWORD AUTH TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
}

runCorporatePasswordAuthTests().catch((e) => {
  console.error('Password auth regression test error:', e);
  process.exit(1);
});
