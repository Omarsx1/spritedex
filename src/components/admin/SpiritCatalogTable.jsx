import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { RARITIES } from '../../data/spritesData';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function SpiritCatalogTable({ sprites = [], onEdit, onAddNew, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, unreleased
  const [deletingId, setDeletingId] = useState(null);

  const filteredSprites = useMemo(() => {
    return sprites.filter((s) => {
      const matchesSearch = (s.fullName || s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (s.familyName || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'active') return !s.unreleased;
      if (statusFilter === 'unreleased') return Boolean(s.unreleased);
      return true;
    });
  }, [sprites, searchTerm, statusFilter]);

  const handleDelete = async (spirit) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar a "${spirit.fullName}" de la base de datos?`)) {
      return;
    }

    try {
      setDeletingId(spirit.id);
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.from('sprites').delete().eq('id', spirit.id);
        if (error) throw error;
      }
      onRefresh();
    } catch (err) {
      alert('Error eliminando espíritu: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ color: '#f8fafc' }}>
      {/* Top action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: '260px', flex: 1 }}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre o familia..."
            style={{
              width: '100%',
              padding: '10px 14px 10px 36px',
              borderRadius: '10px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              color: '#fff',
              fontSize: '0.84rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#00F0E8' }} />
        </div>

        {/* Status Filter */}
        <div style={{
          display: 'flex',
          background: 'rgba(15, 23, 42, 0.8)',
          padding: '4px',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          {['all', 'active', 'unreleased'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: statusFilter === f ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: statusFilter === f ? '#00F0E8' : '#94a3b8',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'No Lanzados'}
            </button>
          ))}
        </div>

        {/* Add New Button */}
        <button
          type="button"
          onClick={onAddNew}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
            color: '#060714',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0, 240, 255, 0.4)'
          }}
        >
          <Plus size={16} />
          <span>Agregar Espíritu</span>
        </button>
      </div>

      {/* Table container */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '18px',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', background: 'rgba(2, 6, 23, 0.4)' }}>
                <th style={{ padding: '12px 16px' }}>ESPÍRITU</th>
                <th style={{ padding: '12px 16px' }}>FAMILIA</th>
                <th style={{ padding: '12px 16px' }}>RAREZA</th>
                <th style={{ padding: '12px 16px' }}>VARIANTE</th>
                <th style={{ padding: '12px 16px' }}>ESTADO</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {filteredSprites.length > 0 ? (
                filteredSprites.map((sprite) => {
                  const rarityObj = RARITIES[sprite.rarity] || RARITIES.Common;
                  return (
                    <tr key={sprite.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      {/* Image & Name */}
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={sprite.image}
                            alt={sprite.fullName}
                            style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: 'rgba(2,6,23,0.5)', padding: '2px' }}
                            onError={(e) => { e.target.src = '/sprites/water_basic.png'; }}
                          />
                          <div>
                            <div style={{ fontWeight: 800, color: '#f8fafc' }}>{sprite.fullName}</div>
                            <span style={{ fontSize: '0.7rem', color: '#64748b' }}>ID: {sprite.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Family */}
                      <td style={{ padding: '10px 16px', color: '#cbd5e1' }}>
                        {sprite.familyName}
                      </td>

                      {/* Rarity */}
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: `${rarityObj.color}25`,
                          color: rarityObj.color,
                          fontWeight: 800,
                          fontSize: '0.72rem'
                        }}>
                          {rarityObj.label}
                        </span>
                      </td>

                      {/* Variant */}
                      <td style={{ padding: '10px 16px', color: '#94a3b8' }}>
                        {sprite.variantDisplay || sprite.variant}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '10px 16px' }}>
                        {sprite.unreleased ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '0.72rem', fontWeight: 800 }}>
                            <Clock size={12} />
                            <span>{sprite.release_date ? 'Programado' : 'No Lanzado'}</span>
                          </div>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(0, 240, 232, 0.15)', color: '#00F0E8', fontSize: '0.72rem', fontWeight: 800 }}>
                            <CheckCircle2 size={12} />
                            <span>Activo</span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => onEdit(sprite)}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              background: 'rgba(0, 240, 255, 0.1)',
                              border: '1px solid rgba(0, 240, 255, 0.25)',
                              color: '#00F0E8',
                              cursor: 'pointer'
                            }}
                            title="Editar Espíritu"
                          >
                            <Edit2 size={14} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(sprite)}
                            disabled={deletingId === sprite.id}
                            style={{
                              padding: '6px',
                              borderRadius: '6px',
                              background: 'rgba(239, 68, 68, 0.1)',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              cursor: 'pointer'
                            }}
                            title="Eliminar Espíritu"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    No se encontraron espíritus con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
