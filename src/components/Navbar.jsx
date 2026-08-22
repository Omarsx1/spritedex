import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Download, User, LogOut, ShieldCheck, ChevronDown, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabase';

export function Navbar({
  user,
  activeGen = 2,
  onGenChange,
  onOpenAuthModal,
  onOpenBackupModal,
  onSignOut
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isGenOpen, setIsGenOpen] = useState(false);
  const dropdownRef = useRef(null);
  const genDropdownRef = useRef(null);

  const displayName = useMemo(() => {
    if (!user) return null;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split('@')[0];
    if (user.is_anonymous) return 'Invitado';
    return 'Mi Cuenta';
  }, [user]);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  // Click outside listener to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (genDropdownRef.current && !genDropdownRef.current.contains(event.target)) {
        setIsGenOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAvatarClick = () => {
    if (user) {
      setIsDropdownOpen((prev) => !prev);
      setIsGenOpen(false);
    } else {
      onOpenAuthModal();
    }
  };

  const handleSignOutClick = async (e) => {
    e.stopPropagation();
    setIsDropdownOpen(false);
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Error during sign out:', err);
    }
    if (onSignOut) onSignOut();
  };

  return (
    <nav className="app-navbar">
      {/* Logo */}
      <div className="app-navbar__left">
        <div className="app-navbar__logo-mark">F</div>
      </div>

      {/* Acciones centrales / derechas */}
      <div className="app-navbar__right">
        {/* Selector de Generación Dropdown al costado de Respaldo */}
        <div className="app-navbar__gen-selector" ref={genDropdownRef}>
          <button
            className={`app-navbar__gen-btn ${activeGen === 2 ? 'is-gen2' : activeGen === 1 ? 'is-gen1' : 'is-all'} ${isGenOpen ? 'is-active' : ''}`}
            onClick={() => { setIsGenOpen((prev) => !prev); setIsDropdownOpen(false); }}
            title="Seleccionar Generación"
          >
            <span className="gen-btn-label">
              {activeGen === 2 ? '2da Gen' : activeGen === 1 ? '1ra Gen' : 'Todas'}
            </span>
            <ChevronDown size={13} className={`app-navbar__chevron ${isGenOpen ? 'open' : ''}`} />
          </button>

          {isGenOpen && (
            <div className="app-navbar__gen-dropdown glass-panel">
              <button
                className={`app-navbar__gen-option ${activeGen === 2 ? 'selected' : ''}`}
                onClick={() => { if (onGenChange) onGenChange(2); setIsGenOpen(false); }}
              >
                <div className="gen-option-content">
                  <span className="gen-option-title">2da Gen</span>
                  <span className="gen-option-subtitle">33 sprites · Actual</span>
                </div>
                {activeGen === 2 && <span className="gen-option-check">✓</span>}
              </button>

              <button
                className={`app-navbar__gen-option ${activeGen === 1 ? 'selected' : ''}`}
                onClick={() => { if (onGenChange) onGenChange(1); setIsGenOpen(false); }}
              >
                <div className="gen-option-content">
                  <span className="gen-option-title">1ra Gen</span>
                  <span className="gen-option-subtitle">117 sprites</span>
                </div>
                {activeGen === 1 && <span className="gen-option-check">✓</span>}
              </button>

              <div className="app-navbar__dropdown-divider" />

              <button
                className={`app-navbar__gen-option ${activeGen === 0 ? 'selected' : ''}`}
                onClick={() => { if (onGenChange) onGenChange(0); setIsGenOpen(false); }}
              >
                <div className="gen-option-content">
                  <span className="gen-option-title">Todas</span>
                  <span className="gen-option-subtitle">150 sprites total</span>
                </div>
                {activeGen === 0 && <span className="gen-option-check">✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Botón Respaldo */}
        <button
          className="app-navbar__item"
          onClick={onOpenBackupModal}
          title="Copia de Seguridad"
        >
          <Download size={14} strokeWidth={2.4} />
          <span>Respaldo</span>
        </button>

        {/* Avatar / Usuario */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            className={`app-navbar__avatar ${user ? 'is-logged' : ''} ${isDropdownOpen ? 'is-active' : ''}`}
            onClick={handleAvatarClick}
            title={user ? `Conectado como ${user.email || displayName}` : 'Iniciar Sesión'}
            aria-label={user ? 'Cuenta de usuario' : 'Iniciar sesión'}
            aria-expanded={user ? isDropdownOpen : undefined}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="app-navbar__avatar-img" />
            ) : (
              <User size={15} strokeWidth={2.2} />
            )}

            {user && (
              <span className="app-navbar__username">{displayName}</span>
            )}

            {user && <ChevronDown size={13} className={`app-navbar__chevron ${isDropdownOpen ? 'open' : ''}`} />}
            {user && <span className="app-navbar__avatar-dot" />}
          </button>

          {/* Dropdown Menu (cuando el usuario está conectado) */}
          {user && isDropdownOpen && (
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
                    <span className="app-navbar__dropdown-name">{displayName}</span>
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
      </div>
    </nav>
  );
}
