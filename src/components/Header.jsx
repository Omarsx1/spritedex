import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Share2, Download, Users } from 'lucide-react';
import gsap from 'gsap';
import { allSprites } from '../data/spritesData';

export function Header({
  totalCount,
  ownedCount,
  masteredCount,
  onOpenShareModal,
  onOpenBackupModal,
  onOpenCompareModal
}) {
  // Pool of sprites for hero rotation
  const spritePool = useMemo(() => {
    return allSprites && allSprites.length > 0 ? allSprites : [];
  }, []);

  const [spriteIndex, setSpriteIndex] = useState(() => {
    return Math.floor(Math.random() * (spritePool.length || 1));
  });

  const activeSpriteRef = useRef(null);
  const currentSprite = spritePool[spriteIndex] || spritePool[0];

  // Dynamic RANDOM Sprite Switcher driven by GSAP
  useEffect(() => {
    if (spritePool.length === 0) return;

    const interval = setInterval(() => {
      if (!activeSpriteRef.current) return;

      // GSAP animate out
      gsap.to(activeSpriteRef.current, {
        y: -16,
        opacity: 0,
        scale: 0.85,
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
        }
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [spritePool]);

  // GSAP animate in whenever spriteIndex changes
  useEffect(() => {
    if (activeSpriteRef.current) {
      gsap.fromTo(
        activeSpriteRef.current,
        { y: 16, opacity: 0, scale: 1.15 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }
      );
    }
  }, [spriteIndex]);

  return (
    <header className="site-header">
      <div className="header-banner">
        <div className="header-banner-overlay" />
        <div className="header-content">
          
          {/* Title & Dynamic Random Sprite Showcase */}
          <div className="header-title-wrapper">
            <h1 className="header-title">
              TODOS LOS SPRITES DE FORTNITE
            </h1>

            {/* GSAP Animated Large Floating Random Sprite Character */}
            <div className="header-hero-sprite" ref={activeSpriteRef}>
              {currentSprite && (
                <img
                  key={currentSprite.id || spriteIndex}
                  src={currentSprite.image}
                  alt={currentSprite.fullName}
                  className="hero-sprite-img"
                  onError={(e) => {
                    // Fallback to water_basic.png if image fails, never hide display!
                    e.target.onerror = null;
                    e.target.src = '/sprites/water_basic.png';
                  }}
                />
              )}
            </div>
          </div>

          {/* Stats counters */}
          <div className="header-stats">
            <div className="stat-box">
              <span className="stat-number">{ownedCount}</span>
              <span className="stat-separator">/</span>
              <span className="stat-total">{totalCount}</span>
              <span className="stat-label">ATRAPADOS</span>
            </div>
            <div className="stat-box">
              <span className="stat-number">{masteredCount}</span>
              <span className="stat-separator">/</span>
              <span className="stat-total">{totalCount}</span>
              <span className="stat-label">MAESTREADOS</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="header-actions">
            <button className="header-btn trade" onClick={onOpenCompareModal}>
              <Users size={18} />
              <span>Intercambio Fortnite</span>
            </button>
            <button className="header-btn share" onClick={onOpenShareModal}>
              <Share2 size={18} />
              <span>Compartir Imagen</span>
            </button>
            <button className="header-btn backup" onClick={onOpenBackupModal}>
              <Download size={18} />
              <span>Respaldo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
