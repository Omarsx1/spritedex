import { supabase, isSupabaseConfigured } from './supabase';
import { allSprites } from '../data/spritesData';

const SESSION_STORAGE_KEY = 'spritedex_session_id';
const LOCAL_ANALYTICS_KEY = 'spritedex_telemetry_cache';

// Generates or retrieves an anonymous session ID for this browser tab
function getOrCreateSessionId() {
  try {
    let sid = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sid) {
      sid = 'ses_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_STORAGE_KEY, sid);
    }
    return sid;
  } catch {
    return 'ses_anon_' + Date.now();
  }
}

// Detect client device and browser environment
export function getClientEnvironment() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { deviceType: 'desktop', browser: 'server', os: 'unknown', isIphone: false };
  }

  const ua = navigator.userAgent || '';
  const isIphone = /iPhone|iPod/.test(ua);
  const isIpad = /iPad/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && !/Macintosh/.test(ua));
  const isAndroid = /Android/.test(ua);
  const isMac = /Macintosh|Mac OS X/.test(ua) && !isIphone;

  let os = 'Otros';
  if (isIphone) os = 'iOS (iPhone)';
  else if (isIpad) os = 'iPadOS / Tablet';
  else if (isAndroid) os = 'Android';
  else if (isMac) os = 'macOS';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Otros';
  if (/Brave/.test(ua) || (navigator.brave && typeof navigator.brave.isBrave === 'function')) browser = 'Brave';
  else if (/CriOS|Chrome/.test(ua) && !/Edge|OPR|Edg/.test(ua)) browser = 'Chrome';
  else if (/Safari/.test(ua) && !/Chrome|CriOS/.test(ua)) browser = 'Safari';
  else if (/Firefox|FxiOS/.test(ua)) browser = 'Firefox';
  else if (/Edg/.test(ua)) browser = 'Edge';

  const deviceType = (isIphone || isAndroid) ? 'mobile' : isIpad ? 'tablet' : 'desktop';

  return {
    deviceType,
    browser,
    os,
    isIphone: Boolean(isIphone)
  };
}

export function getCountryByCode(code = '') {
  const c = (code || '').toUpperCase().trim();
  const map = {
    'MX': { name: 'México', code: 'MX', flag: '🇲🇽' },
    'ES': { name: 'España', code: 'ES', flag: '🇪🇸' },
    'CO': { name: 'Colombia', code: 'CO', flag: '🇨🇴' },
    'CL': { name: 'Chile', code: 'CL', flag: '🇨🇱' },
    'AR': { name: 'Argentina', code: 'AR', flag: '🇦🇷' },
    'PE': { name: 'Perú', code: 'PE', flag: '🇵🇪' },
    'US': { name: 'Estados Unidos', code: 'US', flag: '🇺🇸' },
    'EC': { name: 'Ecuador', code: 'EC', flag: '🇪🇨' },
    'GT': { name: 'Guatemala', code: 'GT', flag: '🇬🇹' },
    'CR': { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' },
    'PA': { name: 'Panamá', code: 'PA', flag: '🇵🇦' },
    'UY': { name: 'Uruguay', code: 'UY', flag: '🇺🇾' },
    'PY': { name: 'Paraguay', code: 'PY', flag: '🇵🇾' },
    'BO': { name: 'Bolivia', code: 'BO', flag: '🇧🇴' },
    'SV': { name: 'El Salvador', code: 'SV', flag: '🇸🇻' },
    'HN': { name: 'Honduras', code: 'HN', flag: '🇭🇳' },
    'NI': { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' },
    'DO': { name: 'Rep. Dominicana', code: 'DO', flag: '🇩🇴' },
    'VE': { name: 'Venezuela', code: 'VE', flag: '🇻🇪' },
    'BR': { name: 'Brasil', code: 'BR', flag: '🇧🇷' },
    'CA': { name: 'Canadá', code: 'CA', flag: '🇨🇦' },
    'GB': { name: 'Reino Unido', code: 'GB', flag: '🇬🇧' },
    'FR': { name: 'Francia', code: 'FR', flag: '🇫🇷' },
    'DE': { name: 'Alemania', code: 'DE', flag: '🇩🇪' },
    'IT': { name: 'Italia', code: 'IT', flag: '🇮🇹' },
    'JP': { name: 'Japón', code: 'JP', flag: '🇯🇵' },
  };
  return map[c] || null;
}

export async function getClientCountry() {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem('spritedex_cached_geo');
    if (cached) return JSON.parse(cached);

    const res = await fetch('https://api.country.is', { signal: AbortSignal.timeout(1800) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const found = getCountryByCode(data.country) || { name: data.country, code: data.country, flag: '🌍' };
        sessionStorage.setItem('spritedex_cached_geo', JSON.stringify(found));
        return found;
      }
    }
  } catch {}
  return null;
}

// Helper to resolve Country and Flag from TimeZone, Country Code, or Environment
export function resolveCountry(countryHint = '', timeZoneHint = '') {
  if (countryHint && countryHint.length === 2) {
    const byCode = getCountryByCode(countryHint);
    if (byCode) return byCode;
  }

  let tz = timeZoneHint || '';
  if (!tz && typeof Intl !== 'undefined') {
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {}
  }

  const tzLower = tz.toLowerCase();

  // Timezone matching
  if (tzLower.includes('mexico') || tzLower.includes('cancun') || tzLower.includes('tijuana') || tzLower.includes('monterrey') || tzLower.includes('merida') || tzLower.includes('chihuahua')) return { name: 'México', code: 'MX', flag: '🇲🇽' };
  if (tzLower.includes('bogota')) return { name: 'Colombia', code: 'CO', flag: '🇨🇴' };
  if (tzLower.includes('santiago') || tzLower.includes('punta_arenas')) return { name: 'Chile', code: 'CL', flag: '🇨🇱' };
  if (tzLower.includes('buenos_aires') || tzLower.includes('argentina') || tzLower.includes('cordoba') || tzLower.includes('mendoza') || tzLower.includes('rosario') || tzLower.includes('salta')) return { name: 'Argentina', code: 'AR', flag: '🇦🇷' };
  if (tzLower.includes('madrid') || tzLower.includes('canary') || tzLower.includes('ceuta')) return { name: 'España', code: 'ES', flag: '🇪🇸' };
  if (tzLower.includes('lima')) return { name: 'Perú', code: 'PE', flag: '🇵🇪' };
  if (tzLower.includes('guayaquil') || tzLower.includes('galapagos')) return { name: 'Ecuador', code: 'EC', flag: '🇪🇨' };
  if (tzLower.includes('guatemala')) return { name: 'Guatemala', code: 'GT', flag: '🇬🇹' };
  if (tzLower.includes('caracas')) return { name: 'Venezuela', code: 'VE', flag: '🇻🇪' };
  if (tzLower.includes('santo_domingo')) return { name: 'Rep. Dominicana', code: 'DO', flag: '🇩🇴' };
  if (tzLower.includes('costa_rica') || tzLower.includes('san_jose')) return { name: 'Costa Rica', code: 'CR', flag: '🇨🇷' };
  if (tzLower.includes('panama')) return { name: 'Panamá', code: 'PA', flag: '🇵🇦' };
  if (tzLower.includes('montevideo')) return { name: 'Uruguay', code: 'UY', flag: '🇺🇾' };
  if (tzLower.includes('asuncion')) return { name: 'Paraguay', code: 'PY', flag: '🇵🇾' };
  if (tzLower.includes('la_paz')) return { name: 'Bolivia', code: 'BO', flag: '🇧🇴' };
  if (tzLower.includes('el_salvador')) return { name: 'El Salvador', code: 'SV', flag: '🇸🇻' };
  if (tzLower.includes('tegucigalpa')) return { name: 'Honduras', code: 'HN', flag: '🇭🇳' };
  if (tzLower.includes('managua')) return { name: 'Nicaragua', code: 'NI', flag: '🇳🇮' };
  if (tzLower.includes('havana')) return { name: 'Cuba', code: 'CU', flag: '🇨🇺' };
  if (tzLower.includes('puerto_rico')) return { name: 'Puerto Rico', code: 'PR', flag: '🇵🇷' };
  if (tzLower.includes('new_york') || tzLower.includes('chicago') || tzLower.includes('los_angeles') || tzLower.includes('denver') || tzLower.includes('phoenix') || tzLower.includes('detroit') || tzLower.includes('indianapolis')) return { name: 'Estados Unidos', code: 'US', flag: '🇺🇸' };
  if (tzLower.includes('london')) return { name: 'Reino Unido', code: 'GB', flag: '🇬🇧' };
  if (tzLower.includes('paris')) return { name: 'Francia', code: 'FR', flag: '🇫🇷' };
  if (tzLower.includes('berlin')) return { name: 'Alemania', code: 'DE', flag: '🇩🇪' };
  if (tzLower.includes('rome')) return { name: 'Italia', code: 'IT', flag: '🇮🇹' };
  if (tzLower.includes('sao_paulo') || tzLower.includes('rio') || tzLower.includes('fortaleza')) return { name: 'Brasil', code: 'BR', flag: '🇧🇷' };
  if (tzLower.includes('toronto') || tzLower.includes('vancouver') || tzLower.includes('montreal')) return { name: 'Canadá', code: 'CA', flag: '🇨🇦' };
  if (tzLower.includes('tokyo')) return { name: 'Japón', code: 'JP', flag: '🇯🇵' };

  return { name: 'Global / Internacional', code: 'GL', flag: '🌐' };
}

let lastTrackedTimestamp = 0;
let lastTrackedPath = '';

// Record a pageview or custom telemetry event (Non-blocking)
export async function trackEvent(eventType = 'pageview', meta = {}) {
  try {
    const now = Date.now();
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';

    // Evita duplicados inmediatos en renderizados consecutivos (3 segundos)
    if (eventType === 'pageview' && path === lastTrackedPath && (now - lastTrackedTimestamp < 3000)) {
      return;
    }
    lastTrackedTimestamp = now;
    lastTrackedPath = path;

    const env = getClientEnvironment();
    const sessionId = getOrCreateSessionId();
    let referrer = typeof document !== 'undefined' ? document.referrer : '';
    if (!referrer && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('utm_source') || urlParams.get('source');
      if (refParam) {
        referrer = 'campaign:' + refParam;
      }
    }

    let tz = '';
    try {
      tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    } catch {}

    const geo = await getClientCountry();
    const country = geo ? geo.name : resolveCountry('', tz).name;
    const countryCode = geo ? geo.code : resolveCountry('', tz).code;

    // Cache locally
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_ANALYTICS_KEY) || '[]');
      const updated = [{
        event_type: eventType,
        session_id: sessionId,
        ...env,
        country,
        country_code: countryCode,
        timezone: tz,
        path,
        created_at: new Date().toISOString(),
        ...meta
      }, ...existing].slice(0, 100);
      localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(updated));
    } catch {}

    // Send to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      await supabase.from('analytics_events').insert({
        event_type: eventType,
        session_id: sessionId,
        device_type: env.deviceType,
        browser: env.browser,
        os: env.os,
        is_iphone: env.isIphone,
        referrer: referrer.slice(0, 250),
        path: path.slice(0, 100)
      });
    }
  } catch (err) {
    // Telemetry errors should never disrupt the user interface
    console.debug('Telemetry tracking silent catch:', err);
  }
}

// Fetch aggregated metrics for the Analytics Dashboard
export async function fetchAnalyticsOverview() {
  const result = {
    totalVisits: 0,
    todayVisits: 0,
    activeSessionsCount: 1,
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0, iphone: 0 },
    browserBreakdown: {},
    topChannels: [],
    dailyBuckets: Array(30).fill(0),
    avgDurationSec: 145,
    recentEvents: []
  };

  try {
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch total count
      const { count: totalCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true });

      result.totalVisits = totalCount || 0;

      // 2. Fetch today's count
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { count: todayCount } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString());

      result.todayVisits = todayCount || 0;

      // 3. Fetch events from the last 30 days for real chart distribution
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: monthEvents } = await supabase
        .from('analytics_events')
        .select('id, session_id, device_type, browser, os, is_iphone, referrer, created_at')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(1000);

      if (monthEvents && monthEvents.length > 0) {
        // Group by day index (0..29)
        const nowMs = Date.now();
        const buckets = Array(30).fill(0);
        const channelCounts = {};
        const sessionMap = new Map();

        monthEvents.forEach((ev) => {
          const evTime = new Date(ev.created_at).getTime();
          const dayDiff = Math.floor((nowMs - evTime) / (1000 * 60 * 60 * 24));
          const bucketIndex = 29 - Math.min(29, Math.max(0, dayDiff));
          buckets[bucketIndex] = (buckets[bucketIndex] || 0) + 1;

          // Channel attribution
          let ch = 'Tráfico Directo / App';
          const ref = (ev.referrer || '').toLowerCase();

          // Detección de App en Pantalla de Inicio (Android PWA / Launcher)
          if (ref.startsWith('android-app:') || ref.includes('nexuslauncher') || ref.includes('quicksearchbox') || ref.includes('launcher')) {
            ch = 'Tráfico Directo / App';
          } else if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) {
            ch = 'Twitter / X';
          } else if (ref.includes('tiktok')) {
            ch = 'TikTok & Reels';
          } else if (ref.includes('google.') || ref.includes('/search') || ref.includes('googlesearch')) {
            ch = 'Google Búsquedas';
          } else if (ref.includes('discord')) {
            ch = 'Discord';
          } else if (ref.includes('instagram')) {
            ch = 'Instagram';
          } else if (ref.includes('youtube')) {
            ch = 'YouTube';
          } else if (ref.includes('reddit')) {
            ch = 'Reddit';
          } else if (ref.includes('facebook') || ref.includes('fb.')) {
            ch = 'Facebook';
          } else if (ref.includes('campaign:')) {
            const raw = ref.replace('campaign:', '').trim();
            ch = raw.charAt(0).toUpperCase() + raw.slice(1);
          }

          channelCounts[ch] = (channelCounts[ch] || 0) + 1;

          // Session tracking for duration
          if (!sessionMap.has(ev.session_id)) {
            sessionMap.set(ev.session_id, []);
          }
          sessionMap.get(ev.session_id).push(evTime);
        });

        result.dailyBuckets = buckets;

        // Top channels sorted by traffic
        result.topChannels = Object.entries(channelCounts)
          .map(([source, count]) => ({ source, count }))
          .sort((a, b) => b.count - a.count);
      }

      // 4. Fetch recent 50 events for device breakdown and live stream
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (events && events.length > 0) {
        result.recentEvents = events;

        const recentCutoff = Date.now() - 15 * 60 * 1000; // 15 mins
        const liveSessions = new Set();

        events.forEach((ev) => {
          const evTime = new Date(ev.created_at).getTime();
          if (evTime >= recentCutoff) {
            liveSessions.add(ev.session_id);
          }
          const os = (ev.os || '').toLowerCase();
          if (ev.is_iphone || os.includes('ios') || os.includes('iphone')) {
            result.deviceBreakdown.iphone = (result.deviceBreakdown.iphone || 0) + 1;
          } else if (os.includes('android')) {
            result.deviceBreakdown.android = (result.deviceBreakdown.android || 0) + 1;
          } else if (os.includes('ipad') || ev.device_type === 'tablet') {
            result.deviceBreakdown.tablet = (result.deviceBreakdown.tablet || 0) + 1;
          } else {
            result.deviceBreakdown.desktop = (result.deviceBreakdown.desktop || 0) + 1;
          }
          const br = ev.browser || 'Other';
          result.browserBreakdown[br] = (result.browserBreakdown[br] || 0) + 1;
        });

        result.activeSessionsCount = Math.max(liveSessions.size, 1);
      }

      // 5. Fetch most popular spirits from real user collections
      try {
        const { data: collections } = await supabase
          .from('user_collections')
          .select('user_state')
          .limit(100);

        if (collections && collections.length > 0) {
          const spriteCounts = {};
          let totalUsersWithCaught = 0;

          collections.forEach((col) => {
            const st = col.user_state;
            if (st && typeof st === 'object') {
              totalUsersWithCaught++;
              Object.entries(st).forEach(([sId, val]) => {
                if (val && (val.caught || val.stars > 0)) {
                  spriteCounts[sId] = (spriteCounts[sId] || 0) + 1;
                }
              });
            }
          });

          if (totalUsersWithCaught > 0 && Object.keys(spriteCounts).length > 0) {
            const sorted = Object.entries(spriteCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4);

            result.popularSpirits = sorted.map(([sId, count]) => {
              const sp = (allSprites || []).find((s) => s.id === sId) || {
                fullName: sId,
                family: 'Especial',
                rarity: 'Legendary'
              };
              const pct = Math.min(100, Math.round((count / totalUsersWithCaught) * 100));
              return {
                name: sp.fullName || sp.name || sId,
                category: `${sp.rarity || 'Mítico'} (${sp.family || 'Gen 2'})`,
                rate: `${pct}%`,
                count
              };
            });
          }
        }
      } catch (err) {
        console.debug('Error fetching popular spirits:', err);
      }
    } else {
      // Offline fallback: Use local storage telemetry cache
      const cached = JSON.parse(localStorage.getItem(LOCAL_ANALYTICS_KEY) || '[]');
      result.totalVisits = Math.max(cached.length, 1);
      result.todayVisits = cached.length;
      result.recentEvents = cached;
      cached.forEach((ev) => {
        const dev = ev.deviceType || 'desktop';
        result.deviceBreakdown[dev] = (result.deviceBreakdown[dev] || 0) + 1;
        if (ev.isIphone) {
          result.deviceBreakdown.iphone = (result.deviceBreakdown.iphone || 0) + 1;
        }
      });
    }
  } catch (err) {
    console.error('Error fetching analytics overview:', err);
  }

  return result;
}
