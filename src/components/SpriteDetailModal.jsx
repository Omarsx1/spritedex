import React, { useState, useEffect, useRef } from 'react';
import { X, Zap, MapPin, Coins, Sparkles } from 'lucide-react';
import { SPRITE_FAMILIES, RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

export function SpriteDetailModal({ sprite, userState, onToggleOwned, onSetLevel, onClose }) {
  const [activeSprite, setActiveSprite] = useState(sprite);
  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const infoRef = useRef(null);
  const variantsRef = useRef(null);

  // Sync activeSprite when prop changes
  useEffect(() => {
    setActiveSprite(sprite);
  }, [sprite]);

  // Entrance animation when activeSprite changes
  useEffect(() => {
    if (!activeSprite || !modalRef.current) return;

    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { opacity: 0.7, scale: 0.98 },
        { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, [activeSprite]);

  if (!activeSprite) return null;

  const family = SPRITE_FAMILIES.find(f => f.id === activeSprite.familyId);
  const familySprites = family ? family.sprites : [activeSprite];
  const rarityInfo = RARITIES[activeSprite.rarity] || { name: activeSprite.rarity, color: '#94a3b8', bg: '#1e293b' };
  const mainStyle = getSpriteCardStyle(activeSprite);
  const currentState = userState[activeSprite.id] || { owned: false, level: 1 };
  const isMastered = currentState.owned && currentState.level === 5;

  const handleImgError = (e) => {
    if (!e.target.dataset.triedBase) {
      e.target.dataset.triedBase = 'true';
      const baseId = activeSprite.id ? activeSprite.id.split('_')[0] : 'water';
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
              src={activeSprite.image}
              alt={activeSprite.fullName}
              className={`sdm__hero-img ${!currentState.owned ? 'sdm__hero-img--locked' : ''}`}
              onError={handleImgError}
            />
          </div>

          <div className="sdm__hero-info">
            <div className="sdm__hero-badges">
              <span className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}>
                {rarityInfo.name}
              </span>
              <span className="sdm__drop">{activeSprite.dropChance}</span>
            </div>
            <h2 className="sdm__name">{activeSprite.fullName}</h2>
            <div className="sdm__meta">
              <span>{activeSprite.variantDisplay || activeSprite.variant} · Gen {activeSprite.gen}</span>
              {currentState.owned && (
                <span className={`sdm__meta-lvl ${isMastered ? 'sdm__meta-lvl--mastered' : ''}`}>
                  {' · '}{isMastered ? '⭐ MAXEADO' : `Nivel ${currentState.level}/5`}
                </span>
              )}
            </div>
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
                <p className="sdm__card-text">{activeSprite.ability}</p>
              </div>
            </div>
            <div className="sdm__card-footer">
              <div className="sdm__card-detail">
                <MapPin size={14} className="sdm__icon sdm__icon--blue" />
                <span>{activeSprite.location}</span>
              </div>
              <div className="sdm__card-detail">
                <Coins size={14} className="sdm__icon sdm__icon--yellow" />
                <span>{activeSprite.summonCost}</span>
              </div>
            </div>
          </div>

          {/* Family progress bar */}
          <div className="sdm__progress-wrap">
            <div className="sdm__progress-header">
              <Sparkles size={14} className="sdm__icon sdm__icon--pink" />
              <span className="sdm__progress-title">
                {familySprites.length > 1 ? 'VARIANTES' : 'COLECCIÓN'}
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
            const isSelected = v.id === activeSprite.id;

            return (
              <div
                key={v.id}
                className={`sdm__variant ${isSelected ? 'sdm__variant--selected' : ''} ${vOwned ? 'sdm__variant--owned' : ''} ${vMastered ? 'sdm__variant--mastered' : ''}`}
                style={{
                  background: vStyle.background,
                  borderColor: isSelected ? '#ffffff' : vStyle.borderColor
                }}
                onClick={() => setActiveSprite(v)}
              >
                {/* Image + select */}
                <div className="sdm__variant-img-wrap">
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleOwned(v.id);
                    sounds.playToggle(!vOwned, v.gen);
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
                          sounds.playLevelUp(lvl, v.gen);
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

