// La red guardada es un hueco de modulo: sobrevive a que la pagina de amigos se desmonte.
// Si esta regla falla, la lista vuelve a empezar de cero en cada entrada (o peor: le
// muestra a alguien la red de otra persona). Es pura, y por eso se prueba aqui.
import test from 'node:test';
import assert from 'node:assert/strict';
import { leerRed, guardarRed } from '../src/utils/redAmigos.js';

test('sin nada guardado no hay red que leer', () => {
  assert.equal(leerRed('u-1'), null);
});

test('el mismo usuario recibe lo ultimo que se guardo', () => {
  const red = { recibidas: [{ id: 'r1' }], enviadas: [{ id: 'e1' }], amigos: [{ id: 'a1' }] };
  guardarRed('u-1', red);
  assert.deepEqual(leerRed('u-1'), red);
});

test('la red de otro usuario no se le presta a nadie', () => {
  assert.equal(leerRed('u-2'), null);
});

test('sin userId no se lee nada', () => {
  assert.equal(leerRed(''), null);
  assert.equal(leerRed(null), null);
  assert.equal(leerRed(undefined), null);
});

test('una segunda lectura reemplaza a la primera, y sin userId no se guarda nada', () => {
  const nueva = { recibidas: [], enviadas: [{ id: 'e2' }], amigos: [{ id: 'a2' }] };
  guardarRed('u-1', nueva);
  assert.deepEqual(leerRed('u-1'), nueva);
  guardarRed('', { recibidas: [], enviadas: [], amigos: [] });
  assert.deepEqual(leerRed('u-1'), nueva);
});
