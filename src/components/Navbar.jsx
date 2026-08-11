import React, { useMemo } from 'react';
import { Download, User } from 'lucide-react';

export function Navbar({ user, onOpenAuthModal, onOpenBackupModal }) {
  const displayName = useMemo(() => {
    if (!user) return null;
    if (user.user_metadata?.full_name) return user.user_metadata.full_name;
    if (user.user_metadata?.name) return user.user_metadata.name;
    if (user.email) return user.email.split('@')[0];
    if (user.is_anonymous) return 'Invitado';
    return 'Mi Cuenta';
  }, [user]);

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <nav className="app-navbar">
      {/* Logo */}
      <div className="app-navbar__left">
        <div className="app-navbar__logo-mark">F</div>
      </div>

      {/* Acciones centrales / derechas */}
      <div className="app-navbar__right">
        <button
          className="app-navbar__item"
          onClick={onOpenBackupModal}
          title="Copia de Seguridad"
        >
          <Download size={14} strokeWidth={2.4} />
          <span>Respaldo</span>
        </button>

        {/* Avatar / Usuario — abre auth modal */}
        <button
          className={`app-navbar__avatar ${user ? 'is-logged' : ''}`}
          onClick={onOpenAuthModal}
          title={user ? `Conectado como ${user.email || displayName}` : 'Iniciar Sesión'}
          aria-label={user ? 'Cuenta' : 'Iniciar sesión'}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="app-navbar__avatar-img" />
          ) : (
            <User size={15} strokeWidth={2.2} />
          )}

          {user && (
            <span className="app-navbar__username">{displayName}</span>
          )}

          {user && <span className="app-navbar__avatar-dot" />}
        </button>
      </div>
    </nav>
  );
}
