import React from 'react';
import { X, Sparkles, MapPin, Zap, Coins } from 'lucide-react';
import { SPRITE_FAMILIES, RARITIES, getSpriteCardStyle } from '../data/spritesData';
import { sounds } from '../utils/audio';

export function SpriteDetailModal({ sprite, userState, onToggleOwned, onSetLevel, onClose }) {
  if (!sprite) return null;

  // Find the family that contains this sprite
  const family = SPRITE_FAMILIES.find(f => f.id === sprite.familyId);
  const familySprites = family ? family.sprites : [sprite];
  const rarityInfo = RARITIES[sprite.rarity] || { name: sprite.rarity, color: '#94a3b8', bg: '#1e293b' };
  const mainStyle = getSpriteCardStyle(sprite);
  const currentState = userState[sprite.id] || { owned: false, level: 1 };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '700px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Modal Top Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '16px',
            background: mainStyle.background,
            border: `2px solid ${mainStyle.borderColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            position: 'relative'
          }}>
            {currentState.owned && currentState.level === 5 && (
              <img
                src="/img/x/sprites/crown.webp"
                alt="Crown"
                style={{
                  position: 'absolute',
                  top: '4px',
                  left: '53%',
                  transform: 'translateX(-50%)',
                  width: '31px',
                  height: '21px',
                  zIndex: 5,
                  filter: 'drop-shadow(0 0 3px #000)'
                }}
              />
            )}
            <img
              src={sprite.image}
              alt={sprite.fullName}
              style={{
                maxWidth: '90%',
                maxHeight: '90%',
                objectFit: 'contain',
                filter: !currentState.owned ? 'grayscale(80%) opacity(0.5)' : 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
              }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span
                className={`sprite-pill rarity-badge ${rarityInfo.classKey ? `sprite-rarity-${rarityInfo.classKey}` : ''}`}
              >
                {rarityInfo.name}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                Drop Rate: {sprite.dropChance}
              </span>
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{sprite.fullName}</h2>
            <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '4px' }}>
              Variante: <strong style={{ color: '#cbd5e1' }}>{sprite.variantDisplay || sprite.variant}</strong> · Gen {sprite.gen}
            </div>
          </div>
        </div>

        {/* Ability & Location Specs */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '12px' }}>
            <Zap size={18} color="#eab308" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <strong style={{ color: '#fde047', fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>HABILIDAD PASIVA:</strong>
              <p style={{ fontSize: '0.92rem', color: '#cbd5e1', lineHeight: '1.4' }}>{sprite.ability}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
              <MapPin size={16} color="#3b82f6" />
              <span>{sprite.location}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8' }}>
              <Coins size={16} color="#eab308" />
              <span>Costo: {sprite.summonCost}</span>
            </div>
          </div>
        </div>

        {/* Level Control for this sprite */}
        {currentState.owned && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 800, color: currentState.level === 5 ? '#facc15' : '#10b981', marginBottom: '2px' }}>
                {currentState.level === 5 ? '⭐ MAESTREADO — NIVEL MÁXIMO' : `Nivel actual: ${currentState.level}/5`}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Ajusta el nivel de este Sprite</div>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  className={`star-btn ${currentState.level >= lvl ? 'active' : ''}`}
                  style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetLevel(sprite.id, lvl);
                    sounds.playLevelUp(lvl);
                  }}
                >
                  ★{lvl}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Variants Section */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} color="#ec4899" />
          <span>{sprite.familyId === 'icons_crossovers' ? 'TODOS LOS PERSONAJES Y VARIANTES DE ESTA COLECCIÓN:' : 'TODAS LAS VARIANTES DE ESTA FAMILIA:'}</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', maxHeight: '340px', overflowY: 'auto', paddingRight: '6px' }}>
          {familySprites.map((v) => {
            const vState = userState[v.id] || { owned: false, level: 1 };
            const vOwned = vState.owned;
            const vLevel = vState.level || 1;
            const vMastered = vOwned && vLevel === 5;
            const vStyle = getSpriteCardStyle(v);

            return (
              <div
                key={v.id}
                style={{
                  background: vStyle.background,
                  border: `2px solid ${vStyle.borderColor}`,
                  borderRadius: '12px',
                  padding: '10px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: vOwned ? `0 4px 12px ${vStyle.borderColor}33` : 'none'
                }}
              >
                {/* Variant sprite image - click to toggle owned */}
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    margin: '0 auto 6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onClick={() => {
                    onToggleOwned(v.id);
                    sounds.playToggle(!vOwned);
                  }}
                >
                  {vMastered && (
                    <img
                      src="/img/x/sprites/crown.webp"
                      alt="Crown"
                      style={{
                        position: 'absolute',
                        top: '0px',
                        left: '53%',
                        transform: 'translateX(-50%)',
                        width: '26px',
                        height: '18px',
                        zIndex: 5,
                        filter: 'drop-shadow(0 0 3px #000)'
                      }}
                    />
                  )}
                  <img
                    src={v.image}
                    alt={v.fullName}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      filter: !vOwned ? 'grayscale(85%) opacity(0.4)' : 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))'
                    }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {v.variantDisplay || v.variant}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>
                  {v.unreleased ? 'NO LANZADO' : v.dropChance}
                </div>

                {/* Toggle owned/faltante */}
                <div
                  style={{ marginTop: '6px', cursor: 'pointer' }}
                  onClick={() => {
                    onToggleOwned(v.id);
                    sounds.playToggle(!vOwned);
                  }}
                >
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: vMastered ? 'linear-gradient(135deg, #facc15, #ef4444)' : vOwned ? '#10b981' : 'rgba(255,255,255,0.1)',
                    color: vMastered ? '#000' : vOwned ? '#fff' : '#94a3b8'
                  }}>
                    {vMastered ? '⭐ MAX' : vOwned ? '✔ Atrapado' : '❌ Faltante'}
                  </span>
                </div>

                {/* Individual level selector per variant */}
                {vOwned && (
                  <div style={{ display: 'flex', gap: '2px', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSetLevel(v.id, lvl);
                          sounds.playLevelUp(lvl);
                        }}
                        style={{
                          flex: 1,
                          padding: '3px 0',
                          borderRadius: '3px',
                          background: vLevel >= lvl
                            ? (vLevel === 5 ? 'linear-gradient(135deg, #facc15, #f97316)' : '#10b981')
                            : 'rgba(0,0,0,0.4)',
                          border: `1px solid ${vLevel >= lvl ? (vLevel === 5 ? '#fef08a' : '#34d399') : 'rgba(255,255,255,0.08)'}`,
                          color: vLevel >= lvl ? (vLevel === 5 ? '#000' : '#fff') : 'rgba(255,255,255,0.25)',
                          fontSize: '0.6rem',
                          fontWeight: 900,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
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
