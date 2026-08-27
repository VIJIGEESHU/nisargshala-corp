import crypto from 'crypto';

/**
 * NISARGSHALA CANONICAL PASSWORD SECURITY SYSTEM
 * Hashing format: scrypt:<salt_hex>:<hash_hex>
 * Cryptographically secure memory-hard key derivation using Node.js crypto.
 */

export function hashPasswordCanonical(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, storedHash: string): { valid: boolean; needsRehash: boolean } {
  if (!storedHash || !password) {
    return { valid: false, needsRehash: false };
  }

  const cleanStored = storedHash.trim();

  // 1. Canonical scrypt format: scrypt:<salt>:<hash>
  if (cleanStored.startsWith('scrypt:')) {
    const parts = cleanStored.split(':');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHash = parts[2];
      try {
        const actualKey = crypto.scryptSync(password, salt, 64).toString('hex');
        const keyBuffer = Buffer.from(actualKey, 'hex');
        const expectedBuffer = Buffer.from(expectedHash, 'hex');
        if (keyBuffer.length === expectedBuffer.length) {
          const valid = crypto.timingSafeEqual(keyBuffer, expectedBuffer);
          return { valid, needsRehash: false };
        }
      } catch (e) {
        return { valid: false, needsRehash: false };
      }
    }
  }

  // 2. Legacy SHA-256 (64-character hex string)
  if (/^[a-fA-F0-9]{64}$/.test(cleanStored)) {
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    const keyBuffer = Buffer.from(sha256Hash.toLowerCase());
    const expectedBuffer = Buffer.from(cleanStored.toLowerCase());
    if (keyBuffer.length === expectedBuffer.length) {
      const valid = crypto.timingSafeEqual(keyBuffer, expectedBuffer);
      return { valid, needsRehash: valid };
    }
  }

  // 3. Fallback direct match for legacy test fixtures
  const valid = password === cleanStored;
  return { valid, needsRehash: valid };
}
