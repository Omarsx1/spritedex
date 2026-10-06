// La vista (generacion, busqueda, filtros, orden) vive tambien en la URL: estas pruebas
// fijan el contrato de ida y vuelta, incluido lo que NO se debe pisar (friend, studio, perf).
import test from 'node:test';
import assert from 'node:assert/strict';
import { leerVista, escribirVista, VISTA_POR_DEFECTO } from '../src/utils/vistaUrl.js';

test('sin parametros devuelve la vista por defecto', () => {
  assert.deepEqual(leerVista(''), VISTA_POR_DEFECTO);
  assert.deepEqual(leerVista('?'), VISTA_POR_DEFECTO);
});

test('lee generacion, busqueda, filtros, orden y modo de vista', () => {
  const v = leerVista('?gen=1&q=mapache&tema=gold&familia=peely&estado=owned&orden=name&lanzados=1&vista=list');
  assert.deepEqual(v, {
    gen: '1',
    q: 'mapache',
    tema: 'gold',
    familia: 'peely',
    estado: 'owned',
    orden: 'name',
    lanzados: '1',
    vista: 'list',
  });
});

test('lo invalido cae al valor por defecto en vez de romper la vista', () => {
  assert.equal(leerVista('?gen=9').gen, '2');
  assert.equal(leerVista('?gen=abc').gen, '2');
  assert.equal(leerVista('?vista=carrusel').vista, 'grid');
  assert.equal(leerVista('?lanzados=quizas').lanzados, '0');
  assert.equal(leerVista('?tema=').tema, 'all');
});

test('la generacion 0 (todas) es valida y no es lo mismo que 1', () => {
  assert.equal(leerVista('?gen=0').gen, '0');
  assert.equal(leerVista('?gen=1').gen, '1');
});

test('escribe solo lo que se sale de lo por defecto', () => {
  assert.equal(escribirVista(VISTA_POR_DEFECTO), '');
  assert.equal(escribirVista({ gen: '2', tema: 'all', vista: 'grid' }), '');
  assert.equal(escribirVista({ gen: '1' }), '?gen=1');
});

test('no pisa los parametros que no son de la vista', () => {
  assert.equal(escribirVista(VISTA_POR_DEFECTO, '?friend=ABC&studio=1'), '?friend=ABC&studio=1');
  const escrito = escribirVista({ gen: '1' }, '?friend=ABC&studio=1');
  const params = new URLSearchParams(escrito);
  assert.equal(params.get('friend'), 'ABC');
  assert.equal(params.get('studio'), '1');
  assert.equal(params.get('gen'), '1');
});

test('quitar un filtro lo borra de la URL en vez de dejarlo vacio', () => {
  const escrito = escribirVista({ tema: 'all', gen: '1' }, '?tema=gold&gen=1');
  assert.equal(escrito, '?gen=1');
});

test('ida y vuelta: lo escrito se lee igual', () => {
  const vista = { gen: '0', q: 'el ciervo', tema: 'candy', familia: 'peely', estado: 'missing', orden: 'rarity', lanzados: '1', vista: 'list' };
  assert.deepEqual(leerVista(escribirVista(vista)), vista);
});

test('la busqueda con espacios y acentos sobrevive al viaje', () => {
  const escrito = escribirVista({ q: 'impulso aterrador' });
  assert.equal(leerVista(escrito).q, 'impulso aterrador');
});

