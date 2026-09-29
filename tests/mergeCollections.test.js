// La fusion de estados es lo que evita perder colecciones al entrar en otro
// dispositivo. Es logica pura: por eso se prueba aqui y no solo en el navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeCollections, sinPerfil } from '../src/utils/mergeCollections.js';

test('conserva lo que solo esta en la nube (lo marcado en otro dispositivo)', () => {
  const fusion = mergeCollections({ a: { owned: true, level: 1 } }, { b: { owned: true, level: 3 } });
  assert.deepEqual(fusion.b, { owned: true, level: 3 });
  assert.deepEqual(fusion.a, { owned: true, level: 1 });
});

test('conserva lo que solo esta en local (marcado sin conexion)', () => {
  const fusion = mergeCollections({ z: { owned: true, level: 2 } }, { a: { owned: true, level: 1 } });
  assert.equal(fusion.z.owned, true);
});

test('en conflicto gana atrapado y el nivel mas alto', () => {
  const fusion = mergeCollections(
    { a: { owned: false, level: 1 } },
    { a: { owned: true, level: 5 } }
  );
  assert.deepEqual(fusion.a, { owned: true, level: 5 });
});

test('nunca baja un nivel ya alcanzado', () => {
  const fusion = mergeCollections({ a: { owned: true, level: 5 } }, { a: { owned: true, level: 1 } });
  assert.equal(fusion.a.level, 5);
});

test('ignora los metadatos de perfil de la nube', () => {
  const fusion = mergeCollections({}, { _profile: { email: 'x@y.com' }, a: { owned: true, level: 1 } });
  assert.equal(fusion._profile, undefined);
  assert.equal(Object.keys(fusion).length, 1);
});

test('aguanta estados vacios o incompletos', () => {
  assert.deepEqual(mergeCollections(), {});
  assert.deepEqual(mergeCollections({ a: { owned: true, level: 2 } }, {}), { a: { owned: true, level: 2 } });
  assert.deepEqual(mergeCollections({ a: {} }, { a: { owned: true } }), { a: { owned: true, level: 1 } });
});

test('sinPerfil quita solo los metadatos', () => {
  assert.deepEqual(sinPerfil({ _profile: { email: 'x' }, a: { owned: true } }), { a: { owned: true } });
});

