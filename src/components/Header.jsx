import React, { useEffect, useRef } from 'react';
import { Share2, Download, Users } from 'lucide-react';
import gsap from 'gsap';

export function Header({
  totalCount,
  ownedCount,
  masteredCount,
  onOpenShareModal,
  onOpenBackupModal,
  onOpenCompareModal
}) {
  const titleRef = useRef(null);
  const statsRef = useRef(null);
  const actionsRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title entrance animation
      gsap.fromTo(
        titleRef.current,
        { y: -30, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out' }
      );

      // Stats boxes stagger animation
      if (statsRef.current) {
        gsap.fromTo(
          statsRef.current.children,
          { y: 25, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.7,
            stagger: 0.15,
            delay: 0.2,
            ease: 'back.out(1.4)'
          }
        );
      }

      // Actions buttons entrance animation
      if (actionsRef.current) {
        gsap.fromTo(
          actionsRef.current.children,
          { y: 20, opacity: 0, scale: 0.88 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            delay: 0.4,
            ease: 'power2.out'
          }
        );
      }
    });

    return () => ctx.revert();
  }, []);

  return (
    <header className="site-header">
      <div className="header-banner">
        <div className="header-banner-overlay" />
        <div className="header-content">
          <h1 className="header-title" ref={titleRef}>
            TODOS LOS SPRITES DE FORTNITE
          </h1>

          {/* Stats counters */}
          <div className="header-stats" ref={statsRef}>
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
          <div className="header-actions" ref={actionsRef}>
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
