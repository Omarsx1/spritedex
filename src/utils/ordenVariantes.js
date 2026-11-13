// Orden canonico de las variantes dentro de una familia.
//
// La 3ª generación (Buscatesoros) usa el orden de Fortnite: Basico, Afortunado
// (Fortune/Jeweled), Maldito (Cursed) y Dorado (Gold) al final. En 1ª y 2ª el
// Dorado va junto al Basico, como siempre.
//
// Vive fuera de los componentes y de spritesData para poder probarlo sin React ni JSON.

export const VARIANT_ORDER = [
  'Basic',
  'Gold',
  'Cheatmaster',
  'Quack',
  'Loot Hacker',
  'Bounty Hunter',
  'Trick or Treat',
  'Candy',
  'Galaxy',
  'Cube',
  'Holofoil',
  'Gem',
  'jeweled',
  'cursed'
];

// Orden de la temporada Buscatesoros (3ª generación).
export const VARIANT_ORDER_GEN_3 = ['Basic', 'jeweled', 'cursed', 'Gold'];

const VARIANT_ALIASES = { Base: 'Basic', 'Cheat Master': 'Cheatmaster', LootHacker: 'Loot Hacker' };

export function ordenDeVariantes(gen) {
  return Number(gen) === 3 ? VARIANT_ORDER_GEN_3 : VARIANT_ORDER;
}

export function prioridadVariante(variant, gen) {
  const normalizado = VARIANT_ALIASES[variant] || variant;
  const indice = ordenDeVariantes(gen).indexOf(normalizado);
  return indice === -1 ? 99 : indice;
}
