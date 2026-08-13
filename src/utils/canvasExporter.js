// HTML5 Canvas Exporter for Social Media Pokédex Grid Templates
// Generates clean visual grids with Scalloped Cyan-Green Gradient Checked Badge & Scalloped Red Outline Badge!

// Helper to pre-load image for canvas drawing
function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Convert Hex color string to RGBA with explicit opacity
function hexToRgba(hex, alpha = 0.50) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Scalloped Verified Checkmark Starburst Badge with Cyan to Green Gradient SVG (Owned)
const SCALLOPED_GRADIENT_CHECK_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="cyanGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00f0ff" />
      <stop offset="50%" stop-color="#00e676" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <path fill="url(#cyanGreenGrad)" d="M93.75 52.08c0-6.58-3.65-12.29-8.95-15C85.44 35.26 85.79 33.3 85.79 31.25c0-9.21-7.46-16.67-16.67-16.67-2.06 0-4.02.35-5.83.99-2.71-5.3-8.42-8.95-15-8.95s-12.29 3.65-15 8.95c-1.81-.64-3.77-.99-5.83-.99-9.21 0-16.67 7.46-16.67 16.67 0 2.06.35 4.02.99 5.83-5.3 2.71-8.95 8.42-8.95 15s3.65 12.29 8.95 15c-.64 1.81-.99 3.77-.99 5.83 0 9.21 7.46 16.67 16.67 16.67 2.06 0 4.02-.35 5.83-.99 2.71 5.3 8.42 8.95 15 8.95s12.29-3.65 15-8.95c1.81.64 3.77.99 5.83.99 9.21 0 16.67-7.46 16.67-16.67 0-2.06-.35-4.02-.99-5.83 5.3-2.71 8.95-8.42 8.95-15z"/>
  <path fill="#ffffff" d="M41.67 64.58L27.08 50l5.89-5.89 8.7 8.7 25.36-25.36 5.89 5.89z"/>
</svg>
`);

// Scalloped Red Outline Badge SVG for Missing Spirits (matching user reference image)
const SCALLOPED_RED_OUTLINE_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path fill="rgba(239, 68, 68, 0.10)" stroke="#ef4444" stroke-width="4.5" stroke-linejoin="round" d="M93.75 52.08c0-6.58-3.65-12.29-8.95-15C85.44 35.26 85.79 33.3 85.79 31.25c0-9.21-7.46-16.67-16.67-16.67-2.06 0-4.02.35-5.83.99-2.71-5.3-8.42-8.95-15-8.95s-12.29 3.65-15 8.95c-1.81-.64-3.77-.99-5.83-.99-9.21 0-16.67 7.46-16.67 16.67 0 2.06.35 4.02.99 5.83-5.3 2.71-8.95 8.42-8.95 15s3.65 12.29 8.95 15c-.64 1.81-.99 3.77-.99 5.83 0 9.21 7.46 16.67 16.67 16.67 2.06 0 4.02-.35 5.83-.99 2.71 5.3 8.42 8.95 15 8.95s12.29-3.65 15-8.95c1.81.64 3.77.99 5.83.99 9.21 0 16.67-7.46 16.67-16.67 0-2.06-.35-4.02-.99-5.83 5.3-2.71 8.95-8.42 8.95-15z"/>
</svg>
`);

// Crop and fill canvas using background_template.webp with cover scaling
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

// Helper to determine the true primary hue color for each spirit
function getSpiritHue(sprite) {
  const name = (sprite.fullName || sprite.name || '').toLowerCase();
  const rarity = (sprite.rarity || '').toLowerCase();

  if (name.includes('dorado') || name.includes('oro') || name.includes('peely')) return '#facc15';
  if (name.includes('fuego') || name.includes('flama')) return '#ff5722';
  if (name.includes('gomita') || name.includes('dulce')) return '#ff6b81';
  if (name.includes('galáctico') || name.includes('galactico') || name.includes('cúbico') || name.includes('cubico')) return '#a855f7';
  if (name.includes('gema') || name.includes('cristal')) return '#38bdf8';
  if (name.includes('holográfico') || name.includes('holografico')) return '#ec4899';
  if (name.includes('patito') || name.includes('tierra')) return '#00f0ff';
  if (name.includes('oscuridad') || name.includes('parca')) return '#94a3b8';
  if (name.includes('cacahuate')) return '#eab308';
  if (name.includes('agua')) return '#00f0ff';

  if (rarity.includes('mitico') || rarity.includes('mítico')) return '#f59e0b';
  if (rarity.includes('legendario')) return '#f97316';
  if (rarity.includes('epico') || rarity.includes('épico')) return '#a855f7';
  if (rarity.includes('raro')) return '#3b82f6';
  if (rarity.includes('especial')) return '#ec4899';

  return '#38bdf8';
}

export async function generatePokedexCardImage({
  spritesList,
  userState,
  format = 'checklist', // 'checklist', 'square' (1:1)
  useBackgroundTemplate = true
}) {
  const loadedImagesMap = {};
  const bgImgPromise = useBackgroundTemplate ? loadImage('/background_template.webp') : Promise.resolve(null);
  const badgeGradientPromise = loadImage(SCALLOPED_GRADIENT_CHECK_SVG);
  const badgeRedOutlinePromise = loadImage(SCALLOPED_RED_OUTLINE_SVG);

  await Promise.all([
    bgImgPromise.then((img) => {
      if (img) loadedImagesMap['__bg_template__'] = img;
    }),
    badgeGradientPromise.then((img) => {
      if (img) loadedImagesMap['__scalloped_gradient_check__'] = img;
    }),
    badgeRedOutlinePromise.then((img) => {
      if (img) loadedImagesMap['__scalloped_red_outline__'] = img;
    }),
    ...spritesList.slice(0, 150).map(async (s) => {
      const img = await loadImage(s.image);
      if (img) loadedImagesMap[s.id] = img;
    })
  ]);

  const bgTemplateImg = loadedImagesMap['__bg_template__'];

  return generateGridTemplate({
    spritesList,
    userState,
    format,
    loadedImagesMap,
    bgTemplateImg
  });
}

// -------------------------------------------------------------
// Renders spirits with translucent silhouette glow auras & scalloped status badges
// -------------------------------------------------------------
function generateGridTemplate({
  spritesList,
  userState,
  format,
  loadedImagesMap,
  bgTemplateImg
}) {
  const canvas = document.createElement('canvas');
  const totalSprites = spritesList.length;

  const isLightTemplate = Boolean(bgTemplateImg);

  // Soft, translucent & extra diffused aura blur settings
  const shadowBlurAmount = isLightTemplate ? 32 : 44;

  let width = 1200;
  let height = 800;
  let cols = 5;
  const paddingX = 60;
  let headerH = 115;
  const footerH = 45;

  if (format === 'square') {
    width = 1200;
    height = 1200;
    headerH = 140;

    if (totalSprites <= 6) cols = 3;
    else if (totalSprites <= 12) cols = 3;
    else if (totalSprites <= 20) cols = 4;
    else if (totalSprites <= 30) cols = 5;
    else if (totalSprites <= 42) cols = 6;
    else cols = 7;

  } else {
    if (totalSprites <= 8) cols = 4;
    else if (totalSprites <= 15) cols = 5;
    else if (totalSprites <= 28) cols = 6;
    else if (totalSprites <= 48) cols = 7;
    else cols = 8;
  }

  const rows = Math.max(1, Math.ceil(totalSprites / cols));
  const availW = width - paddingX * 2;

  if (format === 'checklist') {
    const desiredCellH = 230;
    height = headerH + rows * desiredCellH + footerH;
  }

  const availH = height - headerH - footerH;
  const cellW = Math.floor(availW / cols);
  const cellH = Math.floor(availH / rows);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (bgTemplateImg) {
    drawCroppedBackground(ctx, bgTemplateImg, width, height);
  } else {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(0.5, '#131b2e');
    bgGrad.addColorStop(1, '#060911');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // Header Title: Centered "FORTNITE SPRITEDEX"
  ctx.save();
  const fontSizeFortnite = format === 'square' ? 52 : 46;
  const fontSizeSpritedex = format === 'square' ? 42 : 36;
  const fontFortnite = `normal 900 ${fontSizeFortnite}px Impact, "Arial Black", sans-serif`;
  const fontSpritedex = `bold 900 ${fontSizeSpritedex}px sans-serif`;

  ctx.font = fontFortnite;
  const wFortnite = ctx.measureText('FORTNITE').width;
  ctx.font = fontSpritedex;
  const wSpritedex = ctx.measureText('SPRITEDEX').width;

  const gap = 16;
  const totalHeaderW = wFortnite + gap + wSpritedex;
  const startHeaderX = (width - totalHeaderW) / 2;
  const headerY = format === 'square' ? 72 : 62;

  // 1. Draw "FORTNITE" with Fortnite font at startHeaderX
  ctx.font = fontFortnite;
  ctx.textAlign = 'left';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  ctx.strokeStyle = isLightTemplate ? '#ffffff' : '#000000';
  ctx.lineWidth = 7;
  ctx.strokeText('FORTNITE', startHeaderX, headerY);

  ctx.fillStyle = isLightTemplate ? '#000000' : '#ffffff';
  ctx.fillText('FORTNITE', startHeaderX, headerY);

  // 2. Draw "SPRITEDEX" right after FORTNITE
  ctx.font = fontSpritedex;
  ctx.shadowColor = isLightTemplate ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 5;
  ctx.fillStyle = isLightTemplate ? '#0f172a' : '#ffffff';
  ctx.fillText('SPRITEDEX', startHeaderX + wFortnite + gap, headerY - 2);

  ctx.restore();

  // Grid Origin Offset
  const gridW = cols * cellW;
  const gridH = rows * cellH;
  const startX = (width - gridW) / 2;
  const startY = headerH + Math.max(0, (availH - gridH) / 2);

  const scallopedGradientImg = loadedImagesMap['__scalloped_gradient_check__'];
  const scallopedRedOutlineImg = loadedImagesMap['__scalloped_red_outline__'];

  // Render Spirit Icons & Scalloped Status SVG Badges
  spritesList.forEach((sprite, idx) => {
    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);

    const x = startX + colIdx * cellW;
    const y = startY + rowIdx * cellH;

    const state = userState[sprite.id] || { owned: false, level: 1 };
    const isOwned = state.owned;

    const cardW = cellW;
    const cardH = cellH;
    const cardX = x;
    const cardY = y;

    const maxImgSize = format === 'square' ? 155 : 125;
    const imgSize = Math.max(68, Math.min(maxImgSize, cardH - 65));
    const badgeSize = Math.max(38, Math.min(48, Math.floor(imgSize * 0.38)));

    // 1. Spirit PNG Image with TRANSLUCENT & HIGHLY DIFFUSED silhouette aura glow
    const spriteImg = loadedImagesMap[sprite.id];
    if (spriteImg) {
      ctx.save();
      const spiritHue = getSpiritHue(sprite);

      if (!isOwned) {
        ctx.globalAlpha = 0.38;
      } else {
        ctx.shadowColor = hexToRgba(spiritHue, isLightTemplate ? 0.48 : 0.65);
        ctx.shadowBlur = shadowBlurAmount;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      ctx.drawImage(spriteImg, cardX + cardW / 2 - imgSize / 2, cardY + 4, imgSize, imgSize);
      ctx.restore();
    }

    // 2. Scalloped Status Badge SVG (Positioned directly underneath spirit)
    const badgeX = cardX + cardW / 2 - badgeSize / 2;
    const badgeY = cardY + 4 + imgSize + 10;

    if (isOwned) {
      // Scalloped Cyan-Green Gradient Checked Badge SVG
      if (scallopedGradientImg) {
        ctx.save();
        ctx.shadowColor = 'rgba(0, 240, 255, 0.45)';
        ctx.shadowBlur = 8;
        ctx.drawImage(scallopedGradientImg, badgeX, badgeY, badgeSize, badgeSize);
        ctx.restore();
      } else {
        ctx.font = `bold ${Math.floor(badgeSize * 0.7)}px sans-serif`;
        ctx.fillStyle = '#10b981';
        ctx.textAlign = 'center';
        ctx.fillText('✓', cardX + cardW / 2, badgeY + badgeSize / 2 + Math.floor(badgeSize * 0.2));
      }
    } else {
      // Scalloped Red Outline Badge SVG for Missing Spirits (matching user image!)
      if (scallopedRedOutlineImg) {
        ctx.save();
        ctx.shadowColor = 'rgba(239, 68, 68, 0.35)';
        ctx.shadowBlur = 6;
        ctx.drawImage(scallopedRedOutlineImg, badgeX, badgeY, badgeSize, badgeSize);
        ctx.restore();
      } else {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cardX + cardW / 2, badgeY + badgeSize / 2, badgeSize / 2, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  });

  // Footer Watermark: Clean Dark Slate #0f172a
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = isLightTemplate ? '#0f172a' : '#ffffff';
  ctx.shadowColor = isLightTemplate ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText('Plantilla de Espíritus Fortnite', width / 2, height - 16);
  ctx.shadowBlur = 0;

  return canvas.toDataURL('image/png');
}
