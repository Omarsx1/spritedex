import { useEffect, useState } from 'react';
import { Languages, Moon, Sparkles } from 'lucide-react';
import { t } from '../i18n';
import { getLang } from '../i18n/texto';
import { conIdioma } from '../i18n/core';
import { safeStorage } from '../utils/safeStorage';
import { GENERATIONS } from '../data/spritesData';
import { LanguageSwitcher } from './LanguageSwitcher';

// Ajustes como pagina propia: antes era un desplegable del navbar y en movil se
// quedaba fuera de la barra de navegacion.
export function AjustesPage({ activeGen = 3, onGenChange, onOpenPrivacy }) {
  const [animations, setAnimations] = useState(() => {
    const stored = safeStorage.getItem('spritedex_animations_enabled');
    return stored === null ? true : stored === 'true';
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const raiz = document.documentElement;
    const cuerpo = document.body;
    if (animations) {
      raiz.classList.remove('motion-disabled');
      cuerpo.classList.remove('motion-disabled');
    } else {
      raiz.classList.add('motion-disabled');
      cuerpo.classList.add('motion-disabled');
    }
    safeStorage.setItem('spritedex_animations_enabled', animations ? 'true' : 'false');
  }, [animations]);

  const generaciones = [
    ...GENERATIONS.slice().sort((a, b) => b.id - a.id),
    { id: 0, name: t('nav.todas'), title: t('nav.todas') }
  ];

  return (
    <div className="fpage ajustes-page">
      <div className="fpage__top">
        <div className="fpage__headText">
          <h1 className="fpage__title">{t('nav.tabAjustes')}</h1>
          <p className="fpage__sub">{t('ajustes.subtitulo')}</p>
        </div>
      </div>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo"><Sparkles size={16} /> {t('ajustes.generacion')}</h2>
        <div className="ajustes-opciones">
          {generaciones.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`ajustes-opcion ${activeGen === g.id ? 'is-active' : ''}`}
              onClick={() => onGenChange?.(g.id)}
            >
              {g.name}
            </button>
          ))}
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
        <h2 className="ajustes-titulo"><Languages size={16} /> {t('ajustes.idioma')}</h2>
        <div className="ajustes-fila">
          <span>{getLang().toUpperCase()}</span>
          <LanguageSwitcher />
        </div>
      </section>

      <section className="ajustes-bloque">
        <h2 className="ajustes-titulo">{t('ajustes.enlaces')}</h2>
        <div className="ajustes-opciones ajustes-opciones--vertical">
          <a className="ajustes-enlace" href={conIdioma('/amigos', getLang())}>{t('nav.tabAmigos')}</a>
          <a className="ajustes-enlace" href={conIdioma('/compartir', getLang())}>{t('nav.tabCompartir')}</a>
          <button type="button" className="ajustes-enlace" onClick={onOpenPrivacy}>{t('ajustes.privacidad')}</button>
        </div>
      </section>
    </div>
  );
}
