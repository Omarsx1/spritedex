// Cada espiritu del catalogo necesita nombre en español para su familia y su tema. Si falta,
// la app cae al nombre en inglés: este test lo convierte en un fallo en CI.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FAMILY_NAMES_MAP, THEME_NAMES_ES } from '../src/data/nombresEspiritus.js';

const oficiales = JSON.parse(fs.readFileSync('src/data/official_sprites.json', 'utf8'));

test('cada familia del catalogo tiene nombre en español', () => {
  const sinNombre = [...new Set(oficiales.map((s) => s.id.split('_')[0]))]
    .filter((familia) => !FAMILY_NAMES_MAP[familia]);
  assert.deepEqual(sinNombre, [], `faltan nombres de familia en src/data/nombresEspiritus.js: ${sinNombre.join(', ')}`);
});

test('cada tema del catalogo tiene nombre en español', () => {
  const sinNombre = [...new Set(oficiales.map((s) => s.theme))]
    .filter((tema) => tema !== 'Basic' && !THEME_NAMES_ES[tema]);
  assert.deepEqual(sinNombre, [], `faltan nombres de tema en src/data/nombresEspiritus.js: ${sinNombre.join(', ')}`);
});
