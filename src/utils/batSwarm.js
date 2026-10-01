/**
 * Bat swarm: canvas-independent flying bats with real wingbeat motion.
 *
 * Why this replaces canvas-confetti for the seasonal effect: confetti is a
 * particle system with gravity, so every bat arcs upward and then falls like
 * dead debris. The seasonal effect needs the opposite: bats that fly across
 * the viewport in every direction and keep flying.
 *
 * Each bat is a steering agent with wander + a per-bat wingbeat phase. Bats
 * wrap around the viewport edges instead of dying, so the swarm stays alive
 * for as long as the effect is mounted.
 *
 * Everything degrades to a no-op without a DOM (SSR, tests) and respects
 * prefers-reduced-motion by rendering a still, bat-free layer.
 */

/** Night palette sampled from the official key art. */
const BAT_TINTS = [
  'rgba(168, 85, 247, 0.95)',
  'rgba(192, 38, 211, 0.9)',
  'rgba(103, 10, 95, 0.95)',
  'rgba(232, 121, 249, 0.85)',
  'rgba(20, 4, 30, 0.98)'
];

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/**
 * Draws one bat centred at the origin, rotated to its heading.
 * The wing span is driven by `wing` (0 = folded, 1 = fully extended) which
 * oscillates with the wingbeat phase, so the silhouette visibly flaps.
 */
function drawBat(ctx, size, wing) {
  const span = size * (0.5 + 0.62 * wing);
  const rise = size * (0.16 + 0.3 * wing);
  const body = size * 0.16;

  ctx.beginPath();
  ctx.moveTo(0, size * 0.16);
  // Ala izquierda: dos curvas, la exterior (punta) y la interior (entre las
  // alas), para que la silueta lea como murcielago y no como un arco.
  ctx.quadraticCurveTo(-span * 0.5, -rise * 0.5, -span, -rise);
  ctx.quadraticCurveTo(-span * 0.7, rise * 0.18, -span * 0.34, rise * 0.42);
  ctx.quadraticCurveTo(-body * 1.5, rise * 0.16, -body, -body * 0.5);
  // Orejas y cabeza
  ctx.lineTo(-body * 0.85, -body * 1.5);
  ctx.lineTo(0, -body * 0.35);
  ctx.lineTo(body * 0.85, -body * 1.5);
  ctx.lineTo(body, -body * 0.5);
  // Ala derecha, espejo exacto de la izquierda
  ctx.quadraticCurveTo(body * 1.5, rise * 0.16, span * 0.34, rise * 0.42);
  ctx.quadraticCurveTo(span * 0.7, rise * 0.18, span, -rise);
  ctx.quadraticCurveTo(span * 0.5, -rise * 0.5, 0, size * 0.16);
  ctx.closePath();
  ctx.fill();
}

function createBat(rng, width, height, fromEdge) {
  // Start mostly off-screen so the swarm appears to fly in from beyond the frame.
  const side = fromEdge ?? Math.floor(rng() * 4);
  let x;
  let y;
  if (side === 0) { x = -90; y = rng() * height; }
  else if (side === 1) { x = width + 90; y = rng() * height; }
  else if (side === 2) { x = rng() * width; y = -90; }
  else { x = rng() * width; y = height + 90; }

  const heading = rng() * Math.PI * 2;
  return {
    x,
    y,
    heading,
    speed: 70 + rng() * 240,
    turn: (rng() - 0.5) * 2.6,
    wander: 0.4 + rng() * 1.5,
    size: 22 + rng() * 46,
    phase: rng() * Math.PI * 2,
    beat: 7 + rng() * 9,
    tint: BAT_TINTS[Math.floor(rng() * BAT_TINTS.length)],
    glow: rng() > 0.4
  };
}

/**
 * Runs a flying-bat swarm on a dedicated canvas.
 *
 * @param {object} [options]
 * @param {number} [options.count]      Bats in flight at once.
 * @param {number} [options.duration]   ms before the swarm fades out on its own.
 *                                    Omit (or pass 0) to keep it ambient until stopped.
 * @param {'ambient'|'burst'} [options.mode]
 * @returns {{ stop: () => void, destroy: () => void }|null} null when unsupported.
 */
export function createBatSwarm(options = {}) {
  if (typeof document === 'undefined') return null;

  const { count = 18, duration = 0, mode = 'ambient' } = options;

  const reduced = prefersReducedMotion();
  const requestFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : null;
  const cancelFrame = typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
    ? window.cancelAnimationFrame.bind(window)
    : null;

  // No animation frame source (or the visitor asked for less motion): the swarm
  // does not mount at all, instead of leaving a dead canvas in the document.
  if (!requestFrame || reduced) return null;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = `fnm-bat-canvas fnm-bat-canvas--${mode}`;
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;';

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  document.body.appendChild(canvas);

  let width = 0;
  let height = 0;
  let dpr = 1;
  let bats = [];
  let frameHandle = 0;
  let last = 0;
  let elapsed = 0;
  let stopped = false;
  // Ambient swarms fade in gently; a burst punches in fast.
  const fadeIn = mode === 'burst' ? 90 : 900;
  const total = duration || (mode === 'burst' ? 4200 : 3600);
  /* The fade-out has to stay a fraction of the life. A fixed 2200 ms on a 3600 ms
     ambient swarm meant the bats spent most of their time dimming instead of
     flying, which is exactly the "they are not really there" feeling. */
  const fadeOut = Math.min(mode === 'burst' ? 620 : 900, total * 0.35);

  const seed = (n) => {
    // Deterministic PRNG so tests and replays behave the same.
    let s = n >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };
  let rng = seed(0x5eed1);

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const populate = () => {
    rng = seed(0x5eed1);
    bats = Array.from({ length: count }, () => createBat(rng, width, height));
  };

  const frame = (now) => {
    if (stopped) return;
    if (!last) last = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt * 1000;

    ctx.clearRect(0, 0, width, height);

    // Opacity envelope: fade in, hold, fade out.
    let alpha = 1;
    if (elapsed < fadeIn) alpha = elapsed / fadeIn;
    else if (total && elapsed > total - fadeOut) alpha = Math.max(0, (total - elapsed) / fadeOut);
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    for (const bat of bats) {
      // Steer: constant turn biased by a slow wander so paths curve naturally.
      bat.phase += dt * bat.beat;
      const wander = Math.sin(elapsed / 1000 * bat.wander + bat.phase) * 0.9;
      bat.heading += (bat.turn * 0.06 + wander * 0.5) * dt;
      bat.x += Math.cos(bat.heading) * bat.speed * dt;
      bat.y += Math.sin(bat.heading) * bat.speed * dt;

      // Wrap around the viewport: a bat leaving one edge re-enters another.
      const margin = 70;
      if (bat.x < -margin) bat.x = width + margin;
      if (bat.x > width + margin) bat.x = -margin;
      if (bat.y < -margin) bat.y = height + margin;
      if (bat.y > height + margin) bat.y = -margin;

      const wing = 0.5 + 0.5 * Math.sin(bat.phase);
      ctx.save();
      ctx.translate(bat.x, bat.y);
      ctx.rotate(bat.heading + Math.PI / 2);
      ctx.fillStyle = bat.tint;
      if (bat.glow) {
        ctx.shadowColor = 'rgba(192, 38, 211, 0.85)';
        ctx.shadowBlur = 16;
      }
      drawBat(ctx, bat.size, wing);
      ctx.restore();
    }

    ctx.globalAlpha = 1;

    if (total && elapsed >= total) {
      finish();
      return;
    }
    frameHandle = requestFrame(frame);
  };

  const onResize = () => {
    resize();
    populate();
  };

  const finish = () => {
    if (stopped) return;
    stopped = true;
    if (cancelFrame) cancelFrame(frameHandle);
    window.removeEventListener('resize', onResize);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };

  resize();
  populate();
  window.addEventListener('resize', onResize);
  frameHandle = requestFrame(frame);

  return { stop: finish, destroy: finish };
}

/**
 * Convenience wrapper for card successes: a short burst of bats instead of
 * the falling confetti. Safe to call repeatedly; overlapping bursts stack.
 */
export function fireFlyingBats(options = {}) {
  if (typeof document === 'undefined') return null;
  if (prefersReducedMotion()) return null;
  return createBatSwarm({ count: 10, duration: 2600, mode: 'burst', ...options });
}

export default { createBatSwarm, fireFlyingBats };
