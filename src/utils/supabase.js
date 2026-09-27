import { createClient } from '@supabase/supabase-js';

// Read env variables (set in Vercel or local .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Evita crear usuarios anónimos reales contra Supabase desde entornos locales.
// Para probar el flujo anónimo en local: VITE_ALLOW_ANON_AUTH=true en .env.local
export function shouldSkipAnonymousAuth() {
  if (typeof window === 'undefined') return true;
  if (import.meta.env.VITE_ALLOW_ANON_AUTH === 'true') return false;
  const host = window.location.hostname.toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '' || host.endsWith('.local');
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
