// Lanzamiento manual: un lote adelantado a proposito se queda publicado.
//
// El unico freno que tenia un lote era que su fecha estuviera en el FUTURO: con fecha futura el
// sync respeta la ficha aunque la fuente la de por no lanzada (scripts/sync-sprites.js). Cuando
// el lote se adelanta, esa fecha deja de proteger y la siguiente pasada del sync volveria a
// marcarlo como no lanzado: la app lo esconde y el cambio se commitea solo.
//
// De ahi el campo explicito 'lanzamientoManual': dice, ficha por ficha, que el lanzamiento lo
// decidio una persona y que la fuente no manda todavia. No es la regla vieja que forzaba todo el
// tema "Dulce o Truco" a lanzado (esa se quito porque mentia sobre el dato): es una excepcion
// nombrada, visible en el catalogo y con su propia prueba.
import test from 'node:test';
import assert from 'node:assert/strict';
import { esLanzamientoManual, debeRevertirAUnreleased } from '../src/utils/lanzamiento.js';

const manual = { id: 'vampire_tricktreat', name: 'Vampiro Dulce o Truco', unreleased: false, lanzamientoManual: true };
const normal = { id: 'otro_basic', name: 'Otro', unreleased: false };

test('el freno del lote: una ficha normal vuelve a no lanzada si la fuente lo dice', () => {
  assert.equal(debeRevertirAUnreleased(normal, true), true);
});

test('un lanzamiento manual NO vuelve atras aunque la fuente lo de por no lanzado', () => {
  assert.equal(debeRevertirAUnreleased(manual, true), false);
});

test('si la fuente ya lo da por publicado no hay nada que revertir', () => {
  assert.equal(debeRevertirAUnreleased(normal, false), false);
  assert.equal(debeRevertirAUnreleased(manual, false), false);
});

test('una ficha que ya esta marcada como no lanzada no entra en la transicion', () => {
  assert.equal(debeRevertirAUnreleased({ ...normal, unreleased: true }, true), false);
});

test('el flag es estricto: solo true vale', () => {
  assert.equal(esLanzamientoManual(manual), true);
  assert.equal(esLanzamientoManual(normal), false);
  assert.equal(esLanzamientoManual(null), false);
  for (const valor of ['true', 1, {}, [], 'si']) {
    assert.equal(esLanzamientoManual({ id: 'x', lanzamientoManual: valor }), false);
  }
});
