// La copia del navegador no puede pintar fichas que el catalogo empaquetado ya no tiene.
//
// El caso que se escapo: el CMS borra una ficha (o se quita del catalogo, como striker_gem y
// striker_rift por pedir arte que no existe). La copia vieja todavia la trae, la cuadricula
// la pinta primero y unos segundos despues la consulta a la base la borra: el total subia y
// bajaba (122 -> 119) y "desaparecian" cartas delante del usuario.
//
// El catalogo viaja CON el codigo, asi que es la lista de fichas que esta version conoce. La
// copia solo puede PISAR una ficha que el catalogo ya tiene; un id que el catalogo no conoce
// se ignora. Si de verdad existe (ficha creada en el CMS), la consulta a la base la trae.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { filtrarCopiaConfirmada } from '../src/utils/copiaLocal.js';

const CATALOGO = new Map([
  ['deer_gold', { id: 'deer_gold' }],
  ['vampire_basic', { id: 'vampire_basic' }],
]);

test('una copia con un id que el catalogo ya no tiene se descarta', () => {
  const copia = [{ id: 'striker_gem' }, { id: 'deer_gold' }];
  const limpia = filtrarCopiaConfirmada(copia, CATALOGO);
  assert.deepEqual(limpia.map((s) => s.id), ['deer_gold']);
});

test('la copia de una ficha del catalogo se conserva entera', () => {
  const ficha = { id: 'vampire_basic', name: 'Vampiro' };
  assert.deepEqual(filtrarCopiaConfirmada([ficha], CATALOGO), [ficha]);
});

test('sin copia no hay nada que filtrar', () => {
  assert.deepEqual(filtrarCopiaConfirmada(null, CATALOGO), []);
  assert.deepEqual(filtrarCopiaConfirmada(undefined, CATALOGO), []);
});

test('el arranque dinamico filtra la copia contra el catalogo', () => {
  const src = readFileSync(new URL('../src/hooks/useDynamicSprites.js', import.meta.url), 'utf8');
  assert.match(
    src,
    /filtrarCopiaConfirmada/,
    'la copia de arranque y su relectura deben pasar por el filtro: si no, las fichas borradas vuelven a pintarse y a desaparecer'
  );
});
