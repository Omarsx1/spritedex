import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';

/**
 * Una fila individual por familia de sprites.
 * Muestra la variante base como card principal y permite swipe horizontal
 * para ver las demás variantes apiladas en 3D detrás.
 */
function FamilyRow({
  familyName,
  variants,
  userState,
  friendState,
  isFriendView,
  onToggleOwned,
  onSetLevel,
  onOpenDetail
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const startXRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Clamp index if variants change
  useEffect(() => {
    setActiveIdx((prev) => Math.min(prev, variants.length - 1));
  }, [variants.length]);

  const handleTouchStart = (e) => {
    isDraggingRef.current = true;
    startXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isDraggingRef.current) return;
    const diff = e.touches[0].clientX - startXRef.current;
    // Resistencia elástica en los bordes
    let offset = diff;
    if (activeIdx === 0 && diff > 0) offset = diff * 0.3;
    else if (activeIdx === variants.length - 1 && diff < 0) offset = diff * 0.3;
    setDragOffset(offset);
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragOffset < -50 && activeIdx < variants.length - 1) {
      setActiveIdx((prev) => prev + 1);
    } else if (dragOffset > 50 && activeIdx > 0) {
      setActiveIdx((prev) => prev - 1);
    }
    setDragOffset(0);
  };

  if (variants.length === 0) return null;

  return (
    <div className="ms-family-row">
      {/* Nombre de familia + indicador de variantes */}
      <div className="ms-family-header">
        <span className="ms-family-name">{familyName}</span>
        {variants.length > 1 && (
          <span className="ms-family-dots">
            {variants.map((_, i) => (
              <span key={i} className={`ms-dot ${i === activeIdx ? 'ms-dot--active' : ''}`} />
            ))}
          </span>
        )}
      </div>

      {/* Card stack con swipe */}
      <div
        className="ms-family-stack"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {variants.map((sprite, idx) => {
          // Solo renderizar la card activa + 3 siguientes
          if (idx < activeIdx || idx > activeIdx + 3) return null;

          const isCurrent = idx === activeIdx;
          const offset = idx - activeIdx;

          let posClass = 'ms-card--hidden';
          if (offset === 0) posClass = 'ms-card--active';
          else if (offset === 1) posClass = 'ms-card--next';
          else if (offset === 2) posClass = 'ms-card--next-2';
          else if (offset === 3) posClass = 'ms-card--next-3';

          const activeState = isFriendView
            ? (friendState?.[sprite.id] || { owned: false, level: 1 })
            : (userState[sprite.id] || { owned: false, level: 1 });

          const isOwned = activeState.owned;
          const level = activeState.level || 1;
          const isMastered = isOwned && level === 5;
          const myOwned = userState[sprite.id]?.owned;
          const friendCanLend = isFriendView && isOwned && !myOwned;
          const rarityInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, bg: '#1e293b' };
          const styleInfo = getSpriteCardStyle(sprite);

          const handleToggleClick = (e) => {
            e.stopPropagation();
            if (isFriendView) {
              const nextOwned = !myOwned;
              onToggleOwned(sprite.id);
              sounds.playToggle(nextOwned, sprite.gen);
              if (nextOwned) confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
              return;
            }
            const nextOwned = !isOwned;
            onToggleOwned(sprite.id);
            sounds.playToggle(nextOwned, sprite.gen);
            if (nextOwned) confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
          };

          const handleImageClick = (e) => {
            e.stopPropagation();
            onOpenDetail(sprite);
          };

          const handleLevelClick = (e, newLevel) => {
            e.stopPropagation();
            if (isFriendView) return;
            onSetLevel(sprite.id, newLevel);
            sounds.playLevelUp(newLevel, sprite.gen);
            if (newLevel === 5) confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
          };

          const dragStyle = isCurrent && dragOffset !== 0 ? {
            transform: `translateX(${dragOffset}px) rotateZ(${dragOffset * 0.05}deg) scale(1)`,
            transition: 'none'
          } : {};

          const btnText = isFriendView
            ? (friendCanLend ? (myOwned ? '✓ Registrado' : '+ Registrar') : isOwned ? '✓ Lo tiene' : 'No lo tiene')
            : (isMastered ? '⭐ Maxeado' : isOwned ? `Niv.${level}` : 'Sin atrapar');

          return (
            <div
              key={sprite.id}
              className={`ms-card ${posClass} sprite-card ${isOwned ? 'is-owned' : ''} ${isMastered ? ('is-mastered ' + (sprite.gen === 2 ? 'is-glitch-mastered' : 'is-classic-mastered')) : ''}`}
              style={{
                ...dragStyle,
                background: styleInfo.background,
                borderColor: styleInfo.borderColor,
              }}
            >
              {/* Cyber FX para Gen 2 Mastered */}
              {isMastered && sprite.gen === 2 && (
                <div className="cyber-fx-overlay" aria-hidden="true">
                  <div className="scan-line" />
                  <div className="cyber-lines"><span /><span /><span /><span /></div>
                  <div className="corner-elements"><span /><span /><span /><span /></div>
                  <div className="glowing-elements"><div className="glow-1" /><div className="glow-2" /><div className="glow-3" /></div>
                  <div className="card-particles"><span /><span /><span /><span /><span /><span /></div>
                </div>
              )}

              {friendCanLend && (
                <div style={{
                  position: 'absolute', top: '6px', right: '6px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontSize: '0.58rem', fontWeight: 900,
                  padding: '2px 6px', borderRadius: '20px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.4)', zIndex: 2
                }}>
                  🎁 Te lo presta
                </div>
              )}

              {/* Etiqueta de variante */}
              {variants.length > 1 && (
                <div className="ms-variant-tag">
                  {sprite.variantDisplay || sprite.variant}
                </div>
              )}

              {/* Imagen del Sprite */}
              <div className="ms-card__image" onClick={handleImageClick}>
                <img
                  src={sprite.image}
                  alt={sprite.fullName}
                  loading="lazy"
                  style={{
                    filter: !isOwned ? 'grayscale(80%) opacity(0.5)' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
                    cursor: 'pointer'
                  }}
                  onError={(e) => {
                    if (!e.target.dataset.triedBase) {
                      e.target.dataset.triedBase = 'true';
                      const baseId = sprite.id ? sprite.id.split('_')[0] : 'water';
                      if (baseId === 'peely' || baseId === 'llama' || baseId === 'ironmouse') {
                        e.target.src = `/sprites/${baseId}_basic.webp`;
                      } else {
                        e.target.src = `/sprites/${baseId}_basic.png`;
                      }
                    } else {
                      e.target.onerror = null;
                      e.target.src = '/sprites/water_basic.png';
                    }
                  }}
                />
              </div>

              {/* Info: nombre, rareza, drop */}
              <div className="ms-card__info">
                <div className="card-name" style={{ fontSize: '0.85rem' }}>{sprite.fullName}</div>
                <div className="card-meta">
                  <span className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}>
                    {rarityInfo.name}
                  </span>
                  <span className="drop-pct">{sprite.dropChanceDisplay}</span>
                </div>
              </div>

              {/* Estrellas de nivel */}
              {isOwned && (
                <div className="card-level-stars" onClick={(e) => e.stopPropagation()} style={{ marginTop: '4px' }}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      className={`star-btn ${level >= num ? 'active' : ''} ${isMastered && num === 5 ? 'mastered-star' : ''}`}
                      onClick={(e) => handleLevelClick(e, num)}
                      style={isFriendView ? { pointerEvents: 'none' } : {}}
                    >
                      ★
                    </button>
                  ))}
                </div>
              )}

              {/* Botón de estado */}
              <button
                className={`card-owned-btn ${isMastered ? 'mastered' : isOwned ? 'owned' : ''} ${sprite.gen === 2 && isOwned ? 'is-glitch-btn' : ''}`}
                data-text={btnText}
                onClick={handleToggleClick}
                style={{
                  ...(isFriendView && friendCanLend ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontWeight: 800 } : {}),
                  marginTop: '6px'
                }}
              >
                <span className="btn-text">{btnText}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Hint de swipe si hay más variantes */}
      {variants.length > 1 && (
        <div className="ms-swipe-hint">
          Desliza para ver {variants.length} variantes →
        </div>
      )}
    </div>
  );
}

/**
 * MobileSpriteSwiper principal.
 * Agrupa los sprites filtrados por familia y renderiza una fila por familia,
 * cada una con swipe horizontal para navegar variantes.
 */
export function MobileSpriteSwiper({
  sprites,
  userState,
  friendState,
  isFriendView,
  onToggleOwned,
  onSetLevel,
  onOpenDetail
}) {
  // Agrupar sprites por familyId manteniendo el orden de aparición
  const families = useMemo(() => {
    const familyMap = new Map();
    sprites.forEach((sprite) => {
      if (!familyMap.has(sprite.familyId)) {
        familyMap.set(sprite.familyId, {
          familyId: sprite.familyId,
          familyName: sprite.familyName,
          variants: []
        });
      }
      familyMap.get(sprite.familyId).variants.push(sprite);
    });
    return Array.from(familyMap.values());
  }, [sprites]);

  if (families.length === 0) return null;

  return (
    <div className="mobile-swiper">
      {/* Blueprint Aura Gradient Layers */}
      <div className="mobile-swiper__blueprint-layer-1" aria-hidden="true" />
      <div className="mobile-swiper__blueprint-layer-2" aria-hidden="true" />
      <div className="mobile-swiper__blueprint-layer-3" aria-hidden="true" />

      <div className="mobile-swiper__content">
        {families.map((family) => (
          <FamilyRow
            key={family.familyId}
            familyName={family.familyName}
            variants={family.variants}
            userState={userState}
            friendState={friendState}
            isFriendView={isFriendView}
            onToggleOwned={onToggleOwned}
            onSetLevel={onSetLevel}
            onOpenDetail={onOpenDetail}
          />
        ))}
      </div>
    </div>
  );
}
