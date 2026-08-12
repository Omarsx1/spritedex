import React, { useState } from 'react';
import { Search, Grid, List, ChevronDown } from 'lucide-react';
import { THEMES_LIST, THEME_NAMES_ES, SPRITE_FAMILIES_LIST } from '../data/spritesData';

/* Gradient colors matching the card theme styles from spritesData.js */
const VARIANT_COLORS = {
  Basic:    { gradient: 'linear-gradient(135deg, #104273, #00afff)', border: '#00afff', glow: 'rgba(0, 175, 255, 0.3)' },
  Gold:     { gradient: 'linear-gradient(135deg, #9d752a, #f5b642)', border: '#f5b642', glow: 'rgba(245, 182, 66, 0.3)' },
  Candy:    { gradient: 'linear-gradient(135deg, #9f4540, #f16f68)', border: '#f16f68', glow: 'rgba(241, 111, 104, 0.3)' },
  Galaxy:   { gradient: 'linear-gradient(135deg, #4a31bc, #7c3aed)', border: '#4a35fa', glow: 'rgba(74, 53, 250, 0.3)' },
  Cube:     { gradient: 'linear-gradient(135deg, #730974, #a855f7)', border: '#8b008b', glow: 'rgba(139, 0, 139, 0.3)' },
  Holofoil: { gradient: 'linear-gradient(135deg, #cb77be, #ec88d8)', border: '#ec88d8', glow: 'rgba(236, 136, 216, 0.3)' },
  Gem:      { gradient: 'linear-gradient(135deg, #0f6c7d, #22d3ee)', border: '#22d3ee', glow: 'rgba(34, 211, 238, 0.3)' },
  Quack:    { gradient: 'linear-gradient(135deg, #cb77be, #f9a825)', border: '#f9a825', glow: 'rgba(249, 168, 37, 0.3)' },
};

export function FilterBar({
  searchQuery,
  setSearchQuery,
  baseFilter,
  setBaseFilter,
  spriteFilter,
  setSpriteFilter,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  showUnreleased,
  setShowUnreleased,
  viewMode,
  setViewMode
}) {
  const [variantOpen, setVariantOpen] = useState(false);

  const handleVariantSelect = (value) => {
    setBaseFilter(value);
    setVariantOpen(false);
  };

  return (
    <div className="filter-bar">
      {/* Búsqueda */}
      <div className="filter-search">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="BUSCAR"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Filtro VARIANTE — Botones con colores representativos */}
      <div className="variant-filter-wrap">
        <button
          className={`variant-filter-trigger ${variantOpen ? 'is-open' : ''} ${baseFilter !== 'all' ? 'has-selection' : ''}`}
          onClick={() => setVariantOpen(!variantOpen)}
          style={baseFilter !== 'all' && VARIANT_COLORS[baseFilter] ? {
            background: VARIANT_COLORS[baseFilter].gradient,
            borderColor: VARIANT_COLORS[baseFilter].border,
            boxShadow: `0 0 12px ${VARIANT_COLORS[baseFilter].glow}`
          } : {}}
        >
          <span>{baseFilter === 'all' ? 'VARIANTE' : (THEME_NAMES_ES[baseFilter] || baseFilter)}</span>
          <ChevronDown size={14} className={`variant-chevron ${variantOpen ? 'rotated' : ''}`} />
        </button>

        {variantOpen && (
          <>
            <div className="variant-filter-backdrop" onClick={() => setVariantOpen(false)} />
            <div className="variant-filter-dropdown">
              {/* Todas */}
              <button
                className={`variant-chip variant-chip--all ${baseFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => handleVariantSelect('all')}
              >
                Todas
              </button>

              {/* Variantes con colores */}
              {THEMES_LIST.map(theme => {
                const colors = VARIANT_COLORS[theme];
                const isActive = baseFilter === theme;
                return (
                  <button
                    key={theme}
                    className={`variant-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleVariantSelect(theme)}
                    style={{
                      background: colors.gradient,
                      borderColor: isActive ? '#fff' : colors.border,
                      boxShadow: isActive ? `0 0 14px ${colors.glow}, inset 0 0 20px rgba(255,255,255,0.1)` : `0 2px 8px rgba(0,0,0,0.3)`
                    }}
                  >
                    {THEME_NAMES_ES[theme] || theme}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Filtro SPRITE (familia) */}
      <select
        className="filter-select"
        value={spriteFilter}
        onChange={(e) => setSpriteFilter(e.target.value)}
      >
        <option value="all">SPRITE ▾</option>
        {SPRITE_FAMILIES_LIST.map(f => (
          <option key={f} value={f}>{f}</option>
        ))}
      </select>

      {/* Filtro ESTADO (todos / atrapados / faltantes) */}
      <select
        className="filter-select"
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
      >
        <option value="all">ESTADO ▾</option>
        <option value="owned">Atrapados</option>
        <option value="missing">No Atrapados</option>
      </select>

      {/* Mostrar no lanzados */}
      <label className="filter-checkbox">
        <span>NO LANZADOS</span>
        <input
          type="checkbox"
          checked={showUnreleased}
          onChange={(e) => setShowUnreleased(e.target.checked)}
        />
      </label>

      {/* Toggle vista (cuadrícula / lista) */}
      <div className="view-toggle">
        <button
          className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
          onClick={() => setViewMode('grid')}
          title="Vista cuadrícula"
        >
          <Grid size={18} />
        </button>
        <button
          className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
          title="Vista lista"
        >
          <List size={18} />
        </button>
      </div>
    </div>
  );
}
