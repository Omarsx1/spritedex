// El enlace profundo tiene que resolver tanto el parametro de los CTA como la ruta que ve la
// app en desarrollo, y no abrir nada cuando el slug no existe.
import test from 'node:test';
import assert from 'node:assert/strict';
import { slugDeEnlace, espirituDeEnlace } from '../src/utils/enlaceEspiritu.js';

const sprites = [
  { id: 'spookydash_gold', fullName: 'Impulso aterrador Dorado' },
  { id: 'water_basic', fullName: 'Agua' },
  { id: '8bit_basic', fullName: '8-Bit' }
];

test('resuelve el parametro que llevan los CTA de las paginas estaticas', () => {
  assert.equal(slugDeEnlace('/', '?s=spookydash-gold'), 'spookydash-gold');
  assert.equal(slugDeEnlace('/en', '?s=spookydash-gold&otra=1'), 'spookydash-gold');
});

test('resuelve tambien la ruta, con o sin prefijo de idioma', () => {
  assert.equal(slugDeEnlace('/espiritu/water-basic', ''), 'water-basic');
  assert.equal(slugDeEnlace('/en/espiritu/8bit-basic', ''), '8bit-basic');
  assert.equal(slugDeEnlace('/espiritu/water-basic/', ''), 'water-basic');
});

test('sin enlace no resuelve nada', () => {
  assert.equal(slugDeEnlace('/', ''), null);
  assert.equal(slugDeEnlace('/amigos', '?s='), null);
  assert.equal(slugDeEnlace('/espiritu/', ''), null);
});

test('encuentra el espiritu comparando por slug del id', () => {
  assert.equal(espirituDeEnlace('/', '?s=spookydash-gold', sprites).id, 'spookydash_gold');
  assert.equal(espirituDeEnlace('/en/espiritu/8bit-basic', '', sprites).id, '8bit_basic');
  assert.equal(espirituDeEnlace('/', '?s=no-existe', sprites), null);
  assert.equal(espirituDeEnlace('/', '?s=water-basic', null), null);
});
