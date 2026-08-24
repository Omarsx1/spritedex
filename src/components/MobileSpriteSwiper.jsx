import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';
import { SonicRing } from './SonicRing';

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

          const handleToggleBadgeClick = (e) => {
            e.stopPropagation();
            if (isFriendView) {
              if (friendCanLend) {
                const nextOwned = !myOwned;
                onToggleOwned(sprite.id);
                sounds.playToggle(nextOwned, sprite.gen);
                if (nextOwned) confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
              }
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
            if (!isOwned) {
              onToggleOwned(sprite.id);
              onSetLevel(sprite.id, newLevel);
              sounds.playToggle(true, sprite.gen);
              sounds.playLevelUp(newLevel, sprite.gen);
              if (newLevel === 5) confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
              else confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
            } else if (level === 1 && newLevel === 1) {
              onToggleOwned(sprite.id);
              sounds.playToggle(false, sprite.gen);
            } else {
              onSetLevel(sprite.id, newLevel);
              sounds.playLevelUp(newLevel, sprite.gen);
              if (newLevel === 5) confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
            }
          };

          const dragStyle = isCurrent && dragOffset !== 0 ? {
            transform: `translateX(${dragOffset}px) rotateZ(${dragOffset * 0.05}deg) scale(1)`,
            transition: 'none'
          } : {};

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

              {/* Etiqueta de variante (esquina superior izquierda) */}
              {variants.length > 1 && (
                <div className="ms-variant-tag">
                  {sprite.variantDisplay || sprite.variant}
                </div>
              )}

              {/* Badge de nivel o amigo (esquina superior derecha, solo si está atrapado o vista amigo) */}
              {isFriendView ? (
                friendCanLend ? (
                  <div className="ms-level-tag ms-level-tag--lend" onClick={handleToggleBadgeClick}>
                    {myOwned ? '✓ REGISTRADO' : '🎁 PRESTA'}
                  </div>
                ) : isOwned ? (
                  <div className="ms-level-tag ms-level-tag--friend">
                    ✓ AMIGO
                  </div>
                ) : null
              ) : isOwned ? (
                <div
                  className={`ms-level-tag ${isMastered ? 'ms-level-tag--mastered' : ''}`}
                  onClick={handleToggleBadgeClick}
                  title="Toca para desmarcar o cambiar"
                >
                  {isMastered ? 'MAX' : `LVL.${level}`}
                </div>
              ) : null}

              {/* Imagen del Sprite (proporciones esbeltas) */}
              <div className="ms-card__image" onClick={handleImageClick}>
                {isMastered && (
                  <img
                    src="/img/x/sprites/crown.webp"
                    alt="Corona"
                    className="ms-card__crown"
                  />
                )}
                <img
                  src={sprite.image}
                  alt={sprite.fullName}
                  loading="lazy"
                  style={{
                    filter: !isOwned ? 'grayscale(55%) opacity(0.68) brightness(1.2) contrast(1.15)' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
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
                <div className="card-name" style={{ fontSize: '1.02rem' }}>{sprite.fullName}</div>
                <div className="card-meta">
                  <span className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}>
                    {rarityInfo.name}
                  </span>
                  <span className="drop-pct">{sprite.dropChanceDisplay}</span>
                </div>
              </div>

              {/* Control inferior: Estrellas si está atrapado, botón estándar si no */}
              {isOwned ? (
                <div
                  className="card-level-stars ms-stars"
                  onClick={(e) => e.stopPropagation()}
                >
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      className={`star-btn ${level >= num ? 'active' : ''} ${isMastered && num === 5 ? 'mastered-star' : ''} ${sprite.gen === 2 ? 'is-sonic-ring-btn' : ''}`}
                      onClick={(e) => handleLevelClick(e, num)}
                      style={isFriendView ? { pointerEvents: 'none' } : {}}
                      title={level === 1 && num === 1 ? 'Toca para desmarcar' : `Nivel ${num}`}
                    >
                      {sprite.gen === 2 ? (
                        <SonicRing active={level >= num} mastered={isMastered && num === 5} size={20} />
                      ) : (
                        '★'
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  className="card-owned-btn"
                  onClick={handleToggleBadgeClick}
                  style={isFriendView && friendCanLend ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', fontWeight: 800 } : {}}
                >
                  <span className="btn-text">
                    {isFriendView
                      ? (friendCanLend ? '+ Registrar en mi Dex' : 'No lo tiene')
                      : 'Sin atrapar'}
                  </span>
                </button>
              )}
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
