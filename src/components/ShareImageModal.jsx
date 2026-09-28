import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  X, Download, Share2, Copy, Check, Image as ImageIcon, Filter, Globe,
  CheckCircle, XCircle, Sparkles, Repeat, ShieldCheck, Flame
} from 'lucide-react';
import { generatePokedexCardImage, encodeCanvasToImage, globalCanvasCache, getCanvasCacheKey, readCachedCapture, writeCachedCapture, getOrStartCapture, DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';
import { Modal } from './ui/Modal';
import gsap from 'gsap';

// Caché persistente global para previews de plantillas generadas (0ms instantáneo entre aperturas y formatos)
const globalTemplatePreviewCache = new Map();

// Estado del medidor de diagnostico. Apagado por defecto (no aparece para nadie) y
// se enciende solo cuando se pide: ?perf=1, #perf o doble toque en el titulo del
// modal, y solo durante esa sesion. No se guarda en el dispositivo.
function leerPerfActivado() {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  try {
    // Limpia el recordatorio que dejaban las versiones anteriores del medidor.
    localStorage.removeItem('spritedex_perf');
  } catch {
    // Sin storage no hay nada que limpiar.
  }
  return params.has('perf') || window.location.hash.toLowerCase().includes('perf');
}

export function ShareImageModal({ filteredSprites, allSprites, userState, activeFiltersLabel, onClose }) {
  const [format, setFormat] = useState(DEFAULT_EXPORT_FORMAT); // 'checklist', 'square'
  const [scope, setScope] = useState('all'); // Default to 'all' of current active generation
  const [bgStyle, setBgStyle] = useState(DEFAULT_EXPORT_BG_STYLE); // 'glitch_override', 'blueprint', 'dark_matrix'

  // Clave de preview canónica para mostrar la plantilla en 0ms si ya está en caché
  const initialCount = allSprites.length;
  const initialOwned = allSprites.filter(s => userState[s.id]?.owned).length;
  const initialCacheKey = getCanvasCacheKey(DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE, initialCount, initialOwned, allSprites, userState);
  const initialCached = globalTemplatePreviewCache.get(initialCacheKey) || globalCanvasCache.get(initialCacheKey);

  const [dataUrl, setDataUrl] = useState(() => initialCached?.url || initialCached?.dataUrl || (typeof initialCached === 'string' ? initialCached : ''));
  const [cachedFile, setCachedFile] = useState(() => initialCached?.file || null);
  const [cachedBlob, setCachedBlob] = useState(() => initialCached?.blob || null);
  const [previewCanvas, setPreviewCanvas] = useState(() => initialCached?.canvas || null);
  const [isGenerating, setIsGenerating] = useState(() => !initialCached);
  const [isClosing, setIsClosing] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [perf, setPerf] = useState(null);
  const [showPerf, setShowPerf] = useState(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('perf') === '0') return false;
    return leerPerfActivado();
  });
  const tapPerfRef = useRef(0);
  const alternarPerf = useCallback(() => {
    // Solo cambia el estado de esta sesion: el medidor no se recuerda.
    setShowPerf((activo) => !activo);
  }, []);
  // Doble toque en el titulo: enciende o apaga el medidor sin tocar la URL.
  const manejarTapTitulo = useCallback(() => {
    const ahora = Date.now();
    if (ahora - tapPerfRef.current < 600) {
      tapPerfRef.current = 0;
      alternarPerf();
    } else {
      tapPerfRef.current = ahora;
    }
  }, [alternarPerf]);

  const modalRef = useRef(null);
  const headerRef = useRef(null);
  const hasEnteredRef = useRef(false);
  const activeJobIdRef = useRef(0);
  const previewHostRef = useRef(null);

  // Codifica el PNG fuera del camino critico: primero se pinta la captura y despues,
  // en reposo, se prepara el archivo de Descargar/Compartir. Son 2-6 s menos de espera.
  const queuePngEncode = useCallback((canvasToEncode, key, onlyForJobId, inicioDibujo) => {
    if (!canvasToEncode) return;
    const run = () => {
      if (onlyForJobId !== undefined && activeJobIdRef.current !== onlyForJobId) return;
      const inicioCodificacion = Date.now();
      encodeCanvasToImage(canvasToEncode).then((enc) => {
        if (onlyForJobId !== undefined && activeJobIdRef.current !== onlyForJobId) return;
        const prev = globalTemplatePreviewCache.get(key) || {};
        globalTemplatePreviewCache.set(key, { ...prev, canvas: canvasToEncode, url: enc.dataUrl, blob: enc.blob, file: enc.file });
        setDataUrl(enc.dataUrl);
        setCachedBlob(enc.blob);
        setCachedFile(enc.file);
        // Persiste para que la proxima visita no tenga que dibujar ni codificar nada.
        if (enc.blob) writeCachedCapture(key, enc.blob);
        // El total de la generacion es dibujo + codificacion, no el tiempo desde
        // que se abrio el modal: eso daba cifras falsas si la modal seguia abierta.
        setPerf((previo) => {
          const ultima = { ...(previo?.ultima || {}), codificacionMs: Date.now() - inicioCodificacion };
          if (inicioDibujo) ultima.totalMs = Date.now() - inicioDibujo;
          return { ...(previo || {}), ultima };
        });
      }).catch((err) => {
        console.error('Error codificando la captura:', err);
      });
    };
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(run, { timeout: 1500 });
    } else {
      setTimeout(run, 200);
    }
  }, []);

  const handleClose = () => {
    if (isClosing) return;
    sounds.playBeep();
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 220);
  };

  // Entrance animation matching modern spring physics (rápido y a 60/120fps)
  useEffect(() => {
    if (modalRef.current) {
      gsap.fromTo(modalRef.current,
        { opacity: 0, scale: 0.95, y: 10 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.22,
          ease: 'power2.out',
          onComplete: () => {
            hasEnteredRef.current = true;
          }
        }
      );
    }
    const timer = setTimeout(() => {
      hasEnteredRef.current = true;
    }, 220);
    return () => clearTimeout(timer);
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
    const inicioPase = Date.now();
    if (spritesList.length === 0) {
      setDataUrl('');
      setCachedFile(null);
      setCachedBlob(null);
      setPreviewCanvas(null);
      setIsGenerating(false);
      return;
    }

    const currentKey = getCanvasCacheKey(format, bgStyle, spritesList.length, ownedInScope, spritesList, userState);
    const cached = globalTemplatePreviewCache.get(currentKey) || globalCanvasCache.get(currentKey);
    if (cached) {
      const url = typeof cached === 'string' ? cached : (cached.url || cached.dataUrl || '');
      const cachedCanvas = typeof cached === 'string' ? null : (cached.canvas || null);
      setPreviewCanvas(cachedCanvas);
      setDataUrl(url);
      setCachedFile(cached?.file || null);
      setCachedBlob(cached?.blob || null);
      setIsGenerating(false);
      if (cachedCanvas && !url) {
        // La precarga en reposo ya pudo dejar el archivo en disco: usarlo antes de
        // recodificar evita pagar dos veces la misma codificacion.
        const paseActual = activeJobIdRef.current;
        readCachedCapture(currentKey).then((guardada) => {
          if (activeJobIdRef.current !== paseActual) return;
          if (guardada) {
            setDataUrl(guardada.url);
            setCachedBlob(guardada.blob);
            setCachedFile(guardada.file);
          } else {
            queuePngEncode(cachedCanvas, currentKey);
          }
        });
      }
      if (showPerf) setPerf((previo) => ({ ...(previo || {}), cache: 'memoria', pasadaMs: Date.now() - inicioPase, revisitas: (previo?.revisitas || 0) + 1 }));
      return;
    }

    setIsGenerating(true);
    const jobId = ++activeJobIdRef.current;

    // Desacoplar la animación de apertura del modal (220ms) para que Android abra a 60/120fps fluidos.
    // Si el modal ya completó su entrada, usar un debounce suave de 60ms para evitar colisiones entre clics rápidos.
    const delay = hasEnteredRef.current ? 60 : 180;

    const timer = setTimeout(async () => {
      if (activeJobIdRef.current !== jobId) return;

      // Antes de dibujar nada: ¿esta misma captura ya se genero en este dispositivo?
      const guardada = await readCachedCapture(currentKey);
      if (activeJobIdRef.current !== jobId) return;
      if (guardada) {
        globalTemplatePreviewCache.set(currentKey, { canvas: null, url: guardada.url, blob: guardada.blob, file: guardada.file });
        setDataUrl(guardada.url);
        setCachedBlob(guardada.blob);
        setCachedFile(guardada.file);
        setIsGenerating(false);
        if (showPerf) setPerf((previo) => ({ ...(previo || {}), cache: 'disco', pasadaMs: Date.now() - inicioPase, revisitas: (previo?.revisitas || 0) + 1 }));
        return;
      }

      const inicioDibujo = Date.now();
      getOrStartCapture(currentKey, () => generatePokedexCardImage({
        spritesList,
        userState,
        format,
        bgStyle
      })).then((res) => {
        if (activeJobIdRef.current === jobId) {
          const canvasListo = res?.canvas || null;
          // La captura se pinta ya; el archivo llega despues sin bloquear la vista previa.
          setPreviewCanvas(canvasListo);
          globalTemplatePreviewCache.set(currentKey, { canvas: canvasListo, url: '', file: null, blob: null });
          setIsGenerating(false);
          if (showPerf) {
            setPerf((previo) => ({
              ...(previo || {}),
              cache: 'no',
              pasadaMs: Date.now() - inicioPase,
              generaciones: (previo?.generaciones || 0) + 1,
              ultima: {
                dibujoMs: Date.now() - inicioDibujo,
                // Se deja vacio a proposito: se rellena cuando termina la codificacion
                // de ESTA generacion, para no mostrar el tiempo de la anterior.
                codificacionMs: null,
                totalMs: null,
                lienzo: canvasListo ? canvasListo.width + 'x' + canvasListo.height : ''
              }
            }));
          }
          queuePngEncode(canvasListo, currentKey, jobId, inicioDibujo);
        }
      }).catch((err) => {
        if (activeJobIdRef.current === jobId) {
          console.error('Error generando imagen de plantilla:', err);
          setIsGenerating(false);
        }
      });
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [spritesList, userState, format, bgStyle, ownedInScope, queuePngEncode, showPerf]);

  // El canvas se inserta a mano para que React no lo recree en cada render.
  useEffect(() => {
    const host = previewHostRef.current;
    if (!host) return;
    if (previewCanvas) {
      previewCanvas.className = 'sdm-share-pro__preview-img';
      host.replaceChildren(previewCanvas);
    } else {
      host.replaceChildren();
    }
  }, [previewCanvas, isGenerating]);

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
    return `spritedex_${dateStr}_${timeStr}.jpg`;
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
        fileToUse = new File([blobToUse], getCaptureFilename(), { type: 'image/jpeg' });
      }

      // En iOS / iPhone Safari, la descarga sintética suele parpadear.
      // Usamos la Web Share API nativa sincrónica con el File ya precargado para "Guardar imagen" en el Carrete
      if (isIOS && fileToUse && navigator.canShare && navigator.canShare({ files: [fileToUse] })) {
        try {
          await navigator.share({
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
        fileToShare = new File([blob], getCaptureFilename(), { type: 'image/jpeg' });
      }

      // Invocación directa e instantánea sin perder el User Gesture en iOS Safari y Android Chrome
      // Se envía ÚNICAMENTE el archivo para que WhatsApp, Telegram y Facebook lo abran como foto limpia,
      // sin convertirlo en documento ni incrustar dimensiones o textos en el pie de imagen.
      if (fileToShare && navigator.canShare && navigator.canShare({ files: [fileToShare] })) {
        await navigator.share({
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

  // El medidor vive fuera de la tarjeta: dentro, el transform de la tarjeta ancla su
  // position fixed a la tarjeta y no a la pantalla, y se pierde.
  const medidorPerf = showPerf ? (
    <div className="sdm-share-perf">
      {perf?.ultima ? (
        <div>
          dibujo {perf.ultima.dibujoMs} ms · archivo {perf.ultima.codificacionMs ?? '—'} ms · total {perf.ultima.totalMs ?? '—'} ms
          {perf.ultima.lienzo ? ` · ${perf.ultima.lienzo}` : ''}
        </div>
      ) : null}
      <div>
        caché {perf?.cache || '…'} · pasada {perf?.pasadaMs ?? '…'} ms · generaciones {perf?.generaciones || 0} · repasadas {perf?.revisitas || 0}
      </div>
    </div>
  ) : null;

  return (
    <Modal
      onClose={handleClose}
      closeOnEscape={!isClosing}
      overlayClassName={isClosing ? 'is-closing' : ''}
      className={`sdm-share-pro ${isClosing ? 'is-closing' : ''}`}
      innerRef={modalRef}
      afterCard={medidorPerf}
    >
        {/* Header Elegante y Minimalista */}
        <div className="sdm-share-pro__header">
          <div className="sdm-share-pro__title-wrap">
            <div className="sdm-share-pro__icon-badge">
              <Sparkles size={18} color="#00F0E8" />
            </div>
            <div>
              <h2 className="sdm-share-pro__title" onPointerUp={manejarTapTitulo}>Exportar Colección</h2>
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
                  onClick={() => setScope(opt.id)}
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
                  onClick={() => setFormat(f.id)}
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
          ) : previewCanvas ? (
            <div className="sdm-share-pro__canvas-host" ref={previewHostRef} />
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

    </Modal>
  );
}
