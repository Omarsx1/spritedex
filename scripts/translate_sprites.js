import fs from 'fs';

const path = './src/data/official_sprites.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const familyNamesES = {
  water: 'Agua',
  earth: 'Tierra',
  fire: 'Fuego',
  duck: 'Pato',
  ghost: 'Fantasma',
  dream: 'Sueño',
  demon: 'Demonio',
  punk: 'Punk',
  king: 'Rey',
  zeropoint: 'Punto Cero',
  theburntpeanut: 'Cacahuate Tostado',
  fishy: 'Pececillo',
  striker: 'Delantero',
  aura: 'Aura',
  boss: 'Jefe',
  grim: 'Tétrico',
  air: 'Aire',
  seven: 'Los Siete',
  batman: 'Batman',
  pollo: 'Pollo',
  vini: 'Vini Jr.',
  wick: 'John Wick'
};

const prefixES = {
  Gold: 'Dorado',
  Candy: 'Gominola',
  Galaxy: 'Galaxia',
  Gem: 'Gema',
  Holofoil: 'Holofoil',
  Cube: 'Cubo'
};

const updated = data.map(item => {
  const familyKey = item.id.split('_')[0];
  const familyES = familyNamesES[familyKey] || item.name;

  let spanishName = familyES;
  if (item.theme && item.theme !== 'Basic') {
    const p = prefixES[item.theme] || item.theme;
    const isFeminine = ['water', 'earth', 'aura'].includes(familyKey);
    if (p === 'Dorado' && isFeminine) {
      spanishName = `${familyES} Dorada`;
    } else {
      spanishName = `${familyES} ${p}`;
    }
  }

  return {
    ...item,
    name: spanishName
  };
});

fs.writeFileSync(path, JSON.stringify(updated, null, 2));
console.log('Successfully translated', updated.length, 'sprite names to Spanish!');
