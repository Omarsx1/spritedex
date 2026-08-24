import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Footer({ onOpenPrivacy }) {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__brand">
          <div className="app-navbar__logo-mark app-footer__logo">S</div>
          <span className="app-footer__copyright">
            <span className="footer-full-text">© {new Date().getFullYear()} Spritedex · Colección de Espíritus · Creado para la comunidad</span>
            <span className="footer-short-text">© {new Date().getFullYear()} Spritedex</span>
          </span>
        </div>

        <div className="app-footer__actions">
          <button onClick={onOpenPrivacy} className="app-footer__privacy-btn">
            <ShieldCheck size={13} strokeWidth={2.2} />
            <span>Cookies & Privacidad</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
