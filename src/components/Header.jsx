import React, { useEffect, useRef, useState } from 'react';
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
  const [spriteIndex, setSpriteIndex] = useState(0);
  const activeSpriteRef = useRef(null);

  const currentSprite = allSprites[spriteIndex] || allSprites[0];

  // Dynamic Sprite Switcher driven by GSAP
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeSpriteRef.current) return;

      // GSAP animate out
      gsap.to(activeSpriteRef.current, {
        y: -16,
        opacity: 0,
        scale: 0.9,
        duration: 0.35,
        ease: 'power2.in',
        onComplete: () => {
          setSpriteIndex((prev) => (prev + 1) % allSprites.length);
        }
      });
    }, 2400);

    return () => clearInterval(interval);
  }, []);

  // GSAP animate in whenever spriteIndex changes
  useEffect(() => {
    if (activeSpriteRef.current) {
      gsap.fromTo(
        activeSpriteRef.current,
        { y: 16, opacity: 0, scale: 1.1 },
        { y: 0, opacity: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)' }
      );
    }
  }, [spriteIndex]);

  return (
    <header className="site-header">
      <div className="header-banner">
        <div className="header-banner-overlay" />
        <div className="header-content">
          
          {/* Title & Dynamic Sprite Switcher */}
          <div className="header-title-wrapper">
            <h1 className="header-title">
              TODOS LOS SPRITES DE FORTNITE
            </h1>

            {/* GSAP Animated Floating Sprite Character Only (No Container, No Text) */}
            <div className="header-hero-sprite" ref={activeSpriteRef}>
              <img
                src={currentSprite.image}
                alt={currentSprite.fullName}
                className="hero-sprite-img"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
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
