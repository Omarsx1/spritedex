import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  FolderPlus, 
  Edit3, 
  Check, 
  Layers, 
  Sparkles, 
  AlertCircle,
  RefreshCw,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { FAMILY_NAMES_MAP, THEME_NAMES_ES } from '../../data/spritesData';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function FamilyManagerModal({ 
  sprites = [], 
  onRefresh, 
  onClose, 
  darkMode = false 
}) {
  const [search, setSearch] = useState('');
  const [editingFamilyId, setEditingFamilyId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFamilyId, setNewFamilyId] = useState('');
  const [newFamilyName, setNewFamilyName] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Group all sprites and known families
  const familiesList = useMemo(() => {
    const map = new Map();

    // 1. Initialize with system defaults
    Object.entries(FAMILY_NAMES_MAP).forEach(([id, name]) => {
      const cleanId = id.toLowerCase();
      map.set(cleanId, {
        id: cleanId,
        name,
        sprites: [],
        gens: new Set()
      });
    });

    // 2. Associate existing sprites
    sprites.forEach(sprite => {
      const famId = (sprite.familyId || sprite.id?.split('_')[0] || 'custom').toLowerCase();
      const famName = sprite.familyName || map.get(famId)?.name || (famId.charAt(0).toUpperCase() + famId.slice(1));

      if (!map.has(famId)) {
        map.set(famId, {
          id: famId,
          name: famName,
          sprites: [],
          gens: new Set()
        });
      }

      const entry = map.get(famId);
      // Update name if sprite has an explicit non-default name
      if (sprite.familyName && sprite.familyName !== famId) {
        entry.name = sprite.familyName;
      }
      entry.sprites.push(sprite);
      if (sprite.gen) entry.gens.add(sprite.gen);
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [sprites]);

  // Filtered families based on search
  const filteredFamilies = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return familiesList;
    return familiesList.filter(f => 
      f.name.toLowerCase().includes(q) || 
      f.id.toLowerCase().includes(q)
    );
  }, [familiesList, search]);

  // Palette theme
  const c = {
    bgOverlay: darkMode ? 'rgba(0, 0, 0, 0.78)' : 'rgba(15, 23, 42, 0.6)',
    bgModal: darkMode ? '#171717' : '#FFFFFF',
    borderModal: darkMode ? '#2E2E2E' : '#E2E8F0',
    headerBg: darkMode ? '#141414' : '#F8FAFC',
    textPrimary: darkMode ? '#EDEDED' : '#0F172A',
    textSecondary: darkMode ? '#A1A1A1' : '#475569',
    textMuted: darkMode ? '#737373' : '#94A3B8',
    cardBg: darkMode ? '#1C1C1C' : '#F8FAFC',
    cardBorder: darkMode ? '#262626' : '#E2E8F0',
    bgInput: darkMode ? '#141414' : '#FFFFFF',
    borderInput: darkMode ? '#2E2E2E' : '#CBD5E1',
    badgeGenBg: darkMode ? 'rgba(56, 189, 248, 0.15)' : '#E0F2FE',
    badgeGenText: darkMode ? '#38BDF8' : '#0369A1'
  };

  const handleStartEdit = (fam) => {
    setEditingFamilyId(fam.id);
    setEditName(fam.name);
    setStatusMsg(null);
  };

  const handleSaveRename = async (famId) => {
    if (!editName.trim()) return;

    try {
      setSaving(true);
      setStatusMsg({ type: 'info', text: `Actualizando variantes de la familia "${editName}"...` });

      const targetFamily = familiesList.find(f => f.id === famId);
      const associatedSprites = targetFamily?.sprites || [];

      if (isSupabaseConfigured && supabase) {
        // Batch update in Supabase
        for (const sprite of associatedSprites) {
          const varKey = sprite.variant || 'Base';
          const varDisplay = sprite.variantDisplay || THEME_NAMES_ES[varKey] || (varKey === 'Basic' || varKey === 'Base' ? 'Básico' : varKey);
          const newFullName = (varKey === 'Basic' || varKey === 'Base') ? editName.trim() : `${editName.trim()} ${varDisplay}`;

          const payload = {
            id: sprite.id,
            name: newFullName,
            full_name: newFullName,
            family_id: famId,
            family_name: editName.trim(),
            rarity: sprite.rarity,
            variant: sprite.variant,
            variant_display: varDisplay,
            gen: sprite.gen || 2,
            image: sprite.image,
            ability: sprite.ability,
            special_perk: sprite.specialPerk || sprite.special_perk,
            summon_cost: sprite.summonCost || sprite.summon_cost,
            drop_chance: sprite.dropChance || sprite.drop_chance,
            unreleased: Boolean(sprite.unreleased),
            release_date: sprite.release_date,
            updated_at: new Date().toISOString()
          };

          await supabase.from('sprites').upsert(payload);
        }
      }

      setStatusMsg({ type: 'success', text: `¡Familia renombrada a "${editName.trim()}" exitosamente!` });
      setEditingFamilyId(null);
      await onRefresh();
    } catch (err) {
      console.error('Error actualizando familia:', err);
      setStatusMsg({ type: 'error', text: 'Error al actualizar: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewFamily = async (e) => {
    e.preventDefault();
    if (!newFamilyId.trim() || !newFamilyName.trim()) return;

    const safeId = newFamilyId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const safeName = newFamilyName.trim();

    try {
      setSaving(true);
      setStatusMsg({ type: 'info', text: `Registrando nueva familia "${safeName}"...` });

      // Create base spirit template in Supabase so the family becomes permanent
      if (isSupabaseConfigured && supabase) {
        const baseId = `${safeId}_basic`;
        const payload = {
          id: baseId,
          name: safeName,
          full_name: safeName,
          family_id: safeId,
          family_name: safeName,
          rarity: 'Epic',
          variant: 'Base',
          variant_display: 'Básico',
          gen: 2,
          image: `/sprites/${baseId}.webp`,
          ability: 'Concede bonificaciones pasivas de combate y velocidad.',
          unreleased: true,
          updated_at: new Date().toISOString()
        };

        await supabase.from('sprites').upsert(payload);
      }

      setStatusMsg({ type: 'success', text: `¡Familia "${safeName}" creada con éxito!` });
      setIsCreating(false);
      setNewFamilyId('');
      setNewFamilyName('');
      await onRefresh();
    } catch (err) {
      console.error('Error creando familia:', err);
      setStatusMsg({ type: 'error', text: 'Error al crear familia: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: c.bgOverlay,
      backdropFilter: 'blur(12px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: c.bgModal,
        borderRadius: '20px',
        border: `1px solid ${c.borderModal}`,
        width: '100%',
        maxWidth: '820px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: darkMode ? '0 25px 60px rgba(0,0,0,0.7)' : '0 25px 50px rgba(15, 23, 42, 0.2)',
        overflow: 'hidden',
        animation: 'fadeInModal 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${c.borderModal}`,
          background: c.headerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: darkMode ? '#262626' : '#EEF2FF',
              color: darkMode ? '#3ECF8E' : '#3C50E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Layers size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.12rem', fontWeight: 800, color: c.textPrimary, margin: 0 }}>
                Gestor Central de Familias
              </h2>
              <p style={{ fontSize: '0.78rem', color: c.textSecondary, margin: '2px 0 0' }}>
                Administra los nombres oficiales de cada linaje y sus variantes asociadas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: c.textSecondary,
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div style={{
            padding: '10px 24px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: statusMsg.type === 'success' ? (darkMode ? '#143825' : '#DCFCE7') : (darkMode ? '#382218' : '#FEF2F2'),
            color: statusMsg.type === 'success' ? (darkMode ? '#4ADE80' : '#15803D') : (darkMode ? '#F87171' : '#B91C1C'),
            borderBottom: `1px solid ${c.borderModal}`
          }}>
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Toolbar: Search + Create Button */}
        <div style={{
          padding: '16px 24px',
          borderBottom: `1px solid ${c.borderModal}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '380px' }}>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar familia por nombre o ID..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '10px',
                background: c.bgInput,
                border: `1px solid ${c.borderInput}`,
                color: c.textPrimary,
                fontSize: '0.84rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: c.textMuted }} />
          </div>

          <button
            type="button"
            onClick={() => setIsCreating(!isCreating)}
            style={{
              padding: '9px 16px',
              borderRadius: '10px',
              background: isCreating ? (darkMode ? '#262626' : '#E2E8F0') : (darkMode ? '#3ECF8E' : '#3C50E0'),
              color: isCreating ? c.textPrimary : (darkMode ? '#121212' : '#FFFFFF'),
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FolderPlus size={15} />
            <span>{isCreating ? 'Cancelar' : '+ Nueva Familia'}</span>
          </button>
        </div>

        {/* Create New Family Form (Collapsible) */}
        {isCreating && (
          <form 
            onSubmit={handleCreateNewFamily}
            style={{
              padding: '16px 24px',
              background: darkMode ? '#1F1F1F' : '#F1F5F9',
              borderBottom: `1px solid ${c.borderModal}`,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ flex: 1, minWidth: '160px' }}>
              <input
                type="text"
                value={newFamilyId}
                onChange={(e) => setNewFamilyId(e.target.value)}
                placeholder="ID único (ej: dragon, shadow)..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: c.bgInput,
                  border: `1px solid ${c.borderInput}`,
                  color: c.textPrimary,
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <input
                type="text"
                value={newFamilyName}
                onChange={(e) => setNewFamilyName(e.target.value)}
                placeholder="Nombre en español (ej: Dragón Legendario)..."
                required
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  background: c.bgInput,
                  border: `1px solid ${c.borderInput}`,
                  color: c.textPrimary,
                  fontSize: '0.82rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Guardando...' : 'Crear y Guardar'}
            </button>
          </form>
        )}

        {/* Families List View */}
        <div style={{
          padding: '16px 24px',
          overflowY: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {filteredFamilies.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: c.textSecondary, fontSize: '0.86rem' }}>
              No se encontraron familias que coincidan con la búsqueda.
            </div>
          ) : (
            filteredFamilies.map(fam => {
              const isEditingThis = editingFamilyId === fam.id;
              const previewSprite = fam.sprites.find(s => s.variant === 'Base' || s.variant === 'Basic') || fam.sprites[0];

              return (
                <div
                  key={fam.id}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: c.cardBg,
                    border: `1px solid ${c.cardBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* Left: Avatar & Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: darkMode ? '#262626' : '#FFFFFF',
                      border: `1px solid ${c.borderModal}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0
                    }}>
                      {previewSprite?.image ? (
                        <img 
                          src={previewSprite.image} 
                          alt={fam.name} 
                          style={{ width: '36px', height: '36px', objectFit: 'contain' }}
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <Sparkles size={18} style={{ color: darkMode ? '#3ECF8E' : '#3C50E0' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      {isEditingThis ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            autoFocus
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: c.bgInput,
                              border: '1px solid #3ECF8E',
                              color: c.textPrimary,
                              fontSize: '0.88rem',
                              fontWeight: 700,
                              outline: 'none'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(fam.id)}
                            disabled={saving}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#10B981',
                              color: '#FFFFFF',
                              border: 'none',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={14} />
                            <span>{saving ? '...' : 'Guardar'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFamilyId(null)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: '6px',
                              background: 'transparent',
                              border: `1px solid ${c.borderInput}`,
                              color: c.textSecondary,
                              fontSize: '0.78rem',
                              cursor: 'pointer'
                            }}
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.94rem', fontWeight: 800, color: c.textPrimary }}>
                            {fam.name}
                          </span>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '5px',
                            background: darkMode ? '#262626' : '#E2E8F0',
                            color: c.textMuted,
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'monospace'
                          }}>
                            {fam.id}
                          </span>
                        </div>
                      )}

                      {/* Variants & Gen Tags */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: c.badgeGenBg,
                          color: c.badgeGenText,
                          fontSize: '0.68rem',
                          fontWeight: 700
                        }}>
                          {fam.gens.has(2) && fam.gens.has(1) ? 'Gen 1 & 2' : (fam.gens.has(2) ? 'Temporada 2' : 'Gen 1')}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: c.textSecondary }}>
                          • {fam.sprites.length} {fam.sprites.length === 1 ? 'espíritu' : 'variantes'}:
                        </span>
                        <span style={{ fontSize: '0.72rem', color: c.textMuted }}>
                          {fam.sprites.slice(0, 4).map(s => s.variantDisplay || s.variant).join(', ')}
                          {fam.sprites.length > 4 ? ` +${fam.sprites.length - 4}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  {!isEditingThis && (
                    <button
                      type="button"
                      onClick={() => handleStartEdit(fam)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: darkMode ? '#262626' : '#FFFFFF',
                        border: `1px solid ${c.borderInput}`,
                        color: c.textPrimary,
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Renombrar</span>
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px',
          borderTop: `1px solid ${c.borderModal}`,
          background: c.headerBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: '0.76rem', color: c.textMuted }}>
            Total: <strong>{familiesList.length}</strong> familias registradas
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              background: darkMode ? '#262626' : '#E2E8F0',
              color: c.textPrimary,
              border: 'none',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
