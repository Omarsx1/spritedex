import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Share2, Download, Users, Cloud } from 'lucide-react';
import gsap from 'gsap';
import { allSprites } from '../data/spritesData';

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
    return spritesPool && spritesPool.length > 0 ? spritesPool : (allSprites || []);
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
  const orbitContainerRef = useRef(null);
  const titleRef = useRef(null);
  const statsRef = useRef(null);
  const actionsRef = useRef(null);
  const currentSprite = spritePool[spriteIndex] || spritePool[0];

  // Progress percentages
  const ownedPct = totalCount > 0 ? (ownedCount / totalCount) * 100 : 0;
  const masteredPct = totalCount > 0 ? (masteredCount / totalCount) * 100 : 0;

  // SVG ring properties
  const ringRadius = 48;
  const ringCircumference = 2 * Math.PI * ringRadius;

  // Entrance animations
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    if (titleRef.current) {
      tl.fromTo(titleRef.current,
        { y: -30, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7 }
      );
    }

    if (activeSpriteRef.current) {
      tl.fromTo(activeSpriteRef.current,
        { scale: 0, opacity: 0, rotation: -15 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.6, ease: 'back.out(1.7)' },
        '-=0.3'
      );
    }

    if (statsRef.current) {
      tl.fromTo(statsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.12 },
        '-=0.2'
      );
    }

    if (actionsRef.current) {
      tl.fromTo(actionsRef.current.children,
        { y: 15, opacity: 0, scale: 0.9 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, stagger: 0.08 },
        '-=0.2'
      );
    }
  }, []);

  // Rotate hero sprite with visibility and performance awareness
  useEffect(() => {
    if (spritePool.length === 0) return;

    const intervalTime = window.innerWidth <= 600 ? 5500 : 3500;
    const interval = setInterval(() => {
      if (document.hidden || !activeSpriteRef.current) return;

      gsap.to(activeSpriteRef.current, {
        scale: 0,
        opacity: 0,
        rotation: 15,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          setSpriteIndex(prev => {
            let next;
            do {
              next = Math.floor(Math.random() * spritePool.length);
            } while (next === prev && spritePool.length > 1);
            return next;
          });
          setOrbitIndices(() => {
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
          gsap.fromTo(activeSpriteRef.current,
            { scale: 0, opacity: 0, rotation: -15 },
            { scale: 1, opacity: 1, rotation: 0, duration: 0.45, ease: 'back.out(1.7)' }
          );
        }
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [spritePool]);

  const handleImgError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/sprites/water_basic.png';
  }, []);

  return (
    <header className="hero">
      <div className="hero__glow" />

      <div className="hero__content">
        {/* Title */}
        <div className="hero__title-box" ref={titleRef}>
          <h1 className="hero__title">
            <span className="hero__title-fortnite">FORTNITE</span>
            <span className="hero__title-spritedex">SPRITEDEX</span>
          </h1>
        </div>

        {/* Dynamic Sprite Showcase - 1 central + 3 orbiting satellites */}
        <div className="hero__showcase">
          {/* Central Sprite */}
          <div className="hero__active-sprite" ref={activeSpriteRef}>
            <div className="hero__sprite-glow" />
            <img
              src={currentSprite.image}
              alt={currentSprite.fullName}
              className="hero__sprite-img"
              loading="eager"
              onError={handleImgError}
            />
          </div>

          {/* 3 Orbiting Satellites */}
          <div className="hero__satellites" ref={orbitContainerRef}>
            {orbitIndices.map((idx, i) => {
              const sprite = spritePool[idx] || spritePool[0];
              return (
                <div key={`${sprite.id}-${i}`} className={`hero__satellite hero__satellite--${i + 1}`}>
                  <img
                    src={sprite.image}
                    alt={sprite.fullName}
                    className="hero__satellite-img"
                    loading="lazy"
                    onError={handleImgError}
                  />
                </div>
              );
            })}
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
            <span className="hero__stat-label">ATRAPADOS</span>
          </div>

          <div className="hero__actions" ref={actionsRef}>
            <button
              className="hero__btn hero__btn--primary"
              onClick={onOpenCompareModal}
              title={isLiveConnected ? `Intercambio en vivo conectado (${connectedFriendCode})` : "Intercambio Fortnite"}
              style={{ position: 'relative' }}
            >
              <Users size={16} className="hero__btn-icon" />
              <span className="hero__btn-text">Intercambio</span>
              {isLiveConnected && (
                <span className="hero__live-indicator" title={`Conectado en vivo (${connectedFriendCode})`} />
              )}
            </button>
            <button className="hero__btn hero__btn--accent" onClick={onOpenShareModal} title="Compartir Imagen">
              <Share2 size={16} className="hero__btn-icon" />
              <span className="hero__btn-text">Compartir</span>
            </button>
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
            <span className="hero__stat-label">MAXEADOS</span>
          </div>
        </div>
      </div>
    </header>
  );
}
