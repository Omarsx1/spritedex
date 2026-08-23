// HTML5 Canvas Exporter for Social Media - Estilo Oficial GLITCH / OVERRIDE
// Inspirado en el diseño 'CHAPTER 7 | SEASON 4: OVERRIDE' de Fortnite

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

  // Glitch decorative scanlines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1.5);
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
  if (name.includes('hacker') || name.includes('cheatmaster')) return '#22c55e';

  if (rarity.includes('mitico') || rarity.includes('mítico')) return '#f59e0b';
  if (rarity.includes('legendario')) return '#f97316';
  if (rarity.includes('epico') || rarity.includes('épico')) return '#a855f7';
  if (rarity.includes('raro')) return '#3b82f6';
  if (rarity.includes('especial')) return '#ec4899';

  return '#00f0ff';
}

export async function generatePokedexCardImage({
  spritesList,
  userState,
  format = 'checklist', // 'checklist', 'square'
  bgStyle = 'glitch_override', // 'glitch_override', 'blueprint', 'dark_matrix'
  useBackgroundTemplate = true
}) {
  const loadedImagesMap = {};
  const effectiveBgStyle = bgStyle || (useBackgroundTemplate ? 'glitch_override' : 'dark_matrix');

  // Load official glitch wallpaper
  const bgImgPromise = loadImage('/background.webp');

  await Promise.all([
    bgImgPromise.then((img) => {
      if (img) loadedImagesMap['__bg_override__'] = img;
    }),
    ...spritesList.slice(0, 160).map(async (s) => {
      const img = await loadImage(s.image);
      if (img) loadedImagesMap[s.id] = img;
    })
  ]);

  return renderGlitchOverrideTemplate({
    spritesList,
    userState,
    format,
    bgStyle: effectiveBgStyle,
    loadedImagesMap
  });
}

// -------------------------------------------------------------
// Renders the GLITCH / OVERRIDE style template (Matching Image 2)
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

  let width = 1080;
  let height = 1520;
  let cols = 6;
  const paddingX = 36;
  const headerH = 195;
  const footerH = 55;

  if (format === 'square') {
    width = 1200;
    height = 1200;
    if (totalSprites <= 6) cols = 3;
    else if (totalSprites <= 12) cols = 3;
    else if (totalSprites <= 20) cols = 4;
    else if (totalSprites <= 30) cols = 5;
    else if (totalSprites <= 42) cols = 6;
    else cols = 7;
  } else {
    // Vertical Mobile / Story Poster Format (Matching Reference Image)
    width = 1080;
    if (totalSprites <= 8) cols = 4;
    else if (totalSprites <= 15) cols = 5;
    else cols = 6; // 6 columns standard for Gen 2 (33 sprites = 6 rows)
  }

  const rows = Math.max(1, Math.ceil(totalSprites / cols));
  const availW = width - paddingX * 2;

  if (format === 'checklist') {
    const desiredCellH = 190;
    height = headerH + rows * desiredCellH + footerH;
  }

  const availH = height - headerH - footerH;
  const cellW = Math.floor(availW / cols);
  const cellH = Math.floor(availH / rows);

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Draw Background (Glitch / Matrix / Blueprint)
  const bgImg = loadedImagesMap['__bg_override__'];
  drawCyberMatrixBackground(ctx, width, height, bgStyle, bgImg);

  // 2. HEADER SECTION (GLITCH OVERRIDE STYLE)
  ctx.save();

  // Top Small Header: "FORTNITE , NUEVOS"
  ctx.font = '900 14px "Inter", "Arial Black", sans-serif';
  ctx.fillStyle = '#00F0E8';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '3px';
  ctx.shadowColor = 'rgba(0, 240, 232, 0.7)';
  ctx.shadowBlur = 8;
  ctx.fillText('FORTNITE , NUEVOS', width / 2, 34);

  // Main Big Title: "ESPÍRITUS" (or "SPRITEDEX")
  const titleText = format === 'checklist' ? 'ESPÍRITUS' : 'SPRITEDEX OVERRIDE';
  ctx.font = format === 'checklist'
    ? '900 64px "Burbank Big Condensed", "Impact", "Arial Black", sans-serif'
    : '900 48px "Burbank Big Condensed", "Impact", "Arial Black", sans-serif';

  // Chromatic Aberration Shadows
  // Cyan shadow right
  ctx.fillStyle = '#00F0E8';
  ctx.fillText(titleText, width / 2 + 3, format === 'checklist' ? 90 : 86);

  // Magenta shadow left
  ctx.fillStyle = '#ff0055';
  ctx.fillText(titleText, width / 2 - 3, format === 'checklist' ? 90 : 86);

  // Main white text
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
  ctx.shadowBlur = 14;
  ctx.fillText(titleText, width / 2, format === 'checklist' ? 90 : 86);
  ctx.shadowBlur = 0;

  // Tagline Pill Capsule: "ROMPE LAS REGLAS • CAMBIA EL JUEGO" (Magenta Capsule)
  const capsuleText = 'ROMPE LAS REGLAS • CAMBIA EL JUEGO';
  ctx.font = '900 10.5px "Inter", "Arial Black", sans-serif';
  ctx.letterSpacing = '1px';
  const capsuleW = ctx.measureText(capsuleText).width + 28;
  const capsuleH = 20;
  const capsuleX = (width - capsuleW) / 2;
  const capsuleY = format === 'checklist' ? 104 : 100;

  // Draw magenta capsule
  roundRect(ctx, capsuleX, capsuleY, capsuleW, capsuleH, 10);
  ctx.fillStyle = '#ff0055';
  ctx.shadowColor = 'rgba(255, 0, 85, 0.6)';
  ctx.shadowBlur = 10;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(capsuleText, width / 2, capsuleY + 14);

  // Stats / HUD Progress Box (Image 2 style)
  const hudW = Math.min(width - 72, 600);
  const hudH = 44;
  const hudX = (width - hudW) / 2;
  const hudY = format === 'checklist' ? 132 : 130;

  // Dark cyber panel with glowing border
  roundRect(ctx, hudX, hudY, hudW, hudH, 10);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 240, 232, 0.4)';
  ctx.lineWidth = 1.5;
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

  // HUD Text Left: "X / Y ESPÍRITUS DESENCRIPTADOS"
  ctx.textAlign = 'left';
  ctx.font = '900 12px "Inter", sans-serif';
  ctx.fillStyle = '#ff0055';
  ctx.fillText(`${ownedCount} / ${totalSprites}`, hudX + 14, hudY + 19);
  ctx.font = '700 10px "Inter", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(' espíritus atrapados', hudX + 14 + ctx.measureText(`${ownedCount} / ${totalSprites} `).width + 4, hudY + 19);

  // HUD Text Right: "PROGRESO: X%"
  ctx.textAlign = 'right';
  ctx.font = '900 11px "Inter", sans-serif';
  ctx.fillStyle = '#00F0E8';
  ctx.fillText(`PROGRESO ${pctOwned}%`, hudX + hudW - 14, hudY + 19);

  // Neon Progress Bar inside HUD
  const barX = hudX + 14;
  const barY = hudY + 26;
  const barW = hudW - 28;
  const barH = 7;

  // Background track
  roundRect(ctx, barX, barY, barW, barH, 3.5);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fill();

  // Active Fill
  const fillW = Math.max(barH, (barW * Math.min(100, Math.max(0, pctOwned))) / 100);
  if (fillW > 0) {
    roundRect(ctx, barX, barY, fillW, barH, 3.5);
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

  // 3. SPRITE GRID SECTION
  const gridW = cols * cellW;
  const gridH = rows * cellH;
  const startX = (width - gridW) / 2;
  const startY = headerH + Math.max(0, (availH - gridH) / 2);

  spritesList.forEach((sprite, idx) => {
    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);

    const x = startX + colIdx * cellW;
    const y = startY + rowIdx * cellH;

    const state = userState[sprite.id] || { owned: false, level: 1 };
    const isOwned = Boolean(state.owned);
    const level = state.level || 1;
    const isMastered = isOwned && level === 5;

    const cardMarginX = 6;
    const cardMarginY = 6;
    const cardX = x + cardMarginX;
    const cardY = y + cardMarginY;
    const cardW = cellW - cardMarginX * 2;
    const cardH = cellH - cardMarginY * 2;

    // A. Cyber Tile Container
    ctx.save();
    roundRect(ctx, cardX, cardY, cardW, cardH, 12);
    if (isOwned) {
      ctx.fillStyle = isMastered ? 'rgba(234, 179, 8, 0.12)' : 'rgba(0, 240, 232, 0.08)';
      ctx.fill();
      ctx.strokeStyle = isMastered ? 'rgba(234, 179, 8, 0.65)' : 'rgba(0, 240, 232, 0.45)';
      ctx.lineWidth = isMastered ? 1.5 : 1;
      if (isMastered) {
        ctx.shadowColor = 'rgba(234, 179, 8, 0.4)';
        ctx.shadowBlur = 8;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Corner pixel ticks on active cards
    if (isOwned) {
      ctx.fillStyle = isMastered ? '#facc15' : '#00F0E8';
      ctx.fillRect(cardX + 2, cardY + 2, 4, 4);
      ctx.fillRect(cardX + cardW - 6, cardY + 2, 4, 4);
      ctx.fillRect(cardX + 2, cardY + cardH - 6, 4, 4);
      ctx.fillRect(cardX + cardW - 6, cardY + cardH - 6, 4, 4);
    }
    ctx.restore();

    // B. Sprite Image
    const maxImgSize = format === 'square' ? 120 : 100;
    const imgSize = Math.max(60, Math.min(maxImgSize, cardH - 60));
    const spriteImg = loadedImagesMap[sprite.id];

    if (spriteImg) {
      ctx.save();
      const spiritHue = getSpiritHue(sprite);

      if (!isOwned) {
        ctx.globalAlpha = 0.68;
        ctx.drawImage(spriteImg, cardX + cardW / 2 - imgSize / 2, cardY + 8, imgSize, imgSize);
      } else {
        ctx.shadowColor = hexToRgba(spiritHue, 0.65);
        ctx.shadowBlur = 24;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.drawImage(spriteImg, cardX + cardW / 2 - imgSize / 2, cardY + 8, imgSize, imgSize);
      }
      ctx.restore();
    }

    // C. Sprite Name
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '800 11px "Inter", sans-serif';
    ctx.fillStyle = isOwned ? '#ffffff' : 'rgba(255, 255, 255, 0.75)';
    const textY = cardY + 8 + imgSize + 14;

    let nameText = sprite.fullName || sprite.name;
    const maxTextW = cardW - 12;
    if (ctx.measureText(nameText).width > maxTextW) {
      while (nameText.length > 3 && ctx.measureText(nameText + '...').width > maxTextW) {
        nameText = nameText.slice(0, -1);
      }
      nameText += '...';
    }
    ctx.fillText(nameText, cardX + cardW / 2, textY);

    // D. Cyber Badge at Bottom
    const badgeW = Math.min(cardW - 16, 76);
    const badgeH = 18;
    const badgeX = cardX + (cardW - badgeW) / 2;
    const badgeY = textY + 6;

    if (isOwned) {
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      if (isMastered) {
        ctx.fillStyle = 'rgba(234, 179, 8, 0.95)';
        ctx.shadowColor = 'rgba(234, 179, 8, 0.6)';
        ctx.shadowBlur = 6;
      } else {
        ctx.fillStyle = '#00F0E8';
        ctx.shadowColor = 'rgba(0, 240, 232, 0.55)';
        ctx.shadowBlur = 6;
      }
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '900 9px "Inter", sans-serif';
      ctx.fillStyle = '#060714';
      const badgeLabel = isMastered ? 'MAX' : (level > 1 ? `LVL.${level}` : 'HACKEADO');
      ctx.fillText(badgeLabel, cardX + cardW / 2, badgeY + 12);
    } else {
      roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 4);
      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = '800 8.5px "Inter", sans-serif';
      ctx.fillStyle = 'rgba(239, 68, 68, 0.95)';
      ctx.fillText('FALTANTE', cardX + cardW / 2, badgeY + 12);
    }
    ctx.restore();
  });

  // 4. FOOTER WATERMARK
  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '700 12px "Inter", monospace, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
  ctx.shadowBlur = 6;
  ctx.fillText('#FNGGOverride  •  spritedex.com', width / 2, height - 16);
  ctx.restore();

  return canvas.toDataURL('image/png');
}

