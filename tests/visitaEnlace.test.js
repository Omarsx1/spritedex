// La visita por enlace es la regla que decide si la ficha del amigo se dibuja y si la
// pagina de amigos abre en comparación. Es pura, y por eso se prueba aqui.
//
// La regresion que originaron estas pruebas: entrar por un enlace de amigo, volver a la
// app y reabrir la pagina de amigos abria la pestaña de comparación con el codigo de la
// visita anterior, y la app quedaba en MODO AMIGO sin que nadie lo hubiera elegido.
import test from 'node:test';
import assert from 'node:assert/strict';
import { codigoFichaEnRuta, traeEnlaceDeAmigo } from '../src/utils/visitaEnlace.js';

test('el codigo de la ruta manda siempre, con o sin enlace', () => {
  assert.equal(codigoFichaEnRuta('/amigos/SDEX-3CDB', '', ''), 'SDEX-3CDB');
  assert.equal(codigoFichaEnRuta('/amigos/SDEX-3CDB', '?share=tok', 'OTRO'), 'SDEX-3CDB');
});

test('el codigo de la ruta se normaliza igual que antes', () => {
  assert.equal(codigoFichaEnRuta('/amigos/3cdb', '', ''), '3CDB');
  assert.equal(codigoFichaEnRuta('/amigos/SDEX-3cdb/', '', ''), 'SDEX-3CDB');
  assert.equal(codigoFichaEnRuta('/amigos/CDB%20X', '', ''), 'CDB X');
});

test('con el enlace todavia en la ruta, la ficha del token se dibuja', () => {
  assert.equal(codigoFichaEnRuta('/amigos', '?share=a1b2c3d4', 'SDEX-3CDB'), 'SDEX-3CDB');
  assert.equal(codigoFichaEnRuta('/amigos', '?code=SDEX-3CDB', 'SDEX-3CDB'), 'SDEX-3CDB');
});

test('un codigo de una visita anterior no cuenta: la ruta ya esta limpia', () => {
  assert.equal(codigoFichaEnRuta('/amigos', '', 'SDEX-3CDB'), '');
  assert.equal(codigoFichaEnRuta('/amigos?', '', 'SDEX-3CDB'), '');
});

test('fuera de la pagina de amigos no hay ficha', () => {
  assert.equal(codigoFichaEnRuta('/', '?share=a1b2c3d4', 'SDEX-3CDB'), '');
  assert.equal(codigoFichaEnRuta('/en', '?share=a1b2c3d4', 'SDEX-3CDB'), '');
});

test('sin token resuelto la ficha queda vacia, no undefined', () => {
  assert.equal(codigoFichaEnRuta('/amigos', '?share=a1b2c3d4', ''), '');
  assert.equal(codigoFichaEnRuta('/amigos', '?share=a1b2c3d4', null), '');
});

test('se reconocen los tres formatos de enlace, y nada mas', () => {
  assert.equal(traeEnlaceDeAmigo('?share=a1b2c3d4'), true);
  assert.equal(traeEnlaceDeAmigo('?code=SDEX-3CDB'), true);
  assert.equal(traeEnlaceDeAmigo('?lang=en&friend=abc'), true);
  assert.equal(traeEnlaceDeAmigo(''), false);
  assert.equal(traeEnlaceDeAmigo('?otro=1'), false);
  assert.equal(traeEnlaceDeAmigo('?myshare=1'), false);
});
