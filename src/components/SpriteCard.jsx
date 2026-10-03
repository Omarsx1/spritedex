import React, { memo } from 'react';
import { fireConfetti } from '../utils/confetti';
import { Lock } from 'lucide-react';
import { RARITIES, getSpriteCardStyle, getRarityInfo, pickName } from '../data/spritesData';
import { t } from '../i18n';
import { sounds } from '../utils/audio';
import { SonicRing } from './SonicRing';

function SpriteCardBase({
  sprite,
  index = 0,
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

  const rarityInfo = getRarityInfo(sprite.rarity);
  const styleInfo = getSpriteCardStyle(sprite);

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (sprite.unreleased) return;
    // La vista de amigo es solo lectura: ahi nunca se toca el Dex propio.
    if (isFriendView) return;

    const nextOwned = !isOwned;
    onToggleOwned(sprite.id);
    sounds.playToggle(nextOwned, sprite.gen);
    if (nextOwned) {
      fireConfetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
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
      if (!sprite.unreleased) {
        handleToggleClick(e);
      }
      return;
    }

    onOpenDetail(sprite);
  };

  const handleLevelClick = (e, newLevel) => {
    e.stopPropagation();
    if (sprite.unreleased) return;
    if (isFriendView) return; // Only adjust levels in my view
    onSetLevel(sprite.id, newLevel);
    sounds.playLevelUp(newLevel, sprite.gen);
    if (newLevel === 5) {
      fireConfetti({ particleCount: 60, spread: 70, origin: { y: 0.7 }, maxeo: true });
    }
  };

  // Vista lista
  if (viewMode === 'list') {
    return (
      <div
        className={`sprite-list-item ${isOwned ? 'is-owned' : ''} ${isMastered ? ('is-mastered ' + (sprite.gen === 2 ? 'is-glitch-mastered' : 'is-classic-mastered')) : ''}`}
        onClick={isFriendView ? undefined : handleToggleClick}
        style={{ cursor: (sprite.unreleased || isFriendView) ? 'default' : 'pointer' }}
      >
        <div className="list-item-image">
          {isMastered && (
            <img
              src="/img/x/sprites/crown.webp"
              alt={t('carta.corona')}
              className="list-item-image__crown"
              decoding="async"
              loading="lazy"
              width="24"
              height="24"
            />
          )}
          <img
            src={sprite.thumb || sprite.image}
            alt={pickName(sprite)}
            loading={index < 8 ? "eager" : "lazy"}
            fetchPriority={index < 4 ? "high" : "auto"}
            decoding="async"
            onClick={handleImageClick}
            title={t('carta.clicFigura')}
            style={{ filter: !isOwned ? 'grayscale(80%) opacity(0.5)' : 'none', cursor: 'pointer' }}
            onError={(e) => {
              if (!e.target.dataset.triedBase) {
                e.target.dataset.triedBase = 'true';
                const baseId = sprite.id ? sprite.id.split('_')[0] : 'water';
                const isWebpBase = sprite.gen === 2 || ['pond', 'klombo', 'sonic', 'shadow', 'tails', 'crash', 'blinky', 'birthday', 'morgana', '8bit', 'adventure', 'bush', 'jonesy', 'killswitch', 'stormscout', 'onigiri', 'overshield', 'xray', 'peely', 'llama', 'ironmouse'].includes(baseId);
                if (isWebpBase) {
                  e.target.src = `/sprites/${baseId}_basic.webp`;
                } else {
                  e.target.src = `/sprites/${baseId}_basic.png`;
                }
              } else {
                e.target.onerror = null;
                e.target.src = sprite.gen === 2 ? '/sprites/sonic_basic.webp' : '/sprites/water_basic.png';
              }
            }}
          />
        </div>
        <div className="list-item-info">
          <span className="list-item-name">{pickName(sprite)}</span>
          <div className="list-item-meta">
            <span
              className={`sprite-pill rarity-badge-sm ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
            >
              {rarityInfo.name}
            </span>
            {friendCanLend && (
              <span style={{ fontSize: '0.68rem', background: '#10b981', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                {t('carta.teLoPresta')}
              </span>
            )}
          </div>
        </div>
        <div className="list-item-actions">
          {sprite.unreleased ? (
            <div className="card-unreleased-pill list-unreleased-pill" onClick={(e) => e.stopPropagation()}>
              <Lock size={12} />
              <span>{t('carta.noLanzado')}</span>
            </div>
          ) : (
            <>
              {isOwned && !isFriendView && (
                <div className="list-level-stars" onClick={(e) => e.stopPropagation()}>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      className={`star-btn-sm ${level >= num ? 'active' : ''}`}
                      onClick={(e) => handleLevelClick(e, num)}
                    >
                      {sprite.gen === 2 ? (
                        <SonicRing active={level >= num} mastered={isMastered && num === 5} size={14} />
                      ) : (
                        '★'
                      )}
                    </button>
                  ))}
                </div>
              )}
              {isFriendView ? (
                <span className={`owned-btn-sm is-readonly ${isOwned ? 'owned' : ''}`}>
                  {isOwned
                    ? (myOwned ? t('carta.registrado') : t('carta.tuAmigoLoTiene'))
                    : t('carta.noLoTiene')}
                </span>
              ) : (
                <button
                  className={`owned-btn-sm ${isMastered ? 'mastered' : isOwned ? 'owned' : ''}`}
                  onClick={handleToggleClick}
                >
                  {isMastered
                    ? t('carta.maxeado')
                    : isOwned ? t('carta.atrapadoNivel', { n: level }) : t('carta.sinAtrapar')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Vista cuadrícula (estilo fortnite.gg)
  return (
    <div
      className={`sprite-card ${isOwned ? 'is-owned' : ''} ${isMastered ? ('is-mastered ' + (sprite.gen === 2 ? 'is-glitch-mastered' : 'is-classic-mastered')) : ''}`}
      data-familia={String(sprite?.id || '').split('_')[0]}
      style={{
        background: styleInfo.background,
        borderColor: styleInfo.borderColor,
        position: 'relative',
        cursor: (sprite.unreleased || isFriendView) ? 'default' : 'pointer'
      }}
      onClick={isFriendView ? undefined : handleToggleClick}
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
      {/* Badge de rareza (esquina superior izquierda) */}
      <div
        className={`card-rarity-tag sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
      >
        {rarityInfo.name}
      </div>

      {/* Badge de nivel o amigo (esquina superior derecha, solo si no es unreleased y está atrapado o vista amigo) */}
      {!sprite.unreleased && (isFriendView ? (
        isOwned ? (
          <div className="ms-level-tag ms-level-tag--friend">
            {t('carta.amigo')}
          </div>
        ) : null
      ) : isOwned ? (
        <div
          className={`ms-level-tag ${isMastered ? 'ms-level-tag--mastered' : ''}`}
          onClick={handleToggleClick}
          title={t('carta.tocaDesmarcarCambiar')}
        >
          {isMastered ? 'MAX' : `LVL.${level}`}
        </div>
      ) : null)}

      {/* Imagen del Sprite: Clic exclusivamente en la figura abre la modal de detalles y variantes */}
      <div className="card-image">
        {isMastered && (
          <img
            src="/img/x/sprites/crown.webp"
            alt={t('carta.corona')}
            className="card-image__crown"
            decoding="async"
            loading="lazy"
            width="32"
            height="32"
          />
        )}
        <img
          src={sprite.thumb || sprite.image}
          alt={pickName(sprite)}
          loading={index < 8 ? "eager" : "lazy"}
          fetchPriority={index < 4 ? "high" : "auto"}
          decoding="async"
          onClick={handleImageClick}
          title={t('carta.clicFigura')}
          style={{
            filter: !isOwned ? 'grayscale(55%) opacity(0.68) brightness(1.2) contrast(1.15)' : 'drop-shadow(0 6px 12px rgba(0,0,0,0.5))',
            cursor: 'pointer'
          }}
          onError={(e) => {
            if (!e.target.dataset.triedBase) {
              e.target.dataset.triedBase = 'true';
              const baseId = sprite.id ? sprite.id.split('_')[0] : 'water';
              const isWebpBase = sprite.gen === 2 || ['pond', 'klombo', 'sonic', 'shadow', 'tails', 'crash', 'blinky', 'birthday', 'morgana', '8bit', 'adventure', 'bush', 'jonesy', 'killswitch', 'stormscout', 'onigiri', 'overshield', 'xray', 'peely', 'llama', 'ironmouse'].includes(baseId);
              if (isWebpBase) {
                e.target.src = `/sprites/${baseId}_basic.webp`;
              } else {
                e.target.src = `/sprites/${baseId}_basic.png`;
              }
            } else {
              e.target.onerror = null;
              e.target.src = sprite.gen === 2 ? '/sprites/sonic_basic.webp' : '/sprites/water_basic.png';
            }
          }}
        />
      </div>

      {/* Nombre */}
      <div className={`card-name ${pickName(sprite) && pickName(sprite).length > 20 ? 'card-name--long' : ''}`}>{pickName(sprite)}</div>

      {/* Control inferior: Pill No lanzado si unreleased, Anillos de Sonic para Gen 2 o Estrellas para Gen 1 si está atrapado */}
      {sprite.unreleased ? (
        <div className="card-unreleased-pill" onClick={(e) => e.stopPropagation()}>
          <Lock size={13} />
          <span>{t('carta.noLanzado')}</span>
        </div>
      ) : isOwned ? (
        <div className="card-level-stars" onClick={(e) => e.stopPropagation()}>
          {[1, 2, 3, 4, 5].map((num) => (
            <button
              key={num}
              className={`star-btn ${level >= num ? 'active' : ''} ${isMastered && num === 5 ? 'mastered-star' : ''} ${sprite.gen === 2 ? 'is-sonic-ring-btn' : ''}`}
              onClick={(e) => handleLevelClick(e, num)}
              style={isFriendView ? { pointerEvents: 'none' } : {}}
              title={level === 1 && num === 1 ? t('carta.tocaDesmarcar') : t('carta.nivel', { n: num })}
            >
              {sprite.gen === 2 ? (
                <SonicRing active={level >= num} mastered={isMastered && num === 5} size={19} />
              ) : (
                '★'
              )}
            </button>
          ))}
        </div>
      ) : isFriendView ? (
        <div className="card-owned-btn is-readonly">
          <span className="btn-text">{t('carta.noLoTiene')}</span>
        </div>
      ) : (
        <button
          className="card-owned-btn"
          onClick={handleToggleClick}
        >
          <span className="btn-text">{t('carta.sinAtrapar')}</span>
        </button>
      )}
    </div>
  );
}

// Solo se re-renderiza si cambia su propia entrada de estado o sus props estables.
// Las entradas de userState/friendState conservan su identidad salvo la que se edita,
// asi que marcar un espiritu no re-renderiza el resto de las tarjetas.
export const SpriteCard = memo(SpriteCardBase, (prev, next) => {
  if (prev.sprite !== next.sprite) return false;
  if (prev.index !== next.index) return false;
  if (prev.viewMode !== next.viewMode) return false;
  if (prev.isFriendView !== next.isFriendView) return false;
  if (prev.onToggleOwned !== next.onToggleOwned) return false;
  if (prev.onSetLevel !== next.onSetLevel) return false;
  if (prev.onOpenDetail !== next.onOpenDetail) return false;
  const id = next.sprite.id;
  if (prev.userState && prev.userState[id] !== (next.userState && next.userState[id])) return false;
  if (prev.friendState && prev.friendState[id] !== (next.friendState && next.friendState[id])) return false;
  return true;
});
