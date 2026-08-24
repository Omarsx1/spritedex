import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Clock, 
  Image as ImageIcon, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { RARITIES, THEME_NAMES_ES } from '../../data/spritesData';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

const RARITY_KEYS = Object.keys(RARITIES);
const COMMON_FAMILIES = [
  { id: 'klombo', name: 'Klombo' },
  { id: 'crown', name: 'Victorioso' },
  { id: 'sonic', name: 'Sonic' },
  { id: 'shadow', name: 'Shadow' },
  { id: 'tails', name: 'Tails' },
  { id: 'jackrabbit', name: 'Jackrabbit' },
  { id: 'killswitch', name: 'Killswitch' },
  { id: 'arbustin', name: 'Arbustín' },
  { id: 'adventurer', name: 'Aventurero' },
  { id: 'jonesy', name: 'Jonesy' },
  { id: 'eightbit', name: '8-Bit' },
  { id: 'peely', name: 'Peely' },
  { id: 'llama', name: 'Llama' }
];

export function SpiritEditorModal({ spirit, existingFamilies = [], onSave, onClose }) {
  const isEditing = Boolean(spirit?.id);

  const [formData, setFormData] = useState({
    id: spirit?.id || '',
    name: spirit?.name || '',
    fullName: spirit?.fullName || '',
    familyId: spirit?.familyId || 'klombo',
    familyName: spirit?.familyName || 'Klombo',
    rarity: spirit?.rarity || 'Epic',
    variant: spirit?.variant || 'Base',
    variantDisplay: spirit?.variantDisplay || 'Básico',
    gen: spirit?.gen || 2,
    image: spirit?.image || '',
    ability: spirit?.ability || 'Concede bonificaciones pasivas de combate y velocidad.',
    specialPerk: spirit?.specialPerk || '',
    summonCost: spirit?.summonCost || '2,000 Polvo Estelar',
    dropChance: spirit?.dropChance || '1.50%',
    unreleased: spirit?.unreleased || false,
    releaseDate: spirit?.release_date ? new Date(spirit.release_date).toISOString().slice(0, 16) : ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // Auto-generate ID from family and variant
  const handleFamilyChange = (famId, famName) => {
    const varKey = formData.variant.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newId = `${famId}_${varKey}`;
    setFormData(prev => ({
      ...prev,
      familyId: famId,
      familyName: famName,
      id: isEditing ? prev.id : newId,
      fullName: prev.variant === 'Base' ? famName : `${famName} ${prev.variantDisplay}`
    }));
  };

  const handleVariantChange = (themeKey, displayEs) => {
    const varKey = themeKey.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newId = `${formData.familyId}_${varKey}`;
    setFormData(prev => ({
      ...prev,
      variant: themeKey,
      variantDisplay: displayEs,
      id: isEditing ? prev.id : newId,
      fullName: themeKey === 'Base' ? formData.familyName : `${formData.familyName} ${displayEs}`
    }));
  };

  // Upload image file to Supabase Storage
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.includes('image/')) {
      setErrorMsg('El archivo debe ser una imagen (.webp o .png).');
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMsg('');

      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split('.').pop() || 'webp';
        const fileName = `${formData.id || 'sprite'}_${Date.now()}.${fileExt}`;
        const filePath = `sprites/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('sprites-assets')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('sprites-assets')
          .getPublicUrl(filePath);

        setFormData(prev => ({ ...prev, image: publicUrl }));
      } else {
        // Local FileReader preview fallback
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, image: e.target.result }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      setErrorMsg('No se pudo subir la imagen a la nube. Intenta de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.image) {
      setErrorMsg('Por favor completa el nombre y sube la imagen del espíritu.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');

      const payload = {
        id: formData.id || `${formData.familyId}_${formData.variant.toLowerCase()}`,
        name: formData.name || formData.fullName,
        full_name: formData.fullName,
        family_id: formData.familyId,
        family_name: formData.familyName,
        rarity: formData.rarity,
        variant: formData.variant,
        variant_display: formData.variantDisplay,
        gen: Number(formData.gen) || 2,
        image: formData.image,
        ability: formData.ability,
        special_perk: formData.specialPerk,
        summon_cost: formData.summonCost,
        drop_chance: formData.dropChance,
        unreleased: Boolean(formData.unreleased),
        release_date: formData.releaseDate ? new Date(formData.releaseDate).toISOString() : null,
        updated_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from('sprites')
          .upsert(payload);

        if (error) throw error;
      }

      onSave(payload);
    } catch (err) {
      console.error('Error guardando espíritu:', err);
      setErrorMsg(err.message || 'Error al guardar en la base de datos.');
    } finally {
      setSaving(false);
    }
  };

  const rarityObj = RARITIES[formData.rarity] || RARITIES.Common;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(2, 6, 23, 0.88)',
      backdropFilter: 'blur(14px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '860px',
        width: '100%',
        background: 'rgba(15, 23, 42, 0.95)',
        border: '1px solid rgba(0, 240, 255, 0.35)',
        borderRadius: '22px',
        boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(0, 240, 255, 0.12)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(2, 6, 23, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(168, 85, 247, 0.2))',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#00F0E8'
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#f8fafc' }}>
                {isEditing ? 'Editar Espíritu' : 'Catalogar Nuevo Espíritu'}
              </h2>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                Publicación directa y programada a Spritedex
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body: Split in Form (Left) and Live Preview (Right) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
          padding: '24px',
          overflowY: 'auto'
        }}>
          {/* LEFT: Form Inputs */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {errorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                color: '#f87171',
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                IMAGEN DEL ESPÍRITU (.WEBP / .PNG)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed #00F0E8' : '2px dashed rgba(0, 240, 255, 0.3)',
                  borderRadius: '14px',
                  background: isDragOver ? 'rgba(0, 240, 255, 0.08)' : 'rgba(2, 6, 23, 0.6)',
                  padding: '20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  accept="image/webp,image/png,image/jpeg"
                  style={{ display: 'none' }}
                />
                <Upload size={24} style={{ color: '#00F0E8', marginBottom: '8px' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
                  {uploadingImage ? 'Subiendo imagen a la nube...' : 'Arrastra o haz clic para subir imagen'}
                </p>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Soporta .webp y .png transparentes
                </span>
              </div>
            </div>

            {/* Names */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  NOMBRE EN ESPAÑOL
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ej. Klombo Dorado"
                  required
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  FAMILIA DEL ESPÍRITU
                </label>
                <select
                  value={formData.familyId}
                  onChange={(e) => {
                    const fam = COMMON_FAMILIES.find(f => f.id === e.target.value) || { id: e.target.value, name: e.target.value };
                    handleFamilyChange(fam.id, fam.name);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {COMMON_FAMILIES.map(fam => (
                    <option key={fam.id} value={fam.id} style={{ background: '#0f172a' }}>
                      {fam.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rarity & Variant */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  RAREZA
                </label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {RARITY_KEYS.map(r => (
                    <option key={r} value={r} style={{ background: '#0f172a' }}>
                      {RARITIES[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  VARIANTE DE TEMPORADA
                </label>
                <select
                  value={formData.variant}
                  onChange={(e) => {
                    const theme = e.target.value;
                    const displayEs = THEME_NAMES_ES[theme] || theme;
                    handleVariantChange(theme, displayEs);
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                >
                  {Object.entries(THEME_NAMES_ES).map(([themeKey, nameEs]) => (
                    <option key={themeKey} value={themeKey} style={{ background: '#0f172a' }}>
                      {nameEs} ({themeKey})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost & Drop Chance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  COSTO POLVO ESTELAR
                </label>
                <input
                  type="text"
                  value={formData.summonCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, summonCost: e.target.value }))}
                  placeholder="2,000 Polvo Estelar"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#94a3b8', marginBottom: '6px' }}>
                  PROBABILIDAD (%)
                </label>
                <input
                  type="text"
                  value={formData.dropChance}
                  onChange={(e) => setFormData(prev => ({ ...prev, dropChance: e.target.value }))}
                  placeholder="1.50%"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'rgba(2, 6, 23, 0.8)',
                    border: '1px solid rgba(0, 240, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.84rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Scheduler & Unreleased */}
            <div style={{
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(2, 6, 23, 0.7)',
              border: '1px solid rgba(168, 85, 247, 0.3)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '10px' }}>
                <input
                  type="checkbox"
                  checked={formData.unreleased}
                  onChange={(e) => setFormData(prev => ({ ...prev, unreleased: e.target.checked }))}
                  style={{ width: '16px', height: '16px', accentColor: '#a855f7' }}
                />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                  Marcar como "Espíritu No Lanzado" (Próximamente)
                </span>
              </label>

              {formData.unreleased && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#c084fc', marginBottom: '4px' }}>
                    FECHA & HORA DE ESTRENO AUTOMÁTICO
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      color: '#fff',
                      fontSize: '0.82rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', marginTop: '4px' }}>
                    Al llegar la fecha, el espíritu pasará automáticamente a estar activo en toda la Pokédex.
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  border: 'none',
                  fontSize: '0.84rem',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #00F0E8, #0284c7)',
                  color: '#060714',
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 900,
                  cursor: saving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 18px rgba(0, 240, 255, 0.4)'
                }}
              >
                <Check size={16} />
                <span>{saving ? 'Guardando en la nube...' : 'Publicar Espíritu'}</span>
              </button>
            </div>
          </form>

          {/* RIGHT: Live Interactive Card Preview */}
          <div style={{
            background: 'rgba(2, 6, 23, 0.6)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#00F0E8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
              VISTA PREVIA EN VIVO
            </span>

            <div style={{
              width: '210px',
              borderRadius: '16px',
              padding: '18px 14px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: `1px solid ${rarityObj.color || '#00F0E8'}`,
              boxShadow: `0 10px 25px rgba(0,0,0,0.6), 0 0 15px ${rarityObj.glow || 'rgba(0,240,255,0.2)'}`,
              textAlign: 'center',
              position: 'relative'
            }}>
              {/* Badge */}
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '2px 8px',
                borderRadius: '6px',
                background: rarityObj.color || '#00F0E8',
                color: '#060714',
                fontSize: '0.65rem',
                fontWeight: 900
              }}>
                {rarityObj.label}
              </div>

              {/* Image */}
              <div style={{
                width: '110px',
                height: '110px',
                margin: '12px auto 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                {formData.image ? (
                  <img
                    src={formData.image}
                    alt={formData.fullName}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <div style={{ color: '#475569', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <ImageIcon size={38} />
                    <span style={{ fontSize: '0.65rem', marginTop: '4px' }}>Sin imagen</span>
                  </div>
                )}
              </div>

              <h4 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 900, color: '#fff' }}>
                {formData.fullName || 'Nombre del Espíritu'}
              </h4>

              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginBottom: '8px' }}>
                {formData.summonCost}
              </div>

              {formData.unreleased ? (
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: '#c084fc',
                  fontSize: '0.68rem',
                  fontWeight: 900
                }}>
                  NO LANZADO
                </div>
              ) : (
                <div style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  background: 'rgba(0, 240, 232, 0.15)',
                  color: '#00F0E8',
                  fontSize: '0.68rem',
                  fontWeight: 900
                }}>
                  ACTIVO
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
