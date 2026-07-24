import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Zap } from 'lucide-react';
import { RARITIES } from '../data/spritesData';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

export function PokedexHandheld({ spritesList, userState, onToggleOwned, onSetLevel }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!spritesList || spritesList.length === 0) {
    return <div style={{ color: '#fff', textAlign: 'center', padding: '40px' }}>No hay Sprites disponibles.</div>;
  }

  const sprite = spritesList[currentIndex] || spritesList[0];
  const currentState = userState[sprite.id] || { owned: false, level: 1 };
  const isOwned = currentState.owned;
  const level = currentState.level || 1;
  const isMastered = isOwned && level === 5;
  const rarityInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, color: '#94a3b8' };

  const handlePrev = () => {
    sounds.playBeep();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : spritesList.length - 1));
  };

  const handleNext = () => {
    sounds.playBeep();
    setCurrentIndex((prev) => (prev < spritesList.length - 1 ? prev + 1 : 0));
  };

  const handleToggle = () => {
    const nextOwned = !isOwned;
    onToggleOwned(sprite.id);
    sounds.playToggle(nextOwned);
  };

  const handleLevelChange = (newLevel) => {
    onSetLevel(sprite.id, newLevel);
    sounds.playLevelUp(newLevel);
    if (newLevel === 5) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    }
  };

  return (
    <div className="pokedex-physical-container">
      {/* Top Bar Lights */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pokedex-led-main" style={{ width: '36px', height: '36px' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#eab308', boxShadow: '0 0 8px #eab308' }} />
          <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
        </div>

        <div style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 900, letterSpacing: '1px' }}>
          MODEL: AGY-SPRITE-2026
        </div>
      </div>

      {/* Screen Border & LCD Display */}
      <div className="pokedex-screen-border">
        <div className="pokedex-screen">
          {/* Header Screen info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '16px' }}>
            <span style={{ color: '#00f0ff', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.9rem' }}>
              # {String(currentIndex + 1).padStart(3, '0')} / {spritesList.length}
            </span>
            <span style={{
              background: rarityInfo.color,
              color: '#000',
              fontWeight: 900,
              fontSize: '0.75rem',
              padding: '2px 8px',
              borderRadius: '4px'
            }}>
              {rarityInfo.name}
            </span>
          </div>

          {/* Sprite Showcase Screen Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            {/* Left: Image & Catch state */}
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '130px',
                height: '130px',
                margin: '0 auto 12px',
                borderRadius: '16px',
                background: 'rgba(30, 41, 59, 0.6)',
                border: `2px solid ${isMastered ? '#facc15' : (isOwned ? '#10b981' : 'rgba(255, 255, 255, 0.15)')}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: isMastered ? '0 0 20px rgba(250, 204, 21, 0.4)' : 'none'
              }}>
                <img
                  src={sprite.image}
                  alt={sprite.fullName}
                  style={{
                    maxWidth: '90%',
                    maxHeight: '90%',
                    objectFit: 'contain',
                    filter: !isOwned ? 'grayscale(85%) opacity(0.45)' : 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
                    transition: 'filter 0.3s ease'
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>
                {sprite.fullName}
              </h2>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '10px' }}>
                {sprite.variant !== 'Basic' ? `Variante: ${sprite.variant}` : `Gen ${sprite.gen}`}
              </div>

              <button
                className={`catch-toggle-btn ${isOwned ? 'is-owned' : 'is-unowned'}`}
                onClick={handleToggle}
                style={{ padding: '8px 14px' }}
              >
                {isOwned ? <Check size={16} /> : null}
                <span>{isOwned ? `Atrapado (Niv. ${level})` : 'Marcar Atrapado'}</span>
              </button>
            </div>

            {/* Right: Info & Specs */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', padding: '14px', borderRadius: '12px', border: '1px solid #334155' }}>
              <div style={{ marginBottom: '10px' }}>
                <span style={{ color: '#eab308', fontSize: '0.75rem', fontWeight: 800, display: 'block' }}>HABILIDAD:</span>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: '1.3' }}>{sprite.ability}</p>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div>📍 Ubicación: <strong style={{ color: '#fff' }}>{sprite.location}</strong></div>
                <div>✨ Drop Chance: <strong style={{ color: '#00f0ff' }}>{sprite.dropChance}</strong></div>
                <div>🪙 Costo Dust: <strong style={{ color: '#fde047' }}>{sprite.summonCost}</strong></div>
              </div>

              {/* Level Control 1 to 5 */}
              {isOwned && (
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #334155' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: level === 5 ? '#fde047' : '#3b82f6', marginBottom: '4px' }}>
                    {level === 5 ? '⭐ NIVEL 5 (MAESTRÍA)' : `Ajustar Nivel (${level}/5)`}
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        className={`star-btn ${level >= lvl ? 'active' : ''} ${level === 5 && lvl === 5 ? 'mastered-star' : ''}`}
                        style={{ padding: '4px 0', fontSize: '0.7rem' }}
                        onClick={() => handleLevelChange(lvl)}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Handheld Controls Bottom Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px', padding: '0 10px' }}>
        {/* D-Pad Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-secondary" onClick={handlePrev} style={{ padding: '12px 18px', borderRadius: '12px', background: '#1e293b' }}>
            <ChevronLeft size={20} /> Anterior
          </button>
          <button className="btn-secondary" onClick={handleNext} style={{ padding: '12px 18px', borderRadius: '12px', background: '#1e293b' }}>
            Siguiente <ChevronRight size={20} />
          </button>
        </div>

        {/* Action Button */}
        <button
          className="btn-primary"
          onClick={handleToggle}
          style={{
            background: isOwned ? 'linear-gradient(135deg, #10b981, #059669)' : '#334155',
            padding: '12px 24px',
            borderRadius: '12px'
          }}
        >
          {isOwned ? '✓ ATRAPADO' : 'CAPTURAR SPRITE'}
        </button>
      </div>
    </div>
  );
}
