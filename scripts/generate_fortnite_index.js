// Genera un indice compacto del scrapeo de fortnite.gg con solo los campos que
// la app usa. El archivo original se conserva como fuente.
// Uso: node scripts/generate_fortnite_index.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'data', 'fortnite_gg_sprites_complete.json');
const OUT = path.join(ROOT, 'src', 'data', 'fortnite_gg_index.json');

const FIELDS = ['name', 'variant', 'parent', 'summonCost', 'dropChance', 'ability', 'specialPerk', 'location'];

const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
if (!Array.isArray(data)) {
  console.error('El origen no es un array');
  process.exit(1);
}

const slim = data.map((item) => {
  const out = {};
  for (const key of FIELDS) {
    if (item[key] !== undefined) out[key] = item[key];
  }
  return out;
});

fs.writeFileSync(OUT, JSON.stringify(slim));
const before = fs.statSync(SRC).size;
const after = fs.statSync(OUT).size;
console.log('entradas: ' + slim.length);
console.log('peso: ' + (before / 1024).toFixed(1) + ' KB -> ' + (after / 1024).toFixed(1) + ' KB');

