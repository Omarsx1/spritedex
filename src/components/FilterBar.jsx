import React, { useState, useMemo } from 'react';
import { Search, Grid, List, ChevronDown } from 'lucide-react';
import { THEMES_LIST, THEME_NAMES_ES, ALL_SPRITES, FAMILY_NAMES_MAP } from '../data/spritesData';

const VARIANT_COLORS = {
  Basic:       { gradient: 'linear-gradient(135deg, #104273, #1a6bb5)', border: '#00afff' },
  Gold:        { gradient: 'linear-gradient(135deg, #9d752a, #d4a23a)', border: '#f5b642' },
  Cheatmaster: { gradient: 'linear-gradient(135deg, #052e16, #166534)', border: '#22c55e' },
  Candy:       { gradient: 'linear-gradient(135deg, #9f4540, #d4615b)', border: '#f16f68' },
  Galaxy:      { gradient: 'linear-gradient(135deg, #4a31bc, #6d4fe0)', border: '#4a35fa' },
  Cube:        { gradient: 'linear-gradient(135deg, #730974, #a040a2)', border: '#8b008b' },
  Holofoil:    { gradient: 'linear-gradient(135deg, #cb77be, #e09dd6)', border: '#ec88d8' },
  Gem:         { gradient: 'linear-gradient(135deg, #0f6c7d, #1a9cb5)', border: '#22d3ee' },
  Quack:       { gradient: 'linear-gradient(135deg, #cb77be, #d89a4a)', border: '#ec88d8' },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'owned', label: 'Atrapados' },
  { value: 'missing', label: 'Faltantes' },
];

export function FilterBar({
  isMobile,
  activeGen,
  setActiveGen,
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

  // Compute available families scoped to activeGen
  const availableFamiliesWithImages = useMemo(() => {
    const scopedSprites = ALL_SPRITES.filter(s => activeGen === 0 || s.gen === activeGen);
    const uniqueFamilyIds = [...new Set(scopedSprites.map(s => s.familyId))];
    return uniqueFamilyIds.map(familyId => {
      const sprite = scopedSprites.find(s => s.familyId === familyId && s.variant === 'Basic')
        || scopedSprites.find(s => s.familyId === familyId);
      const name = FAMILY_NAMES_MAP[familyId] || (familyId.charAt(0).toUpperCase() + familyId.slice(1));
      return {
        name,
        familyId,
        image: sprite ? sprite.image : (activeGen === 2 ? `/sprites/${familyId}_basic.webp` : `/sprites/${familyId}_basic.png`)
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [activeGen]);

  // Compute available variants scoped to activeGen
  const availableThemes = useMemo(() => {
    const scopedSprites = ALL_SPRITES.filter(s => activeGen === 0 || s.gen === activeGen);
    const uniqueThemes = [...new Set(scopedSprites.map(s => s.variant))];
    return THEMES_LIST.filter(t => uniqueThemes.includes(t));
  }, [activeGen]);

  const handleVariantSelect = (value) => { setBaseFilter(value); setVariantOpen(false); };
  const handleSpriteSelect = (value) => { setSpriteFilter(value); setSpriteOpen(false); };

  const handleGenChange = (newGen) => {
    setActiveGen(newGen);
    setBaseFilter('all');
    setSpriteFilter('all');
  };

  const selectedSpriteData = spriteFilter !== 'all'
    ? availableFamiliesWithImages.find(f => f.name === spriteFilter)
    : null;

  return (
    <div className="filter-bar-container">
      {/* Status Filter Pill Buttons (Top line) */}
      <div className="status-pill-group">
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`status-pill-btn ${statusFilter === opt.value ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Main Filter Controls (Compact Inline Row) */}
      <div className="filter-controls-row">
        {/* Search */}
        <div className="filter-search-box">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="BUSCAR"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-field"
          />
        </div>

        {/* Variante Dropdown */}
        <div className="filter-dropdown-wrap">
          <button
            className={`filter-pill-trigger ${variantOpen ? 'is-open' : ''} ${baseFilter !== 'all' ? 'has-selection' : ''}`}
            onClick={() => { setVariantOpen(!variantOpen); setSpriteOpen(false); }}
            style={baseFilter !== 'all' && VARIANT_COLORS[baseFilter] ? {
              background: VARIANT_COLORS[baseFilter].gradient,
              borderColor: VARIANT_COLORS[baseFilter].border,
              color: '#ffffff'
            } : {}}
          >
            <span>{baseFilter === 'all' ? 'VARIANTE' : (THEME_NAMES_ES[baseFilter] || baseFilter)}</span>
            <ChevronDown size={13} className={`trigger-chevron ${variantOpen ? 'rotated' : ''}`} />
          </button>

          {variantOpen && (
            <>
              <div className="filter-backdrop-overlay" onClick={() => setVariantOpen(false)} />
              <div className="variant-grid-dropdown">
                <button
                  className={`variant-grid-chip variant-chip--all ${baseFilter === 'all' ? 'is-active' : ''}`}
                  onClick={() => handleVariantSelect('all')}
                >
                  Todas
                </button>
                {availableThemes.map(theme => {
                  const colors = VARIANT_COLORS[theme] || { gradient: 'linear-gradient(135deg, #104273, #1a6bb5)', border: '#00afff' };
                  const isActive = baseFilter === theme;
                  return (
                    <button
                      key={theme}
                      className={`variant-grid-chip ${isActive ? 'is-active' : ''}`}
                      onClick={() => handleVariantSelect(theme)}
                      style={{ background: colors.gradient, borderColor: isActive ? '#fff' : colors.border }}
                    >
                      {THEME_NAMES_ES[theme] || theme}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Sprite Dropdown */}
        <div className="filter-dropdown-wrap">
          <button
            className={`filter-pill-trigger ${spriteOpen ? 'is-open' : ''} ${spriteFilter !== 'all' ? 'has-selection' : ''}`}
            onClick={() => { setSpriteOpen(!spriteOpen); setVariantOpen(false); }}
          >
            {selectedSpriteData && (
              <img src={selectedSpriteData.image} alt="" className="trigger-sprite-icon"
                onError={(e) => { e.target.style.display = 'none'; }} />
            )}
            <span>{spriteFilter === 'all' ? 'SPRITE' : spriteFilter}</span>
            <ChevronDown size={13} className={`trigger-chevron ${spriteOpen ? 'rotated' : ''}`} />
          </button>

          {spriteOpen && (
            <>
              <div className="filter-backdrop-overlay" onClick={() => setSpriteOpen(false)} />
              <div className="sprite-grid-dropdown">
                <button
                  className={`sprite-grid-chip ${spriteFilter === 'all' ? 'is-active' : ''}`}
                  onClick={() => handleSpriteSelect('all')}
                >
                  <span className="sprite-chip-name">Todos</span>
                </button>
                {availableFamiliesWithImages.map(family => (
                  <button
                    key={family.familyId}
                    className={`sprite-grid-chip ${spriteFilter === family.name ? 'is-active' : ''}`}
                    onClick={() => handleSpriteSelect(family.name)}
                  >
                    <img src={family.image} alt="" className="sprite-chip-icon"
                      onError={(e) => { e.target.style.display = 'none'; }} />
                    <span className="sprite-chip-name">{family.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* No Lanzados Checkbox */}
        <label className="filter-pill-checkbox">
          <span>NO LANZADOS</span>
          <input
            type="checkbox"
            checked={showUnreleased}
            onChange={(e) => setShowUnreleased(e.target.checked)}
          />
        </label>

        {/* View Mode Toggle (Grid/List) */}
        {!isMobile && (
          <div className="filter-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Vista cuadrícula"
            >
              <Grid size={15} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Vista lista"
            >
              <List size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
