import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, User, LogOut, ShieldCheck, ChevronDown, Menu, X, Layers, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase';

export function Navbar({
  user,
  activeGen = 2,
  onGenChange,
  onOpenAuthModal,
  onOpenBackupModal,
  onSignOut
}) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNavMenuOpen, setIsNavMenuOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const navMenuRef = useRef(null);

  const fullName = useMemo(() => {
    if (!user) return null;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split('@')[0];
    if (user.is_anonymous) return 'Invitado';
    return 'Mi Cuenta';
  }, [user]);

  const firstName = useMemo(() => {
    if (!user) return null;
    const raw = user.user_metadata?.given_name ||
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                (user.email ? user.email.split('@')[0] : null);
    if (raw) {
      const first = raw.trim().split(/\s+/)[0];
      return first.charAt(0).toUpperCase() + first.slice(1);
    }
    if (user.is_anonymous) return 'Invitado';
    return 'Cuenta';
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
          title="Toca para actualizar la aplicación a la última versión"
          aria-label="Actualizar aplicación"
          style={{ border: 'none', padding: 0 }}
        >
          F
        </button>
      </div>

      {/* Acciones derechas: Avatar + Menú Hamburguesa */}
      <div className="app-navbar__right">
        {/* Avatar / Usuario */}
        <div ref={userDropdownRef} style={{ position: 'relative' }}>
          <button
            className={`app-navbar__avatar ${user ? 'is-logged' : ''} ${isUserMenuOpen ? 'is-active' : ''}`}
            onClick={handleAvatarClick}
            title={user ? `Conectado como ${user.email || fullName}` : 'Iniciar Sesión'}
            aria-label={user ? 'Cuenta de usuario' : 'Iniciar sesión'}
            aria-expanded={user ? isUserMenuOpen : undefined}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="app-navbar__avatar-img" />
            ) : (
              <User size={15} strokeWidth={2.2} />
            )}

            {user && (
              <span className="app-navbar__username">{firstName}</span>
            )}

            {user && <ChevronDown size={13} className={`app-navbar__chevron ${isUserMenuOpen ? 'open' : ''}`} />}
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
                    <span className="app-navbar__dropdown-name">{fullName}</span>
                    <span className="app-navbar__dropdown-email">{user.email || 'Sesión Activa'}</span>
                  </div>
                </div>

                <div className="app-navbar__dropdown-status">
                  <ShieldCheck size={13} color="#10b981" />
                  <span>Sincronizado en la nube</span>
                </div>
              </div>

              <div className="app-navbar__dropdown-divider" />

              <button
                onClick={handleSignOutClick}
                className="app-navbar__dropdown-item app-navbar__dropdown-item--danger"
              >
                <LogOut size={15} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          )}
        </div>

        {/* Botón Menú Hamburguesa */}
        <div ref={navMenuRef} style={{ position: 'relative' }}>
          <button
            className={`app-navbar__menu-btn ${isNavMenuOpen ? 'is-active' : ''}`}
            onClick={() => { setIsNavMenuOpen((prev) => !prev); setIsUserMenuOpen(false); }}
            title="Menú"
            aria-label="Menú de navegación"
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
                  <span>Generaciones</span>
                </div>

                <div className="app-navbar__menu-options">
                  <button
                    className={`app-navbar__gen-option ${activeGen === 2 ? 'selected' : ''}`}
                    onClick={() => { if (onGenChange) onGenChange(2); setIsNavMenuOpen(false); }}
                  >
                    <div className="gen-option-content">
                      <span className="gen-option-title">2da Gen</span>
                      <span className="gen-option-subtitle">33 sprites · Actual</span>
                    </div>
                    {activeGen === 2 && <span className="gen-option-check">✓</span>}
                  </button>

                  <button
                    className={`app-navbar__gen-option ${activeGen === 1 ? 'selected' : ''}`}
                    onClick={() => { if (onGenChange) onGenChange(1); setIsNavMenuOpen(false); }}
                  >
                    <div className="gen-option-content">
                      <span className="gen-option-title">1ra Gen</span>
                      <span className="gen-option-subtitle">117 sprites</span>
                    </div>
                    {activeGen === 1 && <span className="gen-option-check">✓</span>}
                  </button>

                  <button
                    className={`app-navbar__gen-option ${activeGen === 0 ? 'selected' : ''}`}
                    onClick={() => { if (onGenChange) onGenChange(0); setIsNavMenuOpen(false); }}
                  >
                    <div className="gen-option-content">
                      <span className="gen-option-title">Todas</span>
                      <span className="gen-option-subtitle">150 sprites total</span>
                    </div>
                    {activeGen === 0 && <span className="gen-option-check">✓</span>}
                  </button>
                </div>
              </div>

              <div className="app-navbar__dropdown-divider" />

              {/* Sección Herramientas */}
              <div className="app-navbar__menu-section">
                <button
                  className="app-navbar__menu-action-btn"
                  onClick={() => { onOpenBackupModal(); setIsNavMenuOpen(false); }}
                >
                  <div className="action-btn-left">
                    <Download size={15} />
                    <span>Copia de Seguridad</span>
                  </div>
                  <span className="action-btn-sub">Respaldo</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
