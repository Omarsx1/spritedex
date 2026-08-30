import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  Filter, 
  Layers, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { RARITIES } from '../../data/spritesData';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function SpiritCatalogTable({ 
  sprites = [], 
  globalSearch = '', 
  onEdit, 
  onAddNew, 
  onManageFamilies,
  onRefresh, 
  darkMode = false 
}) {
  const [localSearch, setLocalSearch] = useState('');

  const [statusFilter, setStatusFilter] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlStatus = urlParams.get('status');
      if (urlStatus && ['all', 'active', 'unreleased'].includes(urlStatus)) return urlStatus;
      const savedStatus = sessionStorage.getItem('spritedex_catalog_status');
      if (savedStatus) return savedStatus;
    } catch {}
    return 'all';
  });

  const [genFilter, setGenFilter] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlGen = urlParams.get('gen');
      if (urlGen && ['1', '2', 'all'].includes(urlGen)) return urlGen;
      const savedGen = sessionStorage.getItem('spritedex_catalog_gen');
      if (savedGen) return savedGen;
    } catch {}
    return '2';
  });

  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPage = parseInt(urlParams.get('page'), 10);
      if (urlPage && urlPage > 0) return urlPage;
      const savedPage = parseInt(sessionStorage.getItem('spritedex_catalog_page'), 10);
      if (savedPage && savedPage > 0) return savedPage;
    } catch {}
    return 1;
  });

  const pageSize = 15;
  const [deletingId, setDeletingId] = useState(null);

  const query = (globalSearch || localSearch).trim().toLowerCase();

  const filteredSprites = useMemo(() => {
    return sprites.filter((s) => {
      if (query !== '') {
        const matchesName = (s.fullName || s.name || '').toLowerCase().includes(query);
        const matchesFamily = (s.familyName || '').toLowerCase().includes(query);
        const matchesId = (s.id || '').toLowerCase().includes(query);
        if (!matchesName && !matchesFamily && !matchesId) return false;
      }

      if (statusFilter === 'active' && s.unreleased) return false;
      if (statusFilter === 'unreleased' && !s.unreleased) return false;

      if (genFilter === '1' && s.gen !== 1) return false;
      if (genFilter === '2' && s.gen !== 2) return false;

      return true;
    });
  }, [sprites, query, statusFilter, genFilter]);

  const totalPages = Math.ceil(filteredSprites.length / pageSize) || 1;

  const handlePageChange = (newPage) => {
    const clamped = Math.max(1, Math.min(totalPages, newPage));
    setCurrentPage(clamped);
    try {
      sessionStorage.setItem('spritedex_catalog_page', String(clamped));
      const url = new URL(window.location.href);
      url.searchParams.set('page', String(clamped));
      window.history.replaceState({}, '', url.toString());
    } catch {}
  };

  const handleGenChange = (newGen) => {
    setGenFilter(newGen);
    try {
      sessionStorage.setItem('spritedex_catalog_gen', newGen);
      const url = new URL(window.location.href);
      url.searchParams.set('gen', newGen);
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } catch {}
    setCurrentPage(1);
  };

  const handleStatusChange = (newStatus) => {
    setStatusFilter(newStatus);
    try {
      sessionStorage.setItem('spritedex_catalog_status', newStatus);
      const url = new URL(window.location.href);
      url.searchParams.set('status', newStatus);
      url.searchParams.set('page', '1');
      window.history.replaceState({}, '', url.toString());
    } catch {}
    setCurrentPage(1);
  };

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      handlePageChange(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedSprites = filteredSprites.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleDelete = async (sprite) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a "${sprite.fullName}" de la base de datos?`)) {
      return;
    }

    try {
      setDeletingId(sprite.id);
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('sprites').delete().eq('id', sprite.id);
        if (error) throw error;
      }
      onRefresh();
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const containerStyle = {
    background: darkMode ? '#1C1C1C' : '#FFFFFF',
    borderRadius: '16px',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    boxShadow: darkMode ? '0 4px 20px rgba(0, 0, 0, 0.35)' : '0 1px 3px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s ease'
  };

  const inputStyle = {
    padding: '9px 14px',
    borderRadius: '10px',
    background: darkMode ? '#171717' : '#F8FAFC',
    border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
    color: darkMode ? '#EDEDED' : '#1E293B',
    fontSize: '0.82rem',
    fontWeight: 600,
    outline: 'none'
  };

  const textPrimary = darkMode ? '#EDEDED' : '#1E293B';
  const textMuted = darkMode ? '#8B949E' : '#64748B';
  const tableHeaderBg = darkMode ? '#171717' : '#F8FAFC';
  const rowBorder = darkMode ? '1px solid #262626' : '1px solid #F1F5F9';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Table Control Header */}
      <div style={{
        ...containerStyle,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '400px' }}>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => { setLocalSearch(e.target.value); setCurrentPage(1); }}
            placeholder="Buscar por nombre, familia o ID..."
            style={{
              ...inputStyle,
              width: '100%',
              padding: '10px 14px 10px 38px',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: textMuted }} />
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            style={inputStyle}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Solo Activos</option>
            <option value="unreleased">Solo No Lanzados</option>
          </select>

          {/* Gen Filter */}
          <select
            value={genFilter}
            onChange={(e) => handleGenChange(e.target.value)}
            style={inputStyle}
          >
            <option value="2">🎮 Temporada Actual (2ª Gen - 60 Espíritus)</option>
            <option value="1">🌟 1ª Generación (109 Espíritus)</option>
            <option value="all">📦 Todas las Generaciones (169 Espíritus)</option>
          </select>

          {/* Manage Families Button */}
          <button
            type="button"
            onClick={onManageFamilies}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              borderRadius: '10px',
              background: darkMode ? '#262626' : '#FFFFFF',
              color: textPrimary,
              border: darkMode ? '1px solid #333333' : '1px solid #CBD5E1',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Layers size={16} style={{ color: darkMode ? '#3ECF8E' : '#3C50E0' }} />
            <span>Gestionar Familias</span>
          </button>

          {/* Add Spirit Button */}
          <button
            type="button"
            onClick={onAddNew}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: darkMode ? '#3ECF8E' : '#3C50E0',
              color: darkMode ? '#121212' : '#FFFFFF',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: darkMode ? '0 4px 12px rgba(62, 207, 142, 0.25)' : '0 4px 12px rgba(60, 80, 224, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>Agregar Espíritu</span>
          </button>
        </div>
      </div>

      {/* Enterprise Data Table (TailAdmin Check Table Style) */}
      <div style={{
        ...containerStyle,
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0', color: textMuted, background: tableHeaderBg }}>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ESPÍRITU</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>FAMILIA</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>RAREZA</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>VARIANTE</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>COSTO DUST</th>
                <th style={{ padding: '14px 20px', fontWeight: 700 }}>ESTADO</th>
                <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSprites.length > 0 ? (
                paginatedSprites.map((sprite) => {
                  const rarityObj = RARITIES[sprite.rarity] || RARITIES.Common;
                  const rarityLabel = rarityObj.label || rarityObj.name || sprite.rarity;
                  const rarityColor = rarityObj.color === '#000000' ? '#0D9488' : (rarityObj.color || '#3C50E0');

                  return (
                    <tr key={sprite.id} style={{ borderBottom: rowBorder, transition: 'background 0.15s ease' }}>
                      {/* Sprite Image & Name */}
                      <td style={{ padding: '12px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img
                            src={sprite.image}
                            alt={sprite.fullName}
                            style={{
                              width: '42px',
                              height: '42px',
                              objectFit: 'contain',
                              borderRadius: '10px',
                              background: darkMode ? '#171717' : '#F8FAFC',
                              border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                              padding: '2px'
                            }}
                            onError={(e) => { e.target.src = '/sprites/water_basic.png'; }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: textPrimary }}>{sprite.fullName}</div>
                            <span style={{ fontSize: '0.72rem', color: textMuted, fontFamily: 'monospace' }}>
                              {sprite.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Family */}
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '8px', background: darkMode ? '#232323' : '#F1F5F9', color: darkMode ? '#E5E7EB' : '#475569', fontSize: '0.78rem', fontWeight: 700 }}>
                          {sprite.familyName}
                        </span>
                      </td>

                      {/* Rarity */}
                      <td style={{ padding: '12px 20px' }}>
                        <span
                          className={`sprite-pill rarity-badge-sm sprite-rarity-${rarityObj.classKey || 'common'}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '22px',
                            padding: '0 10px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            lineHeight: 1,
                            letterSpacing: '0.04em',
                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.15)'
                          }}
                        >
                          {rarityObj.name || sprite.rarity}
                        </span>
                      </td>

                      {/* Variant */}
                      <td style={{ padding: '12px 20px', color: textMuted, fontWeight: 600 }}>
                        {sprite.variantDisplay || sprite.variant}
                      </td>

                      {/* Cost */}
                      <td style={{ padding: '12px 20px', color: textPrimary, fontWeight: 700 }}>
                        {sprite.summonCost}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '12px 20px' }}>
                        {sprite.unreleased ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: darkMode ? 'rgba(124, 58, 237, 0.2)' : '#F5F3FF', color: '#A78BFA', fontSize: '0.76rem', fontWeight: 800 }}>
                            <Clock size={13} />
                            <span>{sprite.release_date ? 'Programado' : 'No Lanzado'}</span>
                          </span>
                        ) : (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '8px', background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#ECFDF5', color: '#3ECF8E', fontSize: '0.76rem', fontWeight: 800 }}>
                            <CheckCircle2 size={13} />
                            <span>Activo</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => onEdit(sprite)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: '8px',
                              background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#EFF6FF',
                              border: darkMode ? '1px solid rgba(62, 207, 142, 0.3)' : '1px solid #DBEAFE',
                              color: darkMode ? '#3ECF8E' : '#3C50E0',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.76rem',
                              fontWeight: 700
                            }}
                            title="Editar Espíritu"
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(sprite)}
                            disabled={deletingId === sprite.id}
                            style={{
                              padding: '7px 8px',
                              borderRadius: '8px',
                              background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
                              border: darkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #FEE2E2',
                              color: '#EF4444',
                              cursor: 'pointer'
                            }}
                            title="Eliminar Espíritu"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: textMuted }}>
                    No se encontraron espíritus con los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          background: darkMode ? '#171717' : '#F8FAFC'
        }}>
          <span style={{ fontSize: '0.8rem', color: textMuted }}>
            Mostrando <strong>{Math.min((currentPage - 1) * pageSize + 1, filteredSprites.length)}</strong> a <strong>{Math.min(currentPage * pageSize, filteredSprites.length)}</strong> de <strong>{filteredSprites.length}</strong> espíritus
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                background: darkMode ? '#1C1C1C' : '#FFFFFF',
                color: currentPage === 1 ? (darkMode ? '#525252' : '#CBD5E1') : textPrimary,
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <ChevronLeft size={14} />
              <span>Anterior</span>
            </button>

            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: textPrimary, padding: '0 8px' }}>
              {currentPage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: darkMode ? '1px solid #2E2E2E' : '1px solid #E2E8F0',
                background: darkMode ? '#1C1C1C' : '#FFFFFF',
                color: currentPage === totalPages ? (darkMode ? '#525252' : '#CBD5E1') : textPrimary,
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.78rem',
                fontWeight: 700
              }}
            >
              <span>Siguiente</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
