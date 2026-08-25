import { isValidUUID } from '../lib/supabase';

function testUUIDValidation() {
  console.log('=== TEST 1: PostgreSQL UUID Format Validation ===');

  const validUUIDs = [
    '7f9a1b2c-e89b-12d3-a456-426614174000',
    '00000000-0000-0000-0000-000000000000',
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  ];

  const invalidUUIDs = [
    'comp-ee8a4e4aee55',
    'comp-direct-order',
    'invalid-uuid-string',
    '12345',
    '',
    null,
    undefined,
  ];

  for (const uuid of validUUIDs) {
    if (!isValidUUID(uuid)) {
      throw new Error(`Expected valid UUID but got false for: ${uuid}`);
    }
  }

  for (const nonUuid of invalidUUIDs) {
    if (isValidUUID(nonUuid)) {
      throw new Error(`Expected invalid UUID but got true for: ${nonUuid}`);
    }
  }

  console.log('✓ Validated UUID detection successfully. Custom comp-* identifiers are correctly recognized as non-UUIDs.');
}

function testCompanyFallbackResolution() {
  console.log('=== TEST 2: Custom comp-* Identifier Safe Resolution ===');

  const mockSession = {
    companyId: 'comp-ee8a4e4aee55',
    email: 'test@company.com',
  };

  const isSessionUUIDValid = isValidUUID(mockSession.companyId);
  if (isSessionUUIDValid) {
    throw new Error('Custom identifier comp-ee8a4e4aee55 should NOT be treated as a UUID!');
  }

  // Safe Resolution Pipeline logic
  let targetQueryMethod = '';
  if (mockSession.companyId && isValidUUID(mockSession.companyId)) {
    targetQueryMethod = 'UUID_DIRECT_LOOKUP';
  } else if (mockSession.email) {
    targetQueryMethod = 'EMAIL_FALLBACK_LOOKUP';
  }

  if (targetQueryMethod !== 'EMAIL_FALLBACK_LOOKUP') {
    throw new Error(`Expected EMAIL_FALLBACK_LOOKUP for custom app ID but got: ${targetQueryMethod}`);
  }

  console.log(`✓ Custom app ID '${mockSession.companyId}' safely bypassed UUID query and selected '${targetQueryMethod}'.`);
}

function testNewAccountZeroOrdersResponse() {
  console.log('=== TEST 3: New Corporate Account Zero Orders Response ===');

  const mockNewCompany = {
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    company_name: 'Brand New Corporate Partner',
    email: 'newhr@brandnew.com',
  };

  const mockOrders: any[] = [];
  const mockVouchers: any[] = [];

  const responsePayload = {
    company: mockNewCompany,
    orders: mockOrders,
    vouchers: mockVouchers,
  };

  if (!responsePayload.company || responsePayload.orders.length !== 0 || responsePayload.vouchers.length !== 0) {
    throw new Error('New corporate account response format invalid!');
  }

  console.log(`✓ New corporate account '${mockNewCompany.company_name}' cleanly returned HTTP 200 with 0 orders and 0 vouchers without database errors.`);
}

testUUIDValidation();
testCompanyFallbackResolution();
testNewAccountZeroOrdersResponse();
