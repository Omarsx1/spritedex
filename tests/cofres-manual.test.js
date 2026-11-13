import test from 'node:test';
import assert from 'node:assert/strict';

import {
  estadoInicial,
  normalizar,
  sumarCofres,
  alternarToken,
  reiniciarSesion,
  reiniciarTodo,
  deshacerUltimo,
  HISTORIAL_MAX
} from '../src/utils/cofresManual.js';

const HOY = '2026-11-13';

test('deshacer revierte un +5 completo, no resta uno', () => {
  const despues = sumarCofres(estadoInicial(), 5, HOY);
  assert.equal(despues.total, 5);
  const antes = deshacerUltimo(despues);
  assert.equal(antes.total, 0);
  assert.equal(antes.hoy, undefined);
  assert.equal(antes.dias[HOY] ?? 0, 0);
  assert.deepEqual(antes.historial, []);
});

test('deshacer revierte el token y la sesion', () => {
  const conToken = alternarToken(estadoInicial(), HOY);
  assert.equal(conToken.token, true);
  const sinToken = deshacerUltimo(conToken);
  assert.equal(sinToken.token, false);
  assert.equal(sinToken.tokenFecha, null);

  const conSesion = reiniciarSesion(sumarCofres(estadoInicial(), 3, HOY));
  assert.equal(conSesion.sesion, 0);
  const recuperada = deshacerUltimo(conSesion);
  assert.equal(recuperada.sesion, 3);
});

test('deshacer sin historial no cambia nada', () => {
  const estado = estadoInicial();
  assert.deepEqual(deshacerUltimo(estado), estado);
});

test('el historial se limita y no crece sin fin', () => {
  let estado = estadoInicial();
  for (let i = 0; i < HISTORIAL_MAX + 5; i++) estado = sumarCofres(estado, 1, HOY);
  assert.equal(estado.historial.length, HISTORIAL_MAX);
  assert.equal(estado.total, HISTORIAL_MAX + 5);
});

test('normalizar migra el estado viejo y sanea valores', () => {
  const viejo = normalizar({ total: 4, hoy: 2, fecha: HOY, token: true });
  assert.equal(viejo.total, 4);
  assert.equal(viejo.dias[HOY], 2);
  assert.equal(viejo.token, true);
  assert.deepEqual(viejo.historial, []);
  const roto = normalizar({ total: -9, sesion: 'x', dias: null });
  assert.equal(roto.total, 0);
  assert.equal(roto.sesion, 0);
  assert.deepEqual(roto.dias, {});
});

test('reiniciar borra el historial', () => {
  const conDatos = sumarCofres(estadoInicial(), 2, HOY);
  assert.deepEqual(reiniciarTodo(conDatos), estadoInicial());
});
