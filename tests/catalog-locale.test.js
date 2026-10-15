// El catalogo en ingles se genera desde la captura cruda de fortnite.gg. Estas pruebas
// fijan el contrato: los nombres del juego tal cual y el resto compuestos con su misma regla.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { construirCatalogo } from '../scripts/build_locale_catalog.mjs';

const leer = (ruta) => JSON.parse(fs.readFileSync(ruta, 'utf8'));
const catalogo = leer('src/data/official_sprites.json');
const generado = leer('src/data/i18n/catalog.en.json');
const familias = leer('src/data/i18n/familias.en.json');

// Los combos que no estan en la captura cruda: se componen con "<Variante> <Familia> Sprite".
// Eran 16; los 8 que no existen en el juego (Gem Air, Holofoil Aura, Gem Batman, Holofoil Duck,
// Holofoil Fishy, Gem Fishy, Holofoil Boss y Gem Seven) se borraron del catalogo.
const COMPUESTOS = [
  'boss_gem', 'demon_holofoil', 'dream_gem', 'ghost_gem',
  'king_gem', 'punk_gem'
];

test('cada espiritu del catalogo tiene nombre en ingles no vacio', () => {
  const sinNombre = catalogo.filter((s) => !generado[s.id] || !String(generado[s.id]).trim()).map((s) => s.id);
  assert.deepEqual(sinNombre, []);
  assert.equal(Object.keys(generado).length, catalogo.length);
  assert.ok(catalogo.length >= 234);
});

test('los nombres que no estan en la captura se componen, y son los que quedan', () => {
  const { compuestos } = construirCatalogo();
  const ids = compuestos.map((c) => c.split(' -> ')[0]).sort();
  assert.ok(compuestos.length >= COMPUESTOS.length);
  COMPUESTOS.forEach((comp) => assert.ok(ids.includes(comp), `Falta compuesto base: ${comp}`));
});

test('los nombres son los del juego: variante primero y sin el sufijo " Sprite"', () => {
  assert.equal(generado.water_basic, 'Water');
  assert.equal(generado.jonesy_gold, 'Gold Jonesy');
  assert.equal(generado.jonesy_loothacker, 'Loot Hacker Jonesy');
  assert.equal(generado.jonesy_bountyhunter, 'Bounty Hunter Jonesy');
  assert.equal(generado.crash_basic, 'Crash Bandicoot');
  assert.equal(generado.boss_gem, 'Gem Boss');
  assert.equal(generado.ghost_gem, 'Gem Ghost');
});

test('ningun nombre arrastra el sufijo " Sprite" ni el id tecnico', () => {
  const raros = Object.entries(generado)
    .filter(([id, nombre]) => /Sprite/i.test(nombre) || nombre.includes(id) || nombre.includes('_'))
    .map(([id]) => id);
  assert.deepEqual(raros, []);
});

test('hay etiqueta de familia en ingles para cada familia del catalogo', () => {
  const familiasCatalogo = [...new Set(catalogo.map((s) => String(s.id).split('_')[0]))];
  const sinEtiqueta = familiasCatalogo.filter((f) => !familias[f]);
  assert.deepEqual(sinEtiqueta, []);
  assert.ok(Object.keys(familias).length >= 46);
});

test('el JSON versionado esta al dia con el generador', () => {
  const { salida, familias: delGenerador } = construirCatalogo();
  assert.deepEqual(generado, salida);
  assert.deepEqual(familias, delGenerador);
});
