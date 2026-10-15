import { FAMILY_NAMES_MAP as FAMILY_NAMES_ES, THEME_NAMES_ES } from '../src/data/nombresEspiritus.js';
export { FAMILY_NAMES_ES, THEME_NAMES_ES };
// Catálogos de nombres y temas de espíritus compartidos por los sincronizadores.
// Familias de 1ra Generación
export const GEN_1_FAMILIES = new Set([
  'water', 'earth', 'fire', 'air', 'duck', 'ghost', 'dream', 'demon', 'punk', 'king',
  'zeropoint', 'theburntpeanut', 'fishy', 'striker', 'aura', 'boss', 'grim', 'seven',
  'batman', 'pollo', 'vini', 'wick', 'peely', 'llama', 'ironmouse'
]);

export const PARENT_TO_FAMILY = {
  water: 'water',
  earth: 'earth',
  spitfire: 'fire',
  duck: 'duck',
  ghost: 'ghost',
  sleepy: 'dream',
  punk: 'punk',
  king: 'king',
  zeropoint: 'zeropoint',
  demon: 'demon',
  burntpeanut: 'theburntpeanut',
  air: 'air',
  boss: 'boss',
  seven: 'seven',
  fishy: 'fishy',
  soccer: 'striker',
  drifter: 'aura',
  grim: 'grim',
  overshield: 'overshield',
  improvedslide: 'megaman',
  winnerb: 'xray',
  winnerc: 'onigiri',
  cosmicthunderdoublejump: 'jackrabbit',
  narrowfleamonkey: 'tails',
  reloadovertime: 'shadow',
  bushranger: 'bush',
  killswitch: 'killswitch',
  dwarf: 'adventure',
  klombo: 'klombo',
  jonesy: 'jonesy',
  narrowflea: 'sonic',
  crown: 'crown',
  '8bitblaster': '8bit',
  eightbitblaster: '8bit',
  stormscout: 'stormscout',
  ghostdamage: 'blinky',
  birthday: 'birthday',
  bodyslam: 'crash',
  fillergrunt: 'pollo',
  batman: 'batman',
  winnera: 'pond',
  companystargazer: 'ironmouse',
  cokeparmesan: 'vini',
  pedicureantacid: 'wick',
  llama: 'llama',
  peely: 'peely',
  increaseheals: 'morgana',
  phasedash: 'spookydash',
  healthsiphon: 'vampire',
  increasedmelee: 'deer',
  winnerd: 'dumpsterdive',
  // fortnite.gg los publica con estos codenames; ya existen como honey_* y obsession_* (spritehelp).
  winnere: 'honey',
  cargolying: 'obsession'
};

export const VARIANT_TO_THEME = {
  base: 'Basic',
  basic: 'Basic',
  gold: 'Gold',
  cheatmaster: 'Cheatmaster',
  'cheat master': 'Cheatmaster',
  'loot hacker': 'Loot Hacker',
  loothacker: 'Loot Hacker',
  hacker: 'Loot Hacker',
  'bounty hunter': 'Bounty Hunter',
  bountyhunter: 'Bounty Hunter',
  reaper: 'Bounty Hunter',
  tricktreat: 'Trick or Treat',
  'trick or treat': 'Trick or Treat',
  trickortreat: 'Trick or Treat',
  candy: 'Candy',
  gummy: 'Candy',
  galaxy: 'Galaxy',
  cube: 'Cube',
  holofoil: 'Holofoil',
  gem: 'Gem',
  quack: 'Quack'
};





export const VARIANT_ORDER = [
  'Basic',
  'Gold',
  'Cheatmaster',
  'Loot Hacker',
  'Bounty Hunter',
  'Trick or Treat',
  'Candy',
  'Galaxy',
  'Cube',
  'Holofoil',
  'Gem',
  'Quack'
];

export function normalizeKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
