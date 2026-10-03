// canvas-confetti is imported on demand so the initial bundle stays small.
import { isFortnitemaresActive, resolveSeasonalState } from '../config/seasonalEvent.js';
import { createBatSwarm, fireFlyingBats } from './batSwarm.js';

/** Seasonal palette: deep violets, pumpkin orange and near-black. */
export const HALLOWEEN_COLORS = ['#0f051d', '#581c87', '#9333ea', '#ff6b00', '#18181b', '#d946ef'];

/**
 * Whether the themed effect is the flying-bat swarm rather than confetti.
 * The swarm lives in its own canvas (src/utils/batSwarm.js) because
 * canvas-confetti cannot express a bat that keeps flying across the screen.
 *
 * Uses the pure resolver rather than isFortnitemaresActive() so the decision
 * stays testable without a DOM.
 */
export function isBatSwarmActive(now = new Date()) {
  return resolveSeasonalState({ now, isDev: false });
}

/** Bat silhouette used when the emoji glyph cannot be rasterized. */
export const BAT_SILHOUETTE_PATH =
  'M 12 5 L 10.9 2 L 10.9 5.8 L 8.7 10.1 L 5.5 3.7 C 3.6 3.7 1.5 5 0 6.7 C 2.2 10.1 3.6 11.8 4.4 14.3 C 6.2 13.5 8.4 14.3 11.1 14.8 L 12 22 L 12.9 14.8 C 15.6 14.3 17.8 13.5 19.6 14.3 C 20.4 11.8 21.8 10.1 24 6.7 C 22.5 5 20.4 3.7 18.5 3.7 L 15.3 10.1 L 13.1 5.8 L 13.1 2 Z';

let confettiPromise = null;

function getConfetti() {
  if (!confettiPromise) {
    confettiPromise = import('canvas-confetti').then((mod) => mod.default);
  }
  return confettiPromise;
}

/**
 * Resolves the shapes for the seasonal effect. Always returns a non-empty
 * array: the last resort is a dark circle, so the themed burst can never
 * degrade into ordinary multicolor confetti.
 */
export function resolveBatShapes(confetti) {
  const shapes = [];

  if (confetti) {
    try {
      if (typeof confetti.shapeFromText === 'function') {
        shapes.push(confetti.shapeFromText({ text: '🦇', scalar: 2.4 }));
      }
    } catch {
      shapes.length = 0;
    }
  }

  if (confetti && shapes.length === 0) {
    try {
      if (typeof confetti.shapeFromPath === 'function') {
        shapes.push(confetti.shapeFromPath({ path: BAT_SILHOUETTE_PATH, matrix: [0.75, 0, 0, 0.75, -3, -3] }));
      }
    } catch {
      shapes.length = 0;
    }
  }

  return shapes.length > 0 ? shapes : ['circle'];
}

/**
 * Builds the themed burst options. Any caller-supplied colors/shapes/scalar are
 * discarded so the seasonal effect cannot regress to the default palette.
 */
export function buildThemedConfettiOptions(options = {}, shapes) {
  const resolvedShapes = Array.isArray(shapes) && shapes.length > 0 ? shapes : ['circle'];
  const usesCustomShape = typeof resolvedShapes[0] !== 'string';

  const rest = { ...options };
  delete rest.colors;
  delete rest.shapes;
  delete rest.scalar;

  return {
    ...rest,
    particleCount: options.particleCount ? Math.round(options.particleCount * 0.8) : 25,
    spread: options.spread || 55,
    origin: options.origin || { y: 0.8 },
    ticks: 150,
    gravity: 0.6,
    startVelocity: options.startVelocity || 32,
    shapes: resolvedShapes,
    colors: HALLOWEEN_COLORS,
    ...(usesCustomShape ? { scalar: options.scalar || 2.4 } : {})
  };
}

/**
 * Fires confetti during the normal season, and flying bats during Fortnitemares.
 *
 * The seasonal branch deliberately bypasses canvas-confetti entirely: passing
 * an emoji bat to confetti produces a particle that arcs and falls, which is
 * exactly the dead-bat-confetti effect the seasonal design rejects.
 */
/**
 * Traduce el aviso a la rafaga de murcielagos. Atrapar un espiritu es un aviso normal;
 * llegar a nivel 5 es el momento grande, asi que lleva mas murcielagos y dura mas.
 * Vive aparte del DOM para poder probarse sin navegador.
 */
export function batBurstFor(options = {}) {
  return options.maxeo
    ? { count: 24, duration: 3400, mode: 'burst' }
    : { count: 10, duration: 2600, mode: 'burst' };
}

export function fireConfetti(options = {}) {
  const { maxeo = false, ...resto } = options;
  if (isFortnitemaresActive()) {
    fireFlyingBats(batBurstFor({ maxeo }));
    return;
  }

  getConfetti()
    .then((confetti) => {
      confetti(resto);
    })
    .catch(() => {});
}

/**
 * Entrance cinematic swarm: bats flying across the whole viewport in every
 * direction, wrapping at the edges instead of falling.
 */
export function fireBatSwarm() {
  return createBatSwarm({ count: 26, mode: 'burst' });
}
