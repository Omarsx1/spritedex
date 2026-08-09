import React from 'react';
import confetti from 'canvas-confetti';
import { RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';

export function SpriteCard({ sprite, userState, viewMode, onToggleOwned, onSetLevel, onOpenDetail }) {
  const currentState = userState[sprite.id] || { owned: false, level: 1 };
  const isOwned = currentState.owned;
  const level = currentState.level || 1;
  const isMastered = isOwned && level === 5;

  const rarityInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, color: '#94a3b8', bg: '#1e293b' };
  const styleInfo = getSpriteCardStyle(sprite);

  const handleToggleClick = (e) => {
    e.stopPropagation();
    const nextOwned = !isOwned;
    onToggleOwned(sprite.id);
    sounds.playToggle(nextOwned);
    if (nextOwned) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleLevelClick = (e, newLevel) => {
    e.stopPropagation();
    onSetLevel(sprite.id, newLevel);
    sounds.playLevelUp(newLevel);
    if (newLevel === 5) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }
  };

  // Vista lista
  if (viewMode === 'list') {
    return (
      <div
        className={`sprite-list-item ${isOwned ? 'is-owned' : ''} ${isMastered ? 'is-mastered' : ''}`}
        onClick={() => onOpenDetail(sprite)}
      >
        <div className="list-item-image">
          <img
            src={sprite.image}
            alt={sprite.fullName}
            loading="lazy"
            style={{ filter: !isOwned ? 'grayscale(80%) opacity(0.5)' : 'none' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
        <div className="list-item-info">
          <span className="list-item-name">{sprite.fullName}</span>
          <div className="list-item-meta">
            <span className="rarity-badge-sm" style={{ background: rarityInfo.bg }}>
              {rarityInfo.name}
            </span>
            <span className="drop-text">{sprite.dropChanceDisplay}</span>
          </div>
        </div>
        <div className="list-item-actions">
          {isOwned && (
            <div className="list-level-stars" onClick={(e) => e.stopPropagation()}>
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  className={`star-btn-sm ${level >= num ? 'active' : ''}`}
                  onClick={(e) => handleLevelClick(e, num)}
                >
                  ★
                </button>
              ))}
            </div>
          )}
          <button
            className={`owned-btn-sm ${isMastered ? 'mastered' : isOwned ? 'owned' : ''}`}
            onClick={handleToggleClick}
          >
            {isMastered ? '⭐ Maestreado' : isOwned ? `✓ Atrapado (Niv.${level})` : 'Sin atrapar'}
          </button>
        </div>
      </div>
    );
  }

  // Vista cuadrícula (estilo fortnite.gg)
  return (
    <div
      className={`sprite-card ${isOwned ? 'is-owned' : ''} ${isMastered ? 'is-mastered' : ''}`}
      style={{
        background: styleInfo.background,
        borderColor: isMastered ? '#facc15' : styleInfo.borderColor
      }}
      onClick={() => onOpenDetail(sprite)}
    >
      {/* Imagen del Sprite */}
      <div className="card-image">
        <img
          src={sprite.image}
          alt={sprite.fullName}
          loading="lazy"
          style={{
            filter: !isOwned ? 'grayscale(80%) opacity(0.5)' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))'
          }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      </div>

      {/* Nombre */}
      <div className="card-name">{sprite.fullName}</div>

      {/* Badge de rareza + drop % */}
      <div className="card-meta">
        <span className="rarity-badge" style={{ background: rarityInfo.bg }}>
          {rarityInfo.name}
        </span>
        <span className="drop-pct">{sprite.dropChanceDisplay}</span>
      </div>

      {/* Estrellas de nivel (solo cuando está atrapado) */}
      {isOwned && (
        <div className="card-level-stars" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              className={`star-btn ${level >= num ? 'active' : ''} ${isMastered && num === 5 ? 'mastered-star' : ''}`}
              onClick={(e) => handleLevelClick(e, num)}
            >
              ★{num}
            </button>
          ))}
        </div>
      )}

      {/* Botón de estado */}
      <button
        className={`card-owned-btn ${isMastered ? 'mastered' : isOwned ? 'owned' : ''}`}
        onClick={handleToggleClick}
      >
        {isMastered ? '⭐ Maestreado' : isOwned ? `✓ Atrapado (Niv.${level})` : 'Sin atrapar'}
      </button>
    </div>
  );
}
