// El orden de las familias es el del Dex del juego, no el de llegada al JSON: el sync
// agrega las familias nuevas al final, asi que las posiciones se corrigen a mano.
// Aqui se vigila que no se pierdan ni se partan en dos bloques.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sprites = JSON.parse(readFileSync(new URL('../src/data/official_sprites.json', import.meta.url), 'utf8'));

// Familias en orden de aparicion, sin repetir bloques contiguos.
const familias = [];
for (const s of sprites) {
  const f = s.id.split('_')[0];
  if (familias[familias.length - 1] !== f) familias.push(f);
}

test('cada familia ocupa un solo bloque contiguo', () => {
  const vistos = new Set();
  let previo = null;
  for (const f of familias) {
    if (f !== previo) {
      assert.ok(!vistos.has(f), f + ' aparece en dos bloques separados');
      vistos.add(f);
      previo = f;
    }
  }
});

test('la familia del Mapache va justo antes de Jonesy', () => {
  const i = familias.indexOf('dumpsterdive');
  assert.ok(i > -1, 'falta la familia dumpsterdive (Mapache)');
  assert.equal(familias[i + 1], 'jonesy', 'el Mapache debe ir inmediatamente antes de Jonesy');
});

test('el Ciervo va antes que el Vampiro', () => {
  const ciervo = familias.indexOf('deer');
  const vampiro = familias.indexOf('vampire');
  assert.ok(ciervo > -1 && vampiro > -1, 'faltan el ciervo o el vampiro');
  assert.ok(ciervo < vampiro, 'el Ciervo va antes que el Vampiro');
});
