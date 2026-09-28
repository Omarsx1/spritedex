// Pruebas del contrato del export: la clave de cache y el formato por defecto.
// Corren con el runner que ya trae Node (pnpm test), sin dependencias nuevas.
import test from 'node:test';
import assert from 'node:assert/strict';
import { getCanvasCacheKey, DEFAULT_EXPORT_FORMAT, DEFAULT_EXPORT_BG_STYLE } from '../src/utils/canvasExporter.js';

const sprites = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const clave = (estado, extra = {}) => getCanvasCacheKey(
  DEFAULT_EXPORT_FORMAT,
  DEFAULT_EXPORT_BG_STYLE,
  extra.count ?? 3,
  extra.owned ?? 0,
  extra.sprites ?? sprites,
  estado
);

test('la clave es determinista para el mismo estado', () => {
  const uno = clave({ b: { owned: true, level: 2 } }, { owned: 1 });
  const dos = clave({ b: { owned: true, level: 2 } }, { owned: 1, sprites: [...sprites] });
  assert.equal(uno, dos);
});

test('marcar un espiritu invalida la clave', () => {
  assert.notEqual(clave({}), clave({ a: { owned: true, level: 1 } }, { owned: 1 }));
});

test('subir de nivel invalida la clave aunque el conteo no cambie', () => {
  const nivel1 = clave({ a: { owned: true, level: 1 } }, { owned: 1 });
  const nivel5 = clave({ a: { owned: true, level: 5 } }, { owned: 1 });
  assert.notEqual(nivel1, nivel5);
});

test('cambiar el formato o el fondo invalida la clave', () => {
  const base = clave({});
  assert.notEqual(base, getCanvasCacheKey('square', DEFAULT_EXPORT_BG_STYLE, 3, 0, sprites, {}));
  assert.notEqual(base, getCanvasCacheKey(DEFAULT_EXPORT_FORMAT, 'blueprint', 3, 0, sprites, {}));
});

test('la clave lleva marca de version para poder invalidar todo de golpe', () => {
  assert.match(clave({}), /^v\d+_/);
});

test('el contrato por defecto no cambia por accidente', () => {
  // Si esto falla, el precalculo de App.jsx y la modal dejarian de coincidir en
  // silencio: la captura se generaria dos veces y nadie veria un error.
  assert.equal(DEFAULT_EXPORT_FORMAT, 'checklist');
  assert.equal(DEFAULT_EXPORT_BG_STYLE, 'glitch_override');
});

