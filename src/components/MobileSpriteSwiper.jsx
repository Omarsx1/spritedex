import React, { useState, useRef, useMemo, useCallback, useEffect, memo } from 'react';
import confetti from 'canvas-confetti';
import { Lock } from 'lucide-react';
import { getSpriteCardStyle, getRarityInfo, VARIANT_ORDER } from '../data/spritesData';
import { sounds } from '../utils/audio';
import { SonicRing } from './SonicRing';
import { safeStorage } from '../utils/safeStorage';
import { trackEvent } from '../utils/telemetry';

const RARITY_GLOWS = {
  'Mítico': '0 12px 28px rgba(245, 182, 66, 0.45), 0 0 16px rgba(245, 182, 66, 0.25)',
  'Legendario': '0 12px 26px rgba(249, 115, 22, 0.4), 0 0 14px rgba(249, 115, 22, 0.22)',
  'Épico': '0 12px 24px rgba(168, 85, 247, 0.4), 0 0 14px rgba(168, 85, 247, 0.22)',
  'Raro': '0 12px 22px rgba(0, 240, 232, 0.35), 0 0 12px rgba(0, 240, 232, 0.2)',
  'Poco Común': '0 12px 20px rgba(34, 197, 94, 0.35), 0 0 10px rgba(34, 197, 94, 0.2)',
  'Común': '0 8px 18px rgba(0, 0, 0, 0.55)'
};

const getVariantPriority = (v) => {
  if (v === 'Base' || v === 'Basic') return 0;
  if (v === 'Gold') return 1;
  if (v === 'Cheatmaster' || v === 'Cheat Master') return 2;
  if (v === 'Loot Hacker' || v === 'LootHacker') return 3;
  const idx = VARIANT_ORDER.indexOf(v);
  return idx === -1 ? 99 : idx;
};

// Dimensiones fijas coleccionables exactas
const W_ACTIVE = 205;
const CARD_HEIGHT = 284;
const W_INACTIVE = 56;
const GAP = 8;

// Cache de estilos por sprite: evita recalcular gradientes, rareza y colores
// en cada render de la fila.
const cardStyleCache = new Map();

function getCachedCardStyle(sprite) {
  if (!sprite) return getSpriteCardStyle(sprite);
  const cached = cardStyleCache.get(sprite.id);
  if (cached) return cached;
  const style = getSpriteCardStyle(sprite);
  cardStyleCache.set(sprite.id, style);
  return style;
}

// Pista de swipe: se enseña una sola vez por dispositivo. Sube la versión para
// volver a mostrarla a todos tras un rediseño.
const SWIPE_HINT_KEY = 'spritedex_swipe_hint_seen_v1';
const SWIPE_HINT_FADE_MS = 260;

/**
 * Fila individual por familia de espíritus con Spotlight Carousel estilo Apple.
 * - Mantiene las dimensiones originales exactas de las tarjetas (205px x 284px).
 * - Si tiene 1 variante: tarjeta centrada limpia.
 * - Si tiene >1 variantes: riel Spotlight fluido con re-crop elástico, peeks laterales y soporte táctil/mouse.
 */
function FamilySpotlightRow({
  familyName,
  variants,
  userState,
  friendState,
  isFriendView,
  onToggleOwned,
  onSetLevel,
  onOpenDetail,
  showHint = false,
  isDismissing = false,
  onSwipeLearned
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  const count = variants ? variants.length : 0;
  const safeActiveIdx = Math.min(Math.max(0, activeIdx), Math.max(0, count - 1));

  // Reset al cambiar filtros o variantes
  const variantsKey = useMemo(() => {
    return (variants || []).map((v) => v.id).join(',');
  }, [variants]);

  const prevKeyRef = useRef(variantsKey);
  if (prevKeyRef.current !== variantsKey) {
    prevKeyRef.current = variantsKey;
    if (activeIdx >= count) {
      setActiveIdx(0);
    }
  }

  // Refs de gestos
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const isPointerDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const dragOffsetRef = useRef(0);
  const trackRef = useRef(null);
  const rafRef = useRef(0);
  const rowRef = useRef(null);
  const prefetchedRef = useRef(false);

  const goTo = useCallback((nextIdx) => {
    const target = Math.min(Math.max(0, nextIdx), count - 1);
    if (target !== safeActiveIdx) {
      setActiveIdx(target);
    }
  }, [count, safeActiveIdx]);

  // Cancela el frame pendiente si la fila se desmonta a mitad de un gesto.
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Precarga las miniaturas de la fila antes de que entre en pantalla.
  useEffect(() => {
    const el = rowRef.current;
    if (!el || prefetchedRef.current || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      prefetchedRef.current = true;
      variants.forEach((v) => {
        const src = v.thumb || v.image;
        if (!src) return;
        const img = new Image();
        img.decoding = 'async';
        img.src = src;
      });
      io.disconnect();
    }, { rootMargin: '250% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [variants]);

  // Aplica el desplazamiento sin re-renderizar: un solo rAF escribe el transform.
  const applyDrag = (diffX, diffY, moveThreshold) => {
    if (!isPointerDownRef.current) return;

    // Si el usuario desliza verticalmente para hacer scroll en la página, liberar control
    if (!hasMovedRef.current && diffY !== 0 && Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 8) {
      isPointerDownRef.current = false;
      return;
    }

    if (Math.abs(diffX) <= moveThreshold) return;
    hasMovedRef.current = true;

    // Resistencia elástica en extremos
    let offset = diffX;
    if (safeActiveIdx === 0 && diffX > 0) {
      offset = diffX * 0.25;
    } else if (safeActiveIdx === count - 1 && diffX < 0) {
      offset = diffX * 0.25;
    }
    dragOffsetRef.current = offset;

    const track = trackRef.current;
    if (!track) return;
    track.classList.add('is-dragging');
    if (rafRef.current) return;

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const el = trackRef.current;
      if (el) {
        el.style.transform = 'translate3d(' + (-centerOffset + dragOffsetRef.current) + 'px, 0, 0)';
      }
    });
  };

  const endDrag = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }

    const offset = dragOffsetRef.current;
    dragOffsetRef.current = 0;

    const track = trackRef.current;
    if (track) track.classList.remove('is-dragging');

    let target = safeActiveIdx;
    if (hasMovedRef.current) {
      const elapsed = Date.now() - startTimeRef.current;
      const isQuickFlick = elapsed < 260 && Math.abs(offset) > 20;
      const isDistanceSwipe = Math.abs(offset) > 36;

      if (isQuickFlick || isDistanceSwipe) {
        if (offset < 0 && safeActiveIdx < count - 1) {
          target = safeActiveIdx + 1;
        } else if (offset > 0 && safeActiveIdx > 0) {
          target = safeActiveIdx - 1;
        }
      }
    }
    hasMovedRef.current = false;

    if (target !== safeActiveIdx) {
      goTo(target);
      // Solo el gesto que cambia de variante marca la pista como aprendida.
      if (onSwipeLearned) onSwipeLearned();
    } else if (track) {
      // Sin cambio de variante: vuelve al centro con la transición CSS.
      track.style.transform = 'translate3d(' + (-centerOffset) + 'px, 0, 0)';
    }
  };

  // Touch handlers
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
    const touch = e.touches[0];
    applyDrag(touch.clientX - startXRef.current, touch.clientY - startYRef.current, 6);
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  // Mouse handlers
  const handleMouseDown = (e) => {
    if (count <= 1 || e.button !== 0) return;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTimeRef.current = Date.now();
    isPointerDownRef.current = true;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e) => {
    applyDrag(e.clientX - startXRef.current, 0, 5);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  if (count === 0) return null;

  // Cálculo matemático del riel centrado:
  // centerOffset = k * (W_INACTIVE + GAP) + W_ACTIVE / 2
  const centerOffset = safeActiveIdx * (W_INACTIVE + GAP) + W_ACTIVE / 2;
  const trackTransform = `translate3d(${-centerOffset}px, 0, 0)`;

  const renderCard = (sprite, idx, isActive) => {
    const spriteState = isFriendView
      ? (friendState?.[sprite.id] || { owned: false, level: 1 })
      : (userState[sprite.id] || { owned: false, level: 1 });

    const isOwned = spriteState.owned;
    const level = spriteState.level || 1;
    const isMastered = isOwned && level === 5;
    const myOwned = userState[sprite.id]?.owned;
    const friendCanLend = isFriendView && isOwned && !myOwned;
    const rarityInfo = getRarityInfo(sprite.rarity);
    const styleInfo = getCachedCardStyle(sprite);

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
          height: `${CARD_HEIGHT}px`,
          background: styleInfo.background,
          borderColor: styleInfo.borderColor,
          boxShadow: isActive && !isMastered
            ? (RARITY_GLOWS[sprite.rarity] || '0 10px 24px rgba(0, 0, 0, 0.55)')
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
        {/* Contenedor interior fijo (205px x 284px) para re-encuadre perfecto sin deformación */}
        <div
          className="ms-spotlight-card__inner"
          style={{ width: `${W_ACTIVE}px`, height: `${CARD_HEIGHT}px` }}
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

          {/* Badge de rareza */}
          <div
            className={`card-rarity-tag sprite-pill rarity-badge ms-spotlight-fade ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
          >
            {rarityInfo.name}
          </div>

          {/* Badge de nivel o amigo */}
          {!sprite.unreleased && (
            isFriendView ? (
              friendCanLend ? (
                <div className="ms-level-tag ms-level-tag--lend ms-spotlight-fade" onClick={handleToggleBadgeClick}>
                  {myOwned ? '✓ REGISTRADO' : '🎁 PRESTA'}
                </div>
              ) : isOwned ? (
                <div className="ms-level-tag ms-level-tag--friend ms-spotlight-fade">
                  ✓ AMIGO
                </div>
              ) : null
            ) : isOwned ? (
              <div
                className={`ms-level-tag ${isMastered ? 'ms-level-tag--mastered' : ''} ms-spotlight-fade`}
                onClick={handleToggleBadgeClick}
                title="Toca para desmarcar o cambiar"
              >
                {isMastered ? 'MAX' : `LVL.${level}`}
              </div>
            ) : null
          )}

          {/* Imagen del Sprite */}
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
              src={sprite.thumb || sprite.image}
              alt={sprite.fullName}
              loading="lazy"
              decoding="async"
              width={W_ACTIVE}
              height={CARD_HEIGHT}
              draggable={false}
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

          {/* Footer: Nombre + Acción */}
          <div className="ms-card__footer ms-spotlight-fade">
            <div className="ms-card__info">
              <div className={`card-name ${sprite.fullName && sprite.fullName.length > 18 ? 'card-name--long' : ''}`}>
                {sprite.fullName}
              </div>
            </div>

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
      </div>
    );
  };

  return (
    <div className="ms-family-row" ref={rowRef}>
      {/* Header con hint de variantes centrado encima de la tarjeta (solo si hay más de 1 variante) */}
      {count > 1 && showHint && (
        <div className="ms-family-header">
          <span className={'ms-family-hint' + (isDismissing ? ' is-dismissing' : '')}>
            Desliza para ver {count} variantes →
          </span>
        </div>
      )}

      {/* Escenario de navegación */}
      {count === 1 ? (
        <div className="ms-family-single-stage">
          {renderCard(variants[0], 0, true)}
        </div>
      ) : (
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
          <div
            ref={trackRef}
            className="ms-spotlight-track"
            style={{ transform: trackTransform }}
          >
            {variants.map((v, i) => renderCard(v, i, i === safeActiveIdx))}
          </div>
        </div>
      )}
    </div>
  );
}

// Memoizado: alternar una tarjeta no debe re-renderizar el resto de las filas.
const MemoizedFamilySpotlightRow = memo(FamilySpotlightRow);

/**
 * MobileSpriteSwiper principal.
 * Agrupa los espíritus por familia manteniendo el orden vertical y renderiza
 * cada familia con su propio Spotlight Carousel fluido para sus variantes.
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
    (sprites || []).forEach((sprite) => {
      const fId = sprite.familyId || sprite.id;
      if (!familyMap.has(fId)) {
        familyMap.set(fId, {
          familyId: fId,
          familyName: sprite.familyName || sprite.fullName,
          variants: []
        });
      }
      familyMap.get(fId).variants.push(sprite);
    });

    // Ordenar variantes canónicamente dentro de cada familia
    return Array.from(familyMap.values()).map((family) => ({
      ...family,
      variants: [...family.variants].sort((a, b) => getVariantPriority(a.variant) - getVariantPriority(b.variant))
    }));
  }, [sprites]);

  // La pista se apaga en todas las filas a la vez, la primera vez que el usuario
  // cambia de variante con un deslizamiento.
  const [showSwipeHint, setShowSwipeHint] = useState(() => safeStorage.getItem(SWIPE_HINT_KEY) !== 'true');
  const [isDismissingHint, setIsDismissingHint] = useState(false);
  const hintDismissedRef = useRef(false);
  const hintTimerRef = useRef(0);

  const handleSwipeLearned = useCallback(() => {
    if (hintDismissedRef.current) return;
    hintDismissedRef.current = true;
    safeStorage.setItem(SWIPE_HINT_KEY, 'true');
    setIsDismissingHint(true);
    trackEvent('swipe_hint_dismissed');
    hintTimerRef.current = setTimeout(() => {
      hintTimerRef.current = 0;
      setShowSwipeHint(false);
      setIsDismissingHint(false);
    }, SWIPE_HINT_FADE_MS);
  }, []);

  useEffect(() => () => {
    if (hintTimerRef.current) clearTimeout(hintTimerRef.current);
  }, []);

  if (!families || families.length === 0) return null;

  return (
    <div className="mobile-swiper">
      <div className="mobile-swiper__blueprint-layer-1" aria-hidden="true" />
      <div className="mobile-swiper__blueprint-layer-2" aria-hidden="true" />
      <div className="mobile-swiper__blueprint-layer-3" aria-hidden="true" />

      <div className="mobile-swiper__content">
        {families.map((family) => (
          <MemoizedFamilySpotlightRow
            key={family.familyId}
            familyName={family.familyName}
            variants={family.variants}
            userState={userState}
            friendState={friendState}
            isFriendView={isFriendView}
            onToggleOwned={onToggleOwned}
            onSetLevel={onSetLevel}
            onOpenDetail={onOpenDetail}
            showHint={showSwipeHint || isDismissingHint}
            isDismissing={isDismissingHint}
            onSwipeLearned={handleSwipeLearned}
          />
        ))}
      </div>
    </div>
  );
}
