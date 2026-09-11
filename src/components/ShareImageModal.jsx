import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X, Download, Share2, Copy, Check, Image as ImageIcon, Filter, Globe,
  CheckCircle, XCircle, Sparkles, Repeat, ShieldCheck, Flame
} from 'lucide-react';
import { generatePokedexCardImage, globalCanvasCache } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';
import gsap from 'gsap';

// Caché persistente global para previews de plantillas generadas (0ms instantáneo entre aperturas y formatos)
const globalTemplatePreviewCache = new Map();

export function ShareImageModal({ filteredSprites, allSprites, userState, activeFiltersLabel, onClose }) {
  const [format, setFormat] = useState('checklist'); // 'checklist', 'square'
  const [scope, setScope] = useState('all'); // Default to 'all' of current active generation
  const [bgStyle, setBgStyle] = useState('glitch_override'); // 'glitch_override', 'blueprint', 'dark_matrix'

  // Clave de preview inicial para mostrar la plantilla en 0ms si ya está en caché
  const initialCacheKey = `checklist_all_glitch_override_${allSprites.length}_${allSprites.filter(s => userState[s.id]?.owned).length}`;
  const initialCached = globalTemplatePreviewCache.get(initialCacheKey) || globalCanvasCache.get(initialCacheKey);

  const [dataUrl, setDataUrl] = useState(() => initialCached?.url || initialCached?.dataUrl || (typeof initialCached === 'string' ? initialCached : ''));
  const [cachedFile, setCachedFile] = useState(() => initialCached?.file || null);
  const [cachedBlob, setCachedBlob] = useState(() => initialCached?.blob || null);
  const [isGenerating, setIsGenerating] = useState(() => !initialCached);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const openTimeRef = useRef(Date.now());

  const handleClose = () => {
    if (isClosing) return;
    sounds.playBeep();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget) return;
    if (Date.now() - openTimeRef.current < 400) return;
    handleClose();
  };

  // Close on Escape with smooth exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isClosing]);

  // Entrance animation matching modern spring physics
  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.94, y: 12 },
        { opacity: 1, scale: 1, y: 0, duration: 0.28, ease: 'power3.out' }
      );
    }
  }, []);

  // Determine which sprites to include based on scope
  const spritesList = useMemo(() => {
    switch (scope) {
      case 'all':
        return allSprites;
      case 'new':
        return allSprites.filter(s => s.isNew);
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
    new: allSprites.filter(s => s.isNew).length,
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

  // Trigger canvas generation on setting changes with instant in-memory preview cache
  useEffect(() => {
    if (spritesList.length === 0) {
      setDataUrl('');
      setCachedFile(null);
      setCachedBlob(null);
      setIsGenerating(false);
      return;
    }

    const cacheKey = `${format}_${scope}_${bgStyle}_${spritesList.length}_${ownedInScope}`;
    const genericKey = `${format}_${bgStyle}_${spritesList.length}_${ownedInScope}`;
    const cached = globalTemplatePreviewCache.get(cacheKey) || globalCanvasCache.get(genericKey);
    if (cached) {
      const url = typeof cached === 'string' ? cached : (cached.url || cached.dataUrl);
      setDataUrl(url);
      setCachedFile(cached?.file || null);
      setCachedBlob(cached?.blob || null);
      setIsGenerating(false);
      return;
    }

    setIsGenerating(true);
    let isCancelled = false;

    // Asynchronous requestAnimationFrame to allow the entrance animation to glide with zero stutter
    const frameId = requestAnimationFrame(() => {
      generatePokedexCardImage({
        spritesList,
        userState,
        format,
        bgStyle
      }).then((res) => {
        if (!isCancelled) {
          const url = typeof res === 'string' ? res : res.dataUrl;
          const file = res?.file || null;
          const blob = res?.blob || null;
          globalTemplatePreviewCache.set(cacheKey, { url, file, blob });
          setDataUrl(url);
          setCachedFile(file);
          setCachedBlob(blob);
          setIsGenerating(false);
        }
      }).catch((err) => {
        if (!isCancelled) {
          console.error('Error generando imagen de plantilla:', err);
          setIsGenerating(false);
        }
      });
    });

    return () => {
      isCancelled = true;
      cancelAnimationFrame(frameId);
    };
  }, [spritesList, userState, format, bgStyle, scope, ownedInScope]);

  const getShareableText = () => {
    const total = spritesList.length;
    const owned = spritesList.filter(s => userState[s.id]?.owned).length;
    const mastered = spritesList.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length;
    const missing = spritesList.filter(s => !userState[s.id]?.owned);

    const scopeLabels = {
      all: '🌐 Colección Completa Override',
      new: '✨ Nuevos Espíritus',
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

  const isIOS = typeof navigator !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );

  const handleDownload = async () => {
    if (!dataUrl && !cachedBlob) return;
    sounds.playBeep();

    try {
      let blobToUse = cachedBlob;
      let fileToUse = cachedFile;

      if (!blobToUse && dataUrl) {
        const res = await fetch(dataUrl);
        blobToUse = await res.blob();
        fileToUse = new File([blobToUse], getCaptureFilename(), { type: 'image/png' });
      }

      // En iOS / iPhone Safari, la descarga sintética suele parpadear.
      // Usamos la Web Share API nativa sincrónica con el File ya precargado para "Guardar imagen" en el Carrete
      if (isIOS && fileToUse && navigator.canShare && navigator.canShare({ files: [fileToUse] })) {
        try {
          await navigator.share({
            title: 'Plantilla de Espíritus Fortnite',
            text: getShareableText(),
            files: [fileToUse]
          });
          return;
        } catch (shareErr) {
          if (shareErr.name === 'AbortError') return; // Cancelado por el usuario
          console.warn('Share falló, usando fallback de blob:', shareErr);
        }
      }

      // Método Blob universal para navegadores estándar
      const filename = getCaptureFilename();
      const blobUrl = blobToUse ? URL.createObjectURL(blobToUse) : dataUrl;
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (blobToUse) {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      }
    } catch (err) {
      console.error('Error al descargar:', err);
      // Fallback básico
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = getCaptureFilename();
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleNativeShare = async () => {
    if (!dataUrl && !cachedFile) return;
    sounds.playBeep();
    try {
      let fileToShare = cachedFile;
      if (!fileToShare && dataUrl) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        fileToShare = new File([blob], getCaptureFilename(), { type: 'image/png' });
      }

      // Invocación directa e instantánea sin perder el User Gesture en iOS Safari y Android Chrome
      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
          title: 'Plantilla de Espíritus Fortnite',
          text: getShareableText(),
          files: [fileToShare]
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
      if (err.name !== 'AbortError') {
        console.log('Share canceled or failed:', err);
        handleDownload();
      }
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
    <div className={`modal-overlay ${isClosing ? 'is-closing' : ''}`} onClick={handleBackdropClick}>
      <div className={`sdm-share-pro ${isClosing ? 'is-closing' : ''}`} ref={modalRef} onClick={(e) => e.stopPropagation()}>
        {/* Header Elegante y Minimalista */}
        <div className="sdm-share-pro__header">
          <div className="sdm-share-pro__title-wrap">
            <div className="sdm-share-pro__icon-badge">
              <Sparkles size={18} color="#00F0E8" />
            </div>
            <div>
              <h2 className="sdm-share-pro__title">Exportar Colección</h2>
              <p className="sdm-share-pro__subtitle">
                {ownedInScope} de {spritesList.length} espíritus atrapados • {pctInScope}% completado
              </p>
            </div>
          </div>
          <button className="sdm-share-pro__close" onClick={handleClose} aria-label="Cerrar modal">
            <X size={18} />
          </button>
        </div>

        {/* Toolbar de Configuración Compacta */}
        <div className="sdm-share-pro__controls">
          <div className="sdm-share-pro__seg-group">
            <span className="sdm-share-pro__seg-label">MOSTRAR:</span>
            <div className="sdm-share-pro__segmented">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'new', label: 'Nuevos' },
                { id: 'owned', label: 'Atrapados' },
                { id: 'missing', label: 'Faltantes' }
              ].map(opt => (
                <button
                  key={opt.id}
                  className={`sdm-share-pro__seg-btn ${scope === opt.id ? 'sdm-share-pro__seg-btn--active' : ''}`}
                  onClick={() => {
                    setScope(opt.id);
                    sounds.playBeep();
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="sdm-share-pro__seg-group">
            <span className="sdm-share-pro__seg-label">FORMATO:</span>
            <div className="sdm-share-pro__segmented">
              {[
                { id: 'checklist', label: '📱 Vertical' },
                { id: 'square', label: '🔳 1:1' }
              ].map(f => (
                <button
                  key={f.id}
                  className={`sdm-share-pro__seg-btn ${format === f.id ? 'sdm-share-pro__seg-btn--active' : ''}`}
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
        </div>

        {/* Vista Previa Central HD */}
        <div className="sdm-share-pro__preview-wrap">
          {spritesList.length === 0 ? (
            <div className="sdm-share-pro__empty">
              No hay espíritus para mostrar en esta categoría.
            </div>
          ) : isGenerating ? (
            <div className="sdm-share-pro__loading">
              <div className="sdm-share-pro__spinner" />
              <span>Generando captura HD...</span>
            </div>
          ) : (
            <img
              src={dataUrl}
              alt="Vista previa de la colección"
              className="sdm-share-pro__preview-img"
            />
          )}
        </div>

        {/* Barra de Acciones Principal */}
        <div className="sdm-share-pro__actions">
          <button
            className="sdm-share-pro__btn sdm-share-pro__btn--copy"
            onClick={handleCopyText}
            disabled={spritesList.length === 0}
            title="Copiar resumen de texto para redes"
          >
            {copiedText ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            <span>{copiedText ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
          </button>

          <button
            className="sdm-share-pro__btn sdm-share-pro__btn--share"
            onClick={handleNativeShare}
            disabled={!dataUrl}
            title="Compartir captura"
          >
            <Share2 size={15} />
            <span>Compartir</span>
          </button>

          <button
            className="sdm-share-pro__btn sdm-share-pro__btn--download sdm-share__glitch-btn"
            onClick={handleDownload}
            disabled={!dataUrl}
            title="Descargar imagen en alta resolución"
            data-text="DESCARGAR"
          >
            <Download size={15} className="sdm-share__btn-icon" />
            <span className="sdm-share__btn-text">Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

