import React from 'react';
import confetti from 'canvas-confetti';
import { RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';

export function SpriteCard({
  sprite,
  userState,
  friendState,
  isFriendView,
  viewMode,
  onToggleOwned,
  onSetLevel,
  onOpenDetail
}) {
  const currentState = isFriendView
    ? (friendState?.[sprite.id] || { owned: false, level: 1 })
    : (userState[sprite.id] || { owned: false, level: 1 });

  const isOwned = currentState.owned;
  const level = currentState.level || 1;
  const isMastered = isOwned && level === 5;

  const myOwned = userState[sprite.id]?.owned;
  const friendCanLend = isFriendView && isOwned && !myOwned;

  const rarityInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, color: '#94a3b8', bg: '#1e293b' };
  const styleInfo = getSpriteCardStyle(sprite);

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (isFriendView) {
      // In friend view, clicking action button toggles ownership in MY collection
      const nextOwned = !myOwned;
      onToggleOwned(sprite.id);
      sounds.playToggle(nextOwned, sprite.gen);
      if (nextOwned) {
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
      }
      return;
    }

    const nextOwned = !isOwned;
    onToggleOwned(sprite.id);
    sounds.playToggle(nextOwned, sprite.gen);
    if (nextOwned) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const handleImageClick = (e) => {
    e.stopPropagation();

    // Meticulous hit-test: calculate click position relative to the img bounding box
    const rect = e.currentTarget.getBoundingClientRect();
    const clickXRatio = (e.clientX - rect.left) / rect.width;
    const clickYRatio = (e.clientY - rect.top) / rect.height;

    // Filter out clicks on outer transparent margins (sides, top, bottom):
    // Left 22%, Right 22%, Top 20%, Bottom 15% -> treat as card toggle click!
    if (clickXRatio < 0.22 || clickXRatio > 0.78 || clickYRatio < 0.20 || clickYRatio > 0.85) {
      handleToggleClick(e);
      return;
    }

    onOpenDetail(sprite);
  };

  const handleLevelClick = (e, newLevel) => {
    e.stopPropagation();
    if (isFriendView) return; // Only adjust levels in my view
    onSetLevel(sprite.id, newLevel);
    sounds.playLevelUp(newLevel, sprite.gen);
    if (newLevel === 5) {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
    }
  };

  // Vista lista
  if (viewMode === 'list') {
    return (
      <div
        className={`sprite-list-item ${isOwned ? 'is-owned' : ''} ${isMastered ? ('is-mastered ' + (sprite.gen === 2 ? 'is-glitch-mastered' : 'is-classic-mastered')) : ''}`}
        onClick={handleToggleClick}
        style={{ cursor: 'pointer' }}
      >
        <div className="list-item-image">
          {isMastered && (
            <img
              src="/img/x/sprites/crown.webp"
              alt="Corona"
              className="list-item-image__crown"
            />
          )}
          <img
            src={sprite.image}
            alt={sprite.fullName}
            loading="lazy"
            onClick={handleImageClick}
            title="Haz clic exclusivamente en la figura del espíritu para ver detalles y variantes"
            style={{ filter: !isOwned ? 'grayscale(80%) opacity(0.5)' : 'none', cursor: 'pointer' }}
            onError={(e) => {
              if (!e.target.dataset.triedBase) {
                e.target.dataset.triedBase = 'true';
                const baseId = sprite.id ? sprite.id.split('_')[0] : 'water';
                if (baseId === 'peely' || baseId === 'llama' || baseId === 'ironmouse') {
                  e.target.src = `/sprites/${baseId}_basic.webp`;
                } else {
                  e.target.src = `/sprites/${baseId}_basic.png`;
                }
              } else {
                e.target.onerror = null;
                e.target.src = '/sprites/water_basic.png';
              }
            }}
          />
        </div>
        <div className="list-item-info">
          <span className="list-item-name">{sprite.fullName}</span>
          <div className="list-item-meta">
            <span
              className={`sprite-pill rarity-badge-sm ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
            >
              {rarityInfo.name}
            </span>
            <span className="drop-text">{sprite.dropChanceDisplay}</span>
            {friendCanLend && (
              <span style={{ fontSize: '0.68rem', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                🎁 Te lo presta
              </span>
            )}
          </div>
        </div>
        <div className="list-item-actions">
          {isOwned && !isFriendView && (
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
            style={isFriendView && friendCanLend ? { background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff' } : {}}
          >
            {isFriendView
              ? (friendCanLend ? (myOwned ? '✓ Registrado' : '+ Registrar en mi Dex') : isOwned ? '✓ Tu amigo lo tiene' : 'No lo tiene')
              : (isMastered ? '⭐ Maxeado' : isOwned ? `✓ Atrapado (Niv.${level})` : 'Sin atrapar')}
          </button>
        </div>
      </div>
    );
  }

  // Vista cuadrícula (estilo fortnite.gg)
  return (
    <div
      className={`sprite-card ${isOwned ? 'is-owned' : ''} ${isMastered ? ('is-mastered ' + (sprite.gen === 2 ? 'is-glitch-mastered' : 'is-classic-mastered')) : ''}`}
      style={{
        background: styleInfo.background,
        borderColor: styleInfo.borderColor,
        position: 'relative',
        cursor: 'pointer'
      }}
      onClick={handleToggleClick}
    >
      {/* Cyber Glitch Visual FX for Gen 2 Mastered cards */}
      {isMastered && sprite.gen === 2 && (
        <div className="cyber-fx-overlay" aria-hidden="true">
          <div className="scan-line" />
          <div className="cyber-lines">
            <span /><span /><span /><span />
          </div>
          <div className="corner-elements">
            <span /><span /><span /><span />
          </div>
          <div className="glowing-elements">
            <div className="glow-1" />
            <div className="glow-2" />
            <div className="glow-3" />
          </div>
          <div className="card-particles">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
      )}
      {/* Etiqueta de variante (esquina superior izquierda) */}
      {(sprite.variantDisplay || sprite.variant) && (
        <div className="ms-variant-tag">
          {sprite.variantDisplay || sprite.variant}
        </div>
      )}

      {/* Badge de nivel o amigo (esquina superior derecha, solo si está atrapado o vista amigo) */}
      {isFriendView ? (
        friendCanLend ? (
          <div className="ms-level-tag ms-level-tag--lend" onClick={handleToggleClick}>
            {myOwned ? '✓ REGISTRADO' : '🎁 PRESTA'}
          </div>
        ) : isOwned ? (
          <div className="ms-level-tag ms-level-tag--friend">
            ✓ AMIGO
          </div>
        ) : null
      ) : isOwned ? (
        <div
          className={`ms-level-tag ${isMastered ? 'ms-level-tag--mastered' : ''}`}
          onClick={handleToggleClick}
          title="Toca para desmarcar o cambiar"
        >
          {isMastered ? 'MAX' : `LVL.${level}`}
        </div>
      ) : null}

      {/* Imagen del Sprite: Clic exclusivamente en la figura abre la modal de detalles y variantes */}
      <div className="card-image">
        {isMastered && (
          <img
            src="/img/x/sprites/crown.webp"
            alt="Corona"
            className="card-image__crown"
          />
        )}
        <img
          src={sprite.image}
          alt={sprite.fullName}
          loading="lazy"
          onClick={handleImageClick}
          title="Haz clic exclusivamente en la figura del espíritu para ver detalles y variantes"
          style={{
            filter: !isOwned ? 'grayscale(80%) opacity(0.5)' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
            cursor: 'pointer'
          }}
          onError={(e) => {
            if (!e.target.dataset.triedBase) {
              e.target.dataset.triedBase = 'true';
              const baseId = sprite.id ? sprite.id.split('_')[0] : 'water';
              if (baseId === 'peely' || baseId === 'llama' || baseId === 'ironmouse') {
                e.target.src = `/sprites/${baseId}_basic.webp`;
              } else {
                e.target.src = `/sprites/${baseId}_basic.png`;
              }
            } else {
              e.target.onerror = null;
              e.target.src = '/sprites/water_basic.png';
            }
          }}
        />
      </div>

      {/* Nombre */}
      <div className="card-name">{sprite.fullName}</div>

      {/* Badge de rareza + drop % */}
      <div className="card-meta">
        <span
          className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
        >
          {rarityInfo.name}
        </span>
        <span className="drop-pct">{sprite.dropChanceDisplay}</span>
      </div>

      {/* Control inferior: Estrellas si está atrapado, botón estándar si no */}
      {isOwned ? (
        <div className="card-level-stars" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              className={`star-btn ${level >= num ? 'active' : ''} ${isMastered && num === 5 ? 'mastered-star' : ''}`}
              onClick={(e) => handleLevelClick(e, num)}
              style={isFriendView ? { pointerEvents: 'none' } : {}}
              title={level === 1 && num === 1 ? 'Toca para desmarcar' : `Nivel ${num}`}
            >
              ★
            </button>
          ))}
        </div>
      ) : (
        <button
          className="card-owned-btn"
          onClick={handleToggleClick}
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
  );
}
