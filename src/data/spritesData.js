import officialSpritesJson from './official_sprites.json';

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
  Candy: { bg: 'linear-gradient(180deg, #9f4540 0%, #1b1c23 100%)', border: '#f16f68' },
  Galaxy: { bg: 'linear-gradient(180deg, #4a31bc 0%, #1b1c23 100%)', border: '#4a35fa' },
  Holofoil: { bg: 'linear-gradient(180deg, #cb77be 0%, #1b1c23 100%)', border: '#ec88d8' },
  Cube: { bg: 'linear-gradient(180deg, #730974 0%, #1b1c23 100%)', border: '#8b008b' },
  Gem: { bg: 'linear-gradient(180deg, #0f6c7d 0%, #1b1c23 100%)', border: '#22d3ee' }
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
  wick: { background: 'linear-gradient(180deg, #3d3b36 0%, #1b1c23 100%)', borderColor: '#a89442' }
};

export function getSpriteCardStyle(sprite) {
  if (!sprite) {
    return { background: 'linear-gradient(180deg, #104273 0%, #1b1c23 100%)', borderColor: '#00afff' };
  }

  const theme = sprite.variant || sprite.theme;
  const rarity = sprite.rarity;
  const familyId = (sprite.familyId || sprite.id.split('_')[0] || '').toLowerCase();

  // 1. Theme-specific variants (Gold, Cube, Candy, Galaxy, Holofoil, Gem)
  if (theme === 'Gold') {
    return { background: 'linear-gradient(180deg, #9d752a 0%, #1b1c23 100%)', borderColor: '#f5b642' };
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
  if (theme === 'Holofoil') {
    return { background: 'linear-gradient(180deg, #cb77be 0%, #1b1c23 100%)', borderColor: '#ec88d8' };
  }
  if (theme === 'Gem') {
    return { background: 'linear-gradient(180deg, #0f6c7d 0%, #1b1c23 100%)', borderColor: '#22d3ee' };
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
  Basic: 'Basic',
  Gold: 'Gold',
  Candy: 'Gummy',
  Galaxy: 'Galaxy',
  Holofoil: 'Holofoil',
  Cube: 'Cube',
  Gem: 'Gem'
};

export const VARIANT_ORDER = ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube', 'Holofoil', 'Gem'];
export const THEMES_LIST = ['Basic', 'Gold', 'Candy', 'Galaxy', 'Cube', 'Holofoil', 'Gem'];

const FAMILY_NAMES_MAP = {
  water: 'Water',
  earth: 'Earth',
  fire: 'Fire',
  duck: 'Duck',
  ghost: 'Ghost',
  dream: 'Dream',
  demon: 'Demon',
  punk: 'Punk',
  king: 'King',
  zeropoint: 'Zero Point',
  theburntpeanut: 'Burnt Peanut',
  fishy: 'Fishy',
  striker: 'Striker',
  aura: 'Aura',
  boss: 'Boss',
  grim: 'Grim',
  air: 'Air',
  seven: 'Seven',
  batman: 'Batman',
  pollo: 'Pollo',
  vini: 'Vini Jr.',
  wick: 'John Wick'
};

const CROSSOVER_KEYS = ['batman', 'wick', 'vini', 'pollo', 'theburntpeanut'];

// Format and group official sprites
export const ALL_SPRITES = officialSpritesJson.map((item) => {
  let gen = 1;
  const nameLower = item.name.toLowerCase();
  if (nameLower.includes('batman') || nameLower.includes('duck') || nameLower.includes('ghost') || nameLower.includes('fishy') || nameLower.includes('punk') || nameLower.includes('king') || nameLower.includes('striker')) {
    gen = 2;
  } else if (nameLower.includes('zeropoint') || nameLower.includes('burnt') || nameLower.includes('boss') || nameLower.includes('grim') || nameLower.includes('seven') || nameLower.includes('pollo') || nameLower.includes('vini') || nameLower.includes('wick')) {
    gen = 3;
  }

  let dropChance = '8.73%';
  if (item.rarity === 'Mythic') dropChance = '0.0003%';
  else if (item.rarity === 'Legendary') dropChance = '1.50%';
  else if (item.rarity === 'Epic') dropChance = '4.20%';
  else if (item.theme === 'Gold') dropChance = '0.75%';
  else if (item.theme === 'Galaxy') dropChance = '0.04%';
  else if (item.theme === 'Holofoil') dropChance = '0.01%';

  const baseKey = item.id.split('_')[0].toLowerCase();
  const isCrossover = CROSSOVER_KEYS.includes(baseKey);

  const familyId = isCrossover ? 'icons_crossovers' : baseKey;
  const familyName = isCrossover ? 'Íconos & Crossovers' : (FAMILY_NAMES_MAP[baseKey] || (baseKey.charAt(0).toUpperCase() + baseKey.slice(1)));

  let dropChanceNum = parseFloat(dropChance);

  return {
    id: item.id,
    fullName: item.name,
    variant: item.theme,
    variantDisplay: item.theme,
    rarity: item.rarity,
    gen: gen,
    dropChance: item.unreleased ? '0%' : dropChance,
    dropChanceDisplay: item.unreleased ? '0%' : dropChance,
    dropChanceNum: item.unreleased ? 0 : dropChanceNum,
    unreleased: item.unreleased || false,
    image: `/sprites/${item.id}.png`,
    familyId: familyId,
    familyName: familyName,
    location: 'Cofres de Sprite & Zonas de Extracción',
    summonCost: '5,000 Polvo Estelar',
    ability: 'Concede bonificaciones pasivas de escudo, velocidad y recolección de botín.'
  };
});

// All unique sprite families for the SPRITE filter dropdown
export const SPRITE_FAMILIES_LIST = [...new Set(ALL_SPRITES.map(s => s.familyName))].sort();

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
  { id: 1, name: '1ª Generación', title: 'Orígenes Elementales', badgeColor: '#3b82f6' },
  { id: 2, name: '2ª Generación', title: 'Leyendas & Crossovers', badgeColor: '#eab308' },
  { id: 3, name: '3ª Generación', title: 'Multiverso & Eventos Cósmicos', badgeColor: '#a855f7' }
];
