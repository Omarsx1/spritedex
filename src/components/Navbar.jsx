import React from 'react';
import { Download, User } from 'lucide-react';

export function Navbar({ user, onOpenAuthModal, onOpenBackupModal }) {
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

        {/* Avatar — abre auth modal */}
        <button
          className={`app-navbar__avatar ${user ? 'is-logged' : ''}`}
          onClick={onOpenAuthModal}
          title={user ? `Conectado como ${user.email || 'Usuario'}` : 'Iniciar Sesión'}
          aria-label={user ? 'Cuenta' : 'Iniciar sesión'}
        >
          <User size={15} strokeWidth={2.2} />
          {user && <span className="app-navbar__avatar-dot" />}
        </button>
      </div>
    </nav>
  );
}
