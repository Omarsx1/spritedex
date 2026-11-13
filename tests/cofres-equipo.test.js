import test from 'node:test';
import assert from 'node:assert/strict';

import {
  equipoInicial,
  agregarJugador,
  quitarJugador,
  seleccionarJugador,
  sumarJugador,
  jugadorActivo,
  totalEquipo,
  hoyEquipo,
  diasEquipo,
  topEquipo,
  fusionarEquipo
} from '../src/utils/cofresEquipo.js';

const HOY = '2026-11-13';

test('añadir, seleccionar y sumar al jugador activo', () => {
  let e = agregarJugador(equipoInicial(), 'Ana');
  e = agregarJugador(e, 'Luis');
  assert.deepEqual(e.jugadores.map((j) => j.nombre), ['Ana', 'Luis']);
  assert.equal(e.activoId, 'luis');
  e = seleccionarJugador(e, 'ana');
  e = sumarJugador(e, 'ana', 5, HOY);
  assert.equal(jugadorActivo(e).nombre, 'Ana');
  assert.equal(totalEquipo(e), 5);
  assert.equal(hoyEquipo(e, HOY), 5);
  assert.deepEqual(diasEquipo(e), { [HOY]: 5 });
});

test('quitar al activo deja a otro y no permite duplicados por nombre', () => {
  let e = agregarJugador(equipoInicial(), 'Ana');
  e = agregarJugador(e, 'Luis');
  e = agregarJugador(e, 'Ana');
  assert.deepEqual(e.jugadores.map((j) => j.id), ['ana', 'luis', 'ana-2']);
  e = quitarJugador(e, 'ana-2');
  assert.equal(e.activoId, 'ana');
  e = quitarJugador(e, 'ana');
  assert.equal(e.activoId, 'luis');
});

test('el top y la fusión conservan el mayor total y día de cada jugador', () => {
  let a = agregarJugador(equipoInicial(), 'Ana');
  a = sumarJugador(a, 'ana', 4, HOY);
  let b = agregarJugador(equipoInicial(), 'Ana');
  b = sumarJugador(b, 'ana', 9, HOY);
  const f = fusionarEquipo(a, b);
  assert.equal(f.jugadores[0].total, 9);
  assert.equal(f.jugadores[0].dias[HOY], 9);
  assert.equal(topEquipo(f).nombre, 'Ana');
});

test('normaliza ids y nombres raros', () => {
  const e = agregarJugador(equipoInicial(), '  José Ángel  ');
  assert.equal(e.jugadores[0].id, 'jose-angel');
  assert.equal(e.jugadores[0].nombre, 'José Ángel');
});
