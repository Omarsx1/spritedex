// Read env variables (set in Vercel or local .env)
// El respaldo es para Node (pruebas): ahi import.meta.env no existe y sin esto el modulo
// ni siquiera se podia cargar fuera del navegador.
const entorno = (import.meta && import.meta.env) || {};
const supabaseUrl = entorno.VITE_SUPABASE_URL || '';
const supabaseAnonKey = entorno.VITE_SUPABASE_ANON_KEY || '';

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
  if (navigator.webdriver) return true;
  const ua = (navigator.userAgent || '').toLowerCase();
  return /lighthouse|headlesschrome|pagespeed|gtmetrix|googlebot|bingbot|bot\b|crawler|spider|phantomjs|puppeteer|playwright|bytespider|yandex|duckduckbot|baiduspider|semrush|ahrefs|facebookexternalhit|slackbot|discordbot|twitterbot|whatsapp|telegrambot|vkshare|w3c_validator/.test(ua);
}

export function isAdminPortalPath() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.toLowerCase();
  const search = window.location.search.toLowerCase();
  return path.includes('studio') || path.includes('override') || path.includes('nexus') ||
    search.includes('studio') || search.includes('override');
}

// Tuneles de desarrollo (cloudflare, ngrok, etc.): su host es publico, asi que sin
// esto la app los trata como produccion y crea usuarios reales durante las pruebas.
export function isDevTunnelHost() {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname.toLowerCase();
  return ['.trycloudflare.com', '.ngrok-free.app', '.ngrok.io', '.loca.lt', '.localhost.run', '.serveo.net', '.devtunnels.ms']
    .some((suffix) => host.endsWith(suffix));
}

export function shouldSkipAnonymousAuth() {
  if (typeof window === 'undefined') return true;
  // Modo demo (tuneles, presentaciones): nunca crea usuarios reales.
  if (entorno.VITE_DEMO_MODE === 'true') return true;
  // El override solo relaja la proteccion local, nunca la de preview o bots.
  if (entorno.VITE_ALLOW_ANON_AUTH === 'true' && isLocalEnvironment()) return false;
  return isLocalEnvironment() || isPreviewEnvironment() || isAutomatedClient() || isAdminPortalPath() || isDevTunnelHost();
}

// El SDK pesa ~52 KB gzip y no hace falta para el primer pintado: se importa
// bajo demanda y se memoiza. warmSupabase() lo calienta cuando el navegador
// queda libre, para que la primera accion lo encuentre listo.
let clientPromise = null;

export function getSupabase() {
  if (!isSupabaseConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js')
      .then(({ createClient }) =>
        createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        })
      )
      .catch((error) => {
        clientPromise = null;
        throw error;
      });
  }
  return clientPromise;
}

let warmPromise = null;

// Resuelve cuando la pagina termino de cargar y el navegador esta libre. El
// arranque de auth lo espera para que la descarga del SDK no compita con la
// imagen y las fuentes del primer pintado.
export function warmSupabase() {
  if (!isSupabaseConfigured || typeof window === 'undefined') return Promise.resolve(null);
  if (!warmPromise) {
    warmPromise = new Promise((resolve) => {
      let done = false;
      const run = () => {
        if (done) return;
        done = true;
        getSupabase().then(resolve).catch(() => resolve(null));
      };
      const schedule = () => {
        if (typeof requestIdleCallback === 'function') {
          requestIdleCallback(run, { timeout: 3000 });
        } else {
          setTimeout(run, 200);
        }
      };
      if (document.readyState === 'complete') {
        schedule();
      } else {
        window.addEventListener('load', schedule, { once: true });
        // Red de seguridad: si el evento load nunca llega (un recurso colgado),
        // el arranque de auth no debe quedarse esperando para siempre.
        setTimeout(run, 4000);
      }
    });
  }
  return warmPromise;
}
