// Orden de las familias de la 3ª Generación (Buscatesoros). El jugador las va ordenando
// según las atrapa, así que el orden vive en official_sprites.json y el sync agrega las
// familias nuevas al final. Aquí se vigila que el bloque pedido no se desordene.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sprites = JSON.parse(readFileSync(new URL('../src/data/official_sprites.json', import.meta.url), 'utf8'));

const familiaDe = (s) => s.id.split('_')[0];

// Orden pedido por el jugador con las familias que ya tiene atrapadas.
const ORDEN_GEN3 = [
  'peelybones', // Bananín Huesudo
  'parrot', // Plumitas
  'barreloffish', // Barry
  'compass', // Orientador
  'treasurechest', // Gatisoro
  'unbotheredfish', // Mar
  'treasuremap', // Buscarrutas
  'squibbly', // Tintonio pequeño
  'playmakerbrewery', // Lil' Flacko
  'rookgecko', // Lil' Uzi Vert Jr.
  'coinpile', // Saqueacofres
  'feedjet' // Caracol Transmisor
];

test('las familias de la 3ª generación siguen el orden pedido', () => {
  const gen3 = sprites.filter((s) => String(s.gen) === '3').map(familiaDe);
  const orden = [...new Set(gen3)];

  for (const familia of ORDEN_GEN3) {
    assert.ok(orden.includes(familia), 'falta la familia ' + familia + ' en la 3ª generación');
  }

  assert.deepEqual(orden.slice(0, ORDEN_GEN3.length), ORDEN_GEN3);
});
