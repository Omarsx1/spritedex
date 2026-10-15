import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsearCatalogo,
  fechaDeEspiritu,
  coincideConOficial,
  construirProvisional
} from '../scripts/sync-spritehelp.js';

const BUNDLE = `
x={id:"honey_basic",name:"Honey",base:"honey",theme:"Basic",rarity:"Rare",unreleased:!1},
y={id:"honey_cheat",name:"Cheat Master Honey",base:"honey",theme:"Cheat",rarity:"Special",unreleased:!1},
z={id:"spooky_quack",name:"Quack Spooky Dash",base:"spooky",theme:"Quack",rarity:"Special",unreleased:!0},
w={id:"honey_basic",name:"Duplicado",base:"honey",theme:"Basic",rarity:"Rare",unreleased:!1};
const fechas={honey:"2026-10-15",Cheat:"2026-10-01",honey_basic:"2026-09-30"};
`;

test('parsea los espiritus del bundle sin duplicados ni fechas de mas', () => {
  const { entradas } = parsearCatalogo(BUNDLE);
  assert.deepEqual(entradas.map((e) => e.id), ['honey_basic', 'honey_cheat', 'spooky_quack']);
  assert.equal(entradas[2].unreleased, true);
});

test('la fecha del espiritu manda sobre la del tema y la de la familia', () => {
  const { entradas, fechas } = parsearCatalogo(BUNDLE);
  assert.equal(fechaDeEspiritu(entradas[0], fechas), '2026-09-30T08:00:00.000Z');
  assert.equal(fechaDeEspiritu(entradas[1], new Map([['Cheat', '2026-10-01']])), '2026-10-01T08:00:00.000Z');
  assert.equal(fechaDeEspiritu(entradas[1], new Map([['honey', '2026-10-15']])), '2026-10-15T08:00:00.000Z');
  assert.equal(fechaDeEspiritu(entradas[1], new Map()), null);
});

test('no duplica un espiritu que ya existe en el catalogo oficial', () => {
  const oficial = { id: 'honey_cheatmaster', theme: 'Cheatmaster' };
  const entrada = { id: 'honey_cheat', base: 'honey', theme: 'Cheat' };
  assert.equal(coincideConOficial(oficial, entrada), true);
  assert.equal(coincideConOficial({ id: 'honey_gold', theme: 'Gold' }, entrada), false);
});

test('construye el provisional con la familia de la app y arte de spritehelp', () => {
  const espiritu = construirProvisional(
    { id: 'spooky_quack', name: 'Quack Spooky Dash', base: 'spooky', theme: 'Quack', rarity: 'Special' },
    '2026-10-15T08:00:00.000Z'
  );
  assert.equal(espiritu.id, 'spookydash_quack');
  assert.equal(espiritu.nameEn, 'Quack Spooky Dash');
  assert.equal(espiritu.artSource, 'spritehelp');
  assert.equal(espiritu.unreleased, false);
  assert.equal(espiritu.gen, 2);
});

test('el básico usa el nombre real del juego en inglés', () => {
  const espiritu = construirProvisional(
    { id: 'obsession_basic', name: 'Obsession', base: 'obsession', theme: 'Basic', rarity: 'Rare' },
    '2026-10-15T08:00:00.000Z'
  );
  assert.equal(espiritu.nameEn, 'One Wish Willow Sprite');
});
