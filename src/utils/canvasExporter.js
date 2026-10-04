// HTML5 Canvas Exporter for Social Media - Estilo Oficial GLITCH / OVERRIDE
// Inspirado en el diseño 'CHAPTER 7 | SEASON 4: OVERRIDE' de Fortnite
// Extension explicita: Vite resuelve igual, y asi el modulo tambien carga en Node
// (el runner de pruebas nativo no completa extensiones).
import { generateQRMatrix } from './qrGenerator.js';
import { t } from '../i18n/texto.js';
import { pickName } from './spriteName.js';
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

    // 1. Dibuja los 3 patrones de detección de posición con geometría ISO estándar para reconocimiento instantáneo de cámara
    const drawFinderPattern = (startX, startY) => {
      // Anillo exterior 7x7 en cian neón
      ctx.fillStyle = '#00F0E8';
      ctx.fillRect(startX, startY, 7 * cellSize, 7 * cellSize);
      // Espacio intermedio 5x5 oscuro
      ctx.fillStyle = '#060a14';
      ctx.fillRect(startX + cellSize, startY + cellSize, 5 * cellSize, 5 * cellSize);
      // Núcleo central 3x3 en cian neón
      ctx.fillStyle = '#00F0E8';
      ctx.fillRect(startX + 2 * cellSize, startY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawFinderPattern(qrX, qrY); // Superior izquierdo
    drawFinderPattern(qrX + (count - 7) * cellSize, qrY); // Superior derecho
    drawFinderPattern(qrX, qrY + (count - 7) * cellSize); // Inferior izquierdo

    // 2. Dibuja todos los módulos de datos como puntos circulares de alto contraste en un solo pase
    const dotRadius = cellSize * 0.44;
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
export function getCanvasCacheKey(format = DEFAULT_EXPORT_FORMAT, bgStyle = DEFAULT_EXPORT_BG_STYLE, count = 0, ownedCount = 0, spritesList = [], userState = {}, usuario = '') {
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
  return `v36_${format}_${bgStyle}_${count}_${ownedCount}_${usuario || 'sin'}__${hash}`;
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
  return base || (sprite.gen === 2 ? `/sprites/${sprite.id}.webp` : `/sprites/${sprite.id}.png`);
}

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
    const processBatch = () => {
      if (miTurno !== turnoPrecarga) return;
      if (index >= spritesList.length) return;
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
      }
    };

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
  usuario = '' // nombre de Fortnite del duenno: se pinta en el pie, junto al QR
}) {
  const effectiveBgStyle = bgStyle || (useBackgroundTemplate ? 'glitch_override' : 'dark_matrix');
  const ownedCount = spritesList.filter(s => userState[s.id]?.owned).length;
  const firma = String(usuario || '').trim();
  const cacheKey = getCanvasCacheKey(format, effectiveBgStyle, spritesList.length, ownedCount, spritesList, userState, firma);

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
    ...Array.from({ length: Math.min(concurrencia, lista.length) }, cargarSprite)
  ]);

  const result = await renderGlitchOverrideTemplate({
    spritesList,
    userState,
    format,
    bgStyle: effectiveBgStyle,
    loadedImagesMap,
    usuario: firma
  });

  globalCanvasCache.set(cacheKey, result);
  return result;
}

// Ajusta nombres inspirándose en el diseño de alta calidad de la app (Imagen 2):
// - Tipografía Outfit bold/extrabold
// - Nombres con variante larga "Hacker de Botín" se dividen en 2 líneas equilibradas (Espíritu arriba, Hacker de Botín abajo)
// - Mantiene el tamaño tipográfico grande y legible (sin comprimir a 7px en 1 línea)
// - Cero truncado (...)
function getSpriteNameLines(ctx, fullName, maxW, baseFontSize, familyName) {
  if (!fullName) return { lines: [''], fontSize: baseFontSize };

  // 1. Variante larga "Hacker de Botín" (inspirado directamente en la tarjeta de la app - Imagen 2)
  if (fullName.includes('Hacker de Botín')) {
    const prefix = fullName.replace('Hacker de Botín', '').trim();
    const l1 = prefix || 'Espíritu';
    const l2 = 'Hacker de Botín';

    for (let s = baseFontSize; s >= 8; s -= 0.5) {
      ctx.font = `800 ${s}px "Outfit", "Inter", sans-serif`;
      if (ctx.measureText(l1).width <= maxW && ctx.measureText(l2).width <= maxW) {
        return { lines: [l1, l2], fontSize: s };
      }
    }
    return { lines: [l1, l2], fontSize: 8 };
  }

  // 2. Variante con familia conocida (si no entra holgadamente en 1 línea a tamaño completo)
  if (familyName && fullName.startsWith(familyName)) {
    const variantPart = fullName.slice(familyName.length).trim();
    if (variantPart) {
      // Probar si entra cómodamente en 1 línea a tamaño completo con margen generoso (14px)
      ctx.font = `800 ${baseFontSize}px "Outfit", "Inter", sans-serif`;
      if (ctx.measureText(fullName).width <= maxW - 14) {
        return { lines: [fullName], fontSize: baseFontSize };
      }

      // Si no entra holgadamente, dividir como en la app: Familia arriba, Variante abajo
      for (let s = baseFontSize; s >= 8; s -= 0.5) {
        ctx.font = `800 ${s}px "Outfit", "Inter", sans-serif`;
        if (ctx.measureText(familyName).width <= maxW && ctx.measureText(variantPart).width <= maxW) {
          return { lines: [familyName, variantPart], fontSize: s };
        }
      }
      return { lines: [familyName, variantPart], fontSize: 8 };
    }
  }

  // 3. Probar en 1 sola línea con tamaño base completo (sin apretar)
  ctx.font = `800 ${baseFontSize}px "Outfit", "Inter", sans-serif`;
  if (ctx.measureText(fullName).width <= maxW - 10) {
    return { lines: [fullName], fontSize: baseFontSize };
  }

  // 4. Si tiene múltiples palabras y no cabe cómodamente en 1 línea, dividir en 2 líneas equilibradas
  const words = fullName.split(' ');
  if (words.length > 1) {
    let bestL1 = '';
    let bestL2 = '';
    let bestDiff = Infinity;

    for (let i = 1; i < words.length; i++) {
      const l1 = words.slice(0, i).join(' ');
      const l2 = words.slice(i).join(' ');
      const diff = Math.abs(l1.length - l2.length);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestL1 = l1;
        bestL2 = l2;
      }
    }

    for (let s = baseFontSize; s >= 8; s -= 0.5) {
      ctx.font = `800 ${s}px "Outfit", "Inter", sans-serif`;
      if (ctx.measureText(bestL1).width <= maxW && ctx.measureText(bestL2).width <= maxW) {
        return { lines: [bestL1, bestL2], fontSize: s };
      }
    }
    return { lines: [bestL1, bestL2], fontSize: 8 };
  }

  // 5. Si es una sola palabra muy larga, reducir tamaño suavemente
  for (let s = baseFontSize; s >= 7; s -= 0.5) {
    ctx.font = `800 ${s}px "Outfit", "Inter", sans-serif`;
    if (ctx.measureText(fullName).width <= maxW) {
      return { lines: [fullName], fontSize: s };
    }
  }

  return { lines: [fullName], fontSize: 7 };
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
  usuario = ''
}) {
  const canvas = document.createElement('canvas');
  const totalSprites = spritesList.length;
  const ownedCount = spritesList.filter(s => userState[s.id]?.owned).length;
  const pctOwned = totalSprites > 0 ? Math.round((ownedCount / totalSprites) * 100) : 0;

  const totalSlotsNeeded = totalSprites + 1; // Reserva espacio para el código QR
  const isSquare = format === 'square';

  let width = 1080;
  let height = 1520;
  let cols = 6;
  let cellH;
  // En temporada el encabezado lleva el logo real de Fortnitemares, que necesita mas alto.
  const enTemporada = isFortnitemaresActive();
  let headerH = enTemporada ? 265 : 195;
  let footerH = 45;
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
      footerH = 45;
    } else if (totalSprites <= 68) {
      width = 1600;
      height = 1600;
      headerH = 165;
      footerH = 45;
    } else {
      // Colecciones grandes (como los 117 de Gen 1)
      width = 1800;
      height = 1800;
      headerH = 160;
      footerH = 42;
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

  // En temporada el encabezado lleva el logo real y necesita su sitio. Se calcula con las
  // MISMAS proporciones con las que luego se dibuja, para que nunca tape la capsula ni la
  // barra de progreso: en el formato cuadrado su propio alto fijo pisaba este calculo.
  if (enTemporada) {
    const u = Math.min(1.15, anchoDiseno / 1200);
    const logoAlto = Math.round((anchoDiseno * 0.5) / 3); // el SVG es 3:1
    const altoNecesario = Math.round(30 * u) + logoAlto + Math.round(14 * u) + Math.round(22 * u) + Math.round(8 * u) + Math.round(36 * u) + 16;
    headerH = Math.max(headerH, altoNecesario);
  }

  const rows = Math.max(1, Math.ceil(totalSlotsNeeded / cols));
  let cellW = Math.floor((anchoDiseno - paddingX * 2) / cols);

  // Con pocos espiritus la celda se inflaba (2 columnas de 504 px) y las fichas salian
  // gigantes al lado del titulo. En vertical el ancho de celda lleva techo: como mucho el
  // que usa una cuadricula tipica de 4 columnas, que es el tamano con el que se ve la
  // ficha en el resto de plantillas.
  const CELDA_MAX_VERTICAL = 270;
  if (!isSquare) {
    cellW = Math.min(cellW, CELDA_MAX_VERTICAL);

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
  const logoMares = enTemporada ? loadedImagesMap['__logo_mares__'] : null;
  let titleY;

  if (logoMares) {
    const logoW = Math.min(Math.round(anchoDiseno * 0.5), width - paddingX * 2);
    const proporcion = logoMares.naturalWidth ? (logoMares.naturalHeight / logoMares.naturalWidth) : (1 / 3);
    const logoH = Math.round(logoW * proporcion);
    const logoY = Math.round(30 * Math.min(1.15, scale));

    // El SVG oficial es relleno negro con contorno neon: sobre el fondo oscuro de la lona
    // el relleno se pierde. Se usa como mascara y se pinta con un degradado claro, asi el
    // wordmark se lee igual que en la key art (que va sobre magenta).
    const capaLogo = document.createElement('canvas');
    capaLogo.width = logoW;
    capaLogo.height = logoH;
    const ctxLogo = capaLogo.getContext('2d');
    ctxLogo.drawImage(logoMares, 0, 0, logoW, logoH);
    ctxLogo.globalCompositeOperation = 'source-in';
    const gradLogo = ctxLogo.createLinearGradient(0, 0, 0, logoH);
    gradLogo.addColorStop(0, '#ffffff');
    gradLogo.addColorStop(0.55, '#f5d0fe');
    gradLogo.addColorStop(1, '#e879f9');
    ctxLogo.fillStyle = gradLogo;
    ctxLogo.fillRect(0, 0, logoW, logoH);

    ctx.save();
    ctx.shadowColor = 'rgba(232, 121, 249, 0.45)';
    ctx.shadowBlur = 18;
    ctx.drawImage(capaLogo, (width - logoW) / 2, logoY);
    ctx.restore();
    titleY = logoY + logoH;
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
  const capsuleY = titleY + Math.round(14 * Math.min(1.1, scale));

  roundRect(ctx, capsuleX, capsuleY, capsuleW, capsuleH, 5);
  const capsuleGrad = ctx.createLinearGradient(capsuleX, capsuleY, capsuleX + capsuleW, capsuleY);
  capsuleGrad.addColorStop(0, '#ff0055');
  capsuleGrad.addColorStop(1, '#d90429');
  ctx.fillStyle = capsuleGrad;
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(capsuleText, width / 2, capsuleY + Math.round(15 * Math.min(1.15, scale)));

  // HUD Status Bar: "X/Y Espíritus atrapados" | "PROGRESO: X%"
  const hudW = Math.min(width - paddingX * 2 - 30, Math.round(580 * Math.min(1.25, scale)));
  const hudH = Math.round(36 * Math.min(1.15, scale));
  const hudX = (width - hudW) / 2;
  const hudY = capsuleY + capsuleH + Math.round(8 * Math.min(1.1, scale));

  // HUD Frame Border
  ctx.strokeStyle = 'rgba(0, 240, 232, 0.55)';
  ctx.lineWidth = 1;
  roundRect(ctx, hudX, hudY, hudW, hudH, 4);
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

  // HUD Text
  const hudTextY = hudY + Math.round(18 * Math.min(1.15, scale));
  ctx.textAlign = 'left';
  ctx.font = `900 ${Math.round(12 * Math.min(1.15, scale))}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = '#ff0055';
  ctx.fillText(`${ownedCount} / ${totalSprites}`, hudX + 14, hudTextY);
  ctx.font = `700 ${Math.round(10 * Math.min(1.15, scale))}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(t('lona.atrapados'), hudX + 14 + ctx.measureText(`${ownedCount} / ${totalSprites} `).width + 4, hudTextY);

  ctx.textAlign = 'right';
  ctx.font = `900 ${Math.round(11 * Math.min(1.15, scale))}px "Outfit", "Inter", sans-serif`;
  ctx.fillStyle = '#00F0E8';
  ctx.fillText(t('lona.progreso', { pct: pctOwned }), hudX + hudW - 14, hudTextY);

  // Neon Progress Bar inside HUD
  const barX = hudX + 14;
  const barH = Math.round(6 * Math.min(1.15, scale));
  const barY = hudY + hudH - barH - 5;
  const barW = hudW - 28;

  roundRect(ctx, barX, barY, barW, barH, 3);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();

  const fillW = Math.max(barH, (barW * Math.min(100, Math.max(0, pctOwned))) / 100);
  if (fillW > 0) {
    roundRect(ctx, barX, barY, fillW, barH, 3);
    const grad = ctx.createLinearGradient(barX, barY, barX + fillW, barY);
    grad.addColorStop(0, '#ff0055');
    grad.addColorStop(0.7, '#ec4899');
    grad.addColorStop(1, '#00F0E8');
    ctx.fillStyle = grad;
    ctx.shadowColor = 'rgba(255, 0, 85, 0.65)';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  ctx.restore();

  await cederTurno();

  // 3. SPRITE GRID SECTION (Centrada Vertical y Horizontalmente)
  const gridW = cols * cellW;
  const gridH = rows * cellH;
  const startX = (width - gridW) / 2;
  const startY = headerH + Math.max(8, Math.floor((availH - gridH) / 2));


  for (let idx = 0; idx < spritesList.length; idx++) {
    const tanda = esperasActivas > 0 ? TARJETAS_POR_TANDA_ESPERANDO : TARJETAS_POR_TANDA;
    if (idx > 0 && idx % tanda === 0) await cederTurno();
    const sprite = spritesList[idx];

    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);

    const x = startX + colIdx * cellW;
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
    const badgeH = Math.max(16, Math.min(28, Math.round(cardH * 0.15)));
    const bottomGutter = Math.max(8, Math.min(13, Math.round(cardH * 0.045)));
    const badgeY = cardY + cardH - badgeH - bottomGutter;

    // 2. Zona de Nombre: Bounding box simétrico con gap limpio sobre el badge (nombre bajado un poco)
    const gapNameBadge = Math.max(3, Math.min(5, Math.round(cardH * 0.018)));
    const nameZoneH = Math.max(28, Math.min(50, Math.round(cardH * 0.24)));
    const nameZoneBottom = badgeY - gapNameBadge;
    const nameZoneTop = nameZoneBottom - nameZoneH;

    // 3. Zona del Espíritu: Tamaño aumentado un poquito y centrado en el espacio superior
    const spriteZoneH = Math.max(36, nameZoneTop - cardY);
    const imgSize = Math.max(
      36,
      Math.min(
        Math.floor(cardW * 0.62),
        Math.floor(spriteZoneH * 0.80)
      )
    );
    const imgX = cardX + (cardW - imgSize) / 2;
    const imgY = cardY + Math.floor((spriteZoneH - imgSize) / 2);

    const spriteImg = loadedImagesMap[sprite.id];

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
        // En NO atrapados: el mismo resplandor, mas tenue: es lo que permite distinguir de un
        // vistazo de que espiritu es cada ficha sin volver a pintar el panel de color.
        auraGrad.addColorStop(0, hexToRgba(spiritHue, 0.18));
        auraGrad.addColorStop(0.55, hexToRgba(spiritHue, 0.07));
        auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = auraGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.85;
        ctx.drawImage(spriteImg, imgX, imgY, imgSize, imgSize);
      }
      ctx.restore();
    }

    // C. Nombre: mas grande y anclado abajo, de modo que las fichas queden alineadas
    // entre si. Antes cada nombre se centraba en su zona y, con una o dos lineas, los
    // bloques bailaban de una tarjeta a otra.
    const baseNameFontSize = Math.max(
      10,
      Math.min(
        16,
        // Proporcional al ancho de la celda (0.072): asi una tarjeta pequena no lleva un
        // nombre casi tan grande como una grande, que es lo que pasaba con el tope a 18.
        Math.floor(cardW * 0.072)
      )
    );

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = isOwned ? '#ffffff' : 'rgba(255, 255, 255, 0.86)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1;

    const maxTextW = cardW - 10;
    const nameFit = getSpriteNameLines(
      ctx,
      pickName(sprite),
      maxTextW,
      baseNameFontSize,
      sprite.familyNameEn || sprite.familyName || sprite.family_name
    );
    ctx.font = `800 ${nameFit.fontSize}px "Outfit", "Inter", sans-serif`;

    const lineHeight = Math.round(nameFit.fontSize * 1.1);
    // Aire tambien por arriba: el nombre quedaba a 4px de la linea.
    const ultimaLineaY = badgeY - Math.max(12, Math.round(nameFit.fontSize * 0.7));
    if (nameFit.lines.length === 1) {
      ctx.fillText(nameFit.lines[0], cardX + cardW / 2, ultimaLineaY);
    } else {
      ctx.fillText(nameFit.lines[0], cardX + cardW / 2, ultimaLineaY - lineHeight);
      ctx.fillText(nameFit.lines[1], cardX + cardW / 2, ultimaLineaY);
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
    ctx.font = `900 ${Math.max(9, Math.min(13, badgeH * 0.62))}px "Outfit", "Inter", sans-serif`;
    ctx.letterSpacing = '0.6px';
    ctx.fillStyle = estadoColor;
    ctx.fillText(estadoTexto, puntoX + puntoR + 7, estadoY);
    ctx.restore();
  }

  // Un respiro antes del bloque del QR y la marca de agua.
  await cederTurno();

  // 3.B. CÓDIGO QR DE PUNTOS MODERNO (Centrado en el último slot)
  const qrColIdx = cols - 1;
  const qrRowIdx = rows - 1;
  const qrCardMarginX = Math.max(4, Math.round(cellW * 0.035));
  const qrCardMarginY = Math.max(4, Math.round(cellH * 0.035));
  const qrCardX = startX + qrColIdx * cellW + qrCardMarginX;
  const qrCardY = startY + qrRowIdx * cellH + qrCardMarginY;
  const qrCardW = cellW - qrCardMarginX * 2;
  const qrCardH = cellH - qrCardMarginY * 2;

  const qrSize = Math.min(qrCardW - 14, qrCardH - 14, 180);
  const qrInnerX = qrCardX + (qrCardW - qrSize) / 2;
  const qrInnerY = qrCardY + (qrCardH - qrSize) / 2;

  ctx.save();
  const targetUrl = dominioParaCompartir();
  drawModernDotQR(ctx, qrInnerX, qrInnerY, qrSize, targetUrl);
  ctx.restore();

  // 4. FOOTER WATERMARK
  // La firma va justo encima de la marca de agua y debajo del QR: es el unico sitio que no
  // compite ni con la cuadricula ni con el header, y queda al lado del codigo que lleva a
  // la coleccion. Si el nombre es largo, se reduce el tamano hasta que entra.
  if (usuario) {
    ctx.save();
    ctx.textAlign = 'center';
    const limite = width * 0.7;
    let firmaSize = Math.round(13 * (anchoDiseno / 1200));
    const textoFirma = t('lona.usuario', { nombre: usuario });
    ctx.font = `800 ${firmaSize}px "Outfit", "Inter", sans-serif`;
    while (firmaSize > 9 && ctx.measureText(textoFirma).width > limite) {
      firmaSize -= 1;
      ctx.font = `800 ${firmaSize}px "Outfit", "Inter", sans-serif`;
    }
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 240, 232, 0.45)';
    ctx.shadowBlur = 8;
    ctx.fillText(textoFirma, width / 2, height - 34);
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(12 * (anchoDiseno / 1200))}px "Outfit", "Inter", monospace, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 6;
  ctx.fillText(enTemporada ? t('lona.marcaMares') : t('lona.marca'), width / 2, height - 16);
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
