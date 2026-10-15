// Rutas canonicas del arte de los espiritus: un SOLO sitio para la app y para el
// sincronizador automatico.
//
// Vive fuera de spritesData.js a proposito: ese modulo importa JSON y un script de Node no
// puede cargarlo tal cual. El sincronizador lee la MISMA tabla, asi que escribe en la ruta
// que la app va a leer.
//
// Ya no hay nombres alternativos: cada espiritu se sirve desde /sprites/<id>.webp. Los seis
// que quedaban (peely_candy, llama_candy y los cuatro *_quack) se bajaron con su id correcto
// y se borraron los archivos viejos: por esa diferencia de nombre el sync volvia a bajar arte
// que ya estaba y lo commiteaba como duplicado.
//
// Toda ruta de este mapa tiene que existir en public/: si falta, el sync la baja a ese
// mismo nombre (la app lee esa ruta, no el id).

export const WEBP_MAP = {
  'ironmouse_basic': '/sprites/ironmouse_basic.webp',
  'llama_basic': '/sprites/llama_basic.webp',
  'llama_gold': '/sprites/llama_gold.webp',
  'llama_galaxy': '/sprites/llama_galaxy.webp',
  'llama_gem': '/sprites/llama_gem.webp',
  'peely_basic': '/sprites/peely_basic.webp',
  'peely_gold': '/sprites/peely_gold.webp',
  'peely_galaxy': '/sprites/peely_galaxy.webp',
  'peely_holofoil': '/sprites/peely_holofoil.webp',
  'zeropoint_holofoil': '/sprites/zeropoint_holofoil.webp',
  'grim_holofoil': '/sprites/grim_holofoil.webp',
  'grim_gem': '/sprites/grim_gem.webp',
  // Familia Estanque (Pond) - Resolución explícita inmutable
  'pond_basic': '/sprites/pond_basic.webp',
  'pond_gold': '/sprites/pond_gold.webp',
  'pond_cheatmaster': '/sprites/pond_cheatmaster.webp',
  'pond_loothacker': '/sprites/pond_loothacker.webp',
  'pond_bountyhunter': '/sprites/pond_bountyhunter.webp',
  // Otras familias Gen 2
  'blinky_basic': '/sprites/blinky_basic.webp',
  'blinky_gold': '/sprites/blinky_gold.webp',
  'blinky_cheatmaster': '/sprites/blinky_cheatmaster.webp',
  'blinky_loothacker': '/sprites/blinky_loothacker.webp',
  'blinky_bountyhunter': '/sprites/blinky_bountyhunter.webp',
  'crash_basic': '/sprites/crash_basic.webp',
  'crash_gold': '/sprites/crash_gold.webp',
  'crash_cheatmaster': '/sprites/crash_cheatmaster.webp',
  'crash_loothacker': '/sprites/crash_loothacker.webp',
  'crash_bountyhunter': '/sprites/crash_bountyhunter.webp',
  'birthday_basic': '/sprites/birthday_basic.webp',
  'birthday_gold': '/sprites/birthday_gold.webp',
  'birthday_cheatmaster': '/sprites/birthday_cheatmaster.webp',
  'birthday_loothacker': '/sprites/birthday_loothacker.webp',
  'birthday_bountyhunter': '/sprites/birthday_bountyhunter.webp',
  'morgana_basic': '/sprites/morgana_basic.webp',
  'morgana_gold': '/sprites/morgana_gold.webp',
  'morgana_cheatmaster': '/sprites/morgana_cheatmaster.webp',
  'morgana_loothacker': '/sprites/morgana_loothacker.webp',
  'morgana_bountyhunter': '/sprites/morgana_bountyhunter.webp'
};
// Espiritus que todavia no tienen arte real: su hueco lo cubre un placeholder vectorial
// (un degradado de ~1 KB en .svg). Cuando llegue el arte de verdad hay que quitar el id de
// esta lista Y descargarlo con el nombre de arriba; mientras siga aqui, la app pedira el .svg
// aunque exista un .webp.
export const ART_VECTORIAL = new Set([
  // Nadie ahora mismo: el ultimo era peely_candy, que ya tiene arte real. La lista se
  // queda como red para el proximo espiritu que salga sin arte.
]);

export const DIRECTORIO_ARTE = '/sprites/';

// Ruta con la que la app pide el arte de un espiritu, y a la que el sync debe escribir.
export function rutaArteCanonica(id) {
  if (!id) return '';
  if (WEBP_MAP[id]) return WEBP_MAP[id];
  return DIRECTORIO_ARTE + id + '.' + (ART_VECTORIAL.has(id) ? 'svg' : 'webp');
}

// Nombre de archivo (sin directorio) de esa ruta: lo que el sync tiene que comprobar en disco.
export function archivoArteCanonico(id) {
  return rutaArteCanonica(id).split('/').pop();
}
