import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Share2, Download, Users, Cloud } from 'lucide-react';
import gsap from 'gsap';
import { allSprites } from '../data/spritesData';

export function Header({
  totalCount,
  ownedCount,
  masteredCount,
  user,
  onOpenShareModal,
  onOpenBackupModal,
  onOpenCompareModal,
  onOpenAuthModal
}) {
  // Pool of sprites for hero rotation
  const spritePool = useMemo(() => {
    return allSprites && allSprites.length > 0 ? allSprites : [];
  }, []);

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
  const ringRadius = 38;
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

  // Rotate hero sprite every 2.8s
  useEffect(() => {
    if (spritePool.length === 0) return;

    const interval = setInterval(() => {
      if (!activeSpriteRef.current) return;

      gsap.to(activeSpriteRef.current, {
        scale: 0.7,
        opacity: 0,
        y: -20,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          setSpriteIndex((prev) => {
            if (spritePool.length <= 1) return 0;
            let next;
            do {
              next = Math.floor(Math.random() * spritePool.length);
            } while (next === prev);
            return next;
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
    }, 2800);

    return () => clearInterval(interval);
  }, [spritePool, spriteIndex]);

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
      {/* Animated background layers */}
      <div className="hero__bg">
        <div className="hero__grid" />
        <div className="hero__glow hero__glow--1" />
        <div className="hero__glow hero__glow--2" />
        <div className="hero__glow hero__glow--3" />
        <div className="hero__scanline" />
        <div className="hero__particles" />
      </div>

      <div className="hero__content">
        {/* Title */}
        <div className="hero__title-block" ref={titleRef}>
          <h1 className="hero__title">
            <span className="hero__title-line">FORTNITE</span>
            <span className="hero__title-line hero__title-line--accent">SPRITEDEX</span>
          </h1>
        </div>

        {/* Central sprite showcase with orbiting satellites */}
        <div className="hero__showcase">
          <div className="hero__orbit-ring" ref={orbitContainerRef}>
            {orbitIndices.map((idx, i) => {
              const sprite = spritePool[idx];
              if (!sprite) return null;
              return (
                <div key={`orbit-${i}`} className={`hero__satellite hero__satellite--${i}`}>
                  <img
                    src={sprite.image}
                    alt={sprite.fullName}
                    className="hero__satellite-img"
                    onError={handleImgError}
                  />
                </div>
              );
            })}
          </div>
          <div className="hero__hero-sprite" ref={activeSpriteRef}>
            {currentSprite && (
              <img
                key={currentSprite.id || spriteIndex}
                src={currentSprite.image}
                alt={currentSprite.fullName}
                className="hero__hero-img"
                onError={handleImgError}
              />
            )}
          </div>

        </div>

        {/* Stats + Actions bar */}
        <div className="hero__bar" ref={statsRef}>
          <div className="hero__stat-ring">
            <div className="hero__ring-box">
              <svg viewBox="0 0 88 88" className="hero__ring-svg">
                <circle cx="44" cy="44" r={ringRadius} className="hero__ring-track" />
                <circle
                  cx="44" cy="44" r={ringRadius}
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
            <button className="hero__btn hero__btn--primary" onClick={onOpenCompareModal} title="Intercambio Fortnite">
              <Users size={16} className="hero__btn-icon" />
              <span className="hero__btn-text">Intercambio</span>
            </button>
            <button className="hero__btn hero__btn--accent" onClick={onOpenShareModal} title="Compartir Imagen">
              <Share2 size={16} className="hero__btn-icon" />
              <span className="hero__btn-text">Compartir</span>
            </button>
            <button className="hero__btn hero__btn--ghost" onClick={onOpenBackupModal} title="Respaldo">
              <Download size={16} className="hero__btn-icon" />
              <span className="hero__btn-text">Respaldo</span>
            </button>
            <button className="hero__btn hero__btn--ghost" onClick={onOpenAuthModal} title={user ? `Sincronizado (${user.email})` : "Sincronizar en Nube"}>
              <Cloud size={16} className="hero__btn-icon" style={{ color: user ? '#10b981' : '#a855f7' }} />
              <span className="hero__btn-text" style={user ? { color: '#10b981' } : {}}>{user ? 'Nube ✓' : 'Nube'}</span>
            </button>
          </div>

          <div className="hero__stat-ring">
            <div className="hero__ring-box">
              <svg viewBox="0 0 88 88" className="hero__ring-svg">
                <circle cx="44" cy="44" r={ringRadius} className="hero__ring-track" />
                <circle
                  cx="44" cy="44" r={ringRadius}
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
            <span className="hero__stat-label">MAESTREADOS</span>
          </div>
        </div>
      </div>
    </header>
  );
}
