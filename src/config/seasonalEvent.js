import { safeStorage } from '../utils/safeStorage.js';

/**
 * Seasonal event configuration: Fortnitemares (Halloween).
 *
 * Window: 2026-10-01T00:00:00-05:00 through 2026-11-04T00:00:00-05:00.
 * The explicit -05:00 offset anchors the boundary for every visitor
 * regardless of the browser timezone, so the event cannot drift.
 *
 * TODO(launch): confirm the exact production start/end instants before
 * shipping. The 2026-11-04 end instant is provisional.
 */

// Storage keys
export const INTRO_SEEN_KEY = 'spritedex_fortnitemares_intro_seen_v1';
export const SEASON_OVERRIDE_KEY = 'spritedex_halloween_override';

// Deterministic boundaries: explicit UTC offset, never parsed as local time.
export const FORTNITEMARES_START = new Date('2026-10-01T00:00:00-05:00');
export const FORTNITEMARES_END = new Date('2026-11-04T00:00:00-05:00');

// Developer preview controls (URL query, storage override, console helpers,
// intro replay) are honored by development builds only. Production always
// resolves from the window.
export const IS_DEV_BUILD = Boolean(import.meta.env && import.meta.env.DEV);

// Idle re-check ceiling: setTimeout overflows past ~24.8 days.
const MAX_SCHEDULER_DELAY_MS = 6 * 60 * 60 * 1000;

// One-time cinematic pacing, in milliseconds from the transition start.
// Tuned as a trailer sting (about 1.9 s) instead of a loading screen. `end`
// must stay at least 600 ms after `fade` so the overlay's CSS opacity
// transition (see .fnm-transition-overlay in styles/index.css) can finish.
export const INTRO_TIMELINE = {
  bootDelay: 180,
  corrupt: 120,
  transform: 320,
  curse: 780,
  fade: 1300,
  end: 1900
};

/**
 * Pure seasonal resolver: no globals, so it can be unit tested directly.
 */
export function resolveSeasonalState({ now = new Date(), isDev = false, search = '', storedOverride = null } = {}) {
  if (isDev) {
    const params = new URLSearchParams(search || '');
    const flag = params.get('halloween') ?? params.get('fortnitemares');
    if (flag === '0' || flag === 'false') return false;
    if (flag === '1' || flag === 'true') return true;
    if (storedOverride === 'true') return true;
    if (storedOverride === 'false') return false;
    // Development default: keep the theme visible while building locally.
    return true;
  }

  const time = now.getTime();
  return time >= FORTNITEMARES_START.getTime() && time < FORTNITEMARES_END.getTime();
}

/**
 * Next instant at which the resolved state changes, or null once the window ended.
 */
export function getNextSeasonalBoundary(now = new Date()) {
  const time = now.getTime();
  if (time < FORTNITEMARES_START.getTime()) return FORTNITEMARES_START;
  if (time < FORTNITEMARES_END.getTime()) return FORTNITEMARES_END;
  return null;
}

/**
 * Whether the seasonal event is active right now.
 */
export function isFortnitemaresActive(now = new Date()) {
  if (typeof window === 'undefined') return false;

  let search = '';
  try {
    search = window.location?.search || '';
  } catch {
    search = '';
  }

  let storedOverride = null;
  try {
    storedOverride = safeStorage.getItem(SEASON_OVERRIDE_KEY);
  } catch {
    storedOverride = null;
  }

  return resolveSeasonalState({ now, isDev: IS_DEV_BUILD, search, storedOverride });
}

/**
 * Whether this browser already saw the one-time cinematic.
 */
export function hasSeenFortnitemaresIntro() {
  try {
    return safeStorage.getItem(INTRO_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Remembers that the one-time cinematic was shown.
 */
export function markFortnitemaresIntroSeen() {
  try {
    safeStorage.setItem(INTRO_SEEN_KEY, 'true');
  } catch {
    // storage unavailable: nothing to persist
  }
}

/**
 * Forgets the cinematic flag so it can be replayed.
 */
export function resetFortnitemaresIntro() {
  try {
    safeStorage.removeItem(INTRO_SEEN_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

/**
 * Applies or removes the global 'theme-fortnitemares' class on <html> and <body>.
 */
export function applySeasonalTheme(active = isFortnitemaresActive()) {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  if (active) {
    html.classList.add('theme-fortnitemares');
    body?.classList.add('theme-fortnitemares');
  } else {
    html.classList.remove('theme-fortnitemares');
    body?.classList.remove('theme-fortnitemares');
  }
}

/**
 * Announces a seasonal change to listeners (Header listens for this so the
 * pumpkin and the wordmark swap without a full re-render).
 */
export function windowDispatchSeasonChange(active) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('spritedex:season-change', { detail: { active: Boolean(active) } }));
}

/**
 * Keeps the theme correct while a tab stays open: re-checks at the next window
 * boundary, when the tab becomes visible again, and when it regains focus.
 * Returns an unsubscribe function.
 */
export function subscribeSeasonalState(onChange) {
  if (typeof window === 'undefined') return () => {};

  let last = isFortnitemaresActive();
  let timer = null;
  let disposed = false;

  const evaluate = () => {
    if (disposed) return;
    const next = isFortnitemaresActive();
    if (next === last) return;
    last = next;
    applySeasonalTheme(next);
    if (typeof onChange === 'function') onChange(next);
  };

  const schedule = () => {
    if (disposed) return;
    if (timer) clearTimeout(timer);
    const boundary = getNextSeasonalBoundary(new Date());
    const delay = boundary
      ? Math.min(Math.max(boundary.getTime() - Date.now() + 250, 1000), MAX_SCHEDULER_DELAY_MS)
      : MAX_SCHEDULER_DELAY_MS;
    timer = setTimeout(() => {
      evaluate();
      schedule();
    }, delay);
  };

  const onWake = () => evaluate();

  document.addEventListener('visibilitychange', onWake);
  window.addEventListener('focus', onWake);
  schedule();

  return () => {
    disposed = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener('visibilitychange', onWake);
    window.removeEventListener('focus', onWake);
  };
}

// Development-only console helpers.
if (IS_DEV_BUILD && typeof window !== 'undefined') {
  window.isFortnitemaresActive = isFortnitemaresActive;

  window.toggleFortnitemares = (enable) => {
    const next = enable !== undefined ? Boolean(enable) : !isFortnitemaresActive();
    safeStorage.setItem(SEASON_OVERRIDE_KEY, next ? 'true' : 'false');
    applySeasonalTheme(next);
    window.dispatchEvent(new CustomEvent('spritedex:season-change', { detail: { active: next } }));
    console.info('Fortnitemares ' + (next ? 'enabled' : 'disabled') + ' for local development.');
    return next;
  };

  window.replayFortnitemaresIntro = () => {
    resetFortnitemaresIntro();
    window.dispatchEvent(new CustomEvent('spritedex:replay-fortnitemares'));
    console.info('Fortnitemares intro reset.');
  };
}
