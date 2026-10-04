// Ruta del asset de un espiritu, decidida en un solo sitio.
//
// Antes cada consumidor la construia a mano: '/sprites/' + id con un ternario por generacion
// para la extension, mas una lista de familias "con basic en webp" repetida en cuatro
// componentes. Cambiar un asset obligaba a acertar en todos: uno olvidado es una imagen rota
// en un estado concreto.
//
// Sin dependencias a proposito: lo importan componentes, la capa de datos y el canvas de la
// lona, y las pruebas de node lo cargan sin DOM (igual que spriteName.js).

const SPRITES_DIR = '/sprites/';

// Todos los assets de espiritus son WebP: los PNG que quedaban de gen 1 se convirtieron (los
// que eran WebP con extension .png se renombraron). Si algun dia conviven dos formatos, la
// regla se cambia AQUI y no en cada consumidor.
//
// Excepcion: los placeholders de los espiritus que todavia no tienen arte son SVG (un
// degradado vectorial de 1,2 KB guardado con extension .png, que ademas se servia con el tipo
// equivocado y por eso no se pintaba). Rasterizarlos a WebP los haria siete veces mas pesados
// y borrosos al ampliarlos, asi que se quedan vectoriales.
const ASSET_VECTORIAL = new Set([
  'air_gem', 'aura_holofoil', 'batman_gem', 'boss_gem', 'duck_holofoil', 'peely_candy'
]);

export function rutaAssetEspiritu(id) {
  if (!id) return '';
  return `${SPRITES_DIR}${id}.${ASSET_VECTORIAL.has(id) ? 'svg' : 'webp'}`;
}

// Segundo intento: el basico de la familia, cuando el espiritu no tiene imagen propia.
export function rutaBasicoFamilia(baseId) {
  return `${SPRITES_DIR}${baseId || 'water'}_basic.webp`;
}

// Ultimo recurso, cuando ni el basico existe. Uno por generacion, para que el hueco se note
// lo menos posible.
export function rutaFallbackEspiritu(gen) {
  return gen === 2 ? `${SPRITES_DIR}sonic_basic.webp` : `${SPRITES_DIR}water_basic.webp`;
}
