import React, { useState, useEffect, useMemo, useCallback, useDeferredValue, useRef, lazy, Suspense } from 'react';
import { VARIANT_ORDER, FAMILY_NAMES_MAP, pickFamilyName } from './data/spritesData';
import { t } from './i18n';

const getVariantPriority = (v) => {
  if (v === 'Base' || v === 'Basic') return 0;
  if (v === 'Gold') return 1;
  if (v === 'Cheatmaster' || v === 'Cheat Master') return 2;
  if (v === 'Loot Hacker' || v === 'LootHacker') return 3;
  const idx = VARIANT_ORDER.indexOf(v);
  return idx === -1 ? 99 : idx;
};
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { FilterBar } from './components/FilterBar';
import { SpriteCard } from './components/SpriteCard';
import { SpriteDetailModal } from './components/SpriteDetailModal';
import { PrivacyNotice } from './components/PrivacyNotice';
import { ClaimAccountBanner } from './components/ClaimAccountBanner';
import { InstallPrompt } from './components/InstallPrompt';
import { Footer } from './components/Footer';
import { FriendsPage } from './components/FriendsPage';
import { MobileSpriteSwiper } from './components/MobileSpriteSwiper';
import { FortnitemaresTransition } from './components/FortnitemaresTransition';
import { applySeasonalTheme, isFortnitemaresActive, subscribeSeasonalState } from './config/seasonalEvent';
import { useIsMobile } from './hooks/useIsMobile';
import { useDynamicSprites } from './hooks/useDynamicSprites';
import { trackEvent, resolveCountry } from './utils/telemetry';
import { isUserAdminAuthenticated } from './utils/adminAuth';
import { decodeCollectionState } from './utils/shareLink';
import { fetchCollectionByShareToken } from './utils/friendCode';
import { getSupabase, warmSupabase, isSupabaseConfigured, shouldSkipAnonymousAuth } from './utils/supabase';
import { conGoogle } from './utils/authActions';
import { mergeCollections, sinPerfil } from './utils/mergeCollections';
import { estadoAlTocarNivel } from './utils/niveles';
import { setSyncSession, queueCloudSync, clearCloudSync, flushCloudSync } from './utils/pendingSync';
import { safeStorage } from './utils/safeStorage';
import {
  getMyFriendCode,
  fetchCollectionByFriendCode,
  subscribeToFriendCollection,
  saveLastConnectedFriendCode,
  getLastConnectedFriendCode
} from './utils/friendCode';
import { getLang, conIdioma, rutaSinIdioma } from './i18n';
import { codigoFichaEnRuta } from './utils/visitaEnlace';
import { codigoNormalizado } from './utils/fichaAmigo';
import { isDeadSessionError } from './utils/deadSession';
import { useFriendRequests } from './hooks/useFriendRequests';

// Carga diferida (code splitting) para modales secundarios y suite administrativa
// El precalculo de la captura no arranca antes de este margen desde que se abre la app,
// ni mientras el usuario lleve menos de PRECALCULO_CALMA_MS sin tocar nada.
const ARRANQUE_APP = Date.now();
const PRECALCULO_MIN_MS = 4000;
const PRECALCULO_CALMA_MS = 2000;

const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const AdminAuthGate = lazy(() => import('./components/admin/AdminAuthGate').then(m => ({ default: m.AdminAuthGate })));
const ShareImageModal = lazy(() => import('./components/ShareImageModal').then(m => ({ default: m.ShareImageModal })));
const BackupModal = lazy(() => import('./components/BackupModal').then(m => ({ default: m.BackupModal })));
const FriendCompareModal = lazy(() => import('./components/FriendCompareModal').then(m => ({ default: m.FriendCompareModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const PrivacyPolicyModal = lazy(() => import('./components/PrivacyPolicyModal').then(m => ({ default: m.PrivacyPolicyModal })));

const LOCAL_STORAGE_KEY = 'fortnite_sprites_pokedex_v3';
const LOCAL_STATE_UPDATED_KEY = 'spritedex_state_updated_at_v1';
// Copia recuperable del progreso. Un invitado que cierra sesion pierde el acceso a su
// cuenta anonima (documentacion de Supabase), asi que borrar la copia local equivale a
// perder la coleccion para siempre. Se guarda aqui y se restaura sola.
const RECOVERY_STORAGE_KEY = 'spritedex_state_recovery_v1';
const RECOVERY_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
// Aviso de reclamo progresivo: una sola vez por navegador, no una vez por sesion. El
// marcador es local a proposito: el aviso persigue al invitado, que por definicion no
// tiene cuenta donde guardarlo.
const CLAVE_AVISO_RECLAMO = 'spritedex_claim_aviso_v1';
// Retraso desde que se cumple la condicion: la modal no puede competir con el primer pintado.
const AVISO_RECLAMO_RETRASO_MS = 2000;

export function App() {
  const isMobile = useIsMobile(600);
  const { sprites: dynamicSprites, refreshDynamicSprites } = useDynamicSprites();
  // Lector unico de la red de amigos para el badge del header: la pagina de Amigos y el
  // modal siguen con su propia instancia, asi que esto no altera su comportamiento.
  const { recibidas: solicitudesRecibidas } = useFriendRequests();
  const solicitudesNuevas = solicitudesRecibidas.length;

  // Detección de ruta secreta /portal-override /studio-override o ?studio=true
  const [isAdminPortal, setIsAdminPortal] = useState(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    return path.startsWith('/studio-override') ||
           path.startsWith('/nexus-core') ||
           path.startsWith('/portal-override') ||
           params.has('studio') ||
           params.get('portal') === 'studio';
  });

  const [isAdminAuth, setIsAdminAuth] = useState(() => isUserAdminAuthenticated());

  // Registro de telemetría de visita al cargar la web (solo usuarios públicos reales)
  useEffect(() => {
    if (!isAdminPortal && !isAdminAuth && !isUserAdminAuthenticated()) {
      trackEvent('pageview');
    }
  }, [isAdminPortal, isAdminAuth]);

  // Presencia en Vivo por WebSockets (Supabase Realtime Presence)
  // Permite saber instantáneamente cuándo un usuario entra y cuándo cierra la pestaña/sale (1 segundo)
  useEffect(() => {
    if (!isSupabaseConfigured || isAdminPortal || isAdminAuth || isUserAdminAuthenticated()) return undefined;

    let presenceChannel = null;
    let cancelled = false;

    (async () => {
      const supabase = await getSupabase();
      if (!supabase || cancelled) return;
      presenceChannel = supabase.channel('online_spritedex_users');
      presenceChannel
        .on('presence', { event: 'sync' }, () => {})
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            try {
              await presenceChannel.track({
                online_at: new Date().toISOString()
              });
            } catch (e) {}
          }
        });
    })();

    return () => {
      cancelled = true;
      try {
        if (presenceChannel) {
          presenceChannel.untrack();
          getSupabase().then((sb) => sb && sb.removeChannel(presenceChannel));
        }
      } catch (e) {}
    };
  }, [isAdminPortal, isAdminAuth]);

  // Seasonal theme: apply on boot, then keep it in sync while the tab stays
  // open (boundary timer plus visibility/focus re-checks).
  useEffect(() => {
    applySeasonalTheme(isFortnitemaresActive());
    const unsubscribe = subscribeSeasonalState((active) => {
      window.dispatchEvent(new CustomEvent('spritedex:season-change', { detail: { active } }));
    });
    return unsubscribe;
  }, []);


  const [userState, setUserState] = useState(() => {
    try {
      const saved = safeStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Friend State & Realtime Connection
  const [myFriendCode, setMyFriendCode] = useState(() => getMyFriendCode());
  // Token de compartir: se lee de la nube al arrancar y se cachea para poder montar el
  // enlace al instante. Es lo que permite revocar (rotandolo) sin cambiar tu identidad.
  const [myShareToken, setMyShareToken] = useState(() => safeStorage.getItem('spritedex_share_token') || '');
  const [connectedFriendCode, setConnectedFriendCode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('code') || getLastConnectedFriendCode() || '';
  });
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [shareToken] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('share') || '';
  });
  // Codigo del dueño, resuelto desde el token, y aviso si el enlace no sirve.
  const [codigoDeToken, setCodigoDeToken] = useState('');
  const [tokenSinResultado, setTokenSinResultado] = useState(false);

  const [friendState, setFriendState] = useState(() => {
    const friendParam = new URLSearchParams(window.location.search).get('friend');
    return friendParam ? decodeCollectionState(friendParam) : null;
  });
  // Identidad de lo que esta cargado ahora mismo: el codigo y el dueño de la colección que
  // se ve en la ficha. Es la señal de "ya cargado", y NO connectedFriendCode: el enlace por
  // token nunca escribe ese estado, y un valor viejo de localStorage puede no coincidir con
  // lo que hay en pantalla.
  const [codigoCargado, setCodigoCargado] = useState('');
  const [userIdCargado, setUserIdCargado] = useState('');

  const [activeProfile, setActiveProfile] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    // Un enlace por token (?share=) es una VISITA, no un modo: te deja en la pagina de
    // amigos, que es donde se ve la coleccion compartida. Por eso no enciende MODO AMIGO;
    // si lo encendiera, al volver a la app aparecia el cartel sin que nadie lo pidiera.
    // ?code= y ?friend= si son "conectar con alguien": esos mantienen el modo amigo.
    return params.has('friend') || params.has('code') ? 'friend' : 'mine';
  });

  // Supabase Auth & Cloud Sync State
  const [user, setUser] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Identidades cuya sesion ya se reinicio en esta pestaña. Si el mismo error vuelve a
  // llegar (el reintento del debounce, o dos sincronizaciones a la vez), no se cierra
  // sesion otra vez ni se encadenan identidades nuevas sin parar.
  const deadSessionHandled = useRef(new Set());

  // Filters matching fortnite.gg
  const [activeGen, setActiveGen] = useState(2); // 2 = 2ª Generación (GLITCH) by default!
  const [searchQuery, setSearchQuery] = useState('');
  // La busqueda se difiere: teclear no bloquea el pintado de la grilla.
  const deferredSearch = useDeferredValue(searchQuery);
  const [baseFilter, setBaseFilter] = useState('all'); // BASE = variant/theme
  const [spriteFilter, setSpriteFilter] = useState('all'); // SPRITE = family
  const [statusFilter, setStatusFilter] = useState('all'); // STATUS = all/owned/missing
  const [sortBy, setSortBy] = useState('default'); // SORT BY
  const [showUnreleased, setShowUnreleased] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Modals
  const [selectedSprite, setSelectedSprite] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showFooterPrivacyModal, setShowFooterPrivacyModal] = useState(false);

  // Update myFriendCode when user logs in
  useEffect(() => {
    if (user?.id) {
      const code = getMyFriendCode(user.id, Boolean(user.is_anonymous));
      setMyFriendCode(code);
    }
  }, [user]);

  // A) Cargar la colección conectada: una sola vez por codigo. Si el codigo conectado ya es
  // el cargado, el clic que lo pidio ya trajo la colección: se salta el fetch de mas.
  useEffect(() => {
    if (!connectedFriendCode) { setUserIdCargado(''); return undefined; }
    if (codigoNormalizado(connectedFriendCode) === codigoNormalizado(codigoCargado)) return undefined;
    let cancelado = false;
    fetchCollectionByFriendCode(connectedFriendCode).then((data) => {
      if (cancelado || !data || !data.userState) return;
      setFriendState(data.userState);
      const codigo = data.friendCode || connectedFriendCode;
      setCodigoCargado(codigo);
      setUserIdCargado(data.userId || '');
      saveLastConnectedFriendCode(codigo);
    });
    return () => { cancelado = true; };
  }, [connectedFriendCode, codigoCargado]);

  // B) En vivo: una sola suscripcion por dueño cargado. El tiempo real vive aparte de la
  // carga; asi cargar y suscribir no se pisan en el mismo efecto.
  useEffect(() => {
    if (!userIdCargado) { setIsLiveConnected(false); return undefined; }
    setIsLiveConnected(true);
    return subscribeToFriendCollection(userIdCargado, (liveState) => setFriendState(liveState));
  }, [userIdCargado]);

  // Enlace por token: se lee la coleccion compartida. No abre tiempo real (es una foto y
  // el visitante no tiene por que ser amigo), asi que la etiqueta no dice "en vivo".
  useEffect(() => {
    if (!shareToken) return undefined;
    let cancelado = false;
    fetchCollectionByShareToken(shareToken).then((data) => {
      if (cancelado) return;
      if (!data || !data.userState) {
        // El enlace caduco o se roto: se dice, en vez de dejar la pagina vacia.
        setTokenSinResultado(true);
        return;
      }
      setFriendState(data.userState);
      // La ficha de la pagina de amigos se dibuja con el codigo en la ruta; con un enlace
      // por token hay que darselo desde aqui o la pagina queda en blanco.
      const codigo = data.friendCode || '';
      setCodigoDeToken(codigo);
      // La visita por token SI es una coleccion ya cargada, asi que la ficha no ofrece
      // cargarla otra vez. Lo que NO hace es tocar userIdCargado: el visitante no tiene por
      // que ser amigo, y sin dueño no se abre tiempo real.
      setCodigoCargado(codigo);
    });
    return () => { cancelado = true; };
  }, [shareToken]);

  // Precarga silenciosa no bloqueante en reposo (idle) para que la exportación sea instantánea
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const idleTimer = setTimeout(() => {
      // 1. Precarga del chunk del modal en la caché del navegador
      import('./components/ShareImageModal');

      // 2. Precarga en reposo de las MINIATURAS que usara el export (por lotes de 10),
      // para que compartir sea instantaneo. Son ~1,5 MB por generacion, no los 19 MB
      // de originales que se precargaban antes. Se salta con ahorro de datos o 2G.
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const slowConnection = Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
      if (slowConnection) return;

      import('./utils/canvasExporter').then(({ preloadCanvasAssets }) => {
        // Solo la generacion activa: es exactamente lo que exporta la modal, porque
        // App ya le pasa allSprites filtrado por activeGen. Precargar el catalogo
        // completo eran ~3 MB en movil compitiendo con la generacion de la captura.
        const preloadList = activeGen === 0
          ? dynamicSprites
          : dynamicSprites.filter((s) => s.gen === activeGen);
        if (preloadList && preloadList.length > 0) {
          // Tandas de 4 (antes 30): el objetivo es que la captura este lista cuando el
          // usuario la abra, no bajar 1,8 MB de golpe mientras se pinta la app.
          preloadCanvasAssets(preloadList, 4);
        }
      });
    }, 1500);

    return () => clearTimeout(idleTimer);
  }, [dynamicSprites, activeGen]);

  // Listen to Supabase Auth State & Sync Cloud Data
  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let subscription = null;
    let cancelled = false;

    (async () => {
      // Espera al final del load: la descarga del SDK no debe competir con el primer pintado.
      await warmSupabase();
      const supabase = await getSupabase();
      if (!supabase || cancelled) return;

      const { data: { session } } = await supabase.auth.getSession();
      setSyncSession(session);
      let currentUser = session?.user ?? null;

      // Inicialización silenciosa de sesión en segundo plano para que el código de amigo
      // y la colección del usuario queden respaldados y accesibles para sus amigos en Supabase.
      if (!currentUser && !shouldSkipAnonymousAuth()) {
        try {
          const { data: anonData } = await supabase.auth.signInAnonymously();
          if (anonData?.user) {
            currentUser = anonData.user;
          }
        } catch (e) {
          console.warn('Silent anonymous sync on init notice:', e);
        }
      }

      if (cancelled) return;
      setUser(currentUser);
      if (currentUser) {
        setShowAuthModal(false);
        loadUserCollectionFromCloud(currentUser.id);
      }

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSyncSession(session);
        const nextUser = session?.user ?? null;
        setUser(nextUser);
        if (nextUser) {
          setShowAuthModal(false);
          loadUserCollectionFromCloud(nextUser.id);
        } else if (_event === 'SIGNED_OUT') {
          handleSignOutCleanup();
        }
      });
      subscription = data.subscription;
    })();

    return () => {
      cancelled = true;
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  const loadUserCollectionFromCloud = async (userId) => {
    const supabase = await getSupabase();
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_collections')
        .select('user_state, friend_code, share_token')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching cloud collection:', error);
        return;
      }

      if (data?.friend_code) {
        setMyFriendCode(data.friend_code);
        safeStorage.setItem('spritedex_my_friend_code', data.friend_code);
      }

      if (data?.share_token) {
        setMyShareToken(data.share_token);
        safeStorage.setItem('spritedex_share_token', data.share_token);
      }

      const estadoNube = sinPerfil(data?.user_state);
      const hayNube = Object.keys(estadoNube).length > 0;

      // Fusion, no "gana el mas nuevo": se conserva todo lo que este en cualquiera de
      // los dos lados. Elegir uno solo borraba en silencio lo marcado en otro
      // dispositivo, o lo que quedaba en la nube si el local estaba vacio.
      setUserState((currentLocal) => {
        if (!hayNube) return currentLocal;
        return mergeCollections(currentLocal, estadoNube);
      });
    } catch (err) {
      console.error('Failed to load collection from cloud:', err);
    }
  };

  // Vincular con Google directamente desde el menu del invitado, sin abrir la modal.
  const handleLinkGoogle = async () => {
    const { error } = await conGoogle(Boolean(user?.is_anonymous));
    if (error) alert(error.message);
  };

  // Estable mientras no cambie el progreso: el efecto de sincronizacion lo usa para la
  // sesion muerta, y una identidad nueva por render reiniciaria ese efecto sin motivo.
  const handleSignOutCleanup = useCallback(() => {
    // Antes de limpiar, guardar la copia de recuperacion: es lo unico que le queda a
    // un usuario anonimo despues de cerrar sesion.
    try {
      if (userState && Object.keys(userState).length > 0) {
        safeStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify({ estado: userState, guardadoEn: Date.now() }));
      }
    } catch {
      // Sin storage no hay copia posible; se sigue limpiando como antes.
    }
    setUserState({});
    safeStorage.removeItem(LOCAL_STORAGE_KEY);
  }, [userState]);

  // Restaura la copia recuperable cuando no hay progreso local y la sesion es de
  // invitado (o no hay sesion). Nunca pisa el progreso de una cuenta con sesion
  // iniciada: en ese caso el merge de la nube decide.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (user && !user.is_anonymous) return;
    if (userState && Object.keys(userState).length > 0) return;
    try {
      const crudo = safeStorage.getItem(RECOVERY_STORAGE_KEY);
      if (!crudo) return;
      const guardado = JSON.parse(crudo);
      const edad = Date.now() - (guardado?.guardadoEn || 0);
      if (!guardado?.estado || Object.keys(guardado.estado).length === 0 || edad > RECOVERY_MAX_AGE_MS) {
        safeStorage.removeItem(RECOVERY_STORAGE_KEY);
        return;
      }
      console.info('Restaurando el progreso guardado en este dispositivo.');
      setUserState(guardado.estado);
      safeStorage.removeItem(RECOVERY_STORAGE_KEY);
    } catch {
      safeStorage.removeItem(RECOVERY_STORAGE_KEY);
    }
  }, [user, userState]);

  // Sync to localStorage & Supabase Cloud
  useEffect(() => {
    safeStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userState));
    safeStorage.setItem(LOCAL_STATE_UPDATED_KEY, String(Date.now()));

    // Con la modal de compartir abierta no se empuja a la nube: subir el JSON
    // completo del progreso (y el trabajo del SDK) compite con la generacion de la
    // captura en el telefono, y es justo el hueco donde se notaba mas lento en
    // produccion que en el tunel (que no tiene Supabase). Al cerrar la modal este
    // efecto vuelve a ejecutarse y sincroniza; si el usuario cierra la pestana antes,
    // lo cubre el flush con keepalive de mas abajo.
    if (showShareModal) return;

    if (isSupabaseConfigured && user) {
      const timer = setTimeout(async () => {
        try {
          const supabase = await getSupabase();
          if (!supabase) return;
          const defaultAnonName = myFriendCode
            ? `Entrenador #${myFriendCode.replace('SDEX-', '')}`
            : `Entrenador #${user.id.slice(0, 4).toUpperCase()}`;
          const isAnon = user.is_anonymous || (!user.email && !user.user_metadata?.full_name);

          let countryCode = '';
          let countryFlag = '';
          let countryName = '';
          try {
            const cachedGeo = safeStorage.getItem('spritedex_cached_geo');
            if (cachedGeo) {
              const parsed = JSON.parse(cachedGeo);
              if (parsed?.flag) {
                countryFlag = parsed.flag;
                countryCode = parsed.code;
                countryName = parsed.name;
              }
            }
            if (!countryFlag) {
              const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
              const geo = resolveCountry('', tz);
              if (geo && geo.code !== 'GL') {
                countryCode = geo.code;
                countryFlag = geo.flag;
                countryName = geo.name;
              }
            }
          } catch {}

          const profileMeta = {
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || defaultAnonName,
            email: user.email || '',
            avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
            is_anonymous: Boolean(isAnon),
            country_code: countryCode,
            country_flag: countryFlag,
            country_name: countryName,
          };

          const payload = {
            user_id: user.id,
            user_state: {
              ...userState,
              _profile: profileMeta
            },
            updated_at: new Date().toISOString()
          };
          queueCloudSync(payload);
          const { error: syncError } = await supabase
            .from('user_collections')
            .upsert(payload, { onConflict: 'user_id' });

          // Identidad borrada en Supabase (clave foranea contra auth.users) o token ya
          // rechazado: la sesion guardada en el navegador apunta a alguien que ya no
          // existe, asi que cada guardado falla en silencio y el usuario pierde lo que
          // marco en esa ventana. Reaccionar en el acto: guardar la copia de recuperacion
          // (handleSignOutCleanup, que es lo unico que le queda) y cerrar la sesion, para
          // que el arranque cree una identidad nueva y la restauracion devuelva sus
          // marcados. Una sola vez por identidad caida.
          if (isDeadSessionError(syncError) && !deadSessionHandled.current.has(user.id)) {
            deadSessionHandled.current.add(user.id);
            console.info('[amigos] la identidad ya no existe; se reinicia la sesion');
            // Cerrar la sesion es best-effort: si la red falla, no debe retrasar ni
            // impedir la copia de recuperacion.
            Promise.resolve(supabase.auth.signOut()).catch(() => {});
            handleSignOutCleanup();
            clearCloudSync();
            return;
          }

          clearCloudSync();
        } catch (err) {
          console.error('Failed to sync to Supabase:', err);
        }
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [userState, user, myFriendCode, showShareModal, handleSignOutCleanup]);

  // Salida garantizada: si la pestaña se cierra o pasa a segundo plano con un sync
  // pendiente, se empuja con keepalive en vez de esperar el debounce de 600 ms.
  useEffect(() => {
    const flush = () => flushCloudSync();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  const ensureCloudSessionForAction = useCallback(async () => {
    if (user || !isSupabaseConfigured || shouldSkipAnonymousAuth()) return;
    try {
      const supabase = await getSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.signInAnonymously();
      if (data?.user) {
        setUser(data.user);
      }
    } catch (e) {
      console.warn('Anonymous session on action notice:', e);
    }
  }, [user]);

  const handleToggleOwned = useCallback((spriteId) => {
    ensureCloudSessionForAction();
    setUserState((prev) => {
      const current = prev[spriteId] || { owned: false, level: 1 };
      const nextOwned = !current.owned;
      return {
        ...prev,
        [spriteId]: {
          owned: nextOwned,
          level: current.level || 1
        }
      };
    });
  }, [ensureCloudSessionForAction]);

  const handleOpenDetail = useCallback((s) => setSelectedSprite(s), []);
  const handleCloseDetail = useCallback(() => setSelectedSprite(null), []);

  const handleSetLevel = useCallback((spriteId, level) => {
    ensureCloudSessionForAction();
    setUserState((prev) => ({
      ...prev,
      [spriteId]: estadoAlTocarNivel(prev[spriteId], level)
    }));
  }, [ensureCloudSessionForAction]);

  const handleConnectFriendCode = async (code) => {
    const data = await fetchCollectionByFriendCode(code);
    if (data && data.userState) {
      setFriendState(data.userState);
      const codigo = data.friendCode || code;
      setCodigoCargado(codigo);
      setUserIdCargado(data.userId || '');
      setConnectedFriendCode(codigo);
      setActiveProfile('friend');
      saveLastConnectedFriendCode(codigo);
      return true;
    }
    return false;
  };

  const handleDisconnectFriend = () => {
    setFriendState(null);
    setCodigoCargado('');
    setUserIdCargado('');
    setConnectedFriendCode('');
    setIsLiveConnected(false);
    setActiveProfile('mine');
    saveLastConnectedFriendCode(null);
  };

  const filteredSprites = useMemo(() => {
    let result = dynamicSprites.filter((sprite) => {
      if (!showUnreleased && sprite.unreleased) return false;

      // Filter by Generation (activeGen: 2 = Gen 2, 1 = Gen 1, 0 = All)
      if (activeGen !== 0 && sprite.gen !== activeGen) return false;

      if (deferredSearch.trim() !== '') {
        const query = deferredSearch.toLowerCase();
        const nameMatch = sprite.fullName.toLowerCase().includes(query);
        const idMatch = sprite.id.toLowerCase().includes(query);
        const familyMatch = (sprite.familyName || '').toLowerCase().includes(query);
        const variantMatch = (sprite.variant || '').toLowerCase().includes(query);
        const variantDisplayMatch = (sprite.variantDisplay || '').toLowerCase().includes(query);
        const quackMatch = (query.includes('quack') || query.includes('patito')) && sprite.variant === 'Quack';
        const holofoilMatch = (query.includes('holofoil') || query.includes('holografico') || query.includes('holográfico')) && sprite.variant === 'Holofoil';

        if (!nameMatch && !idMatch && !familyMatch && !variantMatch && !variantDisplayMatch && !quackMatch && !holofoilMatch) return false;
      }

      // BASE filter (variant/theme)
      if (baseFilter !== 'all' && sprite.variant !== baseFilter) return false;

      // SPRITE filter (family)
      if (spriteFilter !== 'all' && sprite.familyName.toLowerCase() !== spriteFilter.toLowerCase()) return false;

      // STATUS filter (all / owned / missing / new)
      if (statusFilter === 'owned') {
        const isOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[sprite.id]?.owned;
        if (!isOwned) return false;
      } else if (statusFilter === 'missing') {
        const isOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[sprite.id]?.owned;
        if (isOwned) return false;
      } else if (statusFilter === 'new') {
        if (!sprite.isNew) return false;
      }

      return true;
    });

    // Sort
    switch (sortBy) {
      case 'name-asc':
        result = [...result].sort((a, b) => a.fullName.localeCompare(b.fullName));
        break;
      case 'name-desc':
        result = [...result].sort((a, b) => b.fullName.localeCompare(a.fullName));
        break;
      case 'rarity':
        const rarityOrder = { Mythic: 0, Legendary: 1, Epic: 2, Special: 3, Rare: 4 };
        result = [...result].sort((a, b) => (rarityOrder[a.rarity] || 5) - (rarityOrder[b.rarity] || 5));
        break;
      case 'drop-asc':
        result = [...result].sort((a, b) => a.dropChanceNum - b.dropChanceNum);
        break;
      case 'drop-desc':
        result = [...result].sort((a, b) => b.dropChanceNum - a.dropChanceNum);
        break;
      case 'owned':
        result = [...result].sort((a, b) => {
          const aOwned = userState[a.id]?.owned ? 1 : 0;
          const bOwned = userState[b.id]?.owned ? 1 : 0;
          return bOwned - aOwned;
        });
        break;
      case 'missing':
        result = [...result].sort((a, b) => {
          const aOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[a.id]?.owned ? 1 : 0;
          const bOwned = (activeProfile === 'friend' && friendState ? friendState : userState)[b.id]?.owned ? 1 : 0;
          return aOwned - bOwned;
        });
        break;
      default:
        if (statusFilter === 'new') {
          result = [...result].sort((a, b) => {
            const dateA = a.releaseDate || a.release_date ? new Date(a.releaseDate || a.release_date).getTime() : 0;
            const dateB = b.releaseDate || b.release_date ? new Date(b.releaseDate || b.release_date).getTime() : 0;
            if (dateB !== dateA) {
              return dateB - dateA;
            }
            const famA = a.familyId || (a.id ? a.id.split('_')[0] : '');
            const famB = b.familyId || (b.id ? b.id.split('_')[0] : '');
            if (famA !== famB) {
              return 0;
            }
            return getVariantPriority(a.variant) - getVariantPriority(b.variant);
          });
        }
        break;
    }

    return result;
  }, [
    dynamicSprites,
    showUnreleased,
    activeGen,
    deferredSearch,
    baseFilter,
    spriteFilter,
    statusFilter,
    sortBy,
    userState,
    friendState,
    activeProfile
  ]);

  // Counts scoped to current generation (excluding unreleased unless enabled).
  // Se reutiliza como alcance del modal de compartir: al estar memoizada, el modal
  // no se repasa en cada render de la app (en produccion eso pasa con el sync).
  const scopedSprites = useMemo(() => {
    return dynamicSprites.filter((s) => {
      if (!showUnreleased && s.unreleased) return false;
      if (activeGen !== 0 && s.gen !== activeGen) return false;
      return true;
    });
 }, [dynamicSprites, activeGen, showUnreleased]);

  // Precalcula en segundo plano la captura de la modal de compartir. Es lo que hace
  // que la app local se sienta inmediata: alli la modal sale de cache. Sin esto, cada
  // espiritu marcado invalida la captura y la codificacion (4 s en un telefono) se
  // paga con la modal abierta. Aqui se paga mientras el usuario navega, en reposo y
  // una sola vez por cambio de progreso.
  // OJO: va despues de scopedSprites a proposito; usarlo antes seria un TDZ.
useEffect(() => {
    if (typeof window === 'undefined' || isAdminPortal || showShareModal) return;
    if (!Array.isArray(scopedSprites) || scopedSprites.length === 0) return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const slowConnection = Boolean(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
    if (slowConnection || document.visibilityState !== 'visible') return;

    const run = async () => {
        try {
          if (document.visibilityState !== 'visible') return;
          const { getCanvasCacheKey, readCachedCapture, writeCachedCapture, generateSpritedexCardImage, getOrStartCapture, globalCanvasCache, DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE } = await import('./utils/canvasExporter');
          const ownedInScope = scopedSprites.filter((s) => userState[s.id]?.owned).length;
          const key = getCanvasCacheKey(DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE, scopedSprites.length, ownedInScope, scopedSprites, userState);
          // Si esta clave ya esta dibujada en memoria, no hay nada que hacer. Sin esta
          // salida, cada cambio de estado lanzaba otro precálculo y la clave vigente se
          // quedaba a medias: la modal abria con espera en vez de al instante.
          if (globalCanvasCache.has(key)) return;
          if (await readCachedCapture(key)) return;
          // getOrStartCapture comparte el trabajo con la modal si esta pidio lo mismo.
          const res = await getOrStartCapture(key, () => generateSpritedexCardImage({
            spritesList: scopedSprites,
            userState,
            format: DEFAULT_EXPORT_FORMAT,
            bgStyle: DEFAULT_EXPORT_BG_STYLE
          }));
          const enc = await res.encode();
          if (enc?.blob) await writeCachedCapture(key, enc.blob);
        } catch (err) {
          // Un fallo del precalculo no puede romper nada: la modal generara al abrirse.
          console.warn('Precalculo de la captura fallido:', err);
        }
    };

    // La captura se prepara cuando la app lleva unos segundos quieta. Durante los
    // primeros segundos la conexion y el hilo son del primer pintado, del hero y de
    // las tarjetas: arrancar el precalculo a los 1,2 s ponia ~700 KB de miniaturas a
    // competir con eso (medido: el sprite del hero tardaba 6 s en aparecer con Slow 4G).
    // Si el usuario esta tocando o haciendo scroll, se pospone hasta que pare.
    let ultimaActividad = Date.now();
    const marcarActividad = () => { ultimaActividad = Date.now(); };
    const EVENTOS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];
    EVENTOS.forEach((ev) => window.addEventListener(ev, marcarActividad, { passive: true }));

    let cancelado = false;
    const intentar = () => {
      if (cancelado) return;
      const demasiadoPronto = Date.now() - ARRANQUE_APP < PRECALCULO_MIN_MS;
      const sigueTocando = Date.now() - ultimaActividad < PRECALCULO_CALMA_MS;
      if (demasiadoPronto || sigueTocando) {
        setTimeout(intentar, 600);
        return;
      }
      run();
    };
    const timer = setTimeout(intentar, 1500);

    return () => {
      cancelado = true;
      clearTimeout(timer);
      EVENTOS.forEach((ev) => window.removeEventListener(ev, marcarActividad));
    };
  }, [scopedSprites, userState, isAdminPortal, showShareModal]);

  const activeState = activeProfile === 'friend' && friendState ? friendState : userState;
  const totalCount = scopedSprites.length;
  const ownedCount = scopedSprites.filter((s) => activeState[s.id]?.owned).length;
  const masteredCount = scopedSprites.filter((s) => activeState[s.id]?.owned && activeState[s.id]?.level === 5).length;
  // Porcentajes para la barra de progreso. Un valor bajo se ve igual que cero, asi
  // que el relleno nunca baja del 2,5% cuando hay algo (eso es solo visual).
  const rellenoDe = (valor) => {
    if (totalCount <= 0 || valor <= 0) return 0;
    // Un valor bajo se veria igual que cero, asi que el relleno nunca baja del 2,5%.
    return Math.max((valor / totalCount) * 100, 2.5);
  };

  // La etiqueta de familia se guarda como texto; para el ingles hay que volver al id.
  const familiaVisible = (() => {
    if (spriteFilter === 'all') return '';
    const id = Object.keys(FAMILY_NAMES_MAP).find((k) => FAMILY_NAMES_MAP[k] === spriteFilter);
    return id ? pickFamilyName(id) : spriteFilter;
  })();
  const friendLendableCount = friendState ? scopedSprites.filter((s) => friendState[s.id]?.owned && !userState[s.id]?.owned).length : 0;

  // Página de amigos (fase 1): ruta propia para tener espacio de verdad. La modal sigue
  // viva en paralelo, así nadie pierde el radar mientras migramos.
  // La ruta de la app se lee SIN el prefijo de idioma: /en/amigos y /amigos son la misma pantalla.
  const rutaActual = typeof window !== 'undefined' ? window.location.pathname : '';
  const rutaApp = rutaSinIdioma(rutaActual);
  const [enAmigos, setEnAmigos] = useState(() => rutaApp.indexOf('/amigos') === 0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const alVolver = () => setEnAmigos(rutaSinIdioma(window.location.pathname).indexOf('/amigos') === 0);
    window.addEventListener('popstate', alVolver);
    return () => window.removeEventListener('popstate', alVolver);
  }, []);

  // Toda navegacion interna conserva el idioma activo.
  const irA = useCallback((ruta) => {
    if (typeof window === 'undefined') return;
    window.history.pushState({}, '', conIdioma(ruta, getLang()));
    setEnAmigos(ruta.indexOf('/amigos') === 0);
  }, []);

  // Codigo de amigo que venga en la ruta (/amigos/SDEX-XXXX) o en el enlace actual
  // (?share=): la ficha se abre con el. La regla vive en utils/visitaEnlace para poder
  // probarla: un codigo de una visita anterior, con la ruta ya limpia, no cuenta.
  const busquedaActual = typeof window !== 'undefined' ? window.location.search : '';
  const codigoEnRuta = codigoFichaEnRuta(rutaApp, busquedaActual, codigoDeToken);

  // Reclamo progresivo: ve el aviso el invitado con algo que proteger, y solo ese. La
  // condicion vive aqui, en un solo lugar, porque los dos arboles de render (la app y la
  // pagina de amigos) tienen que decidir lo mismo.
  // Se cuenta lo PROPIO y no lo que se esta viendo: en MODO AMIGO ownedCount es la coleccion
  // del amigo, asi que un invitado sin nada recibia el aviso por mirar la de otro.
  const marcadosPropios = useMemo(
    () => Object.keys(userState || {}).filter((k) => k !== '_profile' && userState[k]?.owned).length,
    [userState]
  );
  // A los 30, no a los 5: el aviso llega cuando de verdad hay una coleccion que perder, y
  // antes de eso solo molesta a quien esta probando la app.
  const mostrarAvisoReclamo = Boolean(user?.is_anonymous) && marcadosPropios >= 30;

  // Una sola vez por navegador: cuando se cumple la condicion y no hay otro modal encima,
  // abre la modal de autenticacion con retraso, ya fuera del primer pintado. El marcador se
  // escribe al abrir (no al programar) para que cerrarla no la reabra sola.
  useEffect(() => {
    if (!mostrarAvisoReclamo) return undefined;
    // Fuera de produccion no se crean usuarios reales, asi que el aviso no tiene destino.
    if (shouldSkipAnonymousAuth()) return undefined;
    if (safeStorage.getItem(CLAVE_AVISO_RECLAMO) === 'true') return undefined;
    const hayModalAbierto = Boolean(selectedSprite) || showShareModal || showBackupModal ||
      showCompareModal || showFooterPrivacyModal || showAuthModal;
    if (hayModalAbierto) return undefined;
    const timer = setTimeout(() => {
      safeStorage.setItem(CLAVE_AVISO_RECLAMO, 'true');
      setShowAuthModal(true);
    }, AVISO_RECLAMO_RETRASO_MS);
    return () => clearTimeout(timer);
  }, [mostrarAvisoReclamo, selectedSprite, showShareModal, showBackupModal, showCompareModal, showFooterPrivacyModal, showAuthModal]);

  // La modal de autenticacion se dibuja en los dos arboles: la pagina de amigos retorna
  // antes de llegar a los modales de la app, y el aviso de reclamo tiene que poder abrirla
  // tambien desde esa pantalla.
  const modalAuth = showAuthModal && (!user || user.is_anonymous) ? (
    <AuthModal
      user={user}
      onClose={() => setShowAuthModal(false)}
      onAuthSuccess={() => {
        setShowAuthModal(false);
      }}
      onSignOut={handleSignOutCleanup}
    />
  ) : null;

  if (enAmigos) {
    return (
      <div className="app-container">
        {mostrarAvisoReclamo && (
          <ClaimAccountBanner onCrearUsuario={() => setShowAuthModal(true)} />
        )}
        <FriendsPage
          myFriendCode={myFriendCode}
          myShareToken={myShareToken}
          avisoExterno={tokenSinResultado ? t('amigos.enlaceSinResultado') : ''}
          codigoFicha={codigoEnRuta}
          codigoCargado={codigoCargado}
          userState={userState}
          friendState={friendState}
          spritesScope={scopedSprites}
          onAmigoQuitado={(codigoQuitado) => {
            const limpio = String(codigoQuitado || '').replace(/^SDEX-/i, '');
            const conectado = String(connectedFriendCode || '').replace(/^SDEX-/i, '');
            if (limpio && conectado && limpio === conectado) handleDisconnectFriend();
          }}
          onBack={() => irA('/')}
          onVerColeccion={async (codigo) => {
            const ok = await handleConnectFriendCode(codigo);
            if (ok !== false) {
              // Se carga su coleccion para comparar en la FICHA, pero sin cambiar tu vista:
              // si dejaramos el perfil en modo amigo, al volver atras aparecia el cartel de
              // MODO AMIGO sin que nadie lo pidiera. Para eso esta el boton Vista de amigo.
              setActiveProfile('mine');
              irA('/amigos/' + encodeURIComponent(codigo));
            }
            // El resultado tiene que volver a la pagina: sin este return, FriendsPage recibe
            // undefined, el aviso de "no pudimos ver esa colección" nunca se dibuja y el clic
            // fallido abriria una comparación vacia.
            return ok;
          }}
          onVerEnApp={async (codigo) => {
            const ok = await handleConnectFriendCode(codigo);
            if (ok !== false) {
              setActiveProfile('friend');
              irA('/');
            }
          }}
          onAbrirModal={() => setShowCompareModal(true)}
        />
        <Suspense fallback={null}>{modalAuth}</Suspense>
      </div>
    );
  }

  // Render Admin Portal if secret path or query parameter is active
  if (isAdminPortal) {
    if (!isAdminAuth) {
      return (
        <Suspense fallback={
          <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060714', color: '#00F0E8', fontFamily: 'monospace' }}>
            <span>AUTENTICANDO NÚCLEO...</span>
          </div>
        }>
          <AdminAuthGate
            onAuthenticated={() => setIsAdminAuth(true)}
            onExit={() => {
              setIsAdminPortal(false);
              const url = new URL(window.location.href);
              url.searchParams.delete('studio');
              url.searchParams.delete('portal');
              const targetPath = url.pathname.includes('override') || url.pathname.includes('nexus') ? '/' : url.toString();
              window.history.pushState({}, '', targetPath);
            }}
          />
        </Suspense>
      );
    }

    return (
      <Suspense fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060714', color: '#00F0E8', fontFamily: 'monospace' }}>
          <span>CARGANDO STUDIO OVERRIDE...</span>
        </div>
      }>
        <AdminLayout
          sprites={dynamicSprites}
          onRefreshSprites={refreshDynamicSprites}
          onExitAdmin={() => {
            setIsAdminPortal(false);
            const url = new URL(window.location.href);
            url.searchParams.delete('studio');
            url.searchParams.delete('portal');
            const targetPath = url.pathname.includes('override') || url.pathname.includes('nexus') ? '/' : url.toString();
            window.history.pushState({}, '', targetPath);
          }}
        />
      </Suspense>
    );
  }

  return (
    <div className="app-container">
      <FortnitemaresTransition />
      <PrivacyNotice />
      <InstallPrompt />

      <Navbar
        user={user}
        activeGen={activeGen}
        onGenChange={(newGen) => {
          setActiveGen(newGen);
          setBaseFilter('all');
          setSpriteFilter('all');
        }}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onLinkGoogle={handleLinkGoogle}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onSignOut={handleSignOutCleanup}
      />

      <Header
        spritesPool={scopedSprites}
        ownedCount={ownedCount}
        totalCount={totalCount}
        masteredCount={masteredCount}
        user={user}
        isLiveConnected={isLiveConnected}
        connectedFriendCode={connectedFriendCode}
        solicitudesNuevas={solicitudesNuevas}
        onOpenShareModal={() => setShowShareModal(true)}
        onOpenBackupModal={() => setShowBackupModal(true)}
        onOpenCompareModal={() => irA('/amigos')}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {mostrarAvisoReclamo && (
        <ClaimAccountBanner onCrearUsuario={() => setShowAuthModal(true)} />
      )}

      {/* Barra flotante sutil (Únicamente cuando se está explorando activamente la colección de un amigo) */}
      {activeProfile === 'friend' && (
        <div className="sdm-friend-pill">
          <div className="sdm-friend-pill__info">
            <span className="sdm-friend-pill__tag">👥 MODO AMIGO</span>
            <span className="sdm-friend-pill__desc">
              Explorando colección de <strong>{connectedFriendCode || 'Amigo'}</strong>
            </span>
          </div>
          <button
            onClick={() => setActiveProfile('mine')}
            className="sdm-friend-pill__exit"
            title={t('app.volverColeccion')}
          >
            ✕ Salir a mi colección
          </button>
        </div>
      )}

      {/* Main Content with Fortnite.gg matching filters */}
      <main className="main-content">
        <FilterBar
          isMobile={isMobile}
          activeGen={activeGen}
          setActiveGen={setActiveGen}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          baseFilter={baseFilter}
          setBaseFilter={setBaseFilter}
          spriteFilter={spriteFilter}
          setSpriteFilter={setSpriteFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
          showUnreleased={showUnreleased}
          setShowUnreleased={setShowUnreleased}
          viewMode={viewMode}
          setViewMode={setViewMode}
        />

        {isMobile && (
          <section className="stats-bar" aria-label={t('app.progresoAria')}>
            <div className="stats-bar__col">
              <span className="stats-bar__value">{totalCount}</span>
              {/* Reserva el alto de la barra: asi las tres etiquetas quedan a la misma altura. */}
              <span className="stats-bar__spacer" aria-hidden="true" />
              <span className="stats-bar__label">{t('app.total')}</span>
            </div>
            <div className="stats-bar__col">
              <span className="stats-bar__value">{ownedCount}</span>
              <span
                className="stats-bar__track"
                role="progressbar"
                aria-label={t('app.atrapadosAria')}
                aria-valuemin={0}
                aria-valuemax={totalCount}
                aria-valuenow={ownedCount}
              >
                <span className="stats-bar__fill stats-bar__fill--caught" style={{ width: rellenoDe(ownedCount) + '%' }} />
              </span>
              <span className="stats-bar__label">{t('app.atrapados')}</span>
            </div>
            <div className="stats-bar__col">
              <span className="stats-bar__value">{masteredCount}</span>
              <span
                className="stats-bar__track"
                role="progressbar"
                aria-label={t('app.maxeadosAria')}
                aria-valuemin={0}
                aria-valuemax={totalCount}
                aria-valuenow={masteredCount}
              >
                <span className="stats-bar__fill stats-bar__fill--mastered" style={{ width: rellenoDe(masteredCount) + '%' }} />
              </span>
              <span className="stats-bar__label">{t('app.maxeados')}</span>
            </div>
          </section>
        )}

        {filteredSprites.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', gridColumn: '1 / -1' }}>
            <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>{t('app.sinResultados')}</h2>
            <p>{t('app.ajustaFiltros')}</p>
          </div>
        ) : (isMobile || viewMode === 'spotlight') ? (
          <MobileSpriteSwiper
            sprites={filteredSprites}
            userState={userState}
            friendState={friendState}
            isFriendView={activeProfile === 'friend'}
            onToggleOwned={handleToggleOwned}
            onSetLevel={handleSetLevel}
            onOpenDetail={handleOpenDetail}
          />
        ) : (
          <div className={`sprites-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
            {filteredSprites.map((sprite, idx) => (
              <SpriteCard
                key={sprite.id}
                sprite={sprite}
                index={idx}
                userState={userState}
                friendState={friendState}
                isFriendView={activeProfile === 'friend'}
                viewMode={viewMode}
                onToggleOwned={handleToggleOwned}
                onSetLevel={handleSetLevel}
                onOpenDetail={handleOpenDetail}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedSprite && (
        <SpriteDetailModal
          sprite={selectedSprite}
          userState={userState}
          onToggleOwned={handleToggleOwned}
          onSetLevel={handleSetLevel}
          readOnly={activeProfile === 'friend'}
          onClose={handleCloseDetail}
        />
      )}

      <Suspense fallback={null}>
        {showShareModal && (
          <ShareImageModal
            filteredSprites={filteredSprites}
            allSprites={scopedSprites}
            userState={userState}
            activeGen={activeGen}
            activeFiltersLabel={
              [
                baseFilter !== 'all' ? t('app.filtroVariante', { valor: baseFilter }) : '',
                spriteFilter !== 'all' ? t('app.filtroFamilia', { valor: familiaVisible }) : '',
                searchQuery ? t('app.filtroBusqueda', { valor: searchQuery }) : ''
              ]
                .filter(Boolean)
                .join(' · ') || t('app.sinFiltros')
            }
            onClose={() => setShowShareModal(false)}
          />
        )}

        {showBackupModal && (
          <BackupModal
            userState={userState}
            setUserState={setUserState}
            onClose={() => setShowBackupModal(false)}
          />
        )}

        {showCompareModal && (
          <FriendCompareModal
            userState={userState}
            friendState={friendState}
            isLiveConnected={isLiveConnected}
            connectedFriendCode={connectedFriendCode}
            myFriendCode={myFriendCode}
            onOpenFriendsPage={() => irA('/amigos')}
            activeProfile={activeProfile}
            onSetActiveProfile={setActiveProfile}
            onConnectFriendCode={handleConnectFriendCode}
            onDisconnectFriend={handleDisconnectFriend}
            onLoadFriendState={(state, sourceLabel) => {
              setFriendState(state);
              setActiveProfile('friend');
              if (sourceLabel) setConnectedFriendCode(sourceLabel);
            }}
            onToggleOwned={handleToggleOwned}
            onClose={() => setShowCompareModal(false)}
          />
        )}

        {/* Tambien con sesion anonima: es la unica via para vincular la cuenta. */}
        {modalAuth}

        {showFooterPrivacyModal && (
          <PrivacyPolicyModal onClose={() => setShowFooterPrivacyModal(false)} />
        )}
      </Suspense>

      <Footer
        totalSprites={totalCount}
        onOpenPrivacy={() => setShowFooterPrivacyModal(true)}
      />
    </div>
  );
}

export default App;
