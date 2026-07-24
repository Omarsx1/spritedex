import React from 'react';
import { GENERATIONS } from '../data/spritesData';
import { sounds } from '../utils/audio';

export function GenerationFilter({ activeGen, setActiveGen, spritesList, userState }) {
  const getGenProgress = (genId) => {
    const genSprites = spritesList.filter(s => s.gen === genId);
    const owned = genSprites.filter(s => userState[s.id]?.owned).length;
    return { owned, total: genSprites.length };
  };

  return (
    <div className="gen-pills-row">
      <button
        className={`gen-pill-btn ${activeGen === 0 ? 'active' : ''}`}
        onClick={() => { setActiveGen(0); sounds.playBeep(); }}
      >
        <span>🌐 Todas las Generaciones</span>
        <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px' }}>
          {spritesList.filter(s => userState[s.id]?.owned).length} / {spritesList.length}
        </span>
      </button>

      {GENERATIONS.map((gen) => {
        const { owned, total } = getGenProgress(gen.id);
        const isActive = activeGen === gen.id;

        return (
          <button
            key={gen.id}
            className={`gen-pill-btn ${isActive ? 'active' : ''}`}
            onClick={() => { setActiveGen(gen.id); sounds.playBeep(); }}
          >
            <span style={{ color: isActive ? gen.badgeColor : undefined }}>
              ● {gen.name}: {gen.title}
            </span>
            <span style={{ fontSize: '0.78rem', background: isActive ? gen.badgeColor : 'rgba(255,255,255,0.15)', color: isActive ? '#000' : '#fff', padding: '2px 8px', borderRadius: '10px' }}>
              {owned} / {total}
            </span>
          </button>
        );
      })}
    </div>
  );
}
