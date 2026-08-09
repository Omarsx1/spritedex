import officialSpritesJson from './official_sprites.json';

export const RARITIES = {
  Mythic: { name: 'MÍTICO', color: '#ffaa00', bg: '#b8860b', cardGradient: 'linear-gradient(180deg, #d4a017 0%, #8b6914 40%, #5c4a0e 100%)' },
  Legendary: { name: 'LEGENDARIO', color: '#f97316', bg: '#c2410c', cardGradient: 'linear-gradient(180deg, #f97316 0%, #c2410c 40%, #7c2d12 100%)' },
  Epic: { name: 'ÉPICO', color: '#a855f7', bg: '#7e22ce', cardGradient: 'linear-gradient(180deg, #a855f7 0%, #7e22ce 40%, #581c87 100%)' },
  Rare: { name: 'RARO', color: '#3b82f6', bg: '#1d4ed8', cardGradient: 'linear-gradient(180deg, #3b82f6 0%, #1d4ed8 40%, #1e3a5f 100%)' },
  Special: { name: 'ESPECIAL', color: '#ec4899', bg: '#be185d', cardGradient: 'linear-gradient(180deg, #ec4899 0%, #be185d 40%, #831843 100%)' }
};

export const THEME_STYLES = {
  Basic: { bg: 'linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.95) 100%)', border: 'rgba(255, 255, 255, 0.12)' },
  Gold: { bg: 'linear-gradient(180deg, rgba(217, 119, 6, 0.65) 0%, rgba(69, 26, 3, 0.95) 100%)', border: '#facc15' },
  Candy: { bg: 'linear-gradient(180deg, rgba(220, 38, 38, 0.55) 0%, rgba(22, 163, 74, 0.75) 100%)', border: '#f87171' },
  Galaxy: { bg: 'linear-gradient(180deg, rgba(88, 28, 135, 0.75) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '#c084fc' },
  Holofoil: { bg: 'linear-gradient(180deg, rgba(219, 39, 119, 0.55) 0%, rgba(37, 99, 235, 0.7) 100%)', border: '#f472b6' },
  Cube: { bg: 'linear-gradient(180deg, rgba(126, 34, 206, 0.65) 0%, rgba(46, 16, 101, 0.95) 100%)', border: '#a855f7' },
  Gem: { bg: 'linear-gradient(180deg, rgba(8, 145, 178, 0.55) 0%, rgba(15, 23, 42, 0.95) 100%)', border: '#22d3ee' }
};

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

// All unique sprite families for the SPRITE filter dropdown
export const SPRITE_FAMILIES_LIST = [...new Set(officialSpritesJson.map(s => {
  const baseKey = s.id.split('_')[0];
  return FAMILY_NAMES_MAP[baseKey] || (baseKey.charAt(0).toUpperCase() + baseKey.slice(1));
}))].sort();

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

  const familyId = item.id.split('_')[0];
  const familyName = FAMILY_NAMES_MAP[familyId] || (familyId.charAt(0).toUpperCase() + familyId.slice(1));

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
