import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Home, Settings, Share2, Users } from 'lucide-react';
import { conIdioma } from '../i18n/core';
import { getLang } from '../i18n/texto';
import { t } from '../i18n';
import { BadgeSolicitudes } from './BadgeSolicitudes';

// Barra de navegacion movil. Vive en la raiz de la app (no en el hero) para que
// aparezca en todas las rutas: inicio, amigos, compartir y guia.
export function MobileNavbar({
  solicitudesNuevas = 0,
  onOpenCompareModal,
  onOpenShareModal,
  onOpenAjustes
}) {
  // Reserva el alto de la barra al final del documento.
  useEffect(() => {
    if (typeof document === 'undefined') return undefined;
    document.body.classList.add('has-czs-navbar');
    return () => document.body.classList.remove('has-czs-navbar');
  }, []);

  const etiquetaSolicitudes = solicitudesNuevas > 0
    ? ' · ' + t('header.solicitudesNuevas', { n: solicitudesNuevas })
    : '';

  if (typeof document === 'undefined') return null;

  return createPortal(
    <nav className="czs-navbar" aria-label={t('nav.menu')}>
      <a
        className="czs-navbar__item"
        href={conIdioma('/', getLang())}
        aria-label={t('nav.inicio')}
      >
        <Home size={20} strokeWidth={2.2} />
        <span>{t('nav.tabInicio')}</span>
      </a>
      <button
        type="button"
        className="czs-navbar__item"
        aria-label={t('header.radarAmigos') + etiquetaSolicitudes}
        onClick={onOpenCompareModal}
      >
        <span className="czs-navbar__icon-wrap">
          <Users size={20} strokeWidth={2.2} />
          <BadgeSolicitudes n={solicitudesNuevas} className="solicitudes-badge--round" />
        </span>
        <span>{t('nav.tabAmigos')}</span>
      </button>
      <button
        type="button"
        className="czs-navbar__item"
        aria-label={t('header.compartirImagen')}
        onClick={onOpenShareModal}
      >
        <Share2 size={20} strokeWidth={2.2} />
        <span>{t('nav.tabCompartir')}</span>
      </button>
      <button
        type="button"
        className="czs-navbar__item"
        aria-label={t('nav.menu')}
        onClick={onOpenAjustes}
      >
        <Settings size={20} strokeWidth={2.2} />
        <span>{t('nav.tabAjustes')}</span>
      </button>
    </nav>,
    document.body
  );
}
