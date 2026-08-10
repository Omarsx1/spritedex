import React, { useEffect, useRef } from 'react';
import { Search, Grid, List } from 'lucide-react';
import gsap from 'gsap';
import { THEMES_LIST, THEME_NAMES_ES, SPRITE_FAMILIES_LIST } from '../data/spritesData';

export function FilterBar({
  searchQuery,
  setSearchQuery,
  baseFilter,
  setBaseFilter,
  spriteFilter,
  setSpriteFilter,
  sortBy,
  setSortBy,
  showUnreleased,
  setShowUnreleased,
  viewMode,
  setViewMode
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current.children,
        { opacity: 0, y: 15, scale: 0.94 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.07,
          delay: 0.45,
          ease: 'power2.out'
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="filter-bar" ref={containerRef}>
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

      {/* Filtro BASE (variante/tema) */}
      <select
        className="filter-select"
        value={baseFilter}
        onChange={(e) => setBaseFilter(e.target.value)}
      >
        <option value="all">VARIANTE ▾</option>
        {THEMES_LIST.map(t => (
          <option key={t} value={t}>{THEME_NAMES_ES[t] || t}</option>
        ))}
      </select>

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

      {/* ORDENAR POR */}
      <select
        className="filter-select"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
      >
        <option value="default">ORDENAR POR ▾</option>
        <option value="name-asc">Nombre (A-Z)</option>
        <option value="name-desc">Nombre (Z-A)</option>
        <option value="rarity">Rareza</option>
        <option value="drop-desc">Drop % (Mayor → Menor)</option>
        <option value="drop-asc">Drop % (Menor → Mayor)</option>
        <option value="owned">Atrapados primero</option>
        <option value="missing">Faltantes primero</option>
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
