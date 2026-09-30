// El idioma se decide con el navegador, no con el pais: un hispanohablante en EE.UU.
// tiene es-US y debe ver español. Estas pruebas fijan esa regla y el plan de arranque.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  conIdioma,
  idiomaDelNavegador,
  normalizarIdioma,
  planDeArranque,
  rutaSinIdioma,
  traducir
} from '../src/i18n/core.js';
import { DICCIONARIOS } from '../src/i18n/locales/index.js';

test('normalizarIdioma: es-* es español, cualquier otra cosa es ingles', () => {
  assert.equal(normalizarIdioma('es'), 'es');
  assert.equal(normalizarIdioma('es-MX'), 'es');
  assert.equal(normalizarIdioma('ES-mx'), 'es');
  assert.equal(normalizarIdioma('en-US'), 'en');
  assert.equal(normalizarIdioma('fr'), 'en');
  assert.equal(normalizarIdioma(''), null);
});

test('idiomaDelNavegador mira la primera etiqueta', () => {
  assert.equal(idiomaDelNavegador(['es-MX']), 'es');
  assert.equal(idiomaDelNavegador(['en-US']), 'en');
  assert.equal(idiomaDelNavegador(['fr-FR', 'es-ES']), 'en');
  assert.equal(idiomaDelNavegador([]), 'en');
  assert.equal(idiomaDelNavegador(undefined), 'en');
});

test('planDeArranque: sin eleccion guardada, el navegador en ingles manda a /en', () => {
  assert.deepEqual(planDeArranque({ pathname: '/', langs: ['en-US'], guardado: null }), { lang: 'en', destino: '/en' });
});

test('planDeArranque: navegador en español se queda en la raiz, sin tocar la URL', () => {
  assert.deepEqual(planDeArranque({ pathname: '/', langs: ['es-MX'], guardado: null }), { lang: 'es', destino: null });
});

test('planDeArranque: la eleccion del usuario gana sobre el navegador', () => {
  assert.deepEqual(planDeArranque({ pathname: '/', langs: ['en-US'], guardado: 'es' }), { lang: 'es', destino: null });
  // Con eleccion explicita se respeta y NO se reescribe la barra de direcciones: la URL se
  // mueve solo cuando la decision la tomo el navegador, no la persona.
  assert.deepEqual(planDeArranque({ pathname: '/', langs: ['es-MX'], guardado: 'en' }), { lang: 'en', destino: null });
});

test('planDeArranque: /en ya es ingles y no se mueve', () => {
  assert.deepEqual(planDeArranque({ pathname: '/en', langs: ['es-MX'], guardado: 'es' }), { lang: 'en', destino: null });
  assert.deepEqual(planDeArranque({ pathname: '/en/amigos', langs: ['es-MX'], guardado: null }), { lang: 'en', destino: null });
});

test('planDeArranque conserva ruta, query y hash al moverse a /en', () => {
  assert.deepEqual(
    planDeArranque({ pathname: '/amigos/SDEX-1', search: '?code=X', hash: '#y', langs: ['en-US'], guardado: null }),
    { lang: 'en', destino: '/en/amigos/SDEX-1?code=X#y' }
  );
});

test('conIdioma y rutaSinIdioma van y vuelven sin perder nada', () => {
  assert.equal(conIdioma('/amigos/SDEX-1', 'en'), '/en/amigos/SDEX-1');
  assert.equal(conIdioma('/en/amigos', 'es'), '/amigos');
  assert.equal(conIdioma('/', 'en'), '/en');
  assert.equal(conIdioma('/en', 'es'), '/');
  assert.equal(conIdioma('/en', 'en'), '/en');
  assert.equal(conIdioma('/amigos?code=1', 'en'), '/en/amigos?code=1');
  assert.equal(rutaSinIdioma('/en'), '/');
  assert.equal(rutaSinIdioma('/en/amigos'), '/amigos');
  assert.equal(rutaSinIdioma('/amigos'), '/amigos');
});

test('traducir: idioma activo, luego español, luego la propia clave', () => {
  const dicc = { es: { a: 'uno', b: 'dos' }, en: { a: 'one' } };
  assert.equal(traducir(dicc, 'en', 'a'), 'one');
  assert.equal(traducir(dicc, 'en', 'b'), 'dos');
  assert.equal(traducir(dicc, 'es', 'a'), 'uno');
  assert.equal(traducir(dicc, 'en', 'z'), 'z');
  assert.equal(traducir({}, 'es', 'z'), 'z');
});

test('interpolacion de variables', () => {
  assert.equal(traducir({ es: { x: 'Hola {n}' } }, 'es', 'x', { n: 'Omar' }), 'Hola Omar');
  assert.equal(traducir({ es: { x: '{a} y {b}' } }, 'es', 'x', { a: 1, b: 2 }), '1 y 2');
  assert.equal(traducir({ es: { x: 'sin vars' } }, 'es', 'x', null), 'sin vars');
  assert.equal(traducir({ es: { x: 'falta {n}' } }, 'es', 'x', {}), 'falta {n}');
});

test('el bloque base tiene ingles de verdad, no español copiado', () => {
  // Estas claves existen en los dos idiomas y su texto tiene que ser distinto: si alguien
  // copia el bloque español al ingles, aqui se cae de inmediato.
  const debenDiferir = [
    'idioma.etiqueta', 'rareza.mythic.nombre', 'rareza.legendary.etiqueta',
    'lona.arriba', 'lona.lema', 'lona.hackeado', 'app.atrapados',
    'app.ajustaFiltros', 'app.sinFiltros', 'app.progresoAria'
  ];
  const copiadas = debenDiferir.filter((clave) => DICCIONARIOS.en[clave] === DICCIONARIOS.es[clave]);
  assert.deepEqual(copiadas, [], 'quedaron sin traducir: ' + copiadas.join(', '));
});

test('los diccionarios reales resuelven en los dos idiomas', () => {
  assert.equal(traducir(DICCIONARIOS, 'es', 'rareza.mythic.etiqueta'), 'Mítico');
  assert.equal(traducir(DICCIONARIOS, 'en', 'rareza.mythic.etiqueta'), 'Mythic');
  assert.equal(traducir(DICCIONARIOS, 'es', 'lona.lema'), 'ROMPE LAS REGLAS • CAMBIA EL JUEGO');
  assert.equal(traducir(DICCIONARIOS, 'en', 'lona.lema'), 'BREAK THE RULES • CHANGE THE GAME');
  assert.equal(traducir(DICCIONARIOS, 'en', 'lona.progreso', { pct: 42 }), 'PROGRESS 42%');
});
