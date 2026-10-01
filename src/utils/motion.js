// Native reduced-motion probe.
//
// Captured at module load, before any component can temporarily patch
// window.matchMedia (see src/components/Header.jsx, which overrides the
// reduced-motion query for liquid-gooey).
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

const nativeMatchMedia =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia.bind(window)
    : null;

/**
 * True when the visitor asked for reduced motion, either through the OS setting
 * or through the in-app "motion disabled" preference.
 */
export function prefersReducedMotion() {
  if (nativeMatchMedia) {
    try {
      if (nativeMatchMedia(REDUCED_MOTION_QUERY).matches) return true;
    } catch {
      // fall through to the in-app preference
    }
  }

  if (typeof document !== 'undefined') {
    if (document.documentElement?.classList?.contains('motion-disabled')) return true;
    if (document.body?.classList?.contains('motion-disabled')) return true;
  }

  return false;
}
