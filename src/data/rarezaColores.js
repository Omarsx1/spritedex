// Colores de rareza: la UNICA fuente.
//
// Vive aparte de spritesData.js por una razon concreta: el generador de paginas estaticas y el
// modelo de la guia (src/seo/) corren en Node durante el build y se prueban con `node --test`.
// spritesData.js arrastra los JSON del catalogo y no se puede importar desde ahi, asi que los
// colores salen a este modulo plano, sin una sola dependencia.
//
// Cada entrada conserva la forma que ya consumia la app:
//   color          color del texto y del borde en las pastillas
//   bg             fondo de la pastilla
//   border         borde de la pastilla (a veces distinto del fondo)
//   classKey       sufijo de las clases .sprite-rarity-<classKey>
//   cardGradient   degradado de la tarjeta. NO se deriva de bg: Shadow tiene uno propio.
//
// DOS COLORES SE ACLARARON PARA CUMPLIR AA. El texto del badge mide 11 px y va en negrita, o sea
// que cuenta como texto normal y necesita 4.5:1 sobre su propio fondo. Medido: Epic daba 3.64:1
// (#ec27ff sobre #4c197b) y Common 4.04:1 (#94a3b8 sobre #334155). Ahora dan 5.08:1 y 5.21:1.
// El arreglo vive aqui, y no en la guia, porque el color es el mismo para los badges de las
// tarjetas y para la tabla: si se separaran, volveriamos a tener dos verdades.
export const COLORES_RAREZA = {
  mythic: { color: '#fff0a6', bg: '#7c5d26', border: '#7c5d26', classKey: 'mythic', cardGradient: 'linear-gradient(180deg, #7c5d26 0%, #1b1c23 100%)' },
  legendary: { color: '#fbc363', bg: '#8a3c1e', border: '#8a3c1e', classKey: 'legendary', cardGradient: 'linear-gradient(180deg, #8a3c1e 0%, #1b1c23 100%)' },
  epic: { color: '#ff6bff', bg: '#4c197b', border: '#4c197b', classKey: 'epic', cardGradient: 'linear-gradient(180deg, #4c197b 0%, #1b1c23 100%)' },
  rare: { color: '#00fffb', bg: '#00458a', border: '#00458a', classKey: 'rare', cardGradient: 'linear-gradient(180deg, #00458a 0%, #1b1c23 100%)' },
  uncommon: { color: '#4ade80', bg: '#14532d', border: '#4ade80', classKey: 'uncommon', cardGradient: 'linear-gradient(180deg, #14532d 0%, #1b1c23 100%)' },
  common: { color: '#adb9c9', bg: '#334155', border: '#adb9c9', classKey: 'common', cardGradient: 'linear-gradient(180deg, #334155 0%, #1b1c23 100%)' },
  special: { color: '#5dffe4', bg: '#134e4a', border: '#5dffe4', classKey: 'special', cardGradient: 'linear-gradient(180deg, #134e4a 0%, #1b1c23 100%)',
    // Special no es un color: en las tarjetas es la banda de arcoiris. La misma cadena exacta
    // que usa .sprite-rarity-special (src/styles/index.css), para que la guia no invente otra.
    degradadoTexto: 'linear-gradient(15deg, #5dffe4 0, #8dff9a 8%, #fff36a 16%, #60dfff 24%, #7b7cff 32%, #ff77d8 40%, #ffc45f 48%, #5dffe4 56%, #8dff9a 64%, #fff36a 72%, #60dfff 80%, #7b7cff 88%, #ff77d8 96%, #ffc45f 100%)' },
  exotic: { color: '#5df0e4', bg: '#0e4a52', border: '#06b6d4', classKey: 'exotic', cardGradient: 'linear-gradient(180deg, #0e4a52 0%, #1b1c23 100%)' },
  dark: { color: '#f0abfc', bg: '#581c87', border: '#a21caf', classKey: 'dark', cardGradient: 'linear-gradient(180deg, #581c87 0%, #1b1c23 100%)' },
  gaming: { color: '#a5b4fc', bg: '#312e81', border: '#6366f1', classKey: 'gaming', cardGradient: 'linear-gradient(180deg, #312e81 0%, #1b1c23 100%)' },
  marvel: { color: '#fca5a5', bg: '#7f1d1d', border: '#ef4444', classKey: 'marvel', cardGradient: 'linear-gradient(180deg, #7f1d1d 0%, #1b1c23 100%)' },
  dc: { color: '#93c5fd', bg: '#1e3a8a', border: '#3b82f6', classKey: 'dc', cardGradient: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)' },
  icon: { color: '#5eead4', bg: '#115e59', border: '#14b8a6', classKey: 'icon', cardGradient: 'linear-gradient(180deg, #115e59 0%, #1b1c23 100%)' },
  frozen: { color: '#bae6fd', bg: '#0c4a6e', border: '#38bdf8', classKey: 'frozen', cardGradient: 'linear-gradient(180deg, #0c4a6e 0%, #1b1c23 100%)' },
  lava: { color: '#fdba74', bg: '#7c2d12', border: '#ea580c', classKey: 'lava', cardGradient: 'linear-gradient(180deg, #7c2d12 0%, #1b1c23 100%)' },
  shadow: { color: '#f8fafc', bg: '#18181b', border: '#52525b', classKey: 'shadow', cardGradient: 'linear-gradient(180deg, #27272a 0%, #09090b 100%)' },
  slurp: { color: '#6ee7b7', bg: '#064e3b', border: '#10b981', classKey: 'slurp', cardGradient: 'linear-gradient(180deg, #064e3b 0%, #1b1c23 100%)' }
};

// Una rareza que no este en el catalogo (el juego agrega series nuevas) se pinta con estos.
// No son los de `special`: el borde es distinto a proposito, y ya venian asi.
export const RAREZA_POR_DEFECTO = {
  color: '#5dffe4',
  bg: '#134e4a',
  border: '#14b8a6',
  cardGradient: 'linear-gradient(180deg, #134e4a 0%, #1b1c23 100%)'
};

/**
 * Los colores de una rareza a partir de su nombre o de su clave, sin distinguir mayusculas ni
 * espacios sobrantes. Devuelve la entrada por defecto si no la conoce, y `null` para un valor
 * vacio: asi quien llama decide si pintar o no.
 */
export function coloresDeRareza(nombre) {
  const limpio = String(nombre === undefined || nombre === null ? '' : nombre).trim().toLowerCase();
  if (!limpio) return null;
  if (COLORES_RAREZA[limpio]) return COLORES_RAREZA[limpio];
  // 'Loot Hacker' -> 'loothacker', igual que hacia la app al resolver una rareza suelta.
  const sinSignos = limpio.replace(/[^a-z0-9]/g, '');
  return COLORES_RAREZA[sinSignos] || null;
}

// Rarezas que se identifican SOLO por su color: una epica se reconoce epica y una legendaria se
// reconoce legendaria. Ni la familia elemental (peely verde, sonic azul...) ni el tinte de
// temporada de la 3ª generacion pueden repintarlas; sin esto, dos cartas de la misma rareza
// salian de colores distintos y dejaban de leerse como iguales.
export const RAREZAS_DE_COLOR_UNICO = ['epic', 'legendary'];

/** true si la carta debe pintarse con el color de su rareza y no con el de su familia o temporada. */
export function usaColorDeRareza(nombre) {
  const entrada = coloresDeRareza(nombre);
  return Boolean(entrada && RAREZAS_DE_COLOR_UNICO.includes(entrada.classKey));
}

/**
 * El matiz (0-359) del fondo de una rareza. La 3ª generacion tiñe cada ficha con el matiz de su
 * espiritu; una rareza de color unico no puede hacer eso sin dejar de identificarse, asi que usa
 * el matiz de su propia rareza: mismo tono para todas sus cartas, misma oscuridad de temporada.
 * Devuelve null si la rareza no esta en el catalogo.
 */
export function matizDeRareza(nombre) {
  const entrada = coloresDeRareza(nombre);
  const hex = String(entrada && entrada.bg ? entrada.bg : '').replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  return Math.round((h * 60 + 360) % 360);
}

/**
 * El estilo inline del badge de una rareza, para que la pagina estatica y la app pinten EXACTAMENTE
 * lo mismo. Va inline y no por clase a proposito: las clases de color de las tarjetas llevan
 * `!important` y, al reutilizarlas en una celda de tabla, una regla de mas especificidad pisaba el
 * `color` y el badge salia con el texto en blanco.
 *
 * El ancho, el alto y el radio los pone la clase .rareza-badge, que es geometria y no color.
 */
export function estiloBadgeRareza(nombre) {
  const entrada = coloresDeRareza(nombre);
  if (!entrada) return null;
  // Special no lleva fondo plano: lleva la banda de arcoiris de las tarjetas, con el texto negro
  // como en ellas.
  if (entrada.degradadoTexto) {
    return { background: entrada.degradadoTexto, backgroundSize: '200% 100%', color: '#000' };
  }
  return { background: entrada.bg, color: entrada.color };
}

/** El color de texto de una rareza, o `null` si no se conoce. */
export function colorDeRareza(nombre) {
  const entrada = coloresDeRareza(nombre);
  return entrada ? entrada.color : null;
}
