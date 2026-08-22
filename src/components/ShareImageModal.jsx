import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Download, Share2, Copy, Check, Image as ImageIcon, Filter, Globe,
  CheckCircle, XCircle, Sparkles, Repeat, ShieldCheck, Flame
} from 'lucide-react';
import { generatePokedexCardImage } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

export function ShareImageModal({ filteredSprites, allSprites, userState, activeFiltersLabel, onClose }) {
  const [trainerName, setTrainerName] = useState('Coleccionista Fortnite');
  const [format, setFormat] = useState('checklist'); // 'checklist', 'landscape', 'square'
  const [scope, setScope] = useState('new'); // Default to 'new' so trading new spirits is immediate!
  const [useBgTemplate, setUseBgTemplate] = useState(true);
  const [dataUrl, setDataUrl] = useState('');
  const [isGenerating, setIsGenerating] = useState(true);
  const [copiedText, setCopiedText] = useState(false);

  const modalRef = useRef(null);
  const headerRef = useRef(null);

  // Entrance animation matching SpriteDetailModal
  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 15 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power2.out' }
      );
    }
  }, []);

  // Determine which sprites to include based on scope
  const spritesList = useMemo(() => {
    switch (scope) {
      case 'new':
        return allSprites.filter(s => s.gen === 2 || s.unreleased || s.isNew);
      case 'all':
        return allSprites;
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
        return allSprites;
    }
  }, [scope, filteredSprites, allSprites, userState]);

  // Scope counts for display
  const counts = useMemo(() => ({
    all: allSprites.length,
    new: allSprites.filter(s => s.gen === 2 || s.unreleased || s.isNew).length,
    filtered: filteredSprites.length,
    owned: allSprites.filter(s => userState[s.id]?.owned).length,
    missing: allSprites.filter(s => !userState[s.id]?.owned).length,
    mastered: allSprites.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length,
    not_mastered: allSprites.filter(s => !userState[s.id]?.owned || userState[s.id]?.level < 5).length
  }), [allSprites, filteredSprites, userState]);

  // Trigger canvas generation on setting changes
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
      format,
      useBackgroundTemplate: useBgTemplate
    }).then((url) => {
      setDataUrl(url);
      setIsGenerating(false);
    });
  }, [spritesList, userState, trainerName, format, useBgTemplate]);

  const getShareableText = () => {
    const total = spritesList.length;
    const owned = spritesList.filter(s => userState[s.id]?.owned).length;
    const mastered = spritesList.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length;
    const missing = spritesList.filter(s => !userState[s.id]?.owned);

    const scopeLabels = {
      new: '✨ Nuevos Espíritus (Intercambio)',
      all: '🌐 Colección Completa',
      filtered: `🔍 Filtrado (${activeFiltersLabel})`,
      owned: '✔️ Solo Atrapados',
      missing: '❌ Solo Faltantes',
      mastered: '⭐ Solo Maxeados',
      not_mastered: '💜 No Maxeados'
    };

    let text = `🎮 ¡MI PLANTILLA DE ESPÍRITUS / SPRITES DE FORTNITE! 🏆\n`;
    text += `👤 Entrenador: ${trainerName}\n`;
    text += `📋 Vista: ${scopeLabels[scope] || 'Plantilla'}\n`;
    text += `📊 Atrapados: ${owned}/${total} (${total > 0 ? Math.round((owned / total) * 100) : 0}%)\n`;
    text += `⭐ Maxeados: ${mastered}\n\n`;

    if (missing.length > 0) {
      text += `❌ BUSCO PARA INTERCAMBIAR (${missing.length} faltantes):\n`;
      missing.slice(0, 10).forEach(m => {
        text += `- ${m.fullName} (${m.dropChanceDisplay || m.dropChance})\n`;
      });
      if (missing.length > 10) text += `... y ${missing.length - 10} más.\n`;
      text += `\n📩 ¿Tienes alguno disponible para cambiar? ¡Escríbeme!\n`;
    } else {
      text += `🎉 ¡Tengo todos los espíritus de esta plantilla atrapados!\n`;
    }

    text += `#FortniteSprites #Fortnite #FortniteGame`;

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
      const file = new File([blob], 'Fortnite_Sprites_Plantilla.png', { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Plantilla de Espíritus Fortnite',
          text: getShareableText(),
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Plantilla de Espíritus Fortnite',
          text: getShareableText()
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.log('Share canceled or failed:', err);
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
    {
      id: 'new',
      label: 'NUEVOS',
      icon: <Sparkles size={16} color="#ec4899" />,
      count: counts.new,
      desc: 'Espíritus recién agregados',
      isPopular: true
    },
    {
      id: 'all',
      label: 'TODOS',
      icon: <Globe size={16} color="#38bdf8" />,
      count: counts.all,
      desc: 'Todos los 117 sprites'
    },
    {
      id: 'owned',
      label: 'ATRAPADOS',
      icon: <CheckCircle size={16} color="#10b981" />,
      count: counts.owned,
      desc: 'Solo tus atrapados'
    },
    {
      id: 'missing',
      label: 'FALTANTES',
      icon: <XCircle size={16} color="#ef4444" />,
      count: counts.missing,
      desc: 'Solo los que te faltan'
    },
    {
      id: 'mastered',
      label: 'MAXEADOS',
      icon: <ShieldCheck size={16} color="#eab308" />,
      count: counts.mastered,
      desc: 'Solo Nivel 5 (⭐)'
    },
    {
      id: 'filtered',
      label: 'FILTRO ACTUAL',
      icon: <Filter size={16} color="#a855f7" />,
      count: counts.filtered,
      desc: activeFiltersLabel || 'Filtro personalizado'
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sdm sdm-share" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="sdm__close" onClick={onClose}>
          <X size={18} />
        </button>

        {/* ═══ HERO HEADER (SDM Styled) ═══ */}
        <div className="sdm__hero sdm-share__hero" ref={headerRef}>
          <div
            className="sdm__hero-glow"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(236, 72, 153, 0.35) 0%, rgba(139, 92, 246, 0.2) 50%, transparent 80%)'
            }}
          />

          <div className="sdm-share__hero-icon">
            <ImageIcon size={34} color="#ec4899" />
          </div>

          <div className="sdm__hero-info">
            <div className="sdm__hero-badges">
              <span className="sprite-pill rarity-badge sprite-rarity-epic" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Flame size={12} /> HERRAMIENTA DE INTERCAMBIOS
              </span>
              <span className="sdm__drop">EXPORTADOR HD</span>
            </div>
            <h2 className="sdm__name">COMPARTIR COLECCIÓN</h2>
            <p className="sdm__meta">
              Genera tu plantilla gráfica con fondo temático (background_template.webp) y casillas de verificación para redes sociales.
            </p>
          </div>
        </div>

        {/* ═══ BODY CONTENT ═══ */}
        <div className="sdm__body" style={{ padding: '20px 24px' }}>

          {/* Scope Selector */}
          <div className="sdm-share__section-label">
            <Repeat size={14} color="#a855f7" />
            <span>¿Qué espíritus quieres incluir en la plantilla?</span>
          </div>

          <div className="sdm-share__scopes">
            {scopeOptions.map((opt) => {
              const isActive = scope === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setScope(opt.id);
                    sounds.playBeep();
                  }}
                  className={`sdm-share__scope-btn ${isActive ? 'sdm-share__scope-btn--active' : ''}`}
                >
                  {opt.isPopular && (
                    <span className="sdm-share__badge-popular">¡INTERCAMBIO!</span>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: opt.isPopular ? '4px' : '0' }}>
                    {opt.icon}
                    <span style={{ fontWeight: 900, fontSize: '0.8rem', letterSpacing: '0.3px' }}>{opt.label}</span>
                  </div>
                  <span style={{ fontSize: '0.92rem', fontWeight: 900, color: isActive ? '#a855f7' : '#cbd5e1' }}>
                    {opt.count} sprites
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#64748b', lineHeight: '1.2' }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Config Controls Grid */}
          <div className="sdm-share__grid-config">
            {/* Player Name */}
            <div className="sdm-share__input-wrap">
              <label className="sdm-share__section-label">
                <span>NOMBRE DE JUGADOR:</span>
              </label>
              <input
                type="text"
                value={trainerName}
                onChange={(e) => setTrainerName(e.target.value)}
                className="sdm-share__input"
                placeholder="Ej. Coleccionista Fortnite"
              />
            </div>

            {/* Format Selector */}
            <div className="sdm-share__input-wrap">
              <label className="sdm-share__section-label">
                <span>FORMATO DE IMAGEN:</span>
              </label>
              <div className="sdm-share__pill-selector">
                {[
                  { id: 'checklist', label: '📋 Rejilla' },
                  { id: 'square', label: '🔳 1:1 Cuadrado' }
                ].map(f => (
                  <button
                    key={f.id}
                    className={`sdm-share__pill-opt ${format === f.id ? 'sdm-share__pill-opt--active' : ''}`}
                    onClick={() => {
                      setFormat(f.id);
                      sounds.playBeep();
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Template Toggle */}
            <div className="sdm-share__input-wrap">
              <label className="sdm-share__section-label">
                <span>ESTILO DE FONDO:</span>
              </label>
              <div className="sdm-share__pill-selector">
                <button
                  className={`sdm-share__pill-opt ${useBgTemplate ? 'sdm-share__pill-opt--active' : ''}`}
                  onClick={() => {
                    setUseBgTemplate(true);
                    sounds.playBeep();
                  }}
                >
                  🌌 Fondo Template
                </button>
                <button
                  className={`sdm-share__pill-opt ${!useBgTemplate ? 'sdm-share__pill-opt--active' : ''}`}
                  onClick={() => {
                    setUseBgTemplate(false);
                    sounds.playBeep();
                  }}
                >
                  🔮 Dark Neon
                </button>
              </div>
            </div>
          </div>

          {/* Preview Container */}
          <div className="sdm-share__preview-container">
            <div className="sdm-share__preview-header">
              <span className="sdm-share__section-label" style={{ marginBottom: 0 }}>
                <Sparkles size={14} color="#ec4899" />
                <span>Vista Previa de la Plantilla</span>
              </span>
              <span className="sdm-share__preview-badge">
                <CheckCircle size={13} />
                <span>{spritesList.length} Sprites • {useBgTemplate ? 'Background Template HD' : 'Dark HD'}</span>
              </span>
            </div>

            <div className="sdm-share__preview-box">
              {spritesList.length === 0 ? (
                <div style={{ color: '#64748b', fontWeight: 700 }}>
                  No hay espíritus para mostrar en este filtro.
                </div>
              ) : isGenerating ? (
                <div className="sdm-share__loading">
                  <div className="sdm-share__spinner" />
                  <span>Generando plantilla gráfica HD...</span>
                </div>
              ) : (
                <img
                  src={dataUrl}
                  alt="Vista previa de la plantilla"
                  className="sdm-share__preview-img"
                />
              )}
            </div>

            <p className="sdm-share__trade-tip">
              💡 <span><strong>Tip de Intercambio:</strong> Publica esta plantilla con las casillas de faltantes (<code>[ ✗ FALTANTE ]</code>) en Twitter/X, Discord o WhatsApp para solicitar cambios con la comunidad.</span>
            </p>
          </div>

          {/* Action Footer */}
          <div className="sdm-share__actions">
            <button
              className="sdm-share__btn sdm-share__btn--secondary"
              onClick={handleCopyText}
              disabled={spritesList.length === 0}
            >
              {copiedText ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
              <span>{copiedText ? '¡Texto Copiado!' : 'Copiar Texto para Post'}</span>
            </button>

            <button
              className="sdm-share__btn sdm-share__btn--primary"
              onClick={handleDownload}
              disabled={!dataUrl}
            >
              <Download size={16} />
              <span>Descargar PNG</span>
            </button>

            <button
              className="sdm-share__btn sdm-share__btn--vibrant"
              onClick={handleNativeShare}
              disabled={!dataUrl}
            >
              <Share2 size={16} />
              <span>Compartir (WhatsApp / Discord)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
