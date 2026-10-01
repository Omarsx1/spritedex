// canvas-confetti is imported on demand so the initial bundle stays small.
import { isFortnitemaresActive } from '../config/seasonalEvent.js';

/** Seasonal palette: deep violets, pumpkin orange and near-black. */
export const HALLOWEEN_COLORS = ['#0f051d', '#581c87', '#9333ea', '#ff6b00', '#18181b', '#d946ef'];

/** Bat silhouette used when the emoji glyph cannot be rasterized. */
export const BAT_SILHOUETTE_PATH =
  'M12 3.2c1.3 0 2.3.9 2.7 2.2 1.7-1.2 3.7-1.9 5.6-1.9 1.2 0 2.2.3 2.9.9-.7.3-1.5 1-1.8 2-.4 1.2-1.4 1.9-2.5 2.2-1.8.5-2.8 1.4-3.4 2.5-.5.9-.9 1.9-1.7 2.7l-.4.4c.2.5.3 1 .3 1.5 0 1.7-1.4 3-3.1 3s-3.1-1.3-3.1-3c0-.5.1-1 .3-1.5l-.4-.4c-.8-.8-1.2-1.8-1.7-2.7-.6-1.1-1.6-2-3.4-2.5-1.1-.3-2.1-1-2.5-2.2-.3-1-1.1-1.7-1.8-2 .7-.6 1.7-.9 2.9-.9 1.9 0 3.9.7 5.6 1.9.4-1.3 1.4-2.2 2.7-2.2z';

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
 * Fires confetti or flying bats depending on the active season.
 */
export function fireConfetti(options = {}) {
  getConfetti()
    .then((confetti) => {
      if (isFortnitemaresActive()) {
        confetti(buildThemedConfettiOptions(options, resolveBatShapes(confetti)));
      } else {
        confetti(options);
      }
    })
    .catch(() => {});
}

/**
 * Large bat swarm used by the entrance cinematic and special moments.
 */
export function fireBatSwarm() {
  getConfetti()
    .then((confetti) => {
      const shapes = resolveBatShapes(confetti);
      const base = {
        gravity: 0.45,
        ticks: 200,
        colors: HALLOWEEN_COLORS,
        shapes,
        ...(typeof shapes[0] !== 'string' ? { scalar: 3.0 } : {})
      };

      confetti({ ...base, particleCount: 20, angle: 65, spread: 60, origin: { x: 0.05, y: 0.95 }, startVelocity: 42 });
      confetti({ ...base, particleCount: 20, angle: 115, spread: 60, origin: { x: 0.95, y: 0.95 }, startVelocity: 42 });
      confetti({ ...base, particleCount: 28, angle: 90, spread: 85, origin: { x: 0.5, y: 0.98 }, startVelocity: 50 });
    })
    .catch(() => {});
}
