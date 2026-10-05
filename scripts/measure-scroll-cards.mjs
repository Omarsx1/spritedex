#!/usr/bin/env node
// Arnes de medicion reproducible para el destello de tarjetas del grid de escritorio.
//
// Sirve un directorio de build (dist por defecto) en un puerto efimero, abre Chrome headless
// con puppeteer-core y, por cada offset de scroll, mide:
//   - firstFrameBlank: tarjetas del viewport sin arte en el primer frame tras empezar a scrollear
//   - framesWithBlank / framesSampled: fraccion de frames muestreados con al menos un hueco
//   - (--scroll-mode roundtrip) artifactFrames / framesSampled: frames donde al menos UNA tarjeta
//     del viewport, con la imagen YA completa, muestra el fondo de su tarjeta en vez de arte. Es
//     una medicion de PIXELES (page.screenshot -> canvas + getImageData), no de bytes: una imagen
//     cacheada igual destella si el navegador tiro su render. Bajada y subida se reportan por
//     separado (la subida es el caso que el usuario reporta) y un frame de CONTROL asentado mide
//     los falsos positivos del criterio.
//   - (--scroll-mode roundtrip) la latencia de pintado por posicion: cuantas capturas seguidas
//     (sin mover el scroll) hacen falta hasta que ninguna tarjeta ya cargada muestre el fondo.
//     Tambien se mide el COSTE en CPU del gesto: deltas de Performance.getMetrics (TaskDuration,
//     ScriptDuration, LayoutDuration, RecalcStyleDuration) en ms y por segundo de scroll, long
//     tasks durante el gesto separadas por direccion, y el conteo de capas compuestas (LayerTree).
//   - msToFirstArtVisible: ms hasta el primer frame con TODAS las tarjetas del viewport listas
//   - imagesNotLoadedAtEnd: tarjetas del viewport sin imagen lista al terminar el paso
//   - (con --log-network) requests por paso, count404, urls404, slowest3, basicFallbacks
//   - (con --log-network) collageBytes: bytes de respuestas /sprites/collage/ que ARRANCAN dentro
//     del paso. Es la metrica titular de la Fase 1 (el preload del export compitiendo con el grid).
//   - (con --log-network) warmerRequests/warmerBytes/warmerCacheHits, cacheHits y transferBytes del
//     paso, mas el resumen "warm" del calentador: cuanto arte se calento por delante y cuanto fue
//     desperdicio (indices que nunca llegaron al viewport).
//
// El scroll puede ser "jump" (salto directo al offset, comportamiento historico) o
// "continuous" (pasos de 200 px cada 45 ms, lo que hace una rueda real: el navegador precarga
// por distancia y los lazy entran de a poco en el viewport) o "roundtrip" (baja a 200 px por paso
// hasta --roundtrip-max y despues SUBE de vuelta al tope, muestreando pixeles en cada direccion).
//
// --scenario <scroll|idle|startup> (default scroll):
//   scroll: comportamiento historico (pasos de scroll en cada offset).
//   idle:   carga, espera el mismo settle que scroll, NO scrollea. Reporta
//           collageCompleteMs (ms desde el inicio de la pagina hasta que termina de responder la
//           ultima request /sprites/collage/) y, despues, invoca la vista de compartir por su
//           nombre accesible y reporta shareReadyMs (ms desde la invocacion hasta que no arranca
//           ninguna request /sprites/collage/ nueva durante 600 ms).
//   startup: carga y espera el mismo settle, NO scrollea y NO clickea nada (no invoca compartir).
//           Reporta metricas de arranque instrumentadas con evaluateOnNewDocument ANTES del goto:
//           lcpMs/lcpElement/lcpSize, fcpMs, ttfbMs, domContentLoadedMs, loadEventMs, longTasks
//           (count/totalMax/top5), firstSpriteCardMs, jsCriticalBytes (scripts que terminan de
//           responder antes del LCP) y la primera request a Supabase.
//
// --roundtrip-max <px> (default 5000): tope de la ronda en --scroll-mode roundtrip (se recorta al
//   fondo del documento). --artifact-samples <n> (default 4): capturas por posicion sin mover el
//   scroll; la primera alimenta la metrica titular y las extra, la latencia de pintado.
//
// --block-urls <patrones> (default vacio): lista separada por comas de patrones de URL que se
// bloquean a nivel de red via CDP Network.setBlockedURLs. Sirve para medir que compraria diferir
// un candidato SIN tocar el codigo de la app: los imports dinamicos bloqueados rechazan y el
// try/catch de la app los traga, asi que el arnes sigue igual. Ej: --block-urls "*supabase*".
//
// IMPORTANTE: --throttle aplica perfiles SINTETICOS via CDP (Network.emulateNetworkConditions
// + Emulation.setCPUThrottlingRate) ANTES del goto. En localhost la latencia es ~0 y el ancho
// de banda infinito, asi que la cadena de 404 y el arranque tardio del lazy cuestan ~0 ms y no
// se ven. Los perfiles son aproximaciones inventadas para este arnes, NO mediciones de una red
// real; sirven para que los costos de red dejen de ser invisibles y para comparar antes/despues
// bajo el mismo regimen:
//   4g      latency 60 ms  | bajada 8 Mbps   | subida 3 Mbps   | CPU 4x
//   slow3g  latency 200 ms | bajada 1.6 Mbps | subida 0.75 Mbps| CPU 4x
// El CPU 4x evita que el decode de imagenes salga gratis en una maquina de escritorio rapida.
// No toca el HTML/CSS de la app.
//
// CABECERAS DE CACHE: el servidor estatico imita las cabeceras de produccion declaradas en
// vercel.json (/assets/* inmutable, /sprites/* con stale-while-revalidate, HTML sin cache). El
// calentador de miniaturas de la Fase 2/T3 solo sirve si la miniatura calentada sigue en cache
// cuando la tarjeta entra al viewport. Si esa cabecera de produccion cambia, esta medicion deja
// de ser valida: la miniatura calentada se descargaria otra vez.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(SCRIPT_DIR, '..');
const DIST_DIR = path.join(REPO_ROOT, 'dist');
const CHROME_PATH = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 9000 se probo antes y clampaba a ~5877 (fin del documento), asi que dos offsets alcanzan.
const DEFAULT_OFFSETS = [2400, 5400];
const SETTLE_MS = 1200;
// Con throttle 4g la carga inicial (JS + fuentes + miniaturas) sigue en vuelo a los 1200 ms, y
// esa cola contamina el primer paso (y difiere entre baseline y after por el eager). Esperamos a
// que la red quede quieta antes de medir el primer paso, con tope para no colgar la corrida.
const IDLE_QUIET_MS = 800;
const IDLE_MAX_MS = 20000;
// App.jsx dispara a los 1500 ms una precarga en reposo de assets del exportador (tandas de 4).
// Si medimos el primer paso antes de que eso termine, la cola compite por el ancho de banda y el
// resultado depende de una carrera con un setTimeout. Exigimos un minimo de reloj para que esa
// precarga haya pasado, en TODAS las configuraciones por igual.
const IDLE_MIN_MS = 5000;
const STEP_TIMEOUT_MS = 5000;
const VIEWPORT = { width: 1440, height: 900 };

// Escenario idle: la ultima respuesta /sprites/collage/ se da por terminada cuando pasan
// IDLE_COLLAGE_QUIET_MS sin una respuesta nueva (tope IDLE_COLLAGE_MAX_MS para no colgar la corrida).
const IDLE_COLLAGE_QUIET_MS = 600;
const IDLE_COLLAGE_MAX_MS = 45000;
// Guardarrail de compartir: silencio de requests /sprites/collage/ que define "listo".
const SHARE_QUIET_MS = 600;
const SHARE_MAX_MS = 30000;
const COLLAGE_URL_MARK = '/sprites/collage/';

// Cabeceras de cache copiadas de vercel.json. CACHE_SPRITES es la que importa para el calentador
// de miniaturas: si cambia alli, cambiala aqui o la medicion miente.
const CACHE_ASSETS = 'public, max-age=31536000, immutable';
const CACHE_SPRITES = 'public, max-age=86400, stale-while-revalidate=604800';
const CACHE_HTML = 'public, max-age=0, must-revalidate';

// Rueda real: pasos cortos y frecuentes. El navegador precarga por distancia en vez de saltar.
const CONTINUOUS_STRIDE_PX = 200;
const CONTINUOUS_INTERVAL_MS = 45;

// Fase 5 / T6: gesto de ida y vuelta. Baja de a 200 px hasta el tope de la ronda y despues SUBE
// de vuelta al tope, muestreando PIXELES en cada direccion por separado. La subida es el caso que
// el usuario reporta ("scrolleo hacia arriba y veo huecos y tarjetas sin cargar").
const ROUNDTRIP_MAX_DEFAULT = 5000;
const ROUNDTRIP_STRIDE_PX = CONTINUOUS_STRIDE_PX;
const ROUNDTRIP_INTERVAL_MS = CONTINUOUS_INTERVAL_MS;
// Tolerancias del criterio de artefactos de pintado (ver analyzeArtifactFrame). Son canales 0-255
// sobre PNG sin perdida: el mismo pixel de un frame asentado es identico, asi que 16 sobra.
const ARTIFACT_BG_TOL = 16;
const ARTIFACT_REF_TOL = 28;
const ARTIFACT_GRID = 5;
const ARTIFACT_MAX_FRAMES = 400;
// Capturas extra por posicion (sin mover el scroll): miden cuantas capturas hacen falta hasta que
// el viewport queda pintado. La primera captura alimenta la metrica titular; las extra, la
// latencia de pintado por posicion, que es lo que distingue "raster normal" de "render diferido".
const ARTIFACT_RECAPTURE_MS = 25;
const ARTIFACT_SAMPLES_DEFAULT = 4;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Mbps -> bytes/s en base decimal (8 Mbps = 8_000_000 bits/s = 1_000_000 B/s).
const THROTTLES = {
  none: null,
  '4g': { latency: 60, downloadThroughput: 8_000_000 / 8, uploadThroughput: 3_000_000 / 8, cpuRate: 4 },
  slow3g: { latency: 200, downloadThroughput: 1_600_000 / 8, uploadThroughput: 750_000 / 8, cpuRate: 4 }
};

const MIME = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.ico', 'image/x-icon']
]);

// ---------------------------------------------------------------------------
// Medicion de ARTEFACTOS DE PINTADO (Fase 5 / T6).
//
// Mide PIXELES, no bytes. Una tarjeta cuya imagen YA esta completa (img.complete &&
// naturalWidth > 0) puede igual mostrarse vacia si el navegador descarto su render
// (content-visibility: auto): al volver a entrar al viewport la pinta de nuevo y, mientras tanto,
// se ve el fondo de la tarjeta. La medicion de bytes no puede ver eso: la imagen ya llego.
//
// CRITERIO EXACTO por tarjeta, en un frame muestreado (esta funcion corre EN la pagina):
//   bg        = fondo real de la tarjeta en ESE frame: mediana de hasta 6 muestras tomadas en su
//               padding (franja de 14 px a los lados, donde la caja .card-image no llega), con
//               respaldo en getComputedStyle(card).background-color si no hay muestras validas.
//   puntos    = rejilla 5x5 dentro de la caja .card-image (fracciones 0.1 .. 0.9).
//   flatBg    = TODOS los puntos caen dentro de ARTIFACT_BG_TOL de bg, o sea la caja entera
//               muestra el fondo de la tarjeta.
//   ref       = parche 5x5 del centro de .card-image, aprendido cuando esa MISMA tarjeta se vio
//               PINTADA (flatBg falso). Es la referencia propia de la tarjeta.
//   ambiguous = ref existe y ref tambien es "bg" -> esa tarjeta no sirve para decidir.
//   artefacto = imagen lista && flatBg && ref existe && !ambiguous && diff(ref, centro) > REF_TOL.
//
// Un frame es ARTEFACTO si al menos UNA tarjeta del viewport cumple lo anterior. Un frame es
// BLANK (la metrica vieja, de bytes) si al menos una tarjeta del viewport no tiene imagen lista.
// El guardarrail de ref evita el falso positivo obvio (arte oscuro parecido al fondo): una tarjeta
// solo cuenta si ANTES se la vio pintada con pixeles suficientemente distintos del fondo.
async function analyzeArtifactFrame(payload) {
  const { dataUrl, phase, refs, bgTol, refTol, grid } = payload;
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const W = canvas.width;
  const H = canvas.height;
  const px = ctx.getImageData(0, 0, W, H).data;

  const sampleAt = (x, y) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (!(xi >= 0 && yi >= 0 && xi < W && yi < H)) return null;
    const o = (yi * W + xi) * 4;
    return [px[o], px[o + 1], px[o + 2]];
  };
  const medianOf = (values, ch) => {
    const s = values.map((v) => v[ch]).sort((a, b) => a - b);
    return s[Math.floor((s.length - 1) / 2)];
  };
  const medianColor = (values) => (values.length === 0
    ? null
    : [medianOf(values, 0), medianOf(values, 1), medianOf(values, 2)]);
  const diff = (a, b) => (!a || !b ? Infinity : Math.max(
    Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])
  ));

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cards = Array.from(document.querySelectorAll('.sprites-grid .sprite-card'));
  const inViewportIndices = [];
  const learnedRefs = [];
  const details = [];
  let readyInView = 0;
  let blankInView = 0;
  let flatBgReady = 0;
  let ambiguousReady = 0;
  let artifactCards = 0;
  let occludedCards = 0;

  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw;
    if (!inView) return;
    inViewportIndices.push(i);
    const imageBox = card.querySelector('.card-image');
    const cardImg = card.querySelector('.card-image img:not(.card-image__crown)');
    const ready = Boolean(cardImg) && cardImg.complete && cardImg.naturalWidth > 0;
    if (!ready || !imageBox) {
      blankInView += 1;
      return;
    }
    readyInView += 1;

    // pick(): muestra un pixel SOLO si el punto no esta tapado por otra capa (navbar fijo, modal,
    // prompt de instalacion, adornos de temporada). Sin este filtro, cualquier overlay oscuro
    // encima de una tarjeta se lee como "fondo de la tarjeta" y da un falso positivo.
    const pick = (x, y) => {
      const xi = Math.round(x);
      const yi = Math.round(y);
      if (!(xi >= 0 && yi >= 0 && xi < W && yi < H)) return null;
      const el = document.elementFromPoint(xi, yi);
      if (!el || !(el === card || card.contains(el))) return null;
      return sampleAt(xi, yi);
    };

    // Fondo real de la tarjeta: franja del padding lateral de 14 px, fuera de .card-image.
    const bgSamples = [];
    for (const yy of [rect.top + 16, rect.top + rect.height / 2, rect.bottom - 8]) {
      const left = pick(rect.left + 4, yy);
      const right = pick(rect.right - 5, yy);
      if (left) bgSamples.push(left);
      if (right) bgSamples.push(right);
    }
    let bg = medianColor(bgSamples);
    if (!bg) {
      const computed = String(getComputedStyle(card).backgroundColor || '');
      const nums = computed.split(/[^0-9.]+/).map(Number).filter((n) => Number.isFinite(n));
      if (nums.length >= 3) bg = [nums[0], nums[1], nums[2]];
    }
    if (!bg) return;

    // Region juzgable: interseccion de la caja .card-image con el viewport. Se muestrea DENTRO de
    // la interseccion para poder juzgar tambien a las tarjetas que estan entrando, que es donde
    // vive el artefacto del render diferido (la tarjeta recien expuesta).
    const ib = imageBox.getBoundingClientRect();
    const irW = Math.min(ib.right, vw) - Math.max(ib.left, 0);
    const irH = Math.min(ib.bottom, vh) - Math.max(ib.top, 0);
    if (irW < 10 || irH < 10) {
      occludedCards += 1;
      return;
    }
    const irLeft = Math.max(ib.left, 0);
    const irTop = Math.max(ib.top, 0);
    const points = [];
    let occludedPoints = 0;
    for (let gy = 0; gy < grid; gy += 1) {
      for (let gx = 0; gx < grid; gx += 1) {
        const fx = 0.1 + (0.8 * gx) / (grid - 1);
        const fy = 0.1 + (0.8 * gy) / (grid - 1);
        const s = pick(irLeft + irW * fx, irTop + irH * fy);
        if (s) points.push(s);
        else occludedPoints += 1;
      }
    }
    if (points.length < 8) {
      occludedCards += 1;
      return;
    }

    const regionMedian = medianColor(points);
    const paintedPoints = points.filter((s) => diff(s, bg) > bgTol).length;
    const flatBg = paintedPoints === 0;
    const paintedBefore = refs[String(i)] || null;
    // Solo informativo (no decide): cuanto se diferencia la region visible de la ultima region que
    // se vio pintada en esa tarjeta. Con regiones recortadas la comparacion no es valida.
    const lastPaintedDiff = paintedBefore && regionMedian ? diff(regionMedian, paintedBefore) : null;

    let artifact = false;
    if (flatBg) {
      flatBgReady += 1;
      // Nunca se la vio pintada: no hay evidencia de que deba mostrar arte -> no se la juzga.
      if (!paintedBefore) ambiguousReady += 1;
      else {
        artifact = true;
        artifactCards += 1;
      }
    } else if (!paintedBefore && regionMedian) {
      // Se vio pintada: queda marcada como tarjeta con arte para el resto de la corrida.
      learnedRefs.push([String(i), regionMedian]);
    }
    if (flatBg || artifact) {
      details.push({
        i,
        artifact,
        flatBg,
        paintedPoints,
        paintedBefore: Boolean(paintedBefore),
        lastPaintedDiff: lastPaintedDiff === null ? null : Math.round(lastPaintedDiff),
        regionMatchesLastPainted: lastPaintedDiff !== null && lastPaintedDiff <= refTol,
        ready,
        cardTop: Math.round(rect.top),
        cardBottom: Math.round(rect.bottom),
        visibleBox: [
          Math.round(irLeft), Math.round(irTop), Math.round(irW), Math.round(irH)
        ],
        usablePoints: points.length,
        occludedPoints,
        bg
      });
    }
  });

  return {
    phase,
    scrollY: Math.round(window.scrollY),
    inViewportCards: readyInView + blankInView,
    inViewportIndices,
    readyInView,
    blankInView,
    flatBgReady,
    ambiguousReady,
    artifactCards,
    occludedCards,
    isArtifactFrame: artifactCards > 0,
    isBlankFrame: blankInView > 0,
    learnedRefs,
    details
  };
}

function parseArgs(argv) {
  const args = {
    runs: 1,
    out: null,
    url: null,
    dir: DIST_DIR,
    throttle: 'none',
    scrollMode: 'jump',
    scenario: 'scroll',
    logNetwork: false,
    debugRects: false,
    blockUrls: [],
    offsets: DEFAULT_OFFSETS.slice(),
    roundtripMax: ROUNDTRIP_MAX_DEFAULT,
    artifactSamples: ARTIFACT_SAMPLES_DEFAULT
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === '--runs') {
      args.runs = Number(argv[i + 1]);
      i += 1;
    } else if (flag === '--out') {
      args.out = argv[i + 1];
      i += 1;
    } else if (flag === '--url') {
      args.url = argv[i + 1];
      i += 1;
    } else if (flag === '--dir') {
      args.dir = path.resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (flag === '--throttle') {
      args.throttle = argv[i + 1];
      i += 1;
    } else if (flag === '--scroll-mode') {
      args.scrollMode = argv[i + 1];
      i += 1;
    } else if (flag === '--scenario') {
      args.scenario = argv[i + 1];
      i += 1;
    } else if (flag === '--log-network') {
      args.logNetwork = true;
    } else if (flag === '--debug-rects') {
      args.debugRects = true;
    } else if (flag === '--block-urls') {
      args.blockUrls = String(argv[i + 1] || '')
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      i += 1;
    } else if (flag === '--offsets') {
      args.offsets = String(argv[i + 1] || '')
        .split(',')
        .map((part) => Number(part.trim()))
        .filter((n) => Number.isFinite(n) && n >= 0);
      i += 1;
    } else if (flag === '--roundtrip-max') {
      args.roundtripMax = Number(argv[i + 1]);
      i += 1;
    } else if (flag === '--artifact-samples') {
      args.artifactSamples = Number(argv[i + 1]);
      i += 1;
    } else {
      throw new Error('Argumento no reconocido: ' + flag);
    }
  }
  if (!Number.isInteger(args.runs) || args.runs < 1) {
    throw new Error('--runs debe ser un entero >= 1');
  }
  if (!(args.throttle in THROTTLES)) {
    throw new Error('--throttle debe ser uno de: ' + Object.keys(THROTTLES).join(', '));
  }
  if (args.scrollMode !== 'jump' && args.scrollMode !== 'continuous' && args.scrollMode !== 'roundtrip') {
    throw new Error('--scroll-mode debe ser jump, continuous o roundtrip');
  }
  if (!Number.isFinite(args.roundtripMax) || args.roundtripMax < 0) {
    throw new Error('--roundtrip-max debe ser un numero >= 0');
  }
  if (!Number.isInteger(args.artifactSamples) || args.artifactSamples < 0) {
    throw new Error('--artifact-samples debe ser un entero >= 0 (0 = gesto sin capturas, solo CPU)');
  }
  if (args.scenario !== 'scroll' && args.scenario !== 'idle' && args.scenario !== 'startup') {
    throw new Error('--scenario debe ser scroll, idle o startup');
  }
  if (args.offsets.length === 0) {
    throw new Error('--offsets debe listar al menos un entero');
  }
  return args;
}

function createStaticServer(rootDir) {
  const server = http.createServer((req, res) => {
    serveRequest(rootDir, req, res).catch((err) => {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(String((err && err.message) || err));
    });
  });
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port }));
  });
}

async function serveRequest(rootDir, req, res) {
  // Las mismas cabeceras de cache que produccion (vercel.json). Sin esto el calentador de
  // miniaturas no sirve de nada: una miniatura ya bajada se volveria a pedir al entrar al
  // viewport y warmerBytes/warmWastedBytes no dirian la verdad.
  const url = new URL(req.url, 'http://127.0.0.1');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const filePath = path.resolve(rootDir, '.' + rel);
  if (!filePath.startsWith(rootDir + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }
  let stat = null;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    stat = null;
  }
  if (!stat || !stat.isFile()) {
    const acceptsHtml = String(req.headers.accept || '').includes('text/html');
    if (!acceptsHtml) {
      // Asset faltante: 404 real, que es justo lo que produce la cadena de miniaturas viejas.
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
  }
  const target = stat && stat.isFile() ? filePath : path.join(rootDir, 'index.html');
  const body = await fs.promises.readFile(target);
  const type = stat && stat.isFile()
    ? (MIME.get(path.extname(target).toLowerCase()) || 'application/octet-stream')
    : 'text/html; charset=utf-8';
  // Mismo orden que vercel.json: /assets/*, /sprites/*, HTML. El resto no lleva cabecera.
  let cacheControl = null;
  if (url.pathname.startsWith('/assets/')) {
    cacheControl = CACHE_ASSETS;
  } else if (url.pathname.startsWith('/sprites/')) {
    cacheControl = CACHE_SPRITES;
  } else if (path.extname(target).toLowerCase() === '.html') {
    cacheControl = CACHE_HTML;
  }
  const headers = { 'Content-Type': type, 'Content-Length': body.length };
  if (cacheControl) headers['Cache-Control'] = cacheControl;
  res.writeHead(200, headers);
  res.end(body);
}

async function measureStep(page, cfg) {
  return page.evaluate(async (step) => {
    const raf = () => new Promise((resolve) => requestAnimationFrame(resolve));
    const cards = () => Array.from(document.querySelectorAll('.sprites-grid .sprite-card'));
    const spriteImg = (card) => card.querySelector('.card-image img:not(.card-image__crown)');
    const ready = (img) => Boolean(img) && img.complete && img.naturalWidth > 0;
    const inViewport = (card) => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
    };

    // Indice de tarjeta por elemento (mismo orden que el DOM y que urls), resuelto una sola vez.
    const indicePorTarjeta = new Map();
    cards().forEach((card, i) => indicePorTarjeta.set(card, i));
    // Indices que estuvieron dentro del viewport en algun frame muestreado del paso.
    const indicesEnViewport = new Set();

    const t0 = performance.now();
    const scrollTopBefore = window.scrollY;
    let scrollReached = step.scrollMode === 'jump';

    if (step.scrollMode === 'jump') {
      window.scrollTo(0, step.offset);
    } else {
      window.scrollTo(0, Math.min(step.offset, window.scrollY + step.stride));
    }
    const scrollTopAfterDriverStart = window.scrollY;
    let lastStepAt = t0;

    let firstFrame = null;
    let msToFirstArtVisible = null;
    let framesSampled = 0;
    let framesWithBlank = 0;
    let timedOut = false;
    let firstFrameDebug = null;
    // En continuous el viewport del primer frame todavia esta arriba (el scroll recien empieza),
    // asi que "todas listas" puede dispararse antes de llegar al offset. Estas dos metricas
    // miden desde la llegada al offset objetivo y son las comparables con scroll-mode jump.
    let targetReachedAt = step.scrollMode === 'jump' ? t0 : null;
    let framesAfterArrival = 0;
    let blankFramesAfterArrival = 0;
    let msToAllCompleteFromTarget = null;

    for (;;) {
      await raf();
      const now = performance.now();

      if (!scrollReached && now - lastStepAt >= step.interval) {
        lastStepAt = now;
        const next = Math.min(step.offset, window.scrollY + step.stride);
        window.scrollTo(0, next);
        if (next >= step.offset) scrollReached = true;
      }

      const inView = cards().filter(inViewport);
      inView.forEach((card) => {
        const indice = indicePorTarjeta.get(card);
        if (typeof indice === 'number') indicesEnViewport.add(indice);
      });
      const blank = inView.filter((card) => !ready(spriteImg(card))).length;
      framesSampled += 1;
      if (blank > 0) framesWithBlank += 1;
      if (firstFrame === null) {
        firstFrame = { inViewport: inView.length, blank };
        if (step.debugRects) {
          firstFrameDebug = cards().slice(0, 30).map((card, idx) => {
            const rect = card.getBoundingClientRect();
            const img = spriteImg(card);
            return {
              i: idx,
              top: Math.round(rect.top),
              h: Math.round(rect.height),
              w: Math.round(rect.width),
              offH: card.offsetHeight,
              ready: ready(img),
              src: img ? (img.getAttribute('src') || '') : null
            };
          });
        }
      }
      if (blank === 0 && msToFirstArtVisible === null) msToFirstArtVisible = now - t0;

      if (scrollReached) {
        if (targetReachedAt === null) targetReachedAt = now;
        framesAfterArrival += 1;
        if (blank > 0) blankFramesAfterArrival += 1;
      }

      if (blank === 0 && scrollReached) {
        msToAllCompleteFromTarget = now - (targetReachedAt === null ? t0 : targetReachedAt);
        break;
      }
      if (now - t0 > step.stepTimeoutMs) {
        timedOut = true;
        break;
      }
    }

    const inViewFinal = cards().filter(inViewport);
    const imagesNotLoadedAtEnd = inViewFinal.filter((card) => !ready(spriteImg(card))).length;

    // Marcador real de la cadena de 404: el onError de la tarjeta deja dataset.triedBase en la
    // imagen. Mirar solo el sufijo "_basic.webp" da falsos positivos: los thumbs legitimos de las
    // variantes base viven en /sprites/thumbs/<id>_basic.webp y tambien terminan asi, mientras que
    // el fallback real es /sprites/<familia>_basic.webp (sin /thumbs/).
    const fallbackCards = cards().filter((card) => {
      const img = spriteImg(card);
      return Boolean(img && img.dataset && img.dataset.triedBase === 'true');
    });
    const basicFallbacks = fallbackCards.length;
    const basicFallbacksInViewport = fallbackCards.filter(inViewport).length;

    const decodeStart = performance.now();
    const decodeResults = await Promise.all(inViewFinal.map((card) => {
      const img = spriteImg(card);
      if (!img) return Promise.resolve('no-img');
      return Promise.race([
        img.decode().then(() => 'ok').catch(() => 'error'),
        new Promise((resolve) => setTimeout(() => resolve('timeout'), step.stepTimeoutMs))
      ]);
    }));
    const msToAllDecoded = decodeResults.includes('timeout') ? null : performance.now() - decodeStart;

    let requests = null;
    if (step.logNetwork) {
      // startTime/responseEnd de Resource Timing comparten el reloj de performance.now()
      // (ms desde timeOrigin), asi que startTime >= t0 aisla lo pedido en este paso.
      requests = performance.getEntriesByType('resource')
        .filter((entry) => entry.startTime >= t0 - 0.5)
        .map((entry) => ({
          url: entry.name,
          status: typeof entry.responseStatus === 'number' ? entry.responseStatus : null,
          type: entry.initiatorType || null,
          startTime: Math.round(entry.startTime * 100) / 100,
          responseEnd: Math.round(entry.responseEnd * 100) / 100,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          duration: Math.round(entry.duration * 100) / 100
        }));
    }

    // Registro del calentador (puede no existir: build viejo, otro runtime).
    const registroCalentador = Array.isArray(window.__spriteWarmLog) ? window.__spriteWarmLog : [];
    const warmedDuringStep = registroCalentador.filter(
      (w) => w && typeof w.t === 'number' && w.t >= t0 - 0.5
    ).length;

    let cacheHits = null;
    let transferBytes = null;
    let warmerRequests = null;
    let warmerBytes = null;
    let warmerCacheHits = null;
    if (requests) {
      cacheHits = requests.filter((r) => r.transferSize === 0 && r.encodedBodySize > 0).length;
      transferBytes = requests.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0);
      // Heuristica: la peticion del calentador arranca pocos ms despues de fijar src; la de la
      // tarjeta, si llega, es muy posterior y no cae en la ventana de 1 s.
      const delCalentador = requests.filter((r) => registroCalentador.some(
        (w) => w && w.url === r.url && Math.abs(r.startTime - w.t) <= 1000
      ));
      warmerRequests = delCalentador.length;
      warmerBytes = delCalentador.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0);
      warmerCacheHits = delCalentador.filter((r) => r.transferSize === 0).length;
    }

    const msToFirstArt = msToFirstArtVisible === null ? null : Math.round(msToFirstArtVisible * 100) / 100;
    return {
      offset: step.offset,
      scrollTopBefore,
      scrollTopAfterDriverStart,
      scrollTopAfter: window.scrollY,
      firstFrame,
      framesSampled,
      framesWithBlank,
      blankFrameRatio: framesSampled > 0 ? Math.round((framesWithBlank / framesSampled) * 10000) / 10000 : null,
      msToFirstArtVisible: msToFirstArt,
      msToAllComplete: msToFirstArt,
      msToAllCompleteFromTarget: msToAllCompleteFromTarget === null ? null : Math.round(msToAllCompleteFromTarget * 100) / 100,
      framesAfterArrival,
      blankFramesAfterArrival,
      blankFrameRatioAfterArrival: framesAfterArrival > 0 ? Math.round((blankFramesAfterArrival / framesAfterArrival) * 10000) / 10000 : null,
      imagesNotLoadedAtEnd,
      timedOut,
      msToAllDecoded,
      totalCards: cards().length,
      inViewportAtEnd: inViewFinal.length,
      firstFrameDebug,
      basicFallbacks,
      basicFallbacksInViewport,
      inViewportIndices: Array.from(indicesEnViewport).sort((a, b) => a - b),
      cacheHits,
      warmedDuringStep,
      warmerRequests,
      warmerBytes,
      warmerCacheHits,
      transferBytes,
      requests
    };
  }, cfg);
}

// Lectura barata (sin screenshot) para el modo CPU puro: indices en viewport y cuantas tarjetas
// estan listas. Se usa cuando --artifact-samples 0, para medir trabajo del gesto sin la carga del
// propio arnes.
function readLightFrame(page) {
  return page.evaluate(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cards = Array.from(document.querySelectorAll('.sprites-grid .sprite-card'));
    const indices = [];
    let ready = 0;
    let blank = 0;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      if (!(rect.bottom > 0 && rect.top < vh && rect.right > 0 && rect.left < vw)) return;
      indices.push(i);
      const img = card.querySelector('.card-image img:not(.card-image__crown)');
      if (img && img.complete && img.naturalWidth > 0) ready += 1;
      else blank += 1;
    });
    return { scrollY: Math.round(window.scrollY), indices, ready, blank };
  });
}

function newRoundtripPhase(name, fromY, toY) {
  return {
    phase: name,
    fromY: Math.round(fromY),
    toY: Math.round(toY),
    framesSampled: 0,
    artifactFrames: 0,
    blankFrames: 0,
    artifactCardsTotal: 0,
    cardsSeen: 0,
    inViewportIndices: [],
    positions: [],
    frames: []
  };
}

// Metricas de proceso del renderer (CDP Performance domain). Los deltas alrededor del gesto son
// milisegundos de CPU del hilo principal atribuibles al gesto: TaskDuration es el trabajo total,
// ScriptDuration el JS, LayoutDuration el layout y RecalcStyleDuration el recalculo de estilo.
// Es un proxy: no separa hilos de raster ni GPU, pero es comparable antes/despues bajo el mismo
// protocolo.
async function readPerfMetrics(client) {
  const res = await client.send('Performance.getMetrics');
  const map = new Map();
  for (const metric of res.metrics || []) map.set(metric.name, metric.value);
  const seconds = (name) => (Number(map.get(name)) || 0) * 1000;
  return {
    taskMs: seconds('TaskDuration'),
    scriptMs: seconds('ScriptDuration'),
    layoutMs: seconds('LayoutDuration'),
    recalcStyleMs: seconds('RecalcStyleDuration'),
    layoutCount: Number(map.get('LayoutCount')) || 0,
    recalcStyleCount: Number(map.get('RecalcStyleCount')) || 0,
    jsHeapUsedBytes: Number(map.get('JSHeapUsedSize')) || 0,
    nodes: Number(map.get('Nodes')) || 0
  };
}

// Fase 5 / T6: gesto de ida y vuelta con muestreo de PIXELES.
//
// El scroll lo maneja Node (no la pagina) para poder intercalar un page.screenshot() por frame:
// screenshot -> data URL -> canvas + getImageData dentro de la pagina -> veredicto por tarjeta.
// Sin dependencias nuevas: el decodificador de PNG es el propio navegador (mismo origen, sin taint).
//
// Cada fase se muestrea por separado (bajada y subida) y al final se toma un frame de CONTROL ya
// asentado (SETTLE_MS de quietud) que sirve como medida de FALSOS POSITIVOS del criterio.
async function measureRoundtrip(page, cfg, client) {
  const geometry = await page.evaluate((max) => {
    const bottom = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return { bottom, targetY: Math.min(max, bottom), startY: window.scrollY };
  }, cfg.roundtripMax);

  // --- Extension (calor/CPU en moviles antiguos) -------------------------------------------
  // Long tasks durante el gesto, no solo durante el arranque: se instala un observer y se vacia
  // la lista al inicio de cada fase, asi la bajada y la subida se reportan por separado.
  const longTasksSupported = await page.evaluate(() => {
    window.__rtLongTasks = [];
    window.__rtLongObserver = null;
    try {
      window.__rtLongObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__rtLongTasks.push({
            start: Math.round(entry.startTime * 100) / 100,
            dur: Math.round(entry.duration * 100) / 100
          });
        }
      });
      window.__rtLongObserver.observe({ entryTypes: ['longtask'] });
      return true;
    } catch {
      return false;
    }
  });
  await client.send('Performance.enable');
  let layersSupported = false;
  let layerCount = null;
  try {
    if (typeof client.on === 'function') {
      client.on('LayerTree.layerTreeDidChange', ({ layers }) => {
        if (Array.isArray(layers)) layerCount = layers.length;
      });
    }
    await client.send('LayerTree.enable');
    layersSupported = true;
  } catch {
    layersSupported = false;
  }
  const metricsBefore = await readPerfMetrics(client);
  const gestureWallStart = Date.now();

  const startedAt = await page.evaluate(() => performance.now());
  const refs = {};
  const phases = {
    down: newRoundtripPhase('down', geometry.startY, geometry.targetY),
    up: newRoundtripPhase('up', geometry.targetY, geometry.startY)
  };

  const sampleFrame = async (phaseName) => {
    const shot = await page.screenshot({ type: 'png' });
    const frame = await page.evaluate(analyzeArtifactFrame, {
      dataUrl: 'data:image/png;base64,' + Buffer.from(shot).toString('base64'),
      phase: phaseName,
      refs,
      bgTol: ARTIFACT_BG_TOL,
      refTol: ARTIFACT_REF_TOL,
      grid: ARTIFACT_GRID
    });
    // Las refs se aprenden en la pagina pero viajan por structured clone, asi que se fusionan aca.
    if (Array.isArray(frame.learnedRefs)) {
      for (const entry of frame.learnedRefs) if (!refs[entry[0]]) refs[entry[0]] = entry[1];
    }
    delete frame.learnedRefs;
    return frame;
  };

  const drivePhase = async (phaseName) => {
    const phase = phases[phaseName];
    const stepDir = phase.toY >= phase.fromY ? 1 : -1;
    const vistos = new Set();
    let y = phase.fromY;
    for (let i = 0; i < ARTIFACT_MAX_FRAMES; i += 1) {
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      // Espera a que el navegador PRODUZCA un frame en la posicion nueva antes de capturar. Sin esto
      // el screenshot cae en el estado previo al pintado de la franja recien expuesta, y eso ocurre
      // hasta en una web normal (es latencia de captura, no el artefacto que reporta el usuario).
      // Dos rAF = al menos una oportunidad de pintado del area recien expuesta.
      await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }));
      // Primera captura: la metrica titular (1 frame por posicion = muestreo uniforme, comparable
      // entre builds). Capturas extra SIN mover el scroll: la latencia de pintado de la posicion.
      let posicion = null;
      if (cfg.artifactSamples === 0) {
        // Modo CPU puro: sin screenshots. El delta de Performance.getMetrics queda casi sin el
        // coste del arnes (solo la lectura de viewport), asi que el delta es atribuible a la app.
        const light = await readLightFrame(page);
        phase.framesSampled += 1;
        if (light.blank > 0) phase.blankFrames += 1;
        phase.cardsSeen += light.ready + light.blank;
        for (const indice of light.indices) vistos.add(indice);
        phase.frames.push({
          y: light.scrollY,
          inViewport: light.ready + light.blank,
          ready: light.ready,
          blank: light.blank,
          occluded: null,
          artifactCards: 0,
          artifact: false,
          detail: []
        });
        posicion = {
          y: light.scrollY,
          captures: 0,
          cleared: true,
          artifactCards: 0,
          flatBgReady: null,
          ambiguousReady: null,
          occludedCards: null,
          cards: []
        };
      } else {
        for (let c = 0; c < cfg.artifactSamples; c += 1) {
          const frame = await sampleFrame(phaseName);
          if (c === 0) {
            phase.framesSampled += 1;
            if (frame.isArtifactFrame) phase.artifactFrames += 1;
            if (frame.isBlankFrame) phase.blankFrames += 1;
            phase.artifactCardsTotal += frame.artifactCards;
            phase.cardsSeen += frame.inViewportCards;
            for (const indice of frame.inViewportIndices) vistos.add(indice);
            phase.frames.push({
              y: frame.scrollY,
              inViewport: frame.inViewportCards,
              ready: frame.readyInView,
              blank: frame.blankInView,
              flatBg: frame.flatBgReady,
              ambiguous: frame.ambiguousReady,
              occluded: frame.occludedCards,
              artifactCards: frame.artifactCards,
              artifact: frame.isArtifactFrame,
              detail: frame.details
            });
          }
          posicion = {
            y: frame.scrollY,
            captures: c + 1,
            cleared: !frame.isArtifactFrame,
            artifactCards: frame.artifactCards,
            flatBgReady: frame.flatBgReady,
            ambiguousReady: frame.ambiguousReady,
            occludedCards: frame.occludedCards,
            cards: frame.details
          };
          if (!frame.isArtifactFrame) break;
          if (c + 1 < cfg.artifactSamples) await delay(ARTIFACT_RECAPTURE_MS);
        }
      }
      phase.positions.push(posicion);
      if (y === phase.toY) break;
      y = stepDir > 0
        ? Math.min(phase.toY, y + ROUNDTRIP_STRIDE_PX)
        : Math.max(phase.toY, y - ROUNDTRIP_STRIDE_PX);
      await delay(ROUNDTRIP_INTERVAL_MS);
    }
    phase.inViewportIndices = Array.from(vistos).sort((a, b) => a - b);
    return phase;
  };

  const resetLongTasks = () => page.evaluate(() => {
    if (Array.isArray(window.__rtLongTasks)) window.__rtLongTasks.length = 0;
  });
  const readLongTasks = async () => {
    await delay(50);
    const entries = await page.evaluate(
      () => (Array.isArray(window.__rtLongTasks) ? window.__rtLongTasks.slice() : null)
    );
    if (!entries) return { supported: false, count: null, totalMs: null, maxMs: null };
    return {
      supported: true,
      count: entries.length,
      totalMs: round(entries.reduce((acc, entry) => acc + entry.dur, 0)),
      maxMs: entries.length > 0 ? Math.max(...entries.map((entry) => entry.dur)) : 0
    };
  };

  await resetLongTasks();
  const down = await drivePhase('down');
  const downLongTasks = await readLongTasks();
  await resetLongTasks();
  const up = await drivePhase('up');
  const upLongTasks = await readLongTasks();

  const gestureWallMs = Date.now() - gestureWallStart;
  const metricsAfter = await readPerfMetrics(client);
  const delta = {
    taskMs: round(metricsAfter.taskMs - metricsBefore.taskMs),
    scriptMs: round(metricsAfter.scriptMs - metricsBefore.scriptMs),
    layoutMs: round(metricsAfter.layoutMs - metricsBefore.layoutMs),
    recalcStyleMs: round(metricsAfter.recalcStyleMs - metricsBefore.recalcStyleMs)
  };
  const perSecond = gestureWallMs > 0
    ? {
        taskMs: round(delta.taskMs / (gestureWallMs / 1000)),
        scriptMs: round(delta.scriptMs / (gestureWallMs / 1000)),
        layoutMs: round(delta.layoutMs / (gestureWallMs / 1000)),
        recalcStyleMs: round(delta.recalcStyleMs / (gestureWallMs / 1000))
      }
    : null;
  const scrollPx = Math.abs(down.toY - down.fromY) + Math.abs(up.toY - up.fromY);
  const cpu = {
    gestureMs: gestureWallMs,
    scrollPx,
    perf: delta,
    perSecond,
    layoutCount: metricsAfter.layoutCount - metricsBefore.layoutCount,
    recalcStyleCount: metricsAfter.recalcStyleCount - metricsBefore.recalcStyleCount,
    longTasks: { supported: longTasksSupported, down: downLongTasks, up: upLongTasks },
    layers: { supported: layersSupported, count: layersSupported ? layerCount : null }
  };

  // Frame de control: se vuelve al tope de la ronda, se deja asentar y se captura. Ahi todas las
  // tarjetas deberian estar pintadas. Cualquier artefacto marcado en el control es un FALSO POSITIVO
  // del criterio (y su tasa sale de estos numeros). Se hace en el tope de la ronda y no en el tope
  // del documento porque arriba de todo el grid todavia no entra en el viewport (0 tarjetas).
  await page.evaluate((yy) => window.scrollTo(0, yy), geometry.targetY);
  await delay(SETTLE_MS);
  const controlFrame = await sampleFrame('control');
  const control = {
    scrollY: controlFrame.scrollY,
    inViewportCards: controlFrame.inViewportCards,
    readyInView: controlFrame.readyInView,
    flatBgReady: controlFrame.flatBgReady,
    ambiguousReady: controlFrame.ambiguousReady,
    artifactCards: controlFrame.artifactCards,
    isArtifactFrame: controlFrame.isArtifactFrame
  };

  const requests = cfg.logNetwork
    ? await page.evaluate((cut) => performance.getEntriesByType('resource')
        .filter((entry) => entry.startTime >= cut - 0.5)
        .map((entry) => ({
          url: entry.name,
          status: typeof entry.responseStatus === 'number' ? entry.responseStatus : null,
          type: entry.initiatorType || null,
          startTime: Math.round(entry.startTime * 100) / 100,
          responseEnd: Math.round(entry.responseEnd * 100) / 100,
          transferSize: entry.transferSize,
          encodedBodySize: entry.encodedBodySize,
          duration: Math.round(entry.duration * 100) / 100
        })), startedAt)
    : null;

  return {
    targetY: Math.round(geometry.targetY),
    maxScrollY: Math.round(geometry.bottom),
    startY: Math.round(geometry.startY),
    stridePx: ROUNDTRIP_STRIDE_PX,
    intervalMs: ROUNDTRIP_INTERVAL_MS,
    artifactSamples: cfg.artifactSamples,
    refsLearned: Object.keys(refs).length,
    down,
    up,
    control,
    cpu,
    requests
  };
}

function enrichRoundtripWithNetwork(roundtrip, statusByUrl) {
  if (!roundtrip || !Array.isArray(roundtrip.requests)) return roundtrip;
  const enriched = enrichRequests(roundtrip.requests, statusByUrl);
  const delCollage = roundtrip.requests.filter((r) => r.url.indexOf(COLLAGE_URL_MARK) !== -1);
  return {
    ...roundtrip,
    count404: enriched.count404,
    urls404: enriched.urls404,
    slowest3: enriched.slowest3,
    collageBytes: delCollage.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0),
    collageRequests: delCollage.length,
    transferBytes: roundtrip.requests.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0)
  };
}

// Latencia de pintado por posicion: cuantas capturas (sin mover el scroll) hicieron falta hasta
// que el viewport dejo de mostrar el fondo de la tarjeta en una tarjeta ya cargada. Se agrupan
// todas las posiciones de todas las corridas de esa fase (mismo set de offsets en cada corrida).
function summarizePaintLatency(entries, name) {
  const posiciones = entries.flatMap((entry) => (entry[name] && Array.isArray(entry[name].positions)
    ? entry[name].positions
    : [])).filter((p) => p && typeof p.captures === 'number' && p.captures > 0);
  if (posiciones.length === 0) return null;
  const valores = posiciones.map((p) => p.captures);
  const histograma = {};
  for (const v of valores) histograma[String(v)] = (histograma[String(v)] || 0) + 1;
  const ordenados = valores.slice().sort((a, b) => a - b);
  return {
    positions: posiciones.length,
    median: round(median(valores)),
    p90: ordenados[Math.min(ordenados.length - 1, Math.floor(ordenados.length * 0.9))],
    max: Math.max(...valores),
    notCleared: posiciones.filter((p) => !p.cleared).length,
    histogram: histograma
  };
}

function summarizeRoundtripCpu(entries) {
  const cpus = entries.map((entry) => entry.cpu).filter(Boolean);
  if (cpus.length === 0) return null;
  const mm = (fn) => round(median(cpus.map(fn)));
  return {
    gestureMs: mm((c) => c.gestureMs),
    scrollPx: mm((c) => c.scrollPx),
    perf: {
      taskMs: mm((c) => c.perf.taskMs),
      scriptMs: mm((c) => c.perf.scriptMs),
      layoutMs: mm((c) => c.perf.layoutMs),
      recalcStyleMs: mm((c) => c.perf.recalcStyleMs)
    },
    perSecond: {
      taskMs: mm((c) => (c.perSecond ? c.perSecond.taskMs : null)),
      scriptMs: mm((c) => (c.perSecond ? c.perSecond.scriptMs : null)),
      layoutMs: mm((c) => (c.perSecond ? c.perSecond.layoutMs : null)),
      recalcStyleMs: mm((c) => (c.perSecond ? c.perSecond.recalcStyleMs : null))
    },
    layoutCount: mm((c) => c.layoutCount),
    recalcStyleCount: mm((c) => c.recalcStyleCount),
    longTasksSupported: cpus.some((c) => c.longTasks.supported),
    longTasksDown: {
      count: mm((c) => c.longTasks.down.count),
      totalMs: mm((c) => c.longTasks.down.totalMs),
      maxMs: mm((c) => c.longTasks.down.maxMs)
    },
    longTasksUp: {
      count: mm((c) => c.longTasks.up.count),
      totalMs: mm((c) => c.longTasks.up.totalMs),
      maxMs: mm((c) => c.longTasks.up.maxMs)
    },
    layersSupported: cpus.every((c) => c.layers.supported),
    layerCount: cpus.every((c) => c.layers.supported) ? mm((c) => c.layers.count) : null,
    perRun: cpus.map((c) => ({
      gestureMs: c.gestureMs,
      taskMs: c.perf.taskMs,
      scriptMs: c.perf.scriptMs,
      layoutMs: c.perf.layoutMs,
      recalcStyleMs: c.perf.recalcStyleMs,
      taskMsPerSecond: c.perSecond ? c.perSecond.taskMs : null,
      longTasksDown: c.longTasks.down.count,
      longTasksUp: c.longTasks.up.count,
      layers: c.layers.count
    }))
  };
}

function buildRoundtripSummary(runs) {
  const entries = runs.map((run) => run.roundtrip).filter(Boolean);
  if (entries.length === 0) return null;
  const m = (fn) => round(median(entries.map(fn)));
  const fase = (name) => ({
    phase: name,
    fromY: m((e) => e[name].fromY),
    toY: m((e) => e[name].toY),
    framesSampled: m((e) => e[name].framesSampled),
    artifactFrames: m((e) => e[name].artifactFrames),
    artifactFrameRatio: m((e) => (e[name].framesSampled > 0
      ? Math.round((e[name].artifactFrames / e[name].framesSampled) * 10000) / 10000
      : null)),
    blankFrames: m((e) => e[name].blankFrames),
    blankFrameRatio: m((e) => (e[name].framesSampled > 0
      ? Math.round((e[name].blankFrames / e[name].framesSampled) * 10000) / 10000
      : null)),
    artifactCardsTotal: m((e) => e[name].artifactCardsTotal),
    paintLatency: summarizePaintLatency(entries, name),
    perRun: entries.map((e) => ({
      framesSampled: e[name].framesSampled,
      artifactFrames: e[name].artifactFrames,
      blankFrames: e[name].blankFrames,
      artifactCards: e[name].artifactCardsTotal
    }))
  });
  return {
    targetY: m((e) => e.targetY),
    maxScrollY: m((e) => e.maxScrollY),
    startY: m((e) => e.startY),
    stridePx: entries[0].stridePx,
    intervalMs: entries[0].intervalMs,
    refsLearned: m((e) => e.refsLearned),
    artifactSamples: entries[0].artifactSamples,
    count404: round(median(entries.map((e) => (typeof e.count404 === 'number' ? e.count404 : 0)))),
    collageBytes: round(median(entries.map((e) => (typeof e.collageBytes === 'number' ? e.collageBytes : 0)))),
    transferBytes: round(median(entries.map((e) => (typeof e.transferBytes === 'number' ? e.transferBytes : 0)))),
    cpu: summarizeRoundtripCpu(entries),
    down: fase('down'),
    up: fase('up'),
    control: {
      framesSampled: entries.length,
      artifactFrames: entries.filter((e) => e.control.isArtifactFrame).length,
      artifactCards: m((e) => e.control.artifactCards),
      flatBgReady: m((e) => e.control.flatBgReady),
      ambiguousReady: m((e) => e.control.ambiguousReady),
      inViewportCards: m((e) => e.control.inViewportCards),
      isArtifactFramePerRun: entries.map((e) => e.control.isArtifactFrame)
    }
  };
}

function enrichRequests(rawRequests, statusByUrl) {
  const requests = rawRequests.map((r) => ({
    ...r,
    status: r.status === null || r.status === undefined ? (statusByUrl.get(r.url) ?? null) : r.status
  }));
  const urls404 = [...new Set(requests.filter((r) => r.status === 404).map((r) => r.url))].sort();
  return {
    requests,
    count404: requests.filter((r) => r.status === 404).length,
    urls404,
    slowest3: [...requests]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 3)
      .map((r) => ({ url: r.url, ms: r.duration, status: r.status }))
  };
}

function enrichStepWithNetwork(step, statusByUrl) {
  if (!step.requests) return step;
  const collage = step.requests.filter((r) => r.url.indexOf(COLLAGE_URL_MARK) !== -1);
  return {
    ...step,
    ...enrichRequests(step.requests, statusByUrl),
    // Metrica titular de la Fase 1: cuanto del preload del export sale mientras el usuario
    // esta scrolleando. transferSize = bytes realmente en el cable (0 si vino de cache).
    collageBytes: collage.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0),
    collageRequests: collage.length
  };
}

// Espera a que termine de responder la ultima request /sprites/collage/ de la corrida y devuelve
// en cuantos ms (desde el inicio de la pagina, responseEnd comparte el reloj de performance.now())
// dejo de haber respuestas nuevas.
async function waitForCollageComplete(page, quietMs, maxMs) {
  return page.evaluate(async (opts) => {
    const entradas = () => performance.getEntriesByType('resource')
      .filter((e) => e.name.indexOf(opts.marca) !== -1);
    let maxEnd = null;
    for (;;) {
      const es = entradas();
      if (es.length > 0) {
        const ultimo = es.reduce((acc, e) => Math.max(acc, e.responseEnd), 0);
        if (maxEnd === null || ultimo > maxEnd) maxEnd = ultimo;
      }
      const ahora = performance.now();
      if (maxEnd !== null && ahora - maxEnd >= opts.quietMs) {
        return {
          collageCompleteMs: Math.round(maxEnd * 100) / 100,
          collageRequests: es.length,
          collageTimedOut: false
        };
      }
      if (ahora > opts.maxMs) {
        return {
          collageCompleteMs: maxEnd === null ? null : Math.round(maxEnd * 100) / 100,
          collageRequests: entradas().length,
          collageTimedOut: true
        };
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }, { quietMs, maxMs, marca: COLLAGE_URL_MARK });
}

// Guardarrail de la vista de compartir: busca el control por su NOMBRE ACCESIBLE (aria-label,
// title o texto, /compartir|share/i), lo invoca y mide cuanto tarda en dejar de arrancar
// requests /sprites/collage/ nuevas.
async function measureShareReady(page, quietMs, maxMs) {
  return page.evaluate(async (opts) => {
    const nombreAccesible = (el) => String(
      el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || ''
    ).replace(/\s+/g, ' ').trim();
    const visible = (el) => Boolean(el.getClientRects && el.getClientRects().length > 0);
    const describir = (el) => {
      const clases = String(el.getAttribute('class') || '').split(/\s+/).filter(Boolean).slice(0, 2);
      return el.tagName.toLowerCase() + (clases.length > 0 ? '.' + clases.join('.') : '');
    };
    const candidatos = Array.from(document.querySelectorAll('button, a, [role="button"]'))
      .map((el) => ({ el, nombre: nombreAccesible(el) }))
      .filter((c) => /compartir|share/i.test(c.nombre));
    const elegido = candidatos.find((c) => visible(c.el)) || candidatos[0] || null;
    const contadorCollage = () => performance.getEntriesByType('resource')
      .filter((e) => e.name.indexOf(opts.marca) !== -1).length;

    const antes = contadorCollage();
    const candidatosProbados = candidatos.map((c) => describir(c.el) + ' :: ' + c.nombre).slice(0, 8);
    if (!elegido) {
      return {
        available: false,
        selector: null,
        matchedName: null,
        candidates: candidatosProbados,
        collageRequestsBefore: antes,
        collageRequestsAfter: antes,
        shareReadyMs: null,
        shareTimedOut: false
      };
    }

    const selector = describir(elegido.el);
    const matchedName = elegido.nombre;
    const t0 = performance.now();
    elegido.el.click();
    let ultimoCambio = t0;
    let contador = antes;
    let timedOut = false;
    for (;;) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      const ahora = performance.now();
      const n = contadorCollage();
      if (n !== contador) {
        contador = n;
        ultimoCambio = ahora;
      }
      if (ahora - ultimoCambio >= opts.quietMs) break;
      if (ahora - t0 > opts.maxMs) {
        timedOut = true;
        break;
      }
    }
    return {
      available: true,
      selector,
      matchedName,
      candidates: candidatosProbados,
      collageRequestsBefore: antes,
      collageRequestsAfter: contador,
      shareReadyMs: Math.round((ultimoCambio - t0) * 100) / 100,
      shareTimedOut: timedOut
    };
  }, { quietMs, maxMs, marca: COLLAGE_URL_MARK });
}

// Instrumentacion de arranque (escenario startup). Se instala con evaluateOnNewDocument ANTES
// del goto para que los observers (LCP, longtask, MutationObserver) existan antes de que corra el
// codigo de la app. Todo lo que es tiempo queda en el reloj de performance.now() (timeOrigin), el
// mismo de Resource Timing.
function installStartupInstrumentation(page) {
  return page.evaluateOnNewDocument(() => {
    const estado = {
      lcpMs: null,
      lcpElement: null,
      lcpSize: null,
      lcpCandidates: [],
      longTasks: [],
      firstSpriteCardMs: null,
      firstSupabaseUrl: null,
      firstSupabaseRequestStartMs: null,
      firstSupabaseResponseEndMs: null
    };
    const clavesLongTask = new Set();
    const lcpStartTimes = new Set();

    const redondear = (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.round(v * 100) / 100 : null);

    const describir = (el) => {
      if (!el || !el.tagName) return null;
      const clases = String((el.getAttribute && el.getAttribute('class')) || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2);
      return String(el.tagName).toLowerCase() + (clases.length > 0 ? '.' + clases.join('.') : '');
    };

    const esRutaScript = (nombre) => {
      try {
        const p = new URL(nombre, location.href).pathname.toLowerCase();
        return p.endsWith('.js') || p.endsWith('.mjs');
      } catch {
        return false;
      }
    };

    const recursos = () => {
      try {
        return performance.getEntriesByType('resource');
      } catch {
        return [];
      }
    };

    const primeraSupabase = (entradas) => {
      const coincidencias = entradas.filter((e) => /supabase/i.test(e.name));
      coincidencias.sort((a, b) => a.startTime - b.startTime);
      return coincidencias[0] || null;
    };

    const vacio = () => ({
      lcpMs: null, lcpElement: null, lcpSize: null,
      lcpCandidates: [], lcpInitialMs: null, lcpCandidatesCount: 0,
      fcpMs: null, ttfbMs: null, domContentLoadedMs: null, loadEventMs: null,
      longTaskCount: 0, longTaskTotalMs: 0, longTaskMaxMs: 0, longTasksTop5: [],
      jsCriticalBytes: null, jsCriticalBytesAtStart: null, jsCriticalUrls: [],
      firstSpriteCardMs: null,
      firstSupabaseRequestStartMs: null, firstSupabaseResponseEndMs: null, firstSupabaseUrl: null,
      supabaseRequestCount: 0
    });

    // LCP: nos quedamos con la ultima entrada observada (la candidata mas reciente).
    try {
      const obsLcp = new PerformanceObserver((lista) => {
        const entradas = lista.getEntries();
        // Guardamos TODAS las candidatas: el hero rota cada 3.5 s y llegan tardias mas grandes,
        // asi que el ultimo lcpMs es inestable. lcpMs/lcpElement/lcpSize siguen siendo la ultima,
        // pero lcpCandidates da la linea de tiempo honesta. Dedupe por startTime porque
        // buffered:true puede reentregar entradas ya vistas.
        for (const entrada of entradas) {
          if (typeof entrada.startTime !== 'number' || lcpStartTimes.has(entrada.startTime)) continue;
          lcpStartTimes.add(entrada.startTime);
          estado.lcpCandidates.push({
            startTime: entrada.startTime,
            size: typeof entrada.size === 'number' ? entrada.size : null,
            element: describir(entrada.element)
          });
        }
        const ultima = entradas[entradas.length - 1];
        if (!ultima) return;
        estado.lcpMs = ultima.startTime;
        estado.lcpSize = typeof ultima.size === 'number' ? ultima.size : null;
        estado.lcpElement = describir(ultima.element);
      });
      obsLcp.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch { /* noop */ }

    // Tareas largas (> 50 ms): buffered:true entrega lo ya ocurrido; el Set evita duplicados.
    try {
      const obsLong = new PerformanceObserver((lista) => {
        for (const entrada of lista.getEntries()) {
          const clave = entrada.startTime + ':' + entrada.duration;
          if (clavesLongTask.has(clave)) continue;
          clavesLongTask.add(clave);
          if (entrada.duration > 50) {
            estado.longTasks.push({ startTime: entrada.startTime, duration: entrada.duration });
          }
        }
      });
      obsLong.observe({ type: 'longtask', buffered: true });
    } catch { /* noop */ }

    // Primera tarjeta del grid: MutationObserver sobre todo el documento, o marca inmediata si ya
    // existe una cuando se instala el observer.
    try {
      const marcar = () => {
        if (estado.firstSpriteCardMs === null) estado.firstSpriteCardMs = performance.now();
      };
      if (document.querySelector('.sprite-card')) {
        marcar();
      } else {
        const obsCartas = new MutationObserver(() => {
          if (document.querySelector('.sprite-card')) {
            marcar();
            obsCartas.disconnect();
          }
        });
        obsCartas.observe(document, { childList: true, subtree: true });
      }
    } catch { /* noop */ }

    // Supabase: sondeo periodico hasta la primera request cuyo name contenga 'supabase'.
    try {
      const buscarSupabase = () => {
        if (estado.firstSupabaseUrl !== null) return;
        const primera = primeraSupabase(recursos());
        if (primera) {
          estado.firstSupabaseUrl = primera.name;
          estado.firstSupabaseRequestStartMs = primera.startTime;
          estado.firstSupabaseResponseEndMs = primera.responseEnd;
        }
      };
      const intervalo = setInterval(() => {
        buscarSupabase();
        if (estado.firstSupabaseUrl !== null) clearInterval(intervalo);
      }, 50);
    } catch { /* noop */ }

    // Lector que el arnes llama al final de la corrida. Nunca tira: devuelve nulls/vacios.
    window.__startupMetrics = () => {
      try {
        const es = recursos();

        let lcpMs = estado.lcpMs;
        if (lcpMs === null) {
          try {
            const lcps = performance.getEntriesByType('largest-contentful-paint');
            if (lcps && lcps.length > 0) {
              const ultima = lcps[lcps.length - 1];
              lcpMs = ultima.startTime;
              estado.lcpSize = typeof ultima.size === 'number' ? ultima.size : estado.lcpSize;
              estado.lcpElement = describir(ultima.element) || estado.lcpElement;
            }
          } catch { /* noop */ }
        }

        let fcpMs = null;
        try {
          const fcp = performance.getEntriesByName('first-contentful-paint')[0];
          fcpMs = fcp ? fcp.startTime : null;
        } catch { /* noop */ }

        let ttfbMs = null;
        let domContentLoadedMs = null;
        let loadEventMs = null;
        try {
          const nav = performance.getEntriesByType('navigation')[0] || null;
          if (nav) {
            ttfbMs = nav.responseStart;
            domContentLoadedMs = nav.domContentLoadedEventEnd;
            loadEventMs = nav.loadEventEnd;
          }
        } catch { /* noop */ }

        const longTasks = estado.longTasks
          .slice()
          .sort((a, b) => a.startTime - b.startTime)
          .map((t) => ({ startTime: redondear(t.startTime), duration: redondear(t.duration) }));
        const longTaskTotalMs = estado.longTasks.reduce((acc, t) => acc + (Number(t.duration) || 0), 0);
        const longTaskMaxMs = estado.longTasks.reduce((acc, t) => Math.max(acc, Number(t.duration) || 0), 0);
        const longTasksTop5 = estado.longTasks
          .slice()
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 5)
          .map((t) => ({ startTime: redondear(t.startTime), duration: redondear(t.duration) }));

        // Scripts del camino critico: initiatorType 'script' o pathname .js/.mjs. transferSize es
        // 0 en aciertos de cache (y 0 tambien si el recurso fuese cross-origin sin Timing-Allow-
        // Origin; aqui todo es mismo origen, asi que 0 significa cache). Si no hubo LCP, los
        // totales de bytes del camino critico quedan en null.
        const scripts = es.filter((e) => e.initiatorType === 'script' || esRutaScript(e.name));
        const criticos = lcpMs === null ? [] : scripts.filter((e) => e.responseEnd <= lcpMs);
        const jsCriticalBytes = lcpMs === null
          ? null
          : criticos.reduce((acc, e) => acc + (Number(e.transferSize) || 0), 0);
        const jsCriticalBytesAtStart = lcpMs === null
          ? null
          : scripts.filter((e) => e.startTime <= lcpMs).reduce((acc, e) => acc + (Number(e.transferSize) || 0), 0);
        const jsCriticalUrls = criticos.map((e) => e.name);

        let firstSupabaseUrl = estado.firstSupabaseUrl;
        let firstSupabaseRequestStartMs = estado.firstSupabaseRequestStartMs;
        let firstSupabaseResponseEndMs = estado.firstSupabaseResponseEndMs;
        const supabaseEntradas = es.filter((e) => /supabase/i.test(e.name));
        if (firstSupabaseUrl === null && supabaseEntradas.length > 0) {
          const primera = primeraSupabase(supabaseEntradas);
          firstSupabaseUrl = primera.name;
          firstSupabaseRequestStartMs = primera.startTime;
          firstSupabaseResponseEndMs = primera.responseEnd;
        }

        return {
          lcpMs: redondear(lcpMs),
          lcpElement: estado.lcpElement,
          lcpSize: redondear(estado.lcpSize),
          lcpCandidates: estado.lcpCandidates.map((c) => ({
            startTime: redondear(c.startTime),
            size: redondear(c.size),
            element: c.element
          })),
          lcpInitialMs: estado.lcpCandidates.length > 0 ? redondear(estado.lcpCandidates[0].startTime) : null,
          lcpCandidatesCount: estado.lcpCandidates.length,
          fcpMs: redondear(fcpMs),
          ttfbMs: redondear(ttfbMs),
          domContentLoadedMs: redondear(domContentLoadedMs),
          loadEventMs: redondear(loadEventMs),
          longTaskCount: longTasks.length,
          longTaskTotalMs: redondear(longTaskTotalMs),
          longTaskMaxMs: redondear(longTaskMaxMs),
          longTasksTop5,
          jsCriticalBytes,
          jsCriticalBytesAtStart,
          jsCriticalUrls,
          firstSpriteCardMs: redondear(estado.firstSpriteCardMs),
          firstSupabaseRequestStartMs: redondear(firstSupabaseRequestStartMs),
          firstSupabaseResponseEndMs: redondear(firstSupabaseResponseEndMs),
          firstSupabaseUrl,
          supabaseRequestCount: supabaseEntradas.length
        };
      } catch {
        return vacio();
      }
    };
  });
}

async function runOnce(cfg, baseUrl, runIndex) {
  const userDataDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'scroll-cards-'));
  let browser = null;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir,
      defaultViewport: { ...VIEWPORT, deviceScaleFactor: 1 }
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // --- red/CPU ANTES del goto, o la primera navegacion sale sin throttle ---
    const client = typeof page.createCDPSession === 'function'
      ? await page.createCDPSession()
      : await page.target().createCDPSession();
    const statusByUrl = new Map();
    client.on('Network.responseReceived', ({ response }) => {
      if (response && response.url) statusByUrl.set(response.url, response.status);
    });
    await client.send('Network.enable');
    // --block-urls: bloqueo a nivel de red via CDP. Un import dinamico bloqueado rechaza y la app
    // lo traga en su try/catch, asi que el arnes no se detiene por eso.
    if (cfg.blockUrls.length > 0) {
      await client.send('Network.setBlockedURLs', { urls: cfg.blockUrls });
    }
    if (cfg.throttle) {
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: cfg.throttle.latency,
        downloadThroughput: cfg.throttle.downloadThroughput,
        uploadThroughput: cfg.throttle.uploadThroughput
      });
      await client.send('Emulation.setCPUThrottlingRate', { rate: cfg.throttle.cpuRate });
    }

    // Instrumentacion de arranque: se instala ANTES del goto para que los observers (LCP,
    // longtask, MutationObserver) existan antes de que corra el codigo de la app. Solo en el
    // escenario startup para no alterar las mediciones de scroll/idle.
    if (cfg.scenario === 'startup') {
      await installStartupInstrumentation(page);
    }

    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.waitForSelector('.sprites-grid .sprite-card');
    await new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

    // Espera a que la red quede quieta (sin nuevos recursos durante IDLE_QUIET_MS).
    const idleStart = Date.now();
    let idleCount = -1;
    let idleLastChange = Date.now();
    let idleTimedOut = false;
    for (;;) {
      const count = await page.evaluate(() => performance.getEntriesByType('resource').length);
      if (count !== idleCount) {
        idleCount = count;
        idleLastChange = Date.now();
      }
      const elapsed = Date.now() - idleStart;
      if (elapsed >= IDLE_MAX_MS) {
        idleTimedOut = true;
        break;
      }
      if (elapsed >= IDLE_MIN_MS && Date.now() - idleLastChange >= IDLE_QUIET_MS) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    const idleMs = Date.now() - idleStart;

    // Escenario startup: lee las metricas instrumentadas por evaluateOnNewDocument despues de la
    // espera de red (el lector vuelve a escanear Resource Timing y nunca tira). El resto de
    // escenarios deja startup en null para no cambiar el JSON existente.
    const startup = cfg.scenario === 'startup'
      ? await page.evaluate(() => (typeof window.__startupMetrics === 'function' ? window.__startupMetrics() : null))
      : null;

    // Fase de carga: todo lo pedido antes del primer paso. Ahi caen los 404 de la primera
    // pantalla, que si no se atribuirian a un paso de scroll que no los causo.
    const loadEndAt = await page.evaluate(() => performance.now());
    let load = null;
    if (cfg.logNetwork) {
      const raw = await page.evaluate((cut) => {
        const tarjetas = Array.from(document.querySelectorAll('.sprites-grid .sprite-card'));
        const enViewport = (card) => {
          const rect = card.getBoundingClientRect();
          return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
        };
        return {
          requests: performance.getEntriesByType('resource')
            .filter((entry) => entry.startTime < cut)
            .map((entry) => ({
              url: entry.name,
              status: typeof entry.responseStatus === 'number' ? entry.responseStatus : null,
              type: entry.initiatorType || null,
              startTime: Math.round(entry.startTime * 100) / 100,
              responseEnd: Math.round(entry.responseEnd * 100) / 100,
              transferSize: entry.transferSize,
              encodedBodySize: entry.encodedBodySize,
              duration: Math.round(entry.duration * 100) / 100
            })),
          // Indices de tarjeta dentro del viewport ahora (mismo orden que el DOM y que urls).
          inViewportIndices: tarjetas.map((card, i) => (enViewport(card) ? i : -1)).filter((i) => i !== -1),
          fallbackCardsAtLoad: tarjetas.filter((card) => {
            const img = card.querySelector('.card-image img:not(.card-image__crown)');
            return Boolean(img && img.dataset && img.dataset.triedBase === 'true');
          }).length
        };
      }, loadEndAt);
      const collageDeCarga = raw.requests.filter((r) => r.url.indexOf(COLLAGE_URL_MARK) !== -1);
      load = {
        ...enrichRequests(raw.requests, statusByUrl),
        // Cuanto del preload del export sale ANTES del primer paso. Si la precarga sigue viva
        // durante el scroll, esa parte cuenta en collageBytes por paso, no aqui.
        collageBytes: collageDeCarga.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0),
        collageRequests: collageDeCarga.length,
        transferBytes: raw.requests.reduce((acc, r) => acc + (Number(r.transferSize) || 0), 0),
        inViewportIndices: raw.inViewportIndices,
        fallbackCardsAtLoad: raw.fallbackCardsAtLoad
      };
    }

    const steps = [];
    let roundtrip = null;
    if (cfg.scrollMode === 'roundtrip') {
      roundtrip = enrichRoundtripWithNetwork(await measureRoundtrip(page, cfg, client), statusByUrl);
    } else {
      for (const offset of cfg.stepOffsets) {
        const step = await measureStep(page, {
          offset,
          scrollMode: cfg.scrollMode,
          stride: CONTINUOUS_STRIDE_PX,
          interval: CONTINUOUS_INTERVAL_MS,
          stepTimeoutMs: STEP_TIMEOUT_MS,
          logNetwork: cfg.logNetwork,
          debugRects: cfg.debugRects
        });
        steps.push(enrichStepWithNetwork(step, statusByUrl));
      }
    }

    // Union de los indices vistos en el viewport (carga + pasos): dice si lo calentado llego a
    // usarse o fue desperdicio.
    const everInViewport = new Set();
    if (load && Array.isArray(load.inViewportIndices)) {
      load.inViewportIndices.forEach((indice) => everInViewport.add(indice));
    }
    for (const step of steps) {
      if (Array.isArray(step.inViewportIndices)) step.inViewportIndices.forEach((indice) => everInViewport.add(indice));
    }
    if (roundtrip) {
      for (const fase of [roundtrip.down, roundtrip.up]) {
        if (fase && Array.isArray(fase.inViewportIndices)) {
          fase.inViewportIndices.forEach((indice) => everInViewport.add(indice));
        }
      }
    }
    const warm = await page.evaluate((everEnViewport) => {
      const log = Array.isArray(window.__spriteWarmLog) ? window.__spriteWarmLog : [];
      const vistos = new Set(everEnViewport);
      const entries = log.map((w) => {
        // El primer resource timing con ese nombre despues del destello es el del calentador;
        // la peticion de la tarjeta, si llega, es muy posterior.
        const r = performance.getEntriesByName(w.url).filter((e) => e.startTime >= w.t - 5)[0] || null;
        return { i: w.i, url: w.url, t: Math.round(w.t * 100) / 100, transferSize: r ? r.transferSize : null, visto: vistos.has(w.i) };
      });
      const desperdicio = entries.filter((e) => !e.visto);
      return {
        totalWarmed: entries.length,
        warmBytesTotal: entries.reduce((a, e) => a + (Number(e.transferSize) || 0), 0),
        warmWastedCount: desperdicio.length,
        warmWastedBytes: desperdicio.reduce((a, e) => a + (Number(e.transferSize) || 0), 0),
        entries
      };
    }, [...everInViewport]);

    const runTransferBytes = cfg.logNetwork
      ? (load ? (Number(load.transferBytes) || 0) : 0) +
        steps.reduce((acc, step) => acc + (Number(step.transferBytes) || 0), 0) +
        (roundtrip ? (Number(roundtrip.transferBytes) || 0) : 0)
      : null;

    // Escenario idle: sin scroll. Primero cuanto tarda en terminar el preload del export por si
    // solo; despues, cuanto tarda compartir en quedar listo (no arrancar collage nuevo).
    let idle = null;
    if (cfg.scenario === 'idle') {
      const visibilityState = await page.evaluate(() => document.visibilityState);
      const collage = await waitForCollageComplete(page, IDLE_COLLAGE_QUIET_MS, IDLE_COLLAGE_MAX_MS);
      const share = await measureShareReady(page, SHARE_QUIET_MS, SHARE_MAX_MS);
      idle = {
        visibilityState,
        collageCompleteMs: collage.collageCompleteMs,
        collageRequests: collage.collageRequests,
        collageCompleteTimedOut: collage.collageTimedOut,
        share
      };
    }

    return {
      run: runIndex,
      load,
      loadIdleMs: idleMs,
      loadIdleTimedOut: idleTimedOut,
      steps,
      roundtrip,
      idle,
      startup,
      warm,
      runTransferBytes
    };
  } finally {
    if (browser) await browser.close();
    await fs.promises.rm(userDataDir, { recursive: true, force: true });
  }
}

function median(values) {
  const nums = values.filter((v) => typeof v === 'number' && Number.isFinite(v)).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 === 0 ? (nums[mid - 1] + nums[mid]) / 2 : nums[mid];
}

function round(value) {
  return typeof value === 'number' ? Math.round(value * 100) / 100 : value;
}

function buildSummary(runs, cfg) {
  const perOffset = {};
  const loads = runs.map((run) => run.load).filter(Boolean);
  const loadUrls404 = [...new Set(loads.flatMap((entry) => entry.urls404 || []))].sort();
  for (const offset of cfg.stepOffsets) {
    const steps = runs.map((run) => run.steps.find((step) => step.offset === offset)).filter(Boolean);
    const m = (fn) => round(median(steps.map(fn)));
    const urls404 = [...new Set(steps.flatMap((step) => step.urls404 || []))].sort();
    perOffset[String(offset)] = {
      firstFrameBlank: m((step) => step.firstFrame && step.firstFrame.blank),
      firstFrameInViewport: m((step) => step.firstFrame && step.firstFrame.inViewport),
      framesSampled: m((step) => step.framesSampled),
      framesWithBlank: m((step) => step.framesWithBlank),
      blankFrameRatio: m((step) => step.blankFrameRatio),
      msToFirstArtVisible: m((step) => step.msToFirstArtVisible),
      msToAllComplete: m((step) => step.msToAllComplete),
      msToAllCompleteFromTarget: m((step) => step.msToAllCompleteFromTarget),
      blankFramesAfterArrival: m((step) => step.blankFramesAfterArrival),
      framesAfterArrival: m((step) => step.framesAfterArrival),
      blankFrameRatioAfterArrival: m((step) => step.blankFrameRatioAfterArrival),
      msToAllDecoded: m((step) => step.msToAllDecoded),
      imagesNotLoadedAtEnd: m((step) => step.imagesNotLoadedAtEnd),
      inViewportAtEnd: m((step) => step.inViewportAtEnd),
      count404: cfg.logNetwork ? m((step) => step.count404) : null,
      collageBytes: cfg.logNetwork ? m((step) => step.collageBytes) : null,
      collageRequests: cfg.logNetwork ? m((step) => step.collageRequests) : null,
      urls404Unique: cfg.logNetwork ? urls404 : null,
      urls404UniqueCount: cfg.logNetwork ? urls404.length : null,
      basicFallbacks: m((step) => step.basicFallbacks),
      basicFallbacksInViewport: m((step) => step.basicFallbacksInViewport),
      warmerBytes: cfg.logNetwork ? m((step) => step.warmerBytes) : null,
      warmerRequests: cfg.logNetwork ? m((step) => step.warmerRequests) : null,
      warmerCacheHits: cfg.logNetwork ? m((step) => step.warmerCacheHits) : null,
      warmedDuringStep: cfg.logNetwork ? m((step) => step.warmedDuringStep) : null,
      cacheHits: cfg.logNetwork ? m((step) => step.cacheHits) : null,
      transferBytes: cfg.logNetwork ? m((step) => step.transferBytes) : null,
      slowest3: cfg.logNetwork ? (steps[0] ? steps[0].slowest3 : null) : null,
      runsWithTimeout: steps.filter((step) => step.timedOut).length
    };
  }

  // Resumen del calentador: cuanto arte se calento por delante y cuanto nunca llego al viewport.
  const warmRuns = runs.map((run) => run.warm).filter(Boolean);
  const warmWastedUrls = [...new Set(warmRuns.flatMap(
    (entry) => (entry.entries || []).filter((e) => !e.visto).map((e) => e.url)
  ))].sort();
  const warm = warmRuns.length > 0
    ? {
        totalWarmed: round(median(warmRuns.map((entry) => entry.totalWarmed))),
        warmBytesTotal: round(median(warmRuns.map((entry) => entry.warmBytesTotal))),
        warmWastedCount: round(median(warmRuns.map((entry) => entry.warmWastedCount))),
        warmWastedBytes: round(median(warmRuns.map((entry) => entry.warmWastedBytes))),
        warmWastedUrls
      }
    : null;

  // Transferencia agregada (solo tiene sentido con --log-network).
  const totals = cfg.logNetwork && loads.length > 0
    ? {
        loadTransferBytes: round(median(loads.map((entry) => entry.transferBytes))),
        stepsTransferBytes: round(median(runs.map(
          (run) => run.steps.reduce((acc, step) => acc + (Number(step.transferBytes) || 0), 0)
        ))),
        runTransferBytes: round(median(runs.map((run) => run.runTransferBytes)))
      }
    : null;

  return {
    config: {
      dir: cfg.dir,
      throttle: cfg.throttleName,
      throttleParams: cfg.throttle,
      scrollMode: cfg.scrollMode,
      scenario: cfg.scenario,
      continuous: { stridePx: CONTINUOUS_STRIDE_PX, intervalMs: CONTINUOUS_INTERVAL_MS },
      logNetwork: cfg.logNetwork,
      blockUrls: cfg.blockUrls,
      offsets: cfg.offsets,
      stepOffsets: cfg.stepOffsets,
      runs: runs.length,
      viewport: { ...VIEWPORT, deviceScaleFactor: 1 }
    },
    load: cfg.logNetwork && loads.length > 0
      ? {
          totalRequests: round(median(loads.map((entry) => entry.requests.length))),
          count404: round(median(loads.map((entry) => entry.count404))),
          collageBytes: round(median(loads.map((entry) => entry.collageBytes))),
          collageRequests: round(median(loads.map((entry) => entry.collageRequests))),
          urls404Unique: loadUrls404,
          urls404UniqueCount: loadUrls404.length,
          fallbackCardsAtLoad: round(median(loads.map((entry) => entry.fallbackCardsAtLoad))),
          transferBytes: round(median(loads.map((entry) => entry.transferBytes))),
          slowest3: loads[0].slowest3
        }
      : null,
    perOffset,
    idle: runs.some((run) => run.idle) ? buildIdleSummary(runs) : null,
    startup: runs.some((run) => run.startup) ? buildStartupSummary(runs) : null,
    roundtrip: cfg.scrollMode === 'roundtrip' ? buildRoundtripSummary(runs) : null,
    warm,
    totals
  };
}

function buildIdleSummary(runs) {
  const entries = runs.map((run) => run.idle).filter(Boolean);
  const conShare = entries.filter((entry) => entry.share && entry.share.available);
  return {
    visibilityState: entries[0].visibilityState,
    collageCompleteMs: round(median(entries.map((entry) => entry.collageCompleteMs))),
    collageRequests: round(median(entries.map((entry) => entry.collageRequests))),
    collageCompleteTimedOut: entries.filter((entry) => entry.collageCompleteTimedOut).length,
    shareAvailable: conShare.length === entries.length && entries.length > 0,
    shareSelector: conShare.length > 0 ? conShare[0].share.selector : null,
    shareMatchedName: conShare.length > 0 ? conShare[0].share.matchedName : null,
    shareCandidatesTried: entries[0].share ? entries[0].share.candidates : null,
    shareReadyMs: conShare.length > 0 ? round(median(conShare.map((entry) => entry.share.shareReadyMs))) : null,
    shareTimedOut: conShare.filter((entry) => entry.share.shareTimedOut).length,
    collageRequestsBeforeShare: round(median(entries.map((entry) => entry.share.collageRequestsBefore))),
    collageRequestsAfterShare: round(median(entries.map((entry) => entry.share.collageRequestsAfter)))
  };
}

// Resumen del escenario startup: medianas por metrica sobre las corridas con datos. lcpElement,
// lcpCandidates, longTasksTop5 y firstSupabaseUrl son de la primera corrida (no tienen mediana
// util); el resto se agrega con median sobre los run.startup presentes.
function buildStartupSummary(runs) {
  const entradas = runs.map((run) => run.startup).filter(Boolean);
  const m = (fn) => round(median(entradas.map(fn)));
  const jsCriticalUrls = [...new Set(entradas.flatMap((e) => e.jsCriticalUrls || []))].sort();
  return {
    lcpMs: m((e) => e.lcpMs),
    lcpElement: entradas[0].lcpElement,
    lcpSize: m((e) => e.lcpSize),
    lcpInitialMs: m((e) => e.lcpInitialMs),
    lcpCandidatesCount: m((e) => e.lcpCandidatesCount),
    lcpCandidates: entradas[0].lcpCandidates,
    fcpMs: m((e) => e.fcpMs),
    ttfbMs: m((e) => e.ttfbMs),
    domContentLoadedMs: m((e) => e.domContentLoadedMs),
    loadEventMs: m((e) => e.loadEventMs),
    longTaskCount: m((e) => e.longTaskCount),
    longTaskTotalMs: m((e) => e.longTaskTotalMs),
    longTaskMaxMs: m((e) => e.longTaskMaxMs),
    longTasksTop5: entradas[0].longTasksTop5,
    jsCriticalBytes: m((e) => e.jsCriticalBytes),
    jsCriticalBytesAtStart: m((e) => e.jsCriticalBytesAtStart),
    jsCriticalUrls,
    jsCriticalUrlsCount: jsCriticalUrls.length,
    firstSpriteCardMs: m((e) => e.firstSpriteCardMs),
    firstSupabaseRequestStartMs: m((e) => e.firstSupabaseRequestStartMs),
    firstSupabaseResponseEndMs: m((e) => e.firstSupabaseResponseEndMs),
    firstSupabaseUrl: entradas[0].firstSupabaseUrl,
    supabaseRequestCount: m((e) => e.supabaseRequestCount),
    runs: entradas.length
  };
}

function fmtMs(value) {
  return value === null || value === undefined ? 'null' : round(value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const cfg = {
    dir: args.dir,
    offsets: args.offsets,
    stepOffsets: args.scenario === 'scroll' && args.scrollMode !== 'roundtrip' ? args.offsets : [],
    roundtripMax: args.roundtripMax,
    artifactSamples: args.artifactSamples,
    scrollMode: args.scrollMode,
    scenario: args.scenario,
    logNetwork: args.logNetwork,
    debugRects: args.debugRects,
    blockUrls: args.blockUrls,
    throttleName: args.throttle,
    throttle: THROTTLES[args.throttle]
  };
  let server = null;
  let baseUrl = args.url;
  try {
    if (!baseUrl) {
      if (!fs.existsSync(path.join(cfg.dir, 'index.html'))) {
        throw new Error('No existe ' + path.join(cfg.dir, 'index.html') + ': corre "npx vite build" primero.');
      }
      const started = await createStaticServer(cfg.dir);
      server = started.server;
      baseUrl = 'http://127.0.0.1:' + started.port + '/';
    }
    console.log(
      '[measure] dir=' + cfg.dir + ' throttle=' + cfg.throttleName + ' scroll=' + cfg.scrollMode +
      ' logNetwork=' + cfg.logNetwork + ' runs=' + args.runs +
      ' scenario=' + cfg.scenario +
      (cfg.blockUrls.length > 0 ? ' blockUrls=' + cfg.blockUrls.join(',') : '') +
      ' offsets=' + cfg.offsets.join(',') + ' viewport=' + VIEWPORT.width + 'x' + VIEWPORT.height
    );
    if (cfg.throttleName !== 'none') {
      console.log(
        '[measure] throttle sintetico ' + cfg.throttleName + ': latency=' + cfg.throttle.latency + 'ms' +
        ' down=' + round(cfg.throttle.downloadThroughput / 125000) + 'Mbps' +
        ' up=' + round(cfg.throttle.uploadThroughput / 125000) + 'Mbps cpu=' + cfg.throttle.cpuRate + 'x' +
        ' (perfil inventado, no es una red real)'
      );
    }

    const runs = [];
    for (let i = 1; i <= args.runs; i += 1) {
      const result = await runOnce(cfg, baseUrl, i);
      runs.push(result);
      if (result.load) {
        console.log(
          '  run ' + i + ' LOAD: requests=' + result.load.requests.length +
          ' count404=' + result.load.count404 +
          ' (uniq=' + result.load.urls404.length + ')' +
          ' fallbackCards=' + result.load.fallbackCardsAtLoad +
          ' idleMs=' + result.loadIdleMs + (result.loadIdleTimedOut ? ' (IDLE_TIMEOUT)' : '')
        );
      }
      if (result.startup) {
        console.log(
          '  run ' + i + ' STARTUP: lcpMs=' + fmtMs(result.startup.lcpMs) +
          ' fcpMs=' + fmtMs(result.startup.fcpMs) +
          ' ttfbMs=' + fmtMs(result.startup.ttfbMs) +
          ' dclMs=' + fmtMs(result.startup.domContentLoadedMs) +
          ' loadMs=' + fmtMs(result.startup.loadEventMs) +
          ' firstSpriteCardMs=' + fmtMs(result.startup.firstSpriteCardMs) +
          ' longTasks=' + result.startup.longTaskCount +
          ' longTaskMaxMs=' + fmtMs(result.startup.longTaskMaxMs) +
          ' jsCriticalBytes=' + (result.startup.jsCriticalBytes === null ? 'null' : result.startup.jsCriticalBytes)
        );
      }
      for (const step of result.steps) {
        console.log(
          '  run ' + i + ' off ' + step.offset +
          ': firstBlank=' + (step.firstFrame ? step.firstFrame.blank : '?') + '/' + (step.firstFrame ? step.firstFrame.inViewport : '?') +
          ' blankFrames=' + step.framesWithBlank + '/' + step.framesSampled +
          ' msFirstArt=' + fmtMs(step.msToFirstArtVisible) +
          ' msFromTarget=' + fmtMs(step.msToAllCompleteFromTarget) +
          ' notLoadedEnd=' + step.imagesNotLoadedAtEnd +
          ' 404=' + (step.count404 === undefined ? '-' : step.count404) +
          ' collageBytes=' + (step.collageBytes === undefined ? '-' : step.collageBytes) +
          ' basic=' + step.basicFallbacks +
          ' msDecoded=' + fmtMs(step.msToAllDecoded) +
          ' timedOut=' + step.timedOut +
          ' scroll=' + Math.round(step.scrollTopBefore) + '->' + Math.round(step.scrollTopAfter)
        );
        if (args.debugRects && step.firstFrameDebug) {
          console.log('    rects: ' + step.firstFrameDebug
            .map((c) => c.i + ':t' + c.top + ' h' + c.h + ' w' + c.w + ' offH' + c.offH + (c.ready ? ' R' : ' -'))
            .join(' | '));
        }
      }
      if (result.roundtrip) {
        const rt = result.roundtrip;
        console.log(
          '  run ' + i + ' ROUNDTRIP: targetY=' + rt.targetY + ' maxScrollY=' + rt.maxScrollY +
          ' refsLearned=' + rt.refsLearned
        );
        for (const fase of [rt.down, rt.up]) {
          console.log(
            '    ' + fase.phase + ' y' + fase.fromY + '->' + fase.toY +
            ': artifactFrames=' + fase.artifactFrames + '/' + fase.framesSampled +
            ' blankFrames=' + fase.blankFrames + '/' + fase.framesSampled +
            ' artifactCards=' + fase.artifactCardsTotal
          );
        }
        console.log(
          '    control(asentado): artifactFrames=' + (rt.control.isArtifactFrame ? 1 : 0) + '/1' +
          ' artifactCards=' + rt.control.artifactCards +
          ' flatBg=' + rt.control.flatBgReady +
          ' ambiguous=' + rt.control.ambiguousReady +
          ' inViewport=' + rt.control.inViewportCards
        );
        if (rt.cpu) {
          console.log(
            '    cpu: gestureMs=' + rt.cpu.gestureMs + ' scrollPx=' + rt.cpu.scrollPx +
            ' taskMs=' + rt.cpu.perf.taskMs + ' (' + (rt.cpu.perSecond ? rt.cpu.perSecond.taskMs : '?') + '/s)' +
            ' scriptMs=' + rt.cpu.perf.scriptMs + ' (' + (rt.cpu.perSecond ? rt.cpu.perSecond.scriptMs : '?') + '/s)' +
            ' layoutMs=' + rt.cpu.perf.layoutMs + ' recalcStyleMs=' + rt.cpu.perf.recalcStyleMs +
            ' layoutCount=' + rt.cpu.layoutCount + ' recalcStyleCount=' + rt.cpu.recalcStyleCount
          );
          console.log(
            '    longTasks: down=' + rt.cpu.longTasks.down.count + '/' + rt.cpu.longTasks.down.totalMs + 'ms' +
            ' up=' + rt.cpu.longTasks.up.count + '/' + rt.cpu.longTasks.up.totalMs + 'ms' +
            ' layers=' + (rt.cpu.layers.supported ? rt.cpu.layers.count : 'n/d')
          );
        }
        for (const fase of [rt.down, rt.up]) {
          const capturas = fase.positions.map((p) => p.captures);
          console.log(
            '    ' + fase.phase + ' latenciaPintado: capturasPorPosicion=' + JSON.stringify(capturas) +
            ' max=' + Math.max(...capturas) +
            ' sinDespejar=' + fase.positions.filter((p) => !p.cleared).length
          );
        }
      }
    }

    const summary = buildSummary(runs, cfg);
    if (summary.load) {
      console.log(
        '[measure] fase de carga (antes del primer paso): requests=' + summary.load.totalRequests +
        ' count404=' + summary.load.count404 + ' (uniq=' + summary.load.urls404UniqueCount + ')' +
        ' collageBytes=' + summary.load.collageBytes + ' (' + summary.load.collageRequests + ' reqs)' +
        ' fallbackCards=' + summary.load.fallbackCardsAtLoad +
        ' transferBytes=' + summary.load.transferBytes
      );
      if (summary.load.urls404Unique.length > 0) {
        console.log('    urls404@load: ' + summary.load.urls404Unique.join(' '));
      }
      if (summary.load.slowest3) {
        console.log('    slowest3@load: ' + summary.load.slowest3.map((s) => s.url + ' ' + s.ms + 'ms(' + s.status + ')').join(', '));
      }
    }
    if (summary.idle) {
      console.log(
        '[measure] escenario idle: visibilityState=' + summary.idle.visibilityState +
        ' collageCompleteMs=' + summary.idle.collageCompleteMs +
        ' collageRequests=' + summary.idle.collageRequests +
        ' collageTimedOut=' + summary.idle.collageCompleteTimedOut
      );
      if (summary.idle.shareAvailable) {
        console.log(
          '    shareReadyMs=' + summary.idle.shareReadyMs +
          ' selector=' + summary.idle.shareSelector +
          ' nombreAccesible="' + summary.idle.shareMatchedName + '"' +
          ' collageReqAntes=' + summary.idle.collageRequestsBeforeShare +
          ' despues=' + summary.idle.collageRequestsAfterShare +
          ' shareTimedOut=' + summary.idle.shareTimedOut
        );
      } else {
        console.log(
          '    shareReadyMs NO DISPONIBLE: ningun control con nombre accesible /compartir|share/i.' +
          ' candidatos=' + JSON.stringify(summary.idle.shareCandidatesTried) +
          ' collageReqAntes=' + summary.idle.collageRequestsBeforeShare +
          ' despues=' + summary.idle.collageRequestsAfterShare +
          ' (usa collageCompleteMs como guardarrail alternativo)'
        );
      }
    }
    if (summary.startup) {
      console.log(
        '[measure] startup: lcpMs=' + summary.startup.lcpMs +
        ' lcpElement=' + (summary.startup.lcpElement === null ? 'null' : summary.startup.lcpElement) +
        ' lcpSize=' + summary.startup.lcpSize +
        ' lcpInitialMs=' + summary.startup.lcpInitialMs +
        ' lcpCandidates=' + summary.startup.lcpCandidatesCount +
        ' fcpMs=' + summary.startup.fcpMs +
        ' ttfbMs=' + summary.startup.ttfbMs +
        ' dclMs=' + summary.startup.domContentLoadedMs +
        ' loadMs=' + summary.startup.loadEventMs +
        ' firstSpriteCardMs=' + summary.startup.firstSpriteCardMs +
        ' longTasks=' + summary.startup.longTaskCount +
        ' longTaskTotalMs=' + summary.startup.longTaskTotalMs +
        ' longTaskMaxMs=' + summary.startup.longTaskMaxMs +
        ' jsCriticalBytes=' + summary.startup.jsCriticalBytes +
        ' jsCriticalBytesAtStart=' + summary.startup.jsCriticalBytesAtStart +
        ' supabaseReq=' + summary.startup.supabaseRequestCount +
        ' firstSupabaseStartMs=' + summary.startup.firstSupabaseRequestStartMs +
        ' firstSupabaseEndMs=' + summary.startup.firstSupabaseResponseEndMs
      );
      console.log(
        '    jsCriticalUrls@startup: ' +
        (summary.startup.jsCriticalUrls.length > 0 ? summary.startup.jsCriticalUrls.join(' ') : '(ninguna)')
      );
    }
    if (cfg.stepOffsets.length > 0) console.log('[measure] medianas por offset:');
    for (const offset of cfg.stepOffsets) {
      const entry = summary.perOffset[String(offset)];
      console.log(
        '  off ' + offset +
        ': firstBlank=' + entry.firstFrameBlank +
        ' blankFrames=' + entry.framesWithBlank + '/' + entry.framesSampled + ' (ratio=' + entry.blankFrameRatio + ')' +
        ' msFirstArt=' + entry.msToFirstArtVisible +
        ' msFromTarget=' + entry.msToAllCompleteFromTarget +
        ' blankAfterArrival=' + entry.blankFramesAfterArrival + '/' + entry.framesAfterArrival + ' (ratio=' + entry.blankFrameRatioAfterArrival + ')' +
        ' notLoadedEnd=' + entry.imagesNotLoadedAtEnd +
        ' 404=' + entry.count404 + ' (uniq=' + entry.urls404UniqueCount + ')' +
        ' collageBytes=' + entry.collageBytes +
        ' basic=' + entry.basicFallbacks + ' (inView=' + entry.basicFallbacksInViewport + ')' +
        ' msDecoded=' + entry.msToAllDecoded +
        ' timeouts=' + entry.runsWithTimeout +
        ' warmerBytes=' + entry.warmerBytes +
        ' cacheHits=' + entry.cacheHits +
        ' warmed=' + entry.warmedDuringStep +
        ' bytes=' + entry.transferBytes
      );
      if (cfg.logNetwork && entry.urls404Unique && entry.urls404Unique.length > 0) {
        console.log('    urls404@' + offset + ': ' + entry.urls404Unique.join(' '));
      }
      if (cfg.logNetwork && entry.slowest3) {
        console.log('    slowest3@' + offset + ': ' + entry.slowest3.map((s) => s.url + ' ' + s.ms + 'ms(' + s.status + ')').join(', '));
      }
    }

    if (summary.warm) {
      console.log(
        '[measure] calentador: totalWarmed=' + summary.warm.totalWarmed +
        ' warmBytesTotal=' + summary.warm.warmBytesTotal +
        ' warmWastedCount=' + summary.warm.warmWastedCount +
        ' warmWastedBytes=' + summary.warm.warmWastedBytes
      );
    }
    if (summary.totals) {
      console.log(
        '[measure] totales: loadTransferBytes=' + summary.totals.loadTransferBytes +
        ' stepsTransferBytes=' + summary.totals.stepsTransferBytes +
        ' runTransferBytes=' + summary.totals.runTransferBytes
      );
    }

    if (summary.roundtrip) {
      const rt = summary.roundtrip;
      console.log(
        '[measure] roundtrip: targetY=' + rt.targetY + ' (maxScrollY=' + rt.maxScrollY + ')' +
        ' stride=' + rt.stridePx + 'px cada ' + rt.intervalMs + 'ms' +
        ' refsLearned=' + rt.refsLearned +
        ' count404=' + rt.count404 + ' collageBytes=' + rt.collageBytes +
        ' transferBytes=' + rt.transferBytes
      );
      for (const fase of [rt.down, rt.up]) {
        console.log(
          '    ' + fase.phase + ': artifactFrames=' + fase.artifactFrames + '/' + fase.framesSampled +
          ' (ratio=' + fase.artifactFrameRatio + ')' +
          ' blankFrames=' + fase.blankFrames + '/' + fase.framesSampled +
          ' (ratio=' + fase.blankFrameRatio + ')' +
          ' artifactCards=' + fase.artifactCardsTotal +
          ' porCorrida=' + JSON.stringify(fase.perRun)
        );
      }
      console.log(
        '    control(asentado): artifactFrames=' + rt.control.artifactFrames + '/' + rt.control.framesSampled +
        ' (falsos positivos) artifactCards=' + rt.control.artifactCards +
        ' flatBg=' + rt.control.flatBgReady + ' ambiguous=' + rt.control.ambiguousReady +
        ' inViewport=' + rt.control.inViewportCards
      );
      for (const fase of [rt.down, rt.up]) {
        const lat = fase.paintLatency;
        if (lat) {
          console.log(
            '    ' + fase.phase + ' latenciaPintado: median=' + lat.median + ' p90=' + lat.p90 +
            ' max=' + lat.max + ' posiciones=' + lat.positions +
            ' sinDespejar=' + lat.notCleared + ' histograma=' + JSON.stringify(lat.histogram)
          );
        }
      }
      if (rt.cpu) {
        console.log(
          '[measure] cpu del gesto: gestureMs=' + rt.cpu.gestureMs + ' scrollPx=' + rt.cpu.scrollPx +
          ' taskMs=' + rt.cpu.perf.taskMs + ' (' + rt.cpu.perSecond.taskMs + '/s)' +
          ' scriptMs=' + rt.cpu.perf.scriptMs + ' (' + rt.cpu.perSecond.scriptMs + '/s)' +
          ' layoutMs=' + rt.cpu.perf.layoutMs + ' (' + rt.cpu.perSecond.layoutMs + '/s)' +
          ' recalcStyleMs=' + rt.cpu.perf.recalcStyleMs + ' (' + rt.cpu.perSecond.recalcStyleMs + '/s)'
        );
        console.log(
          '[measure] cpu del gesto (long tasks y capas): down=' + rt.cpu.longTasksDown.count + '/' + rt.cpu.longTasksDown.totalMs + 'ms' +
          ' up=' + rt.cpu.longTasksUp.count + '/' + rt.cpu.longTasksUp.totalMs + 'ms' +
          ' layoutCount=' + rt.cpu.layoutCount + ' recalcStyleCount=' + rt.cpu.recalcStyleCount +
          ' layers=' + (rt.cpu.layersSupported ? rt.cpu.layerCount : 'n/d') +
          ' artifactSamples=' + rt.artifactSamples +
          ' porCorrida=' + JSON.stringify(rt.cpu.perRun)
        );
      }
    }

    if (args.out) {
      await fs.promises.mkdir(path.dirname(path.resolve(args.out)), { recursive: true });
      await fs.promises.writeFile(path.resolve(args.out), JSON.stringify({ runs, summary }, null, 2) + '\n');
      console.log('[measure] JSON crudo en ' + path.resolve(args.out));
    }
  } finally {
    if (server) await new Promise((resolve) => server.close(resolve));
  }
}

main().catch((err) => {
  console.error('[measure] ERROR: ' + ((err && err.stack) || err));
  process.exitCode = 1;
});
