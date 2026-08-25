import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY || 'placeholder-service-role-key';

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
    throw new Error('SUPABASE_SECRET_KEY client cannot be initialized in the browser.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

/**
 * Check if real Supabase environment variables are configured.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')
  );
}

/**
 * Validate if a string is a valid PostgreSQL UUID format (8-4-4-4-12 hex digits)
 */
export function isValidUUID(str: any): boolean {
  if (typeof str !== 'string' || !str.trim()) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
}
