import React, { useEffect, useRef } from 'react';
import { X, Zap, MapPin, Coins, Sparkles, ChevronUp } from 'lucide-react';
import { SPRITE_FAMILIES, RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

export function SpriteDetailModal({ sprite, userState, onToggleOwned, onSetLevel, onClose }) {
  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const infoRef = useRef(null);
  const variantsRef = useRef(null);

  // Entrance animation
  useEffect(() => {
    if (!sprite || !modalRef.current) return;
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.fromTo(modalRef.current,
      { scale: 0.92, opacity: 0, y: 30 },
      { scale: 1, opacity: 1, y: 0, duration: 0.4 }
    );

    if (headerRef.current) {
      tl.fromTo(headerRef.current,
        { x: -20, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.35 },
        '-=0.2'
      );
    }

    if (infoRef.current) {
      tl.fromTo(infoRef.current.children,
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.08 },
        '-=0.15'
      );
    }

    if (variantsRef.current) {
      const cards = variantsRef.current.querySelectorAll('.sdm__variant');
      if (cards.length) {
        tl.fromTo(cards,
          { scale: 0.85, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, stagger: 0.04 },
          '-=0.1'
        );
      }
    }
  }, [sprite]);

  if (!sprite) return null;

  const family = SPRITE_FAMILIES.find(f => f.id === sprite.familyId);
  const familySprites = family ? family.sprites : [sprite];
  const rarityInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, color: '#94a3b8', bg: '#1e293b' };
  const mainStyle = getSpriteCardStyle(sprite);
  const currentState = userState[sprite.id] || { owned: false, level: 1 };
  const isMastered = currentState.owned && currentState.level === 5;

  const handleImgError = (e) => {
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
  };

  // Progress bar width
  const ownedInFamily = familySprites.filter(v => userState[v.id]?.owned).length;
  const progressPct = (ownedInFamily / familySprites.length) * 100;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sdm" ref={modalRef} onClick={(e) => e.stopPropagation()}>

        {/* Close */}
        <button className="sdm__close" onClick={onClose}>
          <X size={18} />
        </button>

        {/* ═══ Hero header with themed gradient ═══ */}
        <div
          className="sdm__hero"
          style={{ background: mainStyle.background }}
          ref={headerRef}
        >
          <div className="sdm__hero-glow" style={{ background: `radial-gradient(circle at 30% 50%, ${mainStyle.borderColor}40 0%, transparent 70%)` }} />

          <div className="sdm__hero-img-wrap">
            {isMastered && (
              <img src="/img/x/sprites/crown.webp" alt="Crown" className="sdm__crown" />
            )}
            <img
              src={sprite.image}
              alt={sprite.fullName}
              className={`sdm__hero-img ${!currentState.owned ? 'sdm__hero-img--locked' : ''}`}
              onError={handleImgError}
            />
          </div>

          <div className="sdm__hero-info">
            <div className="sdm__hero-badges">
              <span className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}>
                {rarityInfo.name}
              </span>
              <span className="sdm__drop">{sprite.dropChance}</span>
            </div>
            <h2 className="sdm__name">{sprite.fullName}</h2>
            <div className="sdm__meta">
              {sprite.variantDisplay || sprite.variant} · Gen {sprite.gen}
            </div>
          </div>

          {/* Level control inside Hero header (top-right) */}
          <div className={`sdm__hero-level ${isMastered ? 'sdm__hero-level--max' : ''}`}>
            {currentState.owned ? (
              <>
                <div className="sdm__hero-level-title">
                  <ChevronUp size={14} />
                  <span>{isMastered ? '⭐ MAESTREADO' : `Nivel ${currentState.level}/5`}</span>
                </div>
                <div className="sdm__hero-level-btns">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      key={lvl}
                      className={`sdm__lvl-btn ${currentState.level >= lvl ? 'sdm__lvl-btn--active' : ''} ${isMastered ? 'sdm__lvl-btn--gold' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSetLevel(sprite.id, lvl);
                        sounds.playLevelUp(lvl);
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                className="sdm__hero-obtain-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleOwned(sprite.id);
                  sounds.playToggle(true);
                }}
              >
                + Atrapado
              </button>
            )}
          </div>
        </div>

        {/* ═══ Info panels ═══ */}
        <div className="sdm__body" ref={infoRef}>

          {/* Ability card */}
          <div className="sdm__card">
            <div className="sdm__card-row">
              <Zap size={16} className="sdm__icon sdm__icon--yellow" />
              <div>
                <span className="sdm__card-label">HABILIDAD PASIVA</span>
                <p className="sdm__card-text">{sprite.ability}</p>
              </div>
            </div>
            <div className="sdm__card-footer">
              <div className="sdm__card-detail">
                <MapPin size={14} className="sdm__icon sdm__icon--blue" />
                <span>{sprite.location}</span>
              </div>
              <div className="sdm__card-detail">
                <Coins size={14} className="sdm__icon sdm__icon--yellow" />
                <span>{sprite.summonCost}</span>
              </div>
            </div>
          </div>

          {/* Family progress bar */}
          <div className="sdm__progress-wrap">
            <div className="sdm__progress-header">
              <Sparkles size={14} className="sdm__icon sdm__icon--pink" />
              <span className="sdm__progress-title">
                {sprite.familyId === 'icons_crossovers' ? 'COLECCIÓN' : 'VARIANTES'}
              </span>
              <span className="sdm__progress-count">{ownedInFamily}/{familySprites.length}</span>
            </div>
            <div className="sdm__progress-track">
              <div className="sdm__progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </div>

        {/* ═══ Variants grid ═══ */}
        <div className="sdm__variants" ref={variantsRef}>
          {familySprites.map((v) => {
            const vState = userState[v.id] || { owned: false, level: 1 };
            const vOwned = vState.owned;
            const vLevel = vState.level || 1;
            const vMastered = vOwned && vLevel === 5;
            const vStyle = getSpriteCardStyle(v);

            return (
              <div
                key={v.id}
                className={`sdm__variant ${vOwned ? 'sdm__variant--owned' : ''} ${vMastered ? 'sdm__variant--mastered' : ''}`}
                style={{
                  background: vStyle.background,
                  borderColor: vStyle.borderColor
                }}
              >
                {/* Image + toggle */}
                <div
                  className="sdm__variant-img-wrap"
                  onClick={() => {
                    onToggleOwned(v.id);
                    sounds.playToggle(!vOwned);
                  }}
                >
                  {vMastered && (
                    <img src="/img/x/sprites/crown.webp" alt="" className="sdm__variant-crown" />
                  )}
                  <img
                    src={v.image}
                    alt={v.fullName}
                    className={`sdm__variant-img ${!vOwned ? 'sdm__variant-img--locked' : ''}`}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>

                <span className="sdm__variant-name">{v.variantDisplay || v.variant}</span>
                <span className="sdm__variant-drop">{v.unreleased ? 'NO LANZADO' : v.dropChance}</span>

                {/* Status pill */}
                <div
                  className="sdm__variant-status"
                  onClick={() => {
                    onToggleOwned(v.id);
                    sounds.playToggle(!vOwned);
                  }}
                >
                  <span className={`sdm__pill ${vMastered ? 'sdm__pill--gold' : vOwned ? 'sdm__pill--green' : ''}`}>
                    {vMastered ? '⭐ MAX' : vOwned ? '✔ Atrapado' : 'Faltante'}
                  </span>
                </div>

                {/* Level selectors */}
                {vOwned && (
                  <div className="sdm__variant-levels">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        className={`sdm__vlvl ${vLevel >= lvl ? (vMastered ? 'sdm__vlvl--gold' : 'sdm__vlvl--active') : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetLevel(v.id, lvl);
                          sounds.playLevelUp(lvl);
                        }}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
