import { useEffect, useState } from 'react';
import { Languages, Moon, Download, Smartphone, ShieldCheck } from 'lucide-react';
import { t } from '../i18n';
import { getLang } from '../i18n/texto';
import { conIdioma } from '../i18n/core';
import { leerAnimaciones, aplicarAnimaciones } from '../utils/animaciones';
import { LanguageSwitcher } from './LanguageSwitcher';

// Ajustes: preferencias y acciones de la app. La navegacion (generaciones, guia, catalogo)
// vive en el menu de la cabecera; aqui solo lo que se configura o se ejecuta sobre la app.
export function AjustesPage({ onOpenPrivacy, onOpenBackup }) {
  const [animations, setAnimations] = useState(leerAnimaciones);

  useEffect(() => {
    aplicarAnimaciones(animations);
  }, [animations]);

  return (
    <div className="fpage ajustes-page">
      <div className="fpage__top">
        <div className="fpage__headText">
          <h1 className="fpage__title">{t('nav.tabAjustes')}</h1>
          <p className="fpage__sub">{t('ajustes.subtitulo')}</p>
        </div>
      </div>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo"><Languages size={16} /> {t('ajustes.idioma')}</h2>
        <div className="ajustes-fila">
          <span>{getLang().toUpperCase()}</span>
          <LanguageSwitcher />
        </div>
      </section>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo"><Moon size={16} /> {t('ajustes.animaciones')}</h2>
        <label className="ajustes-fila">
          <span>{t('ajustes.animacionesDetalle')}</span>
          <input
            type="checkbox"
            checked={animations}
            onChange={(e) => setAnimations(e.target.checked)}
            className="mobile-toggle-input"
          />
          <span className={`mobile-toggle-switch ${animations ? 'is-on' : ''}`}>
            <span className="mobile-toggle-thumb" />
          </span>
        </label>
      </section>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo"><Smartphone size={16} /> {t('ajustes.aplicacion')}</h2>
        <div className="ajustes-opciones ajustes-opciones--vertical">
          <button
            type="button"
            className="ajustes-enlace ajustes-enlace--accion"
            onClick={() => window.dispatchEvent(new CustomEvent('spritedex:open-install-prompt'))}
          >
            <Smartphone size={15} />
            <span>{t('nav.instalar')}</span>
          </button>
        </div>
      </section>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo"><Download size={16} /> {t('ajustes.datos')}</h2>
        <div className="ajustes-opciones ajustes-opciones--vertical">
          <button
            type="button"
            className="ajustes-enlace ajustes-enlace--accion"
            onClick={onOpenBackup}
          >
            <Download size={15} />
            <span>{t('nav.respaldo')}</span>
          </button>
        </div>
      </section>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo"><ShieldCheck size={16} /> {t('ajustes.enlaces')}</h2>
        <div className="ajustes-opciones ajustes-opciones--vertical">
          <a className="ajustes-enlace" href={conIdioma('/amigos', getLang())}>{t('nav.tabAmigos')}</a>
          <a className="ajustes-enlace" href={conIdioma('/compartir', getLang())}>{t('nav.tabCompartir')}</a>
          <button type="button" className="ajustes-enlace" onClick={onOpenPrivacy}>
            <ShieldCheck size={15} />
            <span>{t('ajustes.privacidad')}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
