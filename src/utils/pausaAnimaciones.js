/**
 * Pausa las animaciones CSS de los bloques que quedan fuera de pantalla.
 *
 * Por que: las animaciones `infinite` siguen repintando aunque su elemento no se vea; en un
 * telefono eso es calor constante con la pagina en reposo. Este modulo observa un conjunto de
 * contenedores con IntersectionObserver y les pone o saca la clase `is-fuera-de-pantalla`;
 * el CSS asociado (index.css) pausa con `animation-play-state` el subarbol del contenedor.
 *
 * Garantias:
 * - Aditivo: si IntersectionObserver no existe o algo falla, no se aplica ninguna clase y la
 *   app se ve exactamente igual que sin este modulo.
 * - Pausa y reanuda donde estaba: no reinicia animaciones ni cambia el diseno.
 * - Sin APIs experimentales (nada de animation-timeline): Safari y Firefox actuales bastan.
 */

const CLASE_FUERA_DE_PANTALLA = 'is-fuera-de-pantalla';

// Contenedores reales del DOM: Hero es Header.jsx (header.hero), la barra de stats es la
// seccion movil .stats-bar, el filtro de escritorio es .filter-bar-container (FilterBar) y el
// movil es .mobile-liquid-wrapper (MobileLiquidFilterBar). El coachmark se observa directo
// porque el propio elemento es el animado (coachmarkFloat).
export const SELECTORES_PAUSA_POR_DEFECTO = [
  '.hero',
  '.stats-bar',
  '.filter-bar-container',
  '.mobile-liquid-wrapper',
  '.mobile-new-coachmark'
];

export function pausarAnimacionesFueraDePantalla(selectores = SELECTORES_PAUSA_POR_DEFECTO) {
  if (typeof document === 'undefined' || typeof IntersectionObserver !== 'function') {
    return () => {};
  }

  const elementos = [];
  for (const selector of selectores) {
    try {
      for (const el of document.querySelectorAll(selector)) elementos.push(el);
    } catch {
      // Selector invalido: se ignora y el resto sigue.
    }
  }
  if (elementos.length === 0) return () => {};

  const observador = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      entrada.target.classList.toggle(CLASE_FUERA_DE_PANTALLA, !entrada.isIntersecting);
    }
  });
  for (const el of elementos) observador.observe(el);

  return () => {
    observador.disconnect();
    for (const el of elementos) el.classList.remove(CLASE_FUERA_DE_PANTALLA);
  };
}

export default { pausarAnimacionesFueraDePantalla };
