// El catalogo en ingles se genera desde la captura cruda de fortnite.gg. Estas pruebas
// fijan el contrato: 234 nombres, 218 del juego y 16 compuestos con su misma regla.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { construirCatalogo } from '../scripts/build_locale_catalog.mjs';

const leer = (ruta) => JSON.parse(fs.readFileSync(ruta, 'utf8'));
const catalogo = leer('src/data/official_sprites.json');
const generado = leer('src/data/i18n/catalog.en.json');
const familias = leer('src/data/i18n/familias.en.json');

// Los 16 combos que no estan en la captura cruda: se componen con "<Variante> <Familia> Sprite".
const COMPUESTOS = [
  'air_gem', 'aura_holofoil', 'batman_gem', 'boss_gem', 'boss_holofoil', 'demon_holofoil',
  'dream_gem', 'duck_holofoil', 'fishy_gem', 'fishy_holofoil', 'ghost_gem', 'king_gem',
  'punk_gem', 'seven_gem', 'striker_gem', 'striker_rift'
];

test('cada espiritu del catalogo tiene nombre en ingles no vacio', () => {
  const sinNombre = catalogo.filter((s) => !generado[s.id] || !String(generado[s.id]).trim()).map((s) => s.id);
  assert.deepEqual(sinNombre, []);
  assert.equal(Object.keys(generado).length, catalogo.length);
  assert.equal(catalogo.length, 234);
});

test('218 nombres vienen del juego y 16 se componen', () => {
  const { compuestos } = construirCatalogo();
  const ids = compuestos.map((c) => c.split(' -> ')[0]).sort();
  assert.equal(compuestos.length, 16);
  assert.deepEqual(ids, COMPUESTOS);
});

test('los nombres conservan el formato del juego (variante primero, con Sprite)', () => {
  assert.equal(generado.water_basic, 'Water Sprite');
  assert.equal(generado.jonesy_gold, 'Gold Jonesy Sprite');
  assert.equal(generado.jonesy_bountyhunter, 'Bounty Hunter Jonesy Sprite');
  assert.equal(generado.crash_basic, 'Crash Bandicoot Sprite');
  assert.equal(generado.striker_rift, 'Cube Striker Sprite');
  assert.equal(generado.ghost_gem, 'Gem Ghost Sprite');
});

test('ningun nombre repite "Sprite" ni arrastra el id tecnico', () => {
  const raros = Object.entries(generado)
    .filter(([id, nombre]) => nombre.split('Sprite').length !== 2 || nombre.includes(id) || nombre.includes('_'))
    .map(([id]) => id);
  assert.deepEqual(raros, []);
});

test('hay etiqueta de familia en ingles para cada familia del catalogo', () => {
  const familiasCatalogo = [...new Set(catalogo.map((s) => String(s.id).split('_')[0]))];
  const sinEtiqueta = familiasCatalogo.filter((f) => !familias[f]);
  assert.deepEqual(sinEtiqueta, []);
  assert.equal(Object.keys(familias).length, 46);
});

test('el JSON versionado esta al dia con el generador', () => {
  const { salida, familias: delGenerador } = construirCatalogo();
  assert.deepEqual(generado, salida);
  assert.deepEqual(familias, delGenerador);
});
