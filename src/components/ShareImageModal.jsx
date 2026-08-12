import React, { useState, useEffect, useMemo } from 'react';
import { X, Download, Share2, Copy, Check, Image as ImageIcon, Filter, Globe, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { generatePokedexCardImage } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';

export function ShareImageModal({ filteredSprites, allSprites, userState, activeFiltersLabel, onClose }) {
  const [trainerName, setTrainerName] = useState('Coleccionista Fortnite');
  const [format, setFormat] = useState('checklist');
  const [scope, setScope] = useState('filtered'); // 'all', 'new', 'filtered', 'owned', 'missing'
  const [dataUrl, setDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  // Determine which sprites to include based on scope
  const spritesList = useMemo(() => {
    switch (scope) {
      case 'all':
        return allSprites;
      case 'new':
        return allSprites.filter(s => s.gen === 3 || s.unreleased);
      case 'filtered':
        return filteredSprites;
      case 'owned':
        return allSprites.filter(s => userState[s.id]?.owned);
      case 'missing':
        return allSprites.filter(s => !userState[s.id]?.owned);
      case 'mastered':
        return allSprites.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5);
      case 'not_mastered':
        return allSprites.filter(s => !userState[s.id]?.owned || userState[s.id]?.level < 5);
      default:
        return filteredSprites;
    }
  }, [scope, filteredSprites, allSprites, userState]);

  // Scope counts for display
  const counts = useMemo(() => ({
    all: allSprites.length,
    new: allSprites.filter(s => s.gen === 3 || s.unreleased).length,
    filtered: filteredSprites.length,
    owned: allSprites.filter(s => userState[s.id]?.owned).length,
    missing: allSprites.filter(s => !userState[s.id]?.owned).length,
    mastered: allSprites.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length,
    not_mastered: allSprites.filter(s => !userState[s.id]?.owned || userState[s.id]?.level < 5).length
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
      new: 'Nuevos Espíritus',
      filtered: `Filtrado (${activeFiltersLabel})`,
      owned: 'Solo Atrapados',
      missing: 'Solo Faltantes'
    };

    let text = `🏆 ¡MI PLANTILLA DE ESPÍRITUS / SPRITES DE FORTNITE! 🎮\n`;
    text += `👤 Entrenador: ${trainerName}\n`;
    text += `📋 Mostrando: ${scopeLabels[scope]}\n`;
    text += `📊 Atrapados: ${owned}/${total} (${total > 0 ? Math.round((owned/total)*100) : 0}%)\n`;
    text += `⭐ Maxeados (Nivel 5): ${mastered}\n\n`;

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
    { id: 'all', label: 'TODOS', icon: <Globe size={15} />, count: counts.all, desc: 'Todos los 117 sprites' },
    { id: 'new', label: 'NUEVOS', icon: <Sparkles size={15} color="#38bdf8" />, count: counts.new, desc: 'Espíritus y variantes nuevas' },
    { id: 'owned', label: 'ATRAPADOS', icon: <CheckCircle size={15} color="#10b981" />, count: counts.owned, desc: 'Solo atrapados' },
    { id: 'missing', label: 'FALTANTES', icon: <XCircle size={15} color="#ef4444" />, count: counts.missing, desc: 'Solo faltantes' },
    { id: 'mastered', label: 'MAXEADOS', icon: <CheckCircle size={15} color="#eab308" />, count: counts.mastered, desc: 'Solo Nivel 5' },
    { id: 'not_mastered', label: 'NO MAXEADOS', icon: <XCircle size={15} color="#a855f7" />, count: counts.not_mastered, desc: 'Sin llegar a Nivel 5' },
    { id: 'filtered', label: 'FILTRO ACTUAL', icon: <Filter size={15} />, count: counts.filtered, desc: activeFiltersLabel }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-panel" style={{ maxWidth: '920px', padding: '28px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ marginBottom: '22px' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff' }}>
            <ImageIcon size={22} color="#ec4899" />
            <span>Compartir Colección</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            Elige qué espíritus incluir y el formato de exportación para tu plantilla.
          </p>
        </div>

        {/* ===== SCOPE SELECTOR ===== */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>
            ¿QUÉ QUIERES COMPARTIR?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(122px, 1fr))', gap: '8px' }}>
            {scopeOptions.map((opt) => {
              const isActive = scope === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setScope(opt.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '12px',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(168, 85, 247, 0.25))'
                      : 'rgba(22, 27, 34, 0.6)',
                    border: `1.5px solid ${isActive ? '#8b5cf6' : 'rgba(255,255,255,0.08)'}`,
                    color: isActive ? '#fff' : '#94a3b8',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.2s ease',
                    textAlign: 'center',
                    boxShadow: isActive ? '0 0 14px rgba(139, 92, 246, 0.25)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {opt.icon}
                    <span style={{ fontWeight: 900, fontSize: '0.78rem', letterSpacing: '0.3px' }}>{opt.label}</span>
                  </div>
                  <span style={{
                    fontSize: '0.92rem',
                    fontWeight: 900,
                    color: isActive ? '#60a5fa' : '#cbd5e1'
                  }}>
                    {opt.count} sprites
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#64748b', lineHeight: '1.2' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== FORMAT + TRAINER NAME ===== */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              NOMBRE DE JUGADOR:
            </label>
            <input
              type="text"
              value={trainerName}
              onChange={(e) => setTrainerName(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.86rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ flex: '2 1 300px' }}>
            <label style={{ fontSize: '0.74rem', fontWeight: 800, color: '#cbd5e1', display: 'block', marginBottom: '6px', letterSpacing: '0.5px' }}>
              FORMATO DE IMAGEN:
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'checklist', label: '📋 Plantilla Rejilla' },
                { id: 'landscape', label: '🎴 Resumen 16:9' },
                { id: 'square', label: '📱 Cuadrado (1:1)' }
              ].map(f => {
                const isActive = format === f.id;
                return (
                  <button
                    key={f.id}
                    style={{
                      flex: 1,
                      padding: '9px 8px',
                      borderRadius: '10px',
                      background: isActive ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(22, 27, 34, 0.6)',
                      color: isActive ? '#ffffff' : '#94a3b8',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      border: isActive ? '1px solid #ec4899' : '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => setFormat(f.id)}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ===== PREVIEW BOX ===== */}
        <div style={{
          background: 'rgba(10, 13, 20, 0.95)',
          borderRadius: '16px',
          padding: '16px',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '22px',
          textAlign: 'center',
          minHeight: '220px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {spritesList.length === 0 ? (
            <div style={{ color: '#64748b', fontWeight: 700 }}>No hay espíritus para mostrar con este filtro.</div>
          ) : isGenerating ? (
            <div style={{ color: '#8b5cf6', fontWeight: 700 }}>Generando plantilla gráfica ({spritesList.length} espíritus)...</div>
          ) : (
            <img
              src={dataUrl}
              alt="Vista previa de la plantilla"
              style={{ maxWidth: '100%', maxHeight: '360px', borderRadius: '10px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)' }}
            />
          )}
        </div>

        {/* ===== ACTION BUTTONS ===== */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            className="btn-secondary"
            onClick={handleCopyText}
            disabled={spritesList.length === 0}
            style={{ borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem' }}
          >
            {copiedText ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
            <span>{copiedText ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            className="btn-secondary"
            onClick={handleDownload}
            disabled={!dataUrl}
            style={{ borderRadius: '10px', padding: '9px 16px', fontSize: '0.82rem' }}
          >
            <Download size={16} />
            <span>Descargar PNG</span>
          </button>

          <button
            className="btn-primary"
            onClick={handleNativeShare}
            disabled={!dataUrl}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              borderRadius: '10px',
              padding: '9px 18px',
              fontSize: '0.82rem',
              fontWeight: 800
            }}
          >
            <Share2 size={16} />
            <span>Compartir (WhatsApp/Discord)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
