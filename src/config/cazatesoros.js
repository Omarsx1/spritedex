/**
 * Cazatesoros (TesoroDex) seasonal preview.
 *
 * The theme is a local preview for the next season. It is intentionally
 * development-only until the launch decision: production builds resolve it as
 * inactive, so shipping the branch cannot flip the live site by accident.
 *
 * Precedence: while Cazatesoros is active it wins over Fortnitemares. Both
 * themes share the hero and the page chrome, and rendering both at once was
 * the source of the `!important` fights in the first preview.
 */

export const CAZATESOROS_CLASS = 'theme-cazatesoros';
export const CAZATESOROS_STORAGE_KEY = 'spritedex_cazatesoros_override';

/**
 * Pure resolver: no globals, so it can be unit tested directly.
 *
 * Order: explicit query flag, then the stored override, then the development
 * default (on). Production ignores every preview input.
 */
export function resolveCazatesorosState({ isDev = false, search = '', storedOverride = null } = {}) {
  if (!isDev) return false;

  const flag = new URLSearchParams(search || '').get('cazatesoros');
  if (flag === '0' || flag === 'false') return false;
  if (flag === '1' || flag === 'true') return true;
  if (storedOverride === 'true') return true;
  if (storedOverride === 'false') return false;
  return true;
}

/**
 * Which seasonal theme actually renders when both are requested.
 * Cazatesoros has priority, so Fortnitemares is suppressed while it is on.
 */
export function resolveSeasonalTheme({ cazatesorosActive = false, fortnitemaresActive = false } = {}) {
  const cazatesoros = Boolean(cazatesorosActive);
  return {
    cazatesoros,
    fortnitemares: Boolean(fortnitemaresActive) && !cazatesoros
  };
}

/**
 * Whether the theme class is on <html> right now.
 */
export function isCazatesorosActive() {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains(CAZATESOROS_CLASS);
}

/**
 * Applies or removes the theme class on <html> and <body>.
 */
export function applyCazatesorosTheme(active) {
  if (typeof document === 'undefined') return;

  const html = document.documentElement;
  const body = document.body;

  if (active) {
    html.classList.add(CAZATESOROS_CLASS);
    body?.classList.add(CAZATESOROS_CLASS);
  } else {
    html.classList.remove(CAZATESOROS_CLASS);
    body?.classList.remove(CAZATESOROS_CLASS);
  }
}
