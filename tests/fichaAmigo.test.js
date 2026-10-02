// La regla "esta ficha ya esta cargada" decide si el boton "Ver su colección" sobra en la
// ficha del amigo. Es pura, y por eso se prueba aqui, sin montar la app.
//
// La regresion que la origina: el mismo amigo, con el codigo escrito con prefijo o sin el,
// volvia a mostrar el boton y el clic no hacia nada porque su colección ya estaba en pantalla.
import test from 'node:test';
import assert from 'node:assert/strict';
import { codigoNormalizado, fichaYaCargada } from '../src/utils/fichaAmigo.js';

test('normaliza el prefijo SDEX-, las minusculas y los separadores', () => {
  assert.equal(codigoNormalizado('SDEX-3CDB'), '3CDB');
  assert.equal(codigoNormalizado('sdex-3cdb'), '3CDB');
  assert.equal(codigoNormalizado('3cdb'), '3CDB');
  assert.equal(codigoNormalizado('SDEX-3C DB'), '3CDB');
});

test('un codigo vacio se normaliza a cadena vacia', () => {
  assert.equal(codigoNormalizado(''), '');
  assert.equal(codigoNormalizado(null), '');
  assert.equal(codigoNormalizado(undefined), '');
});

test('la ficha ya cargada compara el mismo codigo con o sin prefijo', () => {
  assert.equal(fichaYaCargada({ codigoFicha: 'SDEX-3CDB', codigoCargado: '3cdb', hayColeccion: true }), true);
  assert.equal(fichaYaCargada({ codigoFicha: '3CDB', codigoCargado: 'SDEX-3CDB', hayColeccion: true }), true);
});

test('un codigo cargado vacio nunca cuenta como cargado', () => {
  assert.equal(fichaYaCargada({ codigoFicha: 'SDEX-3CDB', codigoCargado: '', hayColeccion: true }), false);
  assert.equal(fichaYaCargada({ codigoFicha: '', codigoCargado: '', hayColeccion: true }), false);
});

test('sin colección no hay nada cargado', () => {
  assert.equal(fichaYaCargada({ codigoFicha: 'SDEX-3CDB', codigoCargado: 'SDEX-3CDB', hayColeccion: false }), false);
});

test('dos codigos distintos no son la misma ficha', () => {
  assert.equal(fichaYaCargada({ codigoFicha: 'SDEX-3CDB', codigoCargado: 'SDEX-9XYZ', hayColeccion: true }), false);
});
