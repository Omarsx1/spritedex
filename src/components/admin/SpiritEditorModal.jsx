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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Edit3
} from 'lucide-react';
import { RARITIES, THEME_NAMES_ES, FAMILY_NAMES_MAP } from '../../data/spritesData';
import { supabase, isSupabaseConfigured } from '../../utils/supabase';

export function SpiritEditorModal({ spirit, existingSprites = [], onSave, onClose, darkMode = false }) {
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

  // ═══ MATERIAL 3 DATE PICKER DROPDOWN STATE ═══
  const [showDatePicker, setShowDatePicker] = useState(false);
  const initialDateObj = useMemo(() => {
    return formData.releaseDate ? new Date(formData.releaseDate) : new Date();
  }, [formData.releaseDate]);

  const [pickerSelectedDate, setPickerSelectedDate] = useState(initialDateObj);
  const [pickerViewYear, setPickerViewYear] = useState(initialDateObj.getFullYear());
  const [pickerViewMonth, setPickerViewMonth] = useState(initialDateObj.getMonth());
  const [pickerHour, setPickerHour] = useState(initialDateObj.getHours());
  const [pickerMinute, setPickerMinute] = useState(initialDateObj.getMinutes());

  // Palette theme definition (Enterprise High Contrast WCAG 2.2 Compliant)
  const c = {
    bgOverlay: darkMode ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.55)',
    bgModal: darkMode ? '#171717' : '#FFFFFF',
    borderModal: darkMode ? '#2E2E2E' : '#E2E8F0',
    headerBg: darkMode ? '#141414' : '#F8FAFC',
    headerBorder: darkMode ? '#2E2E2E' : '#E2E8F0',
    textPrimary: darkMode ? '#EDEDED' : '#0F172A',
    textSecondary: darkMode ? '#A1A1A1' : '#475569',
    textMuted: darkMode ? '#737373' : '#64748B',
    bgInput: darkMode ? '#1F1F1F' : '#F8FAFC',
    borderInput: darkMode ? '#2E2E2E' : '#CBD5E1',
    bgScheduled: darkMode ? '#1F1F1F' : '#F8FAFC',
    borderScheduled: darkMode ? '#2E2E2E' : '#E2E8F0',
    bgPreview: darkMode ? '#141414' : '#F8FAFC',
    borderPreview: darkMode ? '#2E2E2E' : '#E2E8F0',
    bgSpriteCard: darkMode ? '#171717' : '#FFFFFF',
    btnCancelBg: darkMode ? '#262626' : '#F1F5F9',
    btnCancelBorder: darkMode ? '#2E2E2E' : '#CBD5E1',
    btnCancelText: darkMode ? '#EDEDED' : '#475569',
    btnPrimaryBg: darkMode ? '#3ECF8E' : '#2563EB',
    btnPrimaryText: darkMode ? '#121212' : '#FFFFFF',
    dropzoneBg: darkMode ? '#1A1A1A' : '#F8FAFC',
    dropzoneBorder: darkMode ? '#333333' : '#CBD5E1',
    badgeStudioBg: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#EFF6FF',
    badgeStudioText: darkMode ? '#3ECF8E' : '#2563EB',

    // Material 3 Date Picker Colors
    m3Bg: darkMode ? '#211F26' : '#ECE6F0',
    m3CardBg: darkMode ? '#2B2930' : '#F3EDF7',
    m3Primary: darkMode ? '#D0BCFF' : '#6750A4',
    m3PrimaryContainer: darkMode ? '#4F378B' : '#EADDFF',
    m3OnPrimary: darkMode ? '#381E72' : '#FFFFFF',
    m3OnSurface: darkMode ? '#E6E1E5' : '#1D1B20',
    m3OnSurfaceVariant: darkMode ? '#CAC4D0' : '#49454F',
    m3Outline: darkMode ? '#938F99' : '#79747E',
    m3SurfaceContainer: darkMode ? '#1D1B20' : '#FFFFFF'
  };

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

  // ═══ CALENDAR MATH FOR MATERIAL 3 DATE PICKER ═══
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthNamesShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const dayNamesShort = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Days in selected view month
  const daysInMonth = new Date(pickerViewYear, pickerViewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(pickerViewYear, pickerViewMonth, 1).getDay(); // 0 = Sun

  const handlePrevMonth = () => {
    if (pickerViewMonth === 0) {
      setPickerViewMonth(11);
      setPickerViewYear(y => y - 1);
    } else {
      setPickerViewMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (pickerViewMonth === 11) {
      setPickerViewMonth(0);
      setPickerViewYear(y => y + 1);
    } else {
      setPickerViewMonth(m => m + 1);
    }
  };

  const handleSelectDay = (day) => {
    const newDate = new Date(pickerViewYear, pickerViewMonth, day, pickerHour, pickerMinute);
    setPickerSelectedDate(newDate);
  };

  const handleConfirmDatePicker = () => {
    const finalDate = new Date(pickerSelectedDate);
    finalDate.setHours(pickerHour);
    finalDate.setMinutes(pickerMinute);
    
    // Format YYYY-MM-DDTHH:mm
    const tzOffset = finalDate.getTimezoneOffset() * 60000;
    const localIso = new Date(finalDate.getTime() - tzOffset).toISOString().slice(0, 16);
    
    setFormData(prev => ({ ...prev, releaseDate: localIso }));
    setShowDatePicker(false);
  };

  // Header display string: "Lun, 17 ago" (Matching Image 2)
  const headerDateStr = useMemo(() => {
    const d = pickerSelectedDate || new Date();
    const dayName = dayNamesShort[d.getDay()];
    const dayNum = d.getDate();
    const monthName = monthNamesShort[d.getMonth()];
    return `${dayName}, ${dayNum} ${monthName}`;
  }, [pickerSelectedDate]);

  // Formatted date for input display button
  const formattedReleaseDateDisplay = useMemo(() => {
    if (!formData.releaseDate) return 'Seleccionar fecha y hora de estreno...';
    const d = new Date(formData.releaseDate);
    if (isNaN(d.getTime())) return 'Seleccionar fecha y hora de estreno...';

    const dayName = dayNamesShort[d.getDay()];
    const dayNum = d.getDate();
    const monthName = monthNamesShort[d.getMonth()];
    const year = d.getFullYear();
    const timeStr = d.toLocaleTimeString('es-ES', { hour: 'numeric', minute: '2-digit', hour12: true });

    return `📅 ${dayName}, ${dayNum} ${monthName} ${year} · ${timeStr}`;
  }, [formData.releaseDate]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: c.bgOverlay,
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
        background: c.bgModal,
        border: `1px solid ${c.borderModal}`,
        borderRadius: '24px',
        boxShadow: darkMode ? '0 30px 80px rgba(0, 0, 0, 0.9)' : '0 20px 60px rgba(15, 23, 42, 0.15)',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        transition: 'all 0.2s ease'
      }}>
        {/* Silicon Valley Enterprise Header */}
        <div style={{
          padding: '20px 28px',
          borderBottom: `1px solid ${c.headerBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: c.headerBg,
          borderRadius: '24px 24px 0 0'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: c.badgeStudioText, background: c.badgeStudioBg, padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase' }}>
                Catalog Studio
              </span>
              <span style={{ fontSize: '0.75rem', color: c.textMuted }}>•</span>
              <span style={{ fontSize: '0.78rem', color: c.textSecondary, fontFamily: 'monospace' }}>
                ID: {formData.id || 'autogenerado'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: c.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>
              {isEditing ? `Editar: ${formData.fullName}` : 'Crear Nuevo Espíritu'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: `1px solid ${c.borderModal}`,
              background: c.bgModal,
              color: c.textSecondary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr 0.75fr',
          gap: '28px',
          padding: '28px',
          overflowY: 'auto'
        }}>
          {/* LEFT: Form Controls */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {errorMsg && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '0.82rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Asset Drag & Drop Zone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Asset Digital (.webp / .png)
              </label>

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '22px',
                  borderRadius: '16px',
                  border: isDragOver ? '2px dashed #3ECF8E' : `2px dashed ${c.dropzoneBorder}`,
                  background: isDragOver ? (darkMode ? '#1E2B24' : '#F0FDF4') : c.dropzoneBg,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />

                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: darkMode ? '#262626' : '#FFFFFF',
                  border: `1px solid ${c.borderModal}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  color: darkMode ? '#3ECF8E' : '#2563EB'
                }}>
                  <Upload size={18} />
                </div>

                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: c.textPrimary, marginBottom: '2px' }}>
                  {uploadingImage ? 'Subiendo asset...' : 'Arrastra o haz clic para subir imagen'}
                </div>
                <span style={{ fontSize: '0.72rem', color: c.textMuted }}>
                  Soporta formatos .webp y .png transparentes
                </span>
              </div>
            </div>

            {/* Name & Family Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Nombre en Español
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Ej: Klombo Dorado"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Familia del Espíritu
                </label>
                <select
                  value={isCustomFamily ? '__new__' : formData.familyId}
                  onChange={(e) => handleSelectFamily(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {allFamilies.map(fam => (
                    <option key={fam.id} value={fam.id}>
                      {fam.name} ({fam.id})
                    </option>
                  ))}
                  <option value="__new__">+ Crear Nueva Familia...</option>
                </select>
              </div>
            </div>

            {/* Custom Family Input if toggled */}
            {isCustomFamily && (
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Nombre de la Nueva Familia
                </label>
                <input
                  type="text"
                  value={formData.customFamily}
                  onChange={(e) => handleCustomFamilyInput(e.target.value)}
                  placeholder="Ej: Sombra, Dragón, Fénix..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            )}

            {/* Rarity & Variant Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Rareza
                </label>
                <select
                  value={formData.rarity}
                  onChange={(e) => setFormData(prev => ({ ...prev, rarity: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {Object.entries(RARITIES).map(([rKey, rObj]) => (
                    <option key={rKey} value={rKey}>
                      {rObj.label || rObj.name || rKey}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
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
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                >
                  {Object.entries(THEME_NAMES_ES).map(([themeKey, nameEs]) => (
                    <option key={themeKey} value={themeKey}>
                      {nameEs} ({themeKey})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cost & Drop Chance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Costo Polvo Estelar
                </label>
                <input
                  type="text"
                  value={formData.summonCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, summonCost: e.target.value }))}
                  placeholder="2,000 Polvo Estelar"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Probabilidad (%)
                </label>
                <input
                  type="text"
                  value={formData.dropChance}
                  onChange={(e) => setFormData(prev => ({ ...prev, dropChance: e.target.value }))}
                  placeholder="1.50%"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '10px',
                    background: c.bgInput,
                    border: `1px solid ${c.borderInput}`,
                    color: c.textPrimary,
                    fontSize: '0.86rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Scheduled Release Card */}
            <div style={{
              padding: '18px',
              borderRadius: '14px',
              background: c.bgScheduled,
              border: `1px solid ${c.borderScheduled}`,
              position: 'relative'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginBottom: formData.unreleased ? '12px' : '0' }}>
                <input
                  type="checkbox"
                  checked={formData.unreleased}
                  onChange={(e) => {
                    const isChecked = e.target.checked;
                    setFormData(prev => ({ ...prev, unreleased: isChecked }));
                    if (isChecked && !formData.releaseDate) {
                      setShowDatePicker(true);
                    }
                  }}
                  style={{ width: '18px', height: '18px', accentColor: darkMode ? '#3ECF8E' : '#2563EB' }}
                />
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: c.textPrimary }}>
                  Marcar como "Espíritu No Lanzado" (Programado)
                </span>
              </label>

              {formData.unreleased && (
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: c.textSecondary, marginBottom: '6px' }}>
                    FECHA & HORA DE ESTRENO AUTOMÁTICO
                  </label>

                  {/* Material 3 Date Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(v => !v)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: c.bgModal,
                      border: `1px solid ${showDatePicker ? (darkMode ? '#3ECF8E' : '#2563EB') : c.borderInput}`,
                      color: formData.releaseDate ? c.textPrimary : c.textMuted,
                      fontSize: '0.86rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{formattedReleaseDateDisplay}</span>
                    <Calendar size={16} style={{ color: darkMode ? '#3ECF8E' : '#2563EB' }} />
                  </button>

                  <span style={{ fontSize: '0.72rem', color: c.textMuted, display: 'block', marginTop: '6px' }}>
                    Al llegar este momento exacto, el espíritu se desbloqueará y activará automáticamente en toda la web.
                  </span>

                  {/* ═══ MATERIAL 3 DATE PICKER DROPDOWN POPOVER (Anchored Desplegable) ═══ */}
                  {showDatePicker && (
                    <>
                      {/* Invisible backdrop click-outside layer */}
                      <div 
                        onClick={() => setShowDatePicker(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 99990 }}
                      />

                      <div style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: 0,
                        zIndex: 99999,
                        width: '330px',
                        maxWidth: '92vw',
                        background: c.m3Bg,
                        borderRadius: '24px',
                        border: darkMode ? '1px solid #333333' : '1px solid #E2E8F0',
                        boxShadow: darkMode 
                          ? '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)' 
                          : '0 20px 50px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        fontFamily: 'Roboto, system-ui, -apple-system, sans-serif'
                      }}>
                        {/* Top M3 Header: Subtitle + Big Headline + Edit Icon */}
                        <div style={{ padding: '16px 20px 10px' }}>
                          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: c.m3OnSurfaceVariant, marginBottom: '4px' }}>
                            Select date
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ fontSize: '1.65rem', fontWeight: 500, color: c.m3OnSurface, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>
                              {headerDateStr}
                            </div>
                            <div style={{ color: c.m3OnSurfaceVariant }}>
                              <Edit3 size={16} />
                            </div>
                          </div>
                        </div>

                        <div style={{ width: '100%', height: '1px', background: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

                        {/* M3 Month Navigation Bar */}
                        <div style={{
                          padding: '10px 16px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 700, color: c.m3OnSurface }}>
                            <span>{monthNames[pickerViewMonth]} {pickerViewYear}</span>
                            <ChevronDown size={14} style={{ color: c.m3OnSurfaceVariant }} />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={handlePrevMonth}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: c.m3OnSurfaceVariant,
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <ChevronLeft size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={handleNextMonth}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: c.m3OnSurfaceVariant,
                                cursor: 'pointer',
                                padding: '4px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <ChevronRight size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Calendar Grid: Day Headers */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          padding: '0 12px',
                          textAlign: 'center',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: c.m3OnSurfaceVariant,
                          marginBottom: '4px'
                        }}>
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                            <div key={i} style={{ height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {d}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Grid: Days Cells */}
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(7, 1fr)',
                          gap: '2px',
                          padding: '0 12px',
                          textAlign: 'center'
                        }}>
                          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                            <div key={`empty-${i}`} style={{ height: '32px' }} />
                          ))}

                          {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = 
                              pickerSelectedDate &&
                              pickerSelectedDate.getDate() === day &&
                              pickerSelectedDate.getMonth() === pickerViewMonth &&
                              pickerSelectedDate.getFullYear() === pickerViewYear;

                            const today = new Date();
                            const isToday = 
                              today.getDate() === day &&
                              today.getMonth() === pickerViewMonth &&
                              today.getFullYear() === pickerViewYear;

                            return (
                              <div
                                key={day}
                                onClick={() => handleSelectDay(day)}
                                style={{
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                              >
                                <div style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.8rem',
                                  fontWeight: isSelected ? 800 : isToday ? 700 : 500,
                                  background: isSelected 
                                    ? '#6750A4'
                                    : 'transparent',
                                  color: isSelected 
                                    ? '#FFFFFF' 
                                    : isToday 
                                    ? (darkMode ? '#D0BCFF' : '#6750A4') 
                                    : c.m3OnSurface,
                                  border: isToday && !isSelected ? `1px solid ${darkMode ? '#D0BCFF' : '#6750A4'}` : 'none',
                                  transition: 'all 0.15s ease'
                                }}>
                                  {day}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Time Selector Section */}
                        <div style={{
                          padding: '10px 16px 4px',
                          borderTop: darkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                          marginTop: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}>
                          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: c.m3OnSurfaceVariant, display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={13} /> Hora:
                          </span>

                          <input
                            type="time"
                            value={`${String(pickerHour).padStart(2, '0')}:${String(pickerMinute).padStart(2, '0')}`}
                            onChange={(e) => {
                              const [h, m] = e.target.value.split(':');
                              if (h !== undefined) setPickerHour(Number(h));
                              if (m !== undefined) setPickerMinute(Number(m));
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '8px',
                              background: c.m3CardBg,
                              border: `1px solid ${c.borderInput}`,
                              color: c.m3OnSurface,
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              outline: 'none'
                            }}
                          />
                        </div>

                        {/* Bottom Actions: Cancel & OK */}
                        <div style={{
                          padding: '8px 16px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '8px'
                        }}>
                          <button
                            type="button"
                            onClick={() => setShowDatePicker(false)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: darkMode ? '#D0BCFF' : '#6750A4',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '16px'
                            }}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={handleConfirmDatePicker}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: darkMode ? '#D0BCFF' : '#6750A4',
                              fontSize: '0.84rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: '6px 12px',
                              borderRadius: '16px'
                            }}
                          >
                            OK
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Form Action Footer */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '13px',
                  borderRadius: '12px',
                  background: c.btnCancelBg,
                  border: `1px solid ${c.btnCancelBorder}`,
                  color: c.btnCancelText,
                  fontSize: '0.86rem',
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
                  padding: '13px',
                  borderRadius: '12px',
                  background: c.btnPrimaryBg,
                  color: c.btnPrimaryText,
                  border: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: saving ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: darkMode ? '0 8px 20px rgba(62, 207, 142, 0.25)' : '0 8px 20px rgba(37, 99, 235, 0.25)'
                }}
              >
                <Check size={18} />
                <span>{saving ? 'Guardando...' : 'Publicar Espíritu'}</span>
              </button>
            </div>
          </form>

          {/* RIGHT: Live Interactive Preview */}
          <div style={{
            background: c.bgPreview,
            borderRadius: '20px',
            border: `1px solid ${c.borderPreview}`,
            padding: '24px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: darkMode ? '#3ECF8E' : '#2563EB', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '18px' }}>
              Vista Previa en Vivo
            </span>

            <div style={{
              width: '220px',
              borderRadius: '18px',
              padding: '20px 16px',
              background: c.bgSpriteCard,
              border: `1px solid ${rarityObj.color || (darkMode ? '#3ECF8E' : '#2563EB')}`,
              boxShadow: darkMode ? '0 15px 35px rgba(0,0,0,0.7)' : '0 10px 30px rgba(0,0,0,0.08)',
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

              <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 800, color: c.textPrimary }}>
                {formData.fullName || 'Nombre del Espíritu'}
              </h4>

              <div style={{ fontSize: '0.74rem', color: c.textMuted, marginBottom: '10px' }}>
                {formData.summonCost}
              </div>

              {formData.unreleased ? (
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: darkMode ? 'rgba(168, 85, 247, 0.2)' : '#F3E8FF',
                  color: darkMode ? '#C084FC' : '#7E22CE',
                  fontSize: '0.7rem',
                  fontWeight: 900
                }}>
                  NO LANZADO
                </div>
              ) : (
                <div style={{
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: darkMode ? 'rgba(62, 207, 142, 0.15)' : '#DCFCE7',
                  color: darkMode ? '#3ECF8E' : '#15803D',
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
