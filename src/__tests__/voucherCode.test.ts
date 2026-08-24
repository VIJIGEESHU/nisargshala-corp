import { generateSecureRedemptionCode, generateHumanReference } from '../lib/voucherCode';

function testVoucherCodeGenerator() {
  console.log('=== TEST 1: Cryptographic Voucher Code Generator ===');
  
  const generatedCodes = new Set<string>();
  const count = 1000;

  for (let i = 0; i < count; i++) {
    const code = generateSecureRedemptionCode();

    // Verify format matching NS-XXXX-XXXX-XXXX
    const regex = /^NS-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/;
    if (!regex.test(code)) {
      throw new Error(`Format validation failed for generated code: ${code}`);
    }

    if (generatedCodes.has(code)) {
      throw new Error(`Unacceptable collision found: ${code}`);
    }
    generatedCodes.add(code);
  }

  console.log(`✓ Successfully generated ${count} unique cryptographic voucher codes with 0 collisions.`);
  console.log(`✓ Sample code: ${Array.from(generatedCodes)[0]}`);
}

function testHumanReference() {
  console.log('=== TEST 2: Human Reference & Order Number ===');
  const humanRef = generateHumanReference(1);
  if (!humanRef.startsWith('NS-CORP-2026-0001')) {
    throw new Error(`Unexpected human reference: ${humanRef}`);
  }
  console.log(`✓ Human reference format verified: ${humanRef}`);
}

testVoucherCodeGenerator();
testHumanReference();
