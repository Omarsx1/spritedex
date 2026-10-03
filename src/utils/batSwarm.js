/**
 * Bat Swarm: Enjambre de murciélagos origami de alta fidelidad con cinemática 3D.
 *
 * Basado en la geometría facetada origami (Image 1) y la dinámica de bandada
 * en oleada/vórtice multicapa (Images 2 y 3).
 *
 * Características:
 * - Geometría origami facetada con sombreado direccional (luz/sombra) y pliegues 3D.
 * - Aleteo orgánico con fases de aleteo rítmico y planeo aerodinámico.
 * - Inclinación 3D (banking/roll) según la dirección de giro de cada murciélago.
 * - 3 planos de profundidad (fondo translúcido, plano medio y primer plano con sombra proyectada).
 * - Trayectoria en oleada ascendente (swoop / vortex) en modo burst.
 * - Respeta prefers-reduced-motion y degrada a null sin DOM (SSR y tests).
 */

/* Ritmo global del enjambre. Sube o baja a la vez la velocidad de vuelo y la
   cadencia de aleteo, sin tocar el reparto por capas de profundidad: los
   murcielagos lejanos siguen siendo los mas rapidos y los cercanos los mas
   pausados. Un solo numero para acelerar o frenar toda la bandada. */
const BAT_PACE = 1.4;

function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

function curve(ctx, cp1x, cp1y, cp2x, cp2y, x, y) {
  if (typeof ctx.bezierCurveTo === 'function') {
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  } else if (typeof ctx.quadraticCurveTo === 'function') {
    ctx.quadraticCurveTo(cp1x, cp1y, x, y);
  } else {
    ctx.lineTo(x, y);
  }
}

/* Silueta real del murcielago (public/murcielago.svg). Se carga una vez y se dibuja
   como imagen: se ve como un murcielago de verdad y cuesta menos que rellenar decenas
   de facetas por fotograma. Si la imagen no esta lista, o no existe Image (tests,
   SSR), el enjambre sigue dibujando las facetas de siempre: nunca depende de que la
   descarga llegue. */
let batSilhouette = null;
let batSilhouetteAsked = false;
let batParts = null;

function silhouetteReady() {
  return Boolean(batParts);
}

/* La silueta se parte en tres piezas al cargar (ala izquierda, cuerpo, ala derecha). Asi
   el aleteo puede ser lo que es: cada ala girando sobre su hombro. Antes era un aplastado
   vertical del bicho entero y se veia de goma. Las piezas se rasterizan una sola vez, de
   modo que cada fotograma cuesta tres drawImage y ningun recorte. */
function buildBatParts(img) {
  const w = img.naturalWidth || img.width || 0;
  const h = img.naturalHeight || img.height || 0;
  if (!w || !h || typeof document === 'undefined') return null;

  const corte = Math.round(w * 0.42);   // donde acaba el ala izquierda
  const cuerpo = Math.round(w * 0.16);  // franja del cuerpo
  const recorte = (sx, sw) => {
    const c = document.createElement('canvas');
    c.width = sw;
    c.height = h;
    const cx = c.getContext('2d');
    if (!cx) return null;
    cx.drawImage(img, sx, 0, sw, h, 0, 0, sw, h);
    return c;
  };

  const izq = recorte(0, corte);
  const centro = recorte(corte, cuerpo);
  const der = recorte(corte + cuerpo, w - corte - cuerpo);
  if (!izq || !centro || !der) return null;
  return { izq, centro, der, ancho: w, corte, cuerpo };
}

function loadBatSilhouette() {
  if (batSilhouetteAsked || typeof Image === 'undefined') return;
  batSilhouetteAsked = true;
  try {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      batSilhouette = img;
      batParts = buildBatParts(img);
    };
    // Si la descarga falla (red, cache envenenada, un 404 puntual), se vuelve a pedir
    // en el proximo enjambre: sin esto, un fallo de una vez condenaba la sesion entera
    // a las facetas y el sintoma era "no veo los murcielagos nuevos".
    img.onerror = () => {
      batSilhouette = null;
      batParts = null;
      batSilhouetteAsked = false;
    };
    img.src = '/murcielago.svg';
  } catch {
    // sin silueta: quedan las facetas
  }
}

function drawSilhouetteBat(ctx, size, wingFold, depthLayer) {
  const ancho = size * 2.05;
  const alto = ancho / (1784.16 / 787.54);
  const anchoAla = ancho * (batParts.corte / batParts.ancho);
  const anchoCuerpo = ancho * (batParts.cuerpo / batParts.ancho);
  const hombroX = -(ancho / 2 - anchoAla);
  const hombroY = -alto * 0.18;

  // Cinemática de aleteo 3D orgánico:
  // - En la subida (upstroke: wingFold > 0), las alas se elevan en 3D: la envergadura proyectada
  //   se contrae (spanScale) y las puntas se orientan sutilmente hacia arriba/adelante (tilt).
  // - En la bajada (downstroke: wingFold < 0), las alas se despliegan al 100% capturando aire (chordScale).
  // - La articulación pivota en la inserción real del hombro (hombroX, hombroY), no en el centro del bicho.
  // - Sustentación vertical sutil (bobY): el cuerpo experimenta un impulso vertical al batir hacia abajo.
  const spanScale = 1 - (wingFold > 0 ? wingFold * 0.35 : Math.abs(wingFold) * 0.08);
  const chordScale = 1 + (wingFold < 0 ? Math.abs(wingFold) * 0.10 : -wingFold * 0.12);
  const tilt = wingFold * 0.16;
  const bobY = wingFold * (alto * 0.06);

  const renderBat = (c) => {
    // Ala izquierda: pivota sobre la junta superior del hombro izquierdo
    c.save();
    c.translate(hombroX, hombroY);
    if (typeof c.rotate === 'function') c.rotate(tilt);
    if (typeof c.scale === 'function') c.scale(spanScale, chordScale);
    c.drawImage(batParts.izq, -anchoAla, -alto / 2 - hombroY, anchoAla, alto);
    c.restore();

    // Ala derecha: rotación simétrica sobre el hombro derecho
    c.save();
    c.translate(-hombroX, hombroY);
    if (typeof c.rotate === 'function') c.rotate(-tilt);
    if (typeof c.scale === 'function') c.scale(spanScale, chordScale);
    c.drawImage(batParts.der, 0, -alto / 2 - hombroY, anchoAla, alto);
    c.restore();

    // Cuerpo en el centro superpuesto encima, tapando limpiamente la unión de las alas
    c.drawImage(batParts.centro, hombroX, -alto / 2, anchoCuerpo, alto);
  };

  // Sombra proyectada en primer plano (capa 2) que aletea en sincronía con el murciélago
  if (depthLayer === 2) {
    ctx.save();
    ctx.globalAlpha = ctx.globalAlpha * 0.38;
    ctx.translate(0, size * 0.16 + bobY);
    renderBat(ctx);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(0, bobY);
  renderBat(ctx);
  ctx.restore();
}

/**
 * Traza la silueta exterior del murciélago origami para la sombra o máscara.
 */
function traceBatContour(ctx, size, dy) {
  ctx.beginPath();
  // Cabeza: muesca central y oreja izquierda
  ctx.moveTo(0, -size * 0.25);
  ctx.lineTo(-size * 0.09, -size * 0.38);
  ctx.lineTo(-size * 0.09, -size * 0.22);

  // Ala izquierda: pliegue interior y pico de hombro
  ctx.lineTo(-size * 0.26, -size * 0.06 - dy * 0.35);
  ctx.lineTo(-size * 0.52, -size * 0.30 - dy);

  // Borde de ataque del ala izquierda hacia la punta
  curve(
    ctx,
    -size * 0.68, -size * 0.30 - dy,
    -size * 0.86, -size * 0.25 - dy * 1.15,
    -size * 0.98, -size * 0.18 - dy * 1.25
  );

  // Festones inferiores del ala izquierda
  curve(
    ctx,
    -size * 0.82, -size * 0.06 - dy * 0.7,
    -size * 0.70, 0 - dy * 0.4,
    -size * 0.62, size * 0.09 - dy * 0.4
  );
  curve(
    ctx,
    -size * 0.48, size * 0.06,
    -size * 0.28, size * 0.09,
    -size * 0.07, size * 0.11
  );

  // Cola en punta afilada
  ctx.lineTo(0, size * 0.42);

  // Festones inferiores del ala derecha (espejo)
  ctx.lineTo(size * 0.07, size * 0.11);
  curve(
    ctx,
    size * 0.28, size * 0.09,
    size * 0.48, size * 0.06,
    size * 0.62, size * 0.09 - dy * 0.4
  );
  curve(
    ctx,
    size * 0.70, 0 - dy * 0.4,
    size * 0.82, -size * 0.06 - dy * 0.7,
    size * 0.98, -size * 0.18 - dy * 1.25
  );

  // Borde de ataque del ala derecha
  curve(
    ctx,
    size * 0.86, -size * 0.25 - dy * 1.15,
    size * 0.68, -size * 0.30 - dy,
    size * 0.52, -size * 0.30 - dy
  );
  ctx.lineTo(size * 0.26, -size * 0.06 - dy * 0.35);
  ctx.lineTo(size * 0.09, -size * 0.22);
  ctx.lineTo(size * 0.09, -size * 0.38);
  ctx.closePath();
}

/**
 * Dibuja un murciélago origami facetado con sombreado 3D y aleteo.
 */
function drawOrigamiBat(ctx, size, wingFold, depthLayer, bank = 0) {
  if (silhouetteReady()) {
    drawSilhouetteBat(ctx, size, wingFold, depthLayer);
    return;
  }

  // wingFold oscila entre -0.7 (downstroke) y +0.7 (upstroke)
  const dy = wingFold * size * 0.42;

  // 1. Sombra proyectada en murciélagos de primer plano (como en Imagen 1 y 2)
  if (depthLayer === 2) {
    ctx.save();
    ctx.translate(0, size * 0.16);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
    traceBatContour(ctx, size, dy);
    ctx.fill();
    ctx.restore();
  }

  // 2. Facetas del ala izquierda (lado iluminado con contraste de papel doblado)
  // Faceta 1: Ala izquierda exterior (punta)
  ctx.fillStyle = '#0f0f15';
  ctx.beginPath();
  ctx.moveTo(-size * 0.52, -size * 0.30 - dy);
  curve(
    ctx,
    -size * 0.68, -size * 0.30 - dy,
    -size * 0.86, -size * 0.25 - dy * 1.15,
    -size * 0.98, -size * 0.18 - dy * 1.25
  );
  curve(
    ctx,
    -size * 0.82, -size * 0.06 - dy * 0.7,
    -size * 0.70, 0 - dy * 0.4,
    -size * 0.62, size * 0.09 - dy * 0.4
  );
  ctx.closePath();
  ctx.fill();

  // Faceta 2: Ala izquierda interior superior (hombro origami claro)
  ctx.fillStyle = '#2d2d38';
  ctx.beginPath();
  ctx.moveTo(-size * 0.09, -size * 0.22);
  ctx.lineTo(-size * 0.26, -size * 0.06 - dy * 0.35);
  ctx.lineTo(-size * 0.52, -size * 0.30 - dy);
  ctx.lineTo(-size * 0.62, size * 0.09 - dy * 0.4);
  ctx.closePath();
  ctx.fill();

  // Faceta 3: Ala izquierda interior inferior (membrana)
  ctx.fillStyle = '#1c1c24';
  ctx.beginPath();
  ctx.moveTo(-size * 0.09, -size * 0.22);
  ctx.lineTo(-size * 0.62, size * 0.09 - dy * 0.4);
  curve(
    ctx,
    -size * 0.48, size * 0.06,
    -size * 0.28, size * 0.09,
    -size * 0.07, size * 0.11
  );
  ctx.closePath();
  ctx.fill();

  // 3. Facetas del ala derecha (lado en sombra más profunda)
  // Faceta 4: Ala derecha exterior (punta)
  ctx.fillStyle = '#050508';
  ctx.beginPath();
  ctx.moveTo(size * 0.52, -size * 0.30 - dy);
  curve(
    ctx,
    size * 0.68, -size * 0.30 - dy,
    size * 0.86, -size * 0.25 - dy * 1.15,
    size * 0.98, -size * 0.18 - dy * 1.25
  );
  curve(
    ctx,
    size * 0.82, -size * 0.06 - dy * 0.7,
    size * 0.70, 0 - dy * 0.4,
    size * 0.62, size * 0.09 - dy * 0.4
  );
  ctx.closePath();
  ctx.fill();

  // Faceta 5: Ala derecha interior superior (hombro oscuro)
  ctx.fillStyle = '#15151c';
  ctx.beginPath();
  ctx.moveTo(size * 0.09, -size * 0.22);
  ctx.lineTo(size * 0.26, -size * 0.06 - dy * 0.35);
  ctx.lineTo(size * 0.52, -size * 0.30 - dy);
  ctx.lineTo(size * 0.62, size * 0.09 - dy * 0.4);
  ctx.closePath();
  ctx.fill();

  // Faceta 6: Ala derecha interior inferior (membrana)
  ctx.fillStyle = '#0a0a0e';
  ctx.beginPath();
  ctx.moveTo(size * 0.09, -size * 0.22);
  ctx.lineTo(size * 0.62, size * 0.09 - dy * 0.4);
  curve(
    ctx,
    size * 0.48, size * 0.06,
    size * 0.28, size * 0.09,
    size * 0.07, size * 0.11
  );
  ctx.closePath();
  ctx.fill();

  // 4. Cuerpo y cabeza central dividido en dos facetas
  // Faceta 7: Cuerpo izquierdo (grafito iluminado)
  ctx.fillStyle = '#262632';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.25);
  ctx.lineTo(-size * 0.09, -size * 0.38);
  ctx.lineTo(-size * 0.09, -size * 0.22);
  ctx.lineTo(-size * 0.07, size * 0.11);
  ctx.lineTo(0, size * 0.42);
  ctx.closePath();
  ctx.fill();

  // Faceta 8: Cuerpo derecho (negro profundo)
  ctx.fillStyle = '#0c0c12';
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.25);
  ctx.lineTo(size * 0.09, -size * 0.38);
  ctx.lineTo(size * 0.09, -size * 0.22);
  ctx.lineTo(size * 0.07, size * 0.11);
  ctx.lineTo(0, size * 0.42);
  ctx.closePath();
  ctx.fill();
}

/**
 * Crea un murciélago con asignación de capa de profundidad y trayectoria orgánica.
 */
function createBat(rng, width, height, mode, index, total) {
  // Asignar capa de profundidad:
  // 0: Fondo (40% de los murciélagos, lejanos, veloces, semitransparentes)
  // 1: Plano medio (40%, tamaño intermedio)
  // 2: Primer plano (20%, grandes, nítidos con sombra)
  const layerRatio = index / total;
  let layer = 0;
  let baseSize = 16 + rng() * 10;
  let baseOpacity = 0.38 + rng() * 0.22;
  let speed = 260 + rng() * 140;
  let beatSpeed = 12 + rng() * 5;

  if (layerRatio >= 0.8) {
    layer = 2; // Primer plano
    baseSize = 54 + rng() * 32;
    baseOpacity = 0.98;
    speed = 170 + rng() * 90;
    beatSpeed = 7 + rng() * 3;
  } else if (layerRatio >= 0.4) {
    layer = 1; // Plano medio
    baseSize = 28 + rng() * 16;
    baseOpacity = 0.72 + rng() * 0.18;
    speed = 210 + rng() * 110;
    beatSpeed = 9 + rng() * 4;
  }

  let x;
  let y;
  let heading;

  if (mode === 'burst') {
    // Modo Oleada (Images 2 y 3):
    // La bandada surge predominantemente desde la parte inferior/lateral izquierda
    // describiendo una curva helicoidal ascendente hacia el centro-derecha superior.
    const isMainSurge = rng() < 0.7;

    if (isMainSurge) {
      // Oleada principal ascendente (de izquierda/abajo a derecha/arriba)
      x = -80 + rng() * (width * 0.5);
      y = height * (0.55 + rng() * 0.55);
      // Ángulo de ascenso: entre -55° y -25°
      heading = -Math.PI * (0.18 + rng() * 0.22);
    } else {
      // Cruce dinámico desde la derecha/fondo
      x = width * (0.6 + rng() * 0.45);
      y = height * (0.4 + rng() * 0.6);
      heading = -Math.PI * (0.65 + rng() * 0.25);
    }
  } else {
    // Modo ambiente: entrada periférica variada
    const side = Math.floor(rng() * 4);
    if (side === 0) { x = -80; y = rng() * height; heading = (rng() - 0.5) * 0.8; }
    else if (side === 1) { x = width + 80; y = rng() * height; heading = Math.PI + (rng() - 0.5) * 0.8; }
    else if (side === 2) { x = rng() * width; y = -80; heading = Math.PI * 0.5 + (rng() - 0.5) * 0.8; }
    else { x = rng() * width; y = height + 80; heading = -Math.PI * 0.5 + (rng() - 0.5) * 0.8; }
  }

  return {
    x,
    y,
    heading,
    speed: speed * BAT_PACE,
    turn: (rng() - 0.5) * 2.2,
    wander: 0.4 + rng() * 1.2,
    size: baseSize,
    opacity: baseOpacity,
    layer,
    phase: rng() * Math.PI * 2,
    glidePhase: rng() * Math.PI * 2,
    beatSpeed: beatSpeed * BAT_PACE,
    bank: 0
  };
}

/**
 * Ejecuta el enjambre cinematográfico en un canvas dedicado de alto rendimiento.
 *
 * @param {object} [options]
 * @param {number} [options.count]      Número de murciélagos en vuelo.
 * @param {number} [options.duration]   Duración en ms antes del desvanecimiento automático.
 * @param {'ambient'|'burst'} [options.mode]
 * @returns {{ stop: () => void, destroy: () => void }|null}
 */
export function createBatSwarm(options = {}) {
  if (typeof document === 'undefined') return null;

  loadBatSilhouette();

  const { count = 30, duration = 0, mode = 'ambient' } = options;

  const reduced = prefersReducedMotion();
  const requestFrame = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
    ? window.requestAnimationFrame.bind(window)
    : null;
  const cancelFrame = typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function'
    ? window.cancelAnimationFrame.bind(window)
    : null;

  if (!requestFrame || reduced) return null;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = `fnm-bat-canvas fnm-bat-canvas--${mode}`;
  canvas.style.cssText =
    'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;';

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

  const fadeIn = mode === 'burst' ? 120 : 700;
  const total = duration || (mode === 'burst' ? 4400 : 3800);
  const fadeOut = Math.min(mode === 'burst' ? 700 : 900, total * 0.35);

  const seed = (n) => {
    let s = n >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const populate = () => {
    const rng = seed(0x5eed1);
    bats = Array.from({ length: count }, (_, i) => createBat(rng, width, height, mode, i, count));
    // Ordenar murciélagos por capa (fondo -> medio -> primer plano) para pintar con profundidad correcta
    bats.sort((a, b) => a.layer - b.layer);
  };

  const frame = (now) => {
    if (stopped) return;
    if (!last) last = now;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    elapsed += dt * 1000;

    ctx.clearRect(0, 0, width, height);

    // Curva de opacidad global de entrada y salida
    let globalAlpha = 1;
    if (elapsed < fadeIn) {
      globalAlpha = elapsed / fadeIn;
    } else if (total && elapsed > total - fadeOut) {
      globalAlpha = Math.max(0, (total - elapsed) / fadeOut);
    }

    for (const bat of bats) {
      // 1. Ciclo de aleteo y planeo
      bat.glidePhase += dt * 1.5;
      const isGliding = Math.sin(bat.glidePhase) > 0.65;

      let wingFold;
      if (isGliding) {
        // En planeo, alas extendidas con leve micro-vibración del viento
        wingFold = 0.12 + Math.sin(bat.phase * 0.5) * 0.06;
      } else {
        // Aleteo activo enérgico
        bat.phase += dt * bat.beatSpeed;
        wingFold = Math.sin(bat.phase) * 0.68;
      }

      // 2. Trayectoria y dirección
      const wander = Math.sin(elapsed / 1000 * bat.wander + bat.phase * 0.3) * 0.8;
      const turnAmount = (bat.turn * 0.08 + wander * 0.45) * dt;
      bat.heading += turnAmount;

      // Inclinación 3D (banking) en función de la velocidad de giro
      const targetBank = Math.max(-0.65, Math.min(0.65, (turnAmount / dt) * 0.4));
      bat.bank += (targetBank - bat.bank) * Math.min(1, dt * 8);

      // Movimiento vectorial
      bat.x += Math.cos(bat.heading) * bat.speed * dt;
      bat.y += Math.sin(bat.heading) * bat.speed * dt;

      // 3. Envoltura de pantalla
      const margin = bat.size * 2 + 60;
      if (bat.x < -margin) bat.x = width + margin;
      if (bat.x > width + margin) bat.x = -margin;
      if (bat.y < -margin) bat.y = height + margin;
      if (bat.y > height + margin) bat.y = -margin;

      // 4. Renderizado con transformaciones 3D
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, globalAlpha * bat.opacity));
      ctx.translate(bat.x, bat.y);
      ctx.rotate(bat.heading + Math.PI / 2);

      // Compresión en X para simular perspectiva de giro (roll)
      if (typeof ctx.scale === 'function') {
        const rollCompression = 1 - Math.abs(bat.bank) * 0.28;
        ctx.scale(rollCompression, 1);
      }

      drawOrigamiBat(ctx, bat.size, wingFold, bat.layer, bat.bank);
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
 * Disparo rápido de murciélagos para celebraciones de cartas o eventos.
 */
export function fireFlyingBats(options = {}) {
  if (typeof document === 'undefined') return null;
  if (prefersReducedMotion()) return null;
  return createBatSwarm({ count: 14, duration: 2800, mode: 'burst', ...options });
}

export default { createBatSwarm, fireFlyingBats };
