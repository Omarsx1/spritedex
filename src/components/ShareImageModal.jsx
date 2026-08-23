import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Download, Share2, Copy, Check, Image as ImageIcon, Filter, Globe,
  CheckCircle, XCircle, Sparkles, Repeat, ShieldCheck, Flame
} from 'lucide-react';
import { generatePokedexCardImage } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

export function ShareImageModal({ filteredSprites, allSprites, userState, activeFiltersLabel, onClose }) {
  const [format, setFormat] = useState('checklist'); // 'checklist', 'square'
  const [scope, setScope] = useState('all'); // Default to 'all' of current active generation
  const [bgStyle, setBgStyle] = useState('glitch_override'); // 'glitch_override', 'blueprint', 'dark_matrix'
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
      default:
        return allSprites;
    }
  }, [scope, filteredSprites, allSprites, userState]);

  // Scope counts for display
  const counts = useMemo(() => ({
    all: allSprites.length,
    filtered: filteredSprites.length,
    owned: allSprites.filter(s => userState[s.id]?.owned).length,
    missing: allSprites.filter(s => !userState[s.id]?.owned).length,
    mastered: allSprites.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length
  }), [allSprites, filteredSprites, userState]);

  const ownedInScope = useMemo(() => {
    return spritesList.filter(s => userState[s.id]?.owned).length;
  }, [spritesList, userState]);

  const pctInScope = useMemo(() => {
    return spritesList.length > 0 ? Math.round((ownedInScope / spritesList.length) * 100) : 0;
  }, [spritesList, ownedInScope]);

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
      format,
      bgStyle
    }).then((url) => {
      setDataUrl(url);
      setIsGenerating(false);
    });
  }, [spritesList, userState, format, bgStyle]);

  const getShareableText = () => {
    const total = spritesList.length;
    const owned = spritesList.filter(s => userState[s.id]?.owned).length;
    const mastered = spritesList.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length;
    const missing = spritesList.filter(s => !userState[s.id]?.owned);

    const scopeLabels = {
      all: '🌐 Colección Completa Override',
      filtered: `🔍 Filtrado (${activeFiltersLabel})`,
      owned: '✔️ Solo Desencriptados',
      missing: '❌ Solo Faltantes / Bloqueados',
      mastered: '⭐ Solo Maxeados'
    };

    let text = `🎮 ¡MI COLECCIÓN SPRITEDEX OVERRIDE / GLITCH! 🏆\n`;
    text += `📋 Vista: ${scopeLabels[scope] || 'Plantilla'}\n`;
    text += `📊 Desencriptados: ${owned}/${total} (${total > 0 ? Math.round((owned / total) * 100) : 0}%)\n`;
    text += `⭐ Maxeados: ${mastered}\n\n`;

    if (missing.length > 0) {
      text += `❌ BUSCO PARA INTERCAMBIAR (${missing.length} faltantes):\n`;
      missing.slice(0, 10).forEach(m => {
        text += `- ${m.fullName} (${m.dropChanceDisplay || m.dropChance})\n`;
      });
      if (missing.length > 10) text += `... y ${missing.length - 10} más.\n`;
      text += `\n📩 ¿Tienes alguno para cambiar? ¡Escríbeme!\n`;
    } else {
      text += `🎉 ¡Todos los espíritus de esta plantilla han sido hackeados al 100%!\n`;
    }

    text += `#FNGGOverride #FortniteSprites #FortniteGlitch`;

    return text;
  };

  const getCaptureFilename = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    return `spritedex_${dateStr}_${timeStr}.png`;
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    sounds.playBeep();
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = getCaptureFilename();
    a.click();
  };

  const handleNativeShare = async () => {
    if (!dataUrl) return;
    sounds.playBeep();
    try {
      const filename = getCaptureFilename();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'Plantilla de Espíritus Fortnite Override',
          text: getShareableText(),
          files: [file]
        });
      } else if (navigator.share) {
        await navigator.share({
          title: 'Plantilla de Espíritus Fortnite Override',
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
      id: 'all',
      label: 'TODOS',
      icon: <Globe size={15} color="#38bdf8" />,
      count: counts.all
    },
    {
      id: 'owned',
      label: 'ATRAPADOS',
      icon: <CheckCircle size={15} color="#10b981" />,
      count: counts.owned
    },
    {
      id: 'missing',
      label: 'FALTANTES',
      icon: <XCircle size={15} color="#ef4444" />,
      count: counts.missing
    },
    {
      id: 'mastered',
      label: 'MAXEADOS',
      icon: <ShieldCheck size={15} color="#eab308" />,
      count: counts.mastered
    },
    {
      id: 'filtered',
      label: 'FILTRO ACTUAL',
      icon: <Filter size={15} color="#a855f7" />,
      count: counts.filtered
    }
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sdm sdm-share sdm-share--glitch" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="sdm__close" onClick={onClose}>
          <X size={18} />
        </button>

        {/* ═══ HERO HEADER (GLITCH / OVERRIDE THEMED) ═══ */}
        <div className="sdm__hero sdm-share__hero" ref={headerRef}>
          <div
            className="sdm__hero-glow"
            style={{
              background: 'radial-gradient(circle at 30% 50%, rgba(255, 0, 85, 0.4) 0%, rgba(0, 240, 255, 0.25) 50%, transparent 80%)'
            }}
          />

          <div className="sdm-share__hero-icon">
            <ImageIcon size={32} color="#00f0ff" />
          </div>

          <div className="sdm__hero-info">
            <div className="sdm__hero-badges">
              <span className="sdm-share__tag-chapter">FORTNITE | TEMPORADA GLITCH</span>
              <span className="sdm-share__tag-pill">ROMPE LAS REGLAS • CAMBIA EL JUEGO</span>
            </div>
            <h2 className="sdm__name sdm-share__glitch-title">SPRITEDEX OVERRIDE</h2>
            <p className="sdm__meta">
              Exporta tu plantilla de colección en alta resolución con estilo cyber glitch oficial y barra de desencriptación.
            </p>
          </div>
        </div>

        {/* ═══ HUD STATS BAR (Image 2 style) ═══ */}
        <div className="sdm-share__hud">
          <div className="sdm-share__hud-header">
            <div className="sdm-share__hud-left">
              <span className="sdm-share__hud-highlight">{ownedInScope} / {spritesList.length}</span>
              <span className="sdm-share__hud-label">espíritus desencriptados</span>
            </div>
            <div className="sdm-share__hud-right">
              <span>PROGRESO <strong>{pctInScope}%</strong></span>
            </div>
          </div>
          <div className="sdm-share__hud-bar-track">
            <div
              className="sdm-share__hud-bar-fill"
              style={{ width: `${Math.max(4, pctInScope)}%` }}
            />
          </div>
        </div>

        {/* ═══ BODY CONTENT ═══ */}
        <div className="sdm__body sdm-share__body">

          {/* Scope Selector */}
          <div className="sdm-share__section-label">
            <Repeat size={14} color="#00f0ff" />
            <span>CATEGORÍA A EXPORTAR</span>
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
                  <div className="sdm-share__scope-left">
                    {opt.icon}
                    <span className="sdm-share__scope-label">{opt.label}</span>
                  </div>
                  <span className="sdm-share__scope-count">
                    {opt.count} <span className="sdm-share__scope-unit">sprites</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Config Controls Grid */}
          <div className="sdm-share__grid-config">
            {/* Format Selector */}
            <div className="sdm-share__input-wrap">
              <label className="sdm-share__section-label">
                <span>FORMATO:</span>
              </label>
              <div className="sdm-share__pill-selector">
                {[
                  { id: 'checklist', label: '📱 Vertical Móvil' },
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
                  className={`sdm-share__pill-opt ${bgStyle === 'glitch_override' ? 'sdm-share__pill-opt--active' : ''}`}
                  onClick={() => {
                    setBgStyle('glitch_override');
                    sounds.playBeep();
                  }}
                >
                  🌌 Glitch HD
                </button>
                <button
                  className={`sdm-share__pill-opt ${bgStyle === 'blueprint' ? 'sdm-share__pill-opt--active' : ''}`}
                  onClick={() => {
                    setBgStyle('blueprint');
                    sounds.playBeep();
                  }}
                >
                  💠 Blueprint
                </button>
                <button
                  className={`sdm-share__pill-opt ${bgStyle === 'dark_matrix' ? 'sdm-share__pill-opt--active' : ''}`}
                  onClick={() => {
                    setBgStyle('dark_matrix');
                    sounds.playBeep();
                  }}
                >
                  🔮 Dark
                </button>
              </div>
            </div>
          </div>

          {/* Preview Container */}
          <div className="sdm-share__preview-container">
            <div className="sdm-share__preview-header">
              <span className="sdm-share__section-label" style={{ marginBottom: 0 }}>
                <Sparkles size={14} color="#00f0ff" />
                <span>Vista Previa</span>
              </span>

              {/* Botones de acción directos en la barra superior */}
              <div className="sdm-share__header-actions">
                <button
                  className="sdm-share__quick-btn sdm-share__quick-btn--copy"
                  onClick={handleCopyText}
                  disabled={spritesList.length === 0}
                  title="Copiar texto para compartir en redes"
                >
                  {copiedText ? <Check size={14} color="#4ade80" /> : <Copy size={14} />}
                  <span>{copiedText ? '¡Copiado!' : 'Copiar Texto'}</span>
                </button>

                <button
                  className="sdm-share__quick-btn sdm-share__quick-btn--download"
                  onClick={handleDownload}
                  disabled={!dataUrl}
                  title="Descargar imagen PNG"
                >
                  <Download size={14} />
                  <span>Descargar</span>
                </button>

                <button
                  className="sdm-share__quick-btn sdm-share__quick-btn--share"
                  onClick={handleNativeShare}
                  disabled={!dataUrl}
                  title="Compartir plantilla"
                >
                  <Share2 size={14} />
                  <span>Compartir</span>
                </button>
              </div>
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

            <div className="sdm-share__trade-tip">
              <span>💡 <strong>Tip de Intercambio:</strong> Comparte esta plantilla en tus redes o chats con amigos usando <code>#FNGGOverride</code></span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

