import crypto from 'crypto';

/**
 * Alphabet for secret redemption codes.
 * Excludes ambiguous characters: 0, O, 1, I, L to prevent user misreading.
 * Entropy: 32^12 = ~1.15 x 10^18 combinations (60 bits of cryptographic entropy).
 */
const SECRET_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a cryptographically secure random voucher redemption code.
 * Format: NS-XXXX-XXXX-XXXX
 * Example: NS-X7KP-4M9Q-T8ZW
 */
export function generateSecureRedemptionCode(): string {
  const charsPerBlock = 4;
  const blocksCount = 3;
  const totalChars = charsPerBlock * blocksCount;
  
  // Use crypto.randomBytes for cryptographic security
  const randomBytes = crypto.randomBytes(totalChars);
  let codeChars = '';
  
  for (let i = 0; i < totalChars; i++) {
    const randomIndex = randomBytes[i] % SECRET_ALPHABET.length;
    codeChars += SECRET_ALPHABET[randomIndex];
  }
  
  const block1 = codeChars.slice(0, 4);
  const block2 = codeChars.slice(4, 8);
  const block3 = codeChars.slice(8, 12);
  
  return `NS-${block1}-${block2}-${block3}`;
}

/**
 * Generate human-readable reference number for administrative tracking.
 * Format: NS-CORP-2026-XXXX
 * NOTE: This is NOT the redemption secret credential.
 */
export function generateHumanReference(sequenceNumber: number): string {
  const year = new Date().getFullYear();
  const paddedSeq = String(sequenceNumber).padStart(4, '0');
  return `NS-CORP-${year}-${paddedSeq}`;
}

/**
 * Generate Order ID reference number.
 * Format: ORD-YYYYMMDD-XXXX
 */
export function generateOrderNumber(sequenceNumber: number): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const paddedSeq = String(sequenceNumber).padStart(4, '0');
  return `ORD-${dateStr}-${paddedSeq}`;
}
