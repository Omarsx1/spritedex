import React, { useState, useMemo, useEffect } from 'react';
import { Search, Grid, List, ChevronDown, X, GalleryHorizontal } from 'lucide-react';
import { THEMES_LIST, ALL_SPRITES, pickFamilyName, pickThemeName } from '../data/spritesData';
import { t } from '../i18n';
import { MobileLiquidFilterBar } from './MobileLiquidFilterBar';
import { safeStorage } from '../utils/safeStorage';
import { rutaBasicoFamilia } from '../utils/spriteAssets';
import { contarNovedades, claveAvisoNovedades } from '../utils/novedadesAviso';

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
  { value: 'all', labelKey: 'filtros.todos' },
  { value: 'new', labelKey: 'filtros.nuevos' },
  { value: 'owned', labelKey: 'filtros.atrapados' },
  { value: 'missing', labelKey: 'filtros.faltantes' },
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

  // Compute number of active new spirits
  const newSpiritsCount = useMemo(() => {
    return contarNovedades(ALL_SPRITES);
  }, []);

  /* La clave del aviso sale del drop mas reciente: cada tanda de espiritus
     nuevos vuelve a avisar una vez por navegador. */
  const claveNovedades = useMemo(() => claveAvisoNovedades(ALL_SPRITES), []);

  const [showNewTooltip, setShowNewTooltip] = useState(() => {
    if (safeStorage.getItem(claveNovedades)) return false;
    return newSpiritsCount > 0;
  });
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    if (statusFilter === 'new') {
      setShowNewTooltip(false);
      safeStorage.setItem(claveNovedades, 'true');
    }
  }, [statusFilter]);

  const handleExploreNew = () => {
    setStatusFilter('new');
    setIsDismissing(true);
    setTimeout(() => {
      setShowNewTooltip(false);
    }, 220);
    safeStorage.setItem(claveNovedades, 'true');
  };

  const handleDismissTooltip = (e) => {
    e.stopPropagation();
    setIsDismissing(true);
    setTimeout(() => {
      setShowNewTooltip(false);
    }, 220);
    safeStorage.setItem(claveNovedades, 'true');
  };

  // Compute available families scoped to activeGen and showUnreleased
  const availableFamiliesWithImages = useMemo(() => {
    const scopedSprites = ALL_SPRITES.filter(s => (activeGen === 0 || s.gen === activeGen) && (showUnreleased || !s.unreleased));
    const uniqueFamilyIds = [...new Set(scopedSprites.map(s => s.familyId))];
    return uniqueFamilyIds.map(familyId => {
      const sprite = scopedSprites.find(s => s.familyId === familyId && s.variant === 'Basic')
        || scopedSprites.find(s => s.familyId === familyId);
      const name = pickFamilyName(familyId);
      return {
        name,
        familyId,
        image: sprite ? sprite.image : rutaBasicoFamilia(familyId)
      };
    });
  }, [activeGen, showUnreleased]);

  // Compute available variants scoped to activeGen and showUnreleased
  const availableThemes = useMemo(() => {
    const scopedSprites = ALL_SPRITES.filter(s => (activeGen === 0 || s.gen === activeGen) && (showUnreleased || !s.unreleased));
    const uniqueThemes = [...new Set(scopedSprites.map(s => s.variant))];
    return THEMES_LIST.filter(theme => uniqueThemes.includes(theme));
  }, [activeGen, showUnreleased]);

  // Auto-reset baseFilter if the selected variant becomes unavailable without showUnreleased
  useEffect(() => {
    if (!showUnreleased && baseFilter !== 'all' && !availableThemes.includes(baseFilter)) {
      setBaseFilter('all');
    }
  }, [showUnreleased, baseFilter, availableThemes, setBaseFilter]);

  // Auto-reset spriteFilter if the selected family becomes unavailable without showUnreleased
  useEffect(() => {
    if (!showUnreleased && spriteFilter !== 'all') {
      const familyNames = availableFamiliesWithImages.map(f => f.name);
      if (!familyNames.includes(spriteFilter)) {
        setSpriteFilter('all');
      }
    }
  }, [showUnreleased, spriteFilter, availableFamiliesWithImages, setSpriteFilter]);

  const handleVariantSelect = (value) => {
    if (value === 'all' || baseFilter === value) {
      setBaseFilter('all');
    } else {
      setBaseFilter(value);
    }
    setVariantOpen(false);
  };

  const handleSpriteSelect = (value) => {
    if (value === 'all' || spriteFilter === value) {
      setSpriteFilter('all');
    } else {
      setSpriteFilter(value);
    }
    setSpriteOpen(false);
  };

  const handleGenChange = (newGen) => {
    setActiveGen(newGen);
    setBaseFilter('all');
    setSpriteFilter('all');
  };

  const selectedSpriteData = spriteFilter !== 'all'
    ? availableFamiliesWithImages.find(f => f.name === spriteFilter)
    : null;

  if (isMobile) {
    return (
      <MobileLiquidFilterBar
        activeGen={activeGen}
        setActiveGen={setActiveGen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        baseFilter={baseFilter}
        setBaseFilter={setBaseFilter}
        spriteFilter={spriteFilter}
        setSpriteFilter={setSpriteFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        showUnreleased={showUnreleased}
        setShowUnreleased={setShowUnreleased}
      />
    );
  }

  return (
    <div className="filter-bar-container desktop-only">
      {/* Status Filter Pill Buttons (Top line) */}
      <div className="status-pill-group" style={{ position: 'relative' }}>
        {/* Tooltip Coachmark de Nuevos Espíritus (Desktop) */}
        {showNewTooltip && statusFilter !== 'new' && (
          <div
            className={`mobile-new-coachmark ${isDismissing ? 'is-dismissing' : ''}`}
            onClick={handleExploreNew}
            role="button"
            tabIndex={0}
            title={t('filtros.clicVerNuevos')}
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '54px',
              zIndex: 50,
              cursor: 'pointer'
            }}
          >
            <div className="mobile-new-coachmark__content">
              <span className="mobile-new-coachmark__sparkle">✨</span>
              <span className="mobile-new-coachmark__text">{t('filtros.nuevosEspiritus', { n: newSpiritsCount })}</span>
              <span className="mobile-new-coachmark__action">{t('filtros.ver')}</span>
              <button
                type="button"
                className="mobile-new-coachmark__close"
                onClick={handleDismissTooltip}
                aria-label={t('filtros.cerrarAviso')}
              >
                <X size={12} />
              </button>
            </div>
            <div className="mobile-new-coachmark__arrow" />
          </div>
        )}
        {STATUS_OPTIONS.map(opt => (
          <button
            key={opt.value}
            className={`status-pill-btn ${statusFilter === opt.value ? 'is-active' : ''}`}
            onClick={() => setStatusFilter(statusFilter === opt.value ? 'all' : opt.value)}
          >
            <span>{t(opt.labelKey)}</span>
            {opt.value === 'new' && newSpiritsCount > 0 && (
              <span className="status-pill-count-badge">{newSpiritsCount}</span>
            )}
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
            placeholder={t('filtros.buscar')}
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
            <span>{baseFilter === 'all' ? t('filtros.variante') : pickThemeName(baseFilter)}</span>
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
                  {t('filtros.todas')}
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
                      {pickThemeName(theme)}
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
                  <span className="sprite-chip-name">{t('filtros.todos')}</span>
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
          <span>{t('filtros.noLanzados')}</span>
          <input
            type="checkbox"
            checked={showUnreleased}
            onChange={(e) => setShowUnreleased(e.target.checked)}
          />
        </label>

        {/* View Mode Toggle (Grid/List/Spotlight) */}
        {!isMobile && (
          <div className="filter-view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title={t('filtros.vistaCuadricula')}
            >
              <Grid size={15} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title={t('filtros.vistaLista')}
            >
              <List size={15} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'spotlight' ? 'active' : ''}`}
              onClick={() => setViewMode('spotlight')}
              title={t('filtros.vistaSpotlight')}
            >
              <GalleryHorizontal size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
