import React from 'react';
import { ShieldCheck } from 'lucide-react';

export function Footer({ onOpenPrivacy }) {
  return (
    <footer className="app-footer-pill">
      <div className="app-footer-pill__left">
        <div className="app-navbar__logo-mark">F</div>
        <span className="app-footer-pill__copyright">
          © {new Date().getFullYear()} Fortnite Spritedex · Creado para la comunidad
        </span>
      </div>

      <ul className="app-footer-pill__links">
        <li>
          <button onClick={onOpenPrivacy} className="app-footer-pill__link">
            <ShieldCheck size={13} strokeWidth={2.2} />
            <span>Privacidad</span>
          </button>
        </li>
      </ul>
    </footer>
  );
}
