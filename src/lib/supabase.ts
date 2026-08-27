import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'placeholder-anon-key';

/**
 * Server-only helper to resolve the Supabase Service Role Key across standard env var names:
 * 1. SUPABASE_SERVICE_ROLE_KEY (Vercel / Supabase integration default)
 * 2. SUPABASE_SECRET_KEY (Supabase newer naming convention)
 * 3. SUPABASE_SERVICE_KEY
 * 4. SUPABASE_KEY
 */
function getResolvedServiceRoleKey(): string {
  if (typeof window !== 'undefined') return '';
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_KEY ||
    ''
  );
}

// Safe storage wrapper for Supabase Auth to prevent iOS Safari SecurityError in Private Browsing mode
const safeStorage = {
  getItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (e) {}
    return null;
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (e) {}
  },
  removeItem: (key: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (e) {}
  },
};

// Public Supabase client (browser/client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
  },
});

// Admin Supabase client (server-side only with service role key)
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY client cannot be initialized in the browser.');
  }

  const serviceRoleKey = getResolvedServiceRoleKey();
  if (!serviceRoleKey || serviceRoleKey.includes('placeholder') || serviceRoleKey.includes('dummy')) {
    throw new Error('SUPABASE_SERVER_KEY_MISSING: Privileged server key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY) is not configured in server environment variables.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Check if real Supabase environment variables (URL + Service Role Key) are configured.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = getResolvedServiceRoleKey();

  const isUrlValid = Boolean(url && !url.includes('placeholder') && !url.includes('dummy'));
  const isKeyValid = Boolean(serviceKey && !serviceKey.includes('placeholder') && !serviceKey.includes('dummy'));

  return isUrlValid && isKeyValid;
}

/**
 * Validate if a string is a valid PostgreSQL UUID format (8-4-4-4-12 hex digits)
 */
export function isValidUUID(str: any): boolean {
  if (typeof str !== 'string' || !str.trim()) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}
