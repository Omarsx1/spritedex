import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, Share2, Copy, Check, Image as ImageIcon, Filter, Globe, CheckCircle, XCircle } from 'lucide-react';
import { generatePokedexCardImage } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';

export function ShareImageModal({ filteredSprites, allSprites, userState, activeFiltersLabel, onClose }) {
  const [trainerName, setTrainerName] = useState('Coleccionista Fortnite');
  const [format, setFormat] = useState('checklist');
  const [scope, setScope] = useState('filtered'); // 'all', 'filtered', 'owned', 'missing'
  const [dataUrl, setDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  // Determine which sprites to include based on scope
  const spritesList = useMemo(() => {
    switch (scope) {
      case 'all':
        return allSprites;
      case 'filtered':
        return filteredSprites;
      case 'owned':
        return allSprites.filter(s => userState[s.id]?.owned);
      case 'missing':
        return allSprites.filter(s => !userState[s.id]?.owned);
      default:
        return filteredSprites;
    }
  }, [scope, filteredSprites, allSprites, userState]);

  // Scope counts for display
  const counts = useMemo(() => ({
    all: allSprites.length,
    filtered: filteredSprites.length,
    owned: allSprites.filter(s => userState[s.id]?.owned).length,
    missing: allSprites.filter(s => !userState[s.id]?.owned).length
  }), [allSprites, filteredSprites, userState]);

  useEffect(() => {
    if (spritesList.length === 0) {
      setDataUrl('');
      setIsGenerating(false);
      return;
    }
    setIsGenerating(true);
    generatePokedexCardImage({
      spritesList,
      userState,
      trainerName,
      format
    }).then((url) => {
      setDataUrl(url);
      setIsGenerating(false);
    });
  }, [spritesList, userState, trainerName, format]);

  const getShareableText = () => {
    const total = spritesList.length;
    const owned = spritesList.filter(s => userState[s.id]?.owned).length;
    const mastered = spritesList.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length;
    const missing = spritesList.filter(s => !userState[s.id]?.owned);

    const scopeLabels = {
      all: 'Colección Completa',
      filtered: `Filtrado (${activeFiltersLabel})`,
      owned: 'Solo Atrapados',
      missing: 'Solo Faltantes'
    };

    let text = `🏆 ¡MI PLANTILLA DE ESPÍRITUS / SPRITES DE FORTNITE! 🎮\n`;
    text += `👤 Entrenador: ${trainerName}\n`;
    text += `📋 Mostrando: ${scopeLabels[scope]}\n`;
    text += `📊 Atrapados: ${owned}/${total} (${total > 0 ? Math.round((owned/total)*100) : 0}%)\n`;
    text += `⭐ Maestreados (Nivel 5): ${mastered}\n\n`;

    if (missing.length > 0 && scope !== 'owned') {
      text += `❌ Faltantes:\n`;
      missing.slice(0, 8).forEach(m => {
        text += `- ${m.fullName} (${m.dropChanceDisplay})\n`;
      });
      if (missing.length > 8) text += `... y ${missing.length - 8} más.\n`;
    } else if (scope === 'owned') {
      text += `✅ Mostrando ${owned} Sprites atrapados.\n`;
    }

    return text;
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    sounds.playBeep();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Fortnite_Sprites_${scope}_${trainerName.replace(/\s+/g, '_')}.png`;
    a.click();
  };

  const handleNativeShare = async () => {
    if (!dataUrl) return;
    sounds.playBeep();
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'Fortnite_Sprites.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Sprites de Fortnite',
          text: getShareableText(),
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Sprites de Fortnite',
          text: getShareableText()
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.log('Share canceled:', err);
      handleDownload();
    }
  };

  const handleCopyText = () => {
    sounds.playBeep();
    navigator.clipboard.writeText(getShareableText());
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const scopeOptions = [
    { id: 'filtered', label: 'Filtrados actuales', icon: <Filter size={16} />, count: counts.filtered, desc: activeFiltersLabel },
    { id: 'all', label: 'Colección completa', icon: <Globe size={16} />, count: counts.all, desc: 'Todos los sprites' },
    { id: 'owned', label: 'Solo atrapados', icon: <CheckCircle size={16} />, count: counts.owned, desc: 'Los que ya tienes' },
    { id: 'missing', label: 'Solo faltantes', icon: <XCircle size={16} />, count: counts.missing, desc: 'Los que te faltan' }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ImageIcon size={22} color="#ec4899" />
          <span>Compartir Colección</span>
        </h2>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '20px' }}>
          Elige qué sprites incluir en la imagen y el formato de exportación.
        </p>

        {/* ===== SCOPE SELECTOR ===== */}
        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
            ¿QUÉ QUIERES COMPARTIR?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {scopeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setScope(opt.id)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '10px',
                  background: scope === opt.id
                    ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(168, 85, 247, 0.3))'
                    : 'rgba(255,255,255,0.04)',
                  border: `1.5px solid ${scope === opt.id ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                  color: scope === opt.id ? '#fff' : '#94a3b8',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.2s ease',
                  textAlign: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {opt.icon}
                  <span style={{ fontWeight: 800, fontSize: '0.82rem' }}>{opt.label}</span>
                </div>
                <span style={{
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  color: scope === opt.id ? '#60a5fa' : '#64748b'
                }}>
                  {opt.count} sprites
                </span>
                <span style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: '1.2' }}>
                  {opt.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== FORMAT + TRAINER NAME ===== */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              NOMBRE DE JUGADOR:
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.88rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <div style={{ minWidth: '300px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
              FORMATO DE IMAGEN:
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              {[
                { id: 'checklist', label: '📋 Plantilla Rejilla' },
                { id: 'landscape', label: '🎴 Resumen 16:9' },
                { id: 'square', label: '📱 Cuadrado (1:1)' }
              ].map(f => (
                <button
                  key={f.id}
                  className="btn-secondary"
                  style={{
                    flex: 1,
                    padding: '8px 6px',
                    borderRadius: '8px',
                    background: format === f.id ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'rgba(255,255,255,0.05)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    border: format === f.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)'
                  }}
                  onClick={() => setFormat(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ===== PREVIEW ===== */}
        <div style={{
          background: '#0a0d14',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '20px',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflowY: 'auto'
        }}>
          {spritesList.length === 0 ? (
            <div style={{ color: '#64748b', fontWeight: 700 }}>No hay sprites para mostrar con este filtro.</div>
          ) : isGenerating ? (
            <div style={{ color: '#3b82f6', fontWeight: 700 }}>Generando imagen ({spritesList.length} sprites)...</div>
          ) : (
            <img
              src={dataUrl}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '8px', boxShadow: '0 8px 20px rgba(0,0,0,0.5)' }}
            />
          )}
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button className="btn-secondary" onClick={handleCopyText} disabled={spritesList.length === 0}>
            {copiedText ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
            <span>{copiedText ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button className="btn-secondary" onClick={handleDownload} disabled={!dataUrl}>
            <Download size={16} />
            <span>Descargar PNG</span>
          </button>

          <button
            className="btn-primary"
            onClick={handleNativeShare}
            disabled={!dataUrl}
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
          >
            <Share2 size={16} />
            <span>Compartir (WhatsApp/Discord)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
