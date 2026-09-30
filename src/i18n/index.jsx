// Puerta de entrada de React para el idioma: provee useI18n() y aplica el plan de arranque.
// Los textos se piden con t() de './texto', que funciona tambien fuera de React.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { planDeArranque } from './core.js';
import { cambiarIdioma, fijarIdiomaEnMemoria, getLang, setLang, t } from './texto.js';

export { t, getLang, setLang, cambiarIdioma };
export { detectarIdioma, conIdioma, normalizarIdioma, rutaSinIdioma, traducir } from './core.js';

let planInicial = null;

// Se resuelve una sola vez: idioma de arranque y, si toca, la URL a la que movernos.
function resolverPlan() {
  if (planInicial) return planInicial;
  const hayVentana = typeof window !== 'undefined';
  planInicial = planDeArranque({
    pathname: hayVentana ? window.location.pathname : '/',
    search: hayVentana ? window.location.search : '',
    hash: hayVentana ? window.location.hash : '',
    langs: typeof navigator !== 'undefined' ? navigator.languages : undefined
  });
  fijarIdiomaEnMemoria(planInicial.lang);
  return planInicial;
}

const LanguageContext = createContext({ lang: 'es', setLang, cambiarIdioma, t });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => resolverPlan().lang);

  // Primera carga: si el navegador viene en ingles y no hay eleccion guardada, la URL
  // se mueve a /en antes del primer pintado. Sin redireccion de servidor ni middleware.
  useEffect(() => {
    const plan = resolverPlan();
    fijarIdiomaEnMemoria(plan.lang);
    document.documentElement.lang = plan.lang;
    if (!plan.destino) return;
    const actual = window.location.pathname + window.location.search + window.location.hash;
    if (plan.destino !== actual) window.history.replaceState({}, '', plan.destino);
  }, []);

  const valor = useMemo(() => ({
    lang,
    setLang: (nuevo) => setLangState(setLang(nuevo)),
    cambiarIdioma,
    t
  }), [lang]);

  return <LanguageContext.Provider value={valor}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  return useContext(LanguageContext);
}
