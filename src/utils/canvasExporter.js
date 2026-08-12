// HTML5 Canvas Exporter for Social Media Pokédex Cards & Grid Checklists

import { GENERATIONS, RARITIES } from '../data/spritesData';

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

export async function generatePokedexCardImage({
  spritesList,
  userState,
  trainerName = 'Coleccionista Fortnite',
  format = 'checklist'
}) {
  // Pre-load all sprite images for rendering
  const loadedImagesMap = {};
  await Promise.all(
    spritesList.slice(0, 120).map(async (s) => {
      const img = await loadImage(s.image);
      if (img) loadedImagesMap[s.id] = img;
    })
  );

  if (format === 'checklist') {
    return generateChecklistTemplate({ spritesList, userState, trainerName, loadedImagesMap });
  }

  const canvas = document.createElement('canvas');
  const width = format === 'square' ? 1080 : 1200;
  const height = format === 'square' ? 1080 : 675;
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // Background Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#0b0f19');
  bgGradient.addColorStop(0.5, '#111827');
  bgGradient.addColorStop(1, '#070a12');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Grid Overlay lines
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Glowing Frame
  ctx.strokeStyle = '#3b82f6';
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 20;
  ctx.lineWidth = 4;
  ctx.strokeRect(20, 20, width - 40, height - 40);
  ctx.shadowBlur = 0;

  // Header
  ctx.beginPath();
  ctx.arc(60, 60, 18, 0, Math.PI * 2);
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 15;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = 'bold 32px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('FORTNITE SPRITEDEX', 95, 68);

  ctx.font = '600 18px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`JUGADOR: ${trainerName.toUpperCase()}`, width - 360, 68);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 105);
  ctx.lineTo(width - 40, 105);
  ctx.stroke();

  // Stats Calculation
  const totalCount = spritesList.length;
  let ownedCount = 0;
  let masteredCount = 0;
  const masteredList = [];
  const missingList = [];

  spritesList.forEach((sprite) => {
    const state = userState[sprite.id] || { owned: false, level: 1 };
    if (state.owned) {
      ownedCount++;
      if (state.level === 5) {
        masteredCount++;
        masteredList.push(sprite);
      }
    } else {
      missingList.push(sprite);
    }
  });

  // Left Side: Donut Progress Ring + Stats
  const cx = 200;
  const cy = 350;
  const radius = 110;
  const strokeW = 20;

  // Background Ring
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = strokeW;
  ctx.stroke();

  // Progress Arc
  const pct = totalCount > 0 ? ownedCount / totalCount : 0;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + (Math.PI * 2 * pct);

  ctx.beginPath();
  ctx.arc(cx, cy, radius, startAngle, endAngle);
  ctx.strokeStyle = '#3b82f6';
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 15;
  ctx.lineWidth = strokeW;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Percentage Text
  ctx.font = '900 44px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(pct * 100)}%`, cx, cy + 10);

  ctx.font = '600 14px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('COLECCIÓN COMPLETADA', cx, cy + 35);

  // Summary Stat Cards
  const statsBoxes = [
    { label: 'ESPRÍTUS ATRAPADOS', val: `${ownedCount} / ${totalCount}`, color: '#3b82f6' },
    { label: 'MAXEADOS (NIVEL 5)', val: `${masteredCount}`, color: '#eab308' },
    { label: 'FALTANTES', val: `${missingList.length}`, color: '#ef4444' }
  ];

  statsBoxes.forEach((b, i) => {
    const boxY = 490 + i * 55;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(50, boxY, 300, 46, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.arc(70, boxY + 23, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = '600 12px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'left';
    ctx.fillText(b.label, 90, boxY + 28);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(b.val, 330, boxY + 29);
  });

  // Right Side: Mastered & Missing Highlights
  const rightX = 410;
  const rightY = 130;

  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('🏆 ESPÍRITUS MAXEADOS (NIVEL 5)', rightX, rightY + 25);

  let rowY = rightY + 45;
  if (masteredList.length === 0) {
    ctx.font = 'italic 16px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Aún no has llevado ningún Sprite al Nivel 5. ¡A entrenar!', rightX, rowY + 25);
    rowY += 45;
  } else {
    const topMastered = masteredList.slice(0, 6);
    topMastered.forEach((sprite, idx) => {
      const mx = rightX + (idx % 3) * 240;
      const my = rowY + Math.floor(idx / 3) * 60;

      ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx, my, 225, 50, 10);
      ctx.fill();
      ctx.stroke();

      const spriteImg = loadedImagesMap[sprite.id];
      if (spriteImg) {
        ctx.drawImage(spriteImg, mx + 8, my + 5, 40, 40);
      }

      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(sprite.fullName.substring(0, 18), mx + 52, my + 24);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#eab308';
      ctx.fillText(`⭐ ⭐ ⭐ ⭐ ⭐ MAX`, mx + 52, my + 40);
    });
    rowY += Math.ceil(topMastered.length / 3) * 65 + 15;
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('🔍 FALTANTES POR ENCONTRAR', rightX, rowY + 25);

  const missingRowY = rowY + 45;
  if (missingList.length === 0) {
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('🎉 ¡COLECCIÓN COMPLETA! ¡HAS ATRAPADO TODOS LOS SPRITES!', rightX, missingRowY + 25);
  } else {
    const topMissing = missingList.slice(0, 8);
    topMissing.forEach((sprite, idx) => {
      const mx = rightX + (idx % 4) * 180;
      const my = missingRowY + Math.floor(idx / 4) * 55;

      ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(mx, my, 170, 45, 8);
      ctx.fill();
      ctx.stroke();

      const spriteImg = loadedImagesMap[sprite.id];
      if (spriteImg) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(spriteImg, mx + 6, my + 5, 35, 35);
        ctx.restore();
      }

      ctx.font = '600 12px sans-serif';
      ctx.fillStyle = '#fca5a5';
      ctx.fillText(sprite.fullName.substring(0, 15), mx + 45, my + 22);

      const rInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, color: '#94a3b8' };
      ctx.font = '10px sans-serif';
      ctx.fillStyle = rInfo.color;
      ctx.fillText(`${rInfo.name} (${sprite.dropChanceDisplay})`, mx + 45, my + 36);
    });
  }

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Generado con Fortnite Sprites App • fortnite.gg/sprites', rightX, height - 35);

  return canvas.toDataURL('image/png');
}

// -------------------------------------------------------------
// Function for "PLANTILLA DE ESPÍRITUS" (Grid Checklist)
// Draws PNG images directly onto the canvas grid!
// -------------------------------------------------------------
function generateChecklistTemplate({ spritesList, userState, trainerName, loadedImagesMap }) {
  const canvas = document.createElement('canvas');

  const cols = Math.min(Math.max(Math.ceil(Math.sqrt(spritesList.length * 1.4)), 5), 8);
  const rows = Math.ceil(spritesList.length / cols);

  const cellW = 160;
  const cellH = 180;
  const paddingX = 40;
  const headerH = 185;
  const footerH = 50;

  const width = Math.max(920, paddingX * 2 + cols * cellW);
  const height = headerH + rows * cellH + footerH;

  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Background Dark Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#090d16');
  bgGrad.addColorStop(0.4, '#131b2e');
  bgGrad.addColorStop(1, '#060911');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // Futuristic Background Grid Lines
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.07)';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < width; gx += 40) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, height);
    ctx.stroke();
  }
  for (let gy = 0; gy < height; gy += 40) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(width, gy);
    ctx.stroke();
  }

  // Ambient Glow Orbs
  ctx.fillStyle = 'rgba(168, 85, 247, 0.12)';
  ctx.beginPath();
  ctx.arc(width * 0.2, 120, 240, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
  ctx.beginPath();
  ctx.arc(width * 0.8, height - 150, 280, 0, Math.PI * 2);
  ctx.fill();

  // Header Title
  ctx.textAlign = 'center';
  ctx.font = '900 48px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText('FORTNITE', width / 2, 55);
  ctx.shadowBlur = 0;

  // Sub-banner Pill Box
  const bannerW = Math.min(580, width - 60);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(width / 2 - bannerW / 2, 72, bannerW, 46, 12);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.font = '900 22px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('PLANTILLA DE ESPÍRITUS / SPRITES', width / 2, 103);

  // Stats Tagline Pill Badge
  const ownedCount = spritesList.filter(s => userState[s.id]?.owned).length;
  const masteredCount = spritesList.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length;
  const totalCount = spritesList.length;
  const percent = totalCount > 0 ? Math.round((ownedCount / totalCount) * 100) : 0;

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`🎮 JUGADOR: ${trainerName.toUpperCase()}   •   ATRAPADOS: ${ownedCount} / ${totalCount} (${percent}%)   •   MAXEADOS: ${masteredCount}`, width / 2, 150);

  // Grid Origin Offset to Center Grid
  const gridW = cols * cellW;
  const startX = (width - gridW) / 2;

  // Render Sprite Cards
  spritesList.forEach((sprite, idx) => {
    const colIdx = idx % cols;
    const rowIdx = Math.floor(idx / cols);

    const x = startX + colIdx * cellW;
    const y = headerH + rowIdx * cellH;

    const state = userState[sprite.id] || { owned: false, level: 1 };
    const isOwned = state.owned;
    const level = state.level || 1;

    const cardW = cellW - 12;
    const cardH = cellH - 12;
    const cardX = x + 6;
    const cardY = y + 6;

    // Card Container (Dark Glass Panel)
    ctx.fillStyle = isOwned ? 'rgba(22, 32, 50, 0.85)' : 'rgba(15, 23, 42, 0.5)';
    ctx.strokeStyle = isOwned
      ? (level === 5 ? '#eab308' : '#10b981')
      : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = isOwned ? 2 : 1;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 14);
    ctx.fill();
    ctx.stroke();

    // Sprite PNG Image
    const spriteImg = loadedImagesMap[sprite.id];
    if (spriteImg) {
      ctx.save();
      if (!isOwned) {
        ctx.globalAlpha = 0.38;
      } else {
        ctx.shadowColor = level === 5 ? 'rgba(234, 179, 8, 0.6)' : 'rgba(16, 185, 129, 0.6)';
        ctx.shadowBlur = 12;
      }
      ctx.drawImage(spriteImg, cardX + cardW / 2 - 34, cardY + 12, 68, 68);
      ctx.restore();
    }

    // Sprite Name
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = isOwned ? '#ffffff' : '#94a3b8';
    const dispName = sprite.fullName.length > 15 ? sprite.fullName.substring(0, 14) + '…' : sprite.fullName;
    ctx.fillText(dispName, cardX + cardW / 2, cardY + 98);

    // Checklist Box Square (Casilla de verificación para marcar)
    const boxSize = 32;
    const boxX = cardX + cardW / 2 - boxSize / 2;
    const boxY = cardY + 116;

    if (isOwned) {
      // Filled vibrant checkbox (Green check or Gold star for Maxeado)
      ctx.fillStyle = level === 5 ? '#eab308' : '#10b981';
      ctx.shadowColor = level === 5 ? 'rgba(234, 179, 8, 0.5)' : 'rgba(16, 185, 129, 0.5)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 6);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 14px sans-serif';
      ctx.fillStyle = level === 5 ? '#000000' : '#ffffff';
      if (level === 5) {
        ctx.fillText('★ MAX', boxX + boxSize / 2, boxY + 21);
      } else {
        ctx.fillText(`✓ ${level > 1 ? level : ''}`, boxX + boxSize / 2, boxY + 21);
      }
    } else {
      // Blank White Checklist Box [  ] (Empty fillable box style for social templates!)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxSize, boxSize, 6);
      ctx.fill();
      ctx.stroke();
    }
  });

  // Footer Watermark
  ctx.textAlign = 'center';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText('⚡ Plantilla de Espíritus Generada por Fortnite Sprites App • fortnite.gg/sprites', width / 2, height - 18);

  return canvas.toDataURL('image/png');
}
