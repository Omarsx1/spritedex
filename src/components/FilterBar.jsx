import React, { useState } from 'react';
import { Search, Grid, List, ChevronDown } from 'lucide-react';
import { THEMES_LIST, THEME_NAMES_ES, SPRITE_FAMILIES_LIST, SPRITE_FAMILIES_WITH_IMAGES, THEME_STYLES } from '../data/spritesData';

/*
 * Variant chip gradients — uses the exact same top color from THEME_STYLES
 * but as a horizontal gradient for the pill button style.
 * Border colors match the card borders exactly.
 */
const VARIANT_COLORS = {
  Basic:    { gradient: 'linear-gradient(135deg, #104273, #1a6bb5)', border: '#00afff' },
  Gold:     { gradient: 'linear-gradient(135deg, #9d752a, #d4a23a)', border: '#f5b642' },
  Candy:    { gradient: 'linear-gradient(135deg, #9f4540, #d4615b)', border: '#f16f68' },
  Galaxy:   { gradient: 'linear-gradient(135deg, #4a31bc, #6d4fe0)', border: '#4a35fa' },
  Cube:     { gradient: 'linear-gradient(135deg, #730974, #a040a2)', border: '#8b008b' },
  Holofoil: { gradient: 'linear-gradient(135deg, #cb77be, #e09dd6)', border: '#ec88d8' },
  Gem:      { gradient: 'linear-gradient(135deg, #0f6c7d, #1a9cb5)', border: '#22d3ee' },
  Quack:    { gradient: 'linear-gradient(135deg, #cb77be, #d89a4a)', border: '#ec88d8' },
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
  const [spriteOpen, setSpriteOpen] = useState(false);

  const handleVariantSelect = (value) => {
    setBaseFilter(value);
    setVariantOpen(false);
  };

  const handleSpriteSelect = (value) => {
    setSpriteFilter(value);
    setSpriteOpen(false);
  };

  // Find the selected sprite's image for the trigger
  const selectedSpriteData = spriteFilter !== 'all'
    ? SPRITE_FAMILIES_WITH_IMAGES.find(f => f.name === spriteFilter)
    : null;

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
          onClick={() => { setVariantOpen(!variantOpen); setSpriteOpen(false); }}
          style={baseFilter !== 'all' && VARIANT_COLORS[baseFilter] ? {
            background: VARIANT_COLORS[baseFilter].gradient,
            borderColor: VARIANT_COLORS[baseFilter].border,
          } : {}}
        >
          <span>{baseFilter === 'all' ? 'VARIANTE' : (THEME_NAMES_ES[baseFilter] || baseFilter)}</span>
          <ChevronDown size={14} className={`variant-chevron ${variantOpen ? 'rotated' : ''}`} />
        </button>

        {variantOpen && (
          <>
            <div className="variant-filter-backdrop" onClick={() => setVariantOpen(false)} />
            <div className="variant-filter-dropdown">
              <button
                className={`variant-chip variant-chip--all ${baseFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => handleVariantSelect('all')}
              >
                Todas
              </button>

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

      {/* Filtro SPRITE — Dropdown con iconos */}
      <div className="sprite-filter-wrap">
        <button
          className={`variant-filter-trigger ${spriteOpen ? 'is-open' : ''} ${spriteFilter !== 'all' ? 'has-selection' : ''}`}
          onClick={() => { setSpriteOpen(!spriteOpen); setVariantOpen(false); }}
        >
          {selectedSpriteData && (
            <img
              src={selectedSpriteData.image}
              alt=""
              className="sprite-filter-trigger-icon"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <span>{spriteFilter === 'all' ? 'SPRITE' : spriteFilter}</span>
          <ChevronDown size={14} className={`variant-chevron ${spriteOpen ? 'rotated' : ''}`} />
        </button>

        {spriteOpen && (
          <>
            <div className="variant-filter-backdrop" onClick={() => setSpriteOpen(false)} />
            <div className="sprite-filter-dropdown">
              <button
                className={`sprite-chip ${spriteFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => handleSpriteSelect('all')}
              >
                <span className="sprite-chip__name">Todos</span>
              </button>

              {SPRITE_FAMILIES_WITH_IMAGES.map(family => {
                const isActive = spriteFilter === family.name;
                return (
                  <button
                    key={family.familyId}
                    className={`sprite-chip ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleSpriteSelect(family.name)}
                  >
                    <img
                      src={family.image}
                      alt=""
                      className="sprite-chip__icon"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <span className="sprite-chip__name">{family.name}</span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

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
