import { getLang, cambiarIdioma, t } from '../i18n';

// Selector de idioma. Va siempre visible en la barra, porque la deteccion por navegador
// es una apuesta: el usuario manda. Cambiar de idioma recarga en la ruta equivalente.
const OPCIONES = [
  { code: 'es', label: 'ES', nombre: 'Español' },
  { code: 'en', label: 'EN', nombre: 'English' }
];

export function LanguageSwitcher({ className = '' }) {
  const lang = getLang();
  return (
    <div className={`lang-switch ${className}`.trim()} role="group" aria-label={t('idioma.etiqueta')}>
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.code}
          type="button"
          lang={opcion.code}
          title={opcion.nombre}
          aria-pressed={opcion.code === lang}
          className={`lang-switch__btn ${opcion.code === lang ? 'is-active' : ''}`.trim()}
          onClick={() => {
            if (opcion.code !== lang) cambiarIdioma(opcion.code);
          }}
        >
          {opcion.label}
        </button>
      ))}
    </div>
  );
}
