import officialSpritesJson from './official_sprites.json';
import fortniteGgJson from './fortnite_gg_sprites_complete.json';

// Mapa de búsqueda rápida por nombre normalizado de Fortnite.gg
const fortniteGgMap = new Map();
if (Array.isArray(fortniteGgJson)) {
  fortniteGgJson.forEach((item) => {
    const normName = (item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normVariant = (item.variant || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const key = `${normName}_${normVariant}`;
    fortniteGgMap.set(key, item);
    fortniteGgMap.set(normName, item);
  });
}

export const RARITIES = {
  Mythic: { name: 'MÍTICO', color: '#fff0a6', bg: '#7c5d26', border: '#7c5d26', classKey: 'mythic', cardGradient: 'linear-gradient(180deg, #7c5d26 0%, #1b1c23 100%)' },
  Legendary: { name: 'LEGENDARIO', color: '#fbc363', bg: '#8a3c1e', border: '#8a3c1e', classKey: 'legendary', cardGradient: 'linear-gradient(180deg, #8a3c1e 0%, #1b1c23 100%)' },
  Epic: { name: 'ÉPICO', color: '#ec27ff', bg: '#4c197b', border: '#4c197b', classKey: 'epic', cardGradient: 'linear-gradient(180deg, #4c197b 0%, #1b1c23 100%)' },
  Rare: { name: 'RARO', color: '#00fffb', bg: '#00458a', border: '#00458a', classKey: 'rare', cardGradient: 'linear-gradient(180deg, #00458a 0%, #1b1c23 100%)' },
  Special: { name: 'ESPECIAL', color: '#000000', bg: 'transparent', border: '#5dffe4', classKey: 'special', cardGradient: 'linear-gradient(180deg, #9f4540 0%, #1b1c23 100%)' }
};

export const THEME_STYLES = {
  Basic: { bg: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', border: '#00afff' },
  Gold: { bg: 'linear-gradient(180deg, #9d752a 0%, #1b1c23 100%)', border: '#f5b642' },
  Cheatmaster: { bg: 'linear-gradient(180deg, #052e16 0%, #1b1c23 100%)', border: '#22c55e' },
  'Cheat Master': { bg: 'linear-gradient(180deg, #052e16 0%, #1b1c23 100%)', border: '#22c55e' },
  Candy: { bg: 'linear-gradient(180deg, #9f4540 0%, #1b1c23 100%)', border: '#f16f68' },
  Galaxy: { bg: 'linear-gradient(180deg, #4a31bc 0%, #1b1c23 100%)', border: '#4a35fa' },
  Holofoil: { bg: 'linear-gradient(180deg, #cb77be 0%, #1b1c23 100%)', border: '#ec88d8' },
  Cube: { bg: 'linear-gradient(180deg, #730974 0%, #1b1c23 100%)', border: '#8b008b' },
  Gem: { bg: 'linear-gradient(180deg, #0f6c7d 0%, #1b1c23 100%)', border: '#22d3ee' },
  Quack: { bg: 'linear-gradient(180deg, #cb77be 0%, #1b1c23 100%)', border: '#ec88d8' }
};

export const ELEMENTAL_STYLES = {
  water: { background: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', borderColor: '#00afff' },
  fishy: { background: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', borderColor: '#00afff' },
  fire: { background: 'linear-gradient(180deg, #84280f 0%, #1b1c23 100%)', borderColor: '#ea580c' },
  theburntpeanut: { background: 'linear-gradient(180deg, #84280f 0%, #1b1c23 100%)', borderColor: '#ea580c' },
  earth: { background: 'linear-gradient(180deg, #1b532a 0%, #1b1c23 100%)', borderColor: '#4ade80' },
  slime: { background: 'linear-gradient(180deg, #1b532a 0%, #1b1c23 100%)', borderColor: '#4ade80' },
  peely: { background: 'linear-gradient(180deg, #1b532a 0%, #1b1c23 100%)', borderColor: '#4ade80' },
  air: { background: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)', borderColor: '#60a5fa' },
  zeropoint: { background: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)', borderColor: '#60a5fa' },
  batman: { background: 'linear-gradient(180deg, #3d3b36 0%, #1b1c23 100%)', borderColor: '#a89442' },
  wick: { background: 'linear-gradient(180deg, #3d3b36 0%, #1b1c23 100%)', borderColor: '#a89442' },
  sonic: { background: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)', borderColor: '#3b82f6' },
  shadow: { background: 'linear-gradient(180deg, #31103f 0%, #1b1c23 100%)', borderColor: '#a855f7' },
  tails: { background: 'linear-gradient(180deg, #78350f 0%, #1b1c23 100%)', borderColor: '#f59e0b' },
  klombo: { background: 'linear-gradient(180deg, #831843 0%, #1b1c23 100%)', borderColor: '#ec4899' },
  crown: { background: 'linear-gradient(180deg, #713f12 0%, #1b1c23 100%)', borderColor: '#eab308' },
  bush: { background: 'linear-gradient(180deg, #166534 0%, #052e16 100%)', borderColor: '#4ade80' },
  adventure: { background: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)', borderColor: '#0ea5e9' },
  jonesy: { background: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)', borderColor: '#0ea5e9' },
  '8bit': { background: 'linear-gradient(180deg, #1e3a8a 0%, #1b1c23 100%)', borderColor: '#0ea5e9' },
  jackrabbit: { background: 'linear-gradient(180deg, #713f12 0%, #1b1c23 100%)', borderColor: '#eab308' },
  killswitch: { background: 'linear-gradient(180deg, #31103f 0%, #1b1c23 100%)', borderColor: '#a855f7' },
  stormscout: { background: 'linear-gradient(180deg, #1e1b4b 0%, #1b1c23 100%)', borderColor: '#818cf8' }
};

export function getSpriteCardStyle(sprite) {
  if (!sprite) {
    return { background: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', borderColor: '#00afff' };
  }

  const theme = sprite.variant || sprite.theme;
  const rarity = sprite.rarity;
  const familyId = (sprite.familyId || sprite.id.split('_')[0] || '').toLowerCase();

  // 1. Theme-specific variants (Gold, Cheatmaster, Cube, Candy, Galaxy, Holofoil, Gem, Quack)
  if (theme === 'Gold') {
    return { background: 'linear-gradient(180deg, #9d752a 0%, #1b1c23 100%)', borderColor: '#f5b642' };
  }
  if (theme === 'Cheatmaster' || theme === 'Cheat Master') {
    return { background: 'linear-gradient(180deg, #094726 0%, #0d281a 100%)', borderColor: '#4ade80' };
  }
  if (theme === 'Cube') {
    return { background: 'linear-gradient(180deg, #730974 0%, #1b1c23 100%)', borderColor: '#8b008b' };
  }
  if (theme === 'Candy' || theme === 'Gummy') {
    return { background: 'linear-gradient(180deg, #9f4540 0%, #1b1c23 100%)', borderColor: '#f16f68' };
  }
  if (theme === 'Galaxy') {
    return { background: 'linear-gradient(180deg, #4a31bc 0%, #1b1c23 100%)', borderColor: '#4a35fa' };
  }
  if (theme === 'Holofoil' || theme === 'Quack') {
    return { background: 'linear-gradient(180deg, #cb77be 0%, #1b1c23 100%)', borderColor: '#ec88d8' };
  }
  if (theme === 'Gem') {
    return { background: 'linear-gradient(180deg, #334155 0%, #1b1c23 100%)', borderColor: '#38bdf8' };
  }

  // 2. Elemental Customization for Basic sprites
  if (theme === 'Basic' && ELEMENTAL_STYLES[familyId]) {
    return ELEMENTAL_STYLES[familyId];
  }

  // 3. Rarity-based defaults
  if (rarity === 'Mythic') {
    return { background: 'linear-gradient(180deg, #a89442 0%, #1b1c23 100%)', borderColor: '#f1e198' };
  }
  if (rarity === 'Legendary') {
    return { background: 'linear-gradient(180deg, #743e0a 0%, #1b1c23 100%)', borderColor: '#de6e0e' };
  }
  if (rarity === 'Epic') {
    return { background: 'linear-gradient(180deg, #4d1566 0%, #1b1c23 100%)', borderColor: '#ce59ff' };
  }
  if (rarity === 'Rare') {
    return { background: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', borderColor: '#00afff' };
  }

  return { background: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', borderColor: '#00afff' };
}

export const THEME_NAMES_ES = {
  Basic: 'Básico',
  Gold: 'Dorado',
  Cheatmaster: 'Hacker',
  'Cheat Master': 'Hacker',
  Candy: 'Gomita',
  Gummy: 'Gomita',
  Galaxy: 'Galáctico',
  Holofoil: 'Holográfico',
  Cube: 'Cúbico',
  Gem: 'Gema',
  Quack: 'Patito'
};

export const VARIANT_ORDER = ['Basic', 'Gold', 'Cheatmaster', 'Candy', 'Galaxy', 'Cube', 'Holofoil', 'Gem', 'Quack'];
export const THEMES_LIST = ['Basic', 'Gold', 'Cheatmaster', 'Candy', 'Galaxy', 'Cube', 'Holofoil', 'Gem', 'Quack'];

export const FAMILY_NAMES_MAP = {
  water: 'Agua',
  earth: 'Tierra',
  fire: 'Fuego',
  air: 'Aire',
  duck: 'Pato',
  ghost: 'Fantasma',
  dream: 'Dormilón',
  demon: 'Demonio',
  punk: 'Punk',
  king: 'Monarca',
  zeropoint: 'Punto Cero',
  theburntpeanut: 'Cacahuate',
  fishy: 'Pescado',
  striker: 'Pelotero',
  aura: 'Aura',
  boss: 'Jefe',
  grim: 'Parca',
  seven: 'Siete',
  batman: 'Batman',
  pollo: 'Pollo',
  vini: 'Vini Jr.',
  wick: 'John Wick',
  peely: 'Bananín',
  llama: 'Llama',
  ironmouse: 'La niña',
  // Gen 2
  klombo: 'Klombo',
  crown: 'Corona',
  jackrabbit: 'Jackrabbit',
  sonic: 'Sonic',
  shadow: 'Shadow',
  tails: 'Tails',
  killswitch: 'Killswitch',
  bush: 'Arbustín',
  adventure: 'Aventurero',
  jonesy: 'Jonesy',
  '8bit': '8-Bit',
  stormscout: 'Storm Scout'
};

const CROSSOVER_KEYS = ['batman', 'wick', 'vini', 'pollo', 'theburntpeanut', 'ironmouse', 'sonic', 'shadow', 'tails'];

const SPANISH_NAME_OVERRIDES = {
  water_quack: 'Patito de Agua',
  earth_quack: 'Patito de Tierra',
  fire_quack: 'Patito de Fuego',
  zeropoint_quack: 'Patito del Punto Cero',
  theburntpeanut_basic: 'Cacahuate'
};

// Format and group official sprites
export const ALL_SPRITES = officialSpritesJson.map((item) => {
  let gen = item.gen || 1;

  let dropChance = '8.73%';
  if (item.rarity === 'Mythic') dropChance = '0.0003%';
  else if (item.rarity === 'Legendary') dropChance = '1.50%';
  else if (item.rarity === 'Epic') dropChance = '4.20%';
  else if (item.theme === 'Gold') dropChance = '0.75%';
  else if (item.theme === 'Galaxy') dropChance = '0.04%';
  else if (item.theme === 'Holofoil') dropChance = '0.01%';
  else if (item.theme === 'Cheatmaster') dropChance = '0.08%';

  const baseKey = item.id.split('_')[0].toLowerCase();
  const familyId = baseKey;
  const spanishFamilyName = FAMILY_NAMES_MAP[baseKey] || (baseKey.charAt(0).toUpperCase() + baseKey.slice(1));
  const spanishTheme = THEME_NAMES_ES[item.theme] || item.theme;

  let fullName = SPANISH_NAME_OVERRIDES[item.id] || (item.theme !== 'Basic' ? `${spanishFamilyName} ${spanishTheme}` : spanishFamilyName);

  let dropChanceNum = parseFloat(dropChance);

  // Dynamic image resolution for real webp and png assets
  let imagePath = item.gen === 2 ? `/sprites/${item.id}.webp` : `/sprites/${item.id}.png`;
  const webpMap = {
    'ironmouse_basic': '/sprites/ironmouse_basic.webp',
    'llama_basic': '/sprites/llama_basic.webp',
    'llama_gold': '/sprites/llama_gold.webp',
    'llama_candy': '/sprites/llama_gummy.webp',
    'llama_galaxy': '/sprites/llama_galaxy.webp',
    'llama_gem': '/sprites/llama_gem.webp',
    'peely_basic': '/sprites/peely_basic.webp',
    'peely_gold': '/sprites/peely_gold.webp',
    'peely_candy': '/sprites/peely_gummy.webp',
    'peely_galaxy': '/sprites/peely_galaxy.webp',
    'peely_holofoil': '/sprites/peely_holofoil.webp',
    'water_quack': '/sprites/water_duck.webp',
    'earth_quack': '/sprites/earth_duck.webp',
    'fire_quack': '/sprites/fire_duck.webp',
    'zeropoint_quack': '/sprites/zeropoint_duck.png',
    'zeropoint_holofoil': '/sprites/zeropoint_holofoil.webp',
    'grim_holofoil': '/sprites/grim_holofoil.webp',
    'grim_gem': '/sprites/grim_gem.webp'
  };
  if (webpMap[item.id]) {
    imagePath = webpMap[item.id];
  }

  const normName = (item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normTheme = (item.theme || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const official = fortniteGgMap.get(`${normName}_${normTheme}`) || fortniteGgMap.get(normName);

  return {
    id: item.id,
    fullName: fullName,
    variant: item.theme,
    variantDisplay: spanishTheme,
    rarity: item.rarity,
    gen: gen,
    dropChance: item.unreleased ? '0%' : (official?.dropChance && official.dropChance !== '0%' ? official.dropChance : dropChance),
    dropChanceDisplay: item.unreleased ? '0%' : (official?.dropChance && official.dropChance !== '0%' ? official.dropChance : dropChance),
    dropChanceNum: item.unreleased ? 0 : dropChanceNum,
    unreleased: item.unreleased || false,
    image: imagePath,
    familyId: familyId,
    familyName: spanishFamilyName,
    location: official?.location || 'Cofres de Sprite & Zonas de Extracción',
    summonCost: official?.summonCost && official.summonCost !== '0' ? `${official.summonCost} Polvo Estelar` : '5,000 Polvo Estelar',
    ability: official?.ability || 'Concede bonificaciones pasivas de combate, velocidad y recolección de botín.',
    specialPerk: official?.specialPerk || ''
  };
});

export const allSprites = ALL_SPRITES;

// All unique sprite families for the SPRITE filter dropdown
export const SPRITE_FAMILIES_LIST = [...new Set(ALL_SPRITES.map(s => s.familyName))].sort();

// Sprite families with image paths for the visual dropdown
export const SPRITE_FAMILIES_WITH_IMAGES = [...new Set(ALL_SPRITES.map(s => s.familyId))]
  .map(familyId => {
    const sprite = ALL_SPRITES.find(s => s.familyId === familyId && s.variant === 'Basic');
    const name = FAMILY_NAMES_MAP[familyId] || (familyId.charAt(0).toUpperCase() + familyId.slice(1));
    return {
      name,
      familyId,
      image: sprite ? sprite.image : `/sprites/${familyId}_basic.png`
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));

// Group sprites into families for detail view (sorted canonically by variant order)
export const SPRITE_FAMILIES = Object.values(
  ALL_SPRITES.reduce((acc, sprite) => {
    if (!acc[sprite.familyId]) {
      acc[sprite.familyId] = {
        id: sprite.familyId,
        name: sprite.familyName,
        gen: sprite.gen,
        sprites: []
      };
    }
    acc[sprite.familyId].sprites.push(sprite);
    return acc;
  }, {})
).map((family) => ({
  ...family,
  sprites: [...family.sprites].sort((a, b) => {
    const aIdx = VARIANT_ORDER.indexOf(a.variant);
    const bIdx = VARIANT_ORDER.indexOf(b.variant);
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx);
  })
}));

export const GENERATIONS = [
  { id: 1, name: '1ª Generación', title: 'Espíritus Clásicos', badgeColor: '#3b82f6' },
  { id: 2, name: '2ª Generación', title: 'Temporada GLITCH', badgeColor: '#ec4899' }
];
