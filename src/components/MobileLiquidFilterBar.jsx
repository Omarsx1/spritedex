import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X, Check, RotateCcw } from 'lucide-react';
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

export function MobileLiquidFilterBar({
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
  showUnreleased,
  setShowUnreleased
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // Compute active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (baseFilter !== 'all') count++;
    if (spriteFilter !== 'all') count++;
    if (showUnreleased) count++;
    return count;
  }, [statusFilter, baseFilter, spriteFilter, showUnreleased]);

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

  const handleResetFilters = () => {
    setStatusFilter('all');
    setBaseFilter('all');
    setSpriteFilter('all');
    setShowUnreleased(false);
  };

  // Close sheet on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <div className="mobile-liquid-wrapper">
      {/* ═══ UNIFIED GLASSMORPHIC SEARCH & FILTER PILL ═══ */}
      <div className={`mobile-glass-search-pill ${isFocused ? 'is-focused' : ''} ${activeFiltersCount > 0 ? 'has-active-filters' : ''}`}>
        
        {/* Left: Search icon */}
        <Search size={16} className="mobile-glass-search-icon" />

        {/* Center: Search input */}
        <input
          ref={inputRef}
          type="text"
          placeholder="Buscar espíritu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="mobile-glass-search-input"
        />

        {/* Clear Button (only when there is text) */}
        {searchQuery && (
          <button
            type="button"
            className="mobile-glass-clear-btn"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
            aria-label="Borrar búsqueda"
          >
            <X size={13} />
          </button>
        )}

        {/* Subtle separator divider */}
        <div className="mobile-glass-divider" />

        {/* Right: Integrated Filter Button */}
        <button
          type="button"
          className={`mobile-glass-filter-btn ${activeFiltersCount > 0 ? 'is-active' : ''}`}
          onClick={() => setIsOpen(true)}
          aria-expanded={isOpen}
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={16} className="mobile-glass-filter-icon" />
          {activeFiltersCount > 0 && (
            <span className="mobile-glass-badge">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* ═══ ACTIVE FILTERS CHIPS (Quick dismiss tags) ═══ */}
      {activeFiltersCount > 0 && (
        <div className="mobile-active-chips-row">
          {statusFilter !== 'all' && (
            <button
              type="button"
              className="mobile-active-chip"
              onClick={() => setStatusFilter('all')}
            >
              <span>{STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}</span>
              <X size={11} />
            </button>
          )}
          {baseFilter !== 'all' && (
            <button
              type="button"
              className="mobile-active-chip"
              onClick={() => setBaseFilter('all')}
            >
              <span>{THEME_NAMES_ES[baseFilter] || baseFilter}</span>
              <X size={11} />
            </button>
          )}
          {spriteFilter !== 'all' && (
            <button
              type="button"
              className="mobile-active-chip"
              onClick={() => setSpriteFilter('all')}
            >
              <span>{spriteFilter}</span>
              <X size={11} />
            </button>
          )}
          {showUnreleased && (
            <button
              type="button"
              className="mobile-active-chip"
              onClick={() => setShowUnreleased(false)}
            >
              <span>No lanzados</span>
              <X size={11} />
            </button>
          )}
          <button
            type="button"
            className="mobile-active-chip mobile-active-chip--clear"
            onClick={handleResetFilters}
          >
            <RotateCcw size={10} />
            <span>Limpiar</span>
          </button>
        </div>
      )}

      {/* ═══ TRANSLUCENT FROSTED GLASS FILTER SHEET / MODAL ═══ */}
      {isOpen && (
        <div className="mobile-liquid-sheet-backdrop" onClick={() => setIsOpen(false)}>
          <div
            className="mobile-liquid-sheet"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de Espíritus"
          >
            {/* Sheet Handle Bar */}
            <div className="mobile-liquid-sheet-handle-wrap" onClick={() => setIsOpen(false)}>
              <div className="mobile-liquid-sheet-handle" />
            </div>

            {/* Sheet Header */}
            <div className="mobile-liquid-sheet-header">
              <div className="mobile-sheet-title-wrap">
                <SlidersHorizontal size={18} className="mobile-sheet-icon" />
                <h3 className="mobile-sheet-title">Filtros de Colección</h3>
                {activeFiltersCount > 0 && (
                  <span className="mobile-sheet-count-badge">{activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}</span>
                )}
              </div>
              <button
                type="button"
                className="mobile-sheet-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar filtros"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="mobile-liquid-sheet-body">
              {/* Section 1: Estado de Colección */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">Estado</label>
                <div className="mobile-status-grid">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`mobile-status-pill ${statusFilter === opt.value ? 'is-active' : ''}`}
                      onClick={() => setStatusFilter(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Generación */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">Generación</label>
                <div className="mobile-gen-selector">
                  <button
                    type="button"
                    className={`mobile-gen-btn ${activeGen === 0 ? 'is-active' : ''}`}
                    onClick={() => { setActiveGen(0); setBaseFilter('all'); setSpriteFilter('all'); }}
                  >
                    Todas
                  </button>
                  <button
                    type="button"
                    className={`mobile-gen-btn is-gen1 ${activeGen === 1 ? 'is-active' : ''}`}
                    onClick={() => { setActiveGen(1); setBaseFilter('all'); setSpriteFilter('all'); }}
                  >
                    Gen 1
                  </button>
                  <button
                    type="button"
                    className={`mobile-gen-btn is-gen2 ${activeGen === 2 ? 'is-active' : ''}`}
                    onClick={() => { setActiveGen(2); setBaseFilter('all'); setSpriteFilter('all'); }}
                  >
                    <span className="mobile-gen2-badge" />
                    Gen 2
                  </button>
                </div>
              </div>

              {/* Section 3: Variantes y Temas */}
              <div className="mobile-sheet-section">
                <div className="mobile-section-header-flex">
                  <label className="mobile-section-label">Variante / Tema</label>
                  {baseFilter !== 'all' && (
                    <button type="button" className="mobile-section-reset-btn" onClick={() => setBaseFilter('all')}>
                      Restablecer
                    </button>
                  )}
                </div>
                <div className="mobile-variants-chip-grid">
                  <button
                    type="button"
                    className={`mobile-variant-chip ${baseFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setBaseFilter('all')}
                  >
                    Todas
                  </button>
                  {availableThemes.map(theme => {
                    const colors = VARIANT_COLORS[theme] || { gradient: 'linear-gradient(135deg, #104273, #1a6bb5)', border: '#00afff' };
                    const isActive = baseFilter === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        className={`mobile-variant-chip ${isActive ? 'is-active' : ''}`}
                        onClick={() => setBaseFilter(isActive ? 'all' : theme)}
                        style={{
                          background: colors.gradient,
                          borderColor: isActive ? '#FFFFFF' : colors.border,
                          boxShadow: isActive ? `0 0 12px ${colors.border}` : 'none'
                        }}
                      >
                        {THEME_NAMES_ES[theme] || theme}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Familia / Sprite */}
              <div className="mobile-sheet-section">
                <div className="mobile-section-header-flex">
                  <label className="mobile-section-label">Familia de Espíritu</label>
                  {spriteFilter !== 'all' && (
                    <button type="button" className="mobile-section-reset-btn" onClick={() => setSpriteFilter('all')}>
                      Restablecer
                    </button>
                  )}
                </div>
                <div className="mobile-sprites-chip-grid">
                  <button
                    type="button"
                    className={`mobile-sprite-chip ${spriteFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => setSpriteFilter('all')}
                  >
                    <span className="mobile-sprite-chip-text">Todos</span>
                  </button>
                  {availableFamiliesWithImages.map(family => {
                    const isActive = spriteFilter === family.name;
                    return (
                      <button
                        key={family.familyId}
                        type="button"
                        className={`mobile-sprite-chip ${isActive ? 'is-active' : ''}`}
                        onClick={() => setSpriteFilter(isActive ? 'all' : family.name)}
                      >
                        <img
                          src={family.image}
                          alt=""
                          className="mobile-sprite-chip-img"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                        <span className="mobile-sprite-chip-text">{family.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: No Lanzados Toggle */}
              <div className="mobile-sheet-section">
                <label className="mobile-toggle-card">
                  <div className="mobile-toggle-info">
                    <span className="mobile-toggle-title">Mostrar No Lanzados</span>
                    <span className="mobile-toggle-desc">Espíritus filtrados o en desarrollo</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showUnreleased}
                    onChange={(e) => setShowUnreleased(e.target.checked)}
                    className="mobile-toggle-input"
                  />
                  <div className={`mobile-toggle-switch ${showUnreleased ? 'is-on' : ''}`}>
                    <div className="mobile-toggle-thumb" />
                  </div>
                </label>
              </div>
            </div>

            {/* Sheet Footer */}
            <div className="mobile-liquid-sheet-footer">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="mobile-sheet-btn-clear"
                  onClick={handleResetFilters}
                >
                  <RotateCcw size={14} />
                  <span>Limpiar</span>
                </button>
              )}
              <button
                type="button"
                className="mobile-sheet-btn-apply"
                onClick={() => setIsOpen(false)}
              >
                <Check size={16} />
                <span>Aplicar Filtros</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
