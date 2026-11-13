import test from 'node:test';
import assert from 'node:assert/strict';
import { esRutaCofres, RUTA_COFRES } from '../src/utils/rutaCofres.js';

test('la ruta del contador se reconoce con y sin barra final', () => {
  assert.equal(esRutaCofres(RUTA_COFRES), true);
  assert.equal(esRutaCofres('/cofres/'), true);
  assert.equal(esRutaCofres('/cofres-viejos'), false);
  assert.equal(esRutaCofres('/cofres/algo'), false);
  assert.equal(esRutaCofres('/'), false);
});
