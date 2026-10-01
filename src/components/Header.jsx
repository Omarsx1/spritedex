import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Gamepad2, Share2, Users, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import gsap from 'gsap';
import { Liquid } from 'liquid-gooey';
import { allSprites as defaultAllSprites } from '../data/spritesData';
import { useIsMobile } from '../hooks/useIsMobile';
import { t } from '../i18n';
import { isFortnitemaresActive } from '../config/seasonalEvent';
import { PumpkinIcon } from './icons/PumpkinIcon';

export function Header({
  spritesPool,
  totalCount,
  ownedCount,
  masteredCount,
  user,
  isLiveConnected,
  connectedFriendCode,
  onOpenShareModal,
  onOpenBackupModal,
  onOpenCompareModal,
  onOpenAuthModal
}) {
  // Pool of sprites for hero rotation
  const spritePool = useMemo(() => {
    return spritesPool && spritesPool.length > 0 ? spritesPool : (defaultAllSprites || []);
  }, [spritesPool]);

  // Main hero sprite index
  const [spriteIndex, setSpriteIndex] = useState(() =>
    Math.floor(Math.random() * (spritePool.length || 1))
  );

  // 3 orbiting satellite sprites (different from main)
  const [orbitIndices, setOrbitIndices] = useState(() => {
    const indices = [];
    const used = new Set();
    while (indices.length < 3 && indices.length < spritePool.length) {
      const idx = Math.floor(Math.random() * spritePool.length);
      if (!used.has(idx)) {
        used.add(idx);
        indices.push(idx);
      }
    }
    return indices;
  });

  const activeSpriteRef = useRef(null);
  // Indice ya elegido para la proxima rotacion: se decide un tick antes para que su
  // miniatura tenga tiempo de cargar y el cambio no muestre un hueco.
  const upcomingSpriteRef = useRef(null);
  const orbitContainerRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const dockRef = useRef(null);

  // Menú gooey de acciones (solo móvil): réplica 1:1 de libraries.dev/gooey
  const isMobile = useIsMobile(768);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isFortnitemares, setIsFortnitemares] = useState(() => isFortnitemaresActive());

  useEffect(() => {
    const handleSeasonChange = (e) => {
      setIsFortnitemares(e?.detail?.active !== undefined ? Boolean(e.detail.active) : isFortnitemaresActive());
    };
    window.addEventListener('spritedex:season-change', handleSeasonChange);
    return () => window.removeEventListener('spritedex:season-change', handleSeasonChange);
  }, []);

  // Evita que el modo Ahorro de Batería de Android active prefers-reduced-motion
  // y apague la física líquida de liquid-gooey salvo que el usuario lo desactive en el menú
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const isMotionDisabled = () => document.documentElement.classList.contains('motion-disabled') || document.body?.classList.contains('motion-disabled');
    const origMatchMedia = window.matchMedia;
    window.matchMedia = function (query) {
      if (query === '(prefers-reduced-motion: reduce)') {
        const matches = Boolean(isMotionDisabled());
        return {
          matches,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        };
      }
      return origMatchMedia.call(window, query);
    };
    return () => {
      window.matchMedia = origMatchMedia;
    };
  }, []);

  const toggleActions = useCallback(() => {
    setActionsOpen((prev) => !prev);
  }, []);

  // Al volver a escritorio el menú no debe quedar abierto.
  useEffect(() => {
    if (!isMobile) setActionsOpen(false);
  }, [isMobile]);

  // Escape y toque fuera cierran el menú.
  useEffect(() => {
    if (!actionsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') toggleActions();
    };
    const onPointerDown = (event) => {
      if (dockRef.current && !dockRef.current.contains(event.target)) {
        toggleActions();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [actionsOpen, toggleActions]);

  const gooeyTransition = 'bouncy';
  const currentSprite = spritePool[spriteIndex] || spritePool[0];

  // Progress percentages
  const ownedPct = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;
  const masteredPct = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0;

  // SVG ring properties
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Entrance animations - Optimizado para rendimiento 60/120fps sin colisiones
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (titleRef.current) {
      tl.fromTo(titleRef.current,
        { y: -16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35 }
      );
    }

    if (activeSpriteRef.current) {
      tl.fromTo(activeSpriteRef.current,
        { scale: 0.6, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.4)' },
        '-=0.2'
      );
    }

    if (statsRef.current) {
      // Animar únicamente los dos anillos de progreso, sin animar el contenedor hero__actions
      const rings = statsRef.current.querySelectorAll('.hero__stat-ring');
      if (rings.length > 0) {
        tl.fromTo(rings,
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.05 },
          '-=0.2'
        );
      }
    }

    if (actionsRef.current && actionsRef.current.children.length > 0) {
      // Animar directamente los botones de acción sin doble transformación en el padre
      tl.fromTo(actionsRef.current.children,
        { y: 10, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.28, stagger: 0.04 },
        '-=0.22'
      );
    }
  }, []);

  const pickNextSpriteIndex = useCallback((exclude) => {
    if (spritePool.length <= 1) return 0;
    let next;
    do {
      next = Math.floor(Math.random() * spritePool.length);
    } while (next === exclude);
    return next;
  }, [spritePool]);

  const preloadThumb = useCallback((sprite) => {
    const src = sprite && (sprite.thumb || sprite.image);
    if (!src) return;
    const img = new Image();
    img.decoding = 'async';
    img.src = src;
  }, []);

  // Precarga la miniatura del proximo sprite y la de los satelites actuales, para
  // que el cambio de la rotacion no muestre un hueco.
  useEffect(() => {
    if (spritePool.length === 0) return;
    const next = pickNextSpriteIndex(spriteIndex);
    upcomingSpriteRef.current = next;
    preloadThumb(spritePool[next]);
    orbitIndices.forEach((idx) => preloadThumb(spritePool[idx]));
  }, [spritePool, spriteIndex, orbitIndices, pickNextSpriteIndex, preloadThumb]);

  // Rotate hero sprite with visibility and performance awareness
  useEffect(() => {
    if (spritePool.length === 0) return;

    const intervalTime = window.innerWidth <= 600 ? 5500 : 3500;
    const interval = setInterval(() => {
      if (document.hidden || !activeSpriteRef.current) return;

      gsap.to(activeSpriteRef.current, {
        scale: 0.7,
        opacity: 0,
        y: -20,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          setSpriteIndex((prev) => {
            const planned = upcomingSpriteRef.current;
            if (planned !== null && planned !== undefined && planned !== prev) {
              upcomingSpriteRef.current = null;
              return planned;
            }
            return pickNextSpriteIndex(prev);
          });

          // Also shuffle one random orbit sprite
          setOrbitIndices((prev) => {
            const copy = [...prev];
            const slot = Math.floor(Math.random() * copy.length);
            let next;
            const allUsed = new Set([...copy, spriteIndex]);
            do {
              next = Math.floor(Math.random() * spritePool.length);
            } while (allUsed.has(next) && spritePool.length > 4);
            copy[slot] = next;
            return copy;
          });
        }
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [spritePool, spriteIndex, pickNextSpriteIndex]);

  // GSAP animate in when spriteIndex changes
  useEffect(() => {
    if (activeSpriteRef.current) {
      gsap.fromTo(
        activeSpriteRef.current,
        { scale: 1.3, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.5, ease: 'back.out(1.8)' }
      );
    }
  }, [spriteIndex]);

  const handleImgError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/sprites/water_basic.png';
  }, []);

  return (
    <header className="hero">
      <div className="hero__content">
        {/* Title */}
        <div className="hero__title-block" ref={titleRef} style={{ position: 'relative', zIndex: 10 }}>
          <h1 className="hero__title" data-fnm-logo={isFortnitemares ? 'themed' : 'normal'}>
            <span className="hero__title-line-wrap">
              <span className="hero__title-line hero__title-line--glitch" data-text="FORTNITE">
                FORTNITE
              </span>
              <img
                src="/fortnitemares.svg"
                alt="FORTNITEMARES"
                className="hero__title-fnm-svg"
                aria-hidden={!isFortnitemares}
              />
            </span>
            <span className={`hero__title-line hero__title-line--accent ${isFortnitemares ? 'hero__title-line--accent-fnm' : ''}`}>
              SPRITEDEX
            </span>
          </h1>
        </div>

        {/* Central sprite showcase with orbiting satellites */}
        <div
          className="hero__showcase"
          style={{
            width: '180px',
            height: '180px',
            maxWidth: '180px',
            maxHeight: '180px',
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div className="hero__orbit-ring" ref={orbitContainerRef}>
            {orbitIndices.map((idx, i) => {
              const sprite = spritePool[idx];
              if (!sprite) return null;
              return (
                <div key={`orbit-${i}`} className={`hero__satellite hero__satellite--${i}`}>
                  <img
                    src={sprite.thumb || sprite.image}
                    alt={sprite.fullName}
                    className="hero__satellite-img"
                    style={{
                      width: '100%',
                      height: '100%',
                      maxWidth: '40px',
                      maxHeight: '40px',
                      objectFit: 'contain'
                    }}
                    onError={handleImgError}
                  />
                </div>
              );
            })}
          </div>
          <div
            className="hero__hero-sprite"
            ref={activeSpriteRef}
            style={{
              width: '120px',
              height: '120px',
              maxWidth: '120px',
              maxHeight: '120px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 3
            }}
          >
            {currentSprite && (
              <img
                key={currentSprite.id || spriteIndex}
                src={currentSprite.thumb || currentSprite.image}
                alt={currentSprite.fullName}
                className="hero__hero-img"
                style={{
                  width: '100%',
                  height: '100%',
                  maxWidth: '120px',
                  maxHeight: '120px',
                  objectFit: 'contain',
                  display: 'block'
                }}
                onError={handleImgError}
              />
            )}
          </div>
        </div>

        {/* Stats + Actions bar */}
        <div className="hero__bar" ref={statsRef}>
          <div className="hero__stat-ring">
            <div className="hero__ring-box">
              <svg viewBox="0 0 110 110" className="hero__ring-svg">
                <circle cx="55" cy="55" r={ringRadius} className="hero__ring-track" />
                <circle
                  cx="55" cy="55" r={ringRadius}
                  className="hero__ring-fill hero__ring-fill--caught"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference - (ringCircumference * ownedPct / 100)}
                />
              </svg>
              <div className="hero__stat-inner">
                <span className="hero__stat-value">{ownedCount}</span>
                <span className="hero__stat-of">/ {totalCount}</span>
              </div>
            </div>
            <span className="hero__stat-label">{t('header.atrapados')}</span>
          </div>

          <div className="hero__actions" ref={actionsRef}>
            {!isMobile && (
              <>
                <button
                  className="hero__btn hero__btn--primary"
                  onClick={onOpenCompareModal}
                  title={isLiveConnected ? t('header.radarConectado', { codigo: connectedFriendCode }) : t('header.radarAmigos')}
                  style={{ position: 'relative' }}
                >
                  <Users size={16} className="hero__btn-icon" />
                  <span className="hero__btn-text">{t('header.amigos')}</span>
                  {isLiveConnected && (
                    <span className="hero__live-indicator" title={t('header.conectadoEnVivo', { codigo: connectedFriendCode })} />
                  )}
                </button>
                <button
                  className="hero__btn hero__btn--accent"
                  onClick={onOpenShareModal}
                  onMouseEnter={() => {
                    import('../components/ShareImageModal');
                  }}
                  onTouchStart={() => {
                    import('../components/ShareImageModal');
                  }}
                  title={t('header.compartirImagenTitulo')}
                >
                  <Share2 size={16} className="hero__btn-icon" />
                  <span className="hero__btn-text">{t('header.compartir')}</span>
                </button>
              </>
            )}
          </div>

          <div className="hero__stat-ring">
            <div className="hero__ring-box">
              <svg viewBox="0 0 110 110" className="hero__ring-svg">
                <circle cx="55" cy="55" r={ringRadius} className="hero__ring-track" />
                <circle
                  cx="55" cy="55" r={ringRadius}
                  className="hero__ring-fill hero__ring-fill--mastered"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference - (ringCircumference * masteredPct / 100)}
                />
              </svg>
              <div className="hero__stat-inner">
                <span className="hero__stat-value">{masteredCount}</span>
                <span className="hero__stat-of">/ {totalCount}</span>
              </div>
            </div>
            <span className="hero__stat-label">{t('header.maxeados')}</span>
          </div>
        </div>
      </div>

      {isMobile && typeof document !== 'undefined' && createPortal(
        <div className="hero__dock" ref={dockRef}>
          {isFortnitemares ? (
            <div className={`fnm-dock ${actionsOpen ? 'is-open' : ''}`}>
              {/* Satélite Amigos */}
              <div
                className={`fnm-sat fnm-sat--friends ${actionsOpen ? 'is-visible' : ''}`}
                style={{
                  transform: actionsOpen ? 'translate(-56px, -34px) scale(1)' : 'translate(0, 0) scale(0.3)',
                  opacity: actionsOpen ? 1 : 0,
                  pointerEvents: actionsOpen ? 'auto' : 'none',
                  transition: 'transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease'
                }}
              >
                <button
                  type="button"
                  className="fnm-sat-btn"
                  aria-label={t('header.radarAmigos')}
                  tabIndex={actionsOpen ? 0 : -1}
                  onClick={() => {
                    toggleActions();
                    onOpenCompareModal();
                  }}
                >
                  <Users size={19} strokeWidth={2.2} />
                </button>
              </div>

              {/* Satélite Compartir */}
              <div
                className={`fnm-sat fnm-sat--share ${actionsOpen ? 'is-visible' : ''}`}
                style={{
                  transform: actionsOpen ? 'translate(0px, -66px) scale(1)' : 'translate(0, 0) scale(0.3)',
                  opacity: actionsOpen ? 1 : 0,
                  pointerEvents: actionsOpen ? 'auto' : 'none',
                  transition: 'transform 280ms cubic-bezier(0.34, 1.56, 0.64, 1) 30ms, opacity 200ms ease'
                }}
              >
                <button
                  type="button"
                  className="fnm-sat-btn"
                  aria-label={t('header.compartirImagen')}
                  tabIndex={actionsOpen ? 0 : -1}
                  onClick={() => {
                    toggleActions();
                    onOpenShareModal();
                  }}
                  onMouseEnter={() => {
                    import('../components/ShareImageModal');
                  }}
                  onTouchStart={() => {
                    import('../components/ShareImageModal');
                  }}
                >
                  <Share2 size={19} strokeWidth={2.2} />
                </button>
              </div>

              {/* Botón Principal: Solo la calabaza, SIN fondo alguno */}
              <button
                type="button"
                className="fnm-pumpkin-btn"
                aria-expanded={actionsOpen}
                aria-label={actionsOpen ? t('header.cerrarAcciones') : t('header.abrirAcciones')}
                onClick={toggleActions}
              >
                <PumpkinIcon
                  size={50}
                  className={`fnm-pumpkin-svg ${actionsOpen ? 'is-open' : ''}`}
                />
              </button>
            </div>
          ) : (
            <Liquid
              blur={7}
              contrast={19}
              fill="#0c152d"
              filterPadding={80}
              shadow="0 4px 18px rgba(0, 0, 0, 0.55), 0 0 12px rgba(0, 240, 232, 0.18)"
              className={`pm ${actionsOpen ? 'pm-open' : ''}`}
            >
              <Liquid.Item
                className="pm-slot"
                x={actionsOpen ? -56 : 0}
                y={actionsOpen ? -34 : 0}
                transition={gooeyTransition}
                delay={0}
              >
                <button
                  type="button"
                  className="pm-btn pm-sat"
                  aria-label={t('header.radarAmigos')}
                  tabIndex={actionsOpen ? 0 : -1}
                  onClick={() => {
                    toggleActions();
                    onOpenCompareModal();
                  }}
                >
                  <span
                    className="pm-sat-icon"
                    style={{
                      transitionDelay: actionsOpen ? '110ms' : '0ms'
                    }}
                  >
                    <Users size={19} strokeWidth={2.2} />
                  </span>
                </button>
              </Liquid.Item>

              <Liquid.Item
                className="pm-slot"
                x={0}
                y={actionsOpen ? -66 : 0}
                transition={gooeyTransition}
                delay={actionsOpen ? 35 : 0}
              >
                <button
                  type="button"
                  className="pm-btn pm-sat"
                  aria-label={t('header.compartirImagen')}
                  tabIndex={actionsOpen ? 0 : -1}
                  onClick={() => {
                    toggleActions();
                    onOpenShareModal();
                  }}
                  onMouseEnter={() => {
                    import('../components/ShareImageModal');
                  }}
                  onTouchStart={() => {
                    import('../components/ShareImageModal');
                  }}
                >
                  <span
                    className="pm-sat-icon"
                    style={{
                      transitionDelay: actionsOpen ? '150ms' : '0ms'
                    }}
                  >
                    <Share2 size={19} strokeWidth={2.2} />
                  </span>
                </button>
              </Liquid.Item>

              <Liquid.Item className="pm-slot">
                <button
                  type="button"
                  className="pm-btn pm-main"
                  aria-expanded={actionsOpen}
                  aria-label={actionsOpen ? t('header.cerrarAcciones') : t('header.abrirAcciones')}
                  onClick={toggleActions}
                >
                  <span className="pm-main-icon-wrap">
                    <Gamepad2 size={22} strokeWidth={2.2} className={`pm-icon-pad ${actionsOpen ? 'is-hidden' : ''}`} />
                    <X size={20} strokeWidth={2.4} className={`pm-icon-close ${actionsOpen ? 'is-visible' : ''}`} />
                  </span>
                </button>
              </Liquid.Item>
            </Liquid>
          )}
        </div>,
        document.body
      )}
    </header>

  );
}
