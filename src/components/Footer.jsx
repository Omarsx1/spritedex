import React from 'react';
import { Database, ShieldCheck } from 'lucide-react';

export function Footer({ onOpenBackup, onOpenPrivacy }) {
  return (
    <footer className="app-footer-subtle">
      <div className="app-footer-subtle__container">
        <div className="app-footer-subtle__brand">
          <span className="app-footer-subtle__logo">F</span>
          <span className="app-footer-subtle__text">FORTNITE <strong>SPRITEDEX</strong> © {new Date().getFullYear()}</span>
        </div>

        <div className="app-footer-subtle__links">
          <button onClick={onOpenBackup} className="app-footer-subtle__btn">
            <Database size={13} />
            <span>Respaldo</span>
          </button>
          <span className="app-footer-subtle__dot">•</span>
          <button onClick={onOpenPrivacy} className="app-footer-subtle__btn">
            <ShieldCheck size={13} />
            <span>Privacidad</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
