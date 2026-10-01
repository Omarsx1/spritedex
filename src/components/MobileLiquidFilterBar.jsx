import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, SlidersHorizontal, X, RotateCcw } from 'lucide-react';
import { THEMES_LIST, ALL_SPRITES, pickFamilyName, pickThemeName } from '../data/spritesData';
import { t } from '../i18n';
import { safeStorage } from '../utils/safeStorage';
import { contarNovedades, claveAvisoNovedades } from '../utils/novedadesAviso';

const STATUS_OPTIONS = [
  { value: 'all', labelKey: 'filtrosMovil.todos' },
  { value: 'new', labelKey: 'filtrosMovil.nuevos' },
  { value: 'owned', labelKey: 'filtrosMovil.atrapados' },
  { value: 'missing', labelKey: 'filtrosMovil.faltantes' },
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

  // ═══ SMART ONE-TIME DISCOVERY COACHMARK (NUEVO DROP CUMPLEAÑOS - 2026-09-26) ═══
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
        image: sprite ? sprite.image : (activeGen === 2 ? `/sprites/${familyId}_basic.webp` : `/sprites/${familyId}_basic.png`)
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

  const handleResetFilters = () => {
    setStatusFilter('all');
    setBaseFilter('all');
    setSpriteFilter('all');
    setSearchQuery('');
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
            title={t('filtrosMovil.tocaVerNuevos')}
          >
            <div className="mobile-new-coachmark__content">
              <span className="mobile-new-coachmark__sparkle">✨</span>
              <span className="mobile-new-coachmark__text">{t('filtrosMovil.nuevosEspiritus', { n: newSpiritsCount })}</span>
              <span className="mobile-new-coachmark__action">{t('filtrosMovil.ver')}</span>
              <button
                type="button"
                className="mobile-new-coachmark__close"
                onClick={handleDismissTooltip}
                aria-label={t('filtrosMovil.cerrarAviso')}
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
            placeholder={t('filtrosMovil.buscarEspiritu')}
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
              aria-label={t('filtrosMovil.borrarBusqueda')}
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
            aria-label={t('filtrosMovil.abrirFiltros')}
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
              <span>{t(STATUS_OPTIONS.find(o => o.value === statusFilter)?.labelKey)}</span>
              <X size={11} />
            </button>
          )}

          {baseFilter !== 'all' && (
            <button
              type="button"
              className="mobile-active-chip"
              onClick={() => setBaseFilter('all')}
            >
              <span>{pickThemeName(baseFilter)}</span>
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
              <span>{t('filtrosMovil.noLanzados')}</span>
              <X size={11} />
            </button>
          )}
          <button
            type="button"
            className="mobile-active-chip mobile-active-chip--clear"
            onClick={handleResetFilters}
          >
            <RotateCcw size={10} />
            <span>{t('filtrosMovil.limpiar')}</span>
          </button>
        </div>
      )}

      {/* ═══ CONSISTENT GLASS FILTER SHEET / MODAL ═══ */}
      {isOpen && typeof document !== 'undefined' && createPortal(
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
            aria-label={t('filtrosMovil.filtrosDeEspiritus')}
          >
            {/* Sheet Handle Bar */}
            <div className="mobile-liquid-sheet-handle-wrap" onClick={handleClose}>
              <div className="mobile-liquid-sheet-handle" />
            </div>

            {/* Sheet Header */}
            <div className="mobile-liquid-sheet-header">
              <div className="mobile-sheet-title-wrap">
                <SlidersHorizontal size={18} className="mobile-sheet-icon" />
                <h3 className="mobile-sheet-title">{t('filtrosMovil.filtrosDeColeccion')}</h3>
                {activeFiltersCount > 0 && (
                  <span className="mobile-sheet-count-badge">{activeFiltersCount === 1 ? t('filtrosMovil.activo', { n: activeFiltersCount }) : t('filtrosMovil.activos', { n: activeFiltersCount })}</span>
                )}
              </div>
              <button
                type="button"
                className="mobile-sheet-close-btn"
                onClick={handleClose}
                aria-label={t('filtrosMovil.cerrarFiltros')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Sheet Scrollable Body */}
            <div className="mobile-liquid-sheet-body">
              {/* Section 1: Estado de Colección */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">{t('filtrosMovil.estado')}</label>
                <div className="mobile-status-grid">
                  {STATUS_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`mobile-status-pill ${statusFilter === opt.value ? 'is-active' : ''}`}
                      onClick={() => handleStatusFilterSelect(opt.value)}
                    >
                      {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: Variantes y Temas */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">{t('filtrosMovil.varianteTema')}</label>
                <div className="mobile-variants-chip-grid">
                  <button
                    type="button"
                    className={`mobile-variant-chip ${baseFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => handleBaseFilterSelect('all')}
                  >
                    {t('filtrosMovil.todas')}
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
                        {pickThemeName(theme)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Familia / Sprite */}
              <div className="mobile-sheet-section">
                <label className="mobile-section-label">{t('filtrosMovil.familiaDeEspiritu')}</label>
                <div className="mobile-sprites-chip-grid">
                  <button
                    type="button"
                    className={`mobile-sprite-chip ${spriteFilter === 'all' ? 'is-active' : ''}`}
                    onClick={() => handleSpriteFilterSelect('all')}
                  >
                    <span className="mobile-sprite-chip-text">{t('filtrosMovil.todos')}</span>
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
                  <span className="mobile-compact-toggle-title">{t('filtrosMovil.mostrarNoLanzados')}</span>
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
                  <span>{t('filtrosMovil.limpiar')}</span>
                </button>
              )}
              <button
                type="button"
                className="mobile-sheet-btn-apply sdm-share__glitch-btn"
                data-text={t('filtrosMovil.aplicarFiltrosMayus')}
                onClick={handleClose}
              >
                <span className="sdm-share__btn-text">{t('filtrosMovil.aplicarFiltros')}</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
