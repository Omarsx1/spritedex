import React from 'react';
import { ShieldCheck, Database, Sparkles, Heart } from 'lucide-react';

export function Footer({ onOpenBackup, onOpenPrivacy }) {
  return (
    <footer className="app-footer">
      <div className="app-footer__container">
        {/* Brand Column */}
        <div className="app-footer__brand">
          <div className="app-footer__logo-wrap">
            <span className="app-footer__logo-mark">F</span>
            <span className="app-footer__title">FORTNITE <span className="app-footer__title-accent">SPRITEDEX</span></span>
          </div>
          <p className="app-footer__desc">
            El rastreador y Pokédex definitiva para los Espíritus de Fortnite. Registra tus capturas, sube el nivel de maestría y comparte tu colección.
          </p>
        </div>

        {/* Links Column */}
        <div className="app-footer__links-col">
          <h4 className="app-footer__subtitle">Herramientas & Ajustes</h4>
          <ul className="app-footer__link-list">
            <li>
              <button onClick={onOpenBackup} className="app-footer__link-btn">
                <Database size={14} />
                <span>Copia de Respaldo</span>
              </button>
            </li>
            <li>
              <button onClick={onOpenPrivacy} className="app-footer__link-btn">
                <ShieldCheck size={14} />
                <span>Privacidad y Cookies</span>
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimer and Copyright */}
      <div className="app-footer__bottom">
        <div className="app-footer__bottom-container">
          <p className="app-footer__disclaimer">
            Fortnite Spritedex es un proyecto independiente para fans. Fortnite y Epic Games son marcas registradas de Epic Games, Inc.
          </p>
          <p className="app-footer__copyright">
            © {new Date().getFullYear()} Fortnite Spritedex · Hecho con <Heart size={12} className="app-footer__heart" /> para la comunidad.
          </p>
        </div>
      </div>
    </footer>
  );
}
