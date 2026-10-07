// HTML5 Canvas Exporter for Social Media - Estilo Oficial GLITCH / OVERRIDE
// Inspirado en el diseño 'CHAPTER 7 | SEASON 4: OVERRIDE' de Fortnite
// Extension explicita: Vite resuelve igual, y asi el modulo tambien carga en Node
// (el runner de pruebas nativo no completa extensiones).
import { generateQRMatrix } from './qrGenerator.js';
import { t } from '../i18n/texto.js';
import { pickName } from './spriteName.js';
import { rutaAssetEspiritu } from './spriteAssets.js';
import { isFortnitemaresActive } from '../config/seasonalEvent.js';

// Caché en memoria de matriz QR para evitar recalcular polinomios en cada exportación
let cachedQRMatrix = null;
function getCachedQR(url) {
  if (!cachedQRMatrix) {
    cachedQRMatrix = generateQRMatrix(url);
  }
  return cachedQRMatrix;
}

// Dominio del QR de la captura. Se usa el dominio donde esta el usuario para que el QR
// apunte siempre a algo vivo (hoy el viejo, mañana spritedex.gg, sin romper nada durante
// la migracion) y solo se cae al canonico cuando el origen no es publico: local, tunel de
// desarrollo o preview de Vercel.
const DOMINIO_CANONICO = 'https://spritedex.gg/';
const ORIGENES_PUBLICOS = [
  'https://spritedex.gg',
  'https://www.spritedex.gg',
  'https://spritedex-two.vercel.app'
];
export function dominioParaCompartir() {
  try {
    const origen = window.location.origin;
    if (ORIGENES_PUBLICOS.includes(origen)) return origen + '/';
  } catch {}
  return DOMINIO_CANONICO;
}

/**
 * Texto que codifica el QR del pie: SOLO el dominio pelado ('spritedex.gg'), sin esquema,
 * sin barra final y sin 'www.'. La URL completa costaba 20 caracteres (version 2, 25
 * modulos); el dominio pelado son 12 (version 1, 21 modulos): 4 modulos menos de lado con el
 * mismo EC M. La leyenda del pie sigue mostrando el dominio con su esquema.
 */
export function textoParaQR(url = dominioParaCompartir()) {
  try {
    return new URL(url).host.replace(/^www[.]/, '');
  } catch {
    return DOMINIO_CANONICO.replace(/^https?:[/]{2}/, '').replace(/[/].*$/, '').replace(/^www[.]/, '');
  }
}

/**
 * Fondo de la plantilla de compartir. En temporada la captura sale con el arte de
 * Fortnitemares; el resto del ano usa el de siempre. Si el de temporada no cargara, la
 * captura se hace igual con el de siempre: la plantilla nunca se queda sin fondo.
 */
export function rutaFondoPlantilla() {
  return isFortnitemaresActive() ? '/bac_mares.webp' : '/background.webp';
}

// Renderiza un código QR moderno con estilo de puntos/círculos y acentos cibernéticos (100% escaneable)
function drawModernDotQR(ctx, qrX, qrY, qrSize, url = dominioParaCompartir()) {
  try {
    const qr = getCachedQR(url);
    const count = qr.getModuleCount();
    const cellSize = qrSize / count;

    // 1. Dibuja los 3 patrones de detección de posición con geometría ISO estándar para
    // reconocimiento instantáneo de cámara, pero con las esquinas redondeadas: mismo
    // ratio 1:1:3:1:1 (el que leen los escáneres), acabado moderno.
    const drawFinderPattern = (startX, startY) => {
      const lado = 7 * cellSize;
      // Anillo exterior 7x7 en cian neón
      ctx.fillStyle = '#00F0E8';
      roundRect(ctx, startX, startY, lado, lado, cellSize * 1.6);
      ctx.fill();
      // Espacio intermedio 5x5 oscuro
      ctx.fillStyle = '#060a14';
      roundRect(ctx, startX + cellSize, startY + cellSize, 5 * cellSize, 5 * cellSize, cellSize * 1.1);
      ctx.fill();
      // Núcleo central 3x3 en cian neón
      ctx.fillStyle = '#00F0E8';
      roundRect(ctx, startX + 2 * cellSize, startY + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 0.7);
      ctx.fill();
    };

    drawFinderPattern(qrX, qrY); // Superior izquierdo
    drawFinderPattern(qrX + (count - 7) * cellSize, qrY); // Superior derecho
    drawFinderPattern(qrX, qrY + (count - 7) * cellSize); // Inferior izquierdo

    // 2. Dibuja todos los módulos de datos como puntos circulares de alto contraste en un solo pase
    const dotRadius = cellSize * 0.46;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();

    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) {
        // Excluye las 3 áreas de los patrones de posición (7x7 en cada esquina)
        const isFinder =
          (r < 7 && c < 7) ||
          (r < 7 && c >= count - 7) ||
          (r >= count - 7 && c < 7);

        if (isFinder) continue;

        if (qr.isDark(r, c)) {
          const centerX = qrX + c * cellSize + cellSize / 2;
          const centerY = qrY + r * cellSize + cellSize / 2;

          ctx.moveTo(centerX + dotRadius, centerY);
          ctx.arc(centerX, centerY, dotRadius, 0, Math.PI * 2);
        }
      }
    }
    ctx.fill();
  } catch (err) {
    console.warn('Error rendering modern dot QR on canvas:', err);
  }
}

// Caché global en memoria para acelerar la generación instantánea de imágenes
const globalImageCache = new Map();

// Caché global persistente de plantillas renderizadas para carga 0ms instantánea
export const globalCanvasCache = new Map();

// Contrato del export por defecto. Lo comparten la modal y el precalculo en reposo de
// App.jsx: si van como texto suelto en cada sitio, cambiar uno deja al otro sin acertar
// la cache en silencio (no falla, solo vuelve a ir lento).
export const DEFAULT_EXPORT_FORMAT = 'checklist';
export const DEFAULT_EXPORT_BG_STYLE = 'glitch_override';

// Clave canónica unificada para caché de plantillas de canvas (0ms instantáneo y sin colisiones entre filtros)
export function getCanvasCacheKey(format = DEFAULT_EXPORT_FORMAT, bgStyle = DEFAULT_EXPORT_BG_STYLE, count = 0, ownedCount = 0, spritesList = [], userState = {}, usuario = '', alcance = 'all', generalOwned = null, generalTotal = null) {
  let hash = 0;
  if (Array.isArray(spritesList) && spritesList.length > 0) {
    for (let i = 0; i < spritesList.length; i++) {
      const s = spritesList[i];
      const id = s?.id || '';
      const st = userState ? userState[id] : null;
      const stateBit = st?.owned ? (st?.level || 1) : 0;
      const str = `${id}:${stateBit};`;
      for (let j = 0; j < str.length; j++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(j);
        hash |= 0;
      }
    }
  }
  // v12: la captura pasa de PNG a JPEG, asi que las guardadas antes no se reutilizan.
  // v35: el vertical encoge el lienzo a lo que ocupa el contenido; las capturas guardadas
  // en memoria con el dibujo anterior no deben reutilizarse.
  // v36: el vertical tambien recorta el ancho del lienzo (tope de ancho de celda), asi que
  // las capturas guardadas en memoria con el dibujo anterior tampoco valen.
  // v43: el encabezado de temporada gana prologo de marca, halo del logo y capsula con
  // filo; las capturas guardadas con el encabezado anterior no valen.
  // v45: fuera el prologo de marca; la capsula pasa a "SPRITEDEX • SOBREVIVE A LA NOCHE".
  // v46: el QR deja el panel de tarjeta y estrena esquinas HUD + halo de escaneo.
  // v48: el nombre se ajusta de verdad a su banda: crece hasta llenarla, se reparte en
  // dos lineas solo cuando eso lo agranda y se centra con metricas reales de la fuente.
  // v49: el espiritu que falta se pinta apagado (sin color y en penumbra).
  // v50: el pie pasa a firma grande a la izquierda + marca a la derecha; las capturas
  // v49 guardadas con el pie anterior no valen.
  // v51: fuera la insignia de prueba del pie (v50 quedo quemada por dos dibujos): las
  // capturas guardadas con la insignia no valen.
  // v52: firma y marca del pie comparten tamano; las capturas v51 con la marca pequena
  // no valen.
  // v53: mas aire alrededor del pie; las capturas v52 no valen.
  // v54: mas aire entre la cuadricula y el pie; las capturas v53 no valen.
  // v55: firma y marca del pie 2 px mas pequenas; las capturas v54 no valen.
  // v56: los nombres de las fichas comparten una sola talla por lona.
  // v57: el reparto del nombre prefiere un corte que ENTRE cuando la linea unica se queda
  // en el suelo desbordando.
  // v58: el nombre de las fichas va SIEMPRE en blanco pleno (antes los faltantes al 86%);
  // las capturas v57 (y anteriores) no valen.
  // v59: el QR deja su celda de la cuadricula y baja al pie, a la esquina donde estaba el
  // hashtag (que ya no se dibuja); la cuadricula se llena solo con espiritus.
  // v60: el QR del pie se dimensiona por regla (objetivo de diseno con piso escaneable y
  // techo) y la banda del pie se deriva de ese bloque.
  // v61: el tamano del QR se deriva del ANCHO DE FICHA (cellW) y no del lienzo, para que
  // acompane a la cuadricula; las capturas v60 (QR medido contra el ancho de diseno y
  // desproporcionado en las cuadriculas densas) no valen.
  // v62: con pocas fichas el 0,6 del ancho de celda dejaba el QR enorme (162 px con fichas
  // de 270); el objetivo baja a 0,45 con techo mas bajo. Las capturas v61 con el QR grande
  // en las lonas de pocos espiritus no valen.
  // v63: el QR codifica el dominio pelado ('spritedex.gg', 21 modulos) en vez de la URL
  // completa (25 modulos), asi que baja el piso escaneable de 102 a 86 px y el objetivo al
  // 0,35 del ancho de celda; las capturas v62 con la URL completa no valen.
  // v64: el QR del pie va desnudo (fuera el fundido radial y las esquinas HUD); las capturas
  // v63 guardadas con el marco anterior no valen.
  // v65: el espiritu que falta pasa a monocromo en penumbra (conserva su dibujo) en vez del
  // velo gris que lo aplanaba; las capturas v64 con el velo no valen.
  // v66: el resplandor del titulo sale de las letras y el halo de ambiente deja de ser un
  // ovalo recortado en seco; las capturas v65 con la mancha no valen.
  // v67: la ficha estrena corona de maestria al lado opuesto del estado; las capturas v66
  // sin corona no valen.
  return `v67_${format}_${bgStyle}_${count}_${ownedCount}_${alcance || 'all'}_${generalOwned ?? 'x'}/${generalTotal ?? 'x'}_${usuario || 'sin'}__${hash}`;
}

// Helper to pre-load image for canvas drawing with instantaneous in-memory caching
// Derivada de 256 px para el collage: el export dibuja cada espiritu a ~90-110 px,
// asi que la miniatura de 448 px que usan las tarjetas sobra y multiplica por cuatro
// los datos que se bajan al entrar. Si la derivada no existe se cae a la miniatura.
const COLLAGE_DIR = '/sprites/thumbs/';
const COLLAGE_DIR_ALT = '/sprites/collage/';

export function srcParaCollage(sprite) {
  if (!sprite) return null;
  // pond_gold se dibuja con el original a proposito (su miniatura recorta mal).
  if (sprite.id === 'pond_gold') return '/sprites/pond_gold.webp';
  const base = sprite.thumb || sprite.image;
  if (base && base.indexOf(COLLAGE_DIR) !== -1) return base.replace(COLLAGE_DIR, COLLAGE_DIR_ALT);
  return base || rutaAssetEspiritu(sprite.id);
}

// Corona de maestria de la lona: el MISMO asset que usa la rejilla de la app, para que la
// captura y la pantalla cuenten lo mismo. Su caja en CSS (grid/list/swiper) es 28 x 19.
const CORONA_MAESTRIA = '/img/x/sprites/crown.webp';
const CORONA_ASPECTO = 28 / 19;
// El webp de la corona no viene recto: su base baja ~17 grados (medido columna a columna
// sobre sus 31 x 21 px: el borde inferior recorre 13 -> 20 en 24 columnas y luego sube por
// la punta). La rejilla lo tapa con su propia rotacion CSS; en la lona se dibuja girada
// para que salga nivelada.
const CORONA_INCLINACION = 17 * Math.PI / 180;

export function loadImage(src, bajaPrioridad = false) {
  if (!src) return Promise.resolve(null);

  // 1. Verificación instantánea en memoria
  if (globalImageCache.has(src)) {
    const cached = globalImageCache.get(src);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      return Promise.resolve(cached);
    }
  }

  // 2. Reutilización instantánea si la imagen ya está presente en el DOM del navegador
  if (typeof document !== 'undefined' && document.images) {
    let targetUrl = src;
    try {
      if (typeof window !== 'undefined' && !src.startsWith('http://') && !src.startsWith('https://')) {
        targetUrl = new URL(src, window.location.origin).href;
      }
    } catch {}

    for (let i = 0; i < document.images.length; i++) {
      const domImg = document.images[i];
      // Excluir imágenes marcadas con fallback/error (dataset.triedBase)
      if (domImg && domImg.complete && domImg.naturalWidth > 0 && !domImg.dataset.triedBase) {
        if (domImg.src === targetUrl || domImg.getAttribute('src') === src) {
          globalImageCache.set(src, domImg);
          return Promise.resolve(domImg);
        }
      }
    }
  }

  // 3. Carga rápida acelerada con fallback por timeout para que nunca bloquee la plantilla
  return new Promise((resolve) => {
    const img = new Image();
    // Solo requerir CORS si es una URL externa http(s) fuera del origen actual
    const isExternal = (src.startsWith('http://') || src.startsWith('https://')) &&
      (typeof window !== 'undefined' && !src.startsWith(window.location.origin));
    if (isExternal) {
      img.crossOrigin = 'Anonymous';
    }
    // La precarga de fondo no debe competir con lo que el usuario esta viendo.
    if (bajaPrioridad) img.fetchPriority = 'low';

    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      if (result) globalImageCache.set(src, result);
      resolve(result);
    };

    // Timeout de seguridad (1.2s máx por imagen individual para nunca colgar la exportación)
    const timer = setTimeout(() => {
      finish(null);
    }, 1200);

    img.onload = () => {
      clearTimeout(timer);
      finish(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(null);
    };
    img.src = src;

    if (img.complete && img.naturalWidth > 0) {
      clearTimeout(timer);
      finish(img);
    }
  });
}

// Precarga anticipada de recursos por lotes en reposo (idle) sin saturar la red ni bloquear el hilo.
let turnoPrecarga = 0;
// Pausa del calentamiento mientras el usuario scrollea: primero ve el arte de las tarjetas que
// esta mirando, despues se calienta el export. La via rapida de la vista de compartir no se pausa.
const PRECARGA_SCROLL_QUIET_MS = 700;
const PRECARGA_SCROLL_RETRY_MS = 250;
// Las tandas son pequenas y espaciadas a proposito: antes eran de 30 imagenes cada 16 ms,
// o sea ~1,8 MB de miniaturas saliendo de golpe mientras la app pintaba la primera pantalla.
export function preloadCanvasAssets(spritesList = [], batchSize = 4) {
  if (typeof window === 'undefined') return;
  loadImage(rutaFondoPlantilla(), true);

  if (Array.isArray(spritesList) && spritesList.length > 0) {
    // El efecto de App se dispara varias veces al arrancar (catalogo de cache y luego
    // de la red). Sin esto se solapaban varias precargas y las tandas de 4 se
    // multiplicaban, que es justo lo que se queria evitar.
    const miTurno = ++turnoPrecarga;
    let index = 0;
    // Actividad de scroll del usuario: si acaba de scrollear, se espera. Nunca preventDefault.
    let lastScrollAt = -Infinity;
    const anotarScroll = () => { lastScrollAt = performance.now(); };
    const alVolverVisible = () => {
      if (document.visibilityState === 'visible') processBatch();
    };
    const quitarListeners = () => {
      window.removeEventListener('scroll', anotarScroll);
      document.removeEventListener('visibilitychange', alVolverVisible);
    };
    const processBatch = () => {
      if (miTurno !== turnoPrecarga) { quitarListeners(); return; }
      if (index >= spritesList.length) { quitarListeners(); return; }
      if (esperasActivas <= 0) {
        // Sin nadie esperando: no se calienta con la pestana oculta ni mientras el usuario
        // scrollea. Se reprograma y se reintenta mas tarde (nada de busy loops).
        if (document.visibilityState === 'hidden') return;
        if (performance.now() - lastScrollAt < PRECARGA_SCROLL_QUIET_MS) {
          setTimeout(processBatch, PRECARGA_SCROLL_RETRY_MS);
          return;
        }
      }
      const slice = spritesList.slice(index, index + batchSize);
      index += batchSize;
      slice.forEach(s => {
        // Las mismas imagenes que usa el export: la derivada del collage.
        const src = srcParaCollage(s);
        if (src) loadImage(src, true);
      });
      if (index < spritesList.length) {
        // Con la modal de compartir abierta hay alguien esperando: se acelera para
        // terminar de calentar. En reposo se va dejando caer, tanda a tanda, para no
        // competir ni con el primer pintado ni con el scroll.
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const fastConnection = !connection || connection.effectiveType === '4g' || connection.effectiveType === undefined;
        if (esperasActivas > 0) {
          setTimeout(processBatch, 32);
        } else if (fastConnection) {
          setTimeout(processBatch, 300);
        } else if (window.requestIdleCallback) {
          window.requestIdleCallback(processBatch, { timeout: 2500 });
        } else {
          setTimeout(processBatch, 900);
        }
      } else {
        quitarListeners();
      }
    };

    window.addEventListener('scroll', anotarScroll, { passive: true });
    document.addEventListener('visibilitychange', alVolverVisible);

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const fast = !connection || connection.effectiveType === '4g' || connection.effectiveType === undefined;
    if (fast) {
      setTimeout(processBatch, 250);
    } else if (window.requestIdleCallback) {
      window.requestIdleCallback(processBatch, { timeout: 3000 });
    } else {
      setTimeout(processBatch, 1200);
    }
  }
}

// Precarga de fondo al inicializar el módulo
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => loadImage(rutaFondoPlantilla()));
  } else {
    setTimeout(() => loadImage(rutaFondoPlantilla()), 50);
  }
}

// Convert Hex color string to RGBA with explicit opacity
function hexToRgba(hex, alpha = 0.50) {
  let c = (hex || '#38bdf8').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Helper to draw a rounded rectangle path
function roundRect(ctx, x, y, width, height, radius) {
  if (typeof radius === 'number') {
    radius = { tl: radius, tr: radius, br: radius, bl: radius };
  } else {
    const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
    radius = Object.assign(defaultRadius, radius);
  }
  ctx.beginPath();
  ctx.moveTo(x + radius.tl, y);
  ctx.lineTo(x + width - radius.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
  ctx.lineTo(x + width, y + height - radius.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
  ctx.lineTo(x + radius.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
  ctx.lineTo(x, y + radius.tl);
  ctx.quadraticCurveTo(x, y, x + radius.tl, y);
  ctx.closePath();
}

// Ultima fila con pixeles visibles de una mascara: el SVG oficial del wordmark deja aire
// abajo (13 px de 180 al dibujarse a 540), asi que anclar la capsula al alto del archivo
// la dejaba flotando. Se mide el borde real de las letras y se usa ese valor.
function medirBordeInferior(ctxLogo, ancho, alto) {
  try {
    const datos = ctxLogo.getImageData(0, 0, ancho, alto).data;
    for (let y = alto - 1; y >= 0; y -= 1) {
      for (let x = 0; x < ancho; x += 1) {
        if (datos[(y * ancho + x) * 4 + 3] > 8) return y + 1;
      }
    }
  } catch {}
  return alto;
}

// Draw crop & fill background
function drawCroppedBackground(ctx, img, canvasW, canvasH) {
  if (!img || !img.width || !img.height) return;
  const imgRatio = img.width / img.height;
  const canvasRatio = canvasW / canvasH;
  let srcX = 0, srcY = 0, srcW = img.width, srcH = img.height;

  if (imgRatio > canvasRatio) {
    srcW = img.height * canvasRatio;
    srcX = (img.width - srcW) / 2;
  } else {
    srcH = img.width / canvasRatio;
    srcY = (img.height - srcH) / 2;
  }

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, canvasW, canvasH);
}

// Draw cyber grid and scanlines on canvas
function drawCyberMatrixBackground(ctx, width, height, style = 'glitch_override', bgImg = null) {
  if (bgImg && style === 'glitch_override') {
    drawCroppedBackground(ctx, bgImg, width, height);
    // Dark cyber tint overlay
    ctx.fillStyle = 'rgba(6, 7, 20, 0.72)';
    ctx.fillRect(0, 0, width, height);
  } else if (style === 'blueprint') {
    // Blueprint dark blue
    ctx.fillStyle = '#060a17';
    ctx.fillRect(0, 0, width, height);

    // Cyan radial glow
    const radial = ctx.createRadialGradient(width * 0.5, height * 0.3, 50, width * 0.5, height * 0.4, width * 0.7);
    radial.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
    radial.addColorStop(1, 'rgba(6, 10, 23, 0)');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);

    // 50px grid
    ctx.strokeStyle = 'rgba(14, 165, 233, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else {
    // Dark matrix gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0a0918');
    bgGrad.addColorStop(0.5, '#050716');
    bgGrad.addColorStop(1, '#02030a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Glitch decorative scanlines (optimizado por pasos de 8px para máximo rendimiento de pintado)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.018)';
  for (let y = 0; y < height; y += 8) {
    ctx.fillRect(0, y, width, 2);
  }

  // Cyber corner pixels / chromatic artifacts
  ctx.fillStyle = 'rgba(0, 240, 255, 0.75)';
  ctx.fillRect(20, 20, 12, 4);
  ctx.fillRect(20, 20, 4, 12);
  ctx.fillRect(width - 32, height - 24, 12, 4);
  ctx.fillRect(width - 24, height - 32, 4, 12);

  ctx.fillStyle = 'rgba(255, 0, 85, 0.75)';
  ctx.fillRect(width - 32, 20, 12, 4);
  ctx.fillRect(width - 24, 20, 4, 12);
  ctx.fillRect(20, height - 24, 12, 4);
  ctx.fillRect(20, height - 32, 4, 12);

  // Random pixel blocks in background
  ctx.fillStyle = 'rgba(255, 0, 85, 0.4)';
  ctx.fillRect(45, 65, 16, 6);
  ctx.fillRect(width - 70, 95, 20, 8);
  ctx.fillStyle = 'rgba(0, 240, 255, 0.4)';
  ctx.fillRect(width - 50, 60, 14, 5);
  ctx.fillRect(60, height - 60, 18, 5);
  ctx.fillStyle = 'rgba(34, 197, 94, 0.45)';
  ctx.fillRect(width * 0.85, 45, 10, 8);
}

// Determine the primary glowing hue color for each spirit
function getSpiritHue(sprite) {
  const name = (sprite.fullName || sprite.name || '').toLowerCase();
  const rarity = (sprite.rarity || '').toLowerCase();
  const theme = (sprite.variant || sprite.theme || '').toLowerCase();
  const family = (sprite.familyId || sprite.id || '').toLowerCase();

  // 1. Variantes de tema
  if (theme.includes('gold') || theme.includes('dorado') || name.includes('dorado')) return '#facc15';
  if (theme.includes('cheat') || theme.includes('hacker') || name.includes('hacker')) return '#22c55e';
  if (theme.includes('candy') || theme.includes('gomita') || name.includes('gomita')) return '#ff6b81';
  if (theme.includes('galaxy') || theme.includes('galáctico') || theme.includes('galactico')) return '#a855f7';
  if (theme.includes('cube') || theme.includes('cúbico') || theme.includes('cubico')) return '#8b008b';
  if (theme.includes('holofoil') || theme.includes('holográfico') || theme.includes('holografico')) return '#ec4899';
  if (theme.includes('gem') || theme.includes('gema')) return '#38bdf8';
  if (theme.includes('quack') || theme.includes('patito')) return '#00f0ff';

  // 2. Familias Básicas por color característico
  if (family.includes('klombo')) return '#ec4899';
  if (family.includes('sonic')) return '#38bdf8';
  if (family.includes('shadow')) return '#a855f7';
  if (family.includes('tails')) return '#f97316';
  if (family.includes('victorioso') || family.includes('corona') || family.includes('crown')) return '#f59e0b';
  if (family.includes('jackrabbit')) return '#a3e635';
  if (family.includes('bush') || family.includes('arbust')) return '#22c55e';
  if (family.includes('killswitch')) return '#06b6d4';
  if (family.includes('jonesy')) return '#fb923c';
  if (family.includes('8bit')) return '#ef4444';
  if (family.includes('adventure') || family.includes('aventurero')) return '#0ea5e9';
  if (family.includes('stormscout') || family.includes('exploratormentas')) return '#818cf8';
  if (family.includes('batman')) return '#3b82f6';
  if (family.includes('wick')) return '#f59e0b';
  if (family.includes('water') || family.includes('agua')) return '#00f0ff';
  if (family.includes('fire') || family.includes('fuego')) return '#ff5722';
  if (family.includes('earth') || family.includes('tierra')) return '#10b981';
  if (family.includes('air') || family.includes('aire')) return '#38bdf8';
  if (family.includes('ghost') || family.includes('fantasma')) return '#94a3b8';
  if (family.includes('demon') || family.includes('demonio')) return '#dc2626';

  // 3. Rareza por defecto
  if (rarity.includes('mitico') || rarity.includes('mítico')) return '#f59e0b';
  if (rarity.includes('legendario')) return '#f97316';
  if (rarity.includes('epico') || rarity.includes('épico')) return '#a855f7';
  if (rarity.includes('raro')) return '#3b82f6';
  if (rarity.includes('especial')) return '#ec4899';

  return '#00F0E8';
}

export async function generateSpritedexCardImage({
  spritesList,
  userState,
  format = DEFAULT_EXPORT_FORMAT, // 'checklist', 'square'
  bgStyle = DEFAULT_EXPORT_BG_STYLE, // 'glitch_override', 'blueprint', 'dark_matrix'
  useBackgroundTemplate = true,
  usuario = '', // nombre de Fortnite del duenno: se pinta en el pie, junto al QR
  alcance = 'all', // que lista muestra la lona: all | new | owned | missing (contexto del HUD)
  progresoGeneral = null // { owned, total } de TODA la coleccion: el progreso real
}) {
  const effectiveBgStyle = bgStyle || (useBackgroundTemplate ? 'glitch_override' : 'dark_matrix');
  const ownedCount = spritesList.filter(s => userState[s.id]?.owned).length;
  const firma = String(usuario || '').trim();
  const cacheKey = getCanvasCacheKey(format, effectiveBgStyle, spritesList.length, ownedCount, spritesList, userState, firma, alcance, progresoGeneral?.owned ?? null, progresoGeneral?.total ?? null);

  // 1. Devolución instantánea a 0ms si la plantilla ya fue generada previamente
  if (globalCanvasCache.has(cacheKey)) {
    return globalCanvasCache.get(cacheKey);
  }

  // Asegura que las fuentes web (Inter y Outfit) estén listas para el canvas
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const loadedImagesMap = {};

  // Load official glitch wallpaper (en temporada, el arte de Fortnitemares)
  const fondo = rutaFondoPlantilla();
  const bgImgPromise = loadImage(fondo).then((img) => {
    if (img) return img;
    // Sin el arte de temporada, la captura no se queda sin fondo.
    return fondo === '/background.webp' ? null : loadImage('/background.webp');
  });

  // En temporada el encabezado usa el logo real de Fortnitemares (el mismo SVG del hero).
  const logoMaresPromise = isFortnitemaresActive() ? loadImage('/fortnitemares.svg') : Promise.resolve(null);

  // Con alguien esperando (modal abierto) se piden todas de golpe porque el objetivo
  // es que la captura salga ya. En segundo plano se piden de a pocas: el precálculo
  // pedia 90 y pico imagenes de una sola vez apenas se entraba a la app, y eso se
  // comia la conexion justo mientras se pintaba la primera pantalla.
  const concurrencia = esperasActivas > 0 ? 12 : 4;
  const lista = spritesList.slice(0, 250);
  let siguiente = 0;
  const cargarSprite = async () => {
    while (siguiente < lista.length) {
      const s = lista[siguiente++];
      // El collage dibuja el sprite a ~90-110 px: se usa la derivada de 256 px y, si
      // no existe, se cae a la miniatura de las tarjetas para no dejar el hueco.
      let img = await loadImage(srcParaCollage(s));
      if (!img && s.thumb) img = await loadImage(s.thumb);
      if (img) loadedImagesMap[s.id] = img;
    }
  };

  await Promise.all([
    bgImgPromise.then((img) => {
      if (img) loadedImagesMap['__bg_override__'] = img;
    }),
    logoMaresPromise.then((img) => {
      if (img) loadedImagesMap['__logo_mares__'] = img;
    }),
    // La corona se pide siempre, aunque no haya ningun espiritu maxeado: pesa menos de
    // 1 KB y asi la ficha no se queda sin ella porque la peticion llegue tarde. Si no
    // llega, la ficha sale sin corona en vez de romperse.
    loadImage(CORONA_MAESTRIA, true).then((img) => {
      if (img) loadedImagesMap['__corona__'] = img;
    }),
    ...Array.from({ length: Math.min(concurrencia, lista.length) }, cargarSprite)
  ]);

  const result = await renderGlitchOverrideTemplate({
    spritesList,
    userState,
    format,
    bgStyle: effectiveBgStyle,
    loadedImagesMap,
    usuario: firma,
    alcance,
    progresoGeneral
  });

  globalCanvasCache.set(cacheKey, result);
  return result;
}

// Nombre del espiritu: reparto en lineas y tamano que llena su banda.
//
// La banda util es el hueco real entre el borde inferior del espiritu y la linea del
// estado. El nombre se ajusta a ESE hueco en vez de a un tamano fijo: crece hasta llenarlo
// en cualquier formato y con cualquier numero de espiritus, se reparte en dos lineas solo
// cuando eso lo agranda de verdad, y nunca toca ni el espiritu ni la linea.
const NOMBRE_MIN_PX = 9;
const NOMBRE_LINE_RATIO = 1.14;
const NOMBRE_REF_PX = 100;
// Cuanto ancho de la ficha puede ocupar el nombre. Al 100% quedaba pegado a los bordes.
const ANCHO_NOMBRE_FICHA = 0.82;
// Dos lineas tienen que ganarle a una por este margen: partir un nombre que ya cabia bien
// solo desordena la ficha.
const NOMBRE_VENTAJA_DOS_LINEAS = 1.15;

function medirBloqueNombre(ctx, lines, fontSize) {
  ctx.font = `800 ${fontSize}px "Outfit", "Inter", sans-serif`;
  let ancho = 0;
  let ascendente = 0;
  let descendente = 0;
  for (const linea of lines) {
    const medida = ctx.measureText(linea);
    ancho = Math.max(ancho, medida.width);
    // El ascendente y el descendente reales incluyen tildes y colas: con un tanteo fijo el
    // bloque quedaba unos pixeles por debajo del centro de su banda.
    ascendente = Math.max(ascendente, medida.actualBoundingBoxAscent || fontSize * 0.78);
    descendente = Math.max(descendente, medida.actualBoundingBoxDescent || fontSize * 0.22);
  }
  return {
    ancho,
    ascendente,
    descendente,
    alto: (lines.length - 1) * fontSize * NOMBRE_LINE_RATIO + ascendente + descendente
  };
}

// Repartos posibles del nombre: primero las reglas de la app (variante "Hacker de Botín" y
// familia conocida) y despues el corte por ancho medido real, el que deja la linea mas
// larga lo mas corta posible para que el nombre pueda ser mas grande. Antes se cortaba por
// numero de letras: con letras anchas y estrechas la pareja salia descompensada.
export function repartirNombreEnLineas(fullName, familyNames, medirAncho = null) {
  if (!fullName) return [];

  if (fullName.includes('Hacker de Botín')) {
    return [[fullName.replace('Hacker de Botín', '').trim() || 'Espíritu', 'Hacker de Botín']];
  }

  const candidatos = [];
  // El mismo reparto puede salir por familia y por ancho (es lo normal): se guarda una vez.
  const yaEsta = (lineas) => candidatos.some(
    (c) => c.length === lineas.length && c.every((linea, i) => linea === lineas[i])
  );
  // La familia puede venir en espanol o en ingles: la que empiece el nombre da el reparto
  // bueno, y asi el idioma de la lona no cambia como se parten las lineas.
  const familias = Array.isArray(familyNames) ? familyNames : [familyNames];
  for (const familia of familias) {
    if (!familia || !fullName.startsWith(familia)) continue;
    const variante = fullName.slice(familia.length).trim();
    if (variante && !yaEsta([familia, variante])) candidatos.push([familia, variante]);
  }

  const palabras = fullName.split(' ').filter(Boolean);
  if (palabras.length > 1) {
    const ancho = medirAncho || ((texto) => texto.length);
    let mejorCorte = 1;
    let mejorAncho = Infinity;
    for (let i = 1; i < palabras.length; i += 1) {
      const l1 = palabras.slice(0, i).join(' ');
      const l2 = palabras.slice(i).join(' ');
      const mayor = Math.max(ancho(l1), ancho(l2));
      if (mayor < mejorAncho) {
        mejorAncho = mayor;
        mejorCorte = i;
      }
    }
    const pareja = [palabras.slice(0, mejorCorte).join(' '), palabras.slice(mejorCorte).join(' ')];
    if (!yaEsta(pareja)) candidatos.push(pareja);
  }
  return candidatos;
}

// Tamano mas grande que entra en la banda. El ancho escala lineal con el tamano, asi que
// una sola medida a 100 px da el maximo exacto por ancho; el alto se comprueba con las
// metricas reales y se recorta en pasos de medio pixel.
function ajustarNombreEnBanda(ctx, lines, maxAncho, maxAlto, objetivo) {
  ctx.font = `800 ${NOMBRE_REF_PX}px "Outfit", "Inter", sans-serif`;
  let anchoRef = 0;
  for (const linea of lines) anchoRef = Math.max(anchoRef, ctx.measureText(linea).width);
  const porAncho = anchoRef > 0 ? (maxAncho * NOMBRE_REF_PX) / anchoRef : objetivo;
  let tamano = Math.floor(Math.max(NOMBRE_MIN_PX, Math.min(objetivo, porAncho)) * 2) / 2;
  let medida = medirBloqueNombre(ctx, lines, tamano);
  while (tamano > NOMBRE_MIN_PX && (medida.alto > maxAlto || medida.ancho > maxAncho)) {
    tamano -= 0.5;
    medida = medirBloqueNombre(ctx, lines, tamano);
  }
  return { lines, fontSize: tamano, ...medida };
}

export function getSpriteNameLines(ctx, fullName, maxAncho, maxAlto, objetivo, familyNames) {
  if (!fullName) {
    return { lines: [''], fontSize: objetivo, ancho: 0, alto: 0, ascendente: 0, descendente: 0 };
  }

  const unaLinea = ajustarNombreEnBanda(ctx, [fullName], maxAncho, maxAlto, objetivo);
  const candidatos = repartirNombreEnLineas(fullName, familyNames, (texto) => {
    ctx.font = `800 ${NOMBRE_REF_PX}px "Outfit", "Inter", sans-serif`;
    return ctx.measureText(texto).width;
  });
  if (!candidatos.length) return unaLinea;
  // "Hacker de Botín" es una regla de diseno, no una opcion: se respeta aunque salga algo
  // mas pequeno que en una sola linea.
  if (fullName.includes('Hacker de Botín')) {
    return ajustarNombreEnBanda(ctx, candidatos[0], maxAncho, maxAlto, objetivo);
  }

  // Los candidatos van por orden de preferencia (familia primero): uno posterior solo lo
  // desbanca si de verdad deja el nombre bastante mas grande.
  let mejor = null;
  for (const lines of candidatos) {
    const ajuste = ajustarNombreEnBanda(ctx, lines, maxAncho, maxAlto, objetivo);
    if (!mejor || ajuste.fontSize > mejor.fontSize * 1.10) mejor = ajuste;
  }
  // Si la linea unica se quedo en el suelo SIN entrar (el bloque desborda la ficha), el
  // margen del 15% no aplica: gana un reparto que entre de verdad, o el que desborde
  // menos. Sin esto, nombres como "Exploratormentas Dorado" o "Pastel de Cumpleanos
  // Dorado" quedaban en una linea saliendose de su tarjeta en las lonas densas.
  const unaLineaEntra = unaLinea.ancho <= maxAncho && unaLinea.alto <= maxAlto;
  if (!unaLineaEntra && mejor) {
    const mejorEntra = mejor.ancho <= maxAncho && mejor.alto <= maxAlto;
    if (mejorEntra || mejor.ancho < unaLinea.ancho) return mejor;
  }
  if (mejor && mejor.fontSize > unaLinea.fontSize * NOMBRE_VENTAJA_DOS_LINEAS) return mejor;
  return unaLinea;
}

// Geometria interna de una ficha (relativa a su esquina): badge de estado abajo, banda
// del nombre encima y zona del espiritu arriba. Una sola fuente para que el precálculo
// de la talla unica de nombres use EXACTAMENTE la misma cadena que el dibujo.
function geometriaFichaNombre(cardW, cardH, conImagen) {
  const badgeH = Math.max(16, Math.min(28, Math.round(cardH * 0.15)));
  const bottomGutter = Math.max(8, Math.min(13, Math.round(cardH * 0.045)));
  const badgeY = cardH - badgeH - bottomGutter;
  const gapNameBadge = Math.max(3, Math.min(5, Math.round(cardH * 0.018)));
  const nameZoneH = Math.max(28, Math.min(64, Math.round(cardH * 0.24)));
  const nameZoneTop = badgeY - gapNameBadge - nameZoneH;
  const spriteZoneH = Math.max(36, nameZoneTop);
  const imgSize = Math.max(36, Math.min(Math.floor(cardW * 0.62), Math.floor(spriteZoneH * 0.80)));
  const imgY = Math.floor((spriteZoneH - imgSize) / 2);
  const aireBanda = Math.max(4, Math.min(18, Math.round(cardH * 0.028)));
  const bandaTop = (conImagen ? imgY + imgSize : nameZoneTop) + aireBanda;
  const bandaAlto = Math.max(24, badgeY - aireBanda - bandaTop);
  const maxTextW = Math.round(cardW * ANCHO_NOMBRE_FICHA);
  const objetivo = Math.max(10, Math.min(48, Math.round(cardW * 0.105), Math.round(bandaAlto * 0.52)));
  return { badgeH, badgeY, imgSize, imgY, bandaTop, bandaAlto, maxTextW, objetivo };
}

// -------------------------------------------------------------
// Renders the GLITCH / OVERRIDE style template
// Adaptación geométrica matemática simétrica para cualquier cantidad de espíritus (Gen 1, Gen 2, etc.)
// -------------------------------------------------------------
// El dibujo corre en el hilo principal. Medido con CPU 4x sobre 101 tarjetas: una
// sola tarea de 677 ms, que en un telefono se siente como un tiron de casi un
// segundo. Ceder el turno cada pocas tarjetas reparte ese trabajo en tareas cortas
// sin cambiar ni un pixel del resultado.
const TARJETAS_POR_TANDA = 6;
// Cuando hay alguien esperando la captura, tandas mas grandes: menos cesiones,
// menos frames regalados, y aun asi el hilo respira de sobra para pintar el spinner.
const TARJETAS_POR_TANDA_ESPERANDO = 25;
// Espiritu que todavia no esta: se pinta apagado, como una ficha sin desbloquear. La
// distincion no es "resaltar el que tienes" sino lo contrario: brilla el que ya es tuyo y
// el que falta se queda mate.
const ESPIRITU_FALTANTE_ALPHA = 0.92;
// Velo gris oscuro: al mezclarse con el espiritu le quita color (se acerca al gris) y
// brillo a la vez, que es justo lo que se lee como "apagado".
const ESPIRITU_FALTANTE_VELO = 'rgba(96, 98, 110, 0.7)';

const SOPORTA_MEZCLA_SATURACION = (() => {
  try {
    const c = document.createElement('canvas').getContext('2d');
    c.globalCompositeOperation = 'saturation';
    return c.globalCompositeOperation === 'saturation';
  } catch { return false; }
})();
// Tono del apagado monocromo: un gris frio que, multiplicado sobre el espiritu ya sin
// color, lo deja en penumbra conservando todo su dibujo (sombras, volumen, contorno).
const ESPIRITU_FALTANTE_TINTE = 'rgb(132, 138, 158)';

// Lienzo de trabajo reutilizado para apagar los espiritus que faltan. Se dibuja ahi el
// espiritu y se le echa el velo recortado a su silueta (source-atop solo pinta donde ya hay
// espiritu), sin tocar el resto de la ficha.
// Con ctx.filter ('saturate(...) brightness(...)') el resultado era el mismo, pero costaba
// ~3 ms por espiritu: la lona de 64 fichas pasaba de 241 ms a 829 ms de dibujo.
let lienzoApagado = null;
function dibujarEspirituApagado(ctx, img, x, y, tamano) {
  const lado = Math.max(1, Math.round(tamano));
  if (!lienzoApagado) lienzoApagado = document.createElement('canvas');
  if (lienzoApagado.width !== lado || lienzoApagado.height !== lado) {
    lienzoApagado.width = lado;
    lienzoApagado.height = lado;
  }
  const lc = lienzoApagado.getContext('2d');
  lc.clearRect(0, 0, lado, lado);
  lc.drawImage(img, 0, 0, lado, lado);

  if (SOPORTA_MEZCLA_SATURACION) {
    // 'saturation' con un gris deja la LUMINOSIDAD del espiritu y le quita el color: la
    // silueta conserva sombras y volumen. El velo gris plano de antes, en cambio, aplanaba
    // el dibujo hasta parecer una capa blanquecina puesta encima de la ficha.
    lc.globalCompositeOperation = 'saturation';
    lc.fillStyle = 'hsl(0, 0%, 50%)';
    lc.fillRect(0, 0, lado, lado);
    // Y 'multiply' lo baja a penumbra sin perder ese dibujo.
    lc.globalCompositeOperation = 'multiply';
    lc.fillStyle = ESPIRITU_FALTANTE_TINTE;
    lc.fillRect(0, 0, lado, lado);
    // Las dos mezclas pintan tambien el cuadro vacio del lienzo de trabajo, asi que se
    // recorta otra vez a la silueta: si no, el apagado saldria como un cuadro gris.
    lc.globalCompositeOperation = 'destination-in';
    lc.drawImage(img, 0, 0, lado, lado);
  } else {
    // Respaldo para navegadores sin mezclas de saturacion: el velo de siempre.
    lc.globalCompositeOperation = 'source-atop';
    lc.fillStyle = ESPIRITU_FALTANTE_VELO;
    lc.fillRect(0, 0, lado, lado);
  }
  lc.globalCompositeOperation = 'source-over';
  ctx.drawImage(lienzoApagado, x, y, tamano, tamano);
}
// Ceder con setTimeout evita el bloqueo, pero no deja pintar: las tareas se
// encadenan y el frame se retrasa. Con requestIdleCallback decide el navegador
// cuando hay hueco real, y el timeout impide que el precálculo se quede parado.
//
// Pero esperar reposo solo tiene sentido si nadie esta mirando: con la modal de
// compartir abierta, esperar hueco es justo lo contrario de lo que quiere quien
// esta delante. Ahi se cede con un temporizador corto y el dibujo acaba antes.
let esperasActivas = 0;

export function marcarEsperaActiva(activo) {
  esperasActivas += activo ? 1 : -1;
  if (esperasActivas < 0) esperasActivas = 0;
}

const cederTurno = () => new Promise((resolve) => {
  // Con alguien esperando se cede poco y rapido: lo justo para que el indicador de
  // la modal siga girando y la app no se congele, sin sumar espera apreciable.
  // El troceado fino (y la espera de reposo) es para el precálculo de fondo.
  if (esperasActivas > 0) {
    if (typeof requestAnimationFrame === 'function') { requestAnimationFrame(() => resolve()); return; }
    setTimeout(resolve, 0);
    return;
  }
  // Tambien el precálculo de fondo cede con un frame y no esperando reposo: esperar
  // hueco lo alargaba (medido: 1,2 s de trabajo repartidos en casi 2 s) y la captura
  // llegaba tarde a la modal. Las tandas ya son cortas, asi que el hilo respira igual.
  if (typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(() => setTimeout(resolve, 0));
    return;
  }
  setTimeout(resolve, 0);
});

async function renderGlitchOverrideTemplate({
  spritesList,
  userState,
  format,
  bgStyle,
  loadedImagesMap,
  usuario = '',
  alcance = 'all',
  progresoGeneral = null
}) {
  const canvas = document.createElement('canvas');
  const totalSprites = spritesList.length;
  const ownedCount = spritesList.filter(s => userState[s.id]?.owned).length;
  const pctOwned = totalSprites > 0 ? Math.round((ownedCount / totalSprites) * 100) : 0;

  // Progreso real de la coleccion. Con una lista parcial (Nuevos, Faltantes, Atrapados)
  // el % contra ESA lista enganna: "0 de 3 nuevos" pintaba "PROGRESO 0%" aunque la
  // coleccion entera vaya al 79%. El HUD pinta el progreso general y la izquierda dice
  // que lista es; sin datos generales se cae al comportamiento de siempre.
  const usaGeneral = alcance !== 'all' && !!progresoGeneral && Number.isFinite(progresoGeneral.total) && progresoGeneral.total > 0;
  const pctBarra = usaGeneral
    ? Math.round((Math.min(Math.max(0, progresoGeneral.owned), progresoGeneral.total) / progresoGeneral.total) * 100)
    : pctOwned;

  // El QR ya no ocupa celda: vive en el pie, asi que la cuadricula se llena SOLO con
  // espiritus. Con la reserva de antes (+1) el ultimo hueco quedaba vacio al sacar el QR.
  const totalSlotsNeeded = totalSprites;
  const isSquare = format === 'square';

  let width = 1080;
  let height = 1520;
  let cols = 6;
  let cellH;
  // En temporada el encabezado lleva el logo real de Fortnitemares, que necesita mas alto.
  const enTemporada = isFortnitemaresActive();
  let headerH = enTemporada ? 265 : 195;
  const paddingX = 36;

  // -------------------------------------------------------------
  // Configuración de cuadrícula y dimensiones adaptativas
  // -------------------------------------------------------------
  if (isSquare) {
    // Escala de resolución adaptativa para mantener nitidez Retina y celdas amplias
    if (totalSprites <= 35) {
      width = 1200;
      height = 1200;
      headerH = 190;
    } else if (totalSprites <= 68) {
      width = 1600;
      height = 1600;
      headerH = 165;
    } else {
      // Colecciones grandes (como los 117 de Gen 1)
      width = 1800;
      height = 1800;
      headerH = 160;
    }

    // Cuadrícula simétrica 1:1 (cols nunca menores que rows)
    // Con 3 fichas o menos, la 2x2 llena el marco y deja el QR junto a una tarjeta: con 3
    // columnas salian tres fichas y el QR solo en la fila de abajo, con medio marco vacio.
    if (totalSprites <= 3) cols = 2;
    else if (totalSprites <= 5) cols = 3;
    else if (totalSprites <= 11) cols = 3;
    else if (totalSprites <= 19) cols = 4;
    else if (totalSprites <= 35) cols = 6; // Caso ideal Imagen 3 (6x6 = 36)
    else if (totalSprites <= 63) cols = 8; // Caso ideal Imagen 2 (8x8 = 64)
    else cols = Math.max(8, Math.ceil(Math.sqrt(totalSlotsNeeded))); // 11x11 para 117
  } else {
    // Formato Vertical: 9:16 fijo (1080x1920), que es lo que piden las redes (historias,
    // reels, tiktok). Antes la altura se calculaba con la coleccion, asi que con pocos
    // espiritus salia un lienzo 4:3 apaisado y con muchos uno de 1:2,2: ninguno servia
    // tal cual en una red. Ahora el marco es fijo y lo que se adapta es la cuadricula.
    width = 1080;
    height = 1920;

    // Columnas: la proporcion filas/columnas que deja la celda algo mas alta que ancha,
    // que es la que llena un marco 9:16 sin franjas vacias ni celdas deformadas.
    let mejorCols = 2;
    let mejorError = Infinity;
    // Desde 2 columnas: con pocos espiritus (3 o 4 fichas) la 2x2 es la que llena el marco
    // con tarjetas grandes; empezando en 3 salian tres fichas arriba y el QR solo debajo,
    // con dos franjas vacias enormes.
    for (let c = 2; c <= 12; c += 1) {
      const f = Math.ceil(totalSlotsNeeded / c);
      const error = Math.abs(f / c - 1.43);
      if (error < mejorError) {
        mejorError = error;
        mejorCols = c;
      }
    }
    cols = mejorCols;
  }

  // Ancho de diseno: la referencia fija con la que se calculan tipografia, barra, logo y
  // pie. En vertical es 1080 (el marco 9:16) aunque el lienzo acabe recortado; en cuadrado
  // es el propio marco, que ya cambia de resolucion segun el tamano de la coleccion.
  const anchoDiseno = isSquare ? width : 1080;

  // El pie reserva sitio proporcional al formato: la firma (ID - nombre) a la izquierda y
  // la marca a la derecha, en una sola linea y con el mismo tamano. La version con
  // recuadro y esquinas cargaba la zona (el QR ya tiene esquinas y el pie su marca), asi
  // que el pie es tipografia limpia con aire alrededor. Todo lo del pie
  // escala junto.
  const escFooter = anchoDiseno / 1200;
  const firmaAlto = Math.round(30 * escFooter);
  const baseFila = Math.round(60 * escFooter);

  // El QR ya no vive en la grilla: baja al pie, a la esquina inferior derecha que ocupaba
  // el hashtag. Su tamano manda en el alto de la banda, porque el pie tiene que dar sitio
  // entero al codigo, a su hueco HUD y al dominio de debajo.
  //
  // El QR se mide con la MISMA vara que la ficha: su tamano se deriva del ANCHO DE FICHA
  // (cellW), no del lienzo. Medido contra el ancho de diseno quedaba desproporcionado en
  // los dos extremos: mas grande que una ficha en las cuadriculas densas y perdido en las
  // lonas de 3 espiritus, donde la ficha es el triple de ancha.
  //
  // El ancho de celda no depende del pie, asi que se calcula aqui: es lo unico que el QR
  // necesita para medirse, y la banda del pie se deriva despues de su bloque.
  //
  // Con pocos espiritus la celda se inflaba (2 columnas de 504 px) y las fichas salian
  // gigantes al lado del titulo. En vertical el ancho de celda lleva techo: como mucho el
  // que usa una cuadricula tipica de 4 columnas, que es el tamano con el que se ve la
  // ficha en el resto de plantillas.
  const CELDA_MAX_VERTICAL = 270;
  let cellW = Math.floor((anchoDiseno - paddingX * 2) / cols);
  if (!isSquare) cellW = Math.min(cellW, CELDA_MAX_VERTICAL);

  // Regla dura de escaneo: px por modulo >= 4. El objetivo acompana a la ficha (0,35 del
  // ancho de celda: 56 px con fichas de 160, 94 con fichas de 270) y el techo evita que el
  // codigo domine el pie. El PISO manda SIEMPRE: si la cuadricula es tan densa que el
  // objetivo cae por debajo del minimo escaneable, el QR se queda en el piso (86 px con la
  // matriz de 21 modulos) aunque quede mas ancho que una ficha. Eso es fisica del QR, no
  // diseno.
  const escalaPie = Math.min(1.15, escFooter);
  const QR_MIN_PX_POR_MODULO = 4;
  const QR_MAX_PX = 140;
  const qrPieModulos = getCachedQR(textoParaQR()).getModuleCount();
  const qrPiePiso = Math.ceil(qrPieModulos * QR_MIN_PX_POR_MODULO) + 2;
  const qrPieTecho = Math.min(Math.round(cellW * 0.45), QR_MAX_PX);
  const qrPieObjetivo = Math.round(cellW * 0.35);
  const qrPieSize = Math.max(qrPiePiso, Math.min(qrPieTecho, qrPieObjetivo));
  const qrPieCaptionAlto = Math.round(18 * escalaPie);
  const qrPieHueco = Math.round(qrPieSize * 0.12);
  const qrPieMargen = Math.round(16 * escFooter);
  const qrPieCajaW = qrPieSize + qrPieHueco * 2;
  const qrPieCajaH = qrPieSize + qrPieCaptionAlto + qrPieHueco * 2;
  // La banda del pie se DERIVA del bloque del QR: codigo + linea del dominio + hueco de las
  // esquinas HUD + margenes. El suelo proporcional al formato solo evita un pie raquitico
  // cuando el bloque del QR es mas bajo que la tipografia del pie.
  const footerH = Math.max(Math.round(148 * escFooter), qrPieCajaH + qrPieMargen * 2);

  // En temporada el encabezado lleva el logo real y necesita su sitio. Se calcula con las
  // MISMAS proporciones con las que luego se dibuja, para que nunca tape la capsula ni la
  // barra de progreso: en el formato cuadrado su propio alto fijo pisaba este calculo.
  // La mascara del logo se arma aqui una sola vez: la medicion del borde real de las
  // letras alimenta tanto la reserva de alto como el dibujo del encabezado.
  let logoMaresListo = null;
  if (enTemporada) {
    const u = Math.min(1.15, anchoDiseno / 1200);
    const fuenteLogo = loadedImagesMap['__logo_mares__'];
    let logoAlto = Math.round((anchoDiseno * 0.5) / 3); // el SVG es 3:1
    let bordeLetras = logoAlto;
    if (fuenteLogo) {
      const logoW = Math.min(Math.round(anchoDiseno * 0.5), width - paddingX * 2);
      const proporcion = fuenteLogo.naturalWidth ? (fuenteLogo.naturalHeight / fuenteLogo.naturalWidth) : (1 / 3);
      const logoH = Math.round(logoW * proporcion);
      // El SVG oficial es relleno negro con contorno neon: sobre el fondo oscuro de la lona
      // el relleno se pierde. Se usa como mascara y se pinta con un degradado claro, asi el
      // wordmark se lee igual que en la key art (que va sobre magenta).
      const capaLogo = document.createElement('canvas');
      capaLogo.width = logoW;
      capaLogo.height = logoH;
      const ctxLogo = capaLogo.getContext('2d');
      ctxLogo.drawImage(fuenteLogo, 0, 0, logoW, logoH);
      ctxLogo.globalCompositeOperation = 'source-in';
      const gradLogo = ctxLogo.createLinearGradient(0, 0, 0, logoH);
      gradLogo.addColorStop(0, '#ffffff');
      gradLogo.addColorStop(0.55, '#f5d0fe');
      gradLogo.addColorStop(1, '#e879f9');
      ctxLogo.fillStyle = gradLogo;
      ctxLogo.fillRect(0, 0, logoW, logoH);
      bordeLetras = medirBordeInferior(ctxLogo, logoW, logoH);
      logoAlto = logoH;
      logoMaresListo = { capa: capaLogo, w: logoW, h: logoH, borde: bordeLetras };
    }
    // Los huecos coinciden con los del dibujo: logo (23) + letras + capsula pegada (6) +
    // capsula (22) + HUD separado (16) + HUD (36) + margen (16).
    const altoNecesario = Math.round(23 * u) + bordeLetras + Math.round(6 * u) + Math.round(22 * u) + Math.round(16 * u) + Math.round(36 * u) + 16;
    headerH = Math.max(headerH, altoNecesario);
  }

  const rows = Math.max(1, Math.ceil(totalSlotsNeeded / cols));
  if (!isSquare) {
    // El lienzo se encoge a lo que ocupa la cuadricula (el fondo se recorta solo, porque
    // se dibuja en modo cover), de modo que la barra, el titulo, las fichas y el QR
    // conservan su tamano en cualquier coleccion.
    width = paddingX * 2 + cellW * cols;
  }

  // La celda se reparte el alto disponible para llenar el marco, en los dos formatos.
  cellH = Math.floor((height - headerH - footerH) / rows);
  if (!isSquare) {
    // En vertical lleva techo: una celda mucho mas alta que ancha deforma la ficha.
    cellH = Math.min(cellH, Math.floor(cellW * 1.25));

    // El alto tambien encoge a lo que ocupa el contenido, para no dejar franjas vacias.
    const altoContenido = headerH + rows * cellH + footerH;
    height = Math.max(Math.round(width * 1.25), Math.min(1920, altoContenido));
  }

  const availH = height - headerH - footerH;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Crear el lienzo de 1280x2515 ya se nota: respiro antes de empezar a pintar.
  await cederTurno();

  // 1. Draw Background (Glitch / Matrix / Blueprint)
  const bgImg = loadedImagesMap['__bg_override__'];
  drawCyberMatrixBackground(ctx, width, height, bgStyle, bgImg);

  await cederTurno();

  // 2. HEADER SECTION (GLITCH OVERRIDE STYLE)
  ctx.save();
  const scale = anchoDiseno / 1200;

  // En temporada el encabezado se viste de Fortnitemares: mismos sitios y misma tipografia,
  // solo cambian los textos y el acento, para que la lona siga siendo reconocible.
  const acentoCabecera = enTemporada ? '#e879f9' : '#00F0E8';
  const acentoCabeceraRgba = enTemporada ? 'rgba(232, 121, 249, 0.7)' : 'rgba(0, 240, 232, 0.7)';

  // En temporada el titulo es el logo de Fortnitemares (el mismo arte del hero). Si la
  // imagen no cargara, se cae al titulo de texto para no dejar el encabezado vacio.
  let titleY;

  if (logoMaresListo) {
    const logoW = logoMaresListo.w;
    const logoH = logoMaresListo.h;
    const logoY = Math.round(23 * Math.min(1.15, scale));
    const logoX = (width - logoW) / 2;

    // Luz de ambiente del encabezado: un degradado radial que se apaga SOLO (llega a cero
    // antes del borde del lienzo) y se pinta sobre un rectangulo, sin recortarlo con una
    // forma. El ovalo anterior tenia el degradado cortado en seco por su propia elipse
    // (el radio horizontal doblaba al vertical), asi que dejaba un borde visible arriba y
    // abajo y se leia como una mancha sucia encima de la plantilla.
    const haloY = logoY + logoH / 2;
    const haloR = Math.max(Math.round(logoW * 0.72), Math.round(logoH * 2.2));
    const gradHalo = ctx.createRadialGradient(width / 2, haloY, 0, width / 2, haloY, haloR);
    gradHalo.addColorStop(0, 'rgba(168, 85, 247, 0.16)');
    gradHalo.addColorStop(0.45, 'rgba(147, 51, 234, 0.08)');
    gradHalo.addColorStop(0.75, 'rgba(126, 34, 206, 0.03)');
    gradHalo.addColorStop(1, 'rgba(126, 34, 206, 0)');
    ctx.save();
    ctx.fillStyle = gradHalo;
    ctx.fillRect(0, 0, width, Math.max(headerH, logoY + logoH + Math.round(40 * scale)));
    ctx.restore();

    // El resplandor de verdad sale de las LETRAS: dos pasadas de sombra construyen la
    // caida (una ancha y tenue, otra pegada al contorno) y la tercera pinta el wordmark
    // nitido encima, asi que las letras no se lavan con la suma.
    ctx.save();
    ctx.shadowColor = 'rgba(192, 38, 211, 0.34)';
    ctx.shadowBlur = Math.round(logoH * 0.42);
    ctx.drawImage(logoMaresListo.capa, logoX, logoY);
    ctx.shadowColor = 'rgba(232, 121, 249, 0.42)';
    ctx.shadowBlur = Math.round(logoH * 0.2);
    ctx.drawImage(logoMaresListo.capa, logoX, logoY);
    ctx.shadowColor = 'rgba(232, 121, 249, 0.45)';
    ctx.shadowBlur = 18;
    ctx.drawImage(logoMaresListo.capa, logoX, logoY);
    ctx.shadowBlur = 0;
    ctx.restore();
    // La capsula se ancla al borde visible de las letras, no al lienzo del SVG.
    titleY = logoY + logoMaresListo.borde;
  } else {
    // Top Small Header: "FORTNITE , NUEVOS"
    ctx.font = `900 ${Math.round(14 * Math.min(1.2, scale))}px "Outfit", "Inter", "Arial Black", sans-serif`;
    ctx.fillStyle = acentoCabecera;
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3px';
    ctx.shadowColor = acentoCabeceraRgba;
    ctx.shadowBlur = 8;
    const topTextY = Math.round(34 * Math.min(1.15, scale));
    ctx.fillText(enTemporada ? t('lona.arribaMares') : t('lona.arriba'), width / 2, topTextY);

    // Main Big Title: "SPRITEDEX OVERRIDE"
    const titleText = enTemporada ? t('lona.tituloMares') : t('lona.titulo');
    const baseTitleFontSize = isSquare ? (cols >= 8 ? 44 : 48) : 52;
    const titleFontSize = Math.round(baseTitleFontSize * Math.min(1.22, Math.max(0.9, scale)));
    ctx.font = `900 ${titleFontSize}px "Burbank Big Condensed", "Impact", "Arial Black", sans-serif`;

    titleY = topTextY + Math.round(50 * Math.min(1.15, scale));

    // Chromatic Aberration Shadows
    ctx.fillStyle = acentoCabecera;
    ctx.fillText(titleText, width / 2 + 3, titleY);

    ctx.fillStyle = '#ff0055';
    ctx.fillText(titleText, width / 2 - 3, titleY);

    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.shadowBlur = 14;
    ctx.fillText(titleText, width / 2, titleY);
    ctx.shadowBlur = 0;
  }

  // Tagline Pill Capsule: "ROMPE LAS REGLAS • CAMBIA EL JUEGO"
  const capsuleText = enTemporada ? t('lona.lemaMares') : t('lona.lema');
  const capsuleFontSize = Math.round(10.5 * Math.min(1.15, scale));
  ctx.font = `900 ${capsuleFontSize}px "Outfit", "Inter", "Arial Black", sans-serif`;
  ctx.letterSpacing = '1px';
  const capsuleW = ctx.measureText(capsuleText).width + Math.round(28 * scale);
  const capsuleH = Math.round(22 * Math.min(1.15, scale));
  const capsuleX = (width - capsuleW) / 2;
  // La capsula va pegada al logo: el lema es parte del titulo, no del panel de progreso.
  const capsuleY = titleY + Math.round(6 * Math.min(1.1, scale));

  roundRect(ctx, capsuleX, capsuleY, capsuleW, capsuleH, 5);
  const capsuleGrad = ctx.createLinearGradient(capsuleX, capsuleY, capsuleX + capsuleW, capsuleY);
  capsuleGrad.addColorStop(0, '#ff0055');
  capsuleGrad.addColorStop(1, '#d90429');
  ctx.save();
  ctx.shadowColor = 'rgba(255, 0, 85, 0.45)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = capsuleGrad;
  ctx.fill();
  ctx.restore();
  // Filo claro: la capsula se lee como insignia y no como un rectangulo pegado.
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.30)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(capsuleText, width / 2, capsuleY + Math.round(15 * Math.min(1.15, scale)));

  // HUD Status Bar: la izquierda dice QUE lista es y la derecha el progreso de la
  // coleccion. Antes ambas hablaban de la lista exportada y con "Nuevos"/"Faltantes"
  // el % salia engannoso (0 de 3 nuevos = "PROGRESO 0%" con la coleccion al 79%).
  const hudW = Math.min(width - paddingX * 2 - 30, Math.round(580 * Math.min(1.25, scale)));
  const hudH = Math.round(36 * Math.min(1.15, scale));
  const hudX = (width - hudW) / 2;
  const hudY = capsuleY + capsuleH + Math.round(16 * Math.min(1.1, scale));

  // HUD Frame: una base oscura tenue garantiza que el texto se lea sobre cualquier fondo
  // (el arte de temporada tiene zonas claras donde el gris del alcance se perdia).
  roundRect(ctx, hudX, hudY, hudW, hudH, 4);
  ctx.fillStyle = 'rgba(6, 8, 16, 0.42)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 240, 232, 0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Corner brackets on HUD
  ctx.fillStyle = '#00F0E8';
  ctx.fillRect(hudX - 1, hudY - 1, 6, 2);
  ctx.fillRect(hudX - 1, hudY - 1, 2, 6);
  ctx.fillRect(hudX + hudW - 5, hudY - 1, 6, 2);
  ctx.fillRect(hudX + hudW - 1, hudY - 1, 2, 6);
  ctx.fillRect(hudX - 1, hudY + hudH - 1, 6, 2);
  ctx.fillRect(hudX - 1, hudY + hudH - 5, 2, 6);
  ctx.fillRect(hudX + hudW - 5, hudY + hudH - 1, 6, 2);
  ctx.fillRect(hudX + hudW - 1, hudY + hudH - 5, 2, 6);

  // HUD Text: numero + etiqueta del alcance. En "Atrapados"/"Faltantes" el numero es el
  // tamano de la lista; el "owned" del alcance no aporta (seria 26/26 o 0/26).
  const numeroHud = (alcance === 'owned' || alcance === 'missing') ? `${totalSprites}` : `${ownedCount} / ${totalSprites}`;
  const etiquetaHud = alcance === 'new' ? t('lona.nuevos')
    : alcance === 'missing' ? t('lona.faltantes')
    : t('lona.atrapados');

  const hudTextY = hudY + Math.round(18 * Math.min(1.15, scale));
  ctx.textAlign = 'left';
  // Numero en blanco y etiqueta clara: el alcance es informacion, no decoracion.
  ctx.font = `900 ${Math.round(13 * Math.min(1.15, scale))}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = '#ffffff';
  const numeroHudW = ctx.measureText(numeroHud).width;
  ctx.fillText(numeroHud, hudX + 14, hudTextY);
  ctx.font = `700 ${Math.round(11 * Math.min(1.15, scale))}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(etiquetaHud, hudX + 14 + numeroHudW + 4, hudTextY);

  ctx.textAlign = 'right';
  ctx.font = `900 ${Math.round(11 * Math.min(1.15, scale))}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = '#00F0E8';
  ctx.fillText(usaGeneral ? t('lona.progresoGeneral', { pct: pctBarra }) : t('lona.progreso', { pct: pctBarra }), hudX + hudW - 14, hudTextY);

  // Barra neon del HUD: riel con borde, marcas de cuarto y remate encendido en el avance.
  const barX = hudX + 14;
  const barH = Math.round(8 * Math.min(1.15, scale));
  const barY = hudY + hudH - barH - 5;
  const barW = hudW - 28;
  const barRadio = barH / 2;

  roundRect(ctx, barX, barY, barW, barH, barRadio);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Marcas de 25/50/75: el riel se lee como medidor y no como una linea vacia.
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  for (const cuarto of [0.25, 0.5, 0.75]) {
    ctx.fillRect(Math.round(barX + barW * cuarto), Math.round(barY + barH * 0.3), 1, Math.round(barH * 0.4));
  }

  const avance = Math.min(100, Math.max(0, pctBarra));
  const fillW = avance > 0 ? Math.max(barH, (barW * avance) / 100) : 0;
  if (fillW > 0) {
    roundRect(ctx, barX, barY, fillW, barH, barRadio);
    // El degradado va anclado al riel completo: el color dice cuanto queda para el 100,
    // no cuanto mide el relleno (antes, al 20%, el arcoiris entero cabia en ese 20% y la
    // barra parecia completa; ahora la punta solo llega al cian cerca del final).
    const grad = ctx.createLinearGradient(barX, barY, barX + barW, barY);
    grad.addColorStop(0, '#ff0055');
    grad.addColorStop(0.55, '#d946ef');
    grad.addColorStop(1, '#00F0E8');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255, 0, 85, 0.55)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Brillo superior: le da volumen de cristal al relleno sin ensuciar el color.
    const brilloW = fillW - barH;
    if (brilloW > 2) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.fillRect(barX + barRadio, barY + Math.max(1, Math.round(barH * 0.18)), brilloW, Math.max(1, Math.round(barH * 0.2)));
    }

    // Remate luminoso: el borde del avance queda encendido, como el cabezal del medidor.
    ctx.save();
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.shadowBlur = 7;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(barX + fillW - 1.5, barY + 1, 2, barH - 2);
    ctx.restore();
  }

  ctx.restore();

  await cederTurno();

  // 3. SPRITE GRID SECTION (Centrada Vertical y Horizontalmente)
  const gridW = cols * cellW;
  const gridH = rows * cellH;
  const startX = (width - gridW) / 2;
  const startY = headerH + Math.max(8, Math.floor((availH - gridH) / 2));

  // 3.A. QR DEL PIE: esquina inferior derecha, el sitio del hashtag. Se dibuja ANTES de la
  // cuadricula para que, si la ultima fila llega al borde derecho, la ficha quede por encima
  // del codigo (que vive siempre por debajo de la banda del pie) y este quede intacto.
  const footerPadX = Math.round(width * 0.05);
  const qrCajaX = width - footerPadX - qrPieSize - qrPieHueco;
  const qrCajaY = height - qrPieMargen - qrPieCajaH;
  const qrInnerX = qrCajaX + qrPieHueco;
  const qrInnerY = qrCajaY + qrPieHueco;
  const qrSize = qrPieSize;
  const qrCentroX = qrInnerX + qrSize / 2;
  // El dominio de debajo entra siempre: el alto del pie se reserva con qrPieCajaH, que ya
  // cuenta esa linea, asi que el codigo nunca se queda sin su texto de referencia.
  const qrConTexto = qrPieCajaH + qrPieMargen * 2 <= footerH + 1;

  // El codigo va desnudo sobre la plantilla: ni fundido de fondo ni esquinas HUD. Todo lo que
  // se pinte aqui compite con la zona de escaneo, asi que solo baja el QR.
  ctx.save();
  const targetUrl = dominioParaCompartir();
  // El codigo lleva el dominio pelado; la leyenda de abajo sigue mostrando el dominio entero
  // (hostQr sale de targetUrl), asi que el ojo lee 'spritedex.gg' y el escaner lo completa.
  drawModernDotQR(ctx, qrInnerX, qrInnerY, qrSize, textoParaQR(targetUrl));

  if (qrConTexto) {
    let hostQr = 'spritedex.gg';
    try { hostQr = new URL(targetUrl).host.replace(/^www[.]/, ''); } catch {}
    ctx.textAlign = 'center';
    ctx.letterSpacing = '1.5px';
    ctx.font = `900 ${Math.round(10 * escalaPie)}px "Outfit", "Inter", sans-serif`;
    ctx.fillStyle = '#00F0E8';
    ctx.fillText(hostQr, qrCentroX, qrInnerY + qrSize + Math.round(15 * escalaPie));
  }
  ctx.restore();

  // Talla unica de nombre para TODA la lona: la mayor con la que entra hasta el nombre mas
  // exigente (cada uno con su mejor reparto). Antes cada nombre estiraba hasta llenar SU
  // banda y una misma fila mezclaba 21, 23,5 y 25 px; la retícula se lee como una sola.
  const nombreUniforme = (() => {
    const refW = cellW - Math.max(4, Math.round(cellW * 0.035)) * 2;
    const refH = cellH - Math.max(4, Math.round(cellH * 0.035)) * 2;
    const geoRef = geometriaFichaNombre(refW, refH, true);
    let talla = Infinity;
    for (const sprite of spritesList) {
      const fit = getSpriteNameLines(
        ctx,
        pickName(sprite),
        geoRef.maxTextW,
        geoRef.bandaAlto,
        geoRef.objetivo,
        [sprite.familyName, sprite.familyNameEn, sprite.family_name]
      );
      talla = Math.min(talla, fit.fontSize);
    }
    return Number.isFinite(talla) ? Math.max(NOMBRE_MIN_PX, Math.round(talla * 2) / 2) : geoRef.objetivo;
  })();

  for (let idx = 0; idx < spritesList.length; idx++) {
    const tanda = esperasActivas > 0 ? TARJETAS_POR_TANDA_ESPERANDO : TARJETAS_POR_TANDA;
    if (idx > 0 && idx % tanda === 0) await cederTurno();
    const sprite = spritesList[idx];

    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);

    // Si la ultima fila queda incompleta (sin contar el QR), se centra: la cuadricula se
    // lee como composicion y el hueco no queda cargado a un lado.
    const itemsEnFila = Math.min(cols, totalSlotsNeeded - rowIdx * cols);
    const offsetFila = ((cols - itemsEnFila) * cellW) / 2;

    const x = startX + offsetFila + colIdx * cellW;
    const y = startY + rowIdx * cellH;

    const state = userState[sprite.id] || { owned: false, level: 1 };
    const isOwned = Boolean(state.owned);
    const level = state.level || 1;
    const isMastered = isOwned && level === 5;

    const spiritHue = getSpiritHue(sprite);

    // Margen para garantizar canal oscuro limpio ("calle") entre tarjetas vecinas
    const cardMarginX = Math.max(4, Math.round(cellW * 0.035));
    const cardMarginY = Math.max(4, Math.round(cellH * 0.035));
    const cardX = x + cardMarginX;
    const cardY = y + cardMarginY;
    const cardW = cellW - cardMarginX * 2;
    const cardH = cellH - cardMarginY * 2;
    const cornerRadius = Math.min(10, Math.max(5, Math.round(cardW * 0.055)));

    // A. Cyber Tile Container (Renderizado vectorial ultrarrápido sin shadowBlur)
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, cornerRadius);

    // Base oscura con profundidad: mas clara arriba y casi negra abajo. Antes el panel era
    // solo un tinte translucido y, con el arte de temporada detras, se veia sucio.
    const fondoFicha = ctx.createLinearGradient(0, cardY, 0, cardY + cardH);
    fondoFicha.addColorStop(0, 'rgba(16, 19, 36, 0.98)');
    fondoFicha.addColorStop(0.55, 'rgba(8, 10, 22, 0.98)');
    fondoFicha.addColorStop(1, 'rgba(4, 5, 12, 0.98)');
    ctx.fillStyle = fondoFicha;
    ctx.fill();

    // Un solo color de estado para borde, filo y esquinas: nada de tintes por espiritu, que
    // eran los que hacian parecer cada ficha un cuadro de color distinto.
    const colorEstado = isOwned ? '#00F0E8' : '#EF4444';

    // Filo de luz en el borde superior: le da volumen sin ensuciar el contenido.
    ctx.fillStyle = hexToRgba(colorEstado, 0.32);
    ctx.fillRect(cardX + cornerRadius, cardY + 1, cardW - cornerRadius * 2, 1);

    ctx.strokeStyle = hexToRgba(colorEstado, isOwned ? 0.55 : 0.42);
    ctx.lineWidth = isMastered ? 1.5 : 1;
    ctx.stroke();

    // Esquinas tipo HUD: dos trazos en L por esquina, en el color del estado. Sustituyen a
    // los cuatro cuadraditos; mismo coste y la ficha gana caracter.
    const brazo = Math.max(6, Math.min(10, Math.round(cardW * 0.07)));
    const grosorEsquina = Math.max(1.5, Math.min(2.5, cardW * 0.012));
    const margenEsquina = 2;
    ctx.strokeStyle = hexToRgba(colorEstado, isOwned ? 0.80 : 0.55);
    ctx.lineWidth = grosorEsquina;
    ctx.beginPath();
    ctx.moveTo(cardX + margenEsquina, cardY + margenEsquina + brazo);
    ctx.lineTo(cardX + margenEsquina, cardY + margenEsquina);
    ctx.lineTo(cardX + margenEsquina + brazo, cardY + margenEsquina);
    ctx.moveTo(cardX + cardW - margenEsquina - brazo, cardY + margenEsquina);
    ctx.lineTo(cardX + cardW - margenEsquina, cardY + margenEsquina);
    ctx.lineTo(cardX + cardW - margenEsquina, cardY + margenEsquina + brazo);
    ctx.moveTo(cardX + margenEsquina, cardY + cardH - margenEsquina - brazo);
    ctx.lineTo(cardX + margenEsquina, cardY + cardH - margenEsquina);
    ctx.lineTo(cardX + margenEsquina + brazo, cardY + cardH - margenEsquina);
    ctx.moveTo(cardX + cardW - margenEsquina - brazo, cardY + cardH - margenEsquina);
    ctx.lineTo(cardX + cardW - margenEsquina, cardY + cardH - margenEsquina);
    ctx.lineTo(cardX + cardW - margenEsquina, cardY + cardH - margenEsquina - brazo);
    ctx.stroke();
    ctx.restore();

    // B. Proporciones y Geometría Interna Adaptativa (Distribución vertical simétrica y centrada)
    // Tamaños proporcionales a la celda, sin escalones: asi todas las pestañas y cualquier
    // cantidad de espiritus salen con el mismo estilo. Antes habia tres regimenes
    // (normal, compacto y ultra) y el aspecto cambiaba segun cuantos fueran.
    // La cadena de medidas vive en geometriaFichaNombre: la MISMA que midio nombreUniforme
    // antes de dibujar. Aqui solo se ancla a la posicion de la ficha.
    const spriteImg = loadedImagesMap[sprite.id];
    const geo = geometriaFichaNombre(cardW, cardH, !!spriteImg);
    const badgeH = geo.badgeH;
    const badgeY = cardY + geo.badgeY;
    const imgSize = geo.imgSize;
    const imgX = cardX + (cardW - imgSize) / 2;
    const imgY = cardY + geo.imgY;

    if (spriteImg) {
      ctx.save();
      const centerX = imgX + imgSize / 2;
      const centerY = imgY + imgSize / 2;
      const auraRadius = Math.round(imgSize * 0.58);
      const auraGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        Math.round(imgSize * 0.08),
        centerX,
        centerY,
        auraRadius
      );

      if (isOwned) {
        // En atrapados: resplandor en su color, contenido para que acompanie sin gritar.
        const glowColor = isMastered ? '#facc15' : spiritHue;
        auraGrad.addColorStop(0, isMastered ? 'rgba(250, 204, 21, 0.38)' : hexToRgba(glowColor, 0.30));
        auraGrad.addColorStop(0.55, isMastered ? 'rgba(250, 204, 21, 0.14)' : hexToRgba(glowColor, 0.12));
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // Resplandor directo sobre la silueta del espíritu
        const imgShadowBlur = Math.max(8, Math.min(16, Math.round(cardW * 0.07)));
        ctx.shadowColor = hexToRgba(glowColor, isMastered ? 0.80 : 0.65);
        ctx.shadowBlur = imgShadowBlur;
        ctx.drawImage(spriteImg, imgX, imgY, imgSize, imgSize);
        ctx.shadowBlur = 0;
      } else {
        // En NO atrapados: halo tenue (deja ver de que espiritu es la ficha sin devolverle el
        // color al panel) y el espiritu apagado. Antes solo bajaba la opacidad al 85% y casi
        // no se notaba: ahora se le quita el color y el brillo, asi que la ficha se lee como
        // "me falta" de un solo vistazo, sin mirar el borde ni la etiqueta.
        auraGrad.addColorStop(0, hexToRgba(spiritHue, 0.12));
        auraGrad.addColorStop(0.55, hexToRgba(spiritHue, 0.05));
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // El monocromo ya va apagado de por si; el respaldo mantiene la transparencia de
        // antes para que no se vea distinto en quien no tiene mezclas de saturacion.
        ctx.globalAlpha = SOPORTA_MEZCLA_SATURACION ? 1 : ESPIRITU_FALTANTE_ALPHA;
        dibujarEspirituApagado(ctx, spriteImg, imgX, imgY, imgSize);
      }
      ctx.restore();
    }

    // C. Nombre: la banda y su medida llegan ya calculadas por geometriaFichaNombre; aqui
    // solo se elige el reparto y se centra con las metricas reales de la fuente.
    // La TALLA es comun a toda la lona (nombreUniforme): la misma fila ya no mezcla 21,
    // 23,5 y 25 px segun lo que cada nombre pudiera estirarse.
    const maxTextW = geo.maxTextW;
    const bandaTop = cardY + geo.bandaTop;
    const bandaAlto = geo.bandaAlto;
    const objetivoNombre = geo.objetivo;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    // El nombre va SIEMPRE en blanco pleno: talla y brillo identicos en toda la cuadricula
    // (la pertenencia ya la cuentan el borde, el badge y el propio espiritu apagado).
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    const nameFit = getSpriteNameLines(
      ctx,
      pickName(sprite),
      maxTextW,
      bandaAlto,
      objetivoNombre,
      [sprite.familyName, sprite.familyNameEn, sprite.family_name]
    );
    // Talla unica de la lona; el minimo con el propio fit es solo un cinturon por si una
    // ficha sin imagen cambia la banda (caso raro).
    const tamanoNombre = Math.min(nombreUniforme, nameFit.fontSize);
    const medidaNombre = tamanoNombre === nameFit.fontSize
      ? nameFit
      : medirBloqueNombre(ctx, nameFit.lines, tamanoNombre);
    ctx.font = `800 ${tamanoNombre}px "Outfit", "Inter", sans-serif`;

    // Centrado geometrico de la banda con el alto real del bloque (ascendente +
    // descendente + interlineado): la misma distancia al espiritu y a la linea en
    // cualquier tamano, sin tanteos de pixeles.
    const lineHeight = tamanoNombre * NOMBRE_LINE_RATIO;
    const bloqueTop = bandaTop + Math.max(0, (bandaAlto - medidaNombre.alto) / 2);
    const primeraLineaY = bloqueTop + medidaNombre.ascendente;
    for (let f = 0; f < nameFit.lines.length; f += 1) {
      ctx.fillText(nameFit.lines[f], cardX + cardW / 2, primeraLineaY + f * lineHeight);
    }
    ctx.restore();

    // D. Pie de ficha: una linea fina, un punto de estado y el texto en su color. Antes
    // era una pildora rellena que parecia un boton y se comia la tarjeta. El punto va
    // relleno cuando lo tienes y en anillo cuando te falta, para que el estado tambien se
    // distinga sin depender del color.
    const estadoColor = isOwned ? '#00F0E8' : '#EF4444';
    const estadoTexto = isOwned ? t('lona.hackeado') : t('lona.faltante');
    // El texto va por debajo del centro de la banda: centrado quedaba a 5px de la linea
    // y se leia pegada a ella.
    const estadoY = badgeY + badgeH * 0.68;

    ctx.save();
    ctx.fillStyle = isOwned ? 'rgba(0, 240, 232, 0.30)' : 'rgba(239, 68, 68, 0.30)';
    ctx.fillRect(cardX + 6, badgeY, cardW - 12, 1);

    const puntoX = cardX + 13;
    const puntoR = Math.max(2.8, badgeH * 0.18);
    ctx.beginPath();
    ctx.arc(puntoX, estadoY, puntoR, 0, Math.PI * 2);
    if (isOwned) {
      ctx.fillStyle = estadoColor;
      ctx.fill();
    } else {
      ctx.strokeStyle = estadoColor;
      ctx.lineWidth = 1.7;
      ctx.stroke();
    }

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.letterSpacing = '0.6px';

    // El estado y la corona comparten la banda como dos plazas: el estado a la izquierda y
    // la corona al lado opuesto, para leer de un golpe "lo tengo" y "lo tengo maxeado".
    // Donde el texto deja hueco, la corona entra sin tocar nada. En las cuadriculas densas
    // "HACKEADO" se come el 60% de la ficha y no sobra ni un pixel, asi que la corona se
    // reserva su plaza y SOLO el texto de las maxeadas cede lo justo para dejarla pasar.
    // Se hace ficha a ficha a proposito: la otra salida era bajar la talla del estado en
    // TODA la lona, y eso castiga a las 9 de cada 10 fichas que no llevan corona.
    const inicioEstado = puntoX + puntoR + 7;
    const derecha = cardX + cardW - 13;
    const tamanoBase = Math.max(9, Math.min(13, badgeH * 0.62));
    const coronaImg = loadedImagesMap['__corona__'];
    const PISO_ESTADO = 7; // Por debajo de esto el estado deja de leerse.
    const HUECO_ESTADO_CORONA = 5;

    let tamanoEstado = tamanoBase;
    let anchoCorona = 0;
    if (isMastered && coronaImg) {
      ctx.font = `900 ${tamanoBase}px "Outfit", "Inter", sans-serif`;
      const anchoIdeal = ctx.measureText(estadoTexto).width;
      anchoCorona = Math.max(9, Math.min(12, badgeH * 0.60)) * CORONA_ASPECTO;
      const disponible = derecha - inicioEstado;
      if (anchoIdeal + HUECO_ESTADO_CORONA + anchoCorona > disponible) {
        tamanoEstado = tamanoBase * Math.max(
          (disponible - HUECO_ESTADO_CORONA - anchoCorona) / anchoIdeal,
          PISO_ESTADO / tamanoBase
        );
      }
      // La corona se queda lo que sobre tras el texto ya encogido, y si con eso baja del
      // minimo reconocible se queda fuera: antes falta la corona que un estado ilegible.
      ctx.font = `900 ${tamanoEstado}px "Outfit", "Inter", sans-serif`;
      anchoCorona = Math.min(anchoCorona, disponible - HUECO_ESTADO_CORONA - ctx.measureText(estadoTexto).width);
    }
    const altoCorona = anchoCorona / CORONA_ASPECTO;

    ctx.font = `900 ${tamanoEstado}px "Outfit", "Inter", sans-serif`;
    ctx.fillStyle = estadoColor;
    ctx.fillText(estadoTexto, inicioEstado, estadoY);

    // La llevan solo los maxeados: su ausencia es la respuesta para el resto, igual que en
    // la rejilla de la app.
    if (isMastered && coronaImg && altoCorona >= PISO_ESTADO) {
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.95)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetY = 2;
      ctx.translate(derecha - anchoCorona / 2, estadoY);
      ctx.rotate(-CORONA_INCLINACION);
      ctx.drawImage(coronaImg, -anchoCorona / 2, -altoCorona / 2, anchoCorona, altoCorona);
      ctx.restore();
    }
    ctx.restore();
  }

  // 4. PIE: FIRMA A LA IZQUIERDA, EL QR A LA DERECHA
  // Una sola linea al pie: a la izquierda el ID de Fortnite (exactamente como estaba) y a
  // la derecha el QR que bajo de la cuadricula. El texto de marca con el hashtag YA NO SE
  // DIBUJA: sus claves de i18n (lona.marca / lona.marcaMares) se conservan porque el test
  // de paridad entre locales las cuenta, pero quedan sin uso en la lona.
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  const huecoMin = Math.round(24 * escFooter);
  // La firma solo dispone del ancho que deja el bloque del QR.
  const areaFirma = width - footerPadX * 2 - qrPieCajaW - huecoMin;
  const medirTexto = (texto, size, peso) => {
    ctx.font = `${peso} ${size}px "Outfit", "Inter", sans-serif`;
    return ctx.measureText(texto).width;
  };
  const textoFirma = usuario ? t('lona.usuario', { nombre: usuario }) : '';
  // La firma conserva su talla: solo encoge si no entra a la izquierda del QR.
  let tamanioPie = firmaAlto;
  const anchoFirma = usuario ? medirTexto(textoFirma, tamanioPie, 800) : 0;
  if (usuario && anchoFirma > areaFirma) {
    const factor = Math.max(0.55, areaFirma / anchoFirma);
    tamanioPie = Math.max(Math.round(14 * escFooter), Math.floor(tamanioPie * factor));
  }

  const baseFilaY = height - baseFila;
  if (usuario) {
    ctx.textAlign = 'left';
    ctx.font = `800 ${tamanioPie}px "Outfit", "Inter", sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 240, 232, 0.45)';
    ctx.shadowBlur = 10;
    ctx.fillText(textoFirma, footerPadX, baseFilaY);
  }
  ctx.restore();

  // Codificar el PNG de 1280x2515 es la parte mas cara del export (2-6 s en movil),
  // asi que ya no se paga aqui: se entrega el canvas listo y la modal codifica
  // solo cuando hace falta (descargar o compartir).
  return { canvas, encode: () => encodeCanvasToImage(canvas) };
}

// Codifica el canvas de la captura. Se usa JPEG en vez de PNG por dos razones
// medidas sobre la captura real (1280x2515): pesa 2,8 veces menos (718 KB frente a
// 1,99 MB) y codifica antes (1,37 s frente a 1,59 s con CPU tipo movil), sin
// diferencia visible a 1:1. WebP seria 7 veces mas rapido y 5 veces mas liviano,
// pero Telegram lo entrega como sticker; JPEG llega como foto en WhatsApp y Telegram.
export const EXPORT_IMAGE_TYPE = 'image/jpeg';
export const EXPORT_IMAGE_QUALITY = 0.92;

export function encodeCanvasToImage(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const filename = `spritedex_${Date.now()}.jpg`;
      if (blob) {
        const file = new File([blob], filename, { type: EXPORT_IMAGE_TYPE });
        const blobUrl = URL.createObjectURL(blob);
        resolve({
          dataUrl: blobUrl,
          blobUrl,
          blob,
          file
        });
      } else {
        const dataUrl = canvas.toDataURL(EXPORT_IMAGE_TYPE, EXPORT_IMAGE_QUALITY);
        resolve({
          dataUrl,
          blobUrl: dataUrl,
          blob: null,
          file: null
        });
      }
    }, EXPORT_IMAGE_TYPE, EXPORT_IMAGE_QUALITY);
  });
}

// ---------------------------------------------------------------------------
// Cache en disco (Cache Storage) de la captura ya codificada. Asi la segunda
// visita no redibuja ni recodifica: la captura esta lista al abrir la modal.
// ---------------------------------------------------------------------------
const EXPORT_CACHE_NAME = 'spritedex-export-v1';
const EXPORT_CACHE_MAX = 8;

// Generaciones en vuelo, por clave. La precarga en reposo y la modal piden la misma
// captura: sin esto cada una generaba la suya y las dos competian por la CPU del
// telefono, que es justo lo que hacia que en produccion tardara mas que en local.
const capturasEnVuelo = new Map();

export function getOrStartCapture(key, crear) {
  const enVuelo = capturasEnVuelo.get(key);
  if (enVuelo) return enVuelo;
  const trabajo = Promise.resolve().then(crear).finally(() => capturasEnVuelo.delete(key));
  capturasEnVuelo.set(key, trabajo);
  return trabajo;
}

function hasExportCache() {
  return typeof caches !== 'undefined' && typeof Response !== 'undefined' && typeof URL !== 'undefined';
}

export async function readCachedCapture(key) {
  if (!hasExportCache() || !key) return null;
  try {
    const cache = await caches.open(EXPORT_CACHE_NAME);
    const hit = await cache.match(key);
    if (!hit) return null;
    const blob = await hit.blob();
    if (!blob || blob.size === 0) return null;
    return {
      blob,
      file: new File([blob], `spritedex_${Date.now()}.jpg`, { type: EXPORT_IMAGE_TYPE }),
      url: URL.createObjectURL(blob)
    };
  } catch {
    return null;
  }
}

export async function writeCachedCapture(key, blob) {
  if (!hasExportCache() || !key || !blob || blob.size === 0) return;
  try {
    const cache = await caches.open(EXPORT_CACHE_NAME);
    await cache.put(key, new Response(blob, { headers: { 'Content-Type': EXPORT_IMAGE_TYPE } }));
    // Cada cambio de progreso estrena clave, asi que solo se conservan las ultimas.
    const keys = await cache.keys();
    for (let i = 0; i < keys.length - EXPORT_CACHE_MAX; i += 1) {
      await cache.delete(keys[i]);
    }
  } catch {
    // Sin Cache Storage (http no seguro o modo privado) la app funciona igual: solo no persiste.
  }
}
