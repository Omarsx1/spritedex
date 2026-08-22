import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Footer({ onOpenPrivacy }) {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__brand">
          <div className="app-navbar__logo-mark app-footer__logo">F</div>
          <span className="app-footer__copyright">
            © {new Date().getFullYear()} Fortnite Spritedex · Creado para la comunidad
          </span>
        </div>

        <div className="app-footer__actions">
          <button onClick={onOpenPrivacy} className="app-footer__privacy-btn">
            <ShieldCheck size={13} strokeWidth={2.2} />
            <span>Privacidad</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
