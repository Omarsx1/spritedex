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
  const isIphone = /iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isIpad = /iPad/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIphone || isIpad || isAndroid || /Mobi|Tablet/i.test(ua);

  let os = 'Other';
  if (isIphone) os = 'iOS (iPhone)';
  else if (isIpad) os = 'iPadOS';
  else if (isAndroid) os = 'Android';
  else if (/Macintosh|Mac OS X/.test(ua)) os = 'macOS';
  else if (/Windows NT/.test(ua)) os = 'Windows';
  else if (/Linux/.test(ua)) os = 'Linux';

  let browser = 'Other';
  if (/CriOS|Chrome/.test(ua) && !/Edge|OPR|Edg/.test(ua)) browser = 'Chrome';
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

    // Cache locally
    try {
      const existing = JSON.parse(localStorage.getItem(LOCAL_ANALYTICS_KEY) || '[]');
      const updated = [{
        event_type: eventType,
        session_id: sessionId,
        ...env,
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
          if (ref.includes('twitter') || ref.includes('t.co') || ref.includes('x.com')) ch = 'Twitter / X';
          else if (ref.includes('tiktok')) ch = 'TikTok';
          else if (ref.includes('google')) ch = 'Google Búsquedas';
          else if (ref.includes('discord')) ch = 'Discord';
          else if (ref.includes('instagram')) ch = 'Instagram';
          else if (ref.includes('youtube')) ch = 'YouTube';
          else if (ref.includes('reddit')) ch = 'Reddit';
          else if (ref.includes('facebook') || ref.includes('fb')) ch = 'Facebook';
          else if (ref.includes('campaign:')) {
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
          const dev = ev.device_type || 'desktop';
          result.deviceBreakdown[dev] = (result.deviceBreakdown[dev] || 0) + 1;
          if (ev.is_iphone) {
            result.deviceBreakdown.iphone = (result.deviceBreakdown.iphone || 0) + 1;
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
