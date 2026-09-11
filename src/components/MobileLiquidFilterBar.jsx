import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { THEMES_LIST, THEME_NAMES_ES, ALL_SPRITES, FAMILY_NAMES_MAP } from '../data/spritesData';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos' },
  { value: 'new', label: 'Nuevos' },
  { value: 'owned', label: 'Atrapados' },
  { value: 'missing', label: 'Faltantes' },
];

export function MobileLiquidFilterBar({
  activeGen,
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
  const [isClosing, setIsClosing] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  // ═══ SMART ONE-TIME DISCOVERY COACHMARK (PROGRAMADO PARA ESTRENO) ═══
  const LOOTHACKER_RELEASE_TIMESTAMP = 1789041000000; // 2026-09-10T11:50:00.000Z (6:50 a. m. local UTC-5)
  const NEW_SPIRITS_COACHMARK_KEY = 'spritedex_seen_new_spirits_v3_loothacker';

  const [showNewTooltip, setShowNewTooltip] = useState(() => {
    try {
      if (localStorage.getItem(NEW_SPIRITS_COACHMARK_KEY)) return false;
      return Date.now() >= LOOTHACKER_RELEASE_TIMESTAMP;
    } catch {
      return false;
    }
  });
  const [isDismissing, setIsDismissing] = useState(false);

  // Activación automática si el usuario tiene la página abierta al llegar las 6:50 a. m.
  useEffect(() => {
    const now = Date.now();
    if (now < LOOTHACKER_RELEASE_TIMESTAMP) {
      const msUntilRelease = LOOTHACKER_RELEASE_TIMESTAMP - now;
      const timer = setTimeout(() => {
        try {
          if (!localStorage.getItem(NEW_SPIRITS_COACHMARK_KEY) && statusFilter !== 'new') {
            setShowNewTooltip(true);
          }
        } catch {}
      }, msUntilRelease);
      return () => clearTimeout(timer);
    }
  }, [statusFilter, LOOTHACKER_RELEASE_TIMESTAMP]);

  useEffect(() => {
    if (statusFilter === 'new') {
      setShowNewTooltip(false);
      try {
        localStorage.setItem(NEW_SPIRITS_COACHMARK_KEY, 'true');
      } catch {}
    }
  }, [statusFilter]);

  const handleExploreNew = () => {
    setStatusFilter('new');
    setIsDismissing(true);
    setTimeout(() => {
      setShowNewTooltip(false);
    }, 220);
    try {
      localStorage.setItem(NEW_SPIRITS_COACHMARK_KEY, 'true');
    } catch {}
  };

  const handleDismissTooltip = (e) => {
    e.stopPropagation();
    setIsDismissing(true);
    setTimeout(() => {
      setShowNewTooltip(false);
    }, 220);
    try {
      localStorage.setItem(NEW_SPIRITS_COACHMARK_KEY, 'true');
    } catch {}
  };

  const [canDismiss, setCanDismiss] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setCanDismiss(false);
      const isMotionDisabled = typeof document !== 'undefined' && document.body.classList.contains('motion-disabled');
      const delay = isMotionDisabled ? 60 : 350;
      const timer = setTimeout(() => {
        setCanDismiss(true);
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setCanDismiss(false);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const handleOpen = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsClosing(false);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (isClosing) return;
    const isMotionDisabled = typeof document !== 'undefined' && document.body.classList.contains('motion-disabled');
    if (isMotionDisabled) {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
      setIsOpen(false);
      setIsClosing(false);
      return;
    }
    setIsClosing(true);
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
      closeTimerRef.current = null;
    }, 240);
  };

  const handleBackdropClick = (e) => {
    if (!canDismiss) return;
    if (e.target !== e.currentTarget) return;
    handleClose();
  };

  // Smart Single-Touch with Toggle-Off (Apple & Spotify Standard)
  const handleBaseFilterSelect = (theme) => {
    if (theme === 'all' || baseFilter === theme) {
      setBaseFilter('all');
    } else {
      setBaseFilter(theme);
    }
  };

  const handleSpriteFilterSelect = (familyName) => {
    if (familyName === 'all' || spriteFilter === familyName) {
      setSpriteFilter('all');
    } else {
      setSpriteFilter(familyName);
    }
  };

  const handleStatusFilterSelect = (status) => {
    if (status === 'all' || statusFilter === status) {
      setStatusFilter('all');
    } else {
      setStatusFilter(status);
    }
  };

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
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing]);

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
      {/* ═══ COACHMARK WRAPPER ═══ */}
      <div className="mobile-new-coachmark-wrap">
        {/* Tooltip Coachmark de Nuevos Espíritus (One-Time Discovery) */}
        {showNewTooltip && statusFilter !== 'new' && (
          <div
            className={`mobile-new-coachmark ${isDismissing ? 'is-dismissing' : ''}`}
            onClick={handleExploreNew}
            role="button"
            tabIndex={0}
            title="Toca para ver los nuevos espíritus"
          >
            <div className="mobile-new-coachmark__content">
              <span className="mobile-new-coachmark__sparkle">✨</span>
              <span className="mobile-new-coachmark__text">¡Nuevos espíritus!</span>
              <span className="mobile-new-coachmark__action">Ver</span>
              <button
                type="button"
                className="mobile-new-coachmark__close"
                onClick={handleDismissTooltip}
                aria-label="Cerrar aviso"
              >
                <X size={12} />
              </button>
            </div>
            {/* Flechita apuntando directamente al botón de filtros */}
            <div className="mobile-new-coachmark__arrow" />
          </div>
        )}

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
            onClick={handleOpen}
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

      {/* ═══ CONSISTENT GLASS FILTER SHEET / MODAL ═══ */}
      {isOpen && (
        <div
          className={`mobile-liquid-sheet-backdrop ${isClosing ? 'is-closing' : ''}`}
          onClick={handleBackdropClick}
          style={{ pointerEvents: canDismiss ? 'auto' : 'none' }}
        >
          <div
            className={`mobile-liquid-sheet ${isClosing ? 'is-closing' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
            role="dialog"
            aria-modal="true"
            aria-label="Filtros de Espíritus"
          >
            {/* Sheet Handle Bar */}
            <div className="mobile-liquid-sheet-handle-wrap" onClick={handleClose}>
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
                onClick={handleClose}
                aria-label="Cerrar filtros"
              >
                <X size={16} />
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
                      onClick={() => handleStatusFilterSelect(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Variantes y Temas */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">Variante / Tema</label>
                <div className="mobile-variants-chip-grid">
                  <button
                    type="button"
                    className={`mobile-variant-chip ${baseFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => handleBaseFilterSelect('all')}
                  >
                    Todas
                  </button>
                  {availableThemes.map(theme => {
                    const isActive = baseFilter === theme;
                    return (
                      <button
                        key={theme}
                        type="button"
                        className={`mobile-variant-chip ${isActive ? 'is-active' : ''}`}
                        onClick={() => handleBaseFilterSelect(theme)}
                      >
                        {THEME_NAMES_ES[theme] || theme}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Familia / Sprite */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">Familia de Espíritu</label>
                <div className="mobile-sprites-chip-grid">
                  <button
                    type="button"
                    className={`mobile-sprite-chip ${spriteFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => handleSpriteFilterSelect('all')}
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
                        onClick={() => handleSpriteFilterSelect(family.name)}
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

              {/* Section 4: Compact Subtle No Lanzados Toggle */}
              <div className="mobile-sheet-compact-toggle-row">
                <label className="mobile-compact-toggle-label-wrap">
                  <span className="mobile-compact-toggle-title">Mostrar No Lanzados</span>
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
                className="mobile-sheet-btn-apply sdm-share__glitch-btn"
                data-text="APLICAR FILTROS"
                onClick={handleClose}
              >
                <span className="sdm-share__btn-text">Aplicar Filtros</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
