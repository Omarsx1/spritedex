import React, { useState, useRef, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Clock, 
  Image as ImageIcon, 
  AlertCircle,
  PlusCircle,
  Layers,
  ChevronDown
} from 'lucide-react';
import { RARITIES, THEME_NAMES_ES, FAMILY_NAMES_MAP } from '../../data/spritesData';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function SpiritEditorModal({ spirit, existingSprites = [], onSave, onClose }) {
  const isEditing = Boolean(spirit?.id);

  // Extract all distinct families from map + existing spirits
  const allFamilies = useMemo(() => {
    const map = new Map();
    // Default system families
    Object.entries(FAMILY_NAMES_MAP).forEach(([key, name]) => {
      map.set(key.toLowerCase(), { id: key.toLowerCase(), name });
    });
    // Dynamically added families from spirits dataset
    existingSprites.forEach(s => {
      if (s.familyId && s.familyName) {
        map.set(s.familyId.toLowerCase(), { id: s.familyId.toLowerCase(), name: s.familyName });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [existingSprites]);

  // Initial family resolution
  const initialFamilyId = (spirit?.familyId || spirit?.id?.split('_')[0] || 'klombo').toLowerCase();
  const matchedFamily = allFamilies.find(f => f.id === initialFamilyId);
  const initialFamilyName = spirit?.familyName || matchedFamily?.name || (initialFamilyId.charAt(0).toUpperCase() + initialFamilyId.slice(1));

  const [formData, setFormData] = useState({
    id: spirit?.id || '',
    name: spirit?.name || '',
    fullName: spirit?.fullName || spirit?.name || '',
    familyId: initialFamilyId,
    familyName: initialFamilyName,
    customFamily: !matchedFamily ? initialFamilyName : '',
    rarity: spirit?.rarity || 'Epic',
    variant: spirit?.variant || 'Base',
    variantDisplay: spirit?.variantDisplay || THEME_NAMES_ES[spirit?.variant] || 'Básico',
    gen: spirit?.gen || 2,
    image: spirit?.image || (spirit?.id ? `/sprites/${spirit.id}.png` : ''),
    ability: spirit?.ability || 'Concede bonificaciones pasivas de combate y velocidad.',
    specialPerk: spirit?.specialPerk || '',
    summonCost: spirit?.summonCost || '2,000 Polvo Estelar',
    dropChance: spirit?.dropChance || '1.50%',
    unreleased: spirit?.unreleased || false,
    releaseDate: spirit?.release_date ? new Date(spirit.release_date).toISOString().slice(0, 16) : ''
  });

  const [isCustomFamily, setIsCustomFamily] = useState(!matchedFamily && Boolean(spirit?.familyName));
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  // When family is changed
  const handleSelectFamily = (famId) => {
    if (famId === '__new__') {
      setIsCustomFamily(true);
      return;
    }
    setIsCustomFamily(false);
    const fam = allFamilies.find(f => f.id === famId);
    if (!fam) return;

    const varKey = formData.variant.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newId = `${fam.id}_${varKey}`;
    setFormData(prev => ({
      ...prev,
      familyId: fam.id,
      familyName: fam.name,
      id: isEditing ? prev.id : newId,
      fullName: prev.variant === 'Base' ? fam.name : `${fam.name} ${prev.variantDisplay}`
    }));
  };

  const handleCustomFamilyInput = (customName) => {
    const safeKey = customName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'custom';
    const varKey = formData.variant.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newId = `${safeKey}_${varKey}`;
    setFormData(prev => ({
      ...prev,
      familyId: safeKey,
      familyName: customName,
      customFamily: customName,
      id: isEditing ? prev.id : newId,
      fullName: prev.variant === 'Base' ? customName : `${customName} ${prev.variantDisplay}`
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

  // Upload image to Supabase Storage
  const handleFileUpload = async (file) => {
    if (!file) return;

    if (!file.type.includes('image/')) {
      setErrorMsg('El archivo debe ser una imagen válida (.webp o .png).');
      return;
    }

    try {
      setUploadingImage(true);
      setErrorMsg('');

      if (isSupabaseConfigured && supabase) {
        const fileExt = file.name.split('.').pop() || 'webp';
        const cleanName = (formData.id || 'sprite').replace(/[^a-z0-9_-]/gi, '');
        const fileName = `${cleanName}_${Date.now()}.${fileExt}`;
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
        const reader = new FileReader();
        reader.onload = (e) => {
          setFormData(prev => ({ ...prev, image: e.target.result }));
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      setErrorMsg('Error al subir imagen. Verifique la conexión a Supabase Storage.');
    } finally {
      setUploadingImage(false);
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

      const cleanId = formData.id || `${formData.familyId}_${formData.variant.toLowerCase()}`;
      const payload = {
        id: cleanId,
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
        const { error } = await supabase.from('sprites').upsert(payload);
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
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        maxWidth: '960px',
        width: '100%',
        background: '#121212',
        border: '1px solid #2E2E2E',
        borderRadius: '24px',
        boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 1px 1px rgba(62, 207, 142, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh'
      }}>
        {/* Silicon Valley Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #2E2E2E',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#171717'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3ECF8E', background: 'rgba(62, 207, 142, 0.15)', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                Catalog Studio
              </span>
              <span style={{ fontSize: '0.75rem', color: '#737373' }}>•</span>
              <span style={{ fontSize: '0.75rem', color: '#737373' }}>{isEditing ? `ID: ${formData.id}` : 'Nuevo Registro'}</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#EDEDED', letterSpacing: '-0.02em' }}>
              {isEditing ? `Editar: ${formData.fullName}` : 'Crear & Publicar Espíritu'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid #2E2E2E',
              color: '#A1A1A1',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: '28px',
          padding: '28px',
          overflowY: 'auto'
        }}>
          {/* LEFT: Enterprise Form Fields */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EE5D50',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Drag & Drop Upload Zone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#A1A1A1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Asset Digital (.webp / .png)
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0]); }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: isDragOver ? '2px dashed #3ECF8E' : '2px dashed #2E2E2E',
                  borderRadius: '16px',
                  background: isDragOver ? 'rgba(62, 207, 142, 0.08)' : '#171717',
                  padding: '24px 16px',
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
                <Upload size={26} style={{ color: '#3ECF8E', marginBottom: '8px' }} />
                <p style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 700, color: '#EDEDED' }}>
                  {uploadingImage ? 'Subiendo imagen a Supabase Storage...' : 'Arrastra o haz clic para subir imagen'}
                </p>
                <span style={{ fontSize: '0.74rem', color: '#737373' }}>
                  Soporta formatos .webp y .png transparentes
                </span>
              </div>
            </div>

            {/* Names & Family Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#A1A1A1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Nombre en Español
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ej. Storm Scout Dorado"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#1C1C1C',
                    border: '1px solid #2E2E2E',
                    color: '#EDEDED',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#A1A1A1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Familia del Espíritu
                </label>
                {!isCustomFamily ? (
                  <select
                    value={formData.familyId}
                    onChange={(e) => handleSelectFamily(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      background: '#1C1C1C',
                      border: '1px solid #2E2E2E',
                      color: '#EDEDED',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  >
                    {allFamilies.map(fam => (
                      <option key={fam.id} value={fam.id} style={{ background: '#1C1C1C', color: '#fff' }}>
                        {fam.name} ({fam.id})
                      </option>
                    ))}
                    <option value="__new__" style={{ background: '#3ECF8E', color: '#121212', fontWeight: 800 }}>
                      + Escribir Nueva Familia...
                    </option>
                  </select>
                ) : (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="text"
                      value={formData.customFamily}
                      onChange={(e) => handleCustomFamilyInput(e.target.value)}
                      placeholder="Nombre de nueva familia..."
                      autoFocus
                      style={{
                        flex: 1,
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: '#1C1C1C',
                        border: '1px solid #3ECF8E',
                        color: '#EDEDED',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomFamily(false)}
                      style={{
                        padding: '0 12px',
                        borderRadius: '12px',
                        background: '#262626',
                        border: 'none',
                        color: '#A1A1A1',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      Lista
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Rarity & Variant Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#A1A1A1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rareza
                </label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#111C44',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {Object.entries(RARITIES).map(([rKey, rObj]) => (
                    <option key={rKey} value={rKey} style={{ background: '#111C44', color: '#fff' }}>
                      {rObj.label || rObj.name || rKey}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#8F9BBA', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Variante de Temporada
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
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#111C44',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {Object.entries(THEME_NAMES_ES).map(([themeKey, nameEs]) => (
                    <option key={themeKey} value={themeKey} style={{ background: '#111C44', color: '#fff' }}>
                      {nameEs} ({themeKey})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost & Drop Chance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#8F9BBA', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Costo Polvo Estelar
                </label>
                <input
                  type="text"
                  value={formData.summonCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, summonCost: e.target.value }))}
                  placeholder="2,000 Polvo Estelar"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#111C44',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 700, color: '#8F9BBA', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Probabilidad (%)
                </label>
                <input
                  type="text"
                  value={formData.dropChance}
                  onChange={(e) => setFormData(prev => ({ ...prev, dropChance: e.target.value }))}
                  placeholder="1.50%"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    background: '#111C44',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Scheduled Release Card */}
            <div style={{
              padding: '18px',
              borderRadius: '16px',
              background: '#111C44',
              border: '1px solid rgba(67, 24, 255, 0.3)'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: formData.unreleased ? '12px' : '0' }}>
                <input
                  type="checkbox"
                  checked={formData.unreleased}
                  onChange={(e) => setFormData(prev => ({ ...prev, unreleased: e.target.checked }))}
                  style={{ width: '18px', height: '18px', accentColor: '#4318FF' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Marcar como "Espíritu No Lanzado" (Programado)
                </span>
              </label>

              {formData.unreleased && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#A3AED0', marginBottom: '6px' }}>
                    FECHA & HORA DE ESTRENO AUTOMÁTICO
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.releaseDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, releaseDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#0B1437',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.84rem',
                      boxSizing: 'border-box'
                    }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#707EAE', display: 'block', marginTop: '6px' }}>
                    Al llegar este momento exacto, el espíritu se desbloqueará y activará automáticamente en toda la web.
                  </span>
                </div>
              )}
            </div>

            {/* Form Footer */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#171717',
                  border: '1px solid #2E2E2E',
                  color: '#A1A1A1',
                  fontSize: '0.88rem',
                  fontWeight: 700,
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
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#3ECF8E',
                  color: '#121212',
                  border: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: saving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 10px 25px rgba(62, 207, 142, 0.35)'
                }}
              >
                <Check size={18} />
                <span>{saving ? 'Guardando...' : 'Publicar Espíritu'}</span>
              </button>
            </div>
          </form>

          {/* RIGHT: Live Interactive Preview */}
          <div style={{
            background: '#171717',
            borderRadius: '20px',
            border: '1px solid #2E2E2E',
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#3ECF8E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '18px' }}>
              Vista Previa en Vivo
            </span>

            <div style={{
              width: '220px',
              borderRadius: '18px',
              padding: '20px 16px',
              background: '#121212',
              border: `1px solid ${rarityObj.color || '#3ECF8E'}`,
              boxShadow: `0 15px 35px rgba(0,0,0,0.7), 0 0 20px ${rarityObj.color || 'rgba(62,207,142,0.3)'}33`,
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
                background: rarityObj.color || '#3ECF8E',
                color: '#060714',
                fontSize: '0.65rem',
                fontWeight: 900
              }}>
                {rarityObj.label || rarityObj.name}
              </div>

              {/* Image */}
              <div style={{
                width: '120px',
                height: '120px',
                margin: '12px auto 8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}>
                <img
                  src={formData.image || (formData.id ? `/sprites/${formData.id}.png` : '/sprites/water_basic.png')}
                  alt={formData.fullName}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    const src = e.target.src;
                    if (src.endsWith('.webp')) {
                      e.target.src = src.replace('.webp', '.png');
                    } else if (!e.target.dataset.triedBase) {
                      e.target.dataset.triedBase = 'true';
                      const fam = (formData.familyId || formData.id?.split('_')[0] || 'water').toLowerCase();
                      e.target.src = `/sprites/${fam}_basic.png`;
                    } else {
                      e.target.src = '/sprites/water_basic.png';
                    }
                  }}
                />
              </div>

              <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 800, color: '#EDEDED' }}>
                {formData.fullName || 'Nombre del Espíritu'}
              </h4>

              <div style={{ fontSize: '0.74rem', color: '#8B949E', marginBottom: '10px' }}>
                {formData.summonCost}
              </div>

              {formData.unreleased ? (
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: '#C084FC',
                  fontSize: '0.7rem',
                  fontWeight: 900
                }}>
                  NO LANZADO
                </div>
              ) : (
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(62, 207, 142, 0.15)',
                  color: '#3ECF8E',
                  fontSize: '0.7rem',
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
