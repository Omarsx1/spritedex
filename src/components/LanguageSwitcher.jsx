import { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { getLang, cambiarIdioma, t } from '../i18n';

// Selector de idioma. Va siempre visible en la barra, porque la deteccion por navegador
// es una apuesta: el usuario manda. Cambiar de idioma recarga en la ruta equivalente.
const OPCIONES = [
  { code: 'es', label: 'ES', nombre: 'Español' },
  { code: 'en', label: 'EN', nombre: 'English' },
  { code: 'pt-BR', label: 'PT-BR', nombre: 'Português (Brasil)' }
];

export function LanguageSwitcher({ className = '' }) {
  const lang = getLang();
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef(null);
  const disparador = useRef(null);
  const menuId = useId();
  const actual = OPCIONES.find((opcion) => opcion.code === lang) || OPCIONES[0];

  useEffect(() => {
    if (!abierto) return undefined;
    const alPulsarFuera = (evento) => {
      if (!raiz.current?.contains(evento.target)) setAbierto(false);
    };
    const alPulsarTecla = (evento) => {
      if (evento.key !== 'Escape') return;
      setAbierto(false);
      disparador.current?.focus();
    };
    document.addEventListener('pointerdown', alPulsarFuera);
    document.addEventListener('keydown', alPulsarTecla);
    return () => {
      document.removeEventListener('pointerdown', alPulsarFuera);
      document.removeEventListener('keydown', alPulsarTecla);
    };
  }, [abierto]);

  const elegir = (code) => {
    setAbierto(false);
    if (code !== lang) cambiarIdioma(code);
  };

  return (
    <div ref={raiz} className={`lang-switch ${abierto ? 'is-open' : ''} ${className}`.trim()}>
      <button
        ref={disparador}
        type="button"
        className="lang-switch__disparador"
        aria-expanded={abierto}
        aria-controls={menuId}
        aria-label={`${t('idioma.etiqueta')}: ${actual.nombre}`}
        onClick={() => setAbierto((estaAbierto) => !estaAbierto)}
      >
        <Globe size={14} aria-hidden="true" />
        <span className="lang-switch__codigo" lang={actual.code}>{actual.label}</span>
        <ChevronDown size={13} aria-hidden="true" className="lang-switch__flecha" />
      </button>
      {abierto && (
        <ul id={menuId} className="lang-switch__menu" aria-label={t('idioma.etiqueta')}>
          {OPCIONES.map((opcion) => {
            const activo = opcion.code === lang;
            return (
              <li key={opcion.code}>
                <button
                  type="button"
                  lang={opcion.code}
                  className="lang-switch__opcion"
                  aria-current={activo ? 'true' : undefined}
                  onClick={() => elegir(opcion.code)}
                >
                  <span>{opcion.nombre}</span>
                  {activo && <Check size={15} aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
