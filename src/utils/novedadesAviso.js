/**
 * Aviso flotante de espiritus nuevos: cuantos hay y cuando se dio por visto.
 *
 * La clave con la que se recuerda el aviso llevaba una fecha fija dentro
   ('...new_drop_2026_09_26_birthday'), asi que quien lo vio o lo cerro en
 * septiembre no volvia a verlo NUNCA: los drops siguientes llegaban con el
 * aviso ya gastado. Ahora la clave se deriva del drop mas reciente, de modo
 * que cada tanda de espiritus nuevos vuelve a avisar UNA vez por navegador.
 *
 * Vive fuera de los componentes para que los tests lo fijen sin JSX, y para
 * que la vista de escritorio y la de movil no puedan divergir.
 */

export function contarNovedades(sprites) {
  return (sprites || []).filter((s) => s && s.isNew && !s.unreleased).length;
}

export function claveAvisoNovedades(sprites) {
  const nuevos = (sprites || []).filter((s) => s && s.isNew && !s.unreleased);
  const fechas = nuevos
    .map((s) => s.releaseDate || s.release_date || '')
    .filter(Boolean)
    .sort();
  const ultima = fechas[fechas.length - 1] || 'sin-fecha';
  if (!fechas.length) return 'spritedex_visto_novedades_sin_fecha';
  return 'spritedex_visto_novedades_' + String(ultima).replace(/[^0-9]/g, '');
}
