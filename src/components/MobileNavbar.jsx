import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Share2, Users } from 'lucide-react';
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

  const rutaInicio = conIdioma('/', getLang());

  const sinBarra = (ruta) => (ruta || '/').replace(/\/+$/, '') || '/';
  const rutaActual = typeof window === 'undefined' ? '/' : sinBarra(window.location.pathname);
  const esActiva = (destino) =>
    sinBarra(new URL(conIdioma(destino, getLang()), 'http://local').pathname) === rutaActual;
  const claseItem = (destino, extra = '') =>
    'czs-navbar__item' + (extra ? ' ' + extra : '') + (esActiva(destino) ? ' is-active' : '');
  const ariaActual = (destino) => (esActiva(destino) ? 'page' : undefined);

  // En el inicio, "Inicio" no navega: subir al principio es lo que el usuario
  // espera. Recargar queda para el logo de la cabecera. En las demas rutas el
  // enlace sigue llevando al inicio.
  function handleInicioClick(event) {
    if (typeof window === 'undefined') return;
    const actual = sinBarra(window.location.pathname);
    const destino = sinBarra(new URL(rutaInicio, window.location.origin).pathname);
    if (actual !== destino) return;
    event.preventDefault();
    const sinMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: sinMovimiento ? 'auto' : 'smooth' });
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <nav className="czs-navbar" aria-label={t('nav.menu')}>
      <a
        className={claseItem('/')}
        href={rutaInicio}
        aria-label={t('nav.inicio')}
        aria-current={ariaActual('/')}
        onClick={handleInicioClick}
      >
        <span className="czs-navbar__icon-slot">
          <img className="czs-navbar__skull" src="/calavera.svg" alt="" aria-hidden="true" />
        </span>
        <span>{t('nav.tabInicio')}</span>
      </a>
      <button
        type="button"
        className={claseItem('/amigos')}
        aria-label={t('header.radarAmigos') + etiquetaSolicitudes}
        aria-current={ariaActual('/amigos')}
        onClick={onOpenCompareModal}
      >
        <span className="czs-navbar__icon-wrap">
          <Users size={22} strokeWidth={esActiva('/amigos') ? 2.4 : 2} />
          <BadgeSolicitudes n={solicitudesNuevas} className="solicitudes-badge--round" />
        </span>
        <span>{t('nav.tabAmigos')}</span>
      </button>
      <button
        type="button"
        className={claseItem('/compartir')}
        aria-label={t('header.compartirImagen')}
        aria-current={ariaActual('/compartir')}
        onClick={onOpenShareModal}
      >
        <Share2 size={22} strokeWidth={esActiva('/compartir') ? 2.4 : 2} />
        <span>{t('nav.tabCompartir')}</span>
      </button>
      <button
        type="button"
        className={claseItem('/ajustes')}
        aria-label={t('nav.menu')}
        aria-current={ariaActual('/ajustes')}
        onClick={onOpenAjustes}
      >
        <Settings size={22} strokeWidth={esActiva('/ajustes') ? 2.4 : 2} />
        <span>{t('nav.tabAjustes')}</span>
      </button>
    </nav>,
    document.body
  );
}
