import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { getSpriteCardStyle, getRarityInfo } from '../data/spritesData';
import { sounds } from '../utils/audio';
import { SonicRing } from './SonicRing';

const RARITY_GLOWS = {
  'Mítico': '0 16px 36px rgba(245, 182, 66, 0.45), 0 0 20px rgba(245, 182, 66, 0.3)',
  'Legendario': '0 16px 32px rgba(249, 115, 22, 0.4), 0 0 18px rgba(249, 115, 22, 0.25)',
  'Épico': '0 16px 30px rgba(168, 85, 247, 0.4), 0 0 18px rgba(168, 85, 247, 0.25)',
  'Raro': '0 16px 28px rgba(0, 240, 232, 0.35), 0 0 16px rgba(0, 240, 232, 0.22)',
  'Poco Común': '0 16px 26px rgba(34, 197, 94, 0.35), 0 0 14px rgba(34, 197, 94, 0.22)',
  'Común': '0 10px 24px rgba(0, 0, 0, 0.55)'
};

/**
 * MobileSpriteSwiper (Spotlight Carousel)
 * Recrea con precisión de píxel la interacción y física fluida tipo Apple del Spotlight Carousel:
 * - Tarjeta central activa re-encuadrada y expandida a 240px.
 * - Tarjetas laterales shingled / recortadas a 72px sin deformar la imagen ni cambiar escala de golpe.
 * - Riel matemático perfectamente centrado en pantalla:
 *     centerOffset = k * (W_INACTIVE + GAP) + W_ACTIVE / 2
 *     transform = translate3d(-centerOffset + dragOffset, 0, 0)
 * - Curva de resorte elástica tipo iOS: cubic-bezier(0.32, 0.72, 0, 1).
 * - Soporte fluido para gestos táctiles (touch) y arrastre con mouse.
 * - Paginación inteligente con píldora alargada activa y puntos elásticos.
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
  const [activeIdx, setActiveIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  // Detección responsive de ancho
  useEffect(() => {
    const checkWidth = () => {
      setIsCompact(window.innerWidth <= 380);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth, { passive: true });
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const W_ACTIVE = isCompact ? 224 : 240;
  const W_INACTIVE = isCompact ? 64 : 72;
  const GAP = 12;

  // Clamping seguro del índice activo
  const count = sprites ? sprites.length : 0;
  const safeIdx = Math.min(Math.max(0, activeIdx), Math.max(0, count - 1));

  // Reset del índice si la lista de sprites cambia por filtros
  const spritesKey = useMemo(() => {
    return (sprites || []).slice(0, 10).map((s) => s.id).join(',');
  }, [sprites]);

  const prevKeyRef = useRef(spritesKey);
  if (prevKeyRef.current !== spritesKey) {
    prevKeyRef.current = spritesKey;
    if (activeIdx >= count) {
      setActiveIdx(0);
    }
  }

  // Refs para tracking de drag táctil y ratón
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);

  // Navegación hacia anterior o siguiente
  const goTo = useCallback((nextIndex) => {
    const target = Math.min(Math.max(0, nextIndex), count - 1);
    if (target !== safeIdx) {
      setActiveIdx(target);
      sounds.playBeep();
    }
  }, [count, safeIdx]);

  // Manejo de eventos Touch
  const handleTouchStart = (e) => {
    if (count <= 1) return;
    const touch = e.touches[0];
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
    startTimeRef.current = Date.now();
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
  };

  const handleTouchMove = (e) => {
    if (!isPointerDownRef.current) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - startXRef.current;
    const diffY = touch.clientY - startYRef.current;

    // Si el usuario desliza verticalmente para hacer scroll en la página, no bloquearlo
    if (!hasMovedRef.current && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
      isPointerDownRef.current = false;
      return;
    }

    if (Math.abs(diffX) > 6) {
      hasMovedRef.current = true;
      setIsDragging(true);

      // Resistencia elástica tipo resorte en los extremos
      let offset = diffX;
      if (safeIdx === 0 && diffX > 0) {
        offset = diffX * 0.25;
      } else if (safeIdx === count - 1 && diffX < 0) {
        offset = diffX * 0.25;
      }
      setDragOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    if (hasMovedRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const isQuickFlick = elapsed < 260 && Math.abs(dragOffset) > 20;
      const isDistanceSwipe = Math.abs(dragOffset) > 36;

      if (isQuickFlick || isDistanceSwipe) {
        if (dragOffset < 0 && safeIdx < count - 1) {
          goTo(safeIdx + 1);
        } else if (dragOffset > 0 && safeIdx > 0) {
          goTo(safeIdx - 1);
        }
      }
    }
    setDragOffset(0);
  };

  // Manejo de eventos Mouse (para Desktop / Spotlight View)
  const handleMouseDown = (e) => {
    if (count <= 1 || e.button !== 0) return;
    startXRef.current = e.clientX;
    startTimeRef.current = Date.now();
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isPointerDownRef.current) return;
    const diffX = e.clientX - startXRef.current;
    if (Math.abs(diffX) > 5) {
      hasMovedRef.current = true;
      setIsDragging(true);
      let offset = diffX;
      if (safeIdx === 0 && diffX > 0) {
        offset = diffX * 0.25;
      } else if (safeIdx === count - 1 && diffX < 0) {
        offset = diffX * 0.25;
      }
      setDragOffset(offset);
    }
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    if (hasMovedRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const isQuickFlick = elapsed < 260 && Math.abs(dragOffset) > 20;
      const isDistanceSwipe = Math.abs(dragOffset) > 36;

      if (isQuickFlick || isDistanceSwipe) {
        if (dragOffset < 0 && safeIdx < count - 1) {
          goTo(safeIdx + 1);
        } else if (dragOffset > 0 && safeIdx > 0) {
          goTo(safeIdx - 1);
        }
      }
    }
    setDragOffset(0);
  };

  // Navegación con teclado (Flecha Izquierda / Derecha)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') {
        goTo(safeIdx - 1);
      } else if (e.key === 'ArrowRight') {
        goTo(safeIdx + 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goTo, safeIdx]);

  if (!sprites || sprites.length === 0) return null;

  // Cálculo matemático del centrado del riel
  // centerOffset = k * (W_INACTIVE + GAP) + W_ACTIVE / 2
  const centerOffset = safeIdx * (W_INACTIVE + GAP) + W_ACTIVE / 2;
  const trackTransform = `translate3d(${-centerOffset + dragOffset}px, 0, 0)`;

  const activeSprite = sprites[safeIdx];

  // Paginación inteligente con ventana deslizante (máximo 9 puntos visibles)
  const maxVisibleDots = 9;
  let dotIndices = [];
  if (count <= maxVisibleDots) {
    dotIndices = sprites.map((_, i) => i);
  } else {
    let startDot = Math.max(0, safeIdx - 4);
    let endDot = Math.min(count - 1, startDot + maxVisibleDots - 1);
    if (endDot - startDot < maxVisibleDots - 1) {
      startDot = Math.max(0, endDot - maxVisibleDots + 1);
    }
    for (let i = startDot; i <= endDot; i++) {
      dotIndices.push(i);
    }
  }

  return (
    <div className="ms-spotlight-wrapper">
      {/* HUD Superior: Nombre de familia, contador y navegación rápida */}
      <div className="ms-spotlight-hud">
        <div className="ms-spotlight-hud__info">
          <span className="ms-spotlight-hud__tag">
            {activeSprite.gen === 2 ? '⚡ GEN 2' : '🌟 GEN 1'}
          </span>
          <span className="ms-spotlight-hud__name">
            {activeSprite.familyName || activeSprite.fullName}
          </span>
        </div>
        <div className="ms-spotlight-hud__counter">
          <span className="ms-spotlight-hud__idx">{String(safeIdx + 1).padStart(2, '0')}</span>
          <span className="ms-spotlight-hud__slash">/</span>
          <span className="ms-spotlight-hud__total">{String(count).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Escenario del Spotlight Carousel */}
      <div
        className="ms-spotlight-stage"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Botones de navegación laterales para escritorio y tablet */}
        {safeIdx > 0 && (
          <button
            type="button"
            className="ms-spotlight-nav-btn ms-spotlight-nav-btn--prev"
            onClick={(e) => {
              e.stopPropagation();
              goTo(safeIdx - 1);
            }}
            aria-label="Espíritu anterior"
          >
            <ChevronLeft size={20} />
          </button>
        )}

        {safeIdx < count - 1 && (
          <button
            type="button"
            className="ms-spotlight-nav-btn ms-spotlight-nav-btn--next"
            onClick={(e) => {
              e.stopPropagation();
              goTo(safeIdx + 1);
            }}
            aria-label="Siguiente espíritu"
          >
            <ChevronRight size={20} />
          </button>
        )}

        {/* Riel móvil animado matemáticamente */}
        <div
          className="ms-spotlight-track"
          style={{
            transform: trackTransform,
            transition: isDragging ? 'none' : 'transform 0.45s cubic-bezier(0.32, 0.72, 0, 1)'
          }}
        >
          {sprites.map((sprite, idx) => {
            const isActive = idx === safeIdx;
            const distFromActive = Math.abs(idx - safeIdx);

            // Optimización de rendimiento: Renderizar DOM ligero para tarjetas fuera de la ventana inmediata
            const isFar = distFromActive > 4;

            const spriteState = isFriendView
              ? (friendState?.[sprite.id] || { owned: false, level: 1 })
              : (userState[sprite.id] || { owned: false, level: 1 });

            const isOwned = spriteState.owned;
            const level = spriteState.level || 1;
            const isMastered = isOwned && level === 5;
            const myOwned = userState[sprite.id]?.owned;
            const friendCanLend = isFriendView && isOwned && !myOwned;
            const rarityInfo = getRarityInfo(sprite.rarity);
            const styleInfo = getSpriteCardStyle(sprite);

            const cardWidth = isActive ? W_ACTIVE : W_INACTIVE;

            const handleToggleBadgeClick = (e) => {
              e.stopPropagation();
              if (sprite.unreleased) return;
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

            const handleLevelClick = (e, newLevel) => {
              e.stopPropagation();
              if (sprite.unreleased) return;
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

            return (
              <div
                key={sprite.id}
                className={`ms-spotlight-card ${isActive ? 'is-active' : 'is-inactive'} sprite-card ${isOwned ? 'is-owned' : ''} ${isMastered ? ('is-mastered ' + (sprite.gen === 2 ? 'is-glitch-mastered' : 'is-classic-mastered')) : ''}`}
                style={{
                  width: `${cardWidth}px`,
                  background: styleInfo.background,
                  borderColor: styleInfo.borderColor,
                  boxShadow: isActive && !isMastered
                    ? (RARITY_GLOWS[sprite.rarity] || '0 16px 36px rgba(0, 0, 0, 0.55)')
                    : undefined
                }}
                onClick={() => {
                  if (!isActive) {
                    goTo(idx);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Ver ${sprite.fullName}`}
              >
                {/* Contenido interior con ancho fijo (W_ACTIVE) y centrado */}
                {/* Permite el re-encuadre (re-crop) sin deformar el sprite */}
                {!isFar && (
                  <div
                    className="ms-spotlight-card__inner"
                    style={{ width: `${W_ACTIVE}px` }}
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

                    {/* Badge de rareza (esquina superior izquierda) - Fade out suave en inactivas */}
                    <div
                      className={`card-rarity-tag sprite-pill rarity-badge ms-spotlight-fade ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
                    >
                      {rarityInfo.name}
                    </div>

                    {/* Badge de nivel o amigo (esquina superior derecha) */}
                    {!sprite.unreleased && (
                      <div className="ms-spotlight-fade">
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
                      </div>
                    )}

                    {/* Imagen del Sprite (centrada en la ventana del aperture) */}
                    <div
                      className="ms-card__image"
                      onClick={(e) => {
                        if (isActive) {
                          e.stopPropagation();
                          onOpenDetail(sprite);
                        }
                      }}
                    >
                      {isMastered && (
                        <img
                          src="/img/x/sprites/crown.webp"
                          alt="Corona"
                          className="ms-card__crown ms-spotlight-fade"
                          decoding="async"
                          loading="lazy"
                          width="32"
                          height="32"
                        />
                      )}
                      <img
                        src={sprite.image}
                        alt={sprite.fullName}
                        loading={distFromActive <= 2 ? "eager" : "lazy"}
                        fetchPriority={isActive ? "high" : "auto"}
                        decoding="async"
                        style={{
                          filter: !isOwned
                            ? 'grayscale(55%) opacity(0.68) brightness(1.2) contrast(1.15)'
                            : 'drop-shadow(0 6px 14px rgba(0,0,0,0.5))',
                          cursor: isActive ? 'pointer' : 'default'
                        }}
                        onError={(e) => {
                          if (!e.target.dataset.triedBase) {
                            e.target.dataset.triedBase = 'true';
                            const baseId = sprite.id ? sprite.id.split('_')[0] : 'water';
                            const isWebpBase = sprite.gen === 2 || ['pond', 'klombo', 'sonic', 'shadow', 'tails', 'crash', 'blinky', 'birthday', 'morgana', '8bit', 'adventure', 'bush', 'jonesy', 'killswitch', 'stormscout', 'onigiri', 'overshield', 'xray', 'peely', 'llama', 'ironmouse'].includes(baseId);
                            if (isWebpBase) {
                              e.target.src = `/sprites/${baseId}_basic.webp`;
                            } else {
                              e.target.src = `/sprites/${baseId}_basic.png`;
                            }
                          } else {
                            e.target.onerror = null;
                            e.target.src = sprite.gen === 2 ? '/sprites/sonic_basic.webp' : '/sprites/water_basic.png';
                          }
                        }}
                      />
                    </div>

                    {/* Footer unificado: Nombre + Acción interactiva (desvanece en inactivas) */}
                    <div className="ms-card__footer ms-spotlight-fade">
                      <div className="ms-card__info">
                        <div className={`card-name ${sprite.fullName && sprite.fullName.length > 18 ? 'card-name--long' : ''}`}>
                          {sprite.fullName}
                        </div>
                      </div>

                      {/* Botón o estrellas */}
                      <div className="ms-card__action">
                        {sprite.unreleased ? (
                          <div className="card-unreleased-pill" onClick={(e) => e.stopPropagation()}>
                            <Lock size={13} />
                            <span>No lanzado</span>
                          </div>
                        ) : isOwned ? (
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
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Paginación estilo Apple (Píldora activa + puntos) */}
      <div className="ms-spotlight-pagination" role="tablist">
        {dotIndices.map((i) => {
          const isCurrent = i === safeIdx;
          const dist = Math.abs(i - safeIdx);
          const isEdge = count > maxVisibleDots && dist >= 3;
          return (
            <button
              key={sprites[i]?.id || i}
              type="button"
              className={`ms-spotlight-dot ${isCurrent ? 'is-active' : ''} ${isEdge ? 'is-edge' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Ver espíritu ${i + 1}`}
            />
          );
        })}
      </div>
    </div>
  );
}
