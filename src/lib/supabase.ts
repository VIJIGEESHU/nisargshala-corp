import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY || 'placeholder-service-role-key';

// Public Supabase client (browser/client-side)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
