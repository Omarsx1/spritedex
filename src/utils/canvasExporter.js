// HTML5 Canvas Exporter for Social Media - Estilo Oficial GLITCH / OVERRIDE
// Inspirado en el diseño 'CHAPTER 7 | SEASON 4: OVERRIDE' de Fortnite
import { generateQRMatrix } from './qrGenerator';

// Caché en memoria de matriz QR para evitar recalcular polinomios en cada exportación
let cachedQRMatrix = null;
function getCachedQR(url) {
  if (!cachedQRMatrix) {
    cachedQRMatrix = generateQRMatrix(url);
  }
  return cachedQRMatrix;
}

// Renderiza un código QR moderno con estilo de puntos/círculos y acentos cibernéticos (100% escaneable)
function drawModernDotQR(ctx, qrX, qrY, qrSize, url = 'https://spritedex-two.vercel.app/') {
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

// Clave canónica unificada para caché de plantillas de canvas (0ms instantáneo)
export function getCanvasCacheKey(format = 'checklist', bgStyle = 'glitch_override', count = 0, ownedCount = 0) {
  return `${format}_${bgStyle}_${count}_${ownedCount}`;
}

// Helper to pre-load image for canvas drawing with instantaneous in-memory caching
export function loadImage(src) {
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
    for (let i = 0; i < document.images.length; i++) {
      const domImg = document.images[i];
      if (domImg && domImg.complete && domImg.naturalWidth > 0) {
        if (domImg.src === src || domImg.getAttribute('src') === src || domImg.src.endsWith(src)) {
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

// Precarga anticipada de recursos por lotes en reposo (idle) sin saturar la red ni bloquear el hilo
export function preloadCanvasAssets(spritesList = [], batchSize = 6) {
  if (typeof window === 'undefined') return;
  loadImage('/background.webp');

  if (Array.isArray(spritesList) && spritesList.length > 0) {
    let index = 0;
    const processBatch = () => {
      if (index >= spritesList.length) return;
      const slice = spritesList.slice(index, index + batchSize);
      index += batchSize;
      slice.forEach(s => {
        if (s && s.image) loadImage(s.image);
      });
      if (index < spritesList.length) {
        if (window.requestIdleCallback) {
          window.requestIdleCallback(processBatch, { timeout: 1500 });
        } else {
          setTimeout(processBatch, 120);
        }
      }
    };

    if (window.requestIdleCallback) {
      window.requestIdleCallback(processBatch, { timeout: 2000 });
    } else {
      setTimeout(processBatch, 150);
    }
  }
}

// Precarga de fondo al inicializar el módulo
if (typeof window !== 'undefined') {
  if (window.requestIdleCallback) {
    window.requestIdleCallback(() => loadImage('/background.webp'));
  } else {
    setTimeout(() => loadImage('/background.webp'), 50);
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

export async function generatePokedexCardImage({
  spritesList,
  userState,
  format = 'checklist', // 'checklist', 'square'
  bgStyle = 'glitch_override', // 'glitch_override', 'blueprint', 'dark_matrix'
  useBackgroundTemplate = true
}) {
  const effectiveBgStyle = bgStyle || (useBackgroundTemplate ? 'glitch_override' : 'dark_matrix');
  const ownedCount = spritesList.filter(s => userState[s.id]?.owned).length;
  const cacheKey = getCanvasCacheKey(format, effectiveBgStyle, spritesList.length, ownedCount);

  // 1. Devolución instantánea a 0ms si la plantilla ya fue generada previamente
  if (globalCanvasCache.has(cacheKey)) {
    return globalCanvasCache.get(cacheKey);
  }

  const loadedImagesMap = {};

  // Load official glitch wallpaper
  const bgImgPromise = loadImage('/background.webp');

  await Promise.all([
    bgImgPromise.then((img) => {
      if (img) loadedImagesMap['__bg_override__'] = img;
    }),
    ...spritesList.slice(0, 250).map(async (s) => {
      const img = await loadImage(s.image);
      if (img) loadedImagesMap[s.id] = img;
    })
  ]);

  const result = await renderGlitchOverrideTemplate({
    spritesList,
    userState,
    format,
    bgStyle: effectiveBgStyle,
    loadedImagesMap
  });

  globalCanvasCache.set(cacheKey, result);
  return result;
}

// -------------------------------------------------------------
// Renders the GLITCH / OVERRIDE style template
// Adaptación geométrica matemática simétrica para cualquier cantidad de espíritus (Gen 1, Gen 2, etc.)
// -------------------------------------------------------------
function renderGlitchOverrideTemplate({
  spritesList,
  userState,
  format,
  bgStyle,
  loadedImagesMap
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
  let headerH = 195;
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
    if (totalSprites <= 5) cols = 3;
    else if (totalSprites <= 11) cols = 3;
    else if (totalSprites <= 19) cols = 4;
    else if (totalSprites <= 35) cols = 6; // Caso ideal Imagen 3 (6x6 = 36)
    else if (totalSprites <= 63) cols = 8; // Caso ideal Imagen 2 (8x8 = 64)
    else cols = Math.max(8, Math.ceil(Math.sqrt(totalSlotsNeeded))); // 11x11 para 117
  } else {
    // Formato Vertical (📱 Checklist / Poster móvil)
    if (totalSprites <= 8) {
      cols = 4;
      width = 1080;
    } else if (totalSprites <= 18) {
      cols = 5;
      width = 1080;
    } else if (totalSprites <= 70) {
      cols = 6;
      width = 1080; // Caso ideal Imagen 4 (61 espíritus)
    } else {
      // Colecciones grandes en vertical (p.ej. 117 de Gen 1): 8 columnas
      cols = 8;
      width = 1280;
    }
  }

  const rows = Math.max(1, Math.ceil(totalSlotsNeeded / cols));
  const availW = width - paddingX * 2;
  const cellW = Math.floor(availW / cols);

  let cellH;
  if (!isSquare) {
    const desiredCellH = totalSprites > 70 ? 175 : 190;
    height = headerH + rows * desiredCellH + footerH;
    cellH = desiredCellH;
  } else {
    // En formato cuadrado 1:1, distribuimos el espacio vertical simétricamente
    cellH = Math.floor((height - headerH - footerH) / rows);
  }

  const availH = height - headerH - footerH;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Draw Background (Glitch / Matrix / Blueprint)
  const bgImg = loadedImagesMap['__bg_override__'];
  drawCyberMatrixBackground(ctx, width, height, bgStyle, bgImg);

  // 2. HEADER SECTION (GLITCH OVERRIDE STYLE)
  ctx.save();
  const scale = width / 1200;

  // Top Small Header: "FORTNITE , NUEVOS"
  ctx.font = `900 ${Math.round(14 * Math.min(1.2, scale))}px "Inter", "Arial Black", sans-serif`;
  ctx.fillStyle = '#00F0E8';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.shadowColor = 'rgba(0, 240, 232, 0.7)';
  ctx.shadowBlur = 8;
  const topTextY = Math.round(34 * Math.min(1.15, scale));
  ctx.fillText('FORTNITE , NUEVOS', width / 2, topTextY);

  // Main Big Title: "SPRITEDEX OVERRIDE"
  const titleText = 'SPRITEDEX OVERRIDE';
  const baseTitleFontSize = isSquare ? (cols >= 8 ? 44 : 48) : 52;
  const titleFontSize = Math.round(baseTitleFontSize * Math.min(1.22, Math.max(0.9, scale)));
  ctx.font = `900 ${titleFontSize}px "Burbank Big Condensed", "Impact", "Arial Black", sans-serif`;

  const titleY = topTextY + Math.round(50 * Math.min(1.15, scale));

  // Chromatic Aberration Shadows
  ctx.fillStyle = '#00F0E8';
  ctx.fillText(titleText, width / 2 + 3, titleY);

  ctx.fillStyle = '#ff0055';
  ctx.fillText(titleText, width / 2 - 3, titleY);

  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 14;
  ctx.fillText(titleText, width / 2, titleY);
  ctx.shadowBlur = 0;

  // Tagline Pill Capsule: "ROMPE LAS REGLAS • CAMBIA EL JUEGO"
  const capsuleText = 'ROMPE LAS REGLAS • CAMBIA EL JUEGO';
  const capsuleFontSize = Math.round(10.5 * Math.min(1.15, scale));
  ctx.font = `900 ${capsuleFontSize}px "Inter", "Arial Black", sans-serif`;
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
  const hudW = Math.min(availW - 30, Math.round(580 * Math.min(1.25, scale)));
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
  ctx.font = `900 ${Math.round(12 * Math.min(1.15, scale))}px "Inter", sans-serif`;
  ctx.fillStyle = '#ff0055';
  ctx.fillText(`${ownedCount} / ${totalSprites}`, hudX + 14, hudTextY);
  ctx.font = `700 ${Math.round(10 * Math.min(1.15, scale))}px "Inter", sans-serif`;
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(' espíritus atrapados', hudX + 14 + ctx.measureText(`${ownedCount} / ${totalSprites} `).width + 4, hudTextY);

  ctx.textAlign = 'right';
  ctx.font = `900 ${Math.round(11 * Math.min(1.15, scale))}px "Inter", sans-serif`;
  ctx.fillStyle = '#00F0E8';
  ctx.fillText(`PROGRESO ${pctOwned}%`, hudX + hudW - 14, hudTextY);

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

  // 3. SPRITE GRID SECTION (Centrada Vertical y Horizontalmente)
  const gridW = cols * cellW;
  const gridH = rows * cellH;
  const startX = (width - gridW) / 2;
  const startY = headerH + Math.max(8, Math.floor((availH - gridH) / 2));

  const isCompact = cols >= 8;
  const isUltraCompact = cols >= 10;

  spritesList.forEach((sprite, idx) => {
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
    if (isOwned) {
      ctx.fillStyle = isMastered
        ? 'rgba(234, 179, 8, 0.16)'
        : hexToRgba(spiritHue, 0.12);
      ctx.fill();
      ctx.strokeStyle = isMastered
        ? 'rgba(234, 179, 8, 0.85)'
        : hexToRgba(spiritHue, 0.65);
      ctx.lineWidth = isMastered ? 1.5 : 1;
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fill();
      ctx.strokeStyle = hexToRgba(spiritHue, 0.28);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Corner pixel ticks con el color del espíritu
    const tickSize = Math.max(2, Math.min(4, Math.round(cardW * 0.025)));
    ctx.fillStyle = isOwned ? (isMastered ? '#facc15' : spiritHue) : hexToRgba(spiritHue, 0.50);
    ctx.fillRect(cardX + 2, cardY + 2, tickSize, tickSize);
    ctx.fillRect(cardX + cardW - 2 - tickSize, cardY + 2, tickSize, tickSize);
    ctx.fillRect(cardX + 2, cardY + cardH - 2 - tickSize, tickSize, tickSize);
    ctx.fillRect(cardX + cardW - 2 - tickSize, cardY + cardH - 2 - tickSize, tickSize, tickSize);
    ctx.restore();

    // B. Proporciones y Centrado Vertical Dinámico
    const imgSize = Math.max(
      36,
      Math.min(
        Math.floor(cardW * 0.62),
        Math.floor(cardH * (isUltraCompact ? 0.50 : 0.52))
      )
    );

    const nameFontSize = Math.max(
      8,
      Math.min(
        isUltraCompact ? 9 : (isCompact ? 10.5 : 12),
        Math.floor(cardW * 0.08)
      )
    );

    const badgeH = isUltraCompact ? 14 : Math.max(16, Math.min(22, Math.round(cardH * 0.135)));
    const badgeW = Math.max(46, Math.min(cardW - 14, Math.round(cardW * (isUltraCompact ? 0.88 : 0.82))));
    const badgeFontSize = isUltraCompact ? 7.5 : Math.max(8, Math.min(10, badgeH * 0.50));

    const gapImgText = isUltraCompact ? 3 : Math.max(4, Math.round(cardH * 0.035));
    const gapTextBadge = isUltraCompact ? 3 : Math.max(4, Math.round(cardH * 0.03));

    const totalContentH = imgSize + gapImgText + nameFontSize + gapTextBadge + badgeH;
    const contentStartY = cardY + Math.max(4, Math.floor((cardH - totalContentH) / 2));

    const spriteImg = loadedImagesMap[sprite.id];

    if (spriteImg) {
      ctx.save();
      const imgX = cardX + (cardW - imgSize) / 2;
      const imgY = contentStartY;

      // Halo Luminoso de Fondo Universal (Iluminación circular suave de alto rendimiento)
      const centerX = imgX + imgSize / 2;
      const centerY = imgY + imgSize / 2;
      const auraRadius = Math.round(imgSize * 0.52);

      ctx.fillStyle = isOwned ? hexToRgba(spiritHue, 0.22) : hexToRgba(spiritHue, 0.10);
      ctx.beginPath();
      ctx.arc(centerX, centerY, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      if (!isOwned) {
        ctx.globalAlpha = 0.88;
      }
      ctx.drawImage(spriteImg, imgX, imgY, imgSize, imgSize);
      ctx.restore();
    }

    // C. Sprite Name
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = `800 ${nameFontSize}px "Inter", sans-serif`;
    ctx.fillStyle = isOwned ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
    const textY = contentStartY + imgSize + gapImgText + Math.floor(nameFontSize * 0.82);

    let nameText = sprite.fullName || sprite.name;
    const maxTextW = cardW - 10;
    if (ctx.measureText(nameText).width > maxTextW) {
      while (nameText.length > 3 && ctx.measureText(nameText + '...').width > maxTextW) {
        nameText = nameText.slice(0, -1);
      }
      nameText += '...';
    }
    ctx.fillText(nameText, cardX + cardW / 2, textY);

    // D. Cyber Badge at Bottom (100% vectorial nítido sin shadowBlur)
    const badgeX = cardX + (cardW - badgeW) / 2;
    const badgeY = textY + gapTextBadge;
    const badgeCornerR = Math.max(3, Math.min(5, Math.round(badgeH * 0.25)));

    if (isOwned) {
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeCornerR);
      ctx.fillStyle = '#00F0E8';
      ctx.fill();

      ctx.font = `900 ${badgeFontSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#060714';
      ctx.fillText('HACKEADO', cardX + cardW / 2, badgeY + badgeH / 2 + Math.floor(badgeFontSize * 0.35));
    } else {
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeCornerR);
      ctx.fillStyle = '#EF4444';
      ctx.fill();

      ctx.font = `900 ${badgeFontSize}px "Inter", sans-serif`;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText('FALTANTE', cardX + cardW / 2, badgeY + badgeH / 2 + Math.floor(badgeFontSize * 0.35));
    }
    ctx.restore();
  });

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
  const targetUrl = 'https://spritedex-two.vercel.app/';
  drawModernDotQR(ctx, qrInnerX, qrInnerY, qrSize, targetUrl);
  ctx.restore();

  // 4. FOOTER WATERMARK
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = `700 ${Math.round(12 * (width / 1200))}px "Inter", monospace, sans-serif`;
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 6;
  ctx.fillText('#FNGGOverride  •  spritedex.com', width / 2, height - 16);
  ctx.restore();

  // Retornar promesa con dataUrl, blob y file listo para Web Share API
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const filename = `spritedex_${Date.now()}.png`;
      if (blob) {
        const file = new File([blob], filename, { type: 'image/png' });
        const blobUrl = URL.createObjectURL(blob);
        resolve({
          dataUrl: blobUrl,
          blobUrl,
          blob,
          file
        });
      } else {
        const dataUrl = canvas.toDataURL('image/png');
        resolve({
          dataUrl,
          blobUrl: dataUrl,
          blob: null,
          file: null
        });
      }
    }, 'image/png');
  });
}

