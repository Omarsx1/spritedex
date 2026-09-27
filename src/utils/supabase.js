import { createClient } from '@supabase/supabase-js';

// Read env variables (set in Vercel or local .env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Evita crear usuarios anónimos reales contra Supabase desde entornos locales.
// Para probar el flujo anónimo en local: VITE_ALLOW_ANON_AUTH=true en .env.local
// Detecta IPs privadas (LAN / red de casa) porque las pruebas en teléfono real
// apuntan a la IP del Mac, no a localhost.
function isPrivateIPv4(host) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!match) return false;
  const first = Number(match[1]);
  const second = Number(match[2]);
  if (first === 10 || first === 127) return true;
  if (first === 192 && second === 168) return true;
  if (first === 172 && second >= 16 && second <= 31) return true;
  return false;
}

export function isLocalEnvironment() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname.toLowerCase();
  return host === 'localhost' || host === '0.0.0.0' || host === '' ||
    host.endsWith('.local') || host.endsWith('.localhost') || isPrivateIPv4(host);
}

// Build de preview de Vercel (o 'vercel dev'): comparte el Supabase de produccion,
// asi que no debe crear usuarios ni escribir analitica.
const buildEnv = typeof __VERCEL_ENV__ === 'string' ? __VERCEL_ENV__ : '';

export function isPreviewEnvironment() {
  return buildEnv === 'preview' || buildEnv === 'development';
}

// Rastreadores y auditorias (Lighthouse, PageSpeed, bots, Chrome headless).
export function isAutomatedClient() {
  if (typeof navigator === 'undefined') return true;
  const ua = (navigator.userAgent || '').toLowerCase();
  return /lighthouse|headlesschrome|pagespeed|gtmetrix|googlebot|bingbot|bot\b|crawler|spider|phantomjs|puppeteer|playwright/.test(ua);
}

export function isAdminPortalPath() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.includes('studio') || path.includes('override') || path.includes('nexus') ||
    search.includes('studio') || search.includes('override');
}

export function shouldSkipAnonymousAuth() {
  if (typeof window === 'undefined') return true;
  // El override solo relaja la proteccion local, nunca la de preview o bots.
  if (import.meta.env.VITE_ALLOW_ANON_AUTH === 'true' && isLocalEnvironment()) return false;
  return isLocalEnvironment() || isPreviewEnvironment() || isAutomatedClient() || isAdminPortalPath();
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
