import React, { useEffect, useId, useRef, useState } from 'react';
import { ChevronUp, ShieldCheck } from 'lucide-react';
import { t, conIdioma, getLang } from '../i18n';

export function Footer({ onOpenPrivacy }) {
  const [abierto, setAbierto] = useState(false);
  const footerRef = useRef(null);
  const triggerRef = useRef(null);
  const panelId = useId();

  // The accessible label is built inline (bilingual) because the i18n locale
  // files are outside this change's allowed edit surface, so no new key can be added.
  const etiquetaTrigger = getLang() === 'en'
    ? (abierto ? 'Close footer links' : 'Open footer links')
    : (abierto ? 'Cerrar enlaces del pie' : 'Abrir enlaces del pie');

  // Escape y clic fuera solo se escuchan con el panel abierto; se limpian al cerrar
  // y al desmontar. El clic se ignora si nace dentro del footer (disparador incluido).
  useEffect(() => {
    if (!abierto) return undefined;

    function alTeclear(evento) {
      if (evento.key !== 'Escape') return;
      setAbierto(false);
      triggerRef.current?.focus();
    }

    function alPulsarFuera(evento) {
      if (footerRef.current && footerRef.current.contains(evento.target)) return;
      setAbierto(false);
    }

    document.addEventListener('keydown', alTeclear);
    document.addEventListener('pointerdown', alPulsarFuera);
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.removeEventListener('pointerdown', alPulsarFuera);
    };
  }, [abierto]);

  return (
    <footer className="app-footer" ref={footerRef}>
      <div className="app-footer__content">
        {/* El disparador va en el borde IZQUIERDO de la pildora: la esquina inferior derecha
            la ocupa el FAB de Fortnitemares (.fnm-pumpkin-btn, fixed z-index 9999), asi que un
            toque real ahi abria el menu del FAB en vez del panel del pie. */}
        <button
          ref={triggerRef}
          type="button"
          className="app-footer__trigger"
          aria-expanded={abierto}
          aria-haspopup="true"
          aria-controls={panelId}
          aria-label={etiquetaTrigger}
          onClick={() => setAbierto((previo) => !previo)}
        >
          <ChevronUp className="app-footer__chevron" size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>

        <div className="app-footer__brand">
          <div className="app-navbar__logo-mark app-footer__logo">S</div>
          <span className="app-footer__copyright">
            <span className="footer-full-text">© {new Date().getFullYear()} {t('footer.completo')}</span>
            <span className="footer-short-text">© {new Date().getFullYear()} Spritedex</span>
          </span>
        </div>

        {/* El panel solo existe abierto: asi no hay nada enfocable ni visible de mas.
            Flota por encima de la pildora (position: absolute) y no empuja el layout. */}
        {abierto && (
          <div id={panelId} className="app-footer__panel">
            {/* Enlaces reales (no botones) a las paginas estaticas: son las unicas que un buscador
                puede rastrear desde la app, y quien llega quiere la guia o el catalogo completo. */}
            <a
              className="app-footer__privacy-btn"
              href={conIdioma('/guia-espiritus', getLang())}
              onClick={() => setAbierto(false)}
            >{t('footer.guia')}</a>
            <a
              className="app-footer__privacy-btn"
              href={conIdioma('/espiritus', getLang())}
              onClick={() => setAbierto(false)}
            >{t('footer.espiritus')}</a>
            <button
              type="button"
              className="app-footer__privacy-btn"
              onClick={() => {
                setAbierto(false);
                onOpenPrivacy?.();
              }}
            >
              <ShieldCheck size={13} strokeWidth={2.2} />
              <span>{t('footer.cookies')}</span>
            </button>
            <p className="app-footer__panel-copy">© {new Date().getFullYear()} {t('footer.completo')}</p>
          </div>
        )}
      </div>
    </footer>
  );
}
