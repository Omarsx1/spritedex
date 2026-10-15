// El sync en vivo tiene dos piezas puras: la politica (cuando refrescar al volver a la
// pestana) y la guarda de igualdad (que corta el eco de Realtime). Por eso se prueban
// aqui y no solo en el navegador.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  INTERVALO_MINIMO_DE_REFRESCO_MS,
  debeRefrescarAlVolver,
  mismoEstado
} from '../src/utils/syncPolicy.js';

const base = { haySesion: true, compartiendo: false, visible: true, ahora: 100000, ultimoRefresco: 0 };

test('no refresca al volver sin sesion', () => {
  assert.equal(debeRefrescarAlVolver({ ...base, haySesion: false }), false);
});

test('no refresca mientras se comparte (la nube no guarda la captura en curso)', () => {
  assert.equal(debeRefrescarAlVolver({ ...base, compartiendo: true }), false);
});

test('no refresca si la pestana no esta visible', () => {
  assert.equal(debeRefrescarAlVolver({ ...base, visible: false }), false);
});

test('la primera vez refresca siempre (no hay marca previa)', () => {
  assert.equal(debeRefrescarAlVolver(base), true);
  assert.equal(debeRefrescarAlVolver({ ...base, ultimoRefresco: undefined }), true);
});

test('dentro de la ventana minima no vuelve a leer', () => {
  assert.equal(debeRefrescarAlVolver({ ...base, ahora: 105000, ultimoRefresco: 100000 }), false);
});

test('justo en el limite y despues si refresca', () => {
  const limite = 100000 + INTERVALO_MINIMO_DE_REFRESCO_MS;
  assert.equal(debeRefrescarAlVolver({ ...base, ahora: limite, ultimoRefresco: 100000 }), true);
  assert.equal(debeRefrescarAlVolver({ ...base, ahora: limite + 1, ultimoRefresco: 100000 }), true);
});

test('dos estados vacios son el mismo estado', () => {
  assert.equal(mismoEstado({}, {}), true);
  assert.equal(mismoEstado(), true);
});

test('el orden de las claves no importa', () => {
  const a = { a: { owned: true, level: 2 }, b: { owned: false, level: 1 } };
  const b = { b: { owned: false, level: 1 }, a: { owned: true, level: 2 } };
  assert.equal(mismoEstado(a, b), true);
});

test('un owned distinto no es el mismo estado', () => {
  assert.equal(mismoEstado({ a: { owned: true, level: 1 } }, { a: { owned: false, level: 1 } }), false);
});

test('un level distinto no es el mismo estado', () => {
  assert.equal(mismoEstado({ a: { owned: true, level: 2 } }, { a: { owned: true, level: 3 } }), false);
});

test('el level ausente se compara como 1 (igual que la fusion)', () => {
  assert.equal(mismoEstado({ a: { owned: true } }, { a: { owned: true, level: 1 } }), true);
  assert.equal(mismoEstado({ a: { owned: true, level: 1 } }, { a: { owned: true } }), true);
});

test('las claves de metadatos (_) se ignoran', () => {
  const a = { _profile: { email: 'uno@x.com' }, a: { owned: true, level: 1 } };
  const b = { _profile: { email: 'dos@x.com' }, a: { owned: true, level: 1 } };
  assert.equal(mismoEstado(a, b), true);
});

test('un id de mas significa que no son el mismo estado', () => {
  const uno = { a: { owned: true, level: 1 } };
  const dos = { a: { owned: true, level: 1 }, b: { owned: true, level: 1 } };
  assert.equal(mismoEstado(uno, dos), false);
  assert.equal(mismoEstado(dos, uno), false);
});

// Guardas de cableado: el modulo puro puede estar bien y no estar conectado. Se lee
// App.jsx como texto fuente, igual que tests/lazy-sync.test.js.
const appFuente = fs.readFileSync('src/App.jsx', 'utf8');

test('App.jsx espera la primera lectura antes de empujar y se pone al dia en vivo', () => {
  assert.ok(appFuente.includes('lecturaInicialLista'), 'debe rastrear si la primera lectura ya termino');
  assert.ok(
    appFuente.includes('if (!lecturaInicialLista.current) return;'),
    'el primer empuje debe esperar a la primera lectura'
  );
  assert.ok(appFuente.includes('realtime-yo-'), 'debe suscribirse a la propia fila de user_collections');
  assert.ok(appFuente.includes('visibilitychange'), 'debe leer al volver a la pestana');
  assert.ok(appFuente.includes('debeRefrescarAlVolver'), 'debe usar la politica de refresco');
  assert.ok(appFuente.includes('mismoEstado'), 'debe usar la guarda de igualdad contra el eco');
});
