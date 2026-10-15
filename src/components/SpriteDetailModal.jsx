import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SPRITE_FAMILIES, getSpriteCardStyle, getRarityInfo, pickName, pickThemeName, pickTexto } from '../data/spritesData';
import { t } from '../i18n';
import { sounds } from '../utils/audio';
import { rutaBasicoFamilia, rutaFallbackEspiritu } from '../utils/spriteAssets';
import gsap from 'gsap';
import { Modal } from './ui/Modal';

export function SpriteDetailModal({ sprite, userState, onToggleOwned, onSetLevel, readOnly = false, onClose }) {
  const [activeSprite, setActiveSprite] = useState(sprite);
  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const infoRef = useRef(null);
  const variantsRef = useRef(null);

  // Sync activeSprite when prop changes
  useEffect(() => {
    setActiveSprite(sprite);
  }, [sprite]);

  const [canDismiss, setCanDismiss] = useState(false);
  useEffect(() => {
    setCanDismiss(false);
    const isMotionDisabled = typeof document !== 'undefined' && document.body.classList.contains('motion-disabled');
    const delay = isMotionDisabled ? 60 : 350;
    const timer = setTimeout(() => {
      setCanDismiss(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [activeSprite]);

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
  const rarityInfo = getRarityInfo(activeSprite.rarity);
  const mainStyle = getSpriteCardStyle(activeSprite);
  const currentState = userState[activeSprite.id] || { owned: false, level: 1 };
  const isMastered = currentState.owned && currentState.level === 5;

  const handleImgError = (e) => {
    if (!e.target.dataset.triedBase) {
      e.target.dataset.triedBase = 'true';
      const baseId = activeSprite.id ? activeSprite.id.split('_')[0] : 'water';
      e.target.src = rutaBasicoFamilia(baseId);
    } else {
      e.target.onerror = null;
      e.target.src = rutaFallbackEspiritu(activeSprite.gen);
    }
  };

  // Progress bar width
  const ownedInFamily = familySprites.filter(v => userState[v.id]?.owned).length;
  const progressPct = (ownedInFamily / familySprites.length) * 100;

  return (
    <Modal
      onClose={onClose}
      closeOnBackdrop={canDismiss}
      closeOnEscape={canDismiss}
      overlayStyle={{ pointerEvents: canDismiss ? 'auto' : 'none' }}
      className="sdm"
      style={{ pointerEvents: 'auto' }}
      innerRef={modalRef}
    >

        {/* Close */}
        <button type="button" className="sdm__close" onClick={onClose} aria-label={t('detalle.cerrar')}>
          <X size={18} aria-hidden="true" />
        </button>

        {/* ═══ Hero header with themed gradient ═══ */}
        <div
          className="sdm__hero"
          style={{ background: mainStyle.background }}
          ref={headerRef}
        >
          <div className="sdm__hero-glow" style={{ background: `radial-gradient(circle at 30% 50%, ${mainStyle.borderColor?.startsWith('#') ? `${mainStyle.borderColor}40` : (mainStyle.borderColor || 'rgba(255, 255, 255, 0.25)')} 0%, transparent 70%)` }} />

          <div className="sdm__hero-img-wrap">
            {isMastered && (
              <img src="/img/x/sprites/crown.webp" alt="" className={`sdm__crown ${activeSprite.familyId === 'jonesy' ? 'sdm__crown--jonesy' : ''}`} />
            )}
            <img
              src={activeSprite.image}
              alt={pickName(activeSprite)}
              className={`sdm__hero-img ${!currentState.owned ? 'sdm__hero-img--locked' : ''}`}
              onError={handleImgError}
            />
          </div>

          <div className="sdm__hero-info">
            <div className="sdm__hero-badges">
              <span className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}>
                {rarityInfo.name}
              </span>
            </div>
            <h2 className="sdm__name">{pickName(activeSprite)}</h2>
            <div className="sdm__meta">
              <span>{pickThemeName(activeSprite.variant)} · Gen {activeSprite.gen}</span>
              {currentState.owned && !activeSprite.unreleased && !isMastered && (
                <span className="sdm__meta-lvl">
                  {' · '}{t('detalle.nivelDe5', { n: currentState.level })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ═══ Info panels ═══ */}
        <div className="sdm__body" ref={infoRef}>

          {/* Ability card */}
          <div className="sdm__card">
            {Boolean(activeSprite.specialPerk && activeSprite.specialPerk.trim() && activeSprite.variant !== 'Basic' && activeSprite.variant !== 'Base') && (
              <div 
                className="sdm__perk-badge" 
                style={{
                  background: 'linear-gradient(15deg, #9effef 0%, #d1ffd6 17%, #fff8ad 34%, #a3edff 51%, #bdbdff 68%, #ffb8eb 85%, #ffdda3 100%)',
                  borderRadius: '10px',
                  padding: '7px 12px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  boxShadow: '0 3px 12px rgba(158, 255, 239, 0.28)'
                }}
              >
                <span>{pickTexto(activeSprite.specialPerk)}</span>
              </div>
            )}
            {Boolean(pickTexto(activeSprite.ability)) && (
              <div>
                <span className="sdm__card-label">{t('detalle.habilidadOficial')}</span>
                <p className="sdm__card-text">{pickTexto(activeSprite.ability)}</p>
              </div>
            )}
            <div className="sdm__card-footer">
              <div className="sdm__card-detail" title={t('detalle.costeInvocacion')} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img
                  src="/img/stelar.webp"
                  alt={t('detalle.polvoEstelar')}
                  className="sdm__stelar-img"
                  style={{
                    width: '26px',
                    height: '26px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.55))'
                  }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)' }}>
                  {activeSprite.summonCost ? pickTexto(activeSprite.summonCost) : t('detalle.costePorDefecto')}
                </span>
              </div>
            </div>
          </div>

          {/* Family progress bar */}
          <div className="sdm__progress-wrap">
            <div className="sdm__progress-header">
              <span className="sdm__progress-title">
                {familySprites.length > 1 ? t('detalle.variantes') : t('detalle.coleccion')}
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
                  borderColor: vStyle.borderColor
                }}
              >
                <button
                  type="button"
                  className="sdm__variant-select"
                  aria-current={isSelected ? 'true' : undefined}
                  onClick={() => setActiveSprite(v)}
                >
                  <span className="sdm__variant-img-wrap">
                    {vMastered && (
                      <img src="/img/x/sprites/crown.webp" alt="" className="sdm__variant-crown" />
                    )}
                    <img
                      src={v.image}
                      alt=""
                      className={`sdm__variant-img ${!vOwned ? 'sdm__variant-img--locked' : ''}`}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </span>
                  <span className="sdm__variant-name">{pickThemeName(v.variant)}</span>
                  {v.unreleased && <span className="sdm__variant-drop">{t('detalle.noLanzadoMayus')}</span>}
                </button>

                {vOwned && !v.unreleased && !readOnly && (
                  <div className="sdm__variant-levels">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        aria-label={t('detalle.nivelAria', { n: lvl })}
                        aria-pressed={vLevel >= lvl}
                        className={`sdm__vlvl ${vLevel >= lvl ? (vMastered ? 'sdm__vlvl--gold' : 'sdm__vlvl--active') : ''}`}
                        onClick={() => {
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
    </Modal>
  );
}
