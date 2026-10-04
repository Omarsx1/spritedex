import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { t, conIdioma, getLang } from '../i18n';

export function Footer({ onOpenPrivacy }) {
  return (
    <footer className="app-footer">
      <div className="app-footer__content">
        <div className="app-footer__brand">
          <div className="app-navbar__logo-mark app-footer__logo">S</div>
          <span className="app-footer__copyright">
            <span className="footer-full-text">© {new Date().getFullYear()} {t('footer.completo')}</span>
            <span className="footer-short-text">© {new Date().getFullYear()} Spritedex</span>
          </span>
        </div>

        <div className="app-footer__actions">
          {/* Enlaces reales (no botones) a las paginas estaticas: son las unicas que un buscador
              puede rastrear desde la app, y quien llega quiere la guia o el catalogo completo. */}
          <a className="app-footer__privacy-btn" href={conIdioma('/guia-espiritus', getLang())}>{t('footer.guia')}</a>
          <a className="app-footer__privacy-btn" href={conIdioma('/espiritus', getLang())}>{t('footer.espiritus')}</a>
          <button onClick={onOpenPrivacy} className="app-footer__privacy-btn">
            <ShieldCheck size={13} strokeWidth={2.2} />
            <span>{t('footer.cookies')}</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
