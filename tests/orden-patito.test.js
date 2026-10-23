// La variante Patito (Quack) va DESPUES de Hacker y ANTES de Hacker de Botin.
// El orden de la cuadricula es el del JSON, no el de VARIANT_ORDER: el sync inserta cada
// espiritu contiguo a su familia, asi que hay que vigilar las dos cosas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sprites = JSON.parse(readFileSync(new URL('../src/data/official_sprites.json', import.meta.url), 'utf8'));
const spritesData = readFileSync(new URL('../src/data/spritesData.js', import.meta.url), 'utf8');

const variantes = () => {
  const coincidencia = spritesData.match(/export const VARIANT_ORDER = \[([^\]]+)\]/);
  assert.ok(coincidencia, 'no se encontro VARIANT_ORDER en spritesData.js');
  return coincidencia[1].split(',').map((v) => v.trim().replace(/^'|'$/g, ''));
};

test('VARIANT_ORDER pone Patito justo despues de Hacker y antes de Hacker de Botin', () => {
  const orden = variantes();
  const hacker = orden.indexOf('Cheatmaster');
  const patito = orden.indexOf('Quack');
  const botin = orden.indexOf('Loot Hacker');
  assert.ok(hacker > -1 && patito > -1 && botin > -1, 'faltan variantes en VARIANT_ORDER');
  assert.equal(patito, hacker + 1, 'Patito debe ir inmediatamente despues de Hacker');
  assert.equal(botin, patito + 1, 'Hacker de Botin debe ir inmediatamente despues de Patito');
});

test('en cada familia, la ficha Patito va antes que la de Hacker de Botin', () => {
  const posicion = new Map(sprites.map((s, i) => [s.id, i]));
  for (const patito of sprites.filter((s) => s.theme === 'Quack')) {
    const familia = patito.id.split('_')[0];
    const botin = posicion.get(`${familia}_loothacker`);
    if (botin === undefined) continue;
    assert.ok(
      posicion.get(patito.id) < botin,
      `${familia}: Patito debe ir antes que Hacker de Botin`
    );
  }
});
