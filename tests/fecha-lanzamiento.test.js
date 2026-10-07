// Que fecha de lanzamiento manda al mezclar el catalogo con la capa dinamica (CMS o cache del
// navegador). El caso que lo rompio: fichas publicadas que la gente ya tenia, ocultas por una
// fecha vieja guardada de mas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { fechaDeLanzamiento } from '../src/utils/lanzamiento.js';

const FUTURO = '2026-12-01T00:00:00.000Z';
const PASADO = '2026-10-01';

test('una fecha suelta del navegador no oculta una ficha que el catalogo da por publicada', () => {
  // El Ciervo: publicada con fecha del 1 de octubre + una fecha vieja en la cache.
  assert.equal(fechaDeLanzamiento({ unreleased: false, releaseDate: PASADO }, { release_date: FUTURO, unreleased: true }), PASADO);
});

test('tampoco oculta una publicada SIN fecha en el catalogo', () => {
  // Sonic: publicada y sin fecha (releaseDate null). Aqui estaba el hueco.
  assert.equal(fechaDeLanzamiento({ unreleased: false, releaseDate: null }, { release_date: FUTURO, unreleased: true }), null);
});

test('el CMS si puede mover el lanzamiento de lo que el catalogo da por no publicado', () => {
  assert.equal(fechaDeLanzamiento({ unreleased: false, releaseDate: '2026-10-08T08:00:00.000Z' }, { release_date: FUTURO }), FUTURO);
  assert.equal(fechaDeLanzamiento({ unreleased: true, releaseDate: null }, { release_date: FUTURO }), FUTURO);
});

test('sin fecha dinamica manda el catalogo', () => {
  assert.equal(fechaDeLanzamiento({ unreleased: false, releaseDate: PASADO }, null), PASADO);
  assert.equal(fechaDeLanzamiento({ unreleased: false, releaseDate: null }, null), null);
});
