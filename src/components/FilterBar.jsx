import React from 'react';
import { Search, Grid, List } from 'lucide-react';
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
