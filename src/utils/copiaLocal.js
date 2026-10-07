// La copia del navegador sirve para pintar rapido, no para decidir que fichas existen.
//
// El catalogo empaquetado (official_sprites.json) viaja CON el codigo: es la lista de fichas
// que esta version conoce. La copia de localStorage, en cambio, es de la ultima sesion: puede
// traer fichas que el CMS ya borro (hay borrado en SpiritCatalogTable) o que se quitaron del
// catalogo (striker_gem, striker_rift y compania, porque pedian arte inexistente).
//
// Si esa copia se pinta tal cual, la cuadricula y el total muestran fichas fantasma unos
// segundos y despues la consulta a la base las borra: el total sube y baja (122 -> 119) y
// "desaparecen" cartas delante del usuario. Eso es lo que se ve, y no es un lanzamiento.
//
// La regla: una copia solo puede PISAR una ficha que el catalogo ya conoce. Un id que el
// catalogo no tiene se ignora; si de verdad existe (una ficha creada desde el CMS), la
// consulta a la base la trae y aparece cuando se sabe, pero nunca desaparece.
export function filtrarCopiaConfirmada(copia, idsDelCatalogo) {
  if (!Array.isArray(copia) || !idsDelCatalogo) return [];
  return copia.filter((item) => Boolean(item && item.id) && idsDelCatalogo.has(item.id));
}
