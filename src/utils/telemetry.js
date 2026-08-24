import { supabase, isSupabaseConfigured } from './supabase';

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

// Record a pageview or custom telemetry event (Non-blocking)
export async function trackEvent(eventType = 'pageview', meta = {}) {
  try {
    const env = getClientEnvironment();
    const sessionId = getOrCreateSessionId();
    const path = typeof window !== 'undefined' ? window.location.pathname : '/';
    const referrer = typeof document !== 'undefined' ? document.referrer : '';

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

      // 3. Fetch recent 50 events for device breakdown and live stream
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (events && events.length > 0) {
        result.recentEvents = events;

        const uniqueSessions = new Set();
        events.forEach((ev) => {
          uniqueSessions.add(ev.session_id);
          const dev = ev.device_type || 'desktop';
          result.deviceBreakdown[dev] = (result.deviceBreakdown[dev] || 0) + 1;
          if (ev.is_iphone) {
            result.deviceBreakdown.iphone = (result.deviceBreakdown.iphone || 0) + 1;
          }
          const br = ev.browser || 'Other';
          result.browserBreakdown[br] = (result.browserBreakdown[br] || 0) + 1;
        });

        result.activeSessionsCount = uniqueSessions.size;
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
