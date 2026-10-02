// La ficha de un amigo ya cargada: la regla que decide si el boton "Ver su colección"
// sobra porque esa misma colección ya esta en pantalla.
//
// Vive aqui, y no dentro de FriendsPage, porque es la unica regla que compara el codigo
// pedido con el codigo cargado. Suelta se puede probar sin montar la app
// (tests/fichaAmigo.test.js). La trampa que evita: el mismo amigo escrito con el prefijo
// SDEX- o sin el, en minusculas o con separadores, es el MISMO amigo.

/** Codigo comparable: sin prefijo SDEX-, en mayusculas y sin nada que no sea [A-Z0-9]. */
export function codigoNormalizado(codigo) {
  return String(codigo || '')
    .replace(/^SDEX-/i, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

/**
 * ¿La colección que ya esta cargada es la de esta ficha?
 * Solo cuenta como cargada si HAY colección y los dos codigos normalizados coinciden.
 * Sin colección no hay nada comparado, y un codigo vacio no debe coincidir con nada:
 * si coincidiera, el boton desapareceria sin que hubiera nada cargado.
 */
export function fichaYaCargada({ codigoFicha, codigoCargado, hayColeccion }) {
  if (!hayColeccion) return false;
  const ficha = codigoNormalizado(codigoFicha);
  return ficha !== '' && ficha === codigoNormalizado(codigoCargado);
}
