import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, Download, Share2, Copy, Check, ChevronDown } from 'lucide-react';
import { pickName, THEMES_LIST, THEME_STYLES, pickThemeName, pickFamilyName } from '../data/spritesData';
import { generateSpritedexCardImage, encodeCanvasToImage, globalCanvasCache, getCanvasCacheKey, readCachedCapture, writeCachedCapture, getOrStartCapture, marcarEsperaActiva, DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE } from '../utils/canvasExporter';
import { sounds } from '../utils/audio';
import { safeStorage } from '../utils/safeStorage';
import gsap from 'gsap';
import { t } from '../i18n';

// Caché persistente global para previews de plantillas generadas (0ms instantáneo entre aperturas y formatos)
const globalTemplatePreviewCache = new Map();

// Firma del dueño: se recuerda en el dispositivo y decide si aparece en la lona.
const CLAVE_USUARIO = 'spritedex_fortnite_user';
const CLAVE_MOSTRAR_USUARIO = 'spritedex_fortnite_user_visible';
const LARGO_USUARIO = 24;

function usuarioGuardado() {
  const valor = safeStorage.getItem(CLAVE_USUARIO);
  return typeof valor === 'string' ? valor : '';
}

function mostrarUsuarioGuardado() {
  return safeStorage.getItem(CLAVE_MOSTRAR_USUARIO) !== 'false';
}

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

// Desplegable de la pagina de compartir. Es el mismo lenguaje que los filtros de la app
// (la lista se abre bajo el boton y se cierra al tocar fuera), pero con el ancho de su
// columna para que no se salga del panel. El color identifica la variante, como en la app.
function Desplegable({ etiqueta, valor, opciones, abierto, onAlternar, onElegir, anchoTodo }) {
  const actual = opciones.find((o) => o.id === valor);
  return (
    <div className={`sdm-share-pro__dd${anchoTodo ? ' sdm-share-pro__dd--ancho' : ''}`}>
      <span className="sdm-share-pro__seg-label">{etiqueta}</span>
      <button
        type="button"
        className={`sdm-share-pro__dd-trigger${abierto ? ' is-open' : ''}`}
        onClick={onAlternar}
        aria-expanded={abierto}
      >
        <span>{actual ? actual.nombre : (opciones[0] ? opciones[0].nombre : '')}</span>
        <ChevronDown size={13} />
      </button>
      {abierto && (
        <>
          <div className="sdm-share-pro__dd-backdrop" onClick={onAlternar} />
          <div className="sdm-share-pro__dd-menu">
            {opciones.map((o) => (
              <button
                key={o.id}
                type="button"
                className={`sdm-share-pro__dd-item${valor === o.id ? ' is-active' : ''}`}
                style={o.color ? { background: o.color } : undefined}
                onClick={() => onElegir(o.id)}
              >
                <span>{o.nombre}</span>
                {o.n ? <span className="sdm-share-pro__dd-n">{o.n}</span> : null}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function SharePage({ filteredSprites, allSprites, userState, activeFiltersLabel, onBack, enlaceColeccion }) {
  const [format, setFormat] = useState(DEFAULT_EXPORT_FORMAT); // 'checklist', 'square'
  const [scope, setScope] = useState('all'); // Default to 'all' of current active generation
  const [bgStyle] = useState(DEFAULT_EXPORT_BG_STYLE); // 'glitch_override', 'blueprint', 'dark_matrix'
  // Filtros de la lona: se aplican encima del alcance. Antes habia que volver a la app para
  // dejar la lista filtrada; ahora la lona se arma aqui mismo.
  const [familia, setFamilia] = useState('all');
  const [variante, setVariante] = useState('all');
  // Solo un desplegable abierto a la vez: formato, familia o variante.
  const [menuAbierto, setMenuAbierto] = useState('');
  const [fortniteUser, setFortniteUser] = useState(usuarioGuardado);
  const [mostrarUsuario, setMostrarUsuario] = useState(mostrarUsuarioGuardado);
  const firma = mostrarUsuario ? fortniteUser.trim() : '';

  // El nombre se guarda en el dispositivo segun se escribe: no hay boton de guardar.
  const cambiarUsuario = useCallback((valor) => {
    const limpio = String(valor || '').slice(0, LARGO_USUARIO);
    setFortniteUser(limpio);
    safeStorage.setItem(CLAVE_USUARIO, limpio);
  }, []);

  const cambiarMostrarUsuario = useCallback((visible) => {
    setMostrarUsuario(visible);
    safeStorage.setItem(CLAVE_MOSTRAR_USUARIO, visible ? 'true' : 'false');
  }, []);

  // Clave de preview canónica para mostrar la plantilla en 0ms si ya está en caché
  const initialCount = allSprites.length;
  const initialOwned = allSprites.filter(s => userState[s.id]?.owned).length;
  const initialCacheKey = getCanvasCacheKey(DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE, initialCount, initialOwned, allSprites, userState, firma);
  const initialCached = globalTemplatePreviewCache.get(initialCacheKey) || globalCanvasCache.get(initialCacheKey);

  const [dataUrl, setDataUrl] = useState(() => initialCached?.url || initialCached?.dataUrl || (typeof initialCached === 'string' ? initialCached : ''));
  const [cachedFile, setCachedFile] = useState(() => initialCached?.file || null);
  const [cachedBlob, setCachedBlob] = useState(() => initialCached?.blob || null);
  const [previewCanvas, setPreviewCanvas] = useState(() => initialCached?.canvas || null);
  const [isGenerating, setIsGenerating] = useState(() => !initialCached);
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
  const hasEnteredRef = useRef(false);
  const previewHostRef = useRef(null);
  // Clave vigente del preview. Los pases viejos quedan descartados por CLAVE (antes se
  // comparaba un contador de trabajos y un pase de fondo podia descartar un resultado
  // valido: la vista se quedaba con la lona anterior hasta el siguiente pase de fondo).
  const activeKeyRef = useRef('');

  // Mientras la modal esta abierta hay alguien esperando: el dibujo deja de ceder
  // turno buscando reposo y termina cuanto antes (medido: menos espera sin bloquear).
  useEffect(() => {
    marcarEsperaActiva(true);
    return () => marcarEsperaActiva(false);
  }, []);

  // Codifica el PNG fuera del camino critico: primero se pinta la captura y despues,
  // en reposo, se prepara el archivo de Descargar/Compartir. Son 2-6 s menos de espera.
  const queuePngEncode = useCallback((canvasToEncode, key, inicioDibujo) => {
    if (!canvasToEncode) return;
    const run = () => {
      // Si mientras tanto la vista cambio de clave, esta codificacion ya no pinta nada.
      if (activeKeyRef.current !== key) return;
      const inicioCodificacion = Date.now();
      encodeCanvasToImage(canvasToEncode).then((enc) => {
        if (activeKeyRef.current !== key) return;
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

  // Antes era una modal y cerraba con animacion; ahora es una vista propia: volver es navegar.
  const handleBack = () => {
    onBack();
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

  // Que espiritus entran en la lona: primero el alcance y encima los filtros de la lona.
  // Los dos se suman (elegir "Faltantes" y una familia da las que faltan de esa familia).
  const spritesList = useMemo(() => {
    const porAlcance = (() => {
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
    })();
    return porAlcance.filter((s) =>
      (familia === 'all' || s.familyId === familia) &&
      (variante === 'all' || s.variant === variante)
    );
  }, [scope, filteredSprites, allSprites, userState, familia, variante]);

  // Opciones de los desplegables. Las familias y variantes salen de lo que hay en la lona,
  // asi nunca se ofrece algo que dejaria la captura vacia. La familia lleva cuantas fichas
  // aporta y la variante lleva su color, el mismo que usa el filtro de la app.
  const opcionesFamilia = useMemo(() => {
    const cuenta = new Map();
    for (const s of allSprites) {
      if (!s.familyId) continue;
      cuenta.set(s.familyId, (cuenta.get(s.familyId) || 0) + 1);
    }
    const lista = [...cuenta.entries()]
      .map(([id, n]) => ({ id, nombre: pickFamilyName(id) || id, n }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    return [{ id: 'all', nombre: t('filtros.todas') }, ...lista];
  }, [allSprites]);

  const opcionesVariante = useMemo(() => {
    const presentes = new Set(allSprites.map((s) => s.variant).filter(Boolean));
    const lista = THEMES_LIST.filter((v) => presentes.has(v)).map((v) => {
      const color = (THEME_STYLES[v] || {}).border;
      return {
        id: v,
        nombre: pickThemeName(v) || v,
        color: color ? `linear-gradient(135deg, ${color} 0%, #1b1c23 140%)` : undefined
      };
    });
    return [{ id: 'all', nombre: t('filtros.todas') }, ...lista];
  }, [allSprites]);

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

  // Progreso de TODA la coleccion: es el que pinta el HUD de la lona cuando la lista
  // exportada es parcial (Nuevos, Atrapados, Faltantes). El "% completado" de la lista
  // filtrada engannaba: 0 de 3 nuevos salia como 0% aunque la coleccion este al 79%.
  const generalOwned = useMemo(() => allSprites.filter(s => userState[s.id]?.owned).length, [allSprites, userState]);
  const pctGeneral = allSprites.length > 0 ? Math.round((generalOwned / allSprites.length) * 100) : 0;
  const alcance = scope === 'all' ? 'all' : scope;
  // Memoizado: el efecto de generacion lo usa en sus dependencias y un objeto nuevo por
  // render dispararia una captura por cada repintado del modal.
  const progresoGeneral = useMemo(
    () => (scope === 'all' ? null : { owned: generalOwned, total: allSprites.length }),
    [scope, generalOwned, allSprites]
  );

  const subtitulo = useMemo(() => {
    const general = { ownedG: generalOwned, totalG: allSprites.length, pctG: pctGeneral };
    if (scope === 'new') return t('compartir.subtituloNuevos', { owned: ownedInScope, total: spritesList.length, ...general });
    if (scope === 'owned') return t('compartir.subtituloAtrapados', { count: spritesList.length, ...general });
    if (scope === 'missing') return t('compartir.subtituloFaltantes', { count: spritesList.length, ...general });
    return t('compartir.subtitulo', { owned: ownedInScope, total: spritesList.length, pct: pctInScope });
  }, [scope, ownedInScope, spritesList, generalOwned, pctGeneral, allSprites, pctInScope]);

  // Trigger canvas generation on setting changes with instant in-memory preview cache
  useEffect(() => {
    const inicioPase = Date.now();
    if (spritesList.length === 0) {
      activeKeyRef.current = '';
      setDataUrl('');
      setCachedFile(null);
      setCachedBlob(null);
      setPreviewCanvas(null);
      setIsGenerating(false);
      return;
    }

    const currentKey = getCanvasCacheKey(format, bgStyle, spritesList.length, ownedInScope, spritesList, userState, firma, alcance, progresoGeneral?.owned ?? null, progresoGeneral?.total ?? null);
    // Este pase pasa a ser el vigente: cualquier resultado de una clave anterior se descarta.
    activeKeyRef.current = currentKey;
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
        const paseKey = currentKey;
        readCachedCapture(currentKey).then((guardada) => {
          if (activeKeyRef.current !== paseKey) return;
          if (guardada) {
            setDataUrl(guardada.url);
            setCachedBlob(guardada.blob);
            setCachedFile(guardada.file);
          } else {
            queuePngEncode(cachedCanvas, currentKey);
          }
        });
      }
      if (showPerf) setPerf((previo) => ({ ...(previo || {}), cache: t('compartir.cacheMemoria'), pasadaMs: Date.now() - inicioPase, revisitas: (previo?.revisitas || 0) + 1 }));
      return;
    }

    setIsGenerating(true);

    // Desacoplar la animación de apertura del modal (220ms) para que Android abra a 60/120fps fluidos.
    // Si el modal ya completó su entrada, usar un debounce suave de 60ms para evitar colisiones entre clics rápidos.
    const delay = hasEnteredRef.current ? 60 : 180;

    const timer = setTimeout(async () => {
      if (activeKeyRef.current !== currentKey) return;

      // Antes de dibujar nada: ¿esta misma captura ya se genero en este dispositivo?
      // Con watchdog: si la lectura de disco tarda o se queda colgada, se sigue dibujando.
      const guardada = await Promise.race([
        readCachedCapture(currentKey),
        new Promise((r) => setTimeout(() => r(null), 2000))
      ]);
      if (activeKeyRef.current !== currentKey) return;
      if (guardada) {
        globalTemplatePreviewCache.set(currentKey, { canvas: null, url: guardada.url, blob: guardada.blob, file: guardada.file });
        setDataUrl(guardada.url);
        setCachedBlob(guardada.blob);
        setCachedFile(guardada.file);
        setIsGenerating(false);
        if (showPerf) setPerf((previo) => ({ ...(previo || {}), cache: t('compartir.cacheDisco'), pasadaMs: Date.now() - inicioPase, revisitas: (previo?.revisitas || 0) + 1 }));
        return;
      }

      const inicioDibujo = Date.now();
      getOrStartCapture(currentKey, () => generateSpritedexCardImage({
        spritesList,
        userState,
        format,
        bgStyle,
        usuario: firma,
        alcance,
        progresoGeneral
      })).then((res) => {
        if (activeKeyRef.current === currentKey) {
          const canvasListo = res?.canvas || null;
          // La captura se pinta ya; el archivo llega despues sin bloquear la vista previa.
          setPreviewCanvas(canvasListo);
          globalTemplatePreviewCache.set(currentKey, { canvas: canvasListo, url: '', file: null, blob: null });
          setIsGenerating(false);
          if (showPerf) {
            setPerf((previo) => ({
              ...(previo || {}),
              cache: t('compartir.cacheNo'),
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
          queuePngEncode(canvasListo, currentKey, inicioDibujo);
        }
      }).catch((err) => {
        if (activeKeyRef.current === currentKey) {
          console.error('Error generando imagen de plantilla:', err);
          setIsGenerating(false);
        }
      });
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [spritesList, userState, format, bgStyle, ownedInScope, queuePngEncode, showPerf, scope, generalOwned, alcance, progresoGeneral]);

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

  // Texto para pegar donde no cabe una imagen (Discord, Reddit, foros). Solo entra lo que se
  // puede intercambiar de verdad (fuera los que no sueltan nada todavia) y en el orden del
  // catalogo, que es el que la persona ya conoce de la app: la probabilidad no se usa como
  // criterio en ninguna parte, asi que no se inventa aqui. Remata con el enlace a la
  // coleccion, para que el "y N mas" tenga respuesta.
  const LINEAS_TEXTO = 15;
  const getShareableText = () => {
    const total = spritesList.length;
    const owned = spritesList.filter(s => userState[s.id]?.owned).length;
    const mastered = spritesList.filter(s => userState[s.id]?.owned && userState[s.id]?.level === 5).length;
    const missing = spritesList.filter(s => !userState[s.id]?.owned);
    const intercambiables = missing.filter((m) => !m.unreleased && Number(m.dropChanceNum) > 0);

    const scopeLabels = {
      all: t('compartir.scopeCompleta'),
      new: t('compartir.scopeNuevos'),
      filtered: t('compartir.scopeFiltrado', { filtro: activeFiltersLabel }),
      owned: t('compartir.scopeDesencriptados'),
      missing: t('compartir.scopeFaltantes'),
      mastered: t('compartir.scopeMaxeados')
    };

    let text = t('compartir.textoTitulo') + '\n';
    text += t('compartir.textoDesencriptados', { owned, total, pct: total > 0 ? Math.round((owned / total) * 100) : 0 });
    text += ' · ' + t('compartir.textoMaxeados', { n: mastered }) + '\n';
    text += t('compartir.textoVista', { vista: scopeLabels[scope] || t('compartir.plantilla') }) + '\n\n';

    if (intercambiables.length > 0) {
      text += t('compartir.textoBusco', { n: intercambiables.length }) + '\n';
      intercambiables.slice(0, LINEAS_TEXTO).forEach((m) => {
        text += `- ${pickName(m)}\n`;
      });
      if (intercambiables.length > LINEAS_TEXTO) text += t('compartir.textoMas', { n: intercambiables.length - LINEAS_TEXTO }) + '\n';
      text += '\n';
    } else if (missing.length === 0) {
      text += t('compartir.textoCompleto', { owned, total }) + '\n\n';
    }

    if (enlaceColeccion) text += t('compartir.textoEnlace', { enlace: enlaceColeccion }) + '\n';
    if (intercambiables.length > 0) text += t('compartir.textoIntercambio') + '\n';
    text += '\n' + t('compartir.textoEtiquetas');

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
          title: t('compartir.tituloCompartir'),
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

  // El medidor vive fuera de la tarjeta: dentro, el transform de la tarjeta ancla su
  // position fixed a la tarjeta y no a la pantalla, y se pierde.
  const medidorPerf = showPerf ? (
    <div className="sdm-share-perf">
      {perf?.ultima ? (
        <div>
          {t('compartir.perfLinea', { dibujo: perf.ultima.dibujoMs, archivo: perf.ultima.codificacionMs ?? '—', total: perf.ultima.totalMs ?? '—' })}
          {perf.ultima.lienzo ? ` · ${perf.ultima.lienzo}` : ''}
        </div>
      ) : null}
      <div>
        {t('compartir.perfResumen', { cache: perf?.cache || '…', pasada: perf?.pasadaMs ?? '…', generaciones: perf?.generaciones || 0, repasadas: perf?.revisitas || 0 })}
      </div>
    </div>
  ) : null;

  return (
    <div className="spage">
      {medidorPerf}
      {/* El layout de la vista vive en el CSS (grid areas sobre estas clases). */}
      <div className="sdm-share-pro" ref={modalRef}>
        {/* Header Elegante y Minimalista */}
        <div className="sdm-share-pro__header">
          <button className="fpage__back" onClick={handleBack} aria-label={t('compartir.volver')} title={t('compartir.volver')}>
            <ArrowLeft size={20} />
          </button>
          <div className="sdm-share-pro__title-wrap">
            <div>
              <h2 className="sdm-share-pro__title" onPointerUp={manejarTapTitulo}>{t('compartir.titulo')}</h2>
              <p className="sdm-share-pro__subtitle">
                {subtitulo}
              </p>
            </div>
          </div>
        </div>

        {/* Toolbar de Configuración Compacta */}
        <div className="sdm-share-pro__controls">
          <div className="sdm-share-pro__seg-group">
            <span className="sdm-share-pro__seg-label">{t('compartir.mostrar')}</span>
            <div className="sdm-share-pro__segmented">
              {[
                { id: 'all', label: t('compartir.todos') },
                { id: 'new', label: t('compartir.nuevos') },
                { id: 'owned', label: t('compartir.atrapados') },
                { id: 'missing', label: t('compartir.faltantes') }
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

          <Desplegable
            etiqueta={t('compartir.familia')}
            valor={familia}
            opciones={opcionesFamilia}
            abierto={menuAbierto === 'familia'}
            onAlternar={() => setMenuAbierto(menuAbierto === 'familia' ? '' : 'familia')}
            onElegir={(id) => { setFamilia(id); setMenuAbierto(''); }}
          />

          <Desplegable
            etiqueta={t('compartir.variante')}
            valor={variante}
            opciones={opcionesVariante}
            abierto={menuAbierto === 'variante'}
            onAlternar={() => setMenuAbierto(menuAbierto === 'variante' ? '' : 'variante')}
            onElegir={(id) => { setVariante(id); setMenuAbierto(''); }}
          />

          {/* El formato va despues de los filtros: primero se elige QUE entra en la lona y
              luego como se compone. El desplegable ya trae su etiqueta. */}
          <Desplegable
            etiqueta={t('compartir.formato')}
            valor={format}
            opciones={[
              { id: 'checklist', nombre: t('compartir.vertical') },
              { id: 'square', nombre: t('compartir.horizontal') }
            ]}
            abierto={menuAbierto === 'formato'}
            onAlternar={() => setMenuAbierto(menuAbierto === 'formato' ? '' : 'formato')}
            onElegir={(id) => { setFormat(id); setMenuAbierto(''); }}
          />

          <div className="sdm-share-pro__seg-group sdm-share-pro__seg-group--ancho">
            <span className="sdm-share-pro__seg-label">{t('compartir.usuario')}</span>
            <div className="sdm-share-pro__user-row">
              <input
                className="sdm-share-pro__input"
                type="text"
                value={fortniteUser}
                maxLength={LARGO_USUARIO}
                placeholder={t('compartir.usuarioPlaceholder')}
                onChange={(e) => cambiarUsuario(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <div className="sdm-share-pro__segmented">
                <button
                  className={`sdm-share-pro__seg-btn ${mostrarUsuario ? 'sdm-share-pro__seg-btn--active' : ''}`}
                  onClick={() => cambiarMostrarUsuario(true)}
                >
                  {t('compartir.usuarioCon')}
                </button>
                <button
                  className={`sdm-share-pro__seg-btn ${!mostrarUsuario ? 'sdm-share-pro__seg-btn--active' : ''}`}
                  onClick={() => cambiarMostrarUsuario(false)}
                >
                  {t('compartir.usuarioSin')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Vista Previa Central HD */}
        <div className="sdm-share-pro__preview-wrap">
          {spritesList.length === 0 ? (
            <div className="sdm-share-pro__empty">
              {t('compartir.vacio')}
            </div>
          ) : isGenerating ? (
            <div className="sdm-share-pro__loading">
              <div className="sdm-share-pro__spinner" />
              <span>{t('compartir.generando')}</span>
            </div>
          ) : previewCanvas ? (
            <div className="sdm-share-pro__canvas-host" ref={previewHostRef} />
          ) : (
            <img
              src={dataUrl || undefined}
              alt={t('compartir.altPreview')}
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
            title={t('compartir.titleCopiarResumen')}
          >
            {copiedText ? <Check size={15} color="#4ade80" /> : <Copy size={15} />}
            <span>{copiedText ? t('compartir.textoCopiado') : t('compartir.copiarTexto')}</span>
          </button>

          <button
            className="sdm-share-pro__btn sdm-share-pro__btn--share"
            onClick={handleNativeShare}
            disabled={!dataUrl}
            title={t('compartir.titleCompartir')}
          >
            <Share2 size={15} />
            <span>{t('compartir.compartir')}</span>
          </button>

          <button
            className="sdm-share-pro__btn sdm-share-pro__btn--download sdm-share__glitch-btn"
            onClick={handleDownload}
            disabled={!dataUrl}
            title={t('compartir.titleDescargar')}
            data-text={t('compartir.descargarMayus')}
          >
            <Download size={15} className="sdm-share__btn-icon" />
            <span className="sdm-share__btn-text">{t('compartir.descargar')}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
