import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, User, LogOut, ShieldCheck, ChevronDown, Menu, X, Layers, Sparkles, Zap, ZapOff, Smartphone, AlertTriangle, Mail } from 'lucide-react';
import { Google } from './ui/Google';
import { getSupabase } from '../utils/supabase';
import { getMyFriendCode } from '../utils/friendCode';
import { safeStorage } from '../utils/safeStorage';
import { GENERATIONS } from '../data/spritesData';
import { LanguageSwitcher } from './LanguageSwitcher';
import { t } from '../i18n';

// #rrggbb -> "r,g,b", para poder usar el color de cada generacion con transparencia
// (rgba) sin depender de color-mix, que aun no esta en todos los navegadores.
const rgbDe = (hex) => {
  const limpio = String(hex || '').replace('#', '');
  if (limpio.length !== 6) return '0, 240, 232';
  const n = parseInt(limpio, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
};

export function Navbar({
  user,
  activeGen = 2,
  onGenChange,
  onOpenAuthModal,
  onLinkGoogle,
  onOpenBackupModal,
  onSignOut
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  // Sesion anonima (acceso rapido 1-clic): su progreso solo vive en este dispositivo.
  // Debe verlo claro y tener a mano el camino para vincular su cuenta.
  const esAnonimo = Boolean(user?.is_anonymous);

  // Las tres opciones del menu, con el nombre del tema y el color de cada generacion.
  const opcionesGen = useMemo(() => {
    const gen1 = GENERATIONS.find((g) => g.id === 1);
    const gen2 = GENERATIONS.find((g) => g.id === 2);
    return [
      { id: 2, badge: '2', nombre: gen2?.title || 'Override', detalle: '2ª Generación', color: gen2?.badgeColor || '#ec4899' },
      { id: 1, badge: '1', nombre: gen1?.title || 'Runners', detalle: '1ª Generación', color: gen1?.badgeColor || '#3b82f6' },
      { id: 0, badge: '🌐', nombre: t('nav.todas'), detalle: 'Catálogo completo', color: '#00f0e8' }
    ];
  }, []);
  const myFriendCode = useMemo(() => getMyFriendCode(user?.id), [user]);
  const [animationsEnabled, setAnimationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;

    // 1. Si el usuario ya tiene una preferencia guardada, respetarla
    const stored = safeStorage.getItem('spritedex_animations_enabled');
    if (stored !== null) {
      return stored === 'true';
    }

    // 2. Por defecto animaciones fluidas activas en todos los dispositivos
    return true;
  });
  const userDropdownRef = useRef(null);
  const navMenuRef = useRef(null);

  // Sincroniza preferencia persistente de animaciones en DOM y localStorage
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (animationsEnabled) {
      document.documentElement.classList.remove('motion-disabled');
      document.body.classList.remove('motion-disabled');
      safeStorage.setItem('spritedex_animations_enabled', 'true');
    } else {
      document.documentElement.classList.add('motion-disabled');
      document.body.classList.add('motion-disabled');
      safeStorage.setItem('spritedex_animations_enabled', 'false');
    }
  }, [animationsEnabled]);

  const handleToggleAnimations = () => {
    setAnimationsEnabled((prev) => !prev);
  };

  const fullName = useMemo(() => {
    if (!user) return null;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split('@')[0];
    if (user.is_anonymous) return t('nav.invitado');
    return t('nav.miCuenta');
  }, [user]);

  // Solo el primer nombre y el primer apellido: el nombre completo puede traer dos
  // apellidos o nombres compuestos y desbordar el menu. El correo no se muestra.
  const nombreCorto = useMemo(() => {
    if (!fullName) return null;
    return fullName.trim().split(/\s+/).slice(0, 2).join(' ');
  }, [fullName]);

  const initialLetter = useMemo(() => {
    if (!user) return '';
    const raw = user.user_metadata?.given_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email ||
                'U';
    return raw.trim().charAt(0).toUpperCase();
  }, [user]);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (navMenuRef.current && !navMenuRef.current.contains(event.target)) {
        setIsNavMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    if (user) {
      setIsUserMenuOpen((prev) => !prev);
      setIsNavMenuOpen(false);
    } else {
      onOpenAuthModal();
    }
  };

  const handleSignOutClick = async (e) => {
    e.stopPropagation();
    setIsUserMenuOpen(false);
    try {
      const supabase = await getSupabase();
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error during sign out:', err);
    }
    if (onSignOut) onSignOut();
  };

  const handleLogoClick = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
      }
    } catch (err) {
      console.warn('Error al limpiar caché:', err);
    }
    const url = new URL(window.location.href);
    url.searchParams.set('v', Date.now().toString());
    window.location.replace(url.toString());
  };

  return (
    <nav className="app-navbar">
      {/* Logo con actualización forzada */}
      <div className="app-navbar__left">
        <button
          type="button"
          className="app-navbar__logo-mark"
          onClick={handleLogoClick}
          title={t('nav.actualizarAyuda')}
          aria-label={t('nav.actualizarApp')}
        >
          F
        </button>
      </div>

      {/* Acciones derechas: Idioma + Avatar + Menú Hamburguesa. El interruptor de
          animaciones vive DENTRO del menú: la barra tenia demasiados botones sueltos. */}
      <div className="app-navbar__right">
        {/* Selector de idioma: siempre visible, porque la deteccion del navegador es solo una apuesta */}
        <LanguageSwitcher />

        {/* Avatar / Usuario (Solo Foto o Inicial Circular) */}
        <div ref={userDropdownRef} style={{ position: 'relative' }}>
          <button
            className={`app-navbar__avatar ${user ? 'is-logged' : ''} ${isUserMenuOpen ? 'is-active' : ''}`}
            onClick={handleAvatarClick}
            title={user ? t('nav.conectadoComo', { nombre: nombreCorto }) : t('nav.iniciarSesionTitulo')}
            aria-label={user ? t('nav.cuentaUsuario') : t('nav.iniciarSesion')}
            aria-expanded={user ? isUserMenuOpen : undefined}
          >
            {user ? (
              avatarUrl ? (
                <img src={avatarUrl} alt="" className="app-navbar__avatar-img" />
              ) : (
                <span className="app-navbar__avatar-initial">{initialLetter}</span>
              )
            ) : (
              <User size={15} strokeWidth={2.2} />
            )}

            {user && <span className="app-navbar__avatar-dot" />}
          </button>

          {/* Dropdown Menu (cuando el usuario está conectado) */}
          {user && isUserMenuOpen && (
            <div className="app-navbar__dropdown glass-panel">
              <div className="app-navbar__dropdown-header">
                <div className="app-navbar__dropdown-user">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="" className="app-navbar__dropdown-avatar-img" />
                  ) : (
                    <div className="app-navbar__dropdown-avatar-placeholder">
                      <User size={18} />
                    </div>
                  )}
                  <div className="app-navbar__dropdown-meta">
                    <span className="app-navbar__dropdown-name">{nombreCorto}</span>
                    <span className="app-navbar__dropdown-code">{myFriendCode}</span>
                  </div>
                </div>

                {esAnonimo ? (
                  <div className="app-navbar__dropdown-status app-navbar__dropdown-status--aviso">
                    <AlertTriangle size={13} color="#fbbf24" />
                    <span>{t('nav.soloEnEsteDispositivo')}</span>
                  </div>
                ) : (
                  <div className="app-navbar__dropdown-status">
                    <ShieldCheck size={13} color="#10b981" />
                    <span>{t('nav.sincronizadoEnLaNube')}</span>
                  </div>
                )}

              </div>

              <div className="app-navbar__dropdown-divider" />

              {esAnonimo && (
                <>
                  <p className="app-navbar__dropdown-nota">
                    {t('nav.notaAnonimo')}
                  </p>
                  <div className="app-navbar__vincular-row">
                  <button
                    onClick={() => { setIsUserMenuOpen(false); onLinkGoogle(); }}
                    className="app-navbar__vincular-btn"
                    title={t('nav.vincularGoogle')}
                    aria-label={t('nav.vincularGoogle')}
                  >
                    <Google width={18} height={18} />
                  </button>
                  <button
                    onClick={() => { setIsUserMenuOpen(false); onOpenAuthModal(); }}
                    className="app-navbar__vincular-btn"
                    title={t('nav.vincularCorreo')}
                    aria-label={t('nav.vincularCorreo')}
                  >
                    <Mail size={18} />
                  </button>
                  </div>
                </>
              )}

              <button
                onClick={handleSignOutClick}
                className="app-navbar__dropdown-item app-navbar__dropdown-item--danger"
              >
                <LogOut size={15} />
                <span>{t('nav.cerrarSesion')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Botón Menú Hamburguesa */}
        <div ref={navMenuRef} style={{ position: 'relative' }}>
          <button
            className={`app-navbar__menu-btn ${isNavMenuOpen ? 'is-active' : ''}`}
            onClick={() => { setIsNavMenuOpen((prev) => !prev); setIsUserMenuOpen(false); }}
            title={t('nav.menu')}
            aria-label={t('nav.menuNavegacion')}
            aria-expanded={isNavMenuOpen}
          >
            {isNavMenuOpen ? <X size={17} strokeWidth={2.4} /> : <Menu size={17} strokeWidth={2.4} />}
          </button>

          {/* Menú Desplegable Hamburguesa */}
          {isNavMenuOpen && (
            <div className="app-navbar__menu-dropdown glass-panel">
              {/* Sección Generaciones */}
              <div className="app-navbar__menu-section">
                <div className="app-navbar__menu-section-label">
                  <Layers size={13} />
                  <span>{t('nav.generaciones')}</span>
                </div>

                <div className="app-navbar__menu-options">
                  {opcionesGen.map((op) => {
                    const activa = activeGen === op.id;
                    return (
                      <button
                        key={op.id}
                        data-gen={op.id}
                        className={`app-navbar__gen-option ${activa ? 'selected' : ''}`}
                        style={{ '--gen-rgb': rgbDe(op.color) }}
                        onClick={() => { if (onGenChange) onGenChange(op.id); setIsNavMenuOpen(false); }}
                      >
                        <span className="gen-option-badge">{op.badge}</span>
                        <span className="gen-option-content">
                          <span className="gen-option-title">{op.nombre}</span>
                        </span>
                        {activa && <span className="gen-option-check">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="app-navbar__dropdown-divider" />

              {/* Sección Herramientas */}
              <div className="app-navbar__menu-section">
                {/* Animaciones arriba y sola: es un interruptor, no una accion, y metida en
                    la fila de tres se comia el ancho de las otras dos. No cierra el menu a
                    proposito, para que se vea el cambio de estado en la propia fila. */}
                <button
                  className="app-navbar__menu-action-btn"
                  onClick={handleToggleAnimations}
                  aria-pressed={animationsEnabled}
                >
                  <div className="action-btn-left">
                    {/* El acento del icono sale de una variable para que la temporada lo
                        pueda virar sin duplicar el icono ni tocar el comportamiento. */}
                    {animationsEnabled ? <Zap size={15} color="var(--nav-accent, #00F0E8)" /> : <ZapOff size={15} />}
                    <span>{animationsEnabled ? t('nav.desactivarAnimaciones') : t('nav.activarAnimaciones')}</span>
                  </div>
                </button>

                <div className="app-navbar__menu-actions-row">
                <button
                  className="app-navbar__menu-action-btn"
                  onClick={() => {
                    setIsNavMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('spritedex:open-install-prompt'));
                  }}
                >
                  <div className="action-btn-left">
                    <Smartphone size={15} color="var(--nav-accent, #00F0E8)" />
                    <span>{t('nav.instalar')}</span>
                  </div>
                </button>

                <button
                  className="app-navbar__menu-action-btn"
                  onClick={() => { onOpenBackupModal(); setIsNavMenuOpen(false); }}
                >
                  <div className="action-btn-left">
                    <Download size={15} />
                    <span>{t('nav.respaldo')}</span>
                  </div>
                </button>

                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
