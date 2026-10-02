// La ultima red leida vive aqui, fuera de React: la pagina de amigos se desmonta al salir
// de /amigos y con ella moria todo lo leido. Con este hueco, quien vuelve ve su lista al
// instante en vez de una pagina vacia y fria mientras la red responde otra vez.

let red = null;

/** Lo ultimo leido para ese usuario, o null si no es suyo o si todavia no hay nada. */
export function leerRed(userId) {
  if (!userId || !red || red.userId !== userId) return null;
  // Copias: quien lee no puede mutar lo guardado desde fuera.
  return { recibidas: [...red.recibidas], enviadas: [...red.enviadas], amigos: [...red.amigos] };
}

/** Guarda la lectura mas reciente: la ultima respuesta siempre manda. */
export function guardarRed(userId, { recibidas, enviadas, amigos }) {
  if (!userId) return;
  red = { userId, recibidas, enviadas, amigos };
}
