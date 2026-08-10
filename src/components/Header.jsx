import React from 'react';
import { Share2, Download, Users } from 'lucide-react';

export function Header({
  totalCount,
  ownedCount,
  masteredCount,
  onOpenShareModal,
  onOpenBackupModal,
  onOpenCompareModal
}) {
  return (
    <header className="site-header">
      <div className="header-banner">
        <div className="header-banner-overlay" />
        <div className="header-content">
          <h1 className="header-title">TODOS LOS SPRITES DE FORTNITE</h1>

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
            <button className="header-btn primary" onClick={onOpenCompareModal} style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}>
              <Users size={16} />
              <span>Intercambio Fortnite</span>
            </button>
            <button className="header-btn primary" onClick={onOpenShareModal}>
              <Share2 size={16} />
              <span>Compartir Imagen</span>
            </button>
            <button className="header-btn secondary" onClick={onOpenBackupModal}>
              <Download size={16} />
              <span>Respaldo</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
