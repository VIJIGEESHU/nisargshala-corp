interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitRecord>();

/**
 * In-memory sliding window rate limiter.
 * @param ip IP address or identifier
 * @param limit Max requests permitted per window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(
  ip: string,
  limit: number = 10,
  windowMs: number = 60000
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = store.get(ip);

  // Clean expired entries periodically
  if (store.size > 10000) {
    for (const [key, item] of store.entries()) {
      if (item.resetTime < now) {
        store.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    store.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { success: true, remaining: limit - 1, resetTime: now + windowMs };
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count += 1;
  store.set(ip, record);

  return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}
